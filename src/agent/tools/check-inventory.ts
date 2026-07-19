import type { CartState } from "../cart-state.js";
import { traced } from "./trace.js";

export interface InventoryRecord { quantity: number; }
export type InventoryConfig = Record<string, InventoryRecord | number>;
export interface CheckInventoryArgs { product_id: string; }
export interface InventoryResult { product_id: string; in_stock: boolean; quantity: number; }

export function inventoryQuantity(config: InventoryConfig, productId: string): number {
  const configured = config[productId];
  const quantity = typeof configured === "number" ? configured : configured?.quantity;
  return Number.isFinite(quantity) ? Math.max(0, Number(quantity)) : 1;
}

/** Defaults unlisted products to one available unit so the config only models overrides. */
export function checkInventory(config: InventoryConfig, args: CheckInventoryArgs, state?: CartState): InventoryResult {
  return traced(state, "check_inventory", args, () => {
    const quantity = inventoryQuantity(config, args.product_id);
    return { product_id: args.product_id, in_stock: quantity > 0, quantity };
  });
}
