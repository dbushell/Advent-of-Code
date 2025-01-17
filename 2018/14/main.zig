const std = @import("std");
const print = std.debug.print;

const inputText = @embedFile("input.txt");
const input = std.fmt.parseInt(i32, inputText[0 .. inputText.len - 1], 10) catch 0;

fn next(buf: []u8, length: usize, e1: *usize, e2: *usize) usize {
    var index = length;
    const sum: u8 = buf[e1.*] + buf[e2.*];
    if (sum >= 10) {
        buf[index] = @mod(@divFloor(sum, 10), 10);
        index += 1;
    }
    buf[index] = @mod(sum, 10);
    index += 1;
    e1.* = @mod(e1.* + 1 + buf[e1.*], index);
    e2.* = @mod(e2.* + 1 + buf[e2.*], index);
    return index;
}

pub fn main() !void {
    // Probably enough for input...
    const max_recipes = 30 * 1024 * 1024;

    // Stack allocation segfaults beyond 10 MB
    // var recipes = [_]u8{0} ** max_recipes;

    // Large buffer to store all recipes
    const allocator = std.heap.page_allocator;
    var recipes = try allocator.alloc(u8, max_recipes);
    defer allocator.free(recipes);

    // Total number of recipes created
    var length: usize = 2;
    recipes[0] = 3;
    recipes[1] = 7;

    var e1: usize = 0;
    var e2: usize = 1;

    for (0..input + 10) |_| {
        length = next(recipes, length, &e1, &e2);
    }

    // Output recipe numbers in ASCII range
    var slice: [10]u8 = undefined;
    for (input..input + 10) |i| slice[i - input] = recipes[i] + 48;
    print("Answer 1: {s}\n", .{slice});

    // Convert input number into array of digits
    const digits = yield: {
        var buf: [8]u8 = undefined;
        var tmp = input;
        var i: usize = 0;
        while (tmp > 0) : (i += 1) {
            buf[i] = @intCast(@mod(tmp, 10));
            tmp = @divFloor(tmp, 10);
        }
        const digits = buf[0..i];
        std.mem.reverse(u8, digits);
        break :yield digits;
    };

    while (true) {
        const offset = @max(0, length - 10);
        const compare = recipes[offset..length];
        const index = std.mem.indexOf(u8, compare, digits);
        if (index) |i| {
            print("Answer 2: {d}\n", .{offset + i});
            break;
        }
        length = next(recipes, length, &e1, &e2);
    }
}
