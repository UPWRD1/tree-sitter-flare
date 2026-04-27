; highlights.scm - Tree-sitter syntax highlighting queries

; Keywords
[
  "as"
  "all"
  "end"
  "extend"
  "extern"
  "fn"
  "match"
  "or"
  "pub"
  "return"
  "then"
  "type"
  "use"
  "via"
] @keyword

; Primitive types
[
  "num"
  "str"
  "bool"
] @type.builtin

; Operators
[
  "="
  "=>"
  "->"
  "+"
  "-"
  "*"
  "/"
  "."

] @operator

; Delimiters
[
  "("
  ")"
  "{"
  "}"
  "|"
] @punctuation.bracket

[
  ","
  ":"
] @punctuation.delimiter

; Literals
(number) @constant
(string) @string
(boolean) @constant.builtin
(unit_expr) @type.builtin

; Comments
(comment) @comment

; Lambda parameters
(lambda
  arg: (identifier) @variable.parameter)

(arrow_type) @type

(product_type
  name:(identifier) @property
  type:(_type) @type
)

(primitive_type) @type.builtin

(sum_type
  name: (identifier) @type.enum.variant)

; Pattern matching
(pattern_variant
  (identifier) @type.enum.variant)

; Field access and assignments

(field_assignment
  name: (identifier) @function
  arg: (identifier)+ @variable.parameter
)

(field_assignment
  name: (identifier) @type
  expr: (type_expression)
)

(field_assignment
  name: (identifier) @property)

(field_access
  field: (identifier) @property)

; Function calls
(call_expression
  func: (identifier) @function)
