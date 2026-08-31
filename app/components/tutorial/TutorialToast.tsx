"use client";

import React from "react";

interface TutorialToastProps {
  message: string;
  targetId: string | null;
  x?: number;
  y?: number;
  zIndex?: number;
  onNextAction: () => Promise<void> | void;
  onSkipAction: () => Promise<void> | void;
  onFinishAction: () => Promise<void> | void;
}

export function TutorialToast({
  message,
  x,
  y,
  zIndex,
  onNextAction,
  onSkipAction,
  onFinishAction,
}: TutorialToastProps) {

  async function handleNext() {
    await onNextAction();
    window.dispatchEvent(new Event("tutorialReload"));
  }

  async function handleSkip() {
    await onSkipAction();
    window.dispatchEvent(new Event("tutorialReload"));
  }

  async function handleFinish() {
    await onFinishAction();
    window.dispatchEvent(new Event("tutorialReload"));
  }

  return (
    <div
      id="tutorial-toast"
      className="tutorial-toast fixed bg-[var(--card-bg)] shadow-lg rounded-md p-4 border border-[var(--border-color)]"
      style={{
        position: "fixed",
        left: x ?? 24,
        top: y ?? 24,
        zIndex: zIndex ?? 9999,
      }}
    >
      <p className="text-[var(--text-color)] mb-3">{message}</p>

      <div className="flex gap-3">
        <button className="dashboard-btn dashboard-btn-primary" onClick={handleNext}>
          Next
        </button>

        <button className="dashboard-btn dashboard-btn-secondary" onClick={handleSkip}>
          Skip Section
        </button>

        <button className="dashboard-btn dashboard-btn-secondary" onClick={handleFinish}>
          Finish Tutorial
        </button>
      </div>
    </div>
  );
}
