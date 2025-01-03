#!/usr/bin/env -S deno run --allow-read

import {
  inputVM,
  type Machine,
  type Memory,
  newVM,
  outputVM,
  runVM,
  saveVM,
} from "../intcode.ts";
import { Color, color, screen, write } from "../debug.ts";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

enum Tile {
  Empty = 0,
  Wall = 1,
  Block = 2,
  Paddle = 3,
  Ball = 4,
  History = 5,
  Future = 6,
}

type XY = { x: number; y: number };

const tile = (tile: Tile) => {
  switch (tile) {
    case Tile.Empty:
      return color(".", Color.Dim);
    case Tile.Wall:
      return color("■", Color.Blue);
    case Tile.Block:
      return color("□", Color.Cyan);
    case Tile.Paddle:
      return color("▬", Color.Green);
    case Tile.Ball:
      return color("●", Color.Yellow);
    case Tile.History:
      return color("*", Color.Dim);
    case Tile.Future:
      return color("*", Color.Purple);
  }
};

let width = 0;
let height = 0;
{
  const memory: Memory = inputText.trim().split(",").map(Number);
  const vm = newVM(memory);
  // Count block tiles
  let answerOne = 0;
  outputVM(vm, () => {
    if (vm.output.length % 3 === 0) {
      if (vm.output.at(-1) === Tile.Block) answerOne++;
      width = Math.max(0, vm.output.at(-3)!);
      height = 1 + Math.max(0, vm.output.at(-2)!);
    }
  });
  await runVM(vm);
  console.log(`Answer 1: ${answerOne}`);
}

/*************
 * PART TWO! *
 *************/

{
  const bounces: Array<{ turn: number; x: number }> = [];
  let startX = 0;
  let maxBounces = 0;
  let bestScore = 0;
  const snapshot: {
    turn: number;
    read: number;
    ball: XY;
    paddle: XY;
    vm?: Machine;
    image?: Array<Array<string>>;
  } = {
    turn: 0,
    read: 0,
    ball: { x: 0, y: 0 },
    paddle: { x: 0, y: 0 },
  };

  const restart = async () => {
    const memory = inputText.trim().split(",").map(Number);
    const vm = snapshot.vm ?? newVM(memory);
    vm.memory[0] = 2;

    snapshot.image ??= Array.from(
      { length: height },
      () => new Array(width).fill(" "),
    );

    const framerate = 0;
    let read = snapshot.read;
    let turn = snapshot.turn;
    let ball = { ...snapshot.ball };
    let paddle = { ...snapshot.paddle };
    const image = structuredClone(snapshot.image);

    let score = 0;
    const history: Array<XY> = [];
    const input: Array<0 | 1 | -1> = [];

    if (startX) {
      let inputTurn = 0;
      let paddleX = startX;
      while (bounces.length) {
        const { x, turn: bounceTurn } = bounces.shift()!;
        while (inputTurn < bounceTurn) {
          inputTurn++;
          if (paddleX > x) {
            input.push(-1);
            paddleX--;
            continue;
          }
          if (paddleX < x) {
            input.push(1);
            paddleX++;
            continue;
          }
          input.push(0);
        }
      }
    }

    const step = () => {
      vm.input.push(input.at(turn++) ?? 0);
    };

    const update = ({ x, y }: XY, t: Tile) => {
      image[y][x] = tile(t);
      // Clear history line
      for (let y = 0; y < image.length; y++) {
        for (let x = 0; x < image[y].length; x++) {
          if (image[y][x] === tile(Tile.History)) {
            image[y][x] = tile(Tile.Empty);
          }
        }
      }
      // Draw history
      history.forEach(({ x, y }) => {
        if (image[y][x] === tile(Tile.Empty)) {
          image[y][x] = tile(Tile.History);
        }
      });
      // Update paddle position
      if (t === Tile.Paddle) {
        paddle = { x, y };
        if (!startX) startX = x;
      }
      // Update ball position
      if (t === Tile.Ball) {
        ball = { x, y };
        history.push({ x, y });
        if (history.length > 10) {
          const { x, y } = history.shift()!;
          image[y][x] = tile(Tile.Empty);
        }
      }
      // Reset of gameover
      if (paddle.x === ball.x && paddle.y === ball.y + 1) {
        bounces.push({ turn, x: ball.x });
        snapshot.turn = turn;
        snapshot.read = read - 1;
        snapshot.vm = saveVM(vm);
        snapshot.ball = { ...ball };
        snapshot.paddle = { ...paddle };
        snapshot.image = structuredClone(image);
      } else if (paddle.y === ball.y + 1) {
        bounces.push({ turn, x: ball.x });
      }
      maxBounces = Math.max(maxBounces, bounces.length);
    };

    inputVM(vm, () => {
      setTimeout(step, framerate);
    });

    outputVM(vm, () => {
      read++;
      if (read === 3) {
        read = 0;
        const x = vm.output.at(-3)!;
        const y = vm.output.at(-2)!;
        const t = vm.output.at(-1)!;
        // Update score
        if (x === -1 && y === 0) {
          score = t;
          bestScore = Math.max(score, bestScore);
        } else {
          update({ x, y }, t);
        }
        // Redraw game
        screen.hideCursor();
        screen.clear();
        write(image.map((layer) => layer.join(" ")).join("\n"));
        let text = `Score: ${bestScore}`;
        text += ` Turn: ${turn}`;
        text += ` Bounces: ${maxBounces}`;
        const padding = Math.floor(width + (text.length / 2));
        text = text.padStart(padding, " ");
        write(`\n\n${color(text, Color.White, true)}\n\n`);
        screen.showCursor();
      }
    });

    step();
    await runVM(vm);

    if (turn > snapshot.turn + 1) {
      restart();
    } else {
      console.log(`Answer 2: ${bestScore}`);
    }
  };

  restart();
}
