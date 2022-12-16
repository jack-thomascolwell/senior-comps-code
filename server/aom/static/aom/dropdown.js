/*
Helper file for dropdown menus
*/
function addDropdownCallbacks(parent) {
  Array.from(parent.getElementsByClassName('dropdown')).forEach(d => {
    const f = (e => {
      const target = !d.classList.contains('expanded');
      Array.from(document.getElementsByClassName('dropdown')).forEach(d2 => {
        d2.classList.remove('expanded');
      });
      d.classList.toggle('expanded',target);
      e.stopPropagation();
    });

    if (d.classList.contains('persist')) Array.from(d.getElementsByTagName('li')).forEach(li => {
      li.addEventListener('click', e => {
        e.stopPropagation();
      });
    });

    if (Boolean(d.dataset.hasListeners)) return;

    if (!d.classList.contains('discrete')) d.getElementsByClassName('dropdown_button')[0].addEventListener('click', f);
    d.getElementsByClassName('dropdown_arrow')[0].addEventListener('click', f);

    d.dataset.hasListeners = true;
  });
}

addDropdownCallbacks(document);

document.body.addEventListener('click', e=> {
  Array.from(document.getElementsByClassName('dropdown')).forEach(d => {
    d.classList.remove('expanded');
  });
});

export default addDropdownCallbacks;
