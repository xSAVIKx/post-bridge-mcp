### PostBridge MCP — Development Guidelines

This document captures project-specific knowledge to help advanced contributors work efficiently. It focuses on repo‑specific behaviors, tooling, and gotchas verified against the current setup.

#### Build and configuration
- Toolchain
  - Runtime: Bun 1.3.x is required for all tasks (install, build, tests). Node/npm is not used for scripts.
  - Language: TypeScript (strict), ESM only (`"type": "module"`). Import paths often include `.ts` extensions (see tsconfig notes below).
  - Lint/format: Biome (`biome.json`) is the single source of truth for code style and lint rules.
  - Git hooks: `simple-git-hooks` runs `biome` and `tsc --noEmit` on pre-commit (configured in `package.json`). Hooks are installed automatically via `postinstall`.

- Scripts (package.json)
  - `bun run build` → `bunup` compiles to `dist/` and emits `.d.ts`.
  - `bun run dev` → `bunup --watch` for incremental builds while editing.
  - `bun run lint` / `bun run lint:fix` → Biome check/write.
  - `bun run type-check` → `tsc --noEmit` type verification (uses `tsconfig.json`).
  - `bun run test`, `bun run test:watch`, `bun run test:coverage` → Bun test runner.
  - `bun run release` → Version bump + tag/push via `bumpp` (semantic or explicit).

- TypeScript config (tsconfig.json) nuances
  - `module` is `Preserve` and `moduleResolution` is `bundler`. This enables modern ESM behavior and preserves import syntax for bundlers.
  - `allowImportingTsExtensions: true` and `verbatimModuleSyntax: true` mean imports may include explicit `.ts` and must not be elided by TS. Keep import paths exact; do not rely on extension inference.
  - `noEmit: true` in TS; actual builds are produced by `bunup` (not `tsc`).
  - Declarations: `declaration: true`, `isolatedDeclarations: true` ensure `.d.ts` compatibility when building with `bunup`.

- Distribution and exports
  - Built JS and types are emitted to `dist/` by `bunup`.
  - `exports` maps default import to `./dist/index.js` and types to `./dist/index.d.ts`.
  - `module` and `types` fields also point to the built artifacts for consumers.

- Runtime entrypoints
  - `src/index.ts` defines `main()` which starts the MCP server (`fastmcp`).
  - To run locally (without building): `bun src/index.ts`.
  - For an installed/built package, consumers import from the package root per `exports`.

#### Testing
- Runner: Bun’s built‑in test runner (`bun test`). No Jest/Vitest required.
- Location: Tests can live alongside sources (e.g., `src/foo.test.ts`). The Bun default pattern is `**/*.test.{ts,tsx,js}`.
- Common commands
  - Run all tests: `bun test`
  - Watch mode: `bun test --watch`
  - Coverage: `bun test --coverage`

- Adding a new test
  1) Create a file ending with `.test.ts` under `src/` (or a subdirectory).
  2) Use Bun’s test API: `import { describe, it, expect } from 'bun:test'`.
  3) Prefer importing internal modules using explicit `.ts` extensions when referencing local files (consistent with repo style).

- Minimal working example (validated)
  The following test was executed successfully during guideline authoring and then removed to keep the repo clean:
  ```ts
  // src/smoke.test.ts
  import { describe, expect, it } from 'bun:test'
  import { server } from './server.ts'

  describe('smoke', () => {
    it('adds numbers', () => {
      expect(1 + 1).toBe(2)
    })

    it('can import server without side effects', () => {
      expect(server).toBeDefined()
    })
  })
  ```
  Commands used:
  - `bun test` → Ran and passed locally on Bun 1.3.1.

- Tips for MCP‑specific tests
  - Favor unit‑level tests around request handlers/tool schemas rather than end‑to‑end sockets. You can structure handlers as pure functions and export them for testability.
  - If you need to spin up the `FastMCP` server, ensure tests clean up resources (e.g., close the server) to avoid port conflicts in watch mode. Consider injecting a transport adapter or using a mock, if possible.

#### Development workflow and code style
- Biome is authoritative for formatting and linting. Run `bun run lint:fix` before committing, or rely on the pre‑commit hook.
- Keep imports explicit and stable (do not omit `.ts` extensions for local files).
- Use strict types and prefer `zod` schemas for runtime validation where interfaces/types are insufficient. The project already depends on `zod`.
- Avoid side effects at module top‑level unless required by MCP; export factories/config functions for composability and testability.
- For public API changes, update JSDoc/TS types so `dist/*.d.ts` remains accurate after `bun run build`.

#### Releasing
- Ensure `bun run lint` and `bun run type-check` pass.
- Update changelog or release notes as appropriate (see repository conventions if any).
- Use `bun run release` to bump version, create a git tag, and push. CI/CD expectations are standard git hosting.

#### Troubleshooting
- “Cannot find module” or import resolution errors: recheck the exact import path and extension; with `verbatimModuleSyntax` + ESM, missing extensions will fail.
- Git hooks not running: ensure `bun install` was executed so `postinstall` can install hooks via `simple-git-hooks`.
- Type declarations missing: run `bun run build` so `bunup` emits `dist/index.d.ts`.
- Bun version mismatch: verify with `bun --version` and update to 1.3.x if APIs differ.
