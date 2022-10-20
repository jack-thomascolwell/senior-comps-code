'use strict'

export class Visualizer {
  #ligands = [];
  #animationFrame;
  #selected = -1;

  static #ligandColor = new THREE.Color(0x808080);
  static #selectedColor = new THREE.Color(0x4040bf);

  static #bondColor(color=Visualizer.#ligandColor) {
    const newColor = color.clone();
    newColor.offsetHSL(0,0,0.25);
    return newColor;
  }

  constructor() {
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 500);
    this.camera.position.set(0,5,5);
    this.camera.lookAt(0,0,0);

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.autoRotate = true;
    this.controls.update();

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(1,1,1);

    this.ambientLight = new THREE.AmbientLight(0xffffff, 1);
    this.scene.add(this.ambientLight);

    this.axesHelper = new THREE.AxesHelper(1.5);
    this.scene.add(this.axesHelper);
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

  #createLigandMesh(position=new THREE.Vector3(0,1,0)) {
    position.normalize();
    const bondGeometry = new THREE.CapsuleGeometry(0.0625, 1, 12, 12);
    const ligandGeometry = new THREE.SphereGeometry(0.25, 12, 12);
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

  addLigand(position) {
    const i = this.#ligands.length
    this.#ligands[i] = this.#createLigandMesh(position);
    this.scene.add(this.#ligands[i]);
  }

  removeLigand(i) {
    this.scene.remove(this.#ligands[i]);
    this.#ligands[i].dispose();
    this.#ligands.splice(i,1);
  }

  updateLigand(i, position) {
    this.scene.remove(this.#ligands[i]);
    this.#ligands[i].dispose();
    this.#ligands[i] = this.#createLigandMesh(position);
    scene.add(this.#ligands[i]);
  }

  selectLigand(i) {
    if (i != -1) {
      this.#ligands[i].children.forEach(m=>{
        if (m.name == 'ligand') m.material.color = Visualizer.#selectedColor;
        else m.material.color = Visualizer.#bondColor(Visualizer.#selectedColor);
      });
    }

    if (this.#selected != -1) {
      this.#ligands[this.#selected].children.forEach(m=>{
        if (m.name == 'ligand') m.material.color = Visualizer.#ligandColor;
        else m.material.color = Visualizer.#bondColor();
      });
    }

    this.#selected = i;
  }

  animate() {
    this.#animationFrame = window.requestAnimationFrame(this.animate.bind(this));
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}