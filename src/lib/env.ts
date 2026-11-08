export const apiBaseUrl = readApiBaseUrl();

function readApiBaseUrl() {
  const value = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, '');
  if (!value) {
    throw new Error('Set NEXT_PUBLIC_API_URL in bliss_erp_frontend/.env');
  }
  return value;
}
