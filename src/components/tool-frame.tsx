import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { getTool, type ToolSlug } from "@/lib/tools";

export function ToolFrame({ slug, children }: { slug: ToolSlug; children: React.ReactNode }) {
  const tool = getTool(slug);
  return (
    <div className={`tool-frame tool-${slug}`}>
      <nav className="version-bar" aria-label="Tool versions">
        <Link href="/" className="back-link">
          <ArrowLeft size={16} aria-hidden />
          All tools
        </Link>
        <span className="version-name">
          {tool.name}
          <span className="version-label">Modern</span>
        </span>
        <a href={tool.originalHref ?? "/about#originals"} className="original-link">
          {tool.originalHref ? "Original version" : "About the original"}
          <ArrowUpRight size={15} aria-hidden />
        </a>
      </nav>
      <main id="content" tabIndex={-1} className="tool-content">
        {children}
      </main>
      {tool.persists && (
        <p className="storage-note">
          Your saves are private to this browser. Clearing cookies removes access.{" "}
          <Link href="/about#privacy">How saving works</Link>
        </p>
      )}
    </div>
  );
}

export default ToolFrame;
