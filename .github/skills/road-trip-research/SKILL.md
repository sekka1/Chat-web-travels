---
name: road-trip-research
description: Research things to do along a driving route from location A to location B, including restaurants, local food, points of interest, historical sites, national parks, and attractions along the way or as detours. Use when a user asks to find things to do while driving between locations.
---

# Road Trip Research Skill

Research comprehensive information about things to do, see, and eat along a driving route from one location to another.

## Overview

This skill automates the process of researching a road trip by:
1. **Using Google Maps Directions API** to get the exact route from origin to destination
2. **Generating waypoints** along the route (approximately every 50km)
3. **Finding points of interest (POIs)** along the route using Google Maps Places API
4. **Creating targeted searches** for each POI found
5. **Scraping detailed information** about each location using Google Search
6. **Organizing the content** by location and category
7. **Saving everything** in a structured format for later use

**Key Difference:** This skill now anchors on Google Maps API to get real route data and POIs first, then uses Google Search to get detailed information about those specific places.

## When to Use

Use this skill when a user:
- Asks to "research things to do while driving from [location A] to [location B]"
- Wants to "find stops along a road trip route"
- Requests information about "places to eat on the way to [destination]"
- Needs "road trip planning" between two locations
- Wants to know about attractions, restaurants, or points of interest along a route

## Research Categories

The skill searches for these types of activities along the route:

| Category | Description | Google Maps Place Types | Search Radius |
|----------|-------------|------------------------|---------------|
| **Route Overview** | General route information and overview | N/A (uses Google Search only) | N/A |
| **Restaurants** | Notable restaurants, cafes, bakeries | restaurant, cafe, bakery | 10km |
| **Local Food** | Regional specialties and local dishes | restaurant, meal_takeaway, food | 10km |
| **Points of Interest** | Scenic viewpoints, tourist attractions | tourist_attraction, point_of_interest | 15km |
| **Historical Sites** | Historical landmarks, museums, churches | museum, church, synagogue, hindu_temple | 20km |
| **National Parks** | National and state parks, campgrounds | park, natural_feature, campground | 25km |
| **Local Experiences** | Unique experiences, amusement parks, zoos | tourist_attraction, amusement_park, zoo, aquarium | 15km |

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

**Prerequisites:**
- `GOOGLE_MAPS_API_KEY` environment variable must be set
- Google Cloud Platform account with Directions API and Places API enabled

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

### Step 1: Get Route from Google Maps

The skill first calls the Google Maps Directions API to get:
- Exact driving route from origin to destination
- Total distance and estimated duration
- Step-by-step navigation instructions
- Route summary (main highway/road used)

### Step 2: Generate Waypoints

Waypoints are generated approximately every 50km along the route to:
- Sample the entire route evenly
- Ensure POI coverage along the entire journey
- Avoid missing interesting locations between cities

### Step 3: Find POIs Using Google Maps

For each category, the skill:
1. Searches near each waypoint using Google Maps Places API
2. Uses category-specific place types (e.g., "restaurant", "tourist_attraction")
3. Searches within a radius appropriate for the category (10-25km)
4. Deduplicates results by name
5. Filters for well-rated places (rating ≥ 3.5)

### Step 4: Create Targeted Searches

For each POI found:
- Generates a specific search query: `[POI Name] [Location] details reviews`
- Limits to top-rated POIs to avoid overwhelming searches
- Distributes POIs across categories based on availability

### Step 5: Scrape Detailed Information

For each targeted search:
1. Performs Google search
2. Filters out advertisements
3. Scrapes top N organic results
4. Extracts content and images
5. Saves to category-specific directory

### Step 6: Generate Summary

Creates a `_road_trip_summary.md` file containing:
- Origin and destination
- Route information (distance, duration, main roads)
- Research date
- Number of POIs found per category
- List of all categories researched
- Number of results per category
- Quick links to all scraped content

## Example Output

### _road_trip_summary.md

