import { type ITodoRepository } from '../../../domain/interfaces/ITodoRepository';
import { type IFileStorageService } from '../../interfaces/IFileStorageService';
import { FileAttachment } from '../../../domain/value-objects/FileAttachment';
import { createId } from '@paralleldrive/cuid2';

export interface AttachFileDTO {
  todoId: string;
  file: File;
}

export class AttachFileToTodo {
  constructor(
    private readonly todoRepository: ITodoRepository,
    private readonly fileStorageService: IFileStorageService
  ) {}

  async execute(dto: AttachFileDTO): Promise<FileAttachment> {
    const todo = await this.todoRepository.findById(dto.todoId);
    
    if (!todo) {
      throw new Error(`Todo with id ${dto.todoId} not found`);
    }

    // Upload file to storage
    const uploadResult = await this.fileStorageService.uploadFile(dto.file);
    
    // Create attachment
    const attachment = new FileAttachment(
      createId(),
      dto.file.name,
      dto.file.size,
      dto.file.type,
      uploadResult.url
    );
    
    // Add attachment to todo
    todo.addAttachment(attachment);
    
    // Save updated todo
    await this.todoRepository.update(todo);
    
    return attachment;
  }
}