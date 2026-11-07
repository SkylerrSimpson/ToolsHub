import { BookOpen, Calculator, CheckSquare, CodeXml, type LucideIcon } from "lucide-react";

type Tool = {
  slug: string;
  category: string;
  icon: LucideIcon;
  name: string;
  description: string;
  detail: string;
  href: string;
  source: string;
  originalSource: string;
  originalHref?: string;
  persists: boolean;
};

function originalUrl(value: string | undefined, port: number) {
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
  return process.env.NODE_ENV === "development" ? `http://localhost:${port}` : undefined;
}

export const tools = [
  {
    slug: "dictionary",
    category: "WORDS",
    icon: BookOpen,
    name: "Dictionary",
    description: "Find the right word. Keep the ones you want to remember.",
    detail: "Definitions, pronunciation and a personal word list.",
    href: "/dictionary",
    source: "/about#source",
    originalSource: "https://github.com/SkylerrSimpson/DictionaryApp",
    originalHref: originalUrl(process.env.NEXT_PUBLIC_ORIGINAL_DICTIONARY_URL, 4101),
    persists: true,
  },
  {
    slug: "devfinder",
    category: "DEVELOPERS",
    icon: CodeXml,
    name: "DevFinder",
    description: "Look up a GitHub profile and save it for another day.",
    detail: "Public profiles, repository counts and saved developers.",
    href: "/devfinder",
    source: "/about#source",
    originalSource: "https://github.com/SkylerrSimpson/Devfinder",
    originalHref: originalUrl(process.env.NEXT_PUBLIC_ORIGINAL_DEVFINDER_URL, 4102),
    persists: true,
  },
  {
    slug: "todo",
    category: "EVERYDAY",
    icon: CheckSquare,
    name: "TodoList",
    description: "A small list for what needs doing.",
    detail: "Add a task, check it off and keep track of what remains.",
    href: "/todo",
    source: "/about#source",
    originalSource: "https://github.com/SkylerrSimpson/TodoList",
    originalHref: originalUrl(process.env.NEXT_PUBLIC_ORIGINAL_TODO_URL, 4103),
    persists: true,
  },
  {
    slug: "tip",
    category: "NUMBERS",
    icon: Calculator,
    name: "Tip calculator",
    description: "Split a bill, including the tip.",
    detail: "Choose a percentage and see what each person owes.",
    href: "/tip",
    source: "/about#source",
    originalSource: "https://github.com/SkylerrSimpson/TipApp",
    originalHref: originalUrl(process.env.NEXT_PUBLIC_ORIGINAL_TIP_URL, 4104),
    persists: false,
  },
] as const satisfies readonly Tool[];

export type ToolSlug = (typeof tools)[number]["slug"];

export function getTool(slug: ToolSlug) {
  const tool = tools.find((item) => item.slug === slug);
  if (!tool) throw new Error(`Unknown tool: ${slug}`);
  return tool;
}
