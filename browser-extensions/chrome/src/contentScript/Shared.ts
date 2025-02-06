/**
 * Check if the current theme is dark.
 */
export function isDarkMode(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}