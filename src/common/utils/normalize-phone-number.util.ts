export function normalizePhoneNumber(input:string):string {
  // Remove any whitespace, dashes, or other non-digit characters
    const cleaned = input.replace(/[^0-9+]/g, '');
    if (cleaned.startsWith('+82') && cleaned.length === 13) {
      return cleaned;
    } else if (cleaned.startsWith('82') && cleaned.length === 12) {
      return '+' + cleaned;
    } else if (cleaned.startsWith('0') && cleaned.length === 11) {
      return '+82' + cleaned.slice(1);
    } else {
      throw {
        message: 'Invalid phone number format',
        status: 400,
      };
    }
}