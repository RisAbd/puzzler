


function cyrb128(str) {
  let h1 = 1779033703, h2 = 3144134277,
      h3 = 1013904242, h4 = 2773480762;
  for (let i = 0, k; i < str.length; i++) {
      k = str.charCodeAt(i);
      h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
      h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
      h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
      h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  h1 ^= (h2 ^ h3 ^ h4), h2 ^= h1, h3 ^= h1, h4 ^= h1;
  return [h1>>>0, h2>>>0, h3>>>0, h4>>>0];
}

function mulberry32(a) {
  return function() {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

let currentSeedString;

function cutImageToPieces({ seedString } = {}) {

  currentSeedString = seedString || Date.now().toString();
  const seed = cyrb128(currentSeedString);
  const random = mulberry32(seed[0]);

  if (currentSeedString.match(/\d+/)) {
    createdDateStatsEl.innerText = new Date(+currentSeedString).toLocaleString();
    statsTimerStartTime = +currentSeedString;
  }

  if (!imgEl.complete || imgEl.naturalWidth === 0) {
    console.log('image is not loaded yet...');
    return;
  }

  puzzlePiecesContainer.classList.remove('show-edge-pieces');

  globalPPZIndex = 2;
  globalGroupId = 1;

  const { width: screenWidth, height: screenHeight } = window.screen;


  const w = gridCanvas.width = imgEl.naturalWidth;
  const h = gridCanvas.height = imgEl.naturalHeight;

  const _minScale = Math.min(screenWidth/w, screenHeight/h);
  // const puzzleScale = 1;
  const puzzleScale = 1; // _minScale * controlsForm['puzzle-scale'].value;

  gridCanvasContainer.style.setProperty('--pp-scale', puzzleScale);
  // imgEl.style.transform = `scale(${puzzleScale})`;

  // const puzzleScale = (w > screenWidth) ? (w / screenWidth) : 1;
  // console.log(puzzleScale, w, screenWidth, screenWidth/w);


  const sounds = () => controlsForm.querySelector('input[name="sounds"]').checked ? true : false;

  const { bgColor, rotationAllowed, width: gw, height: gh, tabType } = getControlsValues();
  setBgColor(bgColor);

  const ctx = gridCanvas.getContext('2d');

  // clearing container
  while (puzzlePiecesContainer.firstChild) {
    puzzlePiecesContainer.removeChild(puzzlePiecesContainer.lastChild);
  }
  winSoundEl.dataset.played = '';
  imgEl.classList.remove('completed');
  // ctx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
  // ctx.drawImage(imgEl, 0, 0);

  const gridCellWidth = w/gw, gridCellHeight = h/gh;
  const tabHeight = (gridCellWidth + gridCellHeight) / 7.5;
  const tabVarHeight = Math.min(gridCellWidth, gridCellHeight)*0.25;

  slicerCanvas.width = gridCellWidth+tabHeight*2+tabVarHeight;
  slicerCanvas.height = gridCellHeight+tabHeight*2+tabVarHeight;
  const slicerCtx = slicerCanvas.getContext('2d');
  // slicerCtx.clearRect(0, 0, slicerCanvas.width, slicerCanvas.height);

  const randomShift = (m = tabVarHeight) => Math.round(random() * m - (m/2));

  function genPuzzleSideWithRectTab(s, e, sideAxis, dir, th, size, tilt) {

    const {x: sx, y: sy} = s, {x: ex, y: ey} = e;
    dir = (dir === 1) ? -1 : 1;
  
    const widthToTab = 0.4;
    const scatterRatio = 0.3

    const dx = ex-sx, dy = ey-sy;
    const r = () => Math.max(Math.abs(dy), Math.abs(dx))*widthToTab*scatterRatio*(random()-0.5);
    const p1 = {x: sx+dx*widthToTab, y: sy+dy*widthToTab};
    let p2, p3, p4;
    if (sideAxis === 1) {
      p2 = {x: p1.x, y: p1.y+(dir*th)};
      p3 = {x: ex-dx*widthToTab, y: p2.y};
      p4 = {x: p3.x, y: ey-dy*widthToTab};
    } else {
      p2 = {x: p1.x+(dir*th), y: p1.y};
      p3 = {x: p2.x, y: ey-dy*widthToTab};
      p4 = {x: ex-dx*widthToTab, y: p3.y};
    }
    [p1, p2, p3, p4].forEach(p => {
      p.x += r(); p.y += r();
    });
    return [line(s, p1), line(p1, p2), line(p2, p3), line(p3, p4), line(p4, e)];
  }

  function genPuzzleSideLightningTab(s, e, sideAxis, dir, th, size, tilt) {

    const {x: sx, y: sy} = s, {x: ex, y: ey} = e;
    dir = (dir === 1) ? -1 : 1;
  
    const widthToTab = 0.3;
    const scatterRatio = 0.3

    const dx = ex-sx, dy = ey-sy;
    const r = () => Math.max(Math.abs(dy), Math.abs(dx))*widthToTab*scatterRatio*(random()-0.5);
    const p1 = {x: sx+dx*widthToTab, y: sy+dy*widthToTab};
    let p2, p3, p4;
    if (sideAxis === 1) {  // horizontal
      p2 = {x: sx+dx/2, y: p1.y+(dir*th)};
      p3 = {x: p2.x, y: sy+dy/2-(dir*th)};
      p4 = {x: ex-dx*widthToTab, y: ey-dy*widthToTab};
    } else {  // vertical
      p2 = {x: p1.x+(dir*th), y: sy+dy/2};
      p3 = {x: sx+dx/2-(dir*th), y: p2.y};
      p4 = {x: ex-dx*widthToTab, y: ey-dy*widthToTab};
    }
    [p1, p2, p3, p4].forEach(p => {
      p.x += r(); p.y += r();
    });
    return [line(s, p1), line(p1, p2), line(p2, p3), line(p3, p4), line(p4, e)];
  }
  
  const TAB_TYPE_GEN_FUNCS = {
    normal: genPuzzleSide,
    square: genPuzzleSideWithRectTab,
    lightning: genPuzzleSideLightningTab,
  };
  // todo: make multiple choices
  let genFuncs;
  if (tabType === 'random') {
    const gfs = Object.values(TAB_TYPE_GEN_FUNCS)
    genFuncs = [gfs[Math.floor(random() * gfs.length)]]
  } else if (tabType in TAB_TYPE_GEN_FUNCS) {
    genFuncs = [TAB_TYPE_GEN_FUNCS[tabType]];
  } else {
    console.warn(`"${tabType}" PP generation function is not available, fallback to "normal"`);
    genFuncs = [TAB_TYPE_GEN_FUNCS.normal];
  }
  function side(t, s, e, ci, cj) {
    if (
      // true ||
      (t === 'top' && cj === 0)
      || (t === 'right' && ci === gw-1)
      || (t === 'bottom' && cj === gh-1)
      || (t === 'left' && ci === 0)
    ) {
      return [line(s, e)];
    }
    const sideAxis = (t === 'top' || t === 'bottom') ? 1 : 2;
    const direction = random() < 0.5 ? 1 : 2;
    const size = 0.7;
    const minTabHeightK = 0.8;
    const th = tabHeight * minTabHeightK + (random() * (1.0 - minTabHeightK) * tabHeight);
    const tilt = (random() < 0.5 ? -1 : 1) * (random() * (th/3))
    const gf = genFuncs[Math.floor(random()*genFuncs.length)]
    return gf(s, e, sideAxis, direction, th, size, tilt);
  }

  function _recKek(o, f, k = undefined, p = undefined, i = 0) {
    f(o, k, p, i);
    if (Array.isArray(o)) {
      o.forEach((item, k, p) => _recKek(item, f, k, p, i+1))
    } else if (typeof o === 'object' && o !== null) {
      Object.keys(o).map(k => _recKek(o[k], f, k, o, i+1));
    }
  }

  function _incSideLine(l, dsx, dsy, dex, dey) {
    switch (l.type) {
      case 'line': {
        l.s.x += dsx;
        l.s.y += dsy;
        l.e.x += dex;
        l.e.y += dey;
        break;
      }
      case 'bezierCurve': {
        l.s.x += dsx;
        l.s.y += dsy;

        l.cp1.x += l.d * (dsx === 0 ? dex : dsx);
        l.cp1.y += l.d * (dsy === 0 ? dey : dsy);

        l.cp2.x += l.d * (dex === 0 ? dsx : dex);
        l.cp2.y += l.d * (dey === 0 ? dsy : dey);

        l.e.x += dex;
        l.e.y += dey;
        break;
      }
    }
  }

  function generateLinesWithOffset(lines, i, j) {
    lines = JSON.parse(JSON.stringify(lines));
    const xOffset = -i*gridCellWidth+tabHeight+tabVarHeight/2;
    const yOffset = -j*gridCellHeight+tabHeight+tabVarHeight/2;
    _recKek(lines, function (o, k, p, _i) {
      if (k === 'y') {
        p[k] = o+yOffset;
      } else if (k === 'x') {
        p[k] = o+xOffset;
      }
      // if (k === 's' || k === 'e' || k === 'cp1' || k === 'cp2') {
      //   p[k] = {...o, x: o.x+xOffset, y: o.y+yOffset};
      // }f
    });
    return lines;
  }

  const prevVP = {x: 0, y: 0}, prevHP = {x: 0, y: 0};

  const pointsCache = {};
  const cellsSides = {};

  let allCoords = [];
  for (let j = 0; j < gh; j++) {
    for (let i = 0; i < gw; i++) {
      allCoords.push([i, j]);
    }
  }
  allCoords = allCoords.map(i => [i, random()-0.5]).sort(([a, ra], [b, rb]) => ra-rb).map(([i, _]) => i);

  // puzzlePiecesContainer.style.transform = `scale(var(--pp-scale, 1.0))`;
  const ppHeight = puzzlePiecesContainer.dataset.ppHeight = gridCellHeight * puzzleScale;
  const ppWidth = puzzlePiecesContainer.dataset.ppWidth = gridCellWidth * puzzleScale;

  for (let j = 0; j < gh; j++) {
    for (let i = 0; i < gw; i++) {
      // const rs = () => 0; 
      const rs = randomShift;
      const points = pointsCache[`${i}:${j}`] = {
        topLeft: {
          x: i*gridCellWidth+(i === 0 ? 0 : rs()),
          y: j*gridCellHeight+(j === 0 ? 0 : rs()),
        },
        topRight: {
          x: (i+1)*gridCellWidth+(i === gw-1 ? 0 : rs()),
          y: j*gridCellHeight+(j === 0 ? 0 : rs()),
        },
        bottomRight: {
          x: (i+1)*gridCellWidth+(i === gw-1 ? 0 : rs()),
          y: (j+1)*gridCellHeight+(j === gh-1 ? 0 : rs()),
        },
        bottomLeft: {
          x: i*gridCellWidth+(i === 0 ? 0 : rs()),
          y: (j+1)*gridCellHeight+(j === gh-1 ? 0 : rs()),
        },
      };
      if (i > 0) {
        const cellToLeft = pointsCache[`${i-1}:${j}`];
        points.topLeft = cellToLeft.topRight;
        points.bottomLeft = cellToLeft.bottomRight;
      }
      if (j > 0) {
        const cellToTop = pointsCache[`${i}:${j-1}`];
        points.topLeft = cellToTop.bottomLeft;
        points.topRight = cellToTop.bottomRight;
      }
      const sides = cellsSides[`${i}:${j}`] = {
        top: (j > 0)
          ? generateReversedLines(cellsSides[`${i}:${j-1}`].bottom)
          : side('top', points.topLeft, points.topRight, i, j),
        right: side('right', points.topRight, points.bottomRight, i, j),
        bottom: side('bottom', points.bottomRight, points.bottomLeft, i, j),
        left: (i > 0)
          ? generateReversedLines(cellsSides[`${i-1}:${j}`].right)
          : side('left', points.bottomLeft, points.topLeft, i, j),
      };

      const lines = [
        ...sides.top,
        ...sides.right,
        ...sides.bottom,
        ...sides.left,
      ]

      ctx.save();
      ctx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
      ctx.beginPath();
      drawLines(ctx, lines);
      ctx.closePath();
      ctx.clip();
      ctx.lineWidth = 0;
      ctx.strokeStyle = 'black';  //lines[0].color;
      ctx.drawImage(imgEl, 0, 0);
      ctx.stroke();

      slicerCtx.clearRect(0, 0, slicerCanvas.width, slicerCanvas.height);
      slicerCtx.drawImage(gridCanvas,
                          i*gridCellWidth-tabHeight-tabVarHeight/2,
                          j*gridCellHeight-tabHeight-tabVarHeight/2,
                          slicerCanvas.width,
                          slicerCanvas.height,
                          0, 0,
                          slicerCanvas.width,
                          slicerCanvas.height)
      const puzzlePieceImg = document.createElement('img');
      makePuzzlePieceDraggable(puzzlePieceImg, {rotationAllowed, sounds});
      puzzlePieceImg.id = `pp:${i}:${j}`;
      if (i === 0 || j === 0 || i === gw-1 || j === gh-1) {
        puzzlePieceImg.classList.add('edge-piece');
      }
      // puzzlePieceImg.dataset.ppHeight = gridCellHeight * puzzleScale;
      // puzzlePieceImg.dataset.ppWidth = gridCellWidth * puzzleScale;
      // if (puzzleScale !== 1) {
      //   puzzlePieceImg.style.setProperty('--pp-scale', puzzleScale);
      // }
      puzzlePieceImg.src = slicerCanvas.toDataURL();
      const [rx, ry] = allCoords.pop();
      puzzlePieceImg.style.top = `${ry*gridCellHeight*puzzleScale-tabHeight-tabVarHeight/2}px`;
      puzzlePieceImg.style.left = `${rx*gridCellWidth*puzzleScale-tabHeight-tabVarHeight/2}px`;
      const clipPathLines = generateLinesWithOffset(lines, i, j);
      puzzlePieceImg.style.clipPath = `path("${convertLinesToSVG(clipPathLines)}")`;
      if (rotationAllowed) {
        const rotation = {0: 0, 1: 90, 2: 180, 3: 270}
        puzzlePieceImg.style.setProperty('--rotation', `${rotation[Math.floor(random()*4)]}deg`);
      }

      puzzlePiecesContainer.appendChild(puzzlePieceImg);

      ctx.restore();

      // const t = [0, 1];
      // if (i === t[0] && j == t[1]) {
      //   return ;
      // }
    }
  }

  ctx.drawImage(imgEl, 0, 0);
}


// UTILS

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
