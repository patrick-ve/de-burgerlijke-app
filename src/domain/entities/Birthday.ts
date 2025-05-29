export class Birthday {
  constructor(
    public readonly id: string,
    public name: string,
    public date: Date,
    public birthYear?: number,
    public notes?: string,
    public reminderDays: number = 7,
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  getAge(asOfDate: Date = new Date()): number | null {
    if (!this.birthYear) return null;
    
    const birthDate = new Date(this.birthYear, this.date.getMonth(), this.date.getDate());
    let age = asOfDate.getFullYear() - birthDate.getFullYear();
    const monthDiff = asOfDate.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && asOfDate.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  getNextBirthday(fromDate: Date = new Date()): Date {
    const year = fromDate.getFullYear();
    let nextBirthday = new Date(year, this.date.getMonth(), this.date.getDate());
    
    if (nextBirthday < fromDate) {
      nextBirthday = new Date(year + 1, this.date.getMonth(), this.date.getDate());
    }
    
    return nextBirthday;
  }

  getDaysUntilBirthday(fromDate: Date = new Date()): number {
    const nextBirthday = this.getNextBirthday(fromDate);
    const diffTime = nextBirthday.getTime() - fromDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  shouldShowReminder(fromDate: Date = new Date()): boolean {
    const daysUntil = this.getDaysUntilBirthday(fromDate);
    return daysUntil <= this.reminderDays && daysUntil >= 0;
  }

  updateName(name: string): void {
    this.name = name;
    this.updatedAt = new Date();
  }

  updateDate(date: Date): void {
    this.date = date;
    this.updatedAt = new Date();
  }

  setBirthYear(year: number | undefined): void {
    this.birthYear = year;
    this.updatedAt = new Date();
  }

  setReminderDays(days: number): void {
    if (days < 0) {
      throw new Error('Reminder days must be non-negative');
    }
    this.reminderDays = days;
    this.updatedAt = new Date();
  }

  validate(): boolean {
    if (!this.name || this.name.trim() === '') {
      throw new Error('Name is required');
    }

    if (this.birthYear && (this.birthYear < 1900 || this.birthYear > new Date().getFullYear())) {
      throw new Error('Birth year must be between 1900 and current year');
    }

    return true;
  }
}