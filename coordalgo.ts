const fs = require("fs");

const mapsize = {
    x: 256,
    y: 256
}

function coord2idx(x: number, y: number, maxx = mapsize.x, maxy = mapsize.y) {
    if (x > maxx || y > maxy || x < 0 || y < 0) {
        console.warn(`Fuck up in the coords (${x},${y})`)
        debugger
        return -1
    }
    return y * maxx + x
}

enum Direction {
    RIGHT = 0,
    UP = 1,
    LEFT = 2,
    DOWN = 3,
}

const DirectionToCommand: {
    [key in Direction]: (x: number, y: number) => [string, number, number, number]
} = {
    [Direction.RIGHT]: (x: number, y: number) => {
        x++;
        return ["h", 1, x, y];
    },
    [Direction.UP]: (x: number, y: number) => {
        y--;
        return ["v", -1, x, y];
    },
    [Direction.LEFT]: (x: number, y: number) => {
        x--;
        return ["h", -1, x, y];
    },
    [Direction.DOWN]: (x: number, y: number) => {
        y++;
        return ["v", 1, x, y];
    }
}

interface Vector {
    direction: Direction
}

const testdatastr = `\
XooXoXXXXoXXooXXo
XooXoXoooooXXXXoo
XXXXoXXXXoooXXooo
XooXoXooooooXXooo
XooXoXXXXoooXXooo
`;

mapsize.y++
mapsize.x++
const bitmap: Array<boolean> = Array(mapsize.y * mapsize.x);
bitmap.toString = function () {
    let built = "";
    for (let i = 1; i <= bitmap.length; i++) {
        const point = bitmap[i - 1];

        if (point) built += "X"
        if (!point) built += "o"
        if (!(i % mapsize.x)) built += "\n"
    }
    return built;
}
/*
for (let i = 0; i < testdatastr.length; i++) {
    const char = testdatastr[i];
    if (char === "\n") {
        bitmap[i] = false
    } else if (char === "X") {
        bitmap[i] = true
    } else if (char === "o") {
        bitmap[i] = false
    } else {
        bitmap[i] = false
        console.error(`Bad map! Using 'o' instead of '${char}'`)
    }
}*/
const data = fs.readFileSync("./data.dat");
data.toString().split("\n").forEach((entry: string) => {
    const [strX,strY] = entry.split(",");
    const x = parseInt(strX);
    const y = parseInt(strY);

    bitmap[coord2idx(x, 254 - y)] = true
})


console.error(bitmap.toString())

const vectors: Array<{
    [key in Direction]?: boolean
} & {
    coord?: string
}> = [];
for (let i = 0; i < bitmap.length; i++) {
    vectors[i] = {};
}

for (let y = 0; y < mapsize.y; y++) {
    for (let x = 0; x < mapsize.x; x++) {
        const point = bitmap[coord2idx(x, y)]
        vectors[coord2idx(x, y)]["coord"] = `x${x},y${y}`
        const uppoint = y === 0 ? false : bitmap[coord2idx(x, y - 1)]
        const downpoint = y === mapsize.y - 1 ? false : bitmap[coord2idx(x, y + 1)]
        const leftpoint = x === 0 ? false : bitmap[coord2idx(x - 1, y)]
        const rightpoint = x === mapsize.x - 1 ? false : bitmap[coord2idx(x + 1, y)]
        if (point) {
            if (!uppoint) vectors[coord2idx(x, y)][Direction.RIGHT] = true
            if (!rightpoint) vectors[coord2idx(x + 1, y)][Direction.DOWN] = true
            if (!downpoint) vectors[coord2idx(x + 1, y + 1)][Direction.LEFT] = true
            if (!leftpoint) vectors[coord2idx(x, y + 1)][Direction.UP] = true
        }
    }
}

const visited: Array<boolean> = Array(bitmap.length);

for (; ;) {
    let originPoint: { x: number, y: number } | undefined = undefined;
    for (let i = 0; i < vectors.length; i++) {
        const point = bitmap[i];
        if (!point) continue
        if (visited[i]) continue
        let found = false;
        for(const direction of Object.values(Direction)) {
            if(typeof direction !== "number") continue

            if(vectors[i][direction]) {
                found = true;
                break;
            }
        }
        if(!found) continue

        const y = Math.floor(i / mapsize.x);
        const x = i - mapsize.x * y;

        originPoint = {x, y};
        break
    }
    if (!originPoint) {
        break
    }

    let {x, y} = originPoint;
    process.stdout.write(`\nM${originPoint.x},${originPoint.y}`)
    let lastDirection = Direction.RIGHT;
    let lastCommand = "";
    let lastCommandCount = 0;

    for (; ;) {
        let point = vectors[coord2idx(x, y)];
        visited[coord2idx(x, y)] = true;

        if (!point) console.error(`What the fuck just happened, ${x} ${y} has no vector array`)

        for (const direction of Object.values(Direction)) {
            if (typeof direction !== "number") continue

            let offsetDir = direction as number + lastDirection as number
            if (offsetDir > 3) {
                offsetDir = offsetDir - 4
            }
            const newDir = offsetDir as Direction

            if (point[newDir]) {
                point[newDir] = false
                const [command, amt, newx, newy] = DirectionToCommand[newDir](x, y)
                lastDirection = newDir
                if (command !== lastCommand) {
                    if (lastCommandCount) {
                        process.stdout.write(`${lastCommand}${lastCommandCount.toString()}`)
                    }
                    lastCommand = command;
                    lastCommandCount = amt;
                } else {
                    lastCommandCount = lastCommandCount + amt;
                }
                x = newx;
                y = newy;
                break
            }
        }

        if (x === originPoint.x && y === originPoint.y) {
            break
        }
    }
}
console.log()