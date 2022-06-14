import * as THREE from '../../build/three.module.js';
import { GLTFLoader } from '../../jsm/loaders/GLTFLoader.js';
import { OrbitControls } from '../../jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from '../../jsm/renderers/CSS2DRenderer.js';
import  Stats  from '../../jsm/libs/stats.module.js';
import g, { GUI } from '../../jsm/libs/lil-gui.module.min.js';

let scene, camera, renderer, controls, labelRenderer;
let incidentRay1, incidentRay2, incidentRay3;
let incidentArrow1, incidentArrow2, incidentArrow3;
let reflectedRay1, reflectedRay2, reflectedRay3;
let reflectedArrow1, reflectedArrow2, reflectedArrow3;
let rayLine, rayArrow, model, eye;
let object, objectTip, image, imageTip, imagePoint, pole, pointP1, pointA, pointP2,  opticalAxis;
let width = window.innerWidth, height =window.innerHeight;
let  objLabel, imgLabel, f1Point, f1Label, f2Point, f2Label, opticalLabel, lensLabel;
let v, f, u, m, heightV;
let params = {
    f: -10,
    h: 5,
    u: -15,
    v: -6
}
let fmessageEl = document.getElementById('fmessage-el');
let umessageEl = document.getElementById('umessage-el');
let vmessageEl = document.getElementById('vmessage-el');
let vEl = document.getElementById('v-el');
let uEl = document.getElementById('u-el');
let mvEl = document.getElementById('mv-el');
let muEl = document.getElementById('mu-el');
let mEl = document.getElementById('m-el');
let fEl = document.getElementById('f-el');

function createCamera() {
    // Create a Camera
    const fov = 50; // AKA Field of View
    const aspect = width / height;
    const near = 0.1; // the near clipping plane
    const far = 1000; // the far clipping plane

    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
   
    camera.position.set(-35, 5, -22);
    // camera.position.set(-10, 3, 40);
} 

function createLights() {
    // Create a directional light
    const ambientLight = new THREE.HemisphereLight(0xddeeff, 0x202020, 4);
    const mainLight = new THREE.DirectionalLight(0xffffff, 3.0);
    scene.add(ambientLight);

    // move the light back and up a bit
    mainLight.position.set(10, 10, 10);

    // remember to add the light to the scene
    scene.add(ambientLight, mainLight);
}
//focal length= 10cm
//object position= 10cm
//(1/f) = (1/v) -(1/u)
function addObject( height ) {
    let tube =  new THREE.Mesh(
        new THREE.CylinderGeometry(.1, .1, height).translate(0, height/2, 0),
        new THREE.MeshBasicMaterial({color: 'black'})
    );
    
    let cone = new THREE.Mesh(
        new THREE.ConeGeometry(.5, 1, 6).translate(0, height + 0.5, 0),
        new THREE.MeshBasicMaterial({color: 'black'})
    );

   
    return {tube, cone}
}

//ray diagram constructor
function addRays(length) {
    let rayGeometry = new THREE.CylinderBufferGeometry( .05, .05, length ).translate( 0,  length/2, 0 );
    rayGeometry.rotateX(Math.PI / 2);

    rayLine = new THREE.Mesh(rayGeometry,new THREE.MeshBasicMaterial({ color: 'blue' }));
    let coneGeometry = new THREE.ConeGeometry(.3, .5, 6 ).translate( 0, length/2, 0 );
    coneGeometry.rotateX(Math.PI / 2);
    rayArrow = new THREE.Mesh(coneGeometry, new THREE.MeshBasicMaterial({ color: 'red' }));  

    return { rayLine,rayArrow}
}

function adjustRays( vector, length) {
    vector.geometry.dispose();
    let newrayGeometry = new THREE.CylinderBufferGeometry( .05, .05, length).translate( 0,  length/2, 0 );
    newrayGeometry.rotateX(Math.PI / 2);
    vector.geometry = newrayGeometry ;
    // vector.position.set(0,height,0);
   
}

function changeHeight( vector, height ) {
    vector.geometry.dispose();
    let newheightGeometry = new THREE.CylinderGeometry(.1, .1, height).translate(0, height/2, 0);
    vector.geometry = newheightGeometry;
    // vector.position.set(0,height,0);
   
}

function adjustCones( vector, height ) {
    vector.geometry.dispose();
    let newconeGeometry = new THREE.ConeGeometry(.5, 1, 6).translate(0, height + 0.5, 0);
    vector.geometry = newconeGeometry;
}

