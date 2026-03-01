"use client";

import React, { useState } from "react";
import { Plus, Minus } from "lucide-react";

const faqs = [
  {
    question: "What makes LeaseAI a 'Super App'?",
    answer: "LeaseAI combines every tool you need—property management, CRM, financial reporting, and AI communication—into a single, unified operating system. No more switching between 5 different apps.",
  },
  {
    question: "How does the autonomous qualification work?",
    answer: "Our AI agents engage leads instantly across Zillow, email, and SMS. They ask pre-screening questions, verify income documents, and check credit scores 24/7, presenting you with only the most qualified tenants.",
  },
  {
    question: "Can I manage both residential and commercial?",
    answer: "Yes. LeaseAI is built to handle complex portfolios including multi-family, single-family, and commercial properties with custom workflows for each asset class.",
  },
  {
    question: "How long does it take to migrate my data?",
    answer: "Most users are up and running in under 10 minutes. We provide one-click imports for spreadsheets and direct integrations with major legacy software.",
  },
  {
    question: "Is there a limit to the number of units?",
    answer: "No. Our infrastructure scales automatically whether you manage 10 units or 10,000. The interface remains fast and responsive at any scale.",
  },
  {
    question: "I have more questions, who can I contact?",
    answer: "You can chat with our support team directly in the app or email support@leaseai.com. We typically respond within 15 minutes.",
  },
];

export default function FAQSection() {
  return (
    <section className="py-32 px-6 bg-white">
      <div className="max-w-7xl mx-auto grid md:grid-cols-12 gap-12 items-start">
        
        {/* Left Column: Header */}
        <div className="md:col-span-5">
           <h2 className="text-[56px] font-semibold tracking-tight text-black leading-[0.95] mb-6">
              Frequently Asked Questions
           </h2>
           <p className="text-lg text-black/60 font-medium max-w-md">
              Get answers to commonly asked questions about LeaseAI, our features, and how we can turn your real estate business into a Super App.
           </p>
        </div>

        {/* Right Column: Accordion */}
        <div className="md:col-span-7 space-y-4">
           {faqs.map((faq, index) => (
             <FAQItem key={index} question={faq.question} answer={faq.answer} />
           ))}
        </div>

      </div>
    </section>
  );
}

function FAQItem({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white rounded-2xl p-6 cursor-pointer hover:shadow-lg transition-all duration-300 border border-black/5"
    >
      <div className="flex justify-between items-center gap-4">
        <h3 className="text-lg font-semibold text-black">{question}</h3>
        <span className={`p-2 rounded-full bg-gray-50 text-black transition-transform duration-300 ${isOpen ? "rotate-45" : "rotate-0"}`}>
            <Plus size={20} />
        </span>
      </div>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-[200px] opacity-100 mt-4" : "max-h-0 opacity-0"}`}>
        <p className="text-black/60 font-medium leading-relaxed">
            {answer}
        </p>
      </div>
    </div>
  );
}
