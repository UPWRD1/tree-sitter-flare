; highlights.scm - Tree-sitter syntax highlighting queries

; Keywords
[
  "as"
  "end"
  "extend"
  "extern"
  "else"
  "fn"
  "if"
  "in"
  "let"
  "match"
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

; Comparison operators
(comparison_operator) @operator

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
  parameter: (identifier) @variable.parameter)

; Extern declarations
(extern_macro
  name: (identifier) @function)

; Types
(user_type
  (path) @type)

(user_type
  (identifier) @type)

(generic_type) @type.parameter

(arrow_type) @type

(product_type
  field_name:(identifier) @property
  field_ty :(_type) @type
)

(sum_type
  variant_name: (identifier) @type.enum.variant)

; Type definitions
(type_macro
  name: (user_type) @type )

; Pattern matching
(pattern_variant
  (identifier) @type.enum.variant)

; Field access and assignments
  
(field_assignment
  name: (identifier) @function
  arg: (identifier)+ @variable.parameter
)

; (field_assignment
  ; val_field: (identifier) @property)

(field_access
  field: (identifier) @property)

; Function calls
(call_expression
  function: (identifier) @function)

; Path components
(path
  (identifier) @namespace)
