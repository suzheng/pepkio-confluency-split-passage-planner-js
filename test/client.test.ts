import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PepkioClient } from "../src/client.js";
import {
  DEFAULT_API_BASE_URL,
  TOOL_ID,
  apiPath,
  resolveApiKey,
  resolveBaseUrl,
} from "../src/config.js";
import { parseRunInput } from "../src/schemas.js";
import { PepkioAPIError, type ToolManifest } from "../src/types.js";

const mockManifest: ToolManifest = {
  schema_version: "1.0",
  tool_id: TOOL_ID,
  title: "Confluency & Split/Passage Planner",
  description: "Plan cell passaging from confluency or cell density",
  examples: [
    {
      name: "hek293_t75_split",
      description: "Split HEK293 in T-75 flask",
      input: {
        calculation: "split",
        culture_mode: "adherent",
        cell_line_id: "hek293",
        vessel_format: "T-75",
        num_vessels: 1,
        pipetting_reserve_pct: 10,
        current_confluency_pct: 80,
        target_seeding_density_per_cm2: 20000,
        density_input_mode: "target_density",
        doubling_time_h: 24,
      },
      output: {
        split: { split_ratio: 2.8 },
      },
    },
    {
      name: "growth_forward_hela",
      description: "Forward growth calculation for HeLa",
      input: {
        calculation: "growth",
        culture_mode: "adherent",
        cell_line_id: "hela",
        vessel_format: "T-75",
        num_vessels: 1,
        pipetting_reserve_pct: 10,
        growth_mode: "forward",
        doubling_time_h: 24,
        seeding_confluency_pct: 20,
        target_confluency_pct: 80,
      },
      output: {
        growth: { hours_to_target: 48 },
      },
    },
  ],
};

