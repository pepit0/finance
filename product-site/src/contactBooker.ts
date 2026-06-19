import { el } from "./dom";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

const TIME_SLOTS = [
  "9:00 AM",
  "9:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "1:00 PM",
  "1:30 PM",
  "2:00 PM",
  "2:30 PM",
  "3:00 PM",
  "3:30 PM",
  "4:00 PM"
] as const;

type CalendarDay = {
  date: number;
  inMonth: boolean;
  isPast: boolean;
  isToday: boolean;
  iso: string;
};

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function buildMonthDays(viewDate: Date): { monthLabel: string; days: CalendarDay[] } {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthLabel = viewDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days: CalendarDay[] = [];

  for (let i = 0; i < firstWeekday; i++) {
    days.push({ date: 0, inMonth: false, isPast: true, isToday: false, iso: "" });
  }

  for (let date = 1; date <= daysInMonth; date++) {
    const cell = new Date(year, month, date);
    cell.setHours(0, 0, 0, 0);
    days.push({
      date,
      inMonth: true,
      isPast: cell < today,
      isToday: cell.getTime() === today.getTime(),
      iso: `${year}-${pad2(month + 1)}-${pad2(date)}`
    });
  }

  while (days.length % 7 !== 0) {
    days.push({ date: 0, inMonth: false, isPast: true, isToday: false, iso: "" });
  }

  return { monthLabel, days };
}

function defaultSelectableIso(days: CalendarDay[]): string {
  const pick = days.find((d) => d.inMonth && !d.isPast);
  return pick?.iso ?? "";
}

function setSelectedDay(root: HTMLElement, iso: string): void {
  root.dataset.selectedDay = iso;
  const buttons = root.querySelectorAll<HTMLButtonElement>("[data-booker-day]");
  for (const btn of buttons) {
    const selected = btn.dataset.bookerDay === iso;
    btn.classList.toggle("bookerDay--selected", selected);
    btn.setAttribute("aria-pressed", selected ? "true" : "false");
  }
  const summary = root.querySelector<HTMLElement>("[data-booker-date-summary]");
  if (summary && iso) {
    const [y, m, d] = iso.split("-").map(Number);
    const label = new Date(y, m - 1, d).toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric"
    });
    summary.textContent = label;
  }
}

function setSelectedSlot(root: HTMLElement, slot: string): void {
  root.dataset.selectedSlot = slot;
  const buttons = root.querySelectorAll<HTMLButtonElement>("[data-booker-slot]");
  for (const btn of buttons) {
    const selected = btn.dataset.bookerSlot === slot;
    btn.classList.toggle("bookerSlot--selected", selected);
    btn.setAttribute("aria-pressed", selected ? "true" : "false");
  }
}

function initContactBooker(root: HTMLElement): void {
  const form = root.querySelector<HTMLFormElement>(".bookerForm");
  const notice = root.querySelector<HTMLElement>("[data-booker-notice]");
  const defaultDay = root.dataset.selectedDay ?? "";
  const defaultSlot = TIME_SLOTS[2];

  if (defaultDay) {
    setSelectedDay(root, defaultDay);
  }
  setSelectedSlot(root, defaultSlot);

  root.querySelectorAll<HTMLButtonElement>("[data-booker-day]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const iso = btn.dataset.bookerDay;
      if (iso) setSelectedDay(root, iso);
    });
  });

  root.querySelectorAll<HTMLButtonElement>("[data-booker-slot]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const slot = btn.dataset.bookerSlot;
      if (slot) setSelectedSlot(root, slot);
    });
  });

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (notice) {
      notice.hidden = false;
      notice.textContent =
        "Online booking is coming soon. Pick a time above for reference — then call or email us to schedule.";
    }
  });
}

