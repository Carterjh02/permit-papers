export function getNextSection(current: string, role: string) {
  const flow = role === "admin"
    ? ["welcome", "company-setup", "user-management", "formatting", "job-flow"]
    : ["welcome", "job-flow"];

  const index = flow.indexOf(current);
  return index === -1 || index === flow.length - 1
    ? null
    : flow[index + 1];
}
