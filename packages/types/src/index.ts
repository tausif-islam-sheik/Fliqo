export type BookingType = "FLIGHT" | "HOTEL" | "TOUR" | "VISA";
export type BookingStatus =
  | "DRAFT"
  | "PENDING_PAYMENT"
  | "PAID"
  | "TICKETING"
  | "CONFIRMED"
  | "EXPIRED"
  | "PAYMENT_FAILED"
  | "TICKETING_FAILED"
  | "CANCELLED"
  | "REFUNDED";
