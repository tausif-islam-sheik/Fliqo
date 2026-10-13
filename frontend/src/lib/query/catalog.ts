import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export function useHotelSearch(params: { city: string; checkIn: string; checkOut: string } | null) {
  return useQuery({
    queryKey: ["hotels", params],
    enabled: !!params?.city && !!params?.checkIn && !!params?.checkOut,
    queryFn: () => {
      const q = new URLSearchParams(params as any).toString();
      return api<any[]>(`/hotels/search?${q}`);
    }
  });
}

export function useTours() {
  return useQuery({ queryKey: ["tours"], queryFn: () => api<any[]>("/tours") });
}

export function useTour(slug: string | null) {
  return useQuery({
    queryKey: ["tour", slug],
    enabled: !!slug,
    queryFn: () => api<any>(`/tours/${slug}`)
  });
}

export function useVisaCountries() {
  return useQuery({ queryKey: ["visa-countries"], queryFn: () => api<any[]>("/visa/countries") });
}

export function useVisaCountry(code: string | null) {
  return useQuery({
    queryKey: ["visa-country", code],
    enabled: !!code,
    queryFn: () => api<any>(`/visa/countries/${code}`)
  });
}
