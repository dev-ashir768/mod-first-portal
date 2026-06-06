"use client";

import React, { useState } from "react";
import {
  format,
  subDays,
  startOfWeek,
  endOfWeek,
  subWeeks,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
  subYears,
  startOfDay,
  endOfDay
} from "date-fns";
import { DateRange } from "react-day-picker";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DateRangePickerProps {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  className?: string;
}

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const shortcuts = [
    {
      label: "Today",
      getValue: () => ({
        from: startOfDay(new Date()),
        to: endOfDay(new Date())
      })
    },
    {
      label: "Yesterday",
      getValue: () => ({
        from: startOfDay(subDays(new Date(), 1)),
        to: endOfDay(subDays(new Date(), 1))
      })
    },
    {
      label: "This Week",
      getValue: () => ({
        from: startOfWeek(new Date(), { weekStartsOn: 1 }),
        to: endOfWeek(new Date(), { weekStartsOn: 1 })
      })
    },
    {
      label: "Last Week",
      getValue: () => ({
        from: startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }),
        to: endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 })
      })
    },
    {
      label: "This Month",
      getValue: () => ({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date())
      })
    },
    {
      label: "Last Month",
      getValue: () => ({
        from: startOfMonth(subMonths(new Date(), 1)),
        to: endOfMonth(subMonths(new Date(), 1))
      })
    },
    {
      label: "This Year",
      getValue: () => ({
        from: startOfYear(new Date()),
        to: endOfYear(new Date())
      })
    },
    {
      label: "Last Year",
      getValue: () => ({
        from: startOfYear(subYears(new Date(), 1)),
        to: endOfYear(subYears(new Date(), 1))
      })
    }
  ];

  const handleShortcutClick = (getValue: () => { from: Date; to: Date }) => {
    const range = getValue();
    onChange(range);
    setIsOpen(false);
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger
          id="date"
          className={cn(
            "flex items-center h-10 w-full justify-start text-left font-semibold rounded-xl bg-card/45 backdrop-blur-sm border border-border/50 hover:bg-muted/30 hover:text-foreground transition-all select-none px-4 text-sm cursor-pointer",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2.5 h-4.5 w-4.5 text-muted-foreground shrink-0" />
          {value?.from ? (
            value.to ? (
              <span className="truncate">
                {format(value.from, "LLL dd, yyyy")} - {format(value.to, "LLL dd, yyyy")}
              </span>
            ) : (
              <span>{format(value.from, "LLL dd, yyyy")}</span>
            )
          ) : (
            <span>Pick a date range</span>
          )}
          <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground shrink-0" />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 flex flex-col md:flex-row rounded-2xl overflow-hidden border-border/50 shadow-2xl" align="end">
          {/* Shortcuts Panel */}
          <div className="flex flex-row md:flex-col gap-1 p-3 bg-muted/30 border-b md:border-b-0 md:border-r border-border/30 overflow-x-auto md:overflow-x-visible md:w-44 shrink-0">
            {shortcuts.map((shortcut) => (
              <button
                key={shortcut.label}
                onClick={() => handleShortcutClick(shortcut.getValue)}
                className="text-left text-xs font-semibold px-3 py-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0 whitespace-nowrap"
              >
                {shortcut.label}
              </button>
            ))}
          </div>

          {/* Calendar Picker Panel */}
          <div className="p-1">
            <Calendar
              mode="range"
              defaultMonth={value?.from}
              selected={value}
              onSelect={onChange}
              numberOfMonths={2}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
