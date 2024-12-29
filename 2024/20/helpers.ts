import { assert } from "jsr:@std/assert/assert";
import { Cell, type State, type XY } from "./types.ts";

export const keyXY = (xy: XY) => (`${xy.x},${xy.y}`);

export const upXY = ({ x, y }: XY) => ({ x, y: y - 1 });
export const downXY = ({ x, y }: XY) => ({ x, y: y + 1 });
export const leftXY = ({ x, y }: XY) => ({ x: x - 1, y });
export const rightXY = ({ x, y }: XY) => ({ x: x + 1, y });

/** Get neighbours */
export const adjacentXY = (
  xy: XY,
) => [upXY(xy), downXY(xy), leftXY(xy), rightXY(xy)];

/** Get neighbours up to distance inclusive */
export const surroundXY = (xy: XY, distance = 1): Array<XY> => {
  const surround = new Map<string, XY>();
  let border = new Map<string, XY>();
  surround.set(keyXY(xy), xy);
  border.set(keyXY(xy), xy);
  for (let i = 0; i < distance; i++) {
    const nextBorder = new Map<string, XY>();
    for (const cell of border.values()) {
      adjacentXY(cell).forEach((c) => {
        const key = keyXY(c);
        if (!surround.has(key)) {
          surround.set(key, c);
          nextBorder.set(key, c);
        }
      });
    }
    border = nextBorder;
  }
  surround.delete(keyXY(xy));
  return surround.values().toArray();
};

/** Position is within bounds */
export const isXY = (state: State, { x, y }: XY): boolean => {
  if (x < 0 || y < 0) return false;
  if (y >= state.grid.length) return false;
  if (x >= state.grid[y].length) return false;
  return true;
};

/** Get cell type at position */
export const getXY = (state: State, { x, y }: XY): Cell => {
  assert(isXY(state, { x, y }), "getXY out of bounds");
  return state.grid[y][x];
};

/** Set cell type at position */
export const setXY = (state: State, { x, y }: XY, value: Cell) => {
  assert(isXY(state, { x, y }), "setXY out of bounds");
  state.grid[y][x] = value;
};

/** Returns -1 if A is before B, 1 if after, 0 if same */
export const sortXY = (a: XY, b: XY): number => {
  return (a.y - b.y) || (a.x - b.x);
};

/** Returns true if A and B are the same position */
export const sameXY = (a: XY, b: XY): boolean => {
  return sortXY(a, b) === 0;
};

/** List contains position */
export const hasXY = (history: Array<XY>, position: XY): number => {
  return history.findIndex((
    { x, y },
  ) => (x === position.x && y === position.y));
};
