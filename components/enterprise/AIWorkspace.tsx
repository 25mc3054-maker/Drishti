"use client"

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Cloud, Loader2, ShieldAlert, Sparkles } from 'lucide-react';
import type { AnalysisResult } from '@/types';

const emptyResult = ({} as AnalysisResult);

export function AIWorkspace() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFile = (file: File | null) => {
    if (!file) return;

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
    setError(null);
    setProgress(0);
  };

  const analyze = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setError(null);
    setProgress(8);

    const interval = window.setInterval(() => {
      setProgress((current) => Math.min(current + 9, 90));
    }, 110);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/vision', {
        method: 'POST',
        body: formData,
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Analysis failed');
      }

      setResult(payload.data as AnalysisResult);
      setProgress(100);
    } catch (error: any) {
      setError(error?.message || 'Analysis failed');
      setProgress(0);
    } finally {
      window.clearInterval(interval);
      setIsAnalyzing(false);
    }
  };

  const renderResult = result || emptyResult;

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <div className="text-[11px] uppercase tracking-[0.15em] text-[#6B7280]">AI Workspace</div>
        <h2 className="text-[32px] font-semibold tracking-[-0.03em] text-white">Upload a business scenario and generate an operational plan.</h2>
        <p className="max-w-3xl text-[15px] leading-6 text-[#D1D5DB]">
          Use the existing vision API to turn a shop image into a structured diagnosis, optimization plan, and implementation blueprint.
        </p>
      </div>

      <motion.div
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragOver(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          handleFile(event.dataTransfer.files?.[0] || null);
        }}
        animate={{ scale: dragOver ? 1.01 : 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative overflow-hidden border border-dashed bg-[#080808] p-8"
        style={{ borderColor: dragOver ? '#6366F1' : '#333333', borderRadius: 6, backgroundColor: dragOver ? 'rgba(99,102,241,0.05)' : '#080808' }}
      >
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-70"
          animate={{ opacity: dragOver ? 1 : [0.55, 0.85, 0.55] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            background:
              'radial-gradient(circle at 20% 15%, rgba(99,102,241,0.12), transparent 20%), radial-gradient(circle at 80% 20%, rgba(16,185,129,0.08), transparent 16%), linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.05) 50%, transparent 100%)',
          }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-x-8 top-0 h-px bg-[#6366F1]"
          animate={{ opacity: [0.15, 0.6, 0.15], x: ['-12%', '12%', '-12%'] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="flex min-h-[240px] flex-col items-center justify-center text-center">
          <motion.div
            className="mb-4 flex h-14 w-14 items-center justify-center border border-[#1A1A1A] bg-black"
            animate={{ y: [0, -2, 0], scale: [1, 1.02, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            style={{ borderRadius: 4 }}
          >
            <Cloud className="h-6 w-6 text-white" />
          </motion.div>
          <div className="text-[15px] font-medium text-white">Drop your business scenario image here</div>
          <div className="mt-2 text-[13px] leading-6 text-[#6B7280]">PNG, JPG, or WebP. The existing AI pipeline will return a structured report.</div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="border border-[#1A1A1A] bg-white px-5 py-3 text-[14px] font-semibold text-black"
              style={{ borderRadius: 6 }}
            >
              Choose file
            </button>
            <button
              type="button"
              onClick={analyze}
              disabled={!selectedFile || isAnalyzing}
              className="inline-flex items-center justify-center gap-2 border border-[#1A1A1A] bg-[#6366F1] px-5 py-3 text-[14px] font-semibold text-white disabled:opacity-50"
              style={{ borderRadius: 6 }}
            >
              {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Analyze scenario
            </button>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => handleFile(event.target.files?.[0] || null)}
          />

          {selectedFile ? (
            <div className="mt-5 text-[13px] text-[#9CA3AF]">Selected: {selectedFile.name}</div>
          ) : null}
        </div>
      </motion.div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.15em] text-[#6B7280]">
          <span>Real-time progress</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 w-full bg-[#111111]" style={{ borderRadius: 6 }}>
          <motion.div
            className="h-full bg-[#6366F1]"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            style={{ borderRadius: 6 }}
          />
        </div>
      </div>

      {error ? (
        <div className="border border-[#1A1A1A] bg-[#0A0A0A] p-4 text-[14px] text-[#D1D5DB]" style={{ borderRadius: 6 }}>
          <div className="flex items-center gap-2 text-white">
            <ShieldAlert className="h-4 w-4 text-[#10B981]" />
            Analysis error
          </div>
          <div className="mt-2 text-[#9CA3AF]">{error}</div>
        </div>
      ) : null}

      <AnimatePresence mode="wait">
        {result ? (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="grid gap-4 lg:grid-cols-3"
          >
            <ResultCard title="Problem Identified" eyebrow="Diagnosis" delay={0.02}>
              <div className="text-[18px] font-semibold text-white">{renderResult.problem?.title || 'Operational bottleneck'}</div>
              <p className="mt-3 text-[15px] leading-6 text-[#D1D5DB]">{renderResult.problem?.description || 'The AI analysis returned a structured problem statement.'}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {(renderResult.problem?.impactAreas || []).map((area) => (
                  <span key={area} className="border border-[#1A1A1A] bg-black px-3 py-1 text-[11px] uppercase tracking-[0.15em] text-white" style={{ borderRadius: 4 }}>
                    {area}
                  </span>
                ))}
              </div>
            </ResultCard>

            <ResultCard title="Optimization Plan" eyebrow="Strategy" delay={0.08}>
              <p className="text-[15px] leading-6 text-[#D1D5DB]">{renderResult.optimization?.strategy || 'Optimization guidance will appear here.'}</p>
              <div className="mt-4 border-t border-[#1A1A1A] pt-4 text-[13px] text-[#9CA3AF]">
                <div>Timeline: {renderResult.optimization?.timeline || 'TBD'}</div>
                <div className="mt-1">Estimated cost: {renderResult.optimization?.estimatedCost || 'Not specified'}</div>
              </div>
            </ResultCard>

            <ResultCard title="Implementation Guide" eyebrow="Delivery" delay={0.14}>
              <div className="space-y-3 text-[13px] leading-6 text-[#D1D5DB]">
                <div>
                  <div className="text-white">Frontend</div>
                  <div>{renderResult.implementation?.architecture.frontend?.join(', ') || 'Dashboard surfaces, motion states, reporting views'}</div>
                </div>
                <div>
                  <div className="text-white">Backend</div>
                  <div>{renderResult.implementation?.architecture.backend?.join(', ') || 'API orchestration, processing pipeline, persistence layer'}</div>
                </div>
                <div>
                  <div className="text-white">Confidence</div>
                  <div>{renderResult.metadata?.confidence ?? 0}%</div>
                </div>
              </div>
            </ResultCard>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

function ResultCard({ title, eyebrow, delay = 0, children }: { title: string; eyebrow: string; delay?: number; children: React.ReactNode }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay, ease: 'easeOut' }}
      whileHover={{ y: -2, boxShadow: '0 0 0 1px #6366F1' }}
      className="border border-[#1A1A1A] bg-[#0A0A0A] p-6"
      style={{ borderRadius: 4 }}
    >
      <div className="text-[11px] uppercase tracking-[0.15em] text-[#6B7280]">{eyebrow}</div>
      <h3 className="mt-2 text-[18px] font-semibold text-white">{title}</h3>
      <div className="mt-5">{children}</div>
    </motion.article>
  );
}