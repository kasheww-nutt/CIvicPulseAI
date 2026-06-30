/// <reference types="vite/client" />

export interface AnalysisResult {
  isCivicIssue?: boolean;
  category: string;
  summary: string;
  additionalSummary?: string;
  objectiveDescription: string;
  severity: 1 | 2 | 3 | 4 | 5;
  suggestedDepartment: string;
  locationConfidence: "High" | "Medium" | "Low";
  evidenceQuality: "High" | "Medium" | "Low";
  missingInformation: string[];
  duplicateClues: string[];
  citizenSafetyNote: string;
  confidence: "High" | "Medium" | "Low";
}

export interface AnalyzeInput {
  imageBase64?: string;
  mimeType?: string;
  description?: string;
  location?: string;
}

const fallbackResult: AnalysisResult = {
  isCivicIssue: true,
  category: "Pothole / Road Damage",
  summary: "Demo analysis fallback: Large sinkhole detected, roughly 4ft diameter. Severe hazard to vehicles and pedestrians.",
  objectiveDescription: "A large sinkhole, approximately 4 feet in diameter, is present at the reported location, presenting a severe hazard to vehicles and pedestrians.",
  severity: 5,
  suggestedDepartment: "Public Works Department",
  locationConfidence: "Medium",
  evidenceQuality: "Medium",
  missingInformation: ["Exact depth"],
  duplicateClues: [],
  citizenSafetyNote: "Exercise caution near the reported area.",
  confidence: "Medium"
};

export async function analyzeCivicIssue(input: AnalyzeInput): Promise<AnalysisResult> {
  try {
    const response = await fetch('/api/analyze-civic-issue', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg = errData.error || response.statusText || "Server analysis failed";
      throw new Error(errMsg);
    }

    const data = await response.json();
    const text = data.text;
    
    if (!text) throw new Error("No text returned from server");

    let parsed: any;
    try {
        parsed = JSON.parse(text);
    } catch(e) {
        const cleanText = text.replace(/^\`\`\`json/m, '').replace(/\`\`\`$/m, '').trim();
        parsed = JSON.parse(cleanText);
    }
    
    return {
      isCivicIssue: typeof parsed.isCivicIssue === 'boolean' ? parsed.isCivicIssue : true,
      category: typeof parsed.category === 'string' ? parsed.category : fallbackResult.category,
      summary: typeof parsed.summary === 'string' ? parsed.summary : fallbackResult.summary,
      additionalSummary: typeof parsed.additionalSummary === 'string' ? parsed.additionalSummary : undefined,
      objectiveDescription: typeof parsed.objectiveDescription === 'string' ? parsed.objectiveDescription : fallbackResult.objectiveDescription,
      severity: (typeof parsed.severity === 'number' && parsed.severity >= 1 && parsed.severity <= 5) ? parsed.severity as 1|2|3|4|5 : fallbackResult.severity,
      suggestedDepartment: typeof parsed.suggestedDepartment === 'string' ? parsed.suggestedDepartment : fallbackResult.suggestedDepartment,
      locationConfidence: ['High', 'Medium', 'Low'].includes(parsed.locationConfidence) ? parsed.locationConfidence : fallbackResult.locationConfidence,
      evidenceQuality: ['High', 'Medium', 'Low'].includes(parsed.evidenceQuality) ? parsed.evidenceQuality : fallbackResult.evidenceQuality,
      missingInformation: Array.isArray(parsed.missingInformation) ? parsed.missingInformation : fallbackResult.missingInformation,
      duplicateClues: Array.isArray(parsed.duplicateClues) ? parsed.duplicateClues : fallbackResult.duplicateClues,
      citizenSafetyNote: typeof parsed.citizenSafetyNote === 'string' ? parsed.citizenSafetyNote : fallbackResult.citizenSafetyNote,
      confidence: ['High', 'Medium', 'Low'].includes(parsed.confidence) ? parsed.confidence : fallbackResult.confidence,
    };
  } catch (error: any) {
    console.error("Gemini analysis error:", error);
    throw error;
  }
}
