

let globalPPZIndex = 2;
let globalGroupId = 1;

function makePuzzlePieceDraggable(ppEl, {rotationAllowed = true, sounds = true} = {}) {
  const ppSize = () => [+ppEl.parentElement.dataset.ppHeight, +ppEl.parentElement.dataset.ppWidth];
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0, pos5 = 0, pos6 = 0;
  let selectedEls = [];
  ppEl.onmousedown = onMouseDown;
  // ppEl.onclick = onClick;
  if (rotationAllowed) {
    ppEl.oncontextmenu = onRightClick;
  }

  let mouseMoved = false;
  let justSelected = false;

  // 'mousedown click mousemove mouseup contextmenu'.split(' ').forEach(eventType => {
  //   ppEl.addEventListener(eventType, (e) => {
  //     console.log(eventType);
  //   });
  // });

  ppEl.onclick = function (e) {
    if (e.ctrlKey && !justSelected && !mouseMoved) {
      deselect(ppEl);
    }
    mouseMoved = false;
  };

  function onMouseDown(e) {
    if (e.shiftKey || e.altKey) {
      return;
    }
    if (!e.ctrlKey && !ppEl.classList.contains('selected')) {
      clearSelection();
    }

    if (!ppEl.classList.contains('selected')) {
      select(ppEl);
      justSelected = true;
    } else {
      justSelected = false;
    }

    // ppEl.style.zIndex = globalPPZIndex++;

    // // todo: kostyl (see: mouse move when selecting area)
    // ppEl.parentElement.querySelectorAll('.selected').forEach(el => { 
    //   selectByGroup(el.dataset.group);
    // });

    const zIndex = globalPPZIndex++;
    selectedEls = Array.from(ppEl.parentElement.querySelectorAll('.selected')).map(el => { 
      el.style.zIndex = zIndex;
      return el
    });

    e = e || window.event;
    e.preventDefault();
    e.stopPropagation();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    pos5 = e.layerX;
    pos6 = e.layerY;
    document.onmouseup = onMouseUp;
    // call a function whenever the cursor moves:
    document.onmousemove = onMouseMove;
  }

  function onRightClick(e) {
    if (!e.ctrlKey) {
      clearSelection({exclude: [ppEl, ...ppEl.parentElement.querySelectorAll(`[data-group="${ppEl.dataset.group}"]`)]});
    }
    if (sounds()) {
      rotateSoundEl.stop();
      rotateSoundEl.play();
    }

    const centerRotation = parseRDeg(ppEl);
    if (ppEl.dataset.group) {
      const groupMembers = Array.from(
        ppEl.parentElement
        .querySelectorAll(`[data-group="${ppEl.dataset.group}"]`)
      );
      rotateCells(ppEl, centerRotation, groupMembers, ...ppSize());
      // console.log('rotate.changes:', changes);
    } else {
      console.log('kek', ppEl.id, centerRotation, centerRotation + 90 + 'deg');
      const newRotation = centerRotation + 90;

      e.target.style.setProperty('--rotation', `${newRotation}deg`);
      // e.target.style['--rotation'] = `${newRotation}deg`;
      // e.target.style.transform = newRotation;
    }
    e.stopPropagation();
    return false;
  }

  function onMouseMove(e) {
    e = e || window.event;
    e.preventDefault();
    // console.log(e);
    // console.log(document.elementFromPoint(e.clientX, e.clientY));
    // calculate the new cursor position:
    mouseMoved = true;
    const { scale } = pzGCC.getTransform();
    pos1 = (pos3 - e.clientX) / scale;
    pos2 = (pos4 - e.clientY) / scale;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    // ppEl.style.top = (ppEl.offsetTop - pos2) + "px";
    // ppEl.style.left = (ppEl.offsetLeft - pos1) + "px";

    selectedEls.forEach(el => {
        // if (el === ppEl) {
        //   // do not add delta to same pp
        //   return;
        // }
        // console.log(el.dataset, el);
        el.style.top = `${(el.offsetTop - pos2)}px`;
        el.style.left = `${(el.offsetLeft - pos1)}px`;
      });
    // const { group } = ppEl.dataset;

    // if (group) {
    //   ppEl.parentElement
    //     .querySelectorAll(`[data-group="${group}"], .selected`)
    //     .forEach(el => {
    //       if (el === ppEl) {
    //         // do not add delta to same pp
    //         return;
    //       }
    //       // console.log(el.dataset, el);
    //       el.style.top = `${(el.offsetTop - pos2)}px`;
    //       el.style.left = `${(el.offsetLeft - pos1)}px`;
    //     });
    // } else {
    //   // console.log('not in group', ppEl);
    // }
  }

  function onMouseUp() {

    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;

    // 'pp:{x}:{y}'


    let [ppHeight, ppWidth] = ppSize();

    // todo: 
    const errorDelta = (ppHeight+ppWidth) * 0.05;

    const groupMembers = ppEl.parentElement
      .querySelectorAll(`[data-group="${ppEl.dataset.group}"]`);

    const itGroupMembers = new Set(groupMembers.length === 0 ? [ppEl] : groupMembers);

    itGroupMembers.forEach(el => {
      const [_, x, y] = el.id.split(':').map(Number);

      const elRotation = parseRDeg(el);

      // console.log(el);
      [
        // normal orientation
        [0, 0, -1, 0, -ppHeight, 'top'],
        [0, -1, 0, -ppWidth, 0, 'left'],
        [0, 0, 1, 0, ppHeight, 'bottom'],
        [0, 1, 0, ppWidth, 0, 'right'],
        // 90deg
        [90, 0, -1, ppHeight, 0, 'top'],
        [90, -1, 0, 0, -ppWidth, 'left'],
        [90, 0, 1, -ppHeight, 0, 'bottom'],
        [90, 1, 0, 0, ppWidth, 'right'],
        // 180deg
        [180, 0, -1, 0, ppHeight, 'top'],
        [180, -1, 0, ppWidth, 0, 'left'],
        [180, 0, 1, 0, -ppHeight, 'bottom'],
        [180, 1, 0, -ppWidth, 0, 'right'],
        // 270deg
        [270, 0, -1, -ppHeight, 0, 'top'],
        [270, -1, 0, 0, ppWidth, 'left'],
        [270, 0, 1, ppHeight, 0, 'bottom'],
        [270, 1, 0, 0, -ppWidth, 'right'],

      ].forEach(([rotation, dix, diy, hOffset, vOffset, side]) => {


        const siblingPP = el.parentElement.querySelector(`#pp\\:${x+dix}\\:${y+diy}`);
        if (siblingPP === null) {
          // edge PP
          return;
        }

        const siblingPPRotation = parseRDeg(siblingPP);

        const siblingPPGroup = siblingPP.dataset.group;
        const currentPPGroup = el.dataset.group;

        if (currentPPGroup !== null && siblingPPGroup === currentPPGroup) {
          // already in same group
          return;
        }

        if (!(
          siblingPPRotation % 360 === rotation && elRotation % 360 === rotation
          && ((Math.abs(el.offsetLeft - siblingPP.offsetLeft + hOffset)) < errorDelta)
          && ((Math.abs(el.offsetTop - siblingPP.offsetTop + vOffset)) < errorDelta)
        )) {
          // rotation is differenct or distance is too far
          return;
        }

        // found one!
        // console.log('linked:', el.id, '+', siblingPP.id, side)

        if (sounds()) {
          clutchSoundEl.stop();
          clutchSoundEl.play();
        }

        let group;
        if (siblingPPGroup && !currentPPGroup) {
          group = el.dataset.group = siblingPPGroup;
        } else if (currentPPGroup && !siblingPPGroup) {
          group = siblingPP.dataset.group = currentPPGroup;
        } else if (!currentPPGroup && !siblingPPGroup) {
          group = siblingPP.dataset.group = el.dataset.group = globalGroupId++;
        } else if (siblingPPGroup && currentPPGroup) {
          group = siblingPPGroup;
          itGroupMembers.forEach(el => {el.dataset.group = siblingPPGroup});
        } else {
          throw new Error();
        }

        selectByGroup(group);

        el.classList.add('linked');
        siblingPP.classList.add('linked');

        const topOffsetToMove = el.offsetTop - (siblingPP.offsetTop-vOffset);
        const leftOffsetToMove = el.offsetLeft - (siblingPP.offsetLeft-hOffset);

        const maxZIndex = Math.max(+siblingPP.style.zIndex || 0, +el.style.zIndex || 0);

        itGroupMembers.forEach(currentGroupPPEl => {
          Object.assign(currentGroupPPEl.style, {
            top: `${currentGroupPPEl.offsetTop - topOffsetToMove}px`,
            left: `${currentGroupPPEl.offsetLeft - leftOffsetToMove}px`,
          });
        });

        // add new elements to current group
        Array.from(ppEl.parentElement.querySelectorAll(`[data-group="${group}"]`)).forEach(el => itGroupMembers.add(el));

        itGroupMembers.forEach(el => el.style.zIndex = maxZIndex);

        updateProgressStats();
      });
    });

    const children = ppEl.parentElement.children;
    let complete = true;
    for (let i = 0; i < children.length; i++) {
      if (!ppEl.dataset.group || children[i].dataset.group !== ppEl.dataset.group) {
        complete = false;
        break;
      }
    }
    if (complete) {
      completeTime = Date.now();
      imgEl.classList.add('completed');
      if (sounds() && !winSoundEl.dataset.played) {
        winSoundEl.play();
        winSoundEl.volume = 0.4;
        winSoundEl.dataset.played = 1;
      }
    }
  }
}