import type { ForageConfig } from "../shared/config.js";
import type { EnrichedIndex, EnrichmentProvider, RawProduct } from "../shared/types.js";
import { ResponsesEnricher } from "./enricher.js";

export class OpenAIEnrichmentProvider implements EnrichmentProvider {
  private readonly enricher: ResponsesEnricher;

  public constructor(private readonly config: ForageConfig) {
    this.enricher = new ResponsesEnricher(config);
  }

  public async enrich(rawProducts: RawProduct[]): Promise<EnrichedIndex> {
    const candidateHandles = rawProducts.map((product) => product.handle);
    const products = [];

    for (const product of rawProducts) {
      products.push(await this.enricher.enrichProduct(product, candidateHandles));
    }

    return {
      schemaVersion: "1.0",
      sourcePath: this.config.catalogPath,
      generatedAt: new Date().toISOString(),
      products
    };
  }
}
