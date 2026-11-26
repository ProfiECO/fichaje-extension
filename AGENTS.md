# Project conventions

- Use pnpm. The pinned version is in `package.json`; commit `pnpm-lock.yaml` only.
- Application and extension configuration use strict TypeScript. React components use `.tsx`.
- Use `@/` for imports within `src/`. Define paths in tsconfig.json; Vite and Vitest resolve them with resolve.tsconfigPaths.
- Biome owns formatting, lint and import organization: single quotes, no semicolons and no trailing commas. Use `pnpm lint:fix`; do not add Prettier.
- Keep features in `src/features`, shared contracts and utilities in `src/shared`, and composition in `src/app`.
- Use Modern Web Guidance for web UI changes: search the relevant guides before implementing them. Project installation: `.agents/skills/modern-web-guidance`. Official skill: https://github.com/GoogleChrome/modern-web-guidance/tree/main/skills/modern-web-guidance. Install with the skill installer or the official CLI when unavailable.
- Keep the popup functional with keyboard navigation, reduced motion and a dark monochrome theme. Prefer native HTML and CSS to new runtime dependencies.
- Use the Vite CLI for builds and Vitest for tests; do not add custom build or alias loader scripts.
- `pnpm check` must pass before handing back changes. Tests mock Frappe; never create real attendance records for verification.
