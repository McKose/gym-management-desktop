export interface ElectronAPI {
  readData: (key: string) => Promise<any>;
  saveData: (key: string, data: any) => Promise<{ success: boolean; error?: string }>;
}

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}
