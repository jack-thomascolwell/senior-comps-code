/*
Helper file for buttons
*/
function addToggleCallbacks(parent) {
  Array.from(parent.querySelectorAll('.button.toggle')).forEach(b=> {
    if (Boolean(b.dataset.hasListeners)) return;

    b.addEventListener('click', e => {
      b.classList.toggle('selected');
    });

    b.dataset.hasListeners = true;
  });
}

addToggleCallbacks(document);

export default addToggleCallbacks;
