'use client';

import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Target,
  TrendingUp,
  Code2,
  Database,
  Layers,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Brain,
  Calculator,
  Zap,
} from 'lucide-react';
import { GeminiAnalysisResult } from '@/types';
import { getSeverityColor, getSeverityBgColor, calculateImprovementPercentage } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import GeneratedDashboard from './GeneratedDashboard';

interface SolutionPreviewProps {
  result: GeminiAnalysisResult;
}

export default function SolutionPreview({ result }: SolutionPreviewProps) {
  const safeResult = {
    problem: result.problem ?? {
      title: 'Unspecified problem',
      description: 'No description provided by the model.',
      severity: 'medium',
      category: 'general',
      impactAreas: [],
    },
    optimization: result.optimization ?? {
      strategy: 'No strategy provided.',
      mathematicalModel: {
        objective: '',
        constraints: [],
        variables: {},
        equations: [],
      },
      expectedImpact: [],
      timeline: 'TBD',
    },
    implementation: result.implementation ?? {
      architecture: {
        frontend: [],
        backend: [],
        database: [],
        apis: [],
      },
      codeStructure: [],
      dashboard: {
        widgets: [],
        layout: 'TBD',
      },
    },
    metadata: result.metadata ?? {
      confidence: 50,
      processingTime: 0,
      imageAnalysis: {
        objectsDetected: [],
        textExtracted: [],
        sceneDescription: 'Business scenario analysis',
      },
    },
  };

  const { problem, optimization, implementation, metadata } = safeResult;

  return (
    <div className="space-y-6">
      {/* Generated Dashboard - Most Important */}
      {result.generatedDashboard && (
        <GeneratedDashboard
          html={result.generatedDashboard.html}
          features={result.generatedDashboard.features}
          howToUse={result.generatedDashboard.howToUse}
          actionPlan={result.actionPlan}
          financialImpact={problem.financialImpact}
          estimatedCost={optimization.estimatedCost}
        />
      )}

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-effect rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gemini-blue-200 text-sm font-medium">Confidence Score</h3>
            <Brain className="w-5 h-5 text-gemini-blue-400" />
          </div>
          <p className="text-3xl font-bold text-white">{metadata.confidence}%</p>
          <div className="w-full bg-gemini-blue-900/50 rounded-full h-2 mt-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${metadata.confidence}%` }}
              transition={{ duration: 1, delay: 0.3 }}
              className="bg-gradient-to-r from-gemini-blue-400 to-gemini-blue-600 h-2 rounded-full"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-effect rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gemini-blue-200 text-sm font-medium">Severity</h3>
            <AlertTriangle className={`w-5 h-5 ${getSeverityColor(problem.severity)}`} />
          </div>
          <p className={`text-3xl font-bold capitalize ${getSeverityColor(problem.severity)}`}>
            {problem.severity}
          </p>
          <p className="text-gemini-blue-300 text-sm mt-2">{problem.category}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-effect rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gemini-blue-200 text-sm font-medium">Processing Time</h3>
            <Zap className="w-5 h-5 text-yellow-400" />
          </div>
          <p className="text-3xl font-bold text-white">
            {(metadata.processingTime / 1000).toFixed(2)}s
          </p>
          <p className="text-gemini-blue-300 text-sm mt-2">Lightning fast</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-effect rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gemini-blue-200 text-sm font-medium">Impact Areas</h3>
            <Target className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-3xl font-bold text-white">{problem.impactAreas?.length || 0}</p>
          <p className="text-gemini-blue-300 text-sm mt-2">Areas affected</p>
        </motion.div>
      </div>

      {/* Problem Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-effect rounded-2xl p-8"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Problem Identified</h2>
            <p className="text-gemini-blue-200">Core business challenge discovered</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">{problem.title}</h3>
            <p className="text-gemini-blue-100 leading-relaxed">{problem.description}</p>
          </div>

          {problem.impactAreas && problem.impactAreas.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gemini-blue-200 mb-3">Impact Areas:</h4>
              <div className="flex flex-wrap gap-2">
                {problem.impactAreas.map((area, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gemini-blue-500/20 border border-gemini-blue-500/30 rounded-full text-sm text-gemini-blue-100"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Optimization Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-effect rounded-2xl p-8"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Optimization Plan</h2>
            <p className="text-gemini-blue-200">Strategic approach and mathematical model</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Strategy</h3>
            <p className="text-gemini-blue-100 leading-relaxed">{optimization.strategy}</p>
          </div>

          {optimization.mathematicalModel && (
            <div className="bg-black/30 rounded-xl p-6 border border-gemini-blue-500/20">
              <div className="flex items-center space-x-2 mb-4">
                <Calculator className="w-5 h-5 text-gemini-blue-400" />
                <h3 className="text-lg font-semibold text-white">Mathematical Model</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-gemini-blue-300 mb-2">Objective:</h4>
                  <p className="text-gemini-blue-100 font-mono text-sm bg-gemini-blue-950/50 p-3 rounded">
                    {optimization.mathematicalModel.objective}
                  </p>
                </div>

                {optimization.mathematicalModel.constraints && optimization.mathematicalModel.constraints.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gemini-blue-300 mb-2">Constraints:</h4>
                    <ul className="space-y-2">
                      {optimization.mathematicalModel.constraints.map((constraint, index) => (
                        <li key={index} className="text-gemini-blue-100 font-mono text-sm bg-gemini-blue-950/50 p-2 rounded flex items-start">
                          <span className="text-gemini-blue-400 mr-2">•</span>
                          {constraint}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {optimization.mathematicalModel.equations && optimization.mathematicalModel.equations.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gemini-blue-300 mb-2">Equations:</h4>
                    <div className="space-y-2">
                      {optimization.mathematicalModel.equations.map((equation, index) => (
                        <div key={index} className="text-gemini-blue-100 font-mono text-sm bg-gemini-blue-950/50 p-3 rounded">
                          {equation}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {optimization.expectedImpact && optimization.expectedImpact.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Expected Impact</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {optimization.expectedImpact.map((impact, index) => {
                  const improvement = calculateImprovementPercentage(impact.currentValue, impact.projectedValue);
                  return (
                    <div key={index} className="bg-black/30 rounded-xl p-5 border border-gemini-blue-500/20">
                      <h4 className="text-white font-semibold mb-3">{impact.metric}</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-gemini-blue-300 text-sm">Current</span>
                          <span className="text-white font-semibold">{impact.currentValue}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gemini-blue-900/50 rounded-full h-2">
                            <div className="bg-red-500/50 h-2 rounded-full" style={{ width: '40%' }} />
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gemini-blue-300 text-sm">Projected</span>
                          <span className="text-green-400 font-semibold">{impact.projectedValue}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gemini-blue-900/50 rounded-full h-2">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: '80%' }}
                              transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                              className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-gemini-blue-500/20">
                          <span className="text-gemini-blue-300 text-sm">Improvement</span>
                          <span className="text-green-400 font-semibold flex items-center">
                            <TrendingUp className="w-4 h-4 mr-1" />
                            {improvement > 0 ? '+' : ''}{improvement.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {optimization.timeline && (
            <div className="flex items-center space-x-3 p-4 bg-gemini-blue-500/10 rounded-lg border border-gemini-blue-500/30">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <div>
                <span className="text-gemini-blue-200 text-sm">Implementation Timeline:</span>
                <span className="text-white font-semibold ml-2">{optimization.timeline}</span>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Implementation Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-effect rounded-2xl p-8"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
            <Code2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Implementation Guide</h2>
            <p className="text-gemini-blue-200">Technical architecture and code structure</p>
          </div>
        </div>

        <div className="space-y-6">
          {implementation.architecture && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Architecture</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {Object.entries(implementation.architecture).map(([key, values], index) => (
                  <div key={index} className="bg-black/30 rounded-xl p-5 border border-gemini-blue-500/20">
                    <div className="flex items-center space-x-2 mb-3">
                      {key === 'frontend' && <Layers className="w-5 h-5 text-blue-400" />}
                      {key === 'backend' && <Database className="w-5 h-5 text-green-400" />}
                      {key === 'database' && <Database className="w-5 h-5 text-purple-400" />}
                      {key === 'apis' && <Sparkles className="w-5 h-5 text-yellow-400" />}
                      <h4 className="text-white font-semibold capitalize">{key}</h4>
                    </div>
                    <ul className="space-y-2">
                      {(values as string[]).map((item, idx) => (
                        <li key={idx} className="text-gemini-blue-100 text-sm flex items-center">
                          <ArrowRight className="w-3 h-3 mr-2 text-gemini-blue-400" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {implementation.codeStructure && implementation.codeStructure.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Code Structure</h3>
              <div className="space-y-4">
                {implementation.codeStructure.map((component, index) => (
                  <div key={index} className="bg-black/30 rounded-xl border border-gemini-blue-500/20 overflow-hidden">
                    <div className="p-4 bg-gemini-blue-950/30 border-b border-gemini-blue-500/20">
                      <h4 className="text-white font-semibold">{component.component}</h4>
                      <p className="text-gemini-blue-200 text-sm mt-1">{component.purpose}</p>
                    </div>
                    <div className="p-4">
                      <pre className="text-gemini-blue-100 text-sm overflow-x-auto">
                        <code>{component.code}</code>
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {implementation.dashboard && implementation.dashboard.widgets && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Dashboard Widgets</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {implementation.dashboard.widgets.map((widget, index) => (
                  <div key={index} className="bg-black/30 rounded-xl p-5 border border-gemini-blue-500/20">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-white font-semibold">{widget.title}</h4>
                      <span className="px-2 py-1 bg-gemini-blue-500/20 rounded text-xs text-gemini-blue-300">
                        {widget.type}
                      </span>
                    </div>
                    <p className="text-gemini-blue-200 text-sm mb-2">{widget.dataSource}</p>
                    <p className="text-gemini-blue-300 text-xs">Visualization: {widget.visualization}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Metadata Section */}
      {metadata.imageAnalysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-effect rounded-2xl p-8"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Image Analysis</h2>
              <p className="text-gemini-blue-200">Visual elements detected by AI</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {metadata.imageAnalysis.objectsDetected && metadata.imageAnalysis.objectsDetected.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gemini-blue-300 mb-3">Objects Detected</h4>
                <div className="flex flex-wrap gap-2">
                  {metadata.imageAnalysis.objectsDetected.map((obj, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-full text-sm text-cyan-100"
                    >
                      {obj}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {metadata.imageAnalysis.textExtracted && metadata.imageAnalysis.textExtracted.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gemini-blue-300 mb-3">Text Extracted</h4>
                <div className="flex flex-wrap gap-2">
                  {metadata.imageAnalysis.textExtracted.map((text, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-sm text-purple-100"
                    >
                      {text}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {metadata.imageAnalysis.sceneDescription && (
              <div>
                <h4 className="text-sm font-semibold text-gemini-blue-300 mb-3">Scene Description</h4>
                <p className="text-gemini-blue-100 text-sm">{metadata.imageAnalysis.sceneDescription}</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
