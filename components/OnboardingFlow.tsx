"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, Mail, Sparkles, Check,
  ArrowRight, Link as LinkIcon, User, Briefcase,
  Zap, Bot, Calendar, X
} from "lucide-react";

const ONBOARDING_KEY = "leaseai_onboarding_v1";

const ROLES = [
  { id: "landlord",   label: "Landlord",         icon: Building2 },
  { id: "manager",    label: "Property Manager",  icon: Briefcase },
  { id: "agent",      label: "Real Estate Agent", icon: User },
];

const FEATURES = [
  { icon: Bot,      title: "AI qualifies leads",          desc: "Responds to inquiries 24/7, collects all info" },
  { icon: Mail,     title: "Gmail auto-replies",          desc: "Every email gets a smart reply in seconds" },
  { icon: Calendar, title: "Books viewings automatically", desc: "Syncs with your Google Calendar" },
];

interface Props {
  userEmail?: string;
  userName?: string;
}

export default function OnboardingFlow({ userEmail: _userEmail, userName }: Props) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const [name, setName] = useState(userName || "");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [zillowUrl, setZillowUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importDone, setImportDone] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(ONBOARDING_KEY);
    if (!done) setVisible(true);
  }, []);

  const complete = () => {
    localStorage.setItem(ONBOARDING_KEY, "done");
    setVisible(false);
  };

  const next = () => {
    setDirection(1);
    if (step < 3) setStep(s => s + 1);
    else complete();
  };

  const back = () => {
    setDirection(-1);
    setStep(s => s - 1);
  };

  const handleImport = async () => {
    if (!zillowUrl.trim()) { next(); return; }
    setImporting(true);
    await new Promise(r => setTimeout(r, 2200));
    setImporting(false);
    setImportDone(true);
  };

  const handleGmail = () => {
    setConnecting(true);
    setTimeout(() => { setConnecting(false); next(); }, 1200);
  };

  if (!visible) return null;

  const variants = {
    enter: (d: number) => ({ opacity: 0, x: d * 40, scale: 0.98 }),
    center: { opacity: 1, x: 0, scale: 1 },
    exit:  (d: number) => ({ opacity: 0, x: d * -40, scale: 0.98 }),
  };

  // ── Input style ──────────────────────────────────────────────────────────
  const inputCls = [
    "w-full rounded-xl px-4 py-3 text-sm font-medium",
    "bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400",
    "focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400",
    "transition-all shadow-sm",
  ].join(" ");

  // ── Light card ───────────────────────────────────────────────────────────
  const cardCls = "bg-white border border-gray-100 rounded-2xl shadow-sm";

  const stepContent = [
    // ── STEP 0 — Welcome ───────────────────────────────────────
    <StepShell key="s0" badge="Welcome" title={<>Let&apos;s get you<br />set up in 2 min</>}
      subtitle="Tell us a bit about yourself so we can personalise your experience."
    >
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Your Name</label>
          <input className={inputCls} placeholder="e.g. Alex Johnson" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Company / Portfolio</label>
          <input className={inputCls} placeholder="e.g. Sunset Properties LLC" value={company} onChange={e => setCompany(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Your Role</label>
          <div className="grid grid-cols-3 gap-2">
            {ROLES.map(r => (
              <button
                key={r.id}
                onClick={() => setRole(r.id)}
                className={[
                  "rounded-xl px-3 py-3 flex flex-col items-center gap-1.5 transition-all border",
                  role === r.id
                    ? "bg-violet-50 border-violet-300 shadow-sm"
                    : "bg-white border-gray-200 hover:border-violet-200 hover:bg-violet-50/40",
                ].join(" ")}
              >
                <r.icon className={`w-4 h-4 ${role === r.id ? "text-violet-600" : "text-gray-400"}`} />
                <span className={`text-[11px] font-semibold text-center leading-tight ${role === r.id ? "text-violet-700" : "text-gray-500"}`}>
                  {r.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </StepShell>,

    // ── STEP 1 — Add Property ──────────────────────────────────
    <StepShell key="s1" badge="Step 1 of 3" title={<>Add your first<br />property</>}
      subtitle="Paste a Zillow URL and we'll import everything — photos, price, amenities — automatically."
    >
      <div className="space-y-3">
        <div className={`${cardCls} p-4 space-y-3`}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center">
              <LinkIcon className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Import from Zillow</span>
          </div>
          <input
            className={inputCls}
            placeholder="https://www.zillow.com/homedetails/…"
            value={zillowUrl}
            onChange={e => setZillowUrl(e.target.value)}
          />
          <button
            onClick={handleImport}
            disabled={importing || importDone}
            className={[
              "w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 border",
              importDone
                ? "bg-green-50 text-green-600 border-green-200"
                : "bg-gray-900 hover:bg-gray-800 text-white border-transparent shadow-sm",
            ].join(" ")}
          >
            {importDone ? (
              <><Check className="w-4 h-4" /> Property imported!</>
            ) : importing ? (
              <>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                  <Sparkles className="w-4 h-4 text-violet-400" />
                </motion.div>
                Importing…
              </>
            ) : (
              <><Zap className="w-4 h-4 text-yellow-400" /> Import Property</>
            )}
          </button>
        </div>

        <div className="relative flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 font-medium">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <button
          onClick={next}
          className="w-full py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-gray-600 border border-gray-200 hover:border-gray-300 transition-all"
        >
          Add manually later
        </button>
      </div>
    </StepShell>,

    // ── STEP 2 — Connect Gmail ─────────────────────────────────
    <StepShell key="s2" badge="Step 2 of 3" title={<>Connect your<br />Gmail inbox</>}
      subtitle="LeaseAI watches your inbox and instantly replies to rental inquiries — so you never miss a lead."
    >
      <div className="space-y-3">
        <div className={`${cardCls} p-4 space-y-3`}>
          {[
            { n: "1", text: "Tenant emails your Gmail" },
            { n: "2", text: "AI filters & reads the inquiry" },
            { n: "3", text: "Smart reply sent in seconds" },
          ].map(item => (
            <div key={item.n} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-violet-600">{item.n}</span>
              </div>
              <span className="text-sm text-gray-600 font-medium">{item.text}</span>
            </div>
          ))}
        </div>

        <button
          onClick={handleGmail}
          disabled={connecting}
          className="w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2.5 bg-white text-gray-800 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 shadow-sm"
        >
          {connecting ? (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
              <Sparkles className="w-4 h-4 text-violet-500" />
            </motion.div>
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          {connecting ? "Connecting…" : "Connect with Google"}
        </button>

        <button onClick={next} className="w-full py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-gray-600 transition-all">
          Skip for now
        </button>
      </div>
    </StepShell>,

    // ── STEP 3 — Ready ─────────────────────────────────────────
    <StepShell key="s3" badge="You're all set 🎉" title={<>Your AI agent<br />is live</>}
      subtitle="Here's what it can do for you from day one — no setup required."
    >
      <div className="space-y-2.5">
        {FEATURES.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.1, duration: 0.4 }}
            className={`${cardCls} p-4 flex items-start gap-3`}
          >
            <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0 mt-0.5">
              <f.icon className="w-4.5 h-4.5 text-violet-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{f.title}</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{f.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </StepShell>,
  ];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background: "rgba(235, 232, 228, 0.75)", backdropFilter: "blur(6px)" }}
        >
          {/* Soft pastel blobs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="animate-blob absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full bg-violet-200/40 blur-[110px]" />
            <div className="animate-blob animation-delay-2000 absolute top-1/2 -right-32 w-[440px] h-[440px] rounded-full bg-indigo-200/35 blur-[100px]" />
            <div className="animate-blob animation-delay-4000 absolute -bottom-32 left-1/3 w-[360px] h-[360px] rounded-full bg-sky-200/30 blur-[90px]" />
          </div>

          {/* Modal card */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 16 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md rounded-3xl overflow-hidden"
            style={{
              background: "rgba(253, 252, 250, 0.94)",
              backdropFilter: "blur(32px) saturate(130%)",
              WebkitBackdropFilter: "blur(32px) saturate(130%)",
              border: "1px solid rgba(0,0,0,0.06)",
              boxShadow: "0 40px 80px -16px rgba(0,0,0,0.10), 0 0 0 1px rgba(255,255,255,0.9) inset",
            }}
          >
            <div className="relative z-20 p-7">
              {/* Top bar */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center shadow-sm">
                    <span className="text-white font-black text-sm">L</span>
                  </div>
                  <span className="text-gray-900 font-bold text-sm tracking-tight">LeaseAI</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {[0, 1, 2, 3].map(i => (
                    <motion.div
                      key={i}
                      animate={{ width: i === step ? 20 : 6, opacity: i <= step ? 1 : 0.2 }}
                      transition={{ duration: 0.3 }}
                      className={`h-1.5 rounded-full ${i === step ? "bg-violet-500" : i < step ? "bg-violet-300" : "bg-gray-300"}`}
                    />
                  ))}
                </div>

                {step < 3 && (
                  <button
                    onClick={complete}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    Skip
                  </button>
                )}
              </div>

              {/* Step content */}
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={step}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                >
                  {stepContent[step]}
                </motion.div>
              </AnimatePresence>

              {/* CTA buttons */}
              <div className="mt-6 flex items-center gap-3">
                {step > 0 && (
                  <button
                    onClick={back}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-700 border border-gray-200 hover:border-gray-300 transition-all"
                  >
                    Back
                  </button>
                )}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    if (step === 1 && importing) return;
                    next();
                  }}
                  className="flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                  style={{
                    background: step === 3
                      ? "linear-gradient(135deg, #7c3aed, #4f46e5)"
                      : "#111111",
                    color: "#fff",
                    border: "none",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      step === 3 ? "linear-gradient(135deg, #6d28d9, #4338ca)" : "#333";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      step === 3 ? "linear-gradient(135deg, #7c3aed, #4f46e5)" : "#111";
                  }}
                >
                  {step === 0 && <><ArrowRight className="w-4 h-4" /> Continue</>}
                  {step === 1 && <><ArrowRight className="w-4 h-4" /> {importDone ? "Next step" : "Continue"}</>}
                  {step === 2 && <><ArrowRight className="w-4 h-4" /> Continue</>}
                  {step === 3 && <><Sparkles className="w-4 h-4" /> Go to dashboard</>}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Shared step shell ────────────────────────────────────────────────────────
function StepShell({
  badge, title, subtitle, children,
}: {
  badge: string;
  title: React.ReactNode;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 border border-violet-100 mb-4">
        <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
        <span className="text-[11px] font-bold text-violet-600 uppercase tracking-wider">{badge}</span>
      </div>

      <h2 className="text-[28px] font-bold text-gray-900 leading-[1.1] tracking-[-0.03em] mb-2">
        {title}
      </h2>

      <p className="text-sm text-gray-500 leading-relaxed mb-5">{subtitle}</p>

      {children}
    </div>
  );
}
