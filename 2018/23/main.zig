const std = @import("std");
const assert = std.debug.assert;
const print = std.debug.print;
const ArrayList = std.ArrayList;

const input = @embedFile("input.txt");

var gpa = std.heap.GeneralPurposeAllocator(.{}){};
const allocator = gpa.allocator();

const Bot = struct {
    x: i32 = 0,
    y: i32 = 0,
    z: i32 = 0,
    r: i32 = 0,

    fn distance(a: Bot, b: Bot) u32 {
        return @abs(a.x - b.x) + @abs(a.y - b.y) + @abs(a.z - b.z);
    }

    fn in_range(a: Bot, b: Bot) bool {
        return a.r >= a.distance(b);
    }

    fn in_range_all(a: Bot, size: i32, nanobots: ArrayList(Bot)) i32 {
        var count: i32 = 0;
        for (nanobots.items) |b| {
            if (b.distance(a) < b.r + size) count += 1;
        }
        return count;
    }
};

pub fn main() !void {
    defer _ = gpa.detectLeaks();

    var nanobots = ArrayList(Bot).init(allocator);
    defer nanobots.deinit();

    parseInput(&nanobots);

    var max = Bot{};
    var min = Bot{
        .x = std.math.maxInt(i32),
        .y = std.math.maxInt(i32),
        .z = std.math.maxInt(i32),
        .r = std.math.maxInt(i32),
    };

    var strongest = nanobots.items[0];
    for (nanobots.items) |bot| {
        if (bot.r > strongest.r) strongest = bot;
        min.x = @min(min.x, bot.x);
        min.y = @min(min.y, bot.y);
        min.z = @min(min.z, bot.z);
        min.r = @min(min.r, bot.r);
        max.x = @max(max.x, bot.x);
        max.y = @max(max.y, bot.y);
        max.z = @max(max.z, bot.z);
        max.r = @max(max.r, bot.r);
    }

    var in_range = ArrayList(Bot).init(allocator);
    defer in_range.deinit();
    for (nanobots.items) |bot| {
        if (strongest.in_range(bot)) try in_range.append(bot);
    }

    print("Answer 1: {d}\n", .{in_range.items.len});

    const center = Bot{};
    var best: ?Bot = null;

    var size = max.x - min.x;
    while (size > 0) {
        defer {
            min.x = best.?.x - size;
            min.y = best.?.y - size;
            min.z = best.?.z - size;
            max.x = best.?.x + size;
            max.y = best.?.y + size;
            max.z = best.?.z + size;
            size = @divFloor(size, 2);
        }
        var best_count: i32 = 0;
        var x = min.x;
        while (x < max.x) : (x += size) {
            var y = min.y;
            while (y < max.y) : (y += size) {
                var z = min.z;
                while (z < max.z) : (z += size) {
                    const point = Bot{ .x = x, .y = y, .z = z };
                    const count = point.in_range_all(size, nanobots);
                    if (best == null or best_count < count) {
                        best_count = count;
                        best = point;
                        continue;
                    }
                    if (best_count == count and point.distance(center) < best.?.distance(center)) {
                        best = point;
                    }
                }
            }
        }
    }

    print("Answer 2: {d}\n", .{best.?.distance(center)});
}

const parseInt = std.fmt.parseInt;
const splitScalar = std.mem.splitScalar;
const splitSequence = std.mem.splitSequence;

fn parseInput(nanobots: *ArrayList(Bot)) void {
    var lines = splitScalar(u8, input, '\n');
    while (lines.next()) |line| {
        if (line.len == 0) continue;
        var parts = splitSequence(u8, line, ", ");
        const pos = parts.next().?;
        var xyz = splitScalar(u8, pos[5 .. pos.len - 1], ',');
        nanobots.append(.{
            .x = parseInt(i32, xyz.next().?, 10) catch 0,
            .y = parseInt(i32, xyz.next().?, 10) catch 0,
            .z = parseInt(i32, xyz.next().?, 10) catch 0,
            .r = parseInt(i32, parts.next().?[2..], 10) catch 0,
        }) catch unreachable;
    }
}
