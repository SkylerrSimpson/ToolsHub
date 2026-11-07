import { api } from "@/server/production";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = api.listWords;
export const POST = api.addWord;
