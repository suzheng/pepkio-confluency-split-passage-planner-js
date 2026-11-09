// SPDX-License-Identifier: MIT
import { z } from "zod";

export const vesselFormatSchema = z.enum([
  "T-25",
  "T-75",
  "T-175",
  "T-225",
  "6W",
  "12W",
  "24W",
  "48W",
  "96W",
  "D100",
  "D150",
  "bioreactor",
  "custom",
]);

export const cultureModeSchema = z.enum(["adherent", "suspension"]);
export const calculationModeSchema = z.enum(["split", "growth"]);
export const growthModeSchema = z.enum(["forward", "inverse"]);
export const densityInputModeSchema = z.enum(["target_density", "split_ratio"]);
export const volumeUnitSchema = z.enum(["ml", "ul"]);

export type VesselFormat = z.infer<typeof vesselFormatSchema>;
export type CultureMode = z.infer<typeof cultureModeSchema>;
export type CalculationMode = z.infer<typeof calculationModeSchema>;
export type GrowthMode = z.infer<typeof growthModeSchema>;
export type DensityInputMode = z.infer<typeof densityInputModeSchema>;
export type VolumeUnit = z.infer<typeof volumeUnitSchema>;

export const confluencySplitPassagePlannerInputSchema = z
  .object({
    calculation: calculationModeSchema.default("split"),
    culture_mode: cultureModeSchema.default("adherent"),
    cell_line_id: z.string().optional(),
    density_at_confluence_per_cm2: z.number().positive().optional(),
    vessel_format: vesselFormatSchema.default("T-75"),
    custom_surface_area_cm2: z.number().positive().optional(),
    custom_working_volume_ml: z.number().positive().optional(),
    num_vessels: z.number().int().min(1).max(384).default(1),
    pipetting_reserve_pct: z.number().min(0).max(50).default(10),
    viability_pct: z.number().min(0).max(100).optional(),
    volume_unit: volumeUnitSchema.optional(),
    compare_vessels: z.array(z.string()).optional(),
    current_confluency_pct: z.number().min(0).max(100).optional(),
    current_cell_density_per_ml: z.number().positive().optional(),
    target_seeding_density_per_cm2: z.number().positive().optional(),
    target_cell_density_per_ml: z.number().positive().optional(),
    split_ratio: z.number().positive().optional(),
    density_input_mode: densityInputModeSchema.optional(),
    growth_mode: growthModeSchema.optional(),
    doubling_time_h: z.number().positive().optional(),
    seeding_confluency_pct: z.number().min(0).max(100).optional(),
    seeding_cell_density_per_ml: z.number().positive().optional(),
    target_confluency_pct: z.number().min(0).max(100).optional(),
    target_final_density_per_cm2: z.number().positive().optional(),
    target_final_density_per_ml: z.number().positive().optional(),
    deadline_hours: z.number().positive().optional(),
    deadline_iso: z.string().optional(),
  })
  .passthrough();

export type ConfluencySplitPassagePlannerInput = z.input<
  typeof confluencySplitPassagePlannerInputSchema
>;
export type ConfluencySplitPassagePlannerResolvedInput = z.infer<
  typeof confluencySplitPassagePlannerInputSchema
>;

export function parseRunInput(
  input: unknown,
): ConfluencySplitPassagePlannerResolvedInput {
  return confluencySplitPassagePlannerInputSchema.parse(input);
}
