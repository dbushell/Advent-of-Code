export enum Color {
  Black = 30,
  Red = 31,
  Green = 32,
  Yellow = 33,
  Blue = 34,
  Purple = 35,
  Cyan = 36,
  White = 37,
  Dim = 0,
}

const encoder = new TextEncoder();

export const write = (text: string) =>
  Deno.stdout.writeSync(encoder.encode(text));

export const screen = {
  clear: () => write("\x1b[2J\x1b[H"),
  hideCursor: () => write("\x1b[?25l"),
  showCursor: () => write("\x1b[?25h"),
};

export const color = (
  text: unknown,
  color: Color,
  bold?: boolean,
) => {
  if (color === Color.Dim) {
    return (`\x1b[2m${text}\x1b[0m`);
  }
  return (`\x1b[${bold ? "1" : "0"};${color}m${text}\x1b[0m`);
};
