/**
 * Shared constants — mirrors backend/app/core/constants.py.
 * Keep both files in sync when updating.
 */

import type { AppStatus } from "@/types";

export const APP_STATUSES: AppStatus[] = [
  "unverified", "lead", "pre_evaluation", "docs_collection", "applied",
  "offer_received", "conditional_offer", "visa_stage", "enrolled",
  "rejected", "withdrawn", "junk",
];

export const STATUS_LABELS: Record<AppStatus, string> = {
  unverified: "Unverified",
  lead: "Enquiry Received",
  pre_evaluation: "Profile Evaluated",
  docs_collection: "Documents Needed",
  applied: "Application Submitted",
  offer_received: "Offer Letter Received!",
  conditional_offer: "Conditional Offer",
  visa_stage: "Visa Stage",
  enrolled: "Enrolled — Congrats!",
  rejected: "Application Update",
  withdrawn: "Application Withdrawn",
  junk: "Junk Lead",
};

export const STATUS_TRANSITIONS: Record<string, string[]> = {
  unverified: ["lead"],
  lead: ["pre_evaluation", "junk", "withdrawn"],
  pre_evaluation: ["docs_collection", "junk", "rejected", "withdrawn"],
  docs_collection: ["applied", "withdrawn"],
  applied: ["offer_received", "conditional_offer", "rejected", "withdrawn"],
  offer_received: ["visa_stage", "withdrawn"],
  conditional_offer: ["docs_collection", "offer_received", "rejected", "withdrawn"],
  visa_stage: ["enrolled", "withdrawn"],
  enrolled: [],
  rejected: [],
  withdrawn: [],
  junk: [],
};

export const PIPELINE_STATUSES = [
  "invited", "onboarding", "gathering_docs",
  "ready_to_apply", "applied", "enrolled",
] as const;

export const DEGREE_LEVELS = ["bachelor", "master", "phd", "diploma"] as const;

export const DOC_TYPES = [
  "passport", "transcript", "sop", "lor", "cv",
  "ielts_cert", "toefl_cert", "ielts", "toefl",
  "gre", "gmat", "nid", "other",
  "pte", "duolingo", "sat",
] as const;

export const VERIFICATION_STATUSES = ["pending_review", "verified", "rejected"] as const;

export const CONSULTANT_STATUSES = ["pending", "active", "banned", "rejected"] as const;
