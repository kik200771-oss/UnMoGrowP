import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Утилита для объединения Tailwind классов
 * Используется во всех Shadcn компонентах
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
