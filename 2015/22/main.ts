#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

enum Cast {
  "Missle" = "Missle",
  "Drain" = "Drain",
  "Shield" = "Shield",
  "Poison" = "Poison",
  "Recharge" = "Recharge",
}

type Spell = {
  name: Cast;
  cost: number;
  turns: number;
  armor?: number;
  damage?: number;
  health?: number;
  mana?: number;
  instant?: boolean;
};

type Boss = {
  health: number;
  damage: number;
  armor: number;
};

type Player = {
  health: number;
  damage: number;
  armor: number;
  mana: number;
  spend: number;
  spells: Map<Cast, Spell>;
  actions: Array<Cast>;
};

type Game = {
  turn: number;
  boss: Boss;
  player: Player;
  actions: Array<Cast>;
};

const spells: { [key in Cast]: Spell } = {
  [Cast.Missle]: {
    name: Cast.Missle,
    cost: 53,
    damage: 4,
    turns: 1,
    instant: true,
  },
  [Cast.Drain]: {
    name: Cast.Drain,
    cost: 73,
    damage: 2,
    health: 2,
    turns: 1,
    instant: true,
  },
  [Cast.Shield]: {
    name: Cast.Shield,
    cost: 113,
    armor: 7,
    turns: 6,
    instant: true,
  },
  [Cast.Poison]: {
    name: Cast.Poison,
    cost: 173,
    damage: 3,
    turns: 6,
  },
  [Cast.Recharge]: {
    name: Cast.Recharge,
    cost: 229,
    mana: 101,
    turns: 5,
  },
};

const basePlayer: Player = {
  health: 50,
  mana: 500,
  damage: 0,
  armor: 0,
  spend: 0,
  spells: new Map(),
  actions: [],
};

const baseBoss: Boss = {
  health: Number(inputText.match(/Hit Points: (\d+)/)![1]),
  damage: Number(inputText.match(/Damage: (\d+)/)![1]),
  armor: 0,
};

const cast = (spell: Spell, { player, boss }: Game) => {
  if (spell.turns-- <= 0) {
    player.spells.delete(spell.name);
    if (spell.armor) player.armor -= spell.armor;
    return;
  }
  if (spell.armor && spell.turns === spells[spell.name].turns - 1) {
    player.armor += spell.armor;
  }
  if (spell.health) player.health += spell.health;
  if (spell.damage) boss.health -= spell.damage;
  if (spell.mana) player.mana += spell.mana;
};

const fight = (
  game: Game,
  allGames: Array<Game>,
  best: number,
  hard?: boolean,
): number => {
  while (game.player.actions.length) {
    game.turn++;
    const { boss, player } = game;
    if (hard && --player.health <= 0) return Infinity;
    for (const spell of player.spells.values()) cast(spell, game);
    if (boss.health <= 0) return game.player.spend;
    const act = player.actions.shift()!;
    if ((player.spells.get(act)?.turns ?? 0) > 0) return Infinity;
    const spell = structuredClone(spells[act]);
    player.spells.set(act, spell);
    player.mana -= spell.cost;
    player.spend += spell.cost;
    if (player.mana < 0) return Infinity;
    if (spell.instant) cast(spell, game);
    if (boss.health <= 0) return game.player.spend;
    for (const spell of player.spells.values()) cast(spell, game);
    if (boss.health <= 0) return game.player.spend;
    player.health -= Math.max(1, boss.damage - player.armor);
    if (game.player.health <= 0) return Infinity;
  }
  if (game.player.spend > best) return Infinity;
  for (const spell of Object.keys(spells) as Array<Cast>) {
    const newGame = structuredClone<Game>(game);
    newGame.player.actions.push(spell);
    newGame.actions.push(spell);
    allGames.push(newGame);
  }
  return Infinity;
};

/*************
 * PART ONE! *
 *************/

{
  const boss = structuredClone(baseBoss);
  const player = structuredClone(basePlayer);
  const games: Array<Game> = [{
    turn: 0,
    boss,
    player,
    actions: [],
  }];
  let best = Infinity;
  while (games.length) {
    const game = games.shift()!;
    const result = fight(game, games, best, false);
    best = Math.min(best, result);
  }
  const answerOne = best;
  console.log(`Answer 1: ${answerOne}`);
}

/*************
 * PART TWO! *
 *************/

{
  const boss = structuredClone(baseBoss);
  const player = structuredClone(basePlayer);
  const game = {
    turn: 0,
    boss,
    player,
    actions: [],
  };
  const games: Array<Game> = [game];
  let best = Infinity;
  while (games.length) {
    const game = games.shift()!;
    const result = fight(game, games, best, true);
    best = Math.min(best, result);
  }
  const answerTwo = best;
  console.log(`Answer 2: ${answerTwo}`);
}
