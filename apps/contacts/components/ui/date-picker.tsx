"use client";

import { cn } from "@helvety/shared/utils";
import { format, isValid, parse } from "date-fns";
import { de } from "date-fns/locale";
import { CalendarIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/**
 * DatePicker - A date-only picker using shadcn Calendar + Popover.
 * Stores and returns ISO date strings (e.g. "2000-01-15").
 */
interface DatePickerProps {
  /** ISO date string (e.g. "2000-01-15") or null */
  value: string | null;
  /** Called with ISO date string or null when cleared */
  onChange: (value: string | null) => void;
  /** Placeholder text when no date is selected */
  placeholder?: string;
  /** Whether the picker is disabled */
  disabled?: boolean;
}

/** Date-only picker backed by shadcn Calendar + Popover. */
export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled,
}: DatePickerProps) {
  // Parse the ISO date string into a Date object for the calendar
  const selectedDate = value
    ? parse(value, "yyyy-MM-dd", new Date())
    : undefined;

  const handleSelect = (date: Date | undefined) => {
    if (date && isValid(date)) {
      // Format as ISO date string (yyyy-MM-dd)
      onChange(format(date, "yyyy-MM-dd"));
    } else {
      onChange(null);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 size-4" />
          {selectedDate && isValid(selectedDate)
            ? format(selectedDate, "dd.MM.yyyy", { locale: de })
            : placeholder}
          {value && (
            <XIcon
              className="text-muted-foreground hover:text-foreground ml-auto size-4"
              onClick={handleClear}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          captionLayout="dropdown"
          defaultMonth={selectedDate}
        />
      </PopoverContent>
    </Popover>
  );
}
