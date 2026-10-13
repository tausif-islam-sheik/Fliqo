import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export interface FlightOffer {
  id: string;
  provider: string;
  airline: string;
  airlineName: string;
  flightNo: string;
  from: string;
  to: string;
  depart: string;
  arrive: string;
  stops: number;
  durationMin: number;
  price: number;
  currency: string;
  baggage: string;
}

export interface SearchParams {
  from: string;
  to: string;
  date: string;
  adt: number;
}

export function useFlightSearch(params: SearchParams | null) {
  return useQuery({
    queryKey: ["flights", params],
    enabled: !!params && !!params.from && !!params.to && !!params.date,
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const q = new URLSearchParams({
        from: params!.from,
        to: params!.to,
        date: params!.date,
        adt: String(params!.adt || 1)
      });
      return api<{ offers: FlightOffer[]; cached: boolean }>(`/flights/search?${q.toString()}`);
    }
  });
}

export function useReprice(offerId: string | null) {
  return useQuery({
    queryKey: ["reprice", offerId],
    enabled: !!offerId,
    staleTime: 60_000,
    queryFn: () => api<FlightOffer>(`/flights/reprice?offerId=${encodeURIComponent(offerId!)}`)
  });
}

export interface DayFare {
  date: string;
  minPrice: number | null;
}

/** Per-day minimum fares for a month — powers the fare calendar. */
export function useFares(from: string | null, to: string | null, month: string | null) {
  return useQuery({
    queryKey: ["fares", from, to, month],
    enabled: !!from && !!to && !!month,
    staleTime: 5 * 60_000,
    queryFn: () =>
      api<DayFare[]>(`/flights/fares?from=${from}&to=${to}&month=${month}`)
  });
}

export interface Airport {
  code: string;
  name: string;
  city: string | null;
  country: string | null;
}

/** Searchable airport list for the FROM/TO pickers. */
export function useAirports(q: string, enabled = true) {
  return useQuery({
    queryKey: ["airports", q],
    enabled,
    staleTime: 10 * 60_000,
    queryFn: () => api<Airport[]>(`/flights/airports${q ? `?q=${encodeURIComponent(q)}` : ""}`)
  });
}
