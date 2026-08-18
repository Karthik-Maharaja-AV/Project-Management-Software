import { create } from "zustand";

type UiState = {
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;

  /** Issue key (e.g. FDJ-12) currently open in the slide-over drawer, or null when closed. */
  activeIssueKey: string | null;
  openIssue: (key: string) => void;
  closeIssue: () => void;

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

  activeIssueKey: null,
  openIssue: (key) => set({ activeIssueKey: key }),
  closeIssue: () => set({ activeIssueKey: null }),

  createIssueOpen: false,
  createIssueDefaults: null,
  openCreateIssue: (defaults) => set({ createIssueOpen: true, createIssueDefaults: defaults ?? null }),
  closeCreateIssue: () => set({ createIssueOpen: false, createIssueDefaults: null }),

  createProjectOpen: false,
  openCreateProject: () => set({ createProjectOpen: true }),
  closeCreateProject: () => set({ createProjectOpen: false }),
}));
