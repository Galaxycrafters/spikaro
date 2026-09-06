# Claude Code Instructions

## About this repo
This project was scaffolded by the Project Manager. It is configured to work with the Claude Code GitHub Actions workflow.

## Layout
- `BRIEF.md` — product / build brief (read this first when present)
- `public/` — static site served locally at `/spikaro/` (Tailscale / host)
- `.github/workflows/claude.yml` — Claude Code agent on issues / `@claude` comments

## Local clone
On the project host the repo is cloned to:
`/home/peeth/projects/spikaro`

## Behavior
- Always work on a new branch, never commit directly to main
- Open a pull request when done
- Keep changes small and focused
- Write clear commit messages
- Prefer updating `public/` for the live Tailscale site unless the brief says otherwise
