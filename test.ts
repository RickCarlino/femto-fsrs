import { Card, Grade, createDeck } from ".";

const { newCard, gradeCard } = createDeck();
const ratings = [
  Grade.GOOD,
  Grade.GOOD,
  Grade.GOOD,
  Grade.GOOD,
  Grade.AGAIN,
  Grade.GOOD,
  Grade.GOOD,
];
let results: {}[] = [];
let card: Card = newCard(ratings[0]);

ratings.forEach((rating, index) => {
  if (index > 0) {
    let daysSinceReview = card.I;
    card = gradeCard(card, daysSinceReview, rating);
  }
  results.push({
    Step: index + 1,
    Rating: rating,
    Difficulty: card.D,
    Stability: card.S,
    Interval: card.I + "d",
  });
});
// ┌─────────┬──────┬────────┬───────────────────┬────────────────────┬───────────────────────┐
// │ (index) │ Step │ Rating │ Difficulty        │ Stability          │ Interval              │
// ├─────────┼──────┼────────┼───────────────────┼────────────────────┼───────────────────────┤
// │ 0       │ 1    │ 3      │ 4.93              │ 2.4                │ '2.3999999999999995d' │
// │ 1       │ 2    │ 3      │ 4.93              │ 8.035970512572042  │ '8.035970512572039d'  │
// │ 2       │ 3    │ 3      │ 4.93              │ 23.969794373339646 │ '23.96979437333964d'  │
// │ 3       │ 4    │ 3      │ 4.93              │ 64.75459555875548  │ '64.75459555875547d'  │
// │ 4       │ 5    │ 1      │ 6.632799999999999 │ 7.087040882328393  │ '7.087040882328391d'  │
// │ 5       │ 6    │ 3      │ 6.615771999999998 │ 17.41682704709107  │ '17.416827047091065d' │
// │ 6       │ 7    │ 3      │ 6.598914279999998 │ 39.88623112320673  │ '39.88623112320672d'  │
// └─────────┴──────┴────────┴───────────────────┴────────────────────┴───────────────────────┘
console.table(results);
