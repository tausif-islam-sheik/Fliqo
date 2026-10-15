import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as argon2 from "argon2";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const PERMISSIONS: Array<{ key: string; module: string; description: string }> = [
  { key: "bookings.view", module: "bookings", description: "View bookings" },
  { key: "bookings.refund", module: "bookings", description: "Approve refunds" },
  { key: "bookings.ticket", module: "bookings", description: "Manual ticketing" },
  { key: "payments.view", module: "payments", description: "View transactions" },
  { key: "coupons.manage", module: "coupons", description: "Manage coupons" },
  { key: "tours.manage", module: "tours", description: "Manage tour packages" },
  { key: "campaigns.manage", module: "campaigns", description: "Manage email campaigns" },
  { key: "backups.manage", module: "backups", description: "Run backups" },
  { key: "backups.restore", module: "backups", description: "Restore backups" },
  { key: "staff.manage", module: "staff", description: "Manage staff and roles" },
  { key: "users.view", module: "users", description: "View customers" }
];

const ROLES: Array<{ name: string; description: string; isSystem: boolean; permissions: string[] | "all" }> = [
  { name: "SuperAdmin", description: "Everything including restore", isSystem: true, permissions: "all" },
  { name: "Admin", description: "Everything except restore", isSystem: false, permissions: "all" },
  { name: "Operations", description: "Bookings and ticketing", isSystem: false, permissions: ["bookings.view", "bookings.ticket"] },
  { name: "Support", description: "View bookings and customers", isSystem: false, permissions: ["bookings.view", "users.view"] },
  { name: "Finance", description: "Payments and refunds", isSystem: false, permissions: ["bookings.view", "bookings.refund", "payments.view"] },
  { name: "Marketing", description: "Coupons and campaigns", isSystem: false, permissions: ["coupons.manage", "campaigns.manage"] },
  { name: "Content", description: "Tours and CMS", isSystem: false, permissions: ["tours.manage"] }
];

// ---------- Reference data ----------
const AIRPORTS = [
  { code: "DAC", name: "Hazrat Shahjalal International Airport", city: "Dhaka", country: "BD" },
  { code: "CGP", name: "Shah Amanat International Airport", city: "Chittagong", country: "BD" },
  { code: "CXB", name: "Cox's Bazar Airport", city: "Cox's Bazar", country: "BD" },
  { code: "JSR", name: "Jessore Airport", city: "Jessore", country: "BD" },
  { code: "SPD", name: "Saidpur Airport", city: "Saidpur", country: "BD" },
  { code: "ZYL", name: "Osmani International Airport", city: "Sylhet", country: "BD" },
  { code: "RJH", name: "Shah Makhdum Airport", city: "Rajshahi", country: "BD" },
  { code: "BZL", name: "Barisal Airport", city: "Barisal", country: "BD" },
  { code: "CCU", name: "Netaji Subhas Chandra Bose Airport", city: "Kolkata", country: "IN" },
  { code: "DEL", name: "Indira Gandhi International Airport", city: "New Delhi", country: "IN" },
  { code: "KTM", name: "Tribhuvan International Airport", city: "Kathmandu", country: "NP" },
  { code: "BKK", name: "Suvarnabhumi Airport", city: "Bangkok", country: "TH" },
  { code: "KUL", name: "Kuala Lumpur International Airport", city: "Kuala Lumpur", country: "MY" },
  { code: "SIN", name: "Changi Airport", city: "Singapore", country: "SG" },
  { code: "DXB", name: "Dubai International Airport", city: "Dubai", country: "AE" },
  { code: "DOH", name: "Hamad International Airport", city: "Doha", country: "QA" },
  { code: "JED", name: "King Abdulaziz International Airport", city: "Jeddah", country: "SA" },
  { code: "IST", name: "Istanbul Airport", city: "Istanbul", country: "TR" }
];

const AIRLINES = [
  { code: "BG", name: "Biman Bangladesh" },
  { code: "BS", name: "US-Bangla Airlines" },
  { code: "VQ", name: "Novoair" },
  { code: "2A", name: "Air Astra" },
  { code: "EK", name: "Emirates" },
  { code: "QR", name: "Qatar Airways" },
  { code: "SQ", name: "Singapore Airlines" },
  { code: "TG", name: "Thai Airways" },
  { code: "MH", name: "Malaysia Airlines" },
  { code: "SV", name: "Saudia" }
];

const CITIES = [
  { code: "DAC", name: "Dhaka", country: "BD" },
  { code: "CXB", name: "Cox's Bazar", country: "BD" },
  { code: "CGP", name: "Chattogram", country: "BD" },
  { code: "ZYL", name: "Sylhet", country: "BD" },
  { code: "RJH", name: "Rajshahi", country: "BD" },
  { code: "KHL", name: "Khulna", country: "BD" },
  { code: "BZL", name: "Barishal", country: "BD" },
  { code: "RNP", name: "Rangpur", country: "BD" },
  { code: "BKK", name: "Bangkok", country: "TH" },
  { code: "KUL", name: "Kuala Lumpur", country: "MY" },
  { code: "SIN", name: "Singapore", country: "SG" },
  { code: "DXB", name: "Dubai", country: "AE" },
  { code: "KTM", name: "Kathmandu", country: "NP" },
  { code: "CCU", name: "Kolkata", country: "IN" },
  { code: "MLE", name: "Male", country: "MV" }
];

