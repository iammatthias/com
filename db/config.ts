import { defineDb, defineTable, column } from "astro:db";

const Posts = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    title: column.text(),
    slug: column.text(),
    path: column.text(),
  },
});

const Tags = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    name: column.text(),
  },
});

const PostTags = defineTable({
  columns: {
    postId: column.number({ references: () => Posts.columns.id }),
    tagId: column.number({ references: () => Tags.columns.id }),
  },
});

export default defineDb({
  tables: { Posts, Tags, PostTags },
});
