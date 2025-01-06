#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

type Bot = { id: number; chips: Array<number> };

type Trade = {
  value: number | "low" | "high";
  to: number;
  from?: number;
  target?: "bot" | "output";
};

const bots: Array<Bot> = [];
const bins: Array<Array<number>> = [];
const trades: Array<Trade> = [];
const queue: Array<Trade> = [];

for (const line of inputText.split("\n")) {
  const value = line.match(/^value (\d+).+?(\d+)$/);
  if (value) {
    trades.push({
      value: Number.parseInt(value[1]),
      to: Number.parseInt(value[2]),
    });
    continue;
  }
  const match = line.match(
    /bot (\d+).+(bot|output).+?(\d+).+?(bot|output).+?(\d+)/,
  );
  if (!match) continue;
  trades.push({
    value: "low",
    to: Number.parseInt(match[3]),
    from: Number.parseInt(match[1]),
    target: match[2] as Trade["target"],
  }, {
    value: "high",
    to: Number.parseInt(match[5]),
    from: Number.parseInt(match[1]),
    target: match[4] as Trade["target"],
  });
}

for (const trade of trades) {
  if (trade.target === "bot") {
    bots[trade.to] ??= { id: trade.to, chips: [] };
  }
  if (trade.target === "output") {
    bins[trade.to] ??= [];
  }
  if (trade.from !== undefined) {
    bots[trade.from] ??= { id: trade.from, chips: [] };
  }
}

const next = () => {
  if (queue.length === 0) return;
  const trade = queue.shift()!;
  const fromBot = bots[trade.from!];
  bots.forEach((b) => {
    if (b.chips.includes(61) && b.chips.includes(17)) {
      console.log(`Answer 1: ${b.id}`);
    }
  });
  if (trade.value === "low") fromBot.chips.sort((a, b) => b - a);
  if (trade.value === "high") fromBot.chips.sort((a, b) => a - b);
  if (trade.target === "output") {
    bins[trade.to].push(fromBot.chips.pop()!);
    return;
  }
  const to = bots[trade.to];
  to.chips.push(fromBot.chips.pop()!);
  if (to.chips.length === 2) {
    trades.filter((t) => (t.from === to.id))
      .forEach((t) => queue.unshift(t));
  }
  if (queue.length) next();
};

for (const trade of trades) {
  if (typeof trade.value !== "number") continue;
  const to = bots[trade.to];
  to.chips.push(trade.value);
  if (to.chips.length === 2) {
    trades.filter((t) => (t.from === to.id))
      .forEach((t) => queue.unshift(t));
  }
  while (queue.length) next();
}

const answerTwo = bins[0][0] * bins[1][0] * bins[2][0];
console.log(`Answer 2: ${answerTwo}`);
