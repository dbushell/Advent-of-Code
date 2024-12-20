import { assert } from "jsr:@std/assert/assert";
import { getXY, hasXY, sameXY } from "./helpers.ts";
import { Cell, type State, type XY } from "./types.ts";

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
  for (let x = 0; x < state.grid.length; x++) {
    xAxis += ` ${dim(String(x).at(-1)!)}`;
  }
  let out = `${xAxis}\n`;
  const route = state.routes.get("draw") || state.routes.get(state.drawRoute)!;
  assert(route, "No route to draw");
  const ps = hasXY(route, state.current);
  for (let y = 0; y < state.grid.length; y++) {
    const yAxis = dim(String(y).at(-1)!);
    out += yAxis;
    for (let x = 0; x < state.grid[y].length; x++) {
      const cell = getXY(state, { x, y });
      let char = "";
      // Draw wall
      if (cell === Cell.Wall) {
        char = color(`■`, Color.Red);
      } // Draw cheat
      else if (cell === Cell.Cheat) {
        char = color(`□`, Color.Red);
      } // Draw start
      // Draw empty
      else {
        char = dim(Cell.Empty);
      }
      // Draw route
      const has = hasXY(route, { x, y });
      if (has >= 0) {
        if (has < ps) {
          char = color("⁕", Color.Cyan);
        } else {
          char = color("*", Color.Cyan);
        }
      }
      // Draw current
      if (sameXY({ x, y }, state.current)) {
        char = color("✱", Color.Yellow);
      }
      // Draw start
      if (sameXY({ x, y }, state.start)) {
        char = color("☆", Color.Green);
      }
      // Draw end
      if (sameXY({ x, y }, state.end)) {
        char = color("★", Color.Green);
      }
      out += ` ${char}`;
    }
    out += ` ${yAxis}\n`;
  }
  out += `${xAxis}\n`;
  return `${out}\n`;
};
