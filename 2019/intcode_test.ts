import { assertEquals } from "jsr:@std/assert/equals";
import { newVM, runVM } from "./intcode.ts";
import { ampSequence, feedbackSequence } from "./07/main.ts";

const toMemory = (input: string): Array<number> => input.split(",").map(Number);

Deno.test({
  name: "Day 2 part 1",
  async fn() {
    const vm = newVM();
    vm.memory = toMemory(
      Deno.readTextFileSync(new URL("02/input.txt", import.meta.url)),
    );
    vm.memory[1] = 12;
    vm.memory[2] = 2;
    await runVM(vm);
    assertEquals(vm.memory[0], 5534943);
  },
});

Deno.test({
  name: "Day 5 part 1",
  async fn() {
    const vm = newVM();
    vm.memory = toMemory(
      Deno.readTextFileSync(new URL("05/input.txt", import.meta.url)),
    );
    vm.input = [1];
    await runVM(vm);
    assertEquals(vm.output.at(-1), 13978427);
  },
});

Deno.test({
  name: "Day 5 part 2 example",
  async fn(test) {
    await test.step({
      name: "Less than 8",
      async fn() {
        const vm = newVM();
        vm.memory = toMemory(
          Deno.readTextFileSync(new URL("05/example.txt", import.meta.url)),
        );
        vm.input = [7];
        await runVM(vm);
        assertEquals(vm.output.at(-1), 999);
      },
    });
    await test.step({
      name: "Equal to 8",
      async fn() {
        const vm = newVM();
        vm.memory = toMemory(
          Deno.readTextFileSync(new URL("05/example.txt", import.meta.url)),
        );
        vm.input = [8];
        await runVM(vm);
        assertEquals(vm.output.at(-1), 1000);
      },
    });
    await test.step({
      name: "Greater than 8",
      async fn() {
        const vm = newVM();
        vm.memory = toMemory(
          Deno.readTextFileSync(new URL("05/example.txt", import.meta.url)),
        );
        vm.input = [9];
        await runVM(vm);
        assertEquals(vm.output.at(-1), 1001);
      },
    });
  },
});

Deno.test({
  name: "Day 7 examples",
  async fn(test) {
    await test.step({
      name: "Example 1",
      async fn() {
        const input = toMemory(
          Deno.readTextFileSync(new URL("07/test1.txt", import.meta.url)),
        );
        const output = await ampSequence(toMemory("4,3,2,1,0"), input);
        assertEquals(output, 43210);
      },
    });
    await test.step({
      name: "Example 2",
      async fn() {
        const input = toMemory(
          Deno.readTextFileSync(new URL("07/test2.txt", import.meta.url)),
        );
        const output = await ampSequence(toMemory("0,1,2,3,4"), input);
        assertEquals(output, 54321);
      },
    });
    await test.step({
      name: "Example 3",
      async fn() {
        const input = toMemory(
          Deno.readTextFileSync(new URL("07/test3.txt", import.meta.url)),
        );
        const output = await ampSequence(toMemory("1,0,4,3,2"), input);
        assertEquals(output, 65210);
      },
    });
    await test.step({
      name: "Example 4",
      async fn() {
        const input = toMemory(
          Deno.readTextFileSync(new URL("07/test4.txt", import.meta.url)),
        );
        const output = await feedbackSequence(toMemory("9,8,7,6,5"), input);
        assertEquals(output, 139629729);
      },
    });
    await test.step({
      name: "Example 5",
      async fn() {
        const input = toMemory(
          Deno.readTextFileSync(new URL("07/test5.txt", import.meta.url)),
        );
        const output = await feedbackSequence(toMemory("9,7,8,5,6"), input);
        assertEquals(output, 18216);
      },
    });
  },
});