function lensFormula( f, heightU, u ) {
    // console.log(heightU,pointA, pointP1)
    v = (u*f)/(u + f);
   
    m = v/u;
    heightV = m*heightU;
    changeHeight( object, heightU); 
    adjustCones( object, heightU)
    object.position.z = u;
    changeHeight( image, heightU); 
    adjustCones( image, heightU);
    image.position.z = v;
    image.scale.set( m,m,m );

    pointP1 = new THREE.Vector3( 0, heightU, 0 );
    pointA = new THREE.Vector3( u, heightU, 0 );
    pointP2 = new THREE.Vector3( 0, heightV, 0 ); 
    imagePoint.position.set(0,heightV,v);
    reflectedRay3.position.copy(pointP2);
    
    incidentRay1.position.set( 0, heightU, 0 );
    incidentRay2.position.set( 0, heightU, 0 );
    incidentRay3.position.set( 0, heightU, 0 );
    adjustRays( incidentRay1, Math.abs(u));
    adjustRays( incidentRay1, pointA.distanceTo( pointP1 ));
    adjustRays( incidentRay2, pointA.distanceTo( pole.position ));
    adjustRays( incidentRay3, pointA.distanceTo( pointP2 ) );
    incidentRay1.lookAt(reflectedRay1.position);
    incidentRay2.lookAt(pole.position);
    incidentRay3.lookAt(reflectedRay3.position);
    
    adjustRays( reflectedRay1, pointP1.distanceTo( imagePoint.position ));
    adjustRays( reflectedRay2, pole.position.distanceTo( imagePoint.position ) );
    adjustRays( reflectedRay3, pointP2.distanceTo( imagePoint.position ));
    reflectedRay1.position.copy(pointP1);
    reflectedRay2.position.copy(pole.position);
    reflectedRay3.position.copy(pointP2);

    reflectedRay1.lookAt( imagePoint.position );
    reflectedRay2.lookAt( imagePoint.position );
    reflectedRay3.lookAt( imagePoint.position );

    f1Point.position.z = params.f;
    f2Point.position.z = -params.f;
}

function createModel () {
    const loader = new GLTFLoader();
    loader
    .setPath('../model/')
    .load('concaveLens.glb', function(gltf) {
        model = gltf.scene;       
        scene.add( model);
        model.traverse(n => { if ( n.isMesh ) {
            n.castShadow = true; 
            n.receiveShadow = true;
            if(n.material.map) n.material.map.anisotropy = 1;
                n.material.side = THREE.DoubleSide;
          }});
        model.scale.set(7.5,7.5,7.5);
        // model.position.y=7.5/2;      
    }); 
  
}


function createRenderer() {
    // create the renderer
    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.alpha = true;
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild( renderer.domElement );

    labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    labelRenderer.domElement.style.pointerEvents = 'none';
    container.appendChild(labelRenderer.domElement);
}

