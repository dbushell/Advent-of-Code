const std = @import("std");
const assert = std.debug.assert;
const print = std.debug.print;
const splitScalar = std.mem.splitScalar;

const Allocator = std.mem.Allocator;
const ArrayList = std.ArrayList;
const AutoArrayHashMap = std.AutoArrayHashMap;

const Hex = @import("./Hex.zig");

const input = @embedFile("input.txt");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer assert(gpa.deinit() == .ok);
    const gpa_allocator = gpa.allocator();

    var arena = std.heap.ArenaAllocator.init(gpa_allocator);
    defer arena.deinit();
    const allocator = arena.allocator();

    var directions = ArrayList([]const u8).init(allocator);
    var lines = splitScalar(u8, input, '\n');
    while (lines.next()) |line| {
        if (line.len == 0) continue;
        const copy = try directions.allocator.dupe(u8, line);
        try directions.append(copy);
    }

    var map = AutoArrayHashMap(@Vector(3, i32), bool).init(allocator);
    defer map.deinit();

    for (directions.items) |buf| {
        var hex = Hex{};
        var i: usize = 0;
        while (i < buf.len) : (i += 1) {
            const char = buf[i];
            const peek = if (i == buf.len - 1) 0 else buf[i + 1];
            if ((char == 's' or char == 'n') and (peek == 'e' or peek == 'w')) {
                i += 1;
            }
            hex = switch (char) {
                'e' => hex.east(),
                'w' => hex.west(),
                's' => switch (peek) {
                    'e' => hex.southEast(),
                    'w' => hex.southWest(),
                    else => unreachable,
                },
                'n' => switch (peek) {
                    'e' => hex.northEast(),
                    'w' => hex.northWest(),
                    else => unreachable,
                },
                else => unreachable,
            };
        }
        const state = map.get(hex.v) orelse false;
        try map.put(hex.v, !state);
    }

    var count: usize = 0;
    for (map.values()) |state| count += if (state) 1 else 0;
    print("Answer 1: {d}\n", .{count});

    for (0..100) |_| {
        var previous = try map.clone();
        defer previous.deinit();
        for (map.keys()) |v| {
            const hex = Hex{ .v = v };
            for (hex.neighbours()) |n| {
                if (previous.contains(n.v)) continue;
                try previous.put(n.v, false);
            }
        }
        var iter = previous.iterator();
        while (iter.next()) |entry| {
            var hex = Hex{ .v = entry.key_ptr.* };
            const state = entry.value_ptr.*;
            var white: usize = 0;
            var black: usize = 0;
            for (hex.neighbours()) |n| {
                if (previous.contains(n.v)) {
                    if (previous.get(n.v).?) black += 1 else white += 1;
                } else white += 1;
            }
            if (state and (black == 0 or black > 2)) {
                try map.put(hex.v, false);
            } else if (!state and black == 2) {
                try map.put(hex.v, true);
            }
        }
    }

    count = 0;
    for (map.values()) |state| count += if (state) 1 else 0;
    print("Answer 2: {d}\n", .{count});
}
