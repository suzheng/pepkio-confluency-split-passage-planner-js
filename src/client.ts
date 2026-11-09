// SPDX-License-Identifier: MIT
import {
  TOOL_ID,
  apiPath,
  resolveApiKey,
  resolveBaseUrl,
} from "./config.js";
import {
  parseRunInput,
  type ConfluencySplitPassagePlannerInput,
} from "./schemas.js";
import {
  PepkioAPIError,
  type CalculationMode,
  type ConfluencySplitPassagePlannerResult,
  type CultureMode,
  type DensityInputMode,
  type ExampleMeta,
  type GrowthMode,
  type RunOptions,
  type RunResult,
  type ToolManifest,
  type VesselFormat,
  type VolumeUnit,
} from "./types.js";

export interface PepkioClientOptions {
  apiKey?: string;
  baseUrl?: string;
}

export interface PlanSplitOptions {
  cultureMode?: CultureMode;
  vesselFormat?: VesselFormat;
  numVessels?: number;
  pipettingReservePct?: number;
  cellLineId?: string;
  densityAtConfluencePerCm2?: number;
  viabilityPct?: number;
  volumeUnit?: VolumeUnit;
  compareVessels?: string[];
  currentConfluencyPct?: number;
  currentCellDensityPerMl?: number;
  targetSeedingDensityPerCm2?: number;
  targetCellDensityPerMl?: number;
  splitRatio?: number;
  densityInputMode?: DensityInputMode;
  doublingTimeH?: number;
  customSurfaceAreaCm2?: number;
  customWorkingVolumeMl?: number;
  runOptions?: RunOptions;
}

export interface PredictGrowthOptions {
  cultureMode?: CultureMode;
  vesselFormat?: VesselFormat;
  growthMode?: GrowthMode;
  doublingTimeH?: number;
  numVessels?: number;
  pipettingReservePct?: number;
  cellLineId?: string;
  densityAtConfluencePerCm2?: number;
  seedingConfluencyPct?: number;
  seedingCellDensityPerMl?: number;
  targetConfluencyPct?: number;
  targetFinalDensityPerCm2?: number;
  targetFinalDensityPerMl?: number;
  deadlineHours?: number;
  deadlineIso?: string;
  customSurfaceAreaCm2?: number;
  customWorkingVolumeMl?: number;
  runOptions?: RunOptions;
}

export class PepkioClient {
  private readonly baseUrl: string;
  private readonly apiKey: string | undefined;
  private manifestCache: ToolManifest | undefined;

  constructor(opts: PepkioClientOptions = {}) {
    this.baseUrl = resolveBaseUrl(opts.baseUrl);
    this.apiKey = resolveApiKey(this.baseUrl, opts.apiKey);
  }

  async getManifest(): Promise<ToolManifest> {
    if (this.manifestCache) {
      return this.manifestCache;
    }
    const manifest = await this.request<ToolManifest>(
      "GET",
      `/tools/${TOOL_ID}/manifest`,
      undefined,
      { requireAuth: false },
    );
    this.manifestCache = manifest;
    return manifest;
  }

  listExamples(manifest?: ToolManifest): ExampleMeta[] {
    const m = manifest ?? this.manifestCache;
    if (!m?.examples) {
      return [];
    }
    return m.examples.map((e) => ({
      name: e.name,
      description: e.description,
    }));
  }

  async getExamples(manifest?: ToolManifest): Promise<ExampleMeta[]> {
    const m = manifest ?? (await this.getManifest());
    return this.listExamples(m);
  }

  async getExampleInput(
    name: string,
    manifest?: ToolManifest,
  ): Promise<ConfluencySplitPassagePlannerInput> {
    const m = manifest ?? (await this.getManifest());
    const example = m.examples?.find((e) => e.name === name);
    if (!example) {
      const available = m.examples?.map((e) => e.name).join(", ") ?? "(none)";
      throw new Error(`Example "${name}" not found. Available: ${available}`);
    }
    return parseRunInput(example.input);
  }

  async run(
    input: ConfluencySplitPassagePlannerInput,
    options?: RunOptions,
  ): Promise<RunResult<ConfluencySplitPassagePlannerResult>> {
    const validated = parseRunInput(input);
    return this.request<RunResult<ConfluencySplitPassagePlannerResult>>(
      "POST",
      `/tools/${TOOL_ID}/run`,
      { input: validated, options: options ?? {} },
      { requireAuth: true },
    );
  }

  /** Convenience helper for cell splitting & passaging calculations */
  async planSplit(
    opts: PlanSplitOptions = {},
  ): Promise<RunResult<ConfluencySplitPassagePlannerResult>> {
    const input: ConfluencySplitPassagePlannerInput = {
      calculation: "split",
      culture_mode: opts.cultureMode ?? "adherent",
      vessel_format: opts.vesselFormat ?? "T-75",
      num_vessels: opts.numVessels ?? 1,
      pipetting_reserve_pct: opts.pipettingReservePct ?? 10,
      cell_line_id: opts.cellLineId,
      density_at_confluence_per_cm2: opts.densityAtConfluencePerCm2,
      viability_pct: opts.viabilityPct,
      volume_unit: opts.volumeUnit,
      compare_vessels: opts.compareVessels,
      current_confluency_pct: opts.currentConfluencyPct,
      current_cell_density_per_ml: opts.currentCellDensityPerMl,
      target_seeding_density_per_cm2: opts.targetSeedingDensityPerCm2,
      target_cell_density_per_ml: opts.targetCellDensityPerMl,
      split_ratio: opts.splitRatio,
      density_input_mode: opts.densityInputMode ?? (opts.splitRatio ? "split_ratio" : "target_density"),
      doubling_time_h: opts.doublingTimeH,
      custom_surface_area_cm2: opts.customSurfaceAreaCm2,
      custom_working_volume_ml: opts.customWorkingVolumeMl,
    };
    return this.run(input, opts.runOptions);
  }

