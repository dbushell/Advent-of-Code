const std = @import("std");
const assert = std.debug.assert;
const print = std.debug.print;
const AutoHashMap = std.AutoHashMap;

const Point = @import("./src/point.zig").Point;
const Grid = @import("./src/grid.zig").Grid;

const input = @embedFile("input.txt");

const Char = enum(u8) { floor = '.', empty = 'L', occupied = '#' };

fn nextState(state: *Grid(Char), immediate: bool, threshold: usize) !struct { Grid(Char), u64, usize } {
    defer state.deinit();
    var next = try state.clone();
    var count = AutoHashMap(Char, usize).init(state.allocator);
    defer count.deinit();
    var hash = try state.allocator.alloc(u8, next.height * next.width);
    defer next.allocator.free(hash);
    var occupied: usize = 0;
    for (0..next.height) |y| {
        for (0..next.width) |x| {
            const point = Point.init(@intCast(x), @intCast(y));
            // Reset seat count
            for (std.enums.values(Char)) |c| try count.put(c, 0);
            // Count neighbours
            for (point.atAdjacent() ++ point.atCorners()) |p| {
                // Consider immediate seats
                if (immediate) {
                    const seat: ?Char = state.get(p) catch continue;
                    try count.put(seat.?, count.get(seat.?).? + 1);
                    continue;
                }
                // Consider first seat in line of sight
                var s = p;
                while (true) : (s = Point.init(s.x - (point.x - p.x), s.y - (point.y - p.y))) {
                    const seat: ?Char = state.get(s) catch break;
                    if (seat.? == Char.floor) continue;
                    try count.put(seat.?, count.get(seat.?).? + 1);
                    break;
                }
            }
            // Next seat state
            const current = try state.get(point);
            if (current == Char.empty) {
                if (count.get(Char.occupied).? == 0) try next.set(point, Char.occupied);
            } else if (current == Char.occupied) {
                if (count.get(Char.occupied).? >= threshold) try next.set(point, Char.empty);
            }
            const now = try next.get(point);
            hash[(y * next.width) + x] = @intFromEnum(now);
            if (now == Char.occupied) occupied += 1;
        }
    }
    return .{ next, std.hash.XxHash3.hash(0, hash), occupied };
}

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer assert(gpa.deinit() == .ok);
    const allocator = gpa.allocator();

    const width = std.mem.indexOf(u8, input, "\n") orelse 0;
    const height = std.mem.count(u8, input, "\n");

    var grid = try Grid(Char).init(allocator, width, height, null);
    defer grid.deinit();

    parseInput(&grid);

    var hashes = AutoHashMap(u64, void).init(allocator);
    defer hashes.deinit();

    while (true) {
        grid, const key, const occupied = try nextState(&grid, true, 4);
        if (hashes.contains(key)) {
            print("Answer 1: {d}\n", .{occupied});
            break;
        }
        try hashes.put(key, {});
    }

    parseInput(&grid);
    hashes.clearRetainingCapacity();

    while (true) {
        grid, const key, const occupied = try nextState(&grid, false, 5);
        if (hashes.contains(key)) {
            print("Answer 2: {d}\n", .{occupied});
            break;
        }
        try hashes.put(key, {});
    }
}

fn parseInput(grid: *Grid(Char)) void {
    var y: i32 = 0;
    var lines = std.mem.tokenizeScalar(u8, input, '\n');
    while (lines.next()) |line| : (y += 1) {
        if (line.len != grid.width) break;
        for (0..line.len) |x| {
            const char: Char = @enumFromInt(line[x]);
            const point = Point.init(@intCast(x), y);
            grid.set(point, char) catch unreachable;
        }
    }
}
