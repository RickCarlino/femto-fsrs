type Difficulty = number;
type Stability = number;
type Retrievability = number;
type IntervalDays = number;

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

export interface DeckParams {
  requestedRetentionRate: number;
  w: number[];
  maxStability?: number;
}

const DECAY = -0.5;
const FACTOR = 19 / 81;

const DEFAULT_W = [
  0.40255,  // Initial interval/stability for AGAIN
  1.18385,  // Initial interval/stability for HARD
  3.173,    // Initial interval/stability for GOOD
  15.69105, // Initial interval/stability for EASY
  7.1949,
  0.5345,
  1.4604,
  0.0046,
  1.54575,
  0.1192,
  1.01925,
  1.9395,
  0.11,
  0.29605,
  2.2698,
  0.2315,
  2.9898,
  0.51655,
  0.6621,
] as const;

const DEFAULT_PARAMS: DeckParams = {
  requestedRetentionRate: 0.9,
  w: [...DEFAULT_W],
  maxStability: 36500,
};

const clamp = (v: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, v));

export function createDeck(params: Partial<DeckParams> = {}) {
  const w = params.w ?? DEFAULT_PARAMS.w;
  if (w.length !== 19)
    throw new Error("FSRS-5 expects a w-array of length 19.");

 
  const requestedRetentionRate =
    params.requestedRetentionRate ?? DEFAULT_PARAMS.requestedRetentionRate;
  if (requestedRetentionRate <= 0 || requestedRetentionRate > 1)
    throw new Error("requestedRetentionRate must lie in (0, 1].");

  if (w[7] < 0 || w[7] > 1)
    throw new Error("w[7] must lie in the range 0 ... 1 for mean-reversion.");

  const MAX_S = params.maxStability ?? DEFAULT_PARAMS.maxStability!;

 
  const retrievability = (t: number, S: Stability): Retrievability =>
    Math.pow(1 + FACTOR * (t / S), DECAY);

  const nextInterval = (R: Retrievability, S: Stability): IntervalDays => {
    const raw = (S / FACTOR) * (Math.pow(R, 1 / DECAY) - 1);
   
    return Math.max(1, raw);
  };

 

  const initialStability = (G: Grade): Stability => w[G - 1];

  const initialDifficulty = (G: Grade): Difficulty => {
    const d0 = w[4] - Math.exp(w[5] * (G - 1)) + 1;
    return clamp(d0, 1, 10);
  };

 

  const nextDifficulty = (D: Difficulty, G: Grade): Difficulty => {
    const delta = -w[6] * (G - 3);
    const Dprime = D + delta * ((10 - D) / 9);
    const target = initialDifficulty(Grade.EASY);
    const Dnext = w[7] * target + (1 - w[7]) * Dprime;
    return clamp(Dnext, 1, 10);
  };

  /* ------------------------- Stability updates ----------------------- */
  const nextStabilityAfterRecall = (
    d: Difficulty,
    s: Stability,
    r: Retrievability,
    g: Grade
  ): Stability => {
    const hardPenalty = g === Grade.HARD ? w[15] : 1;
    const easyBoost = g === Grade.EASY ? w[16] : 1;

    const multiplier =
      Math.exp(w[8]) *
      (11 - d) *
      Math.pow(s, -w[9]) *
      (Math.exp((1 - r) * w[10]) - 1) *
      hardPenalty *
      easyBoost;

    return clamp(s * (1 + multiplier), 0, MAX_S);
  };

  const nextStabilityAfterForgetting = (
    d: Difficulty,
    s: Stability,
    r: Retrievability
  ): Stability => {
    const post =
      w[11] *
      Math.pow(d, -w[12]) *
      (Math.pow(s + 1, w[13]) - 1) *
      Math.exp((1 - r) * w[14]);

    return clamp(post, 0, MAX_S);
  };

  return {
    newCard(firstGrade: Grade): Card {
      const D = initialDifficulty(firstGrade);
      const S = clamp(initialStability(firstGrade), 0, MAX_S);
      const I = nextInterval(requestedRetentionRate, S);
      return { D, S, I };
    },

    /** Apply a review result to an existing card. */
    gradeCard(
      card: DifficultyAndStability,
      daysSinceReview: number,
      grade: Grade
    ): Card {
      const D = nextDifficulty(card.D, grade);
      let S: Stability;

      if (daysSinceReview < 1) {
        S = card.S * Math.exp(w[17] * (grade - 3 + w[18]));
      } else {
        const R = retrievability(daysSinceReview, card.S);
        S =
          grade === Grade.AGAIN
            ? nextStabilityAfterForgetting(D, card.S, R)
            : nextStabilityAfterRecall(D, card.S, R, grade);
      }

      const I = nextInterval(requestedRetentionRate, clamp(S, 0, MAX_S));
      return { D, S, I };
    },
  } as const;
}
