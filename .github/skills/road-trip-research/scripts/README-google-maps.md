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

This implementation uses the following Google Maps Platform REST APIs:

#### 1. Directions API
- **Overview**: https://developers.google.com/maps/documentation/directions/overview
- **Get Directions Guide**: https://developers.google.com/maps/documentation/directions/get-directions
- **REST API Reference**: https://developers.google.com/maps/documentation/directions/reference/rest
- **Usage**: Gets driving route from origin to destination with distance, duration, and step-by-step directions

#### 2. Places API - Nearby Search
- **Overview**: https://developers.google.com/maps/documentation/places/web-service/overview
- **Nearby Search Guide**: https://developers.google.com/maps/documentation/places/web-service/search-nearby
- **Supported Place Types**: https://developers.google.com/maps/documentation/places/web-service/supported_types
- **API Reference**: https://developers.google.com/maps/documentation/places/web-service/search
- **Usage**: Finds points of interest near specific coordinates along the route

#### General Documentation
- **Google Maps Platform Home**: https://developers.google.com/maps/documentation
- **JavaScript API** (reference only, not used): https://developers.google.com/maps/documentation/javascript
- **API Key Best Practices**: https://developers.google.com/maps/api-security-best-practices
- **Pricing Information**: https://mapsplatform.google.com/pricing/

#### Migration Notes
- This implementation uses the **REST APIs** for server-side integration
- The JavaScript API mentioned in some Google docs is for browser-based applications
- If migrating to newer APIs (e.g., Places API v2), refer to:
  - https://developers.google.com/maps/documentation/places/web-service/migrate-places-v1

## Usage

### Verify API Key Access (Recommended First Step)

Before using the Google Maps API, verify that your API key is properly configured:

```bash
npx tsx .github/skills/road-trip-research/scripts/verify-api-key.ts
```

This will check if `GOOGLE_MAPS_API_KEY` is accessible and provide troubleshooting guidance if needed.

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

## Technical Implementation Details

### API Endpoints Used

This script makes HTTP requests to the following Google Maps Platform endpoints:

1. **Directions API**
   - Endpoint: `https://maps.googleapis.com/maps/api/directions/json`
   - Parameters:
     - `origin`: Starting location (string)
     - `destination`: Ending location (string)
     - `mode`: Travel mode (set to "driving")
     - `key`: API key
   - Response: JSON with route information including steps, distance, duration
   - Implementation: See `getDirections()` function (line ~130)

2. **Places API - Nearby Search**
   - Endpoint: `https://maps.googleapis.com/maps/api/place/nearbysearch/json`
   - Parameters:
     - `location`: Coordinates as "lat,lng" (string)
     - `radius`: Search radius in meters (number)
     - `type`: Place type (e.g., "restaurant", "tourist_attraction", "park")
     - `key`: API key
   - Response: JSON with array of places matching criteria
   - Implementation: See `searchNearbyPlaces()` function (line ~165)

### Response Data Structures

#### Directions API Response
```typescript
{
  routes: [{
    legs: [{
      distance: { text: "174 mi", value: 280000 },
      duration: { text: "3 hours 2 mins", value: 10920 },
      start_address: "Portland, OR, USA",
      end_address: "Seattle, WA, USA",
      steps: [/* array of route steps */]
    }],
    summary: "I-5 N"
  }],
  status: "OK"
}
```

#### Places API Response
```typescript
{
  results: [{
    name: "Place Name",
    formatted_address: "123 Main St, City, State",
    rating: 4.5,
    types: ["restaurant", "food"],
    geometry: {
      location: { lat: 45.5155, lng: -122.6789 }
    },
    vicinity: "123 Main St"
  }],
  status: "OK"
}
```

### Algorithm Overview

1. **Route Retrieval**: Call Directions API to get complete route from origin to destination
2. **Waypoint Generation**: Sample the route every 50km using the Haversine formula for distance calculations
3. **POI Search**: For each category (restaurants, attractions, parks):
   - Search near every other waypoint (to reduce API calls)
   - Use category-specific search radius (10km-20km)
   - Aggregate results across all waypoints
4. **Deduplication**: Remove duplicate places based on name
5. **Output**: Save JSON with route info and top 20 places per category

### Future Enhancement Options

- **Additional Place Types**: Add more categories from the [supported types list](https://developers.google.com/maps/documentation/places/web-service/supported_types) (gas_station, lodging, museum, etc.)
- **Text Search**: Use [Text Search API](https://developers.google.com/maps/documentation/places/web-service/search-text) for specific queries
- **Place Details**: Call [Place Details API](https://developers.google.com/maps/documentation/places/web-service/details) for more information (photos, reviews, hours)
- **Distance Matrix**: Use [Distance Matrix API](https://developers.google.com/maps/documentation/distance-matrix/overview) to calculate detour distances
- **Geocoding**: Add [Geocoding API](https://developers.google.com/maps/documentation/geocoding/overview) for address validation
