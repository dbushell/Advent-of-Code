const std = @import("std");

const inputText = @embedFile("input.txt");
const input = std.fmt.parseInt(i32, inputText[0 .. inputText.len - 1], 10) catch 0;

var power_levels: [301][301]?i32 = undefined;

fn powerLevel(x: i32, y: i32, serial: ?i32) i32 {
    return power_levels[@intCast(y)][@intCast(x)] orelse calc: {
        const rack_id = x + 10;
        var level = rack_id * y;
        level += serial orelse input;
        level *= rack_id;
        level = @mod(@divFloor(level, 100), 10);
        level -= 5;
        power_levels[@intCast(y)][@intCast(x)] = level;
        break :calc level;
    };
}

fn sumLevel(x1: i32, y1: i32, x2: i32, y2: i32) i32 {
    var total: i32 = 0;
    for (@intCast(y1)..@intCast(y2)) |y| {
        for (@intCast(x1)..@intCast(x2)) |x| {
            total += powerLevel(@intCast(x), @intCast(y), null);
        }
    }
    return total;
}

pub fn main() !void {
    var best_point = [2]i32{ 0, 0 };
    var best_power: i32 = undefined;
    for (1..299) |y| {
        for (1..299) |x| {
            const px: i32 = @intCast(x);
            const py: i32 = @intCast(y);
            const power = sumLevel(px, py, px + 3, py + 3);
            if (power > best_power) {
                best_point[0] = px;
                best_point[1] = py;
                best_power = power;
            }
        }
    }
    std.debug.print("Answer 1: {d},{d}\n", .{ best_point[0], best_point[1] });

    var best_size: usize = undefined;
    best_power = undefined;
    for (1..291) |y| {
        for (1..291) |x| {
            const px: i32 = @intCast(x);
            const py: i32 = @intCast(y);
            // Assume best size is below 30
            const max_size: usize = @min(30, @min(300 - x, 300 - y));
            for (3..(max_size + 1)) |size| {
                const ps: i32 = @intCast(size);
                const power = sumLevel(px, py, px + ps, py + ps);
                if (power > best_power) {
                    best_point[0] = px;
                    best_point[1] = py;
                    best_power = power;
                    best_size = size;
                }
            }
        }
    }
    std.debug.print("Answer 2: {d},{d},{d}\n", .{ best_point[0], best_point[1], best_size });
}

test "Power level example 1" {
    try std.testing.expectEqual(4, powerLevel(3, 5, 8));
}

test "Power level example 2" {
    try std.testing.expectEqual(-5, powerLevel(122, 79, 57));
}

test "Power level example 3" {
    try std.testing.expectEqual(0, powerLevel(217, 196, 39));
}

test "Power level example 4" {
    try std.testing.expectEqual(4, powerLevel(101, 153, 71));
}

test "Grid serial number 18" {
    const expected = [_]i32{ 4, 4, 4, 3, 3, 4, 1, 2, 4 };
    var found = std.ArrayList(i32).init(std.testing.allocator);
    defer found.deinit();
    for (45..48) |y| {
        for (33..36) |x| {
            try found.append(powerLevel(@intCast(x), @intCast(y), 18));
        }
    }
    try std.testing.expectEqualSlices(i32, expected[0..], found.items[0..]);
}

test "Grid serial number 42" {
    const expected = [_]i32{ 4, 3, 3, 3, 3, 4, 3, 3, 4 };
    var found = std.ArrayList(i32).init(std.testing.allocator);
    defer found.deinit();
    for (61..64) |y| {
        for (21..24) |x| {
            try found.append(powerLevel(@intCast(x), @intCast(y), 42));
        }
    }
    try std.testing.expectEqualSlices(i32, expected[0..], found.items[0..]);
}
