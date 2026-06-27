import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { CivicCase, DemoState, WalletTransaction, Steward, FraudAlert, Disbursal, InboxMessage } from '../types';
import { mockCases } from '../data/mock';
import { useAuth } from './AuthContext';
import { createNotification } from '../lib/notifications';

interface DemoContextType extends DemoState {
  setRole: (role: 'citizen' | 'steward' | 'admin') => void;
  setLocation: (loc: string | null) => void;
  verifyCase: (id: string, actionType: 'verify' | 'duplicate' | 'fixed' | 'location' | 'warden_duplicate' | 'warden_resolve') => void;
  reportCase: (newCase: CivicCase) => void;
  attachEvidence: (id: string, newEvidenceQuality: 'Low' | 'Medium' | 'High') => void;
  preparePacket: (id: string) => void;
  claimRepair: (id: string) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  redeemWallet: (amount: number, description: string) => void;
  
  // Dynamic admin controls
  addSteward: (st: { name: string, ward: string, category: string }) => void;
  toggleStewardStatus: (id: string) => void;
  actionFraud: (id: string, username: string, action: 'blacklist' | 'dismiss') => void;
  approveDisbursal: (id: string) => void;
  acknowledgeInboxMessage: (id: string) => void;
  addSystemLog: (msg: string) => void;
  setSlaHours: (hours: number) => void;
  setRewardMultiplier: (mult: number) => void;
  setTwilioSmsNotification: (val: boolean) => void;
  setAutoNotifyWarden: (val: boolean) => void;
  setDirectApiHook: (val: boolean) => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function DemoProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [userRole, setRole] = useState<'citizen' | 'steward' | 'admin'>('citizen');
  const [trustScore, setTrustScore] = useState(148);
  const [walletBalance, setWalletBalance] = useState(12.50);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([
    { id: '1', amount: 11.25, description: 'Bounty: Verified structure damage at Indiranagar Metro', timestamp: '1 day ago', type: 'earn' },
    { id: '2', amount: 0.50, description: 'Verified pothole in Koramangala', timestamp: '2 days ago', type: 'earn' },
    { id: '3', amount: 0.75, description: 'Bounty: Fixed streetlight near park', timestamp: '1 week ago', type: 'earn' }
  ]);
  const [location, setLocation] = useState<string | null>(null);

  // --- PERSISTENT CASES WITH MAPPED FRAUD AUTHORS ---
  const [cases, setCases] = useState<CivicCase[]>(() => {
    const saved = localStorage.getItem('civic_cases');
    if (saved) {
      return JSON.parse(saved);
    }
    // Set authorId for some cases to map them to fraudAlerts users
    return mockCases.map(c => {
      if (c.id === 'c-004') return { ...c, authorId: 'Rohan_99' };
      if (c.id === 'c-010') return { ...c, authorId: 'Aisha_K' };
      if (c.id === 'c-009') return { ...c, authorId: 'Vikram_X' };
      return c;
    });
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return document.documentElement.classList.contains('dark');
  });

  // --- PERSISTENT ADMIN PORTAL STATES ---
  const [stewards, setStewards] = useState<Steward[]>(() => {
    const saved = localStorage.getItem('civic_stewards');
    return saved ? JSON.parse(saved) : [
      { id: 'st-1', name: 'Arjun Mehta', ward: 'Indiranagar', category: 'Pothole / road damage', activeCases: 4, trustRating: '98%', status: 'Active' },
      { id: 'st-2', name: 'Priya Sharma', ward: 'Koramangala', category: 'Broken streetlight', activeCases: 2, trustRating: '99%', status: 'Active' },
      { id: 'st-3', name: 'Rajesh Kumar', ward: 'Indiranagar', category: 'Water leakage', activeCases: 7, trustRating: '95%', status: 'Active' },
      { id: 'st-4', name: 'Sneha Reddy', ward: 'Whitefield', category: 'Garbage overflow', activeCases: 5, trustRating: '97%', status: 'Active' }
    ];
  });

  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>(() => {
    const saved = localStorage.getItem('civic_fraud_alerts');
    return saved ? JSON.parse(saved) : [
      { id: 'fr-1', user: 'Rohan_99', reason: 'High similarity in image uploads (potential stock match)', anomalyScore: 88, status: 'Flagged', location: 'Indiranagar' },
      { id: 'fr-2', user: 'Aisha_K', reason: 'Multiple rapid duplicates submitted in < 5 mins', anomalyScore: 92, status: 'Flagged', location: 'Whitefield' },
      { id: 'fr-3', user: 'Vikram_X', reason: 'Repeated self-verification patterns flagged by AI model', anomalyScore: 74, status: 'Flagged', location: 'Koramangala' }
    ];
  });

