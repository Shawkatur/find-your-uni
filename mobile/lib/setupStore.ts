import { create } from "zustand";
import { SetupWizardState } from "@/types";

interface SetupStore extends SetupWizardState {
  setDegree: (degree: SetupWizardState["degree"]) => void;
  setAcademic: (data: Partial<Pick<SetupWizardState, "ssc_gpa" | "hsc_gpa" | "bachelor_cgpa" | "gpa_percentage">>) => void;
  setTests: (data: Partial<Pick<SetupWizardState, "ielts" | "toefl" | "gre">>) => void;
  setPreferences: (countries: string[], fields: string[]) => void;
  setBudget: (budget: number) => void;
  setProfile: (full_name: string, phone?: string) => void;
  setRefCode: (code: string) => void;
  reset: () => void;
}

const defaults: SetupWizardState = {
  countries: [],
  fields: [],
  budget_usd_per_year: 15000,
};

export const useSetupStore = create<SetupStore>((set) => ({
  ...defaults,

  setDegree: (degree) => set({ degree }),
  setAcademic: (data) => set((s) => ({ ...s, ...data })),
  setTests: (data) => set((s) => ({ ...s, ...data })),
  setPreferences: (countries, fields) => set({ countries, fields }),
  setBudget: (budget_usd_per_year) => set({ budget_usd_per_year }),
  setProfile: (full_name, phone) => set({ full_name, phone }),
  setRefCode: (ref_code) => set({ ref_code }),
  reset: () => set(defaults),
}));
