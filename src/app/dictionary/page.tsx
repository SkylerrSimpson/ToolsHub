import { Suspense } from "react";
import { DictionarySearch } from "@/features/dictionary/search";

export default function Page() {
  return (
    <Suspense fallback={<p role="status">Opening dictionary…</p>}>
      <DictionarySearch />
    </Suspense>
  );
}
