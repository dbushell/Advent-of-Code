const std = @import("std");
const builtin = @import("builtin");

const assert = std.debug.assert;
const print = std.debug.print;

const Allocator = std.mem.Allocator;
const Point = @import("./src/point.zig").Point;
const Grid = @import("./src/grid.zig").Grid;

const Blocked = std.AutoHashMap(u64, bool);
const UnitList = std.ArrayList(Unit);

const input = @embedFile("input.txt");

const Species = enum(u8) {
    goblin = 'G',
    elf = 'E',

    fn match(value: u8) ?Species {
        inline for (@typeInfo(Species).Enum.fields) |field|
            if (value == field.value) return @enumFromInt(field.value);
        return null;
    }
};

const Unit = struct {
    const Self = @This();
    allocator: Allocator,
    species: Species,
    point: Point,
    id: u16,
    ap: u16 = 3,
    hp: u16 = 200,

    /// std.mem.sort `lessThanFn`
    fn sort(_: void, a: Unit, b: Unit) bool {
        return a.point.compare(b.point) == -1;
    }

    /// Return true if any enemy is alive
    fn has_target(self: Self, units: UnitList) bool {
        for (units.items) |unit| {
            if (unit.hp == 0) continue;
            if (unit.id == self.id) continue;
            if (unit.species == self.species) continue;
            return true;
        }
        return false;
    }

    /// Return adjacent target to attack
    fn attack_target(self: *Self, units: UnitList) ?*Unit {
        var maybe: ?*Unit = null;
        // Look for adjacent enemies
        for (self.point.atAdjacent()) |adjacent| for (units.items) |*unit| {
            if (!unit.point.same(adjacent)) continue;
            // Only target enemies
            if (unit.hp == 0 or unit.species == self.species) break;
            // Prefer lowest HP before top-left order
            if (maybe) |current| {
                if (unit.hp < current.hp) maybe = unit;
            } else maybe = unit;
            break;
        };
        return maybe;
    }

    /// Return closest square to move towards
    fn move_target(self: *Self, units: UnitList, grid: Grid(u8), blocked: Blocked) ?Point {
        var end: ?Point = null;
        var p0: ?[]Point = null;
        defer if (p0) |p| self.allocator.free(p);
        for (units.items) |*unit| {
            if (unit.id == self.id) continue;
            if (unit.hp == 0 or unit.species == self.species) continue;
            for (unit.point.atAdjacent()) |adjacent| {
                if (blocked.contains(adjacent.key())) continue;
                const maybe_path: ?[]Point = grid.findPath(self.point, adjacent, blocked) catch null;
                defer if (maybe_path) |p| self.allocator.free(p);
                if (maybe_path == null) continue;
                const p2 = maybe_path.?;
                if (p0) |p1| {
                    if (p2.len < p1.len) {
                        end = adjacent;
                        p0 = p2;
                    } else if (p2.len == p1.len and adjacent.compare(end.?) == -1) {
                        end = adjacent;
                        p0 = p2;
                    }
                } else {
                    end = adjacent;
                    p0 = p2;
                }
            }
        }
        if (end == null) return null;

        for (self.point.atAdjacent()) |start| {
            if (blocked.contains(start.key())) continue;
            const maybe_path: ?[]Point = grid.findPath(start, end.?, blocked) catch null;
            if (maybe_path) |p3| {
                if (p0 == null or p3.len < p0.?.len) {
                    p0 = p3;
                    continue;
                }
                if (p3.len == p0.?.len) {
                    if (p3[0].compare(p0.?[0]) == -1) {
                        p0 = p3;
                    }
                }
            }
        }
        return p0.?[0];
    }
};

fn reset(grid: *Grid(u8), blocked: *Blocked, units: *UnitList) !void {
    blocked.clearRetainingCapacity();
    units.clearRetainingCapacity();
    var ly: i32 = 0;
    var unit_id: u16 = 0;
    var lines = std.mem.tokenizeScalar(u8, input, '\n');
    while (lines.next()) |line| : (ly += 1) {
        if (line.len != grid.width) break;
        for (0..line.len) |x| {
            var char = line[x];
            const point = Point.init(@intCast(x), @intCast(ly));
            if (Species.match(char)) |species| {
                try units.append(.{ .allocator = grid.allocator, .species = species, .point = point, .id = unit_id });
                unit_id += 1;
                char = '.';
                try blocked.put(point.key(), true);
            } else if (char == '#') {
                try blocked.put(point.key(), true);
            }
            try grid.set(point, char);
        }
    }
}

