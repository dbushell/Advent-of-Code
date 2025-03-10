const std = @import("std");
const assert = std.debug.assert;
const print = std.debug.print;
const ArrayList = std.ArrayList;

const input = @embedFile("input.txt");

const bits = std.mem.indexOfScalar(u8, input, '\n') orelse unreachable;
const BitSet = std.bit_set.IntegerBitSet(bits);

fn reduce(list: ArrayList(BitSet), positive: bool) !BitSet {
    var all = try list.clone();
    defer all.deinit();
    var b: usize = bits - 1;
    while (all.items.len > 1) : (b -= if (b > 0) 1 else 0) {
        var count: i32 = 0;
        for (all.items) |set| count += if (set.isSet(b)) 1 else -1;
        var i: usize = 0;
        while (i < all.items.len) {
            const set = all.items[i];
            const bit = set.isSet(b);
            const keep = (count < 0 and bit) or (count >= 0 and !bit);
            if (positive == keep) i += 1 else _ = all.orderedRemove(i);
        }
    }
    return all.items[0];
}

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer assert(gpa.deinit() == .ok);
    const allocator = gpa.allocator();

    var list = ArrayList(BitSet).init(allocator);
    defer list.deinit();
    try parseInput(&list);

    var gamma = BitSet.initEmpty();
    for (0..bits) |i| {
        var count: i32 = 0;
        for (list.items) |set| count += if (set.isSet(i)) 1 else -1;
        if (count > 0) gamma.set(i);
    }
    const epsilon = gamma.complement();
    print("Answer 1: {d}\n", .{@as(usize, gamma.mask) * @as(usize, epsilon.mask)});

    const o2 = try reduce(list, true);
    const co2 = try reduce(list, false);
    print("Answer 2: {d}\n", .{@as(usize, o2.mask) * @as(usize, co2.mask)});
}

const parseInt = std.fmt.parseInt;
const splitScalar = std.mem.splitScalar;

fn parseInput(list: *ArrayList(BitSet)) !void {
    var lines = splitScalar(u8, input, '\n');
    while (lines.next()) |line| {
        if (line.len == 0) continue;
        var set = BitSet.initEmpty();
        for (0..bits) |i| if (line[i] == '1') set.set(bits - i - 1);
        try list.append(set);
    }
}
