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
  if (map[x]) {
    return map[x][y];
  }
}

function neighbours(x, y) {
  return [[x-1,y],[x+1,y],[x,y-1],[x,y+1],[x-1,y-1],[x+1,y+1],[x-1,y+1],[x+1,y-1]];
}

function generateHeatMap(blockMap, xdest, ydest) {
  var heatMap = [];
  var uNum = 0;
  for (var i = 0; i < blockMap.length; i++) {
    heatMap.push(blockMap[i].map(function(a) {
      if (a == Clear) {
        uNum++;
        return a;
      }
      return Blocked;
    }));
  }
  heatMap[xdest][ydest] = 0;
  var qx = [xdest];
  var qy = [ydest];
  return solveHeatMap(heatMap, qx, qy, uNum);
}

function generateMultiHeatMap(blockMap, target, minX, maxX, minY, maxY) {
  minX = minX || 0;
  maxX = maxX || blockMap.length;
  minY = minY || 0;
  maxY = maxY || blockMap[0].length;
  var heatMap = [];
  var uNum = 0;
  var qx = [];
  var qy = [];
  for (var x = 0; x < blockMap.length; x++) {
    heatMap.push(blockMap[x].map(function(a, y) {
      if (a == target && x >= minX && x < maxX && y >= minY && y < maxY) {
        qx.push(x);
        qy.push(y);
        return 0;
      }
      if (a == Clear) {
        uNum++;
        return a;
      }
      return Blocked;
    }));
  }
  return solveHeatMap(heatMap, qx, qy, uNum);
}

function solveHeatMap(heatMap, qx, qy, uNum) {
  var qPos = 0;
  while (uNum > 0) {
    if (qPos >= qx.length) {
      break;
    }
    var eltx = qx[qPos];
    var elty = qy[qPos++];
    var curDist = heatMap[eltx][elty] + 1;
    var newElts = neighbours(eltx, elty);
    for (var i = 0; i < newElts.length; i++) {
      var x = newElts[i][0];
      var y = newElts[i][1];
      var condition = lookup(heatMap, x, y);
      if (condition == undefined) {
        continue;
      }
      if (condition == Clear) {
        uNum--;
        heatMap[x][y] = curDist;
        qx.push(x);
	qy.push(y);
      } else if (typeof condition != Blocked && curDist < condition) {
        heatMap[x][y] = curDist;
      }
    }
  }
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
