# Road Trip Research Skill - Usage Examples

This document provides practical examples for using the road-trip-research skill.

## Quick Start

### Example 1: Research a Full Road Trip

```bash
npx tsx .github/skills/road-trip-research/scripts/research-road-trip.ts "San Francisco" "Los Angeles"
```

This will:
- Search for route information from San Francisco to Los Angeles
- Research all categories (route overview, restaurants, local food, points of interest, historical sites, national parks, local experiences)
- Scrape top 3 results per search query
- Save to `./data/scraped/san-francisco-to-los-angeles-road-trip/`
- Generate a road trip summary

### Example 2: Research with More Results

```bash
npx tsx .github/skills/road-trip-research/scripts/research-road-trip.ts "New York" "Miami" 5
```

This will scrape 5 results per search instead of 3, giving you more comprehensive information about the East Coast route.

### Example 3: Research Specific Categories Only

```bash
npx tsx .github/skills/road-trip-research/scripts/research-road-trip.ts "Austin" "Houston" 3 ./data/scraped/austin-houston-trip restaurants,local-food,points-of-interest
```

This researches only:
- Restaurants along the route
- Local food specialties
- Points of interest

And saves the output to a custom directory.

## Common Road Trip Routes

### West Coast USA

```bash
# Pacific Coast Highway - Full research
npx tsx .github/skills/road-trip-research/scripts/research-road-trip.ts "Seattle" "San Diego" 4 ./data/scraped/pacific-coast-highway
```

This researches the famous West Coast drive, including stops in Portland, San Francisco, Big Sur, Los Angeles.

### Historic Route 66

```bash
# Route 66 segment
npx tsx .github/skills/road-trip-research/scripts/research-road-trip.ts "Chicago" "Santa Monica" 5 ./data/scraped/route-66-research
```

### East Coast

```bash
# I-95 Corridor
npx tsx .github/skills/road-trip-research/scripts/research-road-trip.ts "Boston" "Washington DC" 3 ./data/scraped/boston-dc-trip
```

### Southwest USA

```bash
# Desert and National Parks
npx tsx .github/skills/road-trip-research/scripts/research-road-trip.ts "Las Vegas" "Grand Canyon" 3 ./data/scraped/vegas-grand-canyon national-parks,points-of-interest,restaurants
```

## Category-Specific Examples

### Food-Focused Road Trip

```bash
# Research only food-related categories
npx tsx .github/skills/road-trip-research/scripts/research-road-trip.ts "New Orleans" "Memphis" 5 ./data/scraped/nola-memphis-food restaurants,local-food
```

Focuses on:
- Restaurants (BBQ joints, diners, fine dining)
- Local food (regional specialties, must-try dishes)

### Historical Route

```bash
# Focus on history and culture
npx tsx .github/skills/road-trip-research/scripts/research-road-trip.ts "Philadelphia" "Williamsburg" 3 ./data/scraped/colonial-america historical-sites,local-experiences,points-of-interest
```

Includes:
- Historical sites (battlefields, museums, monuments)
- Local experiences (historical reenactments, tours)
- Points of interest (historic landmarks)

### Nature and Parks

```bash
# National parks and scenic stops
npx tsx .github/skills/road-trip-research/scripts/research-road-trip.ts "Denver" "Yellowstone" 4 ./data/scraped/rocky-mountain-trip national-parks,points-of-interest
```

### Weekend Getaway

```bash
# Quick trip research
npx tsx .github/skills/road-trip-research/scripts/research-road-trip.ts "Portland" "Seattle" 2 ./data/scraped/portland-seattle-weekend
```

Researches a short route with fewer results per category for a quick weekend trip.

## Regional Examples

### California Coastal Drive

```bash
# Comprehensive coastal research
npx tsx .github/skills/road-trip-research/scripts/research-road-trip.ts "San Francisco" "San Diego" 5 ./data/scraped/california-coast
```

### Texas Hill Country

```bash
# Texas BBQ and wine country
npx tsx .github/skills/road-trip-research/scripts/research-road-trip.ts "Austin" "San Antonio" 4 ./data/scraped/texas-hill-country restaurants,local-food,local-experiences
```

