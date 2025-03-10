const std = @import("std");

pub const Point = struct {
    x: i32 = 0,
    y: i32 = 0,

    pub fn init(x: i32, y: i32) Point {
        return Point{ .x = x, .y = y };
    }

    /// Return identical point
    pub fn clone(a: Point) Point {
        return Point.init(a.x, a.y);
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

    /// Return point coordinates: up, left, right, and down
    pub fn atAdjacent(a: Point) [4]Point {
        return [4]Point{ a.atUp(), a.atLeft(), a.atRight(), a.atDown() };
    }

    /// Return point coordinates: top-left, top-right, bottom-left, and bottom-right
    pub fn atCorners(a: Point) [4]Point {
        return [4]Point{
            Point.init(a.x - 1, a.y - 1),
            Point.init(a.x + 1, a.y - 1),
            Point.init(a.x - 1, a.y + 1),
            Point.init(a.x + 1, a.y + 1),
        };
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

    /// Rotate `a` around `b` by degrees
    pub fn rotate(a: Point, b: ?Point, deg: f64) Point {
        // Based on https://en.wikipedia.org/wiki/Rotation_of_axes_in_two_dimensions
        // Based on https://stackoverflow.com/a/17411276
        const rad: f64 = -std.math.rad_per_deg * deg;
        const cos: f64 = @cos(rad);
        const sin: f64 = @sin(rad);
        const ax: f64 = @floatFromInt(a.x);
        const ay: f64 = @floatFromInt(a.y);
        const bx: f64 = if (b) |c| @floatFromInt(c.x) else 0.0;
        const by: f64 = if (b) |c| @floatFromInt(c.y) else 0.0;
        return Point{
            .x = @intFromFloat(@round((cos * (ax - bx)) + (sin * (ay - by))) + bx),
            .y = @intFromFloat(@round((cos * (ay - by)) - (sin * (ax - bx))) + by),
        };
    }

    /// Returns unique hash key for point
    pub fn key(a: Point) u64 {
        return @as(u64, @as(u32, @bitCast(a.y))) << 32 | @as(u32, @bitCast(a.x));
    }

    /// Return anonymous struct with `x` and `y` integers
    pub fn destruct(a: Point) struct { i32, i32 } {
        return .{ a.x, a.y };
    }

    /// Format "x,y" format
    pub fn format(xy: Point, comptime fmt: []const u8, _: std.fmt.FormatOptions, writer: anytype) @TypeOf(writer).Error!void {
        try writer.print(
            if (fmt.len == 0) "{d},{d}" else fmt,
            .{ xy.x, xy.y },
        );
    }

    /// Debug print "x,y" format
    pub fn print(xy: Point) void {
        std.Progress.lockStdErr();
        defer std.Progress.unlockStdErr();
        const stderr = std.io.getStdErr().writer();
        xy.format("{d},{d}\n", .{}, stderr) catch unreachable;
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

test "Point rotation" {
    const a = Point.init(7, 7);
    const b = Point.init(-7, 7);
    try std.testing.expect(b.same(a.rotate(null, 90)));
}
