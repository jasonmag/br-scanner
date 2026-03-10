export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { createIdentifyMetadata, createOptionsResponse, handleDecodeRequest } from "@/lib/server/barcodeApi";

export async function GET(request: Request) {
  return createIdentifyMetadata(request);
}

export async function POST(request: Request) {
  return handleDecodeRequest(request);
}

export async function OPTIONS(request: Request) {
  return createOptionsResponse(request);
}
