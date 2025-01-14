#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

const input = inputText.trim().split(" ").map(Number);

type Node = {
  length: number;
  nodes: Array<Node>;
  meta: Array<number>;
};

const parse = (i: number): [Node, number] => {
  // Read and skip header
  const node: Node = { length: input[i++], nodes: [], meta: [] };
  const meta = input[i++];
  // Recursively parse children
  while (node.nodes.length < node.length) {
    let child: Node;
    [child, i] = parse(i);
    node.nodes.push(child);
  }
  // Append meta and return node and next index
  node.meta.push(...input.slice(i, i + meta));
  return [node, i + meta];
};

const metasum = (node: Node): number =>
  node.meta.concat(node.nodes.map(metasum))
    .reduce((c, v) => c + v, 0);

const valuesum = (node?: Node): number => {
  if (!node) return 0;
  if (!node.nodes.length) {
    return node.meta.reduce((c, v) => c + v, 0);
  }
  return node.meta.reduce((c, v) => c + valuesum(node.nodes[v - 1]), 0);
};

const [root] = parse(0);
console.log(`Answer 1: ${metasum(root)}`);
console.log(`Answer 2: ${valuesum(root)}`);
