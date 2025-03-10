const std = @import("std");
const assert = std.debug.assert;
const print = std.debug.print;
const indexOfScalar = std.mem.indexOfScalar;
const ArrayList = std.ArrayList;
const AutoHashMap = std.AutoHashMap;

const Point = @import("./src/point.zig").Point;
const Grid = @import("./src/grid.zig").Grid;

const input = @embedFile("input.txt");

/// Returns true if `numbers` includes `value`
fn checkSingle(numbers: []const u8, value: u8) bool {
    return indexOfScalar(u8, numbers, value) != null;
}

/// Returns true if `numbers` includes all values in `sequence`
fn checkSequence(numbers: []const u8, sequence: []u8) bool {
    for (sequence) |n| if (!checkSingle(numbers, n)) return false;
    return true;
}

/// Returns true if `numbers` includes any horizontal or vertical sequence in `board`
pub fn checkBoard(numbers: []const u8, board: Grid(u8)) !bool {
    var state = try board.clone();
    defer state.deinit();
    for (state.data) |seq| if (checkSequence(numbers, seq)) return true;
    try state.rotate();
    for (state.data) |seq| if (checkSequence(numbers, seq)) return true;
    return false;
}

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer assert(gpa.deinit() == .ok);
    const allocator = gpa.allocator();

    var order = ArrayList(u8).init(allocator);
    var boards = ArrayList(Grid(u8)).init(allocator);
    defer {
        for (boards.items) |b| b.deinit();
        boards.deinit();
    }
    try parseInput(&order, &boards);
    const numbers = try order.toOwnedSlice();
    defer allocator.free(numbers);

    var done = AutoHashMap(usize, void).init(allocator);
    defer done.deinit();

    var first: ?usize = null;
    var last: ?usize = null;

    outer: for (6..numbers.len) |i| {
        for (boards.items, 0..) |b, j| {
            // Skip previous winners
            if (done.count() == boards.items.len) break :outer;
            if (done.contains(j)) continue;
            const slice = numbers[0..i];
            if (!try checkBoard(slice, b)) continue;
            try done.put(j, {});
            // Count unmarked numbers
            var sum: usize = 0;
            for (0..5) |y| {
                for (0..5) |x| {
                    const value = try b.at(x, y);
                    if (!checkSingle(slice, value)) sum += value;
                }
            }
            // Save scores
            last = sum * slice[slice.len - 1];
            if (first == null) first = last;
        }
    }
    print("Answer 1: {d}\n", .{first.?});
    print("Answer 2: {d}\n", .{last.?});
}

const parseInt = std.fmt.parseInt;
const splitScalar = std.mem.splitScalar;
const trim = std.mem.trim;

const Parser = enum {
    numbers,
    boards,
};

fn parseInput(list: *ArrayList(u8), boards: *ArrayList(Grid(u8))) !void {
    var parse = Parser.numbers;
    var lines = splitScalar(u8, input, '\n');
    var board = try Grid(u8).init(boards.allocator, 5, 5, 0);
    defer board.deinit();
    var y: i32 = 0;
    while (lines.next()) |line| {
        if (parse == Parser.numbers) {
            if (line.len == 0) {
                parse = Parser.boards;
                continue;
            }
            var numbers = splitScalar(u8, line, ',');
            while (numbers.next()) |n| {
                try list.append(try parseInt(u8, n, 10));
            }
        } else if (parse == Parser.boards) {
            if (line.len == 0) {
                try boards.append(board);
                board = try Grid(u8).init(boards.allocator, 5, 5, 0);
                y = 0;
                continue;
            }
            var numbers = splitScalar(u8, line, ' ');
            var x: i32 = 0;
            while (numbers.next()) |value| {
                if (value.len == 0) continue;
                try board.set(
                    .{ .x = x, .y = y },
                    try parseInt(u8, trim(u8, value, " "), 10),
                );
                x += 1;
            }
            y += 1;
        }
    }
}