```markdown
# Road Trip Research: San Francisco to Los Angeles

**Route:** San Francisco, CA → Los Angeles, CA
**Research Date:** February 13, 2026
**Distance:** 382 miles
**Duration:** 6 hours 15 mins
**Route:** US-101 S
**Categories Researched:** 7
**Total POIs Found:** 147
**Total Sources Scraped:** 28

---

## Categories

### 🗺️ Route Overview (3 sources)

1. [San Francisco to Los Angeles Route](./route-overview/1-route-guide/content.md)
2. [Cities Between SF and LA](./route-overview/2-cities-along-route/content.md)
3. [Highway 101 Road Trip Guide](./route-overview/3-road-trip-guide/content.md)

### 🍽️ Restaurants (6 sources) (23 POIs found)

1. [The Mission Grill San Jose](./restaurants/1-the-mission-grill/content.md) (3 images)
2. [Nepenthe Big Sur](./restaurants/2-nepenthe-big-sur/content.md) (5 images)
3. [Monterey Fish House](./restaurants/3-monterey-fish-house/content.md)
4. [San Luis Obispo Brewing](./restaurants/4-slo-brewing/content.md) (2 images)
5. [Cold Spring Tavern Santa Barbara](./restaurants/5-cold-spring-tavern/content.md) (4 images)
6. [Neptune's Net Malibu](./restaurants/6-neptunes-net/content.md) (3 images)

### 🌮 Local Food (4 sources) (18 POIs found)

1. [California Coastal Cuisine Guide](./local-food/1-coastal-cuisine/content.md)
2. [Monterey Clam Chowder Trail](./local-food/2-clam-chowder/content.md)
3. [Santa Barbara Wine Country Food](./local-food/3-wine-country-food/content.md)
4. [Malibu Seafood Fresh](./local-food/4-malibu-seafood/content.md)

### 📍 Points of Interest (7 sources) (42 POIs found)

1. [Bixby Bridge Big Sur](./points-of-interest/1-bixby-bridge/content.md) (8 images)
2. [Monterey Bay Aquarium](./points-of-interest/2-monterey-aquarium/content.md) (6 images)
3. [Elephant Seal Rookery](./points-of-interest/3-elephant-seals/content.md) (5 images)
4. [McWay Falls Big Sur](./points-of-interest/4-mcway-falls/content.md) (7 images)
5. [Santa Barbara Mission](./points-of-interest/5-sb-mission/content.md) (4 images)
6. [Getty Villa Malibu](./points-of-interest/6-getty-villa/content.md) (6 images)
7. [El Capitan State Beach](./points-of-interest/7-el-capitan/content.md) (3 images)

[... continues for all categories ...]

---

## Research Statistics

- **Total POIs found:** 147
- **Total queries performed:** 28
- **Sources scraped:** 28
- **Images downloaded:** 94

---

**Research powered by:**
- 🗺️ Google Maps API (route and POI data)
- 🔍 Google Search (detailed information)
- 📰 Travel blogs and guides
```

## Integration with Other Skills

This skill builds on:

1. **[Google Search and Scraper Skill](../google-search-scraper/SKILL.md)**: For search and scraping
2. **[City Research Skill](../city-research/SKILL.md)**: For city-specific research along the route

It can also integrate with the city-research skill to provide deeper coverage of cities along the route.

## Google Maps API Integration

This skill **requires** the Google Maps API to function. It uses two key APIs:

### Directions API
- Gets exact driving route from origin to destination
- Provides distance, duration, and step-by-step navigation
- Returns route summary (main highways/roads used)

### Places API (Nearby Search)
- Finds points of interest along the route
- Searches for specific place types (restaurants, attractions, parks, etc.)
- Returns place details including name, rating, address, and location

**Setting up the API Key:**

The Google Maps API key is stored as a GitHub secret (`GOOGLE_MAPS_API_KEY`) and is automatically available to AI agents when executing scripts in the repository context.

**For AI Agents**:
```bash
# The GOOGLE_MAPS_API_KEY secret is automatically available
npx tsx .github/skills/road-trip-research/scripts/research-road-trip.ts "Portland, OR" "Seattle, WA"
```

