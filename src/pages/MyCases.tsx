import { useDemo } from '../context/DemoContext';
import { MissionRow } from '../components/shared/MissionRow';
import { LayoutDashboard, CheckCircle2, ShieldCheck, ArrowLeft, FileText, ChevronDown, Filter, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export function MyCases() {
  const { cases, verifyCase } = useDemo();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'active' | 'verified' | 'resolved'>('active');

  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [filterMode, setFilterMode] = useState<'all' | 'high_severity'>('all');

  // Simple mocking: cases that are verified by me
  const verifiedCases = cases.filter(c => c.verifiedByMe);
  
  // Resolved cases
  const resolvedCases = cases.filter(c => c.status === 'Resolved' || c.status === 'Fix Verified');
  
  // Reported / followed cases (for demo, just take cases that aren't resolved or verified)
  const activeCases = cases.filter(c => !c.verifiedByMe && c.status !== 'Resolved' && c.status !== 'Fix Verified');

  const getActiveList = () => {
    let list;
    switch(activeTab) {
      case 'active': list = activeCases; break;
      case 'verified': list = verifiedCases; break;
      case 'resolved': list = resolvedCases; break;
    }
    
    // Apply Filter
    if (filterMode === 'high_severity') {
      list = list.filter(c => c.severity >= 5);
    }
    
    // Apply Sort (assuming c.id or we can mock date, but we don't have date, so we reverse for oldest)
    if (sortOrder === 'oldest') {
      list = [...list].reverse();
    }
    
    return list;
  };

  const list = getActiveList();

  const toggleSort = () => {
    setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest');
  };

  const toggleFilter = () => {
    setFilterMode(prev => prev === 'all' ? 'high_severity' : 'all');
  };

  const tabs = [
    { id: 'active', label: `Active (${activeCases.length})` },
    { id: 'verified', label: `Verified (${verifiedCases.length})` },
    { id: 'resolved', label: `Resolved (${resolvedCases.length})` },
  ] as const;

  return (
    <div className="flex flex-col bg-[#f8f9fc] dark:bg-transparent min-h-screen font-sans">
      <div className="bg-white dark:bg-slate-900 px-6 pt-6 pb-4 border-b border-[#e2e8f0] dark:border-slate-800 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => navigate('/')} className="p-1 -ml-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
            <FileText className="w-6 h-6 text-[#0f284b] dark:text-blue-400" />
            My Reports
          </h1>
        </div>

        <div className="flex gap-2 bg-white dark:bg-slate-800 p-1.5 rounded-full border border-[#e2e8f0] dark:border-slate-700 relative shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 text-xs font-bold py-2.5 rounded-full transition-colors relative z-10 ${
                activeTab === tab.id ? 'text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 bg-[#0f284b] dark:bg-blue-600 rounded-full shadow-sm -z-10"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 sm:p-6 flex flex-col gap-4">
        {/* Stats Row */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-3"
        >
          <div className="bg-white dark:bg-slate-800 rounded-[16px] border border-[#e2e8f0] dark:border-slate-700 p-3 flex items-center justify-between shadow-sm">
             <div className="flex items-center gap-2 shrink-0">
               <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-2 rounded-full">
                 <FileText className="w-4 h-4" />
               </div>
               <div className="flex flex-col">
                 <span className="text-[13px] font-bold leading-none dark:text-slate-200">{list.length}</span>
                 <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium capitalize">{activeTab}</span>
               </div>
             </div>
             
             <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 shrink-0" />
             
             <div className="flex items-center gap-2 shrink-0">
               <div className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 p-2 rounded-full border border-slate-100 dark:border-slate-700">
                 <MapPin className="w-4 h-4" />
               </div>
               <div className="flex flex-col hidden sm:flex">
                 <span className="text-[13px] font-bold leading-none dark:text-slate-200">1.0 km</span>
                 <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Total distance</span>
               </div>
               <div className="flex flex-col sm:hidden">
                 <span className="text-[13px] font-bold leading-none dark:text-slate-200">1km</span>
               </div>
             </div>

             <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 shrink-0" />
             
             <div className="flex items-center gap-2 shrink-0">
               <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-2 rounded-full border border-blue-100 dark:border-blue-800/30">
                 <ShieldCheck className="w-4 h-4" />
               </div>
               <div className="flex flex-col hidden sm:flex">
                 <span className="text-[13px] font-bold leading-none dark:text-slate-200">14</span>
                 <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Trust points</span>
               </div>
               <div className="flex flex-col sm:hidden">
                 <span className="text-[13px] font-bold leading-none dark:text-slate-200">14</span>
               </div>
             </div>
          </div>
          
          <div className="flex items-center gap-2">
             <button onClick={toggleSort} className="flex-1 flex items-center justify-between bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 rounded-[12px] px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                Sort: {sortOrder === 'newest' ? 'Newest' : 'Oldest'} <ChevronDown className="w-4 h-4 text-slate-400" />
             </button>
             <button onClick={toggleFilter} className={`flex items-center justify-center border rounded-[12px] w-[42px] h-[42px] shadow-sm transition-colors shrink-0 ${filterMode === 'high_severity' ? 'bg-[#0f284b] dark:bg-blue-600 text-white border-[#0f284b] dark:border-blue-600' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-[#e2e8f0] dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                <Filter className="w-4 h-4" />
             </button>
          </div>
        </motion.div>

        {list.length > 0 ? (
          <div className="flex flex-col gap-3 sm:gap-4 relative z-0">
            <AnimatePresence mode="popLayout">
              {list.map((c, i) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -20 }}
                  transition={{ 
                    duration: 0.3,
                    delay: i * 0.05,
                    layout: { type: "spring", bounce: 0.3 }
                  }}
                  key={c.id}
                >
                  <MissionRow 
                    item={c} 
                    onVerify={() => verifyCase(c.id, 'verify')}
                    compact={false}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-12 text-center text-slate-500 flex flex-col items-center gap-4 mt-8"
          >
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center border border-[#e2e8f0]">
              <ShieldCheck className="w-8 h-8 text-slate-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-700">No cases found</h3>
              <p className="text-xs mt-1 font-medium text-slate-500">Cases in this status will appear here.</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
