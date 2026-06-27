import React, { useState, useEffect } from 'react';
import { Sparkles, ScanLine, BrainCircuit } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function AIScanner({ isAnalyzing }: { isAnalyzing: boolean }) {
  const [loadingText, setLoadingText] = useState('Initializing Gemini Vision...');
  
  useEffect(() => {
    if (!isAnalyzing) return;
    
    const stages = [
      'Extracting visual landmarks...',
      'Cross-referencing municipal codes...',
      'Calculating severity index...',
      'Drafting objective summary...',
      'Finalizing analysis...'
    ];
    
    let currentStage = 0;
    const interval = setInterval(() => {
      currentStage = (currentStage + 1) % stages.length;
      setLoadingText(stages[currentStage]);
    }, 800);
    
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  return (
    <AnimatePresence>
      {isAnalyzing && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 bg-slate-900/90 backdrop-blur-xl flex flex-col items-center justify-center overflow-hidden rounded-[24px]"
        >
          {/* Scanning Line Animation */}
          <motion.div
            animate={{ 
              top: ['0%', '100%', '0%'],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute w-full h-1 bg-cyan-400 shadow-[0_0_20px_5px_rgba(34,211,238,0.5)] z-0"
          />

          <div className="relative z-10 flex flex-col items-center gap-6">
            <div className="relative">
              <BrainCircuit className="w-16 h-16 text-cyan-400 animate-pulse" />
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute inset-[-10px] border border-cyan-500/30 rounded-full border-t-cyan-400 border-r-transparent border-b-transparent border-l-transparent"
              />
              <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute inset-[-20px] border border-cyan-500/20 rounded-full border-t-transparent border-r-cyan-400 border-b-transparent border-l-transparent"
              />
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 text-cyan-400 font-mono text-sm tracking-widest font-bold uppercase">
                <Sparkles className="w-4 h-4" />
                Gemini Vision Active
              </div>
              
              <motion.div 
                key={loadingText}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-white/80 font-medium text-sm text-center"
              >
                {loadingText}
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
