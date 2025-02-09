const std = @import("std");
const assert = std.debug.assert;
const print = std.debug.print;

const Allocator = std.mem.Allocator;
const ArrayList = std.ArrayList;

const TokenList = @import("./TokenList.zig");
const lib = @import("./tokenizer.zig");
const Tokenizer = lib.Tokenizer;
const Token = lib.Token;

const input = @embedFile("input.txt");

pub fn evaluate(expression: []const u8) u64 {
    var tokenizer = Tokenizer.init(expression);
    var operator: ?Token = null;
    var value: u64 = 0;
    while (tokenizer.next()) |token| {
        switch (token.type) {
            .add, .multiply => operator = token,
            .number => {
                // Calculate or assign new value
                if (operator) |op| switch (op.type) {
                    .add => value += @intCast(token.value),
                    .multiply => value *= @intCast(token.value),
                    else => unreachable,
                } else {
                    value = @intCast(token.value);
                }
            },
            .open => {
                var depth: usize = 1;
                const start = tokenizer.index;
                // Fast forward to end matching parentheses
                while (tokenizer.next()) |next| switch (next.type) {
                    .open => depth += 1,
                    .close => {
                        if (depth == 1) break;
                        depth -= 1;
                    },
                    else => continue,
                };
                // Evaluated slice inside the parentheses group
                const result = evaluate(tokenizer.buffer[start .. tokenizer.index - 1]);
                if (operator) |op| switch (op.type) {
                    .add => value += result,
                    .multiply => value *= result,
                    else => unreachable,
                } else {
                    value = result;
                }
            },
            else => unreachable,
        }
    }
    return value;
}

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer assert(gpa.deinit() == .ok);
    const allocator = gpa.allocator();

    var list = ArrayList([]const u8).init(allocator);
    defer list.deinit();
    try parseInput(&list);

    var sum1: u64 = 0;
    for (list.items) |expression| sum1 += evaluate(expression);
    print("Answer 1: {d}\n", .{sum1});

    var sum2: u64 = 0;
    for (list.items) |expression| {
        var tokenizer = Tokenizer.init(expression);
        const next = try tokenizer.toList(allocator);
        sum2 += try next.flatten();
    }
    print("Answer 2: {d}\n", .{sum2});
}

const tokenizeScalar = std.mem.tokenizeScalar;

fn parseInput(list: *ArrayList([]const u8)) !void {
    var lines = tokenizeScalar(u8, input, '\n');
    while (lines.next()) |line| {
        if (line.len == 0) continue;
        try list.append(line);
    }
}

test "Example 1.1" {
    const expression = "1 + 2 * 3 + 4 * 5 + 6";
    const result = evaluate(expression);
    try std.testing.expectEqual(71, result);
}

test "Example 1.2" {
    const expression = "1 + (2 * 3) + (4 * (5 + 6))";
    const result = evaluate(expression);
    try std.testing.expectEqual(51, result);
}

test "Example 1.3" {
    const expression = "2 * 3 + (4 * 5)";
    const result = evaluate(expression);
    try std.testing.expectEqual(26, result);
}

test "Example 1.4" {
    const expression = "5 + (8 * 3 + 9 + 3 * 4 * 3)";
    const result = evaluate(expression);
    try std.testing.expectEqual(437, result);
}

test "Example 1.5" {
    const expression = "5 * 9 * (7 * 3 * 3 + 9 * 3 + (8 + 6 * 4))";
    const result = evaluate(expression);
    try std.testing.expectEqual(12240, result);
}

test "Example 1.6" {
    const expression = "((2 + 4 * 9) * (6 + 9 * 8 + 6) + 6) + 2 + 4 * 2";
    const result = evaluate(expression);
    try std.testing.expectEqual(13632, result);
}

test "Example 2.1" {
    const allocator = std.testing.allocator;
    const expression = "1 + 2 * 3 + 4 * 5 + 6";
    var tokenizer = Tokenizer.init(expression);
    const list = try tokenizer.toList(allocator);
    const result = try list.flatten();
    try std.testing.expectEqual(231, result);
}

test "Example 2.2" {
    const allocator = std.testing.allocator;
    const expression = "1 + (2 * 3) + (4 * (5 + 6))";
    var tokenizer = Tokenizer.init(expression);
    const list = try tokenizer.toList(allocator);
    const result = try list.flatten();
    try std.testing.expectEqual(51, result);
}

test "Example 2.3" {
    const allocator = std.testing.allocator;
    const expression = "2 * 3 + (4 * 5)";
    var tokenizer = Tokenizer.init(expression);
    const list = try tokenizer.toList(allocator);
    const result = try list.flatten();
    try std.testing.expectEqual(46, result);
}

test "Example 2.4" {
    const allocator = std.testing.allocator;
    const expression = "5 + (8 * 3 + 9 + 3 * 4 * 3)";
    var tokenizer = Tokenizer.init(expression);
    const list = try tokenizer.toList(allocator);
    const result = try list.flatten();
    try std.testing.expectEqual(1445, result);
}

test "Example 2.5" {
    const allocator = std.testing.allocator;
    const expression = "5 * 9 * (7 * 3 * 3 + 9 * 3 + (8 + 6 * 4))";
    var tokenizer = Tokenizer.init(expression);
    const list = try tokenizer.toList(allocator);
    const result = try list.flatten();
    try std.testing.expectEqual(669060, result);
}

test "Example 2.6" {
    const allocator = std.testing.allocator;
    const expression = "((2 + 4 * 9) * (6 + 9 * 8 + 6) + 6) + 2 + 4 * 2";
    var tokenizer = Tokenizer.init(expression);
    const list = try tokenizer.toList(allocator);
    const result = try list.flatten();
    try std.testing.expectEqual(23340, result);
}
