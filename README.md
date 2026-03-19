# axie-mcp

An MCP (Model Context Protocol) server for the Axie Infinity ecosystem. Gives Claude and other MCP-compatible AI clients direct access to Axie Infinity marketplace, player, land, leaderboard, and game data.

## Features

- Search and inspect Axies — stats, parts, abilities, genes, fortune slips, equipment, price
- Search land plots by type (Savannah, Forest, Arctic, Mystic, Genesis, LunaLanding)
- Player profiles, activity history, and leaderboard rankings
- Marketplace stats, top sales, and live exchange rates
- ERC-1155 tokens — runes, charms, badges, accessories
- MCP Resources for direct URI-based entity access (`axie://axie/1074`)

## Requirements

- Node.js 18+
- A Sky Mavis developer API key — get one free at [developers.skymavis.com](https://developers.skymavis.com)

## Installation

### Option A — npx (no install needed)

```bash
npx axie-mcp
```

### Option B — global install

```bash
npm install -g axie-mcp
axie-mcp
```

### Option C — from source

```bash
git clone https://github.com/your-username/axie-mcp.git
cd axie-mcp
npm install && npm run build
node dist/index.js
```

## Configuration

### Claude Desktop

Add to your `claude_desktop_config.json`:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
**Linux:** `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "axie": {
      "command": "npx",
      "args": ["axie-mcp"],
      "env": {
        "SKYMAVIS_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add axie-mcp -- npx axie-mcp
```

Then set your API key:

```bash
SKYMAVIS_API_KEY=your-api-key-here
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SKYMAVIS_API_KEY` | Yes | Sky Mavis developer API key, sent as `X-API-Key`. Get one at [developers.skymavis.com](https://developers.skymavis.com) |

## Available Tools

### Axie

| Tool | Description |
|---|---|
| `get_axie` | Full Axie details — stats, parts, abilities, fortune slips, equipment, accessories, price, battle info |
| `search_axies` | Search marketplace with filters: class, parts, breed count, mystic count, owner, auction type, sort |
| `get_axie_children` | Children bred from an Axie and parent IDs |
| `get_axie_transfer_history` | On-chain transfer and sale history for a specific Axie |
| `get_axie_equipment` | Equipment and accessories equipped on one or more Axies |

### Land

| Tool | Description |
|---|---|
| `get_land` | Details of a land plot by grid coordinates (col, row) |
| `search_lands` | Search land plots — filter by type, owner, sale status, sort |

### Player

| Tool | Description |
|---|---|
| `get_public_profile` | Player name, account ID, and linked addresses by Ronin address |
| `get_user_activities` | Recent on-chain activity — buys, sells, transfers, breeds, ascensions, and more |

### Marketplace

| Tool | Description |
|---|---|
| `get_top_sales` | Top sales for Axies, Land, Items, Runes, or Charms over 24h / 7d / 30d |
| `get_market_stats` | Transaction counts and volumes over 24h / 7d / 30d |
| `get_overall_market_stats` | All-time volumes, total minted, and ascended Axies |
| `get_exchange_rate` | Live USD rates for ETH, AXS, SLP, RON, and USDC |

### Items & Tokens

| Tool | Description |
|---|---|
| `get_erc1155_tokens` | Runes, charms, badges, materials, consumables — optionally filtered by owner |

### Leaderboard

| Tool | Description |
|---|---|
| `get_leaderboard` | Rankings for 25+ categories including weekly/all-time bounty board, land, collectors, runes, charms |

## Resources

The server exposes MCP Resources for direct URI access:

| URI | Description |
|---|---|
| `axie://axie/{id}` | Axie details by ID (e.g. `axie://axie/1074`) |
| `axie://land/{col}/{row}` | Land plot by coordinates (e.g. `axie://land/-21/-1`) |
| `axie://profile/{address}` | Player profile by Ronin address |
| `axie://exchange-rate` | Current token exchange rates |

## Example Usage

Once connected, you can ask Claude things like:

- *"Get info on Axie #1074"*
- *"Search for pure Bird Axies listed for sale under 0.01 ETH"*
- *"How many fortune slips does Axie #348 give?"*
- *"Show me the top 10 weekly bounty board players"*
- *"List all LunaLanding plots and their owners"*
- *"What's the cheapest Mystic Axie listed right now?"*
- *"Get Droken's profile and recent activities"* (by Ronin address)

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run built server
npm start

# Run in development mode (no build needed)
npm run dev
```

## GraphQL Endpoint

All requests go to:

```
https://api-gateway.skymavis.com/graphql/axie-marketplace
```

## License

MIT
