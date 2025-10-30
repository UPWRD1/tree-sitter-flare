module.exports = grammar({
  name: 'your_language',

  extras: $ => [
    /\s/,
    $.comment,
  ],

  conflicts: $ => [
    // [$.expression, $.constructor, $.fielded_constructor],
    [$.constructor, $.fielded_constructor],
    // [$.user_type, $.pattern_variant],
    [$.pattern_variant, $.pattern_atom],
    // [$.tuple_type, $.pattern_tuple],
    // [$.tuple_type, $.pattern_atom],
  ],

  rules: {
    source_file: $ => $.package,

    comment: $ => /#[^\n]*/,

    package: $ => seq(
      'package',
      $.identifier,
      '=',
      choice(
        seq('pub', repeat1($.definition)),
        repeat1($.definition)
      )
    ),

    definition: $ => choice(
      $.let_declaration,
      $.struct_definition,
      $.enum_definition,
      $.extern_declaration,
      $.import_statement
    ),

    let_declaration: $ => prec(1, seq(
      'let',
      field('name', $.identifier),
      repeat(field('parameter', $.identifier)),
      optional(seq(':', field('type', $.type))),
      '=',
      field('body', $.expression)
    )),

    struct_definition: $ => seq(
      'struct',
      field('name', $.type),
      '=',
      commaSep($.struct_field)
    ),

    struct_field: $ => seq(
      field('name', $.identifier),
      ':',
      field('type', $.type)
    ),

    enum_definition: $ => seq(
      'enum',
      field('name', $.type),
      '=',
      commaSep($.enum_variant)
    ),

    enum_variant: $ => seq(
      field('name', $.identifier),
      optional(seq(
        '{',
        commaSep($.type),
        '}'
      ))
    ),

    extern_declaration: $ => seq(
      'extern',
      field('name', $.identifier),
      ':',
      field('type', $.type)
    ),

    import_statement: $ => seq(
      'use',
      $.expression
    ),

    type: $ => choice(
      $.primitive_type,
      $.user_type,
      $.generic_type,
      $.tuple_type,
      $.arrow_type
    ),

    primitive_type: $ => choice(
      'num',
      'str',
      'bool',
      'unit'
    ),

    user_type: $ => prec(1, seq(
      $.path,
      optional(seq(
        '[',
        commaSep($.type),
        ']'
      ))
    )),

    generic_type: $ => seq(
      '?',
      $.identifier
    ),

    tuple_type: $ => prec(1, seq(
      '{',
      commaSep($.type),
      '}'
    )),

    arrow_type: $ => prec.right(9, seq(
      field('parameter', $.type),
      '->',
      field('return', $.type)
    )),

    expression: $ => choice(
      $.number,
      $.string,
      $.boolean,
      $.tuple,
      $.if_expression,
      $.match_expression,
      $.lambda,
      $.parenthesized_expression,
      // $.let_expression,
      $.constructor,
      $.fielded_constructor,
      $.binary_expression,
      $.call_expression,
      $.field_access,
      $.path,
      $.identifier,
      $.let_expression,
    ),

    number: $ => /\d+(\.\d+)?/,

    string: $ => seq(
      '"',
      /[^"]*/,
      '"'
    ),

    boolean: $ => choice('true', 'false'),

    identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,

    path: $ => prec.left(10, seq(
      $.identifier,
      repeat1(seq('.', $.identifier))
    )),

    tuple: $ => prec(1, seq(
      '{',
      commaSep($.expression),
      '}'
    )),

    let_expression: $ => prec.right(seq(
      'let',
      field('pattern', $.pattern),
      '=',
      field('value', $.expression),
      'in',
      field('body', $.expression)
    )),

    if_expression: $ => prec.right(seq(
      'if',
      field('condition', $.expression),
      'then',
      field('consequence', $.expression),
      'else',
      field('alternative', $.expression)
    )),

    match_expression: $ => prec.right(seq(
      'match',
      field('value', $.expression),
      repeat(seq(
        '|',
        field('pattern', $.pattern),
        'then',
        field('body', $.expression),
        optional(',')
      ))
    )),

    lambda: $ => prec.right(seq(
      'fn',
      repeat1(field('parameter', $.identifier)),
      '=>',
      field('body', $.expression)
    )),

    constructor: $ => prec(2, seq(
      choice($.identifier, $.path),
      '{',
      commaSep($.expression),
      '}'
    )),

    fielded_constructor: $ => prec(2, seq(
      choice($.identifier, $.path),
      '{',
      commaSep($.field_assignment),
      '}'
    )),

    field_assignment: $ => seq(
      field('field', $.identifier),
      '=',
      field('value', $.expression)
    ),

    binary_expression: $ => choice(
      prec.left(8, seq($.expression, '*', $.expression)),
      prec.left(8, seq($.expression, '/', $.expression)),
      prec.left(7, seq($.expression, '+', $.expression)),
      prec.left(7, seq($.expression, '-', $.expression)),
      prec.left(5, seq(
        field('left', $.expression),
        field('operator', $.comparison_operator),
        field('right', $.expression)
      ))
    ),

    comparison_operator: $ => choice(
      '==',
      '!=',
      '<',
      '<=',
      '>',
      '>='
    ),

    call_expression: $ => prec.left(9, seq(
      field('function', $.expression),
      field('argument', $.expression)
    )),

    field_access: $ => prec.left(10, seq(
      field('object', $.expression),
      '.',
      field('field', $.identifier)
    )),

    parenthesized_expression: $ => seq(
      '(',
      $.expression,
      ')'
    ),

    pattern: $ => choice(
      $.pattern_tuple,
      $.pattern_variant,
      $.pattern_atom
    ),

    pattern_tuple: $ => seq(
      '{',
      commaSep($.pattern),
      '}'
    ),

    pattern_variant: $ => seq(
      choice($.identifier, $.path),
      optional(seq(
        '{',
        commaSep($.pattern),
        '}'
      ))
    ),

    pattern_atom: $ => choice(
      $.identifier,
      $.number,
      $.string,
      $.type
    ),
  }
});

function commaSep(rule) {
  return optional(seq(
    rule,
    repeat(seq(',', rule)),
    optional(',')
  ));
}
