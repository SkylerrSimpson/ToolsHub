import Link from "next/link";
import { HubFrame } from "@/components/hub-frame";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <HubFrame>
      <p className="mb-2 text-sm text-muted-foreground">404</p>
      <h1 className="mb-6 text-3xl font-semibold tracking-tight">Page not found</h1>
      <Button asChild variant="outline">
        <Link href="/">Back to tools</Link>
      </Button>
    </HubFrame>
  );
}
