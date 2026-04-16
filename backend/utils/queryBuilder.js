const buildQuery = (skills) => {
  const skillQuery = skills.map(skill => skill).join(' OR ');

  return `${skillQuery} state:open type:issue comments:<10`;
};

module.exports = { buildQuery };