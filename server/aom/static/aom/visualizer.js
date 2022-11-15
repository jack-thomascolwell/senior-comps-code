'use strict'
import orbitalPositions from '/static/aom/orbitals.json' assert {type: 'json'};
import addDropdownCallbacks from './dropdown.js';
import addToggleCallbacks from './button.js';

export default class Visualizer {
  #ligands = [];
  #animationFrame;
  #orbitals;
  #bonds = true;
  #axesLabel;
  #controlsElement;

  static #ligandColor = new THREE.Color(0x808080);
  static #orbitalColor = new THREE.Color(0x303050);
  static #selectedColor = new THREE.Color(0x4040bf);
  static #axesColors = {
    x: new THREE.Color("hsl(0, 75%, 50%)"),
    y: new THREE.Color("hsl(120, 75%, 50%)"),
    z: new THREE.Color("hsl(240, 75%, 50%)"),
  };

  static #ligandRadius = 0.125;
  static #bondRadius = 0.125/4;

  static #bondColor(color=Visualizer.#ligandColor) {
    const newColor = color.clone();
    newColor.offsetHSL(0,0,0.25);
    return newColor;
  }

  constructor(parent=document.body) {
    const wrapper = parent.getElementsByClassName('wrapper')[0];
    this.#controlsElement = document.createElement('div');
    const controlsElement = this.#controlsElement;
    controlsElement.classList.add('controls');
    controlsElement.innerHTML = `
      <div class="button toggle selected bonds">Bonds</div>
      <label class="dropdown persist orbitals">
        <div class="dropdown_button">d-Orbitals</div>
        <div class="dropdown_arrow"></div>
        <ul class="dropdown_menu">
          <li data-name="show all">show all</li>
          <li data-name="hide all">hide all</li>
          <li class="dropdown__divider"></li>
          <li class="toggle" data-name="dz2">dz<span class="super">2</span></li>
          <li class="toggle" data-name="dx2-y2">dx<span class="super">2</span>-y<span class="super">2</span></li>
          <li class="toggle" data-name="dxz">dxz</li>
          <li class="toggle" data-name="dyz">dyz</li>
          <li class="toggle" data-name="dxy">dxy</li>
        </ul>
      </label>
      <div class="button toggle selected axes">Axes</div>
      <label class="dropdown view">
        <div class="dropdown_button">View</div>
        <div class="dropdown_arrow"></div>
        <ul class="dropdown_menu">
          <li data-view="[1,1,-1]" data-reset="true" title="reset">reset</li>
          <li class="dropdown__divider"></li>
          <li data-view="[1,1,-1]" title="isometric">isometric</li>
          <li data-view="[0,0,1]" title="xz">xz</li>
          <li data-view="[1,0,0]" title="yz">yz</li>
          <li data-view="[0,1,0]" title="xy">xy</li>
        </ul>
      </label>
      <div class="button toggle selected rotate">Rotate</div>`;

    addToggleCallbacks(controlsElement);
    addDropdownCallbacks(controlsElement);

    Array.from(controlsElement.getElementsByClassName('orbitals')[0].getElementsByTagName('li')).forEach(li => {
      const name = li.dataset.name;
      if (name == 'show all') {
        li.addEventListener('click', e=> {
          this.showOrbital('');
          Array.from(controlsElement.getElementsByClassName('orbitals')[0].getElementsByTagName('li')).forEach(x => {
            x.classList.add('selected');
          });
        });
        return;
      }

      if (name == 'hide all') {
        li.addEventListener('click', e=> {
          this.hideOrbital('');
          Array.from(controlsElement.getElementsByClassName('orbitals')[0].getElementsByTagName('li')).forEach(x => {
            x.classList.remove('selected');
          });
        });
        return;
      }

      if (name) li.addEventListener('click', e=> {
        if (!li.classList.contains('showing')) {
          this.showOrbital(name);
          li.classList.add('showing');
          li.classList.add('selected');
        } else {
          this.hideOrbital(name);
          li.classList.remove('showing');
          li.classList.remove('selected');
        }
      });
    });

    controlsElement.getElementsByClassName('axes')[0].addEventListener('click', e=> {
      this.showAxes = !visualizer.showAxes;
    });

    controlsElement.getElementsByClassName('bonds')[0].addEventListener('click', e=> {
      visualizer.bonds = !visualizer.bonds;
    });

    Array.from(controlsElement.querySelectorAll('.view .dropdown_menu li:not(.dropdown__divider)')).forEach(li => {
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

    controlsElement.getElementsByClassName('rotate')[0].addEventListener('click', e=> {
      visualizer.autoRotate = !visualizer.autoRotate;
    });
    parent.appendChild(controlsElement);

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(wrapper.getBoundingClientRect().width, wrapper.getBoundingClientRect().height);
    wrapper.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(45, wrapper.getBoundingClientRect().width / wrapper.getBoundingClientRect().height, 1, 500);
    this.camera.position.set(2,2,-2);
    this.camera.lookAt(0,0,0);

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.autoRotate = true;
    this.controls.update();

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(1,1,1);
    const zAxisFix = new THREE.Quaternion();
    zAxisFix.setFromUnitVectors(new THREE.Vector3(0,0,1), new THREE.Vector3(0,1,0));
    this.scene.applyQuaternion(zAxisFix);

    this.ambientLight = new THREE.AmbientLight(0xffffff, 1);
    this.scene.add(this.ambientLight);

    this.axesHelper = new THREE.AxesHelper(1.5);
    this.axesHelper.setColors(Visualizer.#axesColors['x'], Visualizer.#axesColors['y'], Visualizer.#axesColors['z']);
    this.scene.add(this.axesHelper);

    this.#orbitals = new THREE.Group();
    const orbitalMaterial = new THREE.MeshLambertMaterial({color: Visualizer.#orbitalColor});;
    orbitalMaterial.transparent = true;
    orbitalMaterial.opacity = 0.75;
    const scaleMat = new THREE.Matrix4();
    scaleMat.makeScale(0.75, 0.75, 0.75);
    Object.entries(orbitalPositions).forEach(e => {
      const [name, position] = e;
      const orbitalGeometry = new THREE.BufferGeometry();
      orbitalGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(position), 3));
      orbitalGeometry.computeVertexNormals();
      const orbitalMesh = new THREE.Mesh(orbitalGeometry, orbitalMaterial);
      orbitalMesh.name = name;
      orbitalMesh.applyMatrix4(scaleMat);
      orbitalMesh.visible = false;
      this.#orbitals.add(orbitalMesh);
    });
    this.scene.add(this.#orbitals);

    //TODO: remove before production
    //window.orbitals = this.#orbitals;
    window.visualizer = this;

    window.addEventListener('resize', e => {
      const autoRotate = this.autoRotate;
      const view = this.view;
      const {width, height} = wrapper.getBoundingClientRect();
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
      this.view = view;
      this.autoRotate = autoRotate;
    });

    this.#axesLabel = document.createElement('div');
    this.#axesLabel.classList.add('axesLabel');
    this.#axesLabel.innerHTML = `(<span style="color:${Visualizer.#axesColors['x'].getStyle()};">x</span>, <span style="color:${Visualizer.#axesColors['y'].getStyle()};">y</span>, <span style="color:${Visualizer.#axesColors['z'].getStyle()};">z</span>)`
    wrapper.appendChild(this.#axesLabel);

    this.view = new THREE.Vector3(1,1,-1);
    this.autoRotate = true;
  }

  set bonds(bonds) {
    bonds = Boolean(bonds)
    this.#bonds = bonds;
    this.#ligands.forEach(l => {
      l.children.forEach(m => {
        if (m.name == 'bond') m.visible = this.#bonds;
      });
    });
    this.#controlsElement.getElementsByClassName('bonds')[0].classList.toggle('selected', bonds);
  }

  get bonds() {
    return this.#bonds;
  }

  set running(run) {
    if (run) {
      if (this.#animationFrame === undefined) this.animate();
    } else {
      if (this.#animationFrame !== undefined) {
        window.cancelAnimationFrame(this.#animationFrame);
        this.#animationFrame = undefined;
      }
    }
  }

  get running() {
    return (this.#animationFrame !== undefined);
  }

  set showAxes(show) {
    show = Boolean(show);
    if(show) this.#axesLabel.classList.remove('hidden');
    else this.#axesLabel.classList.add('hidden');
    this.axesHelper.visible = show;
    this.#controlsElement.getElementsByClassName('axes')[0].classList.toggle('selected', show);
  }

  get showAxes() {
    return this.axesHelper.visible;
  }

  set autoRotate(autoRotate) {
    autoRotate = Boolean(autoRotate);
    this.controls.autoRotate = autoRotate;
    this.#controlsElement.getElementsByClassName('rotate')[0].classList.toggle('selected', autoRotate);
  }

  get autoRotate() {
    return this.controls.autoRotate;
  }

  set view(position) {
    // Calcualte correct camera distance
    const size = new THREE.Vector3();
    const boundingBox = new THREE.Box3();
    boundingBox.setFromObject(this.scene);
    boundingBox.getSize(size);

    const fov = this.camera.fov * (Math.PI / 180);
    const fovh = 2*Math.atan(Math.tan(fov/2) * this.camera.aspect);
    const dx = size.z / 2 + Math.abs(size.x / 2 / Math.tan(fovh / 2));
    const dy = size.z / 2 + Math.abs(size.y / 2 / Math.tan(fov / 2));
    this.autoRotate = false;
    position.normalize();
    position.multiplyScalar(Math.max(dx, dy) * 1.25);
    this.camera.position.copy(position);
  }

  get view() {
    return this.camera.position.clone();
  }

  #createLigandMesh(position=new THREE.Vector3(0,1,0)) {
    position.normalize();
    const bondGeometry = new THREE.CapsuleGeometry(Visualizer.#bondRadius, 1, 12, 12);
    const ligandGeometry = new THREE.SphereGeometry(Visualizer.#ligandRadius, 12, 12);
    const bondMaterial = new THREE.MeshLambertMaterial({color: Visualizer.#bondColor()});
    const ligandMaterial = new THREE.MeshLambertMaterial({color: Visualizer.#ligandColor});

    const bond = new THREE.Mesh(bondGeometry, bondMaterial);
    const ligand = new THREE.Mesh(ligandGeometry, ligandMaterial);
    bond.name = 'bond';
    ligand.name = 'ligand';
    bond.position.set(0,0.5,0);
    ligand.position.set(0,1,0);

    const group = new THREE.Group();
    group.add(bond);
    group.add(ligand);

    const rotation = new THREE.Quaternion();
    rotation.setFromUnitVectors(new THREE.Vector3(0,1,0), position);
    group.quaternion.copy(rotation);
    return group;
  }

  setLigands(ligands, selected=-1) {
    this.#ligands.forEach(l => {
      this.scene.remove(l);
    });
    this.#ligands = [];

    for (let i=0; i<ligands.length; i++) {
      this.#ligands[i] = this.#createLigandMesh(ligands[i]);
      this.scene.add(this.#ligands[i]);
    }

    if(selected!=-1 && this.#ligands[selected]) {
      this.#ligands[selected].children.forEach(m=> {
        if (m.name == 'ligand') m.material.color = Visualizer.#selectedColor;
        else m.material.color = Visualizer.#bondColor(Visualizer.#selectedColor);
      });
    }
  }

  showOrbital(name) {
    this.#orbitals.children.forEach(o => {
      if (o.name == name || name === '') o.visible = true;
    });
  }

  hideOrbital(name) {
    this.#orbitals.children.forEach(o => {
      if (o.name == name || name === '') o.visible = false;
    });
  }

  animate() {
    this.#animationFrame = window.requestAnimationFrame(this.animate.bind(this));
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
