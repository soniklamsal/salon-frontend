"use client";

import { useEffect } from "react";
import { Calendar } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchTimeSlots } from "@/lib/api/booking";
import { useBookingStore } from "@/stores/booking-store";
import { cn } from "@/lib/utils";
import type { TimeSlot } from "@/lib/types/content-types";

/**
 * Time slot selection step for the booking flow.
 * 
 * Shows a date picker followed by available time slots for the selected barber.
 * Slots are displayed like movie ticket selection - green for available, 
 * red/grey for booked.
 */
export function TimeSlotStep() {
    const barber = useBookingStore((s) => s.barber);
    const selectedDate = useBookingStore((s) => s.selectedDate);
    const timeSlot = useBookingStore((s) => s.timeSlot);
    const availableSlots = useBookingStore((s) => s.availableSlots);
    const loadingSlots = useBookingStore((s) => s.loadingSlots);

    const {
        setSelectedDate,
        setTimeSlot,
        setAvailableSlots,
        setLoadingSlots,
    } = useBookingStore(
        useShallow((s) => ({
            setSelectedDate: s.setSelectedDate,
            setTimeSlot: s.setTimeSlot,
            setAvailableSlots: s.setAvailableSlots,
            setLoadingSlots: s.setLoadingSlots,
        }))
    );

    // Load slots when date changes
    useEffect(() => {
        if (!barber || !selectedDate) {
            setAvailableSlots([]);
            return;
        }

        const loadSlots = async () => {
            setLoadingSlots(true);
            console.log(`[TimeSlotStep] Fetching slots for barber ${barber.id} on ${selectedDate}`);
            try {
                const slots = await fetchTimeSlots(barber.id, selectedDate);
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
    }, [barber, selectedDate, setAvailableSlots, setLoadingSlots]);

    // Get today's date in YYYY-MM-DD format for min attribute
    const today = new Date().toISOString().split("T")[0];

    const handleDateChange = (date: string) => {
        setSelectedDate(date);
        // Clear selected time slot when date changes
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

    return (
        <div className="space-y-6 sm:max-w-2xl">
            {/* Date picker */}
            <div className="grid gap-2">
                <Label htmlFor="booking-date" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Select Date <span className="text-primary">*</span>
                </Label>
                <Input
                    id="booking-date"
                    type="date"
                    value={selectedDate ?? ""}
                    onChange={(e) => handleDateChange(e.target.value)}
                    min={today}
                    required
                    className="sm:max-w-xs"
                />
                <p className="text-muted-foreground text-xs">
                    Choose a date to see available time slots with {barber.name}.
                </p>
            </div>

            {/* Time slots grid */}
            {selectedDate && (
                <div className="grid gap-3">
                    <Label className="text-base">
                        Available Time Slots{" "}
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
                                No time slots available for this date.
                            </p>
                            <p className="text-muted-foreground mt-2 text-xs">
                                Please try a different date or contact us directly.
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
                                    <span className="text-muted-foreground">Booked</span>
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
                                            // Booked state
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
                                            <span className="text-[10px] opacity-75">Booked</span>
                                        )}
                                    </Button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            {!selectedDate && (
                <div className="border-border rounded-xl border p-6 text-center">
                    <p className="text-muted-foreground text-sm">
                        Select a date above to see available time slots.
                    </p>
                </div>
            )}
        </div>
    );
}
