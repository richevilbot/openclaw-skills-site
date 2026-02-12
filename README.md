# OpenClaw Skills Site

Static website that displays available OpenClaw skills and provides an update script to regenerate skill data.

## Features
- Static website (`web/`) with searchable skills overview
- Auto-generated `web/skills.json` from local OpenClaw skills directory
- CI pipeline for build + validation on push/PR

## Quick start
```bash
npm install
npm run update:skills
npm test
```

Then open `web/index.html` in a browser (or serve via HTTP).

## Update script
The generator reads skills from:
- default: `/usr/lib/node_modules/openclaw/skills`
- override via env: `OPENCLAW_SKILLS_DIR=/path/to/skills`

Run:
```bash
npm run update:skills
```

## CI
GitHub Actions workflow is in `.github/workflows/ci.yml` and runs:
1. `npm ci`
2. `npm run build`
3. `npm test`
