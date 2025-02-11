const std = @import("std");
const assert = std.debug.assert;
const print = std.debug.print;

const Allocator = std.mem.Allocator;
const ArrayList = std.ArrayList;
const StringArrayHashMap = std.StringArrayHashMap;

const input = @embedFile("input.txt");

const Food = struct {
    allocator: Allocator,
    buffer: []const u8,
    ingredients: StringArrayHashMap(void),
    allergens: StringArrayHashMap(void),

    fn init(allocator: Allocator, buffer: []const u8) !Food {
        return .{
            .allocator = allocator,
            .buffer = try allocator.dupe(u8, buffer),
            .ingredients = StringArrayHashMap(void).init(allocator),
            .allergens = StringArrayHashMap(void).init(allocator),
        };
    }

    fn deinit(self: *Food) void {
        self.allocator.free(self.buffer);
        self.ingredients.deinit();
        self.allergens.deinit();
    }
};

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer assert(gpa.deinit() == .ok);
    const allocator = gpa.allocator();

    var foods = ArrayList(Food).init(allocator);
    defer {
        for (foods.items) |*f| f.deinit();
        foods.deinit();
    }
    try parseInput(&foods);

    // Map of unique items
    var allergens = StringArrayHashMap(void).init(allocator);
    var ingredients = StringArrayHashMap(void).init(allocator);
    defer allergens.deinit();
    defer ingredients.deinit();

    // Count the number of times each ingredient appears
    var appearances = StringArrayHashMap(usize).init(allocator);
    defer appearances.deinit();

    for (foods.items) |food| {
        for (food.allergens.keys()) |key| try allergens.put(key, {});
        for (food.ingredients.keys()) |key| {
            try appearances.put(key, (appearances.get(key) orelse 0) + 1);
            try ingredients.put(key, {});
        }
    }

    // Map allergens to possible ingredients
    var possibilities = StringArrayHashMap(StringArrayHashMap(void)).init(allocator);
    defer {
        for (possibilities.values()) |*map| map.deinit();
        possibilities.deinit();
    }

    // Find matches
    for (allergens.keys()) |allergen| {
        var possible = StringArrayHashMap(void).init(allocator);
        for (foods.items) |food| {
            if (!food.allergens.contains(allergen)) continue;
            // Initial matches
            if (possible.count() == 0) {
                for (food.ingredients.keys()) |key| try possible.put(key, {});
                continue;
            }
            // Reduce matches
            var update = StringArrayHashMap(void).init(allocator);
            for (possible.keys()) |key| {
                if (food.ingredients.contains(key)) {
                    try update.put(key, {});
                }
            }
            possible.deinit();
            possible = update;
        }
        try possibilities.put(allergen, possible);
    }

    // Count appearances of non-allergen ingredients
    var count: usize = 0;
    outer: for (ingredients.keys()) |key| {
        for (possibilities.values()) |map| if (map.contains(key)) continue :outer;
        count += appearances.get(key).?;
    }
    print("Answer 1: {d}\n", .{count});

    // Reduce possible matches to single ingredient
    var map = StringArrayHashMap([]const u8).init(allocator);
    defer map.deinit();
    outer: while (map.count() < allergens.count()) {
        for (possibilities.keys()) |allergen| {
            if (map.contains(allergen)) continue;
            const possible = possibilities.get(allergen).?;
            if (possible.count() != 1) continue;
            const ingredient = possible.keys()[0];
            try map.put(allergen, ingredient);
            for (possibilities.values()) |*p| _ = p.swapRemove(ingredient);
            continue :outer;
        }
    }

    // Move to list for alphabetical sorting
    var list = ArrayList([2][]const u8).init(allocator);
    defer list.deinit();
    for (map.keys()) |k| try list.append(.{ k, map.get(k).? });
    std.mem.sort([2][]const u8, list.items, {}, struct {
        fn lessThanFn(_: void, lhs: [2][]const u8, rhs: [2][]const u8) bool {
            const order = std.ascii.orderIgnoreCase(lhs[0], rhs[0]);
            return switch (order) {
                .lt => true,
                .gt => false,
                .eq => unreachable,
            };
        }
    }.lessThanFn);

    print("Answer 2: ", .{});
    for (list.items, 0..) |item, i| {
        if (i > 0) print(",", .{});
        print("{s}", .{item[1]});
    }
    print("\n", .{});
}

const splitScalar = std.mem.splitScalar;

fn parseInput(foods: *ArrayList(Food)) !void {
    var lines = splitScalar(u8, input, '\n');
    while (lines.next()) |next| {
        if (next.len == 0) continue;
        var food = try Food.init(foods.allocator, next);
        var words = splitScalar(u8, food.buffer, ' ');
        var map = &food.ingredients;
        while (words.next()) |word| {
            // Switch list to allergens
            if (std.mem.startsWith(u8, word, "(contains")) {
                map = &food.allergens;
                continue;
            }
            // Trim punctuation
            if (!std.ascii.isAlphabetic(word[word.len - 1])) {
                try map.put(word[0 .. word.len - 1], {});
            } else {
                try map.put(word, {});
            }
        }
        try foods.append(food);
    }
}
