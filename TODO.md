# Notes To Self

*last updated July 8, 2021*

1. You can access the serverless deployment at /test when running the react scripts.
This can help test the local components without relying on the server

2. Right now the `test-round-view` acts very similarly to the `round-view`. Perhaps it's possible to move some functionality from `round-view` into `test-round-view`, or rather refactor `round-view` so that it doesn't rely on the server as much. Maybe move the server components somewhere else (like higher in the component-chain).

3. I implemented a handful of features in `test-round-view` that were not previously present in `round-view`:

    a. Scoring and displaying scores at the end of the game. Adding an additional phase - scoring - to the game. Display the tricks taken by everyone at the end of the game.

    b. Very simple AI for both bidding and playing.

    c. Keeping track of all the marriages declared by each person in the playing phase to make the scoring possible.

4. However the `test-round-view` is missing some aspects of core gameplay that I previously implemented:

    a. The entire bidding process (it's just auto-assigned, no user interaction possible)

    b. Distributing cards other than the treasure cards by the contract player

    c. Changing the bid once the treasure has been revealed and distributed

    d. Many sanity checks.