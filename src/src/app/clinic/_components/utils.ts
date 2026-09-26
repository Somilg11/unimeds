// Small helpers private to the clinic portal

/** Milliseconds that `timeZone` is ahead of UTC at instant `ts`. */
function zoneOffset(ts: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(ts));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return asUtc - Math.floor(ts / 1000) * 1000;
}

/** ISO instant for 00:00 of a clinic-local calendar date (YYYY-MM-DD), plus `addDays`. */
export function zonedDayStartIso(date: string, timeZone: string, addDays = 0) {
  const [y, m, d] = date.split('-').map(Number);
  const guess = Date.UTC(y!, m! - 1, d! + addDays);
  let ts = guess - zoneOffset(guess, timeZone);
  // Re-evaluate once in case the guess straddled a DST change
  ts = guess - zoneOffset(ts, timeZone);
  return new Date(ts).toISOString();
}

const ACTION_LABEL: Record<string, string> = {
  APPOINTMENT_BOOKED: 'Booked an appointment',
  APPOINTMENT_CANCELLED: 'Cancelled an appointment',
  APPOINTMENT_COMPLETED: 'Completed an appointment',
  APPOINTMENT_CONFIRMED: 'Confirmed an appointment',
  APPOINTMENT_NOTES_UPDATED: 'Updated clinical notes',
  APPOINTMENT_NO_SHOW: 'Marked a no-show',
  APPOINTMENT_RESCHEDULED_BY_PATIENT: 'Rescheduled an appointment',
  APPOINTMENT_RESCHEDULE_PROPOSED: 'Proposed a new time',
  APPOINTMENT_RESCHEDULE_ACCEPTED: 'Accepted a new time',
  APPOINTMENT_RESCHEDULE_DECLINED: 'Declined a new time',
  AVAILABILITY_UPDATED: 'Updated a doctor’s schedule',
  CLINIC_CREATED: 'Created the clinic',
  CLINIC_UPDATED: 'Updated the clinic',
  CLINIC_SETTINGS_UPDATED: 'Updated clinic settings',
  CLINIC_SUSPENDED: 'Suspended the clinic',
  CLINIC_REACTIVATED: 'Reactivated the clinic',
  INVITE_SENT: 'Sent an invite',
  INVITE_ACCEPTED: 'Accepted an invite',
  INVITE_REVOKED: 'Revoked an invite',
  MEMBER_ACTIVATED: 'Restored a team member’s access',
  MEMBER_DEACTIVATED: 'Paused a team member’s access',
  MEMBER_REMOVED: 'Removed a team member',
  PATIENT_CREATED_BY_CLINIC: 'Registered a patient',
  PATIENT_CHART_VIEWED: 'Viewed a patient chart',
  RECORD_UPLOADED: 'Uploaded a record',
  RECORD_UPDATED: 'Updated a record',
  RECORD_DELETED: 'Deleted a record',
  RECORD_VIEWED: 'Viewed a record',
};

export function humanizeAction(action: string) {
  if (ACTION_LABEL[action]) return ACTION_LABEL[action];
  const s = action.toLowerCase().replace(/_/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
