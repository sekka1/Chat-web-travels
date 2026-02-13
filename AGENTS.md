# AGENTS.md

This file provides context and instructions for AI coding agents working on the Chat-web-travels project.

## Project Overview

Chat-web-travels is a TypeScript web application that provides an AI-powered chat interface for travel assistance, using the GitHub Copilot SDK to deliver intelligent responses about travel destinations and experiences.

## Development Environment

### Prerequisites
- Node.js >= 18.0.0
- npm, pnpm, or yarn (check package.json for specific versions)
- TypeScript
- Git
- GitHub Copilot subscription and CLI configured (required for AI functionality)

### Setup
1. Clone the repository
2. Install dependencies: `npm install` (or `pnpm install`/`yarn install`)
3. Configure GitHub Copilot: `gh copilot login`
4. Review configuration files (tsconfig.json, package.json) for project setup

## Testing Instructions

**IMPORTANT**: Always run linting and unit tests before committing and in pull requests.

### Before Every Commit
1. Run linting: `npm run lint` (or `npm run lint:fix` to auto-fix issues)
2. Run unit tests: `npm test`
3. Ensure all tests pass before committing

### In Pull Requests
- All linting checks must pass
- All unit tests must pass
- Add or update tests for any code changes
- Ensure test coverage is maintained or improved

### Integration Testing
For testing with the real GitHub Copilot SDK:
- Basic integration test: `npm run test:integration`
- Semantic search test: `npm run test:integration:semantic`
- Requirements: Active GitHub Copilot subscription, authenticated GitHub CLI

## Security Best Practices

### OWASP Top 10 Compliance
- **Injection Prevention**: Always sanitize and validate user inputs; use parameterized queries for database operations
- **Authentication & Session Management**: Implement secure authentication; never store passwords in plain text; use industry-standard libraries
- **XSS Prevention**: Sanitize all user-generated content before rendering; use Content Security Policy (CSP) headers
- **Broken Access Control**: Implement proper authorization checks; verify user permissions on server-side
- **Security Misconfiguration**: Keep all dependencies updated; remove default credentials and unnecessary features
- **Vulnerable Dependencies**: Regularly audit dependencies with `npm audit`; address critical vulnerabilities promptly
- **Insufficient Logging**: Log security-relevant events; never log sensitive data (passwords, tokens, personal information)

### Input Validation & Sanitization
- Validate all user inputs on both client and server side
- Use allowlists rather than blocklists for validation
- Sanitize data before rendering in HTML, SQL queries, or system commands
- Implement rate limiting for API endpoints to prevent abuse
- Validate file uploads: check file type, size, and content

### Authentication & Authorization
- Use secure session management and HTTP-only cookies
- Implement multi-factor authentication where appropriate
- Use bcrypt, argon2, or similar for password hashing (never MD5 or SHA1)
- Implement proper CORS policies
- Use JWT tokens securely with appropriate expiration times
- Never expose authentication tokens in URLs or logs

### Data Protection
- Encrypt sensitive data at rest and in transit (use HTTPS/TLS)
- Never commit secrets, API keys, credentials, or tokens to version control
- Use environment variables for configuration secrets
- Implement proper data retention and deletion policies
- Follow principle of least privilege for data access

### API Security
- Implement proper authentication and authorization for all endpoints
- Use HTTPS for all API communications
- Validate and sanitize all API inputs
- Implement rate limiting and throttling
- Use API versioning and deprecation strategies
- Never expose internal error details to clients

### Code Security Practices
- Avoid using `eval()`, `Function()`, or `setTimeout/setInterval` with strings
- Be cautious with `innerHTML`; prefer `textContent` or use sanitization libraries
- Implement Content Security Policy (CSP) headers
- Use security headers: X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security
- Regular security audits and penetration testing

## Code Quality Standards

### TypeScript
- Use strict mode (no `any` types without justification)
- Prefer explicit types for function parameters and return values
- Use type inference where appropriate
- Document exported functions with JSDoc comments
- Use ES modules with `.js` extensions in imports (project is configured as ESM)

### Testing
- Write unit tests for new features and bug fixes
- Maintain existing test patterns and conventions
- Test edge cases and error conditions
- Use descriptive test names that explain the expected behavior
- Include security testing for authentication, authorization, and input validation

## PR Workflow

### Pull Request Requirements
1. **Pre-commit checks**:
   - Linting must pass
   - All unit tests must pass
2. **Code review**: PRs require review before merging
3. **Commit messages**: Use clear, descriptive commit messages
4. **Testing**: Include tests with code changes

### Best Practices
- Keep PRs focused on a single concern
- Update documentation if changing functionality
- Respond to review comments promptly
- Ensure CI/CD checks pass before requesting review
- **Always include screenshots for GUI changes**: When making changes to the user interface, take a screenshot of the change and include it in the pull request description to help reviewers visualize the modifications

## Boundaries and Restrictions

