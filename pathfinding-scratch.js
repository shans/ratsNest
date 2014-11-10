function straightLinePath(x0, y0, x1, y1) {
  var deltaX = Math.abs(x1 - x0);
  var path = [];
  var yDir = y1 > y0 ? 1 : -1;
  if (deltaX == 0) {
    for (var i = y0 + yDir; i != y1; i += yDir) {
      path.push([x0, i]);
    }
    path.push([x1, y1]);
    return path;
  }
  var xDir = x1 > x0 ? 1 : -1;
  var deltaY = Math.abs(y1 - y0);
  var error = 0;
  var deltaError = deltaY / deltaX;
  var y = y0;
  for (var x = x0; x != x1; x+= xDir) {
    if (x != x0)
      path.push([x, y]);
    error += deltaError;
    if (error >= 0.5) {
      y += yDir;
      error -= 1;
      while (error > 0.5) {
        path.push([x, y]);
        y += yDir;
        error -= 1;
      }
    }
  }
  path.push([x1, y1]);
  return path;
}

var Clear = "clear";
var Blocked = "blocked";

function look(blockMap, sx, sy, dx, dy) {
  var count = 0;
  while (1) {
    sx += dx;
    sy += dy;
    count++;
    if (count > 10) {
      return [Infinity, sx, sy];
    }
    try {
      if (blockMap[sx][sy] == Clear) {
        return [count, sx, sy];
      }
    } catch (e) {
      return [Infinity, sx, sy];
    }
  }
}

function sparsePath(blockMap, x0, y0, x1, y1, depth) {
  if (x0 == x1 && y0 == y1) {
    return [];
  }
  if (depth > 5) {
    return [];
  }
  var path = straightLinePath(x0, y0, x1, y1);
  for (var i = 0; i < path.length; i++) {
    var pos = path[i];
    if (blockMap[pos[0]][pos[1]] == Blocked) {
      var options = [
        look(blockMap, pos[0], pos[1], -1, 0),
        look(blockMap, pos[0], pos[1], 0, 1),
        look(blockMap, pos[0], pos[1], 1, 0),
        look(blockMap, pos[0], pos[1], 0, -1)
      ].sort();
      var option = options[0];
      if (option[1] == x0 && option[2] == y0) {
        option = options[1];
      }
      return sparsePath(blockMap, x0, y0, option[1], option[2], depth + 1).concat(
          sparsePath(blockMap, option[1], option[2], x1, y1, depth + 1));
    }
  }
  return path;
}

function lookup(map, x, y) {
  try {
    return map[x][y];
  } catch (e) {
  }
}

function neighbours(x, y) {
  return [[x-1,y],[x+1,y],[x,y-1],[x,y+1],[x-1,y-1],[x+1,y+1],[x-1,y+1],[x+1,y-1]];
}

function generateHeatMap(blockMap, xdest, ydest) {
  var s = performance.now();
  var heatMap = [];
  var uNum = 0;
  for (var i = 0; i < blockMap.length; i++) {
    heatMap.push(blockMap[i].slice());
    for (var j = 0; j < blockMap[i].length; j++) {
      if (blockMap[i][j] == Clear) {
        uNum++;
      }
    }
  }
  heatMap[xdest][ydest] = 0;
  var queue = [[xdest, ydest]];
  var qPos = 0;
  while (uNum > 0) {
    if (qPos >= queue.length) {
      break;
    }
    var elt = queue[qPos++];
    var curDist = heatMap[elt[0]][elt[1]] + 1;
    var newElts = neighbours(elt[0], elt[1]);
    for (var i = 0; i < newElts.length; i++) {
      var condition = lookup(heatMap, newElts[i][0], newElts[i][1]);
      if (condition == undefined) {
        continue;
      }
      if (condition == Blocked) {
        continue;
      } else if (condition == Clear) {
        uNum--;
        heatMap[newElts[i][0]][newElts[i][1]] = curDist;
        queue.push(newElts[i]);
      } else if (curDist < condition) {
        heatMap[newElts[i][0]][newElts[i][1]] = curDist;
        var pos = queue.indexOf(newElts[i]);
        if (pos >= 0 && pos < qPos) {
          qPos -= 1;
          queue.splice(pos, 1);
          queue.push(newElts[i]);
        } else if (pos < 0) {
          queue.push(newElts[i]);
        }
      }
    }
  }
  console.log(performance.now() - s);
  return heatMap;
}

function heatMapToPath(heatMap, xSrc, ySrc) {
  var currHeat = lookup(heatMap, xSrc, ySrc);
  if (currHeat == undefined) {
    return;
  }
  var path = [];
  while (currHeat > 0) {
    var candidates = neighbours(xSrc, ySrc);
    for (var i = 0; i < candidates.length; i++) {
      var next = candidates[i];
      var nextHeat = lookup(heatMap, next[0], next[1]);
      if (nextHeat == undefined) {
        continue;
      }
      if (nextHeat < currHeat) {
        path.push(next);
        currHeat = nextHeat;
        xSrc = next[0];
        ySrc = next[1];
        break;
      }
    }
  }
  return path;
}
