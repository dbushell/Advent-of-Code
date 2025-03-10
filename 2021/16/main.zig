const std = @import("std");
const assert = std.debug.assert;
const print = std.debug.print;
const Allocator = std.mem.Allocator;
const ArrayList = std.ArrayList;
const DynamicBitSet = std.bit_set.DynamicBitSet;
const IntegerBitSet = std.bit_set.IntegerBitSet;

const input = @embedFile("input.txt");

/// Read bytes as `u4` and convert hexadecimal to bits
fn bitset(allocator: Allocator, buf: []const u8) !DynamicBitSet {
    var set: DynamicBitSet = try .initEmpty(allocator, buf.len * 4);
    for (buf, 0..) |char, i| {
        const digit: u4 = @truncate(try std.fmt.charToDigit(char, 16));
        if (digit & 0b1000 > 0) set.set(i * 4 + 0);
        if (digit & 0b0100 > 0) set.set(i * 4 + 1);
        if (digit & 0b0010 > 0) set.set(i * 4 + 2);
        if (digit & 0b0001 > 0) set.set(i * 4 + 3);
    }
    return set;
}

/// Returns int value from bit range
fn readInt(set: DynamicBitSet, start: usize, comptime size: usize) usize {
    var subset: IntegerBitSet(size) = .initEmpty();
    for (0..size) |i| if (set.isSet(start + i)) subset.set((size - 1) - i);
    return @intCast(subset.mask);
}

const Packet = struct {
    type: Packet.Type,
    /// First bit index (inclusive)
    start: usize,
    /// Last bit index (exclusive)
    end: usize,
    /// Sub of version + subpacket versions
    version: usize,
    /// Literal or evaluated value
    value: usize,

    const Type = enum(u8) {
        sum = 0,
        product = 1,
        minimum = 2,
        maximum = 3,
        literal = 4,
        greater_than = 5,
        less_than = 6,
        equal_to = 7,
    };

    fn parse(set: DynamicBitSet, start: usize) !Packet {
        var i: usize = start;
        const version = readInt(set, i, 3);
        i += 3;
        const type_id = readInt(set, i, 3);
        i += 3;
        var packet = Packet{
            .type = @enumFromInt(type_id),
            .start = start,
            .end = start,
            .version = version,
            .value = 0,
        };
        if (packet.type == .literal) {
            var digits: ArrayList(u8) = .init(set.allocator);
            defer digits.deinit();
            while (i < set.capacity()) : (i += 5) {
                for (0..4) |j| try digits.append(if (set.isSet(i + j + 1)) '1' else '0');
                if (!set.isSet(i)) break;
            }
            i += 5;
            packet.value = try std.fmt.parseInt(usize, digits.items, 2);
        } else {
            // Read subpackets
            var list: ArrayList(Packet) = .init(set.allocator);
            defer list.deinit();
            i += 1;
            // Read a fixed number of subpackets
            if (set.isSet(i - 1)) {
                const count = readInt(set, i, 11);
                i += 11;
                var total: usize = 0;
                while (total < count) : (total += 1) {
                    const subpacket = try Packet.parse(set, i);
                    try list.append(subpacket);
                    packet.version += subpacket.version;
                    i = subpacket.end;
                }
            }
            // Read subpackets until length is reached
            else {
                const length = readInt(set, i, 15);
                i += 15;
                const end = i + length;
                while (i < end) {
                    const subpacket = try Packet.parse(set, i);
                    try list.append(subpacket);
                    packet.version += subpacket.version;
                    i = subpacket.end;
                }
            }
            switch (packet.type) {
                .sum => {
                    packet.value = list.items[0].value;
                    for (1..list.items.len) |j| {
                        packet.value += list.items[j].value;
                    }
                },
                .product => {
                    packet.value = list.items[0].value;
                    for (1..list.items.len) |j| {
                        packet.value *= list.items[j].value;
                    }
                },
                .minimum => {
                    packet.value = list.items[0].value;
                    for (1..list.items.len) |j| {
                        packet.value = @min(packet.value, list.items[j].value);
                    }
                },
                .maximum => {
                    packet.value = list.items[0].value;
                    for (1..list.items.len) |j| {
                        packet.value = @max(packet.value, list.items[j].value);
                    }
                },
                .greater_than => {
                    assert(list.items.len == 2);
                    if (list.items[0].value > list.items[1].value) {
                        packet.value = 1;
                    }
                },
                .less_than => {
                    assert(list.items.len == 2);
                    if (list.items[0].value < list.items[1].value) {
                        packet.value = 1;
                    }
                },
                .equal_to => {
                    assert(list.items.len == 2);
                    if (list.items[0].value == list.items[1].value) {
                        packet.value = 1;
                    }
                },
                .literal => unreachable,
            }
        }
        packet.end = i;
        return packet;
    }
};

