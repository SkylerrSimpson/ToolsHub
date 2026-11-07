import { api } from "@/server/production";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  return api.renameWord(request, (await context.params).id);
}

export async function DELETE(request: Request, context: Context) {
  return api.deleteWord(request, (await context.params).id);
}
