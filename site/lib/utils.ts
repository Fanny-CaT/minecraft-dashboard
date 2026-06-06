export const fmtMb = (b: number) => Math.round(b / (1024 * 1024));

export const fmtFileSize = (b?: number) => {
  if (b === undefined) return "–";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
};

export const stripAnsi = (s: string) => s.replace(/\u001b\[[0-9;]*[a-zA-Z]/g, "");

// Matches: [10:51:29 INFO]: <PlayerName> Hello world!
// Or:      [10:51:29 INFO]: [Server] Hello world!
// Or:      [10:51:29 INFO]: [agreeable_guy] Hello world!
export const CHAT_RE = /\[[\d:]+\s+INFO\]:\s+(?:\<([a-zA-Z0-9_]{2,16})\>|\[(Server|[a-zA-Z0-9_]{2,16})\])(?!:)\s+(.+)/;
