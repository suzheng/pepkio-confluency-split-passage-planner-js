# Pepkio Confluency & Split Passage Planner

Typed Node.js and TypeScript client for calculating cell culture split ratios, seeding densities, harvest yields, and passage schedules via the Pepkio Tools REST API.

# What It Does

Passaging adherent or suspension cell cultures requires precise calculation of split ratios, cell seeding densities, harvest yields, and liquid transfer volumes. Traditional laboratory protocols relying on subjective visual estimations of confluency or fixed split ratios (such as 1:3 or 1:5) frequently cause inconsistent seeding densities, erratic growth kinetics, or unintended weekend over-confluency.

This package provides a typed Node.js client and command-line interface (CLI) for the hosted Pepkio Confluency & Split/Passage Planner REST API. It models cell accumulation kinetics from doubling times ($T_d$), normalizes vessel geometry across standardized surface area specifications, computes pipetting reserve allowances, and generates actionable bench recipes programmatically.

Programmatic runs require a network connection and a Pepkio API key. Calculation algorithms and kinetics modeling are executed remotely by the Pepkio API engine.

# Features

- **Adherent & Suspension Monolayers**: Computes surface-area seeding densities (cells/cm²) for adherent cells and concentration-based volumes (cells/mL) for suspension cultures.
- **Built-In Vessel Geometry Database**: Standardized surface areas and working volumes for 96-well through 6-well plates, T-25 to T-225 flasks, and 60mm to 150mm dishes.
- **Doubling Time Growth Forecasting**: Uses exponential kinetics to predict elapsed hours or days required to reach target harvest confluency.
- **Flexible Seeding Modes**: Plan subculturing by target seeding density, target split ratio, or absolute cell target per vessel.
- **Pipetting Reserve Allowance**: Configurable liquid overhead (5% to 15%) prevents volume shortages during multi-vessel subculturing.
- **Typed ESM Client**: Full TypeScript definitions with Zod schema validation and promise-based helper methods (`planSplit`, `predictGrowth`, `getManifest`, `run`).
- **Command-Line Interface (CLI)**: Inspect manifests, list built-in examples, and execute subculturing calculations directly from your terminal.

# Installation

```bash
npm install pepkio-confluency-split-passage-planner
```

Requires Node.js 18 or newer.

# Configuration

Set an API key with **tools:run** scope before invoking `run()` or convenience helpers:

```bash
export PEPKIO_API_KEY="your-api-key"
```

Create and manage keys in your [Pepkio Account](https://www.pepkio.com/account/api-keys).

Optional configuration variables:

| Variable | Purpose |
|----------|---------|
| `PEPKIO_API_KEY` | Production API key (required for `run`) |
| `LOCAL_PEPKIO_API_KEY` | Local development key when `PEPKIO_API_BASE_URL` points to `tools.localtest.me` |
| `PEPKIO_API_BASE_URL` | API base URL (default: `https://tools.pepkio.com`) |

# Quick Example

```javascript
import { PepkioClient } from "pepkio-confluency-split-passage-planner";

const client = new PepkioClient();

// Plan a split for an 80% confluent HEK293 culture in a T-75 flask
const result = await client.planSplit({
  cellLineId: "hek293",
  vesselFormat: "T-75",
  currentConfluencyPct: 80,
  targetSeedingDensityPerCm2: 20000,
  doublingTimeH: 24,
  pipettingReservePct: 10,
});

const split = result.result?.split;
if (split) {
  console.log(`Split ratio: ${split.split_ratio_label} (actual: ${split.split_ratio})`);
  console.log(`Suspension volume per vessel: ${split.suspension_volume_per_vessel_ml} mL`);
  console.log(`Fresh media per vessel: ${split.media_volume_per_vessel_ml} mL`);
  console.log(`Hours to next passage: ${split.hours_to_next_passage?.toFixed(1)} h`);
}
```

# CLI

Inspect tool metadata and available examples:

```bash
npx pepkio-confluency-split-passage-planner manifest --examples
```

Execute a subculturing run using a built-in example:

```bash
npx pepkio-confluency-split-passage-planner run --example hek293_t75_split
```

# Typical Use Cases

- **Adherent Subculturing**: Calculating split ratios and cell suspension transfer volumes to passage confluent culture flasks (e.g. HEK293, HeLa, CHO, NIH-3T3).
- **Weekend Passage Timing**: Calculating lower initial seeding densities on Friday to ensure cultures reach 80% target confluency on Monday morning without overgrowing.
- **Vessel Format Scale-Up**: Scaling cell cultures seamlessly between vessel formats (e.g. from 6-well plates to T-75 or T-175 flasks) while preserving exact cells/cm² density.
- **Suspension Culture Maintenance**: Calculating dilution volumes to maintain suspension cell lines (e.g. Jurkat, K562) within exponential log-phase growth limits.

# Scientific Background

In mammalian cell culture, adherent cells proliferate across growth surfaces until contact inhibition or nutrient depletion halts the cell cycle. Maintaining cells within exponential log phase requires calculating the initial cell seeding density ($N_0$) and final harvest target ($N_t$) using the exponential growth model $N_t = N_0 \cdot 2^{t / T_d}$, where $T_d$ represents cell line doubling time. Subculturing protocols must account for vessel surface area differences, post-trypsinization harvest viability, and pipetting dead volumes to ensure assay reproducibility across experimental batches.

# Web Application

For researchers who prefer a graphical interface, an interactive web version is available.

Web Application: https://www.pepkio.com/tools/confluency-split-passage-planner

The web application includes visual vessel format pickers, interactive growth curves, calendar schedule projections, and downloadable bench protocols.

# Documentation and Resources

GitHub Repository: https://github.com/pepkio/pepkio-confluency-split-passage-planner-js

Web Application: https://www.pepkio.com/tools/confluency-split-passage-planner

Python client (PyPI): https://pypi.org/project/pepkio-confluency-split-passage-planner/

# About Pepkio

Pepkio (https://www.pepkio.com/) develops software tools and bioinformatics solutions for life science researchers, including laboratory calculators and analysis services (https://www.pepkio.com/cro).

A semantic, AI-native version of this document in the K2F format is available at https://k2f.dev (https://k2f.dev/v/0d00746600e20e4dbeb3e5ae3482dfe5f6f94d2499b106cce4adb60a42283530)
