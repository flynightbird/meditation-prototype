export const BOOKING_TIMES = [
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
];

const DEFAULT_UNAVAILABLE_TIMES = new Set(["10:30", "14:00"]);
const WEEKDAY_FORMATTER = new Intl.DateTimeFormat("zh-CN", { weekday: "short" });
const COACH = "李教练";
const STORE = "中田健身 · 南山旗舰店";

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function createBookingDates(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
    return {
      key: dateKey(date),
      day: date.getDate(),
      weekday: index === 0 ? "今天" : WEEKDAY_FORMATTER.format(date),
      isToday: index === 0,
    };
  });
}

export function createInitialBookingState(now = new Date()) {
  const dates = createBookingDates(now);
  return {
    dates,
    selectedDateKey: dates[0].key,
    selectedTime: null,
    confirmedBooking: null,
  };
}

export function isTimeUnavailable(state, time) {
  return (
    DEFAULT_UNAVAILABLE_TIMES.has(time) ||
    (state.confirmedBooking?.dateKey === state.selectedDateKey &&
      state.confirmedBooking.time === time)
  );
}

function isValidDate(state, dateKeyValue) {
  return state.dates.some((date) => date.key === dateKeyValue);
}

export function transitionBooking(state, event) {
  switch (event?.type) {
    case "SELECT_DATE":
      return isValidDate(state, event.dateKey)
        ? { ...state, selectedDateKey: event.dateKey, selectedTime: null }
        : state;
    case "SELECT_TIME":
      return BOOKING_TIMES.includes(event.time) && !isTimeUnavailable(state, event.time)
        ? { ...state, selectedTime: event.time }
        : state;
    case "CANCEL_SELECTION":
      return state.selectedTime === null ? state : { ...state, selectedTime: null };
    case "CONFIRM_BOOKING": {
      if (state.selectedTime === null) return state;

      return {
        ...state,
        selectedTime: null,
        confirmedBooking: {
          dateKey: state.selectedDateKey,
          time: state.selectedTime,
          coach: COACH,
          store: STORE,
        },
      };
    }
    default:
      return state;
  }
}
