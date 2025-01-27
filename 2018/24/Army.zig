const std = @import("std");
const Allocator = std.mem.Allocator;
const ArrayList = std.ArrayList;
const AutoHashMap = std.AutoHashMap;
const PriorityQueue = std.PriorityQueue;

const Element = @import("./main.zig").Element;
const Group = @import("./Group.zig");

const Army = @This();

groups: ArrayList(Group) = undefined,
allocator: Allocator,

pub fn init(allocator: Allocator) !Army {
    return Army{
        .allocator = allocator,
        .groups = ArrayList(Group).init(allocator),
    };
}

pub fn deinit(self: Army) void {
    self.groups.deinit();
}

pub fn clone(self: Army) !Army {
    return Army{
        .groups = try self.groups.clone(),
        .allocator = self.allocator,
    };
}

pub fn count(self: Army) i32 {
    var total: i32 = 0;
    for (self.groups.items) |group| total += group.units;
    return total;
}

pub fn getUnit(self: Army, id: u64) ?*Group {
    for (self.groups.items) |*group| if (group.id == id) return group;
    return null;
}

pub fn makeSelection(self: Army, opponent: Army, map: *AutoHashMap(u64, u64)) !void {
    std.mem.sort(Group, self.groups.items, {}, Group.compareSelection);
    var used = AutoHashMap(u64, void).init(self.allocator);
    defer used.deinit();
    for (self.groups.items) |*ally| {
        var target: ?*Group = null;
        defer if (target) |enemy| {
            map.put(ally.id, enemy.id) catch unreachable;
            used.put(enemy.id, {}) catch unreachable;
        };
        for (opponent.groups.items) |*enemy| {
            if (enemy.units == 0) continue;
            if (used.contains(enemy.id)) continue;
            const damage = ally.damageTo(enemy.*);
            if (damage == 0) continue;
            // Starting selection
            if (target == null) {
                target = enemy;
                continue;
            }
            // Prefer higest damage
            const best_damage = ally.damageTo(target.?.*);
            if (damage < best_damage) continue;
            if (damage > best_damage) {
                target = enemy;
                continue;
            }
            // Tie breakers
            if (enemy.effectivePower() > target.?.effectivePower()) {
                target = enemy;
            } else if (enemy.effectivePower() == target.?.effectivePower()) {
                if (enemy.initiative > target.?.initiative) {
                    target = enemy;
                }
            }
        }
    }
}
