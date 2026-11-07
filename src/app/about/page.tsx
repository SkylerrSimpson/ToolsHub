import Link from "next/link";
import { tools } from "@/lib/tools";

export const metadata = { title: "About these tools" };

export default function About() {
  return (
    <div className="reading-page">
      <Link className="back-link" href="/">
        ← All tools
      </Link>
      <main id="content" tabIndex={-1}>
        <h1>About these tools</h1>
        <p>
          I’m Skyler Simpson. This is a home for my smaller applications, with working modern
          versions and preserved originals.
        </p>
        <section>
          <h2>What changed</h2>
          <p>
            The modern tools use Next.js and TypeScript, with accessible controls and the same core
            workflows. Each tool keeps its own layout and character. Changes include clearer errors,
            keyboard access, reliable saved data and fixes to calculation and input handling.
          </p>
        </section>
        <section id="originals">
          <h2>Original versions</h2>
          <p>
            The originals keep their React interfaces and workflows. Their persistence now uses
            PostgreSQL, with documented compatibility and security changes. Original and modern
            versions have separate saved data.
          </p>
          <ul>
            {tools.map((tool) => (
              <li key={tool.slug}>
                <a href={tool.originalHref ?? tool.originalSource}>
                  {tool.name}
                  {tool.originalHref ? " original" : " original source"}
                </a>
              </li>
            ))}
          </ul>
        </section>
        <section id="privacy">
          <h2>How saving works</h2>
          <p>
            Dictionary words, GitHub profiles and tasks are stored privately for this browser. There
            is no sign-in. A browser cookie identifies your collection; it is not shared with other
            visitors.
          </p>
          <p>
            Clearing cookies, switching browsers or using another device means starting a separate
            collection. There is no account recovery or cross-device sync. The browser identity
            lasts for one year from your first save-list visit; after it expires, its collection is
            no longer accessible and may be deleted. Avoid saving sensitive information.
          </p>
          <p>
            Word searches go to Dictionary API and profile searches go to GitHub. The tip calculator
            runs entirely in your browser.
          </p>
        </section>
        <section id="source">
          <h2>Source and implementation</h2>
          <p>
            The original repositories are public. The new hub’s source will be linked here when its
            repository is published.
          </p>
          <ul>
            {tools.map((tool) => (
              <li key={tool.slug}>
                <a href={tool.originalSource}>{tool.name} on GitHub</a>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
