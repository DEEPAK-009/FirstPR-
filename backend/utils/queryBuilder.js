const formatSkill = (skill) => {
  const normalizedSkill = String(skill).trim();

  if (!normalizedSkill) {
    return null;
  }

  return normalizedSkill.includes(' ')
    ? `"${normalizedSkill}"`
    : normalizedSkill;
};

const buildQuery = (skills) => {
  const formattedSkills = skills
    .map(formatSkill)
    .filter(Boolean);

  if (formattedSkills.length === 0) {
    throw new Error('At least one valid skill is required');
  }

  const skillQuery = formattedSkills.join(' OR ');

  return `(${skillQuery}) state:open type:issue comments:<10`;
};

module.exports = { buildQuery };
