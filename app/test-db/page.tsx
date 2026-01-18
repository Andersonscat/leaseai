'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Loader2, Database } from 'lucide-react';

export default function TestDatabasePage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch('/api/test-db')
      .then(res => res.json())
      .then(data => {
        setResult(data);
        setLoading(false);
      })
      .catch(err => {
        setResult({
          status: 'error',
          message: 'Failed to fetch test endpoint',
          details: err.message
        });
        setLoading(false);
      });
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <Database className="w-16 h-16 mx-auto mb-4 text-black" />
            <h1 className="text-4xl font-bold mb-4">Supabase Connection Test</h1>
            <p className="text-gray-600">Testing database connectivity and configuration</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-black" />
              <span className="ml-3 text-lg">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <Database className="w-16 h-16 mx-auto mb-4 text-black" />
          <h1 className="text-4xl font-bold mb-4">Supabase Connection Test</h1>
          <p className="text-gray-600">Testing database connectivity and configuration</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-black" />
              <span className="ml-3 text-lg">Testing connection...</span>
            </div>
          ) : (
            <>
              <div className="flex items-center mb-6">
                {result?.status === 'success' ? (
                  <>
                    <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
                    <h2 className="text-2xl font-bold text-green-600">Connection Successful!</h2>
                  </>
                ) : (
                  <>
                    <XCircle className="w-8 h-8 text-red-600 mr-3" />
                    <h2 className="text-2xl font-bold text-red-600">Connection Failed</h2>
                  </>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Message:</h3>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                    {result?.message}
                  </p>
                </div>

                {result?.details && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Details:</h3>
                    <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto text-sm">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </div>
                )}

                {result?.hint && (
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                    <p className="text-yellow-800">
                      <strong>💡 Hint:</strong> {result.hint}
                    </p>
                  </div>
                )}
              </div>

              {result?.status === 'success' && (
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h3 className="font-semibold text-lg mb-4">✅ Next Steps:</h3>
                  <ol className="list-decimal list-inside space-y-2 text-gray-700">
                    <li>Add some test data in Supabase dashboard</li>
                    <li>Start replacing mock data with real Supabase queries</li>
                    <li>Set up authentication with Supabase Auth</li>
                    <li>Configure Row Level Security (RLS) policies</li>
                  </ol>
                </div>
              )}

              {result?.status === 'error' && (
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h3 className="font-semibold text-lg mb-4 text-red-600">❌ Troubleshooting:</h3>
                  <ol className="list-decimal list-inside space-y-2 text-gray-700">
                    <li>Check that .env.local has correct NEXT_PUBLIC_SUPABASE_URL</li>
                    <li>Check that .env.local has correct NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
                    <li>Restart the dev server: <code className="bg-gray-900 text-white px-2 py-1 rounded">npm run dev</code></li>
                    <li>Run the schema.sql in Supabase SQL Editor</li>
                    <li>Check Supabase dashboard for any errors</li>
                  </ol>
                </div>
              )}
            </>
          )}
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-all"
          >
            Test Again
          </button>
          <a
            href="/dashboard"
            className="ml-4 px-6 py-3 bg-white text-black border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-all inline-block"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
