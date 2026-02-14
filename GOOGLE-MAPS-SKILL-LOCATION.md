# Google Maps Skill Location

## Summary

The Google Maps functionality was added to the **road-trip-research skill** located at:

```
.github/skills/road-trip-research/
```

## Details

### Repository Location

The Google Maps integration is part of the road-trip-research skill, which is one of five AI agent skills in this repository:

```
.github/skills/
├── city-research/           # Research things to do in a city
├── copilot-sdk/            # GitHub Copilot SDK skill
├── google-search-scraper/  # Google search and scraping skill
├── road-trip-research/     # ← Google Maps integration is HERE
└── web-content-scraper/    # Web content scraping skill
```

### Google Maps Files

The following Google Maps related files were added to the road-trip-research skill:

1. **`scripts/test-google-maps-api.ts`** - Main test script demonstrating Google Maps API usage
   - Uses Google Maps Directions API to get driving routes
   - Uses Google Maps Places API (Nearby Search) to find POIs along the route
   - Full path: `.github/skills/road-trip-research/scripts/test-google-maps-api.ts`

2. **`scripts/README-google-maps.md`** - Documentation for Google Maps integration
   - Explains how the Google Maps APIs work
   - Documents prerequisites and setup
   - Full path: `.github/skills/road-trip-research/scripts/README-google-maps.md`

3. **`scripts/use-google-maps-secret.md`** - Guide for using the API key
   - Instructions for accessing GitHub secrets
   - Local development setup
   - Full path: `.github/skills/road-trip-research/scripts/use-google-maps-secret.md`

4. **`scripts/verify-api-key.ts`** - API key verification utility
   - Checks if GOOGLE_MAPS_API_KEY is accessible
   - Provides troubleshooting guidance
   - Full path: `.github/skills/road-trip-research/scripts/verify-api-key.ts`

### Integration Test

A Google Maps integration test was also added:

- **`src/google-maps-api-integration.test.mjs`** - Integration test for Google Maps API authentication
- **`.github/workflows/test-google-maps-api.yml`** - CI workflow to test Google Maps API

### Git History

The Google Maps functionality was added in:

- **Commit**: `23a66f6bc9a2acc8b599b234bc19385ff3210339`
- **Pull Request**: #16
- **Title**: "Enable AI agent access to GitHub secrets via environment variables"
- **Date**: February 13, 2026

### Purpose

The Google Maps integration enables the road-trip-research skill to:

1. Get driving routes between two locations using **Google Maps Directions API**
2. Find points of interest along the route using **Google Maps Places API**
3. Generate waypoints every 50km along the route
4. Search for restaurants, tourist attractions, and parks near the route
5. Save comprehensive road trip research data

### APIs Used

The integration uses two Google Maps Platform REST APIs:

1. **Directions API**
   - Endpoint: `https://maps.googleapis.com/maps/api/directions/json`
   - Purpose: Get driving route from origin to destination
   - Documentation: https://developers.google.com/maps/documentation/directions/overview

2. **Places API - Nearby Search**
   - Endpoint: `https://maps.googleapis.com/maps/api/place/nearbysearch/json`
   - Purpose: Find points of interest near coordinates
   - Documentation: https://developers.google.com/maps/documentation/places/web-service/search-nearby

### Usage Example

```bash
# Test Google Maps API integration
npx tsx .github/skills/road-trip-research/scripts/test-google-maps-api.ts "Portland, OR" "Seattle, WA"

# Verify API key is accessible
npx tsx .github/skills/road-trip-research/scripts/verify-api-key.ts
```

### Environment Variable

The skill uses the `GOOGLE_MAPS_API_KEY` environment variable/GitHub secret to authenticate with Google Maps APIs.

## Related Documentation

- **Skill Documentation**: `.github/skills/road-trip-research/SKILL.md`
- **Google Maps Setup**: `.github/skills/road-trip-research/scripts/README-google-maps.md`
- **Secret Usage Guide**: `.github/skills/road-trip-research/scripts/use-google-maps-secret.md`
- **Main README**: `AGENTS.md` (section on "Using GitHub Secrets with AI Agents")
