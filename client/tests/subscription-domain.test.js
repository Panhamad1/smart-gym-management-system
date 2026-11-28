import test from 'node:test';
import { preferredVisitType } from '../src/subscription-data.js';

import assert from 'node:assert/strict';
import {
  DEFAULT_MEMBERSHIP_PLANS, validateCambodiaDay, addCalendarMonths,
  createSubscriptionPeriod, subscriptionStatus, renewSubscription,
  visitIsCoveredBySubscription, snapshotPayment, validatePlan
} from '../src/subscription-domain.js';

const monthly = DEFAULT_MEMBERSHIP_PLANS[0];
const yearly = DEFAULT_MEMBERSHIP_PLANS[1];

test('calendar months handle January 31 and leap-year February', () => {
  assert.equal(addCalendarMonths('2026-01-31', 1), '2026-02-28');
  assert.equal(addCalendarMonths('2028-01-31', 1), '2028-02-29');
  assert.equal(addCalendarMonths('2028-02-29', 12), '2029-02-28');
  assert.equal(addCalendarMonths('2026-11-30', 1), '2026-12-30');
});

test('subscription expiry is the first day not covered', () => {
  const sub = createSubscriptionPeriod('2026-11-27', monthly);
  assert.deepEqual(sub, { startDay: '2026-11-27', endDayExclusive: '2026-12-27' });
  assert.equal(subscriptionStatus(sub, '2026-11-26'), 'upcoming');
  assert.equal(subscriptionStatus(sub, '2026-11-27'), 'active');
  assert.equal(subscriptionStatus(sub, '2026-12-26'), 'active');
  assert.equal(subscriptionStatus(sub, '2026-12-27'), 'expired');
  assert.equal(visitIsCoveredBySubscription([sub], '2026-12-27'), false);
  assert.equal(visitIsCoveredBySubscription([sub], '2026-12-26'), true);
});

test('active renewal extends from previous expiry rather than double-paying for overlapping days', () => {
  const current = createSubscriptionPeriod('2026-11-01', monthly);
  assert.deepEqual(renewSubscription(current, '2026-11-27', monthly), {
    startDay: '2026-12-01', endDayExclusive: '2027-01-01'
  });
  assert.deepEqual(renewSubscription(current, '2027-01-01', yearly), {
    startDay: '2027-01-01', endDayExclusive: '2028-01-01'
  });
});

test('historical price snapshots stay the same when a plan price changes', () => {
  const original = snapshotPayment(monthly, 'cash');
  const edited = { ...monthly, amountMinor: 6000 };
  assert.equal(snapshotPayment(edited, 'bank').amountMinor, 6000);
  assert.equal(original.amountMinor, 5000);
  assert.equal(original.status, 'paid');
});

test('invalid plans, missing payment method, and invalid calendar days are rejected', () => {
  for (const day of ['2026-02-30', '2026-13-01', '2026-11-00', 'not a date']) {
    assert.throws(() => validateCambodiaDay(day));
  }
  assert.throws(() => validatePlan({ ...monthly, amountMinor: -1 }));
  assert.throws(() => validatePlan({ ...monthly, active: false }));
  assert.throws(() => createSubscriptionPeriod('2026-11-27', { ...monthly, months: 0 }));
  assert.throws(() => snapshotPayment(monthly, 'credit-card'));
});

test('inactive subscription does not cover a gym visit', () => {
  const sub = createSubscriptionPeriod('2026-11-01', monthly);
  assert.equal(visitIsCoveredBySubscription([{ ...sub, cancelled: true }], '2026-11-15'), false);
});

test('member check-in defaults to no extra fee only for the exact active customer ID', () => {
  const states = [
    { customerId: 'person-a', coveredFromDay: '2026-11-01', paidThroughExclusive: '2026-12-01' },
    { customerId: 'person-b', coveredFromDay: '2026-10-01', paidThroughExclusive: '2026-11-01' },
    { customerId: 'person-c', coveredFromDay: '2026-12-01', paidThroughExclusive: '2027-01-01' }
  ];
  const today = '2026-11-28';
  assert.equal(preferredVisitType('person-a', states, today), 'subscription');
  assert.equal(preferredVisitType('person-b', states, today), 'walk-in');
  assert.equal(preferredVisitType('person-c', states, today), 'walk-in');
  assert.equal(preferredVisitType('same-name-different-ID', states, today), 'walk-in');
  assert.equal(preferredVisitType('person-a', [], today), 'walk-in');
});
