export type HolidayItemCategory = 'documents' | 'clothing' | 'toiletries' | 'electronics' | 'health' | 'other';

export class HolidayChecklistItem {
  constructor(
    public readonly id: string,
    public name: string,
    public category: HolidayItemCategory,
    public isChecked: boolean = false,
    public quantity: number = 1,
    public notes?: string,
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  toggle(): void {
    this.isChecked = !this.isChecked;
    this.updatedAt = new Date();
  }

  check(): void {
    if (!this.isChecked) {
      this.isChecked = true;
      this.updatedAt = new Date();
    }
  }

  uncheck(): void {
    if (this.isChecked) {
      this.isChecked = false;
      this.updatedAt = new Date();
    }
  }

  updateName(name: string): void {
    this.name = name;
    this.updatedAt = new Date();
  }

  updateCategory(category: HolidayItemCategory): void {
    this.category = category;
    this.updatedAt = new Date();
  }

  updateQuantity(quantity: number): void {
    if (quantity < 1) {
      throw new Error('Quantity must be at least 1');
    }
    this.quantity = quantity;
    this.updatedAt = new Date();
  }

  updateNotes(notes: string | undefined): void {
    this.notes = notes;
    this.updatedAt = new Date();
  }

  validate(): boolean {
    if (!this.name || this.name.trim() === '') {
      throw new Error('Name is required');
    }

    if (this.quantity < 1) {
      throw new Error('Quantity must be at least 1');
    }

    const validCategories: HolidayItemCategory[] = ['documents', 'clothing', 'toiletries', 'electronics', 'health', 'other'];
    if (!validCategories.includes(this.category)) {
      throw new Error('Invalid category');
    }

    return true;
  }
}

export class HolidayChecklist {
  constructor(
    public id: string,
    public name: string,
    public items: HolidayChecklistItem[] = [],
    public tripDate?: Date,
    public destination?: string,
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  addItem(item: HolidayChecklistItem): void {
    this.items.push(item);
    this.updatedAt = new Date();
  }

  removeItem(itemId: string): void {
    const index = this.items.findIndex(item => item.id === itemId);
    if (index > -1) {
      this.items.splice(index, 1);
      this.updatedAt = new Date();
    }
  }

  getItem(itemId: string): HolidayChecklistItem | undefined {
    return this.items.find(item => item.id === itemId);
  }

  getItemsByCategory(category: HolidayItemCategory): HolidayChecklistItem[] {
    return this.items.filter(item => item.category === category);
  }

  getCheckedItems(): HolidayChecklistItem[] {
    return this.items.filter(item => item.isChecked);
  }

  getUncheckedItems(): HolidayChecklistItem[] {
    return this.items.filter(item => !item.isChecked);
  }

  getProgress(): { checked: number; total: number; percentage: number } {
    const checked = this.items.filter(item => item.isChecked).length;
    const total = this.items.length;
    const percentage = total === 0 ? 0 : Math.round((checked / total) * 100);
    
    return { checked, total, percentage };
  }

  checkAllInCategory(category: HolidayItemCategory): void {
    this.items
      .filter(item => item.category === category)
      .forEach(item => item.check());
    this.updatedAt = new Date();
  }

  uncheckAll(): void {
    this.items.forEach(item => item.uncheck());
    this.updatedAt = new Date();
  }

  clone(): HolidayChecklist {
    const cloned = new HolidayChecklist(
      this.id + '-clone',
      this.name + ' (copy)',
      this.items.map(item => new HolidayChecklistItem(
        item.id + '-clone',
        item.name,
        item.category,
        false, // Reset checked state
        item.quantity,
        item.notes
      )),
      this.tripDate,
      this.destination
    );
    return cloned;
  }

  validate(): boolean {
    if (!this.name || this.name.trim() === '') {
      throw new Error('Checklist name is required');
    }

    this.items.forEach(item => item.validate());

    return true;
  }
}