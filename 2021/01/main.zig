const std = @import("std");
const assert = std.debug.assert;
const print = std.debug.print;
const ArrayList = std.ArrayList;

const input = @embedFile("input.txt");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer assert(gpa.deinit() == .ok);
    const allocator = gpa.allocator();

    var list = ArrayList(usize).init(allocator);
    defer list.deinit();
    try parseInput(&list);

    var increased_1: usize = 0;
    for (1..list.items.len) |i| {
        const delta: i32 = @as(i32, @intCast(list.items[i])) - @as(i32, @intCast(list.items[i - 1]));
        if (delta > 0) increased_1 += 1;
    }
    print("Answer 1: {d}\n", .{increased_1});

    var increased_2: usize = 0;
    for (3..list.items.len) |i| {
        const a: i32 = @intCast(list.items[i - 3] + list.items[i - 2] + list.items[i - 1]);
        const b: i32 = @intCast(list.items[i - 2] + list.items[i - 1] + list.items[i - 0]);
        const delta: i32 = b - a;
        if (delta > 0) increased_2 += 1;
    }
    print("Answer 2: {d}\n", .{increased_2});
}

const parseInt = std.fmt.parseInt;
const splitScalar = std.mem.splitScalar;

fn parseInput(list: *ArrayList(usize)) !void {
    var lines = splitScalar(u8, input, '\n');
    while (lines.next()) |line| {
        if (line.len == 0) continue;
        try list.append(try parseInt(usize, line, 10));
    }
}
