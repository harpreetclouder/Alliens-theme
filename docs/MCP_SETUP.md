# MCP setup (engineering only)

Orbital **runtime does not depend on MCP**. These integrations help agents build Orbital.

## Priority

1. **GitHub** — issues, PRs, diffs, checks (`gh` CLI already used in agent rules)
2. **Docs / browser** — current VS Code & Cursor API docs when researching platform APIs
3. **Browser automation** — optional for webview HTML/CSS checks

## Configuration

- Configure MCP servers in **your** Cursor settings (user-level)
- **Never commit** API tokens, OAuth secrets, or `.env` files
- If an MCP namespace needs auth, authenticate via Cursor’s MCP UI — do not paste secrets into the repo

## Do not

- Wire MCP into `activate()` or celebration runtime
- Send source/terminal buffers to an MCP “telemetry” tool by default
