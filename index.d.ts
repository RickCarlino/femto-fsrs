type Difficulty = number;
type Stability = number;
type IntervalDays = number;
export type DifficultyAndStability = {
    D: Difficulty;
    S: Stability;
};
export interface Card extends DifficultyAndStability {
    I: IntervalDays;
}
export declare enum Grade {
    AGAIN = 1,
    HARD = 2,
    GOOD = 3,
    EASY = 4
}
export interface DeckParams {
    requestedRetentionRate: number;
    w: number[];
    maxStability?: number;
}
export declare function createDeck(params?: Partial<DeckParams>): {
    readonly newCard: (firstGrade: Grade) => Card;
    /** Apply a review result to an existing card. */
    readonly gradeCard: (card: DifficultyAndStability, daysSinceReview: number, grade: Grade) => Card;
};
export {};
