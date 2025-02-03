const std = @import("std");
const assert = std.debug.assert;
const print = std.debug.print;
const ArrayList = std.ArrayList;

const input = @embedFile("input.txt");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer assert(gpa.deinit() == .ok);
    const allocator = gpa.allocator();

    var list = ArrayList(i32).init(allocator);
    defer list.deinit();
    try parseInput(&list);

    var answer_one: i32 = 0;
    var answer_two: i32 = 0;

    // Assume no duplicates
    for (list.items) |a| {
        for (list.items) |b| {
            if (a == b) continue;
            for (list.items) |c| {
                if (a == c or b == c) continue;
                if (a + b == 2020) answer_one = a * b;
                if (a + b + c == 2020) answer_two = a * b * c;
            }
        }
    }
    print("Answer 1: {d}\n", .{answer_one});
    print("Answer 2: {d}\n", .{answer_two});
}

const parseInt = std.fmt.parseInt;
const splitScalar = std.mem.splitScalar;

fn parseInput(list: *ArrayList(i32)) !void {
    var lines = splitScalar(u8, input, '\n');
    while (lines.next()) |line| {
        if (line.len == 0) continue;
        try list.append(try parseInt(i32, line, 10));
    }
}