// ---------- Seed photos (served from frontend/public/images/seed/) ----------
const CITY_IMAGES: Record<string, string[]> = {
  "Cox's Bazar": ["/images/seed/beach.jpg", "/images/seed/palm-beach.jpg", "/images/seed/resort-pool.jpg", "/images/seed/hotel-room.jpg"],
  Dhaka: ["/images/seed/city-night.jpg", "/images/seed/hotel-lobby.jpg", "/images/seed/hotel-room.jpg", "/images/seed/resort-pool.jpg"],
  Chattogram: ["/images/seed/city-night.jpg", "/images/seed/beach.jpg", "/images/seed/hotel-room.jpg"],
  Sylhet: ["/images/seed/tea-garden.jpg", "/images/seed/forest.jpg", "/images/seed/lake-dock.jpg", "/images/seed/hotel-room.jpg"],
  Khulna: ["/images/seed/forest.jpg", "/images/seed/lake-dock.jpg", "/images/seed/hotel-room.jpg"],
  Rajshahi: ["/images/seed/taj-heritage.jpg", "/images/seed/city-night.jpg", "/images/seed/hotel-room.jpg"],
  Rangpur: ["/images/seed/city-night.jpg", "/images/seed/hotel-room.jpg"],
  Bandarban: ["/images/seed/mountain-hills.jpg", "/images/seed/forest.jpg", "/images/seed/lake-dock.jpg"],
  Rangamati: ["/images/seed/mountain-hills.jpg", "/images/seed/lake-dock.jpg", "/images/seed/hotel-room.jpg"],
  Kuakata: ["/images/seed/palm-beach.jpg", "/images/seed/beach.jpg", "/images/seed/hotel-room.jpg"],
  Sunamganj: ["/images/seed/lake-dock.jpg", "/images/seed/forest.jpg", "/images/seed/hotel-room.jpg"]
};
function hotelImages(city: string, slug: string): string[] {
  const pool = CITY_IMAGES[city] ?? ["/images/seed/hotel-room.jpg", "/images/seed/hotel-lobby.jpg"];
  const h = slug.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return [pool[h % pool.length], pool[(h + 1) % pool.length]];
}

const TOUR_IMAGES: Record<string, string> = {
  "cox-bazar-3n": "/images/seed/beach.jpg",
  "sundarbans-3d": "/images/seed/forest.jpg",
  "sajek-2n": "/images/seed/mountain-hills.jpg",
  "bandarban-3n": "/images/seed/forest.jpg",
  "sylhet-tea-2n": "/images/seed/tea-garden.jpg",
  "saint-martin-2n": "/images/seed/snorkel.jpg",
  "rangamati-2n": "/images/seed/lake-dock.jpg",
  "kuakata-2n": "/images/seed/palm-beach.jpg",
  "srimangal-2n": "/images/seed/forest.jpg",
  "tanguar-haor-2n": "/images/seed/lake-dock.jpg",
  "nijhum-dwip-2n": "/images/seed/palm-beach.jpg",
  "paharpur-mahastan-1d": "/images/seed/taj-heritage.jpg",
  "sonargaon-day": "/images/seed/mosque.jpg",
  "dhaka-city-1d": "/images/seed/city-night.jpg",
  "bangkok-4n": "/images/seed/thailand-boats.jpg",
  "malaysia-4n": "/images/seed/city-night.jpg",
  "singapore-3n": "/images/seed/singapore.jpg",
  "dubai-4n": "/images/seed/dubai.jpg",
  "maldives-3n": "/images/seed/maldives.jpg",
  "nepal-4n": "/images/seed/nepal-himalaya.jpg",
  "golden-triangle-5n": "/images/seed/taj-heritage.jpg",
  "bali-5n": "/images/seed/bali.jpg",
  "vietnam-5n": "/images/seed/halong-bay.jpg",
  "turkey-6n": "/images/seed/cappadocia.jpg",
  "umrah-14n": "/images/seed/mosque.jpg"
};

// ---------- Hotels (40) ----------
type Room = { id: string; name: string; price: number; currency: string; available: number };
const R = (id: string, name: string, price: number, available = 10): Room => ({ id, name, price, currency: "BDT", available });

