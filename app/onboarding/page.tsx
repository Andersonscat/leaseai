"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, ArrowRight, Building2, Mail,
  User, Briefcase, Link as LinkIcon, Zap, Sparkles
} from "lucide-react";
import { createSupabaseClient } from "@/lib/supabase";

// localStorage key — only used as a fast client-side cache
const LS_KEY = "leaseai_onboarding_done";

const STEPS = [
  { id: "profile",  label: "Your profile"   },
  { id: "connect",  label: "Connect Gmail"  },
  { id: "property", label: "Add property"   },
];

const ROLES = [
  { id: "landlord", label: "Landlord",         icon: Building2 },
  { id: "manager",  label: "Property Manager", icon: Briefcase },
  { id: "agent",    label: "Real Estate Agent", icon: User },
];

export default function OnboardingPageWrapper() {
  return (
    <Suspense fallback={null}>
      <OnboardingPage />
    </Suspense>
  );
}

function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createSupabaseClient();

  // ?force=true — bypasses completion check (for previewing/testing)
  const forceShow = searchParams.get("force") === "true";

  const [checking, setChecking] = useState(true);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  // form state
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [zillowUrl, setZillowUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);
  const [importError, setImportError] = useState("");
  const [importedProperty, setImportedProperty] = useState<any>(null);
  const [connecting, setConnecting] = useState(false);
  const [gmailConnected, setGmailConnected] = useState(false);

  // On mount: check DB first, then localStorage cache
  useEffect(() => {
    const check = async () => {
      // ?force=true — skip all checks, just show onboarding
      if (!forceShow) {
        // Fast path: localStorage cache hit
        if (localStorage.getItem(LS_KEY)) {
          router.replace("/dashboard");
          return;
        }

        // Authoritative check: Supabase user metadata
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.user_metadata?.onboarding_done) {
          localStorage.setItem(LS_KEY, "done");
          router.replace("/dashboard");
          return;
        }
      }

      // Pre-fill with previously saved data (or from OAuth provider)
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser?.user_metadata?.full_name) setName(currentUser.user_metadata.full_name);
      if (currentUser?.user_metadata?.company)   setCompany(currentUser.user_metadata.company);
      if (currentUser?.user_metadata?.role)      setRole(currentUser.user_metadata.role);

      // If returning from Google OAuth (gmail connect step)
      const { data: { session } } = await supabase.auth.getSession();
      const hasGoogleToken = session?.provider_token != null;
      if (hasGoogleToken && !forceShow) {
        await supabase.auth.updateUser({ data: { gmail_connected: true } });
        setGmailConnected(true);
        setStep(2);
      }

      setChecking(false);
    };

    check();
  }, [router, supabase, forceShow]);

  const finish = async () => {
    // Save all collected data to Supabase user metadata
    await supabase.auth.updateUser({
      data: {
        onboarding_done: true,
        // Only overwrite if user actually filled these in
        ...(name.trim()    && { full_name: name.trim() }),
        ...(company.trim() && { company:   company.trim() }),
        ...(role           && { role }),
      }
    });

    // Cache locally for fast future checks
    localStorage.setItem(LS_KEY, "done");

    router.replace("/dashboard");
  };

  const next = async () => {
    setDirection(1);

    // Save profile when leaving step 0
    if (step === 0) {
      await supabase.auth.updateUser({
        data: {
          ...(name.trim()    && { full_name: name.trim() }),
          ...(company.trim() && { company:   company.trim() }),
          ...(role           && { role }),
        }
      });
    }

    if (step < STEPS.length - 1) setStep(s => s + 1);
    else finish();
  };

  const goTo = (i: number) => {
    if (i < step) { setDirection(-1); setStep(i); }
  };

  const handleImport = async () => {
    if (!zillowUrl.trim()) { next(); return; }
    setImporting(true);
    setImportError("");

    try {
      // Step 1: Scrape Zillow URL via existing AI import API
      const scrapeRes = await fetch("/api/properties/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: zillowUrl.trim() }),
      });

      if (!scrapeRes.ok) {
        const err = await scrapeRes.json();
        throw new Error(err.error || "Failed to import property");
      }

      const { data: extracted } = await scrapeRes.json();

      // Step 2: Save property to database via existing properties API
      const saveRes = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type:        extracted.type     || "rent",
          address:     extracted.address  || "Unknown address",
          city:        extracted.city     || "",
          state:       extracted.state    || "",
          zip_code:    extracted.zip_code || "",
          price:       extracted.price    || 0,
          beds:        extracted.beds  ?? 0,
          baths:       extracted.baths ?? 1,
          sqft:        extracted.sqft     || null,
          description: extracted.description || "",
          amenities:   extracted.amenities  || [],
          features:    extracted.features   || [],
          rules:       extracted.rules      || [],
          pets:        extracted.pets    || "No pets",
          parking:     extracted.parking || "No parking",
          images:      extracted.imagePreviews || [],
          status:      "available",
          ai_assisted: true,
        }),
      });

      if (!saveRes.ok) {
        const err = await saveRes.json();
        throw new Error(err.error || "Failed to save property");
      }

      const { property: savedProperty } = await saveRes.json();
      setImportedProperty(savedProperty);
      setImported(true);
    } catch (err: any) {
      setImportError(err.message || "Something went wrong");
    } finally {
      setImporting(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/onboarding`,
          scopes: [
            'email',
            'profile',
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events',
            'https://www.googleapis.com/auth/gmail.modify',
            'https://www.googleapis.com/auth/gmail.send',
          ].join(' '),
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;
      // Redirect handled by OAuth callback — finish() called on return
    } catch {
      setConnecting(false);
    }
  };

  const canContinue = step === 0 ? name.trim().length > 0 : true;

  // Show nothing while checking auth / onboarding status
  if (checking) return null;

  const variants = {
    enter: (d: number) => ({ opacity: 0, x: d > 0 ? 40 : -40 }),
    center: { opacity: 1, x: 0 },
    exit:  (d: number) => ({ opacity: 0, x: d > 0 ? -40 : 40 }),
  };

  const inputCls = [
    "w-full px-4 py-3 rounded-xl text-sm font-medium transition-all",
    "focus:outline-none focus:ring-2",
  ].join(" ");

  const inputStyle = {
    backgroundColor: "#ffffff",
    border: "1px solid rgba(0,0,0,0.12)",
    color: "#171717",
  };

  const stepContent = [
    // ── Step 0: Profile ──────────────────────────────────────────────────────
    <div key="profile" className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-1" style={{ color: "#171717" }}>
          Tell us about yourself
        </h2>
        <p className="text-sm" style={{ color: "#5e5e5e" }}>
          We'll personalise your experience based on your role.
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#5e5e5e" }}>
            Full name <span style={{ color: "#e05c4b" }}>*</span>
          </label>
          <input
            className={inputCls}
            style={inputStyle}
            placeholder="Alex Johnson"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#5e5e5e" }}>
            Company or portfolio name
          </label>
          <input
            className={inputCls}
            style={inputStyle}
            placeholder="Sunset Properties LLC"
            value={company}
            onChange={e => setCompany(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#5e5e5e" }}>
            I am a…
          </label>
          <div className="grid grid-cols-3 gap-2">
            {ROLES.map(r => {
              const RoleIcon = r.icon;
              return (
                <button
                  key={r.id}
                  onClick={() => setRole(r.id)}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl text-center transition-all"
                  style={{
                    backgroundColor: role === r.id ? "#171717" : "#ffffff",
                    border: `1px solid ${role === r.id ? "#171717" : "rgba(0,0,0,0.12)"}`,
                    color: role === r.id ? "#ffffff" : "#5e5e5e",
                  }}
                >
                  <RoleIcon className="w-5 h-5" strokeWidth={1.6} />
                  <span className="text-xs font-semibold leading-tight">{r.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>,

    // ── Step 1: Gmail ────────────────────────────────────────────────────────
    <div key="connect" className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-1" style={{ color: "#171717" }}>
          Connect your Gmail
        </h2>
        <p className="text-sm" style={{ color: "#5e5e5e" }}>
          Your AI agent reads incoming rental inquiries and replies instantly — 24/7.
        </p>
      </div>

      <div className="rounded-2xl p-5 space-y-4" style={{ backgroundColor: "#ffffff", border: "1px solid rgba(0,0,0,0.08)" }}>
        {[
          { n: "1", text: "Tenant sends email to your Gmail" },
          { n: "2", text: "AI reads & qualifies the inquiry" },
          { n: "3", text: "Smart reply sent in seconds" },
        ].map(item => (
          <div key={item.n} className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#f9f9f9", border: "1px solid rgba(0,0,0,0.1)" }}>
              <span className="text-[11px] font-bold" style={{ color: "#171717" }}>{item.n}</span>
            </div>
            <span className="text-sm font-medium" style={{ color: "#171717" }}>{item.text}</span>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {gmailConnected ? (
          <div
            className="w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2.5"
            style={{ backgroundColor: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", color: "#16a34a" }}
          >
            <Check className="w-4 h-4" strokeWidth={3} />
            Gmail & Calendar connected!
          </div>
        ) : (
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2.5 transition-all"
            style={{ backgroundColor: "#ffffff", border: "1px solid rgba(0,0,0,0.15)", color: "#171717" }}
          >
            {connecting ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}>
                <Sparkles className="w-4 h-4" style={{ color: "#7c3aed" }} />
              </motion.div>
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {connecting ? "Connecting…" : "Connect Gmail & Google Calendar"}
          </button>
        )}

        {gmailConnected ? (
          <button
            onClick={finish}
            className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
            style={{ backgroundColor: "#171717", color: "#ffffff" }}
          >
            <ArrowRight className="w-4 h-4" />
            Go to dashboard
          </button>
        ) : (
          <button
            onClick={next}
            className="w-full py-3 rounded-xl text-sm font-medium transition-all"
            style={{ color: "#5e5e5e" }}
          >
            Skip for now
          </button>
        )}
      </div>
    </div>,

    // ── Step 2: Add property (last) ───────────────────────────────────────────
    <div key="property" className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-1" style={{ color: "#171717" }}>
          Add your first listing
        </h2>
        <p className="text-sm" style={{ color: "#5e5e5e" }}>
          Import from Zillow in seconds, or add manually later.
        </p>
      </div>

      {/* Property preview card — shown after successful import */}
      <AnimatePresence>
        {imported && importedProperty && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl overflow-hidden"
            style={{ border: "1px solid rgba(34,197,94,0.25)", backgroundColor: "#ffffff" }}
          >
            {/* Photo */}
            {importedProperty.images?.[0] && (
              <div className="relative h-36 w-full overflow-hidden">
                <img
                  src={importedProperty.images[0]}
                  alt={importedProperty.address}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold"
                  style={{ backgroundColor: "rgba(34,197,94,0.9)", color: "#fff" }}>
                  ✓ Imported
                </div>
              </div>
            )}
            <div className="p-4">
              <p className="font-bold text-sm" style={{ color: "#171717" }}>
                {importedProperty.address}{importedProperty.city ? `, ${importedProperty.city}` : ""}
              </p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm font-semibold" style={{ color: "#171717" }}>
                  ${importedProperty.price_monthly?.toLocaleString()}<span className="font-normal text-xs" style={{ color: "#5e5e5e" }}>/mo</span>
                </span>
                <span className="text-xs" style={{ color: "#5e5e5e" }}>
                  {importedProperty.beds} bd · {importedProperty.baths} ba
                  {importedProperty.sqft ? ` · ${importedProperty.sqft?.toLocaleString()} sqft` : ""}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Import form — hide after successful import */}
      {!imported && (
        <div className="space-y-3">
          <div className="rounded-2xl p-5 space-y-3" style={{ backgroundColor: "#ffffff", border: "1px solid rgba(0,0,0,0.08)" }}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(66,133,244,0.1)" }}>
                <LinkIcon className="w-3.5 h-3.5" style={{ color: "#4285F4" }} />
              </div>
              <span className="text-sm font-semibold" style={{ color: "#171717" }}>Import from Zillow</span>
            </div>
            <input
              className={inputCls}
              style={inputStyle}
              placeholder="https://www.zillow.com/homedetails/…"
              value={zillowUrl}
              onChange={e => { setZillowUrl(e.target.value); setImported(false); setImportError(""); }}
            />
            <p className="text-xs" style={{ color: "#5e5e5e" }}>
              Paste a link to a <strong>specific listing</strong> — e.g. zillow.com/homedetails/123-main-st/…
            </p>

            {importError && (
              <p className="text-xs px-1" style={{ color: "#dc2626" }}>
                ⚠ {importError}
              </p>
            )}

            <button
              onClick={handleImport}
              disabled={importing}
              className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
              style={{ backgroundColor: "#171717", color: "#ffffff" }}
            >
              {importing ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}>
                    <Sparkles className="w-4 h-4" />
                  </motion.div>
                  Importing… (takes ~15 sec)
                </>
              ) : (
                <><Zap className="w-4 h-4" style={{ color: "#facc15" }} /> Import property</>
              )}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ backgroundColor: "rgba(0,0,0,0.08)" }} />
            <span className="text-xs font-medium" style={{ color: "#5e5e5e" }}>or</span>
            <div className="flex-1 h-px" style={{ backgroundColor: "rgba(0,0,0,0.08)" }} />
          </div>

          <button
            onClick={finish}
            className="w-full py-3 rounded-xl text-sm font-medium transition-all"
            style={{ backgroundColor: "#ffffff", border: "1px solid rgba(0,0,0,0.12)", color: "#5e5e5e" }}
          >
            Skip — I'll add it manually later
          </button>
        </div>
      )}
    </div>,
  ];

  return (
    <div className="min-h-screen flex">
      {/* ── LEFT PANEL ────────────────────────────────────────────── */}
      <div
        className="hidden lg:flex w-[340px] shrink-0 flex-col p-10"
        style={{ backgroundColor: "#171717" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-16">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#f9f9f9" }}>
            <span className="font-black text-base" style={{ color: "#171717" }}>L</span>
          </div>
          <span className="font-bold text-lg tracking-tight" style={{ color: "#ffffff" }}>LeaseAI</span>
        </div>

        {/* Steps list */}
        <div className="flex-1 space-y-1">
          {STEPS.map((s, i) => {
            const isActive = i === step;
            const isDone   = i < step;
            const isFuture = i > step;

            return (
              <button
                key={s.id}
                onClick={() => goTo(i)}
                disabled={isFuture}
                className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-left transition-all"
                style={{
                  backgroundColor: isActive ? "rgba(249,249,249,0.08)" : "transparent",
                  opacity: isFuture ? 0.35 : 1,
                  cursor: isFuture ? "default" : "pointer",
                }}
              >
                {/* Circle */}
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-all"
                  style={{
                    backgroundColor: isActive ? "#f9f9f9" : isDone ? "rgba(249,249,249,0.15)" : "rgba(249,249,249,0.08)",
                    color: isActive ? "#171717" : "#ffffff",
                  }}
                >
                  {isDone ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : i + 1}
                </div>

                {/* Label */}
                <span
                  className="text-sm font-semibold transition-all"
                  style={{ color: isActive ? "#ffffff" : isDone ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.35)" }}
                >
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.2)" }}>
          LeaseAI — AI-powered<br />leasing automation
        </p>
      </div>

      {/* ── RIGHT PANEL ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col" style={{ backgroundColor: "#f9f9f9" }}>
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-2.5 p-6" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#171717" }}>
            <span className="font-black text-sm" style={{ color: "#ffffff" }}>L</span>
          </div>
          <span className="font-bold text-base tracking-tight" style={{ color: "#171717" }}>LeaseAI</span>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center p-8 lg:p-16">
          <div className="w-full max-w-sm">
            {/* Mobile step indicator */}
            <div className="lg:hidden flex items-center gap-1.5 mb-6">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className="h-1 rounded-full flex-1 transition-all"
                  style={{ backgroundColor: i <= step ? "#171717" : "rgba(0,0,0,0.12)" }}
                />
              ))}
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
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              >
                {stepContent[step]}
              </motion.div>
            </AnimatePresence>

            {/* CTA */}
            {step !== 1 && (
              <div className="mt-6">
                <button
                  onClick={() => {
                    if (step === 2 && importing) return;
                    next();
                  }}
                  disabled={!canContinue}
                  className="w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
                  style={{
                    backgroundColor: canContinue ? "#171717" : "rgba(0,0,0,0.08)",
                    color: canContinue ? "#ffffff" : "#5e5e5e",
                    cursor: canContinue ? "pointer" : "not-allowed",
                  }}
                >
                  <ArrowRight className="w-4 h-4" />
                  {step === 2 && imported ? "Go to dashboard →" : "Continue"}
                </button>

                {step > 0 && (
                  <p className="text-center mt-3">
                    <button
                      onClick={finish}
                      className="text-xs transition-colors"
                      style={{ color: "#5e5e5e" }}
                    >
                      Skip setup and go to dashboard →
                    </button>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className="p-6 flex items-center justify-between"
          style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}
        >
          <span className="text-xs" style={{ color: "#5e5e5e" }}>
            Step {step + 1} of {STEPS.length}
          </span>
          <button
            onClick={finish}
            className="text-xs transition-colors"
            style={{ color: "#5e5e5e" }}
          >
            Skip all →
          </button>
        </div>
      </div>
    </div>
  );
}
