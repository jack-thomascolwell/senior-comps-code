'use strict'

import Visualizer from './visualizer.js';

/*
Generates new ligand input with specified values
param eSigmaStart: target eSigma value, default empty
param ePiStart: target eSigma value, default empty
param xStart: target eSigma value, default empty
param yStart: target eSigma value, default empty
param zStart: target eSigma value, default empty
param eSigmaEnd: target eSigma value, default empty
param ePiEnd: target eSigma value, default empty
param xEnd: target eSigma value, default empty
param yEnd: target eSigma value, default empty
param zEnd: target eSigma value, default empty

param parent: target parent element, default #ligands
return: the new ligand element
*/
function newLigand({start: {eSigma:eSigmaStart='', ePi:ePiStart='', x:xStart='', y:yStart='', z:zStart=''}={}, end: {eSigma:eSigmaEnd='', ePi:ePiEnd='', x:xEnd='', y:yEnd='', z:zEnd=''}={}, parent: parent=document.getElementById('ligands')}={}) {
  const div = document.createElement('div');
  eSigmaEnd = eSigmaEnd || eSigmaStart;
  ePiEnd = ePiEnd || ePiStart;
  xEnd = xEnd || xStart;
  yEnd = yEnd || yStart;
  zEnd = zEnd || zStart;
  div.classList.add('ligand');
  div.innerHTML = `
    <div class="start">
      <div class="orderedPair position">
        <span class="parenthesis"></span>
        <div class="input">
          <input type="number" placeholder=" " name="x" value="${xStart}">
          <label>x</label>
          <span class="focus-border"></span>
        </div>
        <span class="separator"></span>
        <div class="input">
          <input type="number" placeholder=" " name="y" value="${yStart}">
          <label>y</label>
          <span class="focus-border"></span>
        </div>
        <span class="separator"></span>
        <div class="input">
          <input type="number" placeholder=" " name="z" value="${zStart}">
          <label>z</label>
          <span class="focus-border"></span>
        </div>
        <span class="parenthesis"></span>
      </div>
      <div class="energies">
        <div class="input">
          <input type="number" placeholder=" " name="eSigma" value="${eSigmaStart}">
          <label>e&sigma;</label>
          <span class="focus-border"></span>
        </div>
        <div class="input">
          <input type="number" placeholder=" " name="ePi" value="${ePiStart}">
          <label>e&pi;</label>
          <span class="focus-border"></span>
        </div>
      </div>
      <div class="delete"></div>
    </div>
    <div class="end">
      <div class="orderedPair position">
        <span class="parenthesis"></span>
        <div class="input">
          <input type="number" placeholder=" " name="x" value="${xEnd}">
          <label>x</label>
          <span class="focus-border"></span>
        </div>
        <span class="separator"></span>
        <div class="input">
          <input type="number" placeholder=" " name="y" value="${yEnd}">
          <label>y</label>
          <span class="focus-border"></span>
        </div>
        <span class="separator"></span>
        <div class="input">
          <input type="number" placeholder=" " name="z" value="${zEnd}">
          <label>z</label>
          <span class="focus-border"></span>
        </div>
        <span class="parenthesis"></span>
      </div>
      <div class="energies">
        <div class="input">
          <input type="number" placeholder=" " name="eSigma" value="${eSigmaEnd}">
          <label>e&sigma;</label>
          <span class="focus-border"></span>
        </div>
        <div class="input">
          <input type="number" placeholder=" " name="ePi" value="${ePiEnd}">
          <label>e&pi;</label>
          <span class="focus-border"></span>
        </div>
      </div>
      <div class="delete"></div>
    </div>
    `;

  Array.from(div.getElementsByClassName('delete')).forEach(del => {
    del.addEventListener('click', deleteListener(div));
  });

  Array.from(div.querySelectorAll('input')).forEach(input => {
    input.addEventListener('change', updateLigands);
    input.addEventListener('focusin', focusListener(div, false));
    input.addEventListener('focusout', focusListener(div, true));
  });
  parent.appendChild(div);
  updateLigands();
  return div;
}

