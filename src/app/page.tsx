"use client";

import { useState } from "react";

export default function Home() {
  const [jobDescription, setJobDescription] = useState("");
  const [baseResume, setBaseResume] = useState("");
  const [tone, setTone] = useState<"professional" | "confident" | "concise">(
    "professional"
  );
  const [out, setOut] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function generate() {
    setErr("");
    setOut("");
    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription, baseResume, tone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      setOut(data.resumeMarkdown);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Resume Generator (Personal Claude)</h1>

      <div className="space-y-2">
        <label className="font-medium">Job Description</label>
        <textarea
          className="w-full border rounded p-2 min-h-[180px]"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the job posting here..."
        />
      </div>

      <div className="space-y-2">
        <label className="font-medium">Base Resume</label>
        <textarea
          className="w-full border rounded p-2 min-h-[220px]"
          value={baseResume}
          onChange={(e) => setBaseResume(e.target.value)}
          placeholder="Paste the current resume here..."
        />
      </div>

      <div className="flex items-center gap-3">
        <label className="font-medium">Tone</label>
        <select
          className="border rounded p-2"
          value={tone}
          onChange={(e) => setTone(e.target.value as any)}
        >
          <option value="professional">Professional</option>
          <option value="confident">Confident</option>
          <option value="concise">Concise</option>
        </select>

        <button
          className="border rounded px-4 py-2"
          onClick={generate}
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate"}
        </button>
      </div>

      {err && <p className="text-red-600">{err}</p>}

      <div className="space-y-2">
        <label className="font-medium">Output (Markdown)</label>
        <textarea
          className="w-full border rounded p-2 min-h-[280px]"
          value={out}
          readOnly
          placeholder="Generated resume will appear here..."
        />
      </div>
    </main>
  );
}