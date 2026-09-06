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
  previousStep: () => Promise<void>;
  gotoSection: (section: string) => Promise<void>;
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
  
  async function previousStep() {
    await fetch("/api/tutorial/back", { method: "POST" });
  }

  async function skipSection() {
    await fetch("/api/tutorial/update", {
      method: "POST",
      body: JSON.stringify({ skip: true }),
    });
  }

  async function finishTutorial() {
    await fetch("/api/tutorial/update", {
      method: "POST",
      body: JSON.stringify({ enabled: false }),
    });
  }

  async function gotoSection(section: string) {
    await fetch("/api/tutorial/goto", {
      method: "POST",
      body: JSON.stringify({ section }),
    });
  }  

  function normalizePage(path: string): string {
    // Matches: /dashboard/jobs/<dynamic>/preview
    const previewPattern = /^\/dashboard\/jobs\/[^/]+\/preview$/;
  
    if (previewPattern.test(path)) {
      return "/dashboard/jobs/preview";
    }
  
    return path;
  }

  useEffect(() => {
    if (!tutorial?.enabled) return;
  
    const section = tutorial.currentSection;
    const stepIndex = tutorial.currentStep;
  
    const step = getStep(section!, stepIndex, role);
    if (!step) return;
  
    const currentPage = normalizePage(window.location.pathname);
    const lastPage = sessionStorage.getItem("tutorialLastPage") || null;
  
    const nextStepObj = getStep(section!, stepIndex + 1, role);
  
    const justClickedNext =
      sessionStorage.getItem("tutorialJustAdvanced") === "true";
  
    sessionStorage.setItem("tutorialLastPage", currentPage);
  
    // AUTO-ADVANCE FIRST: If the next step has a page and the user navigates to it
    const nextPage = nextStepObj?.page || null;
    
    if (
      nextPage &&
      currentPage === nextPage &&
      lastPage !== currentPage
    ) {
      // Clear the flag BEFORE auto‑advance so the next effect run behaves correctly
      sessionStorage.removeItem("tutorialJustAdvanced");
    
      nextStep().then(() => {
        window.dispatchEvent(new Event("tutorialReload"));
      });
      return;
    }
    
    // CASE 1: Current step requires a page
    if (step.page) {
      if (currentPage !== step.page) {
    
        if (nextPage && currentPage === nextPage) {
          return;
        }
    
        window.dispatchEvent(
          new CustomEvent("tutorialShowNavigateMessage", {
            detail: { page: step.page },
          })
        );
        return;
      }
    
      // User is on the correct page → DO NOT reload here
      // Auto‑advance already handles reload when appropriate
      return;
    }
  
    // CASE 3: No page requirements
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
        previousStep,
        gotoSection,
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
