package tree_sitter_flare_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_flare "github.com/tree-sitter/tree-sitter-flare/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_flare.Language())
	if language == nil {
		t.Errorf("Error loading Flare grammar")
	}
}
