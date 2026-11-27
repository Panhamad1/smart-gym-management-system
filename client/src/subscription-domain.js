// Pure subscription domain rules; no production writes until Firestore policy and UI are approved.
// Date-only values always mean dates in Cambodia (UTC+07:00). End dates are exclusive.
export const DEFAULT_MEMBERSHIP_PLANS = Object.freeze([
  { id: 'monthly', label: 'Monthly', months: 1, amountMinor: 5000, currency: 'USD' },
  { id: 'yearly', label: 'Yearly', months: 12, amountMinor: 50000, currency: 'USD' }
]);

export function validateCambodiaDay(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error('Expected a date in YYYY-MM-DD format.');
  }
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day || year < 2000 || year > 9999) {
    throw new Error('Enter a real calendar date.');
  }
  return value;
}

export function addCalendarMonths(day, months) {
  validateCambodiaDay(day);
  if (!Number.isInteger(months) || months <= 0 || months > 120) {
    throw new Error('Plan duration must be 1–120 months.');
  }
  const [year, month, date] = day.split('-').map(Number);
  const first = new Date(Date.UTC(year, month - 1 + months, 1));
  const daysInMonth = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  const end = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), Math.min(date, daysInMonth)));
  return end.toISOString().slice(0, 10);
}

export function validatePlan(plan) {
  if (!plan || typeof plan !== 'object' || typeof plan.id !== 'string' || !/^[A-Za-z0-9-]{1,40}$/.test(plan.id)) {
    throw new Error('Plan needs a valid identifier.');
  }
  if (typeof plan.label !== 'string' || !plan.label.trim() || plan.label.length > 80) {
    throw new Error('Plan name is required (max 80 characters).');
  }
  if (!Number.isInteger(plan.months) || plan.months < 1 || plan.months > 120) {
    throw new Error('Plan must last 1–120 months.');
  }
  if (!Number.isSafeInteger(plan.amountMinor) || plan.amountMinor < 0 || plan.amountMinor > 100000000) {
    throw new Error('Plan price must be a nonnegative amount in cents.');
  }
  if (plan.currency !== 'USD') throw new Error('Only USD is supported in this demo.');
  if (plan.active === false) throw new Error('Inactive plans cannot be purchased.');
  return plan;
}

export function createSubscriptionPeriod(startDay, plan) {
  validateCambodiaDay(startDay);
  validatePlan(plan);
  return { startDay, endDayExclusive: addCalendarMonths(startDay, plan.months) };
}

export function subscriptionStatus(subscription, day) {
  validateCambodiaDay(day);
  if (!subscription || subscription.cancelled === true || subscription.inactive === true) return 'inactive';
  validateCambodiaDay(subscription.startDay);
  validateCambodiaDay(subscription.endDayExclusive);
  if (subscription.endDayExclusive <= subscription.startDay) throw new Error('Invalid subscription period.');
  if (day < subscription.startDay) return 'upcoming';
  if (day >= subscription.endDayExclusive) return 'expired';
  return 'active';
}

export function renewSubscription(current, purchasedDay, plan) {
  validateCambodiaDay(purchasedDay);
  validatePlan(plan);
  const startDay = current && subscriptionStatus(current, purchasedDay) === 'active'
    ? current.endDayExclusive : purchasedDay;
  return createSubscriptionPeriod(startDay, plan);
}

export function visitIsCoveredBySubscription(subscriptions, day) {
  return Array.isArray(subscriptions) && subscriptions.some(sub => subscriptionStatus(sub, day) === 'active');
}

export function snapshotPayment(plan, method) {
  validatePlan(plan);
  if (!['cash', 'bank'].includes(method)) throw new Error('Choose cash or bank transfer.');
  return { planId: plan.id, amountMinor: plan.amountMinor, currency: plan.currency, method, status: 'paid' };
}
