import { isMentalistDesignTheme } from "@/lib/mentalist-bundle";

export type AccountingLine = {
  design?: string;
  price: number;
  quantity: number;
  itemCostPrice?: number;
};

export type AllocatedAccountingLine = {
  allocatedRevenue: number;
  cost: number;
  contribution: number;
};

/**
 * Allocates the final Mentalist revenue proportionally in integer DZD.
 * Remainder dinars go to earlier eligible lines, making the result stable and exact.
 */
export function allocateOrderLineRevenue(
  items: readonly AccountingLine[],
  mentalistDropTotal?: number,
): AllocatedAccountingLine[] {
  const eligibleRetail = items.reduce(
    (sum, item) => sum + (isMentalistDesignTheme(item.design) ? item.price * item.quantity : 0),
    0,
  );
  const target = typeof mentalistDropTotal === "number" ? Math.max(0, Math.round(mentalistDropTotal)) : eligibleRetail;
  let allocated = 0;
  const eligibleIndexes = items.flatMap((item, index) => isMentalistDesignTheme(item.design) ? [index] : []);

  return items.map((item, index) => {
    let allocatedRevenue = item.price * item.quantity;
    if (isMentalistDesignTheme(item.design) && eligibleRetail > 0) {
      const isLastEligible = index === eligibleIndexes.at(-1);
      allocatedRevenue = isLastEligible
        ? target - allocated
        : Math.floor((target * item.price * item.quantity) / eligibleRetail);
      allocated += allocatedRevenue;
    }
    const cost = Math.max(0, item.itemCostPrice ?? 0) * item.quantity;
    return { allocatedRevenue, cost, contribution: allocatedRevenue - cost };
  });
}

export function calculateDeliveredAccounting(input: {
  subtotal: number;
  costOfGoodsSold: number;
  returnCost?: number;
}) {
  const revenue = Math.max(0, input.subtotal);
  const costOfGoodsSold = Math.max(0, input.costOfGoodsSold);
  const returnCost = Math.max(0, input.returnCost ?? 0);
  return { revenue, costOfGoodsSold, netProfit: revenue - costOfGoodsSold - returnCost };
}
