import * as THREE from '../../build/three.module.js';
import { GLTFLoader } from '../../jsm/loaders/GLTFLoader.js';
import { OrbitControls } from '../../jsm/controls/OrbitControls.js';
import { GUI } from '../../jsm/libs/lil-gui.module.min.js';
import { TWEEN } from '../../jsm/libs/tween.module.min.js'

let scene, camera, renderer, controls,  fov;
let objectiveLens, eyepieceLens;
let incidentRay1, incidentRay2, incidentRay3;
let incidentArrow1, incidentArrow2, incidentArrow3;
let reflectedRay1, reflectedRay2, reflectedRay3;
let reflectedArrow1, reflectedArrow2, reflectedArrow3;
let eyereflectedRay1, eyereflectedRay2, eyereflectedRay3;
let imageRay1, imageRay2, imageRay3;
let model, eye, mixer, pivot, telescope, arrow,  axis;
let object, objectTip, image, imageTip, imagePoint, pole;
let width = window.innerWidth, height =window.innerHeight;
let  objLabel, imgLabel, f1Point, f1Label, f2Point, f2Label, opticalLabel, lensLabel;
let group =new THREE.Group();
let group1 =new THREE.Group();
let rayDiagram = false;
let label = false;
let labelObjects = [];
const animations = {
    
    ray: function() {
        rayDiagram=!rayDiagram;
        rayAction();
    },
    labels: function() {
        label=!label
        labelAction();       
    }
}
let newMaterial = [new THREE.MeshBasicMaterial({ color: 'green' }),
                    new THREE.MeshBasicMaterial({ color: 0x00FFdd }),
                    new THREE.MeshBasicMaterial({ color: 0x0000ff }),
                    new THREE.MeshBasicMaterial({ color: 'black' })] ;
let params = {
    zo: -12.5,
    fo: 30,
    ze: 7.8,
    fe: 10,
    u: -5000,
    v1: 40,
    v2: 13,
    d: 18.2
}
const detailEl = document.getElementById("detail");
const messageEl = document.getElementById("message-el");
const partEl = document.getElementById("part");

//ray diagram points on the telescope lens and object and eye points
const pointP1 = new THREE.Vector3( 0, params.d + 1 , params.zo);
const pointA = new THREE.Vector3( 0, params.d,  params.zo );
const pointP2 = new THREE.Vector3( 0, params.d - 1, params.zo );
const pointQ1 = new THREE.Vector3( 0, params.d + .2, params.ze);
const pointB = new THREE.Vector3( 0, params.d -0.13, params.ze );
const pointQ2 = new THREE.Vector3( 0, params.d -0.4, params.ze );
const pointO = new THREE.Vector3( 0, params.d-3, params.v1 );
const pointX = new THREE.Vector3( 0, params.d - 4, -15);
const pointY= new THREE.Vector3( 0, params.d + 0.4, params.v2);

const localPlane = new THREE.Plane(new THREE.Vector3(  1, 0, 0), 0.2);

function createCamera(view, x, y, z, vector) {
   
    fov = view; 
    const aspect = width / height;
    const near = 0.1; 
    const far = 1500; 

    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
   
    camera.position.set(x, y, z);
    camera.lookAt(vector)
    // camera.position.set(-10, 3, 40);
} 

function createLights() {
    const ambientLight = new THREE.HemisphereLight(0xddeeff, 0x202020, 4);
    const mainLight = new THREE.DirectionalLight(0xffffff, 3.0);
    scene.add(ambientLight);

    mainLight.position.set(10, 10, 10);

    scene.add(ambientLight, mainLight);
}

function addRays(vector1,vector2) {
    let linepoints = [ vector1, vector2];
    let lineMaterial = new THREE.LineBasicMaterial({ color: 'red' });
     
    let lineGeometry = new THREE.BufferGeometry().setFromPoints( linepoints );    
    axis = new THREE.Line( lineGeometry, lineMaterial );
    
    return axis
}

function addArrows(vector) {
   
    let coneGeometry = new THREE.ConeGeometry(.3, .5, 6 );
    coneGeometry.rotateX(Math.PI / 2 ); 
    arrow = new THREE.Mesh(coneGeometry, new THREE.MeshBasicMaterial({ color: 'brown' }));  
    arrow.position.copy(vector); 
    return arrow
}

