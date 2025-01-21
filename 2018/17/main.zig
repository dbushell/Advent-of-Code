const std = @import("std");
const assert = std.debug.assert;
const parseInt = std.fmt.parseInt;
const print = std.debug.print;
const ArrayList = std.ArrayList;

const Point = @import("./src/point.zig").Point;
const Grid = @import("./src/grid.zig").Grid;
const GridError = @import("./src/grid.zig").GridError;

const inputText = @embedFile("input.txt");

var gpa = std.heap.GeneralPurposeAllocator(.{}){};
const allocator = gpa.allocator();

// Follow the waterfall down until it reaches a clay tile
fn cascade(grid: *Grid(u8), start: Point) GridError!void {
    var point = start.clone();
    while (point.y < grid.height) : (point = point.atDown()) {
        const at = try grid.get(point);
        if (at == '.') try grid.set(point, '|');
        if (at == '#') break try pool(grid, point.atUp());
    }
}

// Fill in water pool moving upwards until new cascade
fn pool(grid: *Grid(u8), start: Point) GridError!void {
    var point = start.clone();
    try grid.set(start, '~');
    var pooling = true;
    while (pooling) : (point = point.atUp()) {
        if (!grid.inBounds(point)) break;
        try grid.set(point, '~');
        // Expand left
        var left = point.atLeft();
        while (grid.inBounds(left)) : (left = left.atLeft()) {
            if (try grid.get(left) == '#') break;
            try grid.set(left, '~');
            const at_down = try grid.get(left.atDown());
            if (at_down == '.') try cascade(grid, left);
            if (at_down == '|' or at_down == '.') {
                pooling = false;
                break;
            }
        }
        // Expand right
        var right = point.atRight();
        while (grid.inBounds(right)) : (right = right.atRight()) {
            if (try grid.get(right) == '#') break;
            try grid.set(right, '~');
            const at_down = try grid.get(right.atDown());
            if (at_down == '.') try cascade(grid, right);
            if (at_down == '|' or at_down == '.') {
                pooling = false;
                break;
            }
        }
    }
}

pub fn main() !void {
    defer _ = gpa.detectLeaks();

    var data = ArrayList([4]usize).init(allocator);
    defer data.deinit();

    parseInput(&data);

    // Find grid dimensions
    var min_x: usize, var max_x: usize = .{ std.math.maxInt(usize), 0 };
    var min_y: usize, var max_y: usize = .{ std.math.maxInt(usize), 0 };
    for (data.items) |item| {
        if (item[0] == 'x') {
            min_x = @min(min_x, item[1]);
            max_x = @max(max_x, item[1]);
            min_y = @min(min_y, item[2]);
            max_y = @max(max_y, item[3]);
        } else {
            min_y = @min(min_y, item[1]);
            max_y = @max(max_y, item[1]);
            min_x = @min(min_x, item[2]);
            max_x = @max(max_x, item[3]);
        }
    }
    print("min: {d},{d}  max: {d},{d}\n\n", .{ min_x, min_y, max_x, max_y });

    // Addition cascade padding since "Any x coordinate is valid"
    min_x -= 1;
    max_x += 1;

    var grid = try Grid(u8).init(allocator, max_x + 1, max_y + 1, '.');
    defer grid.deinit();

    // Setup grid data
    for (data.items) |item| {
        const a: i32 = @intCast(item[1]);
        if (item[0] == 'x') {
            for (item[2]..item[3] + 1) |y| try grid.set(.{ .x = a, .y = @intCast(y) }, '#');
        } else {
            for (item[2]..item[3] + 1) |x| try grid.set(.{ .x = @intCast(x), .y = a }, '#');
        }
    }

    // Start at spring location
    try cascade(&grid, Point.init(500, @intCast(min_y)));

    // Fill in the temporary "|" cascade tiles
    for (min_y..max_y + 1) |y| {
        for (min_x..max_x + 1) |x| {
            const p = Point.init(@intCast(x), @intCast(y));
            if (try grid.get(p) != '|') continue;
            if (try grid.get(p.atUp()) != '~') continue;
            try grid.set(p.atUp(), '|');
            var left = p.atUp().atLeft();
            var right = p.atUp().atRight();
            while (try grid.get(left) == '~') : (left = left.atLeft()) try grid.set(left, '|');
            while (try grid.get(right) == '~') : (right = right.atRight()) try grid.set(right, '|');
        }
    }

    var water_tiles: usize = 0;
    var pool_tiles: usize = 0;

    // Draw to screen and count tiles
    for (min_y..max_y + 1) |y| {
        for (min_x..max_x + 1) |x| {
            const point = Point.init(@intCast(x), @intCast(y));
            const char = try grid.get(point);
            if (char == '|' or char == '~') water_tiles += 1;
            if (char == '~') pool_tiles += 1;
            print("{c}", .{char});
        }
        print("\n", .{});
    }
    print("\n", .{});

    print("Answer 1: {d}\n", .{water_tiles});
    print("Answer 2: {d}\n", .{pool_tiles});
}

fn parseInput(data: *ArrayList([4]usize)) void {
    var lines = std.mem.splitScalar(u8, inputText, '\n');
    while (lines.next()) |line| {
        if (line.len == 0) continue;
        var chars = std.mem.tokenizeAny(u8, line, "xy=, ..");
        var values: [4]usize = .{0} ** 4;
        values[0] = if (line[0] == 'x') 'x' else 'y';
        var i: usize = 1;
        while (chars.next()) |char| : (i += 1) {
            values[i] = parseInt(usize, char, 10) catch 0;
        }
        data.append(values) catch unreachable;
    }
}
