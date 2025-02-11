const std = @import("std");
const assert = std.debug.assert;
const print = std.debug.print;
const Allocator = std.mem.Allocator;
const AutoArrayHashMap = std.AutoArrayHashMap;

const input = @embedFile("input.txt");

const Vec4 = @Vector(4, i32);
const State = AutoArrayHashMap(Vec4, Point);

/// Iterate from min (inclusive) to max (exclusive)
fn iterate4D(
    min: Vec4,
    max: Vec4,
    context: anytype,
    comptime callbackFn: fn (@TypeOf(context), i: Vec4) void,
) void {
    var i = min;
    while (i[3] < max[3]) : (i[3] += 1) {
        i[2] = min[2];
        while (i[2] < max[2]) : (i[2] += 1) {
            i[1] = min[1];
            while (i[1] < max[1]) : (i[1] += 1) {
                i[0] = min[0];
                while (i[0] < max[0]) : (i[0] += 1) {
                    callbackFn(context, i);
                }
            }
        }
    }
}

/// 4D vector with state
const Point = struct {
    active: bool = false,
    v: Vec4,

    /// Return surrounding coordinates in four dimensions
    fn neighbours(self: Point) [80]Point {
        var list: [80]Point = undefined;
        var index: usize = 0;
        const min: Vec4 = self.v - Vec4{ 1, 1, 1, 1 };
        const max: Vec4 = self.v + Vec4{ 2, 2, 2, 2 };
        iterate4D(min, max, .{ &list, &index, self.v }, struct {
            fn callbackFn(ctx: struct { *[80]Point, *usize, Vec4 }, i: Vec4) void {
                if (std.meta.eql(i, ctx[2])) return;
                ctx[0][ctx[1].*] = Point{ .v = i };
                ctx[1].* += 1;
            }
        }.callbackFn);
        return list;
    }

    /// Update state based on active neighbours
    fn nextState(self: *Point, state: *State) void {
        // Total active neighbours
        var count: usize = 0;
        for (self.neighbours()) |a| {
            if (state.get(a.v)) |b| count += if (b.active) 1 else 0;
        }
        // Existing or new coordinate
        if (state.get(self.v)) |current| {
            self.active = if (current.active) (count == 2 or count == 3) else count == 3;
        } else {
            self.active = count == 3;
        }
    }
};

fn nextState(state: *State, dimensions: u8) !State {
    defer state.deinit();
    var next = State.init(state.allocator);
    var min: Vec4 = .{ 0, 0, 0, 0 };
    var max: Vec4 = .{ 0, 0, 0, 0 };
    for (state.values()) |xyz| {
        min = @min(min, xyz.v + Vec4{ -1, -1, -1, -1 });
        max = @max(max, xyz.v + Vec4{ 2, 2, 2, 2 });
    }
    if (dimensions != 4) {
        min[3] = 0;
        max[3] = 1;
    }
    iterate4D(min, max, .{ state, &next }, struct {
        fn callbackFn(ctx: struct { *State, *State }, i: Vec4) void {
            var new = Point{ .v = i };
            new.nextState(ctx[0]);
            ctx[1].put(new.v, new) catch unreachable;
        }
    }.callbackFn);
    return next;
}

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer assert(gpa.deinit() == .ok);
    const allocator = gpa.allocator();

    var part1 = State.init(allocator);
    defer part1.deinit();
    try parseInput(&part1);
    var part2 = try part1.clone();
    defer part2.deinit();

    for (0..6) |_| part1 = try nextState(&part1, 3);
    var active3d: usize = 0;
    for (part1.values()) |xyz| active3d += if (xyz.active) 1 else 0;
    print("Answer 1: {d}\n", .{active3d});

    for (0..6) |_| part2 = try nextState(&part2, 4);
    var active4d: usize = 0;
    for (part2.values()) |xyz| active4d += if (xyz.active) 1 else 0;
    print("Answer 2: {d}\n", .{active4d});
}

fn parseInput(state: *State) !void {
    var y: i32 = 0;
    var lines = std.mem.tokenizeScalar(u8, input, '\n');
    while (lines.next()) |line| : (y += 1) {
        if (line.len == 0) continue;
        for (0..line.len) |x| {
            var xyz = Point{ .v = .{ @intCast(x), @intCast(y), 0, 0 } };
            xyz.active = line[x] == '#';
            try state.put(xyz.v, xyz);
        }
    }
}
