import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { HubFrame } from "@/components/hub-frame";
import { Button } from "@/components/ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { tools } from "@/lib/tools";

export default function Home() {
  return (
    <HubFrame page="tools">
      <div className="mb-9 sm:mb-11">
        <h1 className="text-3xl font-semibold tracking-tight">Tools</h1>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
          Apps I built while learning React, modernized with Next.js. I’ve kept the original
          versions, too.
        </p>
      </div>
      <ItemGroup
        aria-label="Applications"
        className="divide-y divide-border rounded-lg border bg-card"
      >
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Item
              key={tool.slug}
              role="listitem"
              aria-labelledby={`${tool.slug}-title`}
              className="gap-x-4 gap-y-4 rounded-none border-0 p-5 first:rounded-t-lg last:rounded-b-lg sm:items-center sm:p-6"
            >
              <ItemMedia
                variant="icon"
                className="size-10 rounded-md bg-background text-foreground"
              >
                <Icon className="size-5" strokeWidth={1.6} aria-hidden />
              </ItemMedia>
              <ItemContent className="min-w-0 basis-36 gap-1 sm:basis-48">
                <ItemTitle className="text-base">
                  <h2 id={`${tool.slug}-title`}>
                    <Link href={tool.href} className="hover:underline">
                      {tool.name}
                    </Link>
                  </h2>
                </ItemTitle>
                <ItemDescription>{tool.description}</ItemDescription>
              </ItemContent>
              <ItemActions className="w-full flex-wrap gap-2 sm:w-auto">
                <Button asChild size="sm" className="h-9">
                  <Link href={tool.href} aria-label={`Open ${tool.name}, modern version`}>
                    Modern
                    <ArrowRight aria-hidden />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="h-9">
                  <a
                    href={tool.originalHref ?? tool.originalSource}
                    aria-label={`${tool.name}, ${tool.originalHref ? "original version" : "original source on GitHub"}`}
                  >
                    {tool.originalHref ? "Original" : "Original source"}
                    <ArrowUpRight aria-hidden />
                  </a>
                </Button>
              </ItemActions>
            </Item>
          );
        })}
      </ItemGroup>
    </HubFrame>
  );
}
