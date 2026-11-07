import { api } from "@/server/production";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = api.listProfiles;
export const POST = api.addProfile;
