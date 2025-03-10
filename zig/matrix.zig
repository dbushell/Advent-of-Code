const std = @import("std");

const Vector = @import("./vector.zig").Vector;

const Point = Vector(2, usize);

pub fn Matrix(comptime T: type, comptime width: usize, comptime height: usize) type {
    return struct {
        const Self = @This();

        data: @Vector(width * height, T) = @splat(0),

        pub fn at(self: Self, x: usize, y: usize) T {
            return self.data[width * y + x];
        }

        pub fn set(self: *Self, x: usize, y: usize, value: T) void {
            self.data[width * y + x] = value;
        }

        pub fn atPoint(self: Self, v: Point) T {
            return self.at(v.x(), v.y());
        }

        pub fn setPoint(self: *Self, v: Point, value: T) void {
            self.set(v.x(), v.y(), value);
        }

        pub fn atVector(self: Self, v: @Vector(2, usize)) T {
            return self.at(v[0], v[1]);
        }

        pub fn setVector(self: *Self, v: @Vector(2, usize), value: T) void {
            self.set(v[0], v[1], value);
        }

        /// Flip horizontal axis
        pub fn flip(self: *Self) void {
            const mask: @Vector(width * height, i32) = comptime calc: {
                var array = [_]i32{0} ** (width * height);
                for (0..height) |y| {
                    for (0..width) |x| {
                        array[width * y + x] = width * y + width - x - 1;
                    }
                }
                break :calc array;
            };
            self.data = @shuffle(T, self.data, undefined, mask);
        }

        /// Rotate 90deg clockwise
        pub fn rotate(self: *Self) void {
            const mask: @Vector(width * height, i32) = comptime calc: {
                var array = [_]i32{0} ** (width * height);
                for (0..height) |y| {
                    for (0..width) |x| {
                        array[width * y + width - x - 1] = width * x + y;
                    }
                }
                break :calc array;
            };
            self.data = @shuffle(T, self.data, undefined, mask);
        }

        pub fn format(self: Self, comptime fmt: []const u8, options: std.fmt.FormatOptions, writer: anytype) @TypeOf(writer).Error!void {
            _ = fmt;
            _ = options;
            for (0..height) |y| {
                for (0..width) |x| try std.fmt.format(writer, "{d} ", .{self.atVector(.{ x, y })});
                try std.fmt.format(writer, "\n", .{});
            }
            try std.fmt.format(writer, "\n", .{});
        }
    };
}

test "Matrix" {
    var m = Matrix(u8, 9, 9){};
    m.setPoint(Point.fromPoint(1, 1), 1);
    m.setPoint(Point.fromPoint(4, 4), 2);
    m.setPoint(Point.fromPoint(7, 7), 3);
    try std.testing.expectEqual(1, m.atPoint(Point.fromPoint(1, 1)));
    try std.testing.expectEqual(2, m.atPoint(Point.fromPoint(4, 4)));
    try std.testing.expectEqual(3, m.atPoint(Point.fromPoint(7, 7)));
}

test "Matrix flip" {
    var m = Matrix(u8, 9, 9){};
    m.setPoint(Point.fromPoint(1, 1), 1);
    m.setPoint(Point.fromPoint(4, 4), 2);
    m.setPoint(Point.fromPoint(7, 7), 3);
    m.flip();
    try std.testing.expectEqual(1, m.atPoint(Point.fromPoint(7, 1)));
    try std.testing.expectEqual(2, m.atPoint(Point.fromPoint(4, 4)));
    try std.testing.expectEqual(3, m.atPoint(Point.fromPoint(1, 7)));
}

test "Matrix rotate" {
    var m = Matrix(u8, 9, 9){};
    m.setPoint(Point.fromPoint(1, 1), 1);
    m.setPoint(Point.fromPoint(4, 4), 2);
    m.setPoint(Point.fromPoint(7, 7), 3);
    m.rotate();
    try std.testing.expectEqual(1, m.atPoint(Point.fromPoint(7, 1)));
    try std.testing.expectEqual(2, m.atPoint(Point.fromPoint(4, 4)));
    try std.testing.expectEqual(3, m.atPoint(Point.fromPoint(1, 7)));
    m.rotate();
    try std.testing.expectEqual(3, m.atPoint(Point.fromPoint(1, 1)));
    try std.testing.expectEqual(2, m.atPoint(Point.fromPoint(4, 4)));
    try std.testing.expectEqual(1, m.atPoint(Point.fromPoint(7, 7)));
    m.rotate();
    try std.testing.expectEqual(3, m.atPoint(Point.fromPoint(7, 1)));
    try std.testing.expectEqual(2, m.atPoint(Point.fromPoint(4, 4)));
    try std.testing.expectEqual(1, m.atPoint(Point.fromPoint(1, 7)));
    m.rotate();
    try std.testing.expectEqual(1, m.atPoint(Point.fromPoint(1, 1)));
    try std.testing.expectEqual(2, m.atPoint(Point.fromPoint(4, 4)));
    try std.testing.expectEqual(3, m.atPoint(Point.fromPoint(7, 7)));
}
