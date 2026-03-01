'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { DatePicker } from '@/components/ui/date-picker';
import { MoneyInput } from '@/components/ui/money-input';
// Force HMR refresh

export default function EditPropertyPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id as string;
  
  const [loading, setLoading] = useState(true);
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
    // New Zillow fields
    available_from: '',
    pet_policy: 'allowed',
    application_fee: '',
    security_deposit: '',
    parking_fee: '',
    utilities_fee: '',
    utilities_included: [] as string[],
    parking_type: 'none',
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
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  // Load existing property data
  useEffect(() => {
    const fetchProperty = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/properties/${propertyId}`);
        const data = await response.json();
        
        if (response.ok && data.property) {
          const property = data.property;
          
          // Use price_monthly instead of legacy price
          const priceValue = property.price_monthly?.toString() || '';
          const propertyType = property.type || 'rent';
          
          setFormData({
            address: property.address || '',
            city: property.city || '',
            state: property.state || '',
            zip_code: property.zip_code || '',
            type: propertyType,
            price: priceValue,
            beds: property.beds || 1,
            baths: property.baths || 1,
            sqft: property.sqft?.toString() || '',
            pets: property.pets || 'Not allowed',
            parking: property.parking || 'No parking',
            parking_available: property.parking_available || false,
            description: property.description || '',
            status: property.status || 'available',
            walk_score: property.walk_score?.toString() || '',
            transit_score: property.transit_score?.toString() || '',
            lease_term: property.lease_term || '12 months',
            // Load Zillow fields
            available_from: property.available_from || '',
            pet_policy: property.pet_policy || 'allowed',
            parking_type: property.parking_type || 'none',
            parking_fee: property.parking_fee?.toString() || '',
            application_fee: property.application_fee?.toString() || '',
            security_deposit: property.security_deposit?.toString() || '',
            utilities_fee: property.utilities_fee?.toString() || '',
            utilities_included: property.utilities_included || [],
          });
          
          // Set existing arrays
          if (property.amenities && Array.isArray(property.amenities)) {
            setAmenities(property.amenities);
          }
          if (property.features && Array.isArray(property.features)) {
            setFeatures(property.features);
          }
          if (property.rules && Array.isArray(property.rules)) {
            setRules(property.rules);
          }
          
          // Set existing images
          if (property.images && Array.isArray(property.images)) {
            setImagePreviews(property.images);
          }
        } else {
          setError('Property not found');
        }
      } catch (err) {
        console.error('Error fetching property:', err);
        setError('Failed to load property');
      } finally {
        setLoading(false);
      }
    };

    if (propertyId) {
      fetchProperty();
    }
  }, [propertyId]);

  const handlePreview = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate required fields
    if (!formData.address || !formData.price || !formData.sqft) {
      setError('Please fill in all required fields');
      return;
    }
    
    // Show preview modal
    setShowPreview(true);
  };

  const handleSubmit = async () => {
    setError('');
    setSaving(true);

    try {
      // price_monthly is handled by the API from the 'price' field

      // Determine parking_available from parking selection (Zillow field)
      const parkingAvailable = formData.parking_type !== 'none';

      const response = await fetch(`/api/properties/${propertyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          parking_available: parkingAvailable,
          walk_score: formData.walk_score ? parseInt(formData.walk_score) : null,
          transit_score: formData.transit_score ? parseInt(formData.transit_score) : null,
          amenities: amenities.length > 0 ? amenities : null,
          features: features.length > 0 ? features : null,
          rules: rules.length > 0 ? rules : null,
          images: imagePreviews,
          // Send Zillow fields
          available_from: formData.available_from || null,
          pet_policy: formData.pet_policy,
          parking_type: formData.parking_type,
          parking_fee: formData.parking_fee ? parseFloat(formData.parking_fee) : null,
          application_fee: formData.application_fee ? parseFloat(formData.application_fee) : null,
          security_deposit: formData.security_deposit ? parseFloat(formData.security_deposit) : null,
          utilities_fee: formData.utilities_fee ? parseFloat(formData.utilities_fee) : null,
          utilities_included: formData.utilities_included,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update property');
      }

      console.log('✅ Property updated:', data);

      // Redirect back to property page with success message
      router.push(`/dashboard/property/${propertyId}?updated=success`);
    } catch (err) {
      console.error('Error updating property:', err);
      setError(err instanceof Error ? err.message : 'Failed to update property');
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading property...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-black mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/dashboard?tab=properties"
            className="inline-block px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-all"
          >
            Back to Properties
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/dashboard/property/${propertyId}`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-black transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Property
          </Link>
          <h1 className="text-4xl font-bold text-black mb-2">Edit Property</h1>
          <p className="text-lg text-gray-600">
            Update your property information
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handlePreview} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Property Type */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-black mb-4">Property Type</h2>
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
          </div>

          {/* Basic Information */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-black mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Street Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="123 Main St"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-base text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  required
                />
              </div>

              {/* City, State, ZIP */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Seattle"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-base text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    State <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="state"
                    required
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="WA"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-base text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    ZIP Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="zip_code"
                    required
                    value={formData.zip_code}
                    onChange={handleChange}
                    placeholder="98101"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-base text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Price (USD) <span className="text-red-500">*</span>
                  </label>
                  <MoneyInput
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder={formData.type === 'rent' ? '2500' : '450000'}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.type === 'rent' ? 'Monthly rent' : 'Sale price'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Type
                  </label>
                  <div className="px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-lg text-base text-gray-600 font-medium">
                    {formData.type === 'rent' ? 'For Rent' : 'For Sale'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Photos */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-black mb-4">Photos</h2>
            
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
                      onClick={() => setViewingImage(preview)}
                      className="w-full h-32 object-cover rounded-lg border border-gray-200 cursor-zoom-in hover:opacity-90 transition-opacity"
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

          {/* Property Details */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-black mb-4">Property Details</h2>
            
            {/* Layout: Beds, Baths, Sqft */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Bedrooms
                </label>
                <div className="relative">
                  <select
                    name="beds"
                    value={formData.beds}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-base text-black appearance-none cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Bathrooms
                </label>
                <div className="relative">
                  <select
                    name="baths"
                    value={formData.baths}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-base text-black appearance-none cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Sq.Ft <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="sqft"
                  value={formData.sqft}
                  onChange={handleChange}
                  placeholder="850"
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-base text-black placeholder:text-gray-400 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-black mb-4">Description</h2>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={6}
              placeholder="Spacious 2BR apartment in downtown Seattle. Features hardwood floors, modern kitchen with stainless steel appliances, in-unit washer/dryer..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-base text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none"
            />
          </div>

          {/* Financials & Policies */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-black mb-4">Financials & Policies</h2>

            {/* Financial Details */}
            <div className="mb-6">
              <h3 className="text-md font-bold text-gray-900 mb-4">Financials & Terms</h3>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Security Deposit (USD)
                  </label>
                  <MoneyInput
                    name="security_deposit"
                    value={formData.security_deposit}
                    onChange={handleChange}
                    placeholder="2500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Application Fee (USD)
                  </label>
                  <MoneyInput
                    name="application_fee"
                    value={formData.application_fee}
                    onChange={handleChange}
                    placeholder="50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Available From
                  </label>
                  <DatePicker
                    value={formData.available_from}
                    onChange={(date) => setFormData(prev => ({ ...prev, available_from: date }))}
                    placeholder="Select move-in date"
                  />
                </div>
              </div>
            </div>

            {/* Policies: Pets & Parking */}
            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-md font-bold text-gray-900 mb-4">Policies</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Pet Policy
                  </label>
                  <div className="relative">
                    <select
                      name="pet_policy"
                      value={formData.pet_policy}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-base text-black appearance-none cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                    >
                      <option value="allowed">Pets Allowed</option>
                      <option value="cats_only">Cats Only</option>
                      <option value="small_dogs">Small Dogs Only</option>
                      <option value="no_pets">No Pets</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Parking Type
                  </label>
                  <div className="relative">
                    <select
                      name="parking_type"
                      value={formData.parking_type}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-base text-black appearance-none cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                    >
                      <option value="none">No Parking</option>
                      <option value="street">Street Parking</option>
                      <option value="garage">Garage</option>
                      <option value="carport">Carport</option>
                      <option value="assigned">Assigned Spot</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {formData.parking_type !== 'none' && formData.parking_type !== 'street' && (
                   <div className="col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Parking Fee (USD/mo)
                      </label>
                      <MoneyInput
                        name="parking_fee"
                        value={formData.parking_fee}
                        onChange={handleChange}
                        placeholder="0 if included"
                        className="w-full md:w-1/2"
                      />
                   </div>
                )}
              </div>
            </div>
          </div>



          {/* Additional Features */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-black mb-4">Features</h2>
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
            <h2 className="text-xl font-bold text-black mb-4">Amenities</h2>
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
            <h2 className="text-xl font-bold text-black mb-4">Property Rules</h2>
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
              <h2 className="text-xl font-bold text-black mb-4">Location Details (Optional)</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-base text-black placeholder:text-gray-400 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-1">Walkability rating</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-base text-black placeholder:text-gray-400 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-1">Public transit access</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Lease Term
                  </label>
                  <div className="relative">
                    <select
                      name="lease_term"
                      value={formData.lease_term}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-base text-black appearance-none cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
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



          {/* Actions */}
          <div className="flex items-center justify-between pt-4">
            <Link
              href={`/dashboard/property/${propertyId}`}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="px-8 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-all"
            >
              Preview Changes →
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
                <h2 className="text-2xl font-bold text-black">Preview Changes</h2>
                <p className="text-gray-600">Review your updated property information</p>
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
                {/* Property Image */}
                <div className="relative h-64 bg-gray-200 overflow-hidden">
                  {imagePreviews.length > 0 ? (
                    <img
                      src={imagePreviews[0]}
                      alt={formData.address}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                      <svg className="w-24 h-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      formData.status === 'available'
                        ? 'bg-green-500 text-white'
                        : formData.status === 'rented'
                        ? 'bg-red-500 text-white'
                        : 'bg-yellow-500 text-black'
                    }`}>
                      {formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}
                    </span>
                  </div>
                  {imagePreviews.length > 1 && (
                    <div className="absolute bottom-3 right-3 bg-black/70 text-white px-2 py-1 rounded-full text-xs font-medium">
                      +{imagePreviews.length - 1} more
                    </div>
                  )}
                </div>

                {/* Property Info */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3 gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-2xl font-bold text-black mb-1">
                        {formData.price ? (formData.type === 'rent' ? `${formData.price}/month` : formData.price) : 'Price not set'}
                      </h3>
                      <div className="flex items-start gap-1 text-gray-600 text-sm">
                        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{formData.address || 'Address not set'}</span>
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
                    <div className="flex items-center gap-2 text-gray-700">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                      </svg>
                      <span className="text-sm font-medium">{formData.pets}</span>
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
                ← Edit More
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-8 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      {viewingImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4"
          onClick={() => setViewingImage(null)}
        >
          <button
            onClick={() => setViewingImage(null)}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <img
            src={viewingImage}
            alt="Full size"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}
    </div>
  );
}