const HOTELS: Array<{ slug: string; name: string; city: string; stars: number; amenities: string[]; rooms: Room[]; featured?: boolean }> = [
  { slug: "sea-palace-coxs-bazar", name: "Sea Palace Cox's Bazar", city: "Cox's Bazar", stars: 4, amenities: ["Pool", "WiFi", "Beach access", "Breakfast"], rooms: [R("dlx", "Deluxe Sea View", 8500), R("std", "Standard", 5500)], featured: true },
  { slug: "dhaka-regency", name: "Dhaka Regency", city: "Dhaka", stars: 4, amenities: ["WiFi", "Pool", "Gym", "Restaurant"], rooms: [R("dlx", "Deluxe", 7500)], featured: true },
  { slug: "pan-pacific-sonargaon", name: "Pan Pacific Sonargaon Dhaka", city: "Dhaka", stars: 5, amenities: ["Pool", "WiFi", "Spa", "Gym", "Restaurants", "Business centre"], rooms: [R("dlx", "Deluxe King", 14500), R("exe", "Executive Club", 18500, 6), R("ste", "Suite", 28000, 4)], featured: true },
  { slug: "intercontinental-dhaka", name: "InterContinental Dhaka", city: "Dhaka", stars: 5, amenities: ["Pool", "WiFi", "Spa", "Gym", "Restaurants"], rooms: [R("dlx", "Classic", 15500), R("pre", "Premium", 19500, 8), R("ste", "Diplomatic Suite", 35000, 2)], featured: true },
  { slug: "radisson-blu-dhaka", name: "Radisson Blu Dhaka Water Garden", city: "Dhaka", stars: 5, amenities: ["Pool", "WiFi", "Spa", "Gym", "Restaurants"], rooms: [R("dlx", "Superior", 13500), R("biz", "Business Class", 16500, 8)], featured: true },
  { slug: "le-meridien-dhaka", name: "Le Meridien Dhaka", city: "Dhaka", stars: 5, amenities: ["Pool", "WiFi", "Spa", "Gym", "Airport shuttle"], rooms: [R("dlx", "Deluxe", 15000), R("exe", "Executive", 19000, 6)] },
  { slug: "amari-dhaka", name: "Amari Dhaka", city: "Dhaka", stars: 5, amenities: ["Pool", "WiFi", "Gym", "Rooftop restaurant"], rooms: [R("dlx", "Deluxe", 12500), R("exe", "Executive", 15500, 6)] },
  { slug: "six-seasons-dhaka", name: "Six Seasons Hotel Dhaka", city: "Dhaka", stars: 5, amenities: ["WiFi", "Spa", "Gym", "Restaurant"], rooms: [R("roy", "Royal", 16500, 8), R("ste", "Suite", 24000, 4)] },
  { slug: "sarina-dhaka", name: "Hotel Sarina Dhaka", city: "Dhaka", stars: 4, amenities: ["WiFi", "Pool", "Gym", "Restaurant"], rooms: [R("dlx", "Deluxe", 9500), R("pre", "Premium", 11500, 8)] },
  { slug: "la-vinci-dhaka", name: "Best Western La Vinci Gulshan", city: "Dhaka", stars: 4, amenities: ["WiFi", "Gym", "Restaurant", "Airport shuttle"], rooms: [R("dlx", "Superior Deluxe", 8800), R("twn", "Twin", 8200, 8)] },
  { slug: "hotel-71-dhaka", name: "Hotel 71 Dhaka", city: "Dhaka", stars: 3, amenities: ["WiFi", "Breakfast", "Airport shuttle"], rooms: [R("std", "Standard", 4200), R("dlx", "Deluxe", 5800, 8)] },
  { slug: "fars-hotel-dhaka", name: "FARS Hotel & Resorts Dhaka", city: "Dhaka", stars: 3, amenities: ["WiFi", "Restaurant", "Prayer room"], rooms: [R("std", "Standard", 4500), R("fam", "Family", 6800, 6)] },
  { slug: "white-palace-uttara", name: "White Palace Hotel Uttara", city: "Dhaka", stars: 3, amenities: ["WiFi", "Breakfast", "Airport shuttle"], rooms: [R("std", "Standard", 3800), R("dlx", "Deluxe", 5200, 8)] },
  { slug: "sayeman-beach-resort", name: "Sayeman Beach Resort", city: "Cox's Bazar", stars: 5, amenities: ["Private beach", "Pool", "WiFi", "Spa", "Kids club"], rooms: [R("dlx", "Deluxe Hill View", 12500), R("sea", "Premium Sea View", 16500, 8), R("ste", "Sayeman Suite", 26000, 4)], featured: true },
  { slug: "long-beach-hotel-cxb", name: "Long Beach Hotel Cox's Bazar", city: "Cox's Bazar", stars: 4, amenities: ["Pool", "WiFi", "Beach access", "Gym"], rooms: [R("dlx", "Deluxe", 9000), R("sea", "Sea View", 11500, 8)] },
  { slug: "ocean-paradise-cxb", name: "Ocean Paradise Hotel & Resort", city: "Cox's Bazar", stars: 4, amenities: ["Pool", "WiFi", "Beach access", "Restaurant"], rooms: [R("dlx", "Deluxe", 8000), R("fam", "Family Suite", 12000, 6)] },
  { slug: "seagull-hotel-cxb", name: "Seagull Hotel Cox's Bazar", city: "Cox's Bazar", stars: 4, amenities: ["Pool", "WiFi", "Beach access"], rooms: [R("std", "Standard", 6500), R("dlx", "Deluxe Sea View", 9500, 8)] },
  { slug: "hotel-sea-crown-cxb", name: "Hotel Sea Crown", city: "Cox's Bazar", stars: 3, amenities: ["WiFi", "Beach access", "Restaurant"], rooms: [R("std", "Standard Couple", 4500), R("sea", "Sea View", 6000, 8)] },
  { slug: "hotel-kollol-cxb", name: "Hotel Kollol Cox's Bazar", city: "Cox's Bazar", stars: 3, amenities: ["WiFi", "Beach access", "Breakfast"], rooms: [R("std", "Standard", 3500), R("dlx", "Deluxe", 5000, 10)] },
  { slug: "mermaid-beach-resort", name: "Mermaid Beach Resort", city: "Cox's Bazar", stars: 4, amenities: ["Private beach", "Pool", "Spa", "Yoga deck"], rooms: [R("vil", "Beach Villa", 18000, 6), R("bun", "Bungalow", 14000, 6)], featured: true },
  { slug: "saint-martin-resort-cxb", name: "Hotel Saint Martin Resort", city: "Cox's Bazar", stars: 3, amenities: ["WiFi", "Beach access", "Restaurant"], rooms: [R("std", "Standard", 4000), R("sea", "Sea Facing", 5500, 8)] },
  { slug: "windy-terrace-cxb", name: "Windy Terrace Boutique Hotel", city: "Cox's Bazar", stars: 3, amenities: ["Rooftop", "WiFi", "Breakfast"], rooms: [R("std", "Standard", 3200), R("ter", "Terrace View", 4500, 8)] },
  { slug: "radisson-blu-ctg", name: "Radisson Blu Chattogram Bay View", city: "Chattogram", stars: 5, amenities: ["Bay view", "Pool", "WiFi", "Spa", "Gym"], rooms: [R("dlx", "Superior", 12000), R("exe", "Executive", 15000, 6)], featured: true },
  { slug: "peninsula-ctg", name: "The Peninsula Chittagong", city: "Chattogram", stars: 4, amenities: ["Pool", "WiFi", "Gym", "Restaurants"], rooms: [R("dlx", "Deluxe", 8500), R("exe", "Executive", 10500, 8)] },
  { slug: "hotel-agrabad-ctg", name: "Hotel Agrabad", city: "Chattogram", stars: 4, amenities: ["Pool", "WiFi", "Restaurant", "Business centre"], rooms: [R("dlx", "Deluxe", 7500), R("ste", "Suite", 12000, 4)] },
  { slug: "well-park-ctg", name: "Well Park Residence Chattogram", city: "Chattogram", stars: 4, amenities: ["Rooftop pool", "WiFi", "Gym"], rooms: [R("dlx", "Deluxe", 8000), R("stu", "Studio Apartment", 9500, 6)] },
  { slug: "rose-view-sylhet", name: "Rose View Hotel Sylhet", city: "Sylhet", stars: 5, amenities: ["Pool", "WiFi", "Spa", "Gym"], rooms: [R("dlx", "Deluxe", 11000), R("exe", "Executive", 13500, 6)] },
  { slug: "grand-sultan-sreemangal", name: "Grand Sultan Tea Resort & Golf", city: "Sylhet", stars: 5, amenities: ["Golf course", "Pool", "WiFi", "Spa", "Tea garden"], rooms: [R("dlx", "Deluxe", 13000, 8), R("vil", "Villa", 20000, 4)], featured: true },
  { slug: "star-pacific-sylhet", name: "Hotel Star Pacific Sylhet", city: "Sylhet", stars: 4, amenities: ["WiFi", "Restaurant", "Conference hall"], rooms: [R("dlx", "Deluxe", 6500), R("twn", "Twin", 6000, 8)] },
  { slug: "nirvana-inn-sylhet", name: "Nirvana Inn Sylhet", city: "Sylhet", stars: 3, amenities: ["WiFi", "Restaurant"], rooms: [R("std", "Standard", 3800), R("dlx", "Deluxe", 5000, 8)] },
  { slug: "castle-salam-khulna", name: "Hotel Castle Salam Khulna", city: "Khulna", stars: 4, amenities: ["Pool", "WiFi", "Gym"], rooms: [R("dlx", "Deluxe", 7000), R("ste", "Suite", 11000, 4)] },
  { slug: "city-inn-khulna", name: "City Inn Khulna", city: "Khulna", stars: 3, amenities: ["WiFi", "Restaurant"], rooms: [R("std", "Standard", 3500), R("dlx", "Deluxe", 4800, 8)] },
  { slug: "grand-riverview-rajshahi", name: "Grand Riverview Hotel Rajshahi", city: "Rajshahi", stars: 4, amenities: ["River view", "Pool", "WiFi"], rooms: [R("dlx", "Deluxe", 6800), R("riv", "River View", 8500, 6)] },
  { slug: "nice-garden-bogura", name: "Hotel Nice Garden Bogura", city: "Rajshahi", stars: 3, amenities: ["WiFi", "Restaurant"], rooms: [R("std", "Standard", 3000), R("dlx", "Deluxe", 4200, 8)] },
  { slug: "hotel-grand-palace-rangpur", name: "Hotel Grand Palace Rangpur", city: "Rangpur", stars: 3, amenities: ["WiFi", "Restaurant", "Conference"], rooms: [R("std", "Standard", 3200), R("dlx", "Deluxe", 4500, 8)] },
  { slug: "nilgiri-hill-resort", name: "Nilgiri Hill Resort Bandarban", city: "Bandarban", stars: 3, amenities: ["Hill view", "Restaurant", "Bonfire"], rooms: [R("cot", "Cottage", 5500, 8), R("fam", "Family Cottage", 8000, 4)] },
  { slug: "sajek-eco-resort", name: "Sajek Valley Eco Resort", city: "Rangamati", stars: 3, amenities: ["Valley view", "BBQ", "Guide desk"], rooms: [R("std", "Standard Cottage", 4000, 10), R("pre", "Premium View", 6000, 6)] },
  { slug: "kuakata-sea-view", name: "Hotel Sea View Kuakata", city: "Kuakata", stars: 3, amenities: ["Sea view", "WiFi", "Restaurant"], rooms: [R("std", "Standard", 3000), R("sea", "Sea Facing", 4500, 8)] },
  { slug: "tanguar-lake-house", name: "Tanguar Lake House Sunamganj", city: "Sunamganj", stars: 3, amenities: ["Lake view", "Boat trips", "Local cuisine"], rooms: [R("std", "Standard", 3500, 8), R("hou", "Houseboat Cabin", 5000, 6)] },
  { slug: "du-sai-bandarban", name: "Du Sai Resort Bandarban", city: "Bandarban", stars: 4, amenities: ["Infinity pool", "Spa", "Hill view"], rooms: [R("dlx", "Deluxe", 9500, 8), R("vil", "Pool Villa", 15000, 4)], featured: true }
];

