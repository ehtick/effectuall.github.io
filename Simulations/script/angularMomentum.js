import * as THREE from '../../build/three.module.js';

import { GLTFLoader } from '../../jsm/loaders/GLTFLoader.js';
import { OrbitControls } from '../../jsm/controls/OrbitControls.js';
import { circularCurve } from './circularCurve.js';
import { Resizer } from "./Resizer.js";
import Sizes from './Sizes.js'

let constActions = [], actions = [], ARROW = [];
let message = [
  "Car moving in a straight path with constant velocity experiences no (Linear) Momentum",
"Car moving in a circular path with constant velocity experiences Angular Momentum"
]
let stopButton= document.getElementById('isStop')
let linearButton = document.getElementById('isLinear')
let messageEl = document.getElementById('message')
class BasicWorldDemo {
  constructor() {
    this._Initialize();
    this.isLinear = true
    this.isStop = true

  }

  _OnStart(msg) {
    console.log('this.isStop', this.isStop, this.isLinear)

    this.stop(this.isStop, this.isLinear)
  }

  _OnStop(msg) {
    console.log('this.isStop', this.isStop, this.isLinear)
    if (this.isStop){
      stopButton.innerHTML = 'START'
    } else {
      stopButton.innerHTML = 'STOP'
    }
    // stopButton.innerHTML = 'STOP' == this.isStop ? !this.isStop : 'START';
    this.isStop = !this.isStop
    this.stop(this.isStop, this.isLinear)
  }
  _OnLinear(msg) {
    console.log('this.isStop', this.isStop, this.isLinear)
    if (!this.isLinear){
      linearButton.innerHTML = 'CIRCULAR MOTION'
      messageEl.innerHTML = message[1]
    } else {
      linearButton.innerHTML = 'LINEAR MOTION'
      messageEl.innerHTML = message[0]
    }
    this.isLinear = !this.isLinear
    this.stop(this.isStop, this.isLinear)
  }
  _Initialize() {

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

    this.camera = new THREE.PerspectiveCamera(65, this.config.width / this.config.height, 0.1, 2000);
    this.camera.position.set(-65, 40, 65)
    this.camera.lookAt(8, 3, 0);

    this.scene = new THREE.Scene();

    const light = new THREE.DirectionalLight(0xffffff, 2);
    const ambilight = new THREE.AmbientLight(0xffffff, .20);
    light.position.set(0, 10, 5);
    this.scene.add(light, ambilight)
    this.scene.background = new THREE.Color(0xbfd1e5);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true
    this.controls.target.set(0, 5, 0)
    this.controls.minZoom = 0.5;
    this.controls.maxZoom = 2;
    this.controls.enablePan = true;
    this.controls.enableZoom = true;

    this.clock = new THREE.Clock()
    // this.scene.add(light, ambilight);
    this.delta = this.clock.getDelta();

    let CURVE = circularCurve(51, 0xb00000)
    // console.log(CURVE['CURVE'][0])
    this.bodyOrbit = CURVE['CURVE'][1];
    this.scene.add(this.bodyOrbit);

    // const hGrid = createGrids(150,10);
    const hGrid = new THREE.GridHelper(150, 10);
    this.scene.add(hGrid);
    this.resizer = new Resizer(this.config, this.camera, this.renderer);
    this.resizer.onResize = () => {
      this.renderer.render(this.scene, this.camera);
    };

    this.gltfLoader = new GLTFLoader()
    this.gltfLoader.load("./model/movingCar.glb", (gltf) => {
      this.model = gltf.scene
      this.model.scale.set(3, 3, 3)
      this.modelReady = true;

      this.model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true
          child.receiveShadow = true
        }
      })
      this.scene.add(this.model)
      let fixedStates = ['wheelBAction', 'wheelFAction', 'vtrackAction'];
      let actionStates = ['circularMotion', 'stopAction', 'linearAction', 'vectorCAction']

      this.mixer = new THREE.AnimationMixer(this.model);
      for (let i = 0; i < gltf.animations.length; i++) {

        let clip = gltf.animations[i];
        let action = this.mixer.clipAction(clip);
        // actions[clip.name] = action;
        if (fixedStates.indexOf(clip.name) >= 0) {
          constActions[clip.name] = action;

        }
        if (actionStates.indexOf(clip.name) >= 0) {
          actions[clip.name] = action;

        }
      }

      let vectorA = this.model.getObjectByName('vectorA');
      let vectorB = this.model.getObjectByName('vectorB');
      this.distToCar = this.model.getObjectByName('vectorC');
      let dist = this.model.getObjectByName('dist');

      ARROW.push(vectorA, vectorB, dist)
      console.log(actions)
      // actions.push(stopAction, frontWheel, backWheel)
      actions['linearAction'].play()
      actions['vectorCAction'].play()
      for (const key in constActions) {
        // console.log( constActions[key])
        constActions[key].play();
      }
      for (let i = 0; i < ARROW.length; i++) {
        ARROW[i].visible = false;
      }
    })

    this.update();
    stopButton.onclick = (msg) => this._OnStop(msg);
    linearButton.onclick = (msg) => this._OnLinear(msg);
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
  stop(stop, linear) {

    if (stop) {
      actions['linearAction'].paused = false;
      actions['vectorCAction'].paused = false;
      actions['circularMotion'].paused = false;
      for (const key in constActions) {
        console.log('start')
        constActions[key].paused = false;
      }

    } else {
      actions['linearAction'].paused = true;
      actions['vectorCAction'].paused = true;
      console.log('stop')
      actions['circularMotion'].paused = true;
      for (const key in constActions) {
        constActions[key].paused = true;
      }

    }

    if (linear) {
      actions['circularMotion'].stop().reset()
      console.log('linear')
      // this.camera.position.set(-45, 10, 45)
      actions['linearAction'].play()
      actions['vectorCAction'].play()
      for (let i = 0; i < ARROW.length; i++) {
        ARROW[i].visible = false;
      }
      this.distToCar.visible = true
    } else {

      actions['linearAction'].stop().reset()
      actions['vectorCAction'].stop().reset()
      console.log('circular')
      actions['circularMotion'].play()
      for (let i = 0; i < ARROW.length; i++) {
        ARROW[i].visible = false;
      }
      this.distToCar.visible = false
    }

    if (!stop && !linear) {
      console.log('Stoped in circular path')
      for (let i = 0; i < ARROW.length; i++) {
        ARROW[i].visible = true;
      }
      this.distToCar.visible = false
    }


  }
}


let APP = null;

window.addEventListener('DOMContentLoaded', () => {
  APP = new BasicWorldDemo();
});
