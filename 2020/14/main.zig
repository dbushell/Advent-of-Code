const std = @import("std");
const assert = std.debug.assert;
const print = std.debug.print;
const Allocator = std.mem.Allocator;
const ArrayList = std.ArrayList;
const AutoHashMap = std.AutoHashMap;
const BoundedArray = std.BoundedArray;
const IntegerBitSet = std.bit_set.IntegerBitSet;

const input = @embedFile("input.txt");

const Bitset36 = IntegerBitSet(36);

const Program = struct {
    mask: [36]u8 = undefined,
    uni: Bitset36 = Bitset36.initEmpty(),
    dif: Bitset36 = Bitset36.initEmpty(),
    writes: ArrayList([2]usize),
};

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer assert(gpa.deinit() == .ok);
    const allocator = gpa.allocator();

    var list = ArrayList(Program).init(allocator);
    defer {
        for (list.items) |*addr| addr.writes.deinit();
        list.deinit();
    }
    try parseInput(&list);

    var memory = AutoHashMap(usize, usize).init(allocator);
    defer memory.deinit();

    for (list.items) |program| {
        for (program.writes.items) |op| {
            var value = Bitset36.initEmpty();
            value.mask = @intCast(op[1]);
            value = value.unionWith(program.uni);
            value = value.differenceWith(program.dif);
            try memory.put(op[0], value.mask);
        }
    }
    var sum: usize = 0;
    var iter = memory.valueIterator();
    while (iter.next()) |n| sum += n.*;
    print("Answer 1: {d}\n", .{sum});

    memory.clearRetainingCapacity();

    for (list.items) |program| {
        for (program.writes.items) |op| {
            // Get base address
            var addr = Bitset36.initEmpty();
            addr.mask = @intCast(op[0]);
            addr = addr.unionWith(program.uni);

            // Find floating addresses
            var all = std.AutoArrayHashMap(u36, void).init(allocator);
            defer all.deinit();
            for (0..36) |i| {
                if (program.mask[i] != 'X') continue;
                var a1 = Bitset36.initEmpty();
                a1.mask = addr.mask;
                a1.set(35 - i);
                try all.put(a1.mask, {});
                a1.unset(35 - i);
                try all.put(a1.mask, {});
                // Add variations
                for (0..all.keys().len) |k| {
                    var a2 = Bitset36.initEmpty();
                    a2.mask = all.keys()[k];
                    a2.set(35 - i);
                    try all.put(a2.mask, {});
                    a2.unset(35 - i);
                    try all.put(a2.mask, {});
                }
            }
            for (0..all.keys().len) |k| {
                try memory.put(all.keys()[k], op[1]);
            }
        }
    }
    sum = 0;
    iter = memory.valueIterator();
    while (iter.next()) |n| sum += n.*;
    print("Answer 2: {d}\n", .{sum});
}

const parseInt = std.fmt.parseInt;
const splitScalar = std.mem.splitScalar;
const startsWith = std.mem.startsWith;

fn parseInput(list: *ArrayList(Program)) !void {
    var lines = splitScalar(u8, input, '\n');
    var program: ?Program = null;
    while (lines.next()) |line| {
        if (line.len == 0) continue;
        if (startsWith(u8, line, "mask =")) {
            if (program) |p| try list.append(p);
            program = .{ .writes = ArrayList([2]usize).init(list.allocator) };
            std.mem.copyForwards(u8, program.?.mask[0..36], line[7..43]);
            for (line[7..43], 0..) |x, i| {
                if (x == '1') program.?.uni.set(35 - i);
                if (x == '0') program.?.dif.set(35 - i);
            }
            continue;
        }
        var d1 = try BoundedArray(u8, 16).init(0);
        var d2 = try BoundedArray(u8, 16).init(0);
        var digits = &d1;
        for (line) |char| {
            if (char == '=') digits = &d2;
            if (char >= 48 and char <= 57) digits.appendAssumeCapacity(char);
        }
        try program.?.writes.append(.{
            try parseInt(usize, d1.slice(), 10),
            try parseInt(usize, d2.slice(), 10),
        });
    }
    if (program) |p| try list.append(p);
}
