"use client";

import { ReactNode, useState, useEffect, useRef } from "react";

/**
 * MOBILE-ONLY About Hero Component
 * Completely isolated from desktop - no shared code, no desktop artifacts
 * Aggressively preloads video to minimize black screen time
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
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        // Aggressively load video as soon as component mounts
        const video = videoRef.current;
        if (video) {
            // Force load
            video.load();

            // Try to play as soon as possible
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    console.log("Autoplay prevented, will retry on user interaction");
                });
            }
        }
    }, []);

    const firstWord = title ? title.split(" ")[0] : "";
    const restOfTitle = title ? title.split(" ").slice(1).join(" ") : "";

    return (
        <div className="relative w-full bg-black">
            {/* Video Hero Section - Pure black until video loads */}
            <section className="relative w-full h-screen bg-black overflow-hidden">
                {/* Video Background - Hidden until fully loaded */}
                <div className="absolute inset-0 bg-black">
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
                            transition: "opacity 0.5s ease-in-out",
                        }}
                        onLoadedData={() => {
                            console.log("Video data loaded");
                            setVideoLoaded(true);
                        }}
                        onCanPlay={() => {
                            console.log("Video can play");
                            setVideoLoaded(true);
                        }}
                        onLoadedMetadata={() => {
                            console.log("Video metadata loaded");
                        }}
                    />
                    {/* Dark overlay */}
                    <div
                        className="absolute inset-0 bg-black"
                        style={{
                            opacity: videoLoaded ? 0.4 : 1,
                            transition: "opacity 0.5s ease-in-out",
                        }}
                    />
                </div>

                {/* Hero Text Content */}
                <div className="relative z-10 h-full flex flex-col items-center justify-center px-6">
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
