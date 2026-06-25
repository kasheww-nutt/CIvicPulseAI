import { CivicCase } from '../types';

export interface IssueDNA {
  category: string;
  normalizedCategory: string;
  severity: 1 | 2 | 3 | 4 | 5;
  geoBucket: string;
  textFingerprint: string;
  visualClues: string[];
  timeWindow: "fresh" | "recent" | "stale";
  safetyRisk: "Low" | "Medium" | "High";
  duplicateScore: number;
}

export interface DuplicateCandidate {
  existingCase: CivicCase;
  score: number;
  reason: string;
}

const CATEGORY_MAP: Record<string, string> = {
  'Pothole / road damage': 'pothole_road',
  'Water leakage': 'water_drain',
  'Broken streetlight': 'streetlight',
  'Garbage overflow': 'waste_sanitation',
  'Other civic hazard': 'other_hazard',
};

export function normalizeCategory(category: string): string {
  const match = Object.keys(CATEGORY_MAP).find(k => category.toLowerCase().includes(k.toLowerCase().split(' ')[0]));
  if (match) return CATEGORY_MAP[match];
  if (category.toLowerCase().includes('water') || category.toLowerCase().includes('leak')) return 'water_drain';
  if (category.toLowerCase().includes('pothole') || category.toLowerCase().includes('road')) return 'pothole_road';
  if (category.toLowerCase().includes('light')) return 'streetlight';
  if (category.toLowerCase().includes('garbage') || category.toLowerCase().includes('waste')) return 'waste_sanitation';
  return 'other_hazard';
}

function getGeoBucket(locationLabel: string): string {
  // Simple deterministic bucket from string
  const clean = locationLabel.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (clean.includes('indiranagar')) return 'geo_indiranagar';
  if (clean.includes('koramangala')) return 'geo_koramangala';
  if (clean.includes('hsrlayout')) return 'geo_hsr';
  if (clean.length > 5) return 'geo_' + clean.substring(0, 5);
  return 'geo_unknown';
}

function createTextFingerprint(title: string, category: string, location: string): string {
  const text = `${title} ${category} ${location}`.toLowerCase();
  const words = text.replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 3);
  return Array.from(new Set(words)).sort().join('_');
}

export function buildIssueDna(caseOrDraft: Partial<CivicCase>): IssueDNA {
  const severity = (caseOrDraft.severity && caseOrDraft.severity >= 1 && caseOrDraft.severity <= 5) ? caseOrDraft.severity as 1|2|3|4|5 : 3;
  
  const timeWindow = caseOrDraft.age?.includes('day') ? 'recent' : caseOrDraft.age?.includes('week') ? 'stale' : 'fresh';
  
  const safetyRisk = severity >= 4 ? 'High' : severity === 3 ? 'Medium' : 'Low';

  return {
    category: caseOrDraft.category || 'Other civic hazard',
    normalizedCategory: normalizeCategory(caseOrDraft.category || ''),
    severity,
    geoBucket: getGeoBucket(caseOrDraft.locationLabel || ''),
    textFingerprint: createTextFingerprint(caseOrDraft.title || '', caseOrDraft.category || '', caseOrDraft.locationLabel || ''),
    visualClues: [],
    timeWindow,
    safetyRisk,
    duplicateScore: 0,
  };
}

export function compareIssueDna(dna1: IssueDNA, dna2: IssueDNA): { score: number, reason: string } {
  let score = 0;
  const reasons: string[] = [];

  if (dna1.geoBucket === dna2.geoBucket && dna1.geoBucket !== 'geo_unknown') {
    score += 40;
    reasons.push('Same approximate area');
  } else if (dna1.geoBucket === 'geo_unknown' || dna2.geoBucket === 'geo_unknown') {
    // Cannot rule out same area
    score += 10;
  }

  if (dna1.normalizedCategory === dna2.normalizedCategory) {
    score += 30;
    reasons.push('Same category of issue');
  }

  const words1 = new Set(dna1.textFingerprint.split('_'));
  const words2 = new Set(dna2.textFingerprint.split('_'));
  let overlap = 0;
  for (const w of words1) {
    if (words2.has(w)) overlap++;
  }
  
  if (overlap > 0) {
    score += Math.min(30, overlap * 10);
    if (overlap >= 2) {
      reasons.push('Similar description details');
    }
  }

  return { 
    score: Math.min(100, score), 
    reason: reasons.length > 0 ? reasons.join(' + ') : 'Low similarity' 
  };
}

export function findDuplicateCandidates(draft: Partial<CivicCase>, existingCases: CivicCase[]): DuplicateCandidate[] {
  const draftDna = buildIssueDna(draft);
  const candidates: DuplicateCandidate[] = [];

  for (const c of existingCases) {
    // Don't compare with self if editing
    if (c.id === draft.id) continue;
    
    const existingDna = buildIssueDna(c);
    const { score, reason } = compareIssueDna(draftDna, existingDna);
    
    if (score >= 60) {
      candidates.push({ existingCase: c, score, reason });
    }
  }

  return candidates.sort((a, b) => b.score - a.score);
}
