"use client";

import { getStep } from "@/lib/tutorial/tutorialConfig";
import {
  createContext,
  useContext,
  ReactNode,
  useEffect,
} from "react";

export interface TutorialState {
  enabled: boolean;
  currentSection: string | null;
  currentStep: number;
  completedSections: string[];
}

interface TutorialContextValue {
  state: TutorialState | null;
  role: "admin" | "user";
  nextStep: () => Promise<void>;
  skipSection: () => Promise<void>;
  finishTutorial: () => Promise<void>;
}

const TutorialContext = createContext<TutorialContextValue | null>(null);

export function TutorialProvider({
  tutorial,
  role,
  children,
}: {
  tutorial: TutorialState | null;
  role: "admin" | "user";
  children: ReactNode;
}) {

  async function nextStep() {
    sessionStorage.setItem("tutorialJustAdvanced", "true");
    await fetch("/api/tutorial/advance", { method: "POST" });
  }

  async function skipSection() {
    await fetch("/api/tutorial/update", {
      method: "POST",
      body: JSON.stringify({ enabled: false }),
    });
  }

  async function finishTutorial() {
    await fetch("/api/tutorial/update", {
      method: "POST",
      body: JSON.stringify({ enabled: false }),
    });
  }

  useEffect(() => {
    if (!tutorial?.enabled) return;
  
    const section = tutorial.currentSection;
    const stepIndex = tutorial.currentStep;
  
    const step = getStep(section!, stepIndex, role);
    if (!step) return;

    if (section === "welcome") {
      return;
    }
  
    // Prevent auto‑advance immediately after clicking Next
    const justClickedNext = sessionStorage.getItem("tutorialJustAdvanced") === "true";
    if (justClickedNext) {
      sessionStorage.removeItem("tutorialJustAdvanced");
      return;
    }
  }, [tutorial, role]);

  return (
    <TutorialContext.Provider
      value={{
        state: tutorial,
        role,
        nextStep,
        skipSection,
        finishTutorial,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const ctx = useContext(TutorialContext);
  if (!ctx) {
    throw new Error("useTutorial must be used within TutorialProvider");
  }
  return ctx;
}
