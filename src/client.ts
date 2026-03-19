const REQUEST_TIMEOUT_MS = 15000;

export class GraphQLClient {
  private endpoint: string;
  private apiKey?: string;

  constructor(endpoint: string, apiKey?: string) {
    this.endpoint = endpoint;
    this.apiKey = apiKey;
  }

  async query<T>(
    query: string,
    variables?: Record<string, unknown>
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.apiKey) {
      headers["X-API-Key"] = this.apiKey;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const response = await fetch(this.endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables }),
      signal: controller.signal,
    }).catch((err) => {
      if (err.name === "AbortError")
        throw new Error(`Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s. The Sky Mavis API may be slow — try again shortly.`);
      throw new Error(`Network error: unable to reach Sky Mavis API. Check your internet connection.`);
    }).finally(() => clearTimeout(timeout));

    if (response.status === 401 || response.status === 403) {
      throw new Error(
        `API key rejected (HTTP ${response.status}). Check your SKYMAVIS_API_KEY at developers.skymavis.com.`
      );
    }

    if (response.status === 429) {
      throw new Error(`Rate limit exceeded. Wait a moment before retrying.`);
    }

    if (!response.ok) {
      throw new Error(
        `Sky Mavis API returned HTTP ${response.status}. Try again later.`
      );
    }

    const json = (await response.json()) as {
      data?: T;
      errors?: Array<{ message: string; locations?: unknown; path?: unknown }>;
    };

    if (json.errors && json.errors.length > 0) {
      // Sanitize: only forward the message string, not locations or path internals
      const messages = json.errors
        .map((e) => e.message)
        .filter((m) => typeof m === "string" && m.length < 300)
        .join("; ");
      throw new Error(`API error: ${messages || "Unknown error from Sky Mavis API"}`);
    }

    if (json.data === undefined) {
      throw new Error("Sky Mavis API returned an empty response. Try again.");
    }

    return json.data;
  }
}
