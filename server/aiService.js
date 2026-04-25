const Groq = require("groq-sdk");
require("dotenv").config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function analyzeJobDescription(jobDescription) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing in .env");
  }

  if (!jobDescription || !jobDescription.trim()) {
    throw new Error("Job description is required");
  }

  console.log("Sending prompt to Groq API...");

  const userPrompt = `
Analyze this job description and return ONLY valid JSON.

Return this exact JSON structure:
{
  "summary": "2-3 line summary of the role",
  "skills": ["skill1", "skill2", "skill3"],
  "matchScore": 85,
  "tailoredAnswer": "short professional why hire me answer",
  "coverMessage": "short professional cover message",
  "resumeSuggestions": ["suggestion1", "suggestion2", "suggestion3"]
}

Job description:
${jobDescription}
`;

  const completion = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    temperature: 0.4,
    messages: [
      {
        role: "system",
        content:
          "You are an AI career assistant. Return only valid JSON. No markdown. No explanation.",
      },
      {
        role: "user",
        content: userPrompt,
      },
    ],
  });

  let text = completion.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error("Empty response from Groq API");
  }

  text = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(text);
  } catch (error) {
    console.log("Raw Groq response:", text);
    throw new Error("Failed to parse Groq JSON response");
  }
}

module.exports = { analyzeJobDescription };