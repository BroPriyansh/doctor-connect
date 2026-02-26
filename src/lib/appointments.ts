export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export const DAYS_OF_WEEK: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export interface TimeSlot {
  time: string; // "09:00", "09:30", etc.
  isBooked: boolean;
  patientName?: string;
  patientPhone?: string;
}

export interface DayAvailability {
  day: DayOfWeek;
  enabled: boolean;
  startTime: string;
  endTime: string;
  slotDuration: number; // in minutes
}

export type AppointmentStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface Appointment {
  id: string;
  day: DayOfWeek;
  date: string;
  time: string;
  patientName: string;
  patientPhone: string;
  status: AppointmentStatus;
}

export function generateTimeSlots(start: string, end: string, duration: number): string[] {
  const slots: string[] = [];
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  let current = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  while (current < endMinutes) {
    const h = Math.floor(current / 60);
    const m = current % 60;
    slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    current += duration;
  }
  return slots;
}

export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export function getTodayDayOfWeek(): DayOfWeek {
  const days: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date().getDay()];
}

export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function getDateForDay(day: DayOfWeek): string {
  const dayIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(day);
  const today = new Date();
  const todayIndex = today.getDay();
  let diff = dayIndex - todayIndex;
  if (diff < 0) diff += 7;
  const target = new Date(today);
  target.setDate(today.getDate() + diff);
  return target.toISOString().split('T')[0];
}

const STORAGE_KEYS = {
  availability: 'doc_availability',
  appointments: 'doc_appointments',
  isOnline: 'doc_is_online',
};

export function getDefaultAvailability(): DayAvailability[] {
  return DAYS_OF_WEEK.map(day => ({
    day,
    enabled: !['Saturday', 'Sunday'].includes(day),
    startTime: '09:00',
    endTime: '17:00',
    slotDuration: 30,
  }));
}

export function loadAvailability(): DayAvailability[] {
  const stored = localStorage.getItem(STORAGE_KEYS.availability);
  return stored ? JSON.parse(stored) : getDefaultAvailability();
}

export function saveAvailability(data: DayAvailability[]) {
  localStorage.setItem(STORAGE_KEYS.availability, JSON.stringify(data));
}

export function loadAppointments(): Appointment[] {
  const stored = localStorage.getItem(STORAGE_KEYS.appointments);
  return stored ? JSON.parse(stored) : [];
}

export function saveAppointments(data: Appointment[]) {
  localStorage.setItem(STORAGE_KEYS.appointments, JSON.stringify(data));
}

export function loadOnlineStatus(): boolean {
  return localStorage.getItem(STORAGE_KEYS.isOnline) === 'true';
}

export function saveOnlineStatus(status: boolean) {
  localStorage.setItem(STORAGE_KEYS.isOnline, String(status));
}

export function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');

  // Basic validation: if it's 10 digits, format as Indian style
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  } else if (cleaned.length > 10 && cleaned.startsWith('91')) {
    // If it starts with 91 and has 12 digits (91 + 10 digits)
    const sub = cleaned.slice(2);
    if (sub.length === 10) {
      return `+91 ${sub.slice(0, 5)} ${sub.slice(5)}`;
    }
  }

  // Return original if no standard format matches (or cleaned)
  return phone;
}

export function canCancel(appointmentDate: string, appointmentTime: string): { allowed: boolean; message?: string } {
  const [year, month, day] = appointmentDate.split('-').map(Number);
  const [hour, minute] = appointmentTime.split(':').map(Number);

  const aptDate = new Date(year, month - 1, day, hour, minute);
  const now = new Date();

  const diffMs = aptDate.getTime() - now.getTime();
  const diffHrs = diffMs / (1000 * 60 * 60);

  if (diffHrs >= 3) {
    return { allowed: true };
  } else if (diffHrs < 0) {
    return { allowed: false, message: "This appointment has already passed." };
  } else {
    return { allowed: false, message: "Cancellation period (3 hours before) has passed. Please contact the clinic to cancel." };
  }
}

export function isPastTime(date: string, time: string): boolean {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const aptTime = new Date(year, month - 1, day, hour, minute);
  return aptTime < new Date();
}
