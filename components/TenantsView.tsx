"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search, Users, Sparkles, TrendingUp, MoreHorizontal,
  Trash2, Mail, MessageSquare, ChevronRight, Clock,
  ArrowUpDown, ArrowUp, ArrowDown,
} from "lucide-react";
import Link from "next/link";
import Avatar from "@/components/Avatar";

type TenantFilter = "all" | "leads" | "active" | "attention" | "archived";
type SortKey = "name" | "created_at" | "lead_score" | "status";
type SortDir = "asc" | "desc";

interface TenantsViewProps {
  onToast?: (message: string) => void;
}

const PIPELINE_LABELS: Record<string, string> = {
  new_lead: "New Lead",
  qualified: "Qualified",
  viewing_scheduled: "Viewing",
  application: "Application",
  lease_signed: "Signed",
};

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;

  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function getFilterForTenant(tenant: any): TenantFilter {
  if (tenant.status === "Archived") return "archived";
  if (tenant.status === "Late Payment") return "attention";
  if (tenant.status === "Current") return "active";
  return "leads";
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === "Current"
      ? "bg-emerald-500"
      : status === "Pending"
      ? "bg-amber-400"
      : status === "Late Payment"
      ? "bg-red-500"
      : "bg-gray-400";

  return <span className={`w-2 h-2 rounded-full ${color} shrink-0`} />;
}

