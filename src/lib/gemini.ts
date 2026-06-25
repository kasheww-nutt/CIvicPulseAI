/// <reference types="vite/client" />
import { GoogleGenAI } from '@google/genai';

export interface AnalysisResult {
  category: string;
  summary: string;
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
  category: "Pothole / Road Damage",
  summary: "Demo analysis fallback: Large sinkhole detected, roughly 4ft diameter. Severe hazard to vehicles and pedestrians.",
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
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("VITE_GEMINI_API_KEY not found. Using fallback analysis.");
    return new Promise(resolve => setTimeout(() => resolve(fallbackResult), 1500));
  }

  // WARNING: Client-side Gemini API key usage is not recommended for production due to security risks.
  // This is implemented as requested for this client-only React/Vite app.
  const ai = new GoogleGenAI({ apiKey });
  const model = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash';

  const prompt = `Analyze this civic issue report.
Description provided: ${input.description || 'None'}
Location provided: ${input.location || 'None'}

Return ONLY a valid JSON object matching this schema exactly, with no markdown formatting:
{
  "category": "string (e.g. Pothole, Streetlight, Vandalism, Water Leak)",
  "summary": "string (brief 1-2 sentence description)",
  "severity": number (1 to 5, where 5 is critical/dangerous),
  "suggestedDepartment": "string",
  "locationConfidence": "High" | "Medium" | "Low",
  "evidenceQuality": "High" | "Medium" | "Low",
  "missingInformation": ["string", "string"],
  "duplicateClues": ["string"],
  "citizenSafetyNote": "string",
  "confidence": "High" | "Medium" | "Low"
}`;

  let contents: any[] = [{ text: prompt }];

  if (input.imageBase64 && input.mimeType) {
      contents = [
        { text: prompt },
        { 
          inlineData: { 
            data: input.imageBase64, 
            mimeType: input.mimeType 
          } 
        }
      ];
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2
      }
    });

    const text = response.text;
    if (!text) throw new Error("No text returned from Gemini");

    let parsed: any;
    try {
        parsed = JSON.parse(text);
    } catch(e) {
        const cleanText = text.replace(/^\`\`\`json/m, '').replace(/\`\`\`$/m, '').trim();
        parsed = JSON.parse(cleanText);
    }
    
    return {
      category: typeof parsed.category === 'string' ? parsed.category : fallbackResult.category,
      summary: typeof parsed.summary === 'string' ? parsed.summary : fallbackResult.summary,
      severity: (typeof parsed.severity === 'number' && parsed.severity >= 1 && parsed.severity <= 5) ? parsed.severity as 1|2|3|4|5 : fallbackResult.severity,
      suggestedDepartment: typeof parsed.suggestedDepartment === 'string' ? parsed.suggestedDepartment : fallbackResult.suggestedDepartment,
      locationConfidence: ['High', 'Medium', 'Low'].includes(parsed.locationConfidence) ? parsed.locationConfidence : fallbackResult.locationConfidence,
      evidenceQuality: ['High', 'Medium', 'Low'].includes(parsed.evidenceQuality) ? parsed.evidenceQuality : fallbackResult.evidenceQuality,
      missingInformation: Array.isArray(parsed.missingInformation) ? parsed.missingInformation : fallbackResult.missingInformation,
      duplicateClues: Array.isArray(parsed.duplicateClues) ? parsed.duplicateClues : fallbackResult.duplicateClues,
      citizenSafetyNote: typeof parsed.citizenSafetyNote === 'string' ? parsed.citizenSafetyNote : fallbackResult.citizenSafetyNote,
      confidence: ['High', 'Medium', 'Low'].includes(parsed.confidence) ? parsed.confidence : fallbackResult.confidence,
    };
  } catch (error) {
    console.error("Gemini analysis error:", error);
    return fallbackResult;
  }
}
