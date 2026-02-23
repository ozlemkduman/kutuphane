export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const generateSlug = (text: string) => {
  return text
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
};

export const getHeaders = (token: string | null, selectedSchoolId: string | null, userRole?: string): Record<string, string> => {
  const headers: Record<string, string> = { 'Authorization': `Bearer ${token}` };
  if (selectedSchoolId && userRole === 'DEVELOPER') {
    headers['X-School-Id'] = selectedSchoolId;
  }
  return headers;
};

export const getJsonHeaders = (token: string | null, selectedSchoolId: string | null, userRole?: string): Record<string, string> => {
  return {
    'Content-Type': 'application/json',
    ...getHeaders(token, selectedSchoolId, userRole),
  };
};
