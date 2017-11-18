const THREE = window.THREE = require('three');
const GLTFExporter = require('../lib/GLTFExporter');
const Tree = require('../lib/proctree');
const dat = require('../lib/dat.gui.min');
const DEFAULT_CONFIG = require('./config');
const Viewer = require('./viewer');

class App {
  constructor (el) {
    this.config = Object.assign({}, DEFAULT_CONFIG);
    this.viewer = new Viewer(el);
    this.textureLoader = new THREE.TextureLoader();
    this.treeMaterial = new THREE.MeshStandardMaterial({
      color: this.config.treeColor,
      roughness: 1.0,
      metalness: 0.0
    });
    this.twigMaterial = new THREE.MeshStandardMaterial({
      color: this.config.twigColor,
      roughness: 1.0,
      metalness: 0.0,
      map: this.textureLoader.load('assets/twig-1.png'),
      alphaTest: 0.9
    });
    this.addGUI();
  }

  addGUI () {
    const gui = this.gui = new dat.GUI();

    const ctrls = [
      gui.add(this.config, 'seed').min(1).max(1000),
      gui.add(this.config, 'segments').min(6).max(20),
      gui.add(this.config, 'levels').min(0).max(7),
      gui.add(this.config, 'vMultiplier').min(0.01).max(10),
      gui.add(this.config, 'twigScale').min(0).max(1),
    ];

    ctrls.forEach((ctrl) => ctrl.onChange(() => this.createTree()));

    gui.add(this, 'exportGLTF').name('export glTF');

    // initalBranchLength: 0.49,
    // lengthFalloffFactor: 0.85,
    // lengthFalloffPower: 0.99,
    // clumpMax: 0.454,
    // clumpMin: 0.404,
    // branchFactor: 2.45,
    // dropAmount: -0.1,
    // growAmount: 0.235,
    // sweepAmount: 0.01,
    // maxRadius: 0.139,
    // climbRate: 0.371,
    // trunkKink: 0.093,
    // treeSteps: 5,
    // taperRate: 0.947,
    // radiusFalloffRate: 0.73,
    // twistRate: 3.02,
    // trunkLength: 2.4,
  }

  createTree () {
    const tree = new Tree(this.config);

    const treeGeometry = new THREE.BufferGeometry();
    treeGeometry.addAttribute('position', createFloatAttribute(tree.verts, 3));
    treeGeometry.addAttribute('normal', createFloatAttribute(tree.normals, 3));
    treeGeometry.addAttribute('uv', createFloatAttribute(tree.UV, 2));
    treeGeometry.setIndex(createIntArray(tree.faces, 1));

    const twigGeometry = new THREE.BufferGeometry();
    twigGeometry.addAttribute('position', createFloatAttribute(tree.vertsTwig, 3));
    twigGeometry.addAttribute('normal', createFloatAttribute(tree.normalsTwig, 3));
    twigGeometry.addAttribute('uv', createFloatAttribute(tree.uvsTwig, 2));
    twigGeometry.setIndex(createIntArray(tree.facesTwig, 1));

    const treeGroup = new THREE.Group();
    treeGroup.add(new THREE.Mesh(treeGeometry, this.treeMaterial));
    treeGroup.add(new THREE.Mesh(twigGeometry, this.twigMaterial));

    this.viewer.setTree(treeGroup);
  }

  exportGLTF () {
    const exporter = new GLTFExporter();
    exporter.parse(this.viewer.getTree(), (buffer) => {

      const blob = new Blob([buffer], {type: 'application/octet-stream'});
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'tree.glb';
      link.click();

      setTimeout(() => URL.revokeObjectURL(link.href), 1000);

    }, {binary: true});
  }
}

function createFloatAttribute (array, itemSize) {
  const typedArray = new Float32Array(Tree.flattenArray(array));
  return new THREE.BufferAttribute(typedArray, itemSize);
}

function createIntArray (array, itemSize) {
  const typedArray = new Uint16Array(Tree.flattenArray(array));
  return new THREE.BufferAttribute(typedArray, itemSize);
}

const app = new App(document.querySelector('#container'));
app.createTree();