// ---------- Tours (25) ----------
const TOURS: Array<{ slug: string; title: string; destination: string; durationDays: number; itinerary: string[]; inclusions: string[]; basePrice: number }> = [
  { slug: "cox-bazar-3n", title: "Cox's Bazar Escape — 3 Nights", destination: "Cox's Bazar", durationDays: 4, itinerary: ["Arrive + Laboni beach sunset", "Himchari + Inani beach day", "Saint Martin day trip", "Souvenir shopping + return"], inclusions: ["Hotel", "Breakfast", "Transfers"], basePrice: 18500 },
  { slug: "sundarbans-3d", title: "Sundarbans Mangrove Expedition — 2 Nights", destination: "Sundarbans", durationDays: 3, itinerary: ["Khulna to Mongla cruise start", "Kotka + Kochikhali wildlife", "Harbaria + return"], inclusions: ["AC vessel", "All meals", "Forest permits", "Guide"], basePrice: 15500 },
  { slug: "sajek-2n", title: "Sajek Valley Cloud Chase — 2 Nights", destination: "Sajek", durationDays: 3, itinerary: ["Dhaka to Khagrachari, Alutila cave", "Sajek sunrise + Konglak peak", "Return via Rangamati"], inclusions: ["Resort", "Jeep", "Breakfast", "Guide"], basePrice: 12500 },
  { slug: "bandarban-3n", title: "Bandarban Hills & Trails — 3 Nights", destination: "Bandarban", durationDays: 4, itinerary: ["Arrive + Nilachal sunset", "Nilgiri + Chimbuk + Shoilo Propat", "Boga Lake day trek", "Golden Temple + return"], inclusions: ["Hotel", "Chander gari", "Breakfast", "Guide"], basePrice: 14800 },
  { slug: "sylhet-tea-2n", title: "Sylhet Tea Gardens — 2 Nights", destination: "Sylhet", durationDays: 3, itinerary: ["Malnicherra tea estate + shrine", "Jaflong + Lalakhal boat", "Ratargul swamp forest + return"], inclusions: ["Hotel", "Transport", "Breakfast"], basePrice: 11500 },
  { slug: "saint-martin-2n", title: "Saint Martin Coral Island — 2 Nights", destination: "Saint Martin", durationDays: 3, itinerary: ["Teknaf ship to island, beach evening", "Cheradwip + snorkelling", "Return ship + transfer"], inclusions: ["Resort", "Ship tickets", "Breakfast"], basePrice: 13500 },
  { slug: "rangamati-2n", title: "Rangamati Lake District — 2 Nights", destination: "Rangamati", durationDays: 3, itinerary: ["Kaptai lake cruise", "Shuvolong falls + tribal market", "DC bungalow viewpoint + return"], inclusions: ["Hotel", "Boat", "Breakfast"], basePrice: 10800 },
  { slug: "kuakata-2n", title: "Kuakata Sunrise & Sunset — 2 Nights", destination: "Kuakata", durationDays: 3, itinerary: ["Arrive + beach evening", "Sunrise point + Fatrar char + crab island", "Rakhine village + return"], inclusions: ["Hotel", "Transport", "Breakfast"], basePrice: 9800 },
  { slug: "srimangal-2n", title: "Srimangal Tea Capital — 2 Nights", destination: "Srimangal", durationDays: 3, itinerary: ["Lawachara rainforest trek", "Madhabpur lake + 7-layer tea", "Baikka Beel + return"], inclusions: ["Resort", "Transport", "Breakfast"], basePrice: 9500 },
  { slug: "tanguar-haor-2n", title: "Tanguar Haor Houseboat — 2 Nights", destination: "Sunamganj", durationDays: 3, itinerary: ["Board houseboat, Tekerghat", "Niladri lake + Shimul bagan", "Barikka tila + return"], inclusions: ["Houseboat", "All meals", "Boat"], basePrice: 8900 },
  { slug: "nijhum-dwip-2n", title: "Nijhum Dwip Island Camp — 2 Nights", destination: "Hatiya", durationDays: 3, itinerary: ["Noakhali to island crossing", "Deer forest + beach", "Mangrove trails + return"], inclusions: ["Camp/hotel", "Boat", "Meals"], basePrice: 9200 },
  { slug: "paharpur-mahastan-1d", title: "Paharpur & Mahasthangarh Heritage Day", destination: "Rajshahi", durationDays: 1, itinerary: ["Somapura Mahavihara + museum + Mahasthangarh"], inclusions: ["AC transport", "Lunch", "Guide", "Tickets"], basePrice: 3500 },
  { slug: "sonargaon-day", title: "Sonargaon & Panam City Day Trip", destination: "Sonargaon", durationDays: 1, itinerary: ["Folk museum + Panam Nagar + Goaldi mosque"], inclusions: ["AC transport", "Lunch", "Guide"], basePrice: 2800 },
  { slug: "dhaka-city-1d", title: "Old Dhaka Food & Heritage Walk", destination: "Dhaka", durationDays: 1, itinerary: ["Lalbagh fort + Ahsan Manzil + food crawl"], inclusions: ["Guide", "Lunch", "Boat ride"], basePrice: 2500 },
  { slug: "bangkok-4n", title: "Bangkok + Pattaya Fun — 4 Nights", destination: "Bangkok", durationDays: 5, itinerary: ["Arrive + city temples", "Pattaya coral island", "Safari World + shopping", "Free day + return"], inclusions: ["Hotel", "Flights", "Tours", "Breakfast"], basePrice: 68500 },
  { slug: "malaysia-4n", title: "Kuala Lumpur + Genting — 4 Nights", destination: "Kuala Lumpur", durationDays: 5, itinerary: ["KL tower + Batu caves", "Genting highlands day", "Putrajaya + shopping", "Free day + return"], inclusions: ["Hotel", "Flights", "Tours", "Breakfast"], basePrice: 72500 },
  { slug: "singapore-3n", title: "Singapore Highlights — 3 Nights", destination: "Singapore", durationDays: 4, itinerary: ["Marina Bay + Gardens by the Bay", "Sentosa + Universal day", "Merlion + Orchard + return"], inclusions: ["Hotel", "Flights", "Tours", "Breakfast"], basePrice: 89500 },
  { slug: "dubai-4n", title: "Dubai Explorer — 4 Nights", destination: "Dubai", durationDays: 5, itinerary: ["Marina + JBR + Burj Khalifa", "Desert safari + dinner", "Abu Dhabi Sheikh Zayed mosque", "Gold souk + return"], inclusions: ["Hotel", "Flights", "Visa assist", "Tours"], basePrice: 98500 },
  { slug: "maldives-3n", title: "Maldives Beach Retreat — 3 Nights", destination: "Male", durationDays: 4, itinerary: ["Seaplane to resort", "Snorkelling + sandbank", "Dolphin cruise + spa", "Return"], inclusions: ["Resort", "Flights", "Speedboat", "Breakfast+dinner"], basePrice: 115000 },
  { slug: "nepal-4n", title: "Kathmandu + Pokhara — 4 Nights", destination: "Kathmandu", durationDays: 5, itinerary: ["Pashupatinath + Boudhanath", "Pokhara lakeside + boating", "Sarangkot sunrise", "Bhaktapur + return"], inclusions: ["Hotel", "Flights", "Tours", "Breakfast"], basePrice: 62000 },
  { slug: "golden-triangle-5n", title: "Delhi–Agra–Jaipur Golden Triangle — 5 Nights", destination: "New Delhi", durationDays: 6, itinerary: ["Delhi monuments", "Taj Mahal sunrise", "Agra fort + Jaipur drive", "Amber fort + City palace", "Shopping + return"], inclusions: ["Hotel", "Flights", "AC car", "Breakfast"], basePrice: 78000 },
  { slug: "bali-5n", title: "Bali Island Escape — 5 Nights", destination: "Bali", durationDays: 6, itinerary: ["Kuta beach + temple sunset", "Ubud rice terraces + swing", "Nusa Penida day trip", "Water sports + spa", "Free day + return"], inclusions: ["Hotel", "Flights", "Tours", "Breakfast"], basePrice: 105000 },
  { slug: "vietnam-5n", title: "Hanoi + Ha Long Bay — 5 Nights", destination: "Hanoi", durationDays: 6, itinerary: ["Old quarter + train street", "Ha Long Bay overnight cruise", "Ninh Binh + Trang An", "Ho Chi Minh day + return"], inclusions: ["Hotel", "Flights", "Cruise", "Breakfast"], basePrice: 92000 },
  { slug: "turkey-6n", title: "Istanbul + Cappadocia — 6 Nights", destination: "Istanbul", durationDays: 7, itinerary: ["Blue Mosque + Hagia Sophia + bazaar", "Bosphorus cruise", "Cappadocia fairy chimneys", "Hot-air balloon + Goreme", "Antalya coast day", "Return"], inclusions: ["Hotel", "Flights", "Domestic flight", "Tours"], basePrice: 145000 },
  { slug: "umrah-14n", title: "Umrah Ziyarat Package — 14 Nights", destination: "Jeddah", durationDays: 15, itinerary: ["Makkah rituals + guidance", "Makkah stay + ziyarat", "Madinah transfer + Rawdah", "Madinah stay + return"], inclusions: ["Hotels", "Flights", "Visa", "Transfers", "Guide"], basePrice: 135000 }
];

