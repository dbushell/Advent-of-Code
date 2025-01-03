const std = @import("std");
const assert = std.debug.assert;
const parseInt = std.fmt.parseInt;

pub fn main() !void {
    const stdout = std.io.getStdOut().writer();
    const file = try std.fs.cwd().openFile("2015/02/input.txt", .{});
    defer file.close();

    const reader = file.reader();
    var buffer: [1024]u8 = undefined;

    var answer_one: i32 = 0;
    var answer_two: i32 = 0;

    while (try reader.readUntilDelimiterOrEof(&buffer, '\n')) |line| {
        var split = std.mem.splitScalar(u8, line, 'x');
        const L = try parseInt(i32, split.next().?, 10);
        const W = try parseInt(i32, split.next().?, 10);
        const H = try parseInt(i32, split.next().?, 10);

        var dimensions: [3]i32 = .{ L, W, H };
        std.mem.sort(i32, &dimensions, {}, std.sort.asc(i32));

        const sides: [3]i32 = .{ 2 * (L * W), 2 * (W * H), 2 * (H * L) };
        var min_side: i32 = sides[0];
        for (sides) |side| {
            answer_one += side;
            if (side < min_side) min_side = side;
        }

        answer_one += @divFloor(min_side, 2);
        answer_two += (dimensions[0] * 2) + (dimensions[1] * 2);
        answer_two += L * W * H;
    }

    try stdout.print("Answer 1: {d}\n", .{answer_one});
    try stdout.print("Answer 2: {d}\n", .{answer_two});
}
