type Difficulty = number; // how difficult it is to increase memory stability after a review. 1..10
type Stability = number; // Number of days until 90% recall probability
type Retrievability = number; // probability of recall
type IntervalDays = number; // Days until ideal next review
type DaysSinceReview = number;

export type DifficultyAndStability = { D: Difficulty; S: Stability };

export interface Card extends DifficultyAndStability {
  I: IntervalDays;
}

export enum Grade {
  AGAIN = 1,
  HARD = 2,
  GOOD = 3,
  EASY = 4,
}
export type DeckParams = {
  /** Percentage of cards that will succeed upon review.
   * Default value is 0.9.
   * Lower numbers mean fewer reviews but more more failures. */
  requestedRetentionRate: number;
  w: number[];
};

// Constants for FSRS-4.5
const DECAY = -0.5;
const FACTOR = 19 / 81;
const DEFAULT_W = [
  0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05,
  0.34, 1.26, 0.29, 2.61,
];
const DEFAULT_PARAMS = {
  requestedRetentionRate: 0.9,
  w: DEFAULT_W,
};

/** A deck creates functions that share the same configuration options,
 * such as a 'w' param and requested retention rate. */
export function createDeck(params = DEFAULT_PARAMS) {
  const w = params.w || DEFAULT_PARAMS.w;
  const requestedRetentionRate =
    params.requestedRetentionRate || DEFAULT_PARAMS.requestedRetentionRate;
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
   * @param {number} R - The requested retention rate.
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

  // // A simple Left vs. right assertion for numbers:
  // function assert(a: number, b: number, epsilon: number, message: string) {
  //   if (Math.abs(a - b) > epsilon) {
  //     console.table({
  //       a,
  //       b,
  //       diff: Math.abs(a - b),
  //       epsilon,
  //     });
  //     throw new Error(message);
  //   }
  // }

  // assert(retrievability(1, 1), 0.9, 0.0, "R must equal 0.9 when t = S");
  // assert(initialStability(Grade.AGAIN), w[0], 0.0, "AGAIN stability != w[0]");
  // assert(initialStability(Grade.EASY), w[3], 0.0, "AGAIN stability != w[3]");
  // assert(initialDifficulty(Grade.GOOD), w[4], 0.0, "GOOD difficulty != w[4]");
  // assert(nextDifficulty(10, Grade.EASY), 9.1, 0.1, "nextDifficulty failure");
  // assert(nextDifficulty(5, Grade.HARD), 5.85, 0.1, "nextDifficulty failure");
  // assert(nextInterval(0.9, 2), 2, 0.01, "Expected I(r, S) = S when R = 0.9");

  return {
    newCard(grade: Grade): Card {
      const D = initialDifficulty(grade);
      const S = initialStability(grade);
      const I = nextInterval(requestedRetentionRate, S);
      return { D, S, I };
    },
    gradeCard(
      card: DifficultyAndStability,
      daysSinceReview: number,
      grade: Grade
    ): Card {
      // Calculate current retrievability based on days since last review
      const currentRetrievability = retrievability(daysSinceReview, card.S);
      const D = nextDifficulty(card.D, grade);
      let S: number;
      if (grade === Grade.AGAIN) {
        S = nextStabilityAfterForgetting(D, card.S, currentRetrievability);
      } else {
        S = nextStabilityAfterRecall(D, card.S, currentRetrievability, grade);
      }
      var I = nextInterval(requestedRetentionRate, S);
      return { D, S, I };
    },
  };
}
