# GitHub Agent Configuration

This directory contains configuration for GitHub agents (AI coding assistants) working on this repository.

## Overview

GitHub agents need access to certain environment variables and secrets to execute skills that interact with external APIs. This configuration ensures agents have the necessary credentials without exposing secrets in code.

## Configuration File

**File**: `config.yml`

This file defines:
- Environment variables that should be available to agents
- Permissions for agent operations
- Skills and their required environment variables

## Environment Variables

### GOOGLE_MAPS_API_KEY

Required for skills that use the Google Maps API:

- **Used by**: `road-trip-research` skill
- **APIs**: Google Directions API, Places API (New)
- **Purpose**: Route planning, POI discovery, distance calculations

**Setup**:
1. Create a Google Maps API key with Directions API and Places API enabled
2. Add the key as a repository secret: Settings → Secrets and variables → Actions → New repository secret
3. Name: `GOOGLE_MAPS_API_KEY`
4. The agent configuration automatically maps this secret to the environment variable

## How It Works

### For GitHub Agents

When a GitHub agent (like GitHub Copilot Workspace or CLI agents) runs in this repository:

1. The agent reads `.github/agents/config.yml`
2. Repository secrets listed in the `env:` section are automatically exposed as environment variables
3. Skills can access these variables via `process.env.VARIABLE_NAME`

### Example: Running a Skill

When an AI agent executes:

```bash
npx tsx .github/skills/road-trip-research/scripts/test-google-maps-api.ts "Portland, OR" "Seattle, WA"
```

The script automatically has access to `process.env.GOOGLE_MAPS_API_KEY` because it's configured in `config.yml`.

## Testing Agent Configuration

### Verify Secret Access

Use the verification script to check if secrets are properly configured:

```bash
npx tsx .github/skills/road-trip-research/scripts/verify-api-key.ts
```

Expected output when properly configured:
```
✅ GOOGLE_MAPS_API_KEY is set and accessible
   Masked value: AIza********************lmno
   Length: 39 characters
```

### Run Integration Test

Verify the Google Maps API integration works:

```bash
npm run test:integration:google-maps
```

This test:
- Checks that `GOOGLE_MAPS_API_KEY` is accessible
- Makes a minimal API request to Google Maps Geocoding API
- Validates authentication is successful

## Local Development

For local development outside of GitHub agent context, see [AGENTS.md](../../AGENTS.md#using-github-secrets-with-ai-agents) for instructions on using `.env` files or exported environment variables.

## Adding New Environment Variables

To add a new secret for agent use:

1. **Create the GitHub secret**:
   - Go to repository Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Enter name and value

2. **Update config.yml**:
   ```yaml
   env:
     NEW_SECRET_NAME: ${{ secrets.NEW_SECRET_NAME }}
   ```

3. **Document the skill requirements**:
   ```yaml
   skills:
     - name: skill-name
       required_env:
         - NEW_SECRET_NAME
   ```

4. **Update this README** with usage instructions

## Security Best Practices

✅ **DO**:
- Use repository secrets for all sensitive data
- Document which skills require which secrets
- Test secret access with verification scripts
- Use minimal API permissions
- Set up billing alerts for paid APIs

❌ **DON'T**:
- Hardcode secrets in code or configuration files
- Commit `.env` files to the repository
- Share API keys in issues or pull requests
- Use overly permissive API keys
- Log secret values in output

## Troubleshooting

### Secret Not Available

**Problem**: Script reports `GOOGLE_MAPS_API_KEY is not set`

**Solutions**:
1. Verify the secret exists in repository settings
2. Check agent has read access to repository secrets (configured in `config.yml`)
3. Ensure you're running in a GitHub agent context or have manually set the environment variable
4. For local development, use `.env` file or export the variable

### API Authentication Fails

**Problem**: Google Maps API returns authentication errors

**Solutions**:
1. Verify the API key in GitHub secrets is correct
2. Check the required APIs are enabled in Google Cloud Console:
   - Directions API
   - Places API (New)
3. Verify API key restrictions aren't blocking requests
4. Check you haven't exceeded API quota limits

## Related Documentation

- [Using GitHub Secrets with AI Agents](../skills/road-trip-research/scripts/use-google-maps-secret.md)
- [Google Maps API Documentation](../skills/road-trip-research/scripts/README-google-maps.md)
- [Project AGENTS.md](../../AGENTS.md)
- [GitHub Actions Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

## Skills Reference

### road-trip-research

**Location**: `.github/skills/road-trip-research/`

**Description**: Research things to do along a driving route from location A to location B

**Required Environment Variables**:
- `GOOGLE_MAPS_API_KEY`

**APIs Used**:
- Google Directions API (route planning)
- Google Places API Nearby Search (POI discovery)

**Usage**:
```bash
npx tsx .github/skills/road-trip-research/scripts/research-road-trip.ts "Origin City" "Destination City"
```

### Other Skills

Other skills (city-research, google-search-scraper, web-content-scraper) don't currently require environment variables but are listed in the configuration for reference.
