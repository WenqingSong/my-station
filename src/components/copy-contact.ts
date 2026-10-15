export const CONTACT_EMAIL = '1784870640@qq.com';

export async function copyEmail(clipboard?: Pick<Clipboard, 'writeText'>, deadlineMs = 1800): Promise<'copied' | 'manual'> {
  if (!clipboard) return 'manual';
  let deadline: ReturnType<typeof setTimeout> | undefined;
  try {
    // Some browser permission prompts leave this promise pending indefinitely.
    // A late resolution must not overwrite the manual-copy state.
    return await Promise.race([
      clipboard.writeText(CONTACT_EMAIL).then(() => 'copied' as const),
      new Promise<'manual'>(resolve => { deadline = setTimeout(() => resolve('manual'), deadlineMs); })
    ]);
  } catch {
    // A blocked clipboard must never be reported as a successful copy.
    return 'manual';
  } finally {
    clearTimeout(deadline);
  }
}
