module.exports = grammar({
  name: 'flare',

  extras: $ => [
    /\s/,
    $.comment,
  ],

  word: $ => $.identifier,
  
  supertypes: $ => [
    $.expression,
    $.pattern,
    $.type,
    $.definition,
  ],

  // word: $ => $.identifier,

  conflicts: $ => [
    // [$.expression, $.product_constructor, $.fielded_constructor],
    [$.product_constructor, $.fielded_constructor],
    // [$.let_declaration, $.let_expression],
    // [$.tuple_type, $.pattern_tuple],
  ],
  rules: {
    source_file: $ => $.package,

    comment: $ => /#[^\n]*/,

    package: $ => seq(
      'package',
      field('package_name', $.identifier),
      '=',
      repeat(
        seq(
          field('pub', optional('pub')),
           $.definition,
        )  
      )
    ),

    definition: $ => choice(
      $.let_declaration,
      $.type_definition,
      $.extern_declaration,
      $.import_statement
    ),

    let_declaration: $ => prec(10, seq(
      'let',
      field('name', $.identifier),
      repeat(field('parameter', $.identifier)),
      optional(seq(':', field('type', $.type))),
      '=',
      field('body', $.expression)
    )),

    type_definition: $ => prec(10, seq(
      'type',
      field('name', $.user_type),
      '=',
      field('type', $.type)  
    )),
       
    extern_declaration: $ => seq(
      'extern',
      field('name', $.identifier),
      ':',
      field('type', $.type)
    ),

    import_statement: $ => seq(
      'use',
      $.expression),

    type: $ => choice(
      $.primitive_type,
      $.user_type,
      $.generic_type,
      $.tuple_type,
      $.arrow_type,
      $.product_type,
      $.sum_type,
    ),

    primitive_type: $ => choice(
      'num',
      'str',
      'bool',
      'unit'
    ),

    user_type: $ => prec(6, seq(
      choice($.path, $.identifier),
      optional(seq(
        '[',
        commaSep($.type),
        ']'
      ))
    )),

    generic_type: $ => seq(
      field('sigil', '?'),
      //'?',
      field('name', $.identifier)
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

    product_type: $ => prec(2, seq(
      '{',
      commaSep(seq(
        field("field_name", $.identifier),
        ':',
        field("field_ty", $.type)
      )),
      '}'
    )),
  
    sum_type: $ => prec.left(seq(
      '|',
      commaSep(
        seq(
          field("variant_name", $.identifier),
          field("variant_data", optional($.type))
        )
      ),
      '|'
    )),

    expression: $ => choice(
      $.let_expression,
      $.number,
      $.string,
      $.boolean,
      $.tuple,
      $.if_expression,
      $.match_expression,
      $.lambda,
      // $.let_expression,
      $.parenthesized_expression,
      $.product_constructor,
      $.fielded_constructor,
      $.binary_expression,
      $.call_expression,
      $.field_access,
      $.path,
      $.identifier,
      // $.let_expression,
    ),

    number: $ => /\d+(\.\d+)?/,

    string: $ => seq(
      '"',
      /[^"]*/,
      '"'
    ),

    boolean: $ => choice('true', 'false'),

    identifier: $ => new RustRegex('(?i)[a-z_][a-z0-9_]*'),
    
    path: $ => prec.left(10, seq(
      $.identifier,
      repeat1(seq('.', $.identifier))
    )),

    tuple: $ => prec(1, seq(
      '{',
      commaSep($.expression),
      '}'
    )),

    let_expression: $ => prec(1, seq(
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
      'in',
      commaSep(
        field('pattern', $.pattern),
        'then',
        field('body', $.expression),
        
      )
    )),

    lambda: $ => prec.right(seq(
      'fn',
      repeat1(field('parameter', $.identifier)),
      '=>',
      field('body', $.expression)
    )),

    product_constructor: $ => prec(2, seq(
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

    sum_constructor: $ => seq(
      '|',
      choice(
        seq(
          $.identifier,
          $.expression
        ),
        $.identifier,
      ),
      '|'
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
      $.pattern_variable,
      $.pattern_atom
    ),

    pattern_tuple: $ => seq(
      '{',
      commaSep($.pattern),
      '}'
    ),

    pattern_variant: $ => prec.left(1, seq(
      '|',
      field('variant_name', $.identifier),
      optional($.pattern),
      '|'
    )),

    pattern_variable: $ => $.identifier,

    pattern_atom: $ => choice(
      $.number,
      $.string,
      // $.type
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
