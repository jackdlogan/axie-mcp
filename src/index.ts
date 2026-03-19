#!/usr/bin/env node
import "dotenv/config";
import { createRequire } from "module";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { GraphQLClient } from "./client.js";
import * as queries from "./queries.js";

const require = createRequire(import.meta.url);
const { version } = require("../package.json") as { version: string };

const RESPONSE_SIZE_LIMIT = 50000; // characters

const apiKey = process.env.SKYMAVIS_API_KEY;
if (!apiKey) {
  console.error(
    "[axie-mcp] Warning: SKYMAVIS_API_KEY is not set. Most requests will fail.\n" +
    "  Get a free API key at https://developers.skymavis.com and set it in your MCP config."
  );
}

const client = new GraphQLClient(
  "https://api-gateway.skymavis.com/graphql/axie-marketplace",
  apiKey
);

const server = new Server(
  {
    name: "axie-mcp",
    version,
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// ─── Shared validators ───────────────────────────────────────────────────────

const RoninAddress = z.string().min(10).max(100).trim();
const AxieId = z.string().min(1).max(20).trim();
const PartId = z.string().min(1).max(80).trim();

// ─── Zod schemas ────────────────────────────────────────────────────────────

const AxieClassEnum = z.enum([
  "Beast",
  "Aquatic",
  "Plant",
  "Bug",
  "Bird",
  "Reptile",
  "Mech",
  "Dawn",
  "Dusk",
]);

const AuctionTypeEnum = z.enum(["All", "Sale", "NotForSale"]);

const SortByEnum = z.enum([
  "IdAsc",
  "IdDesc",
  "PriceAsc",
  "PriceDesc",
  "Latest",
  "LevelAsc",
  "LevelDesc",
]);

const LandTypeEnum = z.enum(["Savannah", "Forest", "Arctic", "Mystic", "Genesis", "LunaLanding"]);

const TokenTypeEnum = z.enum(["Axie", "Land", "Item", "Rune", "Charm"]);

const PeriodTypeEnum = z.enum(["Last24H", "Last7D", "Last30D"]);

const LeaderboardTypeEnum = z.enum([
  "AxieRelease",
  "AxieOrigin",
  "AxieMystic",
  "AxieShiny",
  "AxieSummer",
  "AxieNightmare",
  "AxieJapan",
  "AxieXmas",
  "AxieMeoCorp",
  "AxieCollector",
  "AxieScore",
  "LandPlot",
  "LandSavannah",
  "LandForest",
  "LandArctic",
  "LandMystic",
  "LandGenesis",
  "LandLunaLanding",
  "LandItem",
  "Accessory",
  "Rune",
  "Charm",
  "Consumable",
  "Material",
  "WeeklyQuestPoints",
  "WeeklyPremierQuestPoints",
  "PremierQuestPoints",
]);

const Erc1155TypeEnum = z.enum([
  "Rune",
  "Charm",
  "Badge",
  "Material",
  "Consumable",
  "Accessory",
]);

const UserActivityTypeEnum = z.enum([
  "Buy",
  "Sale",
  "Listing",
  "Offer",
  "Transfer",
  "PrayAtia",
  "MorphAxie",
  "ReleaseAxie",
  "EvolveAxie",
  "AscendAxie",
  "BreedAxie",
  "DevolveAxie",
  "UseConsumables",
  "Delegate",
  "RevokeDelegation",
  "Forge",
  "AcceptOffer",
]);

// ─── Tool definitions ────────────────────────────────────────────────────────

const toolDefinitions = [
  {
    name: "get_axie",
    description:
      "Get detailed information about a single Axie by its ID, including stats, parts, abilities, genes, breeding info, current listing price, and battle info.",
    inputSchema: {
      type: "object",
      properties: {
        axieId: {
          type: "string",
          description: "The numeric ID of the Axie (e.g. '1234567')",
        },
      },
      required: ["axieId"],
    },
  },
  {
    name: "search_axies",
    description:
      "Search for Axies on the marketplace with optional filters. Supports filtering by class, parts, breed count, auction type, and owner.",
    inputSchema: {
      type: "object",
      properties: {
        auctionType: {
          type: "string",
          enum: ["All", "Sale", "NotForSale"],
          description: "Filter by listing status. Defaults to All.",
        },
        owner: {
          type: "string",
          description: "Filter by owner Ronin address (ronin:xxxx or 0x...).",
        },
        from: {
          type: "number",
          description: "Pagination offset. Default 0.",
        },
        size: {
          type: "number",
          description: "Number of results to return (max 100). Default 10.",
        },
        sort: {
          type: "string",
          enum: ["IdAsc", "IdDesc", "PriceAsc", "PriceDesc", "Latest", "LevelAsc", "LevelDesc"],
          description: "Sort order for results.",
        },
        classes: {
          type: "array",
          items: {
            type: "string",
            enum: ["Beast", "Aquatic", "Plant", "Bug", "Bird", "Reptile", "Mech", "Dawn", "Dusk"],
          },
          description: "Filter by Axie classes.",
        },
        parts: {
          type: "array",
          items: { type: "string" },
          description: "Filter by part IDs (e.g. ['eyes-zeal', 'mouth-tiny-turtle']).",
        },
        breedCount: {
          type: "array",
          items: { type: "number" },
          description: "Filter by breed count values (e.g. [0, 1, 2]).",
        },
        stages: {
          type: "array",
          items: { type: "number" },
          description: "Filter by stage values.",
        },
        numMystic: {
          type: "array",
          items: { type: "number" },
          description: "Filter by number of mystic parts.",
        },
      },
      required: [],
    },
  },
  {
    name: "get_exchange_rate",
    description:
      "Get the current USD exchange rates for Axie Infinity tokens: ETH, AXS, SLP, RON, and USDC.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "get_market_stats",
    description:
      "Get marketplace settlement statistics showing transaction counts, Axie counts, and volumes over the last 24 hours, 7 days, and 30 days.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "get_overall_market_stats",
    description:
      "Get overall marketplace statistics including new Axies minted, marketplace volumes in RON and USD, total transactions, and ascended Axies.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "get_axie_transfer_history",
    description:
      "Get the on-chain transfer and sale history for a specific Axie.",
    inputSchema: {
      type: "object",
      properties: {
        axieId: {
          type: "string",
          description: "The numeric ID of the Axie.",
        },
        from: {
          type: "number",
          description: "Pagination offset. Default 0.",
        },
        size: {
          type: "number",
          description: "Number of records to return. Default 10.",
        },
      },
      required: ["axieId"],
    },
  },
  {
    name: "get_public_profile",
    description:
      "Get a public player profile by Ronin address. Returns the player's account ID, name, and linked addresses.",
    inputSchema: {
      type: "object",
      properties: {
        roninAddress: {
          type: "string",
          description:
            "The Ronin address in 'ronin:xxxx' or '0x...' format.",
        },
      },
      required: ["roninAddress"],
    },
  },
  {
    name: "search_lands",
    description:
      "Search for land plots on the Axie Infinity marketplace with optional filters.",
    inputSchema: {
      type: "object",
      properties: {
        owner: {
          type: "string",
          description: "Filter by owner Ronin address (ronin:xxxx or 0x...).",
        },
        landType: {
          type: "string",
          enum: ["Savannah", "Forest", "Arctic", "Mystic", "Genesis", "LunaLanding"],
          description: "Filter by land type.",
        },
        from: {
          type: "number",
          description: "Pagination offset. Default 0.",
        },
        size: {
          type: "number",
          description: "Number of results to return. Default 10.",
        },
        sort: {
          type: "string",
          enum: ["IdAsc", "IdDesc", "PriceAsc", "PriceDesc", "Latest"],
          description: "Sort order for results.",
        },
        auctionType: {
          type: "string",
          enum: ["All", "Sale", "NotForSale"],
          description: "Filter by listing status.",
        },
      },
      required: [],
    },
  },
  {
    name: "get_land",
    description:
      "Get details for a specific land plot by its grid coordinates.",
    inputSchema: {
      type: "object",
      properties: {
        col: {
          type: "number",
          description: "Column coordinate of the land plot.",
        },
        row: {
          type: "number",
          description: "Row coordinate of the land plot.",
        },
      },
      required: ["col", "row"],
    },
  },
  {
    name: "get_top_sales",
    description:
      "Get the top sales for a given token type (Axie, Land, Item, etc.) over a specified time period.",
    inputSchema: {
      type: "object",
      properties: {
        tokenType: {
          type: "string",
          enum: ["Axie", "Land", "Item", "Rune", "Charm"],
          description: "The type of token to get top sales for.",
        },
        periodType: {
          type: "string",
          enum: ["Last24H", "Last7D", "Last30D"],
          description: "The time period to look back.",
        },
        size: {
          type: "number",
          description: "Number of top sales to return. Default 10.",
        },
      },
      required: ["tokenType", "periodType"],
    },
  },
  {
    name: "get_leaderboard",
    description:
      "Get leaderboard rankings for various competitive categories in Axie Infinity.",
    inputSchema: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["AxieScore", "AxieCollector", "AxieOrigin", "AxieMystic", "AxieShiny", "AxieSummer", "AxieNightmare", "AxieJapan", "AxieXmas", "LandPlot", "LandSavannah", "LandForest", "LandArctic", "LandMystic", "LandGenesis", "Rune", "Charm", "Accessory", "WeeklyQuestPoints", "PremierQuestPoints"],
          description: "The leaderboard category to retrieve.",
        },
        from: {
          type: "number",
          description: "Pagination offset. Default 0.",
        },
        size: {
          type: "number",
          description: "Number of rankings to return. Default 10.",
        },
      },
      required: ["type"],
    },
  },
  {
    name: "get_erc1155_tokens",
    description:
      "Get ERC1155 tokens such as runes, charms, accessories, ingredients, and other in-game items, optionally filtered by owner.",
    inputSchema: {
      type: "object",
      properties: {
        owner: {
          type: "string",
          description: "Filter by owner Ronin address (ronin:xxxx or 0x...).",
        },
        tokenType: {
          type: "string",
          enum: ["Rune", "Charm", "Badge", "Material", "Consumable", "Accessory"],
          description: "The type of ERC1155 token to query.",
        },
        from: {
          type: "number",
          description: "Pagination offset. Default 0.",
        },
        size: {
          type: "number",
          description: "Number of results to return. Default 10.",
        },
      },
      required: ["tokenType"],
    },
  },
  {
    name: "get_axie_equipment",
    description:
      "Get the equipment and accessories currently equipped on one or more Axies.",
    inputSchema: {
      type: "object",
      properties: {
        axieIds: {
          type: "array",
          items: { type: "number" },
          description: "List of Axie IDs to query equipment for (e.g. [1074, 1508]).",
        },
      },
      required: ["axieIds"],
    },
  },
  {
    name: "get_axie_children",
    description:
      "Get the children (bred Axies) and parentage information for a given Axie.",
    inputSchema: {
      type: "object",
      properties: {
        axieId: {
          type: "string",
          description: "The numeric ID of the parent Axie.",
        },
      },
      required: ["axieId"],
    },
  },
  {
    name: "get_user_activities",
    description:
      "Get the recent on-chain activity history for a user's Ronin address, such as buys, sells, transfers, and breeds.",
    inputSchema: {
      type: "object",
      properties: {
        userAddress: {
          type: "string",
          description: "The Ronin address of the user (ronin:xxxx or 0x...).",
        },
        activityTypes: {
          type: "array",
          items: {
            type: "string",
            enum: [
              "Buy",
              "Sale",
              "Listing",
              "Offer",
              "Transfer",
              "PrayAtia",
              "MorphAxie",
              "ReleaseAxie",
              "EvolveAxie",
              "AscendAxie",
              "BreedAxie",
              "DevolveAxie",
              "UseConsumables",
              "Delegate",
              "RevokeDelegation",
              "Forge",
              "AcceptOffer",
            ],
          },
          description: "Filter by specific activity types.",
        },
        size: {
          type: "number",
          description: "Number of activities to return. Default 10.",
        },
      },
      required: ["userAddress"],
    },
  },
];

