#!/usr/bin/env -S deno run --allow-read

import {
  type Machine,
  type Memory,
  newVM,
  proxyVM,
  runVM,
} from "../intcode.ts";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

const network: Array<Machine> = [];
const memory: Memory = inputText.trim().split(",").map(Number);

let natY = 0;
let natTimer = 0;
const natPacket = { x: 0, y: 0 };

let answerOne = 0;
let answerTwo = 0;

const natMonitor = () => {
  natTimer = setTimeout(() => {
    if (natY === natPacket.y) {
      answerTwo = natPacket.y;
      // Force shutdown
      network.forEach((vm) => {
        vm.memory[0] = 99;
        vm.pointer = 0;
      });
      return;
    }
    natY = natPacket.y;
    network[0].input.push(natPacket.x, natPacket.y);
    console.log(`#255 -> #0 ${natPacket.x}:${natPacket.y}`);
  }, 10);
};

for (let i = 0; i < 50; i++) {
  const vm = newVM(memory);
  vm.input.push(i, -1);
  proxyVM(vm, undefined, () => {
    clearTimeout(natTimer);
    natMonitor();
    const length = vm.output.length;
    if (!length || length % 3 !== 0) return;
    const [destination, x, y] = vm.output.slice(-3);
    console.log(`#${network.indexOf(vm)} -> #${destination} ${x}:${y}`);
    if (destination >= 0 && destination < 50) {
      network[destination].input.push(x, y);
      return;
    }
    if (destination === 255) {
      natPacket.x = x;
      natPacket.y = y;
      if (answerOne === 0) {
        answerOne = y;
      }
      return;
    }
  });
  network.push(vm);
}

network.forEach(runVM);
natMonitor();

await Promise.all(network.map((vm) => vm.halted.promise));

console.log(`Answer 1: ${answerOne}`);
console.log(`Answer 2: ${answerTwo}`);
