import { io } from "next/cache";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/page-metadata";
import Link from "next/link";
import { publicPostPath, publishedPosts } from "@/lib/public-posts";

export const metadata: Metadata = pageMetadata({ path: "/blog", title: "Blog | SkaleAgents", description: "Notes on reviewing Terraform, what a cloud review can see, and how to hand a prompt to Claude or ChatGPT before you merge a change." });

export default async function BlogPage() {
  await io();
  const posts = publishedPosts();
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "SkaleAgents blog",
    itemListElement: posts.map((post, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: post.title,
      url: `https://skaleagents.com${publicPostPath(post)}`,
    })),
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList).replaceAll("<", "\\u003c") }} />
      <div className="mb-11 border-b border-line pb-10">
        <p className="marketing-eyebrow">Blog / Public notes</p>
        <h1 className="mt-4 max-w-3xl font-display text-[clamp(2.5rem,6vw,4.5rem)] font-semibold leading-tight tracking-tight">Notes from the review desk.</h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-muted">Short pieces on what to read in a diff, what a check can actually see, and how to get a prompt into the assistant you already use.</p>
      </div>
      <ul className="divide-y divide-line">
        {posts.map((post) => (
          <li key={post.slug} className="py-6">
            <p className="text-xs uppercase tracking-wide text-ink-muted">
              <time dateTime={post.date}>{post.date}</time>
            </p>
            <h2 className="mt-2 text-xl font-semibold">
              <Link href={publicPostPath(post)} className="hover:underline">{post.title}</Link>
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">{post.summary}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
