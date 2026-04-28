# Contributing to App Chat

Thanks for contributing to `app-chat`.

## Ground Rules

- Keep changes focused and reviewable.
- Follow existing TypeScript and formatting conventions.
- Avoid committing secrets (`.env`, credentials, keys).
- Update documentation when behavior or setup changes.

## Development Setup

1. Install dependencies:
   - `cd server && npm install`
   - `cd ../client && npm install`
2. Run locally:
   - `cd server && npm run dev`
   - `cd client && npm run dev`

## Branch and Commit Workflow

- Create a feature branch from `main`.
- Use clear commit messages with conventional prefixes:
  - `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
- Keep commits small and descriptive.

## Quality Checks

Before opening a PR, run:

- Server: `cd server && npm run lint && npm run typecheck && npm test`
- Client: `cd client && npm run lint && npm run build && npm test`

If a script is missing in your local setup, run the closest available validation command and mention it in the PR.

## Pull Requests

Every PR should include:

- A short summary of what changed and why.
- Test notes (what you ran, and the result).
- Screenshots/GIFs for UI changes.
- Linked issue/task when relevant.

Keep PRs small enough to review quickly.

## Security Reporting

If you find a security issue, do not open a public issue with exploit details.
Report it privately to maintainers and include reproduction steps.
