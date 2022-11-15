function addToggleCallbacks(parent) {
  Array.from(parent.querySelectorAll('.button.toggle')).forEach(b=> {
    b.addEventListener('click', e => {
      b.classList.toggle('selected');
    });
  });
}

addToggleCallbacks(document);

export default addToggleCallbacks;
