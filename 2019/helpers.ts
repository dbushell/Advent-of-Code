import { assert } from "jsr:@std/assert/assert";

type XY = { x: number; y: number };

type Grid = Array<Array<unknown>>;

export const keyXY = ({ x, y }: XY) => (`${x},${y}`);

export const sortXY = (a: XY, b: XY): number => {
  return (a.y - b.y) || (a.x - b.x);
};

export const sameXY = (a: XY, b: XY): boolean => {
  return sortXY(a, b) === 0;
};

export const upXY = ({ x, y }: XY) => ({ x, y: y - 1 });
export const downXY = ({ x, y }: XY) => ({ x, y: y + 1 });
export const leftXY = ({ x, y }: XY) => ({ x: x - 1, y });
export const rightXY = ({ x, y }: XY) => ({ x: x + 1, y });

export const adjacentXY = (
  xy: XY,
) => [upXY(xy), downXY(xy), leftXY(xy), rightXY(xy)];

export const isXY = (grid: Grid, { x, y }: XY): boolean => {
  if (x < 0 || y < 0) return false;
  if (y >= grid.length) return false;
  if (x >= grid[y].length) return false;
  return true;
};

export const getXY = (grid: Grid, { x, y }: XY) => {
  assert(isXY(grid, { x, y }), "getXY out of bounds");
  return grid[y][x];
};

export const setXY = (grid: Grid, { x, y }: XY, value: string) => {
  assert(isXY(grid, { x, y }), "setXY out of bounds");
  grid[y][x] = value;
};
