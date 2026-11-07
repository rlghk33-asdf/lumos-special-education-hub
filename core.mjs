export function safeToolUrl(value) {
  try {
    const url = new URL(value);
    const h = url.hostname.toLowerCase();
    if (url.protocol !== 'https:' || url.username || url.password || url.port || !h.includes('.') || h === 'localhost' || h.endsWith('.local') || h.endsWith('.localhost') || h.includes(':') || /^\d+\./.test(h)) return null;
    return url.href;
  } catch { return null; }
}
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
export function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.valueOf()) && localDate(date) === value;
}
export function validateEntry(entry) {
  if (!validDate(entry.date)) return '올바른 날짜를 선택해 주세요.';
  if (typeof entry.title !== 'string' || !entry.title.trim() || entry.title.length > 80) return '제목은 1~80자로 적어 주세요.';
  if (typeof entry.body !== 'string' || !entry.body.trim() || entry.body.length > 10000) return '본문은 1~10,000자로 적어 주세요.';
  if (!['happy','calm','tired','thoughtful'].includes(entry.mood)) return '오늘의 마음을 선택해 주세요.';
  return null;
}
export function moveActivity(list, id, direction) {
  const copy = [...list];
  const index = copy.findIndex(x=>x.id === id);
  const next = index + direction;
  if (index < 0 || next < 0 || next >= copy.length) return copy;
  [copy[index],copy[next]] = [copy[next],copy[index]];
  return copy;
}
export function readStored(value, fallback) {
  try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : fallback; }
  catch { return fallback; }
}
export function navigationTarget(previous, hash, dirty, allowed) {
  const next = ['schedule','diary','favorites'].includes(hash) ? hash : 'hub';
  return previous === 'diary' && next !== 'diary' && dirty && !allowed ? previous : next;
}
export function diaryControls(busy) { return { editingDisabled:busy, logoutDisabled:false }; }
