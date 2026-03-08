'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Image as ImageIcon, 
  Video, 
  Sparkles, 
  Brain,
  TrendingUp,
  Code,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Target,
  Loader2,
  Eye,
  BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';
import { AnalysisState, AnalysisResult, UploadedFile } from '@/types';
import { formatBytes, getSeverityColor, getSeverityBgColor } from '@/lib/utils';
import SolutionPreview from '@/components/SolutionPreview';
import AnalysisMetrics from '@/components/AnalysisMetrics';

export default function Home() {
  const adminSectionLinks = [
    { label: 'Billing', href: '/admin?section=billing' },
    { label: 'Products', href: '/admin?section=products' },
    { label: 'Customers', href: '/admin?section=customers' },
    { label: 'Stock', href: '/admin?section=stock' },
    { label: 'Invoices', href: '/admin?section=invoices' },
    { label: 'Marketing', href: '/admin?section=marketing' },
    { label: 'Expenses', href: '/admin?section=expenses' },
    { label: 'Suppliers', href: '/admin?section=suppliers' },
    { label: 'Tasks', href: '/admin?section=tasks' },
    { label: 'Insights', href: '/admin?section=insights' },
    { label: 'Backup', href: '/admin?section=backup' },
  ];
  const quickAccessCards = [
    {
      title: 'AI Analysis Workspace',
      subtitle: 'Multi-image upload with real-time progress',
      icon: Sparkles,
      href: '#upload-workspace',
    },
    {
      title: 'Storefront Operations',
      subtitle: 'Open customer-facing storefront instantly',
      icon: Video,
      href: '/storefront',
    },
    {
      title: 'Business Control Tower',
      subtitle: 'Billing, stock, marketing and backups',
      icon: BarChart3,
      href: '/admin',
    },
  ];

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    status: 'idle',
    progress: 0,
    result: null,
    error: null,
  });
  const [activeHomeSlidebar, setActiveHomeSlidebar] = useState<'ai' | 'services'>('services');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGlowMove = (event: React.MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--mx', `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty('--my', `${event.clientY - rect.top}px`);
  };

  const handleGlowLeave = (event: React.MouseEvent<HTMLElement>) => {
    event.currentTarget.style.setProperty('--mx', '50%');
    event.currentTarget.style.setProperty('--my', '50%');
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    const maxSize = 10 * 1024 * 1024;

    const nextFiles: UploadedFile[] = [];
    let rejectedCount = 0;

    for (const file of Array.from(selectedFiles)) {
      if (file.size > maxSize) {
        rejectedCount++;
        continue;
      }

      if (!validTypes.includes(file.type)) {
        rejectedCount++;
        continue;
      }

      nextFiles.push({
        file,
        preview: URL.createObjectURL(file),
        type: 'image',
      });
    }

    if (nextFiles.length === 0) {
      toast.error('Please upload valid images (JPEG, PNG, WebP) under 10MB each');
      return;
    }

    uploadedFiles.forEach((file) => URL.revokeObjectURL(file.preview));
    setUploadedFiles(nextFiles);

    const rejectedMessage = rejectedCount > 0 ? ` (${rejectedCount} skipped)` : '';
    toast.success(`${nextFiles.length} photo${nextFiles.length > 1 ? 's' : ''} uploaded${rejectedMessage}`);
  };

  const analyzeImage = async () => {
    if (uploadedFiles.length === 0) {
      toast.error('Please upload at least one photo first');
      return;
    }

    const primaryFile = uploadedFiles[0];

    setAnalysisState({
      status: 'uploading',
      progress: 0,
      result: null,
      error: null,
    });

    try {
      // Simulate upload progress
      const uploadInterval = setInterval(() => {
        setAnalysisState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 5, 30),
        }));
      }, 100);

      const formData = new FormData();
      formData.append('file', primaryFile.file);

      setAnalysisState(prev => ({ ...prev, status: 'analyzing', progress: 30 }));
      clearInterval(uploadInterval);

      // Simulate analysis progress
      const analysisInterval = setInterval(() => {
        setAnalysisState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 3, 90),
        }));
      }, 200);

      const response = await fetch('/api/vision', {
        method: 'POST',
        body: formData,
      });

      clearInterval(analysisInterval);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Analysis failed');
      }

      const data = await response.json();

      setAnalysisState({
        status: 'completed',
        progress: 100,
        result: data.data,
        error: null,
      });

      toast.success('Analysis completed successfully!', {
        description: `Processed in ${(data.processingTime / 1000).toFixed(2)}s`,
      });

    } catch (error: any) {
      setAnalysisState({
        status: 'error',
        progress: 0,
        result: null,
        error: error.message,
      });

      toast.error('Analysis failed', {
        description: error.message,
      });
    }
  };

  const resetAnalysis = () => {
    uploadedFiles.forEach((file) => URL.revokeObjectURL(file.preview));
    setUploadedFiles([]);
    setAnalysisState({
      status: 'idle',
      progress: 0,
      result: null,
      error: null,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="app-shell relative overflow-hidden">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <div className="absolute inset-0 app-grid-bg opacity-30 pointer-events-none" />
      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gemini-blue-500/16 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gemini-blue-400/12 rounded-full blur-[150px] animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gemini-blue-600/10 rounded-full blur-[180px]" />
      </div>

      {/* Main content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-drishti-blue-500/20 backdrop-blur-sm sticky top-0 z-20 bg-black/35">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center space-x-4"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-drishti-blue-400/30 rounded-xl blur-md" />
                  <div className="relative w-12 h-12 bg-gradient-to-br from-drishti-blue-400 to-drishti-blue-600 rounded-xl flex items-center justify-center border border-drishti-blue-300/40">
                    <Eye className="w-7 h-7 text-white" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-drishti-blue-200 bg-clip-text text-transparent tracking-wide">Drishti Agent</h1>
                    <span className="tech-badge">
                      AI CORE
                    </span>
                  </div>
                  <p className="text-sm text-drishti-blue-200 tracking-[0.08em] uppercase">Vision-to-Value Orchestrator</p>
                </div>
              </motion.div>

              <motion.nav
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                className="flex items-center gap-3"
                aria-label="Primary actions"
              >
                <Link
                  href="/admin"
                  className="float-on-hover premium-button-primary text-sm a11y-focus"
                  aria-label="Open billing dashboard"
                >
                  Open Billing System
                </Link>
                <Link
                  href="/storefront"
                  className="float-on-hover premium-button-ghost text-sm a11y-focus"
                  aria-label="Open storefront"
                >
                  View Storefront
                </Link>
              </motion.nav>

            </div>
          </div>
        </header>

        {/* Main dashboard */}
        <main id="main-content" className="container mx-auto px-4 py-8" aria-label="Dashboard content">
          <AnimatePresence mode="wait">
            {analysisState.status === 'idle' || analysisState.status === 'uploading' || analysisState.status === 'analyzing' ? (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`mx-auto ${activeHomeSlidebar === 'services' ? 'max-w-6xl' : 'max-w-4xl'}`}
              >
                {/* Hero section */}
                <div className="text-center mb-12">
                  <motion.p
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-drishti-blue-400/35 bg-drishti-blue-500/10 text-xs font-semibold uppercase tracking-[0.2em] text-drishti-blue-200 mb-5"
                  >
                    Next-Gen Agentic Intelligence
                  </motion.p>
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-5xl md:text-6xl font-black text-white mb-4 tracking-tight"
                  >
                    The fastest <span className="gradient-text">path from prompt</span>
                  </motion.h2>
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-5xl md:text-6xl font-black text-drishti-blue-300/70 mb-6 tracking-tight"
                  >
                    to production
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-xl text-drishti-blue-100 max-w-2xl mx-auto leading-relaxed"
                  >
                    Upload an image of your business scenario and get instant AI-powered insights, optimization plans, and implementation roadmaps.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.36 }}
                    className="mt-7 inline-flex rounded-xl border border-drishti-blue-500/35 bg-black/35 p-1"
                  >
                    <button
                      type="button"
                      onClick={() => setActiveHomeSlidebar('services')}
                      className={`px-4 md:px-5 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all ${activeHomeSlidebar === 'services' ? 'bg-drishti-blue-500/30 text-white border border-drishti-blue-300/60 shadow-[0_0_16px_rgba(26,145,255,0.25)]' : 'text-drishti-blue-200 hover:bg-drishti-blue-500/10 border border-transparent'}`}
                    >
                      Billing & Services Slidebar
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveHomeSlidebar('ai')}
                      className={`px-4 md:px-5 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all ${activeHomeSlidebar === 'ai' ? 'bg-drishti-blue-500/30 text-white border border-drishti-blue-300/60 shadow-[0_0_16px_rgba(26,145,255,0.25)]' : 'text-drishti-blue-200 hover:bg-drishti-blue-500/10 border border-transparent'}`}
                    >
                      AI Analyzer Slidebar
                    </button>
                  </motion.div>
                </div>

                {/* Upload area */}
                {activeHomeSlidebar === 'ai' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ delay: 0.4, type: 'spring', stiffness: 110, damping: 18 }}
                  id="upload-workspace"
                  className="glass-effect neon-panel interactive-glow rounded-2xl p-8 mb-8 stagger-fade"
                  onMouseMove={handleGlowMove}
                  onMouseLeave={handleGlowLeave}
                  aria-label="Upload workspace"
                >
                  {uploadedFiles.length === 0 ? (
                    <>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full border-2 border-dashed border-drishti-blue-400/30 rounded-xl p-12 text-center hover:border-drishti-blue-300/80 hover:bg-drishti-blue-500/10 transition-all duration-300 group a11y-focus"
                        aria-label="Choose image files to upload"
                      >
                        <div className="flex justify-center mb-4">
                          <div className="w-20 h-20 bg-drishti-blue-500/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-[0_0_30px_rgba(26,145,255,0.28)]">
                            <Upload className="w-10 h-10 text-drishti-blue-300" />
                          </div>
                        </div>
                        <h3 className="text-2xl font-semibold text-white mb-2 tracking-wide">Upload your business scenario</h3>
                        <div className="flex items-center justify-center space-x-4 text-sm text-drishti-blue-300 flex-wrap">
                          <div className="flex items-center space-x-2">
                            <ImageIcon className="w-4 h-4" />
                            <span>JPEG, PNG, WebP</span>
                          </div>
                          <div className="w-1 h-1 bg-drishti-blue-400 rounded-full" />
                          <span>Many files • Max 10MB each</span>
                        </div>
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                        aria-label="Upload business images"
                      />
                    </>
                  ) : (
                    <div className="space-y-6">
                      {/* Preview */}
                      <div className="relative rounded-xl overflow-hidden bg-black/50">
                        <img
                          src={uploadedFiles[0].preview}
                          alt="Primary preview"
                          className="w-full h-auto max-h-96 object-contain"
                        />
                        {(analysisState.status === 'uploading' || analysisState.status === 'analyzing') && (
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                            <div className="text-center">
                              <Loader2 className="w-12 h-12 text-drishti-blue-400 animate-spin mx-auto mb-4" />
                              <p className="text-white text-lg font-semibold mb-2">
                                {analysisState.status === 'uploading' ? 'Uploading...' : 'Analyzing with AWS Bedrock...'}
                              </p>
                              <div className="w-64 bg-drishti-blue-900/50 rounded-full h-2 mx-auto">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${analysisState.progress}%` }}
                                  className="bg-gradient-to-r from-drishti-blue-400 to-drishti-blue-600 h-2 rounded-full"
                                />
                              </div>
                              <p className="text-drishti-blue-200 text-sm mt-2">{analysisState.progress}%</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {uploadedFiles.length > 1 && (
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                          {uploadedFiles.slice(1).map((file, index) => (
                            <div key={`${file.file.name}-${index}`} className="rounded-lg overflow-hidden border border-drishti-blue-500/20 bg-drishti-blue-900/20 hover:border-drishti-blue-300/60 transition-all duration-300">
                              <img src={file.preview} alt={file.file.name} className="w-full h-20 object-cover" />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      {analysisState.status === 'idle' && (
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-drishti-blue-200">
                            <p className="font-semibold text-white mb-1">{uploadedFiles.length} photo{uploadedFiles.length > 1 ? 's' : ''} selected</p>
                            <p>
                              First: {uploadedFiles[0].file.name} • {formatBytes(uploadedFiles[0].file.size)}
                            </p>
                          </div>
                          <div className="flex space-x-3">
                            <button
                              onClick={resetAnalysis}
                              className="float-on-hover px-4 py-2 text-drishti-blue-200 hover:text-white hover:bg-drishti-blue-500/20 rounded-lg transition-all duration-300 a11y-focus"
                            >
                              Change
                            </button>
                            <button
                              onClick={analyzeImage}
                              className="float-on-hover px-6 py-2 bg-gradient-to-r from-drishti-blue-500 to-drishti-blue-600 text-white rounded-lg hover:from-drishti-blue-400 hover:to-drishti-blue-500 transition-all duration-300 flex items-center space-x-2 glow-border a11y-focus"
                            >
                              <Brain className="w-5 h-5" />
                              <span>Analyze First Photo</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {(analysisState.status === 'uploading' || analysisState.status === 'analyzing') && (
                        <div className="sr-only" role="status" aria-live="polite">
                          {analysisState.status === 'uploading' ? 'Uploading image' : 'Analyzing image'} {analysisState.progress} percent complete
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
                )}

                {activeHomeSlidebar === 'services' && (
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ delay: 0.48 }}
                  className="glass-effect neon-panel rounded-2xl p-5 md:p-6 mb-8 border border-drishti-blue-300/45 shadow-[0_0_40px_rgba(26,145,255,0.22)]"
                >
                  <div className="grid xl:grid-cols-[1.45fr_0.95fr] gap-5">
                    <section aria-label="Billing and services cockpit" className="rounded-2xl border border-drishti-blue-400/35 bg-gradient-to-br from-drishti-blue-500/12 via-black/45 to-black/70 p-4 md:p-5 space-y-3 shadow-[0_0_42px_rgba(26,145,255,0.22)]">

                      <div className="grid md:grid-cols-[1.2fr_0.8fr] gap-3">
                        <Link href="/admin?section=billing" className="float-on-hover rounded-xl border border-drishti-blue-300/40 bg-gradient-to-r from-drishti-blue-500 to-drishti-blue-600 p-4 text-white flex items-center justify-between gap-3 min-h-[96px] a11y-focus" aria-label="Open billing system">
                          <span>
                            <span className="block text-[11px] uppercase tracking-[0.14em] text-drishti-blue-100">Primary Action</span>
                            <span className="block text-lg md:text-xl font-bold mt-1">Open Billing System</span>
                          </span>
                          <Zap className="w-7 h-7 text-white/90" />
                        </Link>

                        <div className="grid grid-rows-2 gap-3">
                          <Link href="/storefront" className="float-on-hover rounded-xl border border-drishti-blue-400/45 bg-drishti-blue-500/12 text-drishti-blue-50 px-4 py-2.5 flex items-center justify-between a11y-focus" aria-label="Open storefront">
                            <span className="text-sm font-semibold">Open Storefront</span>
                            <Eye className="w-4 h-4 text-drishti-blue-200" />
                          </Link>
                          <Link href="/admin?section=backup" className="float-on-hover rounded-xl border border-drishti-blue-500/35 bg-black/35 text-drishti-blue-100 px-4 py-2.5 flex items-center justify-between a11y-focus">
                            <span className="text-sm font-semibold">Backup Center</span>
                            <CheckCircle2 className="w-4 h-4 text-drishti-blue-200" />
                          </Link>
                        </div>
                      </div>

                      <div className="rounded-xl border border-drishti-blue-500/30 bg-black/35 p-3">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <p className="text-[11px] uppercase tracking-[0.14em] text-drishti-blue-300">Service Matrix</p>
                          <span className="text-[10px] uppercase tracking-[0.14em] text-drishti-blue-300">11 Modules</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2" role="list" aria-label="Dashboard sections">
                          {adminSectionLinks.map((link) => (
                            <Link key={link.href} href={link.href} className="float-on-hover inline-flex items-center justify-center rounded-lg px-3 py-2.5 text-xs md:text-sm font-semibold border border-drishti-blue-400/35 bg-drishti-blue-500/10 text-drishti-blue-100 hover:bg-drishti-blue-500/20 a11y-focus" role="listitem">
                              {link.label}
                            </Link>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-xl border border-drishti-blue-500/25 bg-black/35 p-3">
                        <p className="text-[11px] uppercase tracking-[0.14em] text-drishti-blue-300 mb-2">Power Shortcuts</p>
                        <div className="grid sm:grid-cols-2 gap-2 text-xs text-drishti-blue-100">
                          <span>Ctrl/Cmd + K → Command palette</span>
                          <span>/ → Focus command search</span>
                          <span>B/M/P/T → Quick module jump</span>
                          <span>Shift + F → Pin active module</span>
                        </div>
                      </div>
                    </section>

                    <section aria-label="Service intelligence" className="rounded-2xl border border-drishti-blue-500/30 bg-black/35 p-4 md:p-5 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-drishti-blue-100 text-sm md:text-base font-semibold tracking-wide">Service Intelligence Stack</p>
                        <span className="text-[10px] uppercase tracking-[0.14em] px-2 py-1 rounded-full border border-drishti-blue-400/40 bg-drishti-blue-500/12 text-drishti-blue-200">Live Radar</span>
                      </div>

                      <div className="space-y-3">
                        {quickAccessCards.map((card) => (
                          <Link key={card.href} href={card.href} className="float-on-hover flex items-start gap-3 rounded-xl border border-drishti-blue-500/30 bg-drishti-blue-500/8 p-3 hover:bg-drishti-blue-500/16 a11y-focus" aria-label={card.title}>
                            <span className="w-10 h-10 rounded-lg bg-drishti-blue-500/20 border border-drishti-blue-400/35 flex items-center justify-center">
                              <card.icon className="w-5 h-5 text-drishti-blue-200" />
                            </span>
                            <span>
                              <span className="block text-sm font-semibold text-white">{card.title}</span>
                              <span className="block text-xs text-drishti-blue-200 mt-0.5">{card.subtitle}</span>
                            </span>
                          </Link>
                        ))}
                      </div>

                      <div className="rounded-xl border border-drishti-blue-500/25 bg-black/35 p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-drishti-blue-200" />
                          <p className="text-[11px] uppercase tracking-[0.14em] text-drishti-blue-300">Trending Flows</p>
                        </div>
                        <div className="space-y-2 text-sm">
                          <Link href="/admin?section=marketing" className="float-on-hover block rounded-lg border border-drishti-blue-500/30 bg-black/35 px-3 py-2 text-drishti-blue-100 hover:bg-drishti-blue-500/15 a11y-focus">Generate campaign poster and share instantly</Link>
                          <Link href="/admin?section=tasks" className="float-on-hover block rounded-lg border border-drishti-blue-500/30 bg-black/35 px-3 py-2 text-drishti-blue-100 hover:bg-drishti-blue-500/15 a11y-focus">Plan daily work with task reminders</Link>
                          <Link href="/admin?section=backup" className="float-on-hover block rounded-lg border border-drishti-blue-500/30 bg-black/35 px-3 py-2 text-drishti-blue-100 hover:bg-drishti-blue-500/15 a11y-focus">Take one-click JSON/CSV safety backup</Link>
                        </div>
                      </div>

                      <div className="rounded-lg border border-drishti-blue-500/25 bg-black/30 p-3 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-drishti-blue-200 mt-0.5" />
                        <p className="text-xs text-drishti-blue-100">Everything is grouped for fast access: billing flow, service modules, and quick intelligence links.</p>
                      </div>
                    </section>
                  </div>
                </motion.div>
                )}

                {/* Features */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="grid md:grid-cols-3 gap-6"
                >
                  {[
                    {
                      icon: Target,
                      title: 'Problem Identification',
                      description: 'AI analyzes your image to identify business challenges and opportunities',
                    },
                    {
                      icon: TrendingUp,
                      title: 'Optimization Plans',
                      description: 'Get mathematical models and strategies to improve your operations',
                    },
                    {
                      icon: Code,
                      title: 'Implementation Guide',
                      description: 'Receive exact code and structure to build your solution dashboard',
                    },
                  ].map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className="glass-effect neon-panel interactive-glow rounded-xl p-6 hover:bg-drishti-blue-500/15 hover:border-drishti-blue-300/60 hover:-translate-y-1 transition-all duration-300"
                      onMouseMove={handleGlowMove}
                      onMouseLeave={handleGlowLeave}
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-drishti-blue-400 to-drishti-blue-600 rounded-lg flex items-center justify-center mb-4">
                        <feature.icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                      <p className="text-drishti-blue-200 text-sm">{feature.description}</p>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            ) : analysisState.status === 'completed' && analysisState.result ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Analysis Complete</h2>
                    <p className="text-drishti-blue-200">Your comprehensive business solution is ready</p>
                  </div>
                  <button
                    onClick={resetAnalysis}
                    className="float-on-hover px-4 py-2 text-drishti-blue-200 hover:text-white hover:bg-drishti-blue-500/20 rounded-lg transition-all flex items-center space-x-2"
                  >
                    <Zap className="w-4 h-4" />
                    <span>New Analysis</span>
                  </button>
                </div>

                <SolutionPreview result={analysisState.result} />
              </motion.div>
            ) : analysisState.status === 'error' ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-2xl mx-auto"
              >
                <div className="glass-effect rounded-2xl p-8 text-center">
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-8 h-8 text-red-400" />
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-2">Analysis Failed</h3>
                  <p className="text-red-300 mb-6">{analysisState.error}</p>
                  <button
                    onClick={resetAnalysis}
                    className="float-on-hover px-6 py-2 bg-gradient-to-r from-drishti-blue-500 to-drishti-blue-600 text-white rounded-lg hover:from-drishti-blue-600 hover:to-drishti-blue-700 transition-all"
                  >
                    Try Again
                  </button>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="container mx-auto px-4 py-6 mt-12 border-t border-drishti-blue-500/20">
          <div className="text-center text-drishti-blue-300 text-sm space-y-5">
            <p>Team Inventra • Serving Bharat</p>

            <div className="max-w-3xl mx-auto text-left">
              <h4 className="text-base font-semibold text-white mb-3 text-center">Creators</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-xl border border-drishti-blue-500/30 bg-drishti-blue-950/30 p-4">
                  <p className="text-white font-medium">Sai Badrishwar S S</p>
                  <a
                    href="mailto:badrishwar1289@gmail.com"
                    className="text-drishti-blue-200 hover:text-drishti-blue-100 transition-colors"
                  >
                    badrishwar1289@gmail.com
                  </a>
                  <p className="text-drishti-blue-300 mt-1">Student at RGIPT</p>
                </div>

                <div className="rounded-xl border border-drishti-blue-500/30 bg-drishti-blue-950/30 p-4">
                  <p className="text-white font-medium">Sakshi S S</p>
                  <a
                    href="mailto:sakshi.ss2024@vitstudent.ac"
                    className="text-drishti-blue-200 hover:text-drishti-blue-100 transition-colors"
                  >
                    sakshi.ss2024@vitstudent.ac
                  </a>
                  <p className="text-drishti-blue-300 mt-1">Student at VIT</p>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
 