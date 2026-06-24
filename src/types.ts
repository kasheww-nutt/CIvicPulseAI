export type CaseStatus = 'Reported' | 'AI Analyzed' | 'Community Verified' | 'Authority Ready' | 'Escalated' | 'Resolved' | 'Fix Verified';
export type Category = 'Pothole / road damage' | 'Water leakage' | 'Broken streetlight' | 'Garbage overflow' | 'Other civic hazard';

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
  locationSource: 'Photo GPS' | 'Device location' | 'Manual pin' | 'Demo area';
  duplicateRisk: 'Low' | 'Medium' | 'High';
  proofLadderStage: number; // 0-6
  nextBestAction: string;
  imagePlaceholder?: string;
  verifiedByMe?: boolean;
}

export interface DemoState {
  userRole: 'citizen' | 'admin';
  trustScore: number;
  location: string | null;
  cases: CivicCase[];
}
