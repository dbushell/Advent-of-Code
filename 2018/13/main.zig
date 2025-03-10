const std = @import("std");
const assert = std.debug.assert;
const print = std.debug.print;
const AutoHashMap = std.AutoHashMap;
const Allocator = std.mem.Allocator;
const Point = @import("./src/point.zig").Point;
const Grid = @import("./src/grid.zig").Grid;

const input = @embedFile("input.txt");

var gpa = std.heap.GeneralPurposeAllocator(.{}){};
const allocator = gpa.allocator();

const Direction = enum(u8) {
    up,
    right,
    down,
    left,

    fn castChar(char: u8) ?Direction {
        return switch (char) {
            '^' => Direction.up,
            '>' => Direction.right,
            'v' => Direction.down,
            '<' => Direction.left,
            else => null,
        };
    }
};

const Cart = struct {
    id: u32,
    point: Point,
    direction: Direction,
    next: ?Point = undefined,
    turn: u32 = 0,

    fn sort(_: void, a: ?Cart, b: ?Cart) bool {
        if (a != null and b == null) return true;
        if (a == null and b != null) return false;
        if (a == null and b == null) return false;
        if (a.?.point.compare(b.?.point) == -1) return true;
        return false;
    }
};

pub fn main() !void {
    const width = std.mem.indexOf(u8, input, "\n") orelse 0;
    const height = std.mem.count(u8, input, "\n");

    var grid = try Grid(u8).init(allocator, width, height, null);
    defer grid.deinit();

    var cartMap = AutoHashMap(u64, Cart).init(allocator);
    defer cartMap.deinit();

    var ly: i32 = 0;
    var id: u32 = 0;
    var lines = std.mem.tokenizeScalar(u8, input, '\n');
    while (lines.next()) |line| : (ly += 1) {
        if (line.len != width) break;
        for (0..line.len) |x| {
            var char = line[x];
            const point = Point.init(@intCast(x), @intCast(ly));
            if (Direction.castChar(char)) |direction| {
                defer id += 1;
                try cartMap.put(point.key(), .{ .id = id, .point = point, .direction = direction });
                char = switch (direction) {
                    .up, .down => '|',
                    .left, .right => '-',
                };
            }
            try grid.set(point, char);
        }
    }

    var crashed = false;
    while (true) {
        var carts: [20]?Cart = [_]?Cart{null} ** 20;
        var carts_len: usize = 0;

        var cart_iter = cartMap.valueIterator();
        while (cart_iter.next()) |cart| : (carts_len += 1) {
            cart.next = switch (cart.direction) {
                .up => cart.point.atUp(),
                .down => cart.point.atDown(),
                .left => cart.point.atLeft(),
                .right => cart.point.atRight(),
            };
            carts[carts_len] = cart.*;
        }

        // Doesn't seem to matter...
        std.mem.sort(?Cart, &carts, {}, Cart.sort);

        for (0..carts_len) |i| {
            var c1 = carts[i];
            if (c1 == null) continue;
            for (0..carts_len) |j| {
                var c2 = carts[j];
                if (c2 == null) continue;
                if (c1.?.id == c2.?.id) continue;
                if (c1.?.next.?.same(c2.?.point) or c1.?.next.?.same(c2.?.next.?)) {
                    if (crashed == false) {
                        crashed = true;
                        var buf: [32]u8 = undefined;
                        const slice = try std.fmt.bufPrint(&buf, "{any}", .{c1.?.next.?});
                        print("Answer 1: {s}\n", .{slice});
                    }
                    assert(cartMap.remove(c1.?.point.key()));
                    assert(cartMap.remove(c2.?.point.key()));
                    assert(@mod(cartMap.count(), 2) != 0);
                    carts[i] = null;
                    carts[j] = null;
                }
            }
        }

        for (carts) |maybe| {
            if (maybe == null) continue;
            var cart = maybe.?;
            const track = try grid.get(cart.next.?);
            var dir: i32 = @intFromEnum(cart.direction);
            if (track == '+') {
                dir += if (cart.turn == 0) -1 else if (cart.turn == 2) 1 else 0;
                cart.turn = @mod(cart.turn + 1, 3);
            } else dir += switch (cart.direction) {
                .up, .down => turn: {
                    if (track == '\\') break :turn -1;
                    if (track == '/') break :turn 1;
                    break :turn 0;
                },
                .left, .right => turn: {
                    if (track == '\\') break :turn 1;
                    if (track == '/') break :turn -1;
                    break :turn 0;
                },
            };
            assert(cartMap.remove(cart.point.key()));
            cart.point = cart.next.?;
            cart.direction = @enumFromInt(@mod(dir, 4));
            cartMap.put(cart.point.key(), cart) catch unreachable;
            assert(@mod(cartMap.count(), 2) != 0);
        }

        if (cartMap.count() == 1) {
            cart_iter = cartMap.valueIterator();
            const cart = cart_iter.next().?;
            var buf: [32]u8 = undefined;
            const slice = try std.fmt.bufPrint(&buf, "{any}", .{cart.point});
            print("Answer 2: {s}\n", .{slice});
            break;
        }
    }
}
