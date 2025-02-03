const std = @import("std");
const assert = std.debug.assert;
const print = std.debug.print;
const ArrayList = std.ArrayList;

const Point = @import("./src/point.zig").Point;
const Grid = @import("./src/grid.zig").Grid;

const input = @embedFile("input.txt");

const Char = enum(u8) { tree = '#', open = '.' };

fn countTrees(grid: Grid(Char), right: usize, down: usize) !usize {
    var trees: usize = 0;
    var x: usize = right;
    var y: usize = down;
    while (y < grid.height) {
        x = if (x >= grid.width) @mod(x, grid.width) else x;
        if (try grid.at(x, y) == Char.tree) trees += 1;
        y += down;
        x += right;
    }
    return trees;
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

    var trees: [5]usize = undefined;
    trees[0] = try countTrees(grid, 3, 1);

    print("Answer 1: {d}\n", .{trees[0]});

    trees[1] = try countTrees(grid, 1, 1);
    trees[2] = try countTrees(grid, 5, 1);
    trees[3] = try countTrees(grid, 7, 1);
    trees[4] = try countTrees(grid, 1, 2);

    var multiply: usize = 1;
    inline for (trees) |i| multiply *= i;

    print("Answer 2: {d}\n", .{multiply});
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
