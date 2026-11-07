import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { tools } from "@/lib/tools";

export default function Home() {
  return (
    <div className="hub-shell">
      <header className="hub-header">
        <Link href="/" className="wordmark">
          Skyler Simpson<span>/ tools</span>
        </Link>
        <nav aria-label="Main navigation">
          <Link href="/about">About these tools</Link>
          <a href="https://www.skylerrsimpson.com">
            Portfolio
            <ArrowUpRight size={14} aria-hidden />
          </a>
        </nav>
      </header>
      <main id="content" tabIndex={-1}>
        <div className="hub-intro">
          <span className="eyebrow">SMALL APPLICATIONS BY SKYLER SIMPSON</span>
          <h1>A few tools I’ve built.</h1>
          <p>
            Look up a word, find a developer, keep a list, or split a bill.
            <br className="desktop-break" />
            Built by me, ready to use.
          </p>
        </div>
        <section aria-labelledby="tools-heading">
          <div className="section-label">
            <h2 id="tools-heading">Pick a tool</h2>
            <span>Modern tools · Original versions</span>
          </div>
          <div className="tool-grid">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <article className={`tool-card card-${tool.slug}`} key={tool.slug}>
                  <div className="card-top">
                    <span className="tool-icon">
                      <Icon size={25} strokeWidth={1.6} aria-hidden />
                    </span>
                    <span className="tool-category">{tool.category}</span>
                  </div>
                  <h3>
                    <Link href={tool.href}>
                      {tool.name}
                      <ArrowUpRight size={21} aria-hidden />
                    </Link>
                  </h3>
                  <p>{tool.description}</p>
                  <span className="card-detail">{tool.detail}</span>
                  <div className="card-links">
                    <Link className="open-tool" href={tool.href}>
                      Open modern version
                      <ArrowUpRight size={15} aria-hidden />
                    </Link>
                    <a href={tool.originalHref ?? "/about#originals"}>
                      {tool.originalHref ? "Original" : "Original details"}
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
        <aside className="hub-note">
          <div>
            <h2>Modern versions, preserved originals.</h2>
            <p>
              These tools began as small React projects. Their modern versions keep the familiar
              workflows, with more attention to accessibility, reliability and maintainability.
            </p>
          </div>
          <Link href="/about">
            See what changed
            <ArrowUpRight size={17} aria-hidden />
          </Link>
        </aside>
      </main>
      <footer className="hub-footer">
        <span>Made by Skyler Simpson</span>
        <a href="https://github.com/SkylerrSimpson">
          GitHub
          <ArrowUpRight size={14} aria-hidden />
        </a>
      </footer>
    </div>
  );
}
