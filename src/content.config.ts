import { defineCollection } from "astro:content";
import { farfieldDocsLoader } from "./lib/farfield-content-loader";

const docs = defineCollection({ loader: farfieldDocsLoader() });

export const collections = { docs };
