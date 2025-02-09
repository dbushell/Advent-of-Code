const std = @import("std");
const isDigit = std.ascii.isDigit;
const isWhitespace = std.ascii.isWhitespace;

const Allocator = std.mem.Allocator;
const ArrayList = std.ArrayList;

const TokenList = @import("./TokenList.zig");

pub const Token = struct {
    type: Type,
    value: u64 = 0,

    pub const Type = enum {
        open,
        close,
        number,
        add,
        multiply,
    };
};

pub const Tokenizer = struct {
    buffer: []const u8,
    index: usize = 0,
    peeked: ?Token = null,

    pub fn init(buffer: []const u8) Tokenizer {
        var tokenizer = Tokenizer{ .buffer = buffer };
        tokenizer.reset();
        return tokenizer;
    }

    pub fn reset(self: *Tokenizer) void {
        self.index = 0;
        self.peeked = null;
    }

    pub fn next(self: *Tokenizer) ?Token {
        const result = self.peek() orelse return null;
        self.peeked = null;
        self.index += 1;
        return result;
    }

    pub fn peek(self: *Tokenizer) ?Token {
        // Do not peek again until `next` is consumed
        if (self.peeked) |result| return result;
        // Skip spaces
        while (self.index < self.buffer.len) : (self.index += 1) {
            if (!isWhitespace(self.buffer[self.index])) break;
        }
        const start = self.index;
        if (start == self.buffer.len) {
            return null;
        }
        var end = start + 1;
        // Read until next delimiter
        if (isDigit(self.buffer[start])) {
            while (end < self.buffer.len) : (end += 1) {
                if (!isDigit(self.buffer[end])) break;
            }
        }
        const slice = self.buffer[start..end];
        if (slice.len == 1) self.peeked = switch (slice[0]) {
            '(' => Token{ .type = Token.Type.open },
            ')' => Token{ .type = Token.Type.close },
            '+' => Token{ .type = Token.Type.add },
            '*' => Token{ .type = Token.Type.multiply },
            else => null,
        };
        // Parse multiple digits
        if (self.peeked == null) {
            const value = std.fmt.parseInt(u64, slice, 10) catch unreachable;
            self.peeked = Token{
                .type = Token.Type.number,
                .value = value,
            };
        }
        return self.peeked;
    }

    /// Return list of tokens with parentheses in nested lists
    pub fn toList(self: *Tokenizer, allocator: Allocator) !TokenList {
        self.reset();
        var list = TokenList.init(allocator);
        while (self.next()) |token| {
            if (token.type != .open) {
                try list.tokens.append(.{ .token = token });
                continue;
            }
            var depth: usize = 1;
            const start = self.index;
            while (self.next()) |t| switch (t.type) {
                .open => depth += 1,
                .close => {
                    if (depth == 1) break;
                    depth -= 1;
                },
                else => continue,
            };
            var slice = Tokenizer.init(self.buffer[start .. self.index - 1]);
            try list.tokens.append(.{ .list = try slice.toList(allocator) });
        }
        return list;
    }

    // /// Print expression into buffer as ASCII string removing whitespace
    // ///
    // /// Returns a slice of the buffer
    // pub fn bufPrint(self: *Tokenizer, buf: []u8) []const u8 {
    //     self.reset();
    //     var i: usize = 0;
    //     while (self.next()) |token| : (i += 1) {
    //         if (token.type == .number) {
    //             if (token.value < 10) {
    //                 buf[i] = @as(u8, @intCast(token.value)) + 48;
    //             } else {
    //                 const digits = std.fmt.digits2(token.value);
    //                 buf[i] = digits[0];
    //                 buf[i + 1] = digits[1];
    //                 i += 1;
    //             }
    //             continue;
    //         }
    //         buf[i] = switch (token.type) {
    //             .open => '(',
    //             .close => ')',
    //             .add => '+',
    //             .multiply => '*',
    //             else => unreachable,
    //         };
    //     }
    //     return buf[0..i];
    // }
};
