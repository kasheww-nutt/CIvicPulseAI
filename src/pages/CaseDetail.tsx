import { useParams, useNavigate } from "react-router-dom";
import { useDemo } from "../context/DemoContext";
import { ProofLadder } from "../components/shared/ProofLadder";
import { BeforeAfterSlider } from "../components/shared/BeforeAfterSlider";
import { ContextualEnrichment } from "../components/shared/ContextualEnrichment";
import {
  Sparkles,
  MapPin,
  Clock,
  ShieldCheck,
  ArrowLeft,
  Image as ImageIcon,
  AlertTriangle,
  Layers,
  CheckCircle2,
  History,
  Wallet,
  ShieldAlert,
} from "lucide-react";
import { getSeverityColor } from "../components/shared/CaseCard";
import { useState } from "react";
import {
  getNextBestAction,
  getEvidenceLedger,
  canVerify,
  canPreparePacket,
  canVerifyFix,
  getLifecycleStage,
} from "../lib/caseLifecycle";
import { motion } from "motion/react";

export function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    cases,
    userRole,
    verifyCase,
    preparePacket,
    claimRepair,
    attachEvidence,
    trustScore,
  } = useDemo();
  const [showFusionModal, setShowFusionModal] = useState(false);
  const [sliderPos, setSliderPos] = useState(50);

  const caseItem = cases.find((c) => c.id === id);

  const [phoneNumber, setPhoneNumber] = useState(() => localStorage.getItem("pitch_phone_number") || "");
  const [smsLoading, setSmsLoading] = useState(false);
  const [smsResponse, setSmsResponse] = useState<any>(null);
  const [smsError, setSmsError] = useState("");
  const [showSmsPanel, setShowSmsPanel] = useState(caseItem?.severity === 5);

  if (!caseItem) {
    return (
      <div className="p-8 text-center text-slate-500">Case not found.</div>
    );
  }

  const handleDuplicateMark = () => {
    verifyCase(caseItem.id, "duplicate");
    setShowFusionModal(true);
  };

  const handleDispatchSMS = async () => {
    if (!phoneNumber) {
      setSmsError("Please enter a valid phone number.");
      return;
    }
    setSmsLoading(true);
    setSmsError("");
    setSmsResponse(null);

    try {
      const response = await fetch("/api/dispatch-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toNumber: phoneNumber,
          caseTitle: caseItem.title,
          locationLabel: caseItem.locationLabel,
          severity: caseItem.severity
        })
      });

      const data = await response.json();
      if (!response.ok) {
        setSmsError(data.error || "Failed to trigger SMS dispatch.");
        if (data.simulated) {
          setSmsResponse(data);
        }
      } else {
        setSmsResponse(data);
        localStorage.setItem("pitch_phone_number", phoneNumber);
      }
    } catch (err: any) {
      setSmsError(err.message || "Network error. Please try again.");
    } finally {
      setSmsLoading(false);
    }
  };

  let nextBestAction = getNextBestAction(caseItem);
  const ledger = getEvidenceLedger(caseItem);
  const stage = getLifecycleStage(caseItem);
  const isClosed = stage === "Closed" || stage === "Fix verified";

  const renderActionButtons = () => {
    return (
      <div className="flex flex-col gap-3">
        {userRole === "citizen" && !isClosed && (
          <>
            {/* Area Warden (500+ Trust) Superpowers */}
            {trustScore >= 500 &&
              stage !== "Fix verification needed" &&
              !caseItem.verifiedByMe && (
                <div className="flex gap-2">
                  <button
                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] py-3 rounded-xl shadow-sm transition-colors flex flex-col items-center justify-center leading-tight"
                    onClick={() => verifyCase(caseItem.id, "warden_duplicate")}
                  >
                    <span className="opacity-80 font-medium">
                      Warden Override
                    </span>
                    Mark Duplicate
                  </button>
                  <button
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] py-3 rounded-xl shadow-sm transition-colors flex flex-col items-center justify-center leading-tight"
                    onClick={() => verifyCase(caseItem.id, "warden_resolve")}
                  >
                    <span className="opacity-80 font-medium">
                      Warden Override
                    </span>
                    Mark Resolved
                  </button>
                </div>
              )}

            {/* Standard Verifications (Require 100+ Trust) */}
            {canVerify(caseItem) && trustScore >= 100 && (
              <button
                className="w-full bg-[#0f284b] hover:bg-[#1a365d] text-white font-bold text-sm py-4 rounded-full shadow-sm transition-colors"
                onClick={() => verifyCase(caseItem.id, "verify")}
              >
                Verify Issue (+5)
              </button>
            )}
            {canVerify(caseItem) && trustScore < 100 && (
              <button
                disabled
                className="w-full bg-slate-100 border border-slate-200 text-slate-400 font-bold text-sm py-4 rounded-full shadow-sm"
              >
                Need 100 Trust to Verify
              </button>
            )}
            {canVerify(caseItem) &&
              caseItem.duplicateRisk === "High" &&
              trustScore >= 100 && (
                <button
                  className="w-full bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm py-4 rounded-full shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  onClick={handleDuplicateMark}
                >
                  Confirm Duplicate (+8)
                </button>
              )}
            {canVerify(caseItem) &&
              caseItem.locationSource === "Manual pin" &&
              trustScore >= 100 && (
                <button
                  className="w-full bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm py-4 rounded-full shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  onClick={() => verifyCase(caseItem.id, "location")}
                >
                  Confirm Location (+5)
                </button>
              )}
            {canVerify(caseItem) &&
              caseItem.evidenceQuality === "Low" &&
              trustScore >= 100 && (
                <button
                  className="w-full bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm py-4 rounded-full shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  onClick={() => attachEvidence(caseItem.id, "High")}
                >
                  Add Clearer Photo (+8)
                </button>
              )}
            {canVerifyFix(caseItem) && trustScore >= 100 && (
              <button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-4 rounded-full shadow-sm transition-colors"
                onClick={() => verifyCase(caseItem.id, "fixed")}
              >
                Verify Fix (+12 Trust)
              </button>
            )}
            {stage === "Community verified" && (
              <button
                className="w-full bg-[#0f284b] hover:bg-[#1a365d] text-white font-bold text-sm py-4 rounded-full shadow-sm transition-colors"
                onClick={() => preparePacket(caseItem.id)}
              >
                Prepare Reviewer Packet
              </button>
            )}
            {caseItem.verifiedByMe &&
              !canVerifyFix(caseItem) &&
              stage !== "Community verified" && (
                <button
                  disabled
                  className="w-full bg-slate-100 text-slate-500 font-bold text-sm py-4 rounded-full flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" /> Action Recorded
                </button>
              )}
          </>
        )}
        {userRole === "citizen" && isClosed && (
          <button
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm py-4 rounded-full shadow-sm transition-colors flex items-center justify-center gap-2"
            onClick={() =>
              alert("Impact shareable generated! (Simulated social share)")
            }
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
            Share Civic Impact
          </button>
        )}

        {userRole === "admin" && (
          <>
            {canPreparePacket(caseItem) && (
              <button
                className="w-full bg-[#0f284b] text-white font-bold text-sm py-4 rounded-full shadow-sm hover:bg-[#1a365d] transition-colors"
                onClick={() => preparePacket(caseItem.id)}
              >
                Prepare Reviewer Packet
              </button>
            )}
            {stage === "Reviewer packet prepared" && (
              <button
                className="w-full bg-[#0f284b] text-white font-bold text-sm py-4 rounded-full shadow-sm hover:bg-[#1a365d] transition-colors"
                onClick={() => navigate(`/escalation/${caseItem.id}`)}
              >
                Review Packet
              </button>
            )}
            {stage === "Reviewer packet prepared" && (
              <button
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm py-4 rounded-full shadow-sm transition-colors"
                onClick={() => claimRepair(caseItem.id)}
              >
                Claim Repair
              </button>
            )}
            {(stage === "Fix verification needed" ||
              stage === "Fix verified" ||
              stage === "Closed" ||
              stage === "Field repair claimed") && (
              <button
                disabled
                className="w-full bg-slate-100 text-slate-500 font-bold text-sm py-4 rounded-full flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" /> Sent to Field
              </button>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col bg-[#f8f9fc] dark:bg-slate-950 min-h-screen pb-2 relative">
      <header className="bg-white dark:bg-slate-900 px-6 pt-6 pb-4 border-b border-[#e2e8f0] dark:border-slate-800 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="p-1 -ml-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
            {caseItem.category}
          </span>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white truncate tracking-tight">
            {caseItem.title}
          </h1>
        </div>
      </header>

      <div className="flex flex-col max-w-5xl mx-auto w-full px-6 lg:px-8 pt-6 gap-6">
        {/* Left Column: Details */}
        <div className="w-full flex flex-col gap-6">
          {/* Evidence Photo Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full h-56 lg:h-72 bg-slate-200 relative flex flex-col items-center justify-center text-slate-400 overflow-hidden rounded-[24px] shadow-sm border border-[#e2e8f0]"
          >
            {isClosed && caseItem.fixedImagePlaceholder ? (
              <BeforeAfterSlider
                beforeImage={caseItem.imagePlaceholder || ""}
                afterImage={caseItem.fixedImagePlaceholder}
              />
            ) : caseItem.imagePlaceholder ? (
              <img
                src={caseItem.imagePlaceholder}
                alt="Civic Issue"
                className="w-full h-full object-cover"
              />
            ) : (
              <>
                <ImageIcon className="w-12 h-12 mb-2 opacity-30" />
              </>
            )}

            {!isClosed && (
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent pointer-events-none" />
            )}

            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end pointer-events-none">
              <div
                className={`px-3 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-bold border shadow-sm pointer-events-auto ${getSeverityColor(caseItem.severity)}`}
              >
                Severity {caseItem.severity}
              </div>
              <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-[#e2e8f0] dark:border-slate-800 flex items-center gap-1.5 shadow-sm pointer-events-auto">
                Source: {caseItem.locationSource}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex flex-col gap-6"
          >
            {showFusionModal && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-amber-50 border border-amber-200 rounded-[20px] p-4 flex gap-3 text-amber-900 items-start shadow-sm"
              >
                <Layers className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
                <div className="flex flex-col gap-1.5">
                  <h4 className="font-bold text-sm">Marked for Fusion</h4>
                  <p className="text-xs font-medium">
                    Flagged as duplicate. It will be grouped with similar
                    reports. (+8 Trust Awarded)
                  </p>
                  <button
                    className="text-xs font-bold text-amber-700 underline mt-1 text-left w-fit"
                    onClick={() => setShowFusionModal(false)}
                  >
                    Dismiss
                  </button>
                </div>
              </motion.div>
            )}

            <div className="flex flex-col gap-2">
              {/* Bounty Banner */}
              {caseItem.bounty && !isClosed && (
                <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-5 rounded-[24px] shadow-sm text-white flex flex-col relative overflow-hidden mb-2">
                  <div className="absolute -right-4 -bottom-4 opacity-20">
                    <Wallet className="w-24 h-24" />
                  </div>
                  <div className="relative z-10 flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100 bg-white/20 px-2 py-0.5 rounded-full w-fit">
                      Community Bounty
                    </span>
                    <div className="text-3xl font-black mt-1">
                      ${caseItem.bounty.amount.toFixed(2)}
                    </div>
                    <p className="text-[11px] font-medium text-emerald-50 mt-1">
                      Sponsored by <strong>{caseItem.bounty.sponsor}</strong>.
                      Earn 50% by verifying.
                    </p>
                  </div>
                </div>
              )}

              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white leading-tight tracking-tight">
                {caseItem.title}
              </h1>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 shrink-0 text-slate-400 dark:text-slate-500" />
                  <span className="truncate">{caseItem.locationLabel}</span>
                </div>
                <span>-</span>
                <span className="whitespace-nowrap bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-full">
                  {caseItem.age}
                </span>
              </div>
            </div>

            {/* Automated Escalation SMS Protocol Panel */}
            {caseItem.severity === 5 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-500/10 dark:bg-red-950/20 border-2 border-dashed border-red-500/30 p-5 rounded-[24px] flex flex-col gap-4 shadow-sm relative overflow-hidden"
              >
                <div className="absolute right-4 top-4">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 border border-red-200 dark:border-red-900/40">
                    <AlertTriangle className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="flex flex-col">
                    <h4 className="text-sm font-black text-red-700 dark:text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                      Emergency Escalation Primed
                    </h4>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1 leading-snug">
                      This incident is classified as a <span className="text-red-600 dark:text-red-400 font-bold">Severity 5/5 Critical Hazard</span>. Under Municipal Protocol 12-A, AI bypasses standard steward queues to dispatch real-time emergency services.
                    </p>
                  </div>
                </div>

                {/* Pitch Phone Entry Form */}
                <div className="bg-white dark:bg-slate-900/80 p-4 rounded-2xl border border-red-500/20 flex flex-col gap-3 mt-1">
                  {/* Hackathon Note Banner */}
                  <div className="bg-amber-500/5 border border-amber-500/20 p-3 rounded-xl flex items-start gap-2 text-[11px] text-amber-800 dark:text-amber-300 leading-normal font-medium shadow-sm">
                    <span className="text-base leading-none">💡</span>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold uppercase tracking-wider text-[10px] text-amber-900 dark:text-amber-400">Future Operational Roadmap Note</span>
                      <p>
                        Full Twilio accounts integration is designated as future work for stewards to fully automate personal incident reporting. For this live hackathon demo, provided numbers will be used for sandbox-safe high-fidelity simulation and real-time carrier delivery.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      🚨 Live Hackathon SMS Trigger
                    </label>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug font-medium">
                      Enter your mobile number to receive a <strong>REAL SMS alert</strong> on your phone during a live pitch!
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. +14155552671"
                      className="flex-1 border border-slate-200 dark:border-slate-700 bg-transparent rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-white"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                    <button
                      onClick={handleDispatchSMS}
                      disabled={smsLoading}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-sm transition-colors disabled:opacity-70 flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      {smsLoading ? "Escalating..." : "Dispatch SMS"}
                    </button>
                  </div>

                  {smsError && (
                    <p className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-950/20 p-2.5 rounded-lg border border-red-100 dark:border-red-900/20">
                      {smsError}
                    </p>
                  )}

                  {smsResponse && (
                    <div className="flex flex-col gap-2.5">
                      <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 rounded-xl p-3 text-xs text-emerald-900 dark:text-emerald-300 font-medium">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider text-[10px] mb-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> 
                          {smsResponse.simulated ? "Simulated Signal Dispatched" : "Live Twilio SMS Sent!"}
                        </div>
                        <p>{smsResponse.simulated ? "Sandbox simulation message queued:" : "SMS successfully delivered to carrier!"}</p>
                      </div>

                      {/* Phone Simulator Display */}
                      <div className="bg-slate-950 text-slate-100 p-4 rounded-xl border border-slate-800 font-mono text-xs flex flex-col gap-2 relative shadow-inner">
                        <div className="flex justify-between items-center text-[9px] text-slate-500 border-b border-slate-800 pb-1.5 uppercase font-bold tracking-wider">
                          <span>📱 INCOMING EMERGENCY ALERT</span>
                          <span>JUST NOW</span>
                        </div>
                        <div className="text-slate-300 italic font-sans leading-relaxed whitespace-pre-wrap">
                          {smsResponse.messageBody}
                        </div>
                        {smsResponse.simulated && (
                          <div className="text-[10px] text-slate-400 mt-2 border-t border-slate-800/60 pt-2 font-sans flex flex-col gap-1">
                            <span className="font-bold text-amber-500 uppercase tracking-wider text-[9px]">💡 Live Twilio Credential Setup:</span>
                            <span>Add <strong>TWILIO_ACCOUNT_SID</strong>, <strong>TWILIO_AUTH_TOKEN</strong>, and <strong>TWILIO_PHONE_NUMBER</strong> in your settings to show live SMS triggers!</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {caseItem.severity < 5 && (
              <div className="border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/20 rounded-[24px] p-4 flex flex-col gap-2">
                <button
                  onClick={() => setShowSmsPanel(!showSmsPanel)}
                  className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-[#0f284b] dark:hover:text-blue-400 transition-colors w-full text-left"
                >
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Presentation Deck Override: Test Emergency SMS Escalation
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">{showSmsPanel ? "Hide Override" : "Configure Override"}</span>
                </button>

                {showSmsPanel && (
                  <div className="mt-2 flex flex-col gap-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      By overriding, you can force the automated Severity 5 escalation SMS payload for this specific case as if it were a critical threat.
                    </p>
                    <div className="bg-white dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-3">
                      {/* Hackathon Note Banner */}
                      <div className="bg-amber-500/5 border border-amber-500/20 p-3 rounded-xl flex items-start gap-2 text-[11px] text-amber-800 dark:text-amber-300 leading-normal font-medium shadow-sm">
                        <span className="text-base leading-none">💡</span>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold uppercase tracking-wider text-[10px] text-amber-900 dark:text-amber-400">Future Operational Roadmap Note</span>
                          <p>
                            Full Twilio accounts integration is designated as future work for stewards to fully automate personal incident reporting. For this live hackathon demo, provided numbers will be used for sandbox-safe high-fidelity simulation and real-time carrier delivery.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. +14155552671"
                          className="flex-1 border border-slate-200 dark:border-slate-700 bg-transparent rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0f284b] dark:text-white"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                        />
                        <button
                          onClick={handleDispatchSMS}
                          disabled={smsLoading}
                          className="bg-[#0f284b] dark:bg-slate-800 hover:bg-[#1a365d] dark:hover:bg-slate-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-sm transition-colors disabled:opacity-70 flex items-center gap-1.5 cursor-pointer shrink-0"
                        >
                          {smsLoading ? "Escalating..." : "Dispatch SMS"}
                        </button>
                      </div>

                      {smsError && (
                        <p className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-950/20 p-2.5 rounded-lg">
                          {smsError}
                        </p>
                      )}

                      {smsResponse && (
                        <div className="flex flex-col gap-2.5">
                          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 rounded-xl p-3 text-xs text-emerald-900 dark:text-emerald-300 font-medium">
                            <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider text-[10px] mb-1">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> 
                              {smsResponse.simulated ? "Simulated Signal Dispatched" : "Live Twilio SMS Sent!"}
                            </div>
                            <p>{smsResponse.simulated ? "Sandbox simulation message queued:" : "SMS successfully delivered to carrier!"}</p>
                          </div>

                          <div className="bg-slate-950 text-slate-100 p-4 rounded-xl border border-slate-800 font-mono text-xs flex flex-col gap-2 relative shadow-inner">
                            <div className="flex justify-between items-center text-[9px] text-slate-500 border-b border-slate-800 pb-1.5 uppercase font-bold tracking-wider">
                              <span>📱 INCOMING EMERGENCY ALERT</span>
                              <span>JUST NOW</span>
                            </div>
                            <div className="text-slate-300 italic font-sans leading-relaxed whitespace-pre-wrap">
                              {smsResponse.messageBody}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Case Intelligence */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-[24px] border border-[#e2e8f0] dark:border-slate-700 flex flex-col gap-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-5 h-5 text-[#0f284b] dark:text-blue-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Case Intelligence
                </h3>
              </div>

              <div className="flex flex-col gap-3">
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium bg-[#f8f9fc] dark:bg-slate-900 p-4 rounded-[20px] border border-[#e2e8f0] dark:border-slate-700">
                  <strong className="text-slate-900 dark:text-white block mb-1">
                    AI Summary:
                  </strong>{" "}
                  {caseItem.aiSummary}
                </p>

                {caseItem.aiAdditionalSummary && (
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium bg-amber-50/50 dark:bg-amber-950/20 p-4 rounded-[20px] border border-amber-100 dark:border-amber-900/30">
                    <strong className="text-amber-800 dark:text-amber-400 flex items-center gap-1 mb-1">
                      <ImageIcon className="w-4 h-4" /> Visual Evidence Summary:
                    </strong>
                    {caseItem.aiAdditionalSummary}
                  </p>
                )}

                {caseItem.aiObjectiveDescription && (
                  <p className="text-sm text-[#0f284b] dark:text-blue-300 leading-relaxed font-medium bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-[20px] border border-blue-100 dark:border-blue-900/30">
                    <strong className="text-[#0f284b] dark:text-blue-400 flex items-center gap-1 mb-1">
                      <Sparkles className="w-4 h-4" /> De-Escalated Description:
                    </strong>
                    {caseItem.aiObjectiveDescription}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3 mt-1">
                  <div className="bg-[#f8f9fc] dark:bg-slate-900 p-3 rounded-[20px] border border-[#e2e8f0] dark:border-slate-700">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                      Evidence Quality
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {caseItem.evidenceQuality}
                    </span>
                  </div>
                  <div className="bg-[#f8f9fc] dark:bg-slate-900 p-3 rounded-[20px] border border-[#e2e8f0] dark:border-slate-700">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                      Location Confidence
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {caseItem.locationSource === "Manual pin"
                        ? "Low"
                        : "High"}
                    </span>
                  </div>
                </div>

                {caseItem.duplicateRisk === "High" && (
                  <div className="flex items-start gap-2.5 text-xs font-medium text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/20 p-4 rounded-[20px] border border-amber-200 dark:border-amber-900/30 mt-2">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
                    <div className="flex flex-col gap-1.5">
                      <strong className="uppercase tracking-wider font-bold text-[10px] text-amber-700 dark:text-amber-400">
                        Duplicate Risk: High
                      </strong>
                      <span>
                        Issue DNA matches existing cases in this geo-bucket.
                        Verification needed to confirm status.
                      </span>
                    </div>
                  </div>
                )}
                <ContextualEnrichment
                  category={caseItem.category}
                  title={caseItem.title}
                  lat={caseItem.lat}
                  lng={caseItem.lng}
                />
              </div>
            </div>

            {/* Evidence Ledger */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-[24px] border border-[#e2e8f0] dark:border-slate-700 shadow-sm flex flex-col gap-4">
              <div className="flex items-center gap-2 mb-1">
                <History className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Evidence Ledger
                </h3>
              </div>
              <div className="flex flex-col gap-4 relative pl-4 mt-2">
                <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-[#e2e8f0] dark:bg-slate-700 -z-10" />
                {ledger.map((item, i) => (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    key={item.id || i}
                    className="flex gap-4"
                  >
                    <div className="w-3.5 h-3.5 rounded-full bg-slate-300 dark:bg-slate-600 border-2 border-white dark:border-slate-800 shrink-0 mt-1" />
                    <div className="flex flex-col flex-1 pb-2">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {item.title}
                        </span>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded-full font-medium">
                          {item.timestamp}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] bg-[#f8f9fc] dark:bg-slate-900 border border-[#e2e8f0] dark:border-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-full font-bold uppercase tracking-wider">
                          {item.sourceType}
                        </span>
                        {item.trustImpact > 0 && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1 rounded-full">
                            +{item.trustImpact} Trust
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 font-medium">
                        {item.explanation}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Proof Ladder - Mobile view inline */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="bg-white dark:bg-slate-800 p-5 rounded-[24px] border border-[#e2e8f0] dark:border-slate-700 shadow-sm"
          >
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-5 uppercase tracking-wider flex items-center gap-2">
              Proof Ladder
            </h3>
            <ProofLadder caseItem={caseItem} />

            <div className="mt-6 pt-5 border-t border-[#e2e8f0] dark:border-slate-700">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Next Best Action
              </h4>
              <div className="bg-[#f8f9fc] dark:bg-slate-900 p-4 rounded-[20px] border border-[#e2e8f0] dark:border-slate-700">
                <p className="text-sm text-slate-800 dark:text-slate-200 font-bold">
                  {nextBestAction}
                </p>
              </div>
            </div>

            <div className="mt-5 pt-5 border-t border-[#e2e8f0] dark:border-slate-700 mb-5">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Community Trust
              </h4>
              <div className="flex items-center gap-2">
                <div className="bg-[#f8f9fc] dark:bg-slate-900 text-[#0f284b] dark:text-blue-400 font-bold px-3 py-1.5 rounded-full text-xs border border-[#e2e8f0] dark:border-slate-700">
                  {caseItem.verificationCount} verifications
                </div>
              </div>
            </div>

            {/* Dynamic Action Buttons at end of Section of Ladder */}
            <div className="pt-5 border-t border-[#e2e8f0] dark:border-slate-700">
              {renderActionButtons()}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
