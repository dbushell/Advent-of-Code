import { Byte, type State } from "./main.ts";

export enum Color {
  Black = 30,
  Red = 31,
  Green = 32,
  Yellow = 33,
  Blue = 34,
  Purple = 35,
  Cyan = 36,
  White = 37,
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
) => (`\x1b[${bold ? "1" : "0"};${color}m${text}\x1b[0m`);

export const dim = (text: unknown) => (`\x1b[2m${text}\x1b[0m`);

export const print = (state: State): string => {
  let xAxis = " ";
  for (let x = 0; x < state.memory.length; x++) {
    xAxis += ` ${color(String(x).at(-1)!, Color.Purple)}`;
  }
  let out = `${xAxis}\n`;
  for (let y = 0; y < state.memory.length; y++) {
    const yAxis = color(String(y).at(-1)!, Color.Purple);
    out += yAxis;
    for (let x = 0; x < state.memory[y].length; x++) {
      if (state.memory[y][x] === Byte.Corrupted) {
        out += ` ${color(`#`, Color.Red)}`;
        continue;
      }
      if (state.memory[y][x] === Byte.Santa) {
        out += ` ${color(`*`, Color.Yellow)}`;
        continue;
      }
      out += ` ${dim(`.`)}`;
    }
    out += ` ${yAxis}\n`;
  }
  out += `${xAxis}\n`;
  return `${out}\n`;
};
