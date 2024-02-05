# Femto-FSRS

A zero dependency implementation of the [FSRS 4.5](https://github.com/open-spaced-repetition) spaced repetition algorithm.

I am building this library as a replacement to SM-2 in [KoalaSRS](https://github.com/RickCarlino/KoalaSRS).

# Features

- Zero dependencies
- Well annotated source code that (mostly) follows the paper.
- Sensible defaults.

# Usage

```typescript
import { Card, Grade, createDeck } from "femto-fsrs";

// === Create a new deck
const { newCard, gradeCard } = createDeck();

// === Initiate a new card with an initial grade of "GOOD":
const initialGrade = Grade.GOOD;
const myCard = newCard(initialGrade);

// === Grade the card as "easy" two days later.
//     Returns a new card that replaces the old one.
const daysSinceReview = 2;
const nextCard = gradeCard(myCard, daysSinceReview, Grade.EASY);
// The "I" attribute represents the "I" variable in the paper.
// It represents the next review date at which the probability
// of success if 90% (assuming you used default parameters).
const nextReview = nextCard.I.toFixed(2);
// Print results:
console.log(`Card will be due for review in ${nextReview} day(s)`);
```

Result:

```
Card will be due for review in 16.63 day(s)
```

# Installation

```
npm install femto-fsrs
```

# Not Included

This is supposed to be a minimalistic library that can be used as a starting point
for FSRS-enhanced apps. If you need a more full-featured offering with features
like logs (so you can optimize your `w` param) or revert, etc.., check out [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs).

# Tests

```
npm run test
```
