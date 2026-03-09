import type { AICandidateRegion } from "@/types/ai";

export class AIAssistRegionEngine {
  private loaded = false;

  async isAvailable() {
    return this.loaded;
  }

  async load() {
    this.loaded = false;
    return this.loaded;
  }

  async detectRegions(): Promise<AICandidateRegion[]> {
    return [];
  }
}
