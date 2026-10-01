import api from './axios';

export const saveBookmark = async (issue) => {
  const response = await api.post('/bookmarks', issue);
  return response.data;
};

export const getBookmarks = async () => {
  const response = await api.get('/bookmarks');
  return response.data;
};

export const removeBookmark = async (issueId) => {
  const response = await api.delete(`/bookmarks/${issueId}`);
  return response.data;
};

export const updateBookmarkStatus = async (issueId, status, notes = '') => {
  const response = await api.patch(`/bookmarks/${issueId}/status`, { status, notes });
  return response.data;
};