  /** Convenience helper for growth time & seeding density predictions */
  async predictGrowth(
    opts: PredictGrowthOptions = {},
  ): Promise<RunResult<ConfluencySplitPassagePlannerResult>> {
    const input: ConfluencySplitPassagePlannerInput = {
      calculation: "growth",
      culture_mode: opts.cultureMode ?? "adherent",
      vessel_format: opts.vesselFormat ?? "T-75",
      num_vessels: opts.numVessels ?? 1,
      pipetting_reserve_pct: opts.pipettingReservePct ?? 10,
      growth_mode: opts.growthMode ?? "forward",
      doubling_time_h: opts.doublingTimeH,
      cell_line_id: opts.cellLineId,
      density_at_confluence_per_cm2: opts.densityAtConfluencePerCm2,
      seeding_confluency_pct: opts.seedingConfluencyPct,
      seeding_cell_density_per_ml: opts.seedingCellDensityPerMl,
      target_confluency_pct: opts.targetConfluencyPct,
      target_final_density_per_cm2: opts.targetFinalDensityPerCm2,
      target_final_density_per_ml: opts.targetFinalDensityPerMl,
      deadline_hours: opts.deadlineHours,
      deadline_iso: opts.deadlineIso,
      custom_surface_area_cm2: opts.customSurfaceAreaCm2,
      custom_working_volume_ml: opts.customWorkingVolumeMl,
    };
    return this.run(input, opts.runOptions);
  }

  async getRun(runId: string): Promise<RunResult<ConfluencySplitPassagePlannerResult>> {
    return this.request<RunResult<ConfluencySplitPassagePlannerResult>>(
      "GET",
      `/runs/${runId}`,
      undefined,
      { requireAuth: true },
    );
  }

  async waitForRun(
    runId: string,
    opts: { intervalMs?: number; timeoutMs?: number } = {},
  ): Promise<RunResult<ConfluencySplitPassagePlannerResult>> {
    const intervalMs = opts.intervalMs ?? 1000;
    const timeoutMs = opts.timeoutMs ?? 30_000;
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      const result = await this.getRun(runId);
      if (result.status === "completed" || result.status === "failed") {
        if (result.error) {
          const errMsg =
            typeof result.error === "string"
              ? result.error
              : typeof result.error === "object" && result.error !== null && "message" in result.error
                ? (result.error as { message: string }).message
                : JSON.stringify(result.error);
          throw new PepkioAPIError(errMsg, {
            status: 200,
            body: result,
            runId,
          });
        }
        return result;
      }
      await sleep(intervalMs);
    }

    throw new PepkioAPIError(`Timed out waiting for run ${runId}`, {
      status: 408,
      runId,
    });
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    opts: { requireAuth?: boolean } = {},
  ): Promise<T> {
    const requireAuth = opts.requireAuth ?? false;
    if (requireAuth && !this.apiKey) {
      throw new PepkioAPIError(
        "API key required. Set PEPKIO_API_KEY (or LOCAL_PEPKIO_API_KEY for local dev).",
        { status: 401 },
      );
    }

    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }
    if (this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`;
    }

    const url = apiPath(this.baseUrl, path);
    const response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    let parsed: unknown;
    const text = await response.text();
    try {
      parsed = text ? JSON.parse(text) : undefined;
    } catch {
      parsed = text;
    }

    if (!response.ok) {
      let message = `HTTP ${response.status}: ${response.statusText}`;
      let code: string | undefined;
      if (typeof parsed === "object" && parsed !== null && "error" in parsed) {
        const errVal = (parsed as { error: unknown }).error;
        if (typeof errVal === "string") {
          message = errVal;
        } else if (typeof errVal === "object" && errVal !== null) {
          if ("message" in errVal && typeof (errVal as { message: unknown }).message === "string") {
            message = (errVal as { message: string }).message;
          }
          if ("code" in errVal && typeof (errVal as { code: unknown }).code === "string") {
            code = (errVal as { code: string }).code;
          }
        }
      }
      throw new PepkioAPIError(message, {
        status: response.status,
        body: parsed,
        code,
      });
    }

    const runResult = parsed as RunResult<ConfluencySplitPassagePlannerResult>;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "error" in parsed &&
      runResult.error
    ) {
      const errMsg =
        typeof runResult.error === "string"
          ? runResult.error
          : typeof runResult.error === "object" && runResult.error !== null && "message" in runResult.error
            ? (runResult.error as { message: string }).message
            : JSON.stringify(runResult.error);
      throw new PepkioAPIError(errMsg, {
        status: response.status,
        body: parsed,
        runId: runResult.run_id,
      });
    }

    return parsed as T;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
