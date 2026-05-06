export function isValidAlgeriaPhone(phone: string): boolean {
  return /^0\d{9}$/.test(phone) || /^\+213\d{9}$/.test(phone);
}