/*
Parses ligand inputs and updates visualizer and url fragment
*/
function updateLigands() {
  let ligands = [];
  let fragment = [];

  const ligandElements = Array.from(document.getElementById('ligands').children);
  let selected=-1;
  let j=0;
  for (let i=0; i<ligandElements.length; i++) {
    const l = ligandElements[i]
    if (l.classList.contains('ligand')) {
      const xStart = parseFloat(l.querySelector('.start input[name="x"]').value);
      const yStart = parseFloat(l.querySelector('.start input[name="y"]').value);
      const zStart = parseFloat(l.querySelector('.start input[name="z"]').value);
      const eSigmaStart = parseFloat(l.querySelector('.start input[name="eSigma"]').value);
      const ePiStart = parseFloat(l.querySelector('.start input[name="ePi"]').value);

      let xEnd = parseFloat(l.querySelector('.end input[name="x"]').value);
      let yEnd = parseFloat(l.querySelector('.end input[name="y"]').value);
      let zEnd = parseFloat(l.querySelector('.end input[name="z"]').value);
      let eSigmaEnd = parseFloat(l.querySelector('.end input[name="eSigma"]').value);
      let ePiEnd = parseFloat(l.querySelector('.end input[name="ePi"]').value);

      if(isNaN(eSigmaStart) || isNaN(eSigmaEnd)) {
        eSigmaEnd = eSigmaStart;
        l.querySelector('.end input[name="eSigma"]').value = l.querySelector('.start input[name="eSigma"]').value;
      }

      if(isNaN(ePiStart) || isNaN(ePiEnd)) {
        ePiEnd = ePiStart;
        l.querySelector('.end input[name="ePi"]').value = l.querySelector('.start input[name="ePi"]').value;
      }

      const hasPositionStart = !isNaN(xStart) && !isNaN(yStart) && !isNaN(zStart);
      const hasPositionEnd = !isNaN(xEnd) && !isNaN(yEnd) && !isNaN(zEnd);
      if (hasPositionStart && !hasPositionEnd) {
        xEnd = xStart;
        yEnd = yStart;
        zEnd = zStart;
        l.querySelector('.end input[name="x"]').value = l.querySelector('.start input[name="x"]').value;
        l.querySelector('.end input[name="y"]').value = l.querySelector('.start input[name="y"]').value;
        l.querySelector('.end input[name="z"]').value = l.querySelector('.start input[name="z"]').value;
      }

      if (hasPositionStart) {
        if (document.getElementById('ligands').classList.contains('start')) ligands.push(new THREE.Vector3(xStart,yStart,zStart));
        else ligands.push(new THREE.Vector3(xEnd,yEnd,zEnd));
        if(l.classList.contains('selected')) selected=j;
        j++;
      }

      if (!isNaN(xStart) || !isNaN(yStart) || !isNaN(zStart) || !isNaN(eSigmaStart) || !isNaN(ePiStart) || !isNaN(xEnd) || !isNaN(yEnd) || !isNaN(zEnd) || !isNaN(eSigmaEnd) || !isNaN(ePiEnd))
        fragment.push([xStart,yStart,zStart,eSigmaStart,ePiStart,xEnd,yEnd,zEnd,eSigmaEnd,ePiEnd]);
    }
  }

  if(fragment.length != 0) window.location.hash = `#${btoa(JSON.stringify(fragment))}`;
  else window.location.hash = '';

  visualizer.setLigands(ligands, selected);
}

