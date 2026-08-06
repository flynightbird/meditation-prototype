import {
  BOOKING_TIMES,
  createInitialBookingState,
  isTimeUnavailable,
  transitionBooking,
} from "./trainer-booking.js";
import {
  formatBookingDate,
  formatWeekday,
  locale,
  t,
} from "./i18n.js";

const CONFIRMED_CHECK_ICON = '<svg class="booking-confirmed-check" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM11.0026 16L18.0737 8.92893L16.6595 7.51472L11.0026 13.1716L8.17421 10.3431L6.75999 11.7574L11.0026 16Z"></path></svg>';

export function loadDeferredTrainerImages(images) {
  let changed = false;
  for (const image of images) {
    const source = image.dataset.deferredSrc;
    if (!source || image.getAttribute("src") !== null) continue;
    image.setAttribute("src", source);
    changed = true;
  }
  return changed;
}

function weekdayLabel(date) {
  return date.isToday ? t("date.today") : formatWeekday(date.key, locale);
}

export function mountTrainerBooking({ app, bottomNav, sceneVideo, onShow, onHide }) {
  const trainerPage = document.querySelector("#trainerPage");
  const deferredTrainerImages = [...trainerPage.querySelectorAll("img[data-deferred-src]")];
  const trainerScroll = document.querySelector("#trainerScroll");
  const bookingDates = document.querySelector("#bookingDates");
  const bookingTimes = document.querySelector("#bookingTimes");
  const bookingStatus = document.querySelector("#bookingStatus");
  const actionBar = document.querySelector("#bookingActionBar");
  const actionTime = document.querySelector("#bookingActionTime");
  const bookingDialog = document.querySelector("#bookingDialog");
  const dialogTime = document.querySelector("#bookingDialogTime");
  const sheetConfirm = document.querySelector("#bookingSheetConfirm");
  const sheetCancel = bookingDialog.querySelector(".booking-sheet-cancel");
  let state = createInitialBookingState();
  let visible = false;
  let submitting = false;
  let successTimer = null;

  function renderDates() {
    bookingDates.replaceChildren(...state.dates.map((date) => {
      const confirmed = date.key === state.confirmedBooking?.dateKey;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "booking-date";
      button.dataset.action = "select-booking-date";
      button.dataset.dateKey = date.key;
      button.dataset.confirmed = String(confirmed);
      button.setAttribute("aria-pressed", String(date.key === state.selectedDateKey));
      const weekday = weekdayLabel(date);
      button.setAttribute(
        "aria-label",
        t("booking.dateAria", {
          weekday,
          day: date.day,
          status: confirmed ? t("booking.dateConfirmed") : "",
        }),
      );
      button.innerHTML = `<span>${weekday}</span><strong>${date.day}</strong>`;
      return button;
    }));
  }

  function renderTimes() {
    bookingTimes.replaceChildren(...BOOKING_TIMES.map((time) => {
      const unavailable = isTimeUnavailable(state, time);
      const confirmed =
        state.confirmedBooking?.dateKey === state.selectedDateKey &&
        state.confirmedBooking.time === time;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "booking-time";
      button.dataset.action = "select-booking-time";
      button.dataset.time = time;
      button.dataset.confirmed = String(confirmed);
      button.disabled = unavailable;
      button.textContent = time;
      if (confirmed) button.insertAdjacentHTML("beforeend", CONFIRMED_CHECK_ICON);
      button.setAttribute("aria-pressed", String(state.selectedTime === time));
      button.setAttribute(
        "aria-label",
        t(
          confirmed ? "booking.timeConfirmed" : unavailable ? "booking.timeUnavailable" : "booking.timeAvailable",
          { time },
        ),
      );
      return button;
    }));
  }

  function renderStatus() {
    const confirmed = state.confirmedBooking;
    bookingStatus.hidden = !confirmed;
    bookingStatus.textContent = confirmed
      ? t("booking.status", {
          date: formatBookingDate(confirmed.dateKey, locale),
          time: confirmed.time,
          coach: t(confirmed.coachKey),
        })
      : "";
    if (confirmed) bookingStatus.tabIndex = -1;
    else bookingStatus.removeAttribute("tabindex");
  }

  function renderActionBar() {
    const selected = visible && Boolean(state.selectedTime);
    app.classList.toggle("is-booking-action", selected);
    actionBar.classList.toggle("is-visible", selected);
    actionBar.setAttribute("aria-hidden", String(!selected));
    bottomNav.setAttribute("aria-hidden", String(selected));
    actionBar.inert = !selected;
    bottomNav.inert = selected;
    actionTime.textContent = selected
      ? `${formatBookingDate(state.selectedDateKey, locale)} ${state.selectedTime}`
      : "";
  }

  function render() {
    renderDates();
    renderTimes();
    renderStatus();
    renderActionBar();
  }

  function show() {
    if (visible) return;
    visible = true;
    loadDeferredTrainerImages(deferredTrainerImages);
    trainerPage.hidden = false;
    app.classList.add("is-trainer-view");
    onShow?.();
    trainerScroll.scrollTop = 0;
    render();
  }

  function hide() {
    if (!visible) return;
    visible = false;
    trainerPage.hidden = true;
    app.classList.remove("is-trainer-view", "is-booking-action");
    actionBar.classList.remove("is-visible");
    actionBar.setAttribute("aria-hidden", "true");
    actionBar.inert = true;
    bottomNav.setAttribute("aria-hidden", "false");
    bottomNav.inert = false;
    onHide?.();
  }

  function openDialog() {
    if (!state.selectedTime) return;
    submitting = false;
    dialogTime.textContent = `${formatBookingDate(state.selectedDateKey, locale)} ${state.selectedTime}`;
    sheetConfirm.textContent = t("booking.confirm");
    sheetConfirm.classList.remove("is-success");
    sheetConfirm.disabled = false;
    sheetCancel.disabled = false;
    bookingDialog.showModal();
  }

  trainerPage.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    if (button.dataset.action === "select-booking-date") {
      state = transitionBooking(state, {
        type: "SELECT_DATE",
        dateKey: button.dataset.dateKey,
      });
    }
    if (button.dataset.action === "select-booking-time") {
      state = transitionBooking(state, { type: "SELECT_TIME", time: button.dataset.time });
    }
    render();
  });

  actionBar.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    if (button.dataset.action === "cancel-booking-selection") {
      state = transitionBooking(state, { type: "CANCEL_SELECTION" });
      render();
    }
    if (button.dataset.action === "open-booking-dialog") openDialog();
  });

  sheetConfirm.addEventListener("click", () => {
    if (submitting) return;
    submitting = true;
    state = transitionBooking(state, { type: "CONFIRM_BOOKING" });
    sheetConfirm.textContent = t("booking.success");
    sheetConfirm.classList.add("is-success");
    sheetConfirm.disabled = true;
    sheetCancel.disabled = true;
    window.clearTimeout(successTimer);
    successTimer = window.setTimeout(() => {
      render();
      bookingDialog.close();
      bookingStatus.focus({ preventScroll: true });
      submitting = false;
    }, 1200);
  });

  bookingDialog.addEventListener("cancel", (event) => {
    if (submitting) event.preventDefault();
  });

  render();
  return { show, hide, isVisible: () => visible };
}
