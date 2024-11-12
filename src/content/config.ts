import { defineCollection } from "astro:content";
import { glassLoader, obsidianLoader } from "./loaders";

const glass = defineCollection({
  loader: glassLoader(),
});

const posts = defineCollection({
  loader: obsidianLoader({ path: "posts" }),
});

const art = defineCollection({
  loader: obsidianLoader({ path: "art" }),
});

const notes = defineCollection({
  loader: obsidianLoader({ path: "notes" }),
});

const recipes = defineCollection({
  loader: obsidianLoader({ path: "recipes" }),
});

export const collections = {
  glass,
  posts,
  art,
  notes,
  recipes,
};
