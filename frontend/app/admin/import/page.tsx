"use client";

import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Upload, RefreshCw, Database, Terminal } from "lucide-react";
import api from "@/lib/api";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { GlassCard } from "@/components/layout/GlassCard";
import { Button } from "@/components/ui/button";

export default function AdminImportPage() {
  const qsFileRef = useRef<HTMLInputElement>(null);
  const [importLog, setImportLog] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const addLog = (msg: string) => {
    const ts = new Date().toLocaleTimeString();
    setImportLog((prev) => [`[${ts}] ${msg}`, ...prev].slice(0, 50));
  };

  const syncScorecard = useMutation({
    mutationFn: async () => {
      addLog("Starting US College Scorecard sync...");
      const res = await api.post("/admin/sync/scorecard");
      return res.data;
    },
    onSuccess: (data) => {
      addLog(`Scorecard sync complete: ${data?.synced ?? "?"} universities updated.`);
      toast.success("Scorecard sync triggered!");
    },
    onError: () => {
      addLog("Scorecard sync failed.");
      toast.error("Sync failed. Check API connection.");
    },
  });

  const handleQsUpload = async (file: File) => {
    setUploading(true);
    addLog(`Uploading QS rankings CSV: ${file.name}`);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await api.post("/admin/import/qs-rankings", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      addLog(`QS import complete: ${res.data?.imported ?? "?"} records imported.`);
      toast.success("QS Rankings imported!");
    } catch {
      addLog("QS import failed.");
      toast.error("Import failed.");
    } finally {
      setUploading(false);
      if (qsFileRef.current) qsFileRef.current.value = "";
    }
  };

  return (
    <PageWrapper title="Data Import" subtitle="Import university data from external sources.">
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* QS Rankings */}
        <GlassCard>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center">
              <Upload size={18} className="text-blue-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">QS World Rankings</h3>
              <p className="text-slate-400 text-xs">Upload a CSV file with QS ranking data</p>
            </div>
          </div>

          <p className="text-slate-400 text-sm mb-4">
            Expected columns: <code className="text-blue-400 text-xs bg-blue-500/10 px-1 py-0.5 rounded">
              name, country, qs_rank, annual_tuition_usd, acceptance_rate
            </code>
          </p>

          <input
            ref={qsFileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleQsUpload(file);
            }}
          />

          <Button
            onClick={() => qsFileRef.current?.click()}
            disabled={uploading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {uploading ? (
              <><RefreshCw size={14} className="mr-2 animate-spin" /> Importing...</>
            ) : (
              <><Upload size={14} className="mr-2" /> Upload CSV</>
            )}
          </Button>
        </GlassCard>

        {/* US College Scorecard */}
        <GlassCard>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-600/10 rounded-xl flex items-center justify-center">
              <Database size={18} className="text-purple-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">US College Scorecard</h3>
              <p className="text-slate-400 text-xs">Sync from official API (runs weekly automatically)</p>
            </div>
          </div>

          <p className="text-slate-400 text-sm mb-4">
            Fetches the latest data from the US Department of Education College Scorecard API.
            This runs automatically every Monday at 02:00 UTC.
          </p>

          <Button
            onClick={() => syncScorecard.mutate()}
            disabled={syncScorecard.isPending}
            variant="outline"
            className="w-full border-white/10 text-slate-300 hover:bg-white/8"
          >
            {syncScorecard.isPending ? (
              <><RefreshCw size={14} className="mr-2 animate-spin" /> Syncing...</>
            ) : (
              <><RefreshCw size={14} className="mr-2" /> Trigger Manual Sync</>
            )}
          </Button>
        </GlassCard>
      </div>

      {/* Import Log */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <Terminal size={16} className="text-slate-400" />
          <h3 className="text-white font-semibold">Import Log</h3>
          {importLog.length > 0 && (
            <button
              onClick={() => setImportLog([])}
              className="ml-auto text-slate-500 hover:text-white text-xs transition-colors"
            >
              Clear
            </button>
          )}
        </div>
        <div className="bg-black/30 rounded-lg p-4 min-h-[160px] font-mono text-xs">
          {importLog.length === 0 ? (
            <p className="text-slate-600">No activity yet. Import data to see logs here.</p>
          ) : (
            importLog.map((line, i) => (
              <div key={i} className={`${i === 0 ? "text-green-400" : "text-slate-400"} mb-1`}>
                {line}
              </div>
            ))
          )}
        </div>
      </GlassCard>
    </PageWrapper>
  );
}
