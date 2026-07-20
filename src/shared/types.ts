export interface RawVariant {
  sku: string;
  optionValues: string[];
  grams: number;
  inventoryTracker: string;
  inventoryQuantity: number;
  inventoryPolicy: string;
  fulfillmentService: string;
  price: number;
  compareAtPrice: number | null;
  requiresShipping: boolean;
  taxable: boolean;
  barcode: string;
  image: string;
  weightUnit: string;
  taxCode: string;
}

export interface RawProduct {
  handle: string;
  title: string;
  bodyHtml: string;
  vendor: string;
  type: string;
  tags: string[];
  price: number;
  imageSrc: string;
  variant: RawVariant;
  variants: RawVariant[];
}

export type ConfidenceScores = Record<string, number>;

export interface EnrichmentAttributes {
  materialComposition: string[];
  useCaseTags: string[];
  aestheticStyle: string[];
  seasonalRelevance: string[];
  functionalAttributes: string[];
  substituteCandidates: string[];
  confidenceScores: ConfidenceScores;
}

export interface EnrichedProduct extends RawProduct, EnrichmentAttributes {}

export interface EnrichedIndex {
  schemaVersion: "1.0";
  sourcePath: string;
  generatedAt: string;
  products: EnrichedProduct[];
}

export interface EnrichmentProvider {
  enrich(rawProducts: RawProduct[]): Promise<EnrichedIndex>;
}

export interface CartItem {
  product_id: string;
  title: string;
  price: number;
  justification: string;
  slot: string;
}

export interface ConstraintStatus { constraint: string; status: string; notes: string; }
export interface DecisionLogEntry { step: number; tool_called: string | null; inputs: Record<string, unknown>; outputs: Record<string, unknown>; reasoning: string; }
export interface GapReportEntry { missing_attribute_or_category: string; recommendation: string; min_viable_price: number | null; }
export interface CartOutput {
  items: CartItem[];
  total_price: number;
  budget_limit: number;
  budget_remaining: number;
  constraints_met: ConstraintStatus[];
  decision_log: DecisionLogEntry[];
  gap_report: GapReportEntry[];
  stats?: QueryStats;
}

export interface QueryStats {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  tool_calls_count: number;
  reasoning_steps: number;
}
