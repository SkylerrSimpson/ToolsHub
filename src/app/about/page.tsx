import { ArrowUpRight } from "lucide-react";
import { HubFrame } from "@/components/hub-frame";
import { Button } from "@/components/ui/button";
import { Item, ItemActions, ItemContent, ItemGroup, ItemTitle } from "@/components/ui/item";
import { Separator } from "@/components/ui/separator";
import { tools } from "@/lib/tools";

export const metadata = { title: "About" };

export default function About() {
  return (
    <HubFrame page="about">
      <h1 className="text-3xl font-semibold tracking-tight">About</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
        These are my smaller projects, updated for Next.js. The original React versions are kept
        alongside them.
      </p>
      <section id="originals" aria-labelledby="originals-heading" className="mt-10 scroll-mt-8">
        <h2 id="originals-heading" className="mb-4 text-base font-medium">
          Originals & source
        </h2>
        <div id="source" className="scroll-mt-8">
          <ItemGroup
            aria-label="Original projects"
            className="divide-y divide-border rounded-lg border bg-card"
          >
            {tools.map((tool) => (
              <Item
                key={tool.slug}
                role="listitem"
                size="sm"
                className="gap-3 rounded-none border-0 py-4"
              >
                <ItemContent className="min-w-0 basis-36">
                  <ItemTitle>{tool.name}</ItemTitle>
                </ItemContent>
                <ItemActions className="flex-wrap">
                  {tool.originalHref && (
                    <Button asChild variant="outline" size="sm">
                      <a href={tool.originalHref}>
                        Original
                        <ArrowUpRight aria-hidden />
                        <span className="sr-only">: {tool.name}</span>
                      </a>
                    </Button>
                  )}
                  <Button asChild variant="ghost" size="sm">
                    <a href={tool.originalSource}>
                      Source
                      <ArrowUpRight aria-hidden />
                      <span className="sr-only">: {tool.name}</span>
                    </a>
                  </Button>
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        </div>
      </section>
      <Separator className="my-9" />
      <section
        id="privacy"
        aria-labelledby="privacy-heading"
        className="max-w-xl scroll-mt-8 text-sm leading-relaxed text-muted-foreground"
      >
        <h2 id="privacy-heading" className="mb-3 text-base font-medium text-foreground">
          Your saved items
        </h2>
        <p>
          Saves are private to this browser, with no sign-in or device sync. Clearing cookies loses
          access. Modern and original versions have separate collections.
        </p>
        <p className="mt-3">
          Modern collections expire one year after your first visit to a tool with saves and may
          then be deleted. There is no recovery. Avoid saving sensitive information.
        </p>
        <p className="mt-3">
          Word searches go to Dictionary API; profile searches go to GitHub. Tip calculations stay
          in your browser.
        </p>
      </section>
    </HubFrame>
  );
}
