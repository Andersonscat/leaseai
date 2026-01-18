'use client';

import { useState, useEffect } from 'react';
import { Home, Bed, Bath, Ruler, Dog, Search, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function TestPropertiesPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [propertyType, setPropertyType] = useState<'rent' | 'sale'>('rent');

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/properties?type=${propertyType}`);
        const data = await response.json();
        setProperties(data.properties || []);
      } catch (error) {
        console.error('Error fetching properties:', error);
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [propertyType]);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-black mb-2">
              🧪 Test: Properties from Supabase
            </h1>
            <p className="text-lg text-gray-600">
              These properties are loaded from your Supabase database in real-time!
            </p>
          </div>
          <Link href="/dashboard?tab=properties">
            <button className="px-6 py-3 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-700 transition-all">
              ← Back to Dashboard
            </button>
          </Link>
        </div>

        {/* Info Banner */}
        <div className="mb-8 bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="text-blue-500 text-2xl">ℹ️</div>
            <div>
              <h3 className="font-bold text-blue-900 mb-2">This is a TEST page</h3>
              <p className="text-blue-800 mb-2">
                The main dashboard still shows hardcoded data. This page demonstrates that
                your Supabase database is working and properties can be loaded dynamically.
              </p>
              <p className="text-blue-700 text-sm">
                <strong>Current count:</strong> {properties.length} {propertyType} properties in database
              </p>
            </div>
          </div>
        </div>

        {/* Rent/Sale Toggle */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1 w-fit mb-6">
          <button
            onClick={() => setPropertyType('rent')}
            className={`px-8 py-3 rounded-md text-base font-semibold transition-all cursor-pointer ${
              propertyType === 'rent'
                ? 'bg-black text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            Rent
          </button>
          <button
            onClick={() => setPropertyType('sale')}
            className={`px-8 py-3 rounded-md text-base font-semibold transition-all cursor-pointer ${
              propertyType === 'sale'
                ? 'bg-black text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            Sale
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-16 text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-black" />
            <p className="text-gray-600">Loading properties from Supabase...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && properties.length === 0 && (
          <div className="py-16 text-center bg-white rounded-2xl shadow-lg">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-black mb-2">No properties found</h3>
            <p className="text-gray-600">
              No {propertyType === 'rent' ? 'rental' : 'sale'} properties in the database yet.
            </p>
          </div>
        )}

        {/* Properties Grid */}
        {!loading && properties.length > 0 && (
          <>
            <p className="text-gray-600 mb-6 font-semibold">
              ✅ Showing {properties.length} {propertyType} {properties.length === 1 ? 'property' : 'properties'} from Supabase
            </p>
            
            <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
              {properties.map((property) => (
                <div key={property.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all border border-gray-200 group">
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={property.images?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800'}
                      alt={property.address}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-4 right-4 bg-white px-3 py-1.5 rounded-full shadow-lg">
                      <span className="text-sm font-bold text-black">{property.price}</span>
                    </div>
                    {property.status && (
                      <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-full shadow-lg font-semibold text-sm ${
                        property.status === 'Available' ? 'bg-green-500 text-white' :
                        property.status === 'Pending' ? 'bg-yellow-500 text-white' :
                        'bg-gray-500 text-white'
                      }`}>
                        {property.status}
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-black mb-3 group-hover:text-gray-700 transition-colors">
                      {property.address}
                    </h3>
                    
                    <div className="flex items-center gap-6 mb-4 text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <Bed className="w-4 h-4" />
                        <span className="text-sm font-medium">{property.beds} beds</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Bath className="w-4 h-4" />
                        <span className="text-sm font-medium">{property.baths} baths</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Ruler className="w-4 h-4" />
                        <span className="text-sm font-medium">{property.sqft} sqft</span>
                      </div>
                    </div>

                    <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                      {property.description}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Dog className="w-4 h-4" />
                        <span className="text-sm">{property.pets}</span>
                      </div>
                      
                      <div className="text-xs text-gray-500 bg-green-50 px-2 py-1 rounded-full font-semibold">
                        📊 From Database
                      </div>
                    </div>

                    {/* Show Database ID for verification */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500 font-mono truncate">
                        ID: {property.id}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Created: {new Date(property.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