### DO NOT
- Commit code without running linting and tests
- Skip tests when making code changes
- Ignore TypeScript errors or warnings
- Commit secrets, API keys, or sensitive data
- Modify dependencies without justification
- Make changes to generated or vendored files without proper understanding
- Use `eval()` or execute dynamic code from user input
- Store passwords or tokens in plain text
- Expose sensitive error messages to end users
- Disable security features or bypass security checks

### DO
- Follow existing code patterns and conventions
- Write clean, maintainable code
- Add comments for complex logic
- Keep functions small and focused
- Use meaningful variable and function names
- Use explicit `.js` extensions in imports (ESM requirement)

## Project Structure

```
chat-web-travels/
├── src/
│   ├── server.ts              # Express server with API endpoints
│   ├── copilot-service.ts     # GitHub Copilot SDK wrapper
│   └── knowledge-service.ts   # Knowledge base search service
├── public/
│   └── index.html             # Chat interface UI
├── data/                      # Travel knowledge base documents
│   ├── destinations/          # Destination guides
│   ├── guides/               # Travel guides
│   ├── tips/                 # Quick travel tips
│   └── AGENTS.md             # Knowledge base content guidelines
├── .github/
│   └── workflows/            # CI/CD pipeline
├── dist/                     # Compiled JavaScript (generated)
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── .eslintrc.json            # ESLint configuration
└── AGENTS.md                 # This file
```

## Key Features

### GitHub Copilot SDK Integration
- **Semantic Document Ranking**: Uses GitHub Copilot SDK to evaluate document relevance
- **Context-Aware Responses**: Searches local knowledge base before generating responses
- **Streaming Support**: Real-time streaming via Server-Sent Events
- **Model Selection**: Uses GPT-4.1 for high-quality responses

### Travel Knowledge Base
- Located in `data/` directory
- Contains destination guides, travel guides, and tips
- Searchable via `KnowledgeService`
- See `data/AGENTS.md` for content organization guidelines

## Development Workflow

### Build Commands
- Development mode: `npm run dev` (uses tsx)
- Build: `npm run build`
- Production: `npm start`
- Linting: `npm run lint` or `npm run lint:fix`
- Tests: `npm test`

### Adding Travel Content
- See `data/AGENTS.md` for guidelines on adding destination guides, travel tips, and other content
- Follow naming conventions (lowercase with hyphens)
- Include proper markdown formatting
- Add tags for searchability

## Using GitHub Secrets with AI Agents

AI agents can access GitHub secrets (like API keys) when executing scripts in the repository context. This is particularly useful for skills that require external API access.

### Accessing Secrets

**Environment Variables**: Secrets are exposed as environment variables when:
- You're authenticated with GitHub CLI (`gh auth login`)
- You have access to the repository
- The secret exists in repository settings

**Example**: The `GOOGLE_MAPS_API_KEY` secret is automatically available to scripts:

```typescript
// Scripts can access secrets via process.env
const apiKey = process.env.GOOGLE_MAPS_API_KEY;
if (!apiKey) {
  throw new Error('GOOGLE_MAPS_API_KEY environment variable is required');
}
```

### Using Secrets in Skills

When an AI agent executes a skill script that requires a secret:

```bash
# The environment variable is automatically available
npx tsx .github/skills/road-trip-research/scripts/test-google-maps-api.ts "Portland, OR" "Seattle, WA"
```

### For Local Development

If running scripts locally outside of the AI agent context:

1. **Option 1 - Export environment variable**:
   ```bash
   export GOOGLE_MAPS_API_KEY="your-api-key"
   npx tsx .github/skills/road-trip-research/scripts/test-google-maps-api.ts "Portland, OR" "Seattle, WA"
   ```

2. **Option 2 - Create .env file** (gitignored):
   ```bash
   echo "GOOGLE_MAPS_API_KEY=your-api-key" > .env
   export $(cat .env | xargs)
   ```

### Available Secrets

- `GOOGLE_MAPS_API_KEY`: For Google Maps API (Directions API, Places API)

### Setting Up New Secrets

To add a new secret for AI agents to use:

1. Go to repository Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Enter name (e.g., `API_KEY_NAME`) and value
4. The secret will be available to AI agents via `process.env.API_KEY_NAME`

**Security Note**: Never commit secrets to code. Always use environment variables and verify secrets are listed in `.gitignore`.

For detailed information about using the Google Maps API key with AI agents, see:
- [Using GitHub Secrets with AI Agents](.github/skills/road-trip-research/scripts/use-google-maps-secret.md)
- [Google Maps API Documentation](.github/skills/road-trip-research/scripts/README-google-maps.md)

## Additional Notes

- This project uses ES modules (`"type": "module"` in package.json)
- Internal imports must use `.js` extensions
- Code quality is enforced through linting and testing
- All contributions must maintain or improve code quality standards
- GitHub Copilot SDK integration requires authentication via GitHub CLI
