const std = @import("std");
const assert = std.debug.assert;
const print = std.debug.print;
const ArrayList = std.ArrayList;
const AutoHashMap = std.AutoHashMap;
const Allocator = std.mem.Allocator;

const input = @embedFile("input.txt");

pub const Opcode = enum {
    acc,
    jmp,
    nop,

    fn match(name: []const u8) ?Opcode {
        inline for (std.meta.fields(Opcode)) |field|
            if (std.mem.eql(u8, name, field.name)) return @enumFromInt(field.value);
        return null;
    }

    fn patch(self: Opcode) Opcode {
        return switch (self) {
            .jmp => .nop,
            .nop => .jmp,
            else => unreachable,
        };
    }
};

pub const Instruction = struct { op: Opcode, value: i32 };

pub const Program = struct {
    ip: i32 = 0,
    accumulator: i32 = 0,
    instructions: ArrayList(Instruction),
    patched: ?usize = null,

    fn len(self: Program) usize {
        return self.instructions.items.len;
    }

    fn reset(self: *Program) void {
        self.ip = 0;
        self.accumulator = 0;
    }

    fn halted(self: Program) bool {
        return self.ip < 0 or self.ip >= self.len();
    }

    fn current(self: Program) ?Instruction {
        if (self.halted()) return null;
        return self.instructions.items[@intCast(self.ip)];
    }

    fn next(self: *Program) void {
        if (self.halted()) return;
        const instruction = self.current().?;
        switch (instruction.op) {
            .acc => {
                self.accumulator += instruction.value;
                self.ip += 1;
            },
            .jmp => self.ip += instruction.value,
            .nop => self.ip += 1,
        }
    }

    fn patch(self: *Program) void {
        // Revert previous patch and get next index
        self.patched = if (self.patched) |index| value: {
            const op = self.instructions.items[index].op;
            self.instructions.items[index].op = op.patch();
            break :value self.patched.? + 1;
        } else 0;
        // Patch next available instruction
        while (true) : (self.patched.? += 1) {
            const op = self.instructions.items[self.patched.?].op;
            if (op == Opcode.acc) continue;
            self.instructions.items[self.patched.?].op = op.patch();
            return;
        }
    }
};

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer assert(gpa.deinit() == .ok);
    const allocator = gpa.allocator();

    var program = try parseInput(allocator);
    defer program.instructions.deinit();

    var seen = AutoHashMap(i32, void).init(allocator);
    defer seen.deinit();

    patch: while (true) {
        while (!program.halted()) {
            // Detect infinite loop
            if (seen.contains(program.ip)) {
                if (program.patched == null) {
                    print("Answer 1: {d}\n", .{program.accumulator});
                }
                // Restart with next patch
                seen.clearRetainingCapacity();
                program.reset();
                program.patch();
                continue :patch;
            }
            try seen.putNoClobber(program.ip, {});
            program.next();
        }
        print("Answer 2: {d}\n", .{program.accumulator});
        break;
    }
}

const parseInt = std.fmt.parseInt;
const splitScalar = std.mem.splitScalar;

pub fn parseInput(allocator: Allocator) !Program {
    var program = Program{
        .instructions = ArrayList(Instruction).init(allocator),
    };
    var lines = splitScalar(u8, input, '\n');
    while (lines.next()) |line| {
        if (line.len == 0) continue;
        var parts = splitScalar(u8, line, ' ');
        try program.instructions.append(.{
            .op = Opcode.match(parts.next().?).?,
            .value = try parseInt(i32, parts.next().?, 10),
        });
    }
    return program;
}
