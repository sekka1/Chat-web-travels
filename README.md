# Chat-web-travels

A minimal TypeScript web application built with Express.js that provides an AI chat interface for travel assistance, powered by the GitHub Copilot SDK. This application integrates with GitHub Copilot to provide intelligent responses about travel destinations and experiences, enhanced with a local knowledge base for context-aware travel advice.

## Features

- **Express.js Server**: Minimal TypeScript-based Express.js server
- **AI Travel Chat Interface**: Clean, dark-themed chat interface for travel assistance
- **GitHub Copilot SDK Integration**: Powered by GitHub Copilot for intelligent AI travel responses
- **Travel Knowledge Base Integration**: Searches local knowledge base to provide context-aware travel advice
- **Streaming Responses**: Real-time streaming of AI responses via Server-Sent Events (SSE)
- **TypeScript**: Strict type safety throughout the application
- **Linting**: ESLint configured for TypeScript
- **CI/CD**: GitHub Actions workflow for automated testing and building

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
├── .github/
│   └── workflows/
│       └── lint-and-build.yml  # CI/CD pipeline
├── dist/                      # Compiled JavaScript (generated)
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── .eslintrc.json             # ESLint configuration
└── README.md                  # This file
```

## Prerequisites

- Node.js >= 18.0.0
- npm, pnpm, or yarn
- GitHub Copilot subscription and CLI configured (required for AI functionality)

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/sekka1/Chat-web-travels.git
cd Chat-web-travels
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure GitHub Copilot

Ensure you have GitHub Copilot CLI installed and authenticated:

```bash
# Login to GitHub Copilot (if not already logged in)
gh copilot login
```

Note: The application requires an active GitHub Copilot subscription. If Copilot is not available, the application will provide fallback responses with knowledge base context.

## Development

### Run in development mode

```bash
npm run dev
```

This starts the server using `ts-node` in development mode.

### Build the application

```bash
npm run build
```

This compiles TypeScript files from `src/` to JavaScript in `dist/`.

### Run in production mode

```bash
npm start
```

This runs the compiled JavaScript from the `dist/` folder.

### Lint the code

```bash
npm run lint
```

To automatically fix linting issues:

```bash
npm run lint:fix
```

### Run tests

Run the automated unit tests:

```bash
npm test
```

The unit tests use mocks and don't require GitHub Copilot authentication. They verify:
- Copilot service initialization and shutdown
- Response handling for travel-related queries
- Context-aware responses with knowledge base integration
- Streaming functionality

#### Integration Testing with Real Copilot

To test with the actual GitHub Copilot SDK (requires authentication):

**Basic integration test** (tests simple Copilot responses):
```bash
npm run test:integration
```

**Semantic search integration test** (tests the new document ranking flow):
```bash
npm run test:integration:semantic
```

**Google Maps API integration test** (tests Google Maps API key authentication):
```bash
npm run test:integration:google-maps
```

**Requirements for integration testing:**
- Active GitHub Copilot subscription (for Copilot tests)
- GitHub CLI authenticated (`gh auth login`)
- GitHub Copilot configured (`gh copilot login`)
- Google Maps API key set as environment variable (for Google Maps test)

**Additional test commands:**
```bash
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Generate test coverage report
```

## Application Usage

1. Start the server using one of the methods above
2. Open your browser to `http://localhost:3000`
3. You'll see the Travel Chat interface with:
   - **Top area**: Displays AI responses and chat history
   - **Bottom area**: Input box for typing travel-related questions
4. Type a question about travel destinations, experiences, or advice and press Enter or click Send
5. The application will use GitHub Copilot SDK to generate intelligent responses, enhanced with relevant information from the travel knowledge base

## Example Questions

- "What are the best places to visit in Japan?"
- "Tell me about travel experiences in Iceland"
- "What should I pack for a trip to Thailand?"
- "What are some hidden gems in Europe?"
- "Best time to visit New Zealand?"

## API Endpoints

### POST /api/chat

Send a message to the AI travel assistant and receive a complete response.

**Request:**
```json
{
  "message": "Your travel question here"
}
```

**Response:**
```json
{
  "response": "AI response generated by GitHub Copilot SDK"
}
```

### POST /api/chat/stream

Send a message and receive a streaming response via Server-Sent Events (SSE).

**Request:**
```json
{
  "message": "Your travel question here"
}
```

**Response:** Server-Sent Events stream with chunks:
```
data: {"chunk":"AI response chunk"}

data: {"chunk":"more response..."}

data: [DONE]
```

### GET /api/health

Health check endpoint to verify the server is running.

**Response:**
```json
{
  "status": "ok"
}
```

## GitHub Copilot SDK Integration

