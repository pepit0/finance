import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import {
  getBookingHoursLabel,
  getTimeSlotsForDate,
  isMountainToday,
  isSlotUnavailable,
} from "../bookingUtils";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function CalendarPicker({
  selectedDate,
  selectedTime,
  onDateChange,
  onTimeChange,
}: {
  selectedDate: Date | null;
  selectedTime: string;
  onDateChange: (d: Date) => void;
  onTimeChange: (t: string) => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [, refreshSlots] = useState(0);

  useEffect(() => {
    if (!selectedDate || !isMountainToday(selectedDate)) {
      return;
    }

    const id = window.setInterval(() => refreshSlots((n) => n + 1), 60_000);
    return () => window.clearInterval(id);
  }, [selectedDate]);

  useEffect(() => {
    if (selectedDate && selectedTime && isSlotUnavailable(selectedDate, selectedTime)) {
      onTimeChange("");
    }
  }, [selectedDate, selectedTime, onTimeChange]);

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) =>
    i < firstDay ? null : i - firstDay + 1
  );
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const isToday = (d: number) => {
    const t = new Date();
    return d === t.getDate() && viewMonth === t.getMonth() && viewYear === t.getFullYear();
  };
  const isPast = (d: number) => new Date(viewYear, viewMonth, d) < today;
  const isSelected = (d: number) =>
    selectedDate?.getDate() === d &&
    selectedDate?.getMonth() === viewMonth &&
    selectedDate?.getFullYear() === viewYear;
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          type="button"
        >
          <ChevronRight size={16} className="rotate-180" />
        </button>
        <span className="font-bold text-foreground text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button
          onClick={nextMonth}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          type="button"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-[10px] font-bold text-muted-foreground tracking-wide py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const past = isPast(d);
          const disabled = past;
          const selected = isSelected(d);
          const todayCell = isToday(d);
          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => {
                onDateChange(new Date(viewYear, viewMonth, d));
                onTimeChange("");
              }}
              className={`relative w-full aspect-square rounded-xl text-xs font-semibold transition-all duration-150 flex flex-col items-center justify-center
                ${selected
                  ? "bg-primary text-primary-foreground"
                  : disabled
                    ? "text-muted-foreground/30 cursor-not-allowed"
                    : todayCell
                      ? "bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30"
                      : "text-foreground hover:bg-secondary"
                }`}
              style={selected ? { boxShadow: "0 0 12px rgba(61,184,112,0.45)" } : undefined}
            >
              <span className={todayCell ? "leading-none -mt-1" : undefined}>{d}</span>
              {todayCell && (
                <span
                  className={`absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[8px] font-bold tracking-wide leading-none ${
                    selected ? "text-primary-foreground/80" : "text-primary"
                  }`}
                >
                  Today
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-primary/20 border border-primary/30 inline-block" />
          Today
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" />
          Selected
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-secondary/50 inline-block opacity-40" />
          Unavailable
        </span>
      </div>

      {selectedDate && (
        <div style={{ animation: "slideDown 0.25s cubic-bezier(.22,.68,0,1.2)" }}>
          <div className="pt-2 border-t border-border">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
              Available times{" "}
              <span className="text-primary normal-case tracking-normal font-semibold">
                {selectedDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </span>
              <span className="block normal-case tracking-normal font-medium text-muted-foreground/80 mt-1">
                {getBookingHoursLabel(selectedDate)} · Mountain Time · book at least 1 hour ahead
              </span>
            </p>
            <div className="grid grid-cols-3 gap-2">
              {getTimeSlotsForDate(selectedDate).map((slot) => {
                const unavailable = isSlotUnavailable(selectedDate, slot);
                const selected = selectedTime === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={unavailable}
                    onClick={() => {
                      if (!unavailable) onTimeChange(slot);
                    }}
                    className={`py-2 px-2 rounded-lg text-xs font-semibold border transition-all duration-150
                      ${selected
                        ? "bg-primary text-primary-foreground border-primary"
                        : unavailable
                          ? "border-border/50 text-muted-foreground/30 cursor-not-allowed opacity-50"
                          : "border-border text-foreground hover:border-primary/40 hover:bg-secondary"
                      }`}
                    style={selected ? { boxShadow: "0 0 10px rgba(61,184,112,0.35)" } : undefined}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
