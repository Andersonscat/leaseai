'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase';
import Link from 'next/link';
import { Mail, Loader2, Chrome, Github, ArrowLeft, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [emailView, setEmailView] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createSupabaseClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      router.push('/dashboard');
      router.refresh();
    } catch (error: any) {
      setError(error.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      setError(error.message || `Failed to login with ${provider}`);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative">
       
       {/* Centered Content */}
       <div className="w-full max-w-[400px] relative z-10 flex flex-col items-center text-center">
          
          {/* Logo */}
          <div className="mb-12 flex flex-col items-center">
             <div className="flex gap-2 mb-8">
                <div className="w-3 h-8 bg-black skew-x-[-15deg] rounded-sm" />
                <div className="w-3 h-8 bg-black skew-x-[-15deg] rounded-sm" />
             </div>
             <h1 className="text-[36px] font-bold text-black tracking-[-0.04em] leading-tight mb-0">Welcome to LeaseAI</h1>
             <p className="text-[36px] font-bold text-[#e5e5e5] tracking-[-0.04em] leading-tight">Your AI Operating System</p>
          </div>

          {!emailView ? (
             /* Initial View: Social Buttons */
             <div className="w-full space-y-4 animate-premium-fade">
                <button
                    onClick={() => handleSocialLogin('google')}
                    className="w-full bg-white border border-gray-200 text-black h-12 rounded-full font-semibold hover:border-gray-400 hover:shadow-sm transition-all flex items-center justify-center gap-3 group"
                >
                    <Chrome className="w-5 h-5 text-gray-900" />
                    <span>Continue with Google</span>
                </button>

                <button
                    onClick={() => handleSocialLogin('github')}
                    className="w-full bg-white border border-gray-200 text-black h-12 rounded-full font-semibold hover:border-gray-400 hover:shadow-sm transition-all flex items-center justify-center gap-3"
                >
                    <Github className="w-5 h-5 text-gray-900" />
                    <span>Continue with GitHub</span>
                </button>

                <button
                    onClick={() => setEmailView(true)}
                    className="w-full bg-white border border-gray-200 text-black h-12 rounded-full font-semibold hover:border-gray-400 hover:shadow-sm transition-all flex items-center justify-center gap-3"
                >
                    <Mail className="w-5 h-5 text-gray-900" />
                    <span>Continue with Email</span>
                </button>
             </div>
          ) : (
             /* Email View: Form */
             <div className="w-full animate-premium-fade">
                <form onSubmit={handleLogin} className="space-y-4 text-left">
                    {error && (
                        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg text-center font-medium">
                            {error}
                        </div>
                    )}
                    
                    <div>
                        <input
                            type="email"
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:border-black focus:ring-0 transition-colors bg-gray-50/50"
                        />
                    </div>
                    <div>
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:border-black focus:ring-0 transition-colors bg-gray-50/50"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-black text-white h-12 rounded-full font-semibold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/20"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
                        {!loading && <ArrowRight size={18} />}
                    </button>
                </form>
                
                <button 
                    onClick={() => setEmailView(false)}
                    className="mt-6 text-sm text-gray-500 hover:text-black font-medium flex items-center justify-center gap-2 mx-auto"
                >
                    <ArrowLeft size={14} /> Back to options
                </button>
             </div>
          )}

          {/* Footer */}
          <div className="mt-16 text-center text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
             By clicking continue, you agree to our <Link href="#" className="underline hover:text-gray-600">Terms of Service</Link> and <Link href="#" className="underline hover:text-gray-600">Privacy Policy</Link>.
          </div>
       </div>
    </div>
  );
}
