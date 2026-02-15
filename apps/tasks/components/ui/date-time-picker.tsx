"use client";

import { cn } from "@helvety/shared/utils";
import { format, isValid } from "date-fns";
import { de } from "date-fns/locale";
import { CalendarIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/**
 * DateTimePicker - A date + time picker using shadcn Calendar + Popover + time input.
 * Stores and returns ISO datetime strings (e.g. "2026-02-15T14:30:00.000Z").
 */
interface DateTimePickerProps {
  /** ISO datetime string or null */
  value: string | null;
  /** Called with ISO datetime string or null when cleared */
  onChange: (value: string | null) => void;
  /** Placeholder text when no date/time is selected */
  placeholder?: string;
  /** Whether the picker is disabled */
  disabled?: boolean;
}

/** Date + time picker backed by shadcn Calendar + Popover + time input. */
export function DateTimePicker({
  value,
  onChange,
  placeholder = "Pick date & time",
  disabled,
}: DateTimePickerProps) {
  // Parse the ISO datetime string into a Date object
  const selectedDate = value ? new Date(value) : undefined;
  const isValidDate = selectedDate && isValid(selectedDate);

  // Extract time string (HH:mm) from the date
  const timeValue = isValidDate ? format(selectedDate, "HH:mm") : "00:00";

  const handleDateSelect = (date: Date | undefined) => {
    if (!date || !isValid(date)) {
      onChange(null);
      return;
    }

    // Preserve existing time when changing date
    if (isValidDate) {
      date.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
    }
    onChange(date.toISOString());
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [hours, minutes] = e.target.value.split(":").map(Number);
    if (hours === undefined || minutes === undefined) return;

    // If no date is selected yet, use today
    const date = isValidDate ? new Date(selectedDate) : new Date();
    date.setHours(hours, minutes, 0, 0);
    onChange(date.toISOString());
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
          {isValidDate
            ? format(selectedDate, "dd.MM.yyyy HH:mm", { locale: de })
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
          onSelect={handleDateSelect}
          defaultMonth={selectedDate}
        />
        <div className="border-border/40 border-t p-3">
          <Input
            type="time"
            value={timeValue}
            onChange={handleTimeChange}
            className="w-full"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
