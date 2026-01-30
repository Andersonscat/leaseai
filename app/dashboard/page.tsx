"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Inbox, TrendingUp, Home, BarChart3, MapPin, Bed, Bath, Ruler, Dog, Filter, ChevronUp, ChevronDown, Mail, MailOpen, FileText, Star, Clock, CheckCircle, XCircle, MoreVertical, Search, Users, Phone, MessageSquare, DollarSign, X, CheckSquare, Square, Trash2, Edit, Archive } from "lucide-react";
import Link from "next/link";
import ConversationsInbox from "../../components/ConversationsInbox";

import { Suspense } from "react";

function DashboardContent() {

  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "properties";
  const successParam = searchParams.get("success");
  const deletedParam = searchParams.get("deleted");
  
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedSort, setSelectedSort] = useState<string>("none");
  const [propertyType, setPropertyType] = useState<"rent" | "sale">("rent");
  const [propertySearch, setPropertySearch] = useState("");
  const [contractSearch, setContractSearch] = useState("");
  const [contractFilter, setContractFilter] = useState<"all" | "active" | "pending" | "completed" | "draft">("all");
  const [tenantSearch, setTenantSearch] = useState("");
  const [tenantFilter, setTenantFilter] = useState<"all" | "current" | "pending" | "late" | "archived">("all");
  
  // Toast notification state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Selection mode state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedProperties, setSelectedProperties] = useState<Set<string>>(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  
  // State for properties loaded from Supabase
  const [properties, setProperties] = useState<any[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);

  // Show success toast if redirected after creating or deleting property
  useEffect(() => {
    if (successParam === 'property_created') {
      setToastMessage('✅ Property added successfully!');
      setShowToast(true);
      
      // Auto-hide after 4 seconds
      setTimeout(() => {
        setShowToast(false);
      }, 4000);
      
      // Clear URL parameter
      window.history.replaceState({}, '', '/dashboard?tab=properties');
    } else if (deletedParam === 'success') {
      setToastMessage('🗑️ Property deleted successfully!');
      setShowToast(true);
      
      // Auto-hide after 4 seconds
      setTimeout(() => {
        setShowToast(false);
      }, 4000);
      
      // Clear URL parameter
      window.history.replaceState({}, '', '/dashboard?tab=properties');
    }
  }, [successParam, deletedParam]);

  // Load properties from Supabase when component mounts or propertyType changes
  useEffect(() => {
    const fetchProperties = async () => {
      setLoadingProperties(true);
      try {
        const response = await fetch(`/api/properties?type=${propertyType}`);
        const data = await response.json();
        setProperties(data.properties || []);
      } catch (error) {
        console.error('Error fetching properties:', error);
        setProperties([]);
      } finally {
        setLoadingProperties(false);
      }
    };

    fetchProperties();
  }, [propertyType]);

  // State for tenants loaded from Supabase
  const [tenants, setTenants] = useState<any[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(true);

  // Load tenants from Supabase when component mounts or tenantFilter changes
  useEffect(() => {
    const fetchTenants = async () => {
      setLoadingTenants(true);
      try {
        const statusParam = tenantFilter === 'all' ? '' : `?status=${tenantFilter}`;
        const response = await fetch(`/api/tenants${statusParam}`);
        const data = await response.json();
        setTenants(data.tenants || []);
      } catch (error) {
        console.error('Error fetching tenants:', error);
        setTenants([]);
      } finally {
        setLoadingTenants(false);
      }
    };

    fetchTenants();
  }, [tenantFilter]);


  // State for contracts loaded from Supabase
  const [contracts, setContracts] = useState<any[]>([]);
  const [loadingContracts, setLoadingContracts] = useState(true);

  // State for appointments (showings)
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    // 0 = Sunday, 1 = Monday. Adjusting so Monday is 0 (as per grid headers)
    const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const prevMonth = () => {
    const minDate = new Date();
    minDate.setMonth(minDate.getMonth() - 2);
    minDate.setDate(1);

    const prevDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    if (prevDate >= minDate) {
      setCurrentDate(prevDate);
    }
  };

  const nextMonth = () => {
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1);
    maxDate.setDate(1);

    const nextDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    if (nextDate <= maxDate) {
      setCurrentDate(nextDate);
    }
  };

  /* Calendar State */
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);

  /* Smart Navigation Logic */
  const nextAppointment = appointments
    .filter(apt => new Date(apt.start_time) >= new Date())
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())[0];

  const goToSmartDate = () => {
    if (nextAppointment) {
      const aptDate = new Date(nextAppointment.start_time);
      setCurrentDate(aptDate);
      setSelectedCalendarDate(aptDate);
    } else {
      setCurrentDate(new Date());
    }
  };

  // Load contracts from Supabase when component mounts or contractFilter changes
  useEffect(() => {
    const fetchContracts = async () => {
      setLoadingContracts(true);
      try {
        const statusParam = contractFilter === 'all' ? '' : `?status=${contractFilter}`;
        const response = await fetch(`/api/contracts${statusParam}`);
        const data = await response.json();
        setContracts(data.contracts || []);
      } catch (error) {
        console.error('Error fetching contracts:', error);
        setContracts([]);
      } finally {
        setLoadingContracts(false);
      }
    };

    fetchContracts();
  }, [contractFilter]);

  // Load appointments (showings) from Supabase
  useEffect(() => {
    const fetchAppointments = async () => {
      console.log('📅 Fetching appointments...');
      setLoadingAppointments(true);
      try {
        const response = await fetch('/api/appointments');
        console.log('📅 Appointments API Status:', response.status);
        const data = await response.json();
        console.log('📅 Appointments API Data:', data);
        // Use 'upcoming' array from API
        setAppointments(data.upcoming || []);
      } catch (error) {
        console.error('Error fetching appointments:', error);
        setAppointments([]);
      } finally {
        setLoadingAppointments(false);
      }
    };

    console.log('👀 Dashboard Effect: ActiveTab =', activeTab);
    if (activeTab === 'calendar') {
      fetchAppointments();
    }
  }, [activeTab]);



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
        property.amenities?.some((a: string) => a.toLowerCase().includes(searchLower)) ||
        property.features?.some((f: string) => f.toLowerCase().includes(searchLower))
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

  // Filter tenants by search
  const filteredTenants = tenants.filter(tenant => {
    if (!tenantSearch.trim()) return true;
    const searchLower = tenantSearch.toLowerCase();
    return (
      tenant.name?.toLowerCase().includes(searchLower) ||
      tenant.email?.toLowerCase().includes(searchLower) ||
      tenant.phone?.toLowerCase().includes(searchLower) ||
      tenant.property_address?.toLowerCase().includes(searchLower)
    );
  });

  // Filter contracts by search
  const filteredContracts = contracts.filter(contract => {
    if (!contractSearch.trim()) return true;
    const searchLower = contractSearch.toLowerCase();
    return (
      contract.name?.toLowerCase().includes(searchLower) ||
      contract.property_address?.toLowerCase().includes(searchLower) ||
      contract.tenant_name?.toLowerCase().includes(searchLower)
    );
  });

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

  // Selection mode handlers
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedProperties(new Set());
  };

  const togglePropertySelection = (propertyId: string) => {
    const newSelection = new Set(selectedProperties);
    if (newSelection.has(propertyId)) {
      newSelection.delete(propertyId);
    } else {
      newSelection.add(propertyId);
    }
    setSelectedProperties(newSelection);
  };

  const selectAllProperties = () => {
    if (selectedProperties.size === sortedProperties.length) {
      setSelectedProperties(new Set());
    } else {
      setSelectedProperties(new Set(sortedProperties.map(p => p.id)));
    }
  };

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    try {
      const deletePromises = Array.from(selectedProperties).map(propertyId =>
        fetch(`/api/properties/${propertyId}`, { method: 'DELETE' })
      );
      
      const results = await Promise.all(deletePromises);
      const allSuccessful = results.every(res => res.ok);
      
      if (allSuccessful) {
        setToastMessage(`🗑️ ${selectedProperties.size} properties deleted successfully!`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
        
        // Refresh properties list
        const response = await fetch(`/api/properties?type=${propertyType}`);
        const data = await response.json();
        setProperties(data.properties || []);
        
        // Exit selection mode
        setSelectionMode(false);
        setSelectedProperties(new Set());
      } else {
        alert('Some properties failed to delete. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting properties:', error);
      alert('Failed to delete properties');
    } finally {
      setBulkDeleting(false);
      setShowBulkDeleteModal(false);
    }
  };

  return (
    <div className="p-10 min-w-0">
      {/* Inbox Tab */}
      {activeTab === "inbox" && <ConversationsInbox />}
      
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

                {/* Select Button */}
                <button 
                  onClick={toggleSelectionMode}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all font-semibold text-sm cursor-pointer ${
                    selectionMode 
                      ? "bg-blue-600 text-white hover:bg-blue-700" 
                      : "bg-black text-white hover:bg-gray-800"
                  }`}
                >
                  {selectionMode ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  {selectionMode ? "Cancel" : "Select"}
                </button>
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

              {/* Bulk Actions Bar */}
              {selectionMode && selectedProperties.size > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5">
                  <div className="bg-black text-white rounded-2xl shadow-2xl px-6 py-4 flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="w-5 h-5 text-blue-400" />
                      <span className="font-semibold text-lg">{selectedProperties.size} selected</span>
                    </div>
                    
                    <div className="h-6 w-px bg-gray-600"></div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={selectAllProperties}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-all"
                      >
                        {selectedProperties.size === sortedProperties.length ? 'Deselect All' : 'Select All'}
                      </button>
                      
                      <button
                        onClick={() => setShowBulkDeleteModal(true)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Properties Grid */}
          {loadingProperties ? (
            <div className="bg-white rounded-2xl p-16 text-center">
              <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="text-xl font-bold text-black mb-2">Loading properties...</h3>
              <p className="text-gray-600">Please wait while we fetch your properties.</p>
            </div>
          ) : sortedProperties.length === 0 ? (
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
              <div 
                key={property.id} 
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-2xl hover:-translate-y-1 hover:border-gray-300 transition-all duration-300 block group w-full relative"
              >
                {/* Selection Checkbox */}
                {selectionMode && (
                  <div className="absolute top-3 left-3 z-10">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        togglePropertySelection(property.id);
                      }}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all shadow-lg ${
                        selectedProperties.has(property.id)
                          ? "bg-blue-600 text-white"
                          : "bg-white/90 text-gray-600 hover:bg-white"
                      }`}
                    >
                      {selectedProperties.has(property.id) ? (
                        <CheckSquare className="w-5 h-5" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                )}

                <Link 
                  href={`/dashboard/property/${property.id}`}
                  className="cursor-pointer block"
                  onClick={(e) => {
                    if (selectionMode) {
                      e.preventDefault();
                      togglePropertySelection(property.id);
                    }
                  }}
                >
                  {/* Property Image */}
                  <div className="relative h-48 bg-gray-200 overflow-hidden">
                  <img 
                    src={
                      property.images?.[0] 
                        ? property.images[0].startsWith('data:image') 
                          ? property.images[0]  // base64 image
                          : property.images[0].includes('?') 
                            ? property.images[0] 
                            : `${property.images[0]}?w=800`
                        : property.image 
                          ? property.image.startsWith('data:image')
                            ? property.image  // base64 image
                            : property.image.includes('?')
                              ? property.image
                              : `${property.image}?w=800`
                          : 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800'
                    }
                    alt={property.address}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://via.placeholder.com/800x600/e5e7eb/6b7280?text=Property+Image';
                    }}
                  />
                  {/* Info Badge (Optional) */}
                  <div className="absolute top-3 right-3">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-black/50 text-white backdrop-blur-sm">
                      {property.type === 'rent' ? 'For Rent' : 'For Sale'}
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
                        <span>
                          {property.address}
                          {property.city && `, ${property.city}`}
                          {property.state && ` ${property.state}`}
                        </span>
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
                          {property.interestedTenants?.slice(0, 3).map((tenant: any, idx: number) => (
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
              </div>
            ))}
          </div>
          )}

          {/* Add Property Button */}
          <div className="mt-8 text-center">
            <Link href="/dashboard/property/new">
              <button className="px-8 py-4 bg-gray-100 text-black rounded-lg font-semibold hover:bg-gray-200 transition-all cursor-pointer">
                + Add New Property
              </button>
            </Link>
          </div>

          {/* Bulk Delete Confirmation Modal */}
          {showBulkDeleteModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
                {/* Close button */}
                <button
                  onClick={() => !bulkDeleting && setShowBulkDeleteModal(false)}
                  disabled={bulkDeleting}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                >
                  <X className="w-6 h-6" />
                </button>

                {/* Icon */}
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <Trash2 className="w-8 h-8 text-red-600" />
                  </div>
                </div>

                {/* Title and Message */}
                <h3 className="text-2xl font-bold text-black text-center mb-3">
                  Delete {selectedProperties.size} Properties?
                </h3>
                <p className="text-gray-600 text-center mb-6">
                  Are you sure you want to delete <strong>{selectedProperties.size} properties</strong>? This action will mark them as inactive and they won't appear in your listings.
                </p>

                {/* Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowBulkDeleteModal(false)}
                    disabled={bulkDeleting}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    disabled={bulkDeleting}
                    className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {bulkDeleting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-5 h-5" />
                        Delete All
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
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

            {/* Empty state if no contracts exist at all */}
            {loadingContracts ? (
              <div className="bg-white rounded-2xl p-16 shadow-sm border border-gray-200 text-center">
                <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
                <h3 className="text-xl font-bold text-black mb-2">Loading contracts...</h3>
                <p className="text-gray-600">Please wait while we fetch your contracts.</p>
              </div>
            ) : contracts.length === 0 ? (
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
            ) : (
              /* Contracts Table - only show when contracts exist */
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

            {/* Loading State */}
            {loadingTenants ? (
              <div className="bg-white rounded-2xl p-16 text-center">
                <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
                <h3 className="text-xl font-bold text-black mb-2">Loading tenants...</h3>
                <p className="text-gray-600">Please wait while we fetch your tenants.</p>
              </div>
            ) : (
              <>
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
          </>
        )}
      </div>
    </>
  )}



      {/* Calendar Tab */}
      {activeTab === "calendar" && (
        <>
            {/* Conditional Rendering: Month View vs Day View */}
            {!selectedCalendarDate ? (
              // MONTH VIEW
              <div className="space-y-8 animate-in slide-in-from-left duration-300">
                  {/* Header */}
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-4xl font-bold text-black mb-2">Calendar</h2>
                        <p className="text-lg text-gray-600">Schedule and manage property viewings</p>
                      </div>

                    </div>
                  </div>

                  {/* Calendar View */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Calendar Header */}
                    <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={prevMonth}
                          className="w-9 h-9 rounded-lg border border-gray-300 hover:bg-gray-50 flex items-center justify-center transition-all"
                        >
                          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <h3 className="text-xl font-bold text-black min-w-[140px] text-center">
                          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </h3>
                        <button 
                          onClick={nextMonth}
                          className="w-9 h-9 rounded-lg border border-gray-300 hover:bg-gray-50 flex items-center justify-center transition-all"
                        >
                          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                      <button 
                        onClick={goToSmartDate}
                        className={`px-4 py-2 border rounded-lg text-sm font-medium transition-all min-w-[130px] flex items-center justify-center gap-2 ${
                          nextAppointment 
                            ? 'bg-black text-white border-black hover:bg-gray-800 shadow-md' 
                            : 'border-gray-300 text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        {nextAppointment ? (
                          <>
                            <span>Next: {new Date(nextAppointment.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </>
                        ) : (
                          'Today'
                        )}
                      </button>
                    </div>

                    {/* Calendar Grid */}
                    <div className="p-6">
                      {/* Weekday Headers */}
                      <div className="grid grid-cols-7 gap-4 mb-4">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                          <div key={day} className="text-center text-sm font-semibold text-gray-600">
                            {day}
                          </div>
                        ))}
                      </div>

                      {/* Calendar Days */}
                      <div className="grid grid-cols-7 gap-4">
                        {/* Empty cells for days before month start */}
                        {[...Array(getFirstDayOfMonth(currentDate))].map((_, i) => (
                          <div key={`empty-${i}`} className="aspect-square"></div>
                        ))}
                        
                        {/* Days of the month */}
                        {[...Array(getDaysInMonth(currentDate))].map((_, i) => {
                          const day = i + 1;
                          const month = currentDate.getMonth(); 
                          const year = currentDate.getFullYear();
                          
                          // Filter appointments for this specific day
                          const dayAppointments = appointments.filter(apt => {
                            const aptDate = new Date(apt.start_time);
                            return aptDate.getDate() === day && 
                                   aptDate.getMonth() === month && 
                                   aptDate.getFullYear() === year;
                          });
                          
                          const hasShowing = dayAppointments.length > 0;
                          
                          // Check if this specific cell represents TODAY
                          const now = new Date();
                          const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
                          const isPast = new Date(year, month, day) < new Date(now.getFullYear(), now.getMonth(), now.getDate());
                          
                          return (
                            <div
                              key={day}
                              className={`aspect-square border rounded-xl transition-all relative overflow-hidden group cursor-pointer ${
                                isToday 
                                  ? 'border-black bg-gray-50' 
                                  : isPast
                                  ? 'border-gray-100 bg-gray-50 opacity-60' 
                                  : 'border-gray-200 hover:border-black hover:shadow-md'
                              }`}
                              onClick={() => setSelectedCalendarDate(new Date(year, month, day))}
                            >
                              <div className="flex flex-col h-full p-2">
                                {/* Day Number */}
                                <span className={`text-sm font-semibold mb-1 ${
                                  isToday ? 'bg-black text-white w-7 h-7 flex items-center justify-center rounded-full' : isPast ? 'text-gray-400' : 'text-gray-900'
                                }`}>
                                  {day}
                                </span>

                                {/* Events Container */}
                                {hasShowing && (
                                  <div className="flex flex-col gap-1 mt-1">
                                     {dayAppointments.slice(0, 2).map((apt, idx) => (
                                       <div 
                                         key={apt.id} 
                                         className={`text-[10px] sm:text-xs px-2 py-1 rounded-md truncate font-medium flex items-center gap-1 ${
                                           idx === 0 
                                             ? 'bg-black text-white' 
                                             : 'bg-gray-100 text-gray-700'
                                         }`}
                                       >
                                         <div className={`w-1.5 h-1.5 rounded-full ${idx === 0 ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                                         {new Date(apt.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                       </div>
                                     ))}
                                     
                                     {/* Overflow Indicator */}
                                     {dayAppointments.length > 2 && (
                                       <div className="text-[10px] text-gray-500 font-medium pl-1">
                                         +{dayAppointments.length - 2} more
                                       </div>
                                     )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Upcoming Showings List */}
                  <div className="mt-8">
                    <h3 className="text-2xl font-bold text-black mb-4">Upcoming Showings</h3>
                    
                    {loadingAppointments ? (
                       <div className="text-center py-10">
                         <div className="w-8 h-8 border-2 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-2"></div>
                         <p className="text-gray-500 text-sm">Loading showings...</p>
                       </div>
                    ) : appointments.length === 0 ? (
                       <div className="bg-white rounded-xl p-8 border border-gray-200 text-center">
                         <p className="text-gray-500">No upcoming showings scheduled.</p>
                         <button className="mt-4 px-4 py-2 bg-black text-white rounded-lg text-sm font-semibold">
                           Schedule a Showing
                         </button>
                       </div>
                    ) : (
                    <div className="space-y-4">
                      {appointments.map((showing) => (
                        <div
                          key={showing.id}
                          className="bg-white rounded-xl p-6 border border-gray-200 hover:border-gray-300 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="text-lg font-semibold text-black">
                                  {showing.property_id 
                                    ? showing.properties?.address || 'Unknown Property'
                                    : showing.title.replace('Viewing: ', '')}
                                </h4>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  showing.status === 'confirmed'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {showing.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                                </span>
                              </div>
                              <div className="flex items-center gap-6 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                  <span>{showing.tenants?.name || 'Potential Tenant'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <span>
                                    {new Date(showing.start_time).toLocaleDateString('en-US', { 
                                      month: 'short', day: 'numeric', year: 'numeric' 
                                    })}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span>
                                    {new Date(showing.start_time).toLocaleTimeString('en-US', { 
                                      hour: 'numeric', minute: '2-digit' 
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <a 
                                href={showing.google_event_link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-black text-white border border-black rounded-lg text-sm font-medium hover:bg-gray-800 transition-all flex items-center gap-2"
                              >
                                 <span>Google Cal</span>
                              </a>
                              <button className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-all">
                                Details
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    )}
                  </div>
              </div>
            ) : (
               // DAY VIEW (TIMELINE)
               <div className="animate-in slide-in-from-right duration-300 w-full h-[calc(100vh-100px)] flex flex-col">
                  {/* Header */}
                  <div className="shrink-0 flex items-center justify-between mb-4">
                    <button 
                      onClick={() => setSelectedCalendarDate(null)}
                      className="flex items-center gap-2 text-gray-700 hover:text-black font-semibold transition-colors group"
                    >
                      <ArrowLeft className="w-5 h-5 text-gray-500 group-hover:text-black transition-colors" />
                      <span>Back to Calendar</span>
                    </button>

                    {/* Deep Link to Google Calendar */}
                    <a 
                      href={`https://calendar.google.com/calendar/r/eventedit?text=Prospective+Tenant+Viewing&details=Prospective+tenant+showing+via+LeaseAI&location=123+Main+St,+Seattle,+WA`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 flex items-center gap-2 transition-all shadow-sm hover:shadow-md"
                    >
                       <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                       </svg>
                       <span className="font-semibold whitespace-nowrap">Schedule Showing</span>
                    </a>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col flex-1 min-h-0">
                    {/* Header */}
                    <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-40 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] shrink-0">
                      <div>
                        <h3 className="text-3xl font-bold text-black flex items-center gap-4">
                           {selectedCalendarDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                           {selectedCalendarDate.toDateString() === new Date().toDateString() && (
                             <span className="text-sm bg-black text-white px-3 py-1 rounded-full uppercase tracking-wide font-bold shadow-sm">Today</span>
                           )}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-gray-500 font-medium text-base">
                            {appointments.filter(apt => {
                              const d = new Date(apt.start_time);
                              const s = selectedCalendarDate;
                              return d.getDate() === s.getDate() && d.getMonth() === s.getMonth() && d.getFullYear() === s.getFullYear();
                            }).length} showings scheduled
                          </p>
                          <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                          <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-200 uppercase tracking-wider">
                             {new Date().toLocaleTimeString('en-us',{timeZoneName:'short'}).split(' ')[2] || 'GMT'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Day Navigation */}
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            const newDate = new Date(selectedCalendarDate);
                            newDate.setDate(selectedCalendarDate.getDate() - 1);
                            setSelectedCalendarDate(newDate);
                          }}
                          className="w-10 h-10 rounded-full border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-all group"
                          aria-label="Previous Day"
                        >
                          <svg className="w-5 h-5 text-gray-500 group-hover:text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => {
                            const newDate = new Date(selectedCalendarDate);
                            newDate.setDate(selectedCalendarDate.getDate() + 1);
                            setSelectedCalendarDate(newDate);
                          }}
                          className="w-10 h-10 rounded-full border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-all group"
                          aria-label="Next Day"
                        >
                          <svg className="w-5 h-5 text-gray-500 group-hover:text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Timeline Grid */}
                    <div className="flex-1 overflow-y-auto relative bg-white" ref={(el) => {
                      // Scroll to 8 AM by default if first render
                      if (el && !el.dataset.scrolled) {
                        el.scrollTop = 8 * 100; // Updated scale 100px
                        el.dataset.scrolled = "true";
                      }
                    }}>
                      <div className="relative min-h-[2500px] w-full pt-6"> {/* Reduced padding to 24px (pt-6) */}
                        
                        {/* Current Time Indicator (only if today) */}
                        {selectedCalendarDate.toDateString() === new Date().toDateString() && (
                          <div 
                            className="absolute z-30 left-24 right-0 border-t-2 border-red-500 pointer-events-none flex items-center"
                            style={{ 
                              // +24px to account for pt-6 padding
                              top: `${(new Date().getHours() * 100 + (new Date().getMinutes() * (100/60))) + 24}px` 
                            }}
                          >
                            <div className="w-3 h-3 bg-red-500 rounded-full -ml-[6px] shadow-sm ring-2 ring-white"></div>
                          </div>
                        )}

                        {/* Grid Lines & Hours */}
                        {Array.from({ length: 24 }).map((_, hour) => (
                          <div key={hour} className="h-[100px] relative flex group">
                            {/* Time Label */}
                            <div className="w-24 shrink-0 text-right pr-6 -mt-3 border-r border-gray-100 h-full">
                              <span className="text-sm font-bold text-gray-400">
                                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                              </span>
                            </div>
                            
                            {/* Line */}
                            <div className="flex-1 border-b border-gray-100 group-hover:bg-gray-50/30 transition-colors relative">
                              {/* Half-hour marker hint */}
                              <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-gray-100 w-full"></div>
                            </div>
                          </div>
                        ))}

                        {/* Appointments Layer */}
                        {appointments
                          .filter(apt => {
                            const d = new Date(apt.start_time);
                            const s = selectedCalendarDate!;
                            return d.getDate() === s.getDate() && d.getMonth() === s.getMonth() && d.getFullYear() === s.getFullYear();
                          })
                          .map((showing) => {
                            const date = new Date(showing.start_time);
                            // Scale: 100px per hour => 1.66px per minute
                            // +24px padding
                            const top = (date.getHours() * 100 + (date.getMinutes() * (100/60))) + 24;
                            const height = 100; // 1 hour slot
                            
                            return (
                              <div
                                key={showing.id}
                                className="absolute left-28 right-6 rounded-xl p-1 cursor-pointer shadow-sm hover:shadow-2xl hover:z-20 transition-all group"
                                style={{
                                  top: `${top}px`,
                                  height: `${height}px`,
                                }}
                                onClick={() => setSelectedAppointment(showing)}
                              >
                                <div className="h-full bg-black text-white rounded-lg border-l-[6px] border-gray-700 overflow-hidden hover:bg-gray-900 transition-colors flex">
                                    {/* Time Column in Card */}
                                    <div className="w-24 bg-gray-900/50 flex flex-col justify-center items-center px-2 border-r border-gray-800">
                                        <span className="text-lg font-bold">
                                          {date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                        </span>
                                        <span className={`text-[10px] uppercase tracking-wider font-bold mt-1 px-2 py-0.5 rounded ${
                                            showing.status === 'confirmed' ? 'bg-green-500 text-black' : 'bg-yellow-500 text-black'
                                        }`}>
                                          {showing.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                                        </span>
                                    </div>

                                    {/* Details Column */}
                                    <div className="p-4 flex-1 flex flex-col justify-center">
                                        <h4 className="font-bold text-lg truncate mb-1">
                                          {showing.title}
                                        </h4>
                                        <p className="text-gray-400 text-sm truncate flex items-center gap-2">
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                          </svg>
                                          {showing.properties?.address || 'No location loaded'}
                                        </p>
                                    </div>

                                    {/* Arrow */}
                                    <div className="pr-4 flex items-center justify-center text-gray-400 group-hover:translate-x-1 transition-transform">
                                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                      </svg>
                                    </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
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



      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top-5 duration-300">
          <div className="bg-black text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px]">
            <span className="text-sm font-medium">{toastMessage}</span>
            <button
              onClick={() => setShowToast(false)}
              className="ml-auto hover:opacity-80 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      {/* Appointment Details Sheet */}
      {selectedAppointment && (
        <ShowingDetailsSheet 
          appointment={selectedAppointment} 
          onClose={() => setSelectedAppointment(null)} 
        />
      )}
    </div>
  );
}




export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
    </div>}>
      <DashboardContent />
    </Suspense>
  );
}

// Showing Details Component
function ShowingDetailsSheet({ appointment, onClose }: { appointment: any, onClose: () => void }) {
  const date = new Date(appointment.start_time);
  
  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                appointment.status === 'confirmed' ? 'bg-green-500 text-black' : 'bg-yellow-500 text-black'
              }`}>
                {appointment.status}
              </span>
              <span className="text-gray-500 text-sm font-medium">Viewing Request</span>
            </div>
            <h3 className="text-2xl font-bold text-black">
              {date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </h3>
            <p className="text-gray-500 font-medium">
              {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Tenant Info */}
          <section>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              PROSPECTIVE TENANT
            </h4>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
               <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                    {appointment.tenants?.name?.[0] || '?'}
                  </div>
                  <div>
                    <h5 className="font-bold text-lg text-black">{appointment.tenants?.name || 'Unknown Name'}</h5>
                    <p className="text-gray-500 text-sm">{appointment.tenants?.email || 'No email'}</p>
                  </div>
               </div>
               
               {/* Contact Actions */}
               <div className="grid grid-cols-2 gap-3 mb-4">
                 <a href={`mailto:${appointment.tenants?.email}`} className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-gray-50 hover:bg-gray-100 text-sm font-medium transition-colors">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                   Email
                 </a>
                 <a href={`tel:${appointment.tenants?.phone}`} className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-gray-50 hover:bg-gray-100 text-sm font-medium transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    Call
                 </a>
               </div>

               {/* AI Notes / Context */}
               {appointment.tenants?.notes && (
                 <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">AI SUMMARY & CONTEXT</p>
                    <div className="text-sm text-gray-700 bg-yellow-50 p-3 rounded-lg border border-yellow-100 leading-relaxed">
                       {appointment.tenants.notes}
                    </div>
                 </div>
               )}
            </div>
          </section>

          {/* Property Info */}
          <section>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              PROPERTY OF INTEREST
            </h4>
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.open(`/properties/${appointment.properties?.id}`, '_self')}>
               {appointment.properties?.images?.[0] ? (
                 <div className="h-32 w-full bg-gray-200">
                    <img src={appointment.properties.images[0]} alt="Property" className="w-full h-full object-cover" />
                 </div>
               ) : (
                 <div className="h-24 w-full bg-gray-100 flex items-center justify-center text-gray-400">
                    <span className="text-xs">No image available</span>
                 </div>
               )}
               <div className="p-4">
                 <h5 className="font-bold text-black mb-1">{appointment.properties?.address}</h5>
                 <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="font-semibold text-black">{appointment.properties?.price}</span>
                    <span>•</span>
                    <span>{appointment.properties?.beds} Beds</span>
                    <span>•</span>
                    <span>{appointment.properties?.baths} Baths</span>
                 </div>
               </div>
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex flex-col gap-3">
           <a 
             href={appointment.google_event_link} 
             target="_blank" 
             rel="noopener noreferrer"
             className="w-full py-3 bg-black text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-all shadow-sm active:scale-[0.98]"
           >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              Open in Google Calendar
           </a>
        </div>
      </div>
    </div>
  );
}
