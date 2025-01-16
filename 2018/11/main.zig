const std = @import("std");

const inputText = @embedFile("input.txt");
const input = std.fmt.parseInt(i32, inputText[0 .. inputText.len - 1], 10) catch 0;

var power_levels: [301][301]?i32 = undefined;
var sum_table: [301][301]?i32 = undefined;

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

fn sumLevel(x1: usize, y1: usize, x2: usize, y2: usize) i32 {
    return sum_table[y1][x1].? +
        sum_table[y2][x2].? -
        sum_table[y1][x2].? -
        sum_table[y2][x1].?;
}

pub fn main() !void {
    for (1..301) |y| {
        for (1..301) |x| {
            const px: i32 = @intCast(x);
            const py: i32 = @intCast(y);
            var level = powerLevel(px, py, null);
            level += sum_table[y][x - 1] orelse 0;
            level += sum_table[y - 1][x] orelse 0;
            level -= sum_table[y - 1][x - 1] orelse 0;
            sum_table[y][x] = level;
        }
    }

    var best_point = [2]i32{ 0, 0 };
    var best_power: i32 = undefined;
    for (1..298) |y| {
        for (1..298) |x| {
            const power = sumLevel(x, y, x + 3, y + 3);
            if (power > best_power) {
                best_point[0] = @as(i32, @intCast(x)) + 1;
                best_point[1] = @as(i32, @intCast(y)) + 1;
                best_power = power;
            }
        }
    }
    std.debug.print("Answer 1: {d},{d}\n", .{ best_point[0], best_point[1] });

    var best_size: usize = undefined;
    best_power = undefined;
    for (1..291) |y| {
        for (1..291) |x| {
            const max_size: usize = @min(300 - x, 300 - y);
            for (3..(max_size + 1)) |size| {
                const power = sumLevel(x, y, x + size, y + size);
                if (power > best_power) {
                    best_point[0] = @as(i32, @intCast(x)) + 1;
                    best_point[1] = @as(i32, @intCast(y)) + 1;
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
