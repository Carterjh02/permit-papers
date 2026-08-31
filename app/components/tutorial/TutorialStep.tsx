"use client";

import { TutorialToast } from "./TutorialToast";
import { useTutorial } from "./TutorialProvider";
import { getStep } from "@/lib/tutorial/tutorialConfig";

export function TutorialStep() {
  const { state, role, nextStep, skipSection, finishTutorial } = useTutorial();

  if (!state?.enabled) return null;

  const section = state.currentSection;
  const stepIndex = state.currentStep;

  const step = getStep(section!, stepIndex, role);
  if (!step) return null;

  return (
    <TutorialToast
      message={step.message}
      targetId={step.target}
      x={step.x}
      y={step.y}
      zIndex={step.zIndex}
      onNextAction={nextStep}
      onSkipAction={skipSection}
      onFinishAction={finishTutorial}
    />
  );
}
