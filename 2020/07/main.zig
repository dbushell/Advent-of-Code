const std = @import("std");
const assert = std.debug.assert;
const print = std.debug.print;
const ArrayList = std.ArrayList;
const StringHashMap = std.StringHashMap;
const Allocator = std.mem.Allocator;
const ArenaAllocator = std.heap.ArenaAllocator;

const input = @embedFile("input.txt");

const Bag = struct {
    name: []const u8,
    contains: StringHashMap(u8),

    fn count(self: Bag) u32 {
        return self.contains.count();
    }

    /// Count the total number of inner bags
    fn depth(self: Bag, bags: StringHashMap(Bag)) u32 {
        if (self.count() == 0) return 0;
        var total: u32 = 0;
        var nested = self.contains.iterator();
        while (nested.next()) |entry| {
            if (bags.get(entry.key_ptr.*)) |bag| {
                total += (1 + bag.depth(bags)) * entry.value_ptr.*;
            } else unreachable;
        }
        return total;
    }

    /// Returns true if bag can contain `needle` bag inside
    fn holds(self: Bag, needle: []const u8, bags: StringHashMap(Bag)) bool {
        var haystack = self.contains.keyIterator();
        while (haystack.next()) |name| {
            if (std.mem.eql(u8, needle, name.*)) return true;
            if (bags.get(name.*)) |bag| {
                if (bag.holds(needle, bags)) return true;
            } else unreachable;
        }
        return false;
    }
};

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer assert(gpa.deinit() == .ok);
    const allocator = gpa.allocator();

    // Use for input parser
    var arena = ArenaAllocator.init(allocator);
    defer arena.deinit();

    var bags = StringHashMap(Bag).init(allocator);
    defer bags.deinit();

    try parseInput(&bags, arena.allocator());

    var count: usize = 0;
    var iter = bags.valueIterator();
    while (iter.next()) |bag| {
        if (bag.holds("shiny gold", bags)) count += 1;
    }
    print("Answer 1: {d}\n", .{count});

    if (bags.get("shiny gold")) |bag| {
        print("Answer 2: {d}\n", .{bag.depth(bags)});
    }
}

const parseInt = std.fmt.parseInt;
const splitScalar = std.mem.splitScalar;
const startsWith = std.mem.startsWith;

fn parseInput(bags: *StringHashMap(Bag), allocator: Allocator) !void {
    var lines = splitScalar(u8, input, '\n');
    while (lines.next()) |line| {
        if (line.len == 0) continue;
        var bag: ?Bag = null;
        var number: u8 = 0;
        // Collect color words in list
        var color_name = true;
        var color_list = ArrayList([]const u8).init(allocator);
        defer color_list.deinit();
        var words = splitScalar(u8, line, ' ');
        while (words.next()) |word| {
            if (color_list.items.len > 0 and std.mem.startsWith(u8, word, "bag")) {
                const parts = try color_list.toOwnedSlice();
                defer allocator.free(parts);
                const color = try std.mem.join(allocator, " ", parts);
                // const color = try std.mem.concat(allocator, u8, parts);
                color_name = false;
                if (number == 0) {
                    bag = Bag{
                        .name = color,
                        .contains = StringHashMap(u8).init(allocator),
                    };
                } else if (bag) |*b| {
                    try b.contains.putNoClobber(color, number);
                }
            }
            if (word[word.len - 1] == '.') {
                if (bag) |b| try bags.putNoClobber(b.name, b);
                number = 0;
                break;
            }
            if (color_name) {
                try color_list.append(word);
                continue;
            }
            number = parseInt(u8, word, 10) catch 0;
            if (number > 0) color_name = true;
        }
    }
}
