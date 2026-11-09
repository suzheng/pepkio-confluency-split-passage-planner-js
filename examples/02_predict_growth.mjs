// SPDX-License-Identifier: MIT
import { PepkioClient } from "pepkio-confluency-split-passage-planner";

const client = new PepkioClient();

async function main() {
  // Predict time required for HeLa cells at 20% confluency to reach 80%
  const result = await client.predictGrowth({
    cellLineId: "hela",
    vesselFormat: "T-75",
    growthMode: "forward",
    doublingTimeH: 24,
    seedingConfluencyPct: 20,
    targetConfluencyPct: 80,
  });

  console.log(`Run ID: ${result.run_id}`);
  console.log(`Status: ${result.status}`);

  const growth = result.result?.growth;
  if (growth) {
    console.log(`Hours to target confluency: ${growth.hours_to_target} h`);
    console.log(`Doublings needed: ${growth.doublings_needed}`);
    console.log(`Growth curve points: ${growth.growth_curve.length}`);
  }
}

main().catch(console.error);
