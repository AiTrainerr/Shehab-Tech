"use client";

import { useState } from "react";
import { applyToProject } from "@/app/actions/projects";
import { useRouter } from "next/navigation";

export function ApplyButton({ projectId, type, label, className }: { projectId: string, type: "FREELANCER" | "TEAM_LEADER", label: string, className: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleApply() {
    setLoading(true);
    setError("");
    try {
      const res = await applyToProject(projectId, type);
      if (res?.error) {
        setError(res.error);
      } else {
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button onClick={handleApply} disabled={loading} className={className}>
        {loading ? "Applying..." : label}
      </button>
      {error && <p className="text-red-500 text-sm font-bold">{error}</p>}
    </div>
  );
}