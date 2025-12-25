// This is NOT a React component - just a utility file

export function formatDate(date: Date): string {
  return date.toISOString();
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export const API_URL = 'https://api.example.com';
