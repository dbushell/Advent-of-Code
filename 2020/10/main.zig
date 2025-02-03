const std = @import("std");
const assert = std.debug.assert;
const print = std.debug.print;
const ArrayList = std.ArrayList;
const Allocator = std.mem.Allocator;
const AutoHashMap = std.AutoHashMap;
const XxHash3 = std.hash.XxHash3;
// const PriorityQueue = std.PriorityQueue;
// const Order = std.math.Order;

const input = @embedFile("input.txt");

// fn compareQueue(_: void, a: []const u8, b: []const u8) Order {
//     return if (a.len < b.len) Order.lt else Order.gt;
// }

fn validateSlice(slice: []const u8) bool {
    for (1..slice.len) |i| if (slice[i] - slice[i - 1] > 3) return false;
    return true;
}

fn reduceSlice(allocator: Allocator, seen: *AutoHashMap(u64, void), slice: []const u8) !usize {
    if (!validateSlice(slice)) return 0;
    const hash = XxHash3.hash(0, slice);
    if (seen.contains(hash)) return 0;
    try seen.putNoClobber(hash, {});
    if (slice.len == 2) return 1;
    var count: usize = 1;
    for (1..slice.len - 1) |i| {
        const sub = try std.mem.concat(allocator, u8, &.{ slice[0..i], slice[i + 1 .. slice.len] });
        defer allocator.free(sub);
        count += try reduceSlice(allocator, seen, sub);
    }
    return count;
}

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer assert(gpa.deinit() == .ok);
    const allocator = gpa.allocator();

    var list = ArrayList(u8).init(allocator);
    defer list.deinit();
    try parseInput(&list);
    std.mem.sort(u8, list.items, {}, std.sort.asc(u8));

    var current: u8 = 0;
    var one_jolts: usize = 0;
    var three_jolts: usize = 0;
    for (list.items) |rating| {
        if (rating - current == 1) one_jolts += 1;
        if (rating - current == 3) three_jolts += 1;
        current = rating;
    }
    three_jolts += 1;
    print("Answer 1: {d}\n", .{one_jolts * three_jolts});

    try list.append(list.getLast() + 3);
    try list.append(0);
    std.mem.sort(u8, list.items, {}, std.sort.asc(u8));

    var seen = AutoHashMap(u64, void).init(allocator);
    defer seen.deinit();

    var subtotals = ArrayList(usize).init(allocator);
    defer subtotals.deinit();

    var start: usize = 0;
    for (2..list.items.len) |i| {
        const diff: u8 = list.items[i] - list.items[i - 1];
        if (diff == 3) {
            const count = try reduceSlice(allocator, &seen, list.items[start .. i + 1]);
            try subtotals.append(count);
            start = i;
        }
    }

    var total: usize = subtotals.items[0];
    for (1..subtotals.items.len) |i| total *= subtotals.items[i];

    print("Answer 2: {d}\n", .{total});

    // Priority queue technique too slow!

    // var queue = PriorityQueue([]const u8, void, compareQueue).init(allocator, {});
    // defer queue.deinit();
    // try queue.add(try list.toOwnedSlice());

    // var total: usize = 0;
    // while (queue.count() > 0) {
    //     const slice = queue.remove();
    //     defer allocator.free(slice);
    //     if (!validateSlice(slice)) continue;
    //     const hash = XxHash3.hash(0, slice);
    //     if (seen.contains(hash)) continue;
    //     try seen.putNoClobber(hash, {});
    //     total += 1;
    //     if (slice.len == 2) continue;
    //     for (1..slice.len - 1) |i| {
    //         const next = try std.mem.concat(allocator, u8, &.{ slice[0..i], slice[i + 1 .. slice.len] });
    //         try queue.add(next);
    //     }
    // }
    // print("Answer 2: {d}\n", .{total});
}

const parseInt = std.fmt.parseInt;
const splitScalar = std.mem.splitScalar;

fn parseInput(list: *ArrayList(u8)) !void {
    var lines = splitScalar(u8, input, '\n');
    while (lines.next()) |line| {
        if (line.len == 0) continue;
        try list.append(try parseInt(u8, line, 10));
    }
}
