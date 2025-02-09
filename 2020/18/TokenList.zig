const std = @import("std");
const Allocator = std.mem.Allocator;
const ArrayList = std.ArrayList;

const Token = @import("./tokenizer.zig").Token;

const TokenList = @This();

const Item = union(enum) {
    token: Token,
    list: TokenList,

    fn unwrap(self: Item) ?Token {
        return switch (self) {
            .token => |item| item,
            .list => null,
        };
    }
};

allocator: Allocator,
tokens: ArrayList(Item),

pub fn init(allocator: Allocator) TokenList {
    return .{
        .allocator = allocator,
        .tokens = ArrayList(Item).init(allocator),
    };
}

pub fn deinit(self: TokenList) void {
    for (self.tokens.items) |item| switch (item) {
        .list => |list| list.deinit(),
        else => {},
    };
    self.tokens.deinit();
}

/// Reduce tokens to single value after applying all operations
pub fn flatten(self: TokenList) !u64 {
    var next = self;
    defer next.deinit();
    while (next.tokens.items.len > 1) {
        const addition = try next.reduce(.add);
        next.deinit();
        const multiplication = try addition.reduce(.multiply);
        addition.deinit();
        next = multiplication;
    }
    switch (next.tokens.items[0]) {
        .token => |token| return token.value,
        else => return error.Failed,
    }
}

/// Apply all possible operations of one type
pub fn reduce(self: TokenList, operation: Token.Type) !TokenList {
    var next = TokenList.init(self.allocator);
    var seen_addition = false;
    for (self.tokens.items, 0..) |item, i| switch (item) {
        .list => |list| {
            // Collapsed parentheses if possible
            const nested = try reduce(list, operation);
            if (nested.tokens.items.len == 1) {
                try next.tokens.append(.{ .token = .{
                    .type = .number,
                    .value = nested.tokens.items[0].token.value,
                } });
                nested.deinit();
            } else {
                try next.tokens.append(.{ .list = nested });
            }
        },
        .token => |token| {
            try next.tokens.append(.{ .token = token });
            if (token.type == .add) seen_addition = true;
            // Not safe to proceed if addition behind or immediately ahead
            if (operation == .multiply) {
                if (seen_addition) continue;
                if (i + 1 < self.tokens.items.len) {
                    if (self.tokens.items[i + 1].unwrap()) |peek| {
                        if (peek.type == .add) continue;
                    }
                }
            }
            // Look for valid operation
            const len = next.tokens.items.len;
            if (len < 3) continue;
            const operator = next.tokens.items[len - 2].unwrap() orelse continue;
            if (operator.type != operation) continue;
            const lhs = next.tokens.items[len - 3].unwrap() orelse continue;
            const rhs = next.tokens.items[len - 1].unwrap() orelse continue;
            if (lhs.type != .number) continue;
            if (rhs.type != .number) continue;
            // Calculate result
            const value: u64 = switch (operation) {
                .add => lhs.value + rhs.value,
                .multiply => lhs.value * rhs.value,
                else => unreachable,
            };
            // Replace tokens with result
            for (0..3) |_| _ = next.tokens.pop();
            try next.tokens.append(.{ .token = .{
                .type = .number,
                .value = value,
            } });
        },
    };
    return next;
}
