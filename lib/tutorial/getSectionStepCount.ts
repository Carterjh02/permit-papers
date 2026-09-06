import { tutorialSteps } from "./tutorialConfig";

export function getSectionStepCount(section: string, role: "admin" | "user") {
  return tutorialSteps.filter(
    (step) => step.role === role && step.section === section
  ).length;
}
