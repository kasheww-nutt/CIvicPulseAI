import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);
const otps = new Map<string, string>();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.post("/api/send-otp", async (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    if (!process.env.RESEND_API_KEY) {
      return res.status(500).json({ error: "Email service not configured. Please add RESEND_API_KEY." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otps.set(email, otp);
    
    // Clear OTP after 10 minutes
    setTimeout(() => {
      if (otps.get(email) === otp) {
        otps.delete(email);
      }
    }, 10 * 60 * 1000);

    try {
      const { data, error } = await resend.emails.send({
        from: "CivicPulse AI <onboarding@resend.dev>", // using generic resend sender since no verified domain
        to: email,
        subject: "Your CivicPulse AI Verification Code",
        html: `<p>Your verification code is: <strong>${otp}</strong></p><p>This code will expire in 10 minutes.</p>`,
      });

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to send email" });
    }
  });

  app.post("/api/verify-otp", (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }

    const storedOtp = otps.get(email);
    if (storedOtp === otp) {
      otps.delete(email);
      return res.json({ success: true });
    } else {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }
  });

  app.post("/api/analyze-civic-issue", async (req, res) => {
    try {
      const input = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        return res.status(500).json({ error: "Server missing GEMINI_API_KEY" });
      }

      const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

      const prompt = `Analyze this civic issue report.
Description provided: ${input.description || 'None'}
Location provided: ${input.location || 'None'}

You MUST analyze the provided image. Use the image to determine the severity, category, and evidence quality.

De-Escalation Engine: If the citizen's description is angry, emotional, or aggressive, translate it into a completely objective, municipal-standard description for the "objectiveDescription" field, retaining only the critical facts.
Also, provide an "additionalSummary" based solely on the visual evidence in the image (e.g. "The pothole is approximately 2 feet wide and filled with water").

Return ONLY a valid JSON object matching this schema exactly, with no markdown formatting:
{
  "category": "string (e.g. Pothole, Streetlight, Vandalism, Water Leak)",
  "summary": "string (brief 1-2 sentence description)",
  "additionalSummary": "string (details extracted purely from the image)",
  "objectiveDescription": "string (de-escalated, objective, municipal-standard translation of the citizen's description)",
  "severity": number (1 to 5, where 5 is critical/dangerous),
  "suggestedDepartment": "string",
  "locationConfidence": "High" | "Medium" | "Low",
  "evidenceQuality": "High" | "Medium" | "Low",
  "missingInformation": ["string", "string"],
  "duplicateClues": ["string"],
  "citizenSafetyNote": "string",
  "confidence": "High" | "Medium" | "Low"
}`;

      let contents: any[] = [{ role: "user", parts: [{ text: prompt }] }];

      if (input.imageBase64 && input.mimeType) {
          contents = [{
            role: "user",
            parts: [
              { text: prompt },
              { 
                inline_data: { 
                  data: input.imageBase64, 
                  mime_type: input.mimeType 
                } 
              }
            ]
          }];
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2
          }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Gemini API error:", response.status, errText);
        return res.status(response.status).json({ error: `Gemini API error: ${response.statusText}` });
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
        return res.status(500).json({ error: "No text returned from Gemini" });
      }

      res.json({ text });
    } catch (error: any) {
      console.error("Gemini analysis error:", error);
      res.status(500).json({ error: error.message || "Failed to analyze issue" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
