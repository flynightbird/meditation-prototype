import {
  BOOKING_TIMES,
  createInitialBookingState,
  isTimeUnavailable,
  transitionBooking,
} from "./trainer-booking.js";

function dateLabel(dates, dateKey) {
  const date = dates.find(({ key }) => key === dateKey);
  return date ? `${date.weekday} ${date.day}日` : dateKey;
}

export function mountTrainerBooking({ app, bottomNav, sceneVideo }) {
  const trainerPage = document.querySelector("#trainerPage");
  const trainerScroll = document.querySelector("#trainerScroll");
  const bookingDates = document.querySelector("#bookingDates");
  const bookingTimes = document.querySelector("#bookingTimes");
  const bookingStatus = document.querySelector("#bookingStatus");
  const actionBar = document.querySelector("#bookingActionBar");
  const actionTime = document.querySelector("#bookingActionTime");
  const bookingDialog = document.querySelector("#bookingDialog");
  const dialogTime = document.querySelector("#bookingDialogTime");
  const sheetConfirm = document.querySelector("#bookingSheetConfirm");
  let state = createInitialBookingState();
  let visible = false;
  let successTimer = null;

  function renderDates() {
    bookingDates.replaceChildren(...state.dates.map((date) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "booking-date";
      button.dataset.action = "select-booking-date";
      button.dataset.dateKey = date.key;
      button.setAttribute("aria-pressed", String(date.key === state.selectedDateKey));
      button.innerHTML = `<span>${date.weekday}</span><strong>${date.day}</strong>`;
      return button;
    }));
  }

  function renderTimes() {
    bookingTimes.replaceChildren(...BOOKING_TIMES.map((time) => {
      const unavailable = isTimeUnavailable(state, time);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "booking-time";
      button.dataset.action = "select-booking-time";
      button.dataset.time = time;
      button.disabled = unavailable;
      button.textContent = time;
      button.setAttribute("aria-pressed", String(state.selectedTime === time));
      button.setAttribute("aria-label", unavailable ? `${time}，不可预约` : `${time}，可预约`);
      return button;
    }));
  }

  function renderStatus() {
    const confirmed = state.confirmedBooking;
    bookingStatus.hidden = !confirmed;
    bookingStatus.textContent = confirmed
      ? `✓ 已预约 · ${dateLabel(state.dates, confirmed.dateKey)} ${confirmed.time} · ${confirmed.coach}`
      : "";
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
      ? `${dateLabel(state.dates, state.selectedDateKey)} ${state.selectedTime}`
      : "";
  }

  function render() {
    renderDates();
    renderTimes();
    renderStatus();
    renderActionBar();
  }

  function show() {
    visible = true;
    trainerPage.hidden = false;
    app.classList.add("is-trainer-view");
    sceneVideo.pause();
    trainerScroll.scrollTop = 0;
    render();
  }

  function hide() {
    visible = false;
    trainerPage.hidden = true;
    app.classList.remove("is-trainer-view", "is-booking-action");
    actionBar.classList.remove("is-visible");
    actionBar.setAttribute("aria-hidden", "true");
    actionBar.inert = true;
    bottomNav.setAttribute("aria-hidden", "false");
    bottomNav.inert = false;
  }

  function openDialog() {
    if (!state.selectedTime) return;
    dialogTime.textContent = `${dateLabel(state.dates, state.selectedDateKey)} ${state.selectedTime}`;
    sheetConfirm.textContent = "确认预约";
    sheetConfirm.classList.remove("is-success");
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
    state = transitionBooking(state, { type: "CONFIRM_BOOKING" });
    sheetConfirm.textContent = "✓ 预约成功";
    sheetConfirm.classList.add("is-success");
    window.clearTimeout(successTimer);
    successTimer = window.setTimeout(() => {
      bookingDialog.close();
      render();
    }, 1200);
  });

  render();
  return { show, hide };
}
