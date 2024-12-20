export type XY = {
  x: number;
  y: number;
};

export enum Cell {
  Empty = ".",
  Wall = "#",
  Cheat = "!",
  Start = "S",
  End = "E",
}

export type Grid = Array<Array<Cell>>;

export type State = {
  grid: Grid;
  start: XY;
  end: XY;
  current: XY;
  routes: Map<string, Array<XY>>;
  routeKeys: Set<string>;
  drawRoute: string;
  bestRoute: string;
  controller: AbortController;
  framerate: number;
};