// ---------- Visa (12) ----------
const VISAS = [
  { code: "THA", name: "Thailand", requirements: { docs: ["Passport 6mo+", "Photo", "Bank statement"], notes: "E-visa available" }, fee: 5500 },
  { code: "MYS", name: "Malaysia", requirements: { docs: ["Passport 6mo+", "Photo", "Return ticket"], notes: "E-visa available" }, fee: 4800 },
  { code: "SGP", name: "Singapore", requirements: { docs: ["Passport 6mo+", "Photo", "Bank statement", "NOC"], notes: "Via authorised agent" }, fee: 6500 },
  { code: "ARE", name: "UAE (Dubai)", requirements: { docs: ["Passport 6mo+", "Photo", "Return ticket"], notes: "E-visa 30 days" }, fee: 12000 },
  { code: "KSA", name: "Saudi Arabia", requirements: { docs: ["Passport 6mo+", "Photo", "NID"], notes: "Umrah + tourist visas" }, fee: 15000 },
  { code: "IND", name: "India", requirements: { docs: ["Passport 6mo+", "Photo", "NID", "Utility bill"], notes: "IVAC submission" }, fee: 1800 },
  { code: "NPL", name: "Nepal", requirements: { docs: ["Passport 6mo+", "Photo"], notes: "On-arrival for BD passport" }, fee: 1500 },
  { code: "VNM", name: "Vietnam", requirements: { docs: ["Passport 6mo+", "Photo", "Approval letter"], notes: "E-visa available" }, fee: 5800 },
  { code: "IDN", name: "Indonesia (Bali)", requirements: { docs: ["Passport 6mo+", "Photo", "Return ticket"], notes: "E-VOA available" }, fee: 6200 },
  { code: "TUR", name: "Turkey", requirements: { docs: ["Passport 6mo+", "Photo", "Bank statement", "Travel insurance"], notes: "Sticker visa" }, fee: 14500 },
  { code: "SCH", name: "Schengen (Europe)", requirements: { docs: ["Passport 6mo+", "Photo", "Bank statement", "Travel insurance", "NOC"], notes: "VFS submission" }, fee: 12500 },
  { code: "GBR", name: "United Kingdom", requirements: { docs: ["Passport 6mo+", "Photo", "Bank statement", "NOC", "Travel history"], notes: "VFS submission" }, fee: 18000 }
];

