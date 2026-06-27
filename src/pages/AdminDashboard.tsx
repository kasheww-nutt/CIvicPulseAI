import React, { useState } from 'react';
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
  ShieldCheck,
  Sliders,
  DollarSign,
  Inbox,
  UserPlus,
  Radio,
  Smartphone,
  Check,
  X,
  AlertOctagon,
  Wrench,
  Building2,
  ShieldAlert,
  ArrowRight,
  ShieldAlert as FraudIcon,
  BookOpen
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getSeverityColor } from '../components/shared/CaseCard';
import { getLifecycleStage, getBlockerReason } from '../lib/caseLifecycle';

export function AdminDashboard() {
  const { cases, userRole } = useDemo();
  const navigate = useNavigate();

  // --- STEWARD VIEWS DATA ---
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

  // --- NEW INTERACTIVE ADMIN STATE ---
  // A. System Parameters Config
  const [slaHours, setSlaHours] = useState(24);
  const [rewardMultiplier, setRewardMultiplier] = useState(1.5);
  const [twilioSmsNotification, setTwilioSmsNotification] = useState(true);
  const [autoNotifyWarden, setAutoNotifyWarden] = useState(false);
  const [directApiHook, setDirectApiHook] = useState(true);
  const [systemLogs, setSystemLogs] = useState<string[]>([
    "System parameters successfully initialized.",
    "Twilio SMS gateway link configured.",
    "Bounty multiplier set to default 1.5x."
  ]);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setSystemLogs(prev => [`[${time}] ${msg}`, ...prev]);
  };

  // B. Steward Assignments
  const [stewards, setStewards] = useState([
    { id: 'st-1', name: 'Arjun Mehta', ward: 'Indiranagar', category: 'Pothole / road damage', activeCases: 4, trustRating: '98%', status: 'Active' },
    { id: 'st-2', name: 'Priya Sharma', ward: 'Koramangala', category: 'Broken streetlight', activeCases: 2, trustRating: '99%', status: 'Active' },
    { id: 'st-3', name: 'Rajesh Kumar', ward: 'Indiranagar', category: 'Water leakage', activeCases: 7, trustRating: '95%', status: 'Active' },
    { id: 'st-4', name: 'Sneha Reddy', ward: 'Whitefield', category: 'Garbage overflow', activeCases: 5, trustRating: '97%', status: 'Active' }
  ]);
  const [newStewardName, setNewStewardName] = useState("");
  const [newStewardWard, setNewStewardWard] = useState("Indiranagar");
  const [newStewardCategory, setNewStewardCategory] = useState("Pothole / road damage");

  const handleAddSteward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStewardName.trim()) return;
    const newSt = {
      id: `st-${stewards.length + 1}`,
      name: newStewardName,
      ward: newStewardWard,
      category: newStewardCategory,
      activeCases: 0,
      trustRating: '100%',
      status: 'Active'
    };
    setStewards(prev => [...prev, newSt]);
    addLog(`Assigned Steward ${newStewardName} to Ward ${newStewardWard} for category: ${newStewardCategory}`);
    setNewStewardName("");
  };

  const handleRevokeSteward = (id: string, name: string) => {
    setStewards(prev => prev.map(s => s.id === id ? { ...s, status: s.status === 'Active' ? 'Revoked' : 'Active' } : s));
    const currentSt = stewards.find(s => s.id === id);
    const action = currentSt?.status === 'Active' ? 'Revoked' : 'Reinstated';
    addLog(`${action} credentials for Steward ${name}`);
  };

  // C. Fraud/Integrity Engine
  const [fraudAlerts, setFraudAlerts] = useState([
    { id: 'fr-1', user: 'Rohan_99', reason: 'High similarity in image uploads (potential stock match)', anomalyScore: 88, status: 'Flagged', location: 'Indiranagar' },
    { id: 'fr-2', user: 'Aisha_K', reason: 'Multiple rapid duplicates submitted in < 5 mins', anomalyScore: 92, status: 'Flagged', location: 'Whitefield' },
    { id: 'fr-3', user: 'Vikram_X', reason: 'Repeated self-verification patterns flagged by AI model', anomalyScore: 74, status: 'Flagged', location: 'Koramangala' }
  ]);

  const handleActionFraud = (id: string, user: string, action: 'blacklist' | 'dismiss') => {
    if (action === 'blacklist') {
      setFraudAlerts(prev => prev.map(f => f.id === id ? { ...f, status: 'Blacklisted' } : f));
      addLog(`ADMIN ACTION: Blacklisted citizen ${user} due to pattern manipulation alerts.`);
    } else {
      setFraudAlerts(prev => prev.filter(f => f.id !== id));
      addLog(`ADMIN ACTION: Dismissed fraud alert for citizen ${user}. No anomaly confirmed.`);
    }
  };

  // D. Disbursals, Ledger & Money Flow
  const [disbursals, setDisbursals] = useState([
    { id: 'ds-1', user: 'shaikkashif40@gmail.com', amount: 25.50, method: 'PayPal', status: 'Pending Approval', timestamp: '2 hours ago' },
    { id: 'ds-2', user: 'kavitha_b', amount: 15.00, method: 'Bank Transfer', status: 'Pending Approval', timestamp: '5 hours ago' },
    { id: 'ds-3', user: 'rahul_m', amount: 45.75, method: 'UPI', status: 'Approved & Disbursed', timestamp: '1 day ago' },
    { id: 'ds-4', user: 'anil_sharma', amount: 12.00, method: 'PayPal', status: 'Approved & Disbursed', timestamp: '2 days ago' }
  ]);

  const handleApproveDisbursal = (id: string, user: string, amount: number) => {
    setDisbursals(prev => prev.map(d => d.id === id ? { ...d, status: 'Approved & Disbursed' } : d));
    addLog(`Approved ledger disbursal of $${amount.toFixed(2)} to ${user}. Sent instructions to municipal treasury bank portal.`);
  };

  // E. Municipal Inbox
  const [inboxMessages, setInboxMessages] = useState([
    { id: 'ib-1', sender: 'Director, Indiranagar Water Supply', subject: 'Pipe burst ticket integration (#WS-401)', snippet: 'We detected a spike in community reports of Indiranagar metro water leakage. Please link this to our official work order.', date: '10 mins ago', acknowledged: false },
    { id: 'ib-2', sender: 'ACP Traffic, Koramangala Zone', subject: 'Road defect verification priority request', snippet: 'Traffic congestion is critical at 100 Feet Rd due to pothole. Requesting immediate steward prioritization.', date: '1 hour ago', acknowledged: false },
    { id: 'ib-3', sender: 'SWM Joint Commissioner', subject: 'Garbage landfill collection delay alert', snippet: 'Please throttle high-severity garbage alerts for Koramangala Block A until Sunday morning as trash trucks are delayed.', date: '3 hours ago', acknowledged: false }
  ]);

  const handleAcknowledgeMessage = (id: string, sender: string) => {
    setInboxMessages(prev => prev.map(m => m.id === id ? { ...m, acknowledged: true } : m));
    addLog(`Acknowledged departmental message from ${sender}. Integrated coordination metrics.`);
  };

  const handleRelayTwilio = (sender: string, subject: string) => {
    addLog(`RELAY PROTOCOL: Broadcasted departmental priority to active Stewards in the zone via automated Twilio SMS alert.`);
  };

  const handleDeployRules = () => {
    addLog(`DEPLOYMENT SUCCESS: Live system rules updated! SLA set to ${slaHours}h, bounty multiplier at ${rewardMultiplier}x.`);
    alert(`Configuration deployed successfully!\n- SLA Response Target: ${slaHours} Hours\n- Bounty Reward Rate: ${rewardMultiplier}x\n- Twilio Alerts Gateways updated.`);
  };


  // ==========================================
  // RENDER PORTAL
  // ==========================================

  // 1. CHOOSE STEWARD OPERATIONAL DASHBOARD
  if (userRole === 'steward') {
    return (
      <div className="flex flex-col gap-6 max-w-6xl mx-auto p-4 md:p-6">
        <header className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-[#e2e8f0] dark:border-slate-700">
                 <LayoutDashboard className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
               </div>
               <div>
                 <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Civic Operations Console</h1>
                 <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Steward overview of priority issues and community verification signals.</p>
               </div>
            </div>
            <div className="hidden md:flex text-sm font-bold text-emerald-600 dark:text-emerald-400 items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-2 rounded-full border border-emerald-200 dark:border-emerald-800/30">
               <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
               </span>
               Steward Operations Active
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
              Steward Console Sovereign Tool
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
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
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-3 rounded-xl transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      {isExporting ? "Compiling..." : <><Send className="w-3.5 h-3.5" /> Email AI Report</>}
                    </button>
                    <button
                      onClick={downloadCSV}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" /> Download CSV
                    </button>
                  </div>
                </div>

                {exportError && (
                  <p className="text-xs font-bold text-red-400 bg-red-950/20 border border-red-900/30 p-2.5 rounded-lg mt-1">
                    {exportError}
                  </p>
                )}
              </div>
            </div>

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

                  <div className="bg-white text-slate-900 rounded-xl overflow-y-auto max-h-[240px] p-5 shadow-lg border border-slate-200">
                    <div dangerouslySetInnerHTML={{ __html: exportResponse.htmlContent }} />
                  </div>
                  
                  <button onClick={() => setExportResponse(null)} className="text-xs text-slate-400 hover:text-slate-200 underline text-left cursor-pointer w-fit">
                    &larr; Back to Stats Overview
                  </button>
                </div>
              ) : (
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
                          return acc + (baseCost * (c.severity || 3));
                        }, 0).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Geographic Cluster Rankings</span>
                    <div className="grid grid-cols-2 gap-3">
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
    );
  }

  // ==========================================
  // 2. CHOOSE SYSTEM ADMIN CONTROL PANEL (THE BRAND NEW REQUESTED VIEW)
  // ==========================================
  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto p-4 md:p-6 text-slate-900 dark:text-slate-100">
      
      {/* Sovereign Admin Header */}
      <header className="flex flex-col gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center border border-blue-200 dark:border-blue-800/40 shadow-sm shrink-0">
              <ShieldCheck className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-md border border-blue-100 dark:border-blue-900/30">MUNICIPAL CORE OVERRIDE</span>
                <span className="text-xs font-bold text-emerald-500">● Live Synchronization</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white mt-1">Sovereign Admin Control Panel</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Control municipal parameters, assign stewards, inspect ledger transactions, direct departmental inbox integration, and run system fraud algorithms.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
            <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col items-end text-right">
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Active SLA Core</span>
              <span className="text-sm font-black text-slate-800 dark:text-white">{slaHours}h Target</span>
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col items-end text-right">
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Multiplier rate</span>
              <span className="text-sm font-black text-slate-800 dark:text-white">{rewardMultiplier.toFixed(1)}x rewards</span>
            </div>
          </div>
        </div>
      </header>

      {/* Dynamic Action Logger / Console Feed */}
      <section className="bg-slate-950 text-slate-200 rounded-[24px] p-4 font-mono text-xs border border-slate-800 shadow-inner">
        <div className="flex items-center justify-between border-b border-slate-900 pb-2 mb-2">
          <span className="flex items-center gap-2 font-black text-[10px] uppercase text-blue-400 tracking-wider">
            <Radio className="w-4 h-4 text-blue-400 animate-pulse" /> Live Administration Log Protocols
          </span>
          <span className="text-[9px] text-slate-500">System State: Ready</span>
        </div>
        <div className="flex flex-col gap-1 max-h-[85px] overflow-y-auto font-mono text-slate-300">
          {systemLogs.map((log, i) => (
            <div key={i} className="flex gap-2 text-[11px]">
              <span className="text-slate-500 select-none">&gt;</span>
              <span className={log.includes("ACTION") ? "text-amber-400 font-bold" : log.includes("SUCCESS") ? "text-emerald-400 font-bold" : "text-slate-300"}>{log}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Top Level Key-Metrics Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[24px] p-5 shadow-sm flex flex-col gap-1">
          <div className="flex justify-between items-center text-slate-400 dark:text-slate-500">
            <span className="text-[10px] font-black uppercase tracking-wider">Registered Stewards</span>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {stewards.filter(s => s.status === 'Active').length} <span className="text-xs font-medium text-slate-500">active</span>
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[24px] p-5 shadow-sm flex flex-col gap-1">
          <div className="flex justify-between items-center text-slate-400 dark:text-slate-500">
            <span className="text-[10px] font-black uppercase tracking-wider">Fraud Alerts Risk</span>
            <FraudIcon className="w-5 h-5 text-amber-500" />
          </div>
          <span className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {fraudAlerts.filter(a => a.status === 'Flagged').length} <span className="text-xs font-medium text-slate-500">flagged</span>
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[24px] p-5 shadow-sm flex flex-col gap-1">
          <div className="flex justify-between items-center text-slate-400 dark:text-slate-500">
            <span className="text-[10px] font-black uppercase tracking-wider">Pending Claims Disbursals</span>
            <DollarSign className="w-5 h-5 text-emerald-500" />
          </div>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {disbursals.filter(d => d.status.startsWith('Pending')).length} <span className="text-xs font-medium text-slate-500">claims</span>
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[24px] p-5 shadow-sm flex flex-col gap-1">
          <div className="flex justify-between items-center text-slate-400 dark:text-slate-500">
            <span className="text-[10px] font-black uppercase tracking-wider">Official Inbound</span>
            <Inbox className="w-5 h-5 text-purple-500" />
          </div>
          <span className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
            {inboxMessages.filter(m => !m.acknowledged).length} <span className="text-xs font-medium text-slate-500">pending sync</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Parametric Slider Settings & Steward Assignments (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Section 1: System Parameters & Twilio Dispatch Sim */}
          <Card className="rounded-[32px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <CardContent className="p-6 flex flex-col gap-5">
              <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-blue-600 dark:text-blue-400" /> System Parameters & Twilio Rules
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Control core response SLAs, financial multiplier gates, and active Twilio dispatch settings.</p>
                </div>
                <Badge className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">Dynamic config</Badge>
              </div>

              {/* Sliders */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <span>SLA Response Target</span>
                    <span className="text-blue-600 dark:text-blue-400 text-sm font-black">{slaHours} Hours</span>
                  </div>
                  <input 
                    type="range" 
                    min={12} 
                    max={72} 
                    step={6}
                    value={slaHours}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setSlaHours(val);
                      addLog(`Adjusted local state SLA Target to ${val} Hours.`);
                    }}
                    className="w-full accent-blue-600 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-400">Determines case urgency escalation milestones.</span>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <span>Bounty Reward Multiplier</span>
                    <span className="text-blue-600 dark:text-blue-400 text-sm font-black">{rewardMultiplier.toFixed(1)}x Rate</span>
                  </div>
                  <input 
                    type="range" 
                    min={1.0} 
                    max={3.0} 
                    step={0.1}
                    value={rewardMultiplier}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setRewardMultiplier(val);
                      addLog(`Adjusted local state Reward Multiplier to ${val.toFixed(1)}x.`);
                    }}
                    className="w-full accent-blue-600 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-400">Multiplies the USD bounty rewards issued to verifying citizens.</span>
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-col gap-3.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Twilio Gateway Protocols</span>
                
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-start gap-2.5">
                    <Smartphone className="w-5 h-5 text-slate-500 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold">Severity 5 Twilio Dispatch Broadcast</p>
                      <p className="text-[10px] text-slate-500">Automatically broadcast emergency SMS alerts to all nearby wardens on Sev 5 logs.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setTwilioSmsNotification(!twilioSmsNotification);
                      addLog(`Twilio SMS Emergency Gateway toggled ${!twilioSmsNotification ? "ON" : "OFF"}.`);
                    }}
                    className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${twilioSmsNotification ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 transform ${twilioSmsNotification ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-start gap-2.5">
                    <Smartphone className="w-5 h-5 text-slate-500 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold">Auto-Call Warden Duplicates</p>
                      <p className="text-[10px] text-slate-500">Initiate automated voice calls if duplicate flags exceed 3 within the same postal code.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setAutoNotifyWarden(!autoNotifyWarden);
                      addLog(`Automated Warden duplicate auto-calling gateway toggled ${!autoNotifyWarden ? "ON" : "OFF"}.`);
                    }}
                    className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${autoNotifyWarden ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 transform ${autoNotifyWarden ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-start gap-2.5">
                    <Radio className="w-5 h-5 text-slate-500 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold">Direct API Hook to Civic Crews</p>
                      <p className="text-[10px] text-slate-500">Instantly relay approved steward packets as JSON payloads directly to crew foreman mobile devices.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setDirectApiHook(!directApiHook);
                      addLog(`Direct JSON API foreman dispatch toggled ${!directApiHook ? "ON" : "OFF"}.`);
                    }}
                    className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${directApiHook ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 transform ${directApiHook ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>

              <button 
                onClick={handleDeployRules}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-xs py-3 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 mt-2 cursor-pointer"
              >
                <Check className="w-4 h-4" /> Deploy Rules & Parametric Configuration
              </button>
            </CardContent>
          </Card>

          {/* Section 2: Steward Area Assignments */}
          <Card className="rounded-[32px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <CardContent className="p-6 flex flex-col gap-4">
              <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-purple-600 dark:text-purple-400" /> Steward Hub & Area Assignments
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Approve, monitor, and assign municipal stewards/reviewers to specific operational neighborhoods.</p>
                </div>
                <Badge className="bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border border-purple-100 dark:border-purple-900/30">Active roster</Badge>
              </div>

              {/* Steward assignments list */}
              <div className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                {stewards.map(st => (
                  <div key={st.id} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex justify-between items-center gap-2">
                    <div className="flex flex-col gap-1 truncate">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs">{st.name}</span>
                        {st.status === 'Active' ? (
                          <span className="text-[8px] bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded-full font-black uppercase">Active</span>
                        ) : (
                          <span className="text-[8px] bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-1.5 py-0.5 rounded-full font-black uppercase">Revoked</span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Ward: <strong className="text-slate-700 dark:text-slate-300">{st.ward}</strong> | Specialty: <strong className="text-slate-700 dark:text-slate-300">{st.category}</strong>
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Active Cases: <strong>{st.activeCases}</strong> | Reliable Trust Rating: <strong>{st.trustRating}</strong>
                      </p>
                    </div>

                    <button 
                      onClick={() => handleRevokeSteward(st.id, st.name)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border cursor-pointer shrink-0 ${st.status === 'Active' ? 'border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400' : 'border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'}`}
                    >
                      {st.status === 'Active' ? "Revoke" : "Reinstate"}
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Steward Form */}
              <form onSubmit={handleAddSteward} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col gap-3 mt-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Assign New Steward Portal</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Steward Name</label>
                    <input 
                      type="text" 
                      value={newStewardName}
                      onChange={(e) => setNewStewardName(e.target.value)}
                      placeholder="e.g. Anand Sen"
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5 text-xs font-semibold focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Ward Sector</label>
                    <select 
                      value={newStewardWard}
                      onChange={(e) => setNewStewardWard(e.target.value)}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5 text-xs font-semibold focus:outline-none"
                    >
                      <option value="Indiranagar">Indiranagar</option>
                      <option value="Koramangala">Koramangala</option>
                      <option value="Whitefield">Whitefield</option>
                      <option value="Jayanagar">Jayanagar</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Specialty Area</label>
                    <select 
                      value={newStewardCategory}
                      onChange={(e) => setNewStewardCategory(e.target.value)}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5 text-xs font-semibold focus:outline-none"
                    >
                      <option value="Pothole / road damage">Road damage / Pothole</option>
                      <option value="Water leakage">Water leakage</option>
                      <option value="Broken streetlight">Broken streetlight</option>
                      <option value="Garbage overflow">Garbage overflow</option>
                    </select>
                  </div>
                </div>
                <button 
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-white font-black text-xs py-2 rounded-xl transition-all self-end px-4 flex items-center gap-1.5 cursor-pointer mt-1"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Deploy Assigned Steward
                </button>
              </form>
            </CardContent>
          </Card>

        </div>

        {/* RIGHT COLUMN: Money Flow, Fraud, and Department Inboxes (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Section 3: Ledger & Money Flow Payouts */}
          <Card className="rounded-[32px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <CardContent className="p-6 flex flex-col gap-4">
              <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> Money Flow & Ledger
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Authorize or inspect wallet bounties cash-outs from active citizens.</p>
                </div>
                <Badge className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">Payouts</Badge>
              </div>

              {/* Cash-outs claims list */}
              <div className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                {disbursals.map(d => (
                  <div key={d.id} className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                    <div className="flex justify-between items-start gap-1">
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{d.user}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{d.timestamp} via {d.method}</p>
                      </div>
                      <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 shrink-0">${d.amount.toFixed(2)}</span>
                    </div>

                    <div className="flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-900 pt-2">
                      <span className={`text-[9px] font-black uppercase tracking-wider ${d.status.startsWith('Pending') ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {d.status}
                      </span>
                      {d.status.startsWith('Pending') && (
                        <button 
                          onClick={() => handleApproveDisbursal(d.id, d.user, d.amount)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[9px] uppercase tracking-wider py-1 px-3 rounded-lg transition-all cursor-pointer"
                        >
                          Approve Disbursal
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Section 4: AI Fraud Anomaly Tracker */}
          <Card className="rounded-[32px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <CardContent className="p-6 flex flex-col gap-4">
              <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                    <AlertOctagon className="w-5 h-5 text-red-600 dark:text-red-400" /> Fraud & Integrity Engine
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Inspect automated triggers and patterns that compromise proof structures.</p>
                </div>
                <Badge className="bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/30">AI Anomaly</Badge>
              </div>

              {/* Fraud anomalies list */}
              <div className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                {fraudAlerts.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No citizen anomaly alerts reported.</p>
                ) : (
                  fraudAlerts.map(fr => (
                    <div key={fr.id} className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                      <div className="flex justify-between items-center gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs">{fr.user}</span>
                          <span className="text-[9px] text-slate-400">({fr.location})</span>
                        </div>
                        <span className="text-xs font-black text-red-500 bg-red-500/10 px-2 py-0.5 rounded">
                          Score: {fr.anomalyScore}%
                        </span>
                      </div>

                      <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        Reason: <strong className="text-slate-800 dark:text-slate-200">{fr.reason}</strong>
                      </p>

                      <div className="flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-900 pt-2">
                        <span className={`text-[9px] font-black uppercase tracking-widest ${fr.status === 'Blacklisted' ? 'text-red-600' : 'text-amber-600'}`}>
                          Status: {fr.status}
                        </span>
                        {fr.status === 'Flagged' && (
                          <div className="flex gap-1.5 shrink-0">
                            <button 
                              onClick={() => handleActionFraud(fr.id, fr.user, 'dismiss')}
                              className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[9px] py-1 px-2.5 rounded-md cursor-pointer"
                            >
                              Dismiss
                            </button>
                            <button 
                              onClick={() => handleActionFraud(fr.id, fr.user, 'blacklist')}
                              className="bg-red-600 hover:bg-red-700 text-white font-bold text-[9px] py-1 px-2.5 rounded-md cursor-pointer"
                            >
                              Suspend
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Section 5: Department coordination inbox */}
          <Card className="rounded-[32px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <CardContent className="p-6 flex flex-col gap-4">
              <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-purple-600 dark:text-purple-400" /> Municipal Department Inbox
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Integrate requests and priority complaints directly from city departments.</p>
                </div>
                <Badge className="bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border border-purple-100 dark:border-purple-900/30">Inbound</Badge>
              </div>

              {/* Department requests list */}
              <div className="flex flex-col gap-2.5 max-h-[260px] overflow-y-auto pr-1">
                {inboxMessages.map(msg => (
                  <div key={msg.id} className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                    <div>
                      <div className="flex justify-between items-center gap-1">
                        <span className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400 truncate max-w-[70%]">{msg.sender}</span>
                        <span className="text-[9px] text-slate-400">{msg.date}</span>
                      </div>
                      <h4 className="font-extrabold text-[11px] text-slate-800 dark:text-slate-200 mt-1">{msg.subject}</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal mt-0.5">{msg.snippet}</p>
                    </div>

                    <div className="flex justify-between items-center gap-2 border-t border-slate-100 dark:border-slate-900 pt-2 mt-1">
                      <span className="text-[9px] font-bold text-slate-400">
                        {msg.acknowledged ? "Synced with Wards" : "Pending Acknowledge"}
                      </span>
                      <div className="flex gap-1.5 shrink-0">
                        {!msg.acknowledged ? (
                          <button 
                            onClick={() => handleAcknowledgeMessage(msg.id, msg.sender)}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-[9px] py-1 px-2.5 rounded-md cursor-pointer"
                          >
                            Sync & Ack
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleRelayTwilio(msg.sender, msg.subject)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[9px] py-1 px-2.5 rounded-md cursor-pointer flex items-center gap-1"
                          >
                            Relay Twilio
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  );
}
