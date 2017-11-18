const THREE = require('three');
const OrbitControls = require('../lib/OrbitControls');
const createVignetteBackground = require('three-vignette-background');

const IS_IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

class Viewer {
  /**
   * @param {Element} el
   */
  constructor (el) {
    this.el = el;

    this.scene = new THREE.Scene();

    this.tree = null;

    this.camera = new THREE.PerspectiveCamera( 60, el.clientWidth / el.clientHeight, 1, 100 );
    this.camera.position.set(-7.5, 3, 9);
    this.scene.add(this.camera);

    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setClearColor( 0xF2D5DE );
    this.renderer.setPixelRatio( window.devicePixelRatio );
    this.renderer.setSize( el.clientWidth, el.clientHeight );

    this.controls = new OrbitControls( this.camera, this.renderer.domElement );
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = -5;
    this.controls.enablePan = false;

    this.background = createVignetteBackground({
      aspect: this.camera.aspect,
      grainScale: IS_IOS ? 0 : 0.001, // mattdesl/three-vignette-background#1
      colors: ['#E5CAD2', '#765754']
    });
    this.scene.add(this.background);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(100, 100, 50);
    this.camera.add(dirLight);
    const ambLight = new THREE.AmbientLight(0x404040, 2);
    this.camera.add(ambLight);

    this.el.appendChild(this.renderer.domElement);

    this.animate = this.animate.bind(this);
    requestAnimationFrame( this.animate );
    window.addEventListener('resize', this.resize.bind(this), false);
  }

  animate () {
    requestAnimationFrame( this.animate );

    this.controls.update();
    this.render();
  }

  render () {
    this.renderer.render( this.scene, this.camera );
  }

  resize () {
    const {clientHeight, clientWidth} = this.el.parentElement;

    this.camera.aspect = clientWidth / clientHeight;
    this.camera.updateProjectionMatrix();
    this.background.style({aspect: this.camera.aspect});
    this.renderer.setSize(clientWidth, clientHeight);
  }

  /**
   * @param {THREE.Group} tree
   */
  setTree (tree) {
    if (this.tree) {
      this.scene.remove(this.tree);
    }
    tree.position.y = -3;
    this.scene.add(tree);
    this.tree = tree;
  }

  /**
   * @return {THREE.Group}
   */
  getTree () {
    return this.tree;
  }
}

module.exports = Viewer;
