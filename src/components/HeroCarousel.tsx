"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Building2,
  Lock,
  UserPlus,
  Fingerprint,
  Sparkles,
  ArrowRight,
  Check,
} from "lucide-react";

interface HeroSlide {
  id: number;
  kicker: string;
  title: string;
  tagline: string;
  description: string;
  image: string;
  imageAlt: string;
  badge: string;
  primaryCta: {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    isLogin?: boolean;
  };
  secondaryCta: {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
  };
  verifyCta?: {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    isLogin?: boolean;
  };
  highlights: string[];
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: 1,
    kicker: "Constituency Human Capital Framework • Pakistan 2026",
    title: "Constituency Human Capital,",
    tagline: "Verified & Delivered.",
    description:
      "A unified sovereign portal connecting National Assembly constituencies, NADRA CNIC verification, district employment quotas, and official Gazette appointment notifications.",
    image: "/images/hero-hospital.jpg",
    imageAlt: "Constituency Human Resources Portal Dashboard",
    badge: "Official Sovereign Portal",
    primaryCta: {
      label: "Access Official Portal",
      href: "/login",
      icon: Lock,
      isLogin: true,
    },
    secondaryCta: {
      label: "Register Candidate",
      href: "/signup",
      icon: UserPlus,
    },
    verifyCta: {
      label: "Verify CNIC",
      href: "#cnic-verify",
      icon: Fingerprint,
    },
    highlights: [
      "142 National Constituencies",
      "NADRA CNIC Verification",
      "Gazette Generator",
    ],
  },
  {
    id: 2,
    kicker: "Central Parliamentary Assembly & Quota Secretariat",
    title: "National Merit Pool & Quotas,",
    tagline: "Transparent Governance.",
    description:
      "Merit-based candidate tracking, institutional oversight, and regional quota compliance ensuring every constituency receives fair, auditable representation.",
    image: "/images/hospitals.jpg",
    imageAlt: "Parliament House of Pakistan",
    badge: "Constitutional Oversight",
    primaryCta: {
      label: "Access Official Portal",
      href: "/login",
      icon: Lock,
      isLogin: true,
    },
    secondaryCta: {
      label: "View Provincial Quotas",
      href: "#provinces",
      icon: Building2,
    },
    verifyCta: {
      label: "Candidate Roster",
      href: "#roles",
      icon: ShieldCheck,
    },
    highlights: [
      "Provincial Quota Tracking",
      "Parliamentary Seat Ledger",
      "Legal Compliance Standards",
    ],
  },
  {
    id: 3,
    kicker: "State Bureaucracy & Citizen Verification Protocol",
    title: "Biometric CNIC Screening,",
    tagline: "Zero Duplicate Applications.",
    description:
      "Direct verification with NADRA 13-digit identity records, educational board document matching, and automated duplicate prevention across all provincial tiers.",
    image: "/images/about-mission.jpg",
    imageAlt: "Assembly Hall State Governance",
    badge: "Biometric Integrity",
    primaryCta: {
      label: "Verify Record Now",
      href: "#cnic-verify",
      icon: Fingerprint,
    },
    secondaryCta: {
      label: "Register Candidate",
      href: "/signup",
      icon: UserPlus,
    },
    verifyCta: {
      label: "Portal Login",
      href: "/login",
      icon: Lock,
      isLogin: true,
    },
    highlights: [
      "13-Digit Auto-Masking",
      "Educational Document Matching",
      "Instant Audit Trail",
    ],
  },
];

interface HeroCarouselProps {
  onOpenLogin: () => void;
}

