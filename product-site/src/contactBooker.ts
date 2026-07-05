import {
  BOOKING_TIMEZONE,
  buildMountainIsoDate,
  firstAvailableSlotForIso,
  getTimeSlotsForIso,
  isSlotUnavailableForIso,
  mountainMonthParts,
  mountainTodayIso,
} from "./feath/bookingUtils";
import { appendProseWithDots, el } from "./dom";
import { formspreeEndpoint, siteConfig } from "./site.config";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

type CalendarDay = {
  date: number;
  inMonth: boolean;
  isPast: boolean;
  isToday: boolean;
  iso: string;
};

function buildMonthDays(): { monthLabel: string; days: CalendarDay[] } {
  const { year, month } = mountainMonthParts();
  const monthIndex = month - 1;
  const monthLabel = new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
    timeZone: BOOKING_TIMEZONE,
  }).format(new Date());

  const firstWeekday = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const todayIso = mountainTodayIso();

  const days: CalendarDay[] = [];

  for (let i = 0; i < firstWeekday; i++) {
    days.push({ date: 0, inMonth: false, isPast: true, isToday: false, iso: "" });
  }

  for (let date = 1; date <= daysInMonth; date++) {
    const iso = buildMountainIsoDate(year, month, date);
    days.push({
      date,
      inMonth: true,
      isPast: iso < todayIso,
      isToday: iso === todayIso,
      iso,
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

function rebuildSlotGrid(root: HTMLElement, iso: string): void {
  const slotGrid = root.querySelector<HTMLElement>(".bookerSlotGrid");
  if (!slotGrid) {
    return;
  }

  slotGrid.replaceChildren();
  for (const slot of getTimeSlotsForIso(iso)) {
    const unavailable = isSlotUnavailableForIso(iso, slot);
    const classes = ["bookerSlot"];
    if (unavailable) {
      classes.push("bookerSlot--past");
    }

    slotGrid.append(
      el("button", {
        type: "button",
        class: classes.join(" "),
        "data-booker-slot": slot,
        "aria-pressed": "false",
        ...(unavailable ? { disabled: "true" } : {}),
      }, [slot]),
    );
  }
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
      day: "numeric",
    });
    summary.textContent = label;
  }
  rebuildSlotGrid(root, iso);
  refreshSlotStates(root);
}

function refreshSlotStates(root: HTMLElement): void {
  const iso = root.dataset.selectedDay ?? "";
  const buttons = root.querySelectorAll<HTMLButtonElement>("[data-booker-slot]");
  const selectedSlot = root.dataset.selectedSlot ?? "";
  let selectedIsUnavailable = false;

  for (const btn of buttons) {
    const slot = btn.dataset.bookerSlot ?? "";
    const unavailable = iso ? isSlotUnavailableForIso(iso, slot) : false;
    btn.classList.toggle("bookerSlot--past", unavailable);
    btn.disabled = unavailable;
    if (slot === selectedSlot && unavailable) {
      selectedIsUnavailable = true;
    }
  }

  if (!selectedSlot || selectedIsUnavailable) {
    const next = iso ? firstAvailableSlotForIso(iso) : null;
    if (next) {
      setSelectedSlot(root, next);
    } else {
      root.dataset.selectedSlot = "";
      for (const btn of buttons) {
        btn.classList.remove("bookerSlot--selected");
        btn.setAttribute("aria-pressed", "false");
      }
    }
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

function formatSelectedDay(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function showBookerNotice(notice: HTMLElement, message: string, tone: "success" | "error" | "info"): void {
  notice.hidden = false;
  notice.classList.remove("bookerNotice--success", "bookerNotice--error", "bookerNotice--info");
  notice.classList.add(`bookerNotice--${tone}`);
  notice.replaceChildren();
  appendProseWithDots(notice, message);
}

function initContactBooker(root: HTMLElement): void {
  const form = root.querySelector<HTMLFormElement>(".bookerForm");
  const notice = root.querySelector<HTMLElement>("[data-booker-notice]");
  const submitBtn = root.querySelector<HTMLButtonElement>(".bookerSubmit");
  const endpoint = formspreeEndpoint();
  const defaultDay = root.dataset.selectedDay ?? "";

  if (defaultDay) {
    setSelectedDay(root, defaultDay);
  }

  root.querySelectorAll<HTMLButtonElement>("[data-booker-day]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const iso = btn.dataset.bookerDay;
      if (iso && !btn.disabled) setSelectedDay(root, iso);
    });
  });

  root.querySelector<HTMLElement>(".bookerSlotGrid")?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement) || !target.dataset.bookerSlot) {
      return;
    }
    const slot = target.dataset.bookerSlot;
    if (slot && !target.disabled) setSelectedSlot(root, slot);
  });

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!notice || !form) {
      return;
    }

    if (!endpoint) {
      showBookerNotice(
        notice,
        "Online booking is not configured yet. Pick a time above for reference · then call or email us to schedule.",
        "info",
      );
      return;
    }

    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const company = String(data.get("company") ?? "").trim();
    const notes = String(data.get("notes") ?? "").trim();
    const preferredDate = root.dataset.selectedDay ?? "";
    const preferredTime = root.dataset.selectedSlot ?? "";

    if (!name || !email) {
      showBookerNotice(notice, "Please enter your name and email.", "error");
      return;
    }

    if (!preferredDate || !preferredTime) {
      showBookerNotice(notice, "Please choose a date and time.", "error");
      return;
    }

    if (isSlotUnavailableForIso(preferredDate, preferredTime)) {
      showBookerNotice(notice, "That time isn't available. Please choose a slot at least one hour from now.", "error");
      refreshSlotStates(root);
      return;
    }

    const preferredDateLabel = formatSelectedDay(preferredDate);
    const defaultLabel = submitBtn?.textContent ?? "Request consultation";

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending…";
    }

    void fetch(endpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        company,
        notes,
        preferred_date: preferredDateLabel,
        preferred_time: preferredTime,
        _replyto: email,
        _subject: `Feath consultation request · ${preferredDateLabel} ${preferredTime}`,
      }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(payload?.error ?? "Could not send your request.");
        }
        form.reset();
        if (defaultDay) {
          setSelectedDay(root, defaultDay);
        } else {
          refreshSlotStates(root);
        }
        showBookerNotice(
          notice,
          "Request sent! We'll confirm your consultation by email · usually within one business day.",
          "success",
        );
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Could not send your request.";
        showBookerNotice(
          notice,
          `${message} You can also call ${siteConfig.contactPhone} or email ${siteConfig.contactEmail}.`,
          "error",
        );
      })
      .finally(() => {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = defaultLabel;
        }
      });
  });
}

