const TOPIC_KEYWORDS = [
  {
    label: 'performance-related keywords',
    keywords: ['performance', 'optimize', 'slow', 'latency', 'render', 'svg']
  },
  {
    label: 'UI-related keywords',
    keywords: ['ui', 'ux', 'layout', 'css', 'style', 'frontend', 'component']
  },
  {
    label: 'backend-related keywords',
    keywords: ['api', 'backend', 'server', 'database', 'endpoint', 'auth']
  },
  {
    label: 'documentation-related keywords',
    keywords: ['docs', 'documentation', 'readme', 'guide']
  },
  {
    label: 'testing-related keywords',
    keywords: ['test', 'testing', 'jest', 'unit test', 'integration']
  }
];

const unique = (values) => [...new Set(values)];

const buildSearchableText = (issue) =>
  [
    issue.title,
    issue.body || '',
    issue.labels.map((label) => label.name).join(' ')
  ]
    .join(' ')
    .toLowerCase();

const getMatchedSkills = (skills, searchableText) =>
  unique(
    skills
      .map((skill) => String(skill).trim())
      .filter(Boolean)
      .filter((skill) => searchableText.includes(skill.toLowerCase()))
  );

const getMatchedTopics = (searchableText) =>
  TOPIC_KEYWORDS.filter(({ keywords }) =>
    keywords.some((keyword) => searchableText.includes(keyword))
  ).map(({ label }) => label);

const joinQuoted = (items) => {
  if (items.length === 1) {
    return `"${items[0]}"`;
  }

  if (items.length === 2) {
    return `"${items[0]}" and "${items[1]}"`;
  }

  return `"${items[0]}", "${items[1]}", and "${items[2]}"`;
};

const joinPlain = (items) => {
  if (items.length === 1) {
    return items[0];
  }

  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }

  return `${items[0]}, ${items[1]}, and ${items[2]}`;
};

const buildMatchReason = (issue, skills) => {
  const searchableText = buildSearchableText(issue);
  const matchedSkills = getMatchedSkills(skills, searchableText).slice(0, 3);
  const matchedTopics = getMatchedTopics(searchableText).slice(0, 2);

  if (matchedSkills.length > 0 && matchedTopics.length > 0) {
    return `Matches your ${joinQuoted(matchedSkills)} skills and ${joinPlain(matchedTopics)} in the issue content.`;
  }

  if (matchedSkills.length > 0) {
    return `Matches your ${joinQuoted(matchedSkills)} skills based on the issue title, description, and labels.`;
  }

  if (matchedTopics.length > 0) {
    return `Matches your submitted skills through ${joinPlain(matchedTopics)} found in the issue content.`;
  }

  return 'Matches your submitted skills based on the issue title, description, and labels.';
};

module.exports = { buildMatchReason };
