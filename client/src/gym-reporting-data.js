import { cambodiaDate } from './cambodia-day.js';
import { countMembershipStatuses } from './subscription-data.js';

function visitDay(timestamp) {
  return timestamp?.toDate ? cambodiaDate(timestamp.toDate()) : '';
}

// Stable visit IDs avoid double-counting a session that appears in open and closed snapshots.
export function dashboardReport({ memberships, memberOpen, memberHistory, today, walkInToday, walkInOpen }) {
  if ([memberships, memberOpen, memberHistory, walkInToday, walkInOpen].some(item => item == null)) {
    return { active: null, expired: null, todayCheckIns: null, openVisits: null };
  }
  const statuses = countMembershipStatuses(memberships, today);
  const recentMemberVisitIds = new Set(
    [...memberOpen, ...memberHistory]
      .filter(visit => visitDay(visit.checkedInAt) === today)
      .map(visit => visit.visitId)
  );
  return {
    active: statuses.active,
    expired: statuses.expired,
    todayCheckIns: walkInToday + recentMemberVisitIds.size,
    openVisits: walkInOpen + memberOpen.length
  };
}
