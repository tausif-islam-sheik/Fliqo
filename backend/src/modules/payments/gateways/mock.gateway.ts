import { Injectable } from "@nestjs/common";
import { randomBytes } from "crypto";

/**
 * SSLCommerz-style hosted checkout stand-in (PDF p.27).
 * Real gateways: init → session URL; user pays; gateway hits IPN + redirects.
 * Swap this adapter for sslcommerz/bkash without touching the service.
 */
@Injectable()
export class MockGateway {
  readonly name = "mock-sslcommerz";
  private sessions = new Map<string, { amount: number; currency: string; paid: boolean }>();

  createSession(amount: number, currency: string) {
    const txnId = `MOCK${randomBytes(4).toString("hex").toUpperCase()}`;
    this.sessions.set(txnId, { amount, currency, paid: false });
    const web = process.env.WEB_URL ?? "http://localhost:3000";
    return { gatewayTxnId: txnId, redirectUrl: `${web}/mock-gateway/pay?txn=${txnId}` };
  }

  markPaid(txnId: string, paid = true) {
    const s = this.sessions.get(txnId);
    if (!s) throw new Error("Unknown transaction");
    s.paid = paid;
    return s;
  }

  /** Server-to-server validation: never trust the redirect, always validate. */
  async validate(txnId: string) {
    const s = this.sessions.get(txnId);
    if (!s) return { success: false as const, amount: 0, currency: "BDT" };
    // Rebuild if server restarted: sessions are ephemeral in Step 4;
    // real gateways persist server-side, so validation always works there.
    return { success: s.paid, amount: s.amount, currency: s.currency };
  }
}
