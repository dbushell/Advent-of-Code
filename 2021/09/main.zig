const std = @import("std");
const assert = std.debug.assert;
const print = std.debug.print;
const ArrayList = std.ArrayList;
const AutoHashMap = std.AutoHashMap;

const Vector = @import("./src/vector.zig").Vector(2, i32);
const Grid = @import("./src/vector_grid.zig").Grid;

const input = @embedFile("input.txt");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer assert(gpa.deinit() == .ok);
    const allocator = gpa.allocator();

    const width = std.mem.indexOfScalar(u8, input, '\n').?;
    const height = std.mem.count(u8, input, "\n");

    var grid = try Grid(u8).init(allocator, width, height);
    defer grid.deinit();
    try parseInput(&grid);

    var basins = ArrayList(usize).init(allocator);
    defer basins.deinit();

    var risk_level: usize = 0;
    for (0..height) |y| {
        next: for (0..width) |x| {
            const vec = Vector.fromPoint(x, y);
            const location = grid.at(x, y);
            for (vec.atAdjacent()) |point| {
                if (!grid.pointInBounds(point)) continue;
                if (grid.atPoint(point) <= location) continue :next;
            }
            risk_level += location + 1;

            var visited = AutoHashMap(Vector, void).init(allocator);
            defer visited.deinit();

            var queue = ArrayList(Vector).init(allocator);
            defer queue.deinit();
            try queue.append(vec);

            while (queue.items.len > 0) {
                const p1 = queue.pop();
                try visited.put(p1, {});
                for (p1.atAdjacent()) |p2| {
                    if (!grid.pointInBounds(p2)) continue;
                    if (visited.contains(p2)) continue;
                    if (grid.atPoint(p2) < 9) try queue.append(p2);
                }
            }
            try basins.append(visited.count());
        }
    }

    std.mem.sort(usize, basins.items, {}, std.sort.desc(usize));

    print("Answer 1: {d}\n", .{risk_level});
    print("Answer 2: {d}\n", .{basins.items[0] * basins.items[1] * basins.items[2]});
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
