const std = @import("std");
const assert = std.debug.assert;
const print = std.debug.print;

const ArrayList = std.ArrayList;
const AutoHashMap = std.AutoHashMap;
const AutoArrayHashMap = std.AutoArrayHashMap;
const IntegerBitSet = std.bit_set.IntegerBitSet;

const Point = @import("./src/point.zig").Point;
const Grid = @import("./src/grid.zig").Grid;
const Tile = @import("./Tile.zig");
const TileMap = AutoHashMap(usize, Tile);

const input = @embedFile("input.txt");

const monster_points = 15;
const monster = [_][]const u8{
    "                  # ",
    "#    ##    ##    ###",
    " #  #  #  #  #  #   ",
};

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer assert(gpa.deinit() == .ok);
    const allocator = gpa.allocator();

    var tiles = TileMap.init(allocator);

    // Group tiles to match later
    var pool_middle = ArrayList(*Tile).init(allocator);
    var pool_corner = ArrayList(*Tile).init(allocator);
    var pool_side = ArrayList(*Tile).init(allocator);

    defer {
        var iter = tiles.valueIterator();
        while (iter.next()) |tile| tile.grid.deinit();
        pool_middle.deinit();
        pool_corner.deinit();
        pool_side.deinit();
        tiles.deinit();
    }

    try parseInput(&tiles);

    // Count duplicate sides
    var seen = AutoHashMap(u10, usize).init(allocator);
    defer seen.deinit();
    var seen_iter = tiles.iterator();
    while (seen_iter.next()) |entry| {
        const sides = entry.value_ptr.*.sides;
        for (0..4) |i| {
            const flip = @bitReverse(sides[i]);
            try seen.put(sides[i], if (seen.get(sides[i])) |c| (c + 1) else 1);
            try seen.put(flip, if (seen.get(flip)) |c| (c + 1) else 1);
        }
    }

    var answer_one: usize = 1;
    var tile_iter = tiles.valueIterator();
    while (tile_iter.next()) |tile| {
        const sides = tile.sides;
        var unique: usize = 0;
        for (0..4) |i| {
            if (seen.get(sides[i]).? == 1) unique += 1;
            if (seen.get(@bitReverse(sides[i])).? == 1) unique += 1;
        }
        switch (unique) {
            4 => {
                answer_one *= tile.id;
                try pool_corner.append(tile);
            },
            2 => try pool_side.append(tile),
            0 => try pool_middle.append(tile),
            else => unreachable,
        }
    }
    print("Answer 1: {d}\n", .{answer_one});

    // Dimensions of image (number of tiles)
    const size: usize = @intFromFloat(@sqrt(@as(f64, @floatFromInt(tiles.count()))));

    assert(pool_corner.items.len == 4);
    assert(pool_side.items.len == (size - 2) * 4);
    assert(pool_middle.items.len == tiles.count() - pool_side.items.len - 4);

    var image = try Grid(u8).init(allocator, size * 8, size * 8, '.');
    var ids = try Grid(usize).init(allocator, size, size, 0);
    var ids_map = AutoHashMap(usize, void).init(allocator);
    defer image.deinit();
    defer ids.deinit();
    defer ids_map.deinit();

    // Add top-left corner piece to begin
    for (pool_corner.items) |tile| {
        if (seen.get(tile.sides[0]).? == 1) {
            if (seen.get(tile.sides[3]).? == 1) {
                try ids.set(Point.init(0, 0), tile.id);
                try ids_map.put(tile.id, {});
                break;
            }
        }
    }
    // Place rest of tiles
    for (0..size) |y| {
        for (0..size) |x| {
            if (y == 0 and x == 0) continue;
            const p = Point.init(@intCast(x), @intCast(y));

            // Narrow tile options
            var pool: *ArrayList(*Tile) = &pool_corner;
            const ymid = y > 0 and y < size - 1;
            const xmid = x > 0 and x < size - 1;
            if (ymid or xmid) pool = &pool_side;
            if (ymid and xmid) pool = &pool_middle;

            // Get at least one previously placed adjacent tiles
            const up: ?Tile = tiles.get((ids.get(p.atUp()) catch 0));
            const left: ?Tile = tiles.get((ids.get(p.atLeft()) catch 0));
            assert(!(up == null and left == null));

            // First placement has two options depending rotation
            const tile_id = match_id: {
                match_tile: for (pool.items) |a| {
                    if (ids_map.contains(a.id)) continue;
                    if (up) |b| if (!a.overlaps(b)) continue :match_tile;
                    if (left) |b| if (!a.overlaps(b)) continue :match_tile;
                    break :match_id a.id;
                }
                unreachable;
            };
            try ids.set(p, tile_id);
            try ids_map.put(tile_id, {});
        }
    }

    // Re-orientate first tile at top-left
    var first = tiles.get(try ids.at(0, 0)).?;
    first.flip();
    while (true) {
        const sides = first.sides;
        if (seen.get(sides[0]) == 1 and seen.get(sides[3]) == 1) break;
        try first.rotate();
    }
    try tiles.put(first.id, first);

    // Count water tiles for final answer
    var water: usize = 0;
    // Place all tiles
    for (0..size) |y| {
        for (0..size) |x| {
            const p = Point.init(@intCast(x), @intCast(y));
            const id = try ids.get(p);
            var tile = tiles.get(id).?;
            const up: ?Tile = tiles.get((ids.get(p.atUp()) catch 0));
            const left: ?Tile = tiles.get((ids.get(p.atLeft()) catch 0));
            // Rotate and flip tile until it fits
            for (0..8) |variation| {
                var correct = true;
                if (up) |b| {
                    if (tile.sides[0] != b.sides[2]) correct = false;
                }
                if (left) |b| {
                    if (tile.sides[3] != b.sides[1]) correct = false;
                }
                if (!correct) {
                    if (variation == 3) tile.flip() else try tile.rotate();
                    continue;
                }
                // Replace tile with new orientation
                try tiles.put(tile.id, tile);
                // Draw tile on final image
                for (0..tile.grid.height) |gy| {
                    for (0..tile.grid.width) |gx| {
                        const ip = Point{
                            .x = @intCast((x * tile.grid.width) + gx),
                            .y = @intCast((y * tile.grid.height) + gy),
                        };
                        const char = try tile.grid.at(gx, gy);
                        if (char == '#') water += 1;
                        try image.set(ip, char);
                    }
                }
                break;
            }
        }
    }

    // Search for sea monsters
    var found: usize = 0;
    for (0..8) |variation| {
        for (0..image.height - monster.len) |y| {
            inner: for (0..image.width - monster[0].len) |x| {
                var points: usize = 0;
                for (0..monster.len) |my| {
                    for (0..monster[0].len) |mx| {
                        if (monster[my][mx] == ' ') continue;
                        if (try image.at(x + mx, y + my) != '#') {
                            continue :inner;
                        }
                        points += 1;
                    }
                }
                if (points != monster_points) continue;
                found += 1;
            }
        }
        if (found > 0) break;
        if (variation == 3) image.flip() else try image.rotate();
    }
    water -= found * monster_points;

    print("Answer 2: {d}\n", .{water});
}

