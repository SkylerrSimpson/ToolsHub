import type { ReactNode } from "react";
import ToolFrame from "@/components/tool-frame";
import { DictionaryLayout } from "@/features/dictionary/layout";

export const metadata = {
  title: "Dictionary · Skyler Tools",
  description:
    "Look up English words, listen to pronunciations, and keep a private saved word list.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <ToolFrame slug="dictionary">
      <DictionaryLayout>{children}</DictionaryLayout>
    </ToolFrame>
  );
}
