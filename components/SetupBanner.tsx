"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, Mail, Sparkles, Check, ArrowRight,
  Link as LinkIcon, Zap, Bot, X
} from "lucide-react";

const SETUP_KEY = "leaseai_setup_v1";

const STEPS = [
  {
    id: "property",
    num: "01",
    title: "Add your first property",
    desc: "Paste a Zillow link or fill in details manually. Your AI agent needs at least one listing to start qualifying leads.",
    cta: "Add property",
    ctaIcon: <LinkIcon className="w-4 h-4" />,
    tag: "Required",
    tagColor: "bg-orange-50 text-orange-600 border-orange-100",
  },
  {
    id: "gmail",
    num: "02",
    title: "Connect your Gmail",
    desc: "LeaseAI reads incoming rental inquiries and replies instantly — 24/7. No more missed leads.",
    cta: "Connect Gmail",
    ctaIcon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
    ),
    tag: "Recommended",
    tagColor: "bg-blue-50 text-blue-600 border-blue-100",
  },
  {
    id: "sandbox",
    num: "03",
    title: "Try the AI agent",
    desc: "Send a message as if you were a tenant. See how your AI qualifies leads, answers questions, and books viewings.",
    cta: "Open sandbox",
    ctaIcon: <Bot className="w-4 h-4" />,
    tag: "Try it",
    tagColor: "bg-violet-50 text-violet-600 border-violet-100",
    href: "/dashboard/sandbox",
  },
];

export default function SetupBanner() {
  const [visible, setVisible] = useState(false);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SETUP_KEY) || "{}");
      if (saved.dismissed) return;
      const completedSet = new Set<string>(saved.completed || []);
      setDone(completedSet);
      if (completedSet.size < STEPS.length) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const save = (completedSet: Set<string>, dismissed = false) => {
    localStorage.setItem(SETUP_KEY, JSON.stringify({
      completed: Array.from(completedSet),
      dismissed,
    }));
  };

  const markDone = async (id: string, href?: string) => {
    setLoading(id);
    await new Promise(r => setTimeout(r, 600));
    setLoading(null);
    const next = new Set(done).add(id);
    setDone(next);
    save(next);
    if (href) window.location.href = href;
    if (next.size === STEPS.length) setTimeout(() => setVisible(false), 1400);
  };

  const dismiss = () => {
    setVisible(false);
    save(done, true);
  };

  if (!visible) return null;

  const completedCount = done.size;
  const total = STEPS.length;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="mb-6"
      >
        {/* Header */}
        <div className="flex items-end justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 bg-gray-900 rounded-lg flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">
                Get started with LeaseAI
              </h2>
            </div>
            <p className="text-sm text-gray-500 ml-8">
              {completedCount} of {total} steps complete
              <span className="mx-2 text-gray-300">·</span>
              <span className="text-gray-400">takes about 3 minutes</span>
            </p>
          </div>

          <button
            onClick={dismiss}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100"
          >
            <X className="w-3.5 h-3.5" />
            Dismiss
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-100 rounded-full mb-5 overflow-hidden">
          <motion.div
            className="h-full bg-gray-900 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(completedCount / total) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>

        {/* Step cards */}
        <div className="grid grid-cols-1 gap-3">
          {STEPS.map((step, i) => {
            const isDone = done.has(step.id);
            const isLoading = loading === step.id;

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, duration: 0.35 }}
                className={[
                  "relative flex items-center gap-4 p-4 rounded-2xl border transition-all",
                  isDone
                    ? "bg-gray-50 border-gray-150 opacity-60"
                    : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm",
                ].join(" ")}
              >
                {/* Step number / check */}
                <div
                  className={[
                    "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm transition-all",
                    isDone
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-500",
                  ].join(" ")}
                >
                  {isDone ? (
                    <Check className="w-4 h-4" strokeWidth={3} />
                  ) : (
                    step.num
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className={`text-sm font-semibold ${isDone ? "line-through text-gray-400" : "text-gray-900"}`}>
                      {step.title}
                    </p>
                    {!isDone && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${step.tagColor}`}>
                        {step.tag}
                      </span>
                    )}
                  </div>
                  {!isDone && (
                    <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
                  )}
                </div>

                {/* CTA */}
                {!isDone && (
                  <button
                    onClick={() => markDone(step.id, step.href)}
                    disabled={!!loading}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition-all shrink-0 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                      >
                        <Zap className="w-4 h-4" />
                      </motion.div>
                    ) : (
                      <>
                        {step.ctaIcon}
                        {step.cta}
                      </>
                    )}
                  </button>
                )}

                {isDone && (
                  <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400 shrink-0">
                    <Check className="w-3.5 h-3.5 text-green-500" />
                    Done
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* All done */}
        {completedCount === total && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 flex items-center justify-center gap-2 py-4 text-sm font-semibold text-gray-900 bg-white border border-gray-200 rounded-2xl"
          >
            <Sparkles className="w-4 h-4 text-violet-500" />
            You're all set — your AI agent is live!
            <ArrowRight className="w-4 h-4 text-gray-400" />
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
