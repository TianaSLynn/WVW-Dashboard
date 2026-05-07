import type { Metadata } from "next";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Blog — WVW Academy",
  description: "Thought leadership on organizational wellness, Black professional experience, and systems change from Wholistic Vibes Wellness.",
};

export default async function BlogIndex() {
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("id, created_at, title, slug, meta_description, theme")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <main className="min-h-screen" style={{ background: "#F9F5ED" }}>
      <header style={{ background: "#1C3A2A" }} className="px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <p style={{ color: "#B8A06A" }} className="text-sm tracking-widest uppercase mb-2 font-mono">
            WVW Academy
          </p>
          <h1 style={{ color: "#F9F5ED" }} className="text-4xl font-serif font-semibold">
            Insights & Perspectives
          </h1>
          <p style={{ color: "#C4A09A" }} className="mt-2 text-base">
            Organizational wellness · Black professional experience · Systems change
          </p>
        </div>
      </header>

      <section className="max-w-3xl mx-auto px-6 py-12">
        {!posts || posts.length === 0 ? (
          <p style={{ color: "#3D3935" }} className="text-center py-16 opacity-60">
            No posts published yet.
          </p>
        ) : (
          <ul className="space-y-8">
            {posts.map((post) => {
              const date = new Date(post.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              });
              return (
                <li key={post.id} className="border-b pb-8" style={{ borderColor: "#E8E1D6" }}>
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
                  <h2 className="mt-2 text-2xl font-serif font-semibold" style={{ color: "#1C3A2A" }}>
                    <Link href={`/blog/${post.slug}`} className="hover:underline decoration-[#B8A06A]">
                      {post.title}
                    </Link>
                  </h2>
                  {post.meta_description && (
                    <p className="mt-2 text-base leading-relaxed" style={{ color: "#3D3935" }}>
                      {post.meta_description}
                    </p>
                  )}
                  <Link
                    href={`/blog/${post.slug}`}
                    style={{ color: "#B8A06A" }}
                    className="mt-3 inline-block text-sm font-medium hover:underline"
                  >
                    Read more →
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <footer style={{ background: "#1C3A2A", color: "#F9F5ED" }} className="px-6 py-8 mt-12">
        <div className="max-w-3xl mx-auto text-center text-sm opacity-70">
          © {new Date().getFullYear()} Wholistic Vibes Wellness · wvwacademy.com
        </div>
      </footer>
    </main>
  );
}
