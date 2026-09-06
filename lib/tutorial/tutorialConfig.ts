export interface ExtraButton {
  label: string;
  gotoSection: string;
}

export interface TutorialStep {
  id: string;
  section: string;
  role: "admin" | "user";

  // Message
  message: string;

  // Positioning
  x?: number;
  y?: number;
  xPercent?: number;
  yPercent?: number;
  zIndex?: number;

  // Page awareness
  page?: string;

  // Branching
  extraButtons?: ExtraButton[];
}

export const tutorialSteps: TutorialStep[] = [
  /* ----------------------------- WELCOME ----------------------------- */
  {
    id: "welcome-1",
    section: "welcome",
    role: "admin",
    message: "Welcome to PermitPapers.com! This quick tutorial will guide you through the main features of the system.",
    xPercent: 38,
    yPercent: 50,
    zIndex: 9999,
  },
  {
    id: "welcome-2",
    section: "welcome",
    role: "admin",
    message: "Let’s start by exploring the navigation bar at the top of the page.",
    xPercent: 38,
    yPercent: 5,
    zIndex: 9999,
  },

  /* -------------------------- COMPANY SETUP -------------------------- */
  {
    id: "company-nav",
    section: "company-setup",
    role: "admin",
    message: "To begin setting up your company profile, click the 'Company' tab in the navigation bar.",
    xPercent: 38,
    yPercent: 5,
    zIndex: 9999,
  },
  {
    id: "company-info-overview",
    section: "company-setup",
    role: "admin",
    page: "/dashboard/company",
    message: "This page displays your company information, which is automatically used to fill out permit paperwork. Keeping these details accurate ensures your documents are generated correctly.",
    xPercent: 38,
    yPercent: 50,
    zIndex: 9999,
  },
  {
    id: "company-edit-btn",
    section: "company-setup",
    role: "admin",
    page: "/dashboard/company",
    message: "Click the 'Edit Company Info' button to update your company details. These changes will automatically apply to all future permit documents.",
    xPercent: 68,
    yPercent: 75,
    zIndex: 9999,
  },
  {
    id: "company-info-section",
    section: "company-setup",
    role: "admin",
    page: "/dashboard/company/edit",
    message: "Fill out each section with accurate company information. Everything you enter here is used directly in your permit documents, so make sure the details are complete and precise.",
    xPercent: 38,
    yPercent: 50,
    zIndex: 9999,
  },
  {
    id: "company-review",
    section: "company-setup",
    role: "admin",
    page: "/dashboard/company/edit",
    message: "When you're finished entering your company details, click 'Save Changes' to update your information.",
    xPercent: 68,
    yPercent: 75,
    zIndex: 9999,
  },
  {
    id: "company-review",
    section: "company-setup",
    role: "admin",
    page: "/dashboard/company",
    message: "Before moving on, take a moment to review the company details you've entered. Accurate information ensures your permit documents are generated correctly.",
    xPercent: 38,
    yPercent: 50,
    zIndex: 9999,
  },
  {
    id: "company-users-nav",
    section: "company-setup",
    role: "admin",
    message: "Next, you'll set up logins for your employees. Click the 'Users' tab in the navigation bar to manage your user accounts.",
    xPercent: 38,
    yPercent: 5,
    zIndex: 9999,
  },

  /* -------------------------- USER MANAGEMENT ------------------------ */
  {
    id: "users-overview",
    section: "company-setup",
    role: "admin",
    page: "/dashboard/users",
    message: "This page lists all employees linked to your company. From here, you can create new user accounts or edit existing ones to keep your team information up to date.",
    xPercent: 38,
    yPercent: 50,
    zIndex: 9999,
  },
  {
    id: "users-new-btn",
    section: "user-management",
    role: "admin",
    page: "/dashboard/users",
    message: "Click 'New User' to create a new employee account. This will open the form where you can enter their login details.",
    xPercent: 53,
    yPercent: 20,
    zIndex: 9999,
  },
  {
    id: "users-create-form",
    section: "user-management",
    role: "admin",
    page: "/dashboard/users/new",
    message: "Enter the employee’s username, email, and password. You can assign a temporary password if needed—employees can change it later once they log in.",
    xPercent: 38,
    yPercent: 50,
    zIndex: 9999,
  },
  {
    id: "users-create-submit",
    section: "user-management",
    role: "admin",
    page: "/dashboard/users/new",
    message: "After filling out all required fields, click 'Create User' to add the employee to your company account.",
    xPercent: 28,
    yPercent: 68,
    zIndex: 9999,
  },

  /* ---------------------- FORMATTING PREFERENCES --------------------- */
  {
    id: "formatting-nav",
    section: "formatting",
    role: "admin",
    message: "Next, we’ll explore the formatting options available in your account. Click the 'Settings' tab in the navigation bar to continue.",
    xPercent: 38,
    yPercent: 5,
    zIndex: 9999,
  },
  {
    id: "formatting-nav",
    section: "formatting",
    role: "admin",
    page: "/dashboard/settings",
    message: "This page provides tools to help you personalize your experience and manage your account. Here, you can adjust your user preferences, review subscription and billing details, and access support if you need assistance.",
    xPercent: 38,
    yPercent: 50,
    zIndex: 9999,
  },
  {
    id: "formatting-nav",
    section: "formatting",
    role: "admin",
    page: "/dashboard/settings",
    message: "We’ll now move to the 'Formatting Preferences' tab to complete the final step of your onboarding tutorial.",
    xPercent: 20,
    yPercent: 47,
    zIndex: 9999,
  },
  {
    id: "formatting-overview",
    section: "formatting",
    role: "admin",
    page: "/dashboard/settings",
    message: "These settings define how data is formatted across your company. Any changes made here will automatically update how customer and company information appears in all future documents you generate.",
    xPercent: 38,
    yPercent: 50,
    zIndex: 9999,
  },
  {
    id: "formatting-save",
    section: "formatting",
    role: "admin",
    page: "/dashboard/settings",
    message: "After choosing the formatting options you want to apply company‑wide, click 'Save Formatting Preferences' to update your settings.",
    xPercent: 73,
    yPercent: 68,
    zIndex: 9999,
  },  
  {
    id: "formatting-back-dashboard",
    section: "job-flow",
    role: "admin",
    message: "When you're ready, click the 'Dashboard' tab to begin working on your first job.",
    xPercent: 38,
    yPercent: 5,
    zIndex: 9999,
  },  

  /* ----------------------------- JOB FLOW ----------------------------- */
  {
    id: "job-add",
    section: "job-flow",
    role: "admin",
    page: "/dashboard",
    message: "Click the '+ Add Job' button at the top of the table to begin creating a new job record.",
    xPercent: 38,
    yPercent: 50,
    zIndex: 9999,
  },
  {
    id: "job-upload-overview",
    section: "job-flow",
    role: "admin",
    page: "/dashboard/jobs/new",
    message: "This page lets you choose how to start a new job. There are several ways to upload or enter customer data — continue reading before making your selection.",
    xPercent: 38,
    yPercent: 50,
    zIndex: 9999,
  },
  {
    id: "job-upload-choice",
    section: "job-flow",
    role: "admin",
    page: "/dashboard/jobs/new",
    message:
    "Select how you’d like to begin:\n" +
    "Customer Snippet — Upload a CRM screenshot.\n" +
    "------------------------------------------\n" +
    "Property Appraiser Search — Search by customer address.\n" +
    "------------------------------------------\n" +
    "Manual Entry — Type the customer and property details yourself.\n" +
    "------------------------------------------\n" +
    "Click one of the options below to continue.",
    xPercent: 38,
    yPercent: 50,
    zIndex: 9999,
    extraButtons: [
      { label: "Customer Snippet", gotoSection: "snippet-workflow" },
      { label: "Property Search", gotoSection: "property-workflow" },
      { label: "Manual Entry", gotoSection: "manual-workflow" },
    ],
  },
  // Snippet Branch
  {
    id: "snippet-intro",
    section: "snippet-workflow",
    role: "admin",
    page: "/dashboard/jobs/new",
    message: "To begin with the snippet workflow, use your computer’s Snipping Tool to capture the customer information from your CRM. You can paste the image directly or upload it as a file.",
    xPercent: 38,
    yPercent: 50,
    zIndex: 9999,
  },
  {
    id: "snippet-upload",
    section: "snippet-workflow",
    role: "admin",
    page: "/dashboard/jobs/new",
    message: "Upload your captured image into the Customer Snippet box. Once uploaded, the system will extract the customer details for you.",
    xPercent: 3,
    yPercent: 50,
    zIndex: 9999,
  },
  {
    id: "snippet-options",
    section: "snippet-workflow",
    role: "admin",
    page: "/dashboard/jobs/new",
    message: "After reviewing the extracted information, you can apply it directly to the form or run a Property Appraiser search to gather additional property details. For this tutorial, choose the Property Appraiser search.",
    xPercent: 13,
    yPercent: 50,
    zIndex: 9999,
  },
  {
    id: "snippet-pa-confirm",
    section: "snippet-workflow",
    role: "admin",
    page: "/dashboard/jobs/new",
    message: "Confirm that the Property Appraiser results look accurate. Make any adjustments if needed, then click 'Populate Form' to apply the information.",
    xPercent: 13,
    yPercent: 50,
    zIndex: 9999,
  },

  // Property Search Branch
  {
    id: "pa-intro",
    section: "property-workflow",
    role: "admin",
    page: "/dashboard/jobs/new",
    message: "To begin with a manual property search, click the 'Search Property Appraiser' button.",
    xPercent: 38,
    yPercent: 50,
    zIndex: 9999,
  },
  {
    id: "pa-input",
    section: "property-workflow",
    role: "admin",
    page: "/dashboard/jobs/new",
    message: "Enter the customer’s full address and any other known details. A complete address ensures the most accurate search results. Click 'Search' when ready.",
    xPercent: 13,
    yPercent: 50,
    zIndex: 9999,
  },
  {
    id: "pa-confirm",
    section: "property-workflow",
    role: "admin",
    page: "/dashboard/jobs/new",
    message: "Review the extracted property information. If everything looks correct, click 'Populate Form' to apply the details.",
    xPercent: 13,
    yPercent: 50,
    zIndex: 9999,
  },

  // Manual Entry Branch
  {
    id: "manual-intro",
    section: "manual-workflow",
    role: "admin",
    page: "/dashboard/jobs/new",
    message: "To manually enter customer information, fill out each section of the form with the customer’s details.",
    xPercent: 38,
    yPercent: 50,
    zIndex: 9999,
  }, 

  // Back to Job Flow
  {
    id: "job-customer-complete",
    section: "job-flow1",
    role: "admin",
    page: "/dashboard/jobs/new",
    message: "Make sure all customer fields are complete before continuing. Add any missing details such as job value or description of improvement.",
    xPercent: 58,
    yPercent: 50,
    zIndex: 9999,
  }, 
  {
    id: "job-add-doc",
    section: "job-flow1",
    role: "admin",
    page: "/dashboard/jobs/new",
    message: "Once the customer information is ready, click 'Add Document' to begin selecting the required documents for this job.",
    xPercent: 52,
    yPercent: 25,
    zIndex: 9999,
  },
  {
    id: "job-doc-filters",
    section: "job-flow1",
    role: "admin",
    page: "/dashboard/jobs/new",
    message: "Use the filters or browse the folder structure to find the documents needed for the county and municipality where the property is located.",
    xPercent: 78,
    yPercent: 50,
    zIndex: 9999,
  },
  {
    id: "job-doc-confirm",
    section: "job-flow1",
    role: "admin",
    page: "/dashboard/jobs/new",
    message: "Select the documents you need and click 'Confirm Selection' to attach them to the job.",
    xPercent: 78,
    yPercent: 63,
    zIndex: 9999,
  },
  {
    id: "job-preview",
    section: "job-flow1",
    role: "admin",
    page: "/dashboard/jobs/new",
    message: "When everything looks correct, click 'Save & Preview' to generate the documents.",
    xPercent: 78,
    yPercent: 73,
    zIndex: 9999,
  },

  // Review Docs
  {
    id: "job-review-preview",
    section: "job-flow1",
    role: "admin",
    page: "/dashboard/jobs/preview",
    message: "Review the generated documents. If adjustments are needed, you can edit the fields directly on this page before downloading.",
    xPercent: 38,
    yPercent: 50,
    zIndex: 9999,
  },
  {
    id: "job-save-doc",
    section: "job-flow1",
    role: "admin",
    page: "/dashboard/jobs/preview",
    message: "If changes were made, use the document’s 'download' icon. Otherwise, you can download the document using the 'Open / Download' button.",
    xPercent: 79,
    yPercent: 40,
    zIndex: 9999,
  },
  {
    id: "job-finish",
    section: "job-flow1",
    role: "admin",
    page: "/dashboard/jobs/preview",
    message: "Once your documents are saved and downloaded, you’ve completed your first job! You can start another or return to the dashboard.",
    xPercent: 61,
    yPercent: 75,
    zIndex: 9999,
  }, 
  {
    id: "job-tutorial-complete",
    section: "job-flow1",
    role: "admin",
    page: "/dashboard/jobs/preview",
    message: "This concludes the tutorial! You can revisit any section at any time from the 'Settings' tab under User Preferences.",
    xPercent: 38,
    yPercent: 50,
    zIndex: 9999,
  },
];

/* ---------------------------------------------------------------------- */
/* ---------------------- DYNAMIC ENGINE HELPERS ------------------------ */
/* ---------------------------------------------------------------------- */

export function getStepsForSection(section: string, role: "admin" | "user") {
  return tutorialSteps.filter(s => s.section === section && s.role === role);
}

export function getStep(section: string, stepIndex: number, role: "admin" | "user") {
  const steps = getStepsForSection(section, role);
  return steps[stepIndex] ?? null;
}
