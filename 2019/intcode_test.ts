import { assertEquals } from "jsr:@std/assert/equals";
import { newVM, runVM } from "./05/main.ts";

const toMemory = (input: string): Array<number> => input.split(",").map(Number);

Deno.test({
  name: "Day 2 part 1",
  fn() {
    const inVM = newVM();
    inVM.memory = toMemory(
      Deno.readTextFileSync(new URL("02/input.txt", import.meta.url)),
    );
    inVM.memory[1] = 12;
    inVM.memory[2] = 2;
    const outVM = runVM(inVM);
    assertEquals(outVM.memory[0], 5534943);
  },
});

Deno.test({
  name: "Day 5 part 1",
  fn() {
    const inVM = newVM();
    inVM.memory = toMemory(
      Deno.readTextFileSync(new URL("05/input.txt", import.meta.url)),
    );
    inVM.input = [1];
    const outVM = runVM(inVM);
    assertEquals(outVM.output.at(-1), 13978427);
  },
});

Deno.test({
  name: "Day 5 part 2 example",
  async fn(test) {
    await test.step({
      name: "Less than 8",
      fn() {
        const inVM = newVM();
        inVM.memory = toMemory(
          Deno.readTextFileSync(new URL("05/example.txt", import.meta.url)),
        );
        inVM.input = [7];
        const outVM = runVM(inVM);
        assertEquals(outVM.output.at(-1), 999);
      },
    });
    await test.step({
      name: "Equal to 8",
      fn() {
        const inVM = newVM();
        inVM.memory = toMemory(
          Deno.readTextFileSync(new URL("05/example.txt", import.meta.url)),
        );
        inVM.input = [8];
        const outVM = runVM(inVM);
        assertEquals(outVM.output.at(-1), 1000);
      },
    });
    await test.step({
      name: "Greater than 8",
      fn() {
        const inVM = newVM();
        inVM.memory = toMemory(
          Deno.readTextFileSync(new URL("05/example.txt", import.meta.url)),
        );
        inVM.input = [9];
        const outVM = runVM(inVM);
        assertEquals(outVM.output.at(-1), 1001);
      },
    });
  },
});
