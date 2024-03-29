"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDeck = exports.Grade = void 0;
var Grade;
(function (Grade) {
    Grade[Grade["AGAIN"] = 1] = "AGAIN";
    Grade[Grade["HARD"] = 2] = "HARD";
    Grade[Grade["GOOD"] = 3] = "GOOD";
    Grade[Grade["EASY"] = 4] = "EASY";
})(Grade || (exports.Grade = Grade = {}));
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
function createDeck(params = DEFAULT_PARAMS) {
    const w = params.w || DEFAULT_PARAMS.w;
    const requestedRetentionRate = params.requestedRetentionRate || DEFAULT_PARAMS.requestedRetentionRate;
    /**
     * Calculates the retrievability after t days since the last review.
     * @param {number} t - The number of days since the last review.
     * @param {number} S - Stability (interval when R=90%).
     * @returns {number} - Retrievability (probability of recall).
     */
    function retrievability(t, S) {
        // Should return 0.9 when t = S
        return Math.pow(1 + FACTOR * (t / S), DECAY);
    }
    /**
     * Calculates the next interval based on requested retention.
     * @param {number} R - The requested retention rate.
     * @param {number} S - Current stability.
     * @returns {number} - The next interval in days.
     */
    function nextInterval(R, S) {
        // I(r, S) = S when R = 0.9
        return (S / FACTOR) * (Math.pow(R, 1 / DECAY) - 1);
    }
    /**
     * Calculates initial stability after the first rating.
     * @param {number} G - Grade (1: again, 2: hard, 3: good, 4: easy).
     * @returns {number} - Initial stability.
     */
    function initialStability(G) {
        return w[G - 1];
    }
    /**
     * Calculates initial difficulty after the first rating.
     * @param {number} G - Grade (1: again, 2: hard, 3: good, 4: easy).
     * @returns {number} - Initial difficulty.
     */
    function initialDifficulty(G) {
        const val = w[4] + (G - 3) * w[5];
        return Math.max(1, Math.min(10, val));
    }
    /**
     * Calculates new difficulty after review.
     * @param {number} D - Current difficulty.
     * @param {number} G - Grade (1: again, 2: hard, 3: good, 4: easy).
     * @returns {number} - New difficulty.
     */
    function nextDifficulty(D, G) {
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
    function nextStabilityAfterRecall(d, s, r, g) {
        const hard_penalty = Grade.HARD === g ? w[15] : 1;
        const easy_bound = Grade.EASY === g ? w[16] : 1;
        return (s *
            (1 +
                Math.exp(w[8]) *
                    (11 - d) *
                    Math.pow(s, -w[9]) *
                    (Math.exp((1 - r) * w[10]) - 1) *
                    hard_penalty *
                    easy_bound));
    }
    /**
     * Calculates stability after forgetting.
     * @param {number} d - Difficulty.
     * @param {number} s - Current stability.
     * @param {number} r - Retrievability.
     * @returns {number} - New stability after forgetting.
     */
    function nextStabilityAfterForgetting(d, s, r) {
        return (w[11] *
            Math.pow(d, -w[12]) *
            (Math.pow(s + 1, w[13]) - 1) *
            Math.exp((1 - r) * w[14]));
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
        newCard(grade) {
            const D = initialDifficulty(grade);
            const S = initialStability(grade);
            const I = nextInterval(requestedRetentionRate, S);
            return { D, S, I };
        },
        gradeCard(card, daysSinceReview, grade) {
            // Calculate current retrievability based on days since last review
            const currentRetrievability = retrievability(daysSinceReview, card.S);
            const D = nextDifficulty(card.D, grade);
            let S;
            if (grade === Grade.AGAIN) {
                S = nextStabilityAfterForgetting(D, card.S, currentRetrievability);
            }
            else {
                S = nextStabilityAfterRecall(D, card.S, currentRetrievability, grade);
            }
            var I = nextInterval(requestedRetentionRate, S);
            return { D, S, I };
        },
    };
}
exports.createDeck = createDeck;
//# sourceMappingURL=index.js.map