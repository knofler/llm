// The word ladder: the single source of truth for which real term unlocks at
// which stage. scripts/guard.mjs reads this file and fails the build if a term
// shows up in any page before its stage. Plain names are used from day one.

export type Stage = {
  n: number;
  plain: string; // what adults call it until the name unlocks
  kids: string; // the kids' chapter title
  terms: string[]; // real names earned at the end of this stage
};

export const STAGES: Stage[] = [
  { n: 1, plain: "Letter-to-number book", kids: "Pip's secret number code", terms: ["tokenizer", "token", "vocabulary"] },
  { n: 2, plain: "What-comes-next tally", kids: "What comes next?", terms: ["bigram", "probability", "sampling"] },
  { n: 3, plain: "Hot-and-cold nudger", kids: "The hot-and-cold game", terms: ["loss", "gradient", "gradient descent", "backprop"] },
  { n: 4, plain: "Letter map", kids: "The letter map", terms: ["embedding", "MLP", "batch"] },
  { n: 5, plain: "Who listens to whom", kids: "Who's listening?", terms: ["attention", "head", "transformer"] },
  { n: 6, plain: "The full stack", kids: "Your talking robot", terms: ["GPT", "training", "parameters", "temperature"] },
  { n: 7, plain: "Take-home file", kids: "Take your robot home", terms: ["weights", "safetensors", "GGUF", "inference"] },
];

// Everyday words that are also terms. The guard skips them (they would flag
// ordinary English); the lessons still introduce them only at their stage.
export const COMMON_WORDS = ["head", "batch", "training", "parameters", "weights", "loss", "temperature"];

export const EXPLAIN: Record<string, string> = {
  tokenizer: "The book that turns text into numbers and back again, without losing anything.",
  token: "One numbered piece of text. In your book, one character.",
  vocabulary: "Every entry in the book: all the pieces the model knows.",
  bigram: "A pair of neighbours: one token and the token right after it. Your tally counted them.",
  probability: "How likely something is, as a share from 0 to 1. One row of the tally, turned into shares.",
  sampling: "Picking the next token by rolling a lopsided die whose sides follow those shares.",
};

export const LIVE_STAGES = [1, 2];
