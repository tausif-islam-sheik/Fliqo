export interface FlightSearchParams {
  from: string;
  to: string;
  date: string; // YYYY-MM-DD
  returnDate?: string;
  adt?: number;
  cabin?: string;
}

export interface FlightOffer {
  id: string;
  provider: string;
  airline: string;
  airlineName: string;
  flightNo: string;
  from: string;
  to: string;
  depart: string; // ISO
  arrive: string; // ISO
  stops: number;
  durationMin: number;
  price: number; // BDT
  currency: string;
  baggage: string;
}

export interface FlightProvider {
  readonly name: string;
  search(params: Required<Pick<FlightSearchParams, "from" | "to" | "date">> & FlightSearchParams): Promise<FlightOffer[]>;
  reprice(offerId: string): Promise<FlightOffer>;
}
