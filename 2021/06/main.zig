const std = @import("std");
const assert = std.debug.assert;
const print = std.debug.print;
const parseInt = std.fmt.parseInt;
const splitScalar = std.mem.splitScalar;
const ArrayList = std.ArrayList;
const AutoHashMap = std.AutoHashMap;

const input = @embedFile("input.txt");

/// key = {birthday, timer}, value = count
const State = AutoHashMap(@Vector(2, usize), usize);

/// Count the number of fish after number of days specified
pub fn laternFish(key: @Vector(2, usize), days: usize, state: *State) usize {
    if (state.get(key)) |n| return n;
    var count: usize = 1;
    var timer: usize = key[1];
    for (key[0]..days) |day| {
        if (timer == 0) {
            count += laternFish(.{ day, 9 }, days, state);
            timer = 7;
        }
        timer -= 1;
    }
    state.put(key, count) catch unreachable;
    return count;
}

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer assert(gpa.deinit() == .ok);
    const allocator = gpa.allocator();

    var list = ArrayList(usize).init(allocator);
    defer list.deinit();
    var split = splitScalar(u8, input[0 .. input.len - 1], ',');
    while (split.next()) |n| try list.append(try parseInt(usize, n, 10));

    var state = State.init(allocator);
    defer state.deinit();

    var count: usize = 0;
    for (list.items) |n| count += laternFish(.{ 0, n }, 80, &state);
    print("Answer 1: {d}\n", .{count});

    state.clearAndFree();

    count = 0;
    for (list.items) |n| count += laternFish(.{ 0, n }, 256, &state);
    print("Answer 2: {d}\n", .{count});
}
