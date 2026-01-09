; highlights.scm - Tree-sitter syntax highlighting queries

; Keywords
[
  "package"
  "pub"
  "type"
  "let"
  "in"
  "fn"
  "if"
  ; "impl"
  "then"
  "else"
  "match"
  "type"
  "extern"
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

; Comments
(comment) @comment

; Function definitions
(let_declaration
  name: (identifier) @function)

(let_declaration
  parameter: (identifier) @variable.parameter)

; Lambda parameters
(lambda
  parameter: (identifier) @variable.parameter)

; Extern declarations
(extern_declaration
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
  field_ty :(type) @type
  )

(sum_type
  variant_name: (identifier) @type.enum.variant)

; Type definitions
(type_definition
  name: (user_type) @type )

; Pattern matching
(pattern_variant
  (identifier) @type.enum.variant)

; Constructors in expressions
(product_constructor
  (identifier) @constructor)

(product_constructor
  (path) @constructor)

(fielded_constructor
  (identifier) @constructor)

(fielded_constructor
  (path) @constructor)

; Field access and assignments
(field_access
  field: (identifier) @property)
  

(field_assignment
  field: (identifier) @property)

; Function calls
(call_expression
  function: (identifier) @function.call)

(call_expression
  function: (path) @function.call)

; Package names
(package
  (identifier) @namespace)

; Import paths
(import_statement
  (expression) @namespace)

; Variables and identifiers (fallback)
;(identifier) @variable

; Path components
(path
  (identifier) @namespace)
