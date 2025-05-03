"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Grade = void 0;
exports.createDeck = createDeck;
var Grade;
(function (Grade) {
    Grade[Grade["AGAIN"] = 1] = "AGAIN";
    Grade[Grade["HARD"] = 2] = "HARD";
    Grade[Grade["GOOD"] = 3] = "GOOD";
    Grade[Grade["EASY"] = 4] = "EASY";
})(Grade || (exports.Grade = Grade = {}));
const DECAY = -0.5;
const FACTOR = 19 / 81;
const DEFAULT_W = [
    0.40255, // Initial interval/stability for AGAIN
    1.18385, // Initial interval/stability for HARD
    3.173, // Initial interval/stability for GOOD
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
];
const DEFAULT_PARAMS = {
    requestedRetentionRate: 0.9,
    w: [...DEFAULT_W],
    maxStability: 36500,
};
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
function createDeck(params = {}) {
    var _a, _b, _c;
    const w = (_a = params.w) !== null && _a !== void 0 ? _a : DEFAULT_PARAMS.w;
    if (w.length !== 19)
        throw new Error("FSRS-5 expects a w-array of length 19.");
    const requestedRetentionRate = (_b = params.requestedRetentionRate) !== null && _b !== void 0 ? _b : DEFAULT_PARAMS.requestedRetentionRate;
    if (requestedRetentionRate <= 0 || requestedRetentionRate > 1)
        throw new Error("requestedRetentionRate must lie in (0, 1].");
    if (w[7] < 0 || w[7] > 1)
        throw new Error("w[7] must lie in the range 0 ... 1 for mean-reversion.");
    const MAX_S = (_c = params.maxStability) !== null && _c !== void 0 ? _c : DEFAULT_PARAMS.maxStability;
    const retrievability = (t, S) => Math.pow(1 + FACTOR * (t / S), DECAY);
    const nextInterval = (R, S) => {
        const raw = (S / FACTOR) * (Math.pow(R, 1 / DECAY) - 1);
        return Math.max(1, raw);
    };
    const initialStability = (G) => w[G - 1];
    const initialDifficulty = (G) => {
        const d0 = w[4] - Math.exp(w[5] * (G - 1)) + 1;
        return clamp(d0, 1, 10);
    };
    const nextDifficulty = (D, G) => {
        const delta = -w[6] * (G - 3);
        const Dprime = D + delta * ((10 - D) / 9);
        const target = initialDifficulty(Grade.EASY);
        const Dnext = w[7] * target + (1 - w[7]) * Dprime;
        return clamp(Dnext, 1, 10);
    };
    /* ------------------------- Stability updates ----------------------- */
    const nextStabilityAfterRecall = (d, s, r, g) => {
        const hardPenalty = g === Grade.HARD ? w[15] : 1;
        const easyBoost = g === Grade.EASY ? w[16] : 1;
        const multiplier = Math.exp(w[8]) *
            (11 - d) *
            Math.pow(s, -w[9]) *
            (Math.exp((1 - r) * w[10]) - 1) *
            hardPenalty *
            easyBoost;
        return clamp(s * (1 + multiplier), 0, MAX_S);
    };
    const nextStabilityAfterForgetting = (d, s, r) => {
        const post = w[11] *
            Math.pow(d, -w[12]) *
            (Math.pow(s + 1, w[13]) - 1) *
            Math.exp((1 - r) * w[14]);
        return clamp(post, 0, MAX_S);
    };
    return {
        newCard(firstGrade) {
            const D = initialDifficulty(firstGrade);
            const S = clamp(initialStability(firstGrade), 0, MAX_S);
            const I = nextInterval(requestedRetentionRate, S);
            return { D, S, I };
        },
        /** Apply a review result to an existing card. */
        gradeCard(card, daysSinceReview, grade) {
            const D = nextDifficulty(card.D, grade);
            let S;
            if (daysSinceReview < 1) {
                S = card.S * Math.exp(w[17] * (grade - 3 + w[18]));
            }
            else {
                const R = retrievability(daysSinceReview, card.S);
                S =
                    grade === Grade.AGAIN
                        ? nextStabilityAfterForgetting(D, card.S, R)
                        : nextStabilityAfterRecall(D, card.S, R, grade);
            }
            const I = nextInterval(requestedRetentionRate, clamp(S, 0, MAX_S));
            return { D, S, I };
        },
    };
}
//# sourceMappingURL=index.js.map