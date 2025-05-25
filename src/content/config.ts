import { defineCollection } from "astro:content";
import { contentLoader, tagLoader } from "./loaders";

// Define a dynamic content collection that will handle all content types
const content = defineCollection({
  loader: contentLoader(),
});

const tags = defineCollection({
  loader: tagLoader(),
});

export const collections = {
  content,
  tags,
};
