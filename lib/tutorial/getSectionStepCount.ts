import { tutorialSteps } from "./tutorialConfig";

export function getSectionStepCount(section: string, role: string) {
  return tutorialSteps.filter(s => s.section === section && s.role === role).length;
}
