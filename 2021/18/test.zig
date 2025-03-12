const std = @import("std");
const assert = std.debug.assert;
const print = std.debug.print;
const Allocator = std.mem.Allocator;

const Num = @import("./main.zig").Num;

fn textExplosion(before: []const u8, after: []const u8) !void {
    var arena: std.heap.ArenaAllocator = .init(std.testing.allocator);
    defer arena.deinit();
    const allocator = arena.allocator();
    const num = try Num.parse(allocator, before);
    var buf = [_]u8{0} ** 128;
    try std.testing.expectEqualStrings(before, try std.fmt.bufPrint(&buf, "{}", .{num}));
    try std.testing.expect(try num.explode(allocator));
    try std.testing.expectEqualStrings(after, try std.fmt.bufPrint(&buf, "{}", .{num}));
}

test "Explode example 1" {
    try textExplosion(
        "[[[[[9,8],1],2],3],4]",
        "[[[[0,9],2],3],4]",
    );
}

test "Explode example 2" {
    try textExplosion(
        "[7,[6,[5,[4,[3,2]]]]]",
        "[7,[6,[5,[7,0]]]]",
    );
}

test "Explode example 3" {
    try textExplosion(
        "[[6,[5,[4,[3,2]]]],1]",
        "[[6,[5,[7,0]]],3]",
    );
}

test "Explode example 4" {
    try textExplosion(
        "[[3,[2,[1,[7,3]]]],[6,[5,[4,[3,2]]]]]",
        "[[3,[2,[8,0]]],[9,[5,[4,[3,2]]]]]",
    );
}

test "Explode example 5" {
    try textExplosion(
        "[[3,[2,[8,0]]],[9,[5,[4,[3,2]]]]]",
        "[[3,[2,[8,0]]],[9,[5,[7,0]]]]",
    );
}

test "Explode example 6.1" {
    try textExplosion(
        "[[[[[4,3],4],4],[7,[[8,4],9]]],[1,1]]",
        "[[[[0,7],4],[7,[[8,4],9]]],[1,1]]",
    );
}

test "Explode example 6.2" {
    try textExplosion(
        "[[[[0,7],4],[7,[[8,4],9]]],[1,1]]",
        "[[[[0,7],4],[15,[0,13]]],[1,1]]",
    );
}

test "Explode example 6.3" {
    try textExplosion(
        "[[[[0,7],4],[[7,8],[0,[6,7]]]],[1,1]]",
        "[[[[0,7],4],[[7,8],[6,0]]],[8,1]]",
    );
}

test "Split example 1" {
    var arena: std.heap.ArenaAllocator = .init(std.testing.allocator);
    defer arena.deinit();
    const allocator = arena.allocator();
    // Start with explosion because numbers > 9 cannot be parsed
    const num = try Num.parse(allocator, "[[[[0,7],4],[7,[[8,4],9]]],[1,1]]");
    _ = try num.explode(allocator); // [[[[0,7],4],[15,[0,13]]],[1,1]]
    var buf = [_]u8{0} ** 128;
    _ = try num.split(allocator);
    try std.testing.expectEqualStrings(
        "[[[[0,7],4],[[7,8],[0,13]]],[1,1]]",
        try std.fmt.bufPrint(&buf, "{}", .{num}),
    );
    _ = try num.split(allocator);
    try std.testing.expectEqualStrings(
        "[[[[0,7],4],[[7,8],[0,[6,7]]]],[1,1]]",
        try std.fmt.bufPrint(&buf, "{}", .{num}),
    );
}

test "Add example 1" {
    var arena: std.heap.ArenaAllocator = .init(std.testing.allocator);
    defer arena.deinit();
    const allocator = arena.allocator();
    const lhs = try Num.parse(allocator, "[1,2]");
    const rhs = try Num.parse(allocator, "[[3,4],5]");
    const add = try lhs.add(rhs, allocator);
    var buf = [_]u8{0} ** 128;
    try std.testing.expectEqualStrings(
        "[[1,2],[[3,4],5]]",
        try std.fmt.bufPrint(&buf, "{}", .{add}),
    );
}

test "Add + reduce example 1" {
    var arena: std.heap.ArenaAllocator = .init(std.testing.allocator);
    defer arena.deinit();
    const allocator = arena.allocator();
    const lhs = try Num.parse(allocator, "[[[[4,3],4],4],[7,[[8,4],9]]]");
    const rhs = try Num.parse(allocator, "[1,1]");
    const add = try lhs.add(rhs, allocator);
    try add.reduce(allocator);
    var buf = [_]u8{0} ** 128;
    try std.testing.expectEqualStrings(
        "[[[[0,7],4],[[7,8],[6,0]]],[8,1]]",
        try std.fmt.bufPrint(&buf, "{}", .{add}),
    );
}
