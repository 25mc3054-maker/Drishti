'use client';

import { motion } from 'framer-motion';
import { Download, ExternalLink, CheckCircle2, Rocket, Calendar, DollarSign } from 'lucide-react';
import { useState } from 'react';

interface GeneratedDashboardProps {
  html: string;
  features: string[];
  howToUse: string;
  actionPlan?: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  financialImpact?: string;
  estimatedCost?: string;
  storefront?: {
    url?: string;
    customerUrl?: string;
    adminUrl?: string;
    shopName: string;
    catalogSize: number;
    operationGuide: string[];
  };
  generatedCredentials?: {
    username: string;
    password: string;
  };
}

export default function GeneratedDashboard({
  html,
  features,
  howToUse,
  actionPlan,
  financialImpact,
  estimatedCost,
  storefront,
  generatedCredentials,
}: GeneratedDashboardProps) {
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleGlowMove = (event: React.MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--mx', `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty('--my', `${event.clientY - rect.top}px`);
  };

  const handleGlowLeave = (event: React.MouseEvent<HTMLElement>) => {
    event.currentTarget.style.setProperty('--mx', '50%');
    event.currentTarget.style.setProperty('--my', '50%');
  };

  const downloadDashboard = () => {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-business-dashboard.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const openInNewTab = () => {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  // Backward compatibility: convert legacy /storefront?shop=<id> links to /customer-shop/<id>
  const rawCustomerPath = storefront?.customerUrl || storefront?.url || '';
  const normalizedCustomerPath = rawCustomerPath.startsWith('/storefront?shop=')
    ? `/customer-shop/${rawCustomerPath.split('shop=')[1] || ''}`
    : rawCustomerPath;

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-effect neon-panel interactive-glow rounded-2xl p-8 border-2 border-green-500/50"
        onMouseMove={handleGlowMove}
        onMouseLeave={handleGlowLeave}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <Rocket className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">Your Custom Dashboard is Ready!</h2>
                <p className="text-green-300 text-lg">A working solution built just for your business</p>
              </div>
            </div>

            {financialImpact && (
              <div className="flex items-center space-x-2 bg-green-500/20 border border-green-500/50 rounded-lg px-4 py-3 mb-4">
                <DollarSign className="w-6 h-6 text-green-400" />
                <span className="text-green-100 font-semibold">{financialImpact}</span>
              </div>
            )}

            {estimatedCost && (
              <div className="flex items-center space-x-2 text-gemini-blue-200">
                <Calendar className="w-5 h-5" />
                <span>Implementation Cost: {estimatedCost}</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={openInNewTab}
            className="float-on-hover flex items-center justify-center space-x-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
          >
            <ExternalLink className="w-6 h-6" />
            <span>Open AI Dashboard</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={downloadDashboard}
            className="float-on-hover flex items-center justify-center space-x-3 bg-gemini-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
          >
            <Download className="w-6 h-6" />
            <span>Download HTML Report</span>
          </motion.button>

          {normalizedCustomerPath && (
            <motion.a
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              href={normalizedCustomerPath}
              target="_blank"
              rel="noopener noreferrer"
              className="float-on-hover flex items-center justify-center space-x-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all md:col-span-2"
            >
              <ExternalLink className="w-6 h-6" />
              <span>🛍️ Open Customer Shop (Share on WhatsApp)</span>
            </motion.a>
          )}
        </div>
      </motion.div>

      {(storefront || generatedCredentials) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="glass-effect neon-panel interactive-glow rounded-2xl p-8"
          onMouseMove={handleGlowMove}
          onMouseLeave={handleGlowLeave}
        >
          <h3 className="text-2xl font-bold text-white mb-6">🎉 Your E-Commerce Store is LIVE!</h3>
          
          {storefront && (
            <div className="space-y-5">
              {/* Shop Info */}
              <div className="rounded-xl border border-gemini-blue-500/30 bg-gemini-blue-500/10 p-5">
                <p className="text-gemini-blue-300 text-sm mb-1">Shop Name</p>
                <p className="text-2xl font-bold text-white">{storefront.shopName}</p>
                <p className="text-gemini-blue-200 text-sm mt-2">📦 Catalog: {storefront.catalogSize} products</p>
              </div>

              {/* CUSTOMER SHOP URL - MOST IMPORTANT */}
              {normalizedCustomerPath && (
                <div className="rounded-xl border-2 border-green-500/60 bg-green-500/15 p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">🛍️</span>
                    <p className="text-green-300 font-semibold text-lg">Customer Shop Link (Share on WhatsApp)</p>
                  </div>
                  <div className="bg-black/50 rounded-lg p-4 mb-4 border border-green-500/30">
                    <p className="text-white font-mono text-sm break-all">
                      {typeof window !== 'undefined' ? `${window.location.origin}${normalizedCustomerPath}` : normalizedCustomerPath}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const url = typeof window !== 'undefined' ? `${window.location.origin}${normalizedCustomerPath}` : normalizedCustomerPath;
                      if (url) {
                        navigator.clipboard.writeText(url);
                        alert('Link copied to clipboard! Share on WhatsApp now.');
                      }
                    }}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-all"
                  >
                    📋 Copy Link & Share on WhatsApp
                  </button>
                  <p className="text-green-200 text-sm mt-3 text-center">
                    Customers can browse products, add to cart, and order directly from this link
                  </p>
                </div>
              )}

              {/* ADMIN PANEL URL */}
              {storefront.adminUrl && (
                <div className="rounded-xl border border-purple-500/40 bg-purple-500/10 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">⚙️</span>
                    <p className="text-purple-300 font-semibold">Your Shopkeeper Admin Panel</p>
                  </div>
                  <div className="bg-black/40 rounded-lg p-3 mb-3 border border-purple-500/20">
                    <p className="text-purple-100 font-mono text-sm break-all">
                      {typeof window !== 'undefined' ? `${window.location.origin}${storefront.adminUrl}` : storefront.adminUrl}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const url = typeof window !== 'undefined' ? `${window.location.origin}${storefront.adminUrl}` : storefront.adminUrl;
                      window.open(url, '_blank');
                    }}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded-lg transition-all"
                  >
                    Open Admin Panel
                  </button>
                  <p className="text-purple-200 text-xs mt-2">
                    View orders, manage inventory, and track sales
                  </p>
                </div>
              )}

              {/* OPERATION GUIDE */}
              {storefront.operationGuide?.length ? (
                <div>
                  <p className="text-white font-semibold mb-3">📋 How to Operate Your Store</p>
                  <div className="space-y-2">
                    {storefront.operationGuide.map((step, index) => (
                      <div key={index} className="rounded-lg border border-gemini-blue-500/25 bg-gemini-blue-500/10 px-3 py-2 text-gemini-blue-100 text-sm">
                        <span className="font-semibold text-green-400">Step {index + 1}:</span> {step}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {generatedCredentials && (
            <div className="rounded-xl border border-gemini-blue-500/35 bg-black/35 p-4 text-gemini-blue-100">
              <p className="text-white font-semibold mb-2">Shopkeeper Credentials (Saved in Email)</p>
              <p className="text-sm mb-1">Username: <span className="font-mono text-gemini-blue-300">{generatedCredentials.username}</span></p>
              <p className="text-sm">Password: <span className="font-mono text-gemini-blue-300">{generatedCredentials.password}</span></p>
              <p className="text-xs text-gemini-blue-300 mt-2">These credentials have been sent to your email for security</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Action Plan */}
      {actionPlan && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-effect neon-panel interactive-glow rounded-2xl p-8"
          onMouseMove={handleGlowMove}
          onMouseLeave={handleGlowLeave}
        >
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center space-x-3">
            <CheckCircle2 className="w-8 h-8 text-green-400" />
            <span>Step-by-Step Action Plan</span>
          </h3>

          <div className="space-y-6">
            {/* Immediate Actions */}
            <div>
              <h4 className="text-lg font-semibold text-green-400 mb-3">🚀 Do This Today (0-2 days)</h4>
              <div className="space-y-2">
                {actionPlan.immediate.map((action, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-3 bg-green-500/10 border border-green-500/30 rounded-lg p-4 interactive-glow"
                    onMouseMove={handleGlowMove}
                    onMouseLeave={handleGlowLeave}
                  >
                    <CheckCircle2 className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                    <span className="text-gemini-blue-100">{action}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Short Term Actions */}
            <div>
              <h4 className="text-lg font-semibold text-yellow-400 mb-3">📅 This Week/Month (1-4 weeks)</h4>
              <div className="space-y-2">
                {actionPlan.shortTerm.map((action, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 interactive-glow"
                    onMouseMove={handleGlowMove}
                    onMouseLeave={handleGlowLeave}
                  >
                    <Calendar className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0" />
                    <span className="text-gemini-blue-100">{action}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Long Term Actions */}
            <div>
              <h4 className="text-lg font-semibold text-blue-400 mb-3">🎯 Long Term (2-3 months)</h4>
              <div className="space-y-2">
                {actionPlan.longTerm.map((action, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-3 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 interactive-glow"
                    onMouseMove={handleGlowMove}
                    onMouseLeave={handleGlowLeave}
                  >
                    <Rocket className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                    <span className="text-gemini-blue-100">{action}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Dashboard Features */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-effect neon-panel interactive-glow rounded-2xl p-8"
        onMouseMove={handleGlowMove}
        onMouseLeave={handleGlowLeave}
      >
        <h3 className="text-xl font-bold text-white mb-4">✨ Dashboard Features</h3>
        <div className="grid md:grid-cols-2 gap-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex items-center space-x-3 bg-gemini-blue-500/10 border border-gemini-blue-500/30 rounded-lg p-3 interactive-glow"
              onMouseMove={handleGlowMove}
              onMouseLeave={handleGlowLeave}
            >
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span className="text-gemini-blue-100">{feature}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* How to Use */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-effect neon-panel interactive-glow rounded-2xl p-8 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30"
        onMouseMove={handleGlowMove}
        onMouseLeave={handleGlowLeave}
      >
        <h3 className="text-xl font-bold text-white mb-4">📖 How to Use Your Dashboard</h3>
        <p className="text-gemini-blue-100 leading-relaxed whitespace-pre-line">{howToUse}</p>
      </motion.div>

      {/* Preview Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-effect neon-panel interactive-glow rounded-2xl p-8"
        onMouseMove={handleGlowMove}
        onMouseLeave={handleGlowLeave}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">👀 Dashboard Preview</h3>
          <button
            onClick={() => setPreviewOpen(!previewOpen)}
            className="float-on-hover px-4 py-2 bg-gemini-blue-600 text-white rounded-lg hover:bg-gemini-blue-700 transition-colors"
          >
            {previewOpen ? 'Hide Preview' : 'Show Preview'}
          </button>
        </div>

        {previewOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-4 border-gemini-blue-500/30 rounded-xl overflow-hidden"
          >
            <iframe
              srcDoc={html}
              className="w-full h-[600px] bg-white"
              title="Dashboard Preview"
              sandbox="allow-scripts"
            />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
