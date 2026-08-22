"use client";

import { ReactNode, useState, useEffect, useRef } from "react";

/**
 * MOBILE-ONLY About Hero Component
 * Completely isolated from desktop - no shared code, no desktop artifacts
 * Robust video loading with fallback to prevent permanent black screen
 */

interface MobileAboutHeroProps {
    videoUrl: string;
    title?: string;
    date?: string;
    children?: ReactNode;
}

export function MobileAboutHero({
    videoUrl,
    title,
    date,
    children,
}: MobileAboutHeroProps) {
    const [videoLoaded, setVideoLoaded] = useState(false);
    const [videoError, setVideoError] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        // Fallback: Show video after 2 seconds even if events don't fire
        timeoutRef.current = setTimeout(() => {
            if (!videoLoaded) {
                console.log("Video timeout - showing anyway");
                setVideoLoaded(true);
            }
        }, 2000);

        // Try to load and play
        video.load();
        const playPromise = video.play();
        if (playPromise !== undefined) {
            playPromise.catch((error) => {
                console.log("Autoplay prevented:", error);
                // Still show the video even if autoplay fails
                setVideoLoaded(true);
            });
        }

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [videoLoaded]);

    const firstWord = title ? title.split(" ")[0] : "";
    const restOfTitle = title ? title.split(" ").slice(1).join(" ") : "";

    return (
        <div className="relative w-full bg-background">
            {/* Video Hero Section - Shows skeleton while loading */}
            <section className="relative w-full h-screen overflow-hidden bg-background">
                {/* Skeleton loader - visible until video loads */}
                {!videoLoaded && (
                    <div className="absolute inset-0 bg-gradient-to-b from-background-elevated to-background animate-pulse">
                        <div className="h-full flex flex-col items-center justify-center px-6">
                            {/* Skeleton title */}
                            <div className="space-y-4 w-full max-w-md">
                                <div className="h-3 bg-muted/20 rounded w-32 mx-auto"></div>
                                <div className="h-16 bg-muted/30 rounded-lg w-full"></div>
                                <div className="h-16 bg-muted/30 rounded-lg w-3/4 mx-auto"></div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Video Background */}
                <div className="absolute inset-0">
                    <video
                        ref={videoRef}
                        src={videoUrl}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="auto"
                        className="w-full h-full object-cover"
                        style={{
                            opacity: videoLoaded ? 1 : 0,
                            transition: "opacity 0.8s ease-in-out",
                        }}
                        onLoadedData={() => {
                            console.log("Video data loaded");
                            if (timeoutRef.current) {
                                clearTimeout(timeoutRef.current);
                            }
                            setVideoLoaded(true);
                        }}
                        onCanPlay={() => {
                            console.log("Video can play");
                            if (timeoutRef.current) {
                                clearTimeout(timeoutRef.current);
                            }
                            setVideoLoaded(true);
                        }}
                        onError={(e) => {
                            console.error("Video error:", e);
                            setVideoError(true);
                            setVideoLoaded(true); // Show fallback
                        }}
                    />
                    {/* Subtle dark overlay - only when video loaded */}
                    {videoLoaded && !videoError && (
                        <div className="absolute inset-0 bg-black/30" />
                    )}
                </div>

                {/* Hero Text Content */}
                <div
                    className="relative z-10 h-full flex flex-col items-center justify-center px-6"
                    style={{
                        opacity: videoLoaded ? 1 : 0,
                        transition: "opacity 0.8s ease-in-out",
                    }}
                >
                    <div className="text-center">
                        {date && (
                            <p className="font-gotham text-white font-bold uppercase tracking-wider text-xs mb-3">
                                {date}
                            </p>
                        )}
                        <h1 className="font-gotham-condensed font-bold uppercase text-white">
                            <div className="text-5xl sm:text-6xl leading-tight mb-2">
                                {firstWord}
                            </div>
                            <div className="text-5xl sm:text-6xl leading-tight">
                                {restOfTitle}
                            </div>
                        </h1>
                    </div>
                </div>
            </section>

            {/* Content Section - Always visible */}
            <div className="relative z-20 bg-background pt-12 md:pt-16 lg:pt-20">
                {children}
            </div>
        </div>
    );
}
