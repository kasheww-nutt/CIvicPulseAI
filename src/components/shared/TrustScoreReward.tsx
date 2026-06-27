import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trophy } from 'lucide-react';

export function TrustScoreReward({ score }: { score: number }) {
  const [show, setShow] = useState(false);
  const [diff, setDiff] = useState(0);
  const prevScoreRef = useRef(score);

  useEffect(() => {
    if (score > prevScoreRef.current) {
      setDiff(score - prevScoreRef.current);
      setShow(true);
      prevScoreRef.current = score;
      
      const timer = setTimeout(() => setShow(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [score]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.5, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -20 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <div className="bg-slate-900/90 backdrop-blur-md border border-cyan-500/50 p-4 rounded-[24px] shadow-[0_0_30px_rgba(34,211,238,0.3)] flex flex-col items-center justify-center min-w-[200px]">
             <div className="absolute -top-6">
                <div className="bg-cyan-500 p-3 rounded-full border-4 border-slate-900 shadow-lg relative">
                   <Trophy className="w-6 h-6 text-white" />
                   <Sparkles className="w-4 h-4 text-yellow-300 absolute -top-1 -right-1 animate-pulse" />
                </div>
             </div>
             
             <div className="mt-4 text-center">
                <div className="text-cyan-400 font-black text-2xl tracking-tighter">+{diff} Trust</div>
                <div className="text-slate-300 text-[11px] font-bold uppercase tracking-wider mt-1">Civic Duty Rewarded</div>
             </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
