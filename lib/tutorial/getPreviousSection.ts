export function getPreviousSection(current: string, role: "admin" | "user") {
    const adminFlow = [
      "welcome",
      "company-setup",
      "user-management",
      "formatting",
      "job-flow",
      "job-flow1",
    ];
  
    const userFlow = ["welcome", "job-flow"];
  
    const flow = role === "admin" ? adminFlow : userFlow;
  
    const index = flow.indexOf(current);
  
    if (index <= 0) return current; // no previous section
  
    return flow[index - 1];
  }
  