function createModel () {
   
    const loader = new GLTFLoader();
    loader
    .setPath('../model/')
    .load('telescope.glb', function(gltf) {
        model = gltf.scene; 
        telescope = model.getObjectByName( 'telescope' );
        pivot = model.getObjectByName( 'pivot' ); 
        eyepieceLens = model.getObjectByName( 'eyepiece' );   
        objectiveLens = model.getObjectByName( 'objectiveLens' );   
        scene.add( model);     
        telescope.material.clippingPlanes = [localPlane];
        telescope.material.clipShadows= true;    
        addLabel();
        labelAction();
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
     // // ***** Clipping setup (renderer): *****
    let Empty = Object.freeze([]);
    renderer.clippingPlanes = Empty; // GUI sets it to globalPlanes
    renderer.localClippingEnabled = false;
    // labelRenderer = new CSS2DRenderer();
    // labelRenderer.setSize(window.innerWidth, window.innerHeight);
    // labelRenderer.domElement.style.position = 'absolute';
    // labelRenderer.domElement.style.top = '0px';
    // labelRenderer.domElement.style.pointerEvents = 'none';
    // container.appendChild(labelRenderer.domElement);
}

function createRays() {
    // pole.position.set(0, params.d-.2, params.ze-2);
    imagePoint.position.set(0, params.d-4, -100);
    
    incidentRay1 =addRays( new THREE.Vector3( 0,  params.d+1, params.zo ), 
                        new THREE.Vector3( 0,  params.d+1, params.u ));
                        
    incidentRay2 = addRays(new THREE.Vector3( 0,  params.d, params.zo ), 
                        new THREE.Vector3( 0,  params.d, params.u ));
                        
    incidentRay3 =  addRays(new THREE.Vector3( 0,  params.d-1, params.zo ), 
                        new THREE.Vector3( 0,  params.d-1, params.u ));
                        
    incidentArrow1 = addArrows(new THREE.Vector3( 0,  params.d+1, params.zo-3));
    incidentArrow2 = addArrows(new THREE.Vector3( 0,  params.d, params.zo-3));
    incidentArrow3 = addArrows(new THREE.Vector3( 0,  params.d-1, params.zo-3));
    
    group.add( incidentRay1, incidentRay2, incidentRay3, incidentArrow1, incidentArrow2, incidentArrow3);

    // reflectedRay1 = addRays(new THREE.Vector3( 0,  params.d+1, params.zo ), 
    //                         new THREE.Vector3( 0,  params.d-.5, params.ze )); 
     // reflectedArrow1 = addArrows(pointP1.add(new THREE.Vector3( 0,  params.d+.8, params.zo+2)) )  
    reflectedRay1 = addRays( pointP1, pointQ2);    
                      
    reflectedArrow1 = addArrows(new THREE.Vector3( 0,  params.d+.8, params.zo+3));
    // console.log(Math.acos(pointP1.angleTo( new THREE.Vector3( 0,  params.d, 0) )))    
    group.add(reflectedRay1);
    reflectedRay1.add(reflectedArrow1)
      
    reflectedRay2 = addRays( pointA, pointB);
    reflectedArrow2 = addArrows(new THREE.Vector3( 0,  params.d, params.zo+2));
    
    group.add(reflectedRay2);
    reflectedRay2.add(reflectedArrow2);
    reflectedRay3 = addRays( pointP2, pointQ1);
    reflectedArrow3 = addArrows(new THREE.Vector3(0, params.d-.8, params.zo + 3));
    group.add(reflectedRay3);
    reflectedRay3.add(reflectedArrow3);
   
    let X = addRays( pointB,  pointY);
    eyereflectedRay2 = X;
    eyereflectedRay2.material = newMaterial[2];
    group.add(eyereflectedRay2);

    // imageRay1.add(imageArrow1 );
    eyereflectedRay1 = X.clone();
    eyereflectedRay1.position.y = 0.3;
    eyereflectedRay1.material = newMaterial[2];
    group.add(eyereflectedRay1);
    eyereflectedRay3 = X.clone();
    eyereflectedRay3.position.y = -0.3;
    eyereflectedRay3.material = newMaterial[2];
    group.add(eyereflectedRay3);
    eye.position.copy(pointY);
    eye.position.x+=-.5;
    console.log('till here')
    
}

function imageRay(){
    let a = addRays( pointB, imagePoint.position);
    imageRay3 = a;
    imageRay3.material = newMaterial[3];
    group1.add(imageRay3);
    imageRay1 = a.clone();
    imageRay1.position.y = 0.3;
    imageRay1.material = newMaterial[3];
    group1.add(imageRay1);
    imageRay2 = a.clone();
    imageRay2.position.y = -0.3;
    imageRay2.material = newMaterial[3];
    group1.add(imageRay2);
}

function createControls(x,y,z) {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.target.set(x, y, z);
}

function init() {
    scene = new THREE.Scene;
    scene.background = new THREE.Color(0xbfd1e5);        
    createCamera(50, -35, 5, -22, pointA);

    createLights();
    createRenderer();
    createControls(-5, 14, -4.5);
    
    pole = initPoint({
        vertices: new Float32Array([0,0,0]),
        material: new THREE.PointsMaterial( { color: 0x8888FF, size: 1 } )
    }); 
    scene.add(pole);


    imagePoint =   initPoint({
        vertices: new Float32Array([0,0,0]),
        material: new THREE.PointsMaterial( { color: 'black', size: .5 } )
    }); 
    scene.add(imagePoint);
    // imagePoint.position.set(0,heightV,v);

    const scaleHorizontal =new THREE.GridHelper(70, 70);   
    scene.add(scaleHorizontal);
    // scaleHorizontal.position.y = d
    // const scaleVertical =new THREE.GridHelper(70, 70);
    // scaleVertical.rotation.z = 1.57;   
    // scene.add(scaleVertical);
    
    document.body.appendChild( renderer.domElement );
    
    window.addEventListener('resize', onWindowResize);
}

function addLabel() {
    // objLabel, imgLabel, f1Point, f1Label, f2Point, f2Label, opticalLabel, lensLabel;
    objLabel = makeTextSprite('Objective', pointA);
    scene.add(objLabel)
    labelObjects.push(objLabel)
    imgLabel = makeTextSprite('image at Infinity', pointX);
    scene.add(imgLabel)
    labelObjects.push(imgLabel)
    f1Point = makeTextSprite('focal length, fo', new THREE.Vector3( 0, params.d + 1,  params.zo+15 ));
    scene.add(f1Point)
    labelObjects.push(f1Point)
    f2Point = makeTextSprite('Eyepiece', new THREE.Vector3( 0, params.d - 3, params.ze+2));
    scene.add(f2Point)
    labelObjects.push(f2Point)
}

function makeTextSprite( message, a )
{
	
	var fontface =  "Arial";
	
	var fontsize = 22;
	
	var borderThickness = 4;
	
	var borderColor = { r:0, g:0, b:0, a:1.0 };
	
	var backgroundColor = { r:0, g:0, b:0, a:0.8 };

	// var spriteAlignment = THREE.SpriteAlignment.topLeft;
		
	var canvas = document.createElement('canvas');
	var context = canvas.getContext('2d');
	context.font = "Bold " + fontsize + "px " + fontface;
    
	// get size data (height depends only on font size)
	var metrics = context.measureText( message );
	var textWidth = metrics.width;
	
	// background color
	context.fillStyle   = "rgba(" + backgroundColor.r + "," + backgroundColor.g + ","
								  + backgroundColor.b + "," + backgroundColor.a + ")";
	// border color
	context.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g + ","
								  + borderColor.b + "," + borderColor.a + ")";

	context.lineWidth = borderThickness;
	roundRect(context, borderThickness/2, borderThickness/2, textWidth + borderThickness, fontsize * 1.4 + borderThickness, 6);
	// 1.4 is extra height factor for text below baseline: g,j,p,q.
	
	// text color
	context.fillStyle = "rgba(255, 255, 255, 1.0)";

	context.fillText( message, borderThickness, fontsize + borderThickness);
	
	// canvas contents will be used for a texture
	var texture = new THREE.Texture(canvas) 
	texture.needsUpdate = true;

	var spriteMaterial = new THREE.SpriteMaterial( 
		{ map: texture } );
	var sprite = new THREE.Sprite( spriteMaterial );
	sprite.scale.set(10,5,1.0);
    sprite.position.copy(a)
	return sprite;	
}

// function for drawing rounded rectangles
function roundRect(ctx, x, y, w, h, r) 
{
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.lineTo(x+w-r, y);
    ctx.quadraticCurveTo(x+w, y, x+w, y+r);
    ctx.lineTo(x+w, y+h-r);
    ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    ctx.lineTo(x+r, y+h);
    ctx.quadraticCurveTo(x, y+h, x, y+h-r);
    ctx.lineTo(x, y+r);
    ctx.quadraticCurveTo(x, y, x+r, y);
    ctx.closePath();
    ctx.fill();
	ctx.stroke();   
}


window.onload = function() {
    
    init();
    
    animate();
    guiControls();
    createModel (); 
    // showLabels();
    eyeShow();
    createRays(); 
    imageRay()
    // scene.add(new THREE.AmbientLight(0xffffff));  
}

function initPoint(data) {
    let pointGeometry = new THREE.BufferGeometry();
    pointGeometry.setAttribute('position', new THREE.BufferAttribute(data.vertices, 3));
    let pointMaterial = data.material;
    let point = new THREE.Points(pointGeometry, pointMaterial);
    
    return point;
}

function render(){

    renderer.setSize( innerWidth, innerHeight );
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.render( scene, camera );
    // labelRenderer.render(scene, camera);
}


function animate() {   
    requestAnimationFrame( animate );
    
    controls.update(0.01);
    // stats.update();
	render();
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    // labelRenderer.setSize(window.innerWidth, window.innerHeight);
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

   
    let animationsFolder = gui.addFolder('Show/Hide');
   
    animationsFolder.add(animations, 'ray' ). name('Ray Diagrams');
    animationsFolder.add(animations, 'labels' ). name('Telescope Labels');
    let folderLocal = gui.addFolder('Local Clipping'),
        propsLocal = {
            get 'Enabled'() {
                return renderer.localClippingEnabled;
            },
            set 'Enabled'(v) {
                renderer.localClippingEnabled = v;
            },
            get 'Shadows'() {
                return telescope.material.clipShadows;
            },
            set 'Shadows'( v ) {
                telescope.material.clipShadows = v;
            },
            get 'Plane'() {
                return localPlane.constant;
            },
            set 'Plane'(v) {
                localPlane.constant = v;
            }
        }
    folderLocal.add(propsLocal, 'Enabled');
    folderLocal.add(propsLocal, 'Plane', -3, 3);
}

function eyeShow() {
    
    const map1 = new THREE.TextureLoader().load( '../assets/img/eyeIconR.png' );
    const material1 = new THREE.SpriteMaterial( { map: map1, color: 0xffffff } );

    eye = new THREE.Sprite( material1 );
    eye .scale.set(2,2,2);
    // eye.rotation.set(0,2,0)
    eye .position.set( 0, 14, 15 );
    
    scene.add( eye );
}

function labelAction() {
    if (label) {
        for (let i = 0; i < labelObjects.length; i++) {
            labelObjects[i].visible = true;
        }
    } else {              
        for (let i = 0; i < labelObjects.length; i++) {
            labelObjects[i].visible = false;
        }
    }
    
    if (rayDiagram) {
        imgLabel.visible = true;
        detailEl.style.visibility = 'hidden';
    } else {
        imgLabel.visible = false;
        detailEl.style.visibility = 'visible';
    }
}

function rayAction() {
    if (rayDiagram) {
        scene.add(group)
        scene.add(group1)
        renderer.localClippingEnabled = true;    
        
        createCamera(25, -35, 5, -22, telescope.position);   
        createControls(10, 20, -2);
        labelAction() 
        guiControls()
       
        new TWEEN.Tween(camera.position)
        .to({x:-25,  z: -22}, 1500)
        .easing(TWEEN.Easing.Cubic.Out)
        .start()
    } else {
        renderer.localClippingEnabled = false;
        createCamera(50, -35, 5, -22, pointA);
        createControls(-5, 14, -4.5);
        scene.remove(group)
        scene.remove(group1)
        guiControls()
        labelAction() 
    }
   

}