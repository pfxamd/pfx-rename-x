import type { RenameInput } from "@pfxamd/rename-x";

export interface AppFile {
  id: string;
  file: File;
  input: RenameInput;
}
