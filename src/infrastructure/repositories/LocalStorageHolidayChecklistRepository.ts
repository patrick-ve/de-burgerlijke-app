import { type IHolidayChecklistRepository } from '../../domain/interfaces/IHolidayChecklistRepository';
import { HolidayChecklist, HolidayChecklistItem, type HolidayItemCategory } from '../../domain/entities/HolidayChecklistItem';

interface StoredChecklistItem {
  id: string;
  name: string;
  category: HolidayItemCategory;
  isChecked: boolean;
  quantity: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface StoredChecklist {
  id: string;
  name: string;
  items: StoredChecklistItem[];
  tripDate?: string;
  destination?: string;
  createdAt: string;
  updatedAt: string;
}

export class LocalStorageHolidayChecklistRepository implements IHolidayChecklistRepository {
  private readonly STORAGE_KEY = 'holidayChecklists';

  async findAll(): Promise<HolidayChecklist[]> {
    if (typeof window === 'undefined') return [];
    
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return [];

    try {
      const data: StoredChecklist[] = JSON.parse(stored);
      return data.map(checklist => new HolidayChecklist(
        checklist.id,
        checklist.name,
        checklist.items.map(item => new HolidayChecklistItem(
          item.id,
          item.name,
          item.category,
          item.isChecked,
          item.quantity,
          item.notes,
          new Date(item.createdAt),
          new Date(item.updatedAt)
        )),
        checklist.tripDate ? new Date(checklist.tripDate) : undefined,
        checklist.destination,
        new Date(checklist.createdAt),
        new Date(checklist.updatedAt)
      ));
    } catch (error) {
      console.error('Error parsing holiday checklists from localStorage:', error);
      return [];
    }
  }

  async findById(id: string): Promise<HolidayChecklist | null> {
    const checklists = await this.findAll();
    return checklists.find(c => c.id === id) || null;
  }

  async save(checklist: HolidayChecklist): Promise<void> {
    const checklists = await this.findAll();
    checklists.push(checklist);
    await this.saveAll(checklists);
  }

  async update(checklist: HolidayChecklist): Promise<void> {
    const checklists = await this.findAll();
    const index = checklists.findIndex(c => c.id === checklist.id);
    
    if (index === -1) {
      throw new Error(`Holiday checklist with id ${checklist.id} not found`);
    }
    
    checklists[index] = checklist;
    await this.saveAll(checklists);
  }

  async delete(id: string): Promise<void> {
    const checklists = await this.findAll();
    const filtered = checklists.filter(c => c.id !== id);
    
    if (filtered.length === checklists.length) {
      throw new Error(`Holiday checklist with id ${id} not found`);
    }
    
    await this.saveAll(filtered);
  }

  private async saveAll(checklists: HolidayChecklist[]): Promise<void> {
    if (typeof window === 'undefined') return;
    
    const data: StoredChecklist[] = checklists.map(checklist => ({
      id: checklist.id,
      name: checklist.name,
      items: checklist.items.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        isChecked: item.isChecked,
        quantity: item.quantity,
        notes: item.notes,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString()
      })),
      tripDate: checklist.tripDate?.toISOString(),
      destination: checklist.destination,
      createdAt: checklist.createdAt.toISOString(),
      updatedAt: checklist.updatedAt.toISOString()
    }));
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }
}