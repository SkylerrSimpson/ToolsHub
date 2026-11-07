import { Suspense } from "react";
import { ProfileSearch } from "@/features/devfinder/search";

export default function Page() {
  return (
    <Suspense fallback={<p role="status">Opening devfinder…</p>}>
      <ProfileSearch />
    </Suspense>
  );
}
