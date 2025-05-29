export class FileAttachment {
  constructor(
    public readonly id: string,
    public readonly fileName: string,
    public readonly fileSize: number, // in bytes
    public readonly mimeType: string,
    public readonly url: string,
    public readonly uploadedAt: Date = new Date()
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.fileName || this.fileName.trim().length === 0) {
      throw new Error('File must have a name');
    }
    
    if (this.fileSize < 0) {
      throw new Error('File size cannot be negative');
    }
    
    if (!this.url || this.url.trim().length === 0) {
      throw new Error('File must have a URL');
    }
  }

  get extension(): string {
    const parts = this.fileName.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }

  get sizeInKB(): number {
    return Math.round(this.fileSize / 1024);
  }

  get sizeInMB(): number {
    return Math.round(this.fileSize / (1024 * 1024) * 10) / 10;
  }

  get humanReadableSize(): string {
    if (this.fileSize < 1024) {
      return `${this.fileSize} B`;
    } else if (this.fileSize < 1024 * 1024) {
      return `${this.sizeInKB} KB`;
    } else {
      return `${this.sizeInMB} MB`;
    }
  }

  isImage(): boolean {
    return this.mimeType.startsWith('image/');
  }

  isPDF(): boolean {
    return this.mimeType === 'application/pdf';
  }

  isDocument(): boolean {
    const documentTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];
    return documentTypes.includes(this.mimeType);
  }

  getIcon(): string {
    if (this.isImage()) return '🖼️';
    if (this.isPDF()) return '📄';
    if (this.isDocument()) return '📋';
    return '📎';
  }
}