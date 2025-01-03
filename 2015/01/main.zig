const std = @import("std");

pub fn main() !void {
    const stdout = std.io.getStdOut().writer();
    const file = try std.fs.cwd().openFile("2015/01/input.txt", .{});
    defer file.close();

    const reader = file.reader();
    var buffer: [1024 * 10]u8 = undefined;

    var answer_one: i32 = 0;
    var answer_two: i128 = 0;
    var answer_two_active: bool = true;

    const read = try reader.read(&buffer);
    for (buffer[0..read], 0..) |char, i| {
        if (char == '(') {
            answer_one += 1;
            if (answer_two_active) answer_two += 1;
        }
        if (char == ')') {
            answer_one -= 1;
            if (answer_two_active) answer_two -= 1;
        }
        if (answer_two_active) {
            if (answer_two == -1) {
                answer_two = i + 1;
                answer_two_active = false;
            }
        }
    }

    try stdout.print("Answer 1: {d}\n", .{answer_one});
    try stdout.print("Answer 2: {d}\n", .{answer_two});
}
