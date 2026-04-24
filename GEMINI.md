# ENSi Standalone - Core Mandates

## Architectural Rules
1. **Zustand over Global Objects:** Never use global vanilla JS objects for state. Use the stores in `client/src/stores/`.
2. **Declarative UI:** All DOM manipulations must happen through React components or dedicated custom hooks.
3. **Isolated Editor State:** Each score tab must have its own independent CodeMirror 6 instance and metadata (tracked via `useScoreStore`).
4. **Modular Engines:** The Audio and Video engines must be isolated in `client/src/services/` or `client/src/hooks/`.
5. **Typed Communication:** Use the shared types in `client/src/types/` for all store and API operations.

## Backend Integrity
1. **Elysia Routing:** Maintain the modular group structure in `server/src/index.ts`.
2. **Path Safety:** Always use `node:path` and `node:fs/promises` for file I/O to ensure cross-platform compatibility on the VPS.

## Traceability
1. Every major logic change must be logged in `MEMORY.md` with the `#<YY-MM-DD>` format.
2. Use this `AGENTS.md` file to verify architectural alignment before refactoring core systems.
