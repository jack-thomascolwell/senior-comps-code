Array.from(document.querySelectorAll('.button.toggle')).forEach(b=> {
  b.addEventListener('click', e => {
    b.classList.toggle('selected');
  });
});
