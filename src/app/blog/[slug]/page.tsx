import { markdownPath } from "@/lib/ai-corpus";
import { io } from "next/cache";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { publicPostBySlug, publicPostPath, publishedPosts } from "@/lib/public-posts";

export const dynamicParams = true;

export function generateStaticParams() {
  return publishedPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  await io();
  const post = publicPostBySlug((await params).slug);
  if (!post) return {};
  const path = publicPostPath(post);
  return {
    title: `${post.title} | SkaleAgents`,
    description: post.description,
    alternates: { canonical: path, types: { "text/markdown": markdownPath(path) } },
    openGraph: {
      title: post.title,
      description: post.description,
      url: path,
      type: "article",
      publishedTime: post.date,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  await io();
  const post = publicPostBySlug((await params).slug);
  if (!post) notFound();
  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    url: `https://skaleagents.com${publicPostPath(post)}`,
    author: { "@type": "Organization", name: "SkaleAgents" },
  };

  return (
    <main className="max-w-3xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(article).replaceAll("<", "\\u003c") }} />
      <p className="text-sm text-ink-muted">
        <Link href="/blog" className="hover:text-ink hover:underline">Blog</Link>
        <span aria-hidden="true"> / </span>
        <time dateTime={post.date}>{post.date}</time>
      </p>
      <h1 className="mt-4 font-display text-[clamp(2.25rem,5vw,3.5rem)] font-semibold leading-tight tracking-tight">{post.title}</h1>
      <p className="mt-5 text-lg leading-relaxed text-ink-muted">{post.summary}</p>
      {post.sections.map((section) => (
        <section key={section.heading} className="mt-10">
          <h2 className="text-lg font-semibold">{section.heading}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph} className="mt-3 text-sm leading-relaxed text-ink-muted">{paragraph}</p>
          ))}
        </section>
      ))}
      <h2 className="mt-10 text-lg font-semibold">Keep going</h2>
      <ul className="mt-3 space-y-2 text-sm font-semibold">
        {post.links.map((link) => (
          <li key={link.href}><Link href={link.href} className="underline decoration-line underline-offset-4">{link.label}</Link></li>
        ))}
      </ul>
    </main>
  );
}
