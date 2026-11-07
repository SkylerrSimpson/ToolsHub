import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function HubFrame({
  children,
  page,
}: {
  children: React.ReactNode;
  page?: "tools" | "about";
}) {
  return (
    <div className="hub-theme bg-background text-foreground">
      <div className="mx-auto flex min-h-svh w-full max-w-4xl flex-col px-5 sm:px-8">
        <header className="flex min-h-20 flex-wrap items-center justify-between gap-x-4 gap-y-2 py-4">
          <Link href="/" className="text-sm font-semibold tracking-tight">
            Skyler Simpson
          </Link>
          <nav aria-label="Main navigation" className="flex items-center gap-1">
            <Button asChild variant="ghost" size="sm">
              <Link
                href="/"
                aria-current={page === "tools" ? "page" : undefined}
                className="aria-[current=page]:bg-muted"
              >
                Tools
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link
                href="/about"
                aria-current={page === "about" ? "page" : undefined}
                className="aria-[current=page]:bg-muted"
              >
                About
              </Link>
            </Button>
          </nav>
        </header>
        <Separator />
        <main id="content" tabIndex={-1} className="flex-1 py-10 sm:py-14">
          {children}
        </main>
        <Separator />
        <footer className="flex flex-wrap items-center justify-between gap-2 py-5 text-sm text-muted-foreground">
          <span>skylerrsimpson.com</span>
          <div className="-mr-3 flex items-center gap-1">
            <Button asChild variant="ghost" size="sm">
              <a href="https://github.com/SkylerrSimpson">GitHub</a>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <a href="https://www.skylerrsimpson.com">Portfolio</a>
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
