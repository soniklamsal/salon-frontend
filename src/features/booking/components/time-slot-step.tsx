"use client";

import { useEffect } from "react";
import { CalendarDays } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { fetchTimeSlots } from "@/lib/api/booking";
import { useBookingStore } from "@/stores/booking-store";
import { cn } from "@/lib/utils";
import type { TimeSlot } from "@/lib/types/content-types";

/**
 * Day-and-time selection for the booking flow.
 *
 * The salon keeps a weekly timetable rather than a diary, so this asks for a
 * day of the week and not a date: "Sunday, 10am" is a standing offer, and
 * which Sunday the customer actually comes in is settled by the salon when it
 * approves the booking. That is why there is no calendar here — a date picker
 * would promise a precision the booking does not carry, and the customer would
 * reasonably read the date they had picked as agreed.
 *
 * Slots read like cinema seats: green for free, red for closed, solid for the
 * one picked.
 */

/**
 * The week in the salon's order, Sunday first.
 *
 * Written out rather than derived from `Intl` or from the slots themselves:
 * all seven buttons have to render before any slot has loaded, and the
 * numbering has to match the API's (0 = Sunday), which is not what every
 * locale's date functions would give.
 */
const WEEK = [
    { value: 0, short: "Sun", full: "Sunday" },
    { value: 1, short: "Mon", full: "Monday" },
    { value: 2, short: "Tue", full: "Tuesday" },
    { value: 3, short: "Wed", full: "Wednesday" },
    { value: 4, short: "Thu", full: "Thursday" },
    { value: 5, short: "Fri", full: "Friday" },
    { value: 6, short: "Sat", full: "Saturday" },
];

