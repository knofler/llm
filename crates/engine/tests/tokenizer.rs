//! Stage 1 target: text → numbers → the same text.
//!
//! This test FAILS until the operator writes the tokenizer by hand. It is
//! `#[ignore]`d so CI stays green meanwhile; run it with:
//!   docker compose run --rm rust cargo test -- --ignored
//! When it passes, delete the `#[ignore]` line.

use engine::tokenizer::Tokenizer;

#[test]
#[ignore = "Stage 1: the operator writes the tokenizer by hand"]
fn round_trip() {
    let text = "hello world";
    let book = Tokenizer::new(text);
    let ids = book.encode(text);
    assert_eq!(ids.len(), text.chars().count());
    assert_eq!(book.decode(&ids), text);
}
