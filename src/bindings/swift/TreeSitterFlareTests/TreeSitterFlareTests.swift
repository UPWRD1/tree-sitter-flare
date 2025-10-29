import XCTest
import SwiftTreeSitter
import TreeSitterFlare

final class TreeSitterFlareTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_flare())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Flare grammar")
    }
}
