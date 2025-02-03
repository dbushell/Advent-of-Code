const std = @import("std");
const assert = std.debug.assert;
const print = std.debug.print;
const ArrayList = std.ArrayList;

const input = @embedFile("input.txt");

const Item = struct {
    lower: u8,
    upper: u8,
    char: u8,
    password: []const u8,
};

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer assert(gpa.deinit() == .ok);
    const allocator = gpa.allocator();

    var list = ArrayList(Item).init(allocator);
    defer list.deinit();
    try parseInput(&list);

    var answer_one: usize = 0;
    for (list.items) |item| {
        var count: usize = 0;
        for (item.password) |char| {
            if (char == item.char) count += 1;
        }
        if (count >= item.lower and count <= item.upper) {
            answer_one += 1;
        }
    }
    print("Answer 1: {d}\n", .{answer_one});

    var answer_two: usize = 0;
    for (list.items) |item| {
        const a = item.password[item.lower - 1] == item.char;
        const b = item.password[item.upper - 1] == item.char;
        if ((a or b) and !(a and b)) answer_two += 1;
    }
    print("Answer 2: {d}\n", .{answer_two});
}

const parseInt = std.fmt.parseInt;
const splitScalar = std.mem.splitScalar;
const splitAny = std.mem.splitAny;

fn parseInput(list: *ArrayList(Item)) !void {
    var lines = splitScalar(u8, input, '\n');
    while (lines.next()) |line| {
        if (line.len == 0) continue;
        var parts = splitAny(u8, line, " -");
        try list.append(.{
            .lower = try parseInt(u8, parts.next().?, 10),
            .upper = try parseInt(u8, parts.next().?, 10),
            .char = parts.next().?[0],
            .password = parts.next().?,
        });
    }
}
