'use client';

import { useState, useRef } from 'react';
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
import { AnalysisState, GeminiAnalysisResult, UploadedFile } from '@/types';
import { formatBytes, getSeverityColor, getSeverityBgColor } from '@/lib/utils';
import SolutionPreview from '@/components/SolutionPreview';
import AnalysisMetrics from '@/components/AnalysisMetrics';

export default function Home() {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    status: 'idle',
    progress: 0,
    result: null,
    error: null,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB for free tier)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'video/mp4', 'video/quicktime'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image (JPEG, PNG, WebP) or video (MP4, MOV)');
      return;
    }

    const fileType = file.type.startsWith('image/') ? 'image' : 'video';
    const previewUrl = URL.createObjectURL(file);

    setUploadedFile({
      file,
      preview: previewUrl,
      type: fileType,
    });

    toast.success(`${fileType === 'image' ? 'Image' : 'Video'} uploaded successfully (${formatBytes(file.size)})`);
  };

  const analyzeImage = async () => {
    if (!uploadedFile) {
      toast.error('Please upload an image or video first');
      return;
    }

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
      formData.append('file', uploadedFile.file);

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
    setUploadedFile(null);
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
    <div className="min-h-screen bg-gradient-to-br from-[#001429] via-[#002952] to-[#003d7a] relative overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gemini-blue-500/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gemini-blue-400/10 rounded-full blur-[150px] animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gemini-blue-600/5 rounded-full blur-[180px]" />
      </div>

      {/* Main content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-gemini-blue-500/20 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center space-x-3"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-gemini-blue-400 to-gemini-blue-600 rounded-lg flex items-center justify-center">
                  <Eye className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Drishti Agent</h1>
                  <p className="text-sm text-gemini-blue-200">Vision-to-Value Orchestrator</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center space-x-2 px-4 py-2 bg-gemini-blue-500/10 border border-gemini-blue-500/30 rounded-full"
              >
                <Sparkles className="w-4 h-4 text-gemini-blue-300" />
                <span className="text-sm text-gemini-blue-100">Powered by Gemini</span>
              </motion.div>
            </div>
          </div>
        </header>

        {/* Main dashboard */}
        <main className="container mx-auto px-4 py-8">
          <AnimatePresence mode="wait">
            {analysisState.status === 'idle' || analysisState.status === 'uploading' || analysisState.status === 'analyzing' ? (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-4xl mx-auto"
              >
                {/* Hero section */}
                <div className="text-center mb-12">
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-5xl md:text-6xl font-bold text-white mb-4"
                  >
                    The fastest <span className="gradient-text">path from prompt</span>
                  </motion.h2>
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-5xl md:text-6xl font-bold text-gemini-blue-300/60 mb-6"
                  >
                    to production
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-xl text-gemini-blue-100 max-w-2xl mx-auto"
                  >
                    Upload an image of your business scenario and get instant AI-powered insights, optimization plans, and implementation roadmaps.
                  </motion.p>
                </div>

                {/* Upload area */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="glass-effect rounded-2xl p-8 mb-8"
                >
                  {!uploadedFile ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gemini-blue-400/30 rounded-xl p-12 text-center cursor-pointer hover:border-gemini-blue-400/60 hover:bg-gemini-blue-500/5 transition-all duration-300 group"
                    >
                      <div className="flex justify-center mb-4">
                        <div className="w-20 h-20 bg-gemini-blue-500/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <Upload className="w-10 h-10 text-gemini-blue-300" />
                        </div>
                      </div>
                      <h3 className="text-2xl font-semibold text-white mb-2">Upload your business scenario</h3>
                      <p className="text-gemini-blue-200 mb-4">
                        Drop an image or video here, or click to browse
                      </p>
                      <div className="flex items-center justify-center space-x-4 text-sm text-gemini-blue-300">
                        <div className="flex items-center space-x-2">
                          <ImageIcon className="w-4 h-4" />
                          <span>JPEG, PNG, WebP</span>
                        </div>
                        <div className="w-1 h-1 bg-gemini-blue-400 rounded-full" />
                        <div className="flex items-center space-x-2">
                          <Video className="w-4 h-4" />
                          <span>MP4, MOV</span>
                        </div>
                        <div className="w-1 h-1 bg-gemini-blue-400 rounded-full" />
                        <span>Max 10MB</span>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Preview */}
                      <div className="relative rounded-xl overflow-hidden bg-black/50">
                        {uploadedFile.type === 'image' ? (
                          <img
                            src={uploadedFile.preview}
                            alt="Preview"
                            className="w-full h-auto max-h-96 object-contain"
                          />
                        ) : (
                          <video
                            src={uploadedFile.preview}
                            controls
                            className="w-full h-auto max-h-96"
                          />
                        )}
                        {(analysisState.status === 'uploading' || analysisState.status === 'analyzing') && (
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                            <div className="text-center">
                              <Loader2 className="w-12 h-12 text-gemini-blue-400 animate-spin mx-auto mb-4" />
                              <p className="text-white text-lg font-semibold mb-2">
                                {analysisState.status === 'uploading' ? 'Uploading...' : 'Analyzing with Gemini AI...'}
                              </p>
                              <div className="w-64 bg-gemini-blue-900/50 rounded-full h-2 mx-auto">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${analysisState.progress}%` }}
                                  className="bg-gradient-to-r from-gemini-blue-400 to-gemini-blue-600 h-2 rounded-full"
                                />
                              </div>
                              <p className="text-gemini-blue-200 text-sm mt-2">{analysisState.progress}%</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      {analysisState.status === 'idle' && (
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gemini-blue-200">
                            <p className="font-semibold text-white mb-1">{uploadedFile.file.name}</p>
                            <p>{formatBytes(uploadedFile.file.size)} • {uploadedFile.type}</p>
                          </div>
                          <div className="flex space-x-3">
                            <button
                              onClick={resetAnalysis}
                              className="px-4 py-2 text-gemini-blue-200 hover:text-white hover:bg-gemini-blue-500/20 rounded-lg transition-all"
                            >
                              Change
                            </button>
                            <button
                              onClick={analyzeImage}
                              className="px-6 py-2 bg-gradient-to-r from-gemini-blue-500 to-gemini-blue-600 text-white rounded-lg hover:from-gemini-blue-600 hover:to-gemini-blue-700 transition-all flex items-center space-x-2 glow-border"
                            >
                              <Brain className="w-5 h-5" />
                              <span>Analyze with AI</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>

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
                      className="glass-effect rounded-xl p-6 hover:bg-gemini-blue-500/15 transition-all duration-300"
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-gemini-blue-400 to-gemini-blue-600 rounded-lg flex items-center justify-center mb-4">
                        <feature.icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                      <p className="text-gemini-blue-200 text-sm">{feature.description}</p>
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
                    <p className="text-gemini-blue-200">Your comprehensive business solution is ready</p>
                  </div>
                  <button
                    onClick={resetAnalysis}
                    className="px-4 py-2 text-gemini-blue-200 hover:text-white hover:bg-gemini-blue-500/20 rounded-lg transition-all flex items-center space-x-2"
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
                    className="px-6 py-2 bg-gradient-to-r from-gemini-blue-500 to-gemini-blue-600 text-white rounded-lg hover:from-gemini-blue-600 hover:to-gemini-blue-700 transition-all"
                  >
                    Try Again
                  </button>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="container mx-auto px-4 py-6 mt-12 border-t border-gemini-blue-500/20">
          <div className="text-center text-gemini-blue-300 text-sm">
            <p>Built for Amazon Hackathon 2024 • Powered by Google Gemini AI • Serving Bharat</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
