const std = @import("std");
const assert = std.debug.assert;
const print = std.debug.print;
const parseInt = std.fmt.parseInt;
const splitScalar = std.mem.splitScalar;
const ArrayList = std.ArrayList;
const AutoHashMap = std.AutoHashMap;
const PriorityQueue = std.PriorityQueue;

const Point = @import("./src/point.zig").Point;
const Grid = @import("./src/grid.zig").Grid;

const input = @embedFile("input.txt");

var gpa = std.heap.GeneralPurposeAllocator(.{}){};
const allocator = gpa.allocator();

const Char = enum(u8) { rocky = '.', wet = '=', narrow = '|', mouth = 'M', target = 'T', path = '*' };
const Equipment = enum { none, torch, gear };
const Node = struct { point: Point, item: Equipment, from: u64 = 0, gcost: i32 = 0, hcost: i32 = 0 };
const NodeMap = AutoHashMap(u64, Node);
const NodeQueue = PriorityQueue(u64, *const NodeMap, compareNode);

/// Unique key for point + equipment
fn hashNode(node: Node) u64 {
    var buf: [32]u8 = undefined;
    const slice = std.fmt.bufPrint(&buf, "{d}", .{node.point.key()}) catch unreachable;
    return std.hash.XxHash3.hash(@intFromEnum(node.item), slice);
}

/// Priority queue compare function
fn compareNode(map: *const NodeMap, k1: u64, k2: u64) std.math.Order {
    const n1 = map.get(k1).?;
    const n2 = map.get(k2).?;
    // Is adding `hcost` necessary?
    return std.math.order(n1.gcost + n1.hcost, n2.gcost + n2.hcost);
}

/// Calculate minute cost for moving to next node
fn hcostNode(grid: *Grid(Char), current: Node, next: *Node) !void {
    const current_region = try grid.get(current.point);
    const next_region = try grid.get(next.point);
    next.hcost = 1;
    if (next_region == current_region) return;
    if (next_region == Char.rocky and current.item == Equipment.none) {
        next.hcost += 7;
        next.item = switch (current_region) {
            .wet => Equipment.gear,
            .narrow => Equipment.torch,
            else => unreachable,
        };
    } else if (next_region == Char.wet and current.item == Equipment.torch) {
        next.hcost += 7;
        next.item = switch (current_region) {
            .rocky => Equipment.gear,
            .narrow => Equipment.none,
            else => unreachable,
        };
    } else if (next_region == Char.narrow and current.item == Equipment.gear) {
        next.hcost += 7;
        next.item = switch (current_region) {
            .rocky => Equipment.torch,
            .wet => Equipment.none,
            else => unreachable,
        };
    }
}

/// Adapt the `Grid.findPath` method using A* algorithm
fn aStarFindPath(grid: *Grid(Char), start: Point, end: Point) !struct { path: []Point, gcost: i32 } {
    var nodes = NodeMap.init(allocator);
    defer nodes.deinit();
    var frontier = NodeQueue.init(allocator, &nodes);
    defer frontier.deinit();

    const start_node = Node{ .point = start, .item = Equipment.torch };
    try nodes.put(hashNode(start_node), start_node);
    try frontier.add(hashNode(start_node));

    while (frontier.count() > 0) {
        const current = nodes.get(frontier.remove()).?;
        if (current.point.same(end)) {
            var route = std.ArrayList(Point).init(allocator);
            errdefer route.deinit();
            var step: ?Node = current;
            while (step != null) : (step = nodes.get(step.?.from) orelse null) {
                if (step.?.point.same(start)) break;
                try route.append(step.?.point);
            }
            const path = try route.toOwnedSlice();
            std.mem.reverse(Point, path);
            // Must switch to torch at target point
            var gcost = current.gcost;
            if (current.item != Equipment.torch) gcost += 7;
            return .{ .path = path, .gcost = gcost };
        }
        for (current.point.atAdjacent()) |adjacent| {
            if (!grid.inBounds(adjacent)) continue;
            var next = Node{
                .point = adjacent,
                .item = current.item,
                .from = hashNode(current),
                .gcost = current.gcost,
            };
            try hcostNode(grid, current, &next);
            next.gcost += next.hcost;
            const existing = nodes.get(hashNode(next));
            if (existing == null or next.gcost < existing.?.gcost) {
                try nodes.put(hashNode(next), next);
                try frontier.add(hashNode(next));
            }
        }
    }
    return error.PathNotFound;
}

pub fn main() !void {
    defer _ = gpa.detectLeaks();

    // Parse input
    var lines = splitScalar(u8, input, '\n');
    const depth = try parseInt(i32, lines.next().?[7..], 10);
    var target = splitScalar(u8, lines.next().?, ',');
    const target_x = try parseInt(i32, target.next().?[8..], 10);
    const target_y = try parseInt(i32, target.next().?, 10);

    // Extend bounds beyond target
    const width: usize = @intCast(target_x + 50);
    const height: usize = @intCast(target_y + 10);
    var grid = try Grid(Char).init(allocator, width, height, null);
    defer grid.deinit();

    const start = Point.init(0, 0);
    const end = Point.init(target_x, target_y);

    var erosion_levels = AutoHashMap(u64, i32).init(allocator);
    defer erosion_levels.deinit();

    var risk_level: i32 = 0;

    for (0..grid.height) |y| {
        for (0..grid.width) |x| {
            const ix: i32 = @intCast(x);
            const iy: i32 = @intCast(y);
            const point = Point.init(ix, iy);
            const geo_index: i32 = calc: {
                if (point.same(start)) break :calc 0;
                if (point.same(end)) break :calc 0;
                if (y == 0) break :calc ix * 16807;
                if (x == 0) break :calc iy * 48271;
                const a = erosion_levels.get(point.atLeft().key());
                const b = erosion_levels.get(point.atUp().key());
                break :calc a.? * b.?;
            };
            const erosion: i32 = @mod(geo_index + depth, 20183);
            try erosion_levels.put(point.key(), erosion);
            const char: Char = switch (@mod(erosion, 3)) {
                0 => Char.rocky,
                1 => Char.wet,
                2 => Char.narrow,
                else => unreachable,
            };
            if (x <= target_x and y <= target_y) {
                risk_level += switch (char) {
                    .wet => 1,
                    .narrow => 2,
                    else => 0,
                };
            }
            try grid.set(point, char);
        }
    }

    const astar = try aStarFindPath(&grid, start, end);
    defer allocator.free(astar.path);

    for (0..grid.height) |y| {
        for (0..grid.width) |x| {
            const point = Point.init(@intCast(x), @intCast(y));
            var char = try grid.get(point);
            const route = match: {
                for (astar.path) |p| if (p.same(point)) break :match true;
                break :match false;
            };
            if (point.same(start)) char = Char.mouth;
            if (point.same(end)) char = Char.target;
            if (route or point.same(start)) {
                print("\x1b[1;32m{c}\x1b[0m", .{@intFromEnum(char)});
                continue;
            }
            print("{c}", .{@intFromEnum(char)});
        }
        print("\n", .{});
    }

    print("Answer 1: {d}\n", .{risk_level});
    print("Answer 2: {d}\n", .{astar.gcost});
}
