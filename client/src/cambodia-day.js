const dayMs = 24 * 60 * 60 * 1000;
const format = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Phnom_Penh' });

export function cambodiaDate(date = new Date()) {
  return format.format(date);
}

export function cambodiaMidnight(day) {
  return Date.parse(day + 'T00:00:00+07:00');
}

export function dayAfter(day) {
  return cambodiaMidnight(day) + dayMs;
}
