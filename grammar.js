const PREC = {
  // this resolves a conflict between the usage of ':' in a lambda vs in a
  // typed parameter. In the case of a lambda, we don't allow typed parameters.
  lambda: -2,
  // typed_parameter: -1,
  // conditional: -1,

  parenthesized_expression: 1,

  type_arrow: 9,

  compare: 13,
  add: 18,
  mul: 19,
  // unary: 20,
  // power: 21,
  property: 22,
  call: 23,
  access: 24,
};

export default grammar({
  name: 'flare',

  extras: $ => [
    $.line_join,
    /\s/,
    // / \t\r/,
    $.comment,
  ],

  reserved: {
    global: _ => [
      'as',
      'end',
      'extern',
      'in',
      'else',
      'fn',
      'if',
      'in',
      'let',
      'match',
      'then',
      'type',
      'use',
    ],
  },
  word: $ => $.identifier,

  supertypes: $ => [
    $.pattern,
    $._type,
    $.path_or_id,
    $.macro_invoke,
  ],

  conflicts: $ => [
    [$._expression],
  ],

  rules: {
    source_file: $ => newlineSep($.field_assignment),

    comment: _ => /#[^\n]*/,

    macro_invoke: $ => choice(
      $.use_macro,
      $.extern_macro,
      $.type_macro,
      $.extend_macro,
    ),

    type_macro: $ => seq(
      'type',
      field('name', $.user_type),
      '=',
      field('the_type', $._type)
    ),

    extern_macro: $ => seq(
      'extern',
      field('name', $.identifier),
      ':',
      field('the_type', $._type)
    ),

    use_macro: $ => seq(
      'use',
      $._expression,
    ),

    extend_macro: $ => seq(
      'extend',
      field('implementor', $._type),
      optional(
        seq(
          '::',
          field('spec', $.user_type),
        )
      ),
      '=',
      '{',
      flareSep($.field_assignment),
      '}',
    ),

    _type: $ => choice(
      $.primitive_type,
      $.self_type,
      $.user_type,
      $.generic_type,
      $.arrow_type,
      $.product_type,
      $.sum_type,
      $.grouped_type,
    ),

    grouped_type: $ => seq('(', $._type, ')'),

    primitive_type: _$ => choice(
      'num',
      'str',
      'bool',
      'unit'
    ),

    self_type: _ => 'self',

    user_type: $ => seq(
      choice($.path_or_id),
      optional(seq(
        '[',
        commaSep($._type),
        ']'
      ))
    ),

    generic_type: $ => seq(
      field('sigil', '?'),
      field('name', $.identifier)
    ),

    arrow_type: $ => prec.right(PREC.type_arrow, seq(
      field('parameter', $._type),
      '->',
      field('return', $._type)
    )),

    product_type: $ => prec.right(seq(
      '{',
      flareSep(seq(
        field("field_name", $.identifier),
        ':',
        field("field_ty", $._type)
      )),
      '}'
    )),

    sum_type: $ => prec.right(seq(
      '|',
      flareSep(
        seq(
          field("variant_name", $.identifier),
          field("variant_data", optional($._type))
        )
      ),
      '|'
    )),

    _expression: $ => seq(
      choice(
        $.let_expression,
        $.number,
        $.string,
        $.boolean,
        $.if_expression,
        $.match_expression,
        $.lambda,
        $.parenthesized_expression,
        $.fielded_constructor,
        $.sum_constructor,
        $.prop_access,
        $.binary_expression,
        $.call_expression,
        $.identifier,
      ),
      optional('\n'),
    ),

    line_join: _ => token(seq('\\', choice(seq(optional('\r'), '\n'), '\0'))),

    number: _ => /\d+(\.\d+)?/,

    string: _ => seq(
      '"',
      /[^"]*/,
      '"'
    ),

    boolean: _$ => choice('true', 'false'),

    identifier: _$ => new RustRegex('(?i)[a-z_][a-z0-9_]*'),

    path: $ => prec.left(PREC.access, seq(
      $.identifier,
      repeat1(seq('.', $.identifier))
    )),

    path_or_id: $ => choice($.path, $.identifier),

    let_expression: $ => prec.left(seq(
      'let',
      field('pattern', $.pattern),
      '=',
      field('value', $._expression),
      'in',
      field('body', $._expression)
    )),

    if_expression: $ => prec.right(seq(
      'if',
      field('condition', $._expression),
      'then',
      field('consequence', $._expression),
      'else',
      field('alternative', $._expression)
    )),

    match_expression: $ => prec.left(seq(
      'match',
      field('value', $._expression),
      forward_sep_by(seq(
        field('pattern', $.pattern),
        'then',
        field('body', $._expression),
      ), 'as',),
      'end'
    )),

    lambda: $ => prec.right(seq(
      'fn',
      repeat1(field('parameter', $.identifier)),
      '=>',
      field('body', $._expression)
    )),

    fielded_constructor: $ => seq(
      '{',
      flareSep(choice(
        $.macro_invoke,
        $.field_assignment,
      )),
      '}'
    ),

    field_assignment: $ => seq(
      field('name', $.identifier),
      field('args', repeat($.identifier)),
      choice(
        seq(
          '=',
          field('value', $._expression)
        ),
        seq(
          ':',
          field('type', $._type),
          optional(seq(
            '=',
            field('value', $._expression)
          )),
        ),
      )
    ),

    sum_constructor: $ => prec.right(seq(
      '|',
      $.identifier,
      optional($._expression),
      '|'
    )),

    binary_expression: $ => choice(
      $.field_access,
      $.mul_expression,
      $.div_expression,
      $.add_expression,
      $.sub_expression,
      $.cmp_expression,
    ),

    mul_expression: $ => prec.left(PREC.mul, seq($._expression, '*', $._expression)),

    div_expression: $ => prec.left(PREC.mul, seq($._expression, '/', $._expression)),

    add_expression: $ => prec.left(PREC.add, seq($._expression, '+', $._expression)),

    sub_expression: $ => prec.left(PREC.add, seq($._expression, '-', $._expression)),

    cmp_expression: $ => prec.left(PREC.compare, seq(
      field('left', $._expression),
      field('operator', $.comparison_operator),
      field('right', $._expression)
    )),

    comparison_operator: _$ => choice(
      '==',
      '!=',
      '<',
      '<=',
      '>',
      '>='
    ),

    call_expression: $ => prec.left(PREC.call, seq(
      field('function', $._expression),
      field('argument', $._expression)
    )),

    field_access: $ => prec.left(PREC.access, seq(
      field('object', $._expression),
      '.',
      field('field', $.identifier)
    )),

    prop_qualifier: $ => seq(
      field('lcolon', token(':')),
      field('name', $.identifier),
      field('rcolon', token(':')),
    ),

    prop_access: $ => prec.left(PREC.property, seq(
      field('callee', $._expression),
      choice('::', $.prop_qualifier),
      field('func', $._expression),
    )),

    parenthesized_expression: $ => seq(
      '(',
      $._expression,
      ')'
    ),

    pattern: $ => choice(
      $.pattern_tuple,
      $.pattern_variant,
      $.pattern_variable,
      $.pattern_atom
    ),

    pattern_tuple: $ => seq(
      '{',
      commaSep($.pattern),
      '}'
    ),

    pattern_variant: $ => prec.right(seq(
      '|',
      field('variant_name', $.identifier),
      optional($.pattern),
      '|'
    )),

    pattern_variable: $ => $.identifier,

    pattern_atom: $ => choice(
      $.number,
      $.string,
    ),
  }
});

function flareSep(rule) {
  return choice(
    commaSep(rule),
    newlineSep(rule),
  );
}

function commaSep(rule) {
  return optional(seq(
    rule,
    repeat(seq(',', rule)),
    optional(',')
  ));
}

function sep_by(rule, separator) {
  return optional(seq(
    rule,
    repeat(seq(separator, rule)),
    optional(separator)
  ));
}


function forward_sep_by(rule, separator) {
  return repeat(seq(separator, rule));
}

function newlineSep(rule) {
  return optional(seq(
    rule,
    repeat(seq('\n', rule)),
    optional('\n')
  ));
}
