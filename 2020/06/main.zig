const std = @import("std");
const assert = std.debug.assert;
const print = std.debug.print;
const ArrayList = std.ArrayList;

const input = @embedFile("input.txt");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer assert(gpa.deinit() == .ok);
    const allocator = gpa.allocator();

    var list = ArrayList([]u8).init(allocator);
    defer {
        for (list.items) |g| allocator.free(g);
        list.deinit();
    }
    try parseInput(&list);

    var answer_one: usize = 0;
    var answer_two: usize = 0;
    for (list.items) |group| {
        for (group, 0..group.len) |q, i| {
            if (q == 0 or i == 26) continue;
            if (q == group[26]) answer_two += 1;
            answer_one += 1;
        }
    }
    print("Answer 1: {d}\n", .{answer_one});
    print("Answer 2: {d}\n", .{answer_two});
}

fn parseInput(list: *ArrayList([]u8)) !void {
    var lines = std.mem.splitScalar(u8, input, '\n');
    // First 26 are a to z questions
    // 27 is number of people in group
    var group = try list.allocator.alloc(u8, 27);
    defer list.allocator.free(group);
    for (0..group.len) |i| group[i] = 0;
    var people: u8 = 0;
    while (lines.next()) |line| {
        // Reset group on empty line
        if (line.len == 0) {
            group[26] = people;
            try list.append(group);
            group = try list.allocator.alloc(u8, 27);
            for (0..group.len) |i| group[i] = 0;
            people = 0;
            continue;
        }
        // Update group counts (97 = ASCII "a")
        for (line) |char| group[char - 97] += 1;
        people += 1;
    }
}
