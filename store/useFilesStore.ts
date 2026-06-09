import { create } from 'zustand';
import { FileEntry } from '@/lib/types';

interface FilesState {
  currentPath: string;
  files: FileEntry[];
  loadingFiles: boolean;
  fileError: string | null;
  editingFile: FileEntry | null;
  fileContent: string;
  savingFile: boolean;
  newFileName: string;
  isCreatingDir: boolean;

  setCurrentPath: (path: string) => void;
  setFiles: (files: FileEntry[]) => void;
  setLoadingFiles: (loading: boolean) => void;
  setFileError: (error: string | null) => void;
  setEditingFile: (file: FileEntry | null) => void;
  setFileContent: (content: string) => void;
  setSavingFile: (saving: boolean) => void;
  setNewFileName: (name: string) => void;
  setIsCreatingDir: (isDir: boolean) => void;
}

export const useFilesStore = create<FilesState>((set) => ({
  currentPath: "",
  files: [],
  loadingFiles: false,
  fileError: null,
  editingFile: null,
  fileContent: "",
  savingFile: false,
  newFileName: "",
  isCreatingDir: false,

  setCurrentPath: (path) => set({ currentPath: path }),
  setFiles: (files) => set({ files }),
  setLoadingFiles: (loading) => set({ loadingFiles: loading }),
  setFileError: (error) => set({ fileError: error }),
  setEditingFile: (file) => set({ editingFile: file }),
  setFileContent: (content) => set({ fileContent: content }),
  setSavingFile: (saving) => set({ savingFile: saving }),
  setNewFileName: (name) => set({ newFileName: name }),
  setIsCreatingDir: (isDir) => set({ isCreatingDir: isDir }),
}));
