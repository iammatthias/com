import { fetchExistingTags, saveTagsData } from "@lib/cloudflare";

export async function parseAndMergeTags(contents) {
  const existingTags = await fetchExistingTags(); // Fetch existing tags from R2
  const newTags = parseTags(contents); // Tags from new contents based on current batch
  let isChanged = false;

  // Update and deduplicate tags based on new contents
  Object.keys(newTags).forEach((tag) => {
    const newTagContents = newTags[tag];

    // Ensure existing tag list exists
    if (!existingTags[tag]) {
      existingTags[tag] = [];
      isChanged = true;
    }

    newTagContents.forEach((newContent) => {
      const existingContentIndex = existingTags[tag].findIndex((content) => content.slug === newContent.slug);

      // If content is new, add it
      if (existingContentIndex === -1) {
        existingTags[tag].push(newContent);
        isChanged = true;
      } else {
        // If content exists but has updated information, update it
        const existingContent = existingTags[tag][existingContentIndex];
        if (existingContent.path !== newContent.path || existingContent.title !== newContent.title) {
          existingTags[tag][existingContentIndex] = newContent;
          isChanged = true;
        }
      }
    });

    // Deduplicate the tags for this batch
    existingTags[tag] = existingTags[tag].filter(
      (value, index, self) =>
        index === self.findIndex((t) => t.slug === value.slug && t.path === value.path && t.title === value.title)
    );
  });

  // Only update if there's a change
  if (isChanged) {
    await saveTagsData(existingTags);
  }

  return existingTags; // Return the updated and deduplicated tag map
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
