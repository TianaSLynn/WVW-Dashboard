import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { data: post } = await supabase
    .from("blog_posts")
    .select("title, meta_description")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (!post) return { title: "Not Found" };

  return {
    title: `${post.title} — WVW Academy`,
    description: post.meta_description ?? undefined,
  };
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  const { data: post } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (!post) notFound();

  const date = new Date(post.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Convert markdown to basic HTML (headings, bold, lists, paragraphs)
  const rendered = markdownToHtml(post.content_markdown);

  return (
    <main className="min-h-screen" style={{ background: "#F9F5ED" }}>
      <header style={{ background: "#1C3A2A" }} className="px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <Link href="/blog" style={{ color: "#B8A06A" }} className="text-sm hover:underline">
            ← All Posts
          </Link>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-8">
          <time style={{ color: "#B8A06A" }} className="text-xs font-mono tracking-wider uppercase">
            {date}
          </time>
          {post.theme && (
            <span
              style={{ background: "#1C3A2A", color: "#F9F5ED" }}
              className="ml-3 text-xs px-2 py-0.5 rounded-full font-mono"
            >
              {post.theme}
            </span>
          )}
          <h1 className="mt-3 text-4xl font-serif font-semibold leading-tight" style={{ color: "#1C3A2A" }}>
            {post.title}
          </h1>
          {post.meta_description && (
            <p className="mt-3 text-lg leading-relaxed" style={{ color: "#3D3935", opacity: 0.75 }}>
              {post.meta_description}
            </p>
          )}
        </div>

        <div
          className="prose max-w-none"
          style={{ color: "#3D3935" }}
          dangerouslySetInnerHTML={{ __html: rendered }}
        />

        <div className="mt-16 pt-8 border-t" style={{ borderColor: "#E8E1D6" }}>
          <p style={{ color: "#B8A06A" }} className="text-sm font-mono tracking-wider uppercase mb-3">
            Wholistic Vibes Wellness
          </p>
          <p className="text-base" style={{ color: "#3D3935" }}>
            WVW helps organizations build sustainable cultures where Black professionals and neurodivergent leaders can do their best work.
          </p>
          <a
            href="https://wvwacademy.com"
            style={{ color: "#1C3A2A", background: "#B8A06A" }}
            className="mt-4 inline-block px-5 py-2.5 rounded font-medium text-sm hover:opacity-90"
          >
            Work With Us →
          </a>
        </div>
      </article>

      <footer style={{ background: "#1C3A2A", color: "#F9F5ED" }} className="px-6 py-8 mt-12">
        <div className="max-w-3xl mx-auto text-center text-sm opacity-70">
          © {new Date().getFullYear()} Wholistic Vibes Wellness · wvwacademy.com
        </div>
      </footer>
    </main>
  );
}

function markdownToHtml(md: string): string {
  return md
    // Headings
    .replace(/^### (.+)$/gm, '<h3 style="font-family:var(--font-cormorant);font-size:1.4rem;font-weight:600;color:#1C3A2A;margin:2rem 0 0.75rem">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-family:var(--font-cormorant);font-size:1.75rem;font-weight:600;color:#1C3A2A;margin:2.5rem 0 1rem">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-family:var(--font-cormorant);font-size:2.25rem;font-weight:700;color:#1C3A2A;margin:0 0 1rem">$1</h1>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#1C3A2A">$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li style="margin:0.35rem 0 0.35rem 1.25rem;list-style-type:disc">$1</li>')
    // Wrap consecutive li in ul
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g, (m) => `<ul style="margin:1rem 0">${m}</ul>`)
    // Blockquote
    .replace(/^> (.+)$/gm, '<blockquote style="border-left:3px solid #B8A06A;padding-left:1rem;margin:1.5rem 0;color:#3D3935;font-style:italic">$1</blockquote>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #E8E1D6;margin:2rem 0">')
    // Paragraphs (blank-line separated)
    .split(/\n{2,}/)
    .map((block) => {
      if (block.startsWith('<')) return block;
      return `<p style="line-height:1.8;margin:1rem 0">${block.replace(/\n/g, ' ')}</p>`;
    })
    .join('\n');
}
