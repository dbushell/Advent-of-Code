const std = @import("std");

const inputText = @embedFile("input.txt");
const input = std.fmt.parseInt(i32, inputText[0 .. inputText.len - 1], 10) catch 0;

// var gpa = std.heap.GeneralPurposeAllocator(.{}){};
// const allocator = gpa.allocator();
const allocator = std.heap.c_allocator;

fn factors(n: u32, list: *std.ArrayList(u32)) !void {
    for (1..std.math.sqrt(n)) |i| {
        if (@mod(n, i) != 0) continue;
        try list.append(@intCast(i));
        const c = @divFloor(n, i);
        if (c != i) try list.append(@intCast(c));
    }
}

pub fn main() !void {
    var answer_one: u32 = 0;
    for (1..1_000_000) |i| {
        var presents: u32 = 0;
        var list = std.ArrayList(u32).init(allocator);
        defer list.deinit();
        try factors(@intCast(i), &list);
        for (list.items) |elf| {
            presents += elf * 10;
        }
        if (presents >= input) {
            answer_one = @intCast(i);
            break;
        }
    }

    std.debug.print("Answer 1: {d}\n", .{answer_one});

    var elves: [1_000_000]u8 = [_]u8{0} ** 1_000_000;
    var answer_two: u32 = 0;
    for (1..1_000_000) |house| {
        var presents: u32 = 0;
        var list = std.ArrayList(u32).init(allocator);
        defer list.deinit();
        try factors(@intCast(house), &list);
        for (list.items) |elf| {
            if (elves[elf] == 50) continue;
            presents += @as(u32, @intCast(elf)) * 11;
            elves[elf] += 1;
        }
        if (presents >= input) {
            answer_two = @intCast(house);
            break;
        }
    }

    std.debug.print("Answer 2: {d}\n", .{answer_two});
}
