import type { BoundingBox } from "@/types/scanner";

export interface AICandidateRegion {
  boundingBox: BoundingBox;
  confidence: number;
}
