const std = @import("std");

pub const Point = struct {
    x: i32 = 0,
    y: i32 = 0,

    pub fn init(x: i32, y: i32) Point {
        return Point{ .x = x, .y = y };
    }

    /// Returns point above
    pub fn atUp(a: Point) Point {
        return Point.init(a.x, a.y - 1);
    }

    /// Returns point below
    pub fn atDown(a: Point) Point {
        return Point.init(a.x, a.y + 1);
    }

    /// Returns point to left
    pub fn atLeft(a: Point) Point {
        return Point.init(a.x - 1, a.y);
    }

    /// Returns point to right
    pub fn atRight(a: Point) Point {
        return Point.init(a.x + 1, a.y);
    }

    /// Return point coordinates: up, right, down, and left
    pub fn atAdjacent(a: Point) [4]Point {
        return [4]Point{ a.atUp(), a.atRight(), a.atDown(), a.atLeft() };
    }

    /// Return point coordinates: top-left, top-right, bottom-right, and bottom-left
    pub fn atCorners(a: Point) [4]Point {
        const points = [4]Point{};
        points[0] = Point.init(a.x - 1, a.y - 1);
        points[1] = Point.init(a.x + 1, a.y - 1);
        points[2] = Point.init(a.x + 1, a.y + 1);
        points[3] = Point.init(a.x - 1, a.y + 1);
        return points;
    }

    /// Returns -1 if point `a` is before `b`, `1` if after, or `0` if same
    pub fn compare(a: Point, b: Point) i32 {
        if (a.y == b.y) return @min(1, @max(-1, a.x - b.x));
        return @min(1, @max(-1, a.y - b.y));
    }

    /// Returns true if `a` and `b` coordinates are exactly the same
    pub fn same(a: Point, b: Point) bool {
        return a.compare(b) == 0;
    }

    /// Returns the absolute Manhattan distance between `a` and `b`
    pub fn distance(a: Point, b: Point) u32 {
        return @abs(a.x - b.x) + @abs(a.y - b.y);
    }

    /// Returns unique hash key for point
    pub fn key(a: Point) u64 {
        return @as(u64, @as(u32, @bitCast(a.y))) << 32 | @as(u32, @bitCast(a.x));
    }

    /// Debug print "x,y" format
    pub fn print(xy: Point) void {
        std.debug.print("{d},{d}\n", .{ xy.x, xy.y });
    }
};

test "Point distance" {
    const a = Point.init(1, 3);
    const b = Point.init(5, 6);
    try std.testing.expectEqual(0, a.distance(a));
    try std.testing.expectEqual(7, a.distance(b));
}

test "Point comparison" {
    const a = Point.init(7, 2);
    const b = Point.init(2, 7);
    try std.testing.expect(a.same(a));
    try std.testing.expect(a.same(b) == false);
    try std.testing.expectEqual(-1, a.compare(b));
    try std.testing.expectEqual(1, b.compare(a));
}
