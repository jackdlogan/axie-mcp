# axie-mcp

Ask Claude anything about Axie Infinity — Axies, land, players, leaderboards, and market data.

## Before You Start

You need a free Sky Mavis API key. Get one at [developers.skymavis.com](https://developers.skymavis.com).

## Setup

### Claude Desktop

1. Open your config file:
   - **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
   - **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Linux:** `~/.config/Claude/claude_desktop_config.json`

2. Add this:

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

3. Restart Claude Desktop. Done.

### Claude Code

```bash
claude mcp add axie-mcp -e SKYMAVIS_API_KEY=your-api-key-here -- npx axie-mcp
```

## What You Can Ask

Once connected, just talk to Claude naturally:

- *"Get info on Axie #1074"*
- *"Search for pure Bird Axies listed for sale under 0.01 ETH"*
- *"How many fortune slips does Axie #348 give?"*
- *"What equipment does Axie #1508 have?"*
- *"Show me the top 10 weekly bounty board players"*
- *"List all LunaLanding plots and their owners"*
- *"What's the cheapest Mystic Axie listed right now?"*
- *"Get the profile and recent activity for ronin:0xabc..."*
- *"What are the current AXS and RON exchange rates?"*

## Available Tools

| Tool | What it does |
|---|---|
| `get_axie` | Full Axie details — stats, parts, genes, fortune slips, equipment, price |
| `search_axies` | Search marketplace by class, parts, breed count, price, and more |
| `get_axie_children` | List children bred from an Axie |
| `get_axie_transfer_history` | On-chain transfer and sale history |
| `get_axie_equipment` | Equipment and accessories on one or more Axies |
| `get_land` | Land plot details by grid coordinates |
| `search_lands` | Search land by type, owner, or sale status |
| `get_public_profile` | Player name and linked addresses |
| `get_user_activities` | Recent on-chain activity (buys, sells, breeds, etc.) |
| `get_leaderboard` | Rankings for bounty board, land, collectors, runes, charms, and more |
| `get_top_sales` | Top sales for Axies, land, or items over 24h / 7d / 30d |
| `get_market_stats` | Transaction counts and volumes |
| `get_overall_market_stats` | All-time totals — volume, minted, ascended |
| `get_exchange_rate` | Live USD rates for ETH, AXS, SLP, RON, USDC |
| `get_erc1155_tokens` | Runes, charms, badges, and other items |

## Requirements

- Node.js 18+
- Sky Mavis API key

## License

MIT
