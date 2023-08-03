import {CatmullRomCurve3, Vector3, TubeGeometry, MeshLambertMaterial, Mesh} from '../../build/three.module.js';

function circularCurve(radius, col) {
   
    let curvePoints = [];
    let r = radius;
    let n = r / 2;
    let rad = Math.PI / n;

    for (let i = -n; i <= n - 1; ++i) {
      curvePoints.push(new Vector3(r * Math.sin(rad * i), 0, r * Math.cos(rad * i)))

    }
    let curve = new CatmullRomCurve3(curvePoints)
   
    curve.curveType = 'chordal'; //centripetal, chordal and catmullrom.
    curve.closed = true;
    let tubeGeometry = new TubeGeometry(curve, r * 5, .1, 4, false);
    let material = new MeshLambertMaterial({ color: col });
    let mesh = new Mesh(tubeGeometry, material);

    mesh.scale.x = mesh.scale.y = mesh.scale.z = 1;
    let CURVE = []
    CURVE.push(curve, mesh)
    return { CURVE }
  }

  export{ circularCurve }