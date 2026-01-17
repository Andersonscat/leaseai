"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Inbox, TrendingUp, Home, BarChart3, MapPin, Bed, Bath, Ruler, Dog, Filter, ChevronUp, ChevronDown, Mail, MailOpen, FileText, Star, Clock, CheckCircle, XCircle, MoreVertical, Search, Users, Phone, MessageSquare, DollarSign } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "properties";
  
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedSort, setSelectedSort] = useState<string>("none");
  const [propertyType, setPropertyType] = useState<"rent" | "sale">("rent");
  const [propertySearch, setPropertySearch] = useState("");
  const [contractSearch, setContractSearch] = useState("");
  const [contractFilter, setContractFilter] = useState<"all" | "active" | "pending" | "completed" | "draft">("all");
  const [tenantSearch, setTenantSearch] = useState("");
  const [tenantFilter, setTenantFilter] = useState<"all" | "current" | "pending" | "late" | "archived">("all");

  // Mock tenants data
  const tenants = [
    {
      id: 1,
      name: "John Smith",
      avatar: "https://ui-avatars.com/api/?name=John+Smith&background=3B82F6&color=fff",
      email: "john.smith@email.com",
      phone: "+1-425-3250400",
      property: "123 Main Street, Bellevue, WA",
      status: "Current",
      leaseStart: "Jan 1, 2024",
      leaseEnd: "Dec 31, 2024",
      rentAmount: "$3,500/mo",
      paymentStatus: "Paid",
      lastPayment: "2 days ago",
      moveInDate: "Jan 1, 2024"
    },
    {
      id: 2,
      name: "Emily Davis",
      avatar: "https://ui-avatars.com/api/?name=Emily+Davis&background=EF4444&color=fff",
      email: "emily.davis@email.com",
      phone: "+1-206-5551234",
      property: "789 Pine Road, Redmond, WA",
      status: "Late Payment",
      leaseStart: "Feb 1, 2024",
      leaseEnd: "Jan 31, 2025",
      rentAmount: "$5,800/mo",
      paymentStatus: "Overdue",
      lastPayment: "35 days ago",
      moveInDate: "Feb 1, 2024"
    },
    {
      id: 3,
      name: "Sarah Johnson",
      avatar: "https://ui-avatars.com/api/?name=Sarah+Johnson&background=10B981&color=fff",
      email: "sarah.j@email.com",
      phone: "+1-425-5559876",
      property: "555 Maple Drive, Bellevue, WA",
      status: "Current",
      leaseStart: "Mar 15, 2024",
      leaseEnd: "Mar 14, 2025",
      rentAmount: "$6,500/mo",
      paymentStatus: "Paid",
      lastPayment: "5 days ago",
      moveInDate: "Mar 15, 2024"
    },
    {
      id: 4,
      name: "Mike Chen",
      avatar: "https://ui-avatars.com/api/?name=Mike+Chen&background=F59E0B&color=fff",
      email: "mike.chen@email.com",
      phone: "+1-206-5554321",
      property: "456 Oak Avenue, Seattle, WA",
      status: "Archived",
      leaseStart: "Dec 1, 2023",
      leaseEnd: "Nov 30, 2024",
      rentAmount: "$4,200/mo",
      paymentStatus: "Completed",
      lastPayment: "30 days ago",
      moveInDate: "Dec 1, 2023"
    },
    {
      id: 5,
      name: "David Lee",
      avatar: "https://ui-avatars.com/api/?name=David+Lee&background=8B5CF6&color=fff",
      email: "david.lee@email.com",
      phone: "+1-425-5552468",
      property: "321 Cedar Lane, Kirkland, WA",
      status: "Pending",
      leaseStart: "Feb 1, 2024",
      leaseEnd: "Jan 31, 2025",
      rentAmount: "$4,800/mo",
      paymentStatus: "Deposit Paid",
      lastPayment: "1 week ago",
      moveInDate: "Feb 1, 2024"
    },
    {
      id: 6,
      name: "Anna White",
      avatar: "https://ui-avatars.com/api/?name=Anna+White&background=EC4899&color=fff",
      email: "anna.white@email.com",
      phone: "+1-206-5557890",
      property: "777 Elm Street, Bellevue, WA",
      status: "Current",
      leaseStart: "Jan 15, 2024",
      leaseEnd: "Jan 14, 2025",
      rentAmount: "$3,200/mo",
      paymentStatus: "Paid",
      lastPayment: "1 week ago",
      moveInDate: "Jan 15, 2024"
    },
  ];

  // Mock contracts data
  const contracts = [
    {
      id: 1,
      name: "Lease_123MainSt_JohnSmith",
      property: "123 Main Street, Bellevue, WA",
      tenant: "John Smith",
      status: "Active",
      startDate: "Jan 1, 2024",
      endDate: "Dec 31, 2024",
      lastModified: "2 weeks ago",
      created: "3 months ago",
      isPrimary: true
    },
    {
      id: 2,
      name: "Lease_789PineRd_EmilyDavis",
      property: "789 Pine Road, Redmond, WA",
      tenant: "Emily Davis",
      status: "Pending",
      startDate: "Feb 1, 2024",
      endDate: "Jan 31, 2025",
      lastModified: "1 day ago",
      created: "1 week ago",
      isPrimary: false
    },
    {
      id: 3,
      name: "Sale_456OakAve_MikeChen",
      property: "456 Oak Avenue, Seattle, WA",
      tenant: "Mike Chen",
      status: "Completed",
      startDate: "Dec 1, 2023",
      endDate: "Nov 30, 2024",
      lastModified: "1 month ago",
      created: "5 months ago",
      isPrimary: false
    },
    {
      id: 4,
      name: "Lease_555MapleDr_SarahJohnson",
      property: "555 Maple Drive, Bellevue, WA",
      tenant: "Sarah Johnson",
      status: "Active",
      startDate: "Mar 15, 2024",
      endDate: "Mar 14, 2025",
      lastModified: "3 days ago",
      created: "2 months ago",
      isPrimary: false
    },
    {
      id: 5,
      name: "Draft_NewLease_Unsigned",
      property: "321 Cedar Lane, Seattle, WA",
      tenant: "David Wilson",
      status: "Draft",
      startDate: "Apr 1, 2024",
      endDate: "Mar 31, 2025",
      lastModified: "2 hours ago",
      created: "Today",
      isPrimary: false
    },
  ];

  // Mock properties data with detailed info
  const properties = [
    {
      id: 1,
      type: "rent",
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
      type: "sale",
      image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
      images: [
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800"
      ],
      address: "456 Oak Avenue, Seattle, WA",
      price: "$850,000",
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
      type: "rent",
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
      type: "sale",
      image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
      images: [
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800"
      ],
      address: "321 Elm Street, Kirkland, WA",
      price: "$425,000",
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
      type: "rent",
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
      type: "rent",
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
    },
    // Additional Rent properties
    {
      id: 7,
      type: "rent",
      image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800",
      images: ["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800"],
      address: "234 Sunset Boulevard, Seattle, WA",
      price: "$4,800/mo",
      beds: 3,
      baths: 2.5,
      sqft: "2,100",
      pets: "Allowed",
      status: "Available",
      description: "Modern family home with great natural light.",
      amenities: ["WiFi", "Parking", "Dishwasher", "Washer/Dryer"],
      features: ["Open Kitchen", "Hardwood Floors", "Patio"],
      rules: ["No smoking", "Pets allowed", "12 month lease"],
      interestedTenants: [
        { name: "Alex Turner", avatar: "https://ui-avatars.com/api/?name=Alex+Turner&background=8B5CF6&color=fff" },
      ],
      chatCount: 1
    },
    {
      id: 8,
      type: "rent",
      image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800",
      images: ["https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800"],
      address: "789 Lakeview Drive, Kirkland, WA",
      price: "$5,200/mo",
      beds: 4,
      baths: 3,
      sqft: "2,800",
      pets: "No pets",
      status: "Available",
      description: "Stunning lakefront property with private dock.",
      amenities: ["WiFi", "Lake Access", "2-Car Garage", "Fireplace"],
      features: ["Lake View", "Updated Kitchen", "Master Suite"],
      rules: ["No smoking", "No pets", "Background check required"],
      interestedTenants: [],
      chatCount: 0
    },
    {
      id: 9,
      type: "rent",
      image: "https://images.unsplash.com/photo-1598228723793-52759bba239c?w=800",
      images: ["https://images.unsplash.com/photo-1598228723793-52759bba239c?w=800"],
      address: "456 Park Avenue, Redmond, WA",
      price: "$3,800/mo",
      beds: 2,
      baths: 2,
      sqft: "1,450",
      pets: "Cats only",
      status: "Pending",
      description: "Cozy apartment near tech hub.",
      amenities: ["WiFi", "Gym", "Pool", "Parking"],
      features: ["Balcony", "Modern Appliances", "Storage"],
      rules: ["No smoking", "Cats only", "6 month minimum"],
      interestedTenants: [
        { name: "Rachel Moore", avatar: "https://ui-avatars.com/api/?name=Rachel+Moore&background=EC4899&color=fff" },
        { name: "Kevin Park", avatar: "https://ui-avatars.com/api/?name=Kevin+Park&background=14B8A6&color=fff" },
      ],
      chatCount: 2
    },
    // Additional Sale properties
    {
      id: 10,
      type: "sale",
      image: "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800",
      images: ["https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800"],
      address: "123 Highland Avenue, Bellevue, WA",
      price: "$1,250,000",
      beds: 5,
      baths: 4,
      sqft: "3,800",
      pets: "Allowed",
      status: "Available",
      description: "Luxury estate with mountain views.",
      amenities: ["WiFi", "Smart Home", "Pool", "3-Car Garage"],
      features: ["Chef's Kitchen", "Home Theater", "Wine Cellar"],
      rules: [],
      interestedTenants: [
        { name: "James Wilson", avatar: "https://ui-avatars.com/api/?name=James+Wilson&background=F59E0B&color=fff" },
        { name: "Maria Garcia", avatar: "https://ui-avatars.com/api/?name=Maria+Garcia&background=EF4444&color=fff" },
        { name: "David Kim", avatar: "https://ui-avatars.com/api/?name=David+Kim&background=3B82F6&color=fff" },
      ],
      chatCount: 3
    },
    {
      id: 11,
      type: "sale",
      image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800",
      images: ["https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800"],
      address: "567 Woodland Road, Seattle, WA",
      price: "$675,000",
      beds: 3,
      baths: 2.5,
      sqft: "2,200",
      pets: "No pets",
      status: "Available",
      description: "Charming craftsman with original details.",
      amenities: ["WiFi", "2-Car Garage", "Fireplace"],
      features: ["Hardwood Floors", "Updated Kitchen", "Fenced Yard"],
      rules: [],
      interestedTenants: [
        { name: "Jennifer Lee", avatar: "https://ui-avatars.com/api/?name=Jennifer+Lee&background=10B981&color=fff" },
      ],
      chatCount: 1
    },
    {
      id: 12,
      type: "sale",
      image: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800",
      images: ["https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800"],
      address: "890 Riverside Drive, Bellevue, WA",
      price: "$2,100,000",
      beds: 6,
      baths: 5.5,
      sqft: "5,200",
      pets: "Allowed",
      status: "Pending",
      description: "Waterfront estate with private beach access.",
      amenities: ["WiFi", "Smart Home", "Pool & Spa", "4-Car Garage", "Boat Dock"],
      features: ["Gourmet Kitchen", "Home Gym", "Theater Room", "Guest House"],
      rules: [],
      interestedTenants: [
        { name: "Robert Chen", avatar: "https://ui-avatars.com/api/?name=Robert+Chen&background=8B5CF6&color=fff" },
        { name: "Amanda White", avatar: "https://ui-avatars.com/api/?name=Amanda+White&background=EC4899&color=fff" },
        { name: "Michael Brown", avatar: "https://ui-avatars.com/api/?name=Michael+Brown&background=F97316&color=fff" },
        { name: "Linda Davis", avatar: "https://ui-avatars.com/api/?name=Linda+Davis&background=06B6D4&color=fff" },
      ],
      chatCount: 4
    },
    {
      id: 13,
      type: "sale",
      image: "https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=800",
      images: ["https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=800"],
      address: "345 Maple Street, Redmond, WA",
      price: "$525,000",
      beds: 3,
      baths: 2,
      sqft: "1,800",
      pets: "Dogs only",
      status: "Available",
      description: "Move-in ready home in family neighborhood.",
      amenities: ["WiFi", "Central Heating", "2-Car Garage"],
      features: ["Open Floor Plan", "Updated Bathrooms", "Large Backyard"],
      rules: [],
      interestedTenants: [
        { name: "Daniel Martinez", avatar: "https://ui-avatars.com/api/?name=Daniel+Martinez&background=14B8A6&color=fff" },
        { name: "Patricia Lopez", avatar: "https://ui-avatars.com/api/?name=Patricia+Lopez&background=A855F7&color=fff" },
      ],
      chatCount: 2
    }
  ];

  // Sort properties based on selected filter and direction
  const getSortedProperties = () => {
    // First filter by property type
    let filtered = properties.filter(p => p.type === propertyType);
    
    // Then filter by search query
    if (propertySearch.trim()) {
      const searchLower = propertySearch.toLowerCase();
      filtered = filtered.filter(property => 
        property.address.toLowerCase().includes(searchLower) ||
        property.price.toLowerCase().includes(searchLower) ||
        property.beds.toString().includes(searchLower) ||
        property.baths.toString().includes(searchLower) ||
        property.sqft.toLowerCase().includes(searchLower) ||
        property.pets.toLowerCase().includes(searchLower) ||
        property.status.toLowerCase().includes(searchLower) ||
        property.description.toLowerCase().includes(searchLower) ||
        property.amenities.some(a => a.toLowerCase().includes(searchLower)) ||
        property.features.some(f => f.toLowerCase().includes(searchLower))
      );
    }
    
    let sorted = [...filtered];

    switch (selectedSort) {
      case "price":
        sorted.sort((a, b) => {
          const priceA = parseInt(a.price.replace(/[^0-9]/g, ""));
          const priceB = parseInt(b.price.replace(/[^0-9]/g, ""));
          return sortDirection === "asc" ? priceA - priceB : priceB - priceA;
        });
        break;
      
      case "messages":
        sorted.sort((a, b) => {
          return sortDirection === "asc" ? a.chatCount - b.chatCount : b.chatCount - a.chatCount;
        });
        break;
      
      case "beds":
        sorted.sort((a, b) => {
          return sortDirection === "asc" ? a.beds - b.beds : b.beds - a.beds;
        });
        break;
      
      case "date":
      case "old":
      case "new":
        // Sort by ID (assuming ID represents date/age)
        sorted.sort((a, b) => {
          return sortDirection === "asc" ? a.id - b.id : b.id - a.id;
        });
        break;
      
      default:
        // Keep original order
        break;
    }

    return sorted;
  };

  const sortedProperties = getSortedProperties();

  const handleSortSelect = (sortType: string) => {
    setSelectedSort(sortType);
    setShowFilterMenu(false);
  };

  // Get display name for filter
  const getFilterDisplayName = () => {
    switch (selectedSort) {
      case "price": return "Price";
      case "date": return "Date";
      case "messages": return "Messages";
      case "beds": return "Beds";
      case "duration": return "Duration";
      case "none": return "Filter";
      default: return "Filter";
    }
  };

  return (
    <div className="p-10 min-w-0">
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

              {/* Inbox Messages Section */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mt-10">
                <div className="p-8 border-b border-gray-200">
                  <h3 className="text-2xl font-bold text-black">Messages</h3>
                  <p className="text-gray-600 mt-1">Your lead conversations</p>
                </div>
                
                {/* Empty State */}
                <div className="p-16 text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Mail className="w-10 h-10 text-gray-400" />
                  </div>
                  <h4 className="text-xl font-bold text-black mb-2">No messages yet</h4>
                  <p className="text-gray-600 mb-6">
                    Connect your email to start receiving and managing lead conversations
                  </p>
                  <button className="px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-all">
                    Connect Email
                  </button>
                </div>
              </div>
            </>
          )}

      {/* Properties Tab */}
      {activeTab === "properties" && (
        <>
          <div className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-4xl font-bold text-black mb-2">Properties</h2>
                <p className="text-lg text-gray-600">Manage your real estate listings</p>
              </div>
              
              {/* Filter Buttons */}
              <div className="flex items-center gap-2">
                {/* Sort Direction Toggle */}
                <button
                  onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
                  className="w-10 h-10 bg-black text-white rounded-lg hover:bg-gray-800 transition-all flex items-center justify-center cursor-pointer"
                  title={sortDirection === "asc" ? "Ascending" : "Descending"}
                >
                  {sortDirection === "asc" ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>

                <div className="relative">
                  <button 
                    onClick={() => setShowFilterMenu(!showFilterMenu)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-all font-semibold text-sm cursor-pointer"
                  >
                    <Filter className="w-4 h-4" />
                    {getFilterDisplayName()}
                  </button>

                  {/* Filter Dropdown */}
                  {showFilterMenu && (
                    <>
                      {/* Backdrop */}
                      <div 
                        className="fixed inset-0 z-40"
                        onClick={() => setShowFilterMenu(false)}
                      />
                      
                      {/* Menu */}
                      <div className="absolute right-0 top-full mt-2 w-[160px] bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50">
                        <button 
                          onClick={() => handleSortSelect("none")}
                          className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                            selectedSort === "none" 
                              ? "bg-gray-100 text-black font-semibold" 
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          None
                        </button>
                        <button 
                          onClick={() => handleSortSelect("price")}
                          className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                            selectedSort === "price" 
                              ? "bg-gray-100 text-black font-semibold" 
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          Price
                        </button>
                        <button 
                          onClick={() => handleSortSelect("date")}
                          className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                            selectedSort === "date" 
                              ? "bg-gray-100 text-black font-semibold" 
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          Date
                        </button>
                        <button 
                          onClick={() => handleSortSelect("messages")}
                          className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                            selectedSort === "messages" 
                              ? "bg-gray-100 text-black font-semibold" 
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          Messages
                        </button>
                        <button 
                          onClick={() => handleSortSelect("beds")}
                          className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                            selectedSort === "beds" 
                              ? "bg-gray-100 text-black font-semibold" 
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          Beds
                        </button>
                        <button 
                          onClick={() => handleSortSelect("duration")}
                          className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                            selectedSort === "duration" 
                              ? "bg-gray-100 text-black font-semibold" 
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          Duration
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Rent/Sale Toggle - Below Title */}
            <div className="mb-6">
              <div className="flex items-center bg-gray-100 rounded-lg p-1 w-fit mb-6">
                <button
                  onClick={() => {
                    console.log("Rent button clicked");
                    setPropertyType("rent");
                  }}
                  className={`px-6 py-2.5 rounded-md text-sm font-semibold transition-all cursor-pointer ${
                    propertyType === "rent"
                      ? "bg-black text-white shadow-sm"
                      : "text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Rent
                </button>
                <button
                  onClick={() => {
                    console.log("Sale button clicked");
                    setPropertyType("sale");
                  }}
                  className={`px-6 py-2.5 rounded-md text-sm font-semibold transition-all cursor-pointer ${
                    propertyType === "sale"
                      ? "bg-black text-white shadow-sm"
                      : "text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Sale
                </button>
              </div>

              {/* Search Bar */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search properties by address, price, or features..."
                    value={propertySearch}
                    onChange={(e) => setPropertySearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing {sortedProperties.length} {propertyType === "rent" ? "rental" : "sale"} properties
                </p>
              </div>
            </div>
          </div>

          {/* Properties Grid */}
          {sortedProperties.length === 0 ? (
            <div className="bg-white rounded-2xl p-16 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-black mb-2">No properties found</h3>
              <p className="text-gray-600 mb-4">
                {propertySearch.trim() 
                  ? "Try adjusting your search terms or clear the search to see all properties." 
                  : `No ${propertyType === "rent" ? "rental" : "sale"} properties available at the moment.`
                }
              </p>
              {propertySearch.trim() && (
                <button
                  onClick={() => setPropertySearch("")}
                  className="px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-all"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
              {sortedProperties.map((property) => (
              <Link 
                key={property.id} 
                href={`/dashboard/property/${property.id}`}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-2xl hover:-translate-y-1 hover:border-gray-300 transition-all duration-300 cursor-pointer block group w-full"
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
                      <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.preventDefault()}>
                        <Link 
                          href={`/dashboard/property/${property.id}?openChats=true`}
                          className="flex -space-x-2 hover:opacity-80 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
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
                        </Link>
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
          )}

          {/* Add Property Button */}
          <div className="mt-8 text-center">
            <button className="px-8 py-4 bg-gray-100 text-black rounded-lg font-semibold hover:bg-gray-200 transition-all">
              + Add New Property
            </button>
          </div>
        </>
      )}

      {/* Contracts Tab */}
      {activeTab === "contracts" && (
        <>
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-4xl font-bold text-black mb-2">Contracts</h2>
                <p className="text-lg text-gray-600">Manage your lease and sale agreements</p>
              </div>
              <button className="px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-all flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Add Contract
              </button>
            </div>

            {/* Contract Filters */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1 w-fit mb-6">
              {["all", "active", "pending", "completed", "draft"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setContractFilter(filter as "all" | "active" | "pending" | "completed" | "draft")}
                  className={`px-6 py-2.5 rounded-md text-sm font-semibold transition-all cursor-pointer capitalize ${
                    contractFilter === filter
                      ? "bg-black text-white shadow-sm"
                      : "text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search contracts by name, tenant, or property..."
                  value={contractSearch}
                  onChange={(e) => setContractSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Contracts Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-700">
                <div className="col-span-3">Contract</div>
                <div className="col-span-3">Property</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Last Modified</div>
                <div className="col-span-1">Created</div>
                <div className="col-span-1"></div>
              </div>

              {/* Table Rows */}
              <div className="divide-y divide-gray-200">
                {(() => {
                  const filteredContracts = contracts.filter((contract) => {
                    const searchLower = contractSearch.toLowerCase();
                    const matchesSearch = (
                      contract.name.toLowerCase().includes(searchLower) ||
                      contract.tenant.toLowerCase().includes(searchLower) ||
                      contract.property.toLowerCase().includes(searchLower)
                    );

                    // Apply filter
                    if (contractFilter === "all") return matchesSearch;
                    if (contractFilter === "active") return matchesSearch && contract.status === "Active";
                    if (contractFilter === "pending") return matchesSearch && contract.status === "Pending";
                    if (contractFilter === "completed") return matchesSearch && contract.status === "Completed";
                    if (contractFilter === "draft") return matchesSearch && contract.status === "Draft";
                    
                    return matchesSearch;
                  });

                  if (filteredContracts.length === 0) {
                    return (
                      <div className="px-6 py-16 text-center">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                          <Search className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-black mb-2">No contracts found</h3>
                        <p className="text-gray-600">
                          Try adjusting your search terms or clear the search to see all contracts.
                        </p>
                      </div>
                    );
                  }

                  return filteredContracts.map((contract) => (
                  <Link 
                    key={contract.id}
                    href={`/dashboard/contract/${contract.id}`}
                    className="grid grid-cols-12 gap-4 px-6 py-5 hover:bg-gray-50 transition-colors cursor-pointer group"
                  >
                    {/* Contract Name */}
                    <div className="col-span-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-black truncate group-hover:text-gray-700 transition-colors">
                            {contract.name}
                          </p>
                          {contract.isPrimary && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold flex-shrink-0">
                              <Star className="w-3 h-3 fill-current" />
                              PRIMARY
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 truncate">{contract.tenant}</p>
                      </div>
                    </div>

                    {/* Property */}
                    <div className="col-span-3 flex items-center">
                      <div className="min-w-0">
                        <p className="text-sm text-gray-800 truncate">{contract.property}</p>
                        <p className="text-xs text-gray-500">{contract.startDate} - {contract.endDate}</p>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="col-span-2 flex items-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                        contract.status === "Active" 
                          ? "bg-green-100 text-green-700"
                          : contract.status === "Pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : contract.status === "Completed"
                          ? "bg-blue-100 text-blue-700"
                          : contract.status === "Draft"
                          ? "bg-gray-100 text-gray-700"
                          : "bg-gray-100 text-gray-700"
                      }`}>
                        {contract.status === "Active" && <CheckCircle className="w-3 h-3" />}
                        {contract.status === "Pending" && <Clock className="w-3 h-3" />}
                        {contract.status === "Completed" && <CheckCircle className="w-3 h-3" />}
                        {contract.status === "Draft" && <FileText className="w-3 h-3" />}
                        {contract.status}
                      </span>
                    </div>

                    {/* Last Modified */}
                    <div className="col-span-2 flex items-center">
                      <p className="text-sm text-gray-600">{contract.lastModified}</p>
                    </div>

                    {/* Created */}
                    <div className="col-span-1 flex items-center">
                      <p className="text-sm text-gray-600">{contract.created}</p>
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 flex items-center justify-end">
                      <button className="w-8 h-8 rounded-lg hover:bg-gray-200 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                        <MoreVertical className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                  </Link>
                ));
                })()}
              </div>
            </div>

            {/* Empty state if no contracts */}
            {contracts.length === 0 && (
              <div className="bg-white rounded-2xl p-16 shadow-sm border border-gray-200 text-center">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-black mb-2">No contracts yet</h3>
                <p className="text-gray-600 mb-6">
                  Create your first contract to get started with managing lease agreements.
                </p>
                <button className="px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-all">
                  Create Contract
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Tenants Tab */}
      {activeTab === "tenants" && (
        <>
          <div className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-4xl font-bold text-black mb-2">Tenants</h2>
                <p className="text-lg text-gray-600">Manage your current and past tenants</p>
              </div>
              <button className="px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-all flex items-center gap-2">
                <Users className="w-5 h-5" />
                Add Tenant
              </button>
            </div>

            {/* Filter Buttons */}
            <div className="mb-6">
              <div className="flex items-center bg-gray-100 rounded-lg p-1 w-fit">
                <button
                  onClick={() => setTenantFilter("all")}
                  className={`px-6 py-2.5 rounded-md text-sm font-semibold transition-all cursor-pointer ${
                    tenantFilter === "all"
                      ? "bg-black text-white shadow-sm"
                      : "text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setTenantFilter("current")}
                  className={`px-6 py-2.5 rounded-md text-sm font-semibold transition-all cursor-pointer ${
                    tenantFilter === "current"
                      ? "bg-black text-white shadow-sm"
                      : "text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Current
                </button>
                <button
                  onClick={() => setTenantFilter("pending")}
                  className={`px-6 py-2.5 rounded-md text-sm font-semibold transition-all cursor-pointer ${
                    tenantFilter === "pending"
                      ? "bg-black text-white shadow-sm"
                      : "text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setTenantFilter("late")}
                  className={`px-6 py-2.5 rounded-md text-sm font-semibold transition-all cursor-pointer ${
                    tenantFilter === "late"
                      ? "bg-black text-white shadow-sm"
                      : "text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Late Payment
                </button>
                <button
                  onClick={() => setTenantFilter("archived")}
                  className={`px-6 py-2.5 rounded-md text-sm font-semibold transition-all cursor-pointer ${
                    tenantFilter === "archived"
                      ? "bg-black text-white shadow-sm"
                      : "text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Archived
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tenants by name, property, or email..."
                  value={tenantSearch}
                  onChange={(e) => setTenantSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Tenants Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tenants
                .filter((tenant) => {
                  // Filter by search
                  const searchLower = tenantSearch.toLowerCase();
                  const matchesSearch = (
                    tenant.name.toLowerCase().includes(searchLower) ||
                    tenant.email.toLowerCase().includes(searchLower) ||
                    tenant.property.toLowerCase().includes(searchLower)
                  );

                  // Filter by status
                  if (tenantFilter === "all") return matchesSearch;
                  if (tenantFilter === "current") return matchesSearch && tenant.status === "Current";
                  if (tenantFilter === "pending") return matchesSearch && tenant.status === "Pending";
                  if (tenantFilter === "late") return matchesSearch && tenant.status === "Late Payment";
                  if (tenantFilter === "archived") return matchesSearch && tenant.status === "Archived";
                  
                  return matchesSearch;
                })
                .map((tenant) => (
                  <div
                    key={tenant.id}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={tenant.avatar}
                          alt={tenant.name}
                          className="w-14 h-14 rounded-full"
                        />
                        <div>
                          <h3 className="font-bold text-black text-lg">{tenant.name}</h3>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                            tenant.status === "Current" 
                              ? "bg-green-100 text-green-700"
                              : tenant.status === "Pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : tenant.status === "Late Payment"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-700"
                          }`}>
                            {tenant.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-2 mb-4 pb-4 border-b border-gray-200">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{tenant.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{tenant.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{tenant.property}</span>
                      </div>
                    </div>

                    {/* Lease Info */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Rent:</span>
                        <span className="font-semibold text-black">{tenant.rentAmount}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Lease:</span>
                        <span className="text-gray-900">{tenant.leaseStart} - {tenant.leaseEnd}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Payment:</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          tenant.paymentStatus === "Paid"
                            ? "bg-green-100 text-green-700"
                            : tenant.paymentStatus === "Pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                        }`}>
                          {tenant.paymentStatus === "Paid" && <CheckCircle className="w-3 h-3" />}
                          {tenant.paymentStatus === "Pending" && <Clock className="w-3 h-3" />}
                          {tenant.paymentStatus}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all flex items-center justify-center gap-2 text-sm font-medium">
                        <MessageSquare className="w-4 h-4" />
                        Message
                      </button>
                      <Link href={`/dashboard/tenant/${tenant.id}`} className="flex-1">
                        <button className="w-full px-3 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-2 text-sm font-medium cursor-pointer">
                          <FileText className="w-4 h-4" />
                          Details
                        </button>
                      </Link>
                    </div>
                  </div>
                ))}
            </div>

            {/* Empty state */}
            {tenants.filter((tenant) => {
              const searchLower = tenantSearch.toLowerCase();
              const matchesSearch = (
                tenant.name.toLowerCase().includes(searchLower) ||
                tenant.email.toLowerCase().includes(searchLower) ||
                tenant.property.toLowerCase().includes(searchLower)
              );

              if (tenantFilter === "all") return matchesSearch;
              if (tenantFilter === "current") return matchesSearch && tenant.status === "Current";
              if (tenantFilter === "pending") return matchesSearch && tenant.status === "Pending";
              if (tenantFilter === "late") return matchesSearch && tenant.status === "Late Payment";
              if (tenantFilter === "archived") return matchesSearch && tenant.status === "Archived";
              
              return matchesSearch;
            }).length === 0 && (
              <div className="bg-white rounded-2xl p-16 shadow-sm border border-gray-200 text-center">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-black mb-2">No tenants found</h3>
                <p className="text-gray-600">
                  {tenantSearch ? "Try adjusting your search terms." : "Add your first tenant to get started."}
                </p>
              </div>
            )}
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

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <>
          <div className="mb-10">
            <h2 className="text-4xl font-bold text-black mb-2">Settings</h2>
            <p className="text-lg text-gray-600">Manage your account and preferences</p>
          </div>

          <div className="space-y-6">
            {/* Profile Section */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <h3 className="text-2xl font-bold text-black mb-6">Profile</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    placeholder="john@example.com"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
                <button className="px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-all">
                  Save Changes
                </button>
              </div>
            </div>

            {/* Notifications Section */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <h3 className="text-2xl font-bold text-black mb-6">Notifications</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-semibold text-black">Email Notifications</p>
                    <p className="text-sm text-gray-600">Receive updates about new messages and leads</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-black/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-semibold text-black">SMS Notifications</p>
                    <p className="text-sm text-gray-600">Get text alerts for urgent matters</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-black/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-semibold text-black">Weekly Reports</p>
                    <p className="text-sm text-gray-600">Summary of your activity and performance</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-black/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Security Section */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <h3 className="text-2xl font-bold text-black mb-6">Security</h3>
              <div className="space-y-4">
                <button className="w-full px-6 py-3 bg-gray-100 text-black rounded-lg font-semibold hover:bg-gray-200 transition-all text-left">
                  Change Password
                </button>
                <button className="w-full px-6 py-3 bg-gray-100 text-black rounded-lg font-semibold hover:bg-gray-200 transition-all text-left">
                  Two-Factor Authentication
                </button>
                <button className="w-full px-6 py-3 bg-gray-100 text-black rounded-lg font-semibold hover:bg-gray-200 transition-all text-left">
                  Connected Accounts
                </button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-red-200">
              <h3 className="text-2xl font-bold text-red-600 mb-6">Danger Zone</h3>
              <div className="space-y-4">
                <button className="w-full px-6 py-3 bg-red-50 text-red-600 rounded-lg font-semibold hover:bg-red-100 transition-all">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
