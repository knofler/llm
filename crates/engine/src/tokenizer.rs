//! Stage 1: the letter-to-number book.
//!
//! Every character in a piece of text gets its own number; text goes in as
//! letters and comes out as numbers, and back again without losing anything.
//!
//! Left for the operator to write by hand. Change the shape freely: these
//! signatures exist only so the round-trip test has something to call.

/// The letter-to-number book for one piece of text.
pub struct Tokenizer {}

impl Tokenizer {
    /// Build the book from every character that appears in `text`.
    pub fn new(text: &str) -> Self {
        let _ = text;
        todo!("Stage 1: build the letter-to-number book")
    }

    /// Letters → numbers.
    pub fn encode(&self, text: &str) -> Vec<u32> {
        let _ = text;
        todo!("Stage 1: turn letters into numbers")
    }

    /// Numbers → letters.
    pub fn decode(&self, ids: &[u32]) -> String {
        let _ = ids;
        todo!("Stage 1: turn numbers back into letters")
    }
}
