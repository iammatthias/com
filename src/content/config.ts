import { defineCollection } from "astro:content";
import { glassLoader, contentLoader, tagLoader } from "./loaders";

const glass = defineCollection({
  loader: glassLoader(),
});

const posts = defineCollection({
  loader: contentLoader({ path: "posts" }),
});

const art = defineCollection({
  loader: contentLoader({ path: "art" }),
});

const notes = defineCollection({
  loader: contentLoader({ path: "notes" }),
});

const recipes = defineCollection({
  loader: contentLoader({ path: "recipes" }),
});

const tags = defineCollection({
  loader: tagLoader(),
});

export const collections = {
  glass,
  posts,
  art,
  notes,
  recipes,
  tags,
};
