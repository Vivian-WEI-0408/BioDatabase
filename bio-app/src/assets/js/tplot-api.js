import axios from 'axios';

const webDb = axios.create({ baseURL: '/' });

export function getTplotErrorMessage(error, fallback = 'Request failed.') {
  if (!error?.response) {
    return error?.message === 'Network Error'
      ? 'Network error. Please check that the TPlot Flask service is running.'
      : (typeof error?.message === 'string' && error.message.trim()) || fallback;
  }
  const data = error.response.data;
  if (typeof data === 'string' && data.trim()) {
    return data.trim();
  }
  if (data && typeof data === 'object' && !(data instanceof Blob)) {
    if (typeof data.message === 'string' && data.message.trim()) return data.message.trim();
    if (typeof data.msg === 'string' && data.msg.trim()) return data.msg.trim();
    if (typeof data.error === 'string' && data.error.trim()) return data.error.trim();
  }
  if (error.response.status) {
    return `${fallback} (HTTP ${error.response.status})`;
  }
  if (typeof error?.message === 'string' && error.message.trim()) {
    return error.message.trim();
  }
  return fallback;
}

export function formatFileSize(bytes) {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(n < 10 * 1024 ? 1 : 0)}KB`;
  return `${(n / (1024 * 1024)).toFixed(1)}MB`;
}

export function toFormParams(fields) {
  const params = new URLSearchParams();
  Object.entries(fields || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    params.append(key, String(value));
  });
  return params;
}

export function triggerBlobDownload(data, filename) {
  const blob = data instanceof Blob ? data : new Blob([data]);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || 'download';
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function mapNameList(list) {
  const names = Array.isArray(list) ? list : [];
  return names
    .filter((name) => typeof name === 'string' && name.trim())
    .map((name) => ({ name, id: name }));
}

export async function fetchLbdOptionalOptions(fallback) {
  try {
    const res = await webDb.get('WebDatabase/GetLBDDimerNameList');
    const options = mapNameList(res.data);
    if (options.length === 0) {
      throw new Error('Empty LBD name list');
    }
    return [...options, { name: 'None', id: 'none' }];
  } catch (error) {
    console.warn('Failed to load LBD optional options from WebDatabase, using mock.', error);
    return fallback;
  }
}

export async function fetchDbdOptionalOptions(fallback) {
  try {
    const res = await webDb.get('WebDatabase/GetDBDNameList');
    const options = mapNameList(res.data);
    if (options.length === 0) {
      throw new Error('Empty DBD name list');
    }
    return [...options, { name: 'None', id: 'none' }];
  } catch (error) {
    console.warn('Failed to load DBD optional options from WebDatabase, using mock.', error);
    return fallback;
  }
}

export function selectValue(option, fallback = '') {
  if (!option) return fallback;
  if (option.id != null && option.id !== '') return String(option.id);
  if (option.name != null && option.name !== '') return String(option.name);
  return fallback;
}

export function optionalSelectValue(option) {
  if (!option) return null;
  // Prefer display name: Opt/WebDatabase expect real part names (not mock lowercase ids).
  const value =
    option.name != null && String(option.name).trim() !== ''
      ? String(option.name).trim()
      : selectValue(option, '');
  if (!value || value.toLowerCase() === 'none') return null;
  return value;
}
