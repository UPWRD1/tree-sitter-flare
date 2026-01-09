build:
    tree-sitter build
    tree-sitter generate   

default:
    test

test: build
    tree-sitter parse test/corpus/ntest.flr

testp: build
    tree-sitter parse test/corpus/ntest.flr -c

show:
    tree-sitter highlight --query-paths ./queries/highlights.scm --paths paths.txt
show_hx:
    tree-sitter highlight --query-paths ~/.config/helix/runtime/queries/flare/highlights.scm --paths paths.txt
