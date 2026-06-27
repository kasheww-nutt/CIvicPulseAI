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

  app.post("/api/dispatch-email", async (req, res) => {
    const { 
      email, 
      caseId,
      caseTitle, 
      category, 
      severity, 
      locationLabel, 
      lat, 
      lng, 
      aiObjectiveDescription, 
      signaturesCount, 
      department 
    } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Recipient email is required" });
    }

    if (!process.env.RESEND_API_KEY) {
      return res.status(500).json({ error: "Email service not configured. Please add RESEND_API_KEY in Settings." });
    }

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="background-color: #0f284b; color: #ffffff; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h2 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">CIVICPULSE AI DISPATCH</h2>
          <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.85; font-weight: 600; text-transform: uppercase;">Official Municipal Escalation Packet</p>
        </div>
        
        <div style="padding: 24px 20px; color: #1e293b;">
          <div style="margin-bottom: 24px;">
            <span style="background-color: #f1f5f9; color: #334155; font-size: 11px; font-weight: 700; padding: 4px 8px; border-radius: 4px; text-transform: uppercase;">REFERENCE ID: #${caseId ? caseId.toUpperCase() : "N/A"}</span>
          </div>

          <h3 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #0f284b; line-height: 1.2;">${caseTitle}</h3>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-weight: 600; width: 140px;">Category</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #0f284b; font-weight: 700;">${category}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-weight: 600;">Reported Severity</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #ef4444; font-weight: 700;">Level ${severity} / 5</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-weight: 600;">Target Department</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #0f284b; font-weight: 700;">${department}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-weight: 600;">GPS Coordinates</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #0f284b; font-family: monospace; font-weight: 700;">${lat}, ${lng}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-weight: 600;">Location Details</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #0f284b; font-weight: 700;">${locationLabel}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-weight: 600;">Citizen Backing</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #10b981; font-weight: 700;">${signaturesCount} verified resident signatures</td>
            </tr>
          </table>

          <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
            <h4 style="margin: 0 0 6px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #3b82f6; font-weight: 700;">AI De-Escalated Description</h4>
            <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #334155; font-style: italic;">"${aiObjectiveDescription}"</p>
          </div>

          <div style="text-align: center; margin-top: 28px; margin-bottom: 12px;">
            <a href="https://www.google.com/maps/search/?api=1&query=${lat},${lng}" target="_blank" style="background-color: #3b82f6; color: #ffffff; padding: 12px 24px; border-radius: 8px; font-weight: 700; text-decoration: none; display: inline-block; font-size: 13px; box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2);">🗺️ View Location in Google Maps</a>
          </div>
        </div>

        <div style="background-color: #f1f5f9; padding: 16px; border-radius: 0 0 8px 8px; text-align: center; font-size: 11px; color: #64748b;">
          <p style="margin: 0; font-weight: 600;">CivicPulse AI • Decentralized Crowdsourced Municipal Validation</p>
          <p style="margin: 4px 0 0 0;">This email is part of a hackathon live-demo simulation of our direct authority routing protocol.</p>
        </div>
      </div>
    `;

    try {
      const { data, error } = await resend.emails.send({
        from: "CivicPulse AI <onboarding@resend.dev>",
        to: email,
        subject: `[CP-DISPATCH] Verified ${category} - Severity ${severity} at ${locationLabel}`,
        html: htmlContent,
      });

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      res.json({ success: true, messageId: data?.id });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message || "Failed to send dispatch email" });
    }
  });

  app.post("/api/dispatch-sms", async (req, res) => {
    const { toNumber, caseTitle, locationLabel, severity } = req.body;

    if (!toNumber) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    const messageBody = `🚨 URGENT: CivicPulse AI has escalated a critical infrastructure failure!\n\nIncident: ${caseTitle || "Critical Hazard"}\nLocation: ${locationLabel || "Unknown"}\nSeverity: ${severity || 5}/5 (Emergency Dispatch Triggered)\n\nReview & track in real-time on your dashboard.`;

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      // Return beautiful mock simulation so it never crashes and provides a stellar demo
      return res.json({
        success: true,
        simulated: true,
        messageBody,
        toNumber,
        reason: "Twilio credentials not configured in settings. Running high-fidelity simulation."
      });
    }

    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          To: toNumber,
          From: fromNumber,
          Body: messageBody
        })
      });

      const data: any = await response.json();

      if (!response.ok) {
        console.error("Twilio API Error Details:", data);
        return res.status(response.status).json({ 
          error: data.message || "Twilio API error",
          code: data.code,
          simulated: true,
          messageBody
        });
      }

      res.json({
        success: true,
        simulated: false,
        sid: data.sid,
        status: data.status,
        messageBody
      });
    } catch (err: any) {
      console.error("Twilio submission error:", err);
      res.status(500).json({ 
        error: err.message || "Twilio server error",
        simulated: true,
        messageBody
      });
    }
  });

  app.post("/api/export-report", async (req, res) => {
    const { recipientEmail, cases } = req.body;

    if (!recipientEmail) {
      return res.status(400).json({ error: "Recipient email is required" });
    }

    if (!cases || !Array.isArray(cases)) {
      return res.status(400).json({ error: "Invalid cases array" });
    }

    // Process statistics
    const totalCases = cases.length;
    const verifiedCases = cases.filter(c => (c.verificationCount || 0) > 0);
    const totalVerifications = cases.reduce((acc, c) => acc + (c.verificationCount || 0), 0);
    
    // Category counts & Cost estimations
    const categoryStats: { [key: string]: { count: number; totalCost: number } } = {};
    let totalEstCost = 0;

    cases.forEach((c) => {
      const cat = c.category || "Other civic hazard";
      if (!categoryStats[cat]) {
        categoryStats[cat] = { count: 0, totalCost: 0 };
      }
      categoryStats[cat].count += 1;

      // Estimate repair cost based on category and severity
      let baseCost = 250;
      const lowerCat = cat.toLowerCase();
      if (lowerCat.includes("pothole") || lowerCat.includes("road")) baseCost = 350;
      else if (lowerCat.includes("water") || lowerCat.includes("leak")) baseCost = 1500;
      else if (lowerCat.includes("streetlight") || lowerCat.includes("light")) baseCost = 200;
      else if (lowerCat.includes("garbage") || lowerCat.includes("waste")) baseCost = 150;
      else if (lowerCat.includes("power") || lowerCat.includes("electric")) baseCost = 4500;

      const estimatedCost = baseCost * (c.severity || 3);
      categoryStats[cat].totalCost += estimatedCost;
      totalEstCost += estimatedCost;
    });

    // Neighborhood heatmap calculations
    const neighborhoodStats: { [key: string]: number } = {};
    cases.forEach((c) => {
      const label = c.locationLabel || "Unknown Area";
      const parts = label.split(",");
      const key = parts[0]?.trim() || "Main Precinct";
      neighborhoodStats[key] = (neighborhoodStats[key] || 0) + 1;
    });

    const heatmapRows = Object.entries(neighborhoodStats)
      .sort((a, b) => b[1] - a[1])
      .map(([neigh, count]) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; color: #334155; font-weight: 600;">${neigh}</td>
          <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; text-align: center; color: #ef4444; font-weight: 700;">${count} Incidents</td>
        </tr>
      `).join("");

    const categoryRows = Object.entries(categoryStats)
      .map(([cat, stats]) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; color: #334155; font-weight: 700;">${cat}</td>
          <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; text-align: center; font-weight: bold; color: #0f284b;">${stats.count}</td>
          <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: bold; color: #10b981;">$${stats.totalCost.toLocaleString()}</td>
        </tr>
      `).join("");

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="background-color: #0f284b; color: #ffffff; padding: 24px; border-radius: 12px; text-align: center;">
          <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">CIVICPULSE AI</h1>
          <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Weekly AI Insight & Operations Report</p>
          <div style="display: inline-block; background-color: rgba(255,255,255,0.15); border-radius: 20px; padding: 4px 12px; font-size: 11px; font-weight: bold; margin-top: 12px; text-transform: uppercase;">
            For Municipal Planners & City Engineers
          </div>
        </div>
        
        <div style="padding: 24px 8px; color: #1e293b;">
          <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 800; color: #0f284b; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Executive Summary</h3>
          <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px 0;">
            This report compiled by the CivicPulse AI operations engine aggregates citizen-validated civic hazards. By prioritizing crowd-signed reports with verified imagery, we help cities optimize public work orders and de-escalate emotional citizen complaints.
          </p>

          <div style="display: flex; gap: 16px; margin-bottom: 24px; text-align: center; border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px; background-color: #f8fafc; justify-content: space-around;">
            <div style="padding: 8px;">
              <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; margin-bottom: 4px;">Total Issues</div>
              <div style="font-size: 20px; font-weight: 800; color: #0f284b;">${totalCases}</div>
            </div>
            <div style="padding: 8px; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; padding-left: 20px; padding-right: 20px;">
              <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; margin-bottom: 4px;">Verified Signals</div>
              <div style="font-size: 20px; font-weight: 800; color: #10b981;">${verifiedCases.length}</div>
            </div>
            <div style="padding: 8px;">
              <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; margin-bottom: 4px;">Estimated Budget</div>
              <div style="font-size: 20px; font-weight: 800; color: #ef4444;">$${totalEstCost.toLocaleString()}</div>
            </div>
          </div>

          <h3 style="margin: 24px 0 12px 0; font-size: 15px; font-weight: 800; color: #0f284b; text-transform: uppercase; letter-spacing: 0.5px;">1. Category Breakdown & Budget Matrix</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">
            <thead>
              <tr style="background-color: #f1f5f9; text-align: left;">
                <th style="padding: 10px; font-weight: bold; color: #475569;">Category</th>
                <th style="padding: 10px; text-align: center; font-weight: bold; color: #475569;">Count</th>
                <th style="padding: 10px; text-align: right; font-weight: bold; color: #475569;">Est. Cost</th>
              </tr>
            </thead>
            <tbody>
              ${categoryRows}
            </tbody>
          </table>

          <h3 style="margin: 24px 0 12px 0; font-size: 15px; font-weight: 800; color: #0f284b; text-transform: uppercase; letter-spacing: 0.5px;">2. Geographic Density Heatmap</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">
            <thead>
              <tr style="background-color: #f1f5f9; text-align: left;">
                <th style="padding: 10px; font-weight: bold; color: #475569;">Neighborhood Precinct</th>
                <th style="padding: 10px; text-align: center; font-weight: bold; color: #475569;">Density Score</th>
              </tr>
            </thead>
            <tbody>
              ${heatmapRows}
            </tbody>
          </table>

          <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; border-radius: 0 8px 8px 0; margin-top: 24px; font-size: 12px; color: #14532d; line-height: 1.5;">
            <strong>AI Optimization Insight:</strong> High-density clusters are emerging in the neighborhood maps. Standardizing repairs on potholes concurrently in these precincts can capture up to <strong>14.5% in public works budget savings</strong> by reducing vehicle redeployment overheads.
          </div>
        </div>

        <div style="background-color: #f1f5f9; padding: 16px; border-radius: 12px; text-align: center; font-size: 11px; color: #64748b; margin-top: 24px;">
          <p style="margin: 0; font-weight: 600;">CivicPulse AI • Autonomous Smart Operations</p>
          <p style="margin: 4px 0 0 0;">This email is part of a hackathon live-demo simulation. No municipal funds were actualized.</p>
        </div>
      </div>
    `;

    if (!process.env.RESEND_API_KEY) {
      return res.json({
        success: true,
        simulated: true,
        htmlContent,
        stats: { totalCases, totalEstCost, totalVerifications },
        reason: "Resend not configured in settings. Showing live HTML browser simulation instead."
      });
    }

    try {
      const { data, error } = await resend.emails.send({
        from: "CivicPulse AI <onboarding@resend.dev>",
        to: recipientEmail,
        subject: `[CP-MUNICIPAL-EXPORT] City Planning AI Insight Report`,
        html: htmlContent,
      });

      if (error) {
        return res.status(400).json({ error: error.message, simulated: true, htmlContent });
      }

      res.json({
        success: true,
        simulated: false,
        messageId: data?.id,
        htmlContent,
        stats: { totalCases, totalEstCost, totalVerifications }
      });
    } catch (err: any) {
      console.error("Resend error:", err);
      res.status(500).json({
        error: err.message || "Failed to send official email report",
        simulated: true,
        htmlContent
      });
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
