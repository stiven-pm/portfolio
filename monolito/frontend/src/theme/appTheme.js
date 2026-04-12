import { createTheme } from '@mantine/core';

/** Morado principal (#7c3aed); Chillax títulos, Neue Montreal cuerpo */
export const appTheme = createTheme({
  primaryColor: 'brand',
  defaultRadius: 'md',
  fontFamily: 'var(--font-body)',
  headings: {
    fontFamily: 'var(--font-heading)',
    fontWeight: '600',
  },
  colors: {
    brand: [
      '#faf5ff',
      '#f3e8ff',
      '#e9d5ff',
      '#d8b4fe',
      '#c084fc',
      '#a855f7',
      '#7c3aed',
      '#6d28d9',
      '#5b21b6',
      '#4c1d95',
    ],
  },
});
