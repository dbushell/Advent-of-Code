const std = @import("std");

pub fn Vector(comptime len: comptime_int, comptime T: type) type {
    comptime if (len <= 1) {
        @compileError("Vector length must be greater than one");
    };

    return struct {
        const Self = @This();
        const Vec = @Vector(len, T);

        vec: Vec = @splat(0),
        len: usize = len,

        /// Returns a 2D point
        pub fn fromPoint(x: anytype, y: anytype) Self {
            return Self{ .vec = .{ @intCast(x), @intCast(y) } };
        }

        /// Returns vector from slice
        pub fn fromSlice(slice: []const T) Self {
            return Self{ .vec = slice[0..len].* };
        }

        /// Returns identical vector
        pub fn clone(v: Self) Self {
            return Self{ .vec = v.vec };
        }

        /// Returns true if `a` and `b` are identical
        pub fn eql(a: Self, b: Self) bool {
            return @reduce(.And, a.vec == b.vec);
        }

        /// Returns true if point `a` is before `b`
        pub fn lt(a: Self, b: Self) bool {
            if (a.vec[1] == b.vec[1]) return a.vec[0] < b.vec[0];
            return a.vec[1] < b.vec[1];
        }

        /// Returns point above
        pub fn atUp(v: Self) Self {
            return Self{ .vec = v.vec + (.{ 0, -1 } ++ [_]T{0} ** (len - 2)) };
        }

        /// Returns point below
        pub fn atDown(v: Self) Self {
            return Self{ .vec = v.vec + (.{ 0, 1 } ++ [_]T{0} ** (len - 2)) };
        }

        /// Returns point to left
        pub fn atLeft(v: Self) Self {
            return Self{ .vec = v.vec + (.{ -1, 0 } ++ [_]T{0} ** (len - 2)) };
        }

        /// Returns point to right
        pub fn atRight(v: Self) Self {
            return Self{ .vec = v.vec + (.{ 1, 0 } ++ [_]T{0} ** (len - 2)) };
        }

        /// Returns point coordinates: up, left, right, and down
        pub fn atAdjacent(v: Self) [4]Self {
            return .{ v.atUp(), v.atLeft(), v.atRight(), v.atDown() };
        }

        /// Returns point coordinates: top-left, top-right, bottom-left, and bottom-right
        pub fn atCorners(v: Self) [4]Self {
            return .{
                .{ .vec = v.vec + (.{ -1, -1 } ++ [_]T{0} ** (len - 2)) },
                .{ .vec = v.vec + (.{ 1, -1 } ++ [_]T{0} ** (len - 2)) },
                .{ .vec = v.vec + (.{ -1, 1 } ++ [_]T{0} ** (len - 2)) },
                .{ .vec = v.vec + (.{ 1, 1 } ++ [_]T{0} ** (len - 2)) },
            };
        }

        /// Returns adjacent and corner point coordinates
        pub fn atNeighbours(v: Self) [8]Self {
            return v.atAdjacent() ++ v.atCorners();
        }

        /// Returns the absolute Manhattan distance between `a` and `b`
        pub fn distance(a: Self, b: Self) T {
            return @intCast(@reduce(.Add, @abs(a.vec - b.vec)));
        }

        /// Returns rotation of `a` around `b` by degrees
        pub fn rotate(a: Self, b: ?Self, deg: f64) Self {
            // Based on https://en.wikipedia.org/wiki/Rotation_of_axes_in_two_dimensions
            // Based on https://stackoverflow.com/a/17411276
            const rad: f64 = -std.math.rad_per_deg * deg;
            const cos: f64 = @cos(rad);
            const sin: f64 = @sin(rad);
            const ax: f64 = @floatFromInt(a.x());
            const ay: f64 = @floatFromInt(a.y());
            const bx: f64 = if (b) |c| @floatFromInt(c.x()) else 0.0;
            const by: f64 = if (b) |c| @floatFromInt(c.y()) else 0.0;
            return Self.fromPoint(
                // @as(T, @intFromFloat(@round((cos * (ax - bx)) + (sin * (ay - by))) + bx)),
                @as(T, @intFromFloat(@round(@mulAdd(f64, cos, ax - bx, @mulAdd(f64, sin, ay - by, bx))))),
                // @as(T, @intFromFloat(@round((cos * (ay - by)) - (sin * (ax - bx))) + by)),
                @as(T, @intFromFloat(@round(@mulAdd(f64, cos, ay - by, -@mulAdd(f64, sin, ax - bx, by))))),
            );
        }

        /// Format "x,y,z..." for debug print
        pub fn format(v: Self, comptime fmt: []const u8, _: std.fmt.FormatOptions, writer: anytype) @TypeOf(writer).Error!void {
            var i: usize = 0;
            while (i < len) : (i += 1) {
                try std.fmt.format(writer, if (fmt.len == 0) "{any}" else fmt, .{v.vec[i]});
                if (i < len - 1) try writer.writeAll(",");
            }
        }

        pub usingnamespace switch (len) {
            2 => struct {
                pub fn x(v: Self) T {
                    return v.vec[0];
                }
                pub fn y(v: Self) T {
                    return v.vec[1];
                }
            },
            else => struct {
                pub fn x(v: Self) T {
                    return v.vec[0];
                }
                pub fn y(v: Self) T {
                    return v.vec[1];
                }
                pub fn z(v: Self) T {
                    return v.vec[2];
                }
            },
        };
    };
}

