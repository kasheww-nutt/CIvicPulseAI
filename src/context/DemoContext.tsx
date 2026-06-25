import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CivicCase, DemoState } from '../types';
import { mockCases } from '../data/mock';

interface DemoContextType extends DemoState {
  setRole: (role: 'citizen' | 'admin') => void;
  setLocation: (loc: string | null) => void;
  verifyCase: (id: string, actionType: 'verify' | 'duplicate' | 'fixed') => void;
  reportCase: (newCase: CivicCase) => void;
  attachEvidence: (id: string, newEvidenceQuality: 'Low' | 'Medium' | 'High') => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [userRole, setRole] = useState<'citizen' | 'admin'>('citizen');
  const [trustScore, setTrustScore] = useState(148);
  const [location, setLocation] = useState<string | null>(null);
  const [cases, setCases] = useState<CivicCase[]>(mockCases);

  const attachEvidence = (id: string, newEvidenceQuality: 'Low' | 'Medium' | 'High') => {
    setCases(prev => prev.map(c => {
      if (c.id === id) {
        setTrustScore(prevScore => prevScore + 8); // reward for evidence
        return {
          ...c,
          verificationCount: c.verificationCount + 1,
          evidenceQuality: newEvidenceQuality === 'High' ? 'High' : c.evidenceQuality === 'High' ? 'High' : 'Medium',
          duplicateRisk: 'Low',
          verifiedByMe: true,
        };
      }
      return c;
    }));
  };

  const verifyCase = (id: string, actionType: 'verify' | 'duplicate' | 'fixed') => {
    setCases(prev => prev.map(c => {
      if (c.id === id && !c.verifiedByMe) {
        let reward = 0;
        let newStage = c.proofLadderStage;
        let newStatus = c.status;

        if (actionType === 'verify') {
          reward = 5;
          if (c.proofLadderStage < 2) {
            newStage = 2;
            newStatus = 'Community Verified';
          } else if (c.proofLadderStage === 2 && c.verificationCount > 5) {
             newStage = 3;
             newStatus = 'Authority Ready';
          }
        } else if (actionType === 'duplicate') {
          reward = 8;
        } else if (actionType === 'fixed') {
          reward = 12;
          newStage = 6;
          newStatus = 'Fix Verified';
        }

        setTrustScore(prevScore => prevScore + reward);
        return {
          ...c,
          verificationCount: c.verificationCount + 1,
          verifiedByMe: true,
          status: newStatus,
          proofLadderStage: newStage
        };
      }
      return c;
    }));
  };

  const reportCase = (newCase: CivicCase) => {
    setCases(prev => [newCase, ...prev]);
    setTrustScore(prev => prev + 10);
  };

  return (
    <DemoContext.Provider value={{
      userRole, trustScore, location, cases, setRole, setLocation, verifyCase, reportCase, attachEvidence
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
