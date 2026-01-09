; highlights.scm - Tree-sitter syntax highlighting queries

; Keywords
[
  "package"
  "let"
  "in"
  "fn"
  "if"
  "then"
  "else"
  "match"
  "type"
  "extern"
  "use"
  "pub"
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
  "|"
  "?"
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
] @punctuation.bracket

[
  ","
  ":"
] @punctuation.delimiter

; Literals
(number) @number
(string) @string
(boolean) @constant.builtin

; Comments
(comment) @comment

; Function definitions
(let_declaration
  name: (identifier) @function)

(let_declaration
  parameter: (identifier) @parameter)

; Lambda parameters
(lambda
  parameter: (identifier) @parameter)

; Extern declarations
(extern_declaration
  name: (identifier) @function)

; Types
(user_type
  (path) @type)

(user_type
  (identifier) @type)

(generic_type) @type

(arrow_type) @type

(product_type
  field_name:(identifier) @property
  field_ty :(type) @type
  )
; Type definitions


(type_definition
  name: (user_type) @type )

; Pattern matching
(pattern_variant
  (identifier) @constructor)

(pattern_variant
  (path) @constructor)

; Constructors in expressions
(constructor
  (identifier) @constructor)

(constructor
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
(identifier) @variable

; Path components
(path
  (identifier) @namespace)