function PriorityBadge({ priority }: { priority: string }) {
  if (!priority) return null;
  const styles =
    priority === "hot"
      ? "bg-red-50 text-red-600 border-red-200"
      : priority === "warm"
      ? "bg-amber-50 text-amber-600 border-amber-200"
      : "bg-sky-50 text-sky-600 border-sky-200";

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide border ${styles}`}
    >
      <TrendingUp className="w-2.5 h-2.5" />
      {priority}
    </span>
  );
}

function SortButton({
  label,
  sortKey,
  currentSort,
  currentDir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  currentSort: SortKey;
  currentDir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const isActive = currentSort === sortKey;
  return (
    <button
      onClick={() => onSort(sortKey)}
      className={`flex items-center gap-1 text-xs font-medium transition-colors ${
        isActive ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
      }`}
    >
      {label}
      {isActive ? (
        currentDir === "asc" ? (
          <ArrowUp className="w-3 h-3" />
        ) : (
          <ArrowDown className="w-3 h-3" />
        )
      ) : (
        <ArrowUpDown className="w-3 h-3 opacity-0 group-hover/header:opacity-100 transition-opacity" />
      )}
    </button>
  );
}

export default function TenantsView({ onToast }: TenantsViewProps) {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<TenantFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [contextMenu, setContextMenu] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tenants");
      const data = await res.json();
      setTenants(data.tenants || []);
    } catch {
      setTenants([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await fetch(`/api/tenants/${id}`, { method: "DELETE" });
      setTenants((prev) => prev.filter((t) => t.id !== id));
      onToast?.("Tenant deleted");
    } catch {
      onToast?.("Failed to delete tenant");
    } finally {
      setDeleting(null);
      setContextMenu(null);
    }
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
  };

  const filtered = tenants
    .filter((t) => {
      if (filter !== "all" && getFilterForTenant(t) !== filter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        t.name?.toLowerCase().includes(q) ||
        t.email?.toLowerCase().includes(q) ||
        t.property_address?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortKey === "name")
        return dir * (a.name || "").localeCompare(b.name || "");
      if (sortKey === "lead_score")
        return dir * ((a.lead_score || 0) - (b.lead_score || 0));
      if (sortKey === "status")
        return dir * (a.status || "").localeCompare(b.status || "");
      return (
        dir *
        (new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      );
    });

  const counts = {
    all: tenants.length,
    leads: tenants.filter((t) => getFilterForTenant(t) === "leads").length,
    active: tenants.filter((t) => getFilterForTenant(t) === "active").length,
    attention: tenants.filter((t) => getFilterForTenant(t) === "attention").length,
    archived: tenants.filter((t) => getFilterForTenant(t) === "archived").length,
  };

  const FILTERS: { key: TenantFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "leads", label: "Leads" },
    { key: "active", label: "Active" },
    { key: "attention", label: "Attention" },
    { key: "archived", label: "Archived" },
  ];

  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-1">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
          Tenants
        </h2>

        {/* Search */}
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-gray-400 focus:bg-white transition-colors placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-2.5 text-sm font-medium transition-colors relative ${
              filter === f.key
                ? "text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {f.label}
            {counts[f.key] > 0 && (
              <span
                className={`ml-1.5 text-xs tabular-nums ${
                  filter === f.key ? "text-gray-900" : "text-gray-400"
                }`}
              >
                {counts[f.key]}
              </span>
            )}
            {filter === f.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
            <Users className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            {search ? "No results" : "No tenants yet"}
          </h3>
          <p className="text-sm text-gray-500 max-w-xs">
            {search
              ? "Try a different search term."
              : "Tenants will appear here once leads come in through email or are added manually."}
          </p>
        </div>
      ) : (
        /* Table */
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_140px_140px_100px_100px_40px] gap-4 px-4 py-2.5 bg-gray-50/80 border-b border-gray-200 group/header">
            <SortButton
              label="Name"
              sortKey="name"
              currentSort={sortKey}
              currentDir={sortDir}
              onSort={handleSort}
            />
            <SortButton
              label="Status"
              sortKey="status"
              currentSort={sortKey}
              currentDir={sortDir}
              onSort={handleSort}
            />
            <span className="text-xs font-medium text-gray-400">Stage</span>
            <SortButton
              label="Score"
              sortKey="lead_score"
              currentSort={sortKey}
              currentDir={sortDir}
              onSort={handleSort}
            />
            <SortButton
              label="Added"
              sortKey="created_at"
              currentSort={sortKey}
              currentDir={sortDir}
              onSort={handleSort}
            />
            <span />
          </div>

          {/* Rows */}
          <div className="divide-y divide-gray-100">
            {filtered.map((tenant) => (
              <Link
                key={tenant.id}
                href={`/dashboard/tenant/${tenant.id}`}
                className="grid grid-cols-[1fr_140px_140px_100px_100px_40px] gap-4 px-4 py-3 items-center hover:bg-gray-50/70 transition-colors group cursor-pointer"
              >
                {/* Name + email */}
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar
                    src={tenant.avatar}
                    name={tenant.name}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {tenant.name}
                      </span>
                      {tenant.lead_priority && (
                        <PriorityBadge priority={tenant.lead_priority} />
                      )}
                    </div>
                    <span className="text-xs text-gray-500 truncate block">
                      {tenant.email}
                    </span>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-2">
                  <StatusDot status={tenant.status} />
                  <span className="text-sm text-gray-700">
                    {tenant.status === "Late Payment" ? "Late" : tenant.status}
                  </span>
                </div>

                {/* Pipeline stage */}
                <div>
                  {tenant.pipeline_stage ? (
                    <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      {PIPELINE_LABELS[tenant.pipeline_stage] ||
                        tenant.pipeline_stage}
                    </span>
                  ) : tenant.qualification_status ? (
                    <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      {tenant.qualification_status}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </div>

                {/* Lead score */}
                <div>
                  {tenant.lead_score != null ? (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            tenant.lead_score >= 70
                              ? "bg-emerald-500"
                              : tenant.lead_score >= 40
                              ? "bg-amber-400"
                              : "bg-gray-300"
                          }`}
                          style={{ width: `${tenant.lead_score}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-600 tabular-nums">
                        {tenant.lead_score}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </div>

                {/* Time ago */}
                <span className="text-xs text-gray-500">
                  {formatTimeAgo(tenant.created_at)}
                </span>

                {/* Actions */}
                <div
                  className="relative flex items-center justify-center"
                  onClick={(e) => e.preventDefault()}
                >
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setContextMenu(
                        contextMenu === tenant.id ? null : tenant.id
                      );
                    }}
                    className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-gray-100 hover:text-gray-600 transition-all"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>

                  {/* Context menu */}
                  {contextMenu === tenant.id && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setContextMenu(null);
                        }}
                      />
                      <div className="absolute right-0 top-8 z-50 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1 text-sm">
                        <Link
                          href={`/dashboard/tenant/${tenant.id}`}
                          className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                          View details
                        </Link>
                        {tenant.email && (
                          <a
                            href={`mailto:${tenant.email}`}
                            className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Mail className="w-3.5 h-3.5" />
                            Send email
                          </a>
                        )}
                        <Link
                          href="/dashboard?tab=inbox"
                          className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Open in Inbox
                        </Link>
                        <div className="h-px bg-gray-100 my-1" />
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDelete(tenant.id);
                          }}
                          disabled={deleting === tenant.id}
                          className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 transition-colors w-full"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          {deleting === tenant.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* AI summary row for leads — only visible when filtering leads */}
      {!loading && filter === "leads" && filtered.length > 0 && (
        <div className="mt-4 p-3 bg-indigo-50/60 border border-indigo-100 rounded-lg flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
          <div className="text-xs text-indigo-700">
            <span className="font-semibold">{counts.leads} active leads</span>
            {" — "}
            {tenants.filter((t) => t.lead_priority === "hot").length > 0 && (
              <span>
                {tenants.filter((t) => t.lead_priority === "hot").length} hot,{" "}
              </span>
            )}
            {tenants.filter((t) => t.lead_priority === "warm").length > 0 && (
              <span>
                {tenants.filter((t) => t.lead_priority === "warm").length} warm.{" "}
              </span>
            )}
            Click on any lead to see AI insights and qualification details.
          </div>
        </div>
      )}
    </div>
  );
}
