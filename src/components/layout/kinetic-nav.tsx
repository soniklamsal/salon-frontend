"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { AuthControls } from "@/features/auth/components/auth-controls";
import { SocialIconRow } from "@/components/shared/social-icon";
import type { CtaLink, NavLink, SocialLink } from "@/lib/types/content-types";

/**
 * Ported from the devis-gym demo
 * (`components/ui/sterling-gate-kinetic-navigation.tsx`).
 *
 * Structure and GSAP timelines are the demo's, unchanged: a transparent bar
 * over the hero, horizontal links from xl up, and below that a burger that
 * opens a full-height panel — three backdrop layers sliding in on a stagger,
 * links flicking up from `yPercent: 140` with a 10deg rotation, and an ambient
 * shape behind whichever link is hovered.
 *
 * What differs from the demo, all of it styling rather than behaviour:
 *   - blush/deep/Jost instead of lime/black/Oswald (see globals.css)
 *   - the SALON wordmark instead of a logo image
 *   - the demo's music and sound-effect toggles are gone; this project has no
 *     SoundManager and no audio to toggle. The Book Now CTA sits where they did.
 *
 * The class names are the demo's because the GSAP selectors target them.
 */

// Register GSAP plugins safely
if (typeof window !== "undefined") {
  gsap.registerPlugin(CustomEase);
}

type KineticNavProps = {
  /** `core.NavLink` filtered to `show_in_header`. */
  links: NavLink[];
  cta: CtaLink;
  brandName: string;
  /** `core.SocialLink`, same list the footer uses. */
  social: SocialLink[];
};

/**
 * Which nav entry the current URL belongs to — at most one.
 *
 * An exact match wins. Failing that, the longest href the path starts with
 * wins, so /about-us/team belongs to /about-us rather than to /.
 *
 * Returning a single index matters because two entries can share an href: the
 * CMS has both "About Us" and "Our story" pointing at /about-us, and marking
 * every match underlined them both.
 */
function activeIndex(links: NavLink[], pathname: string): number {
  const exact = links.findIndex((link) => link.href === pathname);
  if (exact !== -1) return exact;

  let best = -1;
  let longest = 0;
  links.forEach((link, i) => {
    if (link.href === "/" || !pathname.startsWith(link.href)) return;
    if (link.href.length > longest) {
      longest = link.href.length;
      best = i;
    }
  });
  return best;
}

