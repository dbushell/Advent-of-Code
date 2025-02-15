const std = @import("std");
const assert = std.debug.assert;
const print = std.debug.print;

const Allocator = std.mem.Allocator;
const DoublyLinkedList = std.DoublyLinkedList;
const AutoHashMap = std.AutoHashMap;

const input = @embedFile("input.txt");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer assert(gpa.deinit() == .ok);
    const allocator = gpa.allocator();

    var arena = std.heap.ArenaAllocator.init(allocator);
    defer arena.deinit();
    const arena_allocator = arena.allocator();

    // First implementation
    var game = Game.init(input[0 .. input.len - 1]);
    for (0..100) |_| try game.move();
    print("Answer 1: {s}\n", .{game.order()});

    // Second implementation
    const L = DoublyLinkedList(usize);
    var list: L = .{};
    var map = AutoHashMap(usize, *L.Node).init(allocator);
    try map.ensureUnusedCapacity(1_000_000);
    defer map.deinit();

    // Inline for allows stack allocation
    inline for (0..input.len - 1) |i| {
        const key: usize = @intCast(input[i] - 48);
        var node = L.Node{ .data = key };
        list.append(&node);
        try map.putNoClobber(key, &node);
    }

    for (10..1_000_001) |i| {
        var node = try arena_allocator.create(L.Node);
        node.data = i;
        list.append(node);
        try map.putNoClobber(i, node);
    }

    // Connected head to tail
    list.last.?.next = list.first.?;
    list.first.?.prev = list.last.?;

    var current = list.first.?;
    for (0..10_000_000) |_| {
        const c1 = current.next.?;
        list.remove(c1);
        const c2 = current.next.?;
        list.remove(c2);
        const c3 = current.next.?;
        list.remove(c3);
        var d = current.data - 1;
        while (d < 1 or d == c1.data or d == c2.data or d == c3.data) {
            d = if (d <= 1) 1_000_000 else d - 1;
        }
        const destination = map.get(d).?;
        list.insertAfter(destination, c3);
        list.insertAfter(destination, c2);
        list.insertAfter(destination, c1);
        current = current.next.?;
    }

    while (current.data != 1) current = current.next.?;
    current = current.next.?;

    print("Answer 2: {d}\n", .{current.data * current.next.?.data});
}

const Cup = struct {
    value: usize,
    previous: *Cup,
    next: *Cup,
};

const Game = struct {
    cups: [9]u8,
    index: usize = 0,
    moves: usize = 0,

    fn init(label: []const u8) Game {
        assert(label.len == 9);
        // Convert ASCII to integers
        var cups = [_]u8{0} ** 9;
        for (0..9) |i| cups[i] = label[i] - 48;
        const game = Game{
            .cups = cups,
        };
        return game;
    }

    fn move(self: *Game) !void {
        self.moves += 1;
        defer self.index = @mod(self.index + 1, 9);

        // Current cup value
        const vc = self.cups[self.index];

        // Pickup cup values
        const v1 = self.cups[@mod(self.index + 1, 9)];
        const v2 = self.cups[@mod(self.index + 2, 9)];
        const v3 = self.cups[@mod(self.index + 3, 9)];

        // Destination cup value
        var vd = vc - 1;
        while (vd < 1 or vd == v1 or vd == v2 or vd == v3) {
            vd = if (vd <= 1) 9 else vd - 1;
        }

        // Remove pickup and replace at destination
        const state = self.cups;
        var offset: usize = 0;
        for (0..9 - 3) |i| {
            const state_offset = @mod(i + self.index + 4, 9);
            const cups_offset = @mod(i + offset + 1, 9);
            self.cups[cups_offset] = state[state_offset];
            if (self.cups[i + 1] == vd) {
                self.cups[i + 2] = v1;
                self.cups[i + 3] = v2;
                self.cups[i + 4] = v3;
                offset = 3;
            }
        }

        // Cycle until current cup is at the original position
        if (self.cups[self.index] != vc) {
            var vec: @Vector(9, u8) = self.cups;
            while (vec[self.index] != vc) {
                const mask = @Vector(9, i32){ 1, 2, 3, 4, 5, 6, 7, 8, 0 };
                vec = @shuffle(u8, vec, undefined, mask);
            }
            self.cups = vec;
        }
    }

    /// Order cups and return as ASCII string without leading "1"
    fn order(self: *Game) [8]u8 {
        var vec: @Vector(9, u8) = self.cups;
        while (vec[0] != 1) {
            const mask = @Vector(9, i32){ 1, 2, 3, 4, 5, 6, 7, 8, 0 };
            vec = @shuffle(u8, vec, undefined, mask);
        }
        self.cups = vec;
        var str: [8]u8 = undefined;
        @memcpy(&str, self.cups[1..9]);
        for (0..8) |i| str[i] += 48;
        return str;
    }
};

test "Example 1.1" {
    var game = Game.init("389125467");
    for (0..10) |_| try game.move();
    try std.testing.expectEqualSlices(
        u8,
        &[_]u8{ 5, 8, 3, 7, 4, 1, 9, 2, 6 },
        &game.cups,
    );
}

test "Example 1.2" {
    var game = Game.init("389125467");
    for (0..100) |_| try game.move();
    try std.testing.expectEqualSlices(
        u8,
        "67384529",
        &game.order(),
    );
}
