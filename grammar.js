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
  property: 22,
  call: 23,
  access: 24,

  macro: 100,
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

  // conflicts: $ => [
  //   [$._expression],
  // ],

  rules: {
    source_file: $ => newlineSep($.field_assignment),

    line_join: _ => token(seq('\\', choice(seq(optional('\r'), '\n'), '\0'))),

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

    use_macro: $ => prec(PREC.macro, seq(
      'use',
      field('import', $._pattern_path_or_var),
    )),

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

    primitive_type: _ => choice(
      'num',
      'str',
      'bool',
      'unit'
    ),

    self_type: _ => 'self',

    user_type: $ => seq(
      field('name', choice($.identifier)),
      optional(seq(
        '[',
        field('generics', commaSep($._type)),
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
        field("name", $.identifier),
        ':',
        field("type", $._type)
      )),
      '}'
    )),

    sum_type: $ => prec.right(seq(
      '|',
      flareSep(
        seq(
          field("name", $.identifier),
          field("data", optional($._type))
        )
      ),
      '|'
    )),

    _expression: $ => choice(
      $.let_expression,
      $.if_expression,
      $.match_expression,
      $.lambda,
      $.prop_access,
      $.binary_expression,
      $._primary_expression,
      $.call_expression,
    ),

    _primary_expression: $ => choice(
      $.unit_expr,
      $.number,
      $.string,
      $.boolean,
      $.parenthesized_expression,
      $.fielded_constructor,
      $.sum_constructor,
      $.field_access,
      $.identifier,
    ),

    number: _ => /\d+(\.\d+)?/,

    string: _ => seq(
      '"',
      /[^"]*/,
      '"'
    ),

    unit_expr: _ => 'unit',

    boolean: _ => choice('true', 'false'),

    identifier: _ => new RustRegex('(?i)[a-z_][a-z0-9_]*'),

    path: $ => prec.left(PREC.access, seq(
      $.identifier,
      repeat1(seq('.', $.identifier))
    )),

    path_or_id: $ => choice($.identifier, $.path),

    let_expression: $ => seq(
      'let',
      field('pattern', $.pattern),
      '=',
      field('value', $._expression),
      'in',
      field('body', $._expression)
    ),

    if_expression: $ => seq(
      'if',
      field('condition', $._expression),
      'then',
      field('consequence', $._expression),
      'else',
      field('alternative', $._expression)
    ),

    match_expression: $ => seq(
      'match',
      field('value', $._expression),
      forward_sep_by(seq(
        field('pattern', $.pattern),
        'then',
        field('expr', $._expression),
      ), 'as',),
      'end'
    ),

    lambda: $ => prec.right(seq(
      'fn',
      repeat1(field('arg', $.identifier)),
      '=>',
      field('expr', $._expression)
    )),

    fielded_constructor: $ => seq(
      '{',
      flareSep(choice(
        field('macro', $.macro_invoke),
        field('assignment', $.field_assignment),
      )),
      '}'
    ),

    field_assignment: $ => seq(
      field('name', $.identifier),
      optional(
        field('arg', repeat1($.identifier)
        ),
      ),
      choice(
        seq(
          '=',
          field('expr', $._expression)
        ),
        seq(
          ':',
          field('type', $._type),
          optional(seq(
            '=',
            field('expr', $._expression)
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
      $.mul_expression,
      $.div_expression,
      $.add_expression,
      $.sub_expression,
      $.cmp_expression,
    ),

    mul_expression: $ => prec.left(PREC.mul, seq($._primary_expression, '*', $._primary_expression)),

    div_expression: $ => prec.left(PREC.mul, seq($._primary_expression, '/', $._primary_expression)),

    add_expression: $ => prec.left(PREC.add, seq($._primary_expression, '+', $._primary_expression)),

    sub_expression: $ => prec.left(PREC.add, seq($._primary_expression, '-', $._primary_expression)),

    cmp_expression: $ => prec.left(PREC.compare, seq(
      field('left', $._primary_expression),
      field('operator', $.comparison_operator),
      field('right', $._primary_expression)
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
      field('func', $._expression),
      field('expr', $._primary_expression)
    )),

    field_access: $ => prec.left(PREC.access, seq(
      field('expr', $._primary_expression),
      '.',
      choice(
        field('field', $.identifier),
        $.pattern_product
      )
    )),

    prop_qualifier: $ => seq(
      field('lcolon', token(':')),
      field('name', $.identifier),
      field('rcolon', token(':')),
    ),

    prop_access: $ => prec.left(PREC.property, seq(
      field('callee', $._primary_expression),
      choice('::', $.prop_qualifier),
      field('name', $.identifier),
    )),

    parenthesized_expression: $ => seq(
      '(',
      $._expression,
      ')'
    ),

    pattern: $ => choice(
      $.pattern_path,
      $.pattern_product,
      $.pattern_variant,
      $.pattern_variable,
      $.pattern_alias,
      $.pattern_atom
    ),

    _pattern_terminal: $ => choice(
      $.pattern_variable,
      $.pattern_product,
    ),

    _pattern_path_or_var: $ => choice(
      $.pattern_path,
      $.pattern_variable,
    ),

    pattern_path: $ => prec.left(PREC.access, seq(
      $.pattern,
      '.',
      $._pattern_terminal,
    )),

    pattern_product: $ => seq(
      '{',
      flareSep($._pattern_product_elem),
      '}'
    ),

    _pattern_product_elem: $ => seq(
      $.pattern,
    ),

    pattern_alias: $ => seq(
      $.pattern,
      '@',
      $.identifier,
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
  return repeat1(seq(separator, rule));
}

function newlineSep(rule) {
  return optional(seq(
    rule,
    repeat(seq('\n', rule)),
    optional('\n')
  ));
}
