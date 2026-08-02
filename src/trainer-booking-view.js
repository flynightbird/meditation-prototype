import {
  BOOKING_TIMES,
  createInitialBookingState,
  isTimeUnavailable,
  transitionBooking,
} from "./trainer-booking.js";

function fullDateLabel(dates, dateKey) {
  const date = dates.find(({ key }) => key === dateKey);
  return date ? `${date.weekday} ${date.day}日` : dateKey;
}

function weekdayLabel(dateKey) {
  return new Intl.DateTimeFormat("zh-CN", { weekday: "short" })
    .format(new Date(`${dateKey}T12:00:00`));
}

export function mountTrainerBooking({ app, bottomNav, sceneVideo, onShow, onHide }) {
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
  const sheetCancel = bookingDialog.querySelector(".booking-sheet-cancel");
  let state = createInitialBookingState();
  let visible = false;
  let submitting = false;
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
      ? `✓ 已预约 · ${weekdayLabel(confirmed.dateKey)} ${confirmed.time} · ${confirmed.coach}`
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
      ? `${weekdayLabel(state.selectedDateKey)} ${state.selectedTime}`
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
    dialogTime.textContent = `${fullDateLabel(state.dates, state.selectedDateKey)} ${state.selectedTime}`;
    sheetConfirm.textContent = "确认预约";
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
    sheetConfirm.textContent = "✓ 预约成功";
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
