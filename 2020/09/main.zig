const std = @import("std");
const assert = std.debug.assert;
const print = std.debug.print;
const ArrayList = std.ArrayList;
const LinearFifo = std.fifo.LinearFifo;

const input = @embedFile("input.txt");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer assert(gpa.deinit() == .ok);
    const allocator = gpa.allocator();

    var list = ArrayList(u64).init(allocator);
    defer list.deinit();
    try parseInput(&list);

    const capacity: usize = if (list.items.len < 100) 5 else 25;

    var buf = try allocator.alloc(u64, capacity);
    defer allocator.free(buf);

    var fifo = LinearFifo(u64, .Slice).init(buf[0..]);
    defer fifo.deinit();
    try fifo.ensureTotalCapacity(capacity);

    var target: u64 = 0;
    for (list.items) |n| {
        if (fifo.writableLength() == 0) {
            const valid = validate: {
                for (0..buf.len) |i| {
                    for (0..buf.len) |j| {
                        if (i == j) continue;
                        if (buf[i] + buf[j] == n) break :validate true;
                    }
                }
                break :validate false;
            };
            if (!valid) {
                target = n;
                break;
            }
            fifo.discard(1);
        }
        fifo.writeItemAssumeCapacity(n);
    }
    print("Answer 1: {d}\n", .{target});

    var smallest: u64 = std.math.maxInt(u64);
    var largest: u64 = 0;

    var start: usize = 0;
    var end: usize = 1;
    var sum = list.items[0] + list.items[1];
    while (true) {
        if (sum > target) {
            sum -= list.items[start];
            start += 1;
        }
        if (end == start or sum < target) {
            end += 1;
            sum += list.items[end];
        }
        if (sum == target) {
            for (list.items[start .. end + 1]) |n| {
                smallest = @min(smallest, n);
                largest = @max(largest, n);
            }
            break;
        }
    }
    print("Answer 2: {d}\n", .{smallest + largest});

    // contiguous: for (0..list.items.len) |start| {
    //     for (start + 2..list.items.len) |end| {
    //         const slice = list.items[start..end];
    //         var sum: u64 = 0;
    //         for (slice) |n| {
    //             sum += n;
    //             if (sum > target) continue :contiguous;
    //         }
    //         if (sum == target) {
    //             for (slice) |n| {
    //                 smallest = @min(smallest, n);
    //                 largest = @max(largest, n);
    //             }
    //             break :contiguous;
    //         }
    //     }
    // }
}

const parseInt = std.fmt.parseInt;
const splitScalar = std.mem.splitScalar;

fn parseInput(list: *ArrayList(u64)) !void {
    var lines = splitScalar(u8, input, '\n');
    while (lines.next()) |line| {
        if (line.len == 0) continue;
        try list.append(try parseInt(u64, line, 10));
    }
}
