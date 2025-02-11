const std = @import("std");
const assert = std.debug.assert;
const print = std.debug.print;

const IntegerBitSet = std.bit_set.IntegerBitSet;

const Grid = @import("./src/grid.zig").Grid;

const Tile = @This();

id: usize,
grid: Grid(u8),

// Top, right, bottom, left
sides: [4]u10,

pub fn init(id: usize, grid: Grid(u8), sets: [4]IntegerBitSet(10)) Tile {
    return .{
        .id = id,
        .grid = grid,
        .sides = [_]u10{
            sets[0].mask,
            sets[1].mask,
            sets[2].mask,
            sets[3].mask,
        },
    };
}

/// Flip horizontal axis
pub fn flip(self: *Tile) void {
    self.grid.flip();
    const tmp = self.sides;
    self.sides[0] = @bitReverse(tmp[0]);
    self.sides[1] = tmp[3];
    self.sides[2] = @bitReverse(tmp[2]);
    self.sides[3] = tmp[1];
}

/// Rotate 90deg clockwise
pub fn rotate(self: *Tile) !void {
    try self.grid.rotate();
    const tmp = self.sides;
    self.sides[0] = @bitReverse(tmp[3]);
    self.sides[1] = tmp[0];
    self.sides[2] = @bitReverse(tmp[1]);
    self.sides[3] = tmp[2];
}

pub fn contains(self: Tile, mask: u10) bool {
    for (0..4) |i| {
        if (self.sides[i] == mask) return true;
        if (@bitReverse(self.sides[i]) == mask) return true;
    }
    return false;
}

pub fn overlaps(a: Tile, b: Tile) bool {
    for (0..4) |i| {
        if (b.contains(a.sides[i])) return true;
    }
    return false;
}
