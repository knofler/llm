//! The llm engine: a tiny character-level GPT, built by hand one stage at a time.
//!
//! HARD RULE: the operator writes everything in this crate by hand, to learn it.
//! Agents may scaffold (crates, build, CI, failing tests) but must not implement
//! engine logic. Each stage starts as a stub plus a failing test.

pub mod tokenizer;
