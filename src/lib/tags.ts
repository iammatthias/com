// tags.ts

import { fetchExistingTagsHash, saveTagsData, generateHash } from "@lib/cloudflare.ts";

export async function parseAndMergeTags(contents) {
  const existingTagsHash = await fetchExistingTagsHash(); // Fetch the existing hash of the tags
  const newTags = parseTags(contents); // Parse new tags from contents
  const newTagsHash = generateHash(newTags); // Generate hash for new tags

  // Compare hashes and update if different
  if (newTagsHash !== existingTagsHash) {
    await saveTagsData(newTags, existingTagsHash); // Save new tags and update hash if different
  }

  return newTags; // Return the updated tags
}

function parseTags(contents) {
  const tagMap = {};
  contents.forEach((content) => {
    const { slug, tags, path, title } = content.frontmatter;
    if (tags) {
      tags.forEach((tag) => {
        tagMap[tag] = tagMap[tag] || [];
        const existingPage = tagMap[tag].find((page) => page.slug === slug);
        if (!existingPage) {
          tagMap[tag].push({ slug, path, title });
        }
      });
    }
  });
  return tagMap;
}
