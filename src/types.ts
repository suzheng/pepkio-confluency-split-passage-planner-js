// SPDX-License-Identifier: MIT
import type {
  CalculationMode,
  CultureMode,
  DensityInputMode,
  GrowthMode,
  VesselFormat,
  VolumeUnit,
} from "./schemas.js";

export type RunStatus = "queued" | "running" | "completed" | "failed" | (string & {});

export interface RunOptions {
  idempotency_key?: string;
  label?: string;
  [key: string]: unknown;
}

export interface RunResult<T = ConfluencySplitPassagePlannerResult> {
  run_id: string;
  status: RunStatus;
  result?: T;
  error?: string | { message?: string; code?: string; details?: unknown } | null;
  result_url?: string;
  permalink?: string;
  duration_ms?: number;
}

export interface ManifestExample {
  name: string;
  description?: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
}

export interface ToolManifest {
  schema_version: string;
  tool_id: string;
  title: string;
  description?: string;
  tags?: string[];
  category?: string;
  execution_mode?: string;
  estimated_runtime_sec?: number;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  agent_notes?: string;
  example_prompts?: string[];
  examples?: ManifestExample[];
  limits?: Record<string, unknown>;
  input_schema?: Record<string, unknown>;
}

export interface ExampleMeta {
  name: string;
  description?: string;
}

export type {
  CalculationMode,
  CultureMode,
  DensityInputMode,
  GrowthMode,
  VesselFormat,
  VolumeUnit,
};

export type WarningLevel = "info" | "caution" | "warning" | "error" | (string & {});

export interface PlannerWarning {
  level: WarningLevel;
  code: string;
  message: string;
}

export interface BenchStep {
  step: number;
  instruction: string;
}

export interface VesselCompareRow {
  vessel_format: string;
  label: string;
  split_ratio: number | null;
  suspension_volume_ml: number | null;
  media_volume_ml: number | null;
  total_cells_needed: number | null;
}

export interface GrowthCurvePoint {
  hours: number;
  value: number;
  band_low: number;
  band_high: number;
}

export interface SplitResult {
  split_ratio: number | null;
  split_ratio_label: string | null;
  cells_at_harvest_per_vessel: number | null;
  target_cells_per_vessel: number | null;
  target_seeding_density_per_cm2: number | null;
  target_cell_density_per_ml: number | null;
  suspension_volume_per_vessel_ml: number | null;
  media_volume_per_vessel_ml: number | null;
  total_cells_needed: number | null;
  total_suspension_volume_ml: number | null;
  total_media_volume_ml: number | null;
  aspirate_volume_ml: number | null;
  hours_to_next_passage: number | null;
  bench_recipe: BenchStep[];
  vessel_comparison: VesselCompareRow[];
}

export interface GrowthResult {
  hours_to_target: number | null;
  target_date_iso: string | null;
  required_seeding_density_per_cm2: number | null;
  required_seeding_density_per_ml: number | null;
  required_seeding_confluency_pct: number | null;
  doublings_needed: number | null;
  doublings_available: number | null;
  growth_curve: GrowthCurvePoint[];
}

export interface ConfluencySplitPassagePlannerResult {
  warnings?: PlannerWarning[];
  has_blocking_errors?: boolean;
  split?: SplitResult;
  growth?: GrowthResult;
  [key: string]: unknown;
}

export class PepkioAPIError extends Error {
  readonly status: number;
  readonly body?: unknown;
  readonly runId?: string;
  readonly code?: string;

  constructor(
    message: string,
    opts: { status: number; body?: unknown; runId?: string; code?: string },
  ) {
    super(message);
    this.name = "PepkioAPIError";
    this.status = opts.status;
    this.body = opts.body;
    this.runId = opts.runId;
    this.code = opts.code;
  }
}
