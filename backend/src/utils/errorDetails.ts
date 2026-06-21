export const errorDetails = (error: any): string | undefined =>
  process.env.NODE_ENV !== 'production' ? String(error?.message ?? '') : undefined;
