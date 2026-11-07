import { ToolFrame } from "@/components/tool-frame";
import { TipCalculator } from "@/features/tip/calculator";

export const metadata = { title: "Tip calculator" };

export default function TipPage() {
  return (
    <ToolFrame slug="tip">
      <TipCalculator />
    </ToolFrame>
  );
}
