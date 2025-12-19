export type PhaseStatus = "not-started" | "in-progress" | "completed" | "blocked";

export interface PhaseField {
  id: string;
  label: string;
  value: string | boolean | number;
  type: "text" | "boolean" | "progress" | "date" | "select";
  adminOnly?: boolean;
  options?: string[];
}

export interface ProjectPhase {
  id: string;
  name: string;
  customName?: string;
  description: string;
  status: PhaseStatus;
  progress: number;
  order: number;
  isVisible: boolean;
  adminFields: PhaseField[];
  clientFields: PhaseField[];
  notes?: string;
  adminNotes?: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  clientId: string;
  clientName: string;
  currentPhase: number;
  phases: ProjectPhase[];
  createdAt: string;
  updatedAt: string;
}

export const defaultPhases: Omit<ProjectPhase, "id">[] = [
  {
    name: "Discovery & Onboarding",
    description: "Align expectations and gather requirements",
    status: "not-started",
    progress: 0,
    order: 1,
    isVisible: true,
    adminFields: [
      { id: "kickoff", label: "Project Kickoff Status", value: "Not Started", type: "select", options: ["Not Started", "Scheduled", "Completed"] },
      { id: "requirements", label: "Requirements Gathered", value: "In Progress", type: "select", options: ["Not Started", "In Progress", "Completed"] },
      { id: "briefReceived", label: "Client Brief Received", value: false, type: "boolean" },
      { id: "timelinesConfirmed", label: "Initial Timelines Confirmed", value: false, type: "boolean" },
    ],
    clientFields: [
      { id: "projectStarted", label: "Project Officially Started", value: false, type: "boolean" },
      { id: "briefStatus", label: "Brief Status", value: "Pending", type: "text" },
      { id: "onboardingProgress", label: "Onboarding Progress", value: 0, type: "progress" },
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    name: "Planning & Strategy",
    description: "Translate requirements into a structured execution plan",
    status: "not-started",
    progress: 0,
    order: 2,
    isVisible: true,
    adminFields: [
      { id: "roadmap", label: "Project Roadmap", value: "Not Created", type: "select", options: ["Not Created", "Draft", "Finalized"] },
      { id: "milestones", label: "Milestones & Timelines", value: "Pending", type: "select", options: ["Pending", "Defined", "Approved"] },
      { id: "scopeConfirmed", label: "Scope Confirmation", value: false, type: "boolean" },
      { id: "strategyApproval", label: "Strategy Approval Status", value: "Awaiting", type: "select", options: ["Awaiting", "Submitted", "Approved", "Revision Needed"] },
    ],
    clientFields: [
      { id: "approvedPlan", label: "Approved Plan", value: "Pending", type: "text" },
      { id: "milestoneSchedule", label: "Milestone Schedule", value: "Not Available", type: "text" },
      { id: "readiness", label: "Overall Readiness", value: 0, type: "progress" },
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    name: "Execution & Development",
    description: "Build, create, and implement the project",
    status: "not-started",
    progress: 0,
    order: 3,
    isVisible: true,
    adminFields: [
      { id: "tasksInProgress", label: "Tasks In Progress", value: "0", type: "text" },
      { id: "deliverablesCompleted", label: "Deliverables Completed", value: "0", type: "text" },
      { id: "percentageProgress", label: "Percentage Progress", value: 0, type: "progress" },
      { id: "internalNotes", label: "Internal Notes", value: "", type: "text", adminOnly: true },
    ],
    clientFields: [
      { id: "liveProgress", label: "Live Progress", value: 0, type: "progress" },
      { id: "activeDeliverables", label: "Active Deliverables", value: "None", type: "text" },
      { id: "currentWork", label: "Currently Working On", value: "Pending start", type: "text" },
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    name: "Review, Testing & Revisions",
    description: "Client feedback, testing, and refinements",
    status: "not-started",
    progress: 0,
    order: 4,
    isVisible: true,
    adminFields: [
      { id: "submittedForReview", label: "Deliverables Submitted for Review", value: "0", type: "text" },
      { id: "revisionsRequested", label: "Revisions Requested", value: "0", type: "text" },
      { id: "revisionsCompleted", label: "Revisions Completed", value: "0", type: "text" },
      { id: "testingStatus", label: "Testing Status", value: "Not Started", type: "select", options: ["Not Started", "In Progress", "Completed", "Issues Found"] },
      { id: "approvalCheckpoints", label: "Approval Checkpoints", value: "0/0", type: "text" },
    ],
    clientFields: [
      { id: "awaitingReview", label: "Items Awaiting Your Review", value: "0", type: "text" },
      { id: "revisionRounds", label: "Revision Rounds", value: "0", type: "text" },
      { id: "approvalProgress", label: "Approval Progress", value: 0, type: "progress" },
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    name: "Final Delivery & Closure",
    description: "Project handover and close-out",
    status: "not-started",
    progress: 0,
    order: 5,
    isVisible: true,
    adminFields: [
      { id: "finalDeliverables", label: "Final Deliverables Uploaded", value: false, type: "boolean" },
      { id: "markedComplete", label: "Project Marked as Completed", value: false, type: "boolean" },
      { id: "closureNotes", label: "Closure Notes", value: "", type: "text" },
      { id: "supportPeriod", label: "Optional Support Period", value: "None", type: "select", options: ["None", "1 Week", "2 Weeks", "1 Month", "3 Months"] },
    ],
    clientFields: [
      { id: "completedStatus", label: "Project Completed Status", value: false, type: "boolean" },
      { id: "assetsAvailable", label: "Final Assets Available", value: false, type: "boolean" },
      { id: "completionConfirmed", label: "Completion Confirmation", value: "Pending", type: "text" },
    ],
    updatedAt: new Date().toISOString(),
  },
];

export const mockProject: Project = {
  id: "proj-001",
  name: "E-commerce Platform Redesign",
  description: "Complete redesign of the online shopping experience with modern UI/UX principles",
  clientId: "client-001",
  clientName: "TechCorp Ltd",
  currentPhase: 3,
  phases: defaultPhases.map((phase, index) => ({
    ...phase,
    id: `phase-${index + 1}`,
    status: index < 2 ? "completed" : index === 2 ? "in-progress" : "not-started",
    progress: index < 2 ? 100 : index === 2 ? 65 : 0,
  })),
  createdAt: "2024-01-15T10:00:00Z",
  updatedAt: new Date().toISOString(),
};
