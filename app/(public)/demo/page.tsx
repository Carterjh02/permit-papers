"use client";

import { useRef, useState } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

// ============================================================
// ICON COMPONENT
// ============================================================

type IconName =
  | "play"
  | "clock"
  | "file"
  | "bolt"
  | "monitor"
  | "pencil"
  | "briefcase"
  | "arrow"
  | "laptop";

function Icon({
  name,
  className = "",
}: {
  name: IconName;
  className?: string;
}) {
  const paths: Record<IconName, ReactNode> = {
    play: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m10 8 6 4-6 4V8z" />
      </>
    ),

    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 6v6l4 2" />
      </>
    ),

    file: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M8 13h8M8 17h8" />
      </>
    ),

    bolt: (
      <path d="M13 2 4 13h7l-1 9 10-12h-7l0-8z" />
    ),

    monitor: (
      <>
        <rect x="3" y="3" width="18" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
        <path d="m10 7 5 3-5 3V7z" />
      </>
    ),

    pencil: (
      <>
        <path d="m16.5 3.5 4 4L9 19l-5 1 1-5L16.5 3.5z" />
        <path d="M12 20h9" />
      </>
    ),

    briefcase: (
      <>
        <rect x="3" y="7" width="18" height="14" rx="2" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" />
      </>
    ),

    arrow: (
      <path d="M4 12h16m-7-7 7 7-7 7" />
    ),

    laptop: (
      <>
        <rect x="4" y="3" width="16" height="13" rx="2" />
        <path d="M2 20h20M9 7l6 3-6 3V7z" />
      </>
    ),
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {paths[name]}
    </svg>
  );
}

// ============================================================
// VIDEO LIBRARY
//
// To add a new video:
// 1. Add the video file to public/demo/videos/
// 2. Add an entry below with its src.
// 3. Videos with a src become selectable automatically.
//
// Videos without a src remain Coming Soon.
// ============================================================

type DemoVideo = {
  id: string;
  title: string;
  description: string;
  src?: string;
};

const demoVideos: DemoVideo[] = [
  {
    id: "full",
    title: "Full Walkthrough",
    description:
      "A complete overview of the PermitPapers workflow, from creating a job to generating documents.",
    src: "/demo/videos/full-video-demonstration.mp4",
  },

  {
    id: "drawing",
    title: "Using the Drawing Tool",
    description:
      "Learn how to create simple floor plans and drawings.",
  },

  {
    id: "jobs",
    title: "Managing Jobs & Documents",
    description:
      "See how to organize customers, jobs, and permit documents.",
  },
];

const availableVideos = demoVideos.filter(
  (video) => Boolean(video.src)
);

// ============================================================
// DEMO BENEFITS
// ============================================================

const benefits: {
  icon: IconName;
  title: string;
  description: string;
}[] = [
  {
    icon: "clock",
    title: "See the Full Workflow",
    description: "From job setup to a completed permit packet.",
  },
  {
    icon: "file",
    title: "Real Examples",
    description: "Watch real forms and document workflows.",
  },
  {
    icon: "bolt",
    title: "Quick & Easy",
    description: "Get a clear look at how it saves time.",
  },
  {
    icon: "monitor",
    title: "Built for Contractors",
    description: "A practical solution for everyday permit work.",
  },
];

// ============================================================
// FEATURE CARDS
// ============================================================

const features: {
  icon: IconName;
  title: string;
  description: string;
  image: string;
  comingSoon?: boolean;
}[] = [
  {
    icon: "file",
    title: "Permit Forms",
    description:
      "Automatically complete permit documents using your job details.",
    image: "/images/homepage/autofill-forms.png",
  },
  {
    icon: "pencil",
    title: "Drawing Tool",
    description:
      "Create simple floor plans and sketches without complicated software.",
    image: "/images/homepage/floor-plan.png",
    comingSoon: true,
  },
  {
    icon: "briefcase",
    title: "Manage Jobs",
    description:
      "Keep customer details, jobs, and permit documents organized.",
    image: "/images/homepage/add-customer.png",
  },
];

// ============================================================
// DEMO PAGE
// ============================================================