export function KineticNav({ links, cta, brandName, social }: KineticNavProps) {
  const pathname = usePathname();
  const current = activeIndex(links, pathname);
  // The parent container scopes every GSAP selector below.
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Initial setup & hover effects
  useEffect(() => {
    if (!containerRef.current) return;

    try {
      if (!gsap.parseEase("main")) {
        CustomEase.create("main", "0.65, 0.01, 0.05, 0.99");
        gsap.defaults({ ease: "main", duration: 0.7 });
      }
    } catch (e) {
      console.warn("CustomEase failed to load, falling back to default.", e);
      gsap.defaults({ ease: "power2.out", duration: 0.7 });
    }

    const ctx = gsap.context(() => {
      const menuItems = containerRef.current!.querySelectorAll(
        ".menu-list-item[data-shape]"
      );
      const shapesContainer = containerRef.current!.querySelector(
        ".ambient-background-shapes"
      );

      menuItems.forEach((item) => {
        const shapeIndex = item.getAttribute("data-shape");
        const shape = shapesContainer
          ? shapesContainer.querySelector(`.bg-shape-${shapeIndex}`)
          : null;

        if (!shape) return;

        const shapeEls = shape.querySelectorAll(".shape-element");
        const onEnter = () => {
          if (shapesContainer) {
            shapesContainer
              .querySelectorAll(".bg-shape")
              .forEach((s) => s.classList.remove("active"));
          }
          shape.classList.add("active");

          gsap.fromTo(
            shapeEls,
            { scale: 0.5, opacity: 0, rotation: -10 },
            {
              scale: 1,
              opacity: 1,
              rotation: 0,
              duration: 0.6,
              stagger: 0.08,
              ease: "back.out(1.7)",
              overwrite: "auto",
            }
          );
        };

        const onLeave = () => {
          gsap.to(shapeEls, {
            scale: 0.8,
            opacity: 0,
            duration: 0.3,
            ease: "power2.in",
            onComplete: () => shape.classList.remove("active"),
            overwrite: "auto",
          });
        };
        item.addEventListener("mouseenter", onEnter);
        item.addEventListener("mouseleave", onLeave);

        (item as HTMLElement & { _cleanup?: () => void })._cleanup = () => {
          item.removeEventListener("mouseenter", onEnter);
          item.removeEventListener("mouseleave", onLeave);
        };
      });
    }, containerRef);

    const container = containerRef.current;
    return () => {
      ctx.revert();
      if (container) {
        const items = container.querySelectorAll(".menu-list-item[data-shape]");
        items.forEach((item) => {
          const el = item as HTMLElement & { _cleanup?: () => void };
          el._cleanup?.();
        });
      }
    };
    // Re-attached if the admin changes how many links there are, since the
    // handlers are bound to the rendered <li> elements.
  }, [links.length]);

  // Menu open/close animation
  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      const navWrap = containerRef.current!.querySelector(".nav-overlay-wrapper");
      const menu = containerRef.current!.querySelector(".menu-content");
      const overlay = containerRef.current!.querySelector(".overlay");
      const bgPanels = containerRef.current!.querySelectorAll(".backdrop-layer");
      const menuLinks = containerRef.current!.querySelectorAll(".nav-link");
      const fadeTargets =
        containerRef.current!.querySelectorAll("[data-menu-fade]");

      const menuButton = containerRef.current!.querySelector(".nav-close-btn");
      const menuButtonIcon = menuButton?.querySelector(".menu-button-icon");
      const tl = gsap.timeline();

      if (isMenuOpen) {
        // OPEN
        if (navWrap) navWrap.setAttribute("data-nav", "open");

        tl.set(navWrap, { display: "block" }).set(menu, { xPercent: 0 }, "<");

        if (menuButtonIcon) {
          tl.fromTo(menuButtonIcon, { rotate: 0 }, { rotate: 315 }, "<");
        }

        tl.fromTo(overlay, { autoAlpha: 0 }, { autoAlpha: 1 }, "<")
          .fromTo(
            bgPanels,
            { xPercent: 101 },
            { xPercent: 0, stagger: 0.12, duration: 0.575 },
            "<"
          )
          .fromTo(
            menuLinks,
            { yPercent: 140, rotate: 10 },
            { yPercent: 0, rotate: 0, stagger: 0.05 },
            "<+=0.35"
          );

        if (fadeTargets.length) {
          tl.fromTo(
            fadeTargets,
            { autoAlpha: 0, yPercent: 50 },
            { autoAlpha: 1, yPercent: 0, stagger: 0.04, clearProps: "all" },
            "<+=0.2"
          );
        }
      } else {
        // CLOSE
        if (navWrap) navWrap.setAttribute("data-nav", "closed");
        tl.to(overlay, { autoAlpha: 0 }).to(menu, { xPercent: 120 }, "<");

        if (menuButtonIcon) {
          tl.to(menuButtonIcon, { rotate: 0 }, "<");
        }

        tl.set(navWrap, { display: "none" });
      }
    }, containerRef);

    return () => ctx.revert();
  }, [isMenuOpen]);

  // Escape closes the panel
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isMenuOpen]);

  // Solid bar once the hero has scrolled past
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <div ref={containerRef}>
      <div className={`site-header-wrapper ${isScrolled ? "scrolled" : ""}`}>
        <header className="header">
          <div className="container is--full">
            <nav className="nav-row">
              <Link
                href="/"
                aria-label={`${brandName} — home`}
                className="nav-logo-row block"
              >
                <span className="logo-text">{brandName}</span>
              </Link>

              {/* Spacer that pushes the burger right below xl */}
              <div className="flex-1 xl:hidden" />

              {/* Desktop horizontal navigation */}
              <div className="desktop-nav hidden xl:flex">
                <ul className="desktop-nav-list">
                  {links.map((item, index) => {
                    const isActive = index === current;
                    return (
                      <li key={item.id} className="desktop-nav-item">
                        <Link
                          href={item.href}
                          aria-current={isActive ? "page" : undefined}
                          className={`desktop-nav-link ${isActive ? "active" : ""}`}
                        >
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>

                {/* Where the demo put its sound toggles. */}
                <SocialIconRow links={social} compact />
                <AuthControls compact />

                <Link href={cta.href} className="nav-cta">
                  {cta.label}
                </Link>
              </div>

              {/* Burger — mobile and tablet */}
              <div className="nav-row__right flex xl:hidden">
                <button
                  type="button"
                  className={`nav-close-btn cursor-pointer ${isScrolled ? "scrolled" : ""}`}
                  onClick={toggleMenu}
                  aria-expanded={isMenuOpen}
                  aria-controls="kinetic-menu"
                  aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                  style={{ pointerEvents: "auto" }}
                >
                  <div className="icon-wrap">
                    {isMenuOpen ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="menu-button-icon cross-icon"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="menu-button-icon hamburger-icon"
                      >
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="3" y1="12" x2="21" y2="12" />
                        <line x1="3" y1="18" x2="21" y2="18" />
                      </svg>
                    )}
                  </div>
                </button>
              </div>
            </nav>
          </div>
        </header>
      </div>

      {/* Fullscreen menu — mobile and tablet only */}
      <section className="fullscreen-menu-container xl:hidden">
        <div data-nav="closed" className="nav-overlay-wrapper" id="kinetic-menu">
          <div className="overlay" onClick={closeMenu} />
          <nav className="menu-content" aria-label="Primary">
            <div className="menu-bg">
              <div className="backdrop-layer first" />
              <div className="backdrop-layer second" />
              <div className="backdrop-layer" />

              {/* One ambient shape per link, revealed on hover. */}
              <div className="ambient-background-shapes">
                {/* Shape 1: floating circles */}
                <svg className="bg-shape bg-shape-1" viewBox="0 0 400 400" fill="none">
                  <circle className="shape-element" cx="80" cy="120" r="40" fill="rgba(252,202,184,0.30)" />
                  <circle className="shape-element" cx="300" cy="80" r="60" fill="rgba(252,202,184,0.24)" />
                  <circle className="shape-element" cx="200" cy="300" r="80" fill="rgba(252,202,184,0.20)" />
                  <circle className="shape-element" cx="350" cy="280" r="30" fill="rgba(252,202,184,0.30)" />
                </svg>

                {/* Shape 2: wave pattern */}
                <svg className="bg-shape bg-shape-2" viewBox="0 0 400 400" fill="none">
                  <path
                    className="shape-element"
                    d="M0 200 Q100 100, 200 200 T 400 200"
                    stroke="rgba(252,202,184,0.34)"
                    strokeWidth="60"
                    fill="none"
                  />
                  <path
                    className="shape-element"
                    d="M0 280 Q100 180, 200 280 T 400 280"
                    stroke="rgba(252,202,184,0.26)"
                    strokeWidth="40"
                    fill="none"
                  />
                </svg>

                {/* Shape 3: grid dots */}
                <svg className="bg-shape bg-shape-3" viewBox="0 0 400 400" fill="none">
                  <circle className="shape-element" cx="50" cy="50" r="8" fill="rgba(252,202,184,0.45)" />
                  <circle className="shape-element" cx="150" cy="50" r="8" fill="rgba(252,202,184,0.45)" />
                  <circle className="shape-element" cx="250" cy="50" r="8" fill="rgba(252,202,184,0.45)" />
                  <circle className="shape-element" cx="350" cy="50" r="8" fill="rgba(252,202,184,0.45)" />
                  <circle className="shape-element" cx="100" cy="150" r="12" fill="rgba(252,202,184,0.38)" />
                  <circle className="shape-element" cx="200" cy="150" r="12" fill="rgba(252,202,184,0.38)" />
                  <circle className="shape-element" cx="300" cy="150" r="12" fill="rgba(252,202,184,0.38)" />
                  <circle className="shape-element" cx="50" cy="250" r="10" fill="rgba(252,202,184,0.45)" />
                  <circle className="shape-element" cx="150" cy="250" r="10" fill="rgba(252,202,184,0.45)" />
                  <circle className="shape-element" cx="250" cy="250" r="10" fill="rgba(252,202,184,0.45)" />
                  <circle className="shape-element" cx="350" cy="250" r="10" fill="rgba(252,202,184,0.45)" />
                  <circle className="shape-element" cx="100" cy="350" r="6" fill="rgba(252,202,184,0.45)" />
                  <circle className="shape-element" cx="200" cy="350" r="6" fill="rgba(252,202,184,0.45)" />
                  <circle className="shape-element" cx="300" cy="350" r="6" fill="rgba(252,202,184,0.45)" />
                </svg>

                {/* Shape 4: organic blobs */}
                <svg className="bg-shape bg-shape-4" viewBox="0 0 400 400" fill="none">
                  <path
                    className="shape-element"
                    d="M100 100 Q150 50, 200 100 Q250 150, 200 200 Q150 250, 100 200 Q50 150, 100 100"
                    fill="rgba(252,202,184,0.24)"
                  />
                  <path
                    className="shape-element"
                    d="M250 200 Q300 150, 350 200 Q400 250, 350 300 Q300 350, 250 300 Q200 250, 250 200"
                    fill="rgba(252,202,184,0.20)"
                  />
                </svg>
              </div>
            </div>

            <div className="menu-content-wrapper">
              <div className="sidebar-logo-container">
                <Link href="/" onClick={closeMenu} className="sidebar-logo-link">
                  <div className="sidebar-logo-content">
                    <span className="sidebar-logo-text">{brandName}</span>
                  </div>
                </Link>
              </div>

              <ul className="menu-list">
                {links.map((item, index) => {
                  const isActive = index === current;
                  return (
                    <li
                      key={item.id}
                      className="menu-list-item"
                      /* Four ambient shapes are drawn below, so a fifth link
                         cycles back to the first rather than losing its hover
                         backdrop. */
                      data-shape={(index % 4) + 1}
                    >
                      <Link
                        href={item.href}
                        className={`nav-link ${isActive ? "active" : ""}`}
                        aria-current={isActive ? "page" : undefined}
                        onClick={closeMenu}
                      >
                        <p className="nav-link-text">{item.label}</p>
                        <div className="nav-link-hover-bg" />
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <div className="sidebar-cta-container" data-menu-fade>
                <Link href={cta.href} onClick={closeMenu} className="sidebar-cta">
                  {cta.label}
                </Link>
                {/* Below xl the bar itself has only the wordmark and the
                    burger, so the icons live in the panel that burger opens. */}
                <div className="mt-6 flex items-center gap-5">
                  <SocialIconRow links={social} />
                  <AuthControls />
                </div>
              </div>
            </div>
          </nav>
        </div>
      </section>
    </div>
  );
}
