const fs = require("fs");
const pdfParse = require("pdf-parse");

const normalizeText = (value = "") =>
  value
    .toLowerCase()
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(/[^a-z0-9+#.\s/-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const findEntryByAlias = (registry, skill) => {
  const normalizedSkill = normalizeText(skill);

  for (const entry of registry.values()) {
    if (entry.aliases.has(normalizedSkill)) {
      return entry;
    }
  }

  return null;
};

const buildSkillRegistry = (jobs = []) => {
  const registry = new Map();

  const addSkill = (canonical, aliases = []) => {
    const normalized = normalizeText(canonical);
    if (!normalized) {
      return;
    }

    const existing = findEntryByAlias(registry, canonical);
    if (existing) {
      [canonical, ...aliases].forEach((alias) => {
        const nextAlias = normalizeText(alias);
        if (nextAlias) {
          existing.aliases.add(nextAlias);
        }
      });
      return;
    }

    if (!registry.has(normalized)) {
      registry.set(normalized, {
        canonical,
        aliases: new Set()
      });
    }

    const entry = registry.get(normalized);
    [canonical, ...aliases].forEach((alias) => {
      const nextAlias = normalizeText(alias);
      if (nextAlias) {
        entry.aliases.add(nextAlias);
      }
    });
  };

  const commonSkills = [
    ["JavaScript", ["js", "ecmascript"]],
    ["TypeScript", ["ts"]],
    ["React", ["reactjs", "react.js"]],
    ["Node.js", ["node", "nodejs"]],
    ["Express", ["express.js", "expressjs"]],
    ["MongoDB", ["mongodb", "mongo"]],
    ["SQL", ["mysql", "postgresql", "postgres"]],
    ["HTML", ["html5"]],
    ["CSS", ["css3"]],
    ["Tailwind CSS", ["tailwind"]],
    ["Bootstrap", []],
    ["Redux", ["redux toolkit"]],
    ["Next.js", ["nextjs", "next"]],
    ["Git", ["git version control"]],
    ["GitHub", ["github"]],
    ["REST API", ["rest", "api"]],
    ["GraphQL", []],
    ["Docker", []],
    ["AWS", ["amazon web services"]],
    ["Python", []],
    ["Java", []],
    ["C++", ["cpp"]],
    ["C#", ["c sharp"]],
    ["Testing", ["jest", "mocha", "chai", "unit testing"]],
    ["Communication", []],
    ["Problem Solving", ["problem-solving"]],
    ["Data Structures", ["dsa", "data structure"]],
    ["Algorithms", []],
    ["Leadership", []],
    ["Teamwork", []],
    ["Agile", ["scrum"]]
  ];

  commonSkills.forEach(([canonical, aliases]) => addSkill(canonical, aliases));

  jobs.forEach((job) => {
    (job.skills || []).forEach((skill) => {
      addSkill(skill, [skill]);
    });
  });

  return registry;
};

const resolveCanonicalSkill = (skill, registry) => {
  const normalized = normalizeText(skill);
  if (!normalized) {
    return null;
  }

  if (registry.has(normalized)) {
    return registry.get(normalized).canonical;
  }

  const entry = findEntryByAlias(registry, skill);
  if (entry) {
    return entry.canonical;
  }

  return skill.trim();
};

const extractPdfText = async (filePath) => {
  const buffer = await fs.promises.readFile(filePath);
  const result = await pdfParse(buffer);
  return result.text || "";
};

const detectSkills = (text, registry) => {
  const normalizedText = normalizeText(text);
  const matches = [];

  for (const entry of registry.values()) {
    const aliases = [...entry.aliases];
    const found = aliases.some((alias) => {
      if (!alias) {
        return false;
      }

      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(^|[^a-z0-9+#])${escaped}([^a-z0-9+#]|$)`, "i");
      return regex.test(normalizedText);
    });

    if (found) {
      matches.push(entry.canonical);
    }
  }

  return [...new Set(matches)].sort((left, right) => left.localeCompare(right));
};

const buildSuggestions = ({ missingSkills, matchPercentage }) => {
  const suggestions = [];

  if (missingSkills.length) {
    const preview = missingSkills.slice(0, 5).join(", ");
    suggestions.push(`Add the missing skills: ${preview}.`);
  }

  if (matchPercentage < 60) {
    suggestions.push("Strengthen the technical skills section with tools and frameworks used in active job openings.");
  } else if (matchPercentage < 85) {
    suggestions.push("Tune the resume summary and project descriptions to include more job-specific keywords.");
  } else {
    suggestions.push("Your resume already aligns well. Add measurable impact, certifications, and project outcomes to stand out further.");
  }

  suggestions.push("Keep the formatting clean, use bullet points, and place key skills near the top for ATS readability.");

  return suggestions;
};

const scoreJobMatch = (resumeSkills, job, registry) => {
  const requiredSkills = [
    ...new Set(
      (job.skills || [])
        .map((skill) => resolveCanonicalSkill(skill, registry))
        .filter(Boolean)
    )
  ];
  const matchedSkills = requiredSkills.filter((skill) =>
    resumeSkills.some((resumeSkill) => normalizeText(resumeSkill) === normalizeText(skill))
  );
  const missingSkills = requiredSkills.filter(
    (skill) => !matchedSkills.some((matchedSkill) => normalizeText(matchedSkill) === normalizeText(skill))
  );
  const matchPercentage = requiredSkills.length
    ? Math.round((matchedSkills.length / requiredSkills.length) * 100)
    : 0;

  return {
    jobId: job._id,
    title: job.title,
    companyName: job.companyName || job.companyId?.name || "Unknown company",
    requiredSkills,
    matchedSkills,
    missingSkills,
    matchPercentage
  };
};

const analyzeResume = async ({ filePath, jobs = [] }) => {
  const text = await extractPdfText(filePath);
  const skillRegistry = buildSkillRegistry(jobs);
  const extractedSkills = detectSkills(text, skillRegistry);
  const requiredSkills = [
    ...new Set(
      jobs.flatMap((job) =>
        (job.skills || [])
          .map((skill) => resolveCanonicalSkill(skill, skillRegistry))
          .filter(Boolean)
      )
    )
  ];
  const matchedSkills = requiredSkills.filter((skill) =>
    extractedSkills.some((resumeSkill) => normalizeText(resumeSkill) === normalizeText(skill))
  );
  const missingSkills = requiredSkills.filter(
    (skill) => !matchedSkills.some((matchedSkill) => normalizeText(matchedSkill) === normalizeText(skill))
  );
  const matchPercentage = requiredSkills.length
    ? Math.round((matchedSkills.length / requiredSkills.length) * 100)
    : 0;
  const suggestions = buildSuggestions({ missingSkills, matchPercentage });
  const jobMatches = jobs
    .map((job) => scoreJobMatch(extractedSkills, job, skillRegistry))
    .sort((left, right) => right.matchPercentage - left.matchPercentage);

  return {
    extractedText: text,
    extractedSkills,
    requiredSkills,
    missingSkills,
    matchPercentage,
    suggestions,
    jobMatches
  };
};

module.exports = {
  analyzeResume,
  normalizeText,
  buildSkillRegistry
};
