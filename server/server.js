const express = require("express");
const cors = require("cors");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const { analyzeJobDescription } = require("./aiService");
const { scrapeJobDescription } = require("./scraperService");

const app = express();
const PORT = process.env.PORT || 5001;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    aiProvider: "Groq",
    model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
  });
});

app.post("/api/analyze", upload.single("resumeFile"), async (req, res) => {
  try {
    console.log("Received /api/analyze request");

    const jobLink = req.body.jobLink || "";
    const jobDescription = req.body.jobDescription || "";
    const resumeFile = req.file;

    console.log("Body fields:", req.body);
    console.log("File received:", resumeFile?.originalname);

    let resumeText = "";

    if (resumeFile) {
      if (resumeFile.mimetype !== "application/pdf") {
        return res.status(400).json({ error: "Please upload a PDF resume." });
      }

      const pdfData = await pdfParse(resumeFile.buffer);
      resumeText = pdfData.text || "";
    }

    console.log("Resume text length:", resumeText.length);

    if (!jobLink.trim() && !jobDescription.trim()) {
      return res.status(400).json({
        error: "Please provide either a job description or a job link",
      });
    }

    if (!resumeText.trim()) {
      return res.status(400).json({
        error: "Please upload your resume PDF",
      });
    }

    let jobText = jobDescription;

    if (jobLink.trim()) {
      console.log("Job link provided, scraping job page...");
      jobText = await scrapeJobDescription(jobLink.trim());
    }

    console.log("Job text length:", jobText.length);
    console.log("Calling analyzeJobDescription with job + resume...");

    const result = await analyzeJobDescription(jobText, resumeText);

    console.log("Analysis completed successfully");
    res.json(result);
  } catch (error) {
    console.error("Analyze error:", error);
    res.status(500).json({
      error: error.message || "AI analysis failed",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});