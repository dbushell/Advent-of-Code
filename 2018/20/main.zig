const std = @import("std");
const assert = std.debug.assert;
const print = std.debug.print;
const ArrayList = std.ArrayList;
const AutoHashMap = std.AutoHashMap;

const Point = @import("./src/point.zig").Point;
// const Grid = @import("./src/grid.zig").Grid;

const input = @embedFile("input.txt");

var gpa = std.heap.GeneralPurposeAllocator(.{}){};
const allocator = gpa.allocator();

const Char = enum(u8) { room = '.', wall = '#', doorh = '|', doorv = '-', start = 'X' };

/// Fix point to maintain 0,0 in top-left corner
fn normalize(point: Point, min_x: i32, min_y: i32) Point {
    // Coordinates are doubled to allow walls between
    const x = (point.x - min_x) * 2 + 1;
    const y = (point.y - min_y) * 2 + 1;
    return Point.init(x, y);
}

pub fn main() !void {
    defer _ = gpa.detectLeaks();

    // Points are offset from 0,0 at starting position
    const points = try parseInput();
    defer points.deinit();

    // Find min/max offset so 0,0 can be normalized
    var min_x: i32, var max_x: i32 = .{ std.math.maxInt(i32), 0 };
    var min_y: i32, var max_y: i32 = .{ std.math.maxInt(i32), 0 };
    for (points.items) |p| {
        min_x = @min(min_x, p.x);
        max_x = @max(max_x, p.x);
        min_y = @min(min_y, p.y);
        max_y = @max(max_y, p.y);
    }

    // Double the dimensions for walls between rooms
    // const width: u32 = 1 + 2 * (1 + @abs(min_x) + @abs(max_x));
    // const height: u32 = 1 + 2 * (1 + @abs(min_y) + @abs(max_y));

    // var grid = try Grid(Char).init(allocator, width, height, Char.wall);
    // defer grid.deinit();

    var rooms = ArrayList(Point).init(allocator);
    defer rooms.deinit();

    // Track to avoid path finding later
    var distances = AutoHashMap(u64, i32).init(allocator);
    defer distances.deinit();

    // Add starting position
    const start = normalize(points.items[0], min_x, min_y);
    // try grid.set(start, Char.start);
    try distances.put(start.key(), 0);

    // Add rooms and doors
    var previous = start.clone();
    for (1..points.items.len) |i| {
        const next = normalize(points.items[i], min_x, min_y);
        defer previous = next;
        // try grid.set(next, Char.room);
        if (!distances.contains(next.key())) try rooms.append(next);
        if (next.distance(previous) != 2) continue;
        // Update shortest room distance
        const distance = distances.get(next.key()) orelse std.math.maxInt(i32);
        try distances.put(next.key(), @min(distance, distances.get(previous.key()).? + 1));
        // Add door to previous room
        // var door = next.clone();
        // if (next.x == previous.x) {
        //     door.y += if (next.y > previous.y) -1 else 1;
        //     try grid.set(door, Char.doorv);
        // } else {
        //     door.x += if (next.x > previous.x) -1 else 1;
        //     try grid.set(door, Char.doorh);
        // }
    }

    // for (0..grid.height) |y| {
    //     for (0..grid.width) |x| {
    //         const char = try grid.at(x, y);
    //         print("{c}", .{@intFromEnum(char)});
    //     }
    //     print("\n", .{});
    // }
    // print("\n", .{});

    var longest: i32 = 0;
    var long: i32 = 0;
    for (rooms.items) |end| {
        const distance = distances.get(end.key()).?;
        if (distance > longest) longest = distance;
        if (distance >= 1000) long += 1;
    }

    print("Answer 1: {d}\n", .{longest});
    print("Answer 2: {d}\n", .{long});
}

fn parseInput() !ArrayList(Point) {
    var points = ArrayList(Point).init(allocator);
    var stack = ArrayList(Point).init(allocator);
    defer stack.deinit();

    var p = Point{ .x = 0, .y = 0 };
    try points.append(p);
    try stack.append(p);

    for (0..input.len - 1) |i| {
        switch (input[i]) {
            '^' => continue,
            '$' => return points,
            '(' => {
                try stack.append(p);
                continue;
            },
            ')' => {
                p = stack.pop();
                // Add again to ensure door to following room
                try points.append(p);
                continue;
            },
            '|' => {
                p = stack.getLast();
                // Add again to ensure door to following room
                try points.append(p);
                continue;
            },
            'N' => p = p.atUp(),
            'E' => p = p.atRight(),
            'S' => p = p.atDown(),
            'W' => p = p.atLeft(),
            else => unreachable,
        }
        try points.append(p);
    }
    return points;
}
