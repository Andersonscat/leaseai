"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Inbox, TrendingUp, Home, BarChart3, Plus, MapPin, Bed, Bath, Ruler, Dog, Filter, ChevronUp, ChevronDown, Mail, MailOpen, FileText, Star, Clock, CheckCircle, XCircle, MoreVertical, Search, Users, Phone, MessageSquare, DollarSign, X, CheckSquare, Square, Trash2, Edit, Archive, Megaphone, Briefcase, Sparkles, Calendar as CalendarIcon, Bot, User, Building2, Settings2, Bell, Shield, AlertTriangle, Radio, LogOut } from "lucide-react";
import Link from "next/link";
import ConversationsInbox from "../../components/ConversationsInbox";
import Avatar from "@/components/Avatar";
import { createSupabaseClient } from "@/lib/supabase";

import { Suspense } from "react";

// Helper to format currency
const formatCurrency = (amount: number | null | undefined) => {
  if (amount === null || amount === undefined) return "N/A";
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
};

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

function DashboardContent() {
  const supabase = createSupabaseClient();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "inbox";
  const successParam = searchParams.get("success");
  const deletedParam = searchParams.get("deleted");
  const gmailConnectedParam = searchParams.get("gmail_connected");
  const gmailErrorParam = searchParams.get("gmail_error");
  const accountTabParam = searchParams.get("accountTab");
  
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

  // Account page state
  const [user, setUser] = useState<any>(null);
  const [accountForm, setAccountForm] = useState({
    // Basic
    full_name: '', email: '', phone: '', company: '', job_title: '', website: '',
    // Professional
    license_number: '', license_state: '', license_expiration: '', brokerage_name: '', mls_id: '', nar_id: '', service_areas: '',
    // AI / Operational
    ai_signature_name: '', ai_phone: '', timezone: '', default_language: 'en',
    viewing_hours_start: '10:00', viewing_hours_end: '20:00',
    email_signature: '',
    // Notifications
    notif_email: true, notif_sms: false, notif_weekly: true,
  });
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [accountTab, setAccountTab] = useState<'profile' | 'professional' | 'channels' | 'ai' | 'notifications' | 'security'>('profile');
  const [gmailStatus, setGmailStatus] = useState<{ connected: boolean; gmail_email: string | null; loading: boolean }>({ connected: false, gmail_email: null, loading: true });
  const [gmailConnecting, setGmailConnecting] = useState(false);
  const [gmailDisconnecting, setGmailDisconnecting] = useState(false);
  
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
      setToastMessage('Property added successfully!');
      setShowToast(true);
      
      // Auto-hide after 4 seconds
      setTimeout(() => {
        setShowToast(false);
      }, 4000);
      
      // Clear URL parameter
      window.history.replaceState({}, '', '/dashboard?tab=properties');
    } else if (deletedParam === 'success') {
      setToastMessage('Property deleted successfully!');
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

  // Tenant selection state
  const [tenantSelectionMode, setTenantSelectionMode] = useState(false);
  const [selectedTenants, setSelectedTenants] = useState<Set<string>>(new Set());
  const [showTenantDeleteModal, setShowTenantDeleteModal] = useState(false);
  const [deletingTenants, setDeletingTenants] = useState(false);

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

  const handleDeleteTenants = async () => {
    setDeletingTenants(true);
    try {
      await Promise.all(
        Array.from(selectedTenants).map(id =>
          fetch(`/api/tenants/${id}`, { method: 'DELETE' })
        )
      );
      setShowTenantDeleteModal(false);
      setTenantSelectionMode(false);
      setSelectedTenants(new Set());
      setToastMessage(`${selectedTenants.size} tenant${selectedTenants.size > 1 ? 's' : ''} deleted`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
      // Refresh tenants list
      const statusParam = tenantFilter === 'all' ? '' : `?status=${tenantFilter}`;
      const res = await fetch(`/api/tenants${statusParam}`);
      const data = await res.json();
      setTenants(data.tenants || []);
    } catch (error) {
      console.error('Error deleting tenants:', error);
      alert('Failed to delete some tenants.');
    } finally {
      setDeletingTenants(false);
    }
  };


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

  // Load user for Account tab
  useEffect(() => {
    if (activeTab !== 'account') return;
    const loadUser = async () => {
      const { data: { user: u } } = await supabase.auth.getUser();
      setUser(u);
      if (u) {
        const m = u.user_metadata || {};
        setAccountForm({
          full_name:            m.full_name || '',
          email:                u.email || '',
          phone:                m.phone || u.phone || '',
          company:              m.company || '',
          job_title:            m.job_title || '',
          website:              m.website || '',
          license_number:       m.license_number || '',
          license_state:        m.license_state || '',
          license_expiration:   m.license_expiration || '',
          brokerage_name:       m.brokerage_name || '',
          mls_id:               m.mls_id || '',
          nar_id:               m.nar_id || '',
          service_areas:        m.service_areas || '',
          ai_signature_name:    m.ai_signature_name || m.full_name || '',
          ai_phone:             m.ai_phone || m.phone || u.phone || '',
          timezone:             m.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles',
          default_language:     m.default_language || 'en',
          viewing_hours_start:  m.viewing_hours_start || '10:00',
          viewing_hours_end:    m.viewing_hours_end || '20:00',
          email_signature:      m.email_signature || '',
          notif_email:          m.notif_email !== false,
          notif_sms:            m.notif_sms === true,
          notif_weekly:         m.notif_weekly !== false,
        });
      }
    };
    loadUser();
  }, [activeTab]);

  // Handle Gmail OAuth callback redirect
  useEffect(() => {
    if (gmailConnectedParam === 'true') {
      setAccountTab('channels');
      setGmailStatus({ connected: true, gmail_email: null, loading: true });
      setToastMessage('Gmail connected successfully!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
      // Reload status to get the email
      fetch('/api/gmail/status').then(r => r.json()).then(data => {
        setGmailStatus({ connected: data.status?.connected ?? true, gmail_email: data.status?.gmail_email ?? null, loading: false });
      }).catch(() => setGmailStatus(prev => ({ ...prev, loading: false })));
    } else if (gmailErrorParam) {
      setAccountTab('channels');
      setToastMessage(`Gmail connection failed: ${gmailErrorParam}`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 6000);
    } else if (accountTabParam) {
      setAccountTab(accountTabParam as any);
    }
  }, [gmailConnectedParam, gmailErrorParam, accountTabParam]);

  // Load Gmail connection status when Channels tab is active
  useEffect(() => {
    if (activeTab !== 'account' || accountTab !== 'channels') return;
    const loadGmailStatus = async () => {
      setGmailStatus(prev => ({ ...prev, loading: true }));
      try {
        const res = await fetch('/api/gmail/status');
        if (res.ok) {
          const data = await res.json();
          setGmailStatus({ connected: data.status?.connected ?? false, gmail_email: data.status?.gmail_email ?? null, loading: false });
        } else {
          setGmailStatus({ connected: false, gmail_email: null, loading: false });
        }
      } catch {
        setGmailStatus({ connected: false, gmail_email: null, loading: false });
      }
    };
    loadGmailStatus();
  }, [activeTab, accountTab]);

  // Save a subset of account fields to Supabase user_metadata
  const saveAccountSection = async (fields: Partial<typeof accountForm>, sectionKey: string) => {
    setSavingSection(sectionKey);
    try {
      const data: Record<string, any> = {};
      (Object.keys(fields) as Array<keyof typeof accountForm>).forEach(k => {
        // email is read-only, skip
        if (k === 'email') return;
        data[k] = (fields as any)[k];
      });
      await supabase.auth.updateUser({ data });
      setToastMessage('Saved successfully');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    } catch {
      setToastMessage('Failed to save');
      setShowToast(true);
    } finally {
      setSavingSection(null);
    }
  };

  // Sort properties based on selected filter and direction
  const getSortedProperties = () => {
    // First filter by property type
    let filtered = properties.filter(p => p.type === propertyType);
    
    // Then filter by search query
    if (propertySearch.trim()) {
      const searchLower = propertySearch.toLowerCase();
      filtered = filtered.filter(property => 
        property.address.toLowerCase().includes(searchLower) ||
        (property.price_monthly && property.price_monthly.toString().includes(searchLower)) ||
        property.beds.toString().includes(searchLower) ||
        property.baths.toString().includes(searchLower) ||
        (property.sqft && property.sqft.toString().includes(searchLower)) ||
        (property.pet_policy && JSON.stringify(property.pet_policy).toLowerCase().includes(searchLower)) ||
        property.status.toLowerCase().includes(searchLower) ||
        property.description?.toLowerCase().includes(searchLower) ||
        property.amenities?.some((a: string) => a.toLowerCase().includes(searchLower)) ||
        property.features?.some((f: string) => f.toLowerCase().includes(searchLower))
      );
    }
    
    let sorted = [...filtered];

    switch (selectedSort) {
      case "price":
        sorted.sort((a, b) => {
          const priceA = a.price_monthly || 0;
          const priceB = b.price_monthly || 0;
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
      const results = await Promise.allSettled(
        Array.from(selectedProperties).map(propertyId =>
          fetch(`/api/properties/${propertyId}`, { method: 'DELETE' })
        )
      );

      // Count successes — treat 404 as success (already deleted / not found)
      const failed = results.filter(r =>
        r.status === 'rejected' ||
        (r.status === 'fulfilled' && !r.value.ok && r.value.status !== 404)
      );

      const count = results.length - failed.length;
      setToastMessage(`${count} ${count === 1 ? 'property' : 'properties'} deleted successfully`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);

      // Always refresh the list regardless of partial failures
      const response = await fetch(`/api/properties?type=${propertyType}`);
      const data = await response.json();
      setProperties(data.properties || []);

      setSelectionMode(false);
      setSelectedProperties(new Set());
    } catch (error) {
      console.error('Error deleting properties:', error);
    } finally {
      setBulkDeleting(false);
      setShowBulkDeleteModal(false);
    }
  };

  return (
    <div className={`min-w-0 ${activeTab === "inbox" ? "" : "p-10"}`}>
      {/* Inbox Tab */}
      {activeTab === "inbox" && <ConversationsInbox />}
      
      {/* Properties Tab */}
      {activeTab === "properties" && (
        <>
          {/* Linear/Stripe-style Toolbar */}
          <div className="mb-6">
            {/* Main Toolbar Row */}
            <div className="flex items-center justify-between gap-4 mb-4">
              {/* Left: Title + Toggle */}
              <div className="flex items-center gap-4">
                <h2 className="text-3xl font-bold text-black">Properties</h2>
                <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                  <button
                    onClick={() => setPropertyType("rent")}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer ${
                      propertyType === "rent"
                        ? "bg-black text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Rent
                  </button>
                  <button
                    onClick={() => setPropertyType("sale")}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer ${
                      propertyType === "sale"
                        ? "bg-black text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Sale
                  </button>
                </div>
              </div>
              
              {/* Add Button */}
              <Link href="/dashboard/property/new">
                <button
                  className="flex items-center gap-1.5 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </Link>
            </div>

            {/* Sub-toolbar Row (Search + Filters - Transparent) */}
            <div className="flex items-center justify-between gap-3 mb-6">
              {/* Search Bar (Matching Inbox Style) */}
              <div 
                className="flex-1 glass-matte rounded-full p-2 flex items-center border border-white/40 focus-within:border-white focus-within:ring-4 focus-within:ring-black/5 transition-all shadow-sm hover:shadow-xl group cursor-text"
                onClick={() => document.getElementById('property-search')?.focus()}
              >
                <div className="pl-4 pr-3 text-gray-400 group-focus-within:text-black transition-colors">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  id="property-search"
                  type="text"
                  placeholder="Suburb, address, or tenant..."
                  value={propertySearch}
                  onChange={(e) => setPropertySearch(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-base font-semibold placeholder:text-gray-400 text-black h-full py-1.5"
                />
                <div className="pr-1 hidden sm:block">
                  <div className="h-7 px-2.5 bg-white/50 rounded-xl border border-white/20 flex items-center justify-center text-gray-400 group-focus-within:bg-white group-focus-within:shadow-sm group-focus-within:text-black group-focus-within:border-white transition-all">
                    <span className="text-[10px] font-bold flex items-center gap-1">
                      <span className="opacity-50">⌘</span>
                      K
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons Group (Filter/Sort/Select only) */}
              <div className="flex items-center gap-2 px-1">
                {/* Sort Direction */}
                <button
                  onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
                  className="p-2.5 glass-matte text-gray-700 border border-white/40 rounded-2xl hover:bg-white transition-all font-medium shadow-sm"
                  title={sortDirection === "asc" ? "Ascending" : "Descending"}
                >
                  {sortDirection === "asc" ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                {/* Filter Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setShowFilterMenu(!showFilterMenu)}
                    className="flex items-center gap-1.5 px-3 py-2.5 glass-matte text-gray-700 border border-white/40 rounded-2xl hover:bg-white transition-all text-sm font-semibold shadow-sm"
                  >
                    <Filter className="w-4 h-4" />
                    {getFilterDisplayName()}
                  </button>

                  {showFilterMenu && (
                    <>
                      <div 
                        className="fixed inset-0 z-40"
                        onClick={() => setShowFilterMenu(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 w-[140px] bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50">
                        {["none", "price", "date", "messages", "beds", "duration"].map((option) => (
                          <button 
                            key={option}
                            onClick={() => handleSortSelect(option as any)}
                            className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                              selectedSort === option 
                                ? "bg-gray-100 text-black font-medium" 
                                : "text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            {option.charAt(0).toUpperCase() + option.slice(1)}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Selection Toggle */}
                <button
                  onClick={() => {
                    setSelectionMode(!selectionMode);
                    if (selectionMode) setSelectedProperties(new Set());
                  }}
                  className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg transition-all text-sm font-medium border ${
                    selectionMode 
                      ? "bg-black text-white border-black" 
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <CheckSquare className="w-4 h-4" />
                  {selectionMode ? "Cancel" : "Select"}
                </button>
              </div>
            </div>
            
            {/* Summary Row */}
            <p className="text-sm text-gray-500">
              {sortedProperties.length} {propertyType === "rent" ? "rental" : "sale"} {sortedProperties.length === 1 ? "property" : "properties"}
            </p>

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
                className="glass-panel overflow-hidden shadow-sm border border-white/40 hover:shadow-2xl hover:-translate-y-2 hover:border-white transition-all duration-500 block group w-full relative"
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
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    {property.ai_assisted !== false && (
                      <span className="px-2 py-1 rounded-full text-xs font-bold bg-indigo-500/80 text-white backdrop-blur-sm flex items-center gap-1">
                        <Bot className="w-3 h-3" />
                        AI
                      </span>
                    )}
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-black/50 text-white backdrop-blur-sm">
                      {property.type === 'rent' ? 'For Rent' : 'For Sale'}
                    </span>
                  </div>
                </div>

                {/* Property Info */}
                <div className="p-4 flex flex-col gap-1">
                  {/* Price */}
                  <div className="flex items-start justify-between">
                    <h3 className="text-[28px] font-bold text-gray-900 tracking-tight">
                      {formatCurrency(property.price_monthly)}
                      {property.type === 'rent' && <span className="text-[15px] font-normal text-gray-600 ml-1 tracking-normal">/ per month</span>}
                    </h3>

                    {/* Interested Tenants Badges */}
                    {property.chatCount > 0 && (
                      <div className="flex items-center gap-1 flex-shrink-0 mt-1" onClick={(e) => e.preventDefault()}>
                        <Link 
                          href={`/dashboard/property/${property.id}?openChats=true`}
                          className="flex -space-x-2 hover:opacity-80 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {property.interestedTenants?.slice(0, 3).map((tenant: any, idx: number) => (
                            <Avatar
                              key={idx}
                              src={tenant.avatar}
                              name={tenant.name}
                              size="sm"
                              className="border-2 border-white"
                            />
                          ))}
                          {property.chatCount > 3 && (
                            <div className="w-8 h-8 rounded-full bg-gray-700 border-2 border-white flex items-center justify-center tracking-tight">
                              <span className="text-white text-xs font-bold">+{property.chatCount - 3}</span>
                            </div>
                          )}
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Subtitle */}
                  <div className="text-gray-600 text-[15px] mb-1">
                    Fees may apply
                  </div>

                  {/* Details Row */}
                  <div className="flex items-center gap-2 text-gray-900 text-[17px] mb-1">
                    <span className="font-bold">{property.beds}</span> <span className="font-normal">bd</span>
                    <span className="text-gray-400">|</span>
                    <span className="font-bold">{property.baths}</span> <span className="font-normal">ba</span>
                    {property.sqft && (
                      <>
                        <span className="text-gray-400">|</span>
                        <span className="font-bold">{property.sqft}</span> <span className="font-normal">sqft</span>
                      </>
                    )}
                  </div>

                  {/* Address */}
                  <div className="text-gray-800 text-[17px] truncate font-normal">
                    {property.address}
                    {property.city && `, ${property.city}`}
                    {property.state && ` ${property.state}`}
                  </div>

                  {/* Status */}
                  <div className="text-gray-600 text-[15px]">
                    {property.type === 'rent' ? 'For rent' : 'For sale'}
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
              <button className="px-8 py-4 glass-matte text-black border border-white/40 rounded-2xl font-bold hover:bg-white hover:scale-105 transition-all cursor-pointer shadow-lg shadow-black/5">
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
          {/* Linear/Stripe-style Toolbar */}
          <div className="mb-6">
            {/* Main Header Row */}
            <div className="flex items-center justify-between gap-4 mb-4">
              {/* Left: Title + Filter Tabs */}
              <div className="flex items-center gap-4">
                <h2 className="text-3xl font-bold text-black">Contracts</h2>
                <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                  {[
                    { key: "all", label: "All" },
                    { key: "active", label: "Active" },
                    { key: "pending", label: "Pending" },
                    { key: "draft", label: "Draft" }
                  ].map((filter) => (
                    <button
                      key={filter.key}
                      onClick={() => setContractFilter(filter.key as any)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer ${
                        contractFilter === filter.key
                          ? "bg-black text-white shadow-sm"
                          : "text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* New Contract Button */}
              <button className="flex items-center gap-1.5 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all text-sm font-medium">
                <Plus className="w-4 h-4" />
                New Contract
              </button>
            </div>

            {/* Sub-toolbar Row (Search + Filters - Transparent) */}
            <div className="flex items-center justify-between gap-3 mb-6">
              {/* Search Bar (Matching Inbox Style) */}
              <div 
                className="flex-1 glass-matte rounded-full p-2 flex items-center border border-white/40 focus-within:border-white focus-within:ring-4 focus-within:ring-black/5 transition-all shadow-sm hover:shadow-xl group cursor-text"
                onClick={() => document.getElementById('contract-search')?.focus()}
              >
                <div className="pl-4 pr-3 text-gray-400 group-focus-within:text-black transition-colors">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  id="contract-search"
                  type="text"
                  placeholder="Search contracts..."
                  value={contractSearch}
                  onChange={(e) => setContractSearch(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-base font-semibold placeholder:text-gray-400 text-black h-full py-1.5"
                />
                <div className="pr-1 hidden sm:block">
                  <div className="h-7 px-2.5 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center text-gray-400 group-focus-within:bg-white group-focus-within:shadow-sm group-focus-within:text-blue-500 group-focus-within:border-blue-100 transition-all">
                    <span className="text-[10px] font-bold flex items-center gap-1">
                      <span className="opacity-50">⌘</span>
                      K
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-gray-500">0 contracts</p>
          </div>

          <div className="glass-panel p-10 shadow-sm border border-white/40 text-center">
            <FileText className="w-20 h-20 mx-auto mb-4 text-gray-300" />
            <h3 className="text-2xl font-bold text-black mb-2">Contracts Coming Soon</h3>
            <p className="text-gray-600">
              Create, manage, and e-sign lease agreements with AI-powered contract generation.
            </p>
          </div>
        </>
      )}

      {/* Tenants Tab */}
      {activeTab === "tenants" && (
        <>
          {/* Linear/Stripe-style Toolbar */}
          <div className="mb-6">
            {/* Main Header Row */}
            <div className="flex items-center justify-between gap-4 mb-4">
              {/* Left: Title + Filter Tabs */}
              <div className="flex items-center gap-4">
                <h2 className="text-3xl font-bold text-black">Tenants</h2>
                <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                  {[
                    { key: "all", label: "All" },
                    { key: "current", label: "Current" },
                    { key: "pending", label: "Pending" },
                    { key: "late", label: "Late" },
                    { key: "archived", label: "Archived" }
                  ].map((filter) => (
                    <button
                      key={filter.key}
                      onClick={() => setTenantFilter(filter.key as any)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer ${
                        tenantFilter === filter.key
                          ? "bg-black text-white shadow-sm"
                          : "text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Add + Select Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setTenantSelectionMode(!tenantSelectionMode);
                    setSelectedTenants(new Set());
                  }}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all text-sm font-medium border ${
                    tenantSelectionMode
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <CheckSquare className="w-4 h-4" />
                  {tenantSelectionMode ? 'Cancel' : 'Select'}
                </button>
                <button className="flex items-center gap-1.5 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all text-sm font-medium">
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
            </div>

            {/* Sub-toolbar Row (Search + Filters - Transparent) */}
            <div className="flex items-center justify-between gap-3 mb-6">
              {/* Search Bar (Matching Inbox Style) */}
              <div 
                className="flex-1 glass-matte rounded-full p-2 flex items-center border border-white/40 focus-within:border-white focus-within:ring-4 focus-within:ring-black/5 transition-all shadow-sm hover:shadow-xl group cursor-text"
                onClick={() => document.getElementById('tenant-search')?.focus()}
              >
                <div className="pl-4 pr-3 text-gray-400 group-focus-within:text-black transition-colors">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  id="tenant-search"
                  type="text"
                  placeholder="Name, email, or property..."
                  value={tenantSearch}
                  onChange={(e) => setTenantSearch(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-base font-medium placeholder:text-gray-400 text-black h-full py-1.5"
                />
                <div className="pr-1 hidden sm:block">
                  <div className="h-7 px-2.5 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center text-gray-400 group-focus-within:bg-white group-focus-within:shadow-sm group-focus-within:text-blue-500 group-focus-within:border-blue-100 transition-all">
                    <span className="text-[10px] font-bold flex items-center gap-1">
                      <span className="opacity-50">⌘</span>
                      K
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Summary Row */}
            <p className="text-sm text-gray-500">
              {tenants.filter((t: any) => {
                if (tenantFilter === "all") return true;
                if (tenantFilter === "current") return t.status === "Current";
                if (tenantFilter === "pending") return t.status === "Pending";
                if (tenantFilter === "late") return t.status === "Late";
                if (tenantFilter === "archived") return t.status === "Archived";
                return true;
              }).length} tenants
            </p>
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
                    onClick={() => {
                      if (tenantSelectionMode) {
                        const next = new Set(selectedTenants);
                        next.has(tenant.id) ? next.delete(tenant.id) : next.add(tenant.id);
                        setSelectedTenants(next);
                      }
                    }}
                    className={`glass-panel p-6 shadow-sm border border-white/40 hover:shadow-2xl hover:-translate-y-2 hover:border-white transition-all duration-500 relative ${
                      tenantSelectionMode ? 'cursor-pointer' : ''
                    } ${
                      selectedTenants.has(tenant.id) ? 'ring-2 ring-black ring-offset-2' : ''
                    }`}
                  >
                    {/* Selection checkbox */}
                    {tenantSelectionMode && (
                      <div className="absolute top-3 left-3 z-10">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center shadow-sm transition-all ${
                          selectedTenants.has(tenant.id) ? 'bg-black text-white' : 'bg-white border-2 border-gray-300'
                        }`}>
                          {selectedTenants.has(tenant.id) && <CheckSquare className="w-4 h-4" />}
                        </div>
                      </div>
                    )}
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={tenant.avatar}
                          name={tenant.name}
                          size="lg"
                        />
                        <div>
                          <h3 className="font-bold text-black text-lg">{tenant.name}</h3>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {tenant.lead_priority && (
                          <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 ${
                            tenant.lead_priority === 'hot' ? 'bg-red-50 text-red-600 border border-red-100' :
                            tenant.lead_priority === 'warm' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                            'bg-blue-50 text-blue-600 border border-blue-100'
                          }`}>
                            <TrendingUp className="w-2.5 h-2.5" />
                            {tenant.lead_priority}
                          </div>
                        )}
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

                    {/* Contact Info */}
                    <div className="space-y-2 mb-4 pb-4 border-b border-white/20">
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

                    {/* AI Insight (Lead Mode) or Lease Info */}
                    {tenant.status === "Pending" ? (
                      <div className="space-y-3 mb-4">
                        <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100/50">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <Sparkles className="w-3 h-3 text-indigo-500" />
                            <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">AI Summary</span>
                          </div>
                          <p className="text-[11px] text-indigo-900/70 font-medium line-clamp-3 leading-relaxed">
                            {tenant.ai_summary || "Gathering insights from conversation..."}
                          </p>
                        </div>
                        
                        <div className="flex gap-2">
                           {tenant.budget_max && (
                             <div className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gray-50 border border-gray-100">
                               <DollarSign className="w-3 h-3 text-gray-500" />
                               <span className="text-[10px] font-bold text-gray-700">${tenant.budget_max}</span>
                             </div>
                           )}
                           {tenant.move_in_date && (
                             <div className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gray-50 border border-gray-100">
                               <CalendarIcon className="w-3 h-3 text-gray-500" />
                               <span className="text-[10px] font-bold text-gray-700">{tenant.move_in_date}</span>
                             </div>
                           )}
                        </div>
                      </div>
                    ) : (
                      /* Standard Lease Info */
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
                    )}

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

            {/* Tenant Bulk Delete Floating Bar */}
            {tenantSelectionMode && selectedTenants.size > 0 && (
              <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5">
                <div className="bg-black text-white rounded-2xl shadow-2xl px-6 py-4 flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-blue-400" />
                    <span className="font-semibold text-lg">{selectedTenants.size} selected</span>
                  </div>
                  <div className="h-6 w-px bg-gray-600" />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (selectedTenants.size === tenants.length) {
                          setSelectedTenants(new Set());
                        } else {
                          setSelectedTenants(new Set(tenants.map(t => t.id)));
                        }
                      }}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-all"
                    >
                      {selectedTenants.size === tenants.length ? 'Deselect All' : 'Select All'}
                    </button>
                    <button
                      onClick={() => setShowTenantDeleteModal(true)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}

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

        {/* Tenant Delete Confirmation Modal */}
        {showTenantDeleteModal && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl border border-gray-100">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2 tracking-tight">Delete Tenants?</h3>
              <p className="text-gray-400 text-center mb-8 text-xs font-medium leading-relaxed">
                Are you sure? This will permanently delete {selectedTenants.size} tenant{selectedTenants.size > 1 ? 's' : ''} and all their messages. This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowTenantDeleteModal(false)}
                  className="flex-1 py-4 px-6 rounded-xl font-bold uppercase tracking-wider text-[10px] text-gray-500 bg-gray-50 hover:bg-gray-100 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteTenants}
                  disabled={deletingTenants}
                  className="flex-1 py-4 px-6 bg-red-600 text-white rounded-xl font-bold uppercase tracking-wider text-[10px] hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50"
                >
                  {deletingTenants ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    )}

      {/* Calendar Tab */}
      {activeTab === "calendar" && (
        <>
            {/* Conditional Rendering: Month View vs Day View */}
            {!selectedCalendarDate ? (
              // MONTH VIEW
              <div className="space-y-6 animate-in slide-in-from-left duration-300">
                  {/* Linear/Stripe-style Toolbar */}
                  <div className="mb-2">
                    <div className="flex items-center justify-between gap-4 mb-4">
                      {/* Left: Title + Month Navigation */}
                      <div className="flex items-center gap-4">
                        <h2 className="text-3xl font-bold text-black">Calendar</h2>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={prevMonth}
                            className="p-2 glass-pill text-gray-700 hover:bg-white transition-all shadow-sm"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <span className="text-sm font-medium text-gray-700 min-w-[120px] text-center">
                            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                          </span>
                          <button 
                            onClick={nextMonth}
                            className="p-2 glass-pill text-gray-700 hover:bg-white transition-all shadow-sm"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      {/* Right: Today/Next + Add Button */}
                      <div className="flex items-center gap-2">
                        
                        <button className="flex items-center gap-1.5 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all text-sm font-medium">
                          <Plus className="w-4 h-4" />
                          Add Showing
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-500">
                      {appointments?.length || 0} upcoming showings
                    </p>
                  </div>

                  {/* Calendar View */}
                  <div className="glass-panel shadow-sm border border-white/40 overflow-hidden">
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
                  {/* Linear/Stripe-style Toolbar */}
                  <div className="shrink-0 mb-4">
                    <div className="flex items-center justify-between gap-4 mb-4">
                      {/* Left: Back + Date + Navigation */}
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => setSelectedCalendarDate(null)}
                          className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </button>
                        <h2 className="text-3xl font-bold text-black">
                           {selectedCalendarDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </h2>
                        {selectedCalendarDate.toDateString() === new Date().toDateString() && (
                          <span className="text-xs bg-black text-white px-2 py-1 rounded-full font-medium">Today</span>
                        )}
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => {
                              const newDate = new Date(selectedCalendarDate);
                              newDate.setDate(selectedCalendarDate.getDate() - 1);
                              setSelectedCalendarDate(newDate);
                            }}
                            className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => {
                              const newDate = new Date(selectedCalendarDate);
                              newDate.setDate(selectedCalendarDate.getDate() + 1);
                              setSelectedCalendarDate(newDate);
                            }}
                            className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      {/* Right: Add Button */}
                      <a 
                        href={`https://calendar.google.com/calendar/r/eventedit?text=Prospective+Tenant+Viewing&details=Prospective+tenant+showing+via+LeaseAI&location=123+Main+St,+Seattle,+WA`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all text-sm font-medium"
                      >
                        <Plus className="w-4 h-4" />
                        Add Showing
                      </a>
                    </div>
                    
                    <p className="text-sm text-gray-500">
                      {appointments.filter(apt => {
                        const d = new Date(apt.start_time);
                        const s = selectedCalendarDate;
                        return d.getDate() === s.getDate() && d.getMonth() === s.getMonth() && d.getFullYear() === s.getFullYear();
                      }).length} showings scheduled
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col flex-1 min-h-0">

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

      {/* Promote Tab */}
      {activeTab === "promote" && (
        <>
          <div className="mb-10">
            <h2 className="text-4xl font-bold text-black mb-2">Promote</h2>
            <p className="text-lg text-gray-600">Advertise your properties across platforms</p>
          </div>

          <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-200 text-center">
            <Megaphone className="w-20 h-20 mx-auto mb-4 text-gray-300" />
            <h3 className="text-2xl font-bold text-black mb-2">Promote Coming Soon</h3>
            <p className="text-gray-600">
              Publish listings to Zillow, Realtor.com, and social media with one click.
            </p>
          </div>
        </>
      )}

      {/* Management Tab */}
      {activeTab === "management" && (
        <>
          <div className="mb-10">
            <h2 className="text-4xl font-bold text-black mb-2">Management</h2>
            <p className="text-lg text-gray-600">Property management tools</p>
          </div>

          <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-200 text-center">
            <Briefcase className="w-20 h-20 mx-auto mb-4 text-gray-300" />
            <h3 className="text-2xl font-bold text-black mb-2">Management Coming Soon</h3>
            <p className="text-gray-600">
              Maintenance requests, vendor management, and property operations all in one place.
            </p>
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

      {/* Account Tab */}
      {activeTab === "account" && (
        <>
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-4xl font-bold text-black mb-2">Account</h2>
            <p className="text-lg text-gray-500">Manage your profile, AI assistant and preferences</p>
          </div>

          {/* Layout: sidebar nav + content */}
          <div className="flex gap-8 items-start">

            {/* Left nav */}
            <nav className="w-52 shrink-0 space-y-1">
              {([
                { key: 'profile',       label: 'Profile',       icon: User },
                { key: 'professional',  label: 'Professional',  icon: Building2 },
                { key: 'channels',      label: 'Channels',      icon: Radio },
                { key: 'ai',            label: 'AI Assistant',  icon: Bot },
                { key: 'notifications', label: 'Notifications', icon: Bell },
                { key: 'security',      label: 'Security',      icon: Shield },
              ] as const).map(({ key, label, icon: Icon }) => (
                <button key={key} onClick={() => setAccountTab(key)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left ${
                    accountTab === key
                      ? 'bg-black text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-black'
                  }`}>
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </button>
              ))}
            </nav>

            {/* Right content */}
            <div className="flex-1 min-w-0">

              {/* ── Profile ─── */}
              {accountTab === 'profile' && (
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
                    <label className="relative group cursor-pointer shrink-0">
                  <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        className="sr-only"
                        disabled={uploadingAvatar}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file || file.size > 2 * 1024 * 1024) {
                            setToastMessage(file?.size ? 'File too large (max 2MB)' : 'No file selected');
                            setShowToast(true);
                            setTimeout(() => setShowToast(false), 4000);
                            return;
                          }
                          setUploadingAvatar(true);
                          try {
                            const fd = new FormData();
                            fd.append('file', file);
                            const res = await fetch('/api/profile/avatar', { method: 'POST', body: fd });
                            const data = await res.json();
                            if (!res.ok) throw new Error(data.error || 'Upload failed');
                            const { data: { user: u } } = await supabase.auth.getUser();
                            setUser(u);
                            setToastMessage('Photo updated');
                            setShowToast(true);
                            setTimeout(() => setShowToast(false), 4000);
                          } catch (err: any) {
                            setToastMessage(err.message || 'Upload failed');
                            setShowToast(true);
                          } finally {
                            setUploadingAvatar(false);
                            e.target.value = '';
                          }
                        }}
                      />
                      <div className="relative">
                        <Avatar
                          src={user?.user_metadata?.avatar_url}
                          name={accountForm.full_name || user?.email}
                          email={user?.email}
                          size="lg"
                          className="w-16 h-16 ring-2 ring-gray-100"
                        />
                        <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          {uploadingAvatar ? (
                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <span className="text-xs font-medium text-white text-center px-2">Change photo</span>
                          )}
                </div>
                      </div>
                    </label>
                <div>
                      <p className="text-lg font-bold text-black">{accountForm.full_name || 'Your Name'}</p>
                      <p className="text-sm text-gray-500">{accountForm.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                      <input type="text" value={accountForm.full_name}
                        onChange={(e) => setAccountForm(f => ({ ...f, full_name: e.target.value }))}
                        placeholder="John Doe"
                        className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-sm text-gray-900 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                      <input type="tel" value={accountForm.phone}
                        onChange={(e) => setAccountForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+1 (555) 123-4567"
                        className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-sm text-gray-900 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all" />
                </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                      <input type="email" value={accountForm.email} readOnly
                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-lg text-sm text-gray-400 cursor-not-allowed" />
                      <p className="text-xs text-gray-400 mt-1.5">Managed by your authentication provider</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Company / Agency</label>
                      <input type="text" value={accountForm.company}
                        onChange={(e) => setAccountForm(f => ({ ...f, company: e.target.value }))}
                        placeholder="Acme Realty"
                        className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-sm text-gray-900 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Job Title</label>
                      <div className="relative">
                        <select value={accountForm.job_title}
                          onChange={(e) => setAccountForm(f => ({ ...f, job_title: e.target.value }))}
                          className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-sm text-black appearance-none cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all">
                          <option value="">Select role…</option>
                          <option value="agent">Agent</option>
                          <option value="broker">Broker</option>
                          <option value="property_manager">Property Manager</option>
                          <option value="leasing_manager">Leasing Manager</option>
                          <option value="owner">Owner / Landlord</option>
                          <option value="other">Other</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Website</label>
                      <input type="url" value={accountForm.website}
                        onChange={(e) => setAccountForm(f => ({ ...f, website: e.target.value }))}
                        placeholder="https://yourwebsite.com"
                        className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-sm text-gray-900 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all" />
                      <p className="text-xs text-gray-400 mt-1.5">Your personal or agency website</p>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                    <button
                      onClick={() => saveAccountSection({ full_name: accountForm.full_name, phone: accountForm.phone, company: accountForm.company, job_title: accountForm.job_title, website: accountForm.website }, 'profile')}
                      disabled={savingSection === 'profile'}
                      className="px-6 py-2.5 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-all disabled:opacity-50"
                    >
                      {savingSection === 'profile' ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
              )}

              {/* ── Professional ─── */}
              {accountTab === 'professional' && (
              <div className="space-y-4">
                  {/* License expiration warning */}
                  {(() => {
                    if (!accountForm.license_expiration) return null;
                    const exp = new Date(accountForm.license_expiration);
                    const now = new Date();
                    const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    if (daysLeft <= 0) {
                      return (
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
                          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                            <p className="text-sm font-semibold text-red-700">License Expired</p>
                            <p className="text-xs text-red-600 mt-0.5">Your license expired on {exp.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}. Operating with an expired license may violate state law. Please renew immediately.</p>
                  </div>
                </div>
                      );
                    }
                    if (daysLeft <= 60) {
                      return (
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
                          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                            <p className="text-sm font-semibold text-amber-700">License Expiring Soon</p>
                            <p className="text-xs text-amber-600 mt-0.5">Your license expires in {daysLeft} day{daysLeft === 1 ? '' : 's'} ({exp.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}). Start your renewal process now to avoid interruption.</p>
                  </div>
                </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Licensing */}
                  <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                    <div className="mb-7">
                      <h3 className="text-lg font-bold text-black">Licensing</h3>
                      <p className="text-sm text-gray-500 mt-1">Your real estate license information. Required for Fair Housing compliance and brokerage disclosure.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">License Number</label>
                        <input type="text" value={accountForm.license_number}
                          onChange={(e) => setAccountForm(f => ({ ...f, license_number: e.target.value }))}
                          placeholder="01234567"
                          className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-sm text-gray-900 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all" />
                  </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">License State</label>
                        <div className="relative">
                          <select value={accountForm.license_state}
                            onChange={(e) => setAccountForm(f => ({ ...f, license_state: e.target.value }))}
                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-sm text-black appearance-none cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all">
                            <option value="">Select state…</option>
                            {['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'].map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">License Expiration</label>
                        <input type="date" value={accountForm.license_expiration}
                          onChange={(e) => setAccountForm(f => ({ ...f, license_expiration: e.target.value }))}
                          className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-sm text-gray-900 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all" />
                        <p className="text-xs text-gray-400 mt-1.5">We'll alert you 60 days before expiration</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">NAR Member ID</label>
                        <input type="text" value={accountForm.nar_id}
                          onChange={(e) => setAccountForm(f => ({ ...f, nar_id: e.target.value }))}
                          placeholder="Optional"
                          className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-sm text-gray-900 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all" />
                        <p className="text-xs text-gray-400 mt-1.5">National Association of Realtors</p>
                      </div>
                    </div>
                  </div>

                  {/* Brokerage & MLS */}
                  <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                    <div className="mb-7">
                      <h3 className="text-lg font-bold text-black">Brokerage &amp; MLS</h3>
                      <p className="text-sm text-gray-500 mt-1">Many states require brokerage disclosure in all advertising and client communications.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Brokerage Name</label>
                        <input type="text" value={accountForm.brokerage_name}
                          onChange={(e) => setAccountForm(f => ({ ...f, brokerage_name: e.target.value }))}
                          placeholder="Keller Williams Realty"
                          className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-sm text-gray-900 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">MLS ID</label>
                        <input type="text" value={accountForm.mls_id}
                          onChange={(e) => setAccountForm(f => ({ ...f, mls_id: e.target.value }))}
                          placeholder="MLS-0000001"
                          className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-sm text-gray-900 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all" />
                        <p className="text-xs text-gray-400 mt-1.5">Required when publishing listings via MLS</p>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Service Areas</label>
                        <input type="text" value={accountForm.service_areas}
                          onChange={(e) => setAccountForm(f => ({ ...f, service_areas: e.target.value }))}
                          placeholder="Seattle Metro, Eastside, Bellevue, Kirkland"
                          className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-sm text-gray-900 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all" />
                        <p className="text-xs text-gray-400 mt-1.5">Markets and areas where you operate (comma-separated)</p>
                      </div>
                    </div>
                  </div>

                  {/* Compliance info */}
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700">Why this matters</h4>
                        <ul className="text-xs text-gray-500 mt-2 space-y-1.5">
                          <li>The AI assistant will include your brokerage name in email signatures when required by state law.</li>
                          <li>License information may be disclosed to clients upon request per Fair Housing Act requirements.</li>
                          <li>MLS ID is included when your listings are syndicated or shared through the platform.</li>
                          <li>Your data is stored securely and never shared with third parties.</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => saveAccountSection({ license_number: accountForm.license_number, license_state: accountForm.license_state, license_expiration: accountForm.license_expiration, brokerage_name: accountForm.brokerage_name, mls_id: accountForm.mls_id, nar_id: accountForm.nar_id, service_areas: accountForm.service_areas }, 'professional')}
                      disabled={savingSection === 'professional'}
                      className="px-6 py-2.5 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-all disabled:opacity-50"
                    >
                      {savingSection === 'professional' ? 'Saving…' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              )}

              {/* ── Channels ─── */}
              {accountTab === 'channels' && (
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-6">Connected Channels</h3>

                  {/* Email / Gmail */}
                  <div className="flex items-center justify-between py-5 border-b border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${gmailStatus.connected ? 'bg-green-50' : 'bg-gray-100'}`}>
                        <Mail className={`w-5 h-5 ${gmailStatus.connected ? 'text-green-600' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-black">Email (Gmail)</p>
                        {gmailStatus.loading ? (
                          <p className="text-xs text-gray-400">Checking...</p>
                        ) : gmailStatus.connected ? (
                          <p className="text-xs text-green-600">{gmailStatus.gmail_email || 'Connected'}</p>
                        ) : (
                          <p className="text-xs text-gray-400">Not connected</p>
                        )}
                      </div>
                    </div>
                    <div>
                      {gmailStatus.loading ? (
                        <span className="text-xs text-gray-400">...</span>
                      ) : gmailStatus.connected ? (
                        <button
                          disabled={gmailDisconnecting}
                          onClick={async () => {
                            setGmailDisconnecting(true);
                            try {
                              const res = await fetch('/api/gmail/disconnect', { method: 'DELETE' });
                              if (res.ok) {
                                setGmailStatus({ connected: false, gmail_email: null, loading: false });
                                setToastMessage('Gmail disconnected');
                                setShowToast(true);
                                setTimeout(() => setShowToast(false), 4000);
                              }
                            } catch { /* ignore */ } finally { setGmailDisconnecting(false); }
                          }}
                          className="px-4 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"
                        >
                          {gmailDisconnecting ? 'Disconnecting...' : 'Disconnect'}
                        </button>
                      ) : (
                        <button
                          disabled={gmailConnecting}
                          onClick={async () => {
                            setGmailConnecting(true);
                            try {
                              const res = await fetch('/api/gmail/auth');
                              const data = await res.json();
                              if (data.authUrl) {
                                window.location.href = data.authUrl;
                              }
                            } catch { setGmailConnecting(false); }
                          }}
                          className="px-4 py-1.5 text-xs font-medium bg-black text-white rounded-lg hover:bg-gray-800"
                        >
                          {gmailConnecting ? 'Redirecting...' : 'Connect Gmail'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Coming soon channels */}
                  {[
                    { name: 'WhatsApp Business', desc: 'Two-way messaging via WhatsApp' },
                    { name: 'SMS (Twilio)', desc: 'Send and receive text messages' },
                    { name: 'Web Chat', desc: 'Live chat widget for your website' },
                    { name: 'Facebook Messenger', desc: 'Connect your Facebook page' },
                    { name: 'Instagram DM', desc: 'Direct messages from Instagram' },
                    { name: 'Voice Calls', desc: 'AI-powered phone calls' },
                    { name: 'Telegram', desc: 'Telegram bot integration' },
                  ].map((ch) => (
                    <div key={ch.name} className="flex items-center justify-between py-5 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
                          <MessageSquare className="w-5 h-5 text-gray-300" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-400">{ch.name}</p>
                          <p className="text-xs text-gray-300">{ch.desc}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-medium text-gray-300 uppercase tracking-wider px-2 py-0.5 bg-gray-50 rounded">Coming soon</span>
                    </div>
                  ))}
                </div>
              )}

              {/* ── AI Assistant ─── */}
              {accountTab === 'ai' && (
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3 mb-7">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-black">AI Assistant</h3>
                      <p className="text-sm text-gray-500">How the AI represents you to clients</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Signature Name</label>
                      <input type="text" value={accountForm.ai_signature_name}
                        onChange={(e) => setAccountForm(f => ({ ...f, ai_signature_name: e.target.value }))}
                        placeholder={accountForm.full_name || "Your Name"}
                        className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-sm text-gray-900 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
                      <p className="text-xs text-gray-400 mt-1.5">"Best regards, [Name]"</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Phone for Clients</label>
                      <input type="tel" value={accountForm.ai_phone}
                        onChange={(e) => setAccountForm(f => ({ ...f, ai_phone: e.target.value }))}
                        placeholder="+1 (555) 123-4567"
                        className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-sm text-gray-900 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Viewing Hours — From</label>
                      <input type="time" value={accountForm.viewing_hours_start}
                        onChange={(e) => setAccountForm(f => ({ ...f, viewing_hours_start: e.target.value }))}
                        className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-sm text-gray-900 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Viewing Hours — To</label>
                      <input type="time" value={accountForm.viewing_hours_end}
                        onChange={(e) => setAccountForm(f => ({ ...f, viewing_hours_end: e.target.value }))}
                        className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-sm text-gray-900 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Timezone</label>
                      <div className="relative">
                        <select value={accountForm.timezone}
                          onChange={(e) => setAccountForm(f => ({ ...f, timezone: e.target.value }))}
                          className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-sm text-black appearance-none cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all">
                          <option value="America/Los_Angeles">Pacific Time (PT)</option>
                          <option value="America/Denver">Mountain Time (MT)</option>
                          <option value="America/Chicago">Central Time (CT)</option>
                          <option value="America/New_York">Eastern Time (ET)</option>
                          <option value="America/Anchorage">Alaska (AKT)</option>
                          <option value="Pacific/Honolulu">Hawaii (HT)</option>
                          <option value="Europe/London">London (GMT/BST)</option>
                          <option value="Europe/Moscow">Moscow (MSK)</option>
                          <option value="Asia/Almaty">Almaty (ALMT)</option>
                          <option value="Asia/Dubai">Dubai (GST)</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Default Client Language</label>
                      <div className="relative">
                        <select value={accountForm.default_language}
                          onChange={(e) => setAccountForm(f => ({ ...f, default_language: e.target.value }))}
                          className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-sm text-black appearance-none cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all">
                          <option value="en">English</option>
                          <option value="ru">Russian</option>
                          <option value="es">Spanish</option>
                          <option value="zh">Chinese</option>
                          <option value="ko">Korean</option>
                          <option value="ar">Arabic</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                      <p className="text-xs text-gray-400 mt-1.5">AI auto-detects per conversation</p>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Email Signature</label>
                      <textarea value={accountForm.email_signature}
                        onChange={(e) => setAccountForm(f => ({ ...f, email_signature: e.target.value }))}
                        rows={4}
                        placeholder={[accountForm.full_name || 'Your Name', accountForm.job_title ? accountForm.job_title.charAt(0).toUpperCase() + accountForm.job_title.slice(1).replace('_', ' ') + (accountForm.company ? ` · ${accountForm.company}` : '') : (accountForm.company || ''), accountForm.phone || ''].filter(Boolean).join('\n')}
                        className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-sm text-gray-900 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none font-mono" />
                      <p className="text-xs text-gray-400 mt-1.5">Appended to outgoing emails. Leave empty to use auto-generated.</p>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                    <button
                      onClick={() => saveAccountSection({ ai_signature_name: accountForm.ai_signature_name, ai_phone: accountForm.ai_phone, viewing_hours_start: accountForm.viewing_hours_start, viewing_hours_end: accountForm.viewing_hours_end, timezone: accountForm.timezone, default_language: accountForm.default_language, email_signature: accountForm.email_signature }, 'ai')}
                      disabled={savingSection === 'ai'}
                      className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all disabled:opacity-50"
                    >
                      {savingSection === 'ai' ? 'Saving…' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              )}

              {/* ── Notifications ─── */}
              {accountTab === 'notifications' && (
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                  <div className="mb-7">
                    <h3 className="text-lg font-bold text-black">Notifications</h3>
                    <p className="text-sm text-gray-500 mt-1">Choose how you want to be notified</p>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {([
                      { key: 'notif_email', label: 'Email Notifications', desc: 'New messages, leads and activity updates' },
                      { key: 'notif_sms',   label: 'SMS Notifications',   desc: 'Urgent alerts sent directly to your phone' },
                      { key: 'notif_weekly',label: 'Weekly Reports',      desc: 'Weekly summary of activity and performance' },
                    ] as const).map(({ key, label, desc }) => (
                      <div key={key} className="flex items-center justify-between py-5">
                        <div>
                          <p className="text-sm font-semibold text-black">{label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer ml-6 shrink-0">
                          <input type="checkbox" className="sr-only peer"
                            checked={accountForm[key] as boolean}
                            onChange={(e) => {
                              setAccountForm(f => ({ ...f, [key]: e.target.checked }));
                              supabase.auth.updateUser({ data: { [key]: e.target.checked } });
                            }} />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                  </label>
                </div>
                    ))}
              </div>
            </div>
              )}

              {/* ── Security ─── */}
              {accountTab === 'security' && (
              <div className="space-y-4">
                  <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                    <div className="mb-7">
                      <h3 className="text-lg font-bold text-black">Security</h3>
                      <p className="text-sm text-gray-500 mt-1">Manage your account security settings</p>
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: 'Change Password', desc: 'Update your account password' },
                        { label: 'Two-Factor Authentication', desc: 'Add an extra layer of security' },
                        { label: 'Connected Accounts', desc: 'Manage linked OAuth providers' },
                      ].map(({ label, desc }) => (
                        <button key={label} className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 rounded-xl text-left hover:bg-gray-100 transition-all group">
                          <div>
                            <p className="text-sm font-semibold text-black">{label}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                          </div>
                          <ChevronDown className="w-4 h-4 text-gray-400 -rotate-90 group-hover:text-black transition-colors" />
                </button>
                      ))}
              </div>
            </div>

            {/* Danger Zone */}
                  <div className="bg-white rounded-2xl p-8 shadow-sm border border-red-100">
                    <div className="flex items-center gap-2 mb-6">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <h3 className="text-sm font-bold text-red-500 uppercase tracking-wide">Danger Zone</h3>
                    </div>
                    <div className="flex items-start justify-between p-5 rounded-xl border border-red-100 bg-red-50/40">
                      <div>
                        <p className="text-sm font-semibold text-black">Delete Account</p>
                        <p className="text-xs text-gray-500 mt-1">Permanently delete your account and all associated data. This action cannot be undone.</p>
                      </div>
                      <button className="ml-6 shrink-0 px-4 py-2 text-sm font-semibold text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-all">
                        Delete
                </button>
              </div>
                  </div>
                </div>
              )}

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