  const [disbursals, setDisbursals] = useState<Disbursal[]>(() => {
    const saved = localStorage.getItem('civic_disbursals');
    return saved ? JSON.parse(saved) : [
      { id: 'ds-1', user: 'shaikkashif40@gmail.com', amount: 25.50, method: 'PayPal', status: 'Pending Approval', timestamp: '2 hours ago' },
      { id: 'ds-2', user: 'kavitha_b', amount: 15.00, method: 'Bank Transfer', status: 'Pending Approval', timestamp: '5 hours ago' },
      { id: 'ds-3', user: 'rahul_m', amount: 45.75, method: 'UPI', status: 'Approved & Disbursed', timestamp: '1 day ago' },
      { id: 'ds-4', user: 'anil_sharma', amount: 12.00, method: 'PayPal', status: 'Approved & Disbursed', timestamp: '2 days ago' }
    ];
  });

  const [inboxMessages, setInboxMessages] = useState<InboxMessage[]>(() => {
    const saved = localStorage.getItem('civic_inbox_messages');
    return saved ? JSON.parse(saved) : [
      { id: 'ib-1', sender: 'Director, Indiranagar Water Supply', subject: 'Pipe burst ticket integration (#WS-401)', snippet: 'We detected a spike in community reports of Indiranagar metro water leakage. Please link this to our official work order.', date: '10 mins ago', acknowledged: false },
      { id: 'ib-2', sender: 'ACP Traffic, Koramangala Zone', subject: 'Road defect verification priority request', snippet: 'Traffic congestion is critical at 100 Feet Rd due to pothole. Requesting immediate steward prioritization.', date: '1 hour ago', acknowledged: false },
      { id: 'ib-3', sender: 'SWM Joint Commissioner', subject: 'Garbage landfill collection delay alert', snippet: 'Please throttle high-severity garbage alerts for Koramangala Block A until Sunday morning as trash trucks are delayed.', date: '3 hours ago', acknowledged: false }
    ];
  });

  const [systemLogs, setSystemLogs] = useState<string[]>(() => {
    const saved = localStorage.getItem('civic_system_logs');
    return saved ? JSON.parse(saved) : [
      "System parameters successfully initialized.",
      "Twilio SMS gateway link configured.",
      "Bounty multiplier set to default 1.5x."
    ];
  });

  const [slaHours, setSlaHours] = useState(() => {
    const saved = localStorage.getItem('civic_sla_hours');
    return saved ? parseInt(saved) : 24;
  });

  const [rewardMultiplier, setRewardMultiplier] = useState(() => {
    const saved = localStorage.getItem('civic_reward_multiplier');
    return saved ? parseFloat(saved) : 1.5;
  });

  const [twilioSmsNotification, setTwilioSmsNotification] = useState(() => {
    const saved = localStorage.getItem('civic_twilio_sms_notification');
    return saved ? saved === 'true' : true;
  });

  const [autoNotifyWarden, setAutoNotifyWarden] = useState(() => {
    const saved = localStorage.getItem('civic_auto_notify_warden');
    return saved ? saved === 'true' : false;
  });

  const [directApiHook, setDirectApiHook] = useState(() => {
    const saved = localStorage.getItem('civic_direct_api_hook');
    return saved ? saved === 'true' : true;
  });

  const [suspendedUsers, setSuspendedUsers] = useState<string[]>(() => {
    const saved = localStorage.getItem('civic_suspended_users');
    return saved ? JSON.parse(saved) : [];
  });

