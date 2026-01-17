"use client";

import { useState } from "react";
import { MapPin, Bed, Bath, Ruler, Dog, ChevronLeft, ChevronRight, ArrowLeft, X, Send } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function PropertyPage() {
  const params = useParams();
  const propertyId = parseInt(params.id as string);
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [showAllChats, setShowAllChats] = useState(false);

  // Mock property data
  const properties = [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800",
      images: [
        "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200",
        "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1200",
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200"
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
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
      images: [
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200"
      ],
      address: "456 Oak Avenue, Seattle, WA",
      price: "$4,200/mo",
      beds: 3,
      baths: 2.5,
      sqft: "1,850",
      pets: "No pets",
      status: "Available",
      description: "Spacious family home in quiet neighborhood. Large backyard perfect for entertaining.",
      amenities: ["WiFi", "Central Heating", "2-Car Garage", "Dishwasher", "Washer/Dryer", "Fireplace"],
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
      images: [
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200",
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200"
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
    },
    {
      id: 4,
      image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
      images: [
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200"
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
    },
    {
      id: 5,
      image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
      images: [
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200"
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
    },
    {
      id: 6,
      image: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800",
      images: [
        "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1200"
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
    }
  ];

  // Mock chat data
  const chats = [
    {
      id: 1,
      name: "John Smith",
      avatar: "https://ui-avatars.com/api/?name=John+Smith&background=3B82F6&color=fff",
      lastMessage: "Is this property still available?",
      time: "2 hours ago",
      unread: 2,
      messages: [
        { id: 1, text: "Hi! I'm interested in this property.", sender: "tenant", time: "10:30 AM" },
        { id: 2, text: "Is this property still available?", sender: "tenant", time: "10:31 AM" },
        { id: 3, text: "Yes, it's available! Would you like to schedule a viewing?", sender: "landlord", time: "10:45 AM" },
      ]
    },
    {
      id: 2,
      name: "Sarah Johnson",
      avatar: "https://ui-avatars.com/api/?name=Sarah+Johnson&background=10B981&color=fff",
      lastMessage: "Can we schedule a viewing for this weekend?",
      time: "5 hours ago",
      unread: 0,
      messages: [
        { id: 1, text: "Hello! This looks like a great property.", sender: "tenant", time: "9:00 AM" },
        { id: 2, text: "Can we schedule a viewing for this weekend?", sender: "tenant", time: "9:01 AM" },
        { id: 3, text: "Sure! Saturday or Sunday works best?", sender: "landlord", time: "9:15 AM" },
        { id: 4, text: "Saturday around 2 PM would be perfect!", sender: "tenant", time: "9:20 AM" },
      ]
    },
    {
      id: 3,
      name: "Mike Chen",
      avatar: "https://ui-avatars.com/api/?name=Mike+Chen&background=F59E0B&color=fff",
      lastMessage: "What are the lease terms?",
      time: "1 day ago",
      unread: 1,
      messages: [
        { id: 1, text: "What are the lease terms?", sender: "tenant", time: "Yesterday" },
        { id: 2, text: "Standard 12-month lease. We can discuss details.", sender: "landlord", time: "Yesterday" },
      ]
    },
    {
      id: 4,
      name: "Emily Davis",
      avatar: "https://ui-avatars.com/api/?name=Emily+Davis&background=EF4444&color=fff",
      lastMessage: "Are pets allowed in this property?",
      time: "2 days ago",
      unread: 0,
      messages: [
        { id: 1, text: "Are pets allowed in this property?", sender: "tenant", time: "2 days ago" },
        { id: 2, text: "Yes, pets are welcome with a deposit!", sender: "landlord", time: "2 days ago" },
        { id: 3, text: "Great! I have a small dog.", sender: "tenant", time: "2 days ago" },
      ]
    }
  ];

  const property = properties.find(p => p.id === propertyId) || properties[0];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
  };

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
                onClick={() => setSelectedChat(chat.id)}
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
            <div className="bg-white rounded-3xl shadow-lg h-[calc(100vh-200px)] flex flex-col sticky top-6">
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
            <div className="bg-white rounded-3xl shadow-lg h-[calc(100vh-200px)] flex flex-col sticky top-6">
            {/* Chat Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
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
              <button 
                onClick={() => setSelectedChat(null)}
                className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-all"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
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
