const std = @import("std");
const assert = std.debug.assert;
const print = std.debug.print;
const Allocator = std.mem.Allocator;
const ArrayList = std.ArrayList;

const input = @embedFile("input.txt");

const Side = enum(u1) {
    left = 0,
    right = 1,
};

const Tag = enum {
    int,
    pair,
};

pub const Num = union(Tag) {
    int: usize,
    pair: [2]*Num,

    /// Parse formatted string
    pub fn parse(allocator: Allocator, buf: []const u8) !*Num {
        var parent: ?*Num = null;
        var side: Side = .left;
        var stack: ArrayList(struct { *Num, Side }) = .init(allocator);
        defer stack.deinit();
        for (buf) |char| switch (char) {
            '[' => {
                if (parent) |p| try stack.append(.{ p, side });
                parent = try allocator.create(Num);
                parent.?.* = Num{ .pair = [2]*Num{ undefined, undefined } };
                side = .left;
            },
            ']' => {
                const pop = stack.pop() orelse break;
                const child = parent;
                parent = pop[0];
                side = pop[1];
                if (parent.?.* == .pair) parent.?.pair[@intFromEnum(side)] = child.?;
            },
            '0'...'9' => {
                const num = try allocator.create(Num);
                num.int = try std.fmt.charToDigit(char, 10);
                parent.?.pair[@intFromEnum(side)] = num;
            },
            ',' => side = .right,
            else => unreachable,
        };
        return parent.?;
    }

    /// Returns a copy using new memory
    pub fn dupe(num: *Num, allocator: Allocator) !*Num {
        var buf = [_]u8{0} ** 128;
        _ = try std.fmt.bufPrint(&buf, "{}", .{num});
        return Num.parse(allocator, &buf);
    }

    /// Returns combined number (does not reduce)
    pub fn add(lhs: *Num, rhs: *Num, allocator: Allocator) !*Num {
        const new = try allocator.create(Num);
        new.* = Num{ .pair = [2]*Num{
            try lhs.dupe(allocator),
            try rhs.dupe(allocator),
        } };
        return new;
    }

    /// Calculate final sum
    pub fn magnitude(num: *Num) usize {
        if (num.* == .int) @panic("Union must be .pair");
        const lhs = if (num.pair[0].* == .int) num.pair[0].int else magnitude(num.pair[0]);
        const rhs = if (num.pair[1].* == .int) num.pair[1].int else magnitude(num.pair[1]);
        return (lhs * 3) + (rhs * 2);
    }

    /// Repeatedly perform `explode` or `split` (destructive)
    pub fn reduce(num: *Num, allocator: Allocator) !void {
        while (true) {
            if (try num.explode(allocator)) continue;
            if (try num.split(allocator)) continue;
            return;
        }
    }

    /// Perform first valid explosion (returns `true` if successful)
    pub fn explode(num: *Num, allocator: Allocator) !bool {
        var stack: ArrayList(struct { *Num, Side }) = .init(allocator);
        defer stack.deinit();

        var parent: ?*Num = num;
        var side: Side = .right; // will be `.left` in first iteration
        var depth: usize = 0;

        // Once exploded only RHS addition is required before returning
        var exploded = false;
        // Remember previous regular number for LHS explosion addition
        var explode_left: ?*Num = null;
        // Remember RHS explosion value to add to next regular number
        var explode_right: ?usize = null;

        // Walk through numbers
        while (true) {
            // Alternate reading left to right
            side = if (side == .right) .left else .right;
            // Current number
            const current: *Num = parent.?.pair[@intFromEnum(side)];
            if (current.* == .int) {
                // Finally add RHS value to next number
                if (explode_right) |right| {
                    current.int += right;
                    return true;
                }
                // Track last seen left number
                explode_left = current;
                if (side == .left) continue;
            }
            if (current.* == .pair) {
                // Found pair to explode
                if (!exploded and depth == 3 and current.pair[0].* == .int and current.pair[1].* == .int) {
                    exploded = true;
                    // Pair is replaced by regular number zero
                    const zero = try allocator.create(Num);
                    zero.int = 0;
                    parent.?.pair[@intFromEnum(side)] = zero;
                    if (side == .left) {
                        if (parent.?.pair[1].* == .int) {
                            // Immediate RHS addition
                            parent.?.pair[1].int += current.pair[1].int;
                        } else {
                            // Remember RHS value
                            explode_right = current.pair[1].int;
                        }
                        // LHS addition if previous number was seen
                        if (explode_left) |left| left.int += current.pair[0].int;
                        if (explode_right == null) return true;
                    }
                    // If exploded continue looking for next RHS regular number
                    if (side == .right) {
                        // Immediate LHS addition
                        parent.?.pair[0].int += current.pair[0].int;
                        // Remember RHS value
                        explode_right = current.pair[1].int;
                    }
                } else {
                    try stack.append(.{ parent.?, side });
                    parent = current;
                    side = .right; // will be `.left` in next iteration
                    depth += 1;
                    continue;
                }
            }
            // Descend stack or return if final number
            while (side == .right) {
                const pop = stack.pop() orelse return exploded;
                parent = pop[0];
                side = pop[1];
                depth -= 1;
            }
        }
    }

    /// Perform first valid split (returns `true` if successful)
    pub fn split(num: *Num, allocator: Allocator) !bool {
        var stack: ArrayList(struct { *Num, Side }) = .init(allocator);
        defer stack.deinit();
        var parent: ?*Num = num;
        var side: Side = .right;
        while (true) {
            side = if (side == .right) .left else .right;
            const current: *Num = parent.?.pair[@intFromEnum(side)];
            if (current.* == .int) {
                if (current.int > 9) {
                    const new = try allocator.create(Num);
                    const lhs = try allocator.create(Num);
                    const rhs = try allocator.create(Num);
                    const div = @as(f64, @floatFromInt(current.int)) / 2.0;
                    lhs.int = @intFromFloat(@floor(div));
                    rhs.int = @intFromFloat(@ceil(div));
                    new.* = Num{ .pair = [2]*Num{ lhs, rhs } };
                    parent.?.pair[@intFromEnum(side)] = new;
                    return true;
                }
                if (side == .left) continue;
            }
            if (current.* == .pair) {
                try stack.append(.{ parent.?, side });
                parent = current;
                side = .right;
                continue;
            }
            while (side == .right) {
                const pop = stack.pop() orelse return false;
                parent = pop[0];
                side = pop[1];
            }
        }
    }

    /// Format for standard print
    pub fn format(num: Num, comptime _: []const u8, _: std.fmt.FormatOptions, writer: anytype) @TypeOf(writer).Error!void {
        return switch (num) {
            .int => std.fmt.formatInt(num.int, 10, .lower, .{}, writer),
            .pair => std.fmt.format(writer, "[{},{}]", .{ num.pair[0], num.pair[1] }),
        };
    }
};