pub fn main() !void {
    var gpa: std.heap.DebugAllocator(.{}) = .init;
    defer assert(gpa.deinit() == .ok);
    const allocator = gpa.allocator();

    var set = try bitset(allocator, std.mem.trimRight(u8, input, "\n"));
    defer set.deinit();
    const packet: Packet = try .parse(set, 0);

    print("Answer 1: {d}\n", .{packet.version});
    print("Answer 2: {d}\n", .{packet.value});
}

test "Examples 1.1" {
    const allocator = std.testing.allocator;
    var set = try bitset(allocator, "8A004A801A8002F478");
    defer set.deinit();
    const packet: Packet = try .parse(set, 0);
    try std.testing.expectEqual(16, packet.version);
}

test "Examples 1.2" {
    const allocator = std.testing.allocator;
    var set = try bitset(allocator, "620080001611562C8802118E34");
    defer set.deinit();
    const packet: Packet = try .parse(set, 0);
    try std.testing.expectEqual(12, packet.version);
}

test "Examples 1.3" {
    const allocator = std.testing.allocator;
    var set = try bitset(allocator, "C0015000016115A2E0802F182340");
    defer set.deinit();
    const packet: Packet = try .parse(set, 0);
    try std.testing.expectEqual(23, packet.version);
}

test "Examples 1.4" {
    const allocator = std.testing.allocator;
    var set = try bitset(allocator, "A0016C880162017C3686B18A3D4780");
    defer set.deinit();
    const packet: Packet = try .parse(set, 0);
    try std.testing.expectEqual(31, packet.version);
}

test "Examples 2.1" {
    const allocator = std.testing.allocator;
    var set = try bitset(allocator, "C200B40A82");
    defer set.deinit();
    const packet: Packet = try .parse(set, 0);
    try std.testing.expectEqual(3, packet.value);
}

test "Examples 2.2" {
    const allocator = std.testing.allocator;
    var set = try bitset(allocator, "04005AC33890");
    defer set.deinit();
    const packet: Packet = try .parse(set, 0);
    try std.testing.expectEqual(54, packet.value);
}

test "Examples 2.3" {
    const allocator = std.testing.allocator;
    var set = try bitset(allocator, "880086C3E88112");
    defer set.deinit();
    const packet: Packet = try .parse(set, 0);
    try std.testing.expectEqual(7, packet.value);
}

test "Examples 2.4" {
    const allocator = std.testing.allocator;
    var set = try bitset(allocator, "CE00C43D881120");
    defer set.deinit();
    const packet: Packet = try .parse(set, 0);
    try std.testing.expectEqual(9, packet.value);
}

test "Examples 2.5" {
    const allocator = std.testing.allocator;
    var set = try bitset(allocator, "D8005AC2A8F0");
    defer set.deinit();
    const packet: Packet = try .parse(set, 0);
    try std.testing.expectEqual(1, packet.value);
}

test "Examples 2.6" {
    const allocator = std.testing.allocator;
    var set = try bitset(allocator, "F600BC2D8F");
    defer set.deinit();
    const packet: Packet = try .parse(set, 0);
    try std.testing.expectEqual(0, packet.value);
}

test "Examples 2.7" {
    const allocator = std.testing.allocator;
    var set = try bitset(allocator, "9C005AC2F8F0");
    defer set.deinit();
    const packet: Packet = try .parse(set, 0);
    try std.testing.expectEqual(0, packet.value);
}

test "Examples 2.8" {
    const allocator = std.testing.allocator;
    var set = try bitset(allocator, "9C0141080250320F1802104A08");
    defer set.deinit();
    const packet: Packet = try .parse(set, 0);
    try std.testing.expectEqual(1, packet.value);
}
