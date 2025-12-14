// Test utilities for better test organization and reusability
import { formatDateString } from "./date-utils";

export interface TestChore {
  name: string;
  description?: string;
}

export interface TestTask {
  title: string;
  description?: string;
  kid_name: string;
  due_date: string;
}

// Common test data generators
export function createTestChore(suffix: string = ""): TestChore {
  return {
    name: `Test Chore ${suffix || Date.now()}`,
    description: `Description for test chore ${suffix}`,
  };
}

export function createTestTask(suffix: string = "", daysOffset: number = 1): TestTask {
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + daysOffset);

  return {
    title: `Test Task ${suffix || Date.now()}`,
    description: `Description for test task ${suffix}`,
    kid_name: "Test Kid",
    due_date: formatDateString(dueDate),
  };
}

// Date utilities for tests - re-export from date-utils for consistency
export function getTodayString(): string {
  return formatDateString(new Date());
}

export function getTomorrowString(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return formatDateString(tomorrow);
}

export function getYesterdayString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return formatDateString(yesterday);
}

export function getDayString(daysOffset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return formatDateString(date);
}

// Test assertion helpers
export function assertTestsCount(actual: number, expected: number, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

export function assertExists<T>(item: T | null | undefined, message: string): asserts item is T {
  if (!item) {
    throw new Error(`${message}: item does not exist`);
  }
}
