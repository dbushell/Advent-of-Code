const std = @import("std");
const assert = std.debug.assert;
const print = std.debug.print;
const ArrayList = std.ArrayList;
const StringArrayHashMap = std.StringArrayHashMap;
const Allocator = std.mem.Allocator;

const input = @embedFile("input.txt");

const Line = struct {
    buf: []const u8,
    a: []const u8 = undefined,
    b: []const u8 = undefined,
};

const Cave = struct {
    allocator: Allocator,
    connections: StringArrayHashMap(*Cave),
    id: []const u8,
    small: bool,

    fn init(allocator: Allocator, id: []const u8) !Cave {
        return .{
            .allocator = allocator,
            .connections = StringArrayHashMap(*Cave).init(allocator),
            .id = try allocator.dupe(u8, id),
            .small = value: {
                for (id) |c| if (std.ascii.isUpper(c)) break :value false;
                break :value true;
            },
        };
    }

    fn deinit(cave: *Cave) void {
        cave.allocator.free(cave.id);
        cave.connections.deinit();
    }

    fn create(allocator: Allocator, id: []const u8) !*Cave {
        const ptr = try allocator.create(Cave);
        ptr.* = try Cave.init(allocator, id);
        return ptr;
    }

    fn destroy(cave: *Cave) void {
        cave.deinit();
        cave.allocator.destroy(cave);
    }

    /// Return all paths (visit small caves only once)
    fn route1(start: *Cave, end: *Cave, paths: *ArrayList(ArrayList(*Cave))) !void {
        const allocator = start.allocator;
        var queue = ArrayList(ArrayList(*Cave)).init(allocator);
        defer queue.deinit();
        var p0 = ArrayList(*Cave).init(allocator);
        try p0.append(start);
        try queue.append(p0);
        while (queue.items.len > 0) {
            const p1 = queue.pop();
            defer p1.deinit();
            const head = p1.getLast();
            diverge: for (head.connections.values()) |c1| {
                // Never revisit small caves
                for (p1.items) |c2| {
                    if (c2.small and @intFromPtr(c2) == @intFromPtr(c1)) {
                        continue :diverge;
                    }
                }
                var p2 = try p1.clone();
                try p2.append(c1);
                // End or continue new path
                if (@intFromPtr(c1) == @intFromPtr(end)) {
                    try paths.append(p2);
                } else {
                    try queue.append(p2);
                }
            }
        }
    }

    /// Return all paths (visit a single small cave twice)
    fn route2(start: *Cave, end: *Cave, paths: *ArrayList(ArrayList(*Cave))) !void {
        const allocator = start.allocator;
        var queue = ArrayList(ArrayList(*Cave)).init(allocator);
        defer queue.deinit();
        var p0 = ArrayList(*Cave).init(allocator);
        try p0.append(start);
        try queue.append(p0);
        while (queue.items.len > 0) {
            const p1 = queue.pop();
            defer p1.deinit();
            const head = p1.getLast();
            // Check if this path has visited a small cave twice
            // This is very inefficient but whatever!
            const twice: bool = check: {
                for (p1.items, 0..) |a, i| for (p1.items, 0..) |b, j| {
                    if (i == j) continue;
                    if (!a.small or !b.small) continue;
                    if (@intFromPtr(a) == @intFromPtr(b)) break :check true;
                };
                break :check false;
            };
            diverge: for (head.connections.values()) |c1| {
                // Allow revisiting a small cave only once
                if (@intFromPtr(c1) == @intFromPtr(start)) continue;
                for (p1.items) |c2| {
                    if (c2.small and @intFromPtr(c2) == @intFromPtr(c1)) {
                        if (twice) continue :diverge;
                    }
                }
                var p2 = try p1.clone();
                try p2.append(c1);
                // End or continue new path
                if (@intFromPtr(c1) == @intFromPtr(end)) {
                    try paths.append(p2);
                } else {
                    try queue.append(p2);
                }
            }
        }
    }
};

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

    var caves = StringArrayHashMap(*Cave).init(allocator);
    defer {
        for (caves.values()) |cave| cave.destroy();
        caves.deinit();
    }

    // Connect caves
    for (list.items) |item| {
        const a = try caves.getOrPut(item.a);
        if (!a.found_existing) {
            a.value_ptr.* = try Cave.create(allocator, item.a);
        }
        const a_ptr = a.value_ptr.*;
        const b = try caves.getOrPut(item.b);
        if (!b.found_existing) {
            b.value_ptr.* = try Cave.create(allocator, item.b);
        }
        const b_ptr = b.value_ptr.*;
        try a_ptr.connections.put(b_ptr.id, b_ptr);
        try b_ptr.connections.put(a_ptr.id, a_ptr);
    }

    var paths = ArrayList(ArrayList(*Cave)).init(allocator);
    defer {
        for (paths.items) |p| p.deinit();
        paths.deinit();
    }

    const start = caves.get("start").?;
    const end = caves.get("end").?;
    try start.route1(end, &paths);

    print("Answer 1: {d}\n", .{paths.items.len});

    for (paths.items) |p| p.deinit();
    paths.clearRetainingCapacity();
    try start.route2(end, &paths);

    print("Answer 2: {d}\n", .{paths.items.len});
}

const splitScalar = std.mem.splitScalar;

fn parseInput(list: *ArrayList(Line)) !void {
    var lines = splitScalar(u8, input, '\n');
    while (lines.next()) |line| {
        if (line.len == 0) continue;
        var item = Line{ .buf = try list.allocator.dupe(u8, line) };
        var parts = splitScalar(u8, item.buf, '-');
        item.a = parts.next().?;
        item.b = parts.next().?;
        try list.append(item);
    }
}
