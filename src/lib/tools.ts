import { BookOpen, Calculator, CheckSquare, CodeXml, type LucideIcon } from "lucide-react";

type Tool = {
  slug: string;
  icon: LucideIcon;
  name: string;
  description: string;
  href: string;
  originalSource: string;
  originalHref?: string;
  persists: boolean;
};

function originalUrl(value: string | undefined) {
  if (value) {
    try {
      const url = new URL(value);
      if (
        !url.username &&
        !url.password &&
        (url.protocol === "https:" ||
          (url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname)))
      ) {
        return url.href;
      }
    } catch {
      return undefined;
    }
  }
}

export const tools = [
  {
    slug: "dictionary",
    icon: BookOpen,
    name: "Dictionary",
    description: "Definitions, pronunciation and saved words.",
    href: "/dictionary",
    originalSource: "https://github.com/SkylerrSimpson/DictionaryApp/tree/maintained-original",
    originalHref: originalUrl(process.env.NEXT_PUBLIC_ORIGINAL_DICTIONARY_URL),
    persists: true,
  },
  {
    slug: "devfinder",
    icon: CodeXml,
    name: "DevFinder",
    description: "Find and save GitHub profiles.",
    href: "/devfinder",
    originalSource: "https://github.com/SkylerrSimpson/Devfinder/tree/maintained-original",
    originalHref: originalUrl(process.env.NEXT_PUBLIC_ORIGINAL_DEVFINDER_URL),
    persists: true,
  },
  {
    slug: "todo",
    icon: CheckSquare,
    name: "TodoList",
    description: "A simple list for your tasks.",
    href: "/todo",
    originalSource: "https://github.com/SkylerrSimpson/TodoList/tree/maintained-original",
    originalHref: originalUrl(process.env.NEXT_PUBLIC_ORIGINAL_TODO_URL),
    persists: true,
  },
  {
    slug: "tip",
    icon: Calculator,
    name: "Tip calculator",
    description: "Split a bill, including the tip.",
    href: "/tip",
    originalSource: "https://github.com/SkylerrSimpson/TipApp/tree/maintained-original",
    originalHref: originalUrl(process.env.NEXT_PUBLIC_ORIGINAL_TIP_URL),
    persists: false,
  },
] as const satisfies readonly Tool[];

export type ToolSlug = (typeof tools)[number]["slug"];

export function getTool(slug: ToolSlug) {
  const tool = tools.find((item) => item.slug === slug);
  if (!tool) throw new Error(`Unknown tool: ${slug}`);
  return tool;
}