### Blue Ridge Parkway

```bash
# Scenic mountain drive
npx tsx .github/skills/road-trip-research/scripts/research-road-trip.ts "Asheville" "Shenandoah National Park" 3 ./data/scraped/blue-ridge-parkway national-parks,points-of-interest,restaurants
```

### New England Fall Foliage

```bash
# Fall colors road trip
npx tsx .github/skills/road-trip-research/scripts/research-road-trip.ts "Burlington Vermont" "Portland Maine" 3 ./data/scraped/new-england-fall
```

### Florida Keys

```bash
# Overseas Highway
npx tsx .github/skills/road-trip-research/scripts/research-road-trip.ts "Miami" "Key West" 4 ./data/scraped/florida-keys restaurants,local-food,points-of-interest,local-experiences
```

## International Examples

### European Routes

```bash
# German Romantic Road
npx tsx .github/skills/road-trip-research/scripts/research-road-trip.ts "Munich" "Rothenburg" 3 ./data/scraped/romantic-road-germany

# Scottish Highlands
npx tsx .github/skills/road-trip-research/scripts/research-road-trip.ts "Edinburgh" "Isle of Skye" 4 ./data/scraped/scottish-highlands

# Italian Coast
npx tsx .github/skills/road-trip-research/scripts/research-road-trip.ts "Rome" "Amalfi Coast" 4 ./data/scraped/amalfi-coast-drive
```

### Australian Routes

```bash
# Great Ocean Road
npx tsx .github/skills/road-trip-research/scripts/research-road-trip.ts "Melbourne" "Adelaide" 5 ./data/scraped/great-ocean-road
```

### Canadian Routes

```bash
# TransCanada Highway segment
npx tsx .github/skills/road-trip-research/scripts/research-road-trip.ts "Vancouver" "Banff" 4 ./data/scraped/vancouver-banff
```

## Where to Save Road Trip Research

### Guidelines for Output Directory Selection

**Use default location `data/scraped/[origin]-to-[destination]-road-trip/` when:**
- User requests full road trip research
- First time researching a route
- Building comprehensive travel guides

Example:
```bash
npx tsx .github/skills/road-trip-research/scripts/research-road-trip.ts "Nashville" "New Orleans"
```

**Use custom location `data/scraped/[descriptive-name]/` when:**
- Route has a well-known name (Route 66, PCH, Blue Ridge Parkway)
- Combining multiple segments of a longer trip
- Creating themed road trip guides

Example:
```bash
npx tsx .github/skills/road-trip-research/scripts/research-road-trip.ts "Chicago" "Los Angeles" 5 ./data/scraped/route-66
```

**Use category-specific location when:**
- Supplementing existing road trip research
- Focused on specific aspects (just food, just parks, etc.)
- User requests specific information

Example:
```bash
npx tsx .github/skills/road-trip-research/scripts/research-road-trip.ts "Portland" "Seattle" 3 ./data/scraped/portland-seattle-food restaurants,local-food
```

## Advanced Usage Patterns

### Multi-Segment Research

For very long routes, break into segments:

```bash
# Route 66 - Segment 1
npx tsx .github/skills/road-trip-research/scripts/research-road-trip.ts "Chicago" "St Louis" 3 ./data/scraped/route-66-segment-1

# Route 66 - Segment 2
npx tsx .github/skills/road-trip-research/scripts/research-road-trip.ts "St Louis" "Oklahoma City" 3 ./data/scraped/route-66-segment-2

# Route 66 - Segment 3
npx tsx .github/skills/road-trip-research/scripts/research-road-trip.ts "Oklahoma City" "Albuquerque" 3 ./data/scraped/route-66-segment-3
```

### Combining with City Research

For routes with major cities, combine with city-research skill:

```bash
# Research the route
npx tsx .github/skills/road-trip-research/scripts/research-road-trip.ts "San Francisco" "Los Angeles"

# Then deep-dive into cities along the way
npx tsx .github/skills/city-research/scripts/research-city.ts "Monterey" 3 ./data/scraped/monterey-detailed
npx tsx .github/skills/city-research/scripts/research-city.ts "Santa Barbara" 3 ./data/scraped/santa-barbara-detailed
```

