# Graph Report - blackjackk  (2026-06-05)

## Corpus Check
- 227 files · ~108,419 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 57 nodes · 49 edges · 10 communities (5 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5d84a3d7`
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

## God Nodes (most connected - your core abstractions)
1. `Architecture` - 7 edges
2. `hooks` - 2 edges
3. `Environment` - 2 edges
4. `PokerActionBar` - 2 edges
5. `graphify` - 1 edges
6. `Workflow: graphify` - 1 edges
7. `PreToolUse` - 1 edges
8. `Commands` - 1 edges
9. `Core Game Engine (`src/lib/blackjack/`)` - 1 edges
10. `State Management (`src/store/useGameStore.ts`)` - 1 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (10 total, 5 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.12
Nodes (14): ForgotPassword, Game, Index, Lobby, Login, ModeSelection, MultiplayerTable, NotFound (+6 more)

### Community 1 - "Community 1"
Cohesion: 0.25
Nodes (5): PokerActionBar, PokerActionBarProps, cardBack, PlayerRow, TableRow

### Community 2 - "Community 2"
Cohesion: 0.29
Nodes (5): Commands, Environment, graphify, Key Configuration, Variables

### Community 3 - "Community 3"
Cohesion: 0.29
Nodes (7): Architecture, Backend (Supabase), Core Game Engine (`src/lib/blackjack/`), Data Flow, Routing (`src/App.tsx`), State Management (`src/store/useGameStore.ts`), UI Structure

## Knowledge Gaps
- **34 isolated node(s):** `graphify`, `Workflow: graphify`, `PreToolUse`, `Commands`, `Core Game Engine (`src/lib/blackjack/`)` (+29 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Architecture` connect `Community 3` to `Community 2`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **What connects `graphify`, `Workflow: graphify`, `PreToolUse` to the rest of the system?**
  _34 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._