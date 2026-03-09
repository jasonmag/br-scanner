import type { BoundingBox } from "@/types/scanner";

export function getCenterRoi(width: number, height: number): BoundingBox {
  const roiWidth = Math.round(width * 0.72);
  const roiHeight = Math.round(height * 0.32);

  return {
    x: Math.round((width - roiWidth) / 2),
    y: Math.round((height - roiHeight) / 2),
    width: roiWidth,
    height: roiHeight
  };
}
