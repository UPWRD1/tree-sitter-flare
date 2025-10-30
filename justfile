build:
    tree-sitter build
    tree-sitter generate   

default:
    test

test: build
    tree-sitter parse test/corpus/ntest.flr

testp: build
    tree-sitter parse test/corpus/ntest.flr -c
