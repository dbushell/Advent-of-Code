const std = @import("std");
const assert = std.debug.assert;
const print = std.debug.print;

const Vector = @import("./src/vector.zig").Vector(2, i32);

const input = @embedFile("input.txt");

const Probe = struct {
    position: Vector = .{},
    velocity: Vector = .{},

    fn step(self: *Probe) void {
        self.position.vec += self.velocity.vec;
        // Apply drag effect
        if (self.velocity.x() > 0) {
            self.velocity.vec[0] -= 1;
        } else if (self.velocity.x() < 0) {
            self.velocity.vec[0] += 1;
        }
        // Apply gravity
        self.velocity.vec[1] -= 1;
    }

    /// Position is within `x` and `y` range (inclusive)
    fn intersects(self: Probe, x: Vector, y: Vector) bool {
        const px = self.position.x();
        if (px < x.vec[0] or px > x.vec[1]) return false;
        const py = self.position.y();
        if (py < y.vec[0] or py > y.vec[1]) return false;
        return true;
    }

    fn launch(self: *Probe, x: Vector, y: Vector) bool {
        while (true) {
            if (self.intersects(x, y)) return true;
            if (self.position.x() > x.vec[1]) break;
            if (self.position.y() < y.vec[0]) break;
            self.step();
        }
        return false;
    }
};

pub fn main() !void {
    const x, const y = try parseInput(input);

    var max: i32 = 0;
    var count: usize = 0;

    // No idea what the best ranges is!
    for (1..200) |x1| for (0..400) |y1| {
        var probe = Probe{};
        const y2 = @as(i32, @intCast(y1)) - 200;
        probe.velocity = Vector.fromPoint(x1, y2);
        if (!probe.launch(x, y)) continue;
        max = @max(max, @divFloor(y2 * (y2 + 1), 2));
        count += 1;
    };

    print("Answer 1: {d}\n", .{max});
    print("Answer 2: {d}\n", .{count});
}

const parseInt = std.fmt.parseInt;
const trimLeft = std.mem.trimLeft;
const trimRight = std.mem.trimRight;
const splitSequence = std.mem.splitSequence;

fn parseInput(target: []const u8) !struct { Vector, Vector } {
    var x = Vector{};
    var y = Vector{};
    var parts = splitSequence(u8, trimRight(u8, target, "\n"), ", ");
    var point = splitSequence(u8, trimLeft(u8, parts.next().?, "target area: x="), "..");
    x.vec[0] = try parseInt(i32, point.next().?, 10);
    x.vec[1] = try parseInt(i32, point.next().?, 10);
    point = splitSequence(u8, trimLeft(u8, parts.next().?[2..], "y="), "..");
    y.vec[0] = try parseInt(i32, point.next().?, 10);
    y.vec[1] = try parseInt(i32, point.next().?, 10);
    return .{ x, y };
}

const example = "target area: x=20..30, y=-10..-5";

test "Example 1" {
    const x, const y = try parseInput(example);
    var probe = Probe{};
    probe.velocity = Vector.fromPoint(7, 2);
    try std.testing.expect(probe.launch(x, y));
}

test "Example 2" {
    const x, const y = try parseInput(example);
    var probe = Probe{};
    probe.velocity = Vector.fromPoint(6, 3);
    try std.testing.expect(probe.launch(x, y));
}

test "Example 3" {
    const x, const y = try parseInput(example);
    var probe = Probe{};
    probe.velocity = Vector.fromPoint(9, 0);
    try std.testing.expect(probe.launch(x, y));
}

test "Example 4" {
    const x, const y = try parseInput(example);
    var probe = Probe{};
    probe.velocity = Vector.fromPoint(17, -4);
    try std.testing.expect(!probe.launch(x, y));
}
