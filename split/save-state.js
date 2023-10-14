

const SAVE_STATE_KEY = 'save-state';
const SAVE_STATE_IMG_KEY = 'save-state-image';

function checkSavedStateExists() {
  return localStorage.hasOwnProperty(SAVE_STATE_KEY) && localStorage.hasOwnProperty(SAVE_STATE_IMG_KEY);
}

function _saveState() {
  localStorage.setItem(SAVE_STATE_IMG_KEY, gridCanvas.toDataURL());

  const { x, y, scale: zoom } = pzGCC.getTransform();
  const data = { 
    seedString: currentSeedString, 
    panzoom: { x, y, zoom },
    controls: getControlsValues(),
    globalGroupId,
    globalPPZIndex,
    ppInfo: Array.from(puzzlePiecesContainer.children).map(el => {
      const { id, offsetTop: top, offsetLeft: left } = el;
      return {
        id, top, left,
        rotation: parseRDeg(el),
        group: el.dataset.group,
        selected: el.classList.contains('selected'),
        zIndex: el.style.zIndex,
      };
    }),
  };
  localStorage.setItem(SAVE_STATE_KEY, JSON.stringify(data));
}

function _restoreState() {
  const { 
    seedString, ppInfo = [], panzoom, 
    controls: controlsValues,
    globalGroupId: globalGroupIdFromState, 
    globalPPZIndex: globalPPZIndexFromState, 
  } = JSON.parse(localStorage.getItem(SAVE_STATE_KEY));

  globalPPZIndex = globalPPZIndexFromState;
  globalGroupId = globalGroupIdFromState;
  currentSeedString = seedString;

  if (controlsValues) setControlsValues(controlsValues);

  cutImageToPieces({ seedString });

  ppInfo.forEach(({ id, rotation, top, left, group, selected, zIndex }) => {
    const ppEl = document.getElementById(id);
    Object.assign(ppEl.style, {
      top: `${top}px`,
      left: `${left}px`,
      zIndex,
    });
    ppEl.style.setProperty('--rotation', `${rotation}deg`)
    if (group) ppEl.dataset.group = group;
    if (selected) ppEl.classList.add('selected');
  });
  initPanzoom(panzoom);
  updateProgressStats();
}

function restoreState({ requireConfirmation = true } = {}) {
  if (!checkSavedStateExists()) return;
  if (requireConfirmation && checkSavedStateExists() && !confirm('Are you sure you want to restore previous saved state? (current progress will be lost)')) return;
  const savedImageData = localStorage.getItem(SAVE_STATE_IMG_KEY);
  document.body.classList.add('loading');
  function evf() {
    document.body.classList.remove('loading');
    imgEl.removeEventListener('load', evf);
    _restoreState();
  };
  imgEl.addEventListener('load', evf);
  imgEl.src = savedImageData;
}

function saveState() {
  if (checkSavedStateExists() && !confirm('You have previously saved state, are you sure you want to rewrite it?')) return;
  document.body.classList.add('loading');
  try {
    _saveState();
  } catch (e) {
    alert('Sorry, could not save game state (most likely image size is too big)');
  } finally {
    setTimeout(() => document.body.classList.remove('loading'), 200);
  }
}

document.addEventListener('DOMContentLoaded', (e) => {
  restoreState({ requireConfirmation: false });
});
