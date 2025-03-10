const std = @import("std");
const assert = std.debug.assert;
const print = std.debug.print;
const ArrayList = std.ArrayList;

const input = @embedFile("input.txt");

const Action = enum {
    forward,
    down,
    up,
};

const Command = struct {
    action: Action,
    units: i32,
};

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer assert(gpa.deinit() == .ok);
    const allocator = gpa.allocator();

    var list = ArrayList(Command).init(allocator);
    defer list.deinit();
    try parseInput(&list);

    var x: i32 = 0;
    var y: i32 = 0;
    for (list.items) |command| switch (command.action) {
        .forward => x += command.units,
        .down => y += command.units,
        .up => y -= command.units,
    };
    print("Answer 1: {d}\n", .{x * y});

    x = 0;
    y = 0;
    var aim: i32 = 0;
    for (list.items) |command| switch (command.action) {
        .forward => {
            x += command.units;
            y += command.units * aim;
        },
        .down => aim += command.units,
        .up => aim -= command.units,
    };
    print("Answer 2: {d}\n", .{x * y});
}

const parseInt = std.fmt.parseInt;
const splitScalar = std.mem.splitScalar;
const stringToEnum = std.meta.stringToEnum;

fn parseInput(list: *ArrayList(Command)) !void {
    var lines = splitScalar(u8, input, '\n');
    while (lines.next()) |line| {
        if (line.len == 0) continue;
        var parts = splitScalar(u8, line, ' ');
        try list.append(.{
            .action = stringToEnum(Action, parts.next().?).?,
            .units = try parseInt(i32, parts.next().?, 10),
        });
    }
}
