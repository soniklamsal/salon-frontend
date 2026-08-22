"use client";

import { ReactNode } from "react";

/**
 * Simple mobile-only hero component for About page
 * No animations, no GSAP, just clean video background with content
 */

interface MobileHeroProps {
    mediaType?: "video" | "image";
    mediaSrc: string;
    posterSrc?: string;
    title?: string;
    date?: string;
    children?: ReactNode;
}

export function MobileHero({
    mediaType = "video",
    mediaSrc,
    posterSrc,
    title,
    date,
    children,
}: MobileHeroProps) {
    const firstWord = title ? title.split(" ")[0] : "";
    const restOfTitle = title ? title.split(" ").slice(1).join(" ") : "";

    return (
        <div className="relative min-h-screen bg-black">
            {/* Full-screen video background */}
            <div className="fixed inset-0 z-0">
                {mediaType === "video" ? (
                    <video
                        src={mediaSrc}
                        poster={posterSrc}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="auto"
                        className="w-full h-full object-cover"
                        controls={false}
                        disablePictureInPicture
                        disableRemotePlayback
                    />
                ) : (
                    <img
                        src={mediaSrc}
                        alt={title || "Hero"}
                        className="w-full h-full object-cover"
                    />
                )}
                {/* Dark overlay for better text readability */}
                <div className="absolute inset-0 bg-black/40" />
            </div>

            {/* Hero content */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-20">
                {/* Title */}
                <div className="text-center mb-8">
                    {date && (
                        <p className="font-gotham text-white font-bold uppercase tracking-wider text-sm mb-2">
                            {date}
                        </p>
                    )}
                    <h1 className="font-gotham-condensed font-bold uppercase text-white">
                        <div className="text-6xl leading-tight">{firstWord}</div>
                        <div className="text-6xl leading-tight">{restOfTitle}</div>
                    </h1>
                </div>
            </div>

            {/* Page content */}
            <div className="relative z-10 bg-background">
                {children}
            </div>
        </div>
    );
}