function init() {
    scene = new THREE.Scene;
    scene.background = new THREE.Color(0xbfd1e5);
    let newMaterial = new THREE.MeshBasicMaterial({ color: 'green' });

    f = params.f;
    let heightU = params.h;
    u = params.u;
    v = (u*f)/(u + f);
    m = v/u;
    heightV = m*heightU;
        
    createCamera();
    createLights();
    createRenderer();
    
    pole = initPoint({
        vertices: new Float32Array([0,0,0]),
        material: new THREE.PointsMaterial( { color: 0x8888FF, size: .01 } ),
        x: 0,
        y: 0,
        z: 0
    }); 
    scene.add(pole);

    pointP1 = new THREE.Vector3( 0, heightU, 0 );
    pointA = new THREE.Vector3( u, heightU, 0 );
    imagePoint =   initPoint({
        vertices: new Float32Array([0,0,0]),
        material: new THREE.PointsMaterial( { color: 0x88FF88, size: .01 } ),
        x: 0,
        y: heightV,
        z: v
    }); 
    scene.add(imagePoint);
    imagePoint.position.set(0,heightV,v);
    
    pointP2 = new THREE.Vector3( 0, heightV, 0 );
    //Add object
    object = addObject( heightU ).tube;
    objectTip = addObject( heightU ).cone;
    object.position.z = u;
    object.add(objectTip)
    

    //place the image at the calculated point with proper magnification
    image = addObject( heightU ).tube;
    imageTip = addObject( heightU ).cone;
    image.position.z = v;
    image.scale.set( m,m,m );
    image.add(imageTip)
    scene.add(object, image);

    //add optical axis
    opticalAxis = addRays(80).rayLine;
    opticalAxis.material = new THREE.MeshBasicMaterial({ color: 'black' });
    opticalAxis.position.z = -40;
    scene.add(opticalAxis)
    // console.log(object, image)
   
    incidentRay1 = addRays(Math.abs(u)).rayLine;
    incidentRay2 = addRays( pointA.distanceTo( pole.position )  ).rayLine;
    incidentRay3 = addRays( pointA.distanceTo( pointP2 )  ).rayLine;
    incidentArrow1 = addRays(Math.abs(u)).rayArrow;
    incidentArrow2 = addRays( pointA.distanceTo( pole.position )  ).rayArrow;
    incidentArrow3 = addRays( pointA.distanceTo( pointP2 )  ).rayArrow;
    incidentRay1.position.set( 0, heightU, 0 );
    incidentRay2.position.set( 0, heightU, 0 );
    incidentRay3.position.set( 0, heightU, 0 );
    incidentRay1.add(incidentArrow1);
    incidentRay2.add(incidentArrow2);
    incidentRay3.add(incidentArrow3)
    object.add( incidentRay1, incidentRay2, incidentRay3 );

    reflectedRay1 = addRays( pointP1.distanceTo( imagePoint.position )).rayLine;
    reflectedArrow1 = addRays( pointP1.distanceTo( imagePoint.position )).rayArrow;
    reflectedRay1.position.copy(pointP1);
    reflectedRay1.material = newMaterial;
    scene.add(reflectedRay1);
    reflectedRay1.add(reflectedArrow1 );
    reflectedRay2 = addRays( pole.position.distanceTo( imagePoint.position )).rayLine;
    reflectedArrow2 = addRays( pole.position.distanceTo( imagePoint.position )).rayArrow;
    reflectedRay2.position.copy(pole.position);
    reflectedRay2.material = newMaterial;
    scene.add(reflectedRay2);
    reflectedRay2.add(reflectedArrow2 );
    reflectedRay3 = addRays( pointP2.distanceTo( imagePoint.position )).rayLine;
    reflectedArrow3 = addRays( pointP2.distanceTo( imagePoint.position )).rayArrow;
    reflectedRay3.position.copy(pointP2);
    reflectedRay3.material = newMaterial;
    scene.add(reflectedRay3);
    reflectedRay3.add(reflectedArrow3 );
    incidentRay1.lookAt(reflectedRay1.position);
    incidentRay2.lookAt(pole.position);
    incidentRay3.lookAt(reflectedRay3.position);
    reflectedRay1.lookAt( imagePoint.position );
    reflectedRay2.lookAt( imagePoint.position );
    reflectedRay3.lookAt( imagePoint.position );

    const scaleHorizontal =new THREE.GridHelper(70, 70);   
    scene.add(scaleHorizontal);
    // const scaleVertical =new THREE.GridHelper(70, 70);
    // scaleVertical.rotation.z = 1.57;   
    // scene.add(scaleVertical);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.target.set(0, 2, -2);
    
    document.body.appendChild( renderer.domElement );
    
    window.addEventListener('resize', onWindowResize);
}


function showLabels() {
       //labels
       objLabel = addLabels('Object');
       imgLabel = addLabels('Virtual Image');
       objLabel.position.y = params.h +params.h/2;
       imgLabel.position.y = params.h +heightV;
       object.add(objLabel);
       image.add(imgLabel);
   
       f1Label = addLabels('F1');     
       f1Point = initPoint({
           vertices: new Float32Array([0,0,0]),
           material: new THREE.PointsMaterial( { color: 0xFF8888, size: 1 } ),
           x: 0,
           y: 0,
           z: 0
       }); 
       f2Label = addLabels('F2');     
       f2Point = initPoint({
           vertices: new Float32Array([0,0,0]),
           material: new THREE.PointsMaterial( { color: 0xFF8888, size: 1 } ),
           x: 0,
           y: 0,
           z: 0
       });  
       scene.add(f1Point, f2Point);
       f1Point.position.z = params.f;
       f1Point.add(f1Label);
       f2Point.position.z = -params.f;
       f2Point.add(f2Label);
   
       opticalLabel = addLabels('Optical Axis');
       opticalLabel.position.z = 60;
       opticalLabel.position.y = -2;
       opticalAxis.add(opticalLabel);  
   
       lensLabel = addLabels('Concave Lens');
       lensLabel.position.y = 8;
       scene.add(lensLabel); 
}
function addLabels(name, col) {
   
    let text= document.createElement('div');
    text.className = 'label';
    text.textContent =  name;
    text.style.color = col;
    
    let label= new CSS2DObject(text);
    label.position.z = -2;      
    label.position.y = 1;

    return label
}

