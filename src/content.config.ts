import { defineCollection } from 'astro:content';
import { githubLoader, getGitHubCollections } from './lib/github-loader';
import { tagsLoader } from './lib/tags-loader';

// GitHub configuration
const GITHUB_OWNER = 'iammatthias';
const GITHUB_REPO = 'obsidian_cms';
const GITHUB_BRANCH = 'main';
const GITHUB_TOKEN = import.meta.env.GITHUB;

// Dynamically fetch collections from GitHub
const collectionNames = await getGitHubCollections(
  GITHUB_OWNER,
  GITHUB_REPO,
  GITHUB_TOKEN,
  GITHUB_BRANCH,
  'content'
);

// Create a collection definition for each folder
const collections = Object.fromEntries(
  collectionNames.map((collectionName) => [
    collectionName,
    defineCollection({
      loader: githubLoader({
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
        branch: GITHUB_BRANCH,
        contentPath: 'content',
        token: GITHUB_TOKEN,
      }),
    }),
  ])
);

// Add tags collection
collections.tags = defineCollection({
  loader: tagsLoader({
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    token: GITHUB_TOKEN,
    branch: GITHUB_BRANCH,
    contentPath: 'content',
  }),
});

export { collections };
