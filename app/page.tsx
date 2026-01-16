import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Mail, Bot, Calendar, BarChart3, MessageSquare, FileText } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header - Uber Style */}
      <header className="bg-black">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-bold text-white">LeaseAI</h1>
            <nav className="hidden md:flex gap-6">
              <Link href="#features" className="text-white hover:text-gray-300 text-sm font-medium">
                Features
              </Link>
              <Link href="#pricing" className="text-white hover:text-gray-300 text-sm font-medium">
                Pricing
              </Link>
              <Link href="#about" className="text-white hover:text-gray-300 text-sm font-medium">
                About
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/sign-in">
              <button className="text-white hover:bg-white/10 px-4 py-2 rounded text-sm font-medium">
                Log in
              </button>
            </Link>
            <Link href="/sign-up">
              <button className="bg-white text-black hover:bg-gray-200 px-6 py-2.5 rounded text-sm font-medium">
                Sign up
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section - Uber Style: Text Left, Image Right */}
      <section className="bg-gray-50">
        <div className="container mx-auto px-6 py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Text + Form */}
            <div>
              <h2 className="text-6xl font-bold text-black mb-6 leading-tight">
                Automate your real estate business
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                AI-powered platform that handles leads, scheduling, and follow-ups automatically.
              </p>
              
              {/* CTA Buttons */}
              <div className="flex gap-4 mb-8">
                <Link href="/sign-up">
                  <button className="bg-black text-white px-8 py-4 rounded font-semibold hover:bg-gray-800 transition-all">
                    Get started
                  </button>
                </Link>
                <Link href="/sign-in">
                  <button className="bg-gray-200 text-black px-8 py-4 rounded font-semibold hover:bg-gray-300 transition-all">
                    Learn more
                  </button>
                </Link>
              </div>

              <p className="text-sm text-gray-500">
                Free 14-day trial · No credit card required · $29/month after
              </p>
            </div>

            {/* Right: Illustration */}
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl p-12 aspect-square flex items-center justify-center">
                <div className="text-center text-white">
                  <Bot className="w-32 h-32 mx-auto mb-4 opacity-90" />
                  <p className="text-2xl font-bold">AI Assistant</p>
                  <p className="text-lg opacity-80">24/7 Lead Management</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Uber Style */}
      <section id="features" className="py-20 px-6 bg-white scroll-mt-20">
        <div className="container mx-auto max-w-7xl">
          <h3 className="text-4xl font-bold text-black mb-12">Features</h3>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Feature Card 1 */}
            <div className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center mb-6">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-2xl font-bold text-black mb-3">Smart Inbox</h4>
              <p className="text-gray-600 leading-relaxed">
                Manage all your leads from email, SMS, and calls in one unified inbox with AI prioritization.
              </p>
            </div>

            {/* Feature Card 2 */}
            <div className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center mb-6">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-2xl font-bold text-black mb-3">AI Agent</h4>
              <p className="text-gray-600 leading-relaxed">
                Automated responses, lead qualification, and follow-ups powered by advanced AI technology.
              </p>
            </div>

            {/* Feature Card 3 */}
            <div className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center mb-6">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-2xl font-bold text-black mb-3">Auto Scheduling</h4>
              <p className="text-gray-600 leading-relaxed">
                Seamless calendar integration. Clients book meetings automatically with smart availability detection.
              </p>
            </div>

            {/* Feature Card 4 */}
            <div className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center mb-6">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-2xl font-bold text-black mb-3">Analytics</h4>
              <p className="text-gray-600 leading-relaxed">
                Track conversion rates, response times, and lead quality with real-time dashboard insights.
              </p>
            </div>

            {/* Feature Card 5 */}
            <div className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center mb-6">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-2xl font-bold text-black mb-3">Multi-Channel</h4>
              <p className="text-gray-600 leading-relaxed">
                Connect email, SMS, WhatsApp, and phone calls. Respond to all channels from one place.
              </p>
            </div>

            {/* Feature Card 6 */}
            <div className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center mb-6">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-2xl font-bold text-black mb-3">Lead Tracking</h4>
              <p className="text-gray-600 leading-relaxed">
                Full history of every interaction. Never lose track of a conversation or follow-up.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 bg-gray-50 scroll-mt-20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h3 className="text-5xl font-bold text-black mb-4">Simple, transparent pricing</h3>
            <p className="text-xl text-gray-600">Choose the plan that's right for you</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-200">
              <h4 className="text-2xl font-bold text-black mb-2">Free Trial</h4>
              <div className="flex items-baseline gap-2 mt-6 mb-8">
                <span className="text-6xl font-bold text-black">$0</span>
                <span className="text-xl text-gray-500">/14 days</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-gray-700">
                  <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-xs">✓</span>
                  </div>
                  <span>Up to 10 leads per month</span>
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-xs">✓</span>
                  </div>
                  <span>Basic AI responses</span>
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-xs">✓</span>
                  </div>
                  <span>Email support</span>
                </li>
              </ul>
              <Link href="/sign-up">
                <button className="w-full py-4 rounded-lg bg-gray-100 text-black font-semibold hover:bg-gray-200 transition-all">
                  Start free trial
                </button>
              </Link>
            </div>

            {/* Paid Plan */}
            <div className="bg-black rounded-2xl p-10 shadow-lg relative">
              <div className="absolute -top-4 left-8 bg-white text-black px-4 py-2 rounded-full text-xs font-bold">
                MOST POPULAR
              </div>
              <h4 className="text-2xl font-bold text-white mb-2 mt-2">Starter Plan</h4>
              <div className="flex items-baseline gap-2 mt-6 mb-8">
                <span className="text-6xl font-bold text-white">$29</span>
                <span className="text-xl text-gray-400">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-white">
                  <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                    <span className="text-xs text-black">✓</span>
                  </div>
                  <span>Unlimited leads</span>
                </li>
                <li className="flex items-center gap-3 text-white">
                  <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                    <span className="text-xs text-black">✓</span>
                  </div>
                  <span>Advanced AI agent</span>
                </li>
                <li className="flex items-center gap-3 text-white">
                  <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                    <span className="text-xs text-black">✓</span>
                  </div>
                  <span>Auto-scheduling</span>
                </li>
                <li className="flex items-center gap-3 text-white">
                  <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                    <span className="text-xs text-black">✓</span>
                  </div>
                  <span>All integrations</span>
                </li>
                <li className="flex items-center gap-3 text-white">
                  <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                    <span className="text-xs text-black">✓</span>
                  </div>
                  <span>Priority support</span>
                </li>
              </ul>
              <Link href="/sign-up">
                <button className="w-full py-4 rounded-lg bg-white text-black font-semibold hover:bg-gray-100 transition-all">
                  Get started
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 px-6 bg-white scroll-mt-20">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h3 className="text-5xl font-bold text-black mb-6">About LeaseAI</h3>
            <p className="text-xl text-gray-600 leading-relaxed">
              We're building the future of real estate automation. Our mission is to help real estate professionals 
              focus on what matters most — closing deals and building relationships.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="text-center">
              <div className="text-5xl font-bold text-black mb-2">10+</div>
              <p className="text-gray-600">Hours saved per week</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-black mb-2">95%</div>
              <p className="text-gray-600">Response rate</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-black mb-2">24/7</div>
              <p className="text-gray-600">AI availability</p>
            </div>
          </div>

          <div className="mt-16 text-center">
            <Link href="/sign-up">
              <button className="bg-black text-white px-10 py-5 rounded-lg text-lg font-semibold hover:bg-gray-800 transition-all">
                Start free trial
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-white font-bold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link href="#" className="text-gray-400 hover:text-white text-sm">About us</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white text-sm">Careers</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white text-sm">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link href="#" className="text-gray-400 hover:text-white text-sm">Features</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white text-sm">Pricing</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white text-sm">Demo</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><Link href="#" className="text-gray-400 hover:text-white text-sm">Help Center</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white text-sm">Blog</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white text-sm">API Docs</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link href="#" className="text-gray-400 hover:text-white text-sm">Privacy Policy</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white text-sm">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-500 text-sm">© 2026 LeaseAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}