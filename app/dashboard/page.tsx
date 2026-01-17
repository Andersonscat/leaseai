"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Inbox, TrendingUp, Home, BarChart3, MapPin, Bed, Bath, Ruler, Dog, Filter, X } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "properties";
  
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [sortBy, setSortBy] = useState<string>("default");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [bedsFilter, setBedsFilter] = useState<string>("all");
  const [petsFilter, setPetsFilter] = useState<string>("all");
  const [messagesFilter, setMessagesFilter] = useState<string>("all");

  // Mock properties data with detailed info
  const properties = [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800",
      images: [
        "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
        "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800"
      ],
      address: "123 Main Street, Bellevue, WA",
      price: "$3,500/mo",
      beds: 2,
      baths: 2,
      sqft: "1,245",
      pets: "Allowed",
      status: "Available",
      description: "Beautiful modern home with stunning views. Recently renovated with high-end finishes throughout. Open concept living space perfect for entertaining.",
      amenities: ["WiFi", "Air Conditioning", "Parking", "Dishwasher", "Washer/Dryer", "Hardwood Floors"],
      features: ["Central AC", "Stainless Steel Appliances", "Granite Countertops", "Walk-in Closets", "Balcony", "Storage Space"],
      rules: ["No smoking", "Pets allowed with deposit", "Maximum 4 occupants", "12 month lease minimum"],
      interestedTenants: [
        { name: "John Smith", avatar: "https://ui-avatars.com/api/?name=John+Smith&background=3B82F6&color=fff" },
        { name: "Sarah Johnson", avatar: "https://ui-avatars.com/api/?name=Sarah+Johnson&background=10B981&color=fff" },
      ],
      chatCount: 2
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
      images: [
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800"
      ],
      address: "456 Oak Avenue, Seattle, WA",
      price: "$4,200/mo",
      beds: 3,
      baths: 2.5,
      sqft: "1,850",
      pets: "No pets",
      status: "Available",
      description: "Spacious family home in quiet neighborhood. Large backyard perfect for entertaining. Close to schools and parks.",
      amenities: ["WiFi", "Central Heating", "2-Car Garage", "Dishwasher", "Washer/Dryer", "Fireplace"],
      features: ["Open Kitchen", "Master Suite", "Hardwood Floors", "Fenced Yard", "Patio", "Updated Bathroom"],
      rules: ["No smoking", "No pets", "Maximum 6 occupants", "Credit check required"],
      interestedTenants: [
        { name: "Mike Chen", avatar: "https://ui-avatars.com/api/?name=Mike+Chen&background=F59E0B&color=fff" },
      ],
      chatCount: 1
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
      images: [
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800"
      ],
      address: "789 Pine Road, Redmond, WA",
      price: "$5,800/mo",
      beds: 4,
      baths: 3,
      sqft: "2,650",
      pets: "Cats only",
      status: "Pending",
      description: "Luxury estate with premium finishes. Smart home features throughout. Private backyard with pool and entertainment area.",
      amenities: ["WiFi", "Smart Home", "Pool", "3-Car Garage", "Wine Cellar", "Home Theater"],
      features: ["Gourmet Kitchen", "Spa Bathroom", "Walk-in Closets", "Home Office", "Gym Space", "Security System"],
      rules: ["No smoking", "Cats allowed only", "Maximum 8 occupants", "Background check required"],
      interestedTenants: [
        { name: "Emily Davis", avatar: "https://ui-avatars.com/api/?name=Emily+Davis&background=EF4444&color=fff" },
        { name: "David Lee", avatar: "https://ui-avatars.com/api/?name=David+Lee&background=8B5CF6&color=fff" },
        { name: "Anna White", avatar: "https://ui-avatars.com/api/?name=Anna+White&background=EC4899&color=fff" },
      ],
      chatCount: 3
    },
    {
      id: 4,
      image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
      images: [
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800"
      ],
      address: "321 Elm Street, Kirkland, WA",
      price: "$2,900/mo",
      beds: 1,
      baths: 1,
      sqft: "850",
      pets: "No pets",
      status: "Available",
      description: "Cozy studio apartment perfect for professionals. Modern amenities and great location near downtown.",
      amenities: ["WiFi", "Air Conditioning", "Parking Spot", "Dishwasher", "In-unit Laundry"],
      features: ["Hardwood Floors", "Updated Kitchen", "Large Windows", "Storage", "Bike Storage"],
      rules: ["No smoking", "No pets", "Maximum 2 occupants", "First and last month required"],
      interestedTenants: [],
      chatCount: 0
    },
    {
      id: 5,
      image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
      images: [
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800"
      ],
      address: "555 Maple Drive, Bellevue, WA",
      price: "$6,500/mo",
      beds: 4,
      baths: 3.5,
      sqft: "3,495",
      pets: "Allowed",
      status: "Available",
      description: "Executive home with panoramic views. High-end finishes and designer touches throughout. Perfect for luxury living.",
      amenities: ["WiFi", "Smart Home", "Pool & Spa", "4-Car Garage", "Wine Room", "Gym"],
      features: ["Chef's Kitchen", "Master Suite", "Home Theater", "Office", "Guest Suite", "Landscaped Yard"],
      rules: ["No smoking", "Pets allowed with approval", "Maximum 8 occupants", "References required"],
      interestedTenants: [
        { name: "Tom Brown", avatar: "https://ui-avatars.com/api/?name=Tom+Brown&background=06B6D4&color=fff" },
        { name: "Lisa Green", avatar: "https://ui-avatars.com/api/?name=Lisa+Green&background=84CC16&color=fff" },
        { name: "Mark Wilson", avatar: "https://ui-avatars.com/api/?name=Mark+Wilson&background=F97316&color=fff" },
        { name: "Sophie Taylor", avatar: "https://ui-avatars.com/api/?name=Sophie+Taylor&background=A855F7&color=fff" },
      ],
      chatCount: 4
    },
    {
      id: 6,
      image: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800",
      images: [
        "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800"
      ],
      address: "987 Cedar Lane, Issaquah, WA",
      price: "$3,200/mo",
      beds: 2,
      baths: 1.5,
      sqft: "1,120",
      pets: "Dogs only",
      status: "Available",
      description: "Charming townhouse with modern updates. Great for dog owners with nearby parks and trails.",
      amenities: ["WiFi", "Central Heating", "Parking", "Dishwasher", "Washer/Dryer Hookup"],
      features: ["Updated Kitchen", "Patio", "Storage", "Hardwood Floors", "Walk-in Closet"],
      rules: ["No smoking", "Dogs allowed (max 2)", "Maximum 4 occupants", "Yard maintenance required"],
      interestedTenants: [
        { name: "Chris Martin", avatar: "https://ui-avatars.com/api/?name=Chris+Martin&background=14B8A6&color=fff" },
      ],
      chatCount: 1
    }
  ];

  // Filter and sort properties
  const getFilteredAndSortedProperties = () => {
    let filtered = [...properties];

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    // Apply messages filter
    if (messagesFilter === "with-messages") {
      filtered = filtered.filter(p => p.chatCount > 0);
    } else if (messagesFilter === "no-messages") {
      filtered = filtered.filter(p => p.chatCount === 0);
    }

    // Apply bedrooms filter
    if (bedsFilter !== "all") {
      if (bedsFilter === "4+") {
        filtered = filtered.filter(p => p.beds >= 4);
      } else {
        filtered = filtered.filter(p => p.beds === parseInt(bedsFilter));
      }
    }

    // Apply pets filter
    if (petsFilter !== "all") {
      filtered = filtered.filter(p => p.pets === petsFilter);
    }

    // Apply sorting
    switch (sortBy) {
      case "messages-high":
        filtered.sort((a, b) => b.chatCount - a.chatCount);
        break;
      case "messages-low":
        filtered.sort((a, b) => a.chatCount - b.chatCount);
        break;
      case "price-high":
        filtered.sort((a, b) => {
          const priceA = parseInt(a.price.replace(/[^0-9]/g, ""));
          const priceB = parseInt(b.price.replace(/[^0-9]/g, ""));
          return priceB - priceA;
        });
        break;
      case "price-low":
        filtered.sort((a, b) => {
          const priceA = parseInt(a.price.replace(/[^0-9]/g, ""));
          const priceB = parseInt(b.price.replace(/[^0-9]/g, ""));
          return priceA - priceB;
        });
        break;
      case "beds-high":
        filtered.sort((a, b) => b.beds - a.beds);
        break;
      case "beds-low":
        filtered.sort((a, b) => a.beds - b.beds);
        break;
      default:
        // default order
        break;
    }

    return filtered;
  };

  const filteredProperties = getFilteredAndSortedProperties();

  return (
    <div className="p-10">
          {/* Inbox Tab */}
          {activeTab === "inbox" && (
            <>
              <div className="mb-10">
                <h2 className="text-4xl font-bold text-black mb-2">Inbox</h2>
                <p className="text-lg text-gray-600">Manage your leads and conversations</p>
              </div>

              {/* Stats Cards */}
              <div className="grid md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-600 font-semibold text-sm">NEW LEADS</span>
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                      <Inbox className="w-5 h-5 text-gray-700" />
                    </div>
                  </div>
                  <div className="text-5xl font-bold text-black mb-2">0</div>
                  <p className="text-gray-500 text-sm">new leads today</p>
                </div>

                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-600 font-semibold text-sm">CONVERSION</span>
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-gray-700" />
                    </div>
                  </div>
                  <div className="text-5xl font-bold text-black mb-2">—%</div>
                  <p className="text-gray-500 text-sm">lead to meeting rate</p>
                </div>

                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-600 font-semibold text-sm">PROPERTIES</span>
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                      <Home className="w-5 h-5 text-gray-700" />
                    </div>
                  </div>
                  <div className="text-5xl font-bold text-black mb-2">{properties.length}</div>
                  <p className="text-gray-500 text-sm">active listings</p>
                </div>
              </div>

              {/* Getting Started */}
              <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-200">
                <h3 className="text-2xl font-bold text-black mb-8">Getting Started</h3>
                <div className="space-y-6">
                  <div className="flex items-start gap-5 p-6 rounded-xl bg-gray-50">
                    <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-lg font-bold flex-shrink-0">
                      1
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg text-black mb-2">Connect your email</h4>
                      <p className="text-gray-600 mb-4">Sync your inbox to start receiving and managing leads</p>
                      <button className="text-black font-semibold hover:underline text-sm">
                        Connect now →
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-5 p-6 rounded-xl opacity-50">
                    <div className="w-10 h-10 rounded-full bg-gray-300 text-white flex items-center justify-center text-lg font-bold flex-shrink-0">
                      2
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg text-gray-500 mb-2">Set up AI agent</h4>
                      <p className="text-gray-500">Configure auto-responses and lead qualification rules</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-5 p-6 rounded-xl opacity-50">
                    <div className="w-10 h-10 rounded-full bg-gray-300 text-white flex items-center justify-center text-lg font-bold flex-shrink-0">
                      3
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg text-gray-500 mb-2">Link calendar</h4>
                      <p className="text-gray-500">Enable automatic meeting scheduling with clients</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Properties Tab */}
          {activeTab === "properties" && (
            <>
              <div className="mb-10 flex items-center justify-between">
                <div>
                  <h2 className="text-4xl font-bold text-black mb-2">Properties</h2>
                  <p className="text-lg text-gray-600">Manage your real estate listings</p>
                </div>
                
                {/* Filter Button */}
                <div className="relative">
                  <button
                    onClick={() => setShowFilterMenu(!showFilterMenu)}
                    className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-semibold"
                  >
                    <Filter className="w-5 h-5" />
                    Filter
                  </button>

                  {/* Filter Dropdown Menu */}
                  {showFilterMenu && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 z-50">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-black">Filters</h3>
                        <button
                          onClick={() => setShowFilterMenu(false)}
                          className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-all"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="space-y-6">
                        {/* Sort By */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
                          <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                          >
                            <option value="default">Default</option>
                            <option value="messages-high">Messages (High to Low)</option>
                            <option value="messages-low">Messages (Low to High)</option>
                            <option value="price-high">Price (High to Low)</option>
                            <option value="price-low">Price (Low to High)</option>
                            <option value="beds-high">Bedrooms (Most to Least)</option>
                            <option value="beds-low">Bedrooms (Least to Most)</option>
                          </select>
                        </div>

                        {/* Status Filter */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                          <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                          >
                            <option value="all">All Status</option>
                            <option value="Available">Available</option>
                            <option value="Pending">Pending</option>
                          </select>
                        </div>

                        {/* Messages Filter */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Messages</label>
                          <select
                            value={messagesFilter}
                            onChange={(e) => setMessagesFilter(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                          >
                            <option value="all">All Properties</option>
                            <option value="with-messages">With Messages</option>
                            <option value="no-messages">No Messages</option>
                          </select>
                        </div>

                        {/* Bedrooms Filter */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Bedrooms</label>
                          <select
                            value={bedsFilter}
                            onChange={(e) => setBedsFilter(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                          >
                            <option value="all">Any</option>
                            <option value="1">1 Bedroom</option>
                            <option value="2">2 Bedrooms</option>
                            <option value="3">3 Bedrooms</option>
                            <option value="4+">4+ Bedrooms</option>
                          </select>
                        </div>

                        {/* Pets Filter */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Pet Policy</label>
                          <select
                            value={petsFilter}
                            onChange={(e) => setPetsFilter(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                          >
                            <option value="all">All</option>
                            <option value="Allowed">Pets Allowed</option>
                            <option value="No pets">No Pets</option>
                            <option value="Cats only">Cats Only</option>
                            <option value="Dogs only">Dogs Only</option>
                          </select>
                        </div>

                        {/* Reset Button */}
                        <button
                          onClick={() => {
                            setSortBy("default");
                            setStatusFilter("all");
                            setMessagesFilter("all");
                            setBedsFilter("all");
                            setPetsFilter("all");
                          }}
                          className="w-full py-2 text-gray-600 hover:text-black font-semibold transition-colors"
                        >
                          Reset All Filters
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProperties.map((property) => (
                  <Link 
                    key={property.id} 
                    href={`/dashboard/property/${property.id}`}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-2xl hover:-translate-y-1 hover:border-gray-300 transition-all duration-300 cursor-pointer block group"
                  >
                    {/* Property Image */}
                    <div className="relative h-48 bg-gray-200 overflow-hidden">
                      <img 
                        src={property.image} 
                        alt={property.address}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute top-3 right-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          property.status === "Available" 
                            ? "bg-green-500 text-white" 
                            : "bg-yellow-500 text-black"
                        }`}>
                          {property.status}
                        </span>
                      </div>
                    </div>

                    {/* Property Info */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3 gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-2xl font-bold text-black mb-1 group-hover:text-gray-700 transition-colors">{property.price}</h3>
                          <div className="flex items-start gap-1 text-gray-600 text-sm">
                            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>{property.address}</span>
                          </div>
                        </div>
                        
                        {/* Interested Tenants Badges */}
                        {property.chatCount > 0 && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <div className="flex -space-x-2">
                              {property.interestedTenants.slice(0, 3).map((tenant, idx) => (
                                <img
                                  key={idx}
                                  src={tenant.avatar}
                                  alt={tenant.name}
                                  className="w-8 h-8 rounded-full border-2 border-white"
                                  title={tenant.name}
                                />
                              ))}
                              {property.chatCount > 3 && (
                                <div className="w-8 h-8 rounded-full bg-gray-700 border-2 border-white flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">+{property.chatCount - 3}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Property Details */}
                      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Bed className="w-4 h-4" />
                          <span className="text-sm font-medium">{property.beds} BD</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <Bath className="w-4 h-4" />
                          <span className="text-sm font-medium">{property.baths} BA</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <Ruler className="w-4 h-4" />
                          <span className="text-sm font-medium">{property.sqft} sq.ft</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <Dog className="w-4 h-4" />
                          <span className="text-sm font-medium">{property.pets}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Add Property Button */}
              <div className="mt-8 text-center">
                <button className="px-8 py-4 bg-gray-100 text-black rounded-lg font-semibold hover:bg-gray-200 transition-all">
                  + Add New Property
                </button>
              </div>
            </>
          )}

          {/* Analytics Tab */}
          {activeTab === "analytics" && (
            <>
              <div className="mb-10">
                <h2 className="text-4xl font-bold text-black mb-2">Analytics</h2>
                <p className="text-lg text-gray-600">Track your performance metrics</p>
              </div>

              <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-200 text-center">
                <BarChart3 className="w-20 h-20 mx-auto mb-4 text-gray-300" />
                <h3 className="text-2xl font-bold text-black mb-2">Analytics Coming Soon</h3>
                <p className="text-gray-600">
                  Track conversion rates, response times, and lead quality with real-time insights.
                </p>
              </div>
            </>
          )}
    </div>
  );
}
