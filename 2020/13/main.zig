const std = @import("std");
const assert = std.debug.assert;
const print = std.debug.print;
const ArrayList = std.ArrayList;

const input = @embedFile("input.txt");

const Bus = struct {
    id: u32,
    offset: u32 = 0,
    nearest: u32 = 0,

    fn compareNearest(_: void, a: Bus, b: Bus) bool {
        return a.nearest < b.nearest;
    }

    fn compareOffset(_: void, a: Bus, b: Bus) bool {
        return a.offset < b.offset;
    }
};

/// Greatest common divisor
fn gcd(a: u64, b: u64) u64 {
    return if (b == 0) a else gcd(b, @mod(a, b));
}

/// Lowest common multiple
fn lcm(a: u64, b: u64) u64 {
    return @divFloor((a * b), gcd(a, b));
}

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer assert(gpa.deinit() == .ok);
    const allocator = gpa.allocator();

    var buses = ArrayList(Bus).init(allocator);
    defer buses.deinit();

    const earliest = try parseInput(&buses);
    for (buses.items) |*bus| {
        while (bus.nearest < earliest) bus.nearest += bus.id;
    }
    std.mem.sort(Bus, buses.items, {}, Bus.compareNearest);
    print("Answer 1: {d}\n", .{(buses.items[0].nearest - earliest) * buses.items[0].id});

    std.mem.sort(Bus, buses.items, {}, Bus.compareOffset);
    var timestamp: u64 = buses.items[0].id;
    var interval: u64 = buses.items[0].id;
    for (buses.items) |bus| {
        while (@mod((timestamp + bus.offset), bus.id) != 0) timestamp += interval;
        interval = lcm(interval, bus.id);
    }
    print("Answer 2: {d}\n", .{timestamp});
}

const parseInt = std.fmt.parseInt;
const splitScalar = std.mem.splitScalar;

fn parseInput(list: *ArrayList(Bus)) !u32 {
    var lines = splitScalar(u8, input, '\n');
    const earliest = try parseInt(u32, lines.next().?, 10);
    var ids = splitScalar(u8, lines.next().?, ',');
    var offset: u32 = 0;
    while (ids.next()) |id| : (offset += 1) {
        const x = std.mem.eql(u8, id, "x");
        if (x) continue;
        try list.append(Bus{
            .id = try parseInt(u32, id, 10),
            .offset = offset,
        });
    }
    return earliest;
}
