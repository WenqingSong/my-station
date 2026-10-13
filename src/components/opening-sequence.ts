// Keep timing independent of rendering so the eight-word rhythm is testable.
export const GREETINGS = [
  { text: '你好', locale: 'zh-CN', script: 'cjk', hold: .50 },
  { text: 'Bonjour', locale: 'fr', script: 'latin', hold: .22 },
  { text: 'Hola', locale: 'es', script: 'latin', hold: .22 },
  { text: 'Ciao', locale: 'it', script: 'latin', hold: .22 },
  { text: 'Hallo', locale: 'de', script: 'latin', hold: .22 },
  { text: 'Olá', locale: 'pt', script: 'latin', hold: .22 },
  { text: 'こんにちは', locale: 'ja', script: 'cjk', hold: .30 },
  { text: 'Hello', locale: 'en', script: 'latin', hold: .55 }
] as const;

export const OPENING_MOTION = {
  lead: .12,
  enter: .26,
  enterStagger: .012,
  exit: .24,
  exitStagger: .008,
  overlapGap: .065,
  curtain: .82,
  fontDeadlineMs: 450,
  safetyDeadlineMs: 9000
} as const;

export function openingSchedule() {
  let at = OPENING_MOTION.lead as number;
  const words = GREETINGS.map(greeting => {
    const count = Array.from(greeting.text).length;
    const enterAt = at;
    const holdAt = enterAt + OPENING_MOTION.enter + (count - 1) * OPENING_MOTION.enterStagger;
    const leaveAt = holdAt + greeting.hold;
    const hiddenAt = leaveAt + OPENING_MOTION.exit + (count - 1) * OPENING_MOTION.exitStagger;
    at = leaveAt + OPENING_MOTION.overlapGap;
    return { ...greeting, enterAt, holdAt, leaveAt, hiddenAt };
  });
  const curtainAt = words[words.length - 1].leaveAt;
  return { words, curtainAt, duration: curtainAt + OPENING_MOTION.curtain };
}