/*
Parses current fragment string and updates Ligands
*/
function parseFragment() {
  const fragmentString = window.location.hash.substring(1);
  const parent = document.getElementById('ligands');
  if (!fragmentString) {
    newLigand();
    return;
  }
  const fragment = JSON.parse(atob(fragmentString));
  Array.from(parent.querySelectorAll('.ligand')).forEach(l => {
    parent.removeChild(l);
  });

  if (fragment.length == 0) {
    newLigand();
    return;
  }

  fragment.forEach(l => {
    let [xStart, yStart, zStart, eSigmaStart, ePiStart, xEnd, yEnd, zEnd, eSigmaEnd, ePiEnd] = l.map(x=> {
      if (x===null) return '';
      return x;
    });
    newLigand({start: {eSigma: eSigmaStart, ePi: ePiStart, x: xStart, y: yStart, z: zStart}, end: {eSigma: eSigmaEnd, ePi: ePiEnd, x: xEnd, y: yEnd, z: zEnd}});
  });
  updateLigands();
}

/*
Listener to delete ligand on delete button click. Creates empty ligand if none left
param ligand: the .ligand parent element
return: callback function
*/
function deleteListener(ligand) {
  return (e=> {
    ligand.parentElement.removeChild(ligand);
    if (document.querySelectorAll('#ligands .ligand').length <= 0)
      newLigand();
    updateLigands();
  });
}

/*
Listener to highlight ligands on input focus
param ligand: the .ligand parent element
param unfoucs: boolean, is listening for focusout event
return: callback function
*/
function focusListener(ligand, unfocus=false) {
  if (unfocus) return (e=>{
    ligand.classList.remove('selected');
    updateLigands();
  });
  else return (e=>{
    ligand.classList.add('selected');
    updateLigands();
  });
}

const visualizer = new Visualizer(document.getElementById('visualizer'));
visualizer.running = true;
parseFragment();

/*
Add controls to show/hide orbitals
*/
{
  Array.from(document.getElementById('orbitals').getElementsByTagName('li')).forEach(li => {
    const name = li.dataset.name;
    if (name == 'show all') {
      li.addEventListener('click', e=> {
        visualizer.showOrbital('');
      });
      return;
    }

    if (name == 'hide all') {
      li.addEventListener('click', e=> {
        visualizer.hideOrbital('');
      });
      return;
    }

    if (name) li.addEventListener('click', e=> {
      if (!li.classList.contains('showing')) {
        visualizer.showOrbital(name);
        li.classList.add('showing');
      } else {
        visualizer.hideOrbital(name);
        li.classList.remove('showing');
      }
    });
  });
}

/*
Add controls to show/hide axes
*/
{
  document.getElementById('axes').addEventListener('click', e=> {
    visualizer.showAxes = !visualizer.showAxes;

  });
}

/*
Add controls to show/hide bonds
*/
{
  document.getElementById('bonds').addEventListener('click', e=> {
    visualizer.bonds = !visualizer.bonds;
  });
}

/*
Add controls to set view
*/
Array.from(document.querySelectorAll('#view .dropdown_menu li:not(.dropdown__divider)')).forEach(li => {
  const [x,y,z] = JSON.parse(li.dataset.view || "[1,1,1]");
  const position = new THREE.Vector3(x,y,z);
  if (li.dataset.reset === undefined) li.addEventListener('click', e=> {
    visualizer.view = position;
  });
  else li.addEventListener('click', e=> {
    visualizer.view = position;
    visualizer.autoRotate = true;
  })
});

/*
Add controls to auto rotate
*/
{
  document.getElementById('rotate').addEventListener('click', e=> {
    visualizer.autoRotate = !visualizer.autoRotate;
  });
}

/*
Add controls to add new ligands
*/
Array.from(document.querySelectorAll('#newLigand .dropdown_menu li:not(.dropdown__divider)')).forEach(li => {
  const eSigma = li.dataset.esigma || '';
  const ePi = li.dataset.epi || '';
  li.addEventListener('click', e=> {
    newLigand({start: {eSigma, ePi}, end: {eSigma, ePi}});
  });
});

/*
Add controls to switch between start/end positions
*/
document.getElementById('startEnd').addEventListener('click', e => {
  document.getElementById('ligands').classList.toggle('start');
  updateLigands();
});

document.getElementById('newLigand').getElementsByClassName('dropdown_button')[0].addEventListener('click', e=> {
  newLigand();
});
