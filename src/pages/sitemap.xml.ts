import { getObsidianEntries } from "@lib/github";

export async function GET() {
  let entries: { [key: string]: Entry[] } = await getObsidianEntries();

  interface Entry {
    frontmatter: {
      path: string;
      slug: string;
      updated: string;
      created: string;
    };
  }

  // Deduplicate and prepare paths for each category
  const categoryPaths = Object.values(entries)
    .flat()
    .reduce((acc: { [key: string]: string }, entry: Entry) => {
      const path = `/${entry.frontmatter.path}/`;
      acc[path] = entry.frontmatter.updated || entry.frontmatter.created; // Use the most recent date
      return acc;
    }, {});

  // Flatten all entries into a single array of {slug, lastMod} including category parents
  const allEntries = Object.values(entries)
    .flat()
    .map((entry: Entry) => ({
      slug: `/${entry.frontmatter.path}/${entry.frontmatter.slug}/`,
      lastMod: entry.frontmatter.updated || entry.frontmatter.created,
    }));

  const siteUrl = import.meta.env.SITE;

  // Additional static paths if needed
  const additionalPaths = [
    { slug: "/resume/", lastMod: new Date().toISOString() },
    // Add more static paths as necessary
  ];

  // Combine all paths: static, category, and entry paths
  const paths = [
    { slug: "/", lastMod: new Date().toISOString() }, // Site root
    ...additionalPaths,
    ...Object.keys(categoryPaths).map((path) => ({
      slug: path,
      lastMod: categoryPaths[path],
    })), // Category paths
    ...allEntries, // Individual entry paths
  ];

  const sitemap = `
    <?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${paths
        .map(
          ({ slug, lastMod }) =>
            `<url><loc>${siteUrl}${slug}</loc><lastmod>${new Date(lastMod).toISOString()}</lastmod></url>`,
        )
        .join("\n")}
    </urlset>
    `.trim();

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
