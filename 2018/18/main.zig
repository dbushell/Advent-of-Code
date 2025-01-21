const std = @import("std");
const assert = std.debug.assert;
const parseInt = std.fmt.parseInt;
const print = std.debug.print;
const AutoHashMap = std.AutoHashMap;

const Point = @import("./src/point.zig").Point;
const Grid = @import("./src/grid.zig").Grid;

const input = @embedFile("input.txt");

var gpa = std.heap.GeneralPurposeAllocator(.{}){};
const allocator = gpa.allocator();

const Char = enum(u8) { open = '.', tree = '|', yard = '#' };

/// Generate next state
fn nextState(state: *Grid(Char), hashes: ?*AutoHashMap(u64, void)) !?Grid(Char) {
    var next = try state.clone();
    errdefer next.deinit();
    var hash: [2500]u8 = undefined;
    for (0..next.height) |y| {
        for (0..next.width) |x| {
            const point = Point.init(@intCast(x), @intCast(y));
            var trees: usize = 0;
            var yards: usize = 0;
            for (point.atAdjacent()) |adjacent| {
                const char = state.get(adjacent) catch null;
                if (char == Char.tree) trees += 1;
                if (char == Char.yard) yards += 1;
            }
            for (point.atCorners()) |corner| {
                const char = state.get(corner) catch null;
                if (char == Char.tree) trees += 1;
                if (char == Char.yard) yards += 1;
            }
            switch (try state.get(point)) {
                .open => if (trees >= 3) try next.set(point, Char.tree),
                .tree => if (yards >= 3) try next.set(point, Char.yard),
                .yard => if (yards == 0 or trees == 0) try next.set(point, Char.open),
            }
            if (hashes) |_| {
                hash[(y * next.width) + x] = @intFromEnum(try next.get(point));
            }
        }
    }
    // Detect the looping pattern by hash collision
    if (hashes) |map| {
        const key = std.hash.XxHash3.hash(0, &hash);
        if (map.contains(key)) {
            next.deinit();
            return null;
        }
        try map.put(key, {});
    }
    state.deinit();
    return next;
}

/// Count state for answers
fn count(state: Grid(Char)) struct { usize, usize } {
    var trees: usize = 0;
    var yards: usize = 0;
    for (0..state.height) |y| {
        for (0..state.width) |x| {
            switch (state.at(x, y) catch unreachable) {
                .tree => trees += 1,
                .yard => yards += 1,
                else => {},
            }
        }
    }
    return .{ trees, yards };
}

pub fn main() !void {
    defer _ = gpa.detectLeaks();

    const width = std.mem.indexOf(u8, input, "\n") orelse 0;
    const height = std.mem.count(u8, input, "\n");

    var grid = try Grid(Char).init(allocator, width, height, null);
    defer grid.deinit();

    parseInput(&grid);

    var hashes = AutoHashMap(u64, void).init(allocator);
    defer hashes.deinit();

    var trees: usize = 0;
    var yards: usize = 0;

    const max_minutes = 1_000_000_000;
    var i: usize = 0;
    while (i < max_minutes) : (i += 1) {
        const map = if (i < (max_minutes - 1000)) &hashes else null;
        const maybe = try nextState(&grid, map);
        if (maybe == null) {
            // Fast foward through repeating cycles
            const collision = i;
            while (i < max_minutes) i += collision - 1;
            i -= collision;
            continue;
        }
        // Update new state
        grid = maybe.?;
        // Count tenth iteration for answer one
        if (i == 9) trees, yards = count(grid);
    }

    for (0..grid.height) |y| {
        for (0..grid.width) |x| {
            const char = try grid.at(x, y);
            print("{c}", .{@intFromEnum(char)});
        }
        print("\n", .{});
    }
    print("\n", .{});

    print("Answer 1: {d}\n", .{trees * yards});

    trees, yards = count(grid);

    print("Answer 2: {d}\n", .{trees * yards});
}

fn parseInput(grid: *Grid(Char)) void {
    var y: i32 = 0;
    var lines = std.mem.tokenizeScalar(u8, input, '\n');
    while (lines.next()) |line| : (y += 1) {
        if (line.len != grid.width) break;
        for (0..line.len) |x| {
            const char: Char = @enumFromInt(line[x]);
            const point = Point.init(@intCast(x), @intCast(y));
            grid.set(point, char) catch unreachable;
        }
    }
}