// ─── Helper functions ────────────────────────────────────────────────────────

/**
 * Normalise a Ronin address: convert "ronin:" prefix to "0x" if present,
 * otherwise return as-is.
 */
function normaliseAddress(address: string): string {
  if (address.toLowerCase().startsWith("ronin:")) {
    return "0x" + address.slice("ronin:".length);
  }
  return address;
}

/**
 * Format a wei-denominated price string to a human-readable decimal string.
 * Prices in the Axie API are stored as integers in the smallest unit (1e18).
 */
function formatWeiPrice(price: string | null | undefined): string {
  if (!price || price === "0") return "0";
  try {
    const wei = BigInt(price);
    const eth = Number(wei) / 1e18;
    return eth.toFixed(4);
  } catch {
    return price;
  }
}

/** Recursively remove null and undefined values from an object. */
function stripNulls(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripNulls);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, v]) => v !== null && v !== undefined)
        .map(([k, v]) => [k, stripNulls(v)])
    );
  }
  return value;
}

/** Return text content with a compact JSON payload (no nulls, no indentation). */
function jsonContent(data: unknown) {
  const text = JSON.stringify(stripNulls(data));
  if (text.length > RESPONSE_SIZE_LIMIT) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Result too large (${text.length.toLocaleString()} chars, limit ${RESPONSE_SIZE_LIMIT.toLocaleString()}). Try reducing the "size" parameter or adding more filters to narrow your query.`,
        },
      ],
      isError: true,
    };
  }
  return {
    content: [{ type: "text" as const, text }],
  };
}

// ─── Request handlers ────────────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: toolDefinitions };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // ── get_axie ──────────────────────────────────────────────────────────
      case "get_axie": {
        const schema = z.object({ axieId: AxieId });
        const { axieId } = schema.parse(args);
        const data = await client.query<{ axie: unknown }>(queries.GET_AXIE, {
          axieId,
        });
        return jsonContent(data.axie);
      }

      // ── search_axies ─────────────────────────────────────────────────────
      case "search_axies": {
        const schema = z.object({
          auctionType: AuctionTypeEnum.optional(),
          owner: RoninAddress.optional(),
          from: z.coerce.number().int().min(0).default(0),
          size: z.coerce.number().int().min(1).max(100).default(10),
          sort: SortByEnum.optional(),
          classes: z.array(AxieClassEnum).optional(),
          parts: z.array(PartId).max(6).optional(),
          breedCount: z.array(z.coerce.number().int()).optional(),
          stages: z.array(z.coerce.number().int()).optional(),
          numMystic: z.array(z.coerce.number().int()).optional(),
        });
        const parsed = schema.parse(args ?? {});

        // Build the criteria object only when filter params are provided
        const criteria: Record<string, unknown> = {};
        if (parsed.classes && parsed.classes.length > 0) {
          criteria.classes = parsed.classes;
        }
        if (parsed.parts && parsed.parts.length > 0) {
          criteria.parts = parsed.parts;
        }
        if (parsed.breedCount && parsed.breedCount.length > 0) {
          criteria.breedCount = parsed.breedCount;
        }
        if (parsed.stages && parsed.stages.length > 0) {
          criteria.stages = parsed.stages;
        }
        if (parsed.numMystic && parsed.numMystic.length > 0) {
          criteria.numMystic = parsed.numMystic;
        }

        const variables: Record<string, unknown> = {
          from: parsed.from,
          size: parsed.size,
        };
        if (parsed.auctionType) variables.auctionType = parsed.auctionType;
        if (parsed.owner) variables.owner = parsed.owner;
        if (parsed.sort) variables.sort = parsed.sort;
        if (Object.keys(criteria).length > 0) variables.criteria = criteria;

        const data = await client.query<{ axies: unknown }>(
          queries.SEARCH_AXIES,
          variables
        );
        return jsonContent(data.axies);
      }

      // ── get_exchange_rate ─────────────────────────────────────────────────
      case "get_exchange_rate": {
        const data = await client.query<{ exchangeRate: unknown }>(
          queries.GET_EXCHANGE_RATE
        );
        return jsonContent(data.exchangeRate);
      }

      // ── get_market_stats ──────────────────────────────────────────────────
      case "get_market_stats": {
        const data = await client.query<{ marketStats: unknown }>(
          queries.GET_MARKET_STATS
        );
        return jsonContent(data.marketStats);
      }

      // ── get_overall_market_stats ──────────────────────────────────────────
      case "get_overall_market_stats": {
        const data = await client.query<{ overallMarketStats: unknown }>(
          queries.GET_OVERALL_MARKET_STATS
        );
        return jsonContent(data.overallMarketStats);
      }

      // ── get_axie_transfer_history ─────────────────────────────────────────
      case "get_axie_transfer_history": {
        const schema = z.object({
          axieId: AxieId,
          from: z.coerce.number().int().min(0).default(0),
          size: z.coerce.number().int().min(1).max(100).default(10),
        });
        const parsed = schema.parse(args);
        const data = await client.query<{ axie: unknown }>(
          queries.GET_AXIE_TRANSFER_HISTORY,
          { axieId: parsed.axieId, from: parsed.from, size: parsed.size }
        );
        return jsonContent(data.axie);
      }

      // ── get_public_profile ────────────────────────────────────────────────
      case "get_public_profile": {
        const schema = z.object({ roninAddress: RoninAddress });
        const { roninAddress } = schema.parse(args);
        const normalisedAddress = normaliseAddress(roninAddress);
        const data = await client.query<{
          publicProfileWithRoninAddress: unknown;
        }>(queries.GET_PUBLIC_PROFILE_BY_ADDRESS, {
          roninAddress: normalisedAddress,
        });
        return jsonContent(data.publicProfileWithRoninAddress);
      }

      // ── search_lands ──────────────────────────────────────────────────────
      case "search_lands": {
        const schema = z.object({
          owner: RoninAddress.optional(),
          landType: LandTypeEnum.optional(),
          from: z.coerce.number().int().min(0).default(0),
          size: z.coerce.number().int().min(1).max(100).default(10),
          sort: SortByEnum.optional(),
          auctionType: AuctionTypeEnum.optional(),
        });
        const parsed = schema.parse(args ?? {});

        const variables: Record<string, unknown> = {
          from: parsed.from,
          size: parsed.size,
        };
        if (parsed.auctionType) variables.auctionType = parsed.auctionType;
        if (parsed.sort) variables.sort = parsed.sort;
        if (parsed.owner) {
          variables.owner = {
            address: parsed.owner,
            ownerships: ["Owned"],
          };
        }
        if (parsed.landType) {
          variables.criteria = { landType: [parsed.landType] };
        }

        const data = await client.query<{ lands: unknown }>(
          queries.GET_LANDS,
          variables
        );
        return jsonContent(data.lands);
      }

      // ── get_land ──────────────────────────────────────────────────────────
      case "get_land": {
        const schema = z.object({
          col: z.coerce.number().int(),
          row: z.coerce.number().int(),
        });
        const { col, row } = schema.parse(args);
        const data = await client.query<{ land: unknown }>(queries.GET_LAND, {
          col,
          row,
        });
        return jsonContent(data.land);
      }

      // ── get_top_sales ─────────────────────────────────────────────────────
      case "get_top_sales": {
        const schema = z.object({
          tokenType: TokenTypeEnum,
          periodType: PeriodTypeEnum,
          size: z.coerce.number().int().min(1).max(100).default(10),
        });
        const parsed = schema.parse(args);
        const data = await client.query<{ topSales: unknown }>(
          queries.GET_TOP_SALES,
          {
            tokenType: parsed.tokenType,
            periodType: parsed.periodType,
            size: parsed.size,
          }
        );
        return jsonContent(data.topSales);
      }

      // ── get_leaderboard ───────────────────────────────────────────────────
      case "get_leaderboard": {
        const schema = z.object({
          type: LeaderboardTypeEnum,
          from: z.coerce.number().int().min(0).default(0),
          size: z.coerce.number().int().min(1).max(100).default(10),
        });
        const parsed = schema.parse(args);
        const data = await client.query<{ leaderboard: unknown }>(
          queries.GET_LEADERBOARD,
          { type: parsed.type, from: parsed.from, size: parsed.size }
        );
        return jsonContent(data.leaderboard);
      }

      // ── get_erc1155_tokens ────────────────────────────────────────────────
      case "get_erc1155_tokens": {
        const schema = z.object({
          owner: RoninAddress.optional(),
          tokenType: Erc1155TypeEnum,
          from: z.coerce.number().int().min(0).default(0),
          size: z.coerce.number().int().min(1).max(100).default(10),
        });
        const parsed = schema.parse(args);
        const variables: Record<string, unknown> = {
          tokenType: parsed.tokenType,
          from: parsed.from,
          size: parsed.size,
        };
        if (parsed.owner) variables.owner = parsed.owner;
        const data = await client.query<{ erc1155Tokens: unknown }>(
          queries.GET_ERC1155_TOKENS,
          variables
        );
        return jsonContent(data.erc1155Tokens);
      }

      // ── get_axie_equipment ────────────────────────────────────────────────
      case "get_axie_equipment": {
        const schema = z.object({
          axieIds: z.array(z.coerce.number().int()),
        });
        const { axieIds } = schema.parse(args);
        const data = await client.query<{ axiesEquipments: unknown }>(
          queries.GET_AXIE_EQUIPMENT,
          { axieIds }
        );
        return jsonContent(data.axiesEquipments);
      }

      // ── get_axie_children ─────────────────────────────────────────────────
      case "get_axie_children": {
        const schema = z.object({ axieId: AxieId });
        const { axieId } = schema.parse(args);
        const data = await client.query<{ axie: unknown }>(
          queries.GET_AXIE_BREEDS,
          { axieId }
        );
        return jsonContent(data.axie);
      }

      // ── get_user_activities ───────────────────────────────────────────────
      case "get_user_activities": {
        const schema = z.object({
          userAddress: RoninAddress,
          activityTypes: z.array(UserActivityTypeEnum).optional(),
          size: z.coerce.number().int().min(1).max(100).default(10),
        });
        const parsed = schema.parse(args);
        const variables: Record<string, unknown> = {
          userAddress: parsed.userAddress,
          size: parsed.size,
        };
        if (parsed.activityTypes && parsed.activityTypes.length > 0) {
          variables.activityTypes = parsed.activityTypes;
        }
        const data = await client.query<{ userActivities: unknown }>(
          queries.GET_USER_ACTIVITIES,
          variables
        );
        return jsonContent(data.userActivities);
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    // Zod validation errors — make them human-readable
    if (message.includes("invalid_type") || message.includes("invalid_enum_value") || message.includes("Required")) {
      return {
        content: [{ type: "text" as const, text: `Invalid input: ${message}` }],
        isError: true,
      };
    }

    return {
      content: [{ type: "text" as const, text: message }],
      isError: true,
    };
  }
});

// ─── Resources ───────────────────────────────────────────────────────────────

server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: "axie://axie/{id}",
      name: "Axie by ID",
      description: "Full details of an Axie including stats, parts, equipment, and price.",
      mimeType: "application/json",
    },
    {
      uri: "axie://land/{col}/{row}",
      name: "Land Plot by Coordinates",
      description: "Details of a land plot at the given grid coordinates.",
      mimeType: "application/json",
    },
    {
      uri: "axie://profile/{address}",
      name: "Player Profile by Ronin Address",
      description: "Public profile of a player by their Ronin address.",
      mimeType: "application/json",
    },
    {
      uri: "axie://exchange-rate",
      name: "Exchange Rate",
      description: "Current USD exchange rates for ETH, AXS, SLP, RON, and USDC.",
      mimeType: "application/json",
    },
  ],
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  try {
    // axie://axie/{id}
    const axieMatch = uri.match(/^axie:\/\/axie\/(\d+)$/);
    if (axieMatch) {
      const data = await client.query<{ axie: unknown }>(queries.GET_AXIE, {
        axieId: axieMatch[1],
      });
      return {
        contents: [{ uri, mimeType: "application/json", text: JSON.stringify(stripNulls(data.axie)) }],
      };
    }

    // axie://land/{col}/{row}
    const landMatch = uri.match(/^axie:\/\/land\/(-?\d+)\/(-?\d+)$/);
    if (landMatch) {
      const data = await client.query<{ land: unknown }>(queries.GET_LAND, {
        col: parseInt(landMatch[1]),
        row: parseInt(landMatch[2]),
      });
      return {
        contents: [{ uri, mimeType: "application/json", text: JSON.stringify(stripNulls(data.land)) }],
      };
    }

    // axie://profile/{address}
    const profileMatch = uri.match(/^axie:\/\/profile\/(0x[a-fA-F0-9]+|ronin:[a-fA-F0-9]+)$/);
    if (profileMatch) {
      const data = await client.query<{ publicProfileWithRoninAddress: unknown }>(
        queries.GET_PUBLIC_PROFILE_BY_ADDRESS,
        { roninAddress: normaliseAddress(profileMatch[1]) }
      );
      return {
        contents: [{ uri, mimeType: "application/json", text: JSON.stringify(stripNulls(data.publicProfileWithRoninAddress)) }],
      };
    }

    // axie://exchange-rate
    if (uri === "axie://exchange-rate") {
      const data = await client.query<{ exchangeRate: unknown }>(queries.GET_EXCHANGE_RATE);
      return {
        contents: [{ uri, mimeType: "application/json", text: JSON.stringify(data.exchangeRate) }],
      };
    }

    throw new Error(`Unknown resource URI: ${uri}`);
  } catch (error) {
    throw new Error(`Failed to read resource ${uri}: ${error instanceof Error ? error.message : String(error)}`);
  }
});

// ─── Entry point ─────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Axie MCP server running on stdio");
}

main().catch(console.error);
