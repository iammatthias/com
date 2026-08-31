
import { defineCollection } from "astro:content";
import {
    farfieldDocsLoader,
    farfieldPubsLoader,
    farfieldPostsLoader,
} from "./lib/farfield-content-loader";

const docs = defineCollection({ loader: farfieldDocsLoader() });
const pubs = defineCollection({ loader: farfieldPubsLoader() });
const posts = defineCollection({ loader: farfieldPostsLoader() });

export const collections = { docs, pubs, posts };
