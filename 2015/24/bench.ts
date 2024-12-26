import { assert } from "jsr:@std/assert/assert";

const numbers = Array.from({ length: 1000 }, (_, k) => k);

Deno.bench({
  name: "Spread",
  fn: () => {
    assert([...numbers, 1].length === numbers.length + 1);
  },
});

Deno.bench({
  name: "Concat",
  fn: () => {
    assert(numbers.concat(1).length === numbers.length + 1);
  },
});

Deno.bench({
  name: "Array.from",
  fn: () => {
    const newArray = Array.from(numbers);
    newArray.push(1);
    assert(newArray.length === numbers.length + 1);
  },
});

// for (const weight of packages) {
//   all = all.concat(all.map((group) => [...group, weight]));
// }
