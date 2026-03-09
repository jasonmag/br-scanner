export class OpenCvPreprocessor {
  preprocess(canvas: HTMLCanvasElement): HTMLCanvasElement {
    const context = canvas.getContext("2d");

    if (!context) {
      return canvas;
    }

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    for (let index = 0; index < imageData.data.length; index += 4) {
      const gray =
        imageData.data[index] * 0.299 +
        imageData.data[index + 1] * 0.587 +
        imageData.data[index + 2] * 0.114;

      imageData.data[index] = gray;
      imageData.data[index + 1] = gray;
      imageData.data[index + 2] = gray;
    }

    context.putImageData(imageData, 0, 0);
    return canvas;
  }
}
