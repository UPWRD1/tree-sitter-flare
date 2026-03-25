export default grammar({
  name: 'flare',

  extras: $ => [
    $.line_join,
    /\s/,
    // / \t\r/,
    $.comment,
  ],

  word: $ => $.identifier,

  supertypes: $ => [
    $.expression,
    $.pattern,
    $._type,
    $.path_or_id,
    $.macro_invoke,
  ],

  rules: {
    source_file: $ => newlineSep($.field_assignment),

    comment: _$ => /#[^\n]*/,

    macro_invoke: $ => prec(11, choice(
      $.use_macro,
      $.extern_macro,
      $.type_macro,
      $.extend_macro,
    )),

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
      $.expression,
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

    user_type: $ => prec(6, seq(
      choice($.path_or_id),
      optional(seq(
        '[',
        commaSep($._type),
        ']'
      ))
    )),

    generic_type: $ => seq(
      field('sigil', '?'),
      field('name', $.identifier)
    ),

    arrow_type: $ => prec.right(9, seq(
      field('parameter', $._type),
      '->',
      field('return', $._type)
    )),

    product_type: $ => prec(3, seq(
      '{',
      flareSep(seq(
        field("field_name", $.identifier),
        ':',
        field("field_ty", $._type)
      )),
      '}'
    )),

    sum_type: $ => prec.right(3, seq(
      '|',
      flareSep(
        seq(
          field("variant_name", $.identifier),
          field("variant_data", optional($._type))
        )
      ),
      '|'
    )),

    expression: $ => choice(
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

    line_join: _ => token(seq('\\', choice(seq(optional('\r'), '\n'), '\0'))),

    number: _ => /\d+(\.\d+)?/,

    string: _ => seq(
      '"',
      /[^"]*/,
      '"'
    ),

    boolean: _$ => choice('true', 'false'),

    identifier: _$ => new RustRegex('(?i)[a-z_][a-z0-9_]*'),

    path: $ => prec.left(11, seq(
      $.identifier,
      repeat1(seq('.', $.identifier))
    )),

    path_or_id: $ => choice($.path, $.identifier),

    let_expression: $ => seq(
      'let',
      field('pattern', $.pattern),
      '=',
      field('value', $.expression),
      'in',
      field('body', $.expression)
    ),

    if_expression: $ => prec.right(seq(
      'if',

optional('\n'),      field('condition', $.expression),
      'then',
      field('consequence', $.expression),
      'else',
      field('alternative', $.expression)
    )),

    match_expression: $ => prec.right(seq(
      'match',
      field('value', $.expression),
      optional('\n'),
      flareSep(seq(
        'as',
        field('pattern', $.pattern),
        'then',
        field('body', $.expression),
      ))
    )),

    lambda: $ => prec.right(seq(
      'fn',
      repeat1(field('parameter', $.identifier)),
      '=>',
      field('body', $.expression)
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
          field('value', $.expression)
        ),
        seq(
          ':',
          field('type', $._type),
          optional(seq(
            '=',
            field('value', $.expression)
          )),
        ),
      )
    ),

    sum_constructor: $ => prec.right(seq(
      '|',
      $.identifier,
      optional($.expression),
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

    mul_expression: $ => prec.left(8, seq($.expression, '*', $.expression)),

    div_expression: $ => prec.left(8, seq($.expression, '/', $.expression)),

    add_expression: $ => prec.left(7, seq($.expression, '+', $.expression)),

    sub_expression: $ => prec.left(7, seq($.expression, '-', $.expression)),

    cmp_expression: $ => prec.left(5, seq(
      field('left', $.expression),
      field('operator', $.comparison_operator),
      field('right', $.expression)
    )),

    comparison_operator: _$ => choice(
      '==',
      '!=',
      '<',
      '<=',
      '>',
      '>='
    ),

    call_expression: $ => prec.left(3, seq(
      field('function', $.expression),
      field('argument', $.expression)
    )),

    field_access: $ => prec.left(9, seq(
      field('object', $.expression),
      '.',
      field('field', $.identifier)
    )),

    prop_qualifier: $ => seq(
      field('lcolon', token(':')),
      field('name', $.identifier),
      field('rcolon', token(':')),
    ),

    prop_access: $ => prec.left(10, seq(
      field('callee', $.expression),
      choice('::', $.prop_qualifier),
      field('func', $.expression),
    )),

    parenthesized_expression: $ => seq(
      '(',
      $.expression,
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

function newlineSep(rule) {
  return optional(seq(
    rule,
    repeat(seq('\n', rule)),
    optional('\n')
  ));
}
