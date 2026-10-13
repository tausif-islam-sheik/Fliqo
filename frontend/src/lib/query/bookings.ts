import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export interface BookingDetail {
  bookingRef: string;
  status: string;
  totalAmount: number;
  currency: string;
  expiresAt: string | null;
  flight: { pnr: string | null; ticketNumbers: string[] } | null;
  passengers: Array<{ firstName: string; lastName: string }>;
  payments: Array<{ id: string; status: string }>;
}

const FINAL = new Set(["CONFIRMED", "EXPIRED", "PAYMENT_FAILED", "TICKETING_FAILED", "CANCELLED", "REFUNDED"]);

/** Success page never trusts URL params — it polls until the status is final (PDF p.27). */
export function useBooking(ref: string | null, poll = false) {
  return useQuery({
    queryKey: ["booking", ref],
    enabled: !!ref,
    queryFn: () => api<BookingDetail>(`/bookings/${ref}`),
    refetchInterval: (query) => {
      if (!poll) return false;
      const s = query.state.data?.status;
      return s && FINAL.has(s) ? false : 2000;
    }
  });
}
