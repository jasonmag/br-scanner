export function estimateBrightness(imageData: ImageData): number {
  let total = 0;

  for (let index = 0; index < imageData.data.length; index += 4) {
    total += (imageData.data[index] + imageData.data[index + 1] + imageData.data[index + 2]) / 3;
  }

  return total / (imageData.data.length / 4) / 255;
}
