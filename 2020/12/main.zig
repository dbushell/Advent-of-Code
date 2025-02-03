const std = @import("std");
const assert = std.debug.assert;
const print = std.debug.print;
const ArrayList = std.ArrayList;

const Point = @import("./src/point.zig").Point;

const input = @embedFile("input.txt");

const Action = enum {
    N,
    E,
    S,
    W,
    L,
    R,
    F,

    fn match(name: []const u8) ?Action {
        inline for (std.meta.fields(Action)) |field|
            if (std.mem.eql(u8, name, field.name)) return @enumFromInt(field.value);
        return null;
    }

    fn left(self: Action, deg: u32) Action {
        return self.right(360 - deg);
    }

    fn right(self: Action, deg: u32) Action {
        assert(@intFromEnum(self) < 4);
        var dir = self;
        for (0..@intCast(@divFloor(deg, 90))) |_| {
            dir = @enumFromInt(@mod(@as(i8, @intFromEnum(dir)) + 1, 4));
        }
        return dir;
    }
};

const Instruction = struct {
    action: Action,
    units: u32,
};

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer assert(gpa.deinit() == .ok);
    const allocator = gpa.allocator();

    var instructions = ArrayList(Instruction).init(allocator);
    defer instructions.deinit();

    try parseInput(&instructions);

    const start = Point.init(0, 0);
    var now = start;
    var dir = Action.E;

    for (instructions.items) |item| {
        var action = item.action;
        const units: i32 = @intCast(item.units);
        act: while (true) {
            switch (action) {
                .N => now.y -= units,
                .E => now.x += units,
                .S => now.y += units,
                .W => now.x -= units,
                .L => dir = dir.left(item.units),
                .R => dir = dir.right(item.units),
                .F => {
                    action = dir;
                    continue :act;
                },
                // Zig 0.14 - remove `while` loop?
                // .F =>  continue :act dir.action(),
            }
            break;
        }
    }
    print("Answer 1: {d}\n", .{now.distance(start)});

    now = start;
    var waypoint = Point.init(10, -1);

    for (instructions.items) |item| {
        var units: i32 = @intCast(item.units);
        switch (item.action) {
            .N => waypoint.y -= units,
            .E => waypoint.x += units,
            .S => waypoint.y += units,
            .W => waypoint.x -= units,
            .L, .R => {
                if (item.action == .L) units = 360 - units;
                waypoint = waypoint.rotate(null, @floatFromInt(units));
            },
            .F => for (0..@intCast(units)) |_| {
                now.x += waypoint.x;
                now.y += waypoint.y;
            },
        }
    }
    print("Answer 2: {d}\n", .{now.distance(start)});
}

const parseInt = std.fmt.parseInt;
const splitScalar = std.mem.splitScalar;

fn parseInput(list: *ArrayList(Instruction)) !void {
    var lines = splitScalar(u8, input, '\n');
    while (lines.next()) |line| {
        if (line.len == 0) continue;
        try list.append(.{
            .action = Action.match(line[0..1]).?,
            .units = try parseInt(u32, line[1..], 10),
        });
    }
}
