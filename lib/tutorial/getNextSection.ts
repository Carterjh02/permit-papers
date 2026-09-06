export function getNextSection(currentSection: string, role: "admin" | "user") {
  const branchSections = [
    "snippet-workflow",
    "property-workflow",
    "manual-workflow",
  ];

  // Branches always return to job-flow
  if (branchSections.includes(currentSection)) {
    return "job-flow1";
  }

  const adminFlow = [
    "welcome",
    "company-setup",
    "user-management",
    "formatting",
    "job-flow",
    "job-flow1",
  ];

  const userFlow = ["welcome", "job-flow", "job-flow1"];

  const flow = role === "admin" ? adminFlow : userFlow;
  const index = flow.indexOf(currentSection);

  // If section not found or last in flow → stay where we are
  if (index === -1 || index === flow.length - 1) {
    return currentSection;
  }

  return flow[index + 1];
}
