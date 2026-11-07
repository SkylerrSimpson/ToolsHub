import type { ReactNode } from "react";
import ToolFrame from "@/components/tool-frame";
import { DevfinderLayout } from "@/features/devfinder/layout";

export const metadata = {
  title: "Devfinder · Skyler Tools",
  description: "Look up GitHub profiles and keep a private list of developers in this browser.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <ToolFrame slug="devfinder">
      <DevfinderLayout>{children}</DevfinderLayout>
    </ToolFrame>
  );
}
