"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import Link from "next/link";

export default function BillingPage() {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("No checkout URL returned");
        setLoading(false);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Uber Style */}
      <header className="bg-black">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/dashboard">
            <h1 className="text-2xl font-bold text-white cursor-pointer">LeaseAI</h1>
          </Link>
          <Link href="/dashboard">
            <button className="bg-white text-black px-4 py-2 rounded font-semibold hover:bg-gray-100 transition-all">
              Dashboard
            </button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-6 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Title */}
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-black mb-4">Choose Your Plan</h2>
            <p className="text-xl text-gray-600">
              Start automating your real estate business today
            </p>
          </div>

          {/* Pricing Cards - Uber Style */}
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-20">
            {/* Free Trial */}
            <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-200">
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-black mb-2">Free Trial</h3>
                <div className="flex items-baseline gap-2 mt-6">
                  <span className="text-6xl font-bold text-black">$0</span>
                  <span className="text-xl text-gray-500">/14 days</span>
                </div>
              </div>

              <ul className="space-y-4 mb-10">
                <li className="flex items-start gap-3 text-gray-700">
                  <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-gray-700" />
                  </div>
                  <span>Up to 10 leads per month</span>
                </li>
                <li className="flex items-start gap-3 text-gray-700">
                  <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-gray-700" />
                  </div>
                  <span>Basic AI auto-responses</span>
                </li>
                <li className="flex items-start gap-3 text-gray-700">
                  <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-gray-700" />
                  </div>
                  <span>Email support</span>
                </li>
              </ul>

              <button 
                disabled
                className="w-full py-4 rounded-lg bg-gray-100 text-gray-500 font-semibold cursor-not-allowed"
              >
                Current Plan
              </button>
            </div>

            {/* Starter Plan */}
            <div className="bg-black rounded-2xl p-10 relative shadow-lg">
              <div className="absolute -top-4 left-8 bg-white text-black px-4 py-2 rounded-full text-xs font-bold">
                MOST POPULAR
              </div>

              <div className="mb-8 mt-2">
                <h3 className="text-2xl font-bold text-white mb-2">Starter Plan</h3>
                <div className="flex items-baseline gap-2 mt-6">
                  <span className="text-6xl font-bold text-white">$29</span>
                  <span className="text-xl text-gray-400">/month</span>
                </div>
              </div>

              <ul className="space-y-4 mb-10">
                <li className="flex items-start gap-3 text-white">
                  <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-black" />
                  </div>
                  <span>Unlimited leads</span>
                </li>
                <li className="flex items-start gap-3 text-white">
                  <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-black" />
                  </div>
                  <span>Advanced AI agent with qualification</span>
                </li>
                <li className="flex items-start gap-3 text-white">
                  <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-black" />
                  </div>
                  <span>Auto-scheduling with Calendly</span>
                </li>
                <li className="flex items-start gap-3 text-white">
                  <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-black" />
                  </div>
                  <span>Email & SMS integrations</span>
                </li>
                <li className="flex items-start gap-3 text-white">
                  <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-black" />
                  </div>
                  <span>Analytics dashboard</span>
                </li>
                <li className="flex items-start gap-3 text-white">
                  <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-black" />
                  </div>
                  <span>Priority support</span>
                </li>
              </ul>

              <button 
                onClick={handleCheckout}
                disabled={loading}
                className="w-full py-4 rounded-lg bg-white text-black font-semibold hover:bg-gray-100 transition-all disabled:opacity-50"
              >
                {loading ? "Processing..." : "Upgrade Now"}
              </button>
            </div>
          </div>

          {/* FAQ - Uber Style */}
          <div className="max-w-4xl mx-auto">
            <h3 className="text-3xl font-bold text-black mb-10">
              Frequently Asked Questions
            </h3>
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
                <h4 className="font-semibold text-lg text-black mb-3">Can I cancel anytime?</h4>
                <p className="text-gray-600 leading-relaxed">
                  Yes, you can cancel your subscription at any time. No questions asked.
                </p>
              </div>
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
                <h4 className="font-semibold text-lg text-black mb-3">
                  Do I need a credit card for the trial?
                </h4>
                <p className="text-gray-600 leading-relaxed">
                  No credit card required for the 14-day free trial. You'll only be charged when you upgrade.
                </p>
              </div>
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
                <h4 className="font-semibold text-lg text-black mb-3">
                  What payment methods do you accept?
                </h4>
                <p className="text-gray-600 leading-relaxed">
                  We accept all major credit cards through Stripe's secure payment processing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
