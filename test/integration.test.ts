import { describe, expect, it } from "vitest";
import { PepkioClient } from "../src/client.js";
import { TOOL_ID } from "../src/config.js";

const LOCAL_BASE_URL = "https://tools.localtest.me";
const PRODUCTION_BASE_URL = "https://tools.pepkio.com";

function envConfig(env: "local" | "production") {
  const baseUrl = process.env.PEPKIO_API_BASE_URL
    ? process.env.PEPKIO_API_BASE_URL.replace(/\/$/, "")
    : env === "local"
      ? LOCAL_BASE_URL
      : PRODUCTION_BASE_URL;

  const isLocal = baseUrl.includes("localtest.me");
  const apiKey = isLocal
    ? process.env.LOCAL_PEPKIO_API_KEY ?? process.env.PEPKIO_API_KEY
    : process.env.PEPKIO_API_KEY;

  return { baseUrl, apiKey, isLocal };
}

describe("integration: local", () => {
  const { baseUrl, apiKey } = envConfig("local");

  it.skipIf(!apiKey || !baseUrl.includes("localtest.me"))(
    "fetches manifest",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const manifest = await client.getManifest();

      expect(manifest.tool_id).toBe(TOOL_ID);
      expect(manifest.title).toBe("Confluency & Split/Passage Planner");
      const names = manifest.examples?.map((e) => e.name) ?? [];
      expect(names).toContain("hek293_t75_split");
      expect(names).toContain("jurkat_suspension_split");
      expect(names).toContain("growth_forward_hela");
    },
  );

  it.skipIf(!apiKey || !baseUrl.includes("localtest.me"))(
    "runs hek293_t75_split",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const input = await client.getExampleInput("hek293_t75_split");
      const result = await client.run(input);

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.result?.has_blocking_errors).toBe(false);
      expect(result.result?.split).toBeDefined();
      expect(result.result?.split?.split_ratio).toBeCloseTo(2.8, 1);
      expect(result.result?.split?.bench_recipe.length).toBeGreaterThan(0);
    },
    60_000,
  );

  it.skipIf(!apiKey || !baseUrl.includes("localtest.me"))(
    "runs jurkat_suspension_split",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const input = await client.getExampleInput("jurkat_suspension_split");
      const result = await client.run(input);

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.result?.has_blocking_errors).toBe(false);
      expect(result.result?.split).toBeDefined();
      expect(result.result?.split?.split_ratio).toBe(4);
    },
    60_000,
  );

  it.skipIf(!apiKey || !baseUrl.includes("localtest.me"))(
    "runs growth_forward_hela",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const input = await client.getExampleInput("growth_forward_hela");
      const result = await client.run(input);

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.result?.has_blocking_errors).toBe(false);
      expect(result.result?.growth).toBeDefined();
      expect(result.result?.growth?.hours_to_target).toBe(48);
    },
    60_000,
  );

  it.skipIf(!apiKey || !baseUrl.includes("localtest.me"))(
    "runs planSplit helper",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const result = await client.planSplit({
        vesselFormat: "T-75",
        currentConfluencyPct: 80,
        targetSeedingDensityPerCm2: 20000,
        doublingTimeH: 24,
      });

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.result?.split).toBeDefined();
    },
    60_000,
  );

  it.skipIf(!apiKey || !baseUrl.includes("localtest.me"))(
    "runs predictGrowth helper",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const result = await client.predictGrowth({
        vesselFormat: "T-75",
        growthMode: "forward",
        doublingTimeH: 24,
        seedingConfluencyPct: 20,
        targetConfluencyPct: 80,
      });

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.result?.growth).toBeDefined();
      expect(result.result?.growth?.hours_to_target).toBe(48);
    },
    60_000,
  );
});

describe("integration: production", () => {
  const { baseUrl, apiKey } = envConfig("production");

  it.skipIf(!apiKey || baseUrl.includes("localtest.me"))(
    "fetches manifest",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const manifest = await client.getManifest();

      expect(manifest.tool_id).toBe(TOOL_ID);
      expect(manifest.title).toBe("Confluency & Split/Passage Planner");
      const names = manifest.examples?.map((e) => e.name) ?? [];
      expect(names).toContain("hek293_t75_split");
      expect(names).toContain("jurkat_suspension_split");
      expect(names).toContain("growth_forward_hela");
    },
  );

  it.skipIf(!apiKey || baseUrl.includes("localtest.me"))(
    "runs hek293_t75_split",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const input = await client.getExampleInput("hek293_t75_split");
      const result = await client.run(input);

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.result?.has_blocking_errors).toBe(false);
      expect(result.result?.split).toBeDefined();
      expect(result.result?.split?.split_ratio).toBeCloseTo(2.8, 1);
      expect(result.result?.split?.bench_recipe.length).toBeGreaterThan(0);
    },
    60_000,
  );

  it.skipIf(!apiKey || baseUrl.includes("localtest.me"))(
    "runs jurkat_suspension_split",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const input = await client.getExampleInput("jurkat_suspension_split");
      const result = await client.run(input);

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.result?.has_blocking_errors).toBe(false);
      expect(result.result?.split).toBeDefined();
      expect(result.result?.split?.split_ratio).toBe(4);
    },
    60_000,
  );

  it.skipIf(!apiKey || baseUrl.includes("localtest.me"))(
    "runs growth_forward_hela",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const input = await client.getExampleInput("growth_forward_hela");
      const result = await client.run(input);

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.result?.has_blocking_errors).toBe(false);
      expect(result.result?.growth).toBeDefined();
      expect(result.result?.growth?.hours_to_target).toBe(48);
    },
    60_000,
  );

  it.skipIf(!apiKey || baseUrl.includes("localtest.me"))(
    "runs planSplit helper",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const result = await client.planSplit({
        vesselFormat: "T-75",
        currentConfluencyPct: 80,
        targetSeedingDensityPerCm2: 20000,
        doublingTimeH: 24,
      });

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.result?.split).toBeDefined();
    },
    60_000,
  );

  it.skipIf(!apiKey || baseUrl.includes("localtest.me"))(
    "runs predictGrowth helper",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const result = await client.predictGrowth({
        vesselFormat: "T-75",
        growthMode: "forward",
        doublingTimeH: 24,
        seedingConfluencyPct: 20,
        targetConfluencyPct: 80,
      });

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.result?.growth).toBeDefined();
      expect(result.result?.growth?.hours_to_target).toBe(48);
    },
    60_000,
  );
});
