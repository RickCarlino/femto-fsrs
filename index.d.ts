type Difficulty = number;
type Stability = number;
type IntervalDays = number;
export type Card = {
    D: Difficulty;
    S: Stability;
    I: IntervalDays;
};
export declare enum Grade {
    AGAIN = 1,
    HARD = 2,
    GOOD = 3,
    EASY = 4
}
export type DeckParams = {
    /** Percentage of cards that will succeed upon review.
     * Default value is 0.9.
     * Lower numbers mean fewer reviews but more more failures. */
    requestedRetentionRate: number;
    w: number[];
};
/** A deck creates functions that share the same configuration options,
 * such as a 'w' param and requested retention rate. */
export declare function createDeck(params?: {
    requestedRetentionRate: number;
    w: number[];
}): {
    newCard(grade: Grade): Card;
    gradeCard(card: Card, daysSinceReview: number, grade: Grade): Card;
};
export {};
