# Road Trip Research Script

This directory contains the TypeScript script for the road-trip-research skill.

## Usage

### Basic Usage

Research things to do along a driving route:

```bash
npx tsx research-road-trip.ts "San Francisco" "Los Angeles"
```

### With Options

```bash
# Specify number of results per search
npx tsx research-road-trip.ts "New York" "Miami" 5

# Custom output directory
npx tsx research-road-trip.ts "Seattle" "Portland" 3 ./data/scraped/pacific-northwest

# Specific categories only
npx tsx research-road-trip.ts "Austin" "Houston" 3 ./data/scraped/tx-road-trip restaurants,local-food,points-of-interest
```

### Arguments

1. **origin** (required) - Starting location
2. **destination** (required) - Ending location
3. **num-results** (optional) - Results per search (default: 3)
4. **output-dir** (optional) - Output directory (default: ./data/scraped/[origin]-to-[destination]-road-trip)
5. **categories** (optional) - Comma-separated categories (default: all)

### Available Categories

- `route-overview` - General route information and cities along the way
- `restaurants` - Notable restaurants along the route
- `local-food` - Regional specialties and local dishes
- `points-of-interest` - Scenic viewpoints, roadside attractions
- `historical-sites` - Historical landmarks and museums
- `national-parks` - National and state parks near the route
- `local-experiences` - Unique local experiences and tours

## Output

The script creates a structured directory with:
- Category-specific subdirectories
- Scraped content in markdown format
- Downloaded images with attribution
- `_road_trip_summary.md` with overview

## Examples

See the [EXAMPLES.md](../EXAMPLES.md) file in the parent directory for more detailed usage examples.

## Documentation

See the [SKILL.md](../SKILL.md) file for complete documentation.

## Prerequisites

- Node.js >= 18
- Playwright installed: `npx playwright install chromium`
