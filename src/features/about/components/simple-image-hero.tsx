"use client";

import { ReactNode } from "react";
import Image from "next/image";

/**
 * Simple image hero for About page
 * Full-screen image background with text overlay
 */

interface SimpleImageHeroProps {
    imageUrl: string;
    title?: string;
    date?: string;
    children?: ReactNode;
}

export function SimpleImageHero({
    imageUrl,
    title,
    date,
    children,
}: SimpleImageHeroProps) {
    const firstWord = title ? title.split(" ")[0] : "";
    const restOfTitle = title ? title.split(" ").slice(1).join(" ") : "";

    return (
        <div className="relative w-full bg-background">
            {/* Full-screen Image Hero Section */}
            <section className="relative w-full h-screen overflow-hidden bg-background">
                {/* Image Background */}
                <div className="absolute inset-0">
                    {/*
                        Guarded, the same way the homepage hero guards
                        `content.stylistImage`. The admin's About hero is an
                        optional upload, so the API sends "" when nothing has
                        been chosen -- and `<Image src="">` makes the browser
                        re-download the whole page as if it were the image,
                        which Next warns about in the console.

                        The section still renders without it: the heading sits
                        on the dark ground below rather than disappearing,
                        because a missing photograph should cost the picture,
                        not the page.
                    */}
                    {imageUrl ? (
                        <Image
                            src={imageUrl}
                            alt="About Us Hero"
                            fill
                            className="object-cover"
                            priority
                            quality={90}
                        />
                    ) : null}
                    {/* Dark overlay for better text readability. Kept even with
                        no image so the text contrast is identical either way. */}
                    <div className="absolute inset-0 bg-black/40" />
                </div>

                {/* Hero Text Content - Centered on mobile, bottom on desktop */}
                <div className="relative z-10 h-full flex flex-col items-center justify-center md:justify-end md:pb-16 lg:pb-20 px-6">
                    <div className="text-center max-w-4xl">
                        {/* Title */}
                        <h1 className="font-gotham-condensed font-bold uppercase text-white mb-4">
                            <div className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-tight mb-2">
                                {firstWord}
                            </div>
                            <div className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-tight">
                                {restOfTitle}
                            </div>
                        </h1>

                        {/* Date - Now after title */}
                        {date && (
                            <p className="font-gotham text-white font-bold uppercase tracking-wider text-xs sm:text-sm mb-8">
                                {date}
                            </p>
                        )}

                        {/* Scroll indicator with animated mouse and arrow - always visible */}
                        <div className="flex flex-col items-center gap-4 mt-8">
                            {/* Animated Mouse Icon */}
                            <div className="relative w-6 h-10 border-2 border-white/80 rounded-full flex items-start justify-center p-1.5">
                                {/* Scroll wheel - animated */}
                                <div
                                    className="w-1 h-2 bg-white/80 rounded-full animate-bounce"
                                    style={{
                                        animationDuration: "1.5s",
                                        animationTimingFunction: "ease-in-out",
                                    }}
                                />
                            </div>

                            {/* Animated Down Arrow Icon */}
                            <svg
                                className="w-6 h-6 text-white/90 animate-bounce"
                                style={{
                                    animationDuration: "2s",
                                    animationTimingFunction: "ease-in-out",
                                }}
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                            </svg>
                        </div>
                    </div>
                </div>
            </section>

            {/* Content Section */}
            <div className="relative z-20 bg-background pt-12 md:pt-16 lg:pt-20">
                {children}
            </div>
        </div>
    );
}
