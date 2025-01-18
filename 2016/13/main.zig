const std = @import("std");
const ArrayList = std.ArrayList;
const AutoHashMap = std.AutoHashMap;
const Allocator = std.mem.Allocator;
const Point = @import("./src/point.zig").Point;
const Grid = @import("./src/grid.zig").Grid;

const inputText = @embedFile("input.txt");
const input = std.fmt.parseInt(i32, inputText[0 .. inputText.len - 1], 10) catch 0;

var gpa = std.heap.GeneralPurposeAllocator(.{}){};
const allocator = gpa.allocator();

pub fn main() !void {
    var blocked = AutoHashMap(u64, bool).init(allocator);
    defer blocked.deinit();

    var grid = try Grid(u21).init(allocator, 45, 45, null);
    defer grid.deinit();

    // Create maze
    for (0..grid.height) |y| {
        for (0..grid.width) |x| {
            const p = Point{ .x = @intCast(x), .y = @intCast(y) };
            const char: u21 = calc: {
                const value = input + (p.x * p.x) + (3 * p.x) + (2 * p.x * p.y) + p.y + (p.y * p.y);
                var bits: i32 = 0;
                for (0..32) |i| bits += value >> @as(u5, @intCast(i)) & 1;
                break :calc if (@mod(bits, 2) == 0) '.' else '#';
            };
            if (char == '#') try blocked.put(p.key(), true);
            try grid.set(p, char);
        }
    }

    // Find path
    const start = Point{ .x = 1, .y = 1 };
    const end = Point{ .x = 31, .y = 39 };
    const path = grid.findPath(start, end, blocked) catch &[_]Point{};

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

    std.debug.print("Answer 1: {d}\n", .{if (path.len > 0) path.len - 1 else 0});
}
