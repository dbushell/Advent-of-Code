const std = @import("std");
const assert = std.debug.assert;
const print = std.debug.print;
const Allocator = std.mem.Allocator;
const ArrayList = std.ArrayList;

const input = @embedFile("input.txt");

const ArrayVec4 = ArrayList(Vec4);

const Vec4 = struct {
    a: i32,
    b: i32,
    c: i32,
    d: i32,

    fn distance(v1: Vec4, v2: Vec4) u32 {
        return @abs(v1.a - v2.a) + @abs(v1.b - v2.b) + @abs(v1.c - v2.c) + @abs(v1.d - v2.d);
    }

    fn compare(_: void, a: Vec4, b: Vec4) bool {
        if (a.a != b.a) return a.a < b.a;
        if (a.b != b.b) return a.b < b.b;
        if (a.c != b.c) return a.c < b.c;
        return a.d < b.d;
    }
};

fn merge(a: *ArrayVec4, b: *ArrayVec4) !void {
    for (b.items) |vec| try a.append(vec);
    b.deinit();
}

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    const allocator = gpa.allocator();
    defer _ = gpa.detectLeaks();

    var vectors = ArrayVec4.init(allocator);
    defer vectors.deinit();
    try parseInput(&vectors);

    // Probably not necessary?
    std.mem.sort(Vec4, vectors.items, {}, Vec4.compare);

    var groups = ArrayList(ArrayVec4).init(allocator);
    defer {
        for (groups.items) |list| list.deinit();
        groups.deinit();
    }

    next: for (vectors.items) |vec| {
        // Add to existing group
        for (groups.items) |*c1| {
            for (c1.items) |v| {
                if (vec.distance(v) > 3) continue;
                try c1.append(vec);
                continue :next;
            }
        }
        // Or create new group
        var chain = ArrayVec4.init(allocator);
        try chain.append(vec);
        try groups.append(chain);
    }

    // Merge groups
    var length: usize = 0;
    while (true) {
        merging: for (0..groups.items.len) |c1| {
            for (0..groups.items.len) |c2| {
                if (c1 == c2) continue;
                const l1 = &groups.items[c1];
                const l2 = &groups.items[c2];
                for (l1.items) |v1| {
                    for (l2.items) |v2| {
                        if (v1.distance(v2) > 3) continue;
                        var l3 = groups.swapRemove(c2);
                        try merge(l1, &l3);
                        break :merging;
                    }
                }
            }
        }
        // No more merges?
        if (length == groups.items.len) break;
        length = groups.items.len;
    }

    print("Answer 1: {d}\n", .{groups.items.len});
}

const parseInt = std.fmt.parseInt;
const splitScalar = std.mem.splitScalar;

fn parseInput(list: *ArrayList(Vec4)) !void {
    var lines = splitScalar(u8, input, '\n');
    while (lines.next()) |line| {
        if (line.len == 0) continue;
        var numbers = splitScalar(u8, line, ',');
        try list.append(.{
            .a = try parseInt(i32, numbers.next().?, 10),
            .b = try parseInt(i32, numbers.next().?, 10),
            .c = try parseInt(i32, numbers.next().?, 10),
            .d = try parseInt(i32, numbers.next().?, 10),
        });
    }
}