**For Local Development**:
```bash
# Set the environment variable
export GOOGLE_MAPS_API_KEY="your-api-key"
npx tsx .github/skills/road-trip-research/scripts/research-road-trip.ts "Portland, OR" "Seattle, WA"
```

**Documentation**:
- [Using GitHub Secrets with AI Agents](./scripts/use-google-maps-secret.md) - Comprehensive guide on secret access
- [Google Maps API Documentation](./scripts/README-google-maps.md) - API setup and usage
- [Google Maps API Test Script](./scripts/test-google-maps-api.ts) - Example implementation

## Prerequisites

**Required:**

```bash
# Install dependencies (already in package.json)
npm install

# Install Playwright browser
npx playwright install chromium
```

**Google Maps API (required)**:
- Google Cloud Platform account
- Directions API enabled
- Places API enabled
- API key stored in GitHub secrets as `GOOGLE_MAPS_API_KEY`

**Environment variable:**
```bash
export GOOGLE_MAPS_API_KEY="your-api-key"
```

## Configuration

The script includes configurable mappings for each category to Google Maps place types:

```typescript
const CATEGORY_TO_PLACE_TYPES = {
  'restaurants': { types: ['restaurant', 'cafe', 'bakery'], radius: 10000 },
  'local-food': { types: ['restaurant', 'meal_takeaway', 'food'], radius: 10000 },
  'points-of-interest': { types: ['tourist_attraction', 'point_of_interest'], radius: 15000 },
  'historical-sites': { types: ['museum', 'church', 'synagogue', 'hindu_temple'], radius: 20000 },
  'national-parks': { types: ['park', 'natural_feature', 'campground'], radius: 25000 },
  'local-experiences': { types: ['tourist_attraction', 'amusement_park', 'zoo', 'aquarium'], radius: 15000 },
};
```

You can customize:
- Place types to search for each category
- Search radius (in meters) for each category
- Number of waypoints generated (default: every 50km)
- Minimum rating filter (default: 3.5)
- Maximum POIs per category to research in detail

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

- **API costs**: Google Maps API calls incur costs (Directions API + multiple Places API calls)
- **POI coverage**: May miss very small local spots without Google Maps presence
- **Search accuracy**: Relies on Google Search results for detailed information
- **Real-time info**: Cannot check current business hours, road conditions, or temporary closures
- **API rate limits**: Includes delays between API calls to respect rate limits
- **International routes**: Best suited for well-documented routes with good Google Maps coverage

## Future Enhancements

Potential improvements:
- Cache Google Maps API results to reduce costs
- Support for multi-day trips with overnight stops
- Integration with weather APIs for seasonal recommendations
- Support for different travel modes (walking, biking, scenic routes)
- Automatic categorization of POIs by themes
- Integration with accommodation booking APIs
- Cost estimation for the entire trip

## Troubleshooting

### Missing GOOGLE_MAPS_API_KEY

**Error**: `GOOGLE_MAPS_API_KEY environment variable is required`

**Solution**:
- Set the environment variable: `export GOOGLE_MAPS_API_KEY="your-api-key"`
- For AI agents, ensure the secret is configured in GitHub repository settings
- See [use-google-maps-secret.md](./scripts/use-google-maps-secret.md) for detailed setup

### No POIs found for route

**Cause**: Route may be in remote area or waypoints too far apart

**Solution**:
- Check if locations are correctly spelled
- Reduce waypoint interval in configuration
- Try a different route with more populated areas

### API rate limit errors

**Cause**: Too many API calls in short time

**Solution**:
- Script includes built-in rate limiting (200ms between Places API calls)
- Reduce number of categories to research
- Run research in smaller batches

## See Also

- [Google Search and Scraper Skill](../google-search-scraper/SKILL.md) - Underlying search/scrape functionality
- [City Research Skill](../city-research/SKILL.md) - For researching cities along the route
- [data/AGENTS.md](../../../data/AGENTS.md) - Knowledge base organization guidelines
