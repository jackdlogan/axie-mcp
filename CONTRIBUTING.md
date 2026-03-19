# Contributing — How to Add a New Tool

This guide explains how the MCP server is structured and how to add your own tool.

## Architecture

```
src/
├── client.ts   — GraphQL HTTP client (handles auth, timeout, errors)
├── queries.ts  — GraphQL query strings (one export per query)
└── index.ts    — MCP server (tool definitions, input validation, handlers)
```

Every tool follows the same 3-step pattern:

```
Query (queries.ts) → Tool Definition (index.ts) → Handler (index.ts)
```

---

## Step-by-Step: Adding a New Tool

### 1. Find the GraphQL query

Use introspection or the [Sky Mavis GraphQL explorer](https://api-gateway.skymavis.com/graphql/axie-marketplace) to browse available fields. The root `Query` type lists everything the API exposes.

Example — finding a user's quest progress:
```graphql
userQuestProgresses(userAddress: String!, questType: QuestType!, variant: String! = "0"): [QuestProgress!]!
```

### 2. Write the GraphQL query (`queries.ts`)

Add a new exported constant at the bottom of `queries.ts`:

```typescript
export const GET_USER_QUEST_PROGRESS = `
  query GetUserQuestProgress($userAddress: String!, $questType: QuestType!) {
    userQuestProgresses(userAddress: $userAddress, questType: $questType) {
      questId
      progress
      total
      completed
    }
  }
`;
```

**Tips:**
- Only request fields you actually need — fewer fields = fewer tokens
- Check the schema for the exact field names and types
- Use `$variableName: TypeName` in the query signature to match what the API expects

### 3. Add the tool definition (`index.ts`)

Add an entry to the `toolDefinitions` array:

```typescript
{
  name: "get_user_quest_progress",
  description: "Get a player's quest progress for a specific quest type.",
  inputSchema: {
    type: "object",
    properties: {
      userAddress: {
        type: "string",
        description: "The player's Ronin address (ronin:xxxx or 0x...).",
      },
      questType: {
        type: "string",
        enum: ["Daily", "Weekly", "Premier"],
        description: "The type of quest board to query.",
      },
    },
    required: ["userAddress", "questType"],
  },
},
```

**Tips:**
- Use `enum` for fields with a fixed set of values — it helps the AI pick correctly
- Be specific in `description` — the AI reads this to decide when and how to call the tool
- Only mark params as `required` if the API truly needs them

### 4. Add the handler (`index.ts`)

Add a new `case` inside the `switch (name)` block:

```typescript
// ── get_user_quest_progress ───────────────────────────────────────────────
case "get_user_quest_progress": {
  const schema = z.object({
    userAddress: RoninAddress,                        // use shared validators
    questType: z.enum(["Daily", "Weekly", "Premier"]),
  });
  const parsed = schema.parse(args);
  const data = await client.query<{ userQuestProgresses: unknown }>(
    queries.GET_USER_QUEST_PROGRESS,
    { userAddress: normaliseAddress(parsed.userAddress), questType: parsed.questType }
  );
  return jsonContent(data.userQuestProgresses);
}
```

**Tips:**
- Always validate inputs with Zod before using them
- Use the shared validators: `RoninAddress`, `AxieId`, `PartId`
- Pass address inputs through `normaliseAddress()` to handle both `ronin:` and `0x` formats
- The generic type `<{ fieldName: unknown }>` must match the GraphQL root field name

### 5. Build and test

```bash
npm run build
```

Then reconnect your MCP client and call the new tool.

---

## Shared Validators

| Validator | Use for |
|---|---|
| `RoninAddress` | Any Ronin wallet address input |
| `AxieId` | Axie ID strings |
| `PartId` | Part ID strings (e.g. `tail-carrot`) |

---

## Helper Functions

| Function | What it does |
|---|---|
| `normaliseAddress(addr)` | Converts `ronin:xxxx` → `0x...` |
| `stripNulls(data)` | Removes null/undefined fields from response |
| `jsonContent(data)` | Wraps data in MCP content format + enforces size limit |

---

## Adding a Resource (Optional)

MCP Resources allow direct URI-based access (e.g. `axie://axie/1074`). Add yours in the `ReadResourceRequestSchema` handler:

```typescript
// axie://quest/{address}/{type}
const questMatch = uri.match(/^axie:\/\/quest\/(0x[a-fA-F0-9]+)\/(\w+)$/);
if (questMatch) {
  const data = await client.query<{ userQuestProgresses: unknown }>(
    queries.GET_USER_QUEST_PROGRESS,
    { userAddress: questMatch[1], questType: questMatch[2] }
  );
  return {
    contents: [{ uri, mimeType: "application/json", text: JSON.stringify(stripNulls(data.userQuestProgresses)) }],
  };
}
```

Also register it in the `ListResourcesRequestSchema` handler:

```typescript
{
  uri: "axie://quest/{address}/{type}",
  name: "User Quest Progress",
  description: "Quest progress for a player by address and quest type.",
  mimeType: "application/json",
},
```

---

## Checklist Before Submitting

- [ ] Query added to `queries.ts`
- [ ] Tool definition added to `toolDefinitions` array
- [ ] Handler case added to the `switch` block
- [ ] Input validated with Zod (use shared validators where applicable)
- [ ] `npm run build` passes with no errors
- [ ] Tested by calling the tool and verifying the response
- [ ] Tool added to the tools table in `README.md`
