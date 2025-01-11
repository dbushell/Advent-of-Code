#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

enum Move {
  Spin = "s",
  Exchange = "x",
  Partner = "p",
}

type Spin = [Move.Spin, number];
type Exchange = [Move.Exchange, number, number];
type Partner = [Move.Partner, string, string];
type Dance = Spin | Exchange | Partner;

const isSpin = (s: Dance): s is Spin => s[0] === Move.Spin;
const isExchange = (s: Dance): s is Exchange => s[0] === Move.Exchange;
const isPartner = (s: Dance): s is Partner => s[0] === Move.Partner;

const dance: Array<Dance> = [];

for (const line of inputText.split(",")) {
  const match = line.match(/^(s|x|p)(\w+)\/?(\w+)?/);
  if (!match) continue;
  const [move, a, b] = match.slice(1, 4);
  switch (move as Move) {
    case Move.Spin:
      dance.push([Move.Spin, Number(a)]);
      break;
    case Move.Exchange:
      dance.push([Move.Exchange, Number(a), Number(b)]);
      break;
    case Move.Partner:
      dance.push([Move.Partner, a, b]);
      break;
  }
}

const programs = "abcdefghijklmnop".split("")
  .slice(0, dance.length > 100 ? 16 : 5);

const act = (list: Array<string>, move: Dance) => {
  if (isSpin(move)) {
    list.unshift(...list.splice(-move[1], move[1]));
  }
  if (isExchange(move)) {
    [list[move[1]], list[move[2]]] = [list[move[2]], list[move[1]]];
  }
  if (isPartner(move)) {
    const a = list.indexOf(move[1]);
    const b = list.indexOf(move[2]);
    [list[a], list[b]] = [list[b], list[a]];
  }
};

{
  const state = structuredClone(programs);
  for (const move of dance) act(state, move);
  console.log(`Answer 1: ${state.join("")}`);
}

{
  const state = structuredClone(programs);
  const history: Array<string> = [state.join("")];
  for (let i = 0; i < 1_000_000_000; i++) {
    for (const move of dance) act(state, move);
    history.push(state.join(""));
    if (history.at(-1) === history[0]) {
      const inc = i;
      while (i + inc + 1 < 1_000_000_000) i += inc + 1;
    }
  }
  console.log(`Answer 2: ${state.join("")}`);
}
