---
name: road-trip-research
description: Research things to do along a driving route from location A to location B, including restaurants, local food, points of interest, historical sites, national parks, and attractions along the way or as detours. Use when a user asks to find things to do while driving between locations.
---

# Road Trip Research Skill

Research comprehensive information about things to do, see, and eat along a driving route from one location to another.

## Overview

This skill automates the process of researching a road trip by:
1. Searching for route information from point A to point B
2. Identifying cities and towns along the route
3. Performing targeted Google searches for activities, restaurants, and attractions along the route
4. Finding points of interest, historical sites, and national parks near the route
5. Identifying worthwhile detours with distance information
6. Organizing the content by location and category
7. Saving everything in a structured format for later use

## When to Use

Use this skill when a user:
- Asks to "research things to do while driving from [location A] to [location B]"
- Wants to "find stops along a road trip route"
- Requests information about "places to eat on the way to [destination]"
- Needs "road trip planning" between two locations
- Wants to know about attractions, restaurants, or points of interest along a route

## Research Categories

The skill searches for these types of activities along the route:

| Category | Description | Example Searches |
|----------|-------------|------------------|
| **Route Overview** | General route information and cities along the way | "[origin] to [destination] route", "cities between [origin] and [destination]" |
| **Restaurants** | Notable restaurants along the route | "best restaurants along [origin] to [destination]", "famous restaurants [city] [highway]" |
| **Local Food** | Regional specialties and local dishes | "famous food [region]", "must-try food along [route]" |
| **Points of Interest** | Scenic viewpoints, roadside attractions | "roadside attractions [origin] to [destination]", "scenic stops along [route]" |
| **Historical Sites** | Historical landmarks and museums | "historical sites along [route]", "museums between [origin] and [destination]" |
| **National Parks** | National and state parks near the route | "national parks near [route]", "state parks along [highway]" |
| **Local Experiences** | Unique local experiences and tours | "things to do in [town] along [route]", "local experiences [region]" |
| **Cities Along Route** | Major cities worth stopping in | Researches individual cities using targeted searches |

## Usage

### Basic Usage

```bash
# Research a road trip route with default settings
npx tsx .github/skills/road-trip-research/scripts/research-road-trip.ts "San Francisco" "Los Angeles"
```

### Advanced Usage

```bash
# Specify number of results per search
npx tsx .github/skills/road-trip-research/scripts/research-road-trip.ts "New York" "Miami" 5

# Specify custom output directory
npx tsx .github/skills/road-trip-research/scripts/research-road-trip.ts "Seattle" "Portland" 3 ./data/scraped/seattle-portland-road-trip

# Research specific categories only
npx tsx .github/skills/road-trip-research/scripts/research-road-trip.ts "Austin" "Houston" 3 ./data/scraped/austin-houston restaurants,local-food,points-of-interest
```

### Command Syntax

```
npx tsx .github/skills/road-trip-research/scripts/research-road-trip.ts <origin> <destination> [num-results] [output-dir] [categories]
```

**Arguments:**
- `origin` (required): Starting location (city, state, or full address)
- `destination` (required): Ending location (city, state, or full address)
- `num-results` (optional): Number of results to scrape per search (default: 3)
- `output-dir` (optional): Output directory (default: ./data/scraped/[origin-slug]-to-[destination-slug]-road-trip)
- `categories` (optional): Comma-separated list of categories to research (default: all)

**Available categories:**
- `route-overview`
- `restaurants`
- `local-food`
- `points-of-interest`
- `historical-sites`
- `national-parks`
- `local-experiences`
- `cities-along-route`

## Output Structure

The skill creates a well-organized directory structure:

```
./data/scraped/[origin]-to-[destination]-road-trip/
├── route-overview/
│   ├── 1-route-guide/
│   │   └── content.md
│   └── 2-cities-along-route/
│       └── content.md
├── restaurants/
│   ├── 1-best-restaurants-along-route/
│   │   ├── content.md
│   │   └── images/
│   └── 2-famous-diners/
│       └── content.md
├── local-food/
│   ├── 1-regional-specialties/
│   │   └── content.md
│   └── 2-must-try-dishes/
│       └── content.md
├── points-of-interest/
│   ├── 1-roadside-attractions/
│   │   └── content.md
│   └── 2-scenic-stops/
│       └── content.md
├── historical-sites/
│   └── 1-historical-landmarks/
│       └── content.md
├── national-parks/
│   └── 1-parks-near-route/
│       └── content.md
├── local-experiences/
│   └── 1-unique-experiences/
│       └── content.md
├── cities-along-route/
│   ├── city-1/
│   │   └── content.md
│   └── city-2/
│       └── content.md
└── _road_trip_summary.md  # Overview of all research performed
```