export function HeroCarousel({ onOpenLogin }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrent((prev) => (prev + 1) % HERO_SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrent((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 6000);
    return () => clearInterval(timer);
  }, [isPaused, nextSlide]);

  return (
    <div
      className="relative overflow-hidden bg-slate-950 text-white select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-label="Constituency Highlights Slider"
    >
      {/* Slides Container */}
      <div className="relative min-h-[560px] sm:min-h-[600px] md:min-h-[640px] lg:min-h-[680px]">
        {HERO_SLIDES.map((slide, index) => {
          const isActive = index === current;
          const PrimaryIcon = slide.primaryCta.icon;
          const SecondaryIcon = slide.secondaryCta.icon;
          const VerifyIcon = slide.verifyCta?.icon;

          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${isActive
                  ? "opacity-100 z-10 pointer-events-auto"
                  : "opacity-0 z-0 pointer-events-none"
                }`}
              aria-hidden={!isActive}
            >
              {/* Slide Background Image - CLEARLY VISIBLE with shuhada-website exact dual gradient */}
              <div className="absolute inset-0">
                <Image
                  src={slide.image}
                  alt={slide.imageAlt}
                  fill
                  priority={index === 0}
                  sizes="100vw"
                  className="object-cover object-center transform scale-105 transition-transform duration-[7000ms] ease-out motion-safe:scale-100"
                />
                {/* Balanced gradient overlay: rich dark gradient on left behind text, translucent on right so image shines through */}
                <div
                  className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-transparent"
                  aria-hidden="true"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/40"
                  aria-hidden="true"
                />
              </div>

              {/* Slide Content */}
              <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-center px-6 sm:px-12 md:px-16 lg:px-20 py-16 sm:py-20">
                <div className="max-w-3xl space-y-5 text-center lg:text-left">
                  {/* Badge & Kicker */}
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-950/70 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-300 backdrop-blur-md">
                      <Sparkles className="size-3.5 text-emerald-400" />
                      {slide.badge}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-100/90 hidden sm:inline">
                      {slide.kicker}
                    </span>
                  </div>

                  {/* Main Title & Tagline */}
                  <h1 className="text-3xl font-extrabold leading-tight tracking-tight !text-white sm:text-4xl lg:text-[2.9rem] xl:text-5xl font-heading drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
                    <span className="!text-white">{slide.title}</span>
                    <span className="block text-amber-300 mt-1 drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">{slide.tagline}</span>
                  </h1>

                  {/* Description */}
                  <p className="mx-auto max-w-2xl text-sm leading-relaxed !text-slate-100 sm:text-base lg:mx-0 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] font-medium">
                    {slide.description}
                  </p>

                  {/* Action CTAs */}
                  <div className="flex flex-col items-center justify-center gap-2.5 pt-2 sm:flex-row lg:justify-start">
                    <Link
                      href={slide.primaryCta.href}
                      onClick={(e) => {
                        if (slide.primaryCta.isLogin) {
                          e.preventDefault();
                          onOpenLogin();
                        }
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#01411c] hover:bg-[#035a27] text-white px-5 py-3 text-xs font-bold shadow-lg transition-all hover:scale-[1.02] sm:w-auto sm:text-sm cursor-pointer border border-emerald-600/40"
                    >
                      <PrimaryIcon className="h-4 w-4 text-amber-300" />
                      <span>{slide.primaryCta.label}</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>

                    <Link
                      href={slide.secondaryCta.href}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300/40 bg-white/10 px-5 py-3 text-xs font-semibold text-white backdrop-blur-md transition-all hover:bg-white/20 sm:w-auto sm:text-sm cursor-pointer"
                    >
                      <SecondaryIcon className="h-4 w-4 text-amber-300" />
                      <span>{slide.secondaryCta.label}</span>
                    </Link>

                    {slide.verifyCta && (
                      <a
                        href={slide.verifyCta.href}
                        onClick={(e) => {
                          if (slide.verifyCta?.isLogin) {
                            e.preventDefault();
                            onOpenLogin();
                          }
                        }}
                        className="flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-3 text-xs font-bold text-slate-300 transition-all hover:bg-white/10 hover:text-white sm:w-auto cursor-pointer"
                      >
                        {VerifyIcon && <VerifyIcon className="h-4 w-4 text-emerald-400" />}
                        <span>{slide.verifyCta.label}</span>
                      </a>
                    )}
                  </div>

                  {/* Highlights Bullet List */}
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px] font-semibold text-slate-200 lg:justify-start">
                    {slide.highlights.map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-slate-900/60 px-2.5 py-1 backdrop-blur-xs"
                      >
                        <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Prev / Next Buttons */}
      <button
        type="button"
        onClick={prevSlide}
        aria-label="Previous Highlight Slide"
        className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 flex size-10 sm:size-12 items-center justify-center rounded-full border border-white/20 bg-slate-950/60 text-white backdrop-blur-md transition-all hover:bg-white hover:text-[#01411c] hover:border-white shadow-lg cursor-pointer"
      >
        <ChevronLeft className="size-5 sm:size-6" />
      </button>

      <button
        type="button"
        onClick={nextSlide}
        aria-label="Next Highlight Slide"
        className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 flex size-10 sm:size-12 items-center justify-center rounded-full border border-white/20 bg-slate-950/60 text-white backdrop-blur-md transition-all hover:bg-white hover:text-[#01411c] hover:border-white shadow-lg cursor-pointer"
      >
        <ChevronRight className="size-5 sm:size-6" />
      </button>

      {/* Bottom Slider Dots */}
      <div className="absolute bottom-4 left-0 right-0 z-20 flex items-center justify-center gap-2">
        {HERO_SLIDES.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => setCurrent(index)}
            aria-label={`Go to slide ${index + 1}`}
            className={`transition-all rounded-full cursor-pointer ${index === current
                ? "w-8 h-2.5 bg-amber-400 shadow-sm"
                : "w-2.5 h-2.5 bg-white/40 hover:bg-white/70"
              }`}
          />
        ))}
      </div>
    </div>
  );
}
