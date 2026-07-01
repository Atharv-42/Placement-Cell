const { GoogleGenerativeAI } = require("@google/generative-ai");

const trimForPrompt = (value = "", maxLength = 18000) =>
  value.length > maxLength ? value.slice(0, maxLength) : value;

const buildPrompt = ({ resumeText, jobDescription }) => `
You are an ATS resume analyzer and placement interview coach.

Analyze the resume against the job description. Return ONLY valid JSON.
Do not include markdown, code fences, comments, or explanations outside JSON.
Do not invent candidate details. If data is unavailable, use an empty string or empty array.

Return this exact JSON shape:
{
  "atsScore": 0,
  "candidate": {
    "name": "",
    "email": "",
    "phone": ""
  },
  "sections": {
    "summary": "",
    "skills": [],
    "education": [],
    "experience": [],
    "projects": []
  },
  "matchedSkills": [],
  "missingSkills": [],
  "sectionFeedback": {
    "summary": [],
    "skills": [],
    "education": [],
    "experience": [],
    "projects": []
  },
  "atsImprovements": [],
  "weakBullets": [
    {
      "original": "",
      "rewritten": ""
    }
  ],
  "recommendedKeywords": [],
  "interviewQuestions": []
}

Scoring rules:
- Score out of 100.
- Consider keyword match, relevant skills, experience alignment, education, projects, clarity, measurable impact, and ATS readability.
- Penalize vague bullet points, missing required skills, unclear dates, poor formatting, and missing role-specific keywords.

Resume:
${trimForPrompt(resumeText)}

Job Description:
${trimForPrompt(jobDescription)}
`;

const parseJsonResponse = (text = "") => {
  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1) {
    throw new Error("AI response did not contain valid JSON");
  }

  return JSON.parse(cleaned.slice(start, end + 1));
};

const asStringArray = (value) =>
  Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean) : [];

const normalizeAnalysis = (analysis = {}) => ({
  atsScore: Math.max(0, Math.min(100, Number(analysis.atsScore) || 0)),
  candidate: {
    name: analysis.candidate?.name || "",
    email: analysis.candidate?.email || "",
    phone: analysis.candidate?.phone || ""
  },
  sections: {
    summary: analysis.sections?.summary || "",
    skills: asStringArray(analysis.sections?.skills),
    education: asStringArray(analysis.sections?.education),
    experience: asStringArray(analysis.sections?.experience),
    projects: asStringArray(analysis.sections?.projects)
  },
  matchedSkills: asStringArray(analysis.matchedSkills),
  missingSkills: asStringArray(analysis.missingSkills),
  sectionFeedback: {
    summary: asStringArray(analysis.sectionFeedback?.summary),
    skills: asStringArray(analysis.sectionFeedback?.skills),
    education: asStringArray(analysis.sectionFeedback?.education),
    experience: asStringArray(analysis.sectionFeedback?.experience),
    projects: asStringArray(analysis.sectionFeedback?.projects)
  },
  atsImprovements: asStringArray(analysis.atsImprovements),
  weakBullets: Array.isArray(analysis.weakBullets)
    ? analysis.weakBullets
        .map((item) => ({
          original: item?.original || "",
          rewritten: item?.rewritten || ""
        }))
        .filter((item) => item.original || item.rewritten)
    : [],
  recommendedKeywords: asStringArray(analysis.recommendedKeywords),
  interviewQuestions: asStringArray(analysis.interviewQuestions)
});

exports.analyzeResumeWithAI = async ({ resumeText, jobDescription }) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing. Add it to backend/.env to enable AI analysis.");
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2
    }
  });

  const result = await model.generateContent(buildPrompt({ resumeText, jobDescription }));
  const text = result.response.text();

  return normalizeAnalysis(parseJsonResponse(text));
};
