// SPDX-License-Identifier: MIT
import { PepkioClient } from "pepkio-confluency-split-passage-planner";

const client = new PepkioClient();

async function main() {
  const manifest = await client.getManifest();
  console.log(`Tool: ${manifest.title} (${manifest.tool_id})`);

  // Plan a split for an 80% confluent HEK293 culture in a T-75 flask
  const result = await client.planSplit({
    cellLineId: "hek293",
    vesselFormat: "T-75",
    currentConfluencyPct: 80,
    targetSeedingDensityPerCm2: 20000,
    doublingTimeH: 24,
    pipettingReservePct: 10,
  });

  console.log(`Run ID: ${result.run_id}`);
  console.log(`Status: ${result.status}`);

  const split = result.result?.split;
  if (split) {
    console.log(`Split ratio: ${split.split_ratio_label} (actual: ${split.split_ratio})`);
    console.log(`Suspension volume per vessel: ${split.suspension_volume_per_vessel_ml} mL`);
    console.log(`Fresh media per vessel: ${split.media_volume_per_vessel_ml} mL`);
    console.log(`Hours to next passage: ${split.hours_to_next_passage?.toFixed(1)} h`);
    console.log("\nBench recipe:");
    for (const step of split.bench_recipe) {
      console.log(`  ${step.step}. ${step.instruction}`);
    }
  }
}

main().catch(console.error);
