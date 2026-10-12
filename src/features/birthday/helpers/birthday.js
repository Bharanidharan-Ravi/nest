// birthday.js
//
// Pure helpers for "whose birthday is today", kept free of React so they can
// be unit tested.

import { ROLES } from "../../../core/auth/permissions";

// Month (1-12) and day of a DoB. Read straight from the string where possible:
// going through Date would shift "1995-10-07T00:00:00Z" to the 6th in
// timezones west of UTC.
export function birthMonthDay(dob) {
  if (!dob) return null;
  const text = String(dob).trim();

  let match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/); // YYYY-MM-DD...
  if (match) return { month: Number(match[2]), day: Number(match[3]) };

  match = text.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/); // DD-MM-YYYY
  if (match) return { month: Number(match[2]), day: Number(match[1]) };

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return null;
  return { month: date.getMonth() + 1, day: date.getDate() };
}

const isLeapYear = (year) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

export function isBirthdayOn(dob, now = new Date()) {
  const md = birthMonthDay(dob);
  if (!md) return false;
  const month = now.getMonth() + 1;
  const day = now.getDate();
  if (md.month === month && md.day === day) return true;
  // 29 Feb birthdays are celebrated on 28 Feb in non-leap years
  return md.month === 2 && md.day === 29 && month === 2 && day === 28 && !isLeapYear(now.getFullYear());
}

// Only Admins and Employees (incl. Ticket Admins, whose roles carry 2) take
// part — a Client login (3) never sees or appears in birthday wishes.
export const isStaffRole = (role) => {
  const r = Number(role);
  return r === ROLES.ADMIN || r === ROLES.MANAGER || r === ROLES.TICKET_ADMIN;
};

// Active staff from the employee master whose birthday is today
export function birthdaysOn(employees, now = new Date()) {
  if (!Array.isArray(employees)) return [];
  return employees.filter(
    (e) => e?.isActive && (e.Role == null || isStaffRole(e.Role)) && isBirthdayOn(e.DoB, now)
  );
}

export const firstName = (name) => String(name || "").trim().split(/\s+/)[0] || "";
