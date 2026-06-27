export type CaseStatus = 'Reported' | 'AI Analyzed' | 'Community Verified' | 'Authority Ready' | 'Escalated' | 'Resolved' | 'Fix Verified' | 'Draft analyzed' | 'Community verification needed' | 'Community verified' | 'Reviewer packet prepared' | 'Field repair claimed' | 'Fix verification needed' | 'Fix verified' | 'Closed';
export type Category = 'Pothole / road damage' | 'Water leakage' | 'Broken streetlight' | 'Garbage overflow' | 'Other civic hazard';

export interface EvidenceLedgerItem {
  id: string;
  title: string;
  sourceType: 'Citizen' | 'AI Draft' | 'Community' | 'Reviewer' | 'Demo System';
  timestamp: string;
  trustImpact: number;
  explanation: string;
}

export interface CivicCase {
  id: string;
  title: string;
  category: Category;
  locationLabel: string;
  distance: string;
  severity: number; // 1-5
  status: CaseStatus;
  age: string;
  verificationCount: number;
  trustScoreImpact: number;
  evidenceQuality: 'Low' | 'Medium' | 'High';
  suggestedDepartment: string;
  aiSummary: string;
  aiAdditionalSummary?: string;
  aiObjectiveDescription?: string;
  locationSource: 'Photo GPS' | 'Device location' | 'Manual pin' | 'Demo area';
  duplicateRisk: 'Low' | 'Medium' | 'High';
  proofLadderStage: number; // 0-6
  nextBestAction: string;
  imagePlaceholder?: string;
  fixedImagePlaceholder?: string;
  verifiedByMe?: boolean;
  authorId?: string;
  lat?: number;
  lng?: number;
  bounty?: {
    amount: number;
    sponsor: string;
  };
  evidenceLedger?: EvidenceLedgerItem[];
}

export interface WalletTransaction {
  id: string;
  amount: number;
  description: string;
  timestamp: string;
  type: 'earn' | 'redeem';
}

export interface DemoState {
  userRole: 'citizen' | 'steward' | 'admin';
  trustScore: number;
  walletBalance: number;
  walletTransactions: WalletTransaction[];
  location: string | null;
  cases: CivicCase[];
}
