# post-bridge-mcp

Unofficial Post Bridge MCP server (FastMCP). Provides a local MCP server that talks to the Post
Bridge API so you can schedule/publish content from MCP-compatible clients.

## Installation

We provide OS-specific prebuilt binaries on the Releases page. Pick the latest release, download the
binary for your OS, set the required environment variables, and run it.

Releases: https://github.com/xSAVIKx/post-bridge-mcp/releases

Note about file names (from our CI config):

- macOS: `post-bridge-mcp-macos-<version>`
- Linux (Ubuntu): `post-bridge-mcp-ubuntu-<version>`
- Windows: `post-bridge-mcp-windows-<version>`

### Gemini CLI Extension

```bash
gemini extensions install https://github.com/xSAVIKx/post-bridge-mcp
```

### macOS (zsh)

```zsh
# 1) Download the latest macOS binary (replace 0.1.6 with the latest version)
VERSION=0.1.6
curl -L -o post-bridge-mcp "https://github.com/xSAVIKx/post-bridge-mcp/releases/download/v$VERSION/post-bridge-mcp-macos-$VERSION"
chmod +x post-bridge-mcp

# 2) Required environment variables
export POST_BRIDGE_API_TOKEN="<your_api_token>"
# Optional (defaults to https://api.post-bridge.com)
# export POST_BRIDGE_API_BASE_URL="https://api.post-bridge.com"

# 3) Run
./post-bridge-mcp
```

### Linux (bash)

```bash
# 1) Download the latest Linux binary (replace 0.1.6 with the latest version)
VERSION=0.1.6
curl -L -o post-bridge-mcp "https://github.com/xSAVIKx/post-bridge-mcp/releases/download/v$VERSION/post-bridge-mcp-ubuntu-$VERSION"
chmod +x post-bridge-mcp

# 2) Required environment variables
export POST_BRIDGE_API_TOKEN="<your_api_token>"
# Optional (defaults to https://api.post-bridge.com)
# export POST_BRIDGE_API_BASE_URL="https://api.post-bridge.com"

# 3) Run
./post-bridge-mcp
```

### Windows (PowerShell)

```powershell
# 1) Download the latest Windows binary (replace 0.1.6 with the latest version)
$version = "0.1.6"
$asset   = "post-bridge-mcp-windows-$version.exe"
$uri     = "https://github.com/xSAVIKx/post-bridge-mcp/releases/download/v$version/$asset"
Invoke-WebRequest -Uri $uri -OutFile "post-bridge-mcp.exe"

# 2) Required environment variables (for current session)
$env:POST_BRIDGE_API_TOKEN = "<your_api_token>"
# Optional (defaults to https://api.post-bridge.com)
# $env:POST_BRIDGE_API_BASE_URL = "https://api.post-bridge.com"

# 3) Run
./post-bridge-mcp.exe
```

### Using Bun/Node (from npm registry)

If you prefer not to use prebuilt binaries, you can install the package and run the CLI with Bun or
Node.

```bash
# Install
bun add post-bridge-mcp

# Set env vars (bash/zsh example)
export POST_BRIDGE_API_TOKEN="<your_api_token>"
# export POST_BRIDGE_API_BASE_URL="https://api.post-bridge.com" # optional

# Run with Bun directly from the installed package
bun node_modules/post-bridge-mcp/dist/cli.js

# Or run with Node
node node_modules/post-bridge-mcp/dist/cli.js
```

Notes:

- You can also run the CLI from source in this repo for development: `bun src/cli.ts`.
- The MCP server starts immediately and listens per your MCP client configuration.

## Environment variables

These must be available in the process environment when starting the server:

- `POST_BRIDGE_API_TOKEN` (required): Your Post Bridge API token. If missing, the server will exit
  with an error.
- `POST_BRIDGE_API_BASE_URL` (optional): Base URL for the Post Bridge API. Defaults to
  `https://api.post-bridge.com`.

## Contributing

Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.

## License

MIT
