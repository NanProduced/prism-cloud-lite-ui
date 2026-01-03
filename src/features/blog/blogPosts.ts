import { parseFrontMatter } from "../docs/helpDocs";

export type BlogPostMeta = {
  title?: string;
  slug?: string;
  category?: string;
  date?: string;
  author?: string;
  image?: string;
  excerpt?: string;
};

export type BlogPost = {
  filePath: string;
  meta: BlogPostMeta;
  body: string;
};

const rawBlogPosts = import.meta.glob("/docs/blog/**/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

export const blogPosts: BlogPost[] = Object.entries(rawBlogPosts)
  .map(([filePath, source]) => {
    const { data, body } = parseFrontMatter(source);
    const meta: BlogPostMeta = {
      title: typeof data.title === "string" ? data.title : undefined,
      slug: typeof data.slug === "string" ? data.slug : undefined,
      category: typeof data.category === "string" ? data.category : undefined,
      date: typeof data.date === "string" ? data.date : undefined,
      author: typeof data.author === "string" ? data.author : undefined,
      image: typeof data.image === "string" ? data.image : undefined,
      excerpt: typeof data.excerpt === "string" ? data.excerpt : undefined,
    };

    if (meta.slug && !meta.slug.startsWith("/")) meta.slug = `/${meta.slug}`;

    return { filePath, meta, body };
  })
  .sort((a, b) => {
    const dateA = a.meta.date || "";
    const dateB = b.meta.date || "";
    return dateB.localeCompare(dateA); // Newest first
  });

export const blogPostBySlug = new Map<string, BlogPost>(
  blogPosts
    .filter((p) => p.meta.slug)
    .map((p) => [String(p.meta.slug), p]),
);
