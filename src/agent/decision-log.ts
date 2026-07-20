export interface ShoppingIntent {
  explicitConstraints: string[];
  implicitConstraints: string[];
  requiredSlots: string[];
  hardProductAttributes: string[];
}

const addUnique = (values: string[], value: string): void => {
  if (!values.includes(value)) values.push(value);
};

/** Produces the auditable pre-tool decomposition required by the agent contract. */
export function decomposeShoppingGoal(goal: string, budgetLimit: number): ShoppingIntent {
  const normalized = goal.toLowerCase();
  const explicitConstraints: string[] = [];
  const implicitConstraints: string[] = [];
  const requiredSlots: string[] = [];
  const hardProductAttributes: string[] = [];

  const statedBudget = normalized.match(/(?:budget|under|max(?:imum)?|up to)\s*(?:is|of|:)?\s*\$?\s*(\d+(?:\.\d{1,2})?)/i)
    ?? normalized.match(/\$\s*(\d+(?:\.\d{1,2})?)/);
  addUnique(explicitConstraints, `$${statedBudget?.[1] ?? budgetLimit} maximum`);

  for (const attribute of ["cotton", "waterproof", "formal", "tuxedo", "elephant"]) {
    if (new RegExp(`\\b${attribute}\\b`).test(normalized)) {
      addUnique(explicitConstraints, attribute);
      addUnique(hardProductAttributes, attribute);
    }
  }
  for (const color of ["black", "blue", "brown", "green", "grey", "gray", "navy", "orange", "pink", "purple", "red", "white", "yellow"]) {
    if (new RegExp(`\\b${color}\\b`).test(normalized)) {
      addUnique(explicitConstraints, color);
      addUnique(hardProductAttributes, color);
    }
  }
  if (/evening/.test(normalized)) addUnique(explicitConstraints, "evening occasion");
  if (/business casual/.test(normalized)) addUnique(explicitConstraints, "business casual");
  if (/job interview|interview/.test(normalized)) addUnique(explicitConstraints, "job interview");
  if (/outfit/.test(normalized)) addUnique(explicitConstraints, "multi-item outfit");

  if (/shirt/.test(normalized)) addUnique(requiredSlots, "shirt");
  else if (/\btop\b/.test(normalized)) addUnique(requiredSlots, "top");
  if (/jacket|outer layer|outer-layer/.test(normalized)) addUnique(requiredSlots, "outer layer");
  if (/tuxedo/.test(normalized)) addUnique(requiredSlots, "outer layer");
  if (/bag|accessory/.test(normalized)) addUnique(requiredSlots, "bag");
  if (/pants|trousers|bottom/.test(normalized)) addUnique(requiredSlots, "bottom");
  if (/skirt/.test(normalized)) addUnique(requiredSlots, "skirt");
  if (/shoes|footwear|sneakers|high tops/.test(normalized)) addUnique(requiredSlots, "footwear");
  if (/gown/.test(normalized)) addUnique(requiredSlots, "gown");

  if (/job interview|interview/.test(normalized)) {
    for (const constraint of ["professional", "polished", "non-formal", "neutral styling"]) addUnique(implicitConstraints, constraint);
  }
  if (/business casual/.test(normalized)) addUnique(implicitConstraints, "coordinated business-casual styling");
  if (/outfit/.test(normalized) && requiredSlots.length < 2) {
    for (const slot of ["shirt", "outer layer", "bag"]) addUnique(requiredSlots, slot);
  }

  if (requiredSlots.length === 0) addUnique(requiredSlots, "item");
  for (const slot of requiredSlots) addUnique(explicitConstraints, `${slot} slot`);

  return { explicitConstraints, implicitConstraints, requiredSlots, hardProductAttributes };
}
