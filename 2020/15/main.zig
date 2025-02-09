const std = @import("std");
const builtin = @import("builtin");
const assert = std.debug.assert;
const print = std.debug.print;
const Allocator = std.mem.Allocator;
const ArrayList = std.ArrayList;

const input = @embedFile("input.txt");

const Turn = struct {
    index: usize,
    number: usize,
};

fn nextTurn(turns: *ArrayList(Turn)) !void {
    const last = turns.getLast();
    const index = last.index + 1;
    for (0..turns.items.len - 1) |i| {
        const t = turns.items[turns.items.len - (i + 2)];
        if (t.number == last.number) {
            _ = turns.orderedRemove(turns.items.len - (i + 2));
            try turns.append(.{
                .index = index,
                .number = last.index - t.index,
            });
            return;
        }
    }
    try turns.append(.{
        .index = index,
        .number = 0,
    });
}

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    const allocator = allocate: {
        if (builtin.mode == .Debug) {
            break :allocate gpa.allocator();
        }
        break :allocate std.heap.c_allocator;
    };

    var list = ArrayList(u8).init(allocator);
    defer list.deinit();
    try parseInput(&list);

    var turns = ArrayList(Turn).init(allocator);
    defer turns.deinit();

    for (list.items, 0..) |n, i| try turns.append(.{ .index = i + 1, .number = n });
    for (list.items.len..2020) |_| try nextTurn(&turns);

    print("Answer 1: {d}\n", .{turns.getLast().number});

    turns.clearAndFree();

    for (list.items, 0..) |n, i| try turns.append(.{ .index = i + 1, .number = n });
    for (list.items.len..30_000_000) |_| try nextTurn(&turns);

    print("Answer 2: {d}\n", .{turns.getLast().number});

    if (builtin.mode == .Debug) {
        assert(gpa.deinit() == .ok);
    }
}

const parseInt = std.fmt.parseInt;
const splitScalar = std.mem.splitScalar;

fn parseInput(list: *ArrayList(u8)) !void {
    var numbers = std.mem.splitScalar(u8, input[0 .. input.len - 1], ',');
    while (numbers.next()) |n| {
        try list.append(try parseInt(u8, n, 10));
    }
}

test "example 1" {
    const allocator = std.testing.allocator;
    var turns = ArrayList(Turn).init(allocator);
    defer turns.deinit();
    try turns.appendSlice(&.{
        .{ .index = 1, .number = 0 },
        .{ .index = 2, .number = 3 },
        .{ .index = 3, .number = 6 },
    });
    for (3..2020) |_| try nextTurn(&turns);
    try std.testing.expectEqual(436, turns.getLast().number);
}

test "example 1,3,2" {
    const allocator = std.testing.allocator;
    var turns = ArrayList(Turn).init(allocator);
    defer turns.deinit();
    try turns.appendSlice(&.{
        .{ .index = 1, .number = 1 },
        .{ .index = 2, .number = 3 },
        .{ .index = 3, .number = 2 },
    });
    for (3..2020) |_| try nextTurn(&turns);
    try std.testing.expectEqual(1, turns.getLast().number);
}

test "example 2,3,1" {
    const allocator = std.testing.allocator;
    var turns = ArrayList(Turn).init(allocator);
    defer turns.deinit();
    try turns.appendSlice(&.{
        .{ .index = 1, .number = 2 },
        .{ .index = 2, .number = 3 },
        .{ .index = 3, .number = 1 },
    });
    for (3..2020) |_| try nextTurn(&turns);
    try std.testing.expectEqual(78, turns.getLast().number);
}

test "example 3,1,2" {
    const allocator = std.testing.allocator;
    var turns = ArrayList(Turn).init(allocator);
    defer turns.deinit();
    try turns.appendSlice(&.{
        .{ .index = 1, .number = 3 },
        .{ .index = 2, .number = 1 },
        .{ .index = 3, .number = 2 },
    });
    for (3..2020) |_| try nextTurn(&turns);
    try std.testing.expectEqual(1836, turns.getLast().number);
}
