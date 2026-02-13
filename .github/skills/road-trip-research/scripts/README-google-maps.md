# Google Maps API Road Trip Research

This script uses Google Maps APIs to research things to do along a driving route.

## How It Works

1. **Get Route**: Uses Google Maps Directions API to get the driving route from origin to destination
2. **Generate Waypoints**: Samples the route every 50km to create search points
3. **Find POIs**: Uses Google Maps Places API (Nearby Search) to find:
   - Restaurants (10km radius)
   - Tourist Attractions (15km radius)
   - Parks (20km radius)
4. **Save Results**: Outputs detailed JSON file with all findings

## Prerequisites

### Google Cloud Platform Setup

1. Create a Google Cloud Platform project
2. Enable the following APIs:
   - **Directions API** - for route information
   - **Places API (New)** - for POI discovery
3. Create an API key with access to these APIs
4. Add the API key to GitHub secrets as `GOOGLE_MAPS_API_KEY`

### API Documentation

- [Directions API](https://developers.google.com/maps/documentation/directions)
- [Places API](https://developers.google.com/maps/documentation/places/web-service)

## Usage

### Via GitHub Actions (Recommended)

1. Go to Actions tab in GitHub
2. Select "Test Google Maps API" workflow
3. Click "Run workflow"
4. Enter origin and destination (or use defaults: Portland, OR → Seattle, WA)
5. Download the results artifact when complete

### Via Command Line

```bash
# Set your API key
export GOOGLE_MAPS_API_KEY=your-api-key-here

# Run the test
npx tsx .github/skills/road-trip-research/scripts/test-google-maps-api.ts "Portland, OR" "Seattle, WA"

# Results saved to: google-maps-test-results.json
```

## Output Format

The script generates `google-maps-test-results.json` with:

```json
{
  "route": {
    "origin": "Starting address",
    "destination": "Ending address",
    "distance": { "text": "174 mi", "value": 280000 },
    "duration": { "text": "3 hours 2 mins", "value": 10920 },
    "summary": "I-5 N"
  },
  "waypoints": 5,
  "pointsOfInterest": [
    {
      "type": "restaurant",
      "count": 25,
      "places": [
        {
          "name": "Restaurant Name",
          "rating": 4.5,
          "address": "123 Main St, City, State",
          "location": { "lat": 45.5155, "lng": -122.6789 }
        }
      ]
    }
  ],
  "timestamp": "2025-02-13T12:00:00.000Z"
}
```

## Rate Limiting

The script implements:
- 200ms delay between API requests
- Searches every other waypoint (to reduce API calls)
- Returns top 20 results per category

## Customization

Edit `test-google-maps-api.ts` to customize:

- **Waypoint interval**: Change `intervalKm` in `generateWaypoints()` (default: 50km)
- **Search types**: Modify `searchTypes` array with different [place types](https://developers.google.com/maps/documentation/places/web-service/supported_types)
- **Search radius**: Adjust `radius` for each search type (in meters)
- **Sampling rate**: Change `filter((_, i) => i % 2 === 0)` to search more/fewer waypoints

## API Quotas and Costs

Be aware of Google Maps API pricing:
- **Directions API**: $5.00 per 1000 requests
- **Places API (Nearby Search)**: $32.00 per 1000 requests

Each test run makes:
- 1 Directions API call
- Multiple Places API calls (depends on route length and categories)

For a typical Portland → Seattle test with 3 categories:
- ~1 Directions call = $0.005
- ~15 Places calls = $0.48
- **Total cost per test**: ~$0.49

[Google Maps Platform Pricing](https://mapsplatform.google.com/pricing/)