pub fn main() !void {
    var gpa: std.heap.DebugAllocator(.{}) = .init;
    defer assert(gpa.deinit() == .ok);
    const gpa_allocator = gpa.allocator();

    // Can't be bothered with cleanup today
    var arena: std.heap.ArenaAllocator = .init(gpa_allocator);
    defer arena.deinit();
    const allocator = arena.allocator();

    var list: ArrayList(*Num) = .init(allocator);

    try parseInput(&list);

    // Calculate sum of all numbers
    var num: *Num = list.items[0];
    for (1..list.items.len) |i| {
        num = try num.add(list.items[i], allocator);
        try num.reduce(allocator);
    }
    print("Answer 1: {d}\n", .{num.magnitude()});

    // Find maximum sum of any two numbers
    var max: usize = 0;
    for (0..list.items.len) |a| for (0..list.items.len) |b| {
        if (a == b) continue;
        const sum = try list.items[a].add(list.items[b], allocator);
        try sum.reduce(allocator);
        max = @max(max, sum.magnitude());
    };

    print("Answer 2: {d}\n", .{max});
}

fn parseInput(list: *ArrayList(*Num)) !void {
    var lines = std.mem.splitScalar(u8, input, '\n');
    while (lines.next()) |line| {
        if (line.len == 0) continue;
        try list.append(try Num.parse(list.allocator, line));
    }
}
