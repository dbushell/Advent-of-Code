const std = @import("std");
const day19 = @import("./day19.zig");
const print = std.debug.print;

const input = @embedFile("input.txt");

var gpa = std.heap.GeneralPurposeAllocator(.{}){};
const allocator = gpa.allocator();

pub fn main() !void {
    defer _ = gpa.detectLeaks();

    const program: day19.Program = day19.parseInput();
    defer program.instructions.deinit();

    var halts = std.AutoArrayHashMap(u64, usize).init(allocator);
    defer halts.deinit();

    var register: [6]u64 = .{0} ** 6;
    var ip: u16 = 0;

    var i: usize = 0;
    while (true) : (ip += 1) {
        if (ip >= program.instructions.items.len) break;
        register[program.ip] = ip;
        const instruction = program.instructions.items[ip];
        day19.execute(@enumFromInt(instruction[0]), instruction, &register);
        ip = @intCast(register[program.ip]);
        // Program halts on the `eqrr` instruction
        if (@as(day19.Opcode, @enumFromInt(instruction[0])) == day19.Opcode.eqrr) {
            // Register 0 is compared to this register:
            const r = if (instruction[1] == 0) instruction[2] else instruction[1];
            // Give up on first repeat value
            if (halts.contains(register[r])) break;
            try halts.putNoClobber(register[r], i);
        }
        i += 1;
    }

    print("Answer 1: {d}\n", .{halts.keys()[0]});
    print("Answer 2: {d}\n", .{halts.pop().key});
}
