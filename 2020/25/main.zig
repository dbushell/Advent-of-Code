const std = @import("std");
const assert = std.debug.assert;
const print = std.debug.print;
const parseInt = std.fmt.parseInt;

const input = @embedFile("input.txt");

const card = parseInt(usize, input[0..6], 10) catch unreachable;
const door = parseInt(usize, input[7..13], 10) catch unreachable;

fn loopSize(key: usize) usize {
    var size: usize = 0;
    var value: usize = 1;
    while (value != key) : (size += 1) {
        value = @mod(value * 7, 20201227);
    }
    return size;
}

fn encryptionKey(key: usize, size: usize) usize {
    var value: usize = 1;
    for (0..size) |_| value = @mod(value * key, 20201227);
    return value;
}

pub fn main() !void {
    const card_size = loopSize(card);
    print("Answer: {d}\n", .{encryptionKey(door, card_size)});
}

test "Loop Size 1" {
    const size = loopSize(5764801);
    try std.testing.expectEqual(8, size);
}

test "Loop Size 2" {
    const size = loopSize(17807724);
    try std.testing.expectEqual(11, size);
}

test "Encryption Key 1" {
    const key = encryptionKey(17807724, 8);
    try std.testing.expectEqual(14897079, key);
}

test "Encryption Key 2" {
    const key = encryptionKey(5764801, 11);
    try std.testing.expectEqual(14897079, key);
}
