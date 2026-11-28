import test from 'node:test';
import assert from 'node:assert/strict';
import { Timestamp } from 'firebase/firestore';
import { dashboardReport } from '../src/gym-reporting-data.js';
import { countMembershipStatuses, membershipStatus } from '../src/subscription-data.js';

const day = '2026-11-28';
const ts = iso => Timestamp.fromDate(new Date(iso));

test('dashboard reports active and expired distinct customer entitlements, never historical subscription counts', () => {
  const states = [
    { customerId: 'A', coveredFromDay: '2026-11-01', paidThroughExclusive: '2026-12-01' },
    { customerId: 'B', coveredFromDay: '2026-10-01', paidThroughExclusive: '2026-11-01' },
    { customerId: 'C', coveredFromDay: '2026-12-01', paidThroughExclusive: '2027-01-01' }
  ];
  assert.deepEqual(countMembershipStatuses(states, day), { active: 1, expired: 1, upcoming: 1, inactive: 0 });
  assert.equal(membershipStatus(states[0], day), 'active');
  assert.equal(membershipStatus(states[1], day), 'expired');
  assert.equal(membershipStatus(states[2], day), 'upcoming');
  const actual = dashboardReport({
    memberships: states, memberOpen: [], memberHistory: [],
    today: day, walkInToday: 0, walkInOpen: 0
  });
  assert.equal(actual.active, 1);
  assert.equal(actual.expired, 1);
});

test('Cambodia midnight transitions include today and prevent double-count of a moved open visit', () => {
  const yesterday = { visitId: 'old', checkedInAt: ts('2026-11-27T16:59:59.000Z') };
  const todayVisit = { visitId: 'today', checkedInAt: ts('2026-11-27T17:00:00.000Z') };
  const report = dashboardReport({
    memberships: [],
    memberOpen: [todayVisit],
    memberHistory: [todayVisit, yesterday],
    today: day, walkInToday: 2, walkInOpen: 3
  });
  assert.equal(report.todayCheckIns, 3);
  assert.equal(report.openVisits, 4);
  assert.equal(report.active, 0);
  assert.equal(report.expired, 0);
});

test('unknown collection or offline database values do not show a misleading zero', () => {
  const report = dashboardReport({
    memberships: null, memberOpen: [], memberHistory: [],
    today: day, walkInToday: 0, walkInOpen: 0
  });
  assert.equal(report.active, null);
  assert.equal(report.todayCheckIns, null);
  assert.equal(dashboardReport({
    memberships: [], memberOpen: [], memberHistory: [], today: day,
    walkInToday: 0, walkInOpen: 0
  }).todayCheckIns, 0);
});
