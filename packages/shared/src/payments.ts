// Payments are gateway-agnostic by design: domain code (appointments,
// invoices) depends only on this interface, never on a specific provider's
// SDK or response shape. Adding PIX/card via a real gateway later means
// writing one more class here, not touching callers.

export interface ChargeInput {
  amount: number;
  currency: string;
  method: "PIX" | "CARD" | "CASH" | "OTHER";
  description?: string;
}

export interface ChargeResult {
  status: "PENDING" | "PAID" | "FAILED";
  providerRef?: string;
}

export interface PaymentProvider {
  name: string;
  charge(input: ChargeInput): Promise<ChargeResult>;
}

// Default/no-op provider for cash and manually-reconciled payments: marks
// the charge paid immediately since no external settlement is involved.
export const manualPaymentProvider: PaymentProvider = {
  name: "MANUAL",
  async charge() {
    return { status: "PAID" };
  },
};

export function resolvePaymentProvider(_provider: string): PaymentProvider {
  // Only MANUAL is wired today. Extend with a lookup table (STRIPE,
  // MERCADO_PAGO, ...) once a real gateway is integrated.
  return manualPaymentProvider;
}
