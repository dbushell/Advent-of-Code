const std = @import("std");
const assert = std.debug.assert;
const print = std.debug.print;
const Allocator = std.mem.Allocator;
const ArrayList = std.ArrayList;
const StringArrayHashMap = std.StringArrayHashMap;

const input = @embedFile("input.txt");

const Ticket = ArrayList(u16);

const Field = struct {
    name: []const u8,
    r1: [2]u16,
    r2: [2]u16,
};

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer assert(gpa.deinit() == .ok);
    const allocator = gpa.allocator();

    var fields = ArrayList(Field).init(allocator);
    var nearby = ArrayList(Ticket).init(allocator);
    var ticket = Ticket.init(allocator);
    defer {
        for (fields.items) |f| allocator.free(f.name);
        fields.deinit();
        for (nearby.items) |t| t.deinit();
        nearby.deinit();
        ticket.deinit();
    }
    try parseInput(&fields, &nearby, &ticket);

    var sum: usize = 0;
    var sum_index: i32 = 0;
    while (sum_index < nearby.items.len) : (sum_index += 1) {
        const t = nearby.items[@intCast(sum_index)];
        var valid = true;
        defer if (valid == false) {
            nearby.orderedRemove(@intCast(sum_index)).deinit();
            sum_index -= 1;
        };
        validate: for (t.items) |n| {
            for (fields.items) |f| {
                if (n >= f.r1[0] and n <= f.r1[1]) continue :validate;
                if (n >= f.r2[0] and n <= f.r2[1]) continue :validate;
            }
            valid = false;
            sum += n;
        }
    }
    print("Answer 1: {d}\n", .{sum});

    assert(fields.items.len == ticket.items.len);

    // Field name to ticket position
    var map = StringArrayHashMap(usize).init(allocator);
    defer map.deinit();

    // Go until all fields are mapped
    while (map.count() < fields.items.len) {
        for (fields.items) |field| {
            if (map.contains(field.name)) continue;
            // Track valid positions
            var possible = ArrayList(usize).init(allocator);
            defer possible.deinit();
            // Test all positions
            positions: for (0..ticket.items.len) |i| {
                // Skip if position has been mapped to field
                if (std.mem.indexOf(usize, map.values(), &.{i})) |_| continue;
                // Validate against nearby tickets
                for (nearby.items) |t| {
                    const n = t.items[i];
                    if ((n < field.r1[0] or n > field.r1[1]) and
                        (n < field.r2[0] or n > field.r2[1]))
                        continue :positions;
                }
                // Position is valid
                try possible.append(i);
            }
            // Map to field name if only one valid position
            if (possible.items.len == 1) {
                try map.put(field.name, possible.getLast());
            }
        }
    }

    var multiply: usize = 1;
    var iter = map.iterator();
    while (iter.next()) |n| {
        if (startsWith(u8, n.key_ptr.*, "departure")) {
            multiply *= ticket.items[n.value_ptr.*];
        }
    }
    print("Answer 2: {d}\n", .{multiply});
}

const parseInt = std.fmt.parseInt;
const startsWith = std.mem.startsWith;
const splitScalar = std.mem.splitScalar;
const splitSequence = std.mem.splitSequence;

const Parser = enum {
    fields,
    your_ticket,
    nearby_tickets,
};

fn parseInput(fields: *ArrayList(Field), nearby: *ArrayList(Ticket), ticket: *Ticket) !void {
    var lines = splitScalar(u8, input, '\n');
    var state = Parser.fields;
    while (lines.next()) |line| {
        if (line.len == 0) continue;
        if (startsWith(u8, line, "your ticket:")) {
            state = .your_ticket;
            continue;
        }
        if (startsWith(u8, line, "nearby tickets:")) {
            state = .nearby_tickets;
            continue;
        }
        if (state == .fields) {
            var parts = splitSequence(u8, line, ": ");
            var name_slice = parts.next().?;
            var range_slice = splitSequence(u8, parts.next().?, " or ");
            var r1 = splitScalar(u8, range_slice.next().?, '-');
            var r2 = splitScalar(u8, range_slice.next().?, '-');
            const name = try fields.allocator.alloc(u8, name_slice.len);
            std.mem.copyForwards(u8, name, name_slice[0..name.len]);
            const field = Field{
                .name = name,
                .r1 = .{ try parseInt(u16, r1.next().?, 10), try parseInt(u16, r1.next().?, 10) },
                .r2 = .{ try parseInt(u16, r2.next().?, 10), try parseInt(u16, r2.next().?, 10) },
            };
            try fields.append(field);
        }
        if (state == .your_ticket) {
            var numbers = splitScalar(u8, line, ',');
            while (numbers.next()) |n| try ticket.append(try parseInt(u16, n, 10));
        }
        if (state == .nearby_tickets) {
            var list = Ticket.init(ticket.allocator);
            var numbers = splitScalar(u8, line, ',');
            while (numbers.next()) |n| try list.append(try parseInt(u16, n, 10));
            try nearby.append(list);
        }
    }
}
