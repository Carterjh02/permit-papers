"use client";

import { TutorialToast } from "./TutorialToast";
import { useTutorial } from "./TutorialProvider";
import { getStep } from "@/lib/tutorial/tutorialConfig";

export function TutorialStep() {
  const {
    state,
    role,
    nextStep,
    previousStep,
    gotoSection,
    skipSection,
    finishTutorial,
  } = useTutorial();

  if (!state?.enabled) return null;

  const section = state.currentSection;
  const stepIndex = state.currentStep;

  const step = getStep(section!, stepIndex, role);
  if (!step) return null;

  return (
    <TutorialToast
      message={step.message}

      // Positioning
      x={step.x}
      y={step.y}
      xPercent={step.xPercent}
      yPercent={step.yPercent}
      zIndex={step.zIndex}

      // Branching
      extraButtons={step.extraButtons}
      onBackAction={previousStep}
      onGotoSection={gotoSection}

      // Default actions
      onNextAction={nextStep}
      onSkipAction={skipSection}
      onFinishAction={finishTutorial}
    />
  );
}
