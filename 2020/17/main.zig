const std = @import("std");
const assert = std.debug.assert;
const print = std.debug.print;
const Allocator = std.mem.Allocator;
const AutoArrayHashMap = std.AutoArrayHashMap;

const input = @embedFile("input.txt");

const State = AutoArrayHashMap(u64, Point);

const Point = struct {
    active: bool = false,
    key: u64 = 0,
    x: i32,
    y: i32,
    z: i32,
    w: i32,

    fn init(x: i32, y: i32, z: i32, w: i32) Point {
        var xyz = Point{ .x = x, .y = y, .z = z, .w = w };
        xyz.key = xyz.hash();
        return xyz;
    }

    fn hash(self: Point) u64 {
        var buf: [32]u8 = undefined;
        const slice = std.fmt.bufPrint(&buf, "{d},{d},{d},{d}", .{ self.x, self.y, self.z, self.w }) catch unreachable;
        return std.hash.XxHash3.hash(0, slice);
    }

    /// Return surrounding coordinates in 4 dimensions
    fn neighbours(self: Point) [80]Point {
        var list: [80]Point = undefined;
        var i: usize = 0;
        for (0..3) |uw| {
            const w: i32 = self.w + @as(i32, @intCast(uw)) - 1;
            for (0..3) |uz| {
                const z: i32 = self.z + @as(i32, @intCast(uz)) - 1;
                for (0..3) |uy| {
                    const y: i32 = self.y + @as(i32, @intCast(uy)) - 1;
                    for (0..3) |ux| {
                        const x: i32 = self.x + @as(i32, @intCast(ux)) - 1;
                        if (x == self.x and y == self.y and z == self.z and w == self.w) continue;
                        list[i] = Point.init(x, y, z, w);
                        i += 1;
                    }
                }
            }
        }
        return list;
    }

    fn nextState(self: *Point, state: *State) void {
        // Total active neighbours
        var count: usize = 0;
        for (self.neighbours()) |a| {
            if (state.get(a.key)) |b| count += if (b.active) 1 else 0;
        }
        // Existing or new coordinate?
        if (state.get(self.key)) |current| {
            if (current.active) {
                self.active = count == 2 or count == 3;
            } else {
                self.active = count == 3;
            }
        } else {
            self.active = count == 3;
        }
    }
};

fn nextState(state: *State, dimensions: u8) !State {
    defer state.deinit();
    var next = State.init(state.allocator);
    var min = Point{ .x = 0, .y = 0, .z = 0, .w = 0 };
    var max = Point{ .x = 0, .y = 0, .z = 0, .w = 0 };
    for (state.values()) |xyz| {
        min.x = @min(min.x, xyz.x - 1);
        min.y = @min(min.y, xyz.y - 1);
        min.z = @min(min.z, xyz.z - 1);
        min.w = @min(min.w, xyz.w - 1);
        max.x = @max(max.x, xyz.x + 2);
        max.y = @max(max.y, xyz.y + 2);
        max.z = @max(max.z, xyz.z + 2);
        max.w = @max(max.w, xyz.w + 2);
    }
    if (dimensions != 4) {
        min.w = 0;
        max.w = 1;
    }
    var i = Point{ .x = min.x, .y = min.y, .z = min.z, .w = min.w };
    while (i.w < max.w) : (i.w += 1) {
        i.z = min.z;
        while (i.z < max.z) : (i.z += 1) {
            i.y = min.y;
            while (i.y < max.y) : (i.y += 1) {
                i.x = min.x;
                while (i.x < max.x) : (i.x += 1) {
                    var new = Point.init(i.x, i.y, i.z, i.w);
                    new.nextState(state);
                    try next.put(new.key, new);
                }
            }
        }
    }
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
            var xyz = Point.init(@intCast(x), @intCast(y), 0, 0);
            xyz.active = line[x] == '#';
            try state.put(xyz.key, xyz);
        }
    }
}
