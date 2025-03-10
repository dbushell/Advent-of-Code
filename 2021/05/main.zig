const std = @import("std");
const assert = std.debug.assert;
const print = std.debug.print;
const ArrayList = std.ArrayList;
const AutoHashMap = std.AutoHashMap;

const Vector = @import("./src/vector.zig").Vector(2, usize);
const Grid = @import("./src/vector_grid.zig").Grid;

const input = @embedFile("input.txt");

const Line = struct {
    start: Vector,
    end: Vector,
};

/// Greatest common divisor
fn gcd(a: isize, b: isize) isize {
    return if (b == 0) a else gcd(b, @mod(a, b));
}

fn reduce(vec: @Vector(2, isize)) @Vector(2, isize) {
    return @divFloor(vec, @as(
        @Vector(2, isize),
        @splat(gcd(vec[0], vec[1])),
    ));
}

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer assert(gpa.deinit() == .ok);
    const allocator = gpa.allocator();

    var list = ArrayList(Line).init(allocator);
    defer list.deinit();
    try parseInput(&list);

    var min: @Vector(2, usize) = .{ 0, 0 };
    var max: @Vector(2, usize) = .{ 0, 0 };

    for (list.items) |item| {
        min = @min(min, item.start.vec);
        max = @max(max, item.end.vec);
    }

    var grid = try Grid(usize).init(allocator, max[0], max[1] + 1);
    defer grid.deinit();

    var overlap = AutoHashMap(@Vector(2, usize), void).init(allocator);
    defer overlap.deinit();

    for (list.items) |item| {
        const a = item.start;
        const b = item.end;
        if (a.x() != b.x() and a.y() != b.y()) continue;
        if (a.x() == b.x()) {
            for (a.y()..b.y() + 1) |y| {
                const point = Vector.fromPoint(a.x(), y);
                const value = grid.atPoint(point);
                grid.setPoint(point, value + 1);
                if (value == 1) try overlap.put(point.vec, {});
            }
        } else if (a.y() == b.y()) {
            for (a.x()..b.x() + 1) |x| {
                const point = Vector.fromPoint(x, a.y());
                const value = grid.atPoint(point);
                grid.setPoint(point, value + 1);
                if (value == 1) try overlap.put(point.vec, {});
            }
        }
    }

    print("Answer 1: {d}\n", .{overlap.count()});

    for (list.items) |item| {
        const a = item.start;
        const b = item.end;
        if (a.x() == b.x() or a.y() == b.y()) continue;
        const start: @Vector(2, isize) = @truncate(@as(@Vector(2, i126), a.vec));
        const end: @Vector(2, isize) = @truncate(@as(@Vector(2, i126), b.vec));
        const step = reduce(end - start);
        var vec = end;
        while (true) : (vec -= step) {
            const point = Vector.fromPoint(vec[0], vec[1]);
            const value = grid.atPoint(point);
            grid.setPoint(point, value + 1);
            if (value == 1) try overlap.put(point.vec, {});
            if (@reduce(.And, vec == start)) break;
        }
    }

    print("Answer 2: {d}\n", .{overlap.count()});
}

const parseInt = std.fmt.parseInt;
const splitScalar = std.mem.splitScalar;
const splitSequence = std.mem.splitSequence;

fn parseInput(list: *ArrayList(Line)) !void {
    var lines = splitScalar(u8, input, '\n');
    while (lines.next()) |line| {
        if (line.len == 0) continue;
        var parts = splitSequence(u8, line, " -> ");
        var a = splitScalar(u8, parts.next().?, ',');
        var b = splitScalar(u8, parts.next().?, ',');
        const start, const end = order: {
            const v1 = Vector.fromPoint(
                try parseInt(usize, a.next().?, 10),
                try parseInt(usize, a.next().?, 10),
            );
            const v2 = Vector.fromPoint(
                try parseInt(usize, b.next().?, 10),
                try parseInt(usize, b.next().?, 10),
            );
            if (v1.lt(v2)) break :order .{ v1, v2 };
            break :order .{ v2, v1 };
        };
        try list.append(Line{ .start = start, .end = end });
    }
}
