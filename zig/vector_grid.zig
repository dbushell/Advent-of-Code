const std = @import("std");
const Allocator = std.mem.Allocator;

const Vector = @import("./vector.zig").Vector;
const Point = Vector(2, usize);

pub fn Grid(comptime T: type) type {
    return struct {
        const Self = @This();

        allocator: Allocator,
        data: []T,
        width: usize,
        height: usize,

        pub fn init(allocator: Allocator, width: anytype, height: anytype) !Self {
            const w: usize = @intCast(width);
            const h: usize = @intCast(height);
            const data = try allocator.alloc(T, w * h);
            @memset(data, 0);
            return Self{
                .allocator = allocator,
                .data = data,
                .width = w,
                .height = h,
            };
        }

        pub fn deinit(self: Self) void {
            self.allocator.free(self.data);
        }

        pub fn inBounds(self: Self, x: anytype, y: anytype) bool {
            if (x < 0 or x >= self.width) return false;
            if (y < 0 or y >= self.height) return false;
            return true;
        }

        pub fn pointInBounds(self: Self, point: anytype) bool {
            return self.inBounds(point.x(), point.y());
        }

        pub fn at(self: Self, x: anytype, y: anytype) T {
            return self.data[self.width * @as(usize, @intCast(y)) + @as(usize, @intCast(x))];
        }

        pub fn set(self: *Self, x: anytype, y: anytype, value: T) void {
            self.data[self.width * @as(usize, @intCast(y)) + @as(usize, @intCast(x))] = value;
        }

        pub fn atPoint(self: Self, point: anytype) T {
            return self.at(@as(usize, @intCast(point.x())), @as(usize, @intCast(point.y())));
        }

        pub fn setPoint(self: *Self, point: anytype, value: T) void {
            self.set(@as(usize, @intCast(point.x())), @as(usize, @intCast(point.y())), value);
        }

        pub fn atVector(self: Self, v: @Vector(2, usize)) T {
            return self.at(v[0], v[1]);
        }

        pub fn setVector(self: *Self, v: @Vector(2, usize), value: T) void {
            self.set(v[0], v[1], value);
        }

        /// Flip horizontal axis
        pub fn flip(self: *Self) void {
            for (0..self.height) |y| {
                const i = self.width * y;
                std.mem.reverse(T, self.data[i .. i + self.width]);
            }
        }

        /// Rotate 90deg clockwise
        pub fn rotate(self: *Self) !void {
            if (self.width != self.height) return error.NotSquare;
            const state = try self.clone();
            defer state.deinit();
            for (0..self.width) |y| for (0..self.width) |x| {
                self.set(x, self.width - y - 1, self.at(y, x));
            };
        }

        pub fn format(self: Self, comptime fmt: []const u8, options: std.fmt.FormatOptions, writer: anytype) @TypeOf(writer).Error!void {
            _ = fmt;
            _ = options;
            for (0..self.height) |y| {
                for (0..self.width) |x| try std.fmt.format(writer, "{d} ", .{self.at(x, y)});
                try std.fmt.format(writer, "\n", .{});
            }
            try std.fmt.format(writer, "\n", .{});
        }
    };
}

test "Grid" {
    var m = try Grid(u8).init(std.testing.allocator, 9, 9);
    defer m.deinit();
    m.setPoint(Point.fromPoint(1, 1), 1);
    m.setPoint(Point.fromPoint(4, 4), 2);
    m.setPoint(Point.fromPoint(7, 7), 3);
    try std.testing.expectEqual(1, m.atPoint(Point.fromPoint(1, 1)));
    try std.testing.expectEqual(2, m.atPoint(Point.fromPoint(4, 4)));
    try std.testing.expectEqual(3, m.atPoint(Point.fromPoint(7, 7)));
}
