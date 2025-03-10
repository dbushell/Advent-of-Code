const std = @import("std");
const assert = std.debug.assert;
const print = std.debug.print;
const ArrayList = std.ArrayList;

const Vector = @import("./src/vector.zig").Vector(2, i32);
const Grid = @import("./src/vector_grid.zig").Grid;
const VectorList = ArrayList(Vector);

const input = @embedFile("input.txt");

const Axis = enum {
    horizontal,
    vertical,
};

fn origami(a: *Grid(u8), size: usize, fold: Axis) !*Grid(u8) {
    const width = if (fold == .horizontal) size else a.width;
    const height = if (fold == .vertical) size else a.height;
    const b = try a.allocator.create(Grid(u8));
    b.* = try Grid(u8).init(a.allocator, width, height);
    for (0..a.height) |y| for (0..a.width) |x| {
        if (a.at(x, y) == 0) continue;
        switch (fold) {
            .horizontal => {
                if (x < size) b.set(x, y, 1);
                if (x > size) b.set((size - 1) - (x - size - 1), y, 1);
            },
            .vertical => {
                if (y < size) b.set(x, y, 1);
                if (y > size) b.set(x, (size - 1) - (y - size - 1), 1);
            },
        }
    };
    return b;
}

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer assert(gpa.deinit() == .ok);
    const allocator = gpa.allocator();

    var points = VectorList.init(allocator);
    defer points.deinit();
    var folds = VectorList.init(allocator);
    defer folds.deinit();
    try parseInput(&points, &folds);

    // Unfolded paper size
    var max: @Vector(2, i32) = points.items[0].vec;
    for (points.items) |p| max = @max(max, p.vec);

    // Add dots to unfolded paper
    var grid = try allocator.create(Grid(u8));
    grid.* = try Grid(u8).init(allocator, max[0] + 1, max[1] + 1);
    defer {
        grid.deinit();
        allocator.destroy(grid);
    }
    for (points.items) |p| grid.setPoint(p, 1);

    var count: usize = 0;
    for (folds.items, 0..) |item, i| {
        const fold: Axis = if (item.x() > 0) .horizontal else .vertical;
        const size: usize = @intCast(if (item.x() > 0) item.x() else item.y());
        const next = try origami(grid, size, fold);
        grid.deinit();
        allocator.destroy(grid);
        grid = next;
        if (i == 0) {
            for (grid.data) |c| count += c;
        }
    }
    print("\n", .{});
    for (0..grid.height) |y| {
        for (0..grid.width) |x| {
            print("{c} ", .{@as(u8, if (grid.at(x, y) > 0) '#' else ' ')});
        }
        print("\n", .{});
    }
    print("\nAnswer 1: {d}\n", .{count});
    print("Answer 2: [read above]\n", .{});
}

const parseInt = std.fmt.parseInt;
const splitScalar = std.mem.splitScalar;
const startsWith = std.mem.startsWith;

const Parser = enum {
    points,
    folds,
};

fn parseInput(points: *VectorList, folds: *VectorList) !void {
    var state = Parser.points;
    var lines = splitScalar(u8, input, '\n');
    while (lines.next()) |line| {
        if (line.len == 0) {
            state = Parser.folds;
            continue;
        }
        if (state == Parser.points) {
            var parts = splitScalar(u8, line, ',');
            try points.append(Vector.fromPoint(
                try parseInt(i32, parts.next().?, 10),
                try parseInt(i32, parts.next().?, 10),
            ));
        }
        if (state == Parser.folds and startsWith(u8, line, "fold along ")) {
            var parts = splitScalar(u8, line[11..], '=');
            const axis = parts.next().?;
            const value = try parseInt(i32, parts.next().?, 10);
            if (axis[0] == 'x') try folds.append(Vector.fromPoint(value, 0));
            if (axis[0] == 'y') try folds.append(Vector.fromPoint(0, value));
        }
    }
}
