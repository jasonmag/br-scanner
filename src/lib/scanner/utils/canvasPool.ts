export class CanvasPool {
  private canvas: HTMLCanvasElement | null = null;

  get(width: number, height: number): HTMLCanvasElement {
    if (!this.canvas) {
      this.canvas = document.createElement("canvas");
    }

    if (this.canvas.width !== width) {
      this.canvas.width = width;
    }

    if (this.canvas.height !== height) {
      this.canvas.height = height;
    }

    return this.canvas;
  }
}
