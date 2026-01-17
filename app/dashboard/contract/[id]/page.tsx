"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, Share2, Clock, Check, MoreVertical, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, ListOrdered } from "lucide-react";
import Link from "next/link";

export default function ContractEditorPage() {
  const params = useParams();
  const router = useRouter();
  const contractId = parseInt(params.id as string);
  
  const [contractContent, setContractContent] = useState("");
  const [contractName, setContractName] = useState("");
  const [lastSaved, setLastSaved] = useState("Just now");
  const [isSaving, setIsSaving] = useState(false);

  // Mock contract data
  const contracts = [
    {
      id: 1,
      name: "Lease_123MainSt_JohnSmith",
      property: "123 Main Street, Bellevue, WA",
      tenant: "John Smith",
      status: "Active",
      content: `RESIDENTIAL LEASE AGREEMENT

This Lease Agreement ("Agreement") is entered into on January 1, 2024, between:

LANDLORD: [Your Name]
Address: [Your Address]
Phone: [Your Phone]
Email: [Your Email]

TENANT: John Smith
Phone: +1-425-3250400
Email: john.smith@email.com

PROPERTY ADDRESS: 123 Main Street, Bellevue, WA

1. TERM OF LEASE
The term of this lease shall commence on January 1, 2024 and end on December 31, 2024.

2. RENT
The monthly rent for the Property is $3,500.00, payable on the first day of each month. Payment shall be made to the Landlord at the address specified above or via electronic transfer.

3. SECURITY DEPOSIT
A security deposit of $3,500.00 is required upon signing this Agreement. The deposit will be held in accordance with state law and returned within 30 days after the termination of this lease, less any lawful deductions.

4. UTILITIES
The Tenant is responsible for the following utilities:
- Electricity
- Gas
- Water and Sewer
- Internet and Cable

5. MAINTENANCE AND REPAIRS
The Landlord shall maintain the Property in habitable condition and make necessary repairs. The Tenant shall maintain the Property in clean condition and notify the Landlord of any needed repairs promptly.

6. PETS
Pets are allowed with prior written consent and payment of additional pet deposit of $500.

7. OCCUPANCY
The Property shall be occupied only by the Tenant and immediate family members, not to exceed 4 persons.

8. TERMINATION
Either party may terminate this Agreement with 30 days written notice.

9. GOVERNING LAW
This Agreement shall be governed by the laws of the State of Washington.

SIGNATURES:

Landlord: _____________________ Date: _____

Tenant: _______________________ Date: _____`
    },
    {
      id: 2,
      name: "Lease_789PineRd_EmilyDavis",
      property: "789 Pine Road, Redmond, WA",
      tenant: "Emily Davis",
      status: "Pending",
      content: "Draft contract content for 789 Pine Road..."
    },
  ];

  const contract = contracts.find(c => c.id === contractId) || contracts[0];

  useEffect(() => {
    setContractName(contract.name);
    setContractContent(contract.content);
  }, [contractId]);

  // Auto-save simulation
  useEffect(() => {
    if (contractContent !== contract.content) {
      setIsSaving(true);
      const timer = setTimeout(() => {
        setIsSaving(false);
        setLastSaved("Just now");
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [contractContent]);

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([contractContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${contractName}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Google Docs style */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 py-3">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Link href="/dashboard?tab=contracts">
                <button className="w-10 h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-all">
                  <ArrowLeft className="w-5 h-5 text-gray-700" />
                </button>
              </Link>
              <div>
                <input
                  type="text"
                  value={contractName}
                  onChange={(e) => setContractName(e.target.value)}
                  className="text-lg font-semibold text-black bg-transparent border-none focus:outline-none focus:bg-gray-50 px-2 py-1 rounded"
                />
                <div className="flex items-center gap-2 text-sm text-gray-600 px-2">
                  {isSaving ? (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Check className="w-3 h-3 text-green-600" />
                      Saved {lastSaved}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-all flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <button className="px-4 py-2 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-lg transition-all flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                Share
              </button>
              <button className="w-10 h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-all">
                <MoreVertical className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-1 px-2 py-2 border-t border-gray-200">
            <button className="w-8 h-8 rounded hover:bg-gray-100 flex items-center justify-center transition-all" title="Bold">
              <Bold className="w-4 h-4 text-gray-700" />
            </button>
            <button className="w-8 h-8 rounded hover:bg-gray-100 flex items-center justify-center transition-all" title="Italic">
              <Italic className="w-4 h-4 text-gray-700" />
            </button>
            <button className="w-8 h-8 rounded hover:bg-gray-100 flex items-center justify-center transition-all" title="Underline">
              <Underline className="w-4 h-4 text-gray-700" />
            </button>
            
            <div className="w-px h-6 bg-gray-300 mx-2" />
            
            <button className="w-8 h-8 rounded hover:bg-gray-100 flex items-center justify-center transition-all" title="Align Left">
              <AlignLeft className="w-4 h-4 text-gray-700" />
            </button>
            <button className="w-8 h-8 rounded hover:bg-gray-100 flex items-center justify-center transition-all" title="Align Center">
              <AlignCenter className="w-4 h-4 text-gray-700" />
            </button>
            <button className="w-8 h-8 rounded hover:bg-gray-100 flex items-center justify-center transition-all" title="Align Right">
              <AlignRight className="w-4 h-4 text-gray-700" />
            </button>
            
            <div className="w-px h-6 bg-gray-300 mx-2" />
            
            <button className="w-8 h-8 rounded hover:bg-gray-100 flex items-center justify-center transition-all" title="Bulleted List">
              <List className="w-4 h-4 text-gray-700" />
            </button>
            <button className="w-8 h-8 rounded hover:bg-gray-100 flex items-center justify-center transition-all" title="Numbered List">
              <ListOrdered className="w-4 h-4 text-gray-700" />
            </button>
          </div>
        </div>
      </header>

      {/* Editor Content */}
      <div className="max-w-[850px] mx-auto py-12 px-4">
        <div className="bg-white shadow-lg rounded-lg">
          <textarea
            value={contractContent}
            onChange={(e) => setContractContent(e.target.value)}
            className="w-full min-h-[1100px] p-16 text-base leading-relaxed text-gray-900 font-serif resize-none focus:outline-none"
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              lineHeight: "1.8",
            }}
          />
        </div>
      </div>
    </div>
  );
}