## How It Works

### Step 1: Route Information

First, the skill searches for general route information:
- Main route/highway used
- Major cities along the way
- Approximate driving time and distance
- Route characteristics (scenic, historic, etc.)

### Step 2: Query Generation

For each research category, the skill generates multiple search queries:

**Example for "San Francisco to Los Angeles":**
- Route Overview: `"San Francisco to Los Angeles route guide"`, `"cities along Highway 101 California"`
- Restaurants: `"best restaurants Highway 101 California"`, `"famous restaurants San Francisco to LA"`
- Points of Interest: `"roadside attractions California coast"`, `"scenic stops San Francisco to Los Angeles"`

### Step 3: Google Search and Scrape

For each query:
1. Performs Google search
2. Filters out advertisements
3. Scrapes top N organic results
4. Extracts content and images
5. Saves to category-specific directory

### Step 4: City Research Integration

If the skill identifies major cities along the route, it can optionally:
1. Run targeted searches for those cities
2. Use the city-research skill patterns for comprehensive city coverage
3. Organize city-specific results in dedicated subdirectories

### Step 5: Summary Generation

Creates a `_road_trip_summary.md` file containing:
- Origin and destination
- Route overview (if found)
- Research date
- List of all categories researched
- Number of results per category
- Quick links to all scraped content
- Detour information (when available)

## Example Output

### _road_trip_summary.md

```markdown
# Road Trip Research: San Francisco to Los Angeles

**Route:** San Francisco, CA → Los Angeles, CA
**Research Date:** February 12, 2026
**Categories Researched:** 7
**Total Sources Scraped:** 24

---

## Route Overview

**Main Route:** Highway 101 / Pacific Coast Highway (PCH)
**Distance:** ~380 miles
**Driving Time:** ~6-7 hours (without stops)

### Major Cities Along the Way
- San Jose, CA
- Monterey, CA
- San Luis Obispo, CA
- Santa Barbara, CA

---

## Categories

### 🍽️ Restaurants (4 sources)

1. [Best Restaurants Along Highway 101](./restaurants/1-best-restaurants-along-route/content.md)
2. [Famous Diners on PCH](./restaurants/2-famous-diners/content.md)
3. [Monterey Dining Guide](./restaurants/3-monterey-dining/content.md)
4. [Santa Barbara Restaurants](./restaurants/4-santa-barbara-restaurants/content.md)

### 🌮 Local Food (3 sources)

1. [California Coastal Cuisine](./local-food/1-regional-specialties/content.md)
2. [Must-Try Dishes Along the Coast](./local-food/2-must-try-dishes/content.md)
3. [Seafood Spots on PCH](./local-food/3-seafood-spots/content.md)

### 📍 Points of Interest (4 sources)

1. [Roadside Attractions PCH](./points-of-interest/1-roadside-attractions/content.md)
   *Includes: Big Sur viewpoints, Bixby Bridge, Elephant Seal Rookery*
2. [Scenic Stops Along Highway 101](./points-of-interest/2-scenic-stops/content.md)
3. [California Coast Landmarks](./points-of-interest/3-coast-landmarks/content.md)
4. [Photo Opportunities on the Drive](./points-of-interest/4-photo-spots/content.md)

### 🏛️ Historical Sites (3 sources)

1. [Missions Along El Camino Real](./historical-sites/1-california-missions/content.md)
   *Notable detours: 5-15 minutes off route*
2. [Hearst Castle](./historical-sites/2-hearst-castle/content.md)
   *Detour: 10 miles / 20 minutes from Highway 1*
3. [Historic Sites San Luis Obispo](./historical-sites/3-slo-historic/content.md)

### 🏞️ National Parks (2 sources)

1. [Big Sur State Parks](./national-parks/1-big-sur-parks/content.md)
   *Directly on route*
2. [Pinnacles National Park](./national-parks/2-pinnacles/content.md)
   *Detour: 35 miles / 1 hour from Soledad*

[... continues for all categories ...]

---

## Recommended Stops

Based on the research, notable stops include:

1. **Monterey** - Aquarium, Cannery Row, seafood (on route)
2. **Big Sur** - Scenic viewpoints, state parks (on route)
3. **Hearst Castle** - Historic mansion tour (20 min detour)
4. **San Luis Obispo** - Mission, downtown, restaurants (on route)
5. **Santa Barbara** - Mission, beaches, wine country nearby (on route)

---

**Research powered by:**
- 🔍 Google Search (organic results only)
- 📰 Travel blogs and route guides
- 🗺️ Regional tourism sites
```

