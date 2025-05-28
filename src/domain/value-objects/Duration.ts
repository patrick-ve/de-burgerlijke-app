export class Duration {
  constructor(public readonly minutes: number) {
    if (minutes < 0) {
      throw new Error('Duration cannot be negative');
    }
  }

  get hours(): number {
    return Math.floor(this.minutes / 60);
  }

  get remainingMinutes(): number {
    return this.minutes % 60;
  }

  toString(): string {
    if (this.minutes < 60) {
      return `${this.minutes}min`;
    }
    
    const h = this.hours;
    const m = this.remainingMinutes;
    
    if (m === 0) {
      return `${h}h`;
    }
    
    return `${h}h ${m}min`;
  }

  static fromHoursAndMinutes(hours: number, minutes: number): Duration {
    return new Duration(hours * 60 + minutes);
  }

  static parse(text: string): Duration {
    const hoursMatch = text.match(/(\d+)\s*h/);
    const minutesMatch = text.match(/(\d+)\s*min/);
    
    let totalMinutes = 0;
    
    if (hoursMatch) {
      totalMinutes += parseInt(hoursMatch[1]) * 60;
    }
    
    if (minutesMatch) {
      totalMinutes += parseInt(minutesMatch[1]);
    }
    
    if (totalMinutes === 0 && !hoursMatch && !minutesMatch) {
      const plainNumber = parseInt(text);
      if (!isNaN(plainNumber)) {
        totalMinutes = plainNumber;
      }
    }
    
    return new Duration(totalMinutes);
  }
}