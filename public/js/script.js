var camera, scene, renderer;
var mesh;
var stats;
var resolution, numBlobs, mesh;
var currentMaterial, material, material2;
var camCtrls;

var allLoaded = true;

var clock = new THREE.Clock();
var time = 0;
var start = Date.now();

function createShaderMaterial( id, light, ambientLight ) {
    var shader = THREE.ShaderToon[ id ];
    var u = THREE.UniformsUtils.clone( shader.uniforms );
    var vs = shader.vertexShader;
    var fs = shader.fragmentShader;
    var material = new THREE.ShaderMaterial( { uniforms: u, vertexShader: vs, fragmentShader: fs } );
    material.uniforms.uDirLightPos.value = light.position;
    material.uniforms.uDirLightColor.value = light.color;
    material.uniforms.uAmbientLightColor.value = ambientLight.color;
    return material;
}

function generateMaterials() {
    // environment map
    var path = "/img/textures/SwedishRoyalCastle/";
    var format = '.jpg';
    var urls = [
        path + 'px' + format, path + 'nx' + format,
        path + 'py' + format, path + 'ny' + format,
        path + 'pz' + format, path + 'nz' + format
    ];
    var cubeTextureLoader = new THREE.CubeTextureLoader();
    var reflectionCube = cubeTextureLoader.load( urls );
    reflectionCube.format = THREE.RGBFormat;
    var refractionCube = cubeTextureLoader.load( urls );
    reflectionCube.format = THREE.RGBFormat;
    refractionCube.mapping = THREE.CubeRefractionMapping;
    // toons
    var toonMaterial1 = createShaderMaterial( "toon1", light, ambientLight ),
    toonMaterial2 = createShaderMaterial( "toon2", light, ambientLight ),
    hatchingMaterial = createShaderMaterial( "hatching", light, ambientLight ),
    hatchingMaterial2 = createShaderMaterial( "hatching", light, ambientLight ),
    dottedMaterial = createShaderMaterial( "dotted", light, ambientLight ),
    dottedMaterial2 = createShaderMaterial( "dotted", light, ambientLight );
    hatchingMaterial2.uniforms.uBaseColor.value.setRGB( 0, 0, 0 );
    hatchingMaterial2.uniforms.uLineColor1.value.setHSL( 0, 0.8, 0.5 );
    hatchingMaterial2.uniforms.uLineColor2.value.setHSL( 0, 0.8, 0.5 );
    hatchingMaterial2.uniforms.uLineColor3.value.setHSL( 0, 0.8, 0.5 );
    hatchingMaterial2.uniforms.uLineColor4.value.setHSL( 0.1, 0.8, 0.5 );
    dottedMaterial2.uniforms.uBaseColor.value.setRGB( 0, 0, 0 );
    dottedMaterial2.uniforms.uLineColor1.value.setHSL( 0.05, 1.0, 0.5 );
    var texture = new THREE.TextureLoader().load( "/img/textures/UV_Grid_Sm.jpg" );
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    var materials = {
    "chrome" :
    {
        m: new THREE.MeshLambertMaterial( { color: 0xffffff, envMap: reflectionCube } ),
        h: 0, s: 0, l: 1
    },
    "liquid" :
    {
        m: new THREE.MeshLambertMaterial( { color: 0xffffff, envMap: refractionCube, refractionRatio: 0.85 } ),
        h: 0, s: 0, l: 1
    },
    "shiny"  :
    {
        m: new THREE.MeshStandardMaterial( { color: 0x550000, envMap: reflectionCube, roughness: 0.1, metalness: 1.0 } ),
        h: 0, s: 0.8, l: 0.2
    },
    "matte" :
    {
        m: new THREE.MeshPhongMaterial( { color: 0x000000, specular: 0x111111, shininess: 1 } ),
        h: 0, s: 0, l: 1
    },
    "flat" :
    {
        m: new THREE.MeshPhongMaterial( { color: 0x000000, specular: 0x111111, shininess: 1, shading: THREE.FlatShading } ),
        h: 0, s: 0, l: 1
    },
    "textured" :
    {
        m: new THREE.MeshPhongMaterial( { color: 0xffffff, specular: 0x111111, shininess: 1, map: texture } ),
        h: 0, s: 0, l: 1
    },
    "colors" :
    {
        m: new THREE.MeshPhongMaterial( { color: 0xffffff, specular: 0xffffff, shininess: 2, vertexColors: THREE.VertexColors } ),
        h: 0, s: 0, l: 1
    },
    "plastic" :
    {
        m: new THREE.MeshPhongMaterial( { color: 0x000000, specular: 0x888888, shininess: 250 } ),
        h: 0.6, s: 0.8, l: 0.1
    },
    "toon1"  :
    {
        m: toonMaterial1,
        h: 0.2, s: 1, l: 0.75
    },
    "toon2" :
    {
        m: toonMaterial2,
        h: 0.4, s: 1, l: 0.75
    },
    "hatching" :
    {
        m: hatchingMaterial,
        h: 0.2, s: 1, l: 0.9
    },
    "hatching2" :
    {
        m: hatchingMaterial2,
        h: 0.0, s: 0.8, l: 0.5
    },
    "dotted" :
    {
        m: dottedMaterial,
        h: 0.2, s: 1, l: 0.9
    },
    "dotted2" :
    {
        m: dottedMaterial2,
        h: 0.1, s: 1, l: 0.5
    }
    };
    return materials;
}

