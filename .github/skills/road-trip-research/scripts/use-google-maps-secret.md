# Using GitHub Secrets with AI Agents

This guide explains how to enable AI agents to use GitHub secrets, specifically for the Google Maps API key.

## The Problem

GitHub Actions workflows can access repository secrets using `${{ secrets.GOOGLE_MAPS_API_KEY }}`, but AI agents (like GitHub Copilot Workspace agents or CLI-based agents) running locally or in agent sessions need a different approach.

## Solutions

### Option 1: Environment Variables (Recommended for AI Agents)

When an AI agent needs to run a script that requires the Google Maps API key, it can access the secret through environment variables that are automatically exposed to the agent's execution environment.

**For GitHub Actions (already working):**
```yaml
- name: Run Google Maps API test
  env:
    GOOGLE_MAPS_API_KEY: ${{ secrets.GOOGLE_MAPS_API_KEY }}
  run: |
    npx tsx .github/skills/road-trip-research/scripts/test-google-maps-api.ts "Portland, OR" "Seattle, WA"
```

**For AI Agents (Copilot Workspace, CLI agents):**

AI agents running in GitHub Copilot Workspace or via GitHub CLI have access to repository secrets through the environment when the user has authenticated and has the appropriate permissions.

#### How It Works

1. **User Authentication**: The user must be authenticated with GitHub CLI:
   ```bash
   gh auth login
   ```

2. **Secret Access**: When an AI agent executes a command, it can read secrets from the environment if:
   - The user has access to the repository
   - The secret exists in the repository settings
   - The agent's execution context has been granted access

3. **Automatic Exposure**: GitHub Copilot Workspace and GitHub CLI automatically expose secrets as environment variables when executing commands in the repository context.

### Option 2: Local .env File (For Local Development)

For local development and testing outside of GitHub's environment:

1. Create a `.env` file in the project root (this file is gitignored):
   ```bash
   GOOGLE_MAPS_API_KEY=your-actual-api-key-here
   ```

2. Load it before running scripts:
   ```bash
   export $(cat .env | xargs)
   npx tsx .github/skills/road-trip-research/scripts/test-google-maps-api.ts "Portland, OR" "Seattle, WA"
   ```

### Option 3: Direct Environment Variable

Set the environment variable directly in the terminal:

```bash
export GOOGLE_MAPS_API_KEY="your-actual-api-key-here"
npx tsx .github/skills/road-trip-research/scripts/test-google-maps-api.ts "Portland, OR" "Seattle, WA"
```

Or inline with the command:

```bash
GOOGLE_MAPS_API_KEY="your-actual-api-key-here" npx tsx .github/skills/road-trip-research/scripts/test-google-maps-api.ts "Portland, OR" "Seattle, WA"
```

## Setting Up the GitHub Secret

If you haven't already set up the `GOOGLE_MAPS_API_KEY` secret:

1. **Get a Google Maps API Key**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the following APIs:
     - Directions API
     - Places API (New)
   - Create an API key in "Credentials"
   - Restrict the API key to only the APIs you need

2. **Add to GitHub Secrets**:
   - Go to your GitHub repository
   - Navigate to Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `GOOGLE_MAPS_API_KEY`
   - Value: Your Google Maps API key
   - Click "Add secret"

## How AI Agents Can Use the Secret

### Example 1: Running the Google Maps Test Script

An AI agent can execute:

```typescript
// The agent runs this command in the repository context
await bash({
  command: 'npx tsx .github/skills/road-trip-research/scripts/test-google-maps-api.ts "Portland, OR" "Seattle, WA"',
  description: 'Test Google Maps API with route from Portland to Seattle'
});
```

The script will automatically access `process.env.GOOGLE_MAPS_API_KEY` which is exposed by the execution environment.

### Example 2: Research Road Trip with Google Maps Data

```typescript
// Future enhancement: Road trip research using Google Maps API
await bash({
  command: 'npx tsx .github/skills/road-trip-research/scripts/research-road-trip-with-maps.ts "San Francisco" "Los Angeles"',
  description: 'Research road trip using Google Maps API for route data'
});
```

## Security Best Practices

1. **Never hardcode API keys** in scripts or commit them to the repository
2. **Always use environment variables** for sensitive data
3. **Rotate API keys** periodically
4. **Restrict API key permissions** to only the APIs you need
5. **Set up billing alerts** in Google Cloud to monitor API usage
6. **Use API key restrictions** in Google Cloud Console:
   - Application restrictions (e.g., HTTP referrers, IP addresses)
   - API restrictions (only allow specific APIs)

## Troubleshooting

### Verify Secret Access

Use the verification script to check if the API key is accessible:

```bash
npx tsx .github/skills/road-trip-research/scripts/verify-api-key.ts
```

This will:
- Check if `GOOGLE_MAPS_API_KEY` is set
- Display a masked version of the key
- Provide troubleshooting guidance if the key is missing
- Warn about common issues (placeholder values, unusual length, etc.)

### Secret Not Available to AI Agent

**Problem**: The script returns an error that `GOOGLE_MAPS_API_KEY` is not set.

**Solutions**:
1. Verify you're authenticated with GitHub: `gh auth login`
2. Check that the secret exists in repository settings
3. Ensure you have read access to the repository
4. For local development, use a `.env` file or export the variable manually

### API Key Not Working

**Problem**: The API returns authentication errors.

**Solutions**:
1. Verify the API key is correct in GitHub secrets
2. Ensure the required APIs are enabled in Google Cloud Console
3. Check API key restrictions aren't blocking your requests
4. Verify you haven't exceeded API quota limits

## Examples

### Verifying Secret Access

```bash
# Check if the API key is accessible
npx tsx .github/skills/road-trip-research/scripts/verify-api-key.ts

# Expected output when successful:
# ✅ GOOGLE_MAPS_API_KEY is set and accessible
#    Masked value: AIza********************lmno
#    Length: 38 characters
```

### Testing the Google Maps API

```bash
# In GitHub Actions (automatic)
# The workflow already has access via secrets

# In AI Agent session
npx tsx .github/skills/road-trip-research/scripts/test-google-maps-api.ts "New York" "Washington DC"

# Local development
export GOOGLE_MAPS_API_KEY="AIzaSy..."
npx tsx .github/skills/road-trip-research/scripts/test-google-maps-api.ts "Austin" "Houston"
```

### Using in Road Trip Research

```bash
# Future: When Google Maps integration is added to road-trip-research
npx tsx .github/skills/road-trip-research/scripts/research-road-trip.ts \
  --origin "Chicago" \
  --destination "Detroit" \
  --use-google-maps
```

## Related Documentation

- [Google Maps API Documentation](./README-google-maps.md)
- [Road Trip Research Skill](../SKILL.md)
- [GitHub CLI Authentication](https://cli.github.com/manual/gh_auth_login)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