// ---------- Offers / Coupons / Markup ----------
const OFFERS = [
  { slug: "early-bird-domestic-10", title: "Early Bird: 10% off domestic hotels", validToOffsetDays: 60 },
  { slug: "coxs-flash-15", title: "Cox's Bazar Flash Sale: up to 15% off", validToOffsetDays: 30 },
  { slug: "bkash-cashback", title: "bKash payment cashback weekend", validToOffsetDays: 14 },
  { slug: "honeymoon-sajek", title: "Sajek honeymoon special with free BBQ", validToOffsetDays: 90 },
  { slug: "corporate-dhaka", title: "Corporate stays in Dhaka from ৳3,800", validToOffsetDays: 90 },
  { slug: "student-wander", title: "Student discount on Sundarbans departures", validToOffsetDays: 45 }
];

const COUPONS = [
  { code: "FLIQO10", discountType: "PERCENT" as const, value: 10, maxUses: 1000, minAmount: 5000 },
  { code: "SEABEACH15", discountType: "PERCENT" as const, value: 15, maxUses: 500, minAmount: 10000 },
  { code: "EID20", discountType: "PERCENT" as const, value: 20, maxUses: 300, minAmount: 15000 },
  { code: "NEWUSER500", discountType: "FIXED" as const, value: 500, maxUses: 2000, minAmount: 3000 },
  { code: "HONEYMOON12", discountType: "PERCENT" as const, value: 12, maxUses: 200, minAmount: 20000 },
  { code: "CORP8", discountType: "PERCENT" as const, value: 8, maxUses: 500, minAmount: 8000 }
];

