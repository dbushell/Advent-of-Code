const std = @import("std");
const parseInt = std.fmt.parseInt;
const splitScalar = std.mem.splitScalar;

const Claim = struct { id: i32, x: usize, y: usize, width: usize, height: usize };

const input = @embedFile("input.txt");

var gpa = std.heap.GeneralPurposeAllocator(.{}){};
const allocator = gpa.allocator();

pub fn main() !void {
    var claims = std.ArrayList(Claim).init(allocator);
    defer claims.deinit();

    var tokens = std.mem.tokenizeScalar(u8, input, '\n');
    while (tokens.next()) |line| {
        if (!std.mem.startsWith(u8, line, "#")) continue;
        // std.debug.print("{s}\n", .{line});
        var s1 = splitScalar(u8, line, ' ');
        const id = try parseInt(i32, s1.next().?[1..], 10);
        _ = s1.next();
        const part2 = s1.next().?;
        const part3 = s1.next().?;
        var coords = splitScalar(u8, part2[0 .. part2.len - 1], ',');
        const x = try parseInt(usize, coords.next().?, 10);
        const y = try parseInt(usize, coords.next().?, 10);
        var dimensions = splitScalar(u8, part3, 'x');
        const width = try parseInt(usize, dimensions.next().?, 10);
        const height = try parseInt(usize, dimensions.next().?, 10);
        try claims.append(.{ .id = id, .x = x, .y = y, .width = width, .height = height });
    }

    var fabric: [1000][1000]i32 = undefined;
    for (0..1000) |y| fabric[y] = .{0} ** 1000;

    for (claims.items) |claim| {
        for (claim.y..claim.y + claim.height) |y| {
            for (claim.x..claim.x + claim.width) |x| {
                fabric[y][x] = fabric[y][x] + 1;
            }
        }
    }

    var answer_one: i32 = 0;
    for (0..fabric.len) |y| {
        for (0..fabric[y].len) |x| {
            if (fabric[y][x] >= 2) answer_one += 1;
        }
    }

    const answer_two: i32 = outer: for (claims.items) |claim| {
        for (claim.y..claim.y + claim.height) |y| {
            for (claim.x..claim.x + claim.width) |x| {
                if (fabric[y][x] >= 2) {
                    continue :outer;
                }
            }
        }
        break claim.id;
    } else 0;

    std.debug.print("Answer 1: {d}\n", .{answer_one});
    std.debug.print("Answer 2: {d}\n", .{answer_two});
}
