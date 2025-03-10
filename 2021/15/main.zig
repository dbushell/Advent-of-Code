const std = @import("std");
const assert = std.debug.assert;
const print = std.debug.print;
const ArrayList = std.ArrayList;
const AutoHashMap = std.AutoHashMap;
const PriorityQueue = std.PriorityQueue;

const Vector = @import("./src/vector.zig").Vector(2, i32);
const Grid = @import("./src/vector_grid.zig").Grid;

const input = @embedFile("input.txt");
const size = std.mem.indexOfScalar(u8, input, '\n') orelse unreachable;

const Node = struct { point: Vector, from: @Vector(2, i32) = .{ -1, -1 }, gcost: i32 = 0, hcost: i32 = 0 };
const NodeMap = AutoHashMap(@Vector(2, i32), Node);
const NodeQueue = PriorityQueue(@Vector(2, i32), *const NodeMap, compareNode);

/// Priority queue compare function
fn compareNode(map: *const NodeMap, k1: @Vector(2, i32), k2: @Vector(2, i32)) std.math.Order {
    const n1 = map.get(k1).?;
    const n2 = map.get(k2).?;
    return std.math.order(n1.gcost + n1.hcost, n2.gcost + n2.hcost);
}

/// Copied from 2018 day 22 probably inefficient!
fn aStarFindPath(grid: *Grid(u8), start: Vector, end: Vector) !struct { path: []Vector, gcost: i32 } {
    const allocator = grid.allocator;
    var nodes = NodeMap.init(allocator);
    defer nodes.deinit();
    var frontier = NodeQueue.init(allocator, &nodes);
    defer frontier.deinit();

    const start_node = Node{ .point = start };
    try nodes.put(start.vec, start_node);
    try frontier.add(start.vec);

    while (frontier.count() > 0) {
        const current = nodes.get(frontier.remove()).?;
        if (current.point.eql(end)) {
            var route = std.ArrayList(Vector).init(allocator);
            errdefer route.deinit();
            var step: ?Node = current;
            while (step != null) : (step = nodes.get(step.?.from) orelse null) {
                if (step.?.point.eql(start)) break;
                try route.append(step.?.point);
            }
            const path = try route.toOwnedSlice();
            std.mem.reverse(Vector, path);
            return .{ .path = path, .gcost = current.gcost };
        }
        for (current.point.atAdjacent()) |adjacent| {
            if (!grid.pointInBounds(adjacent)) continue;
            var next = Node{
                .point = adjacent,
                .from = current.point.vec,
                .gcost = current.gcost,
            };
            next.hcost += grid.atPoint(next.point);
            next.gcost += next.hcost;
            const existing = nodes.get(next.point.vec);
            if (existing == null or next.gcost < existing.?.gcost) {
                try nodes.put(next.point.vec, next);
                try frontier.add(next.point.vec);
            }
        }
    }
    return error.PathNotFound;
}

pub fn main() !void {
    var gpa: std.heap.DebugAllocator(.{}) = .init;
    defer assert(gpa.deinit() == .ok);
    const allocator = gpa.allocator();

    var grid = try Grid(u8).init(allocator, size, size);
    defer grid.deinit();
    try parseInput(&grid);

    const start = Vector.fromPoint(0, 0);
    const end = Vector.fromPoint(size - 1, size - 1);

    const route1 = try aStarFindPath(&grid, start, end);
    defer allocator.free(route1.path);
    print("Answer 1: {d}\n", .{route1.gcost});

    var grid2 = try Grid(u8).init(allocator, size * 5, size * 5);
    defer grid2.deinit();

    // Add and increment first five tiles
    for (0..size) |y| {
        const s1: usize = y * size * 5;
        @memcpy(grid2.data[s1 .. s1 + size], grid.data[y * size .. y * size + size]);
        for (1..5) |m| for (0..size) |x| {
            const value = grid2.at(x + (m - 1) * size, y) + 1;
            grid2.set(x + (m * size), y, if (value == 10) 1 else value);
        };
    }
    // Add rest of points
    for (size..size * 5) |y| for (0..size * 5) |x| {
        const value = grid2.at(x, y - size) + 1;
        grid2.set(x, y, if (value == 10) 1 else value);
    };

    const end2 = Vector.fromPoint((size * 5) - 1, (size * 5) - 1);
    const route2 = try aStarFindPath(&grid2, start, end2);
    defer allocator.free(route2.path);
    print("Answer 2: {d}\n", .{route2.gcost});
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
