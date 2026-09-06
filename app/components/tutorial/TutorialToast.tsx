"use client";

import React, { useEffect, useState } from "react";

interface ExtraButton {
  label: string;
  gotoSection: string;
}
import ReactMarkdown from "react-markdown";

interface TutorialToastProps {
  message: string;
  x?: number;
  y?: number;
  xPercent?: number;
  yPercent?: number;
  zIndex?: number;

  extraButtons?: ExtraButton[];
  onBackAction?: () => Promise<void> | void;
  onGotoSection?: (section: string) => Promise<void> | void;

  onNextAction: () => Promise<void> | void;
  onSkipAction?: () => Promise<void> | void;
  onFinishAction?: () => Promise<void> | void;
}

export function TutorialToast({
  message,
  x,
  y,
  xPercent,
  yPercent,
  zIndex,

  extraButtons,
  onBackAction,
  onGotoSection,

  onNextAction,
  onSkipAction,
  onFinishAction,
}: TutorialToastProps) {
  const [overrideMessage, setOverrideMessage] = useState<string | null>(null);

  // Listen for "navigate to {page}" messages from TutorialProvider
  useEffect(() => {
    function handleNavigateMessage(e: Event) {
      if (e instanceof CustomEvent && typeof (e as CustomEvent).detail?.page === "string") {
        const page = (e as CustomEvent).detail.page;
        setOverrideMessage(`Navigate to ${page} to continue this tutorial`);
      }
    }
  
    function handleTutorialReload() {
      // Clear override message when tutorial reloads
      setOverrideMessage(null);
    }
  
    window.addEventListener("tutorialShowNavigateMessage", handleNavigateMessage);
    window.addEventListener("tutorialReload", handleTutorialReload);
  
    return () => {
      window.removeEventListener("tutorialShowNavigateMessage", handleNavigateMessage);
      window.removeEventListener("tutorialReload", handleTutorialReload);
    };
  }, []);

  const reloadLockRef = React.useRef(false);

  function safeReload() {
    if (reloadLockRef.current) return;
    reloadLockRef.current = true;
  
    window.dispatchEvent(new Event("tutorialReload"));
  
    setTimeout(() => {
      reloadLockRef.current = false;
    }, 600);
  }

  async function handleBack() {
    if (onBackAction) {
      await onBackAction();
      setTimeout(safeReload, 200);
    }
  }

  async function handleGoto(section: string) {
    if (onGotoSection) {
      await onGotoSection(section);
      setTimeout(safeReload, 200);
    }
  }

  async function handleNext() {
    await onNextAction();
    setTimeout(safeReload, 200);
  }

  async function handleSkip() {
    if (onSkipAction) {
      await onSkipAction();
      setTimeout(safeReload, 200);
    }
  }

  async function handleFinish() {
    if (onFinishAction) {
      await onFinishAction();
      setTimeout(safeReload, 200);
    }
  }

  const displayMessage = overrideMessage ?? message;

  const style: React.CSSProperties =
    xPercent != null && yPercent != null
      ? {
          position: "fixed",
          left: `${xPercent}vw`,
          top: `${yPercent}vh`,
          transform: "translate(-50%, -50%)",
          zIndex: zIndex ?? 9999,
          width: "380px",
          maxWidth: "90vw",
          textAlign: "center",
        }
      : {
          position: "fixed",
          left: x ?? 24,
          top: y ?? 24,
          zIndex: zIndex ?? 9999,
          width: "380px",
          maxWidth: "90vw",
          textAlign: "center",
        };

        return (
          <div
            id="tutorial-toast"
            className="tutorial-toast fixed bg-[var(--card-bg)] shadow-lg rounded-md p-4 border border-[var(--border-color)]"
            style={style}
          >
          <div
            key={displayMessage}
            className="text-[var(--text-color)] mb-3 text-left whitespace-pre-wrap break-words overflow-visible max-w-full"
          >
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2">{children}</p>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                hr: () => <hr className="my-2 border-[var(--border-color)]" />,
                ul: ({ children }) => <ul className="list-disc ml-5 mb-2">{children}</ul>,
                li: ({ children }) => <li className="mb-1">{children}</li>,
              }}
            >
              {displayMessage}
            </ReactMarkdown>
          </div>

      {/* Buttons container */}
      <div
        className={`flex items-center gap-2 mt-3 ${
          extraButtons && extraButtons.length > 0 ? "flex-wrap justify-center" : "justify-between"
        }`}
      >
        {/* Hide Back when branching */}
        {(!extraButtons || extraButtons.length === 0) && (
          <button className="dashboard-btn dashboard-btn-secondary flex-1" onClick={handleBack}>
            Back
          </button>
        )}

        {extraButtons && extraButtons.length > 0 ? (
          extraButtons.map((btn, idx) => (
            <button
              key={idx}
              className="dashboard-btn dashboard-btn-primary flex-1 min-w-[100px]"
              onClick={() => handleGoto(btn.gotoSection)}
            >
              {btn.label}
            </button>
          ))
        ) : (
          <>
            <button className="dashboard-btn dashboard-btn-primary flex-1" onClick={handleNext}>
              Next
            </button>
            <button className="dashboard-btn dashboard-btn-secondary flex-1" onClick={handleSkip}>
              Skip Section
            </button>
            <button className="dashboard-btn dashboard-btn-secondary flex-1" onClick={handleFinish}>
              Finish Tutorial
            </button>
          </>
        )}
      </div>
    </div>
  );
}
