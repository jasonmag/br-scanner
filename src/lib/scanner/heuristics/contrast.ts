export function estimateContrast(imageData: ImageData): number {
  let min = 255;
  let max = 0;

  for (let index = 0; index < imageData.data.length; index += 4) {
    const gray =
      (imageData.data[index] + imageData.data[index + 1] + imageData.data[index + 2]) / 3;
    min = Math.min(min, gray);
    max = Math.max(max, gray);
  }

  return (max - min) / 255;
}
