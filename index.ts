enum Grade {
  AGAIN = 1,
  HARD = 2,
  GOOD = 3,
  EASY = 4,
}
type Difficulty = number; // how difficult it is to increase memory stability after a review. 1..10
type Stability = number; // Number of days until 90% recall probability
type Retrievability = number; // probability of recall
type IntervalDays = number; // Days until ideal next review
type DaysSinceReview = number;

// Constants for FSRS-4.5
const DECAY = -0.5;
const FACTOR = 19 / 81;
let w = [
  0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05,
  0.34, 1.26, 0.29, 2.61,
];

/**
 * Calculates the retrievability after t days since the last review.
 * @param {number} t - The number of days since the last review.
 * @param {number} S - Stability (interval when R=90%).
 * @returns {number} - Retrievability (probability of recall).
 */
function retrievability(t: DaysSinceReview, S: Stability): Retrievability {
  // Should return 0.9 when t = S
  return Math.pow(1 + FACTOR * (t / S), DECAY);
}

/**
 * Calculates the next interval based on requested retention.
 * @param {number} r - The requested retention rate.
 * @param {number} S - Current stability.
 * @returns {number} - The next interval in days.
 */
function nextInterval(R: Retrievability, S: Stability): IntervalDays {
  // I(r, S) = S when R = 0.9
  return (S / FACTOR) * (Math.pow(R, 1 / DECAY) - 1);
}

/**
 * Calculates initial stability after the first rating.
 * @param {number} G - Grade (1: again, 2: hard, 3: good, 4: easy).
 * @returns {number} - Initial stability.
 */
function initialStability(G: Grade): Stability {
  return w[G - 1];
}

/**
 * Calculates initial difficulty after the first rating.
 * @param {number} G - Grade (1: again, 2: hard, 3: good, 4: easy).
 * @returns {number} - Initial difficulty.
 */
function initialDifficulty(G: Grade): Difficulty {
  const val = w[4] + (G - 3) * w[5];
  return Math.max(1, Math.min(10, val));
}

/**
 * Calculates new difficulty after review.
 * @param {number} D - Current difficulty.
 * @param {number} G - Grade (1: again, 2: hard, 3: good, 4: easy).
 * @returns {number} - New difficulty.
 */
function nextDifficulty(D: Difficulty, G: Grade): Difficulty {
  const val = w[7] * initialDifficulty(3) + (1 - w[7]) * (D - w[6] * (G - 3));
  return Math.max(1, Math.min(10, val));
}

/**
 * The stability after recall. Thanks, ts-fsrs.
 * @param {number} d - Difficulty.
 * @param {number} s - Current stability.
 * @param {number} r - Retrievability.
 * @param {number} g - Grade (1: again, 2: hard, 3: good, 4: easy).
 * @returns {number} - New stability after recall.
 */
function nextStabilityAfterRecall(
  d: Difficulty,
  s: Stability,
  r: Retrievability,
  g: Grade
): Stability {
  const hard_penalty = Grade.HARD === g ? w[15] : 1;
  const easy_bound = Grade.EASY === g ? w[16] : 1;
  return (
    s *
    (1 +
      Math.exp(w[8]) *
        (11 - d) *
        Math.pow(s, -w[9]) *
        (Math.exp((1 - r) * w[10]) - 1) *
        hard_penalty *
        easy_bound)
  );
}
/**
 * Calculates stability after forgetting.
 * @param {number} d - Difficulty.
 * @param {number} s - Current stability.
 * @param {number} r - Retrievability.
 * @returns {number} - New stability after forgetting.
 */
function nextStabilityAfterForgetting(
  d: Difficulty,
  s: Stability,
  r: Retrievability
): Stability {
  return (
    w[11] *
    Math.pow(d, -w[12]) *
    (Math.pow(s + 1, w[13]) - 1) *
    Math.exp((1 - r) * w[14])
  );
}

// ======= TESTING =======
// A simple Left vs. right assertion for numbers:
function compare(a: number, b: number, epsilon: number, message: string) {
  if (Math.abs(a - b) > epsilon) {
    console.table({
      a,
      b,
      diff: Math.abs(a - b),
      epsilon,
    });
    throw new Error(message);
  }
}

compare(retrievability(1, 1), 0.9, 0.0, "R must equal 0.9 when t = S");
compare(nextInterval(0.9, 2), 2, 0.01, "Expected I(r, S) = S when R = 0.9");
compare(
  initialStability(Grade.AGAIN),
  w[0],
  0.0,
  "AGAIN should have stability of w[0]"
);
compare(
  initialStability(Grade.EASY),
  w[3],
  0.0,
  "AGAIN should have stability of w[3]"
);
compare(
  initialDifficulty(Grade.GOOD),
  w[4],
  0.0,
  "GOOD should have initial difficulty of w[4]"
);

// Truth table for nextDifficulty (NOT REVIEWED):
//       |1,    2,    3,    4,    5,    6,    7,    8,    9,     10
// ------+------------------------------------------------------------
// AGAIN |2.74, 3.73, 4.72, 5.71, 6.70, 7.69, 8.68, 9.67, 10.00, 10.00
// HARD  |1.89, 2.88, 3.87, 4.86, 5.85, 6.84, 7.83, 8.82,  9.81, 10.00
// GOOD  |1.04, 2.03, 3.02, 4.01, 5.00, 5.99, 6.98, 7.97,  8.96,  9.95
// EASY  |1.00, 1.18, 2.17, 3.16, 4.15, 5.14, 6.13, 7.12,  8.11,  9.10

compare(
  nextDifficulty(10, Grade.EASY),
  9.1,
  0.1,
  "Not certain this is correct..."
);

compare(
  nextDifficulty(5, Grade.HARD),
  5.85,
  0.1,
  "Not certain this is correct..."
);

// SEE:
//   https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm
//   https://huggingface.co/spaces/open-spaced-repetition/fsrs4anki_previewer
//   https://github.com/open-spaced-repetition/py-fsrs/blob/main/src/fsrs/fsrs.py
//   https://github.com/orgs/open-spaced-repetition/discussions/12

// ======= EXAMPLE USAGE (I think?) =======

type Card = { D: Difficulty; S: Stability; I: IntervalDays };

/** For simplicity, a deck will have the same requested retention rate. */
export function createDeck(requestedRetentionRate: number) {
  return {
    newCard(grade: Grade): Card {
      const D = initialDifficulty(grade);
      const S = initialStability(grade);
      const I = nextInterval(requestedRetentionRate, S);
      return { D, S, I };
    },
    gradeCard(grade: Grade, card: Card): Card {
      const fn =
        grade === Grade.AGAIN
          ? nextStabilityAfterForgetting
          : nextStabilityAfterRecall;
      const D = nextDifficulty(card.D, grade);
      const S = fn(D, card.S, requestedRetentionRate, grade);
      const I = nextInterval(requestedRetentionRate, S);
      return { D, S, I };
    },
  };
}

const { newCard, gradeCard } = createDeck(0.9);
const ratings = [
  Grade.GOOD,
  Grade.GOOD,
  Grade.GOOD,
  Grade.GOOD,
  Grade.AGAIN,
  Grade.GOOD,
  Grade.GOOD,
];
let card: Card = newCard(ratings[0]);
for (let i = 0; i < ratings.length; i++) {
  if (card) {
    card = gradeCard(ratings[i], card);
  } else {
    card = newCard(ratings[i]);
  }
  console.table({
    rating: ratings[i],
    step: i,
    ...card,
  });
}
