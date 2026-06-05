# Graph Report - blackjackk  (2026-06-05)

## Corpus Check
- 229 files · ~109,270 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 128 nodes · 178 edges · 13 communities (8 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `dd0cbda4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]

## God Nodes (most connected - your core abstractions)
1. `applyAction()` - 8 edges
2. `applyAndResolve()` - 8 edges
3. `startHand()` - 7 edges
4. `runShowdown()` - 7 edges
5. `Architecture` - 7 edges
6. `advanceStreet()` - 6 edges
7. `PokerConfig` - 5 edges
8. `PokerPublicState` - 5 edges
9. `evaluate7()` - 5 edges
10. `clone()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `applyAndResolve()` --calls--> `inHandCount()`  [EXTRACTED]
  supabase/functions/_shared/poker-flow.ts → supabase/functions/_shared/poker-engine.ts
- `applyAndResolve()` --calls--> `applyAction()`  [EXTRACTED]
  supabase/functions/_shared/poker-flow.ts → supabase/functions/_shared/poker-engine.ts
- `applyAndResolve()` --calls--> `advanceStreet()`  [EXTRACTED]
  supabase/functions/_shared/poker-flow.ts → supabase/functions/_shared/poker-engine.ts
- `applyAndResolve()` --calls--> `runShowdown()`  [EXTRACTED]
  supabase/functions/_shared/poker-flow.ts → supabase/functions/_shared/poker-engine.ts

## Import Cycles
- None detected.

## Communities (13 total, 5 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.12
Nodes (14): ForgotPassword, Game, Index, Lobby, Login, ModeSelection, MultiplayerTable, NotFound (+6 more)

### Community 1 - "Community 1"
Cohesion: 0.25
Nodes (5): PokerActionBar, PokerActionBarProps, cardBack, PlayerRow, TableRow

### Community 2 - "Community 2"
Cohesion: 0.14
Nodes (12): Architecture, Backend (Supabase), Commands, Core Game Engine (`src/lib/blackjack/`), Data Flow, Environment, graphify, Key Configuration (+4 more)

### Community 3 - "Community 3"
Cohesion: 0.09
Nodes (28): buildPots(), callAmount(), combinations(), compareHands(), DEFAULT_POKER_CONFIG, distribute(), evaluate5(), evaluate7() (+20 more)

### Community 10 - "Community 10"
Cohesion: 0.13
Nodes (14): Card, DEFAULT_POKER_CONFIG, HAND_CATEGORY, HAND_CATEGORY_LABEL, HandRank, PokerAction, PokerConfig, PokerPublicState (+6 more)

### Community 11 - "Community 11"
Cohesion: 0.26
Nodes (13): advanceStreet(), applyAction(), clone(), commit(), draw(), inHandCount(), isBettingRoundClosed(), nextSeatMatching() (+5 more)

### Community 12 - "Community 12"
Cohesion: 0.24
Nodes (9): corsHeaders, corsHeaders, corsHeaders, Card, createInitialState(), PokerAction, PokerConfig, PokerPublicState (+1 more)

## Knowledge Gaps
- **66 isolated node(s):** `Card`, `RANK_VALUE`, `Street`, `SeatStatus`, `PokerAction` (+61 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `applyAction()` connect `Community 11` to `Community 3`?**
  _High betweenness centrality (0.002) - this node is a cross-community bridge._
- **Why does `runShowdown()` connect `Community 11` to `Community 3`?**
  _High betweenness centrality (0.002) - this node is a cross-community bridge._
- **What connects `Card`, `RANK_VALUE`, `Street` to the rest of the system?**
  _66 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.08735632183908046 - nodes in this community are weakly interconnected._
- **Should `Community 10` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._