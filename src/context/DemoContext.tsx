import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { CivicCase, DemoState, WalletTransaction } from '../types';
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
  const [cases, setCases] = useState<CivicCase[]>(mockCases);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

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
          reward = 5;
          newLedger.push({ id: Math.random().toString(), title: 'Verified by You', sourceType: 'Citizen', timestamp: 'Just now', trustImpact: 5, explanation: 'You confirmed the issue exists.' });
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
          reward = 8;
          newLedger.push({ id: Math.random().toString(), title: 'Duplicate Risk Resolved', sourceType: 'Citizen', timestamp: 'Just now', trustImpact: 8, explanation: 'Confirmed as a distinct issue.' });
        } else if (actionType === 'fixed') {
          reward = 12;
          newStage = 6;
          newStatus = 'Fix Verified';
          newLedger.push({ id: Math.random().toString(), title: 'Fix Verified', sourceType: 'Citizen', timestamp: 'Just now', trustImpact: 12, explanation: 'Field repair has been verified.' });
        } else if (actionType === 'location') {
          reward = 5;
          newLedger.push({ id: Math.random().toString(), title: 'Location Confirmed', sourceType: 'Citizen', timestamp: 'Just now', trustImpact: 5, explanation: 'Manual pin location confirmed.' });
        } else if (actionType === 'warden_duplicate') {
          reward = 15;
          newStage = 7;
          newStatus = 'Closed' as any;
          newLedger.push({ id: Math.random().toString(), title: 'Warden Override: Duplicate', sourceType: 'Citizen', timestamp: 'Just now', trustImpact: 15, explanation: 'Area Warden flagged as duplicate.' });
        } else if (actionType === 'warden_resolve') {
          reward = 15;
          newStage = 7;
          newStatus = 'Closed' as any;
          newLedger.push({ id: Math.random().toString(), title: 'Warden Override: Resolved', sourceType: 'Citizen', timestamp: 'Just now', trustImpact: 15, explanation: 'Area Warden marked issue as resolved.' });
        }

        setTrustScore(prevScore => prevScore + reward);
        
        // Handle Bounty
        if (c.bounty && actionType === 'verify') {
          const splitAmount = c.bounty.amount * 0.5;
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
  };

  return (
    <DemoContext.Provider value={{
      userRole, trustScore, walletBalance, walletTransactions, location, cases, setRole, setLocation, verifyCase, reportCase, attachEvidence, preparePacket, claimRepair, isDarkMode, toggleDarkMode, redeemWallet
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
