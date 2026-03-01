'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  Plus,
  Trash2,
  Image as ImageIcon,
  Zap,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Bot
} from 'lucide-react';
import Link from 'next/link';

import { Suspense } from "react";

// Helper to format currency
const formatCurrency = (amount: string | number | null | undefined) => {
  if (!amount) return "Price not set";
  const numericAmount = typeof amount === 'string' 
    ? parseInt(amount.replace(/[^0-9]/g, ''), 10) 
    : amount;
  
  if (isNaN(numericAmount)) return "Price not set";

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(numericAmount);
};

export default function NewPropertyPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    address: '',
    city: '',
    state: '',
    zip_code: '',
    type: 'rent' as 'rent' | 'sale',
    price: '',
    beds: 1,
    baths: 1,
    sqft: '',
    pets: 'Not allowed',
    parking: 'No parking',
    parking_available: false,
    description: '',
    status: 'available' as 'available' | 'rented' | 'pending',
    walk_score: '',
    transit_score: '',
    lease_term: '12 months',
    ai_assisted: true,
  });

  // Advanced fields state
  const [amenities, setAmenities] = useState<string[]>([]);
  const [features, setFeatures] = useState<string[]>([]);
  const [rules, setRules] = useState<string[]>([]);
  const [newAmenity, setNewAmenity] = useState('');
  const [newFeature, setNewFeature] = useState('');
  const [newRule, setNewRule] = useState('');

  // Image state
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  
  // Preview state
  const [showPreview, setShowPreview] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [importSuccess, setImportSuccess] = useState(false);
  const [currentPreviewImageIndex, setCurrentPreviewImageIndex] = useState(0);

  const handlePreview = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate required fields
    const requiredFields = ['address', 'city', 'state', 'zip_code', 'price', 'sqft'] as const;
    const errors: string[] = [];
    
    requiredFields.forEach(field => {
      if (!formData[field]) {
        errors.push(field);
      }
    });

    if (errors.length > 0) {
      setFormErrors(errors);
      setError('Please fill in all required fields marked with *');
      
      // Scroll to the first error after state updates
      setTimeout(() => {
        const firstErrorField = document.getElementById(errors[0]);
        if (firstErrorField) {
          firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
          firstErrorField.focus();
        }
      }, 100);
      return;
    }
    
    setFormErrors([]);
    // Show preview modal
    setCurrentPreviewImageIndex(0);
    setShowPreview(true);
  };

  const nextPreviewImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (imagePreviews.length === 0) return;
    setCurrentPreviewImageIndex((prev) => (prev + 1) % imagePreviews.length);
  };

  const prevPreviewImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (imagePreviews.length === 0) return;
    setCurrentPreviewImageIndex((prev) => (prev - 1 + imagePreviews.length) % imagePreviews.length);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showPreview) return;
      if (e.key === 'ArrowRight') nextPreviewImage();
      if (e.key === 'ArrowLeft') prevPreviewImage();
      if (e.key === 'Escape') setShowPreview(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPreview, imagePreviews.length]);

  const handleSubmit = async () => {
    setError('');
    setSaving(true);

    try {

      // Format price (add /month for rent)
      const formattedPrice = formData.type === 'rent' 
        ? `${formData.price}/month` 
        : formData.price;

      // Determine parking_available from parking selection
      const parkingAvailable = formData.parking !== 'No parking';

      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          price: formattedPrice,
          parking_available: parkingAvailable,
          walk_score: formData.walk_score ? parseInt(formData.walk_score) : null,
          transit_score: formData.transit_score ? parseInt(formData.transit_score) : null,
          amenities: amenities.length > 0 ? amenities : null,
          features: features.length > 0 ? features : null,
          rules: rules.length > 0 ? rules : null,
          images: imagePreviews, // For now, save base64. Later: upload to Supabase Storage
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create property');
      }

      console.log('✅ Property created:', data);

      // Redirect to properties list with success message
      router.push('/dashboard?tab=properties&success=property_created');
    } catch (err) {
      console.error('Error creating property:', err);
      setError(err instanceof Error ? err.message : 'Failed to create property');
      setSaving(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'beds' || name === 'baths' ? Number(value) : value,
    }));
    
    // Clear error for this field when user types
    if (formErrors.includes(name)) {
      setFormErrors(prev => prev.filter(f => f !== name));
    }
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Add new files
    setImageFiles((prev) => [...prev, ...files]);

    // Create previews
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove image
  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith('image/')
    );

    if (files.length === 0) return;

    // Add new files
    setImageFiles((prev) => [...prev, ...files]);

    // Create previews
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header & Magic Import Command Bar */}
        <div className="mb-12">
          <Link
            href="/dashboard?tab=properties"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-black transition-colors mb-6 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Properties
          </Link>
          
          <div className="space-y-8">
            <div>
              <h1 className="text-5xl font-extrabold text-black tracking-tight mb-3">Add New Property</h1>
              <p className="text-xl text-gray-500">List your rental or sale property with ease</p>
            </div>

            {/* AI Command Bar - Clean Minimalist Design */}
            <div className={`relative bg-white border-2 rounded-2xl shadow-sm overflow-hidden flex items-center p-2 gap-2 transition-all duration-500 ${
              importSuccess ? 'border-green-500 bg-green-50/10 shadow-green-100 ring-4 ring-green-100' : 'border-gray-100 focus-within:border-black'
            }`}>
              <div className="pl-4">
                <Zap className={`w-6 h-6 ${saving ? 'text-indigo-500 animate-pulse' : importSuccess ? 'text-green-500' : 'text-gray-400'}`} />
              </div>
              <input
                type="text"
                placeholder="Paste Zillow or Redfin URL to auto-fill property details..."
                className="flex-1 px-4 py-4 bg-transparent border-0 text-lg text-black placeholder:text-gray-400 outline-none"
                id="magic-url"
                disabled={saving}
              />
              <button
                type="button"
                onClick={async () => {
                  const urlInput = document.getElementById('magic-url') as HTMLInputElement;
                  const url = urlInput.value;
                  if (!url) return;
                  
                  setSaving(true);
                  setError('');
                  try {
                    const res = await fetch('/api/properties/import', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ url })
                    });
                    
                    const result = await res.json();
                    
                    if (!res.ok) {
                      throw new Error(result.error || 'Failed to import property details');
                    }

                    const data = result.data;
                    if (data) {
                      setFormData(prev => ({
                        ...prev,
                        address: data.address || prev.address,
                        city: data.city || prev.city,
                        state: data.state || prev.state,
                        zip_code: data.zip_code || prev.zip_code,
                        price: data.price ? data.price.toString().replace(/[^0-9\.]/g, '') : prev.price,
                        beds: data.beds || prev.beds,
                        baths: data.baths || prev.baths,
                        sqft: data.sqft ? data.sqft.toString().replace(/[^0-9]/g, '') : prev.sqft,
                        description: data.description || prev.description,
                        type: data.type === 'sale' ? 'sale' : 'rent',
                        pets: data.pets || prev.pets,
                        parking: data.parking || prev.parking,
                      }));
                      if (data.amenities) setAmenities(data.amenities);
                      if (data.features) setFeatures(data.features);
                      if (data.rules) setRules(data.rules);
                      if (data.imagePreviews) setImagePreviews(data.imagePreviews);
                      urlInput.value = ''; // Clear input on success
                      
                      // Show success feedback
                      setImportSuccess(true);
                      setTimeout(() => setImportSuccess(false), 3000);
                    }
                  } catch (err: any) {
                    console.error('Import error:', err);
                    setError(err.message || 'Failed to import property details.');
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
                className={`px-8 py-4 rounded-xl text-base font-bold transition-all flex items-center gap-2 disabled:opacity-50 min-w-[140px] justify-center shadow-lg ${
                  importSuccess ? 'bg-green-600 text-white' : 'bg-black text-white hover:bg-gray-800'
                }`}
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Filling...</span>
                  </>
                ) : importSuccess ? (
                  <>
                    <Sparkles className="w-5 h-5 animate-bounce" />
                    <span>DONE!</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Auto-fill</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handlePreview} className="space-y-6" noValidate>
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Property Type */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-black">Property Type</h2>
              
              {/* AI Assistant Toggle */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Bot className={`w-4 h-4 ${formData.ai_assisted ? 'text-indigo-500' : 'text-gray-400'}`} />
                  <span className="text-sm font-semibold text-gray-700">AI Assistant</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, ai_assisted: !prev.ai_assisted }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all focus:outline-none shadow-sm ${
                    formData.ai_assisted ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all shadow-md ${
                      formData.ai_assisted ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
            <div className="flex items-center bg-gray-100 rounded-lg p-1 w-fit">
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, type: 'rent' }))}
                className={`px-6 py-2.5 rounded-md text-sm font-semibold transition-all ${
                  formData.type === 'rent'
                    ? 'bg-black text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                Rent
              </button>
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, type: 'sale' }))}
                className={`px-6 py-2.5 rounded-md text-sm font-semibold transition-all ${
                  formData.type === 'sale'
                    ? 'bg-black text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                Sale
              </button>
            </div>
            {!formData.ai_assisted && (
              <p className="mt-3 text-xs text-amber-600 font-medium">
                ⚠️ AI will not auto-respond to inquiries about this property
              </p>
            )}
          </div>

          {/* Basic Information */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold text-black mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-base font-bold text-gray-900 mb-2">
                  Street Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="address"
                  id="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="123 Main St"
                  className={`w-full px-4 py-3.5 border rounded-lg text-lg text-black placeholder:text-gray-400 focus:outline-none focus:ring-4 transition-all duration-200 ${
                    formErrors.includes('address') 
                      ? 'border-red-300 bg-red-50/50 focus:ring-red-100 focus:border-red-400' 
                      : 'border-gray-300 bg-gray-50 focus:ring-black/5 focus:border-black'
                  }`}
                />
              </div>

              {/* City, State, ZIP */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-black mb-2 flex items-center gap-1">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    id="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Seattle"
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-4 outline-none transition-all duration-200 text-black ${
                      formErrors.includes('city')
                        ? 'border-red-300 bg-red-50/50 focus:ring-red-100 focus:border-red-400'
                        : 'border-gray-200 bg-gray-50 focus:ring-black/5 highlight-none focus:border-black'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-black mb-2 flex items-center gap-1">
                    State <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="state"
                    id="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="WA"
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-4 outline-none transition-all duration-200 text-black ${
                      formErrors.includes('state')
                        ? 'border-red-300 bg-red-50/50 focus:ring-red-100 focus:border-red-400'
                        : 'border-gray-200 bg-gray-50 focus:ring-black/5 focus:border-black'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-black mb-2 flex items-center gap-1">
                    ZIP Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="zip_code"
                    id="zip_code"
                    value={formData.zip_code}
                    onChange={handleChange}
                    placeholder="98101"
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-4 outline-none transition-all duration-200 text-black ${
                      formErrors.includes('zip_code')
                        ? 'border-red-300 bg-red-50/50 focus:ring-red-100 focus:border-red-400'
                        : 'border-gray-200 bg-gray-50 focus:ring-black/5 focus:border-black'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-base font-bold text-gray-900 mb-2">
                    Price <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="price"
                    id="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder={formData.type === 'rent' ? '$2,500' : '$450,000'}
                    className={`w-full px-4 py-3.5 border rounded-lg text-lg text-black placeholder:text-gray-400 focus:outline-none focus:ring-4 transition-all duration-200 ${
                      formErrors.includes('price')
                        ? 'border-red-300 bg-red-50/50 focus:ring-red-100 focus:border-red-400'
                        : 'border-gray-300 bg-gray-50 focus:ring-black/5 focus:border-black'
                    }`}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.type === 'rent' ? 'Monthly rent' : 'Sale price'}
                  </p>
                </div>

                <div>
                  <label className="block text-base font-bold text-gray-900 mb-2">
                    Type
                  </label>
                  <div className="px-4 py-3.5 bg-gray-100 rounded-lg text-lg text-gray-700 font-semibold">
                    {formData.type === 'rent' ? 'For Rent' : 'For Sale'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Property Details */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold text-black mb-4">Property Details</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-base font-bold text-gray-900 mb-2">
                  Bedrooms
                </label>
                <div className="relative">
                  <select
                    name="beds"
                    value={formData.beds}
                    onChange={handleChange}
                    className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-lg text-lg text-black appearance-none cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                  >
                    {[0, 1, 2, 3, 4, 5].map((num) => (
                      <option key={num} value={num}>
                        {num === 0 ? 'Studio' : `${num} Bedroom${num > 1 ? 's' : ''}`}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-base font-bold text-gray-900 mb-2">
                  Bathrooms
                </label>
                <div className="relative">
                  <select
                    name="baths"
                    value={formData.baths}
                    onChange={handleChange}
                    className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-lg text-lg text-black appearance-none cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                  >
                    {[1, 1.5, 2, 2.5, 3, 3.5, 4].map((num) => (
                      <option key={num} value={num}>
                        {num} Bath{num > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-base font-bold text-gray-900 mb-2">
                  Sq.Ft <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="sqft"
                  id="sqft"
                  value={formData.sqft}
                  onChange={handleChange}
                  placeholder="850"
                  className={`w-full px-4 py-3.5 border-2 rounded-lg text-lg text-black placeholder:text-gray-400 hover:border-gray-400 focus:outline-none focus:ring-4 transition-all duration-200 ${
                    formErrors.includes('sqft')
                      ? 'border-red-300 bg-red-50/50 focus:ring-red-100 focus:border-red-400' 
                      : 'border-gray-200 bg-white focus:ring-black/5 focus:border-black'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-base font-bold text-gray-900 mb-2">
                  Pets Policy
                </label>
                <div className="relative">
                  <select
                    name="pets"
                    value={formData.pets}
                    onChange={handleChange}
                    className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-lg text-lg text-black appearance-none cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                  >
                    <option value="Allowed">Pets Allowed</option>
                    <option value="Not allowed">No Pets</option>
                    <option value="Cats only">Cats Only</option>
                    <option value="Dogs only">Dogs Only</option>
                    <option value="Small pets only">Small Pets Only</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-base font-bold text-gray-900 mb-2">
                  Parking
                </label>
                <div className="relative">
                  <select
                    name="parking"
                    value={formData.parking}
                    onChange={handleChange}
                    className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-lg text-lg text-black appearance-none cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                  >
                    <option value="No parking">No Parking</option>
                    <option value="Street parking">Street Parking</option>
                    <option value="1 space">1 Space</option>
                    <option value="2 spaces">2 Spaces</option>
                    <option value="Garage">Garage</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold text-black mb-4">Description</h2>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={6}
              placeholder="Spacious 2BR apartment in downtown Seattle. Features hardwood floors, modern kitchen with stainless steel appliances, in-unit washer/dryer..."
              className="w-full px-4 py-3.5 bg-gray-50 border border-gray-300 rounded-lg text-lg text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none"
            />
          </div>

          {/* Additional Features */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold text-black mb-4">Features</h2>
            <p className="text-sm text-gray-600 mb-4">Add key features of your property (e.g., Hardwood Floors, Modern Kitchen)</p>
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (newFeature.trim()) {
                      setFeatures([...features, newFeature.trim()]);
                      setNewFeature('');
                    }
                  }
                }}
                placeholder="e.g., Hardwood Floors"
                className="flex-1 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => {
                  if (newFeature.trim()) {
                    setFeatures([...features, newFeature.trim()]);
                    setNewFeature('');
                  }
                }}
                className="px-4 py-2 bg-black text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition-all"
              >
                Add
              </button>
            </div>

            {features.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-sm border border-blue-200">
                    <span>{feature}</span>
                    <button
                      type="button"
                      onClick={() => setFeatures(features.filter((_, i) => i !== idx))}
                      className="text-blue-700 hover:text-blue-900"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Amenities */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold text-black mb-4">Amenities</h2>
            <p className="text-sm text-gray-600 mb-4">Add amenities available with the property</p>
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newAmenity}
                onChange={(e) => setNewAmenity(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (newAmenity.trim()) {
                      setAmenities([...amenities, newAmenity.trim()]);
                      setNewAmenity('');
                    }
                  }
                }}
                placeholder="e.g., In-unit laundry"
                className="flex-1 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => {
                  if (newAmenity.trim()) {
                    setAmenities([...amenities, newAmenity.trim()]);
                    setNewAmenity('');
                  }
                }}
                className="px-4 py-2 bg-black text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition-all"
              >
                Add
              </button>
            </div>

            {amenities.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {amenities.map((amenity, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-lg text-sm border border-green-200">
                    <span>{amenity}</span>
                    <button
                      type="button"
                      onClick={() => setAmenities(amenities.filter((_, i) => i !== idx))}
                      className="text-green-700 hover:text-green-900"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Property Rules */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold text-black mb-4">Property Rules</h2>
            <p className="text-sm text-gray-600 mb-4">Add important rules for tenants (e.g., No smoking, Quiet hours)</p>
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (newRule.trim()) {
                      setRules([...rules, newRule.trim()]);
                      setNewRule('');
                    }
                  }
                }}
                placeholder="e.g., No smoking inside"
                className="flex-1 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => {
                  if (newRule.trim()) {
                    setRules([...rules, newRule.trim()]);
                    setNewRule('');
                  }
                }}
                className="px-4 py-2 bg-black text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition-all"
              >
                Add
              </button>
            </div>

            {rules.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {rules.map((rule, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-amber-50 text-amber-700 px-3 py-1 rounded-lg text-sm border border-amber-200">
                    <span>{rule}</span>
                    <button
                      type="button"
                      onClick={() => setRules(rules.filter((_, i) => i !== idx))}
                      className="text-amber-700 hover:text-amber-900"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Location & Scores (Optional) */}
          {formData.type === 'rent' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-2xl font-bold text-black mb-4">Location Details (Optional)</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-base font-bold text-gray-900 mb-2">
                    Walk Score (0-100)
                  </label>
                  <input
                    type="number"
                    name="walk_score"
                    value={formData.walk_score}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    placeholder="95"
                    className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-lg text-lg text-black placeholder:text-gray-400 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-1">Walkability rating</p>
                </div>

                <div>
                  <label className="block text-base font-bold text-gray-900 mb-2">
                    Transit Score (0-100)
                  </label>
                  <input
                    type="number"
                    name="transit_score"
                    value={formData.transit_score}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    placeholder="85"
                    className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-lg text-lg text-black placeholder:text-gray-400 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-1">Public transit access</p>
                </div>

                <div>
                  <label className="block text-base font-bold text-gray-900 mb-2">
                    Lease Term
                  </label>
                  <div className="relative">
                    <select
                      name="lease_term"
                      value={formData.lease_term}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-lg text-lg text-black appearance-none cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                    >
                      <option value="12 months">12 months</option>
                      <option value="6 months">6 months</option>
                      <option value="Month-to-month">Month-to-month</option>
                      <option value="Flexible">Flexible</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Photos */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold text-black mb-4">Photos</h2>
            
            {/* Upload Button */}
            <div className="mb-4">
              <label className="cursor-pointer">
                <div
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                    isDragging
                      ? 'border-black bg-black/5 scale-105'
                      : 'border-gray-300 hover:border-black'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">
                      {isDragging ? 'Drop images here' : 'Click to upload or drag and drop'}
                    </span>
                    <span className="text-xs text-gray-500">
                      PNG, JPG, WEBP up to 10MB
                    </span>
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4">
            <Link
              href="/dashboard?tab=properties"
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="px-8 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-all"
            >
              Preview →
            </button>
          </div>
        </form>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-black">Preview</h2>
                <p className="text-gray-600">How your property will look in the system</p>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-black transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Property Card Preview */}
            <div className="p-8">
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-2xl transition-all duration-300">
                {/* Property Image Carousel */}
                <div className="relative h-80 bg-gray-200 overflow-hidden group/carousel">
                  {imagePreviews.length > 0 ? (
                    <>
                      <img
                        src={imagePreviews[currentPreviewImageIndex]}
                        alt={`${formData.address} - Photo ${currentPreviewImageIndex + 1}`}
                        className="w-full h-full object-cover transition-all duration-500"
                      />
                      
                      {/* Navigation Arrows */}
                      {imagePreviews.length > 1 && (
                        <>
                          <button
                            onClick={prevPreviewImage}
                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-black p-2 rounded-full shadow-lg transition-all opacity-0 group-hover/carousel:opacity-100 z-10"
                            title="Previous image"
                          >
                            <ChevronLeft className="w-6 h-6" />
                          </button>
                          <button
                            onClick={nextPreviewImage}
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-black p-2 rounded-full shadow-lg transition-all opacity-0 group-hover/carousel:opacity-100 z-10"
                            title="Next image"
                          >
                            <ChevronRight className="w-6 h-6" />
                          </button>
                          
                          {/* Image Counter */}
                          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold tracking-wider z-10">
                            {currentPreviewImageIndex + 1} / {imagePreviews.length}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                      <svg className="w-24 h-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute top-4 right-4 z-10">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg ${
                      formData.status === 'available'
                        ? 'bg-green-500 text-white'
                        : formData.status === 'rented'
                        ? 'bg-red-500 text-white'
                        : 'bg-yellow-500 text-black'
                    }`}>
                      {formData.status}
                    </span>
                  </div>
                </div>

                {/* Property Info */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3 gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-2xl font-bold text-black mb-1">
                        {formatCurrency(formData.price)}
                        {formData.type === 'rent' && formData.price && <span className="text-sm font-normal text-gray-500 ml-1">/ per month</span>}
                      </h3>
                      <div className="flex items-start gap-1 text-gray-600 text-sm">
                        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>
                          {formData.address || 'Address not set'}
                          {formData.city && `, ${formData.city}`}
                          {formData.state && `, ${formData.state}`}
                          {formData.zip_code && ` ${formData.zip_code}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Property Details */}
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-gray-700">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      <span className="text-sm font-medium">{formData.beds} BD</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm font-medium">{formData.baths} BA</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                      </svg>
                      <span className="text-sm font-medium">{formData.sqft} sq.ft</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700 min-w-0">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                      </svg>
                      <span className="text-sm font-medium truncate" title={formData.pets}>
                        {formData.pets}
                      </span>
                    </div>
                  </div>

                  {/* Description Preview */}
                  {formData.description && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {formData.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-8 py-6 flex items-center justify-between">
              <button
                onClick={() => setShowPreview(false)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
              >
                ← Edit
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-8 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Property →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
