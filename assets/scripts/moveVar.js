let Dir = cc.Enum({
    NONE: 0,
    UP: 1,
    DOWN: 2,
    LEFT: 3,
    RIGHT: 4
});

let Speed = cc.Enum({
    SLOW: 0.5,
    NORMAL: 1,
    FAST: 4,
});

let State = cc.Enum({
    WAIT: 1,
    EXIT: 2,
    NORMAL: 3,
    WEAK: 4,
    DEAD: 5,
});

module.exports = {Dir, Speed, State};
