"use client";

import React, { useState } from 'react';

interface AnalysisResult {
  problem: string;
  optimizationPlan: string;
  dashboardStructure: string;
}

export default function DrishtiDashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/vision", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Analysis failed");

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error(error);
      alert("Failed to analyze image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500/30">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400">
              Drishti-Agent
            </span>
          </div>
          <div className="text-xs font-mono text-slate-500 border border-slate-800 px-3 py-1 rounded-full">
            V2V ORCHESTRATOR :: ONLINE
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
            Vision to <span className="text-cyan-400">Value</span>
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Upload any business scenario. Our Gemini-powered agent identifies problems, optimizes processes, and generates solution code instantly.
          </p>
        </div>

        {/* Upload Section */}
        <div className="mb-12">
          <div className="max-w-3xl mx-auto bg-slate-900/50 border border-slate-800 rounded-2xl p-8 backdrop-blur-sm hover:border-cyan-500/30 transition-colors duration-300 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-xl p-12 transition-all hover:border-cyan-500/50 hover:bg-slate-800/50">
              <input 
                type="file" 
                accept="image/*,video/*" 
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              
              {!previewUrl ? (
                <>
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="text-lg font-medium text-slate-300">Drop your business image here</p>
                  <p className="text-sm text-slate-500 mt-2">Supports JPG, PNG, MP4</p>
                </>
              ) : (
                <div className="relative w-full aspect-video max-h-64 rounded-lg overflow-hidden bg-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                    <p className="text-white font-medium">Click to change</p>
                  </div>
                </div>
              )}
            </div>

            {file && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="relative group px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                >
                  <span className="relative flex items-center gap-2">
                    {loading ? "Processing Intelligence..." : "Generate Solution"}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Results Dashboard */}
        {result && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
            
            {/* Problem Card */}
            <div className="bg-slate-900 border border-red-500/20 rounded-xl p-6 shadow-lg shadow-red-900/10">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-red-400">⚠</span> Identified Problem
              </h2>
              <p className="text-slate-300 leading-relaxed">{result.problem}</p>
            </div>

            {/* Optimization Plan */}
            <div className="bg-slate-900 border border-green-500/20 rounded-xl p-6 shadow-lg shadow-green-900/10">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-green-400">⚡</span> Optimization Plan
              </h2>
              <div className="text-slate-300 leading-relaxed whitespace-pre-wrap">{result.optimizationPlan}</div>
            </div>

            {/* Code / Structure */}
            <div className="lg:col-span-2 bg-slate-900 border border-cyan-500/20 rounded-xl overflow-hidden shadow-lg shadow-cyan-900/10">
              <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Dashboard Architecture</h2>
              </div>
              <pre className="p-6 text-sm font-mono text-cyan-100 bg-slate-950/50 overflow-x-auto">
                <code>{result.dashboardStructure}</code>
              </pre>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}