"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, DollarSign, FileText, MessageSquare, Download, Send } from "lucide-react";
import Link from "next/link";

export default function TenantDetailPage() {
  const params = useParams();
  const tenantId = parseInt(params.id as string);
  const [activeTab, setActiveTab] = useState("overview");
  const [messageInput, setMessageInput] = useState("");

  // Mock tenant data
  const tenants = [
    {
      id: 1,
      name: "John Smith",
      avatar: "https://ui-avatars.com/api/?name=John+Smith&background=3B82F6&color=fff",
      email: "john.smith@email.com",
      phone: "+1-425-3250400",
      property: "123 Main Street, Bellevue, WA",
      status: "Active",
      leaseStart: "Jan 1, 2024",
      leaseEnd: "Dec 31, 2024",
      rentAmount: "$3,500",
      paymentStatus: "Paid",
      moveInDate: "Jan 1, 2024",
      emergencyContact: "Jane Smith - +1-425-5550000",
      notes: "Excellent tenant, always pays on time. Requested early lease renewal.",
    },
    {
      id: 2,
      name: "Emily Davis",
      avatar: "https://ui-avatars.com/api/?name=Emily+Davis&background=EF4444&color=fff",
      email: "emily.davis@email.com",
      phone: "+1-206-5551234",
      property: "789 Pine Road, Redmond, WA",
      status: "Late Payment",
      leaseStart: "Feb 1, 2024",
      leaseEnd: "Jan 31, 2025",
      rentAmount: "$5,800",
      paymentStatus: "Overdue",
      moveInDate: "Feb 1, 2024",
      emergencyContact: "Mark Davis - +1-206-5559876",
      notes: "Payment overdue by 35 days. Follow-up required.",
    },
    {
      id: 3,
      name: "Sarah Johnson",
      avatar: "https://ui-avatars.com/api/?name=Sarah+Johnson&background=10B981&color=fff",
      email: "sarah.j@email.com",
      phone: "+1-425-5559876",
      property: "555 Maple Drive, Bellevue, WA",
      status: "Current",
      leaseStart: "Mar 15, 2024",
      leaseEnd: "Mar 14, 2025",
      rentAmount: "$6,500",
      paymentStatus: "Paid",
      moveInDate: "Mar 15, 2024",
      emergencyContact: "Tom Johnson - +1-425-5554321",
      notes: "Great tenant, very responsive. No issues.",
    },
    {
      id: 4,
      name: "Mike Chen",
      avatar: "https://ui-avatars.com/api/?name=Mike+Chen&background=F59E0B&color=fff",
      email: "mike.chen@email.com",
      phone: "+1-206-5554321",
      property: "456 Oak Avenue, Seattle, WA",
      status: "Archived",
      leaseStart: "Dec 1, 2023",
      leaseEnd: "Nov 30, 2024",
      rentAmount: "$4,200",
      paymentStatus: "Completed",
      moveInDate: "Dec 1, 2023",
      emergencyContact: "Lisa Chen - +1-206-5558765",
      notes: "Moved out last month. Left property in excellent condition.",
    },
    {
      id: 5,
      name: "David Lee",
      avatar: "https://ui-avatars.com/api/?name=David+Lee&background=8B5CF6&color=fff",
      email: "david.lee@email.com",
      phone: "+1-425-5552468",
      property: "321 Cedar Lane, Kirkland, WA",
      status: "Pending",
      leaseStart: "Feb 1, 2024",
      leaseEnd: "Jan 31, 2025",
      rentAmount: "$4,800",
      paymentStatus: "Deposit Paid",
      moveInDate: "Feb 1, 2024",
      emergencyContact: "Maria Lee - +1-425-5557654",
      notes: "Application approved, waiting for lease signing.",
    },
    {
      id: 6,
      name: "Anna White",
      avatar: "https://ui-avatars.com/api/?name=Anna+White&background=EC4899&color=fff",
      email: "anna.white@email.com",
      phone: "+1-206-5557890",
      property: "777 Elm Street, Bellevue, WA",
      status: "Current",
      leaseStart: "Jan 15, 2024",
      leaseEnd: "Jan 14, 2025",
      rentAmount: "$3,200",
      paymentStatus: "Paid",
      moveInDate: "Jan 15, 2024",
      emergencyContact: "Robert White - +1-206-5556543",
      notes: "New tenant, very professional. Works from home.",
    },
  ];

  const tenant = tenants.find(t => t.id === tenantId) || tenants[0];

  // Mock messages
  const messages = [
    { id: 1, sender: "tenant", text: "Hi, I have a question about the water heater.", time: "10:30 AM", date: "Today" },
    { id: 2, sender: "landlord", text: "Hello John! What seems to be the issue?", time: "10:35 AM", date: "Today" },
    { id: 3, sender: "tenant", text: "It's making a strange noise. Can you send someone to check?", time: "10:40 AM", date: "Today" },
    { id: 4, sender: "landlord", text: "Of course! I'll arrange for a technician to visit tomorrow morning.", time: "10:45 AM", date: "Today" },
    { id: 5, sender: "tenant", text: "Thank you! Also, the rent for next month - same account?", time: "2 days ago", date: "Jan 15" },
    { id: 6, sender: "landlord", text: "Yes, same account. Payment is due on the 1st.", time: "2 days ago", date: "Jan 15" },
  ];

  // Mock documents
  const documents = [
    { id: 1, name: "Lease_Agreement_2024.pdf", type: "Contract", date: "Jan 1, 2024", size: "2.4 MB" },
    { id: 2, name: "ID_JohnSmith.pdf", type: "Identification", date: "Dec 15, 2023", size: "1.1 MB" },
    { id: 3, name: "Background_Check.pdf", type: "Verification", date: "Dec 10, 2023", size: "850 KB" },
    { id: 4, name: "Move_In_Checklist.pdf", type: "Inspection", date: "Jan 1, 2024", size: "650 KB" },
  ];

  // Mock payments
  const payments = [
    { id: 1, date: "Jan 1, 2024", amount: "$3,500", status: "Paid", method: "Bank Transfer", reference: "TXN-2024-001" },
    { id: 2, date: "Dec 1, 2023", amount: "$3,500", status: "Paid", method: "Bank Transfer", reference: "TXN-2023-012" },
    { id: 3, date: "Nov 1, 2023", amount: "$3,500", status: "Paid", method: "Bank Transfer", reference: "TXN-2023-011" },
    { id: 4, date: "Oct 1, 2023", amount: "$3,500", status: "Paid", method: "Bank Transfer", reference: "TXN-2023-010" },
  ];

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      console.log("Sending message:", messageInput);
      setMessageInput("");
    }
  };

  return (
    <div className="p-10">
      {/* Back Button */}
      <div className="mb-6">
        <Link href="/dashboard?tab=tenants">
          <button className="flex items-center gap-2 text-gray-700 hover:text-black font-semibold transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Back to Tenants
          </button>
        </Link>
      </div>

      {/* Header Card */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-6">
            <img
              src={tenant.avatar}
              alt={tenant.name}
              className="w-24 h-24 rounded-full"
            />
            <div>
              <h1 className="text-3xl font-bold text-black mb-2">{tenant.name}</h1>
              <div className="flex items-center gap-4 mb-3">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${
                  tenant.status === "Active" 
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-700"
                }`}>
                  {tenant.status}
                </span>
                <span className="text-gray-600">•</span>
                <span className="text-gray-600">Lease ends {tenant.leaseEnd}</span>
              </div>
              <div className="flex items-center gap-4 text-gray-600">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">{tenant.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">{tenant.phone}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all flex items-center gap-2 font-medium">
              <Phone className="w-4 h-4" />
              Call
            </button>
            <button className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all flex items-center gap-2 font-medium">
              <MessageSquare className="w-4 h-4" />
              Message
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex items-center gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === "overview"
                ? "border-b-2 border-black text-black"
                : "text-gray-600 hover:text-black"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("messages")}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === "messages"
                ? "border-b-2 border-black text-black"
                : "text-gray-600 hover:text-black"
            }`}
          >
            Messages
          </button>
          <button
            onClick={() => setActiveTab("documents")}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === "documents"
                ? "border-b-2 border-black text-black"
                : "text-gray-600 hover:text-black"
            }`}
          >
            Documents
          </button>
          <button
            onClick={() => setActiveTab("payments")}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === "payments"
                ? "border-b-2 border-black text-black"
                : "text-gray-600 hover:text-black"
            }`}
          >
            Payments
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Property Info */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-xl font-bold text-black mb-4">Property Information</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="font-medium text-black">{tenant.property}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Monthly Rent</p>
                  <p className="font-medium text-black">{tenant.rentAmount}/mo</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Lease Period</p>
                  <p className="font-medium text-black">{tenant.leaseStart} - {tenant.leaseEnd}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Move-In Date</p>
                  <p className="font-medium text-black">{tenant.moveInDate}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-xl font-bold text-black mb-4">Contact Information</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 mb-1">Emergency Contact</p>
                <p className="font-medium text-black">{tenant.emergencyContact}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Payment Status</p>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${
                  tenant.paymentStatus === "Paid"
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}>
                  {tenant.paymentStatus}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Notes</p>
                <p className="text-black">{tenant.notes}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "messages" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 max-h-[700px] flex flex-col">
          {/* Messages */}
          <div className="p-6 flex-1 overflow-y-auto space-y-4">
            {messages.map((message) => (
              <div key={message.id}>
                {/* Date divider */}
                {messages.findIndex(m => m.id === message.id) === 0 || 
                 messages[messages.findIndex(m => m.id === message.id) - 1].date !== message.date ? (
                  <div className="flex items-center justify-center my-4">
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                      {message.date}
                    </span>
                  </div>
                ) : null}
                
                <div className={`flex ${message.sender === "landlord" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] rounded-xl px-4 py-3 ${
                    message.sender === "landlord"
                      ? "bg-black text-white"
                      : "bg-gray-100 text-black"
                  }`}>
                    <p>{message.text}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender === "landlord" ? "text-gray-300" : "text-gray-500"
                    }`}>
                      {message.time}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type your message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
              <button
                onClick={handleSendMessage}
                className="w-10 h-10 bg-black text-white rounded-lg flex items-center justify-center hover:bg-gray-800 transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "documents" && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-black">{doc.name}</p>
                    <p className="text-sm text-gray-600">{doc.type} • {doc.date} • {doc.size}</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all flex items-center gap-2 text-sm font-medium">
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "payments" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Method</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Reference</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-900">{payment.date}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-black">{payment.amount}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{payment.method}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-mono">{payment.reference}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                      {payment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
