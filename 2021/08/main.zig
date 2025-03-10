const std = @import("std");
const assert = std.debug.assert;
const print = std.debug.print;
const eql = std.mem.eql;
const ArrayList = std.ArrayList;
const AutoArrayHashMap = std.AutoArrayHashMap;

const input = @embedFile("input.txt");

const Line = struct {
    buf: []const u8,
    digits: [10][]const u8 = undefined,
    output: [4][]const u8 = undefined,
};

/// Returns true if `haystack` has all bytes of `needle`
fn contains(haystack: []const u8, needle: []const u8) bool {
    if (haystack.len < needle.len) return false;
    char: for (needle) |a| {
        for (haystack) |b| if (a == b) continue :char;
        return false;
    }
    return true;
}

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer assert(gpa.deinit() == .ok);
    const allocator = gpa.allocator();

    var list = ArrayList(Line).init(allocator);
    defer {
        for (list.items) |item| allocator.free(item.buf);
        list.deinit();
    }
    try parseInput(&list);

    var answer1: usize = 0;
    var answer2: usize = 0;

    for (list.items) |item| {
        // Count unique instances for answer 1
        for (item.output) |out| if (out.len == 2 or out.len == 3 or out.len == 4 or out.len == 7) {
            answer1 += 1;
        };

        // Digits 1, 4, 7 and 8 have unique segment counts
        var map: [10]?[]const u8 = .{null} ** 10;
        for (item.digits) |dig| switch (dig.len) {
            2 => map[1] = dig,
            3 => map[7] = dig,
            4 => map[4] = dig,
            7 => map[8] = dig,
            else => {},
        };

        // Find digits 0, 2, 3, 5, 6, and 9
        var d: usize = 0;
        find: while (true) : (d += 1) {
            if (d == 10) d = 0;
            // Skip found digits
            var found: usize = 0;
            const dig = item.digits[d];
            for (map) |m| if (m) |v| {
                if (eql(u8, v, dig)) continue :find;
                found += 1;
            };
            // Last unfound digit must be 2
            if (found == 9) {
                map[2] = dig;
                break;
            }
            // All segments of 5 are within 6
            if (map[6]) |six| if (contains(six, dig)) {
                map[5] = dig;
                continue;
            };
            // Only 6 has a length of 6 and does not contain 1
            if (!contains(dig, map[1].?)) {
                if (dig.len == 6) map[6] = dig;
                continue;
            }
            if (!contains(dig, map[7].?)) {
                continue;
            }
            if (!contains(dig, map[4].?)) {
                // Only 3 contains 1 and 7 with a length of 5
                if (dig.len == 5) map[3] = dig;
                // Only 0 contains 1 and 7 with a length of 6
                if (dig.len == 6) map[0] = dig;
                continue;
            }
            // Only 9 contains all segments of 1, 4, and 7
            map[9] = dig;
        }

        // Total sum of all outputs
        const m = [4]usize{ 1000, 100, 10, 1 };
        for (0..4) |i| answer2 += m[i] * dig: {
            for (0..10) |j| if (eql(u8, item.output[i], map[j].?)) break :dig j;
            unreachable;
        };
    }

    print("Answer 1: {d}\n", .{answer1});
    print("Answer 2: {d}\n", .{answer2});
}

const parseInt = std.fmt.parseInt;
const splitScalar = std.mem.splitScalar;
const splitSequence = std.mem.splitSequence;

fn parseInput(list: *ArrayList(Line)) !void {
    var lines = splitScalar(u8, input, '\n');
    while (lines.next()) |line| {
        if (line.len == 0) continue;
        var item = Line{ .buf = try list.allocator.dupe(u8, line) };
        var parts = splitSequence(u8, item.buf, " | ");
        var digits = splitScalar(u8, parts.next().?, ' ');
        var output = splitScalar(u8, parts.next().?, ' ');
        for (0..10) |i| {
            item.digits[i] = digits.next().?;
            std.mem.sort(u8, @constCast(item.digits[i]), {}, std.sort.asc(u8));
        }
        for (0..4) |i| {
            item.output[i] = output.next().?;
            std.mem.sort(u8, @constCast(item.output[i]), {}, std.sort.asc(u8));
        }
        try list.append(item);
    }
}
