export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export class PriorityValue {
  constructor(public readonly value: Priority) {}

  static fromString(value: string): PriorityValue {
    const normalizedValue = value.toLowerCase();
    if (!this.isValidPriority(normalizedValue)) {
      throw new Error(`Invalid priority: ${value}`);
    }
    return new PriorityValue(normalizedValue as Priority);
  }

  private static isValidPriority(value: string): boolean {
    return ['low', 'medium', 'high', 'urgent'].includes(value);
  }

  toNumber(): number {
    const priorityMap: Record<Priority, number> = {
      low: 1,
      medium: 2,
      high: 3,
      urgent: 4
    };
    return priorityMap[this.value];
  }

  toString(): string {
    return this.value;
  }

  toDisplayString(): string {
    const displayMap: Record<Priority, string> = {
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      urgent: 'Urgent'
    };
    return displayMap[this.value];
  }

  getColor(): string {
    const colorMap: Record<Priority, string> = {
      low: 'gray',
      medium: 'blue',
      high: 'orange',
      urgent: 'red'
    };
    return colorMap[this.value];
  }

  isHigherThan(other: PriorityValue): boolean {
    return this.toNumber() > other.toNumber();
  }

  isLowerThan(other: PriorityValue): boolean {
    return this.toNumber() < other.toNumber();
  }

  equals(other: PriorityValue): boolean {
    return this.value === other.value;
  }
}