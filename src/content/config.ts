import { defineCollection } from "astro:content";
import { glassLoader, contentLoader, tagLoader } from "./loaders";

const glass = defineCollection({
  loader: glassLoader(),
});

// Define a dynamic content collection that will handle all content types
const content = defineCollection({
  loader: contentLoader(),
});

const tags = defineCollection({
  loader: tagLoader(),
});

export const collections = {
  glass,
  content,
  tags,
};