const BLOG_POSTS = [
  { slug: "best-time-coxs-bazar", title: "Best time to visit Cox's Bazar", excerpt: "Month-by-month weather, sea conditions and prices.", content: "# Best time to visit Cox's Bazar\n\nOctober to March brings calm seas and clear skies. Expect higher prices around Eid and New Year — book 2-3 weeks ahead.\n\n## Quick tips\n\n- Sunrise at Laboni, sunset at Inani\n- Weekdays are quieter and cheaper\n- Carry light layers for December nights" },
  { slug: "sundarbans-first-timer", title: "Sundarbans first-timer guide", excerpt: "Permits, what to pack and which itineraries are worth it.", content: "# Sundarbans first-timer guide\n\nAll visits need forest permits — book vessels that include them. November to February is peak wildlife season.\n\n## Pack list\n\n- Binoculars, neutral clothing, insect repellent\n- Cash for entry villages\n- Motion-sickness tablets for river stretches" },
  { slug: "sajek-on-budget", title: "Sajek on a budget", excerpt: "How to do the valley of clouds under ৳10,000.", content: "# Sajek on a budget\n\nTravel in groups of 4+ to split the Khagrachari jeep. Weekday cottages run 30% cheaper.\n\n## Sample budget\n\n- Jeep share: ~৳2,500/person\n- Cottage: ~৳3,500/night split\n- Food: ~৳1,500 for 3 days" }
];