  // --- LOCAL STORAGE PERSISTENCE EFFECTS ---
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('civic_cases', JSON.stringify(cases));
  }, [cases]);

  useEffect(() => {
    localStorage.setItem('civic_stewards', JSON.stringify(stewards));
  }, [stewards]);

  useEffect(() => {
    localStorage.setItem('civic_fraud_alerts', JSON.stringify(fraudAlerts));
  }, [fraudAlerts]);

  useEffect(() => {
    localStorage.setItem('civic_disbursals', JSON.stringify(disbursals));
  }, [disbursals]);

  useEffect(() => {
    localStorage.setItem('civic_inbox_messages', JSON.stringify(inboxMessages));
  }, [inboxMessages]);

  useEffect(() => {
    localStorage.setItem('civic_system_logs', JSON.stringify(systemLogs));
  }, [systemLogs]);

  useEffect(() => {
    localStorage.setItem('civic_sla_hours', slaHours.toString());
  }, [slaHours]);

  useEffect(() => {
    localStorage.setItem('civic_reward_multiplier', rewardMultiplier.toString());
  }, [rewardMultiplier]);

  useEffect(() => {
    localStorage.setItem('civic_twilio_sms_notification', twilioSmsNotification.toString());
  }, [twilioSmsNotification]);

  useEffect(() => {
    localStorage.setItem('civic_auto_notify_warden', autoNotifyWarden.toString());
  }, [autoNotifyWarden]);

  useEffect(() => {
    localStorage.setItem('civic_direct_api_hook', directApiHook.toString());
  }, [directApiHook]);

  useEffect(() => {
    localStorage.setItem('civic_suspended_users', JSON.stringify(suspendedUsers));
  }, [suspendedUsers]);


  // --- ADMIN PORTAL STATE MODIFIER METHODS ---
  const addSystemLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setSystemLogs(prev => [`[${time}] ${msg}`, ...prev]);
  };

  const addSteward = (st: { name: string, ward: string, category: string }) => {
    const newSt: Steward = {
      id: `st-${stewards.length + 1}`,
      name: st.name,
      ward: st.ward,
      category: st.category,
      activeCases: 0,
      trustRating: '100%',
      status: 'Active'
    };
    setStewards(prev => [...prev, newSt]);
    addSystemLog(`Assigned Steward ${st.name} to Ward ${st.ward} for category: ${st.category}`);
  };

  const toggleStewardStatus = (id: string) => {
    setStewards(prev => prev.map(s => {
      if (s.id === id) {
        const nextStatus = s.status === 'Active' ? 'Revoked' : 'Active';
        addSystemLog(`${nextStatus} credentials for Steward ${s.name}`);
        return { ...s, status: nextStatus };
      }
      return s;
    }));
  };

  const actionFraud = (id: string, username: string, action: 'blacklist' | 'dismiss') => {
    if (action === 'blacklist') {
      setFraudAlerts(prev => prev.map(f => f.id === id ? { ...f, status: 'Blacklisted' } : f));
      setSuspendedUsers(prev => {
        if (!prev.includes(username)) {
          return [...prev, username];
        }
        return prev;
      });
      addSystemLog(`ADMIN ACTION: Blacklisted citizen ${username} and deleted all associated reports due to pattern manipulation alerts.`);
      
      // CASCADE: Delete all cases submitted by this user completely!
      setCases(prev => prev.filter(c => c.authorId !== username));
    } else {
      setFraudAlerts(prev => prev.filter(f => f.id !== id));
      addSystemLog(`ADMIN ACTION: Dismissed fraud alert for citizen ${username}. No anomaly confirmed.`);
    }
  };

  const approveDisbursal = (id: string) => {
    setDisbursals(prev => prev.map(d => {
      if (d.id === id) {
        addSystemLog(`Approved ledger disbursal of $${d.amount.toFixed(2)} to ${d.user}. Sent instructions to municipal treasury bank portal.`);
        return { ...d, status: 'Approved & Disbursed' };
      }
      return d;
    }));
  };

  const acknowledgeInboxMessage = (id: string) => {
    setInboxMessages(prev => prev.map(m => {
      if (m.id === id) {
        addSystemLog(`Acknowledged departmental message from ${m.sender}. Integrated coordination metrics.`);
        return { ...m, acknowledged: true };
      }
      return m;
    }));
  };

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('theme', next ? 'dark' : 'light');
      return next;
    });
  };

  const attachEvidence = (id: string, newEvidenceQuality: 'Low' | 'Medium' | 'High') => {
    setCases(prev => prev.map(c => {
      if (c.id === id) {
        setTrustScore(prevScore => prevScore + 8);
        return {
          ...c,
          verificationCount: c.verificationCount + 1,
          evidenceQuality: newEvidenceQuality === 'High' ? 'High' : c.evidenceQuality === 'High' ? 'High' : 'Medium',
          duplicateRisk: 'Low',
          verifiedByMe: true,
          evidenceLedger: [...(c.evidenceLedger || []), {
            id: Math.random().toString(),
            title: 'Clearer Evidence Attached',
            sourceType: 'Citizen',
            timestamp: 'Just now',
            trustImpact: 8,
            explanation: 'Additional photographic evidence provided.'
          }]
        };
      }
      return c;
    }));
  };

  const verifyCase = (id: string, actionType: 'verify' | 'duplicate' | 'fixed' | 'location' | 'warden_duplicate' | 'warden_resolve') => {
    let triggeredNotification = false;
    let targetCase: CivicCase | null = null;
    let notifyCount = 0;

    setCases(prev => prev.map(c => {
      if (c.id === id && (!c.verifiedByMe || actionType.startsWith('warden_'))) {
        let reward = 0;
        let newStage = c.proofLadderStage;
        let newStatus = c.status;
        const newLedger = [...(c.evidenceLedger || [])];

        if (actionType === 'verify') {
          // Multiply reward by our dynamic system parameter multiplier!
          reward = Math.round(5 * rewardMultiplier);
          newLedger.push({ id: Math.random().toString(), title: 'Verified by You', sourceType: 'Citizen', timestamp: 'Just now', trustImpact: reward, explanation: `You confirmed the issue exists. Dynamic multiplier is ${rewardMultiplier}x.` });
          if (c.proofLadderStage < 2) {
            newStage = 2;
            newStatus = 'Community Verified';
          } else if (c.proofLadderStage === 2 && c.verificationCount > 5) {
             newStage = 3;
             newStatus = 'Authority Ready';
          }
          
          if (c.verificationCount + 1 === 5) {
             triggeredNotification = true;
             targetCase = c;
             notifyCount = 5;
          } else if (c.verificationCount + 1 === 10) {
             triggeredNotification = true;
             targetCase = c;
             notifyCount = 10;
          }
        } else if (actionType === 'duplicate') {
          reward = Math.round(8 * rewardMultiplier);
          newLedger.push({ id: Math.random().toString(), title: 'Duplicate Risk Resolved', sourceType: 'Citizen', timestamp: 'Just now', trustImpact: reward, explanation: 'Confirmed as a distinct issue.' });
        } else if (actionType === 'fixed') {
          reward = Math.round(12 * rewardMultiplier);
          newStage = 6;
          newStatus = 'Fix Verified';
          newLedger.push({ id: Math.random().toString(), title: 'Fix Verified', sourceType: 'Citizen', timestamp: 'Just now', trustImpact: reward, explanation: 'Field repair has been verified.' });
        } else if (actionType === 'location') {
          reward = Math.round(5 * rewardMultiplier);
          newLedger.push({ id: Math.random().toString(), title: 'Location Confirmed', sourceType: 'Citizen', timestamp: 'Just now', trustImpact: reward, explanation: 'Manual pin location confirmed.' });
        } else if (actionType === 'warden_duplicate') {
          reward = Math.round(15 * rewardMultiplier);
          newStage = 7;
          newStatus = 'Closed' as any;
          newLedger.push({ id: Math.random().toString(), title: 'Warden Override: Duplicate', sourceType: 'Citizen', timestamp: 'Just now', trustImpact: reward, explanation: 'Area Warden flagged as duplicate.' });
        } else if (actionType === 'warden_resolve') {
          reward = Math.round(15 * rewardMultiplier);
          newStage = 7;
          newStatus = 'Closed' as any;
          newLedger.push({ id: Math.random().toString(), title: 'Warden Override: Resolved', sourceType: 'Citizen', timestamp: 'Just now', trustImpact: reward, explanation: 'Area Warden marked issue as resolved.' });
        }

        setTrustScore(prevScore => prevScore + reward);
        
        // Handle Bounty Split
        if (c.bounty && actionType === 'verify') {
          const splitAmount = c.bounty.amount * 0.5 * rewardMultiplier;
          setWalletBalance(prev => prev + splitAmount);
          setWalletTransactions(prev => [{
            id: Math.random().toString(),
            amount: splitAmount,
            description: `Bounty split: Verified ${c.title}`,
            timestamp: 'Just now',
            type: 'earn'
          }, ...prev]);
        }
        
        return {
          ...c,
          verificationCount: c.verificationCount + 1,
          verifiedByMe: true,
          status: newStatus,
          proofLadderStage: newStage,
          locationSource: actionType === 'location' ? 'Device location' : c.locationSource,
          duplicateRisk: actionType === 'duplicate' ? 'Low' : c.duplicateRisk,
          evidenceLedger: newLedger
        };
      }
      return c;
    }));

    if (triggeredNotification && targetCase && targetCase.authorId) {
       const uId = user?.uid || targetCase.authorId;
       createNotification({
         userId: uId,
         title: 'Milestone Reached!',
         message: `Your report "${targetCase.title}" just reached ${notifyCount} verifications!`,
         isRead: false,
         type: 'verification',
         caseId: targetCase.id
       });
    }
  };

  const preparePacket = (id: string) => {
    setCases(prev => prev.map(c => {
      if (c.id === id) {
        return {
          ...c,
          status: 'Authority Ready',
          proofLadderStage: 3,
          evidenceLedger: [...(c.evidenceLedger || []), {
            id: Math.random().toString(),
            title: 'Reviewer Packet Prepared',
            sourceType: 'Reviewer',
            timestamp: 'Just now',
            trustImpact: 0,
            explanation: 'Escalation packet generated for municipal review.'
          }]
        };
      }
      return c;
    }));
  };

  const claimRepair = (id: string) => {
    let triggeredNotification = false;
    let targetCase: CivicCase | null = null;

    setCases(prev => prev.map(c => {
      if (c.id === id) {
        triggeredNotification = true;
        targetCase = c;
        return {
          ...c,
          status: 'Field repair claimed' as any,
          proofLadderStage: 4,
          evidenceLedger: [...(c.evidenceLedger || []), {
            id: Math.random().toString(),
            title: 'Field Repair Claimed',
            sourceType: 'Demo System',
            timestamp: 'Just now',
            trustImpact: 0,
            explanation: 'A repair crew has marked this issue as repaired.'
          }]
        };
      }
      return c;
    }));

    if (triggeredNotification && targetCase && targetCase.authorId) {
       const uId = user?.uid || targetCase.authorId;
       createNotification({
         userId: uId,
         title: 'Action Taken!',
         message: `Your report "${targetCase.title}" has been claimed for repair by the municipal team.`,
         isRead: false,
         type: 'claimed',
         caseId: targetCase.id
       });
    }
  };

  const reportCase = (newCase: CivicCase) => {
    setCases(prev => [newCase, ...prev]);
    setTrustScore(prev => prev + 10);
  };

  const redeemWallet = (amount: number, description: string) => {
    setWalletBalance(prev => Math.max(0, prev - amount));
    setWalletTransactions(prev => [{
      id: Math.random().toString(),
      amount,
      description,
      timestamp: 'Just now',
      type: 'redeem'
    }, ...prev]);

    // Parse method from description
    const methodLabel = description.includes('PayPal') ? 'PayPal' : 
                        description.includes('Venmo') ? 'Venmo' : 
                        description.includes('CashApp') ? 'CashApp' : 
                        description.includes('UPI') ? 'UPI' : 
                        description.includes('Transit') ? 'Transit Credit' : 
                        description.includes('Utility') ? 'Utility Bill Credit' : 'Local Gift Card';

    const newDb: Disbursal = {
      id: 'ds-' + Date.now(),
      user: user?.email || 'shaikkashif40@gmail.com',
      amount,
      method: methodLabel,
      status: 'Pending Approval',
      timestamp: 'Just now'
    };

    setDisbursals(prev => [newDb, ...prev]);
    addSystemLog(`NEW DISBURSAL FILED: Citizen ${user?.email || 'shaikkashif40@gmail.com'} requested $${amount.toFixed(2)} payout via ${methodLabel}.`);
  };

  return (
    <DemoContext.Provider value={{
      userRole, trustScore, walletBalance, walletTransactions, location, cases, setRole, setLocation, verifyCase, reportCase, attachEvidence, preparePacket, claimRepair, isDarkMode, toggleDarkMode, redeemWallet,
      stewards, fraudAlerts, disbursals, inboxMessages, systemLogs, slaHours, rewardMultiplier, twilioSmsNotification, autoNotifyWarden, directApiHook, suspendedUsers,
      addSteward, toggleStewardStatus, actionFraud, approveDisbursal, acknowledgeInboxMessage, addSystemLog, setSlaHours, setRewardMultiplier, setTwilioSmsNotification, setAutoNotifyWarden, setDirectApiHook
    }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
}
