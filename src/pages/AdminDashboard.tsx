import { useDemo } from '../context/DemoContext';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { 
  LayoutDashboard, 
  AlertCircle, 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  Layers, 
  AlertTriangle,
  Mail,
  Download,
  Sparkles,
  FileText,
  FileSpreadsheet,
  Send,
  ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getSeverityColor } from '../components/shared/CaseCard';
import { getLifecycleStage, getBlockerReason } from '../lib/caseLifecycle';
import { useState } from 'react';

export function AdminDashboard() {
  const { cases } = useDemo();
  const navigate = useNavigate();

  const [recipientEmail, setRecipientEmail] = useState(() => localStorage.getItem("planner_recipient_email") || "shaikkashif40@gmail.com");
  const [isExporting, setIsExporting] = useState(false);
  const [exportResponse, setExportResponse] = useState<any>(null);
  const [exportError, setExportError] = useState("");

  const urgentVerificationNeeded = cases.filter(c => getLifecycleStage(c) === 'Community verification needed' && c.severity >= 4);
  const duplicateFusionReview = cases.filter(c => c.duplicateRisk === 'High' && getLifecycleStage(c) !== 'Closed');
  const packetPreparationQueue = cases.filter(c => getLifecycleStage(c) === 'Community verified');
  const fixVerificationQueue = cases.filter(c => getLifecycleStage(c) === 'Fix verification needed' || getLifecycleStage(c) === 'Field repair claimed');
  const closedCount = cases.filter(c => getLifecycleStage(c) === 'Closed' || getLifecycleStage(c) === 'Fix verified').length;

  const handleSendReport = async () => {
    if (!recipientEmail) {
      setExportError("Please enter a valid recipient email.");
      return;
    }
    setIsExporting(true);
    setExportError("");
    setExportResponse(null);

    try {
      const response = await fetch("/api/export-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientEmail, cases })
      });

      const data = await response.json();
      if (!response.ok) {
        setExportError(data.error || "Failed to generate official report.");
      } else {
        setExportResponse(data);
        localStorage.setItem("planner_recipient_email", recipientEmail);
      }
    } catch (err: any) {
      setExportError(err.message || "Network error. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const downloadCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Case ID,Title,Category,Severity,Location,Latitude,Longitude,Status,Verifications,Suggested Department\n";
    
    cases.forEach((c) => {
      const row = [
        c.id,
        `"${c.title.replace(/"/g, '""')}"`,
        `"${c.category}"`,
        c.severity,
        `"${c.locationLabel.replace(/"/g, '""')}"`,
        c.lat,
        c.lng,
        `"${c.status}"`,
        c.verificationCount,
        `"${c.suggestedDepartment}"`
      ].join(",");
      csvContent += row + "\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "CivicPulse_City_Insight_Report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      <header className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-[#e2e8f0] dark:border-slate-700">
               <LayoutDashboard className="w-6 h-6 text-[#0f284b] dark:text-blue-400" />
             </div>
             <div>
               <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Civic Operations Console</h1>
               <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Demo overview of priority issues and community verification signals.</p>
             </div>
          </div>
          <div className="hidden md:flex text-sm font-bold text-slate-500 dark:text-slate-400 items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-full shadow-sm border border-[#e2e8f0] dark:border-slate-700">
             <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
             </span>
             System Online
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <Card className="shadow-sm border-[#e2e8f0] dark:border-slate-700 bg-white dark:bg-slate-800 rounded-[24px]">
           <CardContent className="p-4 md:p-5 flex flex-col gap-1">
             <div className="flex justify-between items-center mb-1">
               <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Urgent Verifications</span>
               <AlertCircle className="w-5 h-5 text-red-500" />
             </div>
             <span className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{urgentVerificationNeeded.length}</span>
           </CardContent>
         </Card>
         <Card className="shadow-sm border-[#e2e8f0] dark:border-slate-700 bg-white dark:bg-slate-800 rounded-[24px]">
           <CardContent className="p-4 md:p-5 flex flex-col gap-1">
             <div className="flex justify-between items-center mb-1">
               <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Packets to Prepare</span>
               <TrendingUp className="w-5 h-5 text-blue-500" />
             </div>
             <span className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{packetPreparationQueue.length}</span>
           </CardContent>
         </Card>
         <Card className="shadow-sm border-[#e2e8f0] dark:border-slate-700 bg-white dark:bg-slate-800 rounded-[24px]">
           <CardContent className="p-4 md:p-5 flex flex-col gap-1">
             <div className="flex justify-between items-center mb-1">
               <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Duplicate Fusion</span>
               <Layers className="w-5 h-5 text-amber-500" />
             </div>
             <span className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{duplicateFusionReview.length}</span>
           </CardContent>
         </Card>
         <Card className="shadow-sm border-[#e2e8f0] dark:border-slate-700 bg-white dark:bg-slate-800 rounded-[24px]">
           <CardContent className="p-4 md:p-5 flex flex-col gap-1">
             <div className="flex justify-between items-center mb-1">
               <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Closed</span>
               <CheckCircle2 className="w-5 h-5 text-emerald-500" />
             </div>
             <span className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{closedCount}</span>
           </CardContent>
         </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Urgent Queue */}
         <section className="flex flex-col gap-4">
           <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
             Urgent Verification Needed <Badge className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/30 rounded-full px-2 py-0.5">{urgentVerificationNeeded.length}</Badge>
           </h2>
           <div className="flex flex-col gap-3">
             {urgentVerificationNeeded.slice(0, 5).map(c => (
                <div key={c.id} className="bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 p-5 rounded-[24px] shadow-sm flex flex-col gap-3 cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 transition-colors" onClick={() => navigate(`/case/${c.id}`)}>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full truncate max-w-[150px]">{c.category}</span>
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full border shadow-sm shrink-0 ${getSeverityColor(c.severity)}`}>Sev {c.severity}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 leading-snug">{c.title}</h3>
                  <div className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-3 py-1.5 rounded-full w-fit border border-amber-200 dark:border-amber-800/30 mt-1">
                    Blocker: {getBlockerReason(c)}
                  </div>
                </div>
             ))}
             {urgentVerificationNeeded.length === 0 && (
               <div className="bg-white dark:bg-slate-800 p-6 rounded-[24px] border border-[#e2e8f0] dark:border-slate-700 text-center text-slate-500 dark:text-slate-400 text-sm font-medium shadow-sm">
                  No urgent verifications needed.
               </div>
             )}
           </div>
         </section>

         {/* Packet Preparation Queue */}
         <section className="flex flex-col gap-4">
           <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
             Packet Preparation Queue <Badge className="bg-slate-100 dark:bg-slate-800 text-[#0f284b] dark:text-blue-400 border-[#e2e8f0] dark:border-slate-700 rounded-full px-2 py-0.5">{packetPreparationQueue.length}</Badge>
           </h2>
           <div className="flex flex-col gap-3">
             {packetPreparationQueue.slice(0, 5).map(c => (
                <div key={c.id} className="bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 p-5 rounded-[24px] shadow-sm flex flex-col gap-3 cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 transition-colors" onClick={() => navigate(`/case/${c.id}`)}>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full truncate max-w-[180px]">{c.suggestedDepartment}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#0f284b] dark:text-blue-400 bg-[#f8f9fc] dark:bg-slate-900 border border-[#e2e8f0] dark:border-slate-700 px-2 py-1 rounded-full shrink-0">Community Verified</span>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 leading-snug">{c.title}</h3>
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-full border border-emerald-100 dark:border-emerald-800/30 w-fit font-bold"><CheckCircle2 className="w-3.5 h-3.5"/> Verified by {c.verificationCount} citizens</span>
                    <span className="text-[#0f284b] dark:text-blue-400 font-bold hover:underline">Prepare Packet &rarr;</span>
                  </div>
                </div>
             ))}
             {packetPreparationQueue.length === 0 && (
               <div className="bg-white dark:bg-slate-800 p-6 rounded-[24px] border border-[#e2e8f0] dark:border-slate-700 text-center text-slate-500 dark:text-slate-400 text-sm font-medium shadow-sm">
                 No packets need preparation.
               </div>
             )}
           </div>
         </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
         {/* Fix Verification Queue */}
         <section className="flex flex-col gap-4">
           <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
             Fix Verification Queue <Badge className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/30 rounded-full px-2 py-0.5">{fixVerificationQueue.length}</Badge>
           </h2>
           <div className="flex flex-col gap-3">
             {fixVerificationQueue.slice(0, 5).map(c => (
                <div key={c.id} className="bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 p-5 rounded-[24px] shadow-sm flex flex-col gap-3 cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 transition-colors" onClick={() => navigate(`/case/${c.id}`)}>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full truncate max-w-[150px]">{c.category}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/30 px-2 py-1 rounded-full shrink-0">Claimed Repair</span>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 leading-snug">{c.title}</h3>
                  <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> Awaiting citizen field verification.
                  </div>
                </div>
             ))}
             {fixVerificationQueue.length === 0 && (
               <div className="bg-white dark:bg-slate-800 p-6 rounded-[24px] border border-[#e2e8f0] dark:border-slate-700 text-center text-slate-500 dark:text-slate-400 text-sm font-medium shadow-sm">
                 No repairs pending verification.
               </div>
             )}
           </div>
         </section>

         {/* Duplicate Fusion Review */}
         <section className="flex flex-col gap-4">
           <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
             Duplicate Fusion Review <Badge className="bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/30 rounded-full px-2 py-0.5">{duplicateFusionReview.length}</Badge>
           </h2>
           <div className="flex flex-col gap-3">
             {duplicateFusionReview.map(c => (
                <div key={c.id} className="bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 p-5 rounded-[24px] shadow-sm flex flex-col gap-3 cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 transition-colors" onClick={() => navigate(`/case/${c.id}`)}>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/30 px-3 py-1.5 rounded-full flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> High Duplicate Risk</span>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 leading-snug">{c.title}</h3>
                  <div className="text-xs font-bold text-amber-700 dark:text-amber-400 mt-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> Pending fusion check
                  </div>
                </div>
             ))}
             {duplicateFusionReview.length === 0 && (
               <div className="bg-white p-6 rounded-[24px] border border-[#e2e8f0] text-center text-slate-500 text-sm font-medium shadow-sm">
                 No duplicates detected.
               </div>
             )}
           </div>
         </section>
      </div>

      {/* City Official Insight Export Engine */}
      <section className="bg-slate-900 text-white rounded-[32px] p-6 md:p-8 border border-slate-800 shadow-xl mt-6 flex flex-col gap-6 relative overflow-hidden">
        {/* Background mesh element */}
        <div className="absolute right-0 bottom-0 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-500/15 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <FileSpreadsheet className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">The "City Official" Export Engine</h2>
              <p className="text-xs text-slate-400 font-medium">B2B reporting suite for city managers, municipal engineers, and urban planners.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-slate-800/60 px-3.5 py-1.5 rounded-full border border-slate-700 w-fit">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Admin Tier Sovereign Tool
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
          {/* Controls Column */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Operation Overview</span>
              <p className="text-sm text-slate-300 leading-relaxed font-medium">
                Generate high-quality intelligence documents. CivicPulse translates citizen reports into structured budget forecasts and density maps, making it easy for slow or paper-based departments to execute work orders.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Recipient Planner Email</label>
                <div className="flex gap-2 mt-1">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="planner@municipal.gov"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t border-slate-900">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Export Protocols</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleSendReport}
                    disabled={isExporting}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-3 rounded-xl transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    {isExporting ? (
                      "Compiling..."
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        Email AI Report
                      </>
                    )}
                  </button>
                  <button
                    onClick={downloadCSV}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download CSV
                  </button>
                </div>
              </div>

              {exportError && (
                <p className="text-xs font-bold text-red-400 bg-red-950/20 border border-red-900/30 p-2.5 rounded-lg mt-1">
                  {exportError}
                </p>
              )}
            </div>
            
            <div className="bg-blue-950/20 border border-blue-900/30 p-4 rounded-2xl text-xs text-blue-300 leading-relaxed font-medium">
              <strong className="text-blue-400 block mb-1">💡 Hackathon Pitch Hack:</strong>
              Use your real email above and click <strong>"Email AI Report"</strong>. You will receive a beautifully formatted executive dashboard summary layout delivered straight to your inbox via Resend!
            </div>
          </div>

          {/* Interactive Live Preview / Stats Column */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Live Executive Digest Preview</span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Sync Active</span>
            </div>

            {isExporting ? (
              <div className="flex-1 min-h-[250px] bg-slate-950 border border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-3 p-8 text-center">
                <div className="w-8 h-8 rounded-full border-4 border-t-blue-500 border-slate-800 animate-spin" />
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-widest animate-pulse">Assembling Operations Report</span>
                  <p className="text-[10px] text-slate-400">Compiling category breakdown... Estimating municipal repair costs... Computing geographic hotspot metrics...</p>
                </div>
              </div>
            ) : exportResponse ? (
              <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col gap-4 overflow-hidden shadow-inner">
                <div className="flex justify-between items-center bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs">
                  <span className="flex items-center gap-1.5 font-bold text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    {exportResponse.simulated ? "Pre-rendering Compiled Document" : "Report Dispatched Successfully!"}
                  </span>
                  <span className="font-mono text-[9px] text-slate-400">ID: {exportResponse.messageId || "SIM-PREVIEW"}</span>
                </div>

                {/* Simulated Document Browser Frame */}
                <div className="bg-white text-slate-900 rounded-xl overflow-y-auto max-h-[240px] p-5 shadow-lg border border-slate-200">
                  <div dangerouslySetInnerHTML={{ __html: exportResponse.htmlContent }} />
                </div>
                
                <button 
                  onClick={() => setExportResponse(null)} 
                  className="text-xs text-slate-400 hover:text-slate-200 underline text-left cursor-pointer w-fit"
                >
                  &larr; Back to Stats Overview
                </button>
              </div>
            ) : (
              /* Stats Dashboard Overview */
              <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4">
                <div className="grid grid-cols-3 gap-3 text-center border-b border-slate-900 pb-4">
                  <div className="flex flex-col bg-slate-900/50 p-2.5 rounded-xl border border-slate-900">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Total Reports</span>
                    <span className="text-lg font-black text-white mt-0.5">{cases.length}</span>
                  </div>
                  <div className="flex flex-col bg-slate-900/50 p-2.5 rounded-xl border border-slate-900">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Verified Signals</span>
                    <span className="text-lg font-black text-emerald-400 mt-0.5">
                      {cases.filter(c => (c.verificationCount || 0) > 0).length}
                    </span>
                  </div>
                  <div className="flex flex-col bg-slate-900/50 p-2.5 rounded-xl border border-slate-900">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Aggregated Cost</span>
                    <span className="text-lg font-black text-red-400 mt-0.5">
                      ${cases.reduce((acc, c) => {
                        let baseCost = 250;
                        const lowerCat = c.category.toLowerCase();
                        if (lowerCat.includes("pothole") || lowerCat.includes("road")) baseCost = 350;
                        else if (lowerCat.includes("water") || lowerCat.includes("leak")) baseCost = 1500;
                        else if (lowerCat.includes("streetlight") || lowerCat.includes("light")) baseCost = 200;
                        else if (lowerCat.includes("garbage") || lowerCat.includes("waste")) baseCost = 150;
                        else if (lowerCat.includes("power") || lowerCat.includes("electric")) baseCost = 4500;
                        return acc + (baseCost * (c.severity || 3));
                      }, 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Geographic Cluster Rankings</span>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Render top clusters */}
                    <div className="bg-slate-900/30 p-3 rounded-xl border border-slate-900/80 flex flex-col gap-1.5">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Neighborhood Densities</span>
                      <div className="flex flex-col gap-1 text-[11px] font-semibold text-slate-300">
                        {Object.entries(
                          cases.reduce((acc: any, c) => {
                            const k = c.locationLabel.split(",")[0]?.trim() || "Downtown";
                            acc[k] = (acc[k] || 0) + 1;
                            return acc;
                          }, {})
                        )
                        .sort((a: any, b: any) => b[1] - a[1])
                        .slice(0, 3)
                        .map(([neigh, count], index) => (
                          <div key={neigh} className="flex justify-between items-center border-b border-slate-900/40 pb-0.5">
                            <span className="truncate max-w-[120px] text-slate-400">{index + 1}. {neigh}</span>
                            <span className="text-red-400 font-bold">{count} cases</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-900/30 p-3 rounded-xl border border-slate-900/80 flex flex-col gap-1.5">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Budget Allocation Priority</span>
                      <div className="flex flex-col gap-1 text-[11px] font-semibold text-slate-300">
                        {Object.entries(
                          cases.reduce((acc: any, c) => {
                            const k = c.category || "General";
                            acc[k] = (acc[k] || 0) + 1;
                            return acc;
                          }, {})
                        )
                        .sort((a: any, b: any) => b[1] - a[1])
                        .slice(0, 3)
                        .map(([cat, count], index) => (
                          <div key={cat} className="flex justify-between items-center border-b border-slate-900/40 pb-0.5">
                            <span className="truncate max-w-[110px] text-slate-400">{index + 1}. {cat}</span>
                            <span className="text-blue-400 font-bold">{count} items</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

     </div>
  )
}
