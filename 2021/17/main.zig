const std = @import("std");
const assert = std.debug.assert;
const print = std.debug.print;

const Point = @import("./src/point.zig").Point;

const input = @embedFile("input.txt");

pub fn main() !void {
    var gpa: std.heap.DebugAllocator(.{}) = .init;
    defer assert(gpa.deinit() == .ok);
    // const allocator = gpa.allocator();

    const start, const end = try parseInput();

    print("{any}, {any}\n", .{ start, end });
}

const parseInt = std.fmt.parseInt;
const trimLeft = std.mem.trimLeft;
const trimRight = std.mem.trimRight;
const splitSequence = std.mem.splitSequence;

fn parseInput() !struct { [2]i32, [2]i32 } {
    var start = [_]i32{ 0, 0 };
    var end = [_]i32{ 0, 0 };
    var parts = splitSequence(u8, trimRight(u8, input, "\n"), ", ");
    var point = splitSequence(u8, trimLeft(u8, parts.next().?, "target area: x="), "..");
    start[0] = try parseInt(i32, point.next().?, 10);
    start[1] = try parseInt(i32, point.next().?, 10);
    point = splitSequence(u8, trimLeft(u8, parts.next().?[2..], "y="), "..");
    end[0] = try parseInt(i32, point.next().?, 10);
    end[1] = try parseInt(i32, point.next().?, 10);
    return .{ start, end };
}
