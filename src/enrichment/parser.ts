import { readFile } from "node:fs/promises";
import type { RawProduct, RawVariant } from "../shared/types.js";

type CsvRow = Record<string, string>;

function parseCsvRows(source: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];

    if (quoted && character === "\"" && next === "\"") {
      cell += "\"";
      index += 1;
    } else if (character === "\"") {
      quoted = !quoted;
    } else if (!quoted && character === ",") {
      row.push(cell);
      cell = "";
    } else if (!quoted && (character === "\n" || character === "\r")) {
      if (character === "\r" && next === "\n") {
        index += 1;
      }
      row.push(cell);
      if (row.some((value) => value.length > 0)) {
        rows.push(row);
      }
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

function toCsvRecords(source: string): CsvRow[] {
  const [headers, ...rows] = parseCsvRows(source);
  if (!headers) {
    return [];
  }

  return rows.map((row) =>
    Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""]))
  );
}

function numberValue(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function optionalNumber(value: string): number | null {
  return value.trim() === "" ? null : numberValue(value);
}

function booleanValue(value: string): boolean {
  return value.trim().toLowerCase() === "true";
}

function createVariant(record: CsvRow): RawVariant {
  return {
    sku: record["Variant SKU"] ?? "",
    optionValues: [record["Option1 Value"], record["Option2 Value"], record["Option3 Value"]].filter(
      (value): value is string => Boolean(value)
    ),
    grams: numberValue(record["Variant Grams"] ?? ""),
    inventoryTracker: record["Variant Inventory Tracker"] ?? "",
    inventoryQuantity: numberValue(record["Variant Inventory Qty"] ?? ""),
    inventoryPolicy: record["Variant Inventory Policy"] ?? "",
    fulfillmentService: record["Variant Fulfillment Service"] ?? "",
    price: numberValue(record["Variant Price"] ?? ""),
    compareAtPrice: optionalNumber(record["Variant Compare At Price"] ?? ""),
    requiresShipping: booleanValue(record["Variant Requires Shipping"] ?? ""),
    taxable: booleanValue(record["Variant Taxable"] ?? ""),
    barcode: record["Variant Barcode"] ?? "",
    image: record["Variant Image"] ?? "",
    weightUnit: record["Variant Weight Unit"] ?? "",
    taxCode: record["Variant Tax Code"] ?? ""
  };
}

function parseTags(value: string): string[] {
  return value.split(",").map((tag) => tag.trim()).filter(Boolean);
}

export function stripHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseCatalogCsv(source: string): RawProduct[] {
  const products = new Map<string, RawProduct>();

  for (const record of toCsvRecords(source)) {
    const handle = record.Handle?.trim();
    if (!handle) {
      continue;
    }

    const variant = createVariant(record);
    const current = products.get(handle);
    if (current) {
      current.variants.push(variant);
      continue;
    }

    products.set(handle, {
      handle,
      title: record.Title?.trim() || handle,
      bodyHtml: record["Body (HTML)"] ?? "",
      vendor: record.Vendor ?? "",
      type: record.Type ?? "",
      tags: parseTags(record.Tags ?? ""),
      price: variant.price,
      imageSrc: record["Image Src"] ?? "",
      variant,
      variants: [variant]
    });
  }

  return [...products.values()];
}

export async function parseCatalogFile(path: string): Promise<RawProduct[]> {
  return parseCatalogCsv(await readFile(path, "utf8"));
}
