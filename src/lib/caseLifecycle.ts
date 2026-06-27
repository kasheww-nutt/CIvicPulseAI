import { CivicCase, EvidenceLedgerItem } from '../types';

export type LifecycleStage = 
  | 'Draft analyzed' 
  | 'Reported' 
  | 'Community verification needed' 
  | 'Community verified' 
  | 'Reviewer packet prepared' 
  | 'Field repair claimed' 
  | 'Fix verification needed' 
  | 'Fix verified' 
  | 'Closed';

export function getLifecycleStage(c: CivicCase): LifecycleStage {
  if (c.status === 'Resolved' || c.status === 'Closed' as any) return 'Closed';
  if (c.status === 'Fix Verified') return 'Fix verified';
  if (c.status === 'Field Repair Claimed' as any) return 'Fix verification needed'; // Fallback mapping
  if (c.status === 'Authority Ready' || c.status === 'Escalated') return 'Reviewer packet prepared';
  if (c.status === 'Community Verified' || c.verificationCount >= 3) return 'Community verified';
  if (c.status === 'Reported' && c.verificationCount < 3) return 'Community verification needed';
  if (c.status === 'AI Analyzed') return 'Draft analyzed';
  return 'Reported'; // default
}

export function getNextBestAction(c: CivicCase): string {
  const stage = getLifecycleStage(c);
  if (stage === 'Draft analyzed') return 'Review and submit report.';
  if (stage === 'Community verification needed') {
    if (c.duplicateRisk === 'High') return 'Resolve duplicate risk by confirming or separating.';
    if (c.evidenceQuality === 'Low') return 'Attach clearer photo evidence.';
    if (c.locationSource === 'Manual pin') return 'Confirm exact location via GPS.';
    return `Needs ${Math.max(0, 3 - c.verificationCount)} more community verifications.`;
  }
  if (stage === 'Community verified') return 'Prepare reviewer packet for escalation.';
  if (stage === 'Reviewer packet prepared') return 'Awaiting municipal action or repair claim.';
  if (stage === 'Field repair claimed' || stage === 'Fix verification needed') return 'Verify the fix in the field.';
  if (stage === 'Fix verified') return 'Ready to be closed.';
  return 'No action needed.';
}

export function canVerify(c: CivicCase): boolean {
  const stage = getLifecycleStage(c);
  return stage === 'Community verification needed' && !c.verifiedByMe;
}

export function canPreparePacket(c: CivicCase): boolean {
  return getLifecycleStage(c) === 'Community verified';
}

export function canVerifyFix(c: CivicCase): boolean {
  return getLifecycleStage(c) === 'Fix verification needed' && !c.verifiedByMe;
}

export function getBlockerReason(c: CivicCase): string | null {
  if (c.duplicateRisk === 'High') return 'Duplicate risk unresolved';
  if (c.evidenceQuality === 'Low') return 'Evidence quality low';
  if (c.locationSource === 'Manual pin') return 'Location confidence low';
  if (getLifecycleStage(c) === 'Community verification needed') return `Needs ${Math.max(0, 3 - c.verificationCount)} more community verifications`;
  if (getLifecycleStage(c) === 'Fix verification needed') return 'Awaiting fix verification';
  return null;
}

// Generate a mock evidence ledger if none exists
export function getEvidenceLedger(c: CivicCase): EvidenceLedgerItem[] {
  if (c.evidenceLedger && c.evidenceLedger.length > 0) return c.evidenceLedger;

  const ledger: EvidenceLedgerItem[] = [];
  
  ledger.push({
    id: c.id + '-1',
    title: 'Initial Citizen Report',
    sourceType: 'Citizen',
    timestamp: c.age || 'Unknown',
    trustImpact: 5,
    explanation: 'Report submitted via CivicPulse app.'
  });

  if (c.aiSummary) {
    ledger.push({
      id: c.id + '-2',
      title: 'AI Diagnostic Analysis',
      sourceType: 'AI Draft',
      timestamp: c.age || 'Unknown',
      trustImpact: 5,
      explanation: 'Issue DNA extracted and safety risk calculated.'
    });
  }

  if (c.locationSource === 'Photo GPS' || c.locationSource === 'Device location') {
    ledger.push({
      id: c.id + '-3',
      title: 'High Confidence Location',
      sourceType: 'Citizen',
      timestamp: c.age || 'Unknown',
      trustImpact: 5,
      explanation: `Location verified via ${c.locationSource}.`
    });
  } else {
    ledger.push({
      id: c.id + '-3',
      title: 'Manual Location Entry',
      sourceType: 'Citizen',
      timestamp: c.age || 'Unknown',
      trustImpact: 0,
      explanation: 'Location pinned manually. Needs confirmation.'
    });
  }

  if (c.verificationCount > 0) {
    ledger.push({
      id: c.id + '-4',
      title: 'Community Verified',
      sourceType: 'Community',
      timestamp: 'Recent',
      trustImpact: c.verificationCount * 5,
      explanation: `Verified by ${c.verificationCount} community members.`
    });
  }

  return ledger;
}
