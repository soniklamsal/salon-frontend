"use client";

import { ReactNode, useState, useEffect, useRef } from "react";

/**
 * Simple video hero for About page - NO GSAP, works on all devices
 * Just video background with text overlay
 */

interface SimpleVideoHeroProps {
    videoUrl: string;
    title?: string;
    date?: string;
    children?: ReactNode;
}

export function SimpleVideoHero({
    videoUrl,
    title,
    date,
    children,
}: SimpleVideoHeroProps) {
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
            {/* Full-screen Video Hero Section */}
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
                            setVideoLoaded(true);
                        }}
                    />
                    {/* Subtle dark overlay for better text readability */}
                    {videoLoaded && !videoError && (
                        <div className="absolute inset-0 bg-black/40" />
                    )}
                </div>

                {/* Hero Text Content - Centered on mobile, bottom on desktop */}
                <div
                    className="relative z-10 h-full flex flex-col items-center justify-center md:justify-end md:pb-16 lg:pb-20 px-6"
                    style={{
                        opacity: videoLoaded ? 1 : 0,
                        transition: "opacity 0.8s ease-in-out",
                    }}
                >
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
