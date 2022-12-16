(() => {
const prev = document.getElementById('prev');
const next = document.getElementById('next');
const pageCounter = document.getElementById('page');
const pages = Array.from(document.getElementsByClassName('page'));
let page = 1;

function updatePage() {
  pages.forEach(p => {
    p.classList.remove('active');
  });
  pages[page-1].classList.add('active');
  pageCounter.innerHTML = `${page}/${pages.length}`;
}

prev.addEventListener('click', ()=> {
  page = Math.max(1, page - 1);
  updatePage();
});

next.addEventListener('click', ()=> {
  page = Math.min(pages.length, page + 1);
  updatePage();
});

updatePage();

})();
