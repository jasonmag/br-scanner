export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const DECODER_URL = process.env.BARCODE_DECODER_URL ?? "http://127.0.0.1:8000";

export async function POST(request: Request) {
  const formData = await request.formData();
  const image = formData.get("image");

  if (!(image instanceof Blob)) {
    return Response.json({ error: "Missing image upload." }, { status: 400 });
  }

  if (image.size > MAX_IMAGE_BYTES) {
    return Response.json({ error: "Image exceeds the 2 MB limit." }, { status: 413 });
  }

  const decoderFormData = new FormData();
  decoderFormData.set("image", image, "scan.jpg");

  try {
    const response = await fetch(`${DECODER_URL}/decode`, {
      method: "POST",
      body: decoderFormData,
      cache: "no-store"
    });

    if (!response.ok) {
      return Response.json({ results: [] }, { status: 200 });
    }

    const payload = await response.json();
    return Response.json(payload);
  } catch {
    return Response.json({ results: [] }, { status: 200 });
  }
}
