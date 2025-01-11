#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

type XYZ = { x: number; y: number; z: number };
type Particle = { p: XYZ; v: XYZ; a: XYZ; id: number; distance: number };

const particles: Array<Particle> = [];

for (const line of inputText.split("\n")) {
  const match = line.match(
    /^p=<(-?\d+),(-?\d+),(-?\d+)>, v=<(-?\d+),(-?\d+),(-?\d+)>, a=<(-?\d+),(-?\d+),(-?\d+)>$/,
  );
  if (!match) continue;
  const [px, py, pz, vx, vy, vz, ax, ay, az] = match.slice(1, 10).map(Number);
  particles.push({
    id: particles.length,
    p: { x: px, y: py, z: pz },
    v: { x: vx, y: vy, z: vz },
    a: { x: ax, y: ay, z: az },
    distance: Infinity,
  });
}

const distance = (a: XYZ, _: XYZ = { x: 0, y: 0, z: 0 }) =>
  Math.abs(a.x) + Math.abs(a.y) + Math.abs(a.z);

const average = (arr: Array<number>): number =>
  arr.reduce((a, b) => a + b) / arr.length;

const move = (p: Particle) => {
  // Increase velocity by acceleration
  p.v.x += p.a.x;
  p.v.y += p.a.y;
  p.v.z += p.a.z;
  // Increase position by velocity
  p.p.x += p.v.x;
  p.p.y += p.v.y;
  p.p.z += p.v.z;
};

{
  const state = structuredClone(particles);
  for (let i = 0; i < state.length; i++) {
    // Average particle distance over 1000 moves
    const distances = [distance(state[i].p)];
    for (let j = 0; j < 1000; j++) {
      move(state[i]);
      distances.push(distance(state[i].p));
    }
    state[i].distance = average(distances);
  }
  state.sort((a, b) => a.distance - b.distance);
  console.log(`Answer 1: ${state[0].id}`);
}

{
  const state = structuredClone<Array<Particle | null>>(particles);
  for (let j = 0; j < 100; j++) {
    const collide = new Map<string, number>();
    const remove = new Set<number>();
    // Move all particles one step
    for (let i = 0; i < state.length; i++) {
      const p = state[i];
      if (p === null) continue;
      move(p);
      const key = `${p.p.x},${p.p.y},${p.p.z}`;
      // Flag duplicate position for removal
      if (collide.has(key)) {
        remove.add(collide.get(key)!);
        remove.add(i);
      } else {
        // Track position
        collide.set(key, i);
      }
    }
    // Remove flagged particles
    for (const i of remove) {
      state[i] = null;
    }
  }
  console.log(`Answer 2: ${state.filter(Boolean).length}`);
}
