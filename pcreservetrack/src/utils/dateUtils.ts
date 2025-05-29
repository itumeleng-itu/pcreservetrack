
import { isWithinInterval } from "date-fns";

// Public holidays for illustration - in a real app, this would come from an API or database
const PUBLIC_HOLIDAYS_2024 = [
  { name: "New Year's Day", date: new Date(2024, 0, 1) }, // Jan 1
  { name: "Human Rights Day", date: new Date(2024, 2, 21) }, // March 21
  { name: "Good Friday", date: new Date(2024, 2, 29) }, // March 29
  { name: "Easter Monday", date: new Date(2024, 3, 1) }, // April 1
  { name: "Freedom Day", date: new Date(2024, 3, 27) }, // April 27
  { name: "Workers' Day", date: new Date(2024, 4, 1) }, // May 1
  { name: "Youth Day", date: new Date(2024, 5, 16) }, // June 16
  { name: "National Women's Day", date: new Date(2024, 7, 9) }, // August 9
  { name: "Heritage Day", date: new Date(2024, 8, 24) }, // September 24
  { name: "Day of Reconciliation", date: new Date(2024, 11, 16) }, // December 16
  { name: "Christmas Day", date: new Date(2024, 11, 25) }, // December 25
  { name: "Day of Goodwill", date: new Date(2024, 11, 26) }, // December 26
];

export const isPublicHoliday = (date: Date): { isHoliday: boolean; holidayName?: string } => {
  const holiday = PUBLIC_HOLIDAYS_2024.find(
    (holiday) => holiday.date.toDateString() === date.toDateString()
  );
  
  return {
    isHoliday: !!holiday,
    holidayName: holiday?.name
  };
};

export const getPublicHolidayMessage = (date: Date): string | null => {
  const { isHoliday, holidayName } = isPublicHoliday(date);
  return isHoliday ? `Booking not available - ${holidayName}` : null;
};