This application uses the [GitHub Copilot SDK](https://github.com/github/copilot-sdk) to provide intelligent AI responses. The integration includes:

- **Semantic Document Ranking**: Uses GitHub Copilot SDK to evaluate which documents from the knowledge base are most relevant to user questions, going beyond simple keyword matching
- **Context-Aware Responses**: Searches the local knowledge base before generating responses to provide more accurate, context-specific travel advice
- **Streaming Support**: Real-time streaming of responses via Server-Sent Events
- **Model Selection**: Uses GPT-4.1 for high-quality responses
- **Graceful Fallback**: Provides informative fallback responses if Copilot is unavailable

### Documentation Resources

- [GitHub Copilot SDK Documentation](https://github.com/github/copilot-sdk)
- [Node.js Integration Guide](https://github.com/github/awesome-copilot/blob/main/cookbook/copilot-sdk/nodejs/README.md)
- [Copilot SDK Cookbook](https://github.com/github/awesome-copilot/tree/main/cookbook/copilot-sdk)

### How It Works

1. **User Question**: User sends a travel-related question via the chat interface
2. **Initial Keyword Search**: The system performs a fast keyword search on the local `data/` directory to identify candidate documents
3. **Semantic Ranking**: GitHub Copilot SDK evaluates the candidates and ranks them by semantic relevance to the question
4. **Context Enhancement**: The most relevant document snippets are included as context
5. **Copilot Generation**: The GitHub Copilot SDK generates a response using the question and context
6. **Response Display**: The response is returned to the user (streamed or complete)

This two-stage approach combines the speed of keyword search with the semantic understanding of AI:
- **Stage 1**: Fast keyword filtering on lowercased text to narrow down candidates (exact and substring matches)
- **Stage 2**: Semantic ranking by Copilot SDK to select truly relevant documents (understands synonyms, intent, context)

The result is better document selection that can:
- Find documents even when different terminology is used
- Understand the intent behind questions
- Rank by true relevance rather than just keyword frequency

The main integration points are:
- `src/copilot-service.ts`: Wrapper for GitHub Copilot SDK with initialization, session management, and document ranking
- `src/knowledge-service.ts`: Implements both simple keyword search and Copilot-enhanced semantic search
- `src/server.ts`: API endpoints that combine knowledge base search with Copilot responses

## CI/CD Pipeline

The project includes GitHub Actions workflows that automatically run on every pull request:

### Lint and Build Workflow (`.github/workflows/lint-and-build.yml`)

- **Linting**: Ensures code quality and TypeScript standards
- **Building**: Verifies the application compiles successfully
- **Testing**: Runs the unit test suite (uses mocks, no authentication required)
- **Multi-version**: Tests against Node.js 18.x and 20.x

### Integration Test Workflow (`.github/workflows/integration-test.yml`)

Runs integration tests with the real GitHub Copilot SDK to verify end-to-end functionality.

**Requirements:**
- Node.js 24.x or later (required by `@github/copilot-sdk@0.1.23`)
- Tests against Node.js 24.x in CI

**Required Setup:**

To enable integration testing in GitHub Actions, you must configure a GitHub secret:

1. **Create a Personal Access Token (PAT)**:
   - Go to GitHub Settings → Developer Settings → Personal Access Tokens → Fine-grained tokens
   - Click "Generate new token"
   - Give it a descriptive name (e.g., "Copilot Integration Tests")
   - Select your repository under "Repository access"
   - Under "Permissions" → "Account permissions", add **"Copilot Requests: Read"**
   - Generate and copy the token

2. **Add the token as a repository secret**:
   - Go to your repository → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `COPILOT_TOKEN`
   - Value: Paste the PAT you created
   - Click "Add secret"

The integration test workflow will use this token to authenticate with the GitHub Copilot SDK.

## Code Quality Standards

This project follows strict TypeScript and code quality standards:

- **TypeScript Strict Mode**: No `any` types without justification
- **ESLint**: Configured for TypeScript with recommended rules
- **JSDoc Comments**: All exported functions include documentation
- **Security**: Input validation and sanitization for user inputs

## Development Workflow

### Before Every Commit

1. Run linting: `npm run lint`
2. Run build: `npm run build`
3. Run tests: `npm test`
4. Ensure all checks pass

### Pull Request Guidelines

- Include screenshots for any GUI changes
- Ensure CI/CD pipeline passes
- Keep PRs focused on a single concern
- Update documentation for any API changes

## Contributing

1. Follow the TypeScript coding standards
2. Run linting and tests before committing
3. Keep functions small and focused
4. Document exported functions with JSDoc
5. For GUI changes, include screenshots in the PR

## License

MIT

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Linting**: ESLint
- **CI/CD**: GitHub Actions

## Environment Variables

The application supports the following environment variables:

- `PORT`: Server port (default: 3000)
- `GOOGLE_MAPS_API_KEY`: Google Maps API key for route research features (optional)

### Setting Up Environment Variables

**For Local Development**:

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your actual values:
   ```bash
   GOOGLE_MAPS_API_KEY=your-actual-api-key-here
   ```

3. The `.env` file is gitignored and will not be committed

**For GitHub Actions**:

Environment variables are automatically provided from GitHub secrets. No additional setup needed.

**For AI Agents**:

When authenticated with GitHub CLI, AI agents automatically have access to repository secrets as environment variables. See [AGENTS.md](./AGENTS.md) for details.

### GitHub Copilot Authentication

GitHub Copilot authentication is handled via the GitHub CLI (`gh copilot login`). No environment variable needed.

## Security

This application implements security best practices:

- Input validation on API endpoints
- No hardcoded secrets (uses environment variables)
- Content Security Policy headers ready for implementation
- Safe HTML rendering (no XSS vulnerabilities)
- Secrets stored in GitHub repository secrets for CI/CD
- `.env` files gitignored to prevent accidental commits
