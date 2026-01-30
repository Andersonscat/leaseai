"use client";

import { useState, useEffect } from "react";
import { MapPin, Bed, Bath, Ruler, Dog, ChevronLeft, ChevronRight, ArrowLeft, X, Send, Edit, Car, Calendar, Wifi, Zap, Droplet, Home, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";

export default function PropertyPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const propertyId = params.id as string;
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState("");
  // Sidebar always open by default (or toggled on mobile)
  const [showAllChats, setShowAllChats] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [showUpdateSuccess, setShowUpdateSuccess] = useState(false);
  
  // State for property loaded from Supabase
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load property from Supabase
  useEffect(() => {
    const fetchProperty = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/properties/${propertyId}`);
        const data = await response.json();
        setProperty(data.property);
      } catch (error) {
        console.error('Error fetching property:', error);
        setProperty(null);
      } finally {
        setLoading(false);
      }
    };

    if (propertyId) {
      fetchProperty();
    }
  }, [propertyId]);

  // Check if we should open All Chats on mount or show update success
  useEffect(() => {
    const openChats = searchParams.get('openChats');
    const updated = searchParams.get('updated');
    
    if (openChats === 'true') {
      setShowAllChats(true);
    }
    
    if (updated === 'success') {
      setShowUpdateSuccess(true);
      // Hide after 5 seconds
      setTimeout(() => {
        setShowUpdateSuccess(false);
      }, 5000);
    }
  }, [searchParams]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading property...</p>
        </div>
      </div>
    );
  }

  // Property not found
  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-black mb-4">Property not found</h2>
          <Link href="/dashboard?tab=properties">
            <button className="px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-all">
              Back to Properties
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const nextImage = () => {
    if (property?.images) {
      setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
    }
  };

  const prevImage = () => {
    if (property?.images) {
      setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
    }
  };

  // Mock chats data (interested tenants)
  const chats = [
    {
      id: 1,
      name: "John Smith",
      avatar: "https://ui-avatars.com/api/?name=John+Smith&background=3B82F6&color=fff",
      lastMessage: "Hi, I'm interested in this property. Is it still available?",
      time: "2 hours ago",
      unread: 2,
      messages: [
        { id: 1, sender: "tenant", text: "Hi, I'm interested in this property.", time: "2:30 PM" },
        { id: 2, sender: "tenant", text: "Is it still available?", time: "2:31 PM" },
      ]
    },
    {
      id: 2,
      name: "Sarah Johnson",
      avatar: "https://ui-avatars.com/api/?name=Sarah+Johnson&background=10B981&color=fff",
      lastMessage: "What's the move-in date?",
      time: "5 hours ago",
      unread: 1,
      messages: [
        { id: 1, sender: "tenant", text: "What's the move-in date?", time: "11:00 AM" },
      ]
    },
  ];

  const selectedChatData = chats.find(c => c.id === selectedChat);

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      console.log("Sending message:", messageInput);
      setMessageInput("");
    }
  };

  const handleGenerateAIDraft = async () => {
    if (!selectedChatData) return;
    
    setGeneratingAI(true);
    try {
      // Get last message from tenant
      const lastTenantMessage = selectedChatData.messages
        .filter(msg => msg.sender === 'tenant')
        .slice(-1)[0];
      
      if (!lastTenantMessage) {
        alert('No message to respond to');
        setGeneratingAI(false);
        return;
      }

      // Call AI API to generate response
      const response = await fetch(`/api/conversations/${selectedChatData.id}/auto-reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientMessage: lastTenantMessage.text,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Set AI response in message input
        setMessageInput(data.aiResponse);
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error generating AI draft:', error);
      alert('Failed to generate AI draft');
    } finally {
      setGeneratingAI(false);
    }
  };

  return (
    <div className="p-10">
      {/* Success Notification */}
      {showUpdateSuccess && (
        <div className="fixed top-6 right-6 z-50 bg-green-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in">
          <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="font-semibold">Property updated successfully!</span>
          <button 
            onClick={() => setShowUpdateSuccess(false)}
            className="ml-2 hover:bg-green-600 rounded-full p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Back Button */}
      <div className="mb-6 w-fit">
        <Link href="/dashboard?tab=properties">
          <button className="flex items-center gap-2 text-gray-700 hover:text-black font-semibold transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Back to Properties
          </button>
        </Link>
      </div>

      {/* Main Content with Chat Sidebar */}
      <div className="flex gap-6">
        {/* Left Content - Property Details */}
        <div className={`flex-1 transition-all ${selectedChat ? 'mr-0' : ''}`}>
        {/* Image Gallery */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-lg mb-8">
          <div className="relative h-[500px] bg-gray-200 group">
            <img 
              src={property.images[currentImageIndex]} 
              alt={`Property ${currentImageIndex + 1}`}
              className="w-full h-full object-cover"
            />
            
            {/* Image Navigation */}
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

            {/* Image Counter */}
            <div className="absolute bottom-4 right-4 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-semibold">
              {currentImageIndex + 1} / {property.images.length}
            </div>

            {/* Property Type Badge */}
            <div className="absolute top-4 right-4">
              <span className="px-4 py-2 rounded-full text-sm font-bold bg-black text-white shadow-lg">
                {property.type === 'rent' ? 'For Rent' : 'For Sale'}
              </span>
            </div>
          </div>

          {/* Property Info */}
          <div className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold text-black mb-2">{property.price}</h1>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-5 h-5" />
                  <span className="text-lg">
                    {property.address}
                    {property.city && `, ${property.city}`}
                    {property.state && `, ${property.state}`}
                    {property.zip_code && ` ${property.zip_code}`}
                  </span>
                </div>
              </div>
              
              {/* Edit Button */}
              <Link href={`/dashboard/property/edit/${propertyId}`}>
                <button
                  className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-all shadow-md hover:shadow-lg"
                >
                  <Edit className="w-5 h-5" />
                  Edit Property
                </button>
              </Link>
            </div>

            {/* Property Stats */}
            <div className="grid grid-cols-4 gap-6 py-6 border-y border-gray-200">
              <div className="text-center">
                <Bed className="w-8 h-8 mx-auto mb-2 text-gray-700" />
                <div className="text-3xl font-bold text-black">{property.beds}</div>
                <div className="text-sm text-gray-600">Bedrooms</div>
              </div>
              <div className="text-center">
                <Bath className="w-8 h-8 mx-auto mb-2 text-gray-700" />
                <div className="text-3xl font-bold text-black">{property.baths}</div>
                <div className="text-sm text-gray-600">Bathrooms</div>
              </div>
              <div className="text-center">
                <Ruler className="w-8 h-8 mx-auto mb-2 text-gray-700" />
                <div className="text-3xl font-bold text-black">{property.sqft}</div>
                <div className="text-sm text-gray-600">sq.ft</div>
              </div>
              <div className="text-center flex flex-col items-center">
                <Dog className="w-8 h-8 mb-2 text-gray-700" />
                <div className={`font-bold text-black leading-tight ${
                  (property.pets?.length || 0) > 15 ? 'text-sm' : 'text-xl'
                }`}>
                  {property.pets}
                </div>
                <div className="text-sm text-gray-600 mt-auto">Pets</div>
              </div>
            </div>

            {/* Description */}
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-black mb-4">Description</h2>
              <p className="text-gray-700 leading-relaxed text-lg">
                {property.description}
              </p>
            </div>

            {/* Key Features Grid */}
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-black mb-4">Key Features</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
                  <Home className="w-6 h-6 text-blue-600 mb-2" />
                  <div className="text-sm text-gray-600">Property Type</div>
                  <div className="text-lg font-bold text-black">{property.type === 'rent' ? 'For Rent' : 'For Sale'}</div>
                </div>
                
                {property.parking_available !== undefined && (
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200">
                    <Car className="w-6 h-6 text-purple-600 mb-2" />
                    <div className="text-sm text-gray-600">Parking</div>
                    <div className="text-lg font-bold text-black">
                      {property.parking_available ? 'Available' : 'Not Available'}
                    </div>
                  </div>
                )}



                {property.type === 'rent' && (
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-5 border border-orange-200">
                    <Calendar className="w-6 h-6 text-orange-600 mb-2" />
                    <div className="text-sm text-gray-600">Lease Term</div>
                    <div className="text-lg font-bold text-black">12 months</div>
                  </div>
                )}

                <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-5 border border-teal-200">
                  <Droplet className="w-6 h-6 text-teal-600 mb-2" />
                  <div className="text-sm text-gray-600">Utilities</div>
                  <div className="text-lg font-bold text-black">Ask Owner</div>
                </div>

                <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-5 border border-pink-200">
                  <Wifi className="w-6 h-6 text-pink-600 mb-2" />
                  <div className="text-sm text-gray-600">Internet</div>
                  <div className="text-lg font-bold text-black">Ready</div>
                </div>
              </div>
            </div>

            {/* Property Details Table */}
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-black mb-4">Property Details</h2>
              <div className="bg-gray-50 rounded-xl p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex justify-between py-3 border-b border-gray-200">
                  <span className="text-gray-600 font-medium">Price</span>
                  <span className="text-black font-bold">{property.price}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-200">
                  <span className="text-gray-600 font-medium">Type</span>
                  <span className="text-black font-semibold capitalize">{property.type}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-200">
                  <span className="text-gray-600 font-medium">Bedrooms</span>
                  <span className="text-black font-semibold">{property.beds}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-200">
                  <span className="text-gray-600 font-medium">Bathrooms</span>
                  <span className="text-black font-semibold">{property.baths}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-200">
                  <span className="text-gray-600 font-medium">Square Feet</span>
                  <span className="text-black font-semibold">{property.sqft} sq.ft</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-200">
                  <span className="text-gray-600 font-medium">Pet Policy</span>
                  <span className="text-black font-semibold">{property.pets}</span>
                </div>

                {property.parking_available !== undefined && (
                  <div className="flex justify-between py-3 border-b border-gray-200">
                    <span className="text-gray-600 font-medium">Parking</span>
                    <span className="text-black font-semibold">
                      {property.parking_available ? '✓ Available' : '✗ Not Available'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Amenities */}
            {property.amenities && property.amenities.length > 0 && (
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-black mb-4">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {property.amenities.map((amenity: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-700">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {property.features && property.features.length > 0 && (
              <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm mb-8">
                <h2 className="text-2xl font-bold text-black mb-4">Features</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {property.features.map((feature: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {property.house_rules && property.house_rules.length > 0 && (
              <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm mb-8">
                <h2 className="text-2xl font-bold text-black mb-4">House Rules</h2>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                  <ul className="space-y-3">
                    {property.house_rules.map((rule: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="text-amber-600 font-bold mt-1">•</span>
                        <span className="text-gray-700 flex-1">{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Location & Neighborhood */}
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-black mb-4">Location & Neighborhood</h2>
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-6">
                <div className="flex items-start gap-3 mb-4">
                  <MapPin className="w-6 h-6 text-indigo-600 mt-1" />
                  <div>
                    <h3 className="font-bold text-black text-lg mb-1">{property.address}</h3>
                    <p className="text-gray-600">
                      Conveniently located with easy access to public transportation, shopping centers, restaurants, and parks.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                    <div className="text-2xl font-bold text-black">95</div>
                    <div className="text-sm text-gray-600 mt-1">Walk Score</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                    <div className="text-2xl font-bold text-black">85</div>
                    <div className="text-sm text-gray-600 mt-1">Transit Score</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                    <div className="text-2xl font-bold text-black">5 min</div>
                    <div className="text-sm text-gray-600 mt-1">To Grocery</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                    <div className="text-2xl font-bold text-black">10 min</div>
                    <div className="text-sm text-gray-600 mt-1">To Downtown</div>
                  </div>
                </div>
                
                {/* Map */}
                <div className="mt-6 rounded-xl overflow-hidden shadow-sm h-[450px] bg-gray-100">
                  <iframe 
                    width="100%" 
                    height="100%" 
                    id="gmap_canvas" 
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(property.address)}&t=&z=16&ie=UTF8&iwloc=&output=embed`} 
                    frameBorder="0" 
                    scrolling="no" 
                    marginHeight={0} 
                    marginWidth={0}
                    style={{ filter: 'saturate(0.8) contrast(1.1)' }}
                    className="w-full h-full"
                  ></iframe>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Interested Tenants / Chats */}

        </div>
        {/* End of Left Content */}

        {/* Right Content - Sidebar */}
        <div className={`transition-all duration-300 ease-in-out flex-shrink-0 ${isSidebarCollapsed ? 'w-20' : 'w-[400px]'}`}>
          
          {/* List View (When no chat selected) */}
          {!selectedChat && (
            <div className={`bg-white rounded-3xl shadow-lg h-[calc(100vh-140px)] flex flex-col sticky top-24 border border-gray-100 transition-all duration-300 ${isSidebarCollapsed ? 'items-center' : ''}`}>
              {/* Header */}
              <div className={`p-6 border-b border-gray-200 flex items-center ${isSidebarCollapsed ? 'justify-center w-full' : 'justify-between'}`}>
                {!isSidebarCollapsed && (
                  <div>
                    <h3 className="text-2xl font-bold text-black">Interested Tenants</h3>
                    <p className="text-gray-500 text-sm mt-1">Manage viewings & questions</p>
                  </div>
                )}
                <button
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  className={`w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-all bg-gray-50 group`}
                  title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                  {isSidebarCollapsed ? (
                    <ChevronLeft className="w-5 h-5 text-gray-600 group-hover:text-black" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-black" />
                  )}
                </button>
              </div>

              {/* Chats List */}
              <div className="flex-1 overflow-y-auto w-full">
                {chats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => {
                      setSelectedChat(chat.id);
                      if (isSidebarCollapsed) setIsSidebarCollapsed(false);
                    }}
                    className={`flex items-center gap-4 p-4 border-b border-gray-100 hover:bg-gray-50 transition-all cursor-pointer ${isSidebarCollapsed ? 'justify-center' : ''}`}
                  >
                    <div className="relative">
                      <img 
                        src={chat.avatar} 
                        alt={chat.name}
                        className="w-12 h-12 rounded-full min-w-[48px]"
                      />
                      {chat.unread > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                          {chat.unread}
                        </div>
                      )}
                    </div>
                    
                    {!isSidebarCollapsed && (
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-bold text-black">{chat.name}</h4>
                          <span className="text-xs text-gray-400">{chat.time}</span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chat View (When chat selected) */}
          {selectedChat && selectedChatData && (
            <div className={`bg-white rounded-3xl shadow-lg h-[calc(100vh-140px)] flex flex-col sticky top-24 border border-gray-100 transition-all duration-300 ${isSidebarCollapsed ? 'items-center' : ''}`}>
              {/* Chat Header */}
              <div className={`p-6 border-b border-gray-200 flex items-center gap-3 ${isSidebarCollapsed ? 'flex-col justify-center w-full' : ''}`}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button
                    onClick={() => setSelectedChat(null)}
                    className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-all bg-gray-50 flex-shrink-0"
                    title="Back to list"
                  >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  
                  {!isSidebarCollapsed && (
                    <div className="flex items-center gap-3 truncate">
                      <img 
                        src={selectedChatData.avatar} 
                        alt={selectedChatData.name}
                        className="w-10 h-10 rounded-full flex-shrink-0"
                      />
                      <div className="truncate">
                        <h3 className="font-bold text-black truncate">{selectedChatData.name}</h3>
                        <p className="text-xs text-green-500 font-medium">Active now</p>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  className={`w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-all bg-gray-50 group flex-shrink-0`}
                  title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                  {isSidebarCollapsed ? (
                    <ChevronLeft className="w-5 h-5 text-gray-600 group-hover:text-black" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-black" />
                  )}
                </button>
              </div>

              {/* Messages & Input (Hidden when collapsed for better UX, or we can show a small unread/indicator) */}
              {!isSidebarCollapsed ? (
                <>
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
                    {selectedChatData.messages.map((message) => (
                      <div 
                        key={message.id}
                        className={`flex ${message.sender === 'landlord' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] ${
                          message.sender === 'landlord' 
                            ? 'bg-black text-white' 
                            : 'bg-white border border-gray-200 text-black'
                        } rounded-2xl px-5 py-3 shadow-sm`}>
                          <p className="text-sm leading-relaxed">{message.text}</p>
                          <p className={`text-[10px] mt-1.5 opacity-70 ${
                            message.sender === 'landlord' ? 'text-gray-300' : 'text-gray-500'
                          }`}>
                            {message.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 border-t border-gray-200 bg-white rounded-b-3xl">
                    <div className="mb-3">
                      <button
                        onClick={handleGenerateAIDraft}
                        disabled={generatingAI}
                        className="w-full py-2.5 bg-indigo-50 text-indigo-700 rounded-xl font-semibold hover:bg-indigo-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                      >
                        {generatingAI ? (
                          <>
                            <div className="animate-spin h-4 w-4 border-2 border-indigo-700 border-t-transparent rounded-full" />
                            <span>Writing...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4" />
                            <span>Generate AI Reply</span>
                          </>
                        )}
                      </button>
                    </div>
                    
                    <div className="flex gap-2 items-end">
                      <textarea
                        value={messageInput}
                        onChange={(e) => {
                          setMessageInput(e.target.value);
                          e.target.style.height = 'auto';
                          e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey && messageInput.trim()) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder="Type a message..."
                        rows={1}
                        className="flex-1 px-4 py-3 rounded-xl bg-gray-50 border-0 focus:ring-2 focus:ring-black/5 resize-none text-black text-sm max-h-[120px]"
                      />
                      {messageInput.trim().length > 0 && (
                        <button
                          onClick={handleSendMessage}
                          className="w-11 h-11 bg-black text-white rounded-xl flex items-center justify-center hover:bg-gray-800 transition-all flex-shrink-0 shadow-md"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-4 gap-4">
                   <div className="relative">
                      <img 
                        src={selectedChatData.avatar} 
                        alt={selectedChatData.name}
                        className="w-12 h-12 rounded-full border-2 border-black p-0.5"
                      />
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                   </div>
                   <div className="w-1 h-24 bg-gray-100 rounded-full" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* End of Flex Container */}
    </div>
  );
}
