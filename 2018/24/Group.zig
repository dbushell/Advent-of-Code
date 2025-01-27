const std = @import("std");
const print = std.debug.print;
const EnumSet = std.EnumSet;
const Order = std.math.Order;

const Element = @import("./main.zig").Element;

const Group = @This();

id: u64 = 0,
units: i32 = 0,
health: i32 = 0,
damage: i32 = 0,
initiative: i32 = 0,
element: Element,
immunities: EnumSet(Element),
weaknesses: EnumSet(Element),

pub fn init() !Group {
    return Group{
        .element = Element.none,
        .immunities = EnumSet(Element).initEmpty(),
        .weaknesses = EnumSet(Element).initEmpty(),
    };
}

pub fn effectivePower(self: Group) i32 {
    return self.units * self.damage;
}

pub fn isImmune(self: Group, element: Element) bool {
    return self.immunities.contains(element);
}

pub fn isWeak(self: Group, element: Element) bool {
    return self.weaknesses.contains(element);
}

/// Damage by A to B based on weakness and immunity
pub fn damageTo(a: Group, b: Group) i32 {
    var damage = a.effectivePower();
    if (b.isImmune(a.element)) damage = 0;
    if (b.isWeak(a.element)) damage *= 2;
    return damage;
}

/// Compare for `std.mem.sort` target order
pub fn compareSelection(_: void, a: Group, b: Group) bool {
    if (a.effectivePower() < b.effectivePower()) return false;
    if (a.effectivePower() > b.effectivePower()) return true;
    return a.initiative > b.initiative;
}

/// Compare for `PriorityQueue` attack order
pub fn compareAttack(_: void, a: *Group, b: *Group) Order {
    return if (a.initiative > b.initiative) Order.lt else Order.gt;
}
