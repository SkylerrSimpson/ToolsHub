import { api } from "@/server/production";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };

export async function DELETE(request: Request, context: Context) {
  return api.deleteProfile(request, (await context.params).id);
}