export function renderContactBooker(): HTMLElement {
  const { monthLabel, days } = buildMonthDays();
  const selectedIso = defaultSelectableIso(days);

  const root = el("div", {
    class: "contactBooker",
    "data-selected-day": selectedIso,
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
      ...(day.isPast ? { disabled: "true" } : {}),
    }, [String(day.date)]);

    dayGrid.append(btn);
  }

  const slotGrid = el("div", { class: "bookerSlotGrid", role: "group", "aria-label": "Choose a time" });

  const form = el("form", { class: "bookerForm" }, [
    el("div", { class: "bookerFieldRow" }, [
      el("label", { class: "bookerField" }, [
        el("span", { class: "bookerLabel" }, ["Name"]),
        el("input", {
          type: "text",
          name: "name",
          class: "bookerInput",
          placeholder: "Your name",
          autocomplete: "name",
          required: "true",
        }),
      ]),
      el("label", { class: "bookerField" }, [
        el("span", { class: "bookerLabel" }, ["Email"]),
        el("input", {
          type: "email",
          name: "email",
          class: "bookerInput",
          placeholder: "you@company.com",
          autocomplete: "email",
          required: "true",
        }),
      ]),
    ]),
    el("label", { class: "bookerField" }, [
      el("span", { class: "bookerLabel" }, ["Company"]),
      el("input", {
        type: "text",
        name: "company",
        class: "bookerInput",
        placeholder: "Your company",
      }),
    ]),
    el("label", { class: "bookerField" }, [
      el("span", { class: "bookerLabel" }, ["Notes (optional)"]),
      el("textarea", {
        name: "notes",
        class: "bookerTextarea",
        rows: "2",
        placeholder: "What would you like to discuss?",
      }),
    ]),
    el("p", { class: "bookerNotice", "data-booker-notice": "true", hidden: "true" }),
    el("button", { type: "submit", class: "btn btnPrimary btnLarge bookerSubmit" }, [
      "Request consultation",
    ]),
  ]);

  root.append(
    el("div", { class: "bookerPanel" }, [
      el("div", { class: "bookerPanelHead" }, [
        el("h2", { class: "bookerTitle" }, ["Book a consultation"]),
        el("p", { class: "bookerSubtitle" }, [
          "Free video call · websites, CRM, or custom solutions.",
        ]),
      ]),
      el("div", { class: "bookerCalendarBlock" }, [
        el("div", { class: "bookerMonthBar" }, [
          el("span", { class: "bookerMonthLabel" }, [monthLabel]),
        ]),
        weekdayRow,
        dayGrid,
        el("p", { class: "bookerSelectedDate" }, [
          el("span", { class: "bookerSelectedDateLabel" }, ["Selected"]),
          el("strong", { "data-booker-date-summary": "true" }, [""]),
        ]),
      ]),
      el("div", { class: "bookerTimesBlock" }, [
        el("h3", { class: "bookerBlockTitle" }, ["Available times (Mountain Time)"]),
        slotGrid,
      ]),
      form,
    ]),
  );

  initContactBooker(root);
  return root;
}
