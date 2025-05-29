export interface UploadResult {
  url: string;
  publicId?: string;
  size: number;
}

export interface IFileStorageService {
  /**
   * Upload a file to storage
   */
  uploadFile(file: File): Promise<UploadResult>;
  
  /**
   * Delete a file from storage
   */
  deleteFile(url: string): Promise<void>;
  
  /**
   * Get a temporary download URL for a file
   */
  getDownloadUrl(url: string): Promise<string>;
  
  /**
   * Check if a file exists
   */
  fileExists(url: string): Promise<boolean>;
}