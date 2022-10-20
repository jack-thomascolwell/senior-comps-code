'use strict'

import Visualizer from './visualizer.js';

/*
Generates new ligand input with specified values
param eSigma: target eSigma value, default empty
param ePi: target eSigma value, default empty
param x: target eSigma value, default empty
param y: target eSigma value, default empty
param z: target eSigma value, default empty
param parent: target parent element, default #ligands
return: the new ligand element
*/
function newLigand({eSigma:eSigma='', ePi:ePi='', x:x='', y:y='', z:z='', parent: parent=document.getElementById('ligands')}={}) {
  const div = document.createElement('div');
  div.classList.add('ligand');
  div.innerHTML = `
    <div class="orderedPair position">
      <span class="parenthesis"></span>
      <div class="input">
        <input type="number" placeholder=" " name="x" value="${x}">
        <label>x</label>
        <span class="focus-border"></span>
      </div>
      <span class="separator"></span>
      <div class="input">
        <input type="number" placeholder=" " name="y" value="${y}">
        <label>y</label>
        <span class="focus-border"></span>
      </div>
      <span class="separator"></span>
      <div class="input">
        <input type="number" placeholder=" " name="z" value="${z}">
        <label>z</label>
        <span class="focus-border"></span>
      </div>
      <span class="parenthesis"></span>
    </div>
    <div class="energies">
      <div class="input">
        <input type="number" placeholder=" " name="eSigma" value="${eSigma}">
        <label>e&sigma;</label>
        <span class="focus-border"></span>
      </div>
      <div class="input">
        <input type="number" placeholder=" " name="ePi" value="${ePi}">
        <label>e&pi;</label>
        <span class="focus-border"></span>
      </div>
    </div>
    <div class="delete"></div>`;

    const del = div.querySelector('.delete');
    del.addEventListener('click', deleteListener(div));
    Array.from(div.querySelectorAll('input')).forEach(input => {
      input.addEventListener('change', updateLigands);
    });

    Array.from(div.querySelectorAll('input')).forEach(input => {
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
      const x = parseFloat(l.querySelector('input[name="x"]').value);
      const y = parseFloat(l.querySelector('input[name="y"]').value);
      const z = parseFloat(l.querySelector('input[name="z"]').value);
      const eSigma = parseFloat(l.querySelector('input[name="eSigma"]').value);
      const ePi = parseFloat(l.querySelector('input[name="ePi"]').value);
      if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
        ligands.push(new THREE.Vector3(x,y,z));
        if(l.classList.contains('selected')) selected=j;
        j++;
      }

      if (!isNaN(x) || !isNaN(y) || !isNaN(z) || eSigma || ePi)
        fragment.push([x,y,z,eSigma,ePi]);
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
    let [x, y, z, eSigma, ePi] = l.map(x=> {
      if (x===null) return '';
      return x;
    });
    newLigand({eSigma, ePi, x, y, z});
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
  let showingOrbital = '';
  Array.from(document.getElementById('orbitals').getElementsByTagName('li')).forEach(li => {
    const name = li.dataset.name;
    if (name) li.addEventListener('click', e=> {
      if (showingOrbital == name) {
        visualizer.showOrbital();
        showingOrbital = '';
      } else {
        visualizer.showOrbital(name);
        showingOrbital = name;
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
    newLigand({eSigma, ePi});
  });
});

document.getElementById('newLigand').getElementsByClassName('dropdown_button')[0].addEventListener('click', e=> {
  newLigand();
});
