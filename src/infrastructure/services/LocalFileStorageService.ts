import { type IFileStorageService, type UploadResult } from '../../application/interfaces/IFileStorageService';

export class LocalFileStorageService implements IFileStorageService {
  private readonly STORAGE_KEY_PREFIX = 'file_storage_';
  
  async uploadFile(file: File): Promise<UploadResult> {
    // In a real implementation, this would upload to cloud storage
    // For now, we'll store files as base64 in localStorage (not recommended for production)
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        const fileId = `${Date.now()}_${file.name}`;
        const storageKey = `${this.STORAGE_KEY_PREFIX}${fileId}`;
        
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem(storageKey, base64);
          }
          
          resolve({
            url: `local://${fileId}`,
            publicId: fileId,
            size: file.size
          });
        } catch (error) {
          reject(new Error('Failed to store file locally'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsDataURL(file);
    });
  }
  
  async deleteFile(url: string): Promise<void> {
    if (!url.startsWith('local://')) {
      throw new Error('Invalid local file URL');
    }
    
    const fileId = url.replace('local://', '');
    const storageKey = `${this.STORAGE_KEY_PREFIX}${fileId}`;
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem(storageKey);
    }
  }
  
  async getDownloadUrl(url: string): Promise<string> {
    if (!url.startsWith('local://')) {
      return url; // Return as-is if not a local URL
    }
    
    const fileId = url.replace('local://', '');
    const storageKey = `${this.STORAGE_KEY_PREFIX}${fileId}`;
    
    if (typeof window !== 'undefined') {
      const base64Data = localStorage.getItem(storageKey);
      if (base64Data) {
        return base64Data; // Return the base64 data URL
      }
    }
    
    throw new Error('File not found');
  }
  
  async fileExists(url: string): Promise<boolean> {
    if (!url.startsWith('local://')) {
      // For non-local URLs, assume they exist
      return true;
    }
    
    const fileId = url.replace('local://', '');
    const storageKey = `${this.STORAGE_KEY_PREFIX}${fileId}`;
    
    if (typeof window !== 'undefined') {
      return localStorage.getItem(storageKey) !== null;
    }
    
    return false;
  }
}