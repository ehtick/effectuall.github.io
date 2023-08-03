import * as THREE from '../../build/three.module.js';
import { TransformControls } from '../../jsm/controls/TransformControls.js';
import { GLTFLoader } from '../../jsm/loaders/GLTFLoader.js';
import { OrbitControls } from '../../jsm/controls/OrbitControls.js';
import { Resizer } from "./Resizer.js";
import Sizes from './Sizes.js'


let vectorF = new THREE.Object3D(), vectorT = new THREE.Object3D(), wrench = new THREE.Object3D(), bolt = new THREE.Object3D(), TORQUE = new THREE.Group(), MAT;
let initialForce, finalForce;
class BasicWorldDemo {
  constructor() {
    this._Initialize();

  }

  _Initialize() {
    this.modelElement = "./model/wrench.glb"
    this.targetElement = document.getElementById('container')
    this.config = {}
    const boundings = this.targetElement.getBoundingClientRect()
    console.log(boundings)
    this.config.width = boundings.width
    this.config.height = boundings.height || window.innerHeight

    this.sizes = new Sizes()
    this.sizes.on('resize', () => {
      this.resize()
    })

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.alpha = true;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.config.width, this.config.height);
    this.targetElement.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(35, this.config.width / this.config.height, 0.1, 2000);
    this.camera.position.set(15, 10, 15)
    this.camera.lookAt(0, 3, 0);

    this.scene = new THREE.Scene();

    MAT = new THREE.MeshPhongMaterial({ color: 0xf9a222, transparent: true, opacity: 0.6 });
    this.plane = new THREE.Mesh(new THREE.BoxGeometry(),MAT);
    this.plane.position.y = -0.5;
    this.plane.scale.set(8, 1, 8);
    this.plane.castShadow = true;
    this.plane.receiveShadow = true;
    this.scene.add(this.plane, TORQUE, bolt, vectorF, vectorT);
    const light = new THREE.DirectionalLight(0xffffff, 2);
    const ambilight = new THREE.AmbientLight(0xffffff, .20);
    light.position.set(0, 10, 5);
    this.scene.add(light, ambilight)
    this.scene.background = new THREE.Color(0xbfd1e5);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true
    this.controls.target.set(6, 2, 4.5)
    this.controls.minZoom = 0.5;
    this.controls.maxZoom = 2;
    this.controls.enablePan = true;
    this.controls.enableZoom = true;
    console.log(this.controls)
    this.clock = new THREE.Clock()
    // this.scene.add(light, ambilight);
    this.delta = this.clock.getDelta();

    // const hGrid = createGrids(150,10);
    const hGrid = new THREE.GridHelper(150, 10);
    this.scene.add(hGrid);
    this.resizer = new Resizer(this.config, this.camera, this.renderer);
    this.resizer.onResize = () => {
      this.renderer.render(this.scene, this.camera);
    };

    initialForce = TORQUE.rotation.y;
    finalForce = TORQUE.rotation.y;

    this.gltfLoader = new GLTFLoader()
        this.gltfLoader.load(this.modelElement, (gltf) => {
            let model = gltf.scene
            this.scene.add(model)
            bolt = model.getObjectByName('bolt');
            wrench = model.getObjectByName('wrench');
            vectorF = model.getObjectByName('vectorF');
            vectorT = model.getObjectByName('vectorT');
            TORQUE.add(wrench)

        })
        let controls = this.controls
        this.transformControls = new TransformControls(this.camera, this.renderer.domElement);
        // console.log(wrench)
        this.transformControls.size=2.5;
        this.transformControls.attach(TORQUE);
        this.transformControls.setMode('rotate');
        this.transformControls.showX = false;
        this.transformControls.showZ = false;
        this.scene.add(this.transformControls);

        this.transformControls.addEventListener('change', function (event) {
            // console.log(event)
            wrench.rotation.x = 0;
            wrench.rotation.z = 0;
        });
        this.transformControls.addEventListener('dragging-changed', function (event) {
            controls.enabled= !event.value;
            console.log(controls)
            initialForce = finalForce;
            finalForce = TORQUE.rotation.y;
            let X = Number((initialForce - finalForce).toFixed(1))

            // console.log(initialForce, finalForce, X)
            if (X > 0) {
                console.log('bolt moves down')
                MAT.transparent = true;
                vectorF.rotation.set(3.14,0,3.14)
                vectorT.rotation.set(0,0,-3.14)

            } else if (X < 0) {
                MAT.transparent = true;
                console.log('bolt moves up')
                vectorF.rotation.set(0,0,0)
                vectorT.rotation.set(0,0,0)
            }
        });

    this.update();
  }
  setSize(container, camera, renderer) {
    console.log(container.width, container.height)
    camera.aspect = container.width / container.height;
    camera.updateProjectionMatrix();
    renderer.setSize(container.width, container.height);
    renderer.setPixelRatio(window.devicePixelRatio);
  };

  OnWindowResize() {

    this.camera.aspect = this.config.width / this.config.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.config.width, this.config.height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.render(this.scene, this.camera);
  }

  update() {
    requestAnimationFrame(() => {
      this.update();
    });

    this.controls.update()
    this.delta = this.clock.getDelta();
    if (this.modelReady) {
      this.mixer.update(this.delta);
    }
    this.renderer.render(this.scene, this.camera);
  }
  resize() {
    // Config
    console.log(this.targetElement)
    const boundings = this.targetElement.getBoundingClientRect()
    this.config.width = boundings.width
    this.config.height = boundings.height

    this.config.pixelRatio = Math.min(Math.max(window.devicePixelRatio, 1), 2)

  }
 
}


let APP = null;

window.addEventListener('DOMContentLoaded', () => {
  APP = new BasicWorldDemo();
});
