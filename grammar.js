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
    $.comment,
  ],

  reserved: {
    global: _ => [
      'as',
      'end',
      'extern',
      'fn',
      'match',
      'pub',
      'return',
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

  rules: {
    source_file: $ => newlineSep($.field_assignment),

    line_join: _ => token(seq('\\', choice(seq(optional('\r'), '\n'), '\0'))),

    comment: _ => /#[^\n]*/,

    macro_invoke: $ => choice(
      $.use_macro,
      $.extend_macro,
      $.return_macro,
    ),

    use_macro: $ => prec(PREC.macro, seq(
      'use',
      field('import', $._pattern_path_or_var),
    )),

    extend_macro: $ => seq(
      'extend',
      field('left', $._type),
      optional(
        seq(
          '::',
          field('right', $.user_type),
        )
      ),
      '=',
      '{',
      flareSep($.field_assignment),
      '}',
    ),

    return_macro: $ => seq(
      'return',
      $._mod_expr,
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
      field('name', $.identifier),
      optional($.generic_brackets),
    ),

    generic_brackets: $ => seq(
      '[',
      field('generics', commaSep($._type)),
      ']'
    ),

    generic_type: $ => seq(
      field('sigil', '?'),
      field('name', $.identifier)
    ),

    arrow_type: $ => prec.right(PREC.type_arrow, seq(
      field('left', $._type),
      '->',
      field('right', $._type)
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
          field("type", optional($._type))
        )
      ),
      '|'
    )),

    _mod_expr: $ => choice(
      $.type_expression,
      $.extern_expression,
      $._expression,
    ),

    _expression: $ => choice(
      $.match_expression,
      $.lambda,
      $.prop_access,
      $.binary_expression,
      $._atom,
      $.call_expression,
    ),

    _atom: $ => choice(
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

    type_expression: $ => seq(
      'type',
      $._type
    ),

    pub_expression: $ => seq(
      'pub',
      $._mod_expr,
    ),

    extern_expression: $ => seq(
      'extern',
      $._mod_expr,
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
      field('is_pub', optional('pub')),
      field('name', $.identifier),
      optional(field('generics', $.generic_brackets)),
      optional(
        field('arg', repeat1($.identifier)),
      ),
      optional(seq(
        ':',
        field('type', $._type),
      )),
      '=',
      field('expr', $._mod_expr)
    ),

    sum_constructor: $ => prec.right(seq(
      '|',
      field('name', $.identifier),
      field('expr', optional($._expression)),
      '|'
    )),

    binary_expression: $ => choice(
      ...[
        ['*', PREC.mul],
        ['/', PREC.mul],
        ['+', PREC.add],
        ['-', PREC.add],
        ['==', PREC.compare],
        ['!=', PREC.compare],
        ['<', PREC.compare],
        ['<=', PREC.compare],
        ['>', PREC.compare],
        ['>=', PREC.compare],
      ].map(([op, the_prec]) =>
        prec.left(the_prec, seq(
          field('left', $._expression),
          field('op', op),
          field('right', $._expression)
        ))
      )
    ),

    call_expression: $ => prec.left(PREC.call, seq(
      field('func', $._expression),
      field('expr', $._atom)
    )),

    field_access: $ => prec.left(PREC.access, seq(
      field('expr', $._atom),
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
      field('expr', $._atom),
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
      field('name', $.identifier),
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
