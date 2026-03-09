export function estimateBlur(imageData: ImageData): number {
  let deltaTotal = 0;
  let samples = 0;

  for (let index = 4; index < imageData.data.length; index += 4) {
    const prev =
      (imageData.data[index - 4] + imageData.data[index - 3] + imageData.data[index - 2]) / 3;
    const current =
      (imageData.data[index] + imageData.data[index + 1] + imageData.data[index + 2]) / 3;
    deltaTotal += Math.abs(current - prev);
    samples += 1;
  }

  return samples === 0 ? 0 : deltaTotal / samples / 255;
}
