import Link from "next/link";
import { tools } from "@/lib/tools";

export function generateStaticParams() {
  return tools.map((t) => ({ slug: t.slug }));
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = tools.find((t) => t.slug === slug);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5 text-center"
      style={{ backgroundColor: "var(--surface-container-low)" }}
    >
      <p
        className="text-xs font-semibold tracking-widest uppercase mb-4"
        style={{ color: "var(--primary)" }}
      >
        Coming soon
      </p>
      <h1
        className="text-4xl font-bold mb-4"
        style={{ color: "var(--on-surface)", letterSpacing: "-0.02em" }}
      >
        {tool?.name ?? slug}
      </h1>
      <p className="text-base mb-8 max-w-sm" style={{ color: "var(--on-surface-sub)", lineHeight: "1.6" }}>
        This tool is on the workbench. Check back soon.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm"
        style={{
          background: "linear-gradient(45deg, var(--primary), var(--primary-container))",
          color: "#fff",
        }}
      >
        ← Back to all tools
      </Link>
    </div>
  );
}
