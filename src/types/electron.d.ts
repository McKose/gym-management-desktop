export interface ElectronAPI {
  readData: (key: string) => Promise<unknown>;
  saveData: (key: string, data: unknown) => Promise<{ success: boolean; error?: string }>;
  fetchData: (key: string) => Promise<{ data: unknown }>;
}

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}
