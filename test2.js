var THREE = require('three');

var materialMatch = require('threejs-helper-material-assigner');
var View = require('threejs-managed-view').View;
var JITGeomSceneLoader = require('threejs-jit-geometry-scene-loader');
var formatHelper = require('threejs-jit-geometry-scene-loader/formatHelpers/customBinary');
var UVProjectorFactory = require('./');
var FPS = require('threejs-camera-controller-first-person-desktop');

var jitGeomSceneLoader;

//all you really need
var view = new View({
	// stats: true
});
view.renderer.setClearColor(0x999999);

var factory = new UVProjectorFactory(view.scene);

var basePath = './assets/';
var texturesPath = basePath + 'textures/';
var modelsPath = basePath + 'models/parseTest/';

var scenePath = modelsPath + 'parse.autodesk';
var geometryPath = modelsPath + 'geometry';

var materials = {
	
	/*notFound: new THREE.MeshPhongMaterial({
		diffuse: 0x7f7f7f,
		emissive: 0xaa99aa,
		lights: false,
		vertexColors: THREE.VertexColors
		//side: THREE.BackSide
	})*/
};

//materials.box = materials.carPaint;
function onProgress(val) {
	console.log("Scene loading progress:", val);
}
function onComplete() {
	console.log("Scene loading complete.");

	jitGeomSceneLoader.loadByName("all", true);
	jitGeomSceneLoader.loadByName("Gengon001", true);

	var uvprojector = factory.createProjector({debug: true, aspect: texture.image.width / texture.image.height, fov: 10, right: 0.5 });
	uvprojector.position.set(-3, 2, -2);
	uvprojector.lookAt(new THREE.Vector3(0,1.5,0));

	var uvprojector2 = factory.createProjector({debug: true, aspect: texture.image.width / texture.image.height, fov: 10, left: 0.5});
	uvprojector2.position.set(3, 2, 0);
	uvprojector2.lookAt(new THREE.Vector3(0,0,0));

	var step = 0.0;
	var fps = new FPS(view.camera, view.canvas);
	view.renderManager.onEnterFrame.add(function(){	
		fps.update();

		step+=0.04;
		uvprojector2.position.x =  1*Math.cos(step) + 3;
		//uvprojector2.position.y =  1*Math.abs(Math.sin(step));

		//view.camera.position.copy(uvprojector2.position);
		//view.camera.lookAt(new THREE.Vector3(0,0,0))	

		factory.update();
	});
}
function onMeshComplete(mesh) {
	materialMatch(mesh, materials);
	factory.addMesh(mesh);

	factory.update();
}

var texture = THREE.ImageUtils.loadTexture(texturesPath + "decal.png", undefined, function()
{
	console.log('loaded texture');

	materials.notFound = new THREE.ShaderMaterial({
		attributes:	{ 
			decalmask: { type: 'f', value: null }
		},
		uniforms: {
			decaltexture : { type: "t", value: texture }
		},
		vertexShader: 
		`
			attribute float decalmask;
			
			varying vec2 vUv;
			varying float vDecalMask;

			void main()
			{
				vUv = uv;
				vDecalMask = decalmask;

				gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0 );
			}
		`,
		fragmentShader: 
		`		
			uniform sampler2D decaltexture;	

			varying vec2 vUv;
			varying float vDecalMask;

			void main() 
			{
				if (vDecalMask < 0.999)
				{
					gl_FragColor = texture2D(decaltexture, vec2(0.0, 0.0));
				}
				else
				{
					gl_FragColor = texture2D(decaltexture, vUv);	
				}
			}		
		`
	});

	materials.groundPlane = materials.notFound; 
	materials.ball = materials.notFound; 
	materials.box = materials.notFound; 
	materials.pedestal = materials.notFound; 
	materials.carPaint = materials.notFound;
    
    JITGeomSceneLoader.setFormatHelper(formatHelper);
	jitGeomSceneLoader = new JITGeomSceneLoader({
		path: scenePath,
		geometryPath: geometryPath,
		targetParent: view.scene,
		materials: materials,
		onProgress: onProgress,
		onMeshComplete: onMeshComplete,
		onComplete: onComplete,
		debugLevel: 0
	});
});

