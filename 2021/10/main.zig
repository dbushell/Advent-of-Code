const std = @import("std");
const assert = std.debug.assert;
const print = std.debug.print;
const ArrayList = std.ArrayList;

const input = @embedFile("input.txt");

const Token = enum(u8) {
    round_open = '(',
    round_close = ')',
    square_open = '[',
    square_close = ']',
    curly_open = '{',
    curly_close = '}',
    angle_open = '<',
    angle_close = '>',

    const points = [_]usize{ 3, 57, 1197, 25137 };
};

const Tokens = ArrayList(Token);

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer assert(gpa.deinit() == .ok);
    const allocator = gpa.allocator();

    var list = ArrayList(Tokens).init(allocator);
    defer {
        for (list.items) |tokens| tokens.deinit();
        list.deinit();
    }
    try parseInput(&list);

    var score_1 = [_]usize{ 0, 0, 0, 0 };

    var score_2 = ArrayList(usize).init(allocator);
    defer score_2.deinit();

    for (list.items) |tokens| {
        var stack = ArrayList(Token).init(allocator);
        defer stack.deinit();
        var corrupted = false;
        for (tokens.items) |token| {
            switch (token) {
                .round_open, .square_open, .curly_open, .angle_open => {
                    try stack.append(token);
                },
                .round_close => {
                    if (stack.pop() == .round_open) continue;
                    corrupted = true;
                    score_1[0] += 1;
                },
                .square_close => {
                    if (stack.pop() == .square_open) continue;
                    corrupted = true;
                    score_1[1] += 1;
                },
                .curly_close => {
                    if (stack.pop() == .curly_open) continue;
                    corrupted = true;
                    score_1[2] += 1;
                },
                .angle_close => {
                    if (stack.pop() == .angle_open) continue;
                    corrupted = true;
                    score_1[3] += 1;
                },
            }
        }
        // Discard corrupted lines
        if (corrupted) continue;
        // Calculate score for answer 2
        var points: usize = 0;
        while (stack.items.len > 0) {
            points *= 5;
            const pop = stack.pop();
            points += switch (pop) {
                .round_open => 1,
                .square_open => 2,
                .curly_open => 3,
                .angle_open => 4,
                else => unreachable,
            };
        }
        try score_2.append(points);
    }

    // Sum up answer 1
    var points_1: usize = 0;
    for (0..4) |i| points_1 += score_1[i] * Token.points[i];

    // Find middle score for answer 2
    assert(score_2.items.len % 2 != 0);
    std.mem.sort(usize, score_2.items, {}, std.sort.desc(usize));
    const points_2 = score_2.items[@divFloor(score_2.items.len, 2)];

    print("Answer 1: {d}\n", .{points_1});
    print("Answer 2: {d}\n", .{points_2});
}

const splitScalar = std.mem.splitScalar;

fn parseInput(list: *ArrayList(Tokens)) !void {
    var lines = splitScalar(u8, input, '\n');
    while (lines.next()) |line| {
        if (line.len == 0) continue;
        var tokens = Tokens.init(list.allocator);
        for (0..line.len) |i| try tokens.append(@enumFromInt(line[i]));
        try list.append(tokens);
    }
}
