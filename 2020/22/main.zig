const std = @import("std");
const assert = std.debug.assert;
const print = std.debug.print;

const Allocator = std.mem.Allocator;
const ArrayList = std.ArrayList;
const AutoHashMap = std.AutoHashMap;

const input = @embedFile("input.txt");

const Player = struct {
    allocator: Allocator,
    deck: ArrayList(u8),
    id: u8,

    fn init(allocator: Allocator, id: u8) Player {
        return .{
            .allocator = allocator,
            .deck = ArrayList(u8).init(allocator),
            .id = id,
        };
    }

    fn deinit(self: *Player) void {
        self.deck.deinit();
    }

    /// Returns number of cards in deck
    fn count(self: Player) usize {
        return self.deck.items.len;
    }

    /// Draws top card from deck removing it
    fn topdeck(self: *Player) ?u8 {
        if (self.deck.items.len == 0) return null;
        return self.deck.orderedRemove(0);
    }

    /// Place cards at bottom of deck
    fn append(self: *Player, a: u8, b: u8) !void {
        try self.deck.append(a);
        try self.deck.append(b);
    }

    /// Returns winning hand
    fn score(self: Player) usize {
        var sum: usize = 0;
        for (0..self.count()) |i| {
            sum += self.deck.items[i] * (self.count() - i);
        }
        return sum;
    }
};

const Game = struct {
    allocator: Allocator,
    p1: Player,
    p2: Player,
    round: usize = 0,
    depth: usize = 0,
    state: AutoHashMap(u64, void),

    fn init(allocator: Allocator) Game {
        return .{
            .allocator = allocator,
            .p1 = Player.init(allocator, 1),
            .p2 = Player.init(allocator, 2),
            .state = AutoHashMap(u64, void).init(allocator),
        };
    }

    fn deinit(self: *Game) void {
        self.p1.deinit();
        self.p2.deinit();
        self.state.deinit();
    }

    /// Generate unique hash of game state
    fn hash(self: Game) u64 {
        var xh = std.hash.XxHash3.init(self.depth);
        xh.update(self.p1.deck.items);
        // Separator required otherwise [0,1,2] [3] == [0] [1,2,3] etc
        // I lost hours because of that...
        xh.update("CRAB COMBAT!");
        xh.update(self.p2.deck.items);
        return xh.final();
    }

    /// Return winning player
    fn winner(self: Game) ?Player {
        if (self.p1.count() > 0) return self.p1;
        if (self.p2.count() > 0) return self.p2;
        return null;
    }

    /// Play the basic rules
    fn combat(self: *Game) !Player {
        self.round = 0;
        while (self.p1.count() > 0 and self.p2.count() > 0) : (self.round += 1) {
            const c1 = self.p1.topdeck().?;
            const c2 = self.p2.topdeck().?;
            try if (c1 > c2) self.p1.append(c1, c2) else self.p2.append(c2, c1);
        }
        return self.winner() orelse unreachable;
    }

    /// Play the advanced rules
    fn recursiveCombat(self: *Game, depth: usize) !Player {
        self.depth = depth;
        while (self.p1.count() > 0 and self.p2.count() > 0) : (self.round += 1) {
            // Check for infinite recursion and exit early
            const xh = self.hash();
            if (self.state.contains(xh)) {
                self.p2.deck.clearAndFree();
                return self.p1;
            }
            try self.state.put(xh, {});
            // Draw cards
            const c1 = self.p1.topdeck().?;
            const c2 = self.p2.topdeck().?;
            var w: *Player = undefined;
            // Enter recursion?
            if (self.p1.count() >= c1 and self.p2.count() >= c2) {
                // Setup recursive state
                var g2 = Game.init(self.allocator);
                defer g2.deinit();
                try g2.p1.deck.appendSlice(self.p1.deck.items[0..c1]);
                try g2.p2.deck.appendSlice(self.p2.deck.items[0..c2]);
                const result = try g2.recursiveCombat(self.depth + 1);
                w = if (result.id == 1) &self.p1 else &self.p2;
            } else {
                // Basic rules
                w = if (c1 > c2) &self.p1 else &self.p2;
            }
            try if (w.id == 1) w.append(c1, c2) else w.append(c2, c1);
        }
        return self.winner() orelse unreachable;
    }
};

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer assert(gpa.deinit() == .ok);
    const allocator = gpa.allocator();

    // Play basic rules
    var basic = Game.init(allocator);
    defer basic.deinit();
    try parseInput(&basic.p1, &basic.p2);
    print("Answer 1: {d}\n", .{(try basic.combat()).score()});

    // Play advanced rules
    var recursive = Game.init(allocator);
    defer recursive.deinit();
    try parseInput(&recursive.p1, &recursive.p2);
    print("Answer 2: {d}\n", .{(try recursive.recursiveCombat(0)).score()});
}

const parseInt = std.fmt.parseInt;
const splitScalar = std.mem.splitScalar;
const startsWith = std.mem.startsWith;

fn parseInput(p1: *Player, p2: *Player) !void {
    var lines = splitScalar(u8, input, '\n');
    var player: *Player = undefined;
    while (lines.next()) |line| {
        if (line.len == 0) continue;
        if (startsWith(u8, line, "Player 1:")) {
            player = p1;
            continue;
        }
        if (startsWith(u8, line, "Player 2:")) {
            player = p2;
            continue;
        }
        const card = try parseInt(u8, line, 10);
        try player.deck.append(card);
    }
}
