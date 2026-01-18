"use client";

import { useState, useEffect } from "react";
import { MapPin, Bed, Bath, Ruler, Dog, ChevronLeft, ChevronRight, ArrowLeft, X, Send } from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";

export default function PropertyPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const propertyId = params.id as string;
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [showAllChats, setShowAllChats] = useState(false);
  
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

  // Check if we should open All Chats on mount
  useEffect(() => {
    const openChats = searchParams.get('openChats');
    if (openChats === 'true') {
      setShowAllChats(true);
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

  return (
    <div className="p-10">
      {/* Back Button */}
      <div className="mb-6">
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

            {/* Status Badge */}
            <div className="absolute top-4 right-4">
              <span className="px-4 py-2 rounded-full text-sm font-bold bg-green-500 text-white">
                {property.status}
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
                  <span className="text-lg">{property.address}</span>
                </div>
              </div>
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
              <div className="text-center">
                <Dog className="w-8 h-8 mx-auto mb-2 text-gray-700" />
                <div className="text-xl font-bold text-black">{property.pets}</div>
                <div className="text-sm text-gray-600">Pets</div>
              </div>
            </div>

            {/* Description */}
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-black mb-4">Description</h2>
              <p className="text-gray-700 leading-relaxed text-lg">
                {property.description}
              </p>
            </div>

            {/* Amenities */}
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-black mb-4">Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {property.amenities.map((amenity, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-xl p-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-700">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Interested Tenants / Chats */}
        <div className="bg-white rounded-3xl p-8 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-black">Interested Tenants ({chats.length})</h2>
            <button 
              onClick={() => {
                setShowAllChats(true);
                setSelectedChat(null);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-all font-semibold text-sm"
            >
              All chats
            </button>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            {chats.map((chat) => (
              <div 
                key={chat.id}
                onClick={() => {
                  setSelectedChat(chat.id);
                  setShowAllChats(false);
                }}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all cursor-pointer"
              >
                <img 
                  src={chat.avatar} 
                  alt={chat.name}
                  className="w-14 h-14 rounded-full"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-black">{chat.name}</h3>
                    {chat.unread > 0 && (
                      <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {chat.unread}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-1">{chat.lastMessage}</p>
                  <p className="text-xs text-gray-400 mt-1">{chat.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        </div>
        {/* End of Left Content */}

        {/* All Chats Sidebar (WhatsApp style) */}
        {showAllChats && (
          <div className="w-[450px] flex-shrink-0">
            <div className="bg-white rounded-3xl shadow-lg h-[calc(100vh-180px)] flex flex-col sticky top-24">
              {/* Header */}
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-2xl font-bold text-black">All Chats</h3>
                <button 
                  onClick={() => setShowAllChats(false)}
                  className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-all"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Chats List */}
              <div className="flex-1 overflow-y-auto">
                {chats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => {
                      setSelectedChat(chat.id);
                      setShowAllChats(false);
                    }}
                    className="flex items-center gap-4 p-4 border-b border-gray-100 hover:bg-gray-50 transition-all cursor-pointer"
                  >
                    <div className="relative">
                      <img 
                        src={chat.avatar} 
                        alt={chat.name}
                        className="w-14 h-14 rounded-full"
                      />
                      {chat.unread > 0 && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                          {chat.unread}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-black">{chat.name}</h4>
                        <span className="text-xs text-gray-400">{chat.time}</span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Chat Sidebar */}
        {selectedChat && selectedChatData && (
          <div className="w-[450px] flex-shrink-0">
            <div className="bg-white rounded-3xl shadow-lg h-[calc(100vh-180px)] flex flex-col sticky top-24">
            {/* Chat Header */}
            <div className="p-6 border-b border-gray-200 flex items-center gap-3">
              {/* Back button */}
              <button
                onClick={() => {
                  setSelectedChat(null);
                  setShowAllChats(true);
                }}
                className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-all"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              
              <img 
                src={selectedChatData.avatar} 
                alt={selectedChatData.name}
                className="w-12 h-12 rounded-full"
              />
              <div>
                <h3 className="font-bold text-black">{selectedChatData.name}</h3>
                <p className="text-sm text-gray-500">Active now</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {selectedChatData.messages.map((message) => (
                <div 
                  key={message.id}
                  className={`flex ${message.sender === 'landlord' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] ${
                    message.sender === 'landlord' 
                      ? 'bg-black text-white' 
                      : 'bg-gray-100 text-black'
                  } rounded-2xl px-4 py-3`}>
                    <p className="text-sm">{message.text}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender === 'landlord' ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      {message.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 rounded-xl bg-gray-100 border-none focus:outline-none focus:ring-2 focus:ring-black"
                />
                <button
                  onClick={handleSendMessage}
                  className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center hover:bg-gray-800 transition-all"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
      {/* End of Flex Container */}
    </div>
  );
}
