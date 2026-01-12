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

update_hx config_file="~/.config/helix/languages.toml":
    git commit -a -m "updating helix"
    git push
    COMMIT_HASH=$(git rev-parse HEAD)
    
    sed -i.bak "s/rev = \"[a-f0-9]\{40\}\"/rev = \"$COMMIT_HASH\"/" {{config_file}}
    rm {{config_file}}.bak
    
    hx --grammar fetch
    hx --grammar build