window.onload = function() {
    
    init();
    controls.update()
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.1;
    animate();
    guiControls();
    createModel (); 
    showLabels();
    eyeShow();
    // scene.add(new THREE.AmbientLight(0xffffff));  
}

function initPoint(data) {
    let pointGeometry = new THREE.BufferGeometry();
    pointGeometry.setAttribute('position', new THREE.BufferAttribute(data.vertices, 3));
    let pointMaterial = data.material;
    let point = new THREE.Points(pointGeometry, pointMaterial);
    
    point.position.x = data.x;
    point.position.y = data.y;
    point.position.z = data.z;
    return point;
}

function render(){

    renderer.setSize( innerWidth, innerHeight );
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.render( scene, camera );
    labelRenderer.render(scene, camera);
}


function animate() {   
    requestAnimationFrame( animate );
    controls.update();

	render();
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    render();

}

function guiControls() {
    // dat.GUI
  
    const gui = new GUI( { width: 250 } );
//    camera control adjust
    // let controlFolder = gui.addFolder("Control");
    // controlFolder.add(controls.target, 'x', -100, 100);
    // controlFolder.add(controls.target, 'y', -100, 100);
    // controlFolder.add(controls.target, 'z', -100, 100);
    // let cameraFolder = gui.addFolder("Camera");
    // cameraFolder.add(camera.position, 'x', -100, 100);
    // cameraFolder.add(camera.position, 'y', -100, 100);
    // cameraFolder.add(camera.position, 'z', -100, 100);

    let lensFolder = gui.addFolder("Lens Focal Length");
    lensFolder.add(params, 'f',-50, -2,  1).name('f (in cm)').onChange((value) => {
       
            params.f = value;
            let a = ((params.u*params.f)/(params.u + params.f)).toFixed(2);
            params.v = a;
            let b = (a/params.u).toFixed(2); 
            params.m = b;
            changeElements(a, b, value, params.u)       
    });
    // , Object height(O.H) & Position(u)
    let formulaFolder = gui.addFolder("Object height & Position ");
    formulaFolder .add(params, 'h', 1, 7, .1).name('ho (in cm)').onChange((value) => {
        
        params.h = value;
        changeElements(params.v, params.m, params.f, params.u)  
        objLabel.position.y = value + value/2;
        imgLabel.position.y = value +heightV;
    });
    formulaFolder .add(object.position, 'z', -100, -0.5, .5).name('u (in cm)').onChange((value) => {
        params.u = value;
        let a = ((value*params.f)/(value + params.f)).toFixed(2);
        let b = (a/value).toFixed(2);
       
        changeElements(a, b, params.f, value);
    });
}

function changeElements(a, b, c, d) {
    lensFormula( c, params.h, d )
    changeHeight(object,params.h)
    changeHeight(image, params.h)
    adjustCones(objectTip, params.h)
    adjustCones(imageTip, params.h)
    // eye .position.set( 0, 2, -(d +1))
    fEl.innerHTML = c;
    uEl.innerHTML = d;
    vEl.innerHTML = a ; 
    muEl.innerHTML = d; 
    mvEl.innerHTML = a ;  
    mEl.innerHTML = b;  
    fmessageEl.innerHTML =  c ; 
    vmessageEl.innerHTML =  a ;
    umessageEl.innerHTML =  d ;
    if ( params.u > -10) {
        console.log("short  f")
        incidentArrow1.visible = false;
        incidentArrow2.visible = false;
        incidentArrow3.visible = false;
        reflectedArrow1.visible = false;
        reflectedArrow2.visible = false;
        reflectedArrow3.visible = false;
    } else {
        console.log("long  f")
        incidentArrow1.visible = true;
        incidentArrow2.visible = true;
        incidentArrow3.visible = true;
        reflectedArrow1.visible = true;
        reflectedArrow2.visible = true;
        reflectedArrow3.visible = true;
    }
}

function eyeShow() {
    
    const map1 = new THREE.TextureLoader().load( '../assets/img/eyeIconR.png' );
    const material1 = new THREE.SpriteMaterial( { map: map1, color: 0xffffff } );

    eye = new THREE.Sprite( material1 );
    eye .scale.set(5,5, 5);
    eye .position.set( 0, 2, -(params.u));
    
    scene.add( eye );
}