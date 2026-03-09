export async function createFrameBitmap(video: HTMLVideoElement): Promise<ImageBitmap | null> {
  if (!("createImageBitmap" in window) || video.videoWidth === 0 || video.videoHeight === 0) {
    return null;
  }

  return createImageBitmap(video);
}
