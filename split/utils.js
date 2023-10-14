
function throttle(ms, f, { argsType = 'last' } = {}) {
  let throttlePause;
  let lastArgs = null;

  const _throttle = (...args) => {
    if (throttlePause) {
      switch (argsType) {
        case 'last': {
          lastArgs = args; 
          break;
        };
        default: throw new Error('other args types option not supported yet')
      }
      return;
    };
    throttlePause = true;
    setTimeout(() => {
      f(...lastArgs);
      throttlePause = false;
    }, ms);
  };
  return _throttle;
}


/**
 * calls passed function every time but gives a flag when to throttle
 * as first argument.
 **/
function halfThrottle(ms, f, { argsType = 'last' } = {}) { 
  let throttlePause;
  let lastArgs = null;

  const _throttle = (...args) => {
    if (throttlePause) {
      switch (argsType) {
        case 'last': {
          lastArgs = args; 
          break;
        };
        default: throw new Error('other args types option not supported yet')
      }
      return f(false, ...args);
    };
    throttlePause = true;
    setTimeout(() => {
      f(true, ...(lastArgs || args));
      throttlePause = false;
    }, ms);
  };
  return _throttle;
}


function randomColor(a) {
  const r = Math.round(Math.random() * 256);
  const g = Math.round(Math.random() * 256);
  const b = Math.round(Math.random() * 256);
  if (!a) {
    a = Math.random();
  }
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

const numberValue = s => +[...s].filter(ch => '0123456789-.'.includes(ch)).join('');

const parseRDeg = el => {
  const v = numberValue(el.style.getPropertyValue('--rotation'));
  // console.log(el.id, el.style.getPropertyValue('--rotation'), '->', v)
  return v;
}


function rotateCells(center, centerRotation, cells, ppHeight, ppWidth) {

  // function _printMatrix(m) {
  //   console.log(m.map(l => {
  //     return l.map(i => {
  //       return `${i ? i.innerText ? i.innerText : 'x' :  '-'}`
  //     }).join(' ');
  //   }).join('\n'));
  // }

  let delta = 0;
  // let ppWidth = +center.dataset.ppWidth,
  //       ppHeight = +center.dataset.ppHeight;
  if ([90, 270].includes(centerRotation%360)) {
    [ppWidth, ppHeight] = [ppHeight, ppWidth];
  }
  const [cx, cy] = [center.offsetLeft / ppWidth, center.offsetTop / ppHeight].map(Math.round);
  cells.forEach(el => {
    if (el === center) return;
    const [x, y] = [el.offsetLeft / ppWidth, el.offsetTop / ppHeight].map(Math.round);
    const [xDelta, yDelta] = [cx - x, cy - y].map(Math.abs)
    if (delta < xDelta) {
      delta = xDelta;
    }
    if (delta < yDelta) {
      delta = yDelta;
    }
  });
  const mSize = delta*2+1;
  const m = new Array(mSize).fill(0).map(x => Array(mSize).fill(null));
  m[delta][delta] = center;

  cells.forEach(el => {
    if (el === center) return;

    const [x, y] = [el.offsetLeft / ppWidth, el.offsetTop / ppHeight].map(Math.round);
    // console.log(el.id, delta, x, y);
    // console.log(delta, y, x, m);
    m[delta-(cy-y)][delta-(cx-x)] = el;
  });

  const degrees = -90;

  let cmds;
  switch(degrees) {
    case 90: {
      cmds = 'TRy';
      break;
    }
    case 270:
    case -90: {
      cmds = 'TRx';
      break;
    }
    case 180: {
      cmds = 'RyRx';
      break;
    }
    default: {
      throw new Error();
    }
  }

  const mhl = Math.floor(m.length/2);
  for (let k = 0; k < cmds.length; k++) {
    // console.log(k, cmds[k] === 'R' ? cmds.slice(k, k+2) : cmds[k]);
    switch(cmds[k]) {
      case 'T': {
        for (let i = 0; i < m.length; i++) {
          for (let j = 0; j < i; j++) {
            [m[i][j], m[j][i]] = [m[j][i], m[i][j]];
          }
        }
        break;
      }
      case 'R': {
        const axis = cmds[++k];
        if (axis === 'y') {
          m.reverse();
        } else if (axis === 'x') {
          for (let i = 0; i < mhl; i++) {
            for (let j = 0; j < m.length; j++) {
              [m[j][i], m[j][m.length-i-1]] = [m[j][m.length-i-1], m[j][i]];
            }
          }
        }

      }
    }
  }

  [ppWidth, ppHeight] = [ppHeight, ppWidth];
  const newRotation = centerRotation + 90;
  console.log()
  m.forEach((l, j) => {
    l.forEach((item, i) => {
      if (item === null) return;
      item.style.top = `${center.offsetTop + (j-mhl)*ppHeight}px`;
      item.style.left = `${center.offsetLeft + (i-mhl)*ppWidth}px`;
      item.style.setProperty('--rotation', `${newRotation}deg`)
      // item.style['--rotation'] = `${newRotation}deg`;
      // item.style.transform = `rotate(${newRotation}deg)`;
    });
  });
}