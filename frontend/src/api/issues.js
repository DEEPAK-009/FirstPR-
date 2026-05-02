import api from './axios'

export const checkBackendHealth = async () => {
  const { data } = await api.get('/health')
  return data
}

export const recommendIssues = async ({
  skills,
  minConfidence = 0
}) => {
  const normalizedSkills = Array.isArray(skills)
    ? skills.map((skill) => String(skill).trim()).filter(Boolean)
    : [];

  const { data } = await api.post('/issues/recommend', {
    skills: normalizedSkills,
    minConfidence
  })

  return data
}
