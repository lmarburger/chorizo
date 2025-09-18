/**
 * Shared type definitions for the Chorizo app
 * These types promote consistency across components and reduce duplication
 */

/**
 * Common interface for displayable items (chores and tasks)
 * Used by components that render both types uniformly
 */
export interface DisplayableItem {
  id: number | string;
  title: string;
  description?: string | null;
  isCompleted: boolean;
  isOverdue: boolean;
  isFuture: boolean;
  dayOrDate: string; // Either day abbreviation or date string
}

/**
 * Standard API response format
 */
export interface ApiResponse<T = unknown> {
  success?: boolean;
  error?: string;
  data?: T;
}

/**
 * Common form field validation
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Kid selection option for form dropdowns
 */
export interface KidOption {
  value: string;
  label: string;
}

/**
 * Standard loading state interface
 */
export interface LoadingState {
  loading: boolean;
  error: string | null;
}

/**
 * Dashboard item types for unified rendering
 */
export type DashboardItemType = "chore" | "task";

export interface DashboardItem {
  type: DashboardItemType;
  id: string;
  name: string;
  dayName?: string;
  dueDate?: Date;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  sortOrder: number;
  data: unknown; // Original chore or task data
}

/**
 * Form submission states
 */
export interface FormState extends LoadingState {
  submitting: boolean;
  success: string | null;
}
