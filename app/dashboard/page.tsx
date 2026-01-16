"use client";

import { useSearchParams } from "next/navigation";
import { Inbox, TrendingUp, Home, BarChart3, MapPin, Bed, Bath, Ruler, Dog } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "properties";

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
      rules: ["No smoking", "Pets allowed with deposit", "Maximum 4 occupants", "12 month lease minimum"]
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
      rules: ["No smoking", "No pets", "Maximum 6 occupants", "Credit check required"]
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
      rules: ["No smoking", "Cats allowed only", "Maximum 8 occupants", "Background check required"]
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
      rules: ["No smoking", "No pets", "Maximum 2 occupants", "First and last month required"]
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
      rules: ["No smoking", "Pets allowed with approval", "Maximum 8 occupants", "References required"]
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
      rules: ["No smoking", "Dogs allowed (max 2)", "Maximum 4 occupants", "Yard maintenance required"]
    }
  ];

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
              <div className="mb-10">
                <h2 className="text-4xl font-bold text-black mb-2">Properties</h2>
                <p className="text-lg text-gray-600">Manage your real estate listings</p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map((property) => (
                  <Link 
                    key={property.id} 
                    href={`/dashboard/property/${property.id}`}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 cursor-pointer block"
                  >
                    {/* Property Image */}
                    <div className="relative h-48 bg-gray-200 overflow-hidden group">
                      <img 
                        src={property.image} 
                        alt={property.address}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                      <div className="mb-3">
                        <h3 className="text-2xl font-bold text-black mb-1">{property.price}</h3>
                        <div className="flex items-start gap-1 text-gray-600 text-sm">
                          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>{property.address}</span>
                        </div>
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
