# BoardGame

A two-player pass-and-play abstract strategy game in the browser.

**Play:** https://yellowhapax.github.io/BoardGame/

## Rules

5×5 board. Two players share one screen. Each starts with 21 stones and 1 capstone.

**Piece types**
- **Flat** — lies horizontal, builds roads, can be stacked on
- **Wall** — stands vertical, blocks roads for both players
- **Cap** — one per player; builds roads; can flatten an opposing wall by moving onto it alone

**Win conditions**
- **Road win** — connect your two opposite edges with an unbroken orthogonal chain of your flats and caps
- **Flat win** — if the board fills completely, most top-of-stack flats wins

**Moving stacks** — pick up to 5 pieces from the top of any stack you control, carry them in one cardinal direction, drop at least one per square.

## Run locally

```
npm install
npm run dev
```

Opens at `http://localhost:3000`.
