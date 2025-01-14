const std = @import("std");
const ArrayList = std.ArrayList;
const AutoHashMap = std.AutoHashMap;
const Allocator = std.mem.Allocator;
const Point = @import("./point.zig").Point;
const Grid = @import("./grid.zig").Grid;

const inputText = @embedFile("input.txt");
const input = std.fmt.parseInt(i32, inputText[0 .. inputText.len - 1], 10) catch 0;

var gpa = std.heap.GeneralPurposeAllocator(.{}){};
const allocator = gpa.allocator();

fn calc(p: Point) u21 {
    const x = p.x;
    const y = p.y;
    var value: i32 = input;
    value += (x * x) + (3 * x) + (2 * x * y) + y + (y * y);
    var bits: i32 = 0;
    for (0..32) |i| {
        if ((value >> @as(u5, @intCast(i))) & 1 != 0) bits += 1;
    }
    return if (@mod(bits, 2) == 0) '.' else '#';
}

pub fn main() !void {
    var blocked = AutoHashMap(u64, Point).init(allocator);
    defer blocked.deinit();

    var grid = try Grid(u21).init(allocator, 45, 45, null);
    defer grid.deinit();

    // Create maze
    for (0..grid.height) |y| {
        for (0..grid.width) |x| {
            const p = Point{ .x = @intCast(x), .y = @intCast(y) };
            const value: u21 = calc(p);
            if (value == '#') try blocked.put(p.key(), p);
            try grid.set(p, value);
        }
    }

    // Find path
    const start = .{ .x = 1, .y = 1 };
    const end = .{ .x = 31, .y = 39 };
    const path = try grid.findPath(start, end, blocked);

    // Draw grid with path
    for (path) |p| try grid.set(p, '•');
    for (0..grid.height) |y| {
        for (0..grid.width) |x| {
            const p = Point{ .x = @intCast(x), .y = @intCast(y) };
            if (p.same(start)) {
                std.debug.print("\x1b[0;33m{u}\x1b[0m ", .{'☆'});
            } else if (p.same(end)) {
                std.debug.print("\x1b[0;33m{u}\x1b[0m ", .{'★'});
            } else {
                const char = try grid.get(p);
                if (char == '#') {
                    std.debug.print("\x1b[0;31m{u}\x1b[0m ", .{'■'});
                } else if (char == '•') {
                    std.debug.print("\x1b[0;32m{u}\x1b[0m ", .{char});
                } else {
                    std.debug.print("\x1b[2m{u}\x1b[0m ", .{char});
                }
            }
        }
        std.debug.print("\n", .{});
    }

    std.debug.print("Answer 1: {d}\n", .{path.len - 1});
}
