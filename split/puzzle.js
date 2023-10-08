

function line(s, e, ...args) {
  return {type: 'line', s, e, color: randomColor(1.0), args};
}

function bezierCurve(s, cp1, cp2, e, d = 0, ...args) {
  return {type: 'bezierCurve', s, cp1, cp2, e, color: randomColor(1.0), d, args};
}

function genPuzzleSide(s, e, sideAxis, dir, tabHeight, size, tilt=0) {
  const {x: sx, y: sy} = s, {x: ex, y: ey} = e;
  dir = (dir === 1) ? -1 : 1;
  const magicK1 = 0.75, magicK2 = 0.7;

  let m, cp1_1, cp2_1, cp1_2, cp2_2;

  if (sideAxis === 1) {
    const diff = ex-sx;
    const {x: mx, y: my} = m = {x: sx+(diff/2), y: sy+(dir*tabHeight)}
    cp1_1 = {x: sx+(diff*magicK1), y: sy-(dir*tabHeight*magicK2)};
    cp2_1 = {x: sx+(diff/2)-(diff/2*size), y: sy+(dir*tabHeight)};
    cp1_2 = {x: mx+(diff/2*size), y: my};
    cp2_2 = {x: ex-(diff*magicK1), y: ey-(dir*tabHeight*magicK2)};
  } else {
    const diff = ey-sy;
    const {x: mx, y: my} = m = {x: sx+(dir*tabHeight), y: sy+(diff/2)};
    cp1_1 = {x: sx-(dir*tabHeight*magicK2), y: sy+(diff*magicK1)};
    cp2_1 = {x: sx+(dir*tabHeight), y: sy+(diff/2)-(diff/2*size)};
    cp1_2 = {x: mx, y: my+(diff/2*size)};
    cp2_2 = {x: ex-(dir*tabHeight*magicK2), y: ey-(diff*magicK1)};
  }

  cp2_1.y += tilt;
  cp1_2.y -= tilt;

  return [
    bezierCurve(s, cp1_1, cp2_1, m),
    bezierCurve(m, cp1_2, cp2_2, e),
  ];
}


function generateReversedLines(l) {
  return l.slice().reverse().map(l => {
    switch (l.type) {
      case 'line': {
        return {...l, s: l.e, e: l.s};
      };
      case 'bezierCurve': {
        return {...l, s: l.e, e: l.s, cp1: l.cp2, cp2: l.cp1};
      };
      default: {
        throw new Error('unknown line type:', l);
      }
    }
  });
}

function drawLines(ctx, lines, moveTo = true) {
  if (moveTo) {
    ctx.moveTo(lines[0].s.x, lines[0].s.y);
  }
  lines.forEach((ln, i) => {
    switch (ln.type) {
      case 'line': {
        ctx.lineTo(ln.e.x, ln.e.y);
        break;
      }
      case 'bezierCurve': {
        ctx.bezierCurveTo(ln.cp1.x, ln.cp1.y,
                          ln.cp2.x, ln.cp2.y,
                          ln.e.x, ln.e.y);
        break;
      }
      default: {
        throw new Error();
      }
    }
  });
}

function convertLinesToSVG(lines) {
  return `M ${lines[0].s.x} ${lines[0].s.y} ${
    lines.map(l => {
      switch (l.type) {
        case 'line': {
          return `L ${l.e.x} ${l.e.y}`;
        }
        case 'bezierCurve': {
          return `C ${l.cp1.x} ${l.cp1.y} ${l.cp2.x} ${l.cp2.y} ${l.e.x} ${l.e.y}`;
        }
      }
    }).join(' ')
  } Z`;
}