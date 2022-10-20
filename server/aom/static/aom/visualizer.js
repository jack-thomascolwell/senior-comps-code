'use strict'
import orbitalPositions from './orbitals.json' assert {type: 'json'};

export default class Visualizer {
  #ligands = [];
  #animationFrame;
  #orbitals;
  #bonds = true;
  #axesLabel;

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
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(parent.getBoundingClientRect().width, parent.getBoundingClientRect().height);
    parent.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(45, parent.getBoundingClientRect().width / parent.getBoundingClientRect().height, 1, 500);
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
      const {width, height} = parent.getBoundingClientRect();
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    });

    this.#axesLabel = document.createElement('div');
    this.#axesLabel.classList.add('axesLabel');
    this.#axesLabel.innerHTML = `(<span style="color:${Visualizer.#axesColors['x'].getStyle()};">x</span>, <span style="color:${Visualizer.#axesColors['y'].getStyle()};">y</span>, <span style="color:${Visualizer.#axesColors['z'].getStyle()};">z</span>)`
    parent.appendChild(this.#axesLabel);
  }

  set bonds(bonds) {
    this.#bonds = Boolean(bonds);
    this.#ligands.forEach(l => {
      l.children.forEach(m => {
        if (m.name == 'bond') m.visible = this.#bonds;
      });
    });
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
    if(show) this.#axesLabel.classList.remove('hidden');
    else this.#axesLabel.classList.add('hidden');
    this.axesHelper.visible = show;
  }

  get showAxes() {
    return this.axesHelper.visible;
  }

  set autoRotate(autoRotate) {
    this.controls.autoRotate = autoRotate;
  }

  get autoRotate() {
    return this.controls.autoRotate;
  }

  set view(position) {
    this.autoRotate = false;
    position.normalize();
    position.multiplyScalar(3.46);
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
      if (o.name == name) o.visible = true;
      else o.visible = false;
    });
  }

  animate() {
    this.#animationFrame = window.requestAnimationFrame(this.animate.bind(this));
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
