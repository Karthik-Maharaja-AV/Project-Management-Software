import { create } from "zustand";

type UiState = {
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;

  createIssueOpen: boolean;
  createIssueDefaults: { status?: string; sprintId?: string; epicId?: string } | null;
  openCreateIssue: (defaults?: UiState["createIssueDefaults"]) => void;
  closeCreateIssue: () => void;

  createProjectOpen: boolean;
  openCreateProject: () => void;
  closeCreateProject: () => void;
};

export const useUiStore = create<UiState>((set) => ({
  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

  createIssueOpen: false,
  createIssueDefaults: null,
  openCreateIssue: (defaults) => set({ createIssueOpen: true, createIssueDefaults: defaults ?? null }),
  closeCreateIssue: () => set({ createIssueOpen: false, createIssueDefaults: null }),

  createProjectOpen: false,
  openCreateProject: () => set({ createProjectOpen: true }),
  closeCreateProject: () => set({ createProjectOpen: false }),
}));