export function TimeSlotStep() {
    const barber = useBookingStore((s) => s.barber);
    const selectedWeekday = useBookingStore((s) => s.selectedWeekday);
    const timeSlot = useBookingStore((s) => s.timeSlot);
    const availableSlots = useBookingStore((s) => s.availableSlots);
    const loadingSlots = useBookingStore((s) => s.loadingSlots);

    const {
        setSelectedWeekday,
        setTimeSlot,
        setAvailableSlots,
        setLoadingSlots,
    } = useBookingStore(
        useShallow((s) => ({
            setSelectedWeekday: s.setSelectedWeekday,
            setTimeSlot: s.setTimeSlot,
            setAvailableSlots: s.setAvailableSlots,
            setLoadingSlots: s.setLoadingSlots,
        }))
    );

    // Load slots when the day changes.
    //
    // Compared against null rather than tested for truthiness, here and
    // throughout this file: Sunday is 0, so `!selectedWeekday` would treat the
    // first day of the salon's week as "nothing picked yet" and leave the step
    // silently empty.
    useEffect(() => {
        if (!barber || selectedWeekday === null) {
            setAvailableSlots([]);
            return;
        }

        const loadSlots = async () => {
            setLoadingSlots(true);
            console.log(`[TimeSlotStep] Fetching slots for barber ${barber.id} on weekday ${selectedWeekday}`);
            try {
                const slots = await fetchTimeSlots(barber.id, selectedWeekday);
                console.log(`[TimeSlotStep] Received ${slots.length} slots:`, slots);
                setAvailableSlots(slots);
            } catch (error) {
                console.error("[TimeSlotStep] Failed to load time slots:", error);
                setAvailableSlots([]);
            } finally {
                setLoadingSlots(false);
            }
        };

        loadSlots();
    }, [barber, selectedWeekday, setAvailableSlots, setLoadingSlots]);

    const handleWeekdayChange = (weekday: number) => {
        setSelectedWeekday(weekday);
        // Clear the chosen time: it belonged to the previous day's list.
        setTimeSlot(null);
    };

    const handleSlotClick = (slot: TimeSlot) => {
        if (slot.isBooked) return;
        setTimeSlot(slot);
    };

    if (!barber) {
        return (
            <div className="text-muted-foreground text-center text-sm">
                Please select a barber first.
            </div>
        );
    }

    const selectedDay = WEEK.find((day) => day.value === selectedWeekday);

    return (
        <div className="space-y-6 sm:max-w-2xl">
            {/* Day picker */}
            <div className="grid gap-2">
                <Label className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    Select Day <span className="text-primary">*</span>
                </Label>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                    {WEEK.map((day) => (
                        <Button
                            key={day.value}
                            type="button"
                            variant="outline"
                            // The three-letter form is what keeps all seven on
                            // one row on a phone; the full name rides along for
                            // anyone reading with a screen reader.
                            aria-label={day.full}
                            aria-pressed={selectedWeekday === day.value}
                            onClick={() => handleWeekdayChange(day.value)}
                            className={cn(
                                "transition-all",
                                selectedWeekday === day.value &&
                                "border-primary bg-primary text-primary-foreground hover:bg-primary hover:opacity-90"
                            )}
                        >
                            {day.short}
                        </Button>
                    ))}
                </div>
                <p className="text-muted-foreground text-xs">
                    Pick the day you would like to come in. {barber.name}&apos;s
                    times for that day appear below; the salon confirms the exact
                    date when it approves your booking.
                </p>
            </div>

            {/* Time slots grid */}
            {selectedWeekday !== null && (
                <div className="grid gap-3">
                    <Label className="text-base">
                        Available Times on {selectedDay?.full}{" "}
                        <span className="text-primary">*</span>
                    </Label>

                    {loadingSlots ? (
                        <div className="border-border rounded-xl border p-8 text-center">
                            <div className="text-muted-foreground text-sm">
                                Loading available time slots...
                            </div>
                        </div>
                    ) : availableSlots.length === 0 ? (
                        <div className="border-border rounded-xl border p-8 text-center">
                            <p className="text-muted-foreground text-sm font-medium">
                                No times available on {selectedDay?.full}.
                            </p>
                            <p className="text-muted-foreground mt-2 text-xs">
                                Please try another day or contact us directly.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Legend */}
                            <div className="flex flex-wrap items-center gap-4 text-xs">
                                <div className="flex items-center gap-2">
                                    <span className="bg-emerald-400/20 border-emerald-400/40 h-4 w-4 rounded border" />
                                    <span className="text-muted-foreground">Available</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="bg-destructive/20 border-destructive/40 h-4 w-4 rounded border" />
                                    <span className="text-muted-foreground">Unavailable</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="bg-primary border-primary h-4 w-4 rounded border" />
                                    <span className="text-muted-foreground">Selected</span>
                                </div>
                            </div>

                            {/* Slots grid */}
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                                {availableSlots.map((slot) => (
                                    <Button
                                        key={slot.id}
                                        type="button"
                                        variant="outline"
                                        disabled={slot.isBooked}
                                        onClick={() => handleSlotClick(slot)}
                                        className={cn(
                                            "h-auto flex-col gap-1 py-3 transition-all",
                                            // Available state
                                            !slot.isBooked &&
                                            timeSlot?.id !== slot.id &&
                                            "border-emerald-400/40 bg-emerald-400/10 text-emerald-300 hover:border-emerald-400 hover:bg-emerald-400/20",
                                            // Unavailable state
                                            slot.isBooked &&
                                            "border-destructive/40 bg-destructive/10 text-destructive cursor-not-allowed opacity-60",
                                            // Selected state
                                            timeSlot?.id === slot.id &&
                                            "border-primary bg-primary text-primary-foreground hover:bg-primary hover:opacity-90"
                                        )}
                                    >
                                        <span className="text-sm font-semibold">
                                            {slot.timeLabel}
                                        </span>
                                        {slot.isBooked && (
                                            <span className="text-[10px] opacity-75">
                                                Unavailable
                                            </span>
                                        )}
                                    </Button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            {selectedWeekday === null && (
                <div className="border-border rounded-xl border p-6 text-center">
                    <p className="text-muted-foreground text-sm">
                        Select a day above to see the available times.
                    </p>
                </div>
            )}
        </div>
    );
}