async function main() {
  for (const p of PERMISSIONS) {
    await prisma.permission.upsert({ where: { key: p.key }, update: {}, create: p });
  }

  const allPerms = await prisma.permission.findMany();
  const permByKey = new Map(allPerms.map((p) => [p.key, p.id]));

  for (const r of ROLES) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: { name: r.name, description: r.description, isSystem: r.isSystem }
    });
    const keys = r.permissions === "all" ? [...permByKey.keys()] : r.permissions;
    const filtered = r.name === "Admin" ? keys.filter((k) => k !== "backups.restore") : keys;
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.rolePermission.createMany({
      data: filtered.map((k) => permByKey.get(k)).filter(Boolean).map((permissionId) => ({ roleId: role.id, permissionId: permissionId! }))
    });
  }

  for (const a of AIRPORTS) {
    await prisma.airport.upsert({ where: { code: a.code }, update: { name: a.name, city: a.city, country: a.country }, create: a });
  }
  for (const a of AIRLINES) {
    await prisma.airline.upsert({ where: { code: a.code }, update: { name: a.name }, create: a });
  }
  for (const c of CITIES) {
    await prisma.city.upsert({ where: { code: c.code }, update: { name: c.name, country: c.country }, create: c });
  }

  for (const h of HOTELS) {
    const images = hotelImages(h.city, h.slug);
    await prisma.hotel.upsert({
      where: { slug: h.slug },
      update: { name: h.name, city: h.city, stars: h.stars, amenities: h.amenities, rooms: h.rooms as unknown as object, images, featured: h.featured ?? false, isActive: true },
      create: { slug: h.slug, name: h.name, city: h.city, stars: h.stars, amenities: h.amenities, images, rooms: h.rooms as unknown as object, featured: h.featured ?? false }
    });
  }

  for (const t of TOURS) {
    const images = [TOUR_IMAGES[t.slug] ?? "/images/seed/beach.jpg"];
    const pkg = await prisma.tourPackage.upsert({
      where: { slug: t.slug },
      update: { title: t.title, destination: t.destination, durationDays: t.durationDays, itinerary: { days: t.itinerary.map((plan, i) => ({ d: i + 1, plan })) } as unknown as object, inclusions: t.inclusions, basePrice: t.basePrice, images, isActive: true },
      create: {
        slug: t.slug, title: t.title, destination: t.destination, durationDays: t.durationDays,
        itinerary: { days: t.itinerary.map((plan, i) => ({ d: i + 1, plan })) } as unknown as object,
        inclusions: t.inclusions, basePrice: t.basePrice, images
      }
    });
    // Two upcoming departures per package (idempotent ids)
    for (const n of [0, 1]) {
      const depId = `seed-dep-${t.slug}-${n + 1}`;
      const startDate = new Date(Date.now() + (14 + n * 21) * 86_400_000);
      const seats = 20 + ((t.slug.length + n * 7) % 20);
      await prisma.tourDeparture.upsert({
        where: { id: depId },
        update: { startDate, seatsTotal: seats, seatsLeft: seats, price: t.basePrice },
        create: { id: depId, packageId: pkg.id, startDate, seatsTotal: seats, seatsLeft: seats, price: t.basePrice }
      });
    }
  }
  // Legacy fixed departure id from the original seed
  await prisma.tourDeparture.deleteMany({ where: { id: "seed-cxb-dep-1" } }).catch(() => {});

  for (const v of VISAS) {
    await prisma.visaCountry.upsert({
      where: { code: v.code },
      update: { name: v.name, requirements: v.requirements as unknown as object, fee: v.fee, isActive: true },
      create: { code: v.code, name: v.name, requirements: v.requirements as unknown as object, fee: v.fee }
    });
  }

  const now = new Date();
  for (const o of OFFERS) {
    await prisma.offer.upsert({
      where: { slug: o.slug },
      update: { title: o.title, isActive: true },
      create: { slug: o.slug, title: o.title, validFrom: now, validTo: new Date(now.getTime() + o.validToOffsetDays * 86_400_000), isActive: true }
    });
  }
  for (const c of COUPONS) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: { discountType: c.discountType, value: c.value, maxUses: c.maxUses, minAmount: c.minAmount },
      create: { code: c.code, discountType: c.discountType, value: c.value, maxUses: c.maxUses, validFrom: now, minAmount: c.minAmount }
    });
  }

  const MARKUPS = [
    { productType: "FLIGHT" as const, type: "PERCENT" as const, value: 5, priority: 0 },
    { productType: "HOTEL" as const, type: "PERCENT" as const, value: 8, priority: 0 },
    { productType: "TOUR" as const, type: "FIXED" as const, value: 1000, priority: 0 },
    { productType: "VISA" as const, type: "FIXED" as const, value: 500, priority: 0 }
  ];
  for (const m of MARKUPS) {
    const existing = await prisma.markupRule.findFirst({ where: { productType: m.productType, type: m.type } });
    if (!existing) await prisma.markupRule.create({ data: { ...m, active: true } });
  }

  for (const b of BLOG_POSTS) {
    await prisma.blogPost.upsert({
      where: { slug: b.slug },
      update: { title: b.title, excerpt: b.excerpt, content: b.content, published: true },
      create: { slug: b.slug, title: b.title, excerpt: b.excerpt, content: b.content, published: true }
    });
  }

  // Dev superadmin (password: Admin@123 — change immediately)
  const email = "admin@fliqo.local";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    const superAdmin = await prisma.role.findUnique({ where: { name: "SuperAdmin" } });
    await prisma.user.create({
      data: {
        email,
        name: "Fliqo Admin",
        passwordHash: await argon2.hash("Admin@123"),
        type: "STAFF",
        roleId: superAdmin?.id,
        status: "ACTIVE",
        emailVerifiedAt: new Date()
      }
    });
    console.log("Seeded dev superadmin: admin@fliqo.local / Admin@123");
  }

  const counts = {
    airports: await prisma.airport.count(),
    airlines: await prisma.airline.count(),
    cities: await prisma.city.count(),
    hotels: await prisma.hotel.count(),
    tours: await prisma.tourPackage.count(),
    departures: await prisma.tourDeparture.count(),
    visas: await prisma.visaCountry.count(),
    offers: await prisma.offer.count(),
    coupons: await prisma.coupon.count(),
    posts: await prisma.blogPost.count()
  };
  console.log("Seed complete", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
