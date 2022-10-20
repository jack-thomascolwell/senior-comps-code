Array.from(document.getElementsByClassName('dropdown')).forEach(d=> {
  const f = (e => {
    Array.from(document.getElementsByClassName('dropdown')).forEach(d2 => {
      if (d2 != d)
        d2.classList.remove('expanded');
    });
    d.classList.toggle('expanded');
    e.stopPropagation();
  });
  if (d.classList.contains('persist')) Array.from(d.getElementsByTagName('li')).forEach(li => {
    li.addEventListener('click', e => {
      e.stopPropagation();
    });
  });

  if (!d.classList.contains('discrete')) d.getElementsByClassName('dropdown_button')[0].addEventListener('click', f);
  d.getElementsByClassName('dropdown_arrow')[0].addEventListener('click', f);
});

document.body.addEventListener('click', e=> {
  Array.from(document.getElementsByClassName('dropdown')).forEach(d => {
    d.classList.remove('expanded');
  });
});