export default function DemoPage() {
  const [activeIndex, setActiveIndex] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);

  const activeVideo =
    availableVideos[activeIndex] ?? availableVideos[0];

  // Navigate between available videos.
  const changeVideo = (direction: number) => {
    setActiveIndex((current) =>
      Math.max(
        0,
        Math.min(
          availableVideos.length - 1,
          current + direction
        )
      )
    );
  };

  const watchDemo = () => {
    const player = videoRef.current;

    if (!player) return;

    player.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    void player.play().catch(() => {
      // Native video controls remain available.
    });
  };

  return (
    <>
      {/* ======================================================
          FULL-WIDTH PUBLIC LAYOUT OVERRIDE
         ====================================================== */}

      <style>{`
        .public-shell:has(.pp-demo-page) {
          display: block;
          background: #ffffff;
          overflow-x: clip;
        }

        .public-content:has(.pp-demo-page) {
          width: 100%;
          max-width: none;
          margin: 0;
          padding: 0;
          border-radius: 0;
          box-shadow: none;
        }

        .pp-demo-page {
          scroll-behavior: smooth;
        }
      `}</style>

      <div className="pp-demo-page w-full bg-white text-[#0a1737]">

        {/* ====================================================
            HERO
           ==================================================== */}

        <section className="relative isolate flex min-h-[clamp(25rem,32vw,35rem)] items-center overflow-hidden bg-[#061a31]">

          <Image
            src="/images/demo/hero.png"
            alt="Contractor working with PermitPapers at a construction site"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[65%_center]"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-[#03152b]/95 via-[#03152b]/75 to-[#03152b]/15 lg:via-[#03152b]/45" />

          <div className="relative mx-auto flex w-[94vw] max-w-[96rem] items-center py-[clamp(3rem,5vw,5rem)]">

            <div className="max-w-[43rem]">

              <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-white/90 sm:text-sm">
                Product Demo
              </p>

              <h1 className="text-[clamp(2.7rem,4.8vw,5rem)] font-extrabold leading-[1.03] tracking-tight text-white">

                See PermitPapers

                <span className="mt-1 block text-[#139dff]">
                  in Action
                </span>

              </h1>

              <p className="mt-5 max-w-[36rem] text-base leading-relaxed text-white/95 sm:text-lg">
                Watch how PermitPapers simplifies customer
                information, automatically fills permit forms,
                and helps you prepare your permit documents
                all in one place.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">

                <button
                  type="button"
                  onClick={watchDemo}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#086df2] px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-[#0058cb]"
                >
                  <Icon name="play" className="h-5 w-5" />

                  Watch Full Demo
                </button>

                <Link
                  href="#demo-features"
                  className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white bg-black/20 px-6 py-3 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/15"
                >
                  Explore Key Features
                </Link>

              </div>

            </div>

          </div>

        </section>

        {/* ====================================================
            BENEFITS STRIP
           ==================================================== */}

        <section className="border-b border-[#dfebf9] bg-gradient-to-b from-white to-[#f3f9ff]">

          <div className="mx-auto grid w-[94vw] max-w-[96rem] grid-cols-1 gap-y-6 py-[clamp(1.5rem,3vw,2.5rem)] sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">

            {benefits.map((benefit, index) => (

              <div
                key={benefit.title}
                className={`flex items-start gap-4 lg:px-5 ${
                  index > 0
                    ? "lg:border-l lg:border-[#cbdcf1]"
                    : ""
                }`}
              >

                <Icon
                  name={benefit.icon}
                  className="h-10 w-10 shrink-0 text-[#086df2]"
                />

                <div>

                  <h2 className="text-sm font-extrabold sm:text-base">
                    {benefit.title}
                  </h2>

                  <p className="mt-1 text-sm leading-snug text-[#35445c]">
                    {benefit.description}
                  </p>

                </div>

              </div>

            ))}

          </div>

        </section>

        {/* ====================================================
            PRODUCT DEMO VIDEOS
           ==================================================== */}

        <section
          id="demo-videos"
          className="scroll-mt-24 py-[clamp(3rem,5vw,5.5rem)]"
        >

          <div className="mx-auto w-[94vw] max-w-[96rem]">

            <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
              Product Demo{" "}
              <span className="text-[#086df2]">
                Videos
              </span>
            </h2>

            <p className="mt-2 text-center text-base text-[#384861]">
              Step-by-step videos to help you see how
              PermitPapers works.
            </p>

            <div className="mt-10 grid grid-cols-1 items-start gap-[clamp(1.5rem,3vw,3rem)] lg:grid-cols-[1.45fr_1fr]">

              {/* ==============================================
                  VIDEO PLAYER
                 ============================================== */}

              <div className="min-w-0">

                <div className="overflow-hidden rounded-2xl border border-[#dce8f7] bg-white p-2 shadow-[0_8px_28px_rgba(12,45,85,0.12)] sm:p-3">

                  <video
                    key={activeVideo?.src}
                    ref={videoRef}
                    id="demo-player"
                    controls
                    playsInline
                    preload="metadata"
                    className="aspect-video w-full rounded-xl bg-[#061a31] object-contain"
                    aria-label={activeVideo?.title ?? "PermitPapers demo"}
                  >
                    <source
                      src={activeVideo?.src}
                      type="video/mp4"
                    />

                    Your browser does not support HTML5 video.

                  </video>

                </div>

                <div className="mt-4">

                  <h3 className="text-lg font-extrabold">
                    {activeVideo?.title}
                  </h3>

                  <p className="mt-1 text-sm leading-relaxed text-[#40516b]">
                    {activeVideo?.description}
                  </p>

                </div>

              </div>

              {/* ==============================================
                  VIDEO LIBRARY
                 ============================================== */}

              <aside className="min-w-0">

                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">

                  <h3 className="text-2xl font-extrabold tracking-tight">
                    Demo Videos
                  </h3>

                  <div className="flex items-center gap-2">

                    <span className="mr-1 text-xs font-semibold text-[#43536b]">
                      {availableVideos.length > 0
                        ? activeIndex + 1
                        : 0}{" "}
                      of {availableVideos.length}
                    </span>

                    <button
                      type="button"
                      onClick={() => changeVideo(-1)}
                      disabled={activeIndex === 0}
                      aria-label="Previous demo video"
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#d6e2f1] bg-[#f5f9ff] text-[#086df2] transition hover:bg-[#e4f0ff] disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      <span aria-hidden="true">❮</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => changeVideo(1)}
                      disabled={
                        activeIndex >= availableVideos.length - 1
                      }
                      aria-label="Next demo video"
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#d6e2f1] bg-[#f5f9ff] text-[#086df2] transition hover:bg-[#e4f0ff] disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      <span aria-hidden="true">❯</span>
                    </button>

                  </div>

                </div>

                <div className="space-y-3">

                  {demoVideos.map((video) => {
                    const ready = Boolean(video.src);
                    const selected =
                      activeVideo?.id === video.id;

                    const availableIndex =
                      availableVideos.findIndex(
                        (item) => item.id === video.id
                      );

                    return (
                      <button
                        key={video.id}
                        type="button"
                        disabled={!ready}
                        onClick={() =>
                          setActiveIndex(availableIndex)
                        }
                        aria-current={
                          selected ? "true" : undefined
                        }
                        className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition ${
                          selected
                            ? "border-[#086df2] bg-[#e7f2ff] shadow-sm"
                            : ready
                            ? "border-[#dce6f2] bg-[#f6faff] hover:border-[#94bff8] hover:bg-[#edf6ff]"
                            : "cursor-not-allowed border-[#e6edf5] bg-[#f3f6fa] opacity-75"
                        }`}
                      >

                        <span
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                            selected
                              ? "bg-[#086df2] text-white"
                              : "bg-[#a8b4c5] text-white"
                          }`}
                        >
                          <Icon
                            name="play"
                            className="h-6 w-6"
                          />
                        </span>

                        <span className="min-w-0 flex-1">

                          <span className="block text-sm font-extrabold text-[#0a1737] sm:text-base">
                            {video.title}
                          </span>

                          {selected && (

                            <span className="mt-1 block text-xs leading-relaxed text-[#40516b]">
                              {video.description}
                            </span>

                          )}

                        </span>

                        {!ready && (

                          <span className="shrink-0 rounded-full bg-[#dcecff] px-3 py-1 text-[0.65rem] font-bold text-[#086df2]">
                            Coming Soon
                          </span>

                        )}

                      </button>
                    );
                  })}

                </div>

                <p className="mt-4 text-sm leading-relaxed text-[#51627b]">
                  Additional tutorials and feature demonstrations
                  will be added as they become available.
                </p>

              </aside>

            </div>

          </div>

        </section>

        {/* ====================================================
            KEY FEATURES
           ==================================================== */}

        <section
          id="demo-features"
          className="scroll-mt-24 bg-gradient-to-b from-[#eef7ff] to-[#e4f1ff] py-[clamp(3rem,5vw,5rem)]"
        >

          <div className="mx-auto w-[94vw] max-w-[96rem]">

            <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
              A Closer Look at the{" "}
              <span className="text-[#086df2]">
                Key Features
              </span>
            </h2>

            <p className="mt-2 text-center text-base text-[#384861]">
              See how each part of PermitPapers helps you
              get permits done faster.
            </p>

            <div className="mt-9 grid grid-cols-1 gap-5 md:grid-cols-3">

              {features.map((feature) => (

                <article
                  key={feature.title}
                  className="flex min-w-0 items-center gap-4 rounded-xl border border-[#d6e5f8] bg-white p-5 shadow-[0_6px_18px_rgba(10,45,90,0.07)]"
                >

                  <Icon
                    name={feature.icon}
                    className="h-10 w-10 shrink-0 text-[#086df2]"
                  />

                  <div className="min-w-0 flex-1">

                    <h3 className="text-base font-extrabold">
                      {feature.title}
                    </h3>

                    <p className="mt-1 text-sm leading-snug text-[#35445c]">
                      {feature.description}
                    </p>

                    {feature.comingSoon && (

                      <span className="mt-2 inline-block rounded-full bg-[#e5f1ff] px-2.5 py-1 text-xs font-bold text-[#086df2]">
                        Coming Soon
                      </span>

                    )}

                  </div>

                  <div className="relative hidden aspect-[4/3] w-[30%] shrink-0 overflow-hidden rounded-lg bg-[#f5f9ff] lg:block">

                    <Image
                      src={feature.image}
                      alt=""
                      fill
                      sizes="20vw"
                      className="object-contain"
                    />

                  </div>

                </article>

              ))}

            </div>

          </div>

        </section>

        {/* ====================================================
            GUIDED DEMO ACCESS
           ==================================================== */}

        <section
          id="guided-demo"
          className="bg-[#e4f1ff] pb-[clamp(3rem,5vw,5rem)]"
        >

          <div className="mx-auto w-[94vw] max-w-[96rem]">

            <div className="relative isolate overflow-hidden rounded-2xl border border-[#c3defb] bg-gradient-to-r from-[#c6e2ff] via-[#edf6ff] to-[#d7eaff]">

              {/* Decorative construction image */}
              <div className="pointer-events-none absolute bottom-0 right-0 hidden h-full w-[25%] opacity-35 lg:block">

                <Image
                  src="/images/homepage/construction-framing.png"
                  alt=""
                  fill
                  sizes="25vw"
                  className="object-cover"
                />

              </div>

              <div className="relative flex flex-col gap-6 p-[clamp(1.5rem,3.5vw,3rem)] lg:flex-row lg:items-center lg:justify-between">

                <div className="flex items-start gap-5">

                  <Icon
                    name="laptop"
                    className="h-14 w-14 shrink-0 text-[#086df2]"
                  />

                  <div>

                    <div className="flex flex-wrap items-center gap-3">

                      <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                        Guided Demo Access
                      </h2>

                      <span className="rounded-full bg-[#d5e9ff] px-3 py-1 text-xs font-bold text-[#086df2]">
                        Coming Soon
                      </span>

                    </div>

                    <p className="mt-2 max-w-[43rem] text-sm leading-relaxed text-[#34445d] sm:text-base">
                      Soon, you&apos;ll be able to request temporary
                      login details by email and try PermitPapers
                      with a limited number of jobs before subscribing.
                    </p>

                  </div>

                </div>

                <button
                  type="button"
                  disabled
                  title="Guided demo access is coming soon"
                  className="inline-flex min-h-12 shrink-0 cursor-not-allowed items-center justify-center gap-2 rounded-lg border-2 border-[#086df2] bg-white/80 px-6 py-3 text-sm font-bold text-[#086df2] opacity-65"
                >
                  Request Access
                  <Icon name="arrow" className="h-4 w-4" />
                </button>

              </div>

            </div>

          </div>

        </section>

        {/* Shared footer is rendered by the public layout. */}

      </div>
    </>
  );
}