pub fn main() !void {
    const allocator = allocate: {
        if (builtin.mode == .Debug) {
            print("{any} GeneralPurposeAllocator\n", .{builtin.mode});
            var gpa = std.heap.GeneralPurposeAllocator(.{}){};
            break :allocate gpa.allocator();
        }
        print("{any} std.heap.c_allocator\n", .{builtin.mode});
        break :allocate std.heap.c_allocator;
    };

    const width = std.mem.indexOf(u8, input, "\n") orelse 0;
    const height = std.mem.count(u8, input, "\n");

    var grid = try Grid(u8).init(allocator, width, height, null);
    defer grid.deinit();

    var blocked = Blocked.init(allocator);
    defer blocked.deinit();

    var units = try UnitList.initCapacity(allocator, 30);
    defer units.deinit();

    game_loop: for (0..10_000) |battle| {
        try reset(&grid, &blocked, &units);

        for (units.items) |*unit| {
            if (unit.species == .elf) unit.ap += @intCast(battle);
        }

        var elves_alive = true;

        var graveyard = try UnitList.initCapacity(allocator, 30);
        defer graveyard.deinit();

        round_loop: for (0..1000) |round| {
            std.mem.sort(Unit, units.items, {}, Unit.sort);

            var full_round: u8 = 1;

            for (units.items) |*unit| {
                // Skip units that died this round
                if (unit.hp == 0) continue;
                // End of fight
                if (unit.has_target(units) == false) {
                    full_round = 0;
                    break;
                }
                // Can attack immediately?
                var maybe_attack = unit.attack_target(units);
                if (maybe_attack == null) {
                    // Move first and then try attack again
                    if (unit.move_target(units, grid, blocked)) |move| {
                        _ = blocked.remove(unit.point.key());
                        unit.point = move;
                        try blocked.put(unit.point.key(), true);
                        maybe_attack = unit.attack_target(units);
                    }
                }
                if (maybe_attack) |target| {
                    target.hp = if (target.hp <= unit.ap) 0 else target.hp - unit.ap;
                    if (target.hp == 0) {
                        if (target.species == .elf) {
                            if (battle > 0) break :round_loop;
                            elves_alive = false;
                        }
                        try graveyard.append(target.*);
                        _ = blocked.remove(target.point.key());
                    }
                }
            }

            // Cleanup dead units
            for (graveyard.items) |dead| {
                for (units.items, 0..) |unit, i| if (unit.id == dead.id) {
                    _ = units.swapRemove(i);
                    break;
                };
            }

            // print("\x1b[2J\x1b[H", .{});
            // print("Battle: {d}, round {d}:\n\n", .{ battle + 1, round + 1 });
            // for (0..grid.height) |y| {
            //     for (0..grid.width) |x| {
            //         const p = Point.init(@intCast(x), @intCast(y));
            //         const unit: ?Unit = find: {
            //             for (units.items) |u| if (u.hp > 0 and u.point.same(p)) break :find u;
            //             break :find null;
            //         };
            //         if (unit == null) {
            //             print("{c}", .{try grid.get(p)});
            //         } else {
            //             print("{c}", .{@intFromEnum(unit.?.species)});
            //         }
            //     }
            //     print("\n", .{});
            // }
            // print("\n", .{});

            var elf_health: u32 = 0;
            var goblin_health: u32 = 0;

            for (units.items) |*unit| {
                switch (unit.species) {
                    .elf => elf_health += unit.hp,
                    .goblin => goblin_health += unit.hp,
                }
            }
            // End of battle?
            if (elf_health == 0 or goblin_health == 0) {
                const score: u32 = (elf_health + goblin_health) * (@as(u32, @intCast(round)) + full_round);
                if (battle == 0) {
                    print("Answer 1: {d}\n", .{score});
                    break :round_loop;
                }
                print("Answer 2: {d}\n", .{score});
                break :game_loop;
            }
        }
    }
}
