const std = @import("std");
const assert = std.debug.assert;
const print = std.debug.print;
const ArrayList = std.ArrayList;
const AutoHashMap = std.AutoHashMap;

const Vector = @import("./src/vector.zig").Vector(2, i32);
const Grid = @import("./src/vector_grid.zig").Grid;

const input = @embedFile("input.txt");

/// Update octopus state
fn next(grid: *Grid(u8)) !usize {
    var flashed = AutoHashMap(Vector, void).init(grid.allocator);
    defer flashed.deinit();
    var flash = ArrayList(Vector).init(grid.allocator);
    defer flash.deinit();

    // Increase all energy levels
    for (0..grid.height) |y| for (0..grid.width) |x| {
        const vec = Vector.fromPoint(x, y);
        const energy = grid.atPoint(vec) + 1;
        grid.setPoint(vec, energy);
        if (energy <= 9) continue;
        try flashed.put(vec, {});
        try flash.append(vec);
    };

    // Process chain reaction
    while (flash.items.len > 0) {
        const pop = flash.pop();
        grid.setPoint(pop, 0);
        for (pop.atNeighbours()) |vec| {
            if (!grid.pointInBounds(vec)) continue;
            if (flashed.contains(vec)) continue;
            const energy = grid.atPoint(vec);
            if (energy < 9) {
                grid.setPoint(vec, energy + 1);
                continue;
            }
            try flashed.put(vec, {});
            try flash.append(vec);
        }
    }
    return flashed.count();
}

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer assert(gpa.deinit() == .ok);
    const allocator = gpa.allocator();

    const size = std.mem.indexOfScalar(u8, input, '\n').?;
    var grid = try Grid(u8).init(allocator, size, size);
    defer grid.deinit();
    try parseInput(&grid);

    var flashes: usize = 0;
    for (0..100) |_| flashes += try next(&grid);
    print("Answer 1: {d}\n", .{flashes});

    var step: usize = 100;
    while (true) : (step += 1) if (try next(&grid) == size * size) break;
    print("Answer 2: {d}\n", .{step + 1});
}

const splitScalar = std.mem.splitScalar;

fn parseInput(list: *Grid(u8)) !void {
    var lines = splitScalar(u8, input, '\n');
    var y: usize = 0;
    while (lines.next()) |line| : (y += 1) {
        if (line.len == 0) continue;
        for (0..line.len) |x| list.set(x, y, line[x] - 48); // Convert ASCII
    }
}
