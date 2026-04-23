const buildQuery = (skills) => {
  const skillQuery = skills
    .map((skill) => String(skill).trim())
    .filter(Boolean)
    .join(' OR ');

  if (!skillQuery) {
    throw new Error('At least one valid skill is required');
  }

  return `${skillQuery} state:open type:issue comments:<10`;
};

module.exports = { buildQuery };
