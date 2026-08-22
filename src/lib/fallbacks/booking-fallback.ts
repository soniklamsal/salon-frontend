import type { BookingConfig } from "@/lib/types/content-types";

/**
 * Fallback booking configuration when the backend is unavailable.
 * 
 * This ensures the booking page remains functional even if the API is down,
 * displaying default services and barbers with fallback images.
 */

export const FALLBACK_BOOKING_CONFIG: BookingConfig = {
  copy: {
    pageHeading: "Book Your Appointment",
    pageIntro: "Select your preferred service and barber to get started",
    serviceStep: "Choose Service",
    serviceHeading: "Select a Service",
    barberStep: "Choose Barber",
    barberHeading: "Select Your Barber",
    detailsStep: "Your Details",
    detailsHeading: "Tell Us About Yourself",
    paymentStep: "Payment",
    paymentHeading: "Complete Your Booking",
    submitLabel: "Submit Booking",
    successHeading: "Booking Confirmed!",
  },
  
  services: [
    {
      id: 1,
      label: "Fresh Cut",
      description: "Classic haircut with styling",
      priceFrom: "800.00",
      image: "/images/services/fresh-cut.svg",
      icon: "hair",
      iconImage: "",
      href: "/services/fresh-cut",
      order: 1,
    },
    {
      id: 2,
      label: "Sharp Fade",
      description: "Modern fade with precision",
      priceFrom: "1000.00",
      image: "/images/services/sharp-fade.svg",
      icon: "hair",
      iconImage: "",
      href: "/services/sharp-fade",
      order: 2,
    },
    {
      id: 3,
      label: "Beard Work",
      description: "Professional beard trim and shape",
      priceFrom: "500.00",
      image: "/images/services/beard-work.svg",
      icon: "hair",
      iconImage: "",
      href: "/services/beard-work",
      order: 3,
    },
    {
      id: 4,
      label: "Clean Edge",
      description: "Sharp edge up and lineup",
      priceFrom: "600.00",
      image: "/images/services/clean-edge.svg",
      icon: "hair",
      iconImage: "",
      href: "/services/clean-edge",
      order: 4,
    },
    {
      id: 5,
      label: "Quick Trim",
      description: "Fast touch-up trim",
      priceFrom: "400.00",
      image: "/images/services/quick-trim.svg",
      icon: "hair",
      iconImage: "",
      href: "/services/quick-trim",
      order: 5,
    },
  ],
  
  barbers: [
    {
      id: 1,
      name: "Aashish",
      initials: "AA",
      role: "Senior Stylist",
      photo: "",
      bio: "",
      schedule: "Mon-Sat, 10AM-7PM",
      isAvailable: true,
      availabilityLabel: "Available",
      order: 1,
    },
    {
      id: 2,
      name: "Bina",
      initials: "BI",
      role: "Master Barber",
      photo: "",
      bio: "",
      schedule: "Tue-Sun, 11AM-8PM",
      isAvailable: true,
      availabilityLabel: "Available",
      order: 2,
    },
    {
      id: 3,
      name: "Kiran",
      initials: "KI",
      role: "Stylist",
      photo: "",
      bio: "",
      schedule: "Mon-Fri, 9AM-6PM",
      isAvailable: true,
      availabilityLabel: "Available",
      order: 3,
    },
  ],
  
  esewa: {
    qr: "",
    note: "Scan QR code to make payment via eSewa",
    depositPercent: 50,
  },
};