test "Point creation" {
    const Point = Vector(2, isize);
    const a = Point.fromPoint(1, 1);
    try std.testing.expectEqual(1, a.x());
    try std.testing.expectEqual(1, a.y());
    // Compare manual init
    const b = Point{ .vec = .{ 1, 1 } };
    try std.testing.expect(a.eql(b));
    // Compare copy init
    const c = b.clone();
    try std.testing.expect(a.eql(c));
    // Compare slice
    const d = Point.fromSlice(&[_]isize{ 1, 1 });
    try std.testing.expect(a.eql(d));
}

test "Point distance" {
    const Point = Vector(2, isize);
    const a = Point.fromPoint(1, 3);
    const b = Point.fromPoint(5, 6);
    try std.testing.expectEqual(0, a.distance(a));
    try std.testing.expectEqual(7, a.distance(b));
}

test "Point compare" {
    const Point = Vector(2, isize);
    const a = Point.fromPoint(1, 3);
    const b = Point.fromPoint(2, 3);
    const c = Point.fromPoint(2, 4);
    try std.testing.expect(a.lt(b));
    try std.testing.expect(b.lt(c));
    try std.testing.expect(a.lt(c));
}

test "Point rotation" {
    const Point = Vector(2, isize);
    const a = Point.fromPoint(7, 7);
    const b = Point.fromPoint(-7, 7);
    try std.testing.expect(b.eql(a.rotate(null, 90)));
}

test "Vector string format" {
    const v: Vector(3, i32) = .{ .vec = .{ -42, 42, -24 } };
    var buf = [_]u8{0} ** 128;
    const formatted = try std.fmt.bufPrint(&buf, "{any} x:{d} y:{d} z:{d}", .{ v, v.x(), v.y(), v.z() });
    try std.testing.expectEqualStrings("-42,42,-24 x:-42 y:42 z:-24", formatted);
}

test "Point neighbours" {
    const Ta = @Vector(2, isize);
    const Point = Vector(2, isize);
    const a = Point.fromPoint(3, 3);
    const adjacent = a.atAdjacent();
    try std.testing.expectEqual(Ta{ 3, 2 }, adjacent[0].vec);
    try std.testing.expectEqual(Ta{ 2, 3 }, adjacent[1].vec);
    try std.testing.expectEqual(Ta{ 4, 3 }, adjacent[2].vec);
    try std.testing.expectEqual(Ta{ 3, 4 }, adjacent[3].vec);
    const Tc = @Vector(3, isize);
    const b = Vector(3, isize){ .vec = .{ 7, 7, 7 } };
    const corners = b.atCorners();
    try std.testing.expectEqual(Tc{ 6, 6, 7 }, corners[0].vec);
    try std.testing.expectEqual(Tc{ 8, 6, 7 }, corners[1].vec);
    try std.testing.expectEqual(Tc{ 6, 8, 7 }, corners[2].vec);
    try std.testing.expectEqual(Tc{ 8, 8, 7 }, corners[3].vec);
}