const parseInt = std.fmt.parseInt;
const splitScalar = std.mem.splitScalar;
const startsWith = std.mem.startsWith;

fn parseInput(map: *TileMap) !void {
    var lines = splitScalar(u8, input, '\n');
    var grid: ?Grid(u8) = null;
    var sets: ?[4]IntegerBitSet(10) = null;
    var id: usize = 0;
    var y: usize = 0;
    while (lines.next()) |line| {
        if (line.len == 0) continue;
        if (startsWith(u8, line, "Tile ")) {
            if (grid) |g| if (sets) |s| try map.put(id, Tile.init(id, g, s));
            grid = try Grid(u8).init(map.allocator, 8, 8, '.');
            sets = .{IntegerBitSet(10).initEmpty()} ** 4;
            id = try parseInt(usize, line[5 .. line.len - 1], 10);
            y = 0;
            continue;
        }
        if (grid) |*g| if (sets) |*s| {
            for (line, 0..) |c, x| {
                // Crop four sides from 10x10 grid
                if (x > 0 and x < 9 and y > 0 and y < 9) {
                    try g.set(Point.init(@intCast(x - 1), @intCast(y - 1)), c);
                }
                if (y == 0 and c == '#') s[0].set(9 - x);
                if (x == 9 and c == '#') s[1].set(9 - y);
                if (y == 9 and c == '#') s[2].set(9 - x);
                if (x == 0 and c == '#') s[3].set(9 - y);
            }
            y += 1;
        };
    }
    if (grid) |g| if (sets) |s| try map.put(id, Tile.init(id, g, s));
}
