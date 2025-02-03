const std = @import("std");
const assert = std.debug.assert;
const print = std.debug.print;
const ArrayList = std.ArrayList;
const EnumMap = std.EnumMap;

const input = @embedFile("input.txt");

const Passport = EnumMap(Field, []const u8);

const Field = enum {
    byr,
    iyr,
    eyr,
    hgt,
    hcl,
    ecl,
    pid,
    cid,

    fn match(name: []const u8) ?Field {
        inline for (std.meta.fields(Field)) |field|
            if (std.mem.eql(u8, name, field.name)) return @enumFromInt(field.value);
        return null;
    }
};

fn validate1(passport: Passport) bool {
    inline for (std.meta.fields(Field)) |field| {
        const e: Field = @enumFromInt(field.value);
        if (e == Field.cid) continue;
        if (passport.contains(e) == false) return false;
    }
    return true;
}

fn validate2(passport: Passport) bool {
    const byr = parseInt(u16, passport.get(Field.byr).?, 10) catch 0;
    if (byr < 1920 or byr > 2002) return false;

    const iyr = parseInt(u16, passport.get(Field.iyr).?, 10) catch 0;
    if (iyr < 2010 or iyr > 2020) return false;

    const eyr = parseInt(u16, passport.get(Field.eyr).?, 10) catch 0;
    if (eyr < 2020 or eyr > 2030) return false;

    const hgt = passport.get(Field.hgt).?;
    if (hgt.len < 3) return false;
    const height = parseInt(u8, hgt[0 .. hgt.len - 2], 10) catch 0;
    if (std.mem.endsWith(u8, hgt, "cm")) {
        if (height < 150 or height > 193) return false;
    } else if (std.mem.endsWith(u8, hgt, "in")) {
        if (height < 59 or height > 76) return false;
    } else {
        return false;
    }

    const hcl = passport.get(Field.hcl).?;
    if (hcl.len != 7 or hcl[0] != '#') return false;
    _ = parseInt(u32, hcl[1..7], 16) catch return false;

    const pid = passport.get(Field.pid).?;
    if (pid.len != 9) return false;
    _ = parseInt(u32, pid, 10) catch return false;

    const ecl: [7][]const u8 = .{ "amb", "blu", "brn", "gry", "grn", "hzl", "oth" };
    for (ecl) |i| if (std.mem.eql(u8, i, passport.get(Field.ecl).?)) return true;
    return false;
}

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer assert(gpa.deinit() == .ok);
    const allocator = gpa.allocator();

    var list = ArrayList(Passport).init(allocator);
    defer list.deinit();
    try parseInput(&list);

    var answer_one: usize = 0;
    var answer_two: usize = 0;
    for (list.items) |*p| {
        if (validate1(p.*)) {
            answer_one += 1;
            if (validate2(p.*)) {
                answer_two += 1;
                // var iter = p.iterator();
                // while (iter.next()) |entry| {
                //     print("{s}:{s} ", .{ @tagName(entry.key), entry.value.* });
                // }
                // print("\n", .{});
            }
        }
    }

    print("Answer 1: {d} (of {d})\n", .{ answer_one, list.items.len });
    print("Answer 2: {d}\n", .{answer_two});
}

const parseInt = std.fmt.parseInt;
const splitScalar = std.mem.splitScalar;
const splitAny = std.mem.splitAny;

fn parseInput(list: *ArrayList(Passport)) !void {
    var lines = splitScalar(u8, input, '\n');

    var passport = Passport.init(.{});

    while (lines.next()) |line| {
        if (line.len == 0) {
            try list.append(passport);
            passport = Passport.init(.{});
            continue;
        }
        var props = splitScalar(u8, line, ' ');
        while (props.next()) |prop| {
            var kv = splitScalar(u8, prop, ':');
            if (Field.match(kv.next().?)) |field| {
                passport.put(field, kv.next() orelse "");
            }
        }
    }
}
