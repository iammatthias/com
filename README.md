# SvelteKit Content from GitHub

This project is a SvelteKit website that fetches content from a private GitHub repository. It uses the GitHub API to retrieve markdown files and supports incremental static regeneration (ISR) for performance.

## Features

- Dynamic content loading from a private GitHub repository
- Automatic hiding of routes with no published content
- Incremental Static Regeneration (ISR) for better performance
- Multi-level caching system for optimized content delivery
- Parallel processing of GitHub content for faster loading
- GitHub webhook integration for automatic cache invalidation
- Markdown rendering with frontmatter support
- Tag-based categorization of content
- Glass.photo API integration

## Content Structure

The content is organized into four main collections in the GitHub repository:

- `posts` - Blog posts
- `art` - Art gallery items
- `notes` - General notes/thoughts
- `recipes` - Food recipes

Each markdown file should have frontmatter with at least these fields:

```yaml
---
title: Title of the content
slug: url-friendly-slug
created: 2023-01-01T12:00:00Z
updated: 2023-01-02T12:00:00Z
published: true
tags: [tag1, tag2]
---
Content in markdown format goes here...
```

## Setup Instructions

1. Clone the repository

   ```bash
   git clone <repository-url>
   cd <project-folder>
   ```

2. Install dependencies

   ```bash
   npm install
   # or
   yarn
   # or
   bun install
   ```

3. Create a `.env` file based on `.env.example`

   ```bash
   cp .env.example .env
   ```

4. Add your GitHub personal access token to the `.env` file

   - Create a token at https://github.com/settings/tokens
   - Ensure it has `repo` scope for private repository access

5. (Optional) Configure GitHub webhook for automatic cache invalidation

   - Go to your GitHub repository settings > Webhooks > Add webhook
   - Set the Payload URL to `https://your-site.com/api/github-webhook`
   - Set Content type to `application/json`
   - Generate a secure random string for the secret
   - Add this secret to your `.env` as `GITHUB_WEBHOOK_SECRET`
   - Select "Just the push event" (or choose specific events)
   - Ensure "Active" is checked and save

6. Run the development server

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   bun dev
   ```

7. Visit http://localhost:5173 in your browser

## Performance Optimizations

This project includes several optimizations for content delivery:

1. **Multi-level caching system**:

   - In-memory cache for GitHub API responses
   - Route-level ISR caching for rendered pages
   - Configurable cache durations

2. **Parallel content processing**:

   - Processes multiple GitHub files simultaneously
   - Uses batched requests to avoid rate limiting

3. **Webhook-based cache invalidation**:

   - Automatically updates content when changes are pushed to GitHub
   - Supports targeted invalidation for specific content types

4. **Developer tools**:
   - Cache management interface in the developer dashboard
   - Manual cache clearing options
   - GitHub connection testing

## Deployment

The project uses Incremental Static Regeneration (ISR) which requires an adapter that supports this feature. The default adapter in the project configuration should be updated based on your deployment target.

## Environment Variables

- `GITHUB_TOKEN` - GitHub personal access token with repo scope
- `GITHUB_REPO_OWNER` - Owner of the GitHub repository
- `GITHUB_REPO_NAME` - Name of the GitHub repository
- `GITHUB_CONTENT_PATH` - Path to content within the repository (default: "content")
- `GITHUB_WEBHOOK_SECRET` - (Optional) Secret for validating GitHub webhooks
- `GLASS_API_KEY` - (Optional) Glass.photo API key for integrating with Glass Photo

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
