export interface DisplayOutput {
  name: string;
  enabled: boolean;
  primary?: boolean;
  rotation?: "normal" | "left" | "right" | "inverted";
  mode?: string;
  position?: [number, number];
}

export interface Profile {
  outputs: DisplayOutput[];
}
