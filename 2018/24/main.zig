const std = @import("std");
const assert = std.debug.assert;
const print = std.debug.print;
const Allocator = std.mem.Allocator;
const ArrayList = std.ArrayList;
const AutoHashMap = std.AutoHashMap;
const EnumSet = std.EnumSet;
const PriorityQueue = std.PriorityQueue;

const Army = @import("./Army.zig");
const Group = @import("./Group.zig");

const input = @embedFile("input.txt");

pub const Element = enum {
    bludgeoning,
    cold,
    fire,
    none,
    radiation,
    slashing,

    fn match(name: []const u8) ?Element {
        inline for (@typeInfo(Element).Enum.fields) |field|
            if (std.mem.eql(u8, name, field.name)) return @enumFromInt(field.value);
        return null;
    }
};

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    const allocator = gpa.allocator();
    defer _ = gpa.detectLeaks();

    // Setup and parse the two armies
    var immune1 = try Army.init(allocator);
    defer immune1.deinit();

    var infection1 = try Army.init(allocator);
    defer infection1.deinit();

    try parseInput(&immune1, &infection1);

    var answer_one: i32 = 0;
    var answer_two: i32 = 0;

    var locked = AutoHashMap(u64, u64).init(allocator);
    defer locked.deinit();

    // Keep fighting until immune system wins
    for (0..1000) |i| {

        // Clone armies and boost immune system
        var a1 = try immune1.clone();
        defer a1.deinit();
        for (a1.groups.items) |*g| g.damage += @intCast(i);
        var a2 = try infection1.clone();
        defer a2.deinit();

        // Remember previous round for stalemate scenario
        var a1c = a1.count();
        var a2c = a2.count();

        var victor: ?*Army = null;
        var round: i32 = 0;
        while (true) : (round += 1) {
            // Check for stalemate deadlock
            if (round > 0) {
                if (a1.count() == a1c and a2.count() == a2c) break;
                a1c = a1.count();
                a2c = a2.count();
            }
            // Battle is over?
            if (a1c == 0) victor = &a2;
            if (a2c == 0) victor = &a1;
            if (victor != null) break;

            // Target selection phase
            locked.clearRetainingCapacity();
            try a1.makeSelection(a2, &locked);
            try a2.makeSelection(a1, &locked);

            // Setup attack order
            var queue = PriorityQueue(*Group, void, Group.compareAttack).init(allocator, {});
            defer queue.deinit();
            for (a1.groups.items) |*g| try queue.add(g);
            for (a2.groups.items) |*g| try queue.add(g);

            // Atack in order
            while (queue.count() > 0) {
                const attacker = queue.remove();
                if (attacker.units == 0) continue;
                const id = locked.get(attacker.id) orelse continue;
                const target = (a1.getUnit(id) orelse a2.getUnit(id)).?;
                var damage = attacker.damageTo(target.*);
                damage -= @mod(damage, target.health);
                if (damage == 0) continue;
                var lost: i32 = @divFloor(damage, target.health);
                if (lost > target.units) lost = target.units;
                target.units -= lost;
            }
        }
        if (victor) |army| {
            if (i == 0) answer_one = army.count();
            if (@intFromPtr(army) == @intFromPtr(&a1)) {
                answer_two = army.count();
                break;
            }
        }
    }
    print("Answer 1: {d}\n", .{answer_one});
    print("Answer 2: {d}\n", .{answer_two});
}

const parseInt = std.fmt.parseInt;
const splitScalar = std.mem.splitScalar;
const splitSequence = std.mem.splitSequence;
const startsWith = std.mem.startsWith;

fn parseInput(immune: *Army, infection: *Army) !void {
    var lines = splitScalar(u8, input, '\n');
    var army: *Army = immune;
    while (lines.next()) |line| {
        if (line.len == 0) continue;
        if (startsWith(u8, line, "Immune System:")) {
            army = immune;
            continue;
        }
        if (startsWith(u8, line, "Infection:")) {
            army = infection;
            continue;
        }
        var group = try Group.init();
        defer army.groups.append(group) catch unreachable;
        // Unique ID
        group.id = std.hash.XxHash3.hash(0, line);
        // Unit count
        var p1 = splitSequence(u8, line, " units each with ");
        group.units = try parseInt(i32, p1.next().?, 10);
        // Hit points
        var p2 = splitSequence(u8, p1.next().?, " hit points ");
        group.health = try parseInt(i32, p2.next().?, 10);
        // Elements (if any)
        var p3 = splitSequence(u8, p2.next().?, "with an attack that does ");
        if (std.mem.containsAtLeast(u8, p3.peek().?, 1, "(")) {
            var p4 = std.mem.splitAny(u8, p3.next().?, "( ,;)");
            var elements: ?*EnumSet(Element) = null;
            while (p4.next()) |word| {
                if (word.len == 0) continue;
                if (std.mem.eql(u8, word, "weak")) {
                    elements = &group.weaknesses;
                    continue;
                }
                if (std.mem.eql(u8, word, "immune")) {
                    elements = &group.immunities;
                    continue;
                }
                if (elements == null) continue;
                if (Element.match(word)) |e| elements.?.insert(e);
            }
        } else {
            _ = p3.next();
        }
        // Attack
        var p5 = splitScalar(u8, p3.next().?, ' ');
        group.damage = try parseInt(i32, p5.next().?, 10);
        group.element = Element.match(p5.next().?).?;
        // Initiative
        var last: []const u8 = undefined;
        while (p5.peek() != null) last = p5.next().?;
        group.initiative = try parseInt(i32, last, 10);
    }
}