export function renderContactBooker(): HTMLElement {
  const viewDate = new Date();
  const { monthLabel, days } = buildMonthDays(viewDate);
  const selectedIso = defaultSelectableIso(days);

  const root = el("div", {
    class: "contactBooker",
    "data-selected-day": selectedIso
  });

  const weekdayRow = el("div", { class: "bookerWeekdays", "aria-hidden": "true" });
  for (const label of WEEKDAYS) {
    weekdayRow.append(el("span", { class: "bookerWeekday" }, [label]));
  }

  const dayGrid = el("div", { class: "bookerDayGrid", role: "group", "aria-label": "Choose a date" });
  for (const day of days) {
    if (!day.inMonth) {
      dayGrid.append(el("span", { class: "bookerDay bookerDay--empty", "aria-hidden": "true" }));
      continue;
    }

    const classes = ["bookerDay"];
    if (day.isPast) classes.push("bookerDay--past");
    if (day.isToday) classes.push("bookerDay--today");

    const btn = el("button", {
      type: "button",
      class: classes.join(" "),
      "data-booker-day": day.iso,
      "aria-pressed": "false",
      ...(day.isPast ? { disabled: "true" } : {})
    }, [String(day.date)]);

    dayGrid.append(btn);
  }

  const slotGrid = el("div", { class: "bookerSlotGrid", role: "group", "aria-label": "Choose a time" });
  for (const slot of TIME_SLOTS) {
    slotGrid.append(
      el("button", {
        type: "button",
        class: "bookerSlot",
        "data-booker-slot": slot,
        "aria-pressed": "false"
      }, [slot])
    );
  }

  const form = el("form", { class: "bookerForm" }, [
    el("div", { class: "bookerFieldRow" }, [
      el("label", { class: "bookerField" }, [
        el("span", { class: "bookerLabel" }, ["Name"]),
        el("input", {
          type: "text",
          name: "name",
          class: "bookerInput",
          placeholder: "Your name",
          autocomplete: "name"
        })
      ]),
      el("label", { class: "bookerField" }, [
        el("span", { class: "bookerLabel" }, ["Email"]),
        el("input", {
          type: "email",
          name: "email",
          class: "bookerInput",
          placeholder: "you@dealership.com",
          autocomplete: "email"
        })
      ])
    ]),
    el("label", { class: "bookerField" }, [
      el("span", { class: "bookerLabel" }, ["Dealership"]),
      el("input", {
        type: "text",
        name: "dealership",
        class: "bookerInput",
        placeholder: "Store name"
      })
    ]),
    el("label", { class: "bookerField" }, [
      el("span", { class: "bookerLabel" }, ["Notes (optional)"]),
      el("textarea", {
        name: "notes",
        class: "bookerTextarea",
        rows: "2",
        placeholder: "What would you like to see on the walkthrough?"
      })
    ]),
    el("p", { class: "bookerNotice", "data-booker-notice": "true", hidden: "true" }),
    el("button", { type: "submit", class: "btn btnPrimary btnLarge bookerSubmit" }, [
      "Request appointment"
    ])
  ]);

  root.append(
    el("div", { class: "bookerPanel" }, [
      el("div", { class: "bookerPanelHead" }, [
        el("h2", { class: "bookerTitle" }, ["Book a walkthrough"]),
        el("p", { class: "bookerSubtitle" }, [
          "Free video call & screen share consultation."
        ])
      ]),
      el("div", { class: "bookerCalendarBlock" }, [
        el("div", { class: "bookerMonthBar" }, [
          el("span", { class: "bookerMonthLabel" }, [monthLabel])
        ]),
        weekdayRow,
        dayGrid,
        el("p", { class: "bookerSelectedDate" }, [
          el("span", { class: "bookerSelectedDateLabel" }, ["Selected"]),
          el("strong", { "data-booker-date-summary": "true" }, [""])
        ])
      ]),
      el("div", { class: "bookerTimesBlock" }, [
        el("h3", { class: "bookerBlockTitle" }, ["Available times"]),
        slotGrid
      ]),
      form
    ])
  );

  initContactBooker(root);
  return root;
}
