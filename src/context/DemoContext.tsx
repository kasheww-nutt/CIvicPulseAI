import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { CivicCase, DemoState, WalletTransaction, Steward, FraudAlert, Disbursal, InboxMessage } from '../types';
import { mockCases } from '../data/mock';
import { useAuth } from './AuthContext';
import { createNotification } from '../lib/notifications';
import { collection, onSnapshot, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function cleanUndefined<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(cleanUndefined) as any;
  }
  const newObj: any = {};
  for (const key of Object.keys(obj as any)) {
    const val = (obj as any)[key];
    if (val !== undefined) {
      newObj[key] = cleanUndefined(val);
    }
  }
  return newObj;
}

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
  const { user, dbRole, activePortal, setActivePortal } = useAuth();
  const [currentView, setCurrentView] = useState<'citizen' | 'steward' | 'admin'>('citizen');
  
  useEffect(() => {
    if (activePortal) {
      setCurrentView(activePortal);
    }
  }, [activePortal]);

  const userRole = currentView;
  
  const setRole = (role: 'citizen' | 'steward' | 'admin') => {
    if (dbRole === 'admin') {
      setCurrentView(role);
      setActivePortal(role);
    } else if (dbRole === 'steward' && (role === 'steward' || role === 'citizen')) {
      setCurrentView(role);
      setActivePortal(role);
    } else if (dbRole === 'citizen' && role === 'citizen') {
      setCurrentView(role);
      setActivePortal(role);
    } else {
      alert("Access Denied: Your account does not have permission for this role. An admin must upgrade your account.");
    }
  };
  
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
    return mockCases.map(c => {
      if (c.id === 'c-004') return { ...c, authorId: 'Rohan_99' };
      if (c.id === 'c-010') return { ...c, authorId: 'Aisha_K' };
      if (c.id === 'c-009') return { ...c, authorId: 'Vikram_X' };
      return c;
    });
  });

  // Sync with Firestore Real-time database
  useEffect(() => {
    const q = collection(db, 'cases');
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        console.log('Firestore cases collection is empty. Seeding with mock cases in real-time...');
        // Seed database
        const seedPromises = mockCases.map(async (c) => {
          const caseDocRef = doc(db, 'cases', c.id);
          let authorId = c.authorId || null;
          if (c.id === 'c-004') authorId = 'Rohan_99';
          if (c.id === 'c-010') authorId = 'Aisha_K';
          if (c.id === 'c-009') authorId = 'Vikram_X';

          const enrichedCase: CivicCase = {
            ...c,
            authorId: authorId || 'system-seed',
            verifiedUsers: c.verifiedUsers || (c.verifiedByMe ? ['system-seed'] : [])
          };
          try {
            await setDoc(caseDocRef, cleanUndefined(enrichedCase));
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, `cases/${c.id}`);
          }
        });
        await Promise.all(seedPromises);
      } else {
        const fetchedCases = snapshot.docs.map(docSnapshot => {
          const data = docSnapshot.data() as CivicCase;
          const verifiedByMe = data.verifiedByMe || (user?.uid ? data.verifiedUsers?.includes(user.uid) : false);
          return {
            ...data,
            verifiedByMe
          };
        });

        // Sort cases stable order by numeric c-ID
        fetchedCases.sort((a, b) => {
          const numA = parseInt(a.id.replace('c-', '')) || 999;
          const numB = parseInt(b.id.replace('c-', '')) || 999;
          return numA - numB;
        });

        setCases(fetchedCases);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'cases');
    });

    return () => unsubscribe();
  }, [user]);

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

  // Local cases cache removed in favor of real-time Firestore synchronization

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

  // Synchronize the current citizen user to the persistent fraud alerts list so they can test suspending their own account
  useEffect(() => {
    if (user && dbRole === 'citizen' && user.email) {
      const email = user.email;
      // 1. Save to registered citizens list
      const savedCitizens = localStorage.getItem('civic_registered_citizens');
      const list: string[] = savedCitizens ? JSON.parse(savedCitizens) : [];
      if (!list.includes(email)) {
        list.push(email);
        localStorage.setItem('civic_registered_citizens', JSON.stringify(list));
      }

      // 2. Ensure they are in the fraudAlerts state
      setFraudAlerts(prev => {
        if (prev.some(f => f.user === email)) {
          return prev;
        }
        const newAlert: FraudAlert = {
          id: `fr-reg-${Date.now()}`,
          user: email,
          reason: 'Automated municipal integrity scan flagged high frequency submission anomaly.',
          anomalyScore: 89,
          status: 'Flagged',
          location: location || 'Indiranagar'
        };
        return [newAlert, ...prev];
      });
    }
  }, [user, dbRole, location]);

  // Load registered citizens' alerts in case we are in another session / logged in as admin
  useEffect(() => {
    const savedCitizens = localStorage.getItem('civic_registered_citizens');
    if (savedCitizens) {
      const list: string[] = JSON.parse(savedCitizens);
      setFraudAlerts(prev => {
        let updated = false;
        const copy = [...prev];
        list.forEach((email, idx) => {
          if (!copy.some(f => f.user === email)) {
            copy.unshift({
              id: `fr-reg-restore-${idx}-${Date.now()}`,
              user: email,
              reason: 'Automated municipal integrity scan flagged high frequency submission anomaly.',
              anomalyScore: 89,
              status: 'Flagged',
              location: 'Indiranagar'
            });
            updated = true;
          }
        });
        return updated ? copy : prev;
      });
    }
  }, []);


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

  const actionFraud = async (id: string, username: string, action: 'blacklist' | 'dismiss') => {
    if (action === 'blacklist') {
      setFraudAlerts(prev => prev.map(f => f.id === id ? { ...f, status: 'Blacklisted' } : f));
      setSuspendedUsers(prev => {
        if (!prev.includes(username)) {
          return [...prev, username];
        }
        return prev;
      });
      addSystemLog(`ADMIN ACTION: Blacklisted citizen ${username} and deleted all associated reports due to pattern manipulation alerts.`);
      
      // CASCADE: Delete all cases submitted by this user in Firestore!
      const userCases = cases.filter(c => c.authorId === username);
      const deletePromises = userCases.map(async (c) => {
        const caseDocRef = doc(db, 'cases', c.id);
        try {
          await deleteDoc(caseDocRef);
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `cases/${c.id}`);
        }
      });
      await Promise.all(deletePromises);
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

  const attachEvidence = async (id: string, newEvidenceQuality: 'Low' | 'Medium' | 'High') => {
    const target = cases.find(c => c.id === id);
    if (target) {
      setTrustScore(prevScore => prevScore + 8);
      const verifiedUsers = target.verifiedUsers || [];
      if (user?.uid && !verifiedUsers.includes(user.uid)) {
        verifiedUsers.push(user.uid);
      }
      const updatedCase: Partial<CivicCase> = {
        verificationCount: target.verificationCount + 1,
        evidenceQuality: newEvidenceQuality === 'High' ? 'High' : target.evidenceQuality === 'High' ? 'High' : 'Medium',
        duplicateRisk: 'Low',
        verifiedUsers,
        evidenceLedger: [...(target.evidenceLedger || []), {
          id: Math.random().toString(),
          title: 'Clearer Evidence Attached',
          sourceType: 'Citizen',
          timestamp: 'Just now',
          trustImpact: 8,
          explanation: 'Additional photographic evidence provided.'
        }]
      };
      const caseDocRef = doc(db, 'cases', id);
      try {
        await setDoc(caseDocRef, cleanUndefined(updatedCase), { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `cases/${id}`);
      }
    }
  };

  const verifyCase = async (id: string, actionType: 'verify' | 'duplicate' | 'fixed' | 'location' | 'warden_duplicate' | 'warden_resolve') => {
    const c = cases.find(caseObj => caseObj.id === id);
    if (!c) return;

    const isVerifiedAlready = c.verifiedByMe;
    if (isVerifiedAlready && !actionType.startsWith('warden_')) {
      return;
    }

    let triggeredNotification = false;
    let notifyCount = 0;
    let reward = 0;
    let newStage = c.proofLadderStage;
    let newStatus = c.status;
    const newLedger = [...(c.evidenceLedger || [])];

    if (actionType === 'verify') {
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
         notifyCount = 5;
      } else if (c.verificationCount + 1 === 10) {
         triggeredNotification = true;
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

    const verifiedUsers = c.verifiedUsers || [];
    if (user?.uid && !verifiedUsers.includes(user.uid)) {
      verifiedUsers.push(user.uid);
    }

    const updatedFields: Partial<CivicCase> = {
      verificationCount: c.verificationCount + 1,
      status: newStatus,
      proofLadderStage: newStage,
      locationSource: actionType === 'location' ? 'Device location' : c.locationSource,
      duplicateRisk: actionType === 'duplicate' ? 'Low' : c.duplicateRisk,
      evidenceLedger: newLedger,
      verifiedUsers
    };

    const caseDocRef = doc(db, 'cases', id);
    try {
      await setDoc(caseDocRef, cleanUndefined(updatedFields), { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `cases/${id}`);
    }

    if (triggeredNotification && c.authorId) {
       const uId = user?.uid || c.authorId;
       createNotification({
         userId: uId,
         title: 'Milestone Reached!',
         message: `Your report "${c.title}" just reached ${notifyCount} verifications!`,
         isRead: false,
         type: 'verification',
         caseId: c.id
       });
    }
  };

  const preparePacket = async (id: string) => {
    const target = cases.find(c => c.id === id);
    if (target) {
      const updatedFields: Partial<CivicCase> = {
        status: 'Authority Ready',
        proofLadderStage: 3,
        evidenceLedger: [...(target.evidenceLedger || []), {
          id: Math.random().toString(),
          title: 'Reviewer Packet Prepared',
          sourceType: 'Reviewer',
          timestamp: 'Just now',
          trustImpact: 0,
          explanation: 'Escalation packet generated for municipal review.'
        }]
      };
      const caseDocRef = doc(db, 'cases', id);
      try {
        await setDoc(caseDocRef, cleanUndefined(updatedFields), { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `cases/${id}`);
      }
    }
  };

  const claimRepair = async (id: string) => {
    const target = cases.find(c => c.id === id);
    if (target) {
      const updatedFields: Partial<CivicCase> = {
        status: 'Field repair claimed' as any,
        proofLadderStage: 4,
        evidenceLedger: [...(target.evidenceLedger || []), {
          id: Math.random().toString(),
          title: 'Field Repair Claimed',
          sourceType: 'Demo System',
          timestamp: 'Just now',
          trustImpact: 0,
          explanation: 'A repair crew has marked this issue as repaired.'
        }]
      };
      const caseDocRef = doc(db, 'cases', id);
      try {
        await setDoc(caseDocRef, cleanUndefined(updatedFields), { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `cases/${id}`);
      }

      if (target.authorId) {
         const uId = user?.uid || target.authorId;
         createNotification({
           userId: uId,
           title: 'Action Taken!',
           message: `Your report "${target.title}" has been claimed for repair by the municipal team.`,
           isRead: false,
           type: 'claimed',
           caseId: target.id
         });
      }
    }
  };

  const reportCase = async (newCase: CivicCase) => {
    const caseId = newCase.id || `c-${Date.now()}`;
    const enrichedCase: CivicCase = {
      ...newCase,
      id: caseId,
      verifiedUsers: newCase.verifiedUsers || (newCase.verifiedByMe ? [user?.uid || 'anonymous'] : [])
    };
    const caseDocRef = doc(db, 'cases', caseId);
    try {
      await setDoc(caseDocRef, cleanUndefined(enrichedCase));
      setTrustScore(prev => prev + 10);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `cases/${caseId}`);
    }
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
