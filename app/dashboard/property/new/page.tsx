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
  ChevronUp,
  Bot,
  Building2,
  Home,
  Check,
  X,
} from 'lucide-react';
import Link from 'next/link';

import { Suspense } from "react";

// ─── Building Unit Selector ───────────────────────────────────────────────────
interface BuildingUnit {
  unit_number: string;
  beds: number;
  baths: number;
  sqft: number | null;
  price: number;
  available_from: string | null;
  floor: number | null;
  status: string;
  furnished: boolean;
  lease_term: string;
  description: string;
  images: string[];
  amenities: string[];
  move_in_special: string;
}

const DEFAULT_UNIT: BuildingUnit = {
  unit_number: '', beds: 1, baths: 1, sqft: null, price: 0, available_from: null,
  floor: null, status: 'available', furnished: false, lease_term: '12 months',
  description: '', images: [], amenities: [], move_in_special: '',
};

interface BuildingData {
  listing_type: 'building';
  building_name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  type: 'rent' | 'sale';
  description: string;
  amenities: string[];
  features: string[];
  rules: string[];
  pets: string;
  parking: string;
  imagePreviews: string[];
  units: BuildingUnit[];
}

function UnitSelectorModal({
  building,
  onConfirm,
  onCancel,
}: {
  building: BuildingData;
  onConfirm: (selected: BuildingUnit[]) => void;
  onCancel: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (unitNumber: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(unitNumber) ? next.delete(unitNumber) : next.add(unitNumber);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === building.units.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(building.units.map(u => u.unit_number)));
    }
  };

  const formatBeds = (beds: number) => beds === 0 ? 'Studio' : `${beds} bd`;
  const formatPrice = (p: number) => p ? `$${p.toLocaleString()}` : '—';

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-black">{building.building_name || building.address}</h2>
                <p className="text-sm text-gray-500">{building.address}, {building.city}, {building.state}</p>
              </div>
            </div>
            <button onClick={onCancel} className="text-gray-400 hover:text-black transition-colors mt-0.5">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-3">
            This listing has <strong>{building.units.length} available units</strong>. Select the ones you want to add as separate properties.
          </p>
        </div>

        {/* Unit list */}
        <div className="px-6 py-3 max-h-80 overflow-y-auto">
          {/* Select all */}
          <button
            type="button"
            onClick={toggleAll}
            className="w-full flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 mb-2 py-1"
          >
            <div className={`w-4 h-4 rounded flex items-center justify-center border-2 transition-colors ${selected.size === building.units.length ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
              {selected.size === building.units.length && <Check className="w-2.5 h-2.5 text-white" />}
            </div>
            {selected.size === building.units.length ? 'Deselect all' : 'Select all'}
          </button>

          <div className="space-y-1.5">
            {building.units.map(unit => {
              const isSelected = selected.has(unit.unit_number);
              return (
                <button
                  key={unit.unit_number}
                  type="button"
                  onClick={() => toggle(unit.unit_number)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 transition-all text-left ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className={`w-4 h-4 rounded flex items-center justify-center border-2 flex-shrink-0 transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                    {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-black">Unit {unit.unit_number}</span>
                      <span className="text-sm font-bold text-black">{formatPrice(unit.price)}<span className="text-xs font-normal text-gray-400">/mo</span></span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                      <span>{formatBeds(unit.beds)}, {unit.baths} ba</span>
                      {unit.sqft && <span>{unit.sqft.toLocaleString()} sqft</span>}
                      {unit.available_from && (
                        <span className={`font-medium ${unit.available_from.toLowerCase() === 'now' ? 'text-green-600' : 'text-amber-600'}`}>
                          Available {unit.available_from}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-black transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(building.units.filter(u => selected.has(u.unit_number)))}
            disabled={selected.size === 0}
            className="px-5 py-2.5 bg-black text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Add {selected.size > 0 ? `${selected.size} unit${selected.size > 1 ? 's' : ''}` : 'units'} →
          </button>
        </div>
      </div>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

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

// ─── Photo Lightbox ───────────────────────────────────────────────────────────
function PhotoLightbox({
  images,
  startIndex,
  onClose,
  onDelete,
}: {
  images: string[];
  startIndex: number;
  onClose: () => void;
  onDelete: (index: number) => void;
}) {
  const [current, setCurrent] = useState(startIndex);

  const total = images.length;
  const prev = () => setCurrent(i => (i - 1 + total) % total);
  const next = () => setCurrent(i => (i + 1) % total);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [total]);

  useEffect(() => {
    if (current >= images.length && images.length > 0) {
      setCurrent(images.length - 1);
    }
  }, [images.length]);

  if (images.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/95 flex flex-col"
      onClick={onClose}
    >
      {/* Top bar — single unified control strip */}
      <div
        className="flex items-center justify-between px-5 h-14 flex-shrink-0"
        onClick={e => e.stopPropagation()}
      >
        {/* Counter */}
        <span className="text-white/50 text-sm tabular-nums">
          {current + 1} <span className="text-white/25">/</span> {total}
        </span>

        {/* Right side: delete + close */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onDelete(current)}
            className="text-white/40 hover:text-red-400 w-9 h-9 flex items-center justify-center rounded-lg transition-colors hover:bg-white/5"
            title="Delete photo"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-white/40 hover:text-white w-9 h-9 flex items-center justify-center rounded-lg transition-colors hover:bg-white/5"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Image area — fills remaining space */}
      <div
        className="flex-1 relative flex items-center justify-center min-h-0"
        onClick={e => e.stopPropagation()}
      >
        <img
          src={images[current]}
          alt={`Photo ${current + 1}`}
          className="max-h-full max-w-full object-contain select-none"
          draggable={false}
        />

        {/* Navigation arrows — large hit areas on the sides */}
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-0 top-0 h-full w-16 flex items-center justify-start pl-3 text-white/0 hover:text-white/70 transition-colors group"
            >
              <div className="w-9 h-9 rounded-full bg-white/0 group-hover:bg-white/10 flex items-center justify-center transition-all">
                <ChevronLeft className="w-5 h-5" />
              </div>
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-0 top-0 h-full w-16 flex items-center justify-end pr-3 text-white/0 hover:text-white/70 transition-colors group"
            >
              <div className="w-9 h-9 rounded-full bg-white/0 group-hover:bg-white/10 flex items-center justify-center transition-all">
                <ChevronRight className="w-5 h-5" />
              </div>
            </button>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {total > 1 && (
        <div
          className="flex-shrink-0 flex items-center justify-center gap-1.5 px-6 py-3 overflow-x-auto"
          onClick={e => e.stopPropagation()}
        >
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrent(i)}
              className={`flex-shrink-0 rounded overflow-hidden transition-all duration-150 ${
                i === current
                  ? 'opacity-100 ring-1 ring-white'
                  : 'opacity-30 hover:opacity-60'
              }`}
              style={{ width: 48, height: 34 }}
            >
              <img src={img} alt="" className="w-full h-full object-cover" draggable={false} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NewPropertyPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Listing mode: single unit vs multi-unit building
  const [listingMode, setListingMode] = useState<'unit' | 'building'>('unit');

  // Building listing state (URL import)
  const [buildingData, setBuildingData] = useState<BuildingData | null>(null);
  const [savingUnits, setSavingUnits] = useState(false);

  // Building manual entry state
  const [buildingName, setBuildingName] = useState('');
  const [buildingType, setBuildingType] = useState<string>('apartment');
  const [manualUnits, setManualUnits] = useState<BuildingUnit[]>([
    { ...DEFAULT_UNIT },
  ]);

  // Expanded unit rows (for detail editing)
  const [expandedUnits, setExpandedUnits] = useState<Set<number>>(new Set());

  // Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

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
    description: '',
    status: 'available' as 'available' | 'rented' | 'pending',
    walk_score: '',
    transit_score: '',
    lease_term: '12 months',
    ai_assisted: true,
    security_deposit: '',
    application_fee: '',
    available_from: '',
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
    
    const errors: string[] = [];

    if (listingMode === 'building') {
      (['address', 'city', 'state', 'zip_code'] as const).forEach(field => {
        if (!formData[field]) errors.push(field);
      });
      const validUnits = manualUnits.filter(u => u.unit_number.trim());
      if (validUnits.length === 0) {
        setError('Add at least one unit with a unit number');
        return;
      }
    } else {
      (['address', 'city', 'state', 'zip_code', 'price', 'sqft'] as const).forEach(field => {
        if (!formData[field]) errors.push(field);
      });
    }

    if (errors.length > 0) {
      setFormErrors(errors);
      setError('Please fill in all required fields marked with *');
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
      if (listingMode === 'building') {
        const validUnits = manualUnits.filter(u => u.unit_number.trim());
        const res = await fetch('/api/buildings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            building: {
              name: buildingName || null,
              address: formData.address,
              city: formData.city,
              state: formData.state,
              zip_code: formData.zip_code,
              type: buildingType,
              description: formData.description,
              amenities: amenities.length > 0 ? amenities : null,
              rules: rules.length > 0 ? rules : null,
              pets: formData.pets,
              parking: formData.parking,
              walk_score: formData.walk_score ? parseInt(formData.walk_score) : null,
              transit_score: formData.transit_score ? parseInt(formData.transit_score) : null,
              images: imagePreviews.length > 0 ? imagePreviews : null,
            },
            units: validUnits.map(u => ({
              unit_number: u.unit_number,
              beds: u.beds,
              baths: u.baths,
              sqft: u.sqft,
              price: u.price,
              available_from: u.available_from,
              floor: u.floor,
              status: u.status,
              furnished: u.furnished,
              lease_term: u.lease_term,
              description: u.description || null,
              images: u.images.length > 0 ? u.images : null,
              amenities: u.amenities.length > 0 ? u.amenities : null,
              move_in_special: u.move_in_special || null,
            })),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create building');
        router.push('/dashboard?tab=properties&success=property_created');
        return;
      }

      const formattedPrice = formData.type === 'rent'
        ? `${formData.price}/month`
        : formData.price;

      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: formattedPrice,
          walk_score: formData.walk_score ? parseInt(formData.walk_score) : null,
          transit_score: formData.transit_score ? parseInt(formData.transit_score) : null,
          amenities: amenities.length > 0 ? amenities : null,
          features: features.length > 0 ? features : null,
          rules: rules.length > 0 ? rules : null,
          images: imagePreviews,
          security_deposit: formData.security_deposit ? parseInt(formData.security_deposit.replace(/[^0-9]/g, '')) : null,
          application_fee: formData.application_fee ? parseInt(formData.application_fee.replace(/[^0-9]/g, '')) : null,
          available_from: formData.available_from || null,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create property');
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

  const handleBuildingConfirm = async (selectedUnits: BuildingUnit[]) => {
    if (!buildingData || selectedUnits.length === 0) return;
    setSavingUnits(true);
    setError('');
    setBuildingData(null);

    try {
      const res = await fetch('/api/buildings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          building: {
            name:        buildingData.building_name || null,
            address:     buildingData.address,
            city:        buildingData.city,
            state:       buildingData.state,
            zip_code:    buildingData.zip_code,
            type:        buildingData.type === 'sale' ? 'sale' : 'rent',
            description: buildingData.description,
            amenities:   buildingData.amenities,
            rules:       buildingData.rules,
            pets:        buildingData.pets,
            parking:     buildingData.parking,
            images:      buildingData.imagePreviews,
          },
          units: selectedUnits.map(u => ({
            unit_number:    u.unit_number,
            beds:           u.beds,
            baths:          u.baths,
            sqft:           u.sqft,
            price:          u.price,
            available_from: u.available_from,
            floor:          u.floor,
            status:         u.status,
            furnished:      u.furnished,
            lease_term:     u.lease_term,
            description:    u.description || null,
            images:         u.images?.length > 0 ? u.images : null,
            amenities:      u.amenities?.length > 0 ? u.amenities : null,
            move_in_special: u.move_in_special || null,
          })),
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to save building');
      }

      router.push('/dashboard?tab=properties&success=property_created');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save building');
      setSavingUnits(false);
    }
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
                placeholder="Paste any listing URL — Zillow, Realtor, Redfin, Apartments.com, Trulia, Rent.com, Zumper..."
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
                      if (data.listing_type === 'building') {
                        // Multi-unit building → show unit selector modal
                        setBuildingData(data as BuildingData);
                        urlInput.value = '';
                      } else {
                        // Single unit → fill the form as before
                        setFormData(prev => ({
                          ...prev,
                          address:     data.address     || prev.address,
                          city:        data.city        || prev.city,
                          state:       data.state       || prev.state,
                          zip_code:    data.zip_code    || prev.zip_code,
                          price:       data.price != null ? String(data.price) : prev.price,
                          beds:        data.beds  ?? prev.beds,
                          baths:       data.baths ?? prev.baths,
                          sqft:        data.sqft  != null ? String(data.sqft) : prev.sqft,
                          description: data.description || prev.description,
                          type:        data.type === 'sale' ? 'sale' : 'rent',
                          pets:        data.pets    || prev.pets,
                          parking:     data.parking || prev.parking,
                        }));
                        if (data.amenities) setAmenities(data.amenities);
                        if (data.features) setFeatures(data.features);
                        if (data.rules) setRules(data.rules);
                        if (data.imagePreviews) setImagePreviews(data.imagePreviews);
                        urlInput.value = '';
                        setImportSuccess(true);
                        setTimeout(() => setImportSuccess(false), 3000);
                      }
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

          {/* Listing Mode Selector */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold text-black mb-4">What are you listing?</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setListingMode('unit')}
                className={`p-5 rounded-xl border-2 text-left transition-all ${
                  listingMode === 'unit'
                    ? 'border-black bg-black/[0.02] shadow-sm'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 transition-colors ${
                  listingMode === 'unit' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  <Home className="w-5 h-5" />
                </div>
                <div className="font-bold text-black text-base">Single Unit</div>
                <div className="text-sm text-gray-500 mt-1">Apartment, house, condo</div>
              </button>
              <button
                type="button"
                onClick={() => setListingMode('building')}
                className={`p-5 rounded-xl border-2 text-left transition-all ${
                  listingMode === 'building'
                    ? 'border-black bg-black/[0.02] shadow-sm'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 transition-colors ${
                  listingMode === 'building' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="font-bold text-black text-base">Multi-Unit Building</div>
                <div className="text-sm text-gray-500 mt-1">Apartment complex, co-living</div>
              </button>
            </div>
          </div>

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
                AI will not auto-respond to inquiries about this property
              </p>
            )}
          </div>

          {/* Basic Information */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold text-black mb-4">Basic Information</h2>
            <div className="space-y-4">
              {/* Building Name & Type (building mode only) */}
              {listingMode === 'building' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-base font-bold text-gray-900 mb-2">
                      Building Name
                    </label>
                    <input
                      type="text"
                      value={buildingName}
                      onChange={e => setBuildingName(e.target.value)}
                      placeholder="The Piedmont"
                      className="w-full px-4 py-3.5 border border-gray-300 bg-gray-50 rounded-lg text-lg text-black placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-base font-bold text-gray-900 mb-2">
                      Building Type
                    </label>
                    <div className="relative">
                      <select
                        value={buildingType}
                        onChange={e => setBuildingType(e.target.value)}
                        className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-lg text-lg text-black appearance-none cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                      >
                        <option value="apartment">Apartment Complex</option>
                        <option value="co_living">Co-living</option>
                        <option value="condo">Condo Building</option>
                        <option value="townhouse">Townhouse Community</option>
                        <option value="mixed">Mixed Use</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              )}

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

              {listingMode === 'unit' && (
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
              )}

              {listingMode === 'building' && (
                <p className="text-sm text-gray-500 bg-gray-50 rounded-lg px-4 py-3">
                  Price is set per unit in the Units section below.
                </p>
              )}

              {/* Security Deposit & Application Fee */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-black mb-2">Security Deposit</label>
                  <input
                    type="text"
                    name="security_deposit"
                    value={formData.security_deposit}
                    onChange={handleChange}
                    placeholder="$1,500"
                    className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:ring-4 outline-none transition-all duration-200 text-black focus:ring-black/5 focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-black mb-2">Application Fee</label>
                  <input
                    type="text"
                    name="application_fee"
                    value={formData.application_fee}
                    onChange={handleChange}
                    placeholder="$50"
                    className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:ring-4 outline-none transition-all duration-200 text-black focus:ring-black/5 focus:border-black"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Units (building mode) — Accordion Cards */}
          {listingMode === 'building' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-2xl font-bold text-black">Units</h2>
                <button
                  type="button"
                  onClick={() => {
                    const nextIdx = manualUnits.length;
                    setManualUnits(prev => [...prev, { ...DEFAULT_UNIT }]);
                    setExpandedUnits(prev => new Set(prev).add(nextIdx));
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-black text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-all"
                >
                  <Plus className="w-4 h-4" /> Add Unit
                </button>
              </div>

              <div className="space-y-3">
                {manualUnits.map((unit, idx) => {
                  const isExpanded = expandedUnits.has(idx);
                  const updateUnit = (patch: Partial<BuildingUnit>) => {
                    const next = [...manualUnits];
                    next[idx] = { ...next[idx], ...patch };
                    setManualUnits(next);
                  };
                  const toggleExpand = () => {
                    setExpandedUnits(prev => {
                      const next = new Set(prev);
                      next.has(idx) ? next.delete(idx) : next.add(idx);
                      return next;
                    });
                  };
                  const removeUnit = () => {
                    setManualUnits(prev => prev.filter((_, i) => i !== idx));
                    setExpandedUnits(prev => {
                      const n = new Set<number>();
                      prev.forEach(v => { if (v < idx) n.add(v); else if (v > idx) n.add(v - 1); });
                      return n;
                    });
                  };

                  const bedsLabel = unit.beds === 0 ? 'Studio' : `${unit.beds} bd`;
                  const bathsLabel = `${unit.baths} ba`;
                  const sqftLabel = unit.sqft ? `${unit.sqft.toLocaleString()} sqft` : null;
                  const priceLabel = unit.price > 0 ? `$${unit.price.toLocaleString()}/mo` : null;
                  const statusColors: Record<string, string> = {
                    available: 'bg-green-50 text-green-700 border-green-200',
                    occupied: 'bg-gray-100 text-gray-600 border-gray-200',
                    reserved: 'bg-amber-50 text-amber-700 border-amber-200',
                    renovation: 'bg-orange-50 text-orange-700 border-orange-200',
                  };

                  return (
                    <div key={idx} className={`border rounded-xl transition-all ${isExpanded ? 'border-gray-300 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}>
                      {/* Collapsed header */}
                      <button
                        type="button"
                        onClick={toggleExpand}
                        className="w-full flex items-center gap-3.5 px-4 py-3 text-left"
                      >
                        {/* Thumbnail */}
                        <div className="w-12 h-12 rounded-lg shrink-0 overflow-hidden bg-gray-100 flex items-center justify-center">
                          {unit.images.length > 0 ? (
                            <img src={unit.images[0]} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-gray-300" />
                          )}
                        </div>

                        {/* Text content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-black text-sm">
                              {unit.unit_number ? `Unit ${unit.unit_number}` : `Unit ${idx + 1}`}
                            </span>
                            <span className="text-gray-300">|</span>
                            <span className="text-sm text-gray-600">
                              {[bedsLabel, bathsLabel, sqftLabel].filter(Boolean).join(' / ')}
                            </span>
                            {priceLabel && (
                              <>
                                <span className="text-gray-300">|</span>
                                <span className="text-sm font-semibold text-black">{priceLabel}</span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {unit.floor != null && (
                              <span className="text-xs text-gray-500">Floor {unit.floor}</span>
                            )}
                            {unit.floor != null && unit.available_from && <span className="text-gray-300 text-xs">·</span>}
                            {unit.available_from && (
                              <span className="text-xs text-gray-500">Available {unit.available_from}</span>
                            )}
                            {(unit.floor != null || unit.available_from) && <span className="text-gray-300 text-xs">·</span>}
                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${statusColors[unit.status] || statusColors.available}`}>
                              {unit.status.charAt(0).toUpperCase() + unit.status.slice(1)}
                            </span>
                            {unit.furnished && (
                              <>
                                <span className="text-gray-300 text-xs">·</span>
                                <span className="text-xs text-gray-500">Furnished</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Right side actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          {manualUnits.length > 1 && (
                            <div
                              onClick={e => { e.stopPropagation(); removeUnit(); }}
                              className="p-1.5 text-gray-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                              role="button"
                            >
                              <Trash2 className="w-4 h-4" />
                            </div>
                          )}
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${isExpanded ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400'}`}>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </div>
                        </div>
                      </button>

                      {/* Expanded form */}
                      {isExpanded && (
                        <div className="border-t border-gray-200 px-5 py-5 space-y-5">
                          {/* Core details */}
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Unit #</label>
                              <input type="text" value={unit.unit_number} onChange={e => updateUnit({ unit_number: e.target.value })} placeholder="19A" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Floor</label>
                              <input type="number" value={unit.floor ?? ''} onChange={e => updateUnit({ floor: e.target.value ? Number(e.target.value) : null })} placeholder="2" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Beds</label>
                              <select value={unit.beds} onChange={e => updateUnit({ beds: Number(e.target.value) })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all appearance-none">
                                {[0, 1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n === 0 ? 'Studio' : `${n} bd`}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Baths</label>
                              <select value={unit.baths} onChange={e => updateUnit({ baths: Number(e.target.value) })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all appearance-none">
                                {[1, 1.5, 2, 2.5, 3].map(n => <option key={n} value={n}>{n} ba</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Sqft</label>
                              <input type="number" value={unit.sqft || ''} onChange={e => updateUnit({ sqft: e.target.value ? Number(e.target.value) : null })} placeholder="850" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Price/mo</label>
                              <input type="number" value={unit.price || ''} onChange={e => updateUnit({ price: Number(e.target.value) || 0 })} placeholder="950" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" />
                            </div>
                          </div>

                          {/* Availability & lease */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Status</label>
                              <select value={unit.status} onChange={e => updateUnit({ status: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all appearance-none">
                                <option value="available">Available</option>
                                <option value="occupied">Occupied</option>
                                <option value="reserved">Reserved</option>
                                <option value="renovation">Renovation</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Available From</label>
                              <input type="text" value={unit.available_from || ''} onChange={e => updateUnit({ available_from: e.target.value || null })} placeholder="Aug 14" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Lease Term</label>
                              <select value={unit.lease_term} onChange={e => updateUnit({ lease_term: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all appearance-none">
                                <option value="Month-to-month">Month-to-month</option>
                                <option value="6 months">6 months</option>
                                <option value="12 months">12 months</option>
                                <option value="18 months">18 months</option>
                                <option value="24 months">24 months</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Move-in Special</label>
                              <input type="text" value={unit.move_in_special} onChange={e => updateUnit({ move_in_special: e.target.value })} placeholder="1 month free" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" />
                            </div>
                          </div>

                          {/* Furnished toggle */}
                          <div>
                            <label className="flex items-center gap-2.5 cursor-pointer select-none">
                              <button type="button" onClick={() => updateUnit({ furnished: !unit.furnished })} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${unit.furnished ? 'bg-gray-900' : 'bg-gray-200'}`}>
                                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm ${unit.furnished ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
                              </button>
                              <span className="text-sm font-medium text-gray-700">Furnished</span>
                            </label>
                          </div>

                          {/* Description */}
                          <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Description</label>
                            <textarea value={unit.description} onChange={e => updateUnit({ description: e.target.value })} rows={2} placeholder="Corner unit with natural light, updated kitchen..." className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black resize-none transition-all" />
                          </div>

                          {/* Unit Amenities */}
                          <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Amenities</label>
                            <div className="flex gap-2 mb-2">
                              <input
                                type="text"
                                placeholder="e.g., In-unit W/D"
                                className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                                onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const val = (e.target as HTMLInputElement).value.trim();
                                    if (val && !unit.amenities.includes(val)) {
                                      updateUnit({ amenities: [...unit.amenities, val] });
                                      (e.target as HTMLInputElement).value = '';
                                    }
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={e => {
                                  const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                                  const val = input.value.trim();
                                  if (val && !unit.amenities.includes(val)) {
                                    updateUnit({ amenities: [...unit.amenities, val] });
                                    input.value = '';
                                  }
                                }}
                                className="px-4 py-2.5 bg-black text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition-all"
                              >
                                Add
                              </button>
                            </div>
                            {unit.amenities.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {unit.amenities.map((a, aIdx) => (
                                  <div key={aIdx} className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1 rounded-lg text-sm border border-green-200">
                                    <span>{a}</span>
                                    <button type="button" onClick={() => updateUnit({ amenities: unit.amenities.filter((_, i) => i !== aIdx) })} className="text-green-700 hover:text-green-900">&times;</button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Unit Photos */}
                          <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Photos</label>
                            {unit.images.length > 0 && (
                              <div className="flex gap-2 mb-2 flex-wrap">
                                {unit.images.map((img, imgIdx) => (
                                  <div key={imgIdx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 group/img">
                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                    <button
                                      type="button"
                                      onClick={() => updateUnit({ images: unit.images.filter((_, i) => i !== imgIdx) })}
                                      className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center"
                                    >
                                      <X className="w-4 h-4 text-white" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                            <label className="cursor-pointer">
                              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                                <span className="text-xs font-medium text-gray-500">Click to upload unit photos</span>
                              </div>
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={e => {
                                  const files = Array.from(e.target.files || []);
                                  files.forEach(file => {
                                    const reader = new FileReader();
                                    reader.onloadend = () => updateUnit({ images: [...unit.images, reader.result as string] });
                                    reader.readAsDataURL(file);
                                  });
                                  e.target.value = '';
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Summary footer */}
              {manualUnits.filter(u => u.unit_number.trim()).length > 0 && (() => {
                const valid = manualUnits.filter(u => u.unit_number.trim());
                const prices = valid.map(u => u.price).filter(p => p > 0);
                const avg = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
                const min = prices.length > 0 ? Math.min(...prices) : 0;
                const max = prices.length > 0 ? Math.max(...prices) : 0;
                return (
                  <div className="mt-4 px-4 py-3 bg-gray-50 rounded-xl flex items-center gap-4 text-sm text-gray-600">
                    <span className="font-semibold text-black">{valid.length} unit{valid.length !== 1 ? 's' : ''}</span>
                    {avg > 0 && <span>Avg: ${avg.toLocaleString()}/mo</span>}
                    {min > 0 && min !== max && <span>Range: ${min.toLocaleString()} — ${max.toLocaleString()}</span>}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Property Details (single unit mode) */}
          {listingMode === 'unit' && (
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
          </div>
          )}

          {/* Policies */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold text-black mb-4">{listingMode === 'building' ? 'Building Policies' : 'Policies'}</h2>
            <div className="grid grid-cols-2 gap-4">
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-black">
                {listingMode === 'building' ? 'Building Photos' : 'Photos'}
                {imagePreviews.length > 0 && (
                  <span className="ml-2 text-base font-normal text-gray-400">{imagePreviews.length}</span>
                )}
              </h2>
              {imagePreviews.length > 0 && (
                <button
                  type="button"
                  onClick={() => setImagePreviews([])}
                  className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
                >
                  Remove all
                </button>
              )}
            </div>
            {listingMode === 'building' && (
              <p className="text-xs text-gray-500 mb-4 -mt-2">Exterior, lobby, amenity spaces. Add unit-specific photos in each unit&apos;s detail panel above.</p>
            )}

            {/* Upload area */}
            <div className="mb-4">
              <label className="cursor-pointer">
                <div
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                    isDragging
                      ? 'border-black bg-black/5 scale-105'
                      : 'border-gray-300 hover:border-black'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">
                      {isDragging ? 'Drop images here' : 'Click to upload or drag and drop'}
                    </span>
                    <span className="text-xs text-gray-500">PNG, JPG, WEBP up to 10MB</span>
                  </div>
                </div>
                <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
              </label>
            </div>

            {/* Image grid */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {imagePreviews.map((preview, index) => (
                  <div
                    key={index}
                    className="relative group rounded-xl overflow-hidden bg-gray-100 cursor-pointer"
                    style={{ aspectRatio: '4/3' }}
                    onClick={() => setLightboxIndex(index)}
                  >
                    <img
                      src={preview}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200" />
                    {/* Index badge */}
                    <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs font-bold px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      {index + 1}
                    </div>
                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); removeImage(index); }}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                    >
                      <X className="w-3.5 h-3.5" />
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
                  {/* AI assisted badge */}
                  <div className="absolute top-4 right-4 z-10">
                    <span className="inline-flex items-center gap-1.5 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                      <Sparkles className="w-3 h-3 text-violet-400" />
                      AI assisted
                    </span>
                  </div>
                </div>

                {/* Property Info */}
                <div className="p-6">
                  {/* Price row */}
                  <div className="flex items-end justify-between gap-3 mb-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-black tracking-tight">
                        {formatCurrency(formData.price)}
                      </span>
                      {formData.type === 'rent' && Number(formData.price) > 0 && (
                        <span className="text-sm text-gray-400 font-normal">/mo</span>
                      )}
                    </div>
                    {/* Type pill */}
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      formData.type === 'rent'
                        ? 'bg-blue-50 text-blue-600'
                        : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {formData.type === 'rent' ? 'For Rent' : 'For Sale'}
                    </span>
                  </div>

                  {/* Address */}
                  <p className="text-sm text-gray-500 mb-5 truncate">
                    {[formData.address, formData.city, formData.state, formData.zip_code]
                      .filter(Boolean).join(', ') || 'Address not set'}
                  </p>

                  {/* Stats row — compact chips */}
                  <div className="flex items-center gap-2 flex-wrap mb-5">
                    {formData.beds !== undefined && (
                      <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-sm font-medium px-3 py-1.5 rounded-full">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                          <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                        {formData.beds === 0 ? 'Studio' : `${formData.beds} BD`}
                      </span>
                    )}
                    {formData.baths > 0 && (
                      <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-sm font-medium px-3 py-1.5 rounded-full">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12h16M4 12a8 8 0 0116 0M4 12V9a4 4 0 018 0" />
                        </svg>
                        {formData.baths} BA
                      </span>
                    )}
                    {Number(formData.sqft) > 0 && (
                      <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-sm font-medium px-3 py-1.5 rounded-full">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-2V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                        {formData.sqft.toLocaleString()} sqft
                      </span>
                    )}
                    {formData.pets && (
                      <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-sm font-medium px-3 py-1.5 rounded-full">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                        </svg>
                        {formData.pets === 'Not allowed' ? 'No Pets' : formData.pets}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {formData.description && (
                    <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 border-t border-gray-100 pt-4">
                      {formData.description}
                    </p>
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

      {/* Building unit selector modal */}
      {buildingData && (
        <UnitSelectorModal
          building={buildingData}
          onConfirm={handleBuildingConfirm}
          onCancel={() => setBuildingData(null)}
        />
      )}

      {/* Saving units overlay */}
      {savingUnits && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl px-8 py-6 flex items-center gap-4 shadow-2xl">
            <div className="w-6 h-6 border-3 border-black/20 border-t-black rounded-full animate-spin" />
            <span className="text-base font-semibold text-black">Saving units…</span>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <PhotoLightbox
          images={imagePreviews}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onDelete={(idx) => {
            removeImage(idx);
            if (imagePreviews.length <= 1) {
              setLightboxIndex(null);
            } else {
              setLightboxIndex(Math.min(idx, imagePreviews.length - 2));
            }
          }}
        />
      )}
    </div>
  );
}
