const std = @import("std");
const assert = std.debug.assert;
const print = std.debug.print;
const ArrayList = std.ArrayList;

const input = @embedFile("input.txt");

var gpa = std.heap.GeneralPurposeAllocator(.{}){};
const allocator = gpa.allocator();

pub const Program = struct { ip: usize, instructions: ArrayList([4]u32) };

pub const Opcode = enum {
    addr,
    addi,
    mulr,
    muli,
    banr,
    bani,
    borr,
    bori,
    setr,
    seti,
    gtir,
    gtri,
    gtrr,
    eqir,
    eqri,
    eqrr,

    fn match(name: []const u8) ?u16 {
        inline for (@typeInfo(Opcode).Enum.fields) |field|
            if (std.mem.eql(u8, name, field.name)) return field.value;
        return null;
    }
};

pub fn execute(opcode: Opcode, instruction: [4]u32, register: *[6]u64) void {
    const A = instruction[1];
    const B = instruction[2];
    const C = instruction[3];
    const c = &register[C];
    switch (opcode) {
        .addr => c.* = register[A] + register[B],
        .addi => c.* = register[A] + B,
        .mulr => c.* = register[A] * register[B],
        .muli => c.* = register[A] * B,
        .banr => c.* = register[A] & register[B],
        .bani => c.* = register[A] & B,
        .borr => c.* = register[A] | register[B],
        .bori => c.* = register[A] | B,
        .setr => c.* = register[A],
        .seti => c.* = A,
        .gtir => c.* = if (A > register[B]) 1 else 0,
        .gtri => c.* = if (register[A] > B) 1 else 0,
        .gtrr => c.* = if (register[A] > register[B]) 1 else 0,
        .eqir => c.* = if (A == register[B]) 1 else 0,
        .eqri => c.* = if (register[A] == B) 1 else 0,
        .eqrr => c.* = if (register[A] == register[B]) 1 else 0,
    }
}

fn factors(n: u32, list: *std.ArrayList(u32)) !void {
    for (1..std.math.sqrt(n)) |i| {
        if (@mod(n, i) != 0) continue;
        try list.append(@intCast(i));
        const c = @divFloor(n, i);
        if (c != i) try list.append(@intCast(c));
    }
}

pub fn main() !void {
    defer _ = gpa.detectLeaks();

    const program = parseInput();
    defer program.instructions.deinit();

    var register: [6]u64 = .{0} ** 6;
    var ip: u16 = 0;

    while (true) : (ip += 1) {
        if (ip >= program.instructions.items.len) break;
        register[program.ip] = ip;
        const instruction = program.instructions.items[ip];
        execute(@enumFromInt(instruction[0]), instruction, &register);
        ip = @intCast(register[program.ip]);
    }

    print("Answer 1: {d}\n", .{register[0]});

    // Reset for part two
    for (0..6) |i| register[i] = 0;
    register[0] = 1;
    ip = 0;

    while (true) : (ip += 1) {
        register[program.ip] = ip;
        const instruction = program.instructions.items[ip];
        execute(@enumFromInt(instruction[0]), instruction, &register);
        // Check if large number was generated
        if (register[0] == 0) {
            // Get number from previous instruction
            const number = register[program.instructions.items[ip - 1][3]];
            // Sum all factors
            var list = std.ArrayList(u32).init(allocator);
            defer list.deinit();
            try factors(@intCast(number), &list);
            for (list.items) |i| register[0] += i;
            break;
        }
        ip = @intCast(register[program.ip]);
    }

    print("Answer 2: {d}\n", .{register[0]});
}

const parseInt = std.fmt.parseInt;
const startsWith = std.mem.startsWith;
const splitScalar = std.mem.splitScalar;

// Yolo parse the input with no error checks
pub fn parseInput() Program {
    var program = Program{
        .ip = 0,
        .instructions = ArrayList([4]u32).init(allocator),
    };
    var lines = splitScalar(u8, input, '\n');
    while (lines.next()) |line| {
        if (line.len == 0) continue;
        if (startsWith(u8, line, "#ip ")) {
            program.ip = parseInt(usize, line[4..line.len], 10) catch unreachable;
            continue;
        }
        var numbers = splitScalar(u8, line, ' ');
        program.instructions.append(.{
            Opcode.match(numbers.next().?).?,
            parseInt(u32, numbers.next().?, 10) catch unreachable,
            parseInt(u32, numbers.next().?, 10) catch unreachable,
            parseInt(u32, numbers.next().?, 10) catch unreachable,
        }) catch unreachable;
    }
    return program;
}
