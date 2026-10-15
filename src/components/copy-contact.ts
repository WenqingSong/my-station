export const CONTACT_EMAIL = '1784870640@qq.com';

export async function copyEmail(clipboard?: Pick<Clipboard, 'writeText'>): Promise<'copied' | 'manual'> {
  if (!clipboard) return 'manual';
  try {
    await clipboard.writeText(CONTACT_EMAIL);
    return 'copied';
  } catch {
    // A blocked clipboard must never be reported as a successful copy.
    return 'manual';
  }
}
