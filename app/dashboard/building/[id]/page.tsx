"use client";

import { useState, useEffect } from "react";
import {
  MapPin, Bed, Bath, Ruler, ChevronLeft, ChevronRight, ArrowLeft,
  Building2, Car, Dog, Home, Edit, X, CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

const formatCurrency = (amount: number | null | undefined) => {
  if (amount === null || amount === undefined) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
};

interface Unit {
  id: string;
  unit_number?: string;
  floor?: number;
  floor_plan_name?: string;
  beds: number;
  baths: number;
  sqft?: number;
  price_monthly?: number;
  status?: string;
  images?: string[];
  move_in_special?: string;
  available_date?: string;
}

interface BuildingData {
  id: string;
  name?: string;
  address: string;
  city?: string;
  state?: string;
  zip_code?: string;
  description?: string;
  type?: string;
  year_built?: number;
  total_units?: number;
  amenities?: string[];
  community_features?: string[];
  rules?: string[];
  pet_policy?: string;
  parking_type?: string;
  laundry_type?: string;
  walk_score?: number | null;
  transit_score?: number | null;
  images?: string[];
  created_at?: string;
}

export default function BuildingPage() {
  const params = useParams();
  const router = useRouter();
  const buildingId = params.id as string;

  const [building, setBuilding] = useState<BuildingData | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [unitFilter, setUnitFilter] = useState<"all" | "available">("all");

  useEffect(() => {
    const fetchBuilding = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/buildings/${buildingId}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setBuilding(data.building);
        setUnits(data.units || []);
      } catch {
        setBuilding(null);
      } finally {
        setLoading(false);
      }
    };
    if (buildingId) fetchBuilding();
  }, [buildingId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading building...</p>
        </div>
      </div>
    );
  }

  if (!building) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-black mb-4">Building not found</h2>
          <Link href="/dashboard?tab=properties">
            <button className="px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-all">
              Back to Properties
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const images = building.images?.length ? building.images : [];
  const nextImage = () => setCurrentImageIndex((i) => (i + 1) % images.length);
  const prevImage = () => setCurrentImageIndex((i) => (i - 1 + images.length) % images.length);

  const availableUnits = units.filter((u) => (u.status || "").toLowerCase() === "available");
  const filteredUnits = unitFilter === "available" ? availableUnits : units;

  const prices = units.map((u) => u.price_monthly).filter(Boolean) as number[];
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;

  const bedOptions = [...new Set(units.map((u) => u.beds))].sort((a, b) => a - b);

  const fullAddress = [
    building.address,
    building.city,
    building.state,
    building.zip_code,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="p-10">
      {/* Back */}
      <div className="mb-6 w-fit">
        <Link href="/dashboard?tab=properties">
          <button className="flex items-center gap-2 text-gray-700 hover:text-black font-semibold transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Back to Properties
          </button>
        </Link>
      </div>

      <div className="flex gap-6">
        <div className="flex-1">
          {/* Image Gallery */}
          <div className="bg-white rounded-3xl overflow-hidden shadow-lg mb-8">
            <div className="relative h-[500px] bg-gray-200 group">
              {images.length > 0 ? (
                <img
                  src={images[currentImageIndex]}
                  alt={`${building.name || building.address} ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Building2 className="w-16 h-16" />
                </div>
              )}

              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <ChevronLeft className="w-6 h-6 text-black" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <ChevronRight className="w-6 h-6 text-black" />
                  </button>
                </>
              )}

              {images.length > 0 && (
                <div className="absolute bottom-4 right-4 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-semibold">
                  {currentImageIndex + 1} / {images.length}
                </div>
              )}

              <div className="absolute top-4 right-4">
                <span className="px-4 py-2 rounded-full text-sm font-bold bg-black text-white shadow-lg">
                  Multi-Unit
                </span>
              </div>
            </div>

            {/* Building Info */}
            <div className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-black mb-1">
                    {building.name || building.address}
                  </h1>
                  <div className="flex items-center gap-2 text-gray-600 mb-3">
                    <MapPin className="w-5 h-5" />
                    <span className="text-lg">{fullAddress}</span>
                  </div>
                  <div className="flex items-center gap-2 text-lg">
                    <span className="font-semibold text-black">
                      {minPrice > 0
                        ? minPrice === maxPrice
                          ? formatCurrency(minPrice)
                          : `${formatCurrency(minPrice)} – ${formatCurrency(maxPrice)}`
                        : "Contact for pricing"}
                    </span>
                    {minPrice > 0 && <span className="text-gray-500">/mo</span>}
                  </div>
                </div>
              </div>

              {/* Building Stats */}
              <div className="grid grid-cols-4 gap-6 py-6 border-y border-gray-200">
                <div className="text-center">
                  <Building2 className="w-8 h-8 mx-auto mb-2 text-gray-700" />
                  <div className="text-3xl font-bold text-black">{units.length}</div>
                  <div className="text-sm text-gray-600">Total Units</div>
                </div>
                <div className="text-center">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
                  <div className="text-3xl font-bold text-emerald-600">{availableUnits.length}</div>
                  <div className="text-sm text-gray-600">Available</div>
                </div>
                <div className="text-center">
                  <Bed className="w-8 h-8 mx-auto mb-2 text-gray-700" />
                  <div className="text-3xl font-bold text-black">
                    {bedOptions.length > 0
                      ? bedOptions.map((b) => (b === 0 ? "Studio" : `${b}bd`)).join(", ")
                      : "—"}
                  </div>
                  <div className="text-sm text-gray-600">Floor Plans</div>
                </div>
                <div className="text-center">
                  <Home className="w-8 h-8 mx-auto mb-2 text-gray-700" />
                  <div className="text-xl font-bold text-black capitalize">{building.type?.replace(/_/g, " ") || "Apartment"}</div>
                  <div className="text-sm text-gray-600">Building Type</div>
                </div>
              </div>

              {/* Description */}
              {building.description && (
                <div className="mt-8">
                  <h2 className="text-2xl font-bold text-black mb-4">About This Building</h2>
                  <p className="text-gray-700 leading-relaxed text-lg">{building.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Available Units ── */}
          <div className="bg-white rounded-3xl overflow-hidden shadow-lg mb-8">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-black">Available Units</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setUnitFilter("all")}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      unitFilter === "all"
                        ? "bg-black text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    All ({units.length})
                  </button>
                  <button
                    onClick={() => setUnitFilter("available")}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      unitFilter === "available"
                        ? "bg-black text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Available ({availableUnits.length})
                  </button>
                </div>
              </div>

              {/* Table header */}
              <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-4 py-3 bg-gray-50 rounded-t-xl text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <span className="col-span-3">Unit</span>
                <span className="col-span-2">Sqft</span>
                <span className="col-span-2">Beds / Baths</span>
                <span className="col-span-2 text-right">Rent</span>
                <span className="col-span-3 text-right">Status</span>
              </div>

              <div className="divide-y divide-gray-100 border border-gray-100 rounded-b-xl sm:rounded-t-none rounded-xl sm:border-t-0">
                {filteredUnits.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-400">No units match this filter.</div>
                ) : (
                  filteredUnits.map((unit) => {
                    const unitImage = unit.images?.[0];
                    const isAvailable = (unit.status || "").toLowerCase() === "available";
                    return (
                      <Link
                        key={unit.id}
                        href={`/dashboard/property/${unit.id}`}
                        className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 px-4 py-4 hover:bg-gray-50 transition-colors items-center"
                      >
                        <div className="col-span-3 flex items-center gap-3">
                          {unitImage ? (
                            <img
                              src={unitImage}
                              alt={`Unit ${unit.unit_number}`}
                              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <Home className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-gray-900">
                              {unit.unit_number || "—"}
                            </span>
                            {unit.floor_plan_name && (
                              <p className="text-xs text-gray-400">{unit.floor_plan_name}</p>
                            )}
                          </div>
                        </div>

                        <div className="col-span-2 text-sm text-gray-600">
                          {unit.sqft ? `${unit.sqft} sqft` : "—"}
                        </div>

                        <div className="col-span-2 text-sm text-gray-600">
                          {unit.beds === 0 ? "Studio" : `${unit.beds} bd`}, {unit.baths} ba
                        </div>

                        <div className="col-span-2 text-right font-semibold text-gray-900">
                          {formatCurrency(unit.price_monthly)}
                        </div>

                        <div className="col-span-3 flex items-center justify-end gap-2">
                          {unit.move_in_special && (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
                              Special
                            </span>
                          )}
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              isAvailable
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            {(unit.status || "Available").charAt(0).toUpperCase() +
                              (unit.status || "Available").slice(1).toLowerCase()}
                          </span>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* ── Building Details ── */}
          <div className="bg-white rounded-3xl overflow-hidden shadow-lg mb-8 p-8">
            <h2 className="text-2xl font-bold text-black mb-6">Building Details</h2>
            <div className="bg-gray-50 rounded-xl p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {building.type && (
                <div className="flex justify-between py-3 border-b border-gray-200">
                  <span className="text-gray-600 font-medium">Type</span>
                  <span className="text-black font-semibold capitalize">{building.type.replace(/_/g, " ")}</span>
                </div>
              )}
              {building.year_built && (
                <div className="flex justify-between py-3 border-b border-gray-200">
                  <span className="text-gray-600 font-medium">Year Built</span>
                  <span className="text-black font-semibold">{building.year_built}</span>
                </div>
              )}
              {building.parking_type && (
                <div className="flex justify-between py-3 border-b border-gray-200">
                  <span className="text-gray-600 font-medium">Parking</span>
                  <span className="text-black font-semibold capitalize">{building.parking_type.replace(/_/g, " ")}</span>
                </div>
              )}
              {building.laundry_type && (
                <div className="flex justify-between py-3 border-b border-gray-200">
                  <span className="text-gray-600 font-medium">Laundry</span>
                  <span className="text-black font-semibold capitalize">{building.laundry_type.replace(/_/g, " ")}</span>
                </div>
              )}
              {building.pet_policy && (
                <div className="flex justify-between py-3 border-b border-gray-200">
                  <span className="text-gray-600 font-medium">Pet Policy</span>
                  <span className="text-black font-semibold capitalize">{building.pet_policy.replace(/_/g, " ")}</span>
                </div>
              )}
              <div className="flex justify-between py-3 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Total Units</span>
                <span className="text-black font-semibold">{building.total_units || units.length}</span>
              </div>
            </div>
          </div>

          {/* Amenities */}
          {building.amenities && building.amenities.length > 0 && (
            <div className="bg-white rounded-3xl overflow-hidden shadow-lg mb-8 p-8">
              <h2 className="text-2xl font-bold text-black mb-4">Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {building.amenities.map((amenity, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-gray-700">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Community Features */}
          {building.community_features && building.community_features.length > 0 && (
            <div className="bg-white rounded-3xl overflow-hidden shadow-lg mb-8 p-8">
              <h2 className="text-2xl font-bold text-black mb-4">Community Features</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {building.community_features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rules */}
          {building.rules && building.rules.length > 0 && (
            <div className="bg-white rounded-3xl overflow-hidden shadow-lg mb-8 p-8">
              <h2 className="text-2xl font-bold text-black mb-4">Building Rules</h2>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                <ul className="space-y-3">
                  {building.rules.map((rule, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="text-amber-600 font-bold mt-1">&bull;</span>
                      <span className="text-gray-700 flex-1">{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Location */}
          <div className="bg-white rounded-3xl overflow-hidden shadow-lg mb-8 p-8">
            <h2 className="text-2xl font-bold text-black mb-4">Location & Neighborhood</h2>
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-6">
              <div className="flex items-start gap-3 mb-4">
                <MapPin className="w-6 h-6 text-indigo-600 mt-1" />
                <div>
                  <h3 className="font-bold text-black text-lg mb-1">{fullAddress}</h3>
                </div>
              </div>

              {(building.walk_score || building.transit_score) && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  {building.walk_score != null && (
                    <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                      <div className="text-2xl font-bold text-black">{building.walk_score}</div>
                      <div className="text-sm text-gray-600 mt-1">Walk Score</div>
                    </div>
                  )}
                  {building.transit_score != null && (
                    <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                      <div className="text-2xl font-bold text-black">{building.transit_score}</div>
                      <div className="text-sm text-gray-600 mt-1">Transit Score</div>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 rounded-xl overflow-hidden shadow-sm h-[450px] bg-gray-100">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(fullAddress)}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
                  frameBorder="0"
                  scrolling="no"
                  style={{ filter: "saturate(0.8) contrast(1.1)" }}
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
