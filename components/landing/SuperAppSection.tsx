"use client";

import React from "react";
import { Home, Users, FileText, DollarSign, Plus, Scan, ArrowRight, MessageCircle, Search, MoreHorizontal } from "lucide-react";

export default function SuperAppSection() {
  return (
    <section className="py-32 px-6 bg-white text-black overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="mb-20 text-center">
            <h2 className="text-[56px] md:text-[80px] font-semibold tracking-[-0.04em] leading-[0.95] mb-6">
            Any Workflow. <br /> One Super App.
            </h2>
            <p className="text-xl text-body-premium max-w-2xl mx-auto font-medium">
            Whether you manage a single unit or a thousand, everything runs on LeaseAI.
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            {/* 1. Properties - Bottom Sheet Style */}
            <MobileScreen title="Properties" subtitle="Portfolio">
                <BottomSheet>
                    <div className="flex justify-between items-center mb-6">
                        <div className="text-xs font-bold uppercase text-black/40">Recent Listings</div>
                        <MoreHorizontal size={16} className="text-black/40"/>
                    </div>
                    {/* Property Card */}
                    <div className="bg-gray-50 rounded-2xl p-3 mb-3 flex gap-3 items-center group cursor-pointer hover:bg-gray-100 transition-colors">
                        <div className="w-14 h-14 rounded-xl bg-gray-200 flex-shrink-0 relative overflow-hidden">
                             {/* Placeholder Image */}
                             <div className="absolute inset-0 bg-blue-100" />
                        </div>
                        <div className="flex-1">
                             <div className="text-sm font-bold text-black flex justify-between">
                                <span>Highland Ave</span>
                                <span className="text-green-600">$2,400</span>
                             </div>
                             <div className="text-xs font-medium text-black/50">2 Units • Vacant</div>
                        </div>
                    </div>
                    {/* Add Button */}
                    <div className="bg-black text-white rounded-xl p-3 flex items-center justify-center gap-2 font-semibold text-sm cursor-pointer hover:scale-[1.02] transition-transform">
                        <Plus size={16} /> Add Property
                    </div>
                </BottomSheet>
            </MobileScreen>


            {/* 2. Leasing - Bottom Sheet */}
            <MobileScreen title="Leasing" subtitle="Applications">
                <BottomSheet>
                   <div className="border-b border-gray-100 pb-4 mb-4">
                       <div className="flex justify-between items-center mb-2">
                           <span className="text-xs font-bold uppercase text-purple-600 bg-purple-50 px-2 py-1 rounded-md">New Applicant</span>
                           <span className="text-xs text-black/40">10m ago</span>
                       </div>
                       <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold">SJ</div>
                           <div>
                               <div className="font-bold text-black text-lg leading-none">Sarah Jenkins</div>
                               <div className="text-xs text-green-600 font-bold mt-1">Credit Score: 780</div>
                           </div>
                       </div>
                   </div>
                   <div className="flex gap-2">
                        <button className="flex-1 bg-black text-white text-xs font-bold py-3 rounded-xl hover:opacity-80">Review</button>
                        <button className="flex-1 bg-gray-100 text-black text-xs font-bold py-3 rounded-xl hover:bg-gray-200">Decline</button>
                   </div>
                </BottomSheet>
            </MobileScreen>


            {/* 3. Tenants - Bottom Sheet */}
            <MobileScreen title="Tenants" subtitle="Support">
                 <BottomSheet>
                     <div className="space-y-4">
                         {/* Tenant Msg */}
                         <div className="flex items-start gap-3">
                             <div className="w-8 h-8 rounded-full bg-yellow-100 flex-shrink-0" />
                             <div className="bg-gray-100 p-3 rounded-2xl rounded-tl-none text-sm text-black font-medium leading-tight">
                                Hi, is the gym open later today?
                             </div>
                         </div>
                         {/* AI Reply */}
                         <div className="flex items-end gap-3 flex-row-reverse">
                             <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-[8px] font-bold text-black flex-shrink-0">AI</div>
                             <div className="bg-green-500/10 text-green-800 p-3 rounded-2xl rounded-tr-none text-sm font-medium leading-tight border border-green-500/20">
                                Yes, the gym is open until 10 PM every day.
                             </div>
                         </div>
                         {/* Input Area */}
                         <div className="mt-2 bg-gray-50 rounded-full h-10 flex items-center px-4 text-xs text-black/30 truncate">
                            Type a message...
                         </div>
                     </div>
                 </BottomSheet>
            </MobileScreen>


            {/* 4. Financials - Bottom Sheet */}
            <MobileScreen title="Financials" subtitle="Revenue">
                <BottomSheet>
                     <div className="flex justify-between items-end mb-6">
                         <div>
                             <div className="text-xs font-bold uppercase text-black/40 mb-1">Total Balance</div>
                             <div className="text-3xl font-bold tracking-tighter text-black">$42,850</div>
                         </div>
                         <div className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">+12.4%</div>
                     </div>
                     {/* Mini Chart */}
                     <div className="h-16 flex items-end gap-1 mb-4">
                        {[30, 45, 35, 60, 50, 75, 65, 90].map((h, i) => (
                             <div key={i} className={`flex-1 rounded-t-sm transition-all ${i === 7 ? 'bg-orange-500' : 'bg-gray-100'}`} style={{ height: `${h}%` }} />
                        ))}
                     </div>
                     <div className="border-t border-gray-100 pt-3 flex justify-between items-center text-xs font-medium">
                         <span className="text-black/60">Last payout</span>
                         <span className="text-black">$12,400.00</span>
                     </div>
                </BottomSheet>
            </MobileScreen>

        </div>
      </div>
    </section>
  );
}

function MobileScreen({ title, subtitle, children }: any) {
    return (
        <div className="group relative h-[520px] w-full bg-[#0a0a0a] rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl transition-transform hover:-translate-y-2 duration-500">
             {/* Dynamic Gloss / Reflection */}
             <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-20 pointer-events-none" />
             
             <div className="p-8 relative z-10 flex flex-col h-full">
                 <div className="mb-6">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2">{subtitle}</p>
                    <h3 className="text-3xl font-bold tracking-tight text-white">{title}</h3>
                 </div>
                 
                 {/* The Children (Bottom Sheet) will be pushed to bottom via flex-grow or auto-margins inside? 
                     Actually, let's just render children. The BottomSheet component handles its own positioning/styling.
                  */}
                 {children}
             </div>
        </div>
    );
}

function BottomSheet({ children }: { children: React.ReactNode }) {
    return (
        <div className="absolute bottom-2 left-2 right-2 bg-white rounded-[2rem] p-5 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500 ease-out min-h-[50%] flex flex-col justify-end pb-8">
            <div className="h-1 w-12 bg-gray-200 rounded-full mx-auto mb-6 opacity-50" />
            <div className="flex-1">
                {children}
            </div>
        </div>
    )
}
