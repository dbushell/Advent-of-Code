const std = @import("std");
const ArrayList = std.ArrayList;
const AutoHashMap = std.AutoHashMap;
const Allocator = std.mem.Allocator;
const Point = @import("./point.zig").Point;

const GridError = error{OutOfBounds};

pub fn Grid(comptime T: type) type {
    return struct {
        const Self = @This();

        allocator: Allocator,
        data: [][]T,
        width: usize,
        height: usize,

        pub fn init(allocator: Allocator, width: usize, height: usize, default: ?T) !Self {
            const data = try allocator.alloc([]T, height);
            for (0..height) |y| {
                data[y] = try allocator.alloc(T, width);
                if (default) |value| {
                    for (0..width) |x| data[y][x] = value;
                }
            }
            return Self{
                .allocator = allocator,
                .data = data,
                .width = width,
                .height = height,
            };
        }

        pub fn deinit(self: Self) void {
            for (0..self.height) |i| {
                self.allocator.free(self.data[i]);
            }
            self.allocator.free(self.data);
        }

        /// Returns true if point is valid
        pub fn inBounds(self: Self, xy: Point) bool {
            if (xy.x < 0 or xy.x >= self.width) return false;
            if (xy.y < 0 or xy.y >= self.height) return false;
            return true;
        }

        /// Return value at point
        pub fn get(self: Self, xy: Point) GridError!T {
            if (!self.inBounds(xy)) return error.OutOfBounds;
            return self.data[@intCast(xy.y)][@intCast(xy.x)];
        }

        /// Set value at point
        pub fn set(self: *Self, xy: Point, value: T) GridError!void {
            if (!self.inBounds(xy)) return error.OutOfBounds;
            self.data[@intCast(xy.y)][@intCast(xy.x)] = value;
        }

        /// Basic BFS path find algorithm
        pub fn findPath(self: *Self, start: Point, end: Point, blocked: AutoHashMap(u64, Point)) ![]Point {
            var visited = AutoHashMap(u64, ?Point).init(self.allocator);
            defer visited.deinit();
            var queue = ArrayList(Point).init(self.allocator);
            defer queue.deinit();
            try queue.append(start);
            try visited.put(start.key(), null);
            while (queue.items.len > 0) {
                const current = queue.orderedRemove(0);
                if (end.same(current)) {
                    var route = std.ArrayList(Point).init(self.allocator);
                    var step: ?Point = current;
                    while (step != null) {
                        try route.append(step.?);
                        step = visited.get(step.?.key()) orelse null;
                    }
                    return route.toOwnedSlice();
                }
                for (current.atAdjacent()) |adjacent| {
                    if (!self.inBounds(adjacent)) continue;
                    if (blocked.contains(adjacent.key())) continue;
                    if (visited.contains(adjacent.key())) continue;
                    try visited.put(adjacent.key(), current);
                    try queue.append(adjacent);
                }
            }
            return &[_]Point{};
        }
    };
}

test "Grid set and get integer" {
    const allocator = std.testing.allocator;
    var grid = try Grid(i32).init(allocator, 10, 10, 0);
    defer grid.deinit();
    const xy: Point = .{ .x = 7, .y = 7 };
    try grid.set(xy, 777);
    try std.testing.expectEqual(777, try grid.get(xy));
}

test "Grid set out of bounds error" {
    const allocator = std.testing.allocator;
    var grid = try Grid(i32).init(allocator, 10, 10, 0);
    defer grid.deinit();
    try std.testing.expectError(GridError.OutOfBounds, grid.set(.{ .x = -1, .y = -1 }, 0));
}

test "Grid string values" {
    const allocator = std.testing.allocator;
    var grid = try Grid([]const u8).init(allocator, 10, 10, "");
    defer grid.deinit();
    const xy: Point = .{ .x = 7, .y = 7 };
    try grid.set(xy, "777");
    try std.testing.expectEqual("777", try grid.get(xy));
}

test "Grid struct values" {
    const allocator = std.testing.allocator;
    const Boxed = struct { value: i32 };
    var grid = try Grid(Boxed).init(allocator, 10, 10, null);
    defer grid.deinit();
    const xy: Point = .{ .x = 7, .y = 7 };
    const box = Boxed{ .value = 7 };
    try grid.set(xy, box);
    try std.testing.expectEqual(box, try grid.get(xy));
}
