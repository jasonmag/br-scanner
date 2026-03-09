function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

export function toImageData(input: HTMLCanvasElement): ImageData | null {
  const context = input.getContext("2d", { willReadFrequently: true });
  if (!context) {
    return null;
  }

  return context.getImageData(0, 0, input.width, input.height);
}

export function rotateCanvas(source: HTMLCanvasElement, degrees: 0 | 90 | 180 | 270): HTMLCanvasElement {
  const swapSides = degrees === 90 || degrees === 270;
  const canvas = createCanvas(swapSides ? source.height : source.width, swapSides ? source.width : source.height);
  const context = canvas.getContext("2d");
  if (!context) {
    return canvas;
  }

  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate((degrees * Math.PI) / 180);
  context.drawImage(source, -source.width / 2, -source.height / 2);
  return canvas;
}

export function increaseContrast(source: HTMLCanvasElement): HTMLCanvasElement {
  const canvas = createCanvas(source.width, source.height);
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    return canvas;
  }

  context.drawImage(source, 0, 0);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const contrast = 1.35;

  for (let index = 0; index < imageData.data.length; index += 4) {
    for (let offset = 0; offset < 3; offset += 1) {
      const centered = imageData.data[index + offset] - 128;
      imageData.data[index + offset] = Math.max(0, Math.min(255, centered * contrast + 128));
    }
  }

  context.putImageData(imageData, 0, 0);
  return canvas;
}
