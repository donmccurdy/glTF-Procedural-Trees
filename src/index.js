const THREE = window.THREE = require('three');
const GLTFExporter = require('../lib/GLTFExporter');
const Tree = require('../lib/proctree');
const dat = require('../lib/dat.gui.min');
const DEFAULT_CONFIG = require('./config');
const Viewer = require('./viewer');
const download = require('downloadjs');

class App {
  constructor (el) {
    this.config = Object.assign({}, DEFAULT_CONFIG);

    this.viewer = new Viewer(el);

    this.exportCtrl = null;

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
    const treeFolder = gui.addFolder('tree');
    const branchFolder = gui.addFolder('branching');
    const trunkFolder = gui.addFolder('trunk');

    const ctrls = [
      // Tree
      treeFolder.add(this.config, 'seed').min(1).max(1000),
      // treeFolder.add(this.config, 'segments').min(6).max(20), no effect
      treeFolder.add(this.config, 'levels').min(0).max(7),
      // treeFolder.add(this.config, 'vMultiplier').min(0.01).max(10), no textures
      treeFolder.add(this.config, 'twigScale').min(0).max(1),

      // Branching
      branchFolder.add(this.config, 'initalBranchLength').min(0.1).max(1),
      branchFolder.add(this.config, 'lengthFalloffFactor').min(0.5).max(1),
      branchFolder.add(this.config, 'lengthFalloffPower').min(0.1).max(1.5),
      branchFolder.add(this.config, 'clumpMax').min(0).max(1),
      branchFolder.add(this.config, 'clumpMin').min(0).max(1),
      branchFolder.add(this.config, 'branchFactor').min(2).max(4),
      branchFolder.add(this.config, 'dropAmount').min(-1).max(1),
      branchFolder.add(this.config, 'growAmount').min(-0.5).max(1),
      branchFolder.add(this.config, 'sweepAmount').min(-1).max(1),

      // Trunk
      trunkFolder.add(this.config, 'maxRadius').min(0.05).max(1.0),
      trunkFolder.add(this.config, 'climbRate').min(0.05).max(1.0),
      trunkFolder.add(this.config, 'trunkKink').min(0.0).max(0.5),
      trunkFolder.add(this.config, 'treeSteps').min(0).max(35).step(1),
      trunkFolder.add(this.config, 'taperRate').min(0.7).max(1.0),
      trunkFolder.add(this.config, 'radiusFalloffRate').min(0.5).max(0.8),
      trunkFolder.add(this.config, 'twistRate').min(0.0).max(10.0),
      trunkFolder.add(this.config, 'trunkLength').min(0.1).max(5.0),
    ];

    ctrls.forEach((ctrl) => {
      ctrl.onChange(() => this.createTree());
      ctrl.listen();
    });

    // Materials
    const matFolder = gui.addFolder('materials');
    matFolder.addColor(this.config, 'treeColor')
      .onChange((hex) => this.treeMaterial.color.setHex(hex))
      .listen();
    matFolder.addColor(this.config, 'twigColor')
      .onChange((hex) => this.twigMaterial.color.setHex(hex))
      .listen();

    gui.add(this, 'resetDefaults');

    this.exportCtrl = gui.add(this, 'exportGLTF').name('export glTF');
    const exportLabel = this.exportCtrl.domElement.parentElement.querySelector('.property-name');
    exportLabel.style.width = 'auto';
  }

  createTree () {
    const tree = new Tree(this.config);

    const treeGeometry = new THREE.BufferGeometry();
    treeGeometry.addAttribute('position', createFloatAttribute(tree.verts, 3));
    treeGeometry.addAttribute('normal', createFloatAttribute(tree.normals, 3));
    treeGeometry.addAttribute('uv', createFloatAttribute(tree.UV, 2));
    treeGeometry.setIndex(createIntAttribute(tree.faces, 1));

    const twigGeometry = new THREE.BufferGeometry();
    twigGeometry.addAttribute('position', createFloatAttribute(tree.vertsTwig, 3));
    twigGeometry.addAttribute('normal', createFloatAttribute(tree.normalsTwig, 3));
    twigGeometry.addAttribute('uv', createFloatAttribute(tree.uvsTwig, 2));
    twigGeometry.setIndex(createIntAttribute(tree.facesTwig, 1));

    const treeGroup = new THREE.Group();
    treeGroup.add(new THREE.Mesh(treeGeometry, this.treeMaterial));
    treeGroup.add(new THREE.Mesh(twigGeometry, this.twigMaterial));

    this.viewer.setTree(treeGroup);

    const numVerts = tree.verts.length + tree.vertsTwig.length;
    this.exportCtrl.name(`export glTF (${numVerts} vertices)`);
  }

  exportGLTF () {
    const exporter = new GLTFExporter();
    exporter.parse(this.viewer.getTree(), (buffer) => {

      const blob = new Blob([buffer], {type: 'application/octet-stream'});
      download(blob, 'tree.glb', {type: 'application/octet-stream'});

    }, {binary: true});
  }

  resetDefaults () {
    Object.assign(this.config, DEFAULT_CONFIG);
    this.treeMaterial.color.setHex(this.config.treeColor);
    this.twigMaterial.color.setHex(this.config.twigColor);
    this.createTree();
  }
}

function createFloatAttribute (array, itemSize) {
  const typedArray = new Float32Array(Tree.flattenArray(array));
  return new THREE.BufferAttribute(typedArray, itemSize);
}

function createIntAttribute (array, itemSize) {
  const typedArray = new Uint16Array(Tree.flattenArray(array));
  return new THREE.BufferAttribute(typedArray, itemSize);
}

const app = new App(document.querySelector('#container'));
app.createTree();
