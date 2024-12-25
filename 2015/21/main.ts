#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

type Character = { health: number; damage: number; armor: number };
type Item = { name: string; cost: number; damage: number; armor: number };
type Boss = Character;
type Player = Character & {
  spend: number;
  items: {
    weapon: Item;
    armor: Item;
    ring1: Item;
    ring2: Item;
  };
};

const shop: { weapons: Array<Item>; armor: Array<Item>; rings: Array<Item> } = {
  weapons: [],
  armor: [{ name: "None", cost: 0, damage: 0, armor: 0 }],
  rings: [
    { name: "None 1", cost: 0, damage: 0, armor: 0 },
    { name: "None 2", cost: 0, damage: 0, armor: 0 },
  ],
};

{
  let type: keyof typeof shop | undefined = undefined;
  for (const line of inputText.split("\n")) {
    if (!line.length) continue;
    if (line.startsWith("Weapons:")) {
      type = "weapons";
    } else if (line.startsWith("Armor:")) {
      type = "armor";
    } else if (line.startsWith("Rings:")) {
      type = "rings";
    } else if (!type) continue;
    else {
      const [, name, cost, damage, armor] = line.match(
        /^([\w\d\s\+]+)\s+(\d+)\s+(\d+)\s+(\d+)$/,
      )!.map((n, i) => i > 1 ? Number(n) : n.trim());
      // @ts-ignore Validate manually
      shop[type].push({ name, cost, damage, armor });
    }
  }
}

const baseBoss: Boss = {
  health: Number(inputText.match(/Hit Points: (\d+)/)![1]),
  damage: Number(inputText.match(/Damage: (\d+)/)![1]),
  armor: Number(inputText.match(/Armor: (\d+)/)![1]),
};

const basePlayer: Player = {
  health: 100,
  damage: 0,
  armor: 0,
  spend: 0,
  items: {
    weapon: shop.weapons[0],
    armor: shop.armor[0],
    ring1: shop.rings[0],
    ring2: shop.rings[1],
  },
};

const fight = (boss: Boss, player: Player): boolean => {
  const { items: { weapon, armor, ring1, ring2 } } = player;
  player.damage += weapon?.damage ?? 0;
  player.damage += ring1?.damage ?? 0;
  player.damage += ring2?.damage ?? 0;
  player.armor += ring1?.armor ?? 0;
  player.armor += ring2?.armor ?? 0;
  player.armor += armor?.armor ?? 0;
  while (boss.health > 0 && player.health > 0) {
    boss.health -= Math.max(1, player.damage - boss.armor);
    if (boss.health <= 0) return true;
    player.health -= Math.max(1, boss.damage - player.armor);
  }
  return false;
};

const ringPairKeys: Set<string> = new Set();
for (let i = 0; i < shop.rings.length; i++) {
  for (let j = i + 1; j < shop.rings.length; j++) {
    ringPairKeys.add(
      [shop.rings[i].name, shop.rings[j].name]
        .sort((a, b) => a.localeCompare(b))
        .join(","),
    );
  }
}
const ringPairs = Array.from(ringPairKeys).map((p) =>
  p.split(",").map((name) => shop.rings.find((ring) => ring.name === name)!)
);

{
  // Find cheapest win
  const wins: Array<Player> = [];
  for (const weapon of shop.weapons) {
    for (const armor of shop.armor) {
      for (const [ring1, ring2] of ringPairs) {
        const boss = structuredClone(baseBoss);
        const player = structuredClone(basePlayer);
        player.items.weapon = weapon;
        player.items.armor = armor;
        player.items.ring1 = ring1;
        player.items.ring2 = ring2;
        player.spend += weapon.cost;
        player.spend += armor.cost;
        player.spend += ring1.cost;
        player.spend += ring2.cost;
        // Skip fight if too expensive
        if (player.spend >= (wins.at(-1)?.spend ?? Infinity)) {
          continue;
        }
        const result = fight(boss, player);
        if (result) {
          wins.push(player);
          wins.sort((a, b) => b.spend - a.spend);
        }
      }
    }
  }
  const answerOne = wins.at(-1)!.spend;
  console.log(`Answer 1: ${answerOne}`);
}

/*************
 * PART TWO! *
 *************/

{
  // Find most expensive loss
  const loses: Array<Player> = [];
  for (const weapon of shop.weapons) {
    for (const armor of shop.armor) {
      for (const [ring1, ring2] of ringPairs) {
        const boss = structuredClone(baseBoss);
        const player = structuredClone(basePlayer);
        player.items.weapon = weapon;
        player.items.armor = armor;
        player.items.ring1 = ring1;
        player.items.ring2 = ring2;
        player.spend += weapon.cost;
        player.spend += armor.cost;
        player.spend += ring1.cost;
        player.spend += ring2.cost;
        // Skip fight if too cheap
        if (player.spend <= (loses.at(-1)?.spend ?? 0)) {
          continue;
        }
        const result = fight(boss, player);
        if (!result) {
          loses.push(player);
          loses.sort((a, b) => a.spend - b.spend);
        }
      }
    }
  }
  const answerTwo = loses.at(-1)!.spend;
  console.log(`Answer 2: ${answerTwo}`);
}
