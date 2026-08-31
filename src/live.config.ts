
import { defineLiveCollection } from "astro:content";
import {
    documentsLoader,
    feedEntriesLoader,
    publicationsLoader,
} from "./lib/farfield-loader";

const publications = defineLiveCollection({
    loader: publicationsLoader(),
});

const documents = defineLiveCollection({
    loader: documentsLoader(),
});

const feedEntries = defineLiveCollection({
    loader: feedEntriesLoader(),
});

export const collections = { publications, documents, feedEntries };
