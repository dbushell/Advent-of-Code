const std = @import("std");
const assert = std.debug.assert;
const print = std.debug.print;
const indexOf = std.mem.indexOf;
const ArrayList = std.ArrayList;
const AutoHashMap = std.AutoHashMap;
const StringHashMap = std.StringHashMap;
const hash = std.hash.XxHash3.hash;

const input = @embedFile("input.txt");

const Pair = struct {
    buf: []const u8,
    a: []const u8 = undefined,
    b: []const u8 = undefined,
};

/// Subtract least common from most common
fn answer(count: AutoHashMap(u8, usize)) usize {
    var min: usize = std.math.maxInt(usize);
    var max: usize = 0;
    var iter = count.iterator();
    while (iter.next()) |entry| {
        min = @min(min, entry.value_ptr.*);
        max = @max(max, entry.value_ptr.*);
    }
    return max - min;
}

/// Add values from `src` into `dst`
fn merge(src: AutoHashMap(u8, usize), dst: *AutoHashMap(u8, usize)) !void {
    var iter = src.iterator();
    while (iter.next()) |entry| {
        const value = dst.get(entry.key_ptr.*) orelse 0;
        try dst.put(entry.key_ptr.*, entry.value_ptr.* + value);
    }
}

pub fn expand(
    step: usize,
    max_step: usize,
    pair: []const u8,
    map: *StringHashMap(u8),
    caches: *AutoHashMap(u64, AutoHashMap(u8, usize)),
) !void {
    const value = map.get(pair).?;
    var cache = AutoHashMap(u8, usize).init(caches.allocator);
    try cache.put(value, 1);
    if (step < max_step) {
        const a = [_]u8{ pair[0], value };
        const b = [_]u8{ value, pair[1] };
        if (!caches.contains(hash(step + 1, a))) {
            try expand(step + 1, max_step, &a, map, caches);
        }
        if (!caches.contains(hash(step + 1, b))) {
            try expand(step + 1, max_step, &b, map, caches);
        }
        try merge(caches.get(hash(step + 1, a)).?, &cache);
        try merge(caches.get(hash(step + 1, b)).?, &cache);
    }
    try caches.put(hash(step, pair), cache);
}

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer assert(gpa.deinit() == .ok);
    const gpa_allocator = gpa.allocator();
    // const allocator = gpa.allocator();

    var arena = std.heap.ArenaAllocator.init(gpa_allocator);
    defer arena.deinit();
    const allocator = arena.allocator();

    const template = input[0..indexOf(u8, input, "\n").?];

    var map = StringHashMap(u8).init(allocator);
    // defer map.deinit();
    try parseInput(&map);

    var current: []const u8 = try allocator.dupe(u8, template);
    // defer allocator.free(current);
    for (0..10) |_| {
        var next = ArrayList([]const u8).init(allocator);
        // defer {
        //     for (next.items) |i| allocator.free(i);
        //     next.deinit();
        // }
        for (1..current.len) |j| {
            const key = current[j - 1 .. j + 1];
            const v = [_][]const u8{ key[0..1], &[1]u8{map.get(key).?} };
            const value = try std.mem.concat(allocator, u8, &v);
            try next.append(value);
            if (j == current.len - 1) {
                try next.append(try allocator.dupe(u8, &[1]u8{current[j]}));
            }
        }
        // allocator.free(current);
        current = try std.mem.concat(allocator, u8, next.items);
    }

    var count = AutoHashMap(u8, usize).init(allocator);
    // defer count.deinit();

    for (current) |c| {
        const ptr = try count.getOrPut(c);
        if (ptr.found_existing) ptr.value_ptr.* += 1 else ptr.value_ptr.* = 1;
    }

    print("Answer 1: {d}\n", .{answer(count)});

    count.clearAndFree();
    var map_iter = map.valueIterator();
    while (map_iter.next()) |value| try count.put(value.*, 0);
    for (template) |c| try count.put(c, (count.get(c) orelse 0) + 1);

    var cache = AutoHashMap(u64, AutoHashMap(u8, usize)).init(allocator);
    // defer {
    //     var iter = cache.valueIterator();
    //     while (iter.next()) |entry| entry.*.deinit();
    //     cache.deinit();
    // }

    for (1..template.len) |i| {
        const pair = template[i - 1 .. i + 1];
        try expand(0, 39, pair, &map, &cache);
        var iter = cache.get(hash(0, pair)).?.iterator();
        while (iter.next()) |entry| {
            const ptr = try count.getOrPut(entry.key_ptr.*);
            if (ptr.found_existing) ptr.value_ptr.* += entry.value_ptr.*;
        }
    }

    print("Answer 2: {d}\n", .{answer(count)});
}

const splitScalar = std.mem.splitScalar;
const splitSequence = std.mem.splitSequence;

fn parseInput(map: *StringHashMap(u8)) !void {
    var lines = splitScalar(u8, input, '\n');
    _ = lines.next();
    while (lines.next()) |line| {
        if (line.len == 0) continue;
        var parts = splitSequence(u8, line, " -> ");
        try map.put(parts.next().?, parts.next().?[0]);
    }
}
