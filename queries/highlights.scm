; highlights.scm - Tree-sitter syntax highlighting queries

; Keywords
[
  "as"
  "end"
  "extend"
  "extern"
  "fn"
  "match"
  "pub"
  "return"
  "then"
  "type"
  "use"
] @keyword

; Primitive types
[
  "num"
  "str"
  "bool"
  "unit"
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
  "["
  "]"
  "|"
] @punctuation.bracket

[
  ","
  ":"
] @punctuation.delimiter

; "?" @type.parameter
; Literals
(number) @constant
(string) @string
(boolean) @constant.builtin
(unit_expr) @constant.builtin

; Comments
(comment) @comment

; Lambda parameters
(lambda
  arg: (identifier) @variable.parameter)

(user_type
  (identifier) @type)

(generic_type) @type.parameter

(arrow_type) @type

(product_type
  name :(identifier) @property
  type :(_type) @type
)

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

(field_access
  field: (identifier) @property)

; Function calls
(call_expression
  func: (identifier) @function)