### Quick Trip Planning

For a quick weekend trip, use fewer results and specific categories:

```bash
npx tsx .github/skills/road-trip-research/scripts/research-road-trip.ts "Portland" "Cannon Beach" 2 ./data/scraped/portland-beach-weekend restaurants,points-of-interest
```

### Detour Discovery

Focus on finding unique stops and detours:

```bash
npx tsx .github/skills/road-trip-research/scripts/research-road-trip.ts "San Antonio" "Austin" 4 ./data/scraped/texas-detours points-of-interest,historical-sites,local-experiences
```

## Output Review Tips

After running the skill:

1. **Check the summary file**: Review `_road_trip_summary.md` for overview
2. **Identify key stops**: Look for highly-rated or frequently mentioned places
3. **Note detour distances**: Plan your time based on how far off-route attractions are
4. **Cross-reference sources**: Multiple sources mentioning the same place = worth visiting
5. **Check for seasonal info**: Some attractions may be seasonal

## Common Use Cases

### Planning Your First Trip on a Route

```bash
# Get comprehensive information
npx tsx .github/skills/road-trip-research/scripts/research-road-trip.ts "Denver" "Santa Fe" 5
```

Review all categories to understand what's available.

### Finding Food Stops

```bash
# Focus on dining options
npx tsx .github/skills/road-trip-research/scripts/research-road-trip.ts "Memphis" "Nashville" 4 ./data/scraped/memphis-nashville-food restaurants,local-food
```

### Discovering Nature and Parks

```bash
# Parks and scenic stops
npx tsx .github/skills/road-trip-research/scripts/research-road-trip.ts "Moab" "Denver" 3 ./data/scraped/utah-colorado-parks national-parks,points-of-interest
```

### Historical and Cultural Routes

```bash
# History-focused trip
npx tsx .github/skills/road-trip-research/scripts/research-road-trip.ts "Boston" "Philadelphia" 4 ./data/scraped/revolutionary-war-trail historical-sites,local-experiences
```

## Tips for Best Results

1. **Use specific locations**: "San Francisco, CA" works better than just "San Francisco"
2. **Include state/country**: Helps disambiguate common city names
3. **Start with full research**: Run all categories first, then drill down if needed
4. **Review and filter**: Not all results will be relevant - review the summary
5. **Combine with other skills**: Use city-research for deep dives into specific cities
6. **Update periodically**: Routes change, restaurants close, new attractions open

## Troubleshooting Examples

### If you get too generic results:

```bash
# Instead of this:
npx tsx .github/skills/road-trip-research/scripts/research-road-trip.ts "LA" "SF"

# Try this (more specific):
npx tsx .github/skills/road-trip-research/scripts/research-road-trip.ts "Los Angeles, California" "San Francisco, California" 3 ./data/scraped/california-coast-hwy1
```

### If route is too long:

```bash
# Instead of researching the entire route at once:
npx tsx .github/skills/road-trip-research/scripts/research-road-trip.ts "New York" "Los Angeles" 3

# Break into segments:
npx tsx .github/skills/road-trip-research/scripts/research-road-trip.ts "New York" "Chicago" 3 ./data/scraped/nyc-chicago
npx tsx .github/skills/road-trip-research/scripts/research-road-trip.ts "Chicago" "Denver" 3 ./data/scraped/chicago-denver
npx tsx .github/skills/road-trip-research/scripts/research-road-trip.ts "Denver" "Los Angeles" 3 ./data/scraped/denver-la
```

### If you need more details on specific stops:

After getting the overview, drill down:

```bash
# Step 1: Get overview
npx tsx .github/skills/road-trip-research/scripts/research-road-trip.ts "Seattle" "Portland"

# Step 2: Research specific cities found along the route
npx tsx .github/skills/city-research/scripts/research-city.ts "Olympia" 3 ./data/scraped/olympia-detailed
```
