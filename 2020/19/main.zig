const std = @import("std");
const assert = std.debug.assert;
const print = std.debug.print;
const eql = std.mem.eql;
const concat = std.mem.concat;
const endsWith = std.mem.endsWith;
const startsWith = std.mem.startsWith;

const Allocator = std.mem.Allocator;
const ArrayList = std.ArrayList;
const StringHashMap = std.StringHashMap;

const input = @embedFile("input.txt");

const Rule = struct {
    id: u8,
    a: ?[]u8 = null,
    b: ?[]u8 = null,
    c: ?[]u8 = null,
};

const Node = struct {
    id: u8,
    list: ArrayList([]const u8),

    /// Length of all variations should be same
    fn len(self: Node) usize {
        if (self.list.items.len == 0) return 0;
        return self.list.items[0].len;
    }

    /// Add variation (must be same length)
    fn append(self: *Node, msg: []const u8) !void {
        if (self.len() > 0) if (msg.len != self.len()) return error.BadLength;
        try self.list.append(msg);
    }

    /// Add all variations from IDs list
    fn appendAll(self: *Node, nodes: ArrayList(Node), ids: []u8) !void {
        const nA = Node.find(nodes, ids[0]).?;
        // Copy list from first ID
        var l1 = ArrayList([]const u8).init(nodes.allocator);
        for (nA.list.items) |msg| try l1.append(msg);
        // Concat lists from other IDs
        if (ids.len > 1) for (1..ids.len) |i| {
            var l2 = ArrayList([]const u8).init(nodes.allocator);
            defer l1 = l2;
            const nB = Node.find(nodes, ids[i]).?;
            for (l1.items) |a| for (nB.list.items) |b| {
                try l2.append(try concat(nodes.allocator, u8, &.{ a, b }));
            };
        };
        for (l1.items) |msg| try self.append(msg);
    }

    /// Match node by ID (static method)
    fn find(list: ArrayList(Node), id: u8) ?Node {
        for (list.items) |node| if (node.id == id) return node else continue;
        return null;
    }
};

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer assert(gpa.deinit() == .ok);
    const gpa_allocator = gpa.allocator();

    // Avoid defer/deinit mess
    var arena = std.heap.ArenaAllocator.init(gpa_allocator);
    defer arena.deinit();
    const allocator = arena.allocator();

    var messages = ArrayList([]const u8).init(allocator);
    var rules = ArrayList(Rule).init(allocator);
    var nodes = ArrayList(Node).init(allocator);

    try parseInput(&rules, &messages);

    // Convert starting rules to nodes
    var rule_index: usize = 0;
    while (rule_index < rules.items.len) {
        const rule = rules.items[rule_index];
        if (rule.c) |c| {
            _ = rules.swapRemove(rule_index);
            var node = Node{ .id = rule.id, .list = ArrayList([]const u8).init(allocator) };
            try node.append(c);
            try nodes.append(node);
        } else {
            rule_index += 1;
        }
    }

    while (rules.items.len > 0) {
        var i: usize = 0;
        next_rule: while (i < rules.items.len) : (i += 1) {
            const rule = rules.items[i];
            // Ensure all node dependencies are ready
            if (rule.a) |a| for (a) |id| {
                if (Node.find(nodes, id) == null) continue :next_rule;
            };
            if (rule.b) |b| for (b) |id| {
                if (Node.find(nodes, id) == null) continue :next_rule;
            };
            // Setup node with all variations
            var node = Node{ .id = rule.id, .list = ArrayList([]const u8).init(allocator) };
            if (rule.a) |part| try node.appendAll(nodes, part);
            if (rule.b) |part| try node.appendAll(nodes, part);
            try nodes.append(node);
            _ = rules.swapRemove(i);
            if (i > 0) i -= 1;
        }
    }

    const zero = Node.find(nodes, 0).?;
    const n8 = Node.find(nodes, 8).?;
    const n42 = Node.find(nodes, 42).?;
    const n31 = Node.find(nodes, 31).?;

    // Store slice and original message to avoid counting duplicates
    var missed = ArrayList(struct { []const u8, []const u8 }).init(allocator);
    var seen = StringHashMap(void).init(allocator);

    var matches: usize = 0;
    next_message: for (messages.items) |msg| {
        for (zero.list.items) |z| {
            if (eql(u8, z, msg)) {
                matches += 1;
                try seen.put(msg, {});
                continue :next_message;
            }
        }
        try missed.append(.{ msg, msg });
    }

    print("Answer 1: {d}\n", .{matches});

    var missed_index: usize = 0;
    next_message: while (missed_index < missed.items.len) : (missed_index += 1) {
        const msg = missed.items[missed_index];
        if (seen.contains(msg[1])) continue;
        for (zero.list.items) |z| {
            if (eql(u8, z, msg[0])) {
                matches += 1;
                try seen.put(msg[1], {});
                continue :next_message;
            }
        }
        var n8_pass = false;
        n8_test: for (n8.list.items) |part| {
            if (msg[0].len < (n8.len() * 2)) continue;
            if (!startsWith(u8, msg[0], part)) continue :n8_test;
            try missed.append(.{ msg[0][n8.len()..], msg[1] });
            n8_pass = true;
            break;
        }
        if (!n8_pass) continue;
        if (msg[0].len < n42.len() + n31.len() + n8.len()) continue;
        n42_test: for (n8.list.items) |p42| {
            if (!startsWith(u8, msg[0], p42)) continue :n42_test;
            n31_test: for (n8.list.items) |p31| {
                if (!endsWith(u8, msg[0], p31)) continue :n31_test;
                break;
            }
            try missed.append(.{ msg[0][n42.len() .. msg[0].len - n31.len()], msg[1] });
            break;
        }
    }

    print("Answer 2: {d}\n", .{matches});
}

const parseInt = std.fmt.parseInt;
const indexOfScalar = std.mem.indexOfScalar;
const tokenizeScalar = std.mem.tokenizeScalar;
const splitSequence = std.mem.splitSequence;

fn parseInput(list: *ArrayList(Rule), messages: *ArrayList([]const u8)) !void {
    var lines = tokenizeScalar(u8, input, '\n');
    while (lines.next()) |line| {
        if (line.len == 0) continue;
        if (indexOfScalar(u8, line, ':') != null) {
            var split = splitSequence(u8, line, ": ");
            var rule = Rule{ .id = try parseInt(u8, split.next().?, 10) };
            var next = split.next().?;
            if (indexOfScalar(u8, next, '"') != null) {
                rule.c = try list.allocator.alloc(u8, next.len - 2);
                @memcpy(rule.c.?, next[1 .. next.len - 1]);
            } else {
                var both = tokenizeScalar(u8, next, '|');
                var target = &rule.a;
                while (both.next()) |str| {
                    var num = tokenizeScalar(u8, str, ' ');
                    var buf = ArrayList(u8).init(list.allocator);
                    while (num.next()) |n| try buf.append(try parseInt(u8, n, 10));
                    target.* = try buf.toOwnedSlice();
                    target = &rule.b;
                }
            }
            try list.append(rule);
            continue;
        }
        const msg: []u8 = try messages.allocator.alloc(u8, line.len);
        @memcpy(msg, line);
        try messages.append(msg);
    }
}