// this controls content of marching cubes voxel field
function updateCubes( object, time, numblobs, floor, wallx, wallz ) {
    object.reset();
    // fill the field with some metaballs
    var i, ballx, bally, ballz, subtract, strength;
    subtract = 12;

    strength = 2.1 / ( ( Math.sqrt( numblobs ) - 1 ) / 4 + 1 );
    for ( i = 0; i < numblobs; i ++ ) {
        ballx = Math.sin( i + 1.26 * time * ( 1.03 + 0.5 * Math.cos( 0.21 * i ) ) ) * 0.27 + 0.5;
        bally = Math.cos( i + 1.12 * time * 0.21 * Math.sin( (0.72 + 0.83 * i ) ) ) * 0.27 + 0.5; // dip into the floor
        ballz = Math.cos( i + 1.32 * time * 0.1 * Math.sin( ( 0.92 + 0.53 * i ) ) ) * 0.27 + 0.5;
        object.addBall(ballx, bally, ballz, strength, subtract);
    }
    if ( floor ) object.addPlaneY( 2, 12 );
    if ( wallz ) object.addPlaneZ( 2, 12 );
    if ( wallx ) object.addPlaneX( 2, 12 );
}

function loadModel() {
    if ( mesh ){
        scene.remove( mesh );
    }
    //CUBES
    resolution = 50;
    numBlobs = 10;
    //effect = new THREE.MarchingCubes( resolution, materials[ current_material ].m, true, true );
    mesh = new THREE.MarchingCubes( resolution, currentMaterial, true, true );
    mesh.position.set( 0, 0, 0 );
    mesh.scale.set( 200, 200, 200 );
    mesh.enableUvs = false;
    mesh.enableColors = false;
    scene.add( mesh );
}

function loadTexture( name ){

    if (!mesh){
        return;
    }
    else if (name == ''){
        currentMaterial = new THREE.MeshNormalMaterial();
        mesh.material = currentMaterial;
        return;
    }

    // instantiate a loader
    var textureLoader = new THREE.TextureLoader();

    // load a resource
    textureLoader.load(
        // resource URL
        'img/textures/matcap'+name+'.jpg',
        // Function when resource is loaded
        function ( texture ) {
            // do something with the texture
            material = new THREE.ShaderMaterial( {
                uniforms: { 
                    tMatCap: { type: 't', value: texture },
                },
                vertexShader: document.getElementById( 'sem-vs' ).textContent,
                fragmentShader: document.getElementById( 'sem-fs' ).textContent,
                shading: THREE.SmoothShading
                
            } );
            material.uniforms.tMatCap.value.wrapS = material.uniforms.tMatCap.value.wrapT = THREE.ClampToEdgeWrapping;

            material2 = new THREE.ShaderMaterial( {
                uniforms: { 
                    tMatCap: { type: 't', value: texture },
                },
                vertexShader: document.getElementById( 'sem2-vs' ).textContent,
                fragmentShader: document.getElementById( 'sem2-fs' ).textContent,
                shading: THREE.SmoothShading
                
            } );
            material2.uniforms.tMatCap.value.wrapS = material2.uniforms.tMatCap.value.wrapT = THREE.ClampToEdgeWrapping;

            currentMaterial = material;

            mesh.material = currentMaterial;

            allLoaded = true;
        },
        // Function called when download progresses
        function ( xhr ) {
            console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
        },
        // Function called when download errors
        function ( xhr ) {
            console.log( 'An error happened' );
            console.log( xhr);
        }
    );
}

function init() {
    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, .01, 100000 );
    camera.position.z = 500;
    scene = new THREE.Scene();

    renderer = new THREE.WebGLRenderer({
		alpha: true,
		antialias: true
	});
    //renderer.setClearColor(0xf0f0f0);
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    //CONTROLS
    camCtrls = new OrbitControls(camera,renderer.domElement);

    // LIGHTS
    light = new THREE.DirectionalLight( 0xffffff );
    light.position.set( 0.5, 0.5, 1 );
    scene.add( light );
    pointLight = new THREE.PointLight( 0xff3300 );
    pointLight.position.set( 0, 0, 1000 );
    //scene.add( pointLight );
    ambientLight = new THREE.AmbientLight( 0x080808 );
    scene.add( ambientLight );

    // MATERIALS
    materials = generateMaterials();
    current_material = "textured";

    currentMaterial = new THREE.MeshNormalMaterial();

    loadModel();

    

    //ADD CANVAS TO DOCUMENT
    var element = renderer.domElement;
	element.id = "view";
	$('#anim').append( element );

    //ADD STATS TO DOCUMENT
    stats = new Stats();
    stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
    $('#anim').append( stats.dom );
    //
    window.addEventListener( 'resize', onWindowResize, false );
    animate();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate() {
    requestAnimationFrame( animate );

    stats.begin();
    if (allLoaded){
        var delta = clock.getDelta();
        time += delta * 0.5;
        //updateCubes( effect, time, numBlobs);
        updateCubes( mesh, .0005 * ( Date.now() - start ), numBlobs );
        renderer.render( scene, camera );
    };

    stats.end();
}

$(document).ready(init);