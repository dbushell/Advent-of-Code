const std = @import("std");
const assert = std.debug.assert;
const parseInt = std.fmt.parseInt;
const print = std.debug.print;
const ArrayList = std.ArrayList;
const AutoHashMap = std.AutoHashMap;

const input = @embedFile("input.txt");

var gpa = std.heap.GeneralPurposeAllocator(.{}){};
const allocator = gpa.allocator();

/// Parsed input data
const Capture = struct { before: [4]u16, instruction: [4]u16, after: [4]u16 };

const Opcode = enum {
    /// Map real opcode integers once discovered
    var map: AutoHashMap(i32, Opcode) = undefined;
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
};

fn execute(opcode: Opcode, instruction: [4]u16, register: *[4]u16) void {
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

pub fn main() !void {
    defer _ = gpa.detectLeaks();

    const opcode_len = @typeInfo(Opcode).Enum.fields.len;

    Opcode.map = AutoHashMap(i32, Opcode).init(allocator);
    defer Opcode.map.deinit();

    var captures = ArrayList(Capture).init(allocator);
    defer captures.deinit();

    var program = ArrayList([4]u16).init(allocator);
    defer program.deinit();

    parseInput(&captures, &program);

    // Map to track possible opcode indexes
    var possible = AutoHashMap(Opcode, ArrayList(i32)).init(allocator);
    defer {
        var iter = possible.valueIterator();
        while (iter.next()) |list| list.deinit();
        possible.deinit();
    }
    for (0..opcode_len) |i| {
        const index: i32 = @intCast(i);
        const list = ArrayList(i32).init(allocator);
        try possible.put(@enumFromInt(index), list);
    }

    // Test capture input against all opcodes
    var passed: u32 = 0;
    for (captures.items) |capture| {
        var pass: u32 = 0;
        for (0..opcode_len) |i| {
            var register: [4]u16 = undefined;
            std.mem.copyForwards(u16, &register, &capture.before);
            const code: Opcode = @enumFromInt(i);
            execute(code, capture.instruction, &register);
            if (!std.mem.eql(u16, &register, &capture.after)) continue;
            pass += 1;
            // Add unique opcode possibilities
            const list = possible.getPtr(code).?;
            if (!for (list.items) |n| {
                if (n == capture.instruction[0]) break true;
            } else false) try list.append(@intCast(capture.instruction[0]));
        }
        if (pass >= 3) passed += 1;
    }

    // Reduce possible list until all opcodes are matched
    while (Opcode.map.count() < opcode_len) {
        var iter = possible.iterator();
        while (iter.next()) |entry| {
            const code = entry.key_ptr;
            const list = entry.value_ptr;
            var i: usize = 0;
            while (i < list.items.len) {
                if (Opcode.map.contains(list.items[i])) _ = list.swapRemove(i) else i += 1;
            }
            if (list.items.len == 1) {
                try Opcode.map.putNoClobber(list.items[0], code.*);
            }
        }
    }

    // Run the input program with the real opcodes
    var register: [4]u16 = .{0} ** 4;
    for (program.items) |instruction| {
        const opcode = Opcode.map.get(instruction[0]);
        execute(opcode.?, instruction, &register);
    }

    print("Answer 1: {d}\n", .{passed});
    print("Answer 2: {d}\n", .{register[0]});
}

const startsWith = std.mem.startsWith;
const splitScalar = std.mem.splitScalar;
const splitSequence = std.mem.splitSequence;

const Parser = enum { unknown, before, instruction, after, program };

fn parseInput(list: *ArrayList(Capture), program: *ArrayList([4]u16)) void {
    var state = Parser.unknown;
    var capture = Capture{ .before = .{0} ** 4, .after = .{0} ** 4, .instruction = .{0} ** 4 };
    var lines = splitScalar(u8, input, '\n');
    while (lines.next()) |line| {
        if (startsWith(u8, line, "Before:")) {
            state = Parser.before;
        } else if (startsWith(u8, line, "After:")) {
            state = Parser.after;
        } else if (state == Parser.unknown) {
            state = Parser.program;
        }
        switch (state) {
            .unknown => {},
            .before => {
                var numbers = splitSequence(u8, line[9 .. line.len - 1], ", ");
                var i: usize = 0;
                while (numbers.next()) |n| : (i += 1) {
                    capture.before[i] = parseInt(u8, n, 10) catch unreachable;
                }
                state = Parser.instruction;
            },
            .instruction => {
                var numbers = splitScalar(u8, line, ' ');
                var i: usize = 0;
                while (numbers.next()) |n| : (i += 1) {
                    capture.instruction[i] = parseInt(u16, n, 10) catch unreachable;
                }
                state = Parser.after;
            },
            .after => {
                var numbers = splitSequence(u8, line[9 .. line.len - 1], ", ");
                var i: usize = 0;
                while (numbers.next()) |n| : (i += 1) {
                    capture.after[i] = parseInt(u8, n, 10) catch unreachable;
                }
                state = Parser.unknown;
                list.append(capture) catch unreachable;
            },
            .program => {
                if (line.len < 7) continue;
                var numbers = splitScalar(u8, line, ' ');
                var instruction: [4]u16 = .{0} ** 4;
                var i: usize = 0;
                while (numbers.next()) |n| : (i += 1) {
                    instruction[i] = parseInt(u16, n, 10) catch unreachable;
                }
                program.append(instruction) catch unreachable;
            },
        }
    }
}
