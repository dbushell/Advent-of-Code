const std = @import("std");
const assert = std.debug.assert;
const print = std.debug.print;
const parseInt = std.fmt.parseInt;
const splitScalar = std.mem.splitScalar;
const ArrayList = std.ArrayList;

const input = @embedFile("input.txt");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer assert(gpa.deinit() == .ok);
    const allocator = gpa.allocator();

    var list = ArrayList(usize).init(allocator);
    defer list.deinit();
    var split = splitScalar(u8, input[0 .. input.len - 1], ',');
    while (split.next()) |n| try list.append(try parseInt(usize, n, 10));

    var min: usize = list.items[0];
    var max: usize = list.items[0];
    for (list.items) |n| {
        min = @min(min, n);
        max = @max(max, n);
    }

    var best1: usize = std.math.maxInt(usize);
    var best2: usize = std.math.maxInt(usize);
    for (min..max) |p| {
        var fuel1: usize = 0;
        var fuel2: usize = 0;
        for (list.items) |n| {
            const steps: f64 = @floatFromInt(@max(n, p) - @min(n, p));
            fuel1 += @intFromFloat(steps);
            fuel2 += @intFromFloat((steps / 2) * (steps + 1));
        }
        best1 = @min(best1, fuel1);
        best2 = @min(best2, fuel2);
    }
    print("Answer 1: {d}\n", .{best1});
    print("Answer 2: {d}\n", .{best2});
}
