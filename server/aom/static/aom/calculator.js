'use strict'

import Visualizer from './visualizer.js';
import Plot from './plot.js';

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
  if (eSigmaEnd==='') eSigmaEnd = eSigmaStart;
  if (ePiEnd==='') ePiEnd = ePiStart;
  if (xEnd==='') xEnd = xStart;
  if (yEnd==='') yEnd = yStart;
  if (zEnd==='') zEnd = zStart;
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
      <!--<i class="reset fa-solid fa-arrow-rotate-left"></i>-->
      <i class="delete fa-solid fa-x"></i>
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
      <!-- <i class="reset fa-solid fa-arrow-rotate-left"></i> -->
      <i class="delete fa-solid fa-x"></i>
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
f: fraction between start and end (-1 if in input phase)
return: an object containing the positions and energies of all ligands
*/
function updateLigands(f=-1) {
  if (f != -1) {
    let ligands = [];
    const ligandElements = Array.from(document.getElementById('ligands').getElementsByClassName('ligand'));
    let j=0;
    for (let i=0; i<ligandElements.length; i++) {
      const l = ligandElements[i]
      let xStart = parseFloat(l.querySelector('.start input[name="x"]').value);
      let yStart = parseFloat(l.querySelector('.start input[name="y"]').value);
      let zStart = parseFloat(l.querySelector('.start input[name="z"]').value);

      let xEnd = parseFloat(l.querySelector('.end input[name="x"]').value);
      let yEnd = parseFloat(l.querySelector('.end input[name="y"]').value);
      let zEnd = parseFloat(l.querySelector('.end input[name="z"]').value);

      const hasPositionStart = !isNaN(xStart) && !isNaN(yStart) && !isNaN(zStart);
      const hasPositionEnd = !isNaN(xEnd) && !isNaN(yEnd) && !isNaN(zEnd);

      // Start position but no end position => e <- s
      if (hasPositionStart && !hasPositionEnd) {
        xEnd = xStart;
        yEnd = yStart;
        zEnd = zStart;
      }

      if (hasPositionStart) {
        const start = new THREE.Vector3(xStart, yStart, zStart);
        start.normalize();
        const end = new THREE.Vector3(xEnd, yEnd, zEnd);
        end.normalize();
        start.multiplyScalar(f);
        end.multiplyScalar(1-f);
        ligands.push(start.clone().add(end));
      }
    }
    visualizer.setLigands(ligands, -1);
  } else {
    let ligands = [];
    let fragment = [];
    let request = {
      start: [],
      end: []
    };

    const ligandElements = Array.from(document.getElementById('ligands').getElementsByClassName('ligand'));
    let selected=-1;
    let j=0;
    for (let i=0; i<ligandElements.length; i++) {
      const l = ligandElements[i]
      let xStart = parseFloat(l.querySelector('.start input[name="x"]').value);
      let yStart = parseFloat(l.querySelector('.start input[name="y"]').value);
      let zStart = parseFloat(l.querySelector('.start input[name="z"]').value);
      let eSigmaStart = parseFloat(l.querySelector('.start input[name="eSigma"]').value);
      let ePiStart = parseFloat(l.querySelector('.start input[name="ePi"]').value);

      let xEnd = parseFloat(l.querySelector('.end input[name="x"]').value);
      let yEnd = parseFloat(l.querySelector('.end input[name="y"]').value);
      let zEnd = parseFloat(l.querySelector('.end input[name="z"]').value);
      let eSigmaEnd = parseFloat(l.querySelector('.end input[name="eSigma"]').value);
      let ePiEnd = parseFloat(l.querySelector('.end input[name="ePi"]').value);

      // Start but not end => end <- start
      if(!isNaN(eSigmaStart) && isNaN(eSigmaEnd)) {
        eSigmaEnd = eSigmaStart;
        l.querySelector('.end input[name="eSigma"]').value = eSigmaEnd;
      }

      if(!isNaN(ePiStart) && isNaN(ePiEnd)) {
        ePiEnd = ePiStart;
        l.querySelector('.end input[name="ePi"]').value = ePiEnd;
      }

      // End but not start => start, end <- NaN
      if(isNaN(eSigmaStart) && !isNaN(eSigmaEnd)) {
        eSigmaStart = NaN;
        eSigmaEnd = NaN
        l.querySelector('.start input[name="eSigma"]').value = '';
        l.querySelector('.end input[name="eSigma"]').value = '';
      }

      if(isNaN(ePiStart) && !isNaN(ePiEnd)) {
        ePiStart = NaN;
        ePiEnd = NaN
        l.querySelector('.start input[name="ePi"]').value = '';
        l.querySelector('.end input[name="ePi"]').value = '';
      }

      const hasPositionStart = !isNaN(xStart) && !isNaN(yStart) && !isNaN(zStart);
      const hasPositionEnd = !isNaN(xEnd) && !isNaN(yEnd) && !isNaN(zEnd);

      // Start position but no end position => e <- s
      if (hasPositionStart && !hasPositionEnd) {
        xEnd = xStart;
        yEnd = yStart;
        zEnd = zStart;
        l.querySelector('.end input[name="x"]').value = l.querySelector('.start input[name="x"]').value;
        l.querySelector('.end input[name="y"]').value = l.querySelector('.start input[name="y"]').value;
        l.querySelector('.end input[name="z"]').value = l.querySelector('.start input[name="z"]').value;
      }

      // Has end position but no start position => (missing values set to zero)
      if (!hasPositionStart && hasPositionEnd) {
        if (isNaN(xStart)) xStart = 0;
        if (isNaN(yStart)) yStart = 0;
        if (isNaN(zStart)) zStart = 0;
        l.querySelector('.start input[name="x"]').value = xStart;
        l.querySelector('.start input[name="y"]').value = yStart;
        l.querySelector('.start input[name="z"]').value = zStart;
      }

      if (hasPositionStart) {
        if (document.getElementById('ligands').classList.contains('start')) ligands.push(new THREE.Vector3(xStart,yStart,zStart));
        else ligands.push(new THREE.Vector3(xEnd,yEnd,zEnd));
        if(l.classList.contains('selected')) selected=j;
        j++;
      }

      if (!isNaN(xStart) || !isNaN(yStart) || !isNaN(zStart) || !isNaN(eSigmaStart) || !isNaN(ePiStart) || !isNaN(xEnd) || !isNaN(yEnd) || !isNaN(zEnd) || !isNaN(eSigmaEnd) || !isNaN(ePiEnd))
        fragment.push([xStart,yStart,zStart,eSigmaStart,ePiStart,xEnd,yEnd,zEnd,eSigmaEnd,ePiEnd]);

      if (hasPositionStart) {
        if (isNaN(eSigmaStart)) eSigmaStart = 0;
        if (isNaN(eSigmaEnd)) eSigmaEnd = 0;
        if (isNaN(ePiStart)) ePiStart = 0;
        if (isNaN(ePiEnd)) ePiEnd = 0;

        request.start.push([xStart,yStart,zStart,eSigmaStart,ePiStart]);
        request.end.push([xEnd,yEnd,zEnd,eSigmaEnd,ePiEnd]);
      }
    }

    if(fragment.length != 0) window.location.hash = `#${btoa(JSON.stringify(fragment))}`;
    else window.location.hash = '';

    visualizer.setLigands(ligands, selected);
    return request;
  }
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
window.parseFragment = parseFragment;

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

/*
Extracts ligand data and performs calculation
return: false if no input
*/
function compute() {
  let {start, end} = updateLigands();
  if (start.length <= 0) return false;
  const query = new URLSearchParams();
  for (let l of start) query.append('start',l.join(','));
  for (let l of end) query.append('end',l.join(','));
  fetch(window.calculateURL + '?'+ query).then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
      return false;
    }
    response.json().then(json => {
      Object.keys(json).forEach(k => {
        json[k] = JSON.parse(json[k]);
      });
      console.log(json);
      if (plot === undefined) {
        plot = new Plot(json, document.getElementById('plot'), updateLigands);
        window.plot = plot;
      }
      else plot.data = json;
      document.getElementById('calculator').classList.add('output');
      document.getElementById('compute').innerHTML = 'new input';
    });
  });
}

document.getElementById('compute').addEventListener('click', () => {
  if (document.getElementById('calculator').classList.contains('output')) {
    document.getElementById('calculator').classList.remove('output')
    document.getElementById('compute').innerHTML = '&nbsp;compute&nbsp;';
    document.getElementById('plot').innerHTML = '';
    plot = undefined;
  } else compute();
});

window.compute = compute;
window.updateLigands = updateLigands;

let plot;

const visualizer = new Visualizer(document.getElementById('visualizer'));
visualizer.running = true;
parseFragment();

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
