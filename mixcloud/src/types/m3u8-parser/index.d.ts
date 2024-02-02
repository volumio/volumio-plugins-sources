declare module 'm3u8-parser' {
  export class Parser {
    manifest: Manifest;

    push(manifest: string): void;
    end(): void;
  }
  export interface Manifest {
    playlists?: { attributes?: any }[];
  }
}
