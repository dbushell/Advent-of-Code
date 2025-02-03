const std = @import("std");
const assert = std.debug.assert;
const print = std.debug.print;
const ArrayList = std.ArrayList;

const input = @embedFile("input.txt");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer assert(gpa.deinit() == .ok);
    const allocator = gpa.allocator();

    var list = ArrayList([]const u8).init(allocator);
    defer list.deinit();
    try parseInput(&list);

    var seats = ArrayList([2]u8).init(allocator);
    defer seats.deinit();

    var highest: u32 = 0;
    for (list.items) |item| {
        const row, const column = decode(item);
        const seat: u32 = seatId(row, column);
        highest = @max(highest, seat);
        try seats.append([2]u8{ row, column });
    }
    print("Answer 1: {d}\n", .{highest});

    std.mem.sort([2]u8, seats.items, {}, compare);

    for (1..seats.items.len) |i| {
        const column = seats.items[i][1];
        const before = seats.items[i - 1];
        if (column == 0 and before[1] != 7) {
            print("Answer 2: {d}\n", .{seatId(before[0], 7)});
            break;
        } else if (column > 0 and before[1] != column - 1) {
            print("Answer 2: {d}\n", .{seatId(before[0], column - 1)});
            break;
        }
    }
}

fn parseInput(list: *ArrayList([]const u8)) !void {
    var lines = std.mem.splitScalar(u8, input, '\n');
    while (lines.next()) |line| {
        if (line.len == 0) continue;
        try list.append(line);
    }
}

fn compare(_: void, a: [2]u8, b: [2]u8) bool {
    return if (a[0] != b[0]) a[0] < b[0] else a[1] < b[1];
}

fn seatId(row: u8, column: u8) u32 {
    return @as(u32, row) * 8 + column;
}

fn decode(text: []const u8) struct { u8, u8 } {
    var number = [_]u8{0} ** 10;
    for (0..10) |i| number[i] = switch (text[i]) {
        'F', 'L' => '0',
        'B', 'R' => '1',
        else => unreachable,
    };
    const row = std.fmt.parseInt(u8, number[0..7], 2) catch unreachable;
    const column = std.fmt.parseInt(u8, number[7..10], 2) catch unreachable;
    return .{ row, column };
}

test "example 0" {
    const text = "FBFBBFFRLR";
    try std.testing.expectEqual(10, text.len);
    try std.testing.expectEqual(.{ 44, 5 }, decode(text));
}

test "example 1" {
    const text = "BFFFBBFRRR";
    try std.testing.expectEqual(10, text.len);
    try std.testing.expectEqual(.{ 70, 7 }, decode(text));
}

test "example 2" {
    const text = "FFFBBBFRRR";
    try std.testing.expectEqual(10, text.len);
    try std.testing.expectEqual(.{ 14, 7 }, decode(text));
}

test "example 3" {
    const text = "BBFFBBFRLL";
    try std.testing.expectEqual(10, text.len);
    try std.testing.expectEqual(.{ 102, 4 }, decode(text));
}

// fn decode(text: []const u8) struct { u8, u8 } {
//     var lower: u8 = 0;
//     var upper: u8 = 127;
//     for (text[0..7]) |char| {
//         const half = @divFloor(upper - lower, 2) + @mod(upper - lower, 2);
//         switch (char) {
//             'F' => upper -= half,
//             'B' => lower += half,
//             else => unreachable,
//         }
//     }
//     assert(lower == upper);
//     const row = upper;
//     lower = 0;
//     upper = 7;
//     for (text[7..10]) |char| {
//         const half = @divFloor(upper - lower, 2) + @mod(upper - lower, 2);
//         switch (char) {
//             'L' => upper -= half,
//             'R' => lower += half,
//             else => unreachable,
//         }
//     }
//     assert(lower == upper);
//     const column = upper;
//     return .{ row, column };
// }