## Integration with Other Skills

This skill builds on:

1. **[Google Search and Scraper Skill](../google-search-scraper/SKILL.md)**: For search and scraping
2. **[City Research Skill](../city-research/SKILL.md)**: For city-specific research along the route

It can also integrate with the city-research skill to provide deeper coverage of cities along the route.

## Prerequisites

Same as Google Search Scraper:

```bash
# Install dependencies (already in package.json)
npm install

# Install Playwright browser
npx playwright install chromium
```

## Configuration

The script includes configurable search templates for each category:

```typescript
const SEARCH_TEMPLATES = {
  'route-overview': [
    '{origin} to {destination} route',
    'cities between {origin} and {destination}',
    '{origin} to {destination} road trip guide'
  ],
  restaurants: [
    'best restaurants along {origin} to {destination}',
    'famous restaurants {route}',
    'must-stop restaurants {origin} to {destination}'
  ],
  // ... more categories
};
```

## Best Practices

1. **Route specificity**: Use specific location names for better results
2. **Review results**: Always review scraped content for accuracy and relevance
3. **Detour decisions**: Check detour distances before planning stops
4. **Update regularly**: Route information and businesses change over time
5. **Attribution**: Maintain source attribution for all content
6. **Storage**: Archive research results in appropriate data directories

## Where to Save Road Trip Research

**IMPORTANT**: When researching road trips, organize the output in the `data/` directory:

### Option 1: Comprehensive Road Trip Research
Save to `data/scraped/[origin]-to-[destination]-road-trip/`:

```bash
npx tsx .github/skills/road-trip-research/scripts/research-road-trip.ts "San Francisco" "Los Angeles"
```

**Use when:**
- User requests full road trip research
- Planning a new route
- Building comprehensive travel guides

### Option 2: Specific Category Research
Save to `data/scraped/[origin]-to-[destination]-[category]/`:

```bash
npx tsx .github/skills/road-trip-research/scripts/research-road-trip.ts "Austin" "Houston" 3 ./data/scraped/austin-houston-food restaurants,local-food
```

**Use when:**
- User requests specific information (e.g., "find restaurants on the drive")
- Researching one or two categories
- Supplementing existing content

## Customization

### Adding New Categories

To add new research categories, edit the `SEARCH_TEMPLATES` object:

```typescript
const SEARCH_TEMPLATES = {
  // Existing categories...

  // Add new category
  'wineries': [
    'wineries along {origin} to {destination}',
    'wine tasting {route}',
    'vineyards near {origin} to {destination}'
  ],

  'camping': [
    'campgrounds along {route}',
    'camping between {origin} and {destination}'
  ]
};
```

## Use Cases

### Planning a Road Trip
Research activities, restaurants, and attractions before embarking on a drive to know where to stop.

### Finding Hidden Gems
Discover local food, roadside attractions, and unique experiences not found in typical travel guides.

### Scenic Route Planning
Find the most scenic stops, viewpoints, and photo opportunities along a route.

### Historical Tours
Research historical sites, museums, and landmarks along historic routes.

## Limitations

- **Route accuracy**: Cannot calculate exact driving routes without maps API
- **Detour distances**: Relies on web content for detour information
- **Real-time info**: Cannot check current business hours, road conditions, or closures
- **Coverage**: May miss very small towns or local spots without online presence
- **International routes**: Best suited for well-documented routes (US highways, European routes, etc.)

## Future Enhancements

Potential improvements:
- Integration with mapping APIs (Google Maps, OpenStreetMap) for accurate routes
- Automatic distance calculation for detours
- Filtering by maximum detour distance
- Weather information along the route
- Gas station and rest stop locations
- Accommodation suggestions along the way
- Route alternatives (scenic vs. fast)

## Troubleshooting

### No results for route

**Cause**: Route may not be well-documented online or locations not specific enough

**Solution**:
- Use more specific location names (include state/country)
- Try major cities near origin/destination
- Search for the main highway name if known

### Too generic results

**Cause**: Search queries may be too broad

**Solution**:
- Include highway or route name if known
- Break long routes into segments
- Use more specific category searches

## See Also

- [Google Search and Scraper Skill](../google-search-scraper/SKILL.md) - Underlying search/scrape functionality
- [City Research Skill](../city-research/SKILL.md) - For researching cities along the route
- [data/AGENTS.md](../../../data/AGENTS.md) - Knowledge base organization guidelines