describe("PepkioClient unit tests", () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    process.env = { ...originalEnv };
  });

  it("getManifest() fetches and returns tool_id", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockManifest),
    } as unknown as Response);

    const client = new PepkioClient({ apiKey: "test-key" });
    const manifest = await client.getManifest();

    expect(manifest.tool_id).toBe(TOOL_ID);
    expect(manifest.title).toBe("Confluency & Split/Passage Planner");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${DEFAULT_API_BASE_URL}/api/tools/v1/tools/${TOOL_ID}/manifest`,
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("caches getManifest() calls", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockManifest),
    } as unknown as Response);
    globalThis.fetch = fetchMock;

    const client = new PepkioClient({ apiKey: "test-key" });
    await client.getManifest();
    await client.getManifest();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("listExamples() extracts examples from manifest", () => {
    const client = new PepkioClient({ apiKey: "test-key" });
    const examples = client.listExamples(mockManifest);
    expect(examples).toHaveLength(2);
    expect(examples[0].name).toBe("hek293_t75_split");
    expect(examples[1].name).toBe("growth_forward_hela");
  });

  it("getExampleInput() retrieves and parses example", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockManifest),
    } as unknown as Response);

    const client = new PepkioClient({ apiKey: "test-key" });
    const input = await client.getExampleInput("hek293_t75_split");
    expect(input.calculation).toBe("split");
    expect(input.culture_mode).toBe("adherent");
    expect(input.vessel_format).toBe("T-75");
    expect(input.current_confluency_pct).toBe(80);
  });

  it("getExampleInput() throws on unknown example name", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockManifest),
    } as unknown as Response);

    const client = new PepkioClient({ apiKey: "test-key" });
    await expect(client.getExampleInput("nonexistent")).rejects.toThrow(
      /Example "nonexistent" not found/,
    );
  });

  it("run() sends validated input and options", async () => {
    const mockResponse = {
      run_id: "test-run-123",
      status: "completed",
      result: {
        warnings: [],
        has_blocking_errors: false,
        split: { split_ratio: 2.8 },
      },
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockResponse),
    } as unknown as Response);

    const client = new PepkioClient({ apiKey: "test-key" });
    const res = await client.run(
      {
        calculation: "split",
        culture_mode: "adherent",
        vessel_format: "T-75",
        num_vessels: 1,
        pipetting_reserve_pct: 10,
        current_confluency_pct: 80,
      },
      { label: "my-split" },
    );

    expect(res.run_id).toBe("test-run-123");
    expect(res.status).toBe("completed");
    expect(res.result?.split?.split_ratio).toBe(2.8);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${DEFAULT_API_BASE_URL}/api/tools/v1/tools/${TOOL_ID}/run`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-key",
          "Content-Type": "application/json",
        }),
      }),
    );
  });

  it("planSplit() convenience helper formats and calls run()", async () => {
    const mockResponse = {
      run_id: "split-run-1",
      status: "completed",
      result: { split: { split_ratio: 3 } },
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockResponse),
    } as unknown as Response);

    const client = new PepkioClient({ apiKey: "test-key" });
    const runSpy = vi.spyOn(client, "run");

    const result = await client.planSplit({
      vesselFormat: "T-75",
      currentConfluencyPct: 80,
      targetSeedingDensityPerCm2: 20000,
      doublingTimeH: 24,
    });

    expect(result.status).toBe("completed");
    expect(runSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        calculation: "split",
        culture_mode: "adherent",
        vessel_format: "T-75",
        current_confluency_pct: 80,
        target_seeding_density_per_cm2: 20000,
        doubling_time_h: 24,
      }),
      undefined,
    );
  });

  it("predictGrowth() convenience helper formats and calls run()", async () => {
    const mockResponse = {
      run_id: "growth-run-1",
      status: "completed",
      result: { growth: { hours_to_target: 48 } },
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockResponse),
    } as unknown as Response);

    const client = new PepkioClient({ apiKey: "test-key" });
    const runSpy = vi.spyOn(client, "run");

    const result = await client.predictGrowth({
      vesselFormat: "T-75",
      growthMode: "forward",
      doublingTimeH: 24,
      seedingConfluencyPct: 20,
      targetConfluencyPct: 80,
    });

    expect(result.status).toBe("completed");
    expect(runSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        calculation: "growth",
        culture_mode: "adherent",
        vessel_format: "T-75",
        growth_mode: "forward",
        doubling_time_h: 24,
        seeding_confluency_pct: 20,
        target_confluency_pct: 80,
      }),
      undefined,
    );
  });

  it("getRun() fetches previous run by ID", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          run_id: "prev-run-456",
          status: "completed",
          result: { split: { split_ratio: 2 } },
        }),
    } as unknown as Response);

    const client = new PepkioClient({ apiKey: "test-key" });
    const run = await client.getRun("prev-run-456");

    expect(run.run_id).toBe("prev-run-456");
    expect(run.status).toBe("completed");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${DEFAULT_API_BASE_URL}/api/tools/v1/runs/prev-run-456`,
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("waitForRun() polls until run is completed", async () => {
    let callCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(async () => {
      callCount += 1;
      if (callCount < 2) {
        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ run_id: "poll-1", status: "running" }),
        } as unknown as Response;
      }
      return {
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            run_id: "poll-1",
            status: "completed",
            result: { split: { split_ratio: 2 } },
          }),
      } as unknown as Response;
    });

    const client = new PepkioClient({ apiKey: "test-key" });
    const result = await client.waitForRun("poll-1", { intervalMs: 10, timeoutMs: 500 });
    expect(result.status).toBe("completed");
    expect(callCount).toBe(2);
  });

  it("waitForRun() throws on timeout", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ run_id: "timeout-run", status: "running" }),
    } as unknown as Response);

    const client = new PepkioClient({ apiKey: "test-key" });
    await expect(
      client.waitForRun("timeout-run", { intervalMs: 20, timeoutMs: 50 }),
    ).rejects.toThrow(/Timed out/);
  });

  it("throws PepkioAPIError on HTTP 500 error", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      text: async () => JSON.stringify({ error: "Something broke internally" }),
    } as unknown as Response);

    const client = new PepkioClient({ apiKey: "test-key" });
    await expect(
      client.run({
        calculation: "split",
        culture_mode: "adherent",
        vessel_format: "T-75",
        num_vessels: 1,
        pipetting_reserve_pct: 10,
      }),
    ).rejects.toThrow("Something broke internally");
  });

  it("throws PepkioAPIError when error field is present in 200 response", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          run_id: "err-run",
          status: "failed",
          error: "Invalid culture mode",
        }),
    } as unknown as Response);

    const client = new PepkioClient({ apiKey: "test-key" });
    await expect(
      client.run({
        calculation: "split",
        culture_mode: "adherent",
        vessel_format: "T-75",
        num_vessels: 1,
        pipetting_reserve_pct: 10,
      }),
    ).rejects.toThrow("Invalid culture mode");
  });

  describe("config helpers", () => {
    it("resolveBaseUrl handles custom and default values", () => {
      expect(resolveBaseUrl("https://custom.pepkio.com/")).toBe("https://custom.pepkio.com");
      delete process.env.PEPKIO_API_BASE_URL;
      expect(resolveBaseUrl()).toBe(DEFAULT_API_BASE_URL);

      process.env.PEPKIO_API_BASE_URL = "https://env.pepkio.com/";
      expect(resolveBaseUrl()).toBe("https://env.pepkio.com");
    });

    it("resolveApiKey prefers explicit key, then LOCAL vs production", () => {
      expect(resolveApiKey("https://tools.pepkio.com", "explicit-key")).toBe("explicit-key");

      process.env.PEPKIO_API_KEY = "prod-key";
      process.env.LOCAL_PEPKIO_API_KEY = "local-key";

      expect(resolveApiKey("https://tools.localtest.me")).toBe("local-key");
      expect(resolveApiKey("https://tools.pepkio.com")).toBe("prod-key");
    });

    it("apiPath builds correct URLs", () => {
      expect(apiPath("https://tools.pepkio.com", "/tools/test")).toBe(
        "https://tools.pepkio.com/api/tools/v1/tools/test",
      );
      expect(apiPath("https://tools.pepkio.com", "runs/123")).toBe(
        "https://tools.pepkio.com/api/tools/v1/runs/123",
      );
    });
  });

  describe("schema parsing", () => {
    it("validates valid input and sets defaults", () => {
      const parsed = parseRunInput({
        calculation: "split",
        culture_mode: "adherent",
        vessel_format: "T-75",
      });
      expect(parsed.calculation).toBe("split");
      expect(parsed.culture_mode).toBe("adherent");
      expect(parsed.vessel_format).toBe("T-75");
      expect(parsed.num_vessels).toBe(1);
      expect(parsed.pipetting_reserve_pct).toBe(10);
    });

    it("throws on invalid vessel format", () => {
      expect(() =>
        parseRunInput({
          calculation: "split",
          culture_mode: "adherent",
          vessel_format: "invalid_vessel",
        }),
      ).toThrow();
    });
  });
});
