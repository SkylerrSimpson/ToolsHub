import Link from "next/link";

export default function NotFound() {
  return (
    <main id="content" tabIndex={-1} className="reading-page">
      <p className="eyebrow">404</p>
      <h1>This page isn’t here.</h1>
      <p>The tool may have moved, or the link may be incomplete.</p>
      <Link className="open-tool" href="/">
        Back to all tools
      </Link>
    </main>
  );
}
