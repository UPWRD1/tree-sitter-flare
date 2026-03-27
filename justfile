build:
    tree-sitter generate
    tree-sitter build

default:
    test

test: build
    tree-sitter test

testu: build
    tree-sitter test -u

testp: build
    tree-sitter parse test/corpus/ntest.flr -c

show: build
    tree-sitter highlight --query-paths ./queries/highlights.scm --paths paths.txt
show_hx:
    tree-sitter highlight --query-paths ~/.config/helix/runtime/queries/flare/highlights.scm --paths paths.txt
    
update_hx:
    if git_status; then \
        git commit -a -m "updating helix"; \
        git push; \
    fi
    
    hx --grammar fetch
    hx --grammar build
    
