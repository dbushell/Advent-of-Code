// https://www.redblobgames.com/grids/hexagons/#coordinates-cube

const Hex = @This();

v: @Vector(3, i32) = .{ 0, 0, 0 },

pub fn neighbours(self: Hex) [6]Hex {
    return .{
        self.east(),
        self.southEast(),
        self.southWest(),
        self.west(),
        self.northEast(),
        self.northWest(),
    };
}

pub fn east(self: Hex) Hex {
    return .{
        .v = self.v - @Vector(3, i32){ 1, -1, 0 },
    };
}

pub fn southEast(self: Hex) Hex {
    return .{
        .v = self.v - @Vector(3, i32){ 0, -1, 1 },
    };
}

pub fn southWest(self: Hex) Hex {
    return .{
        .v = self.v - @Vector(3, i32){ -1, 0, 1 },
    };
}

pub fn west(self: Hex) Hex {
    return .{
        .v = self.v - @Vector(3, i32){ -1, 1, 0 },
    };
}

pub fn northEast(self: Hex) Hex {
    return .{
        .v = self.v - @Vector(3, i32){ 1, 0, -1 },
    };
}

pub fn northWest(self: Hex) Hex {
    return .{
        .v = self.v - @Vector(3, i32){ 0, 1, -1 },
    };
}
