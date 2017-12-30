//////////
// MAIN //
//////////


let container, scene, camera, renderer, stats, controls;
let keyboard = new THREEx.KeyboardState();
let clock = new THREE.Clock();
let MovingCube;
let barrier = [];
let mouseEn = false;
let totAngle = 0;
let count = 0;
let maze;
let objFile = ['1_Grass_1.obj', '1_Grass_2.obj', '1_Grass_3.obj', '1_Grass_4.obj', '1_Grass_5.obj', '1_Grass_6.obj', '2_Grass_1.obj', '2_Grass_2.obj', '3_Grass_1.obj', '3_Grass_2.obj'];
let floorObj = [];
let wallFile = ['Mount_1.obj', 'Mount_2.obj', 'Mount_3.obj', 'BudBuilding_1.obj', 'BudBuilding_2.obj', 'BudBuilding_3.obj', 'RockMid_1.obj', 'RockMid_2.obj', 'RockMid_3.obj'];
let wallObj = [];
let lightchange = false;//光照改变
let auto = false;//自动走迷宫


///////////////
// FUNCTIONS //
///////////////

// Randomly generate the floor.
function floorGenerate() {
    if (objFile.length === 0) {
        for (let i = 0; i < 24; i++) {
            for (let j = 0; j < 24; j++) {
                let block = floorObj[Math.floor(Math.random() * floorObj.length)];
                block.position.set(-3300 + 300 * i, -680, -3300 + 300 * j);

                scene.add(block.clone());
            }
        }
        return;
    }
    let file = objFile.shift();
    let mtlFile;
    let mtlLoader = new THREE.MTLLoader();

    mtlLoader.setTexturePath('ExportedObj/');
    mtlLoader.setPath('ExportedObj/');
    if (file.charAt(2) === 'G') mtlFile = 'Grass.mtl';
    else if (file.charAt(2) === 'F') mtlFile = 'Flagging.mtl';
    else if (file.charAt(2) === 'M') mtlFile = 'Mud.mtl';
    mtlLoader.load(mtlFile, function (materials) {
        materials.preload();
        let objLoader = new THREE.OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.setPath('ExportedObj/');
        objLoader.load(file, function (object) {
            if (file.charAt(0) === '1') object.scale.x = object.scale.z = 5000;
            else if (file.charAt(0) === '2') object.scale.x = object.scale.z = 2500;
            else if (file.charAt(0) === '3') object.scale.x = object.scale.z = 5000 / 3;
            object.scale.y = 5000;
            object.position.set(-2700 + 300 * objFile.length, -680, -2700);
            object.receiveShadow = true;
            floorObj.push(object);
            floorGenerate();
        });
    });
}

// Generate the wall.
let x = -3000, y = 30, z = -3000;

function wallGenerate() {
    if (wallFile.length === 0) {
        for (let i = 0; i <= 20; i++) {
            for (let j = 0; j <= 20; j++) {
                if ((0 === i && 0 === j) || (20 === i && 20 === j) || (1 === i && 0 === j) || (0 === i && 1 === j) || (20 === i && 19 === j) || (19 === i && 20 === j)) {
                    barrier.push({
                        x1: x - 150,
                        y1: z - 150,
                        x2: x + 150,
                        y2: z + 150
                    });
                    let block = wallObj[Math.floor(Math.random() * 3)];
                    block.castShadow = true;
                    block.position.set(x, y, z);
                    scene.add(block.clone());
                }
                else if (i === 0 || j === 0 || i === 20 || j === 20) {
                    barrier.push({
                        x1: x - 150,
                        y1: z - 150,
                        x2: x + 150,
                        y2: z + 150
                    });
                    let block = wallObj[4];
                    if (j === 0 || j === 20) block.rotation.y = Math.PI / 2;
                    else block.rotation.y = 0;
                    block.castShadow = true;
                    block.position.set(x, y, z);
                    scene.add(block.clone());
                }
                else if (maze.mazeDataArray[i][j].value !== 1) {
                    barrier.push({
                        x1: x - 150,
                        y1: z - 150,
                        x2: x + 150,
                        y2: z + 150
                    });
                    if (i >= 1 && i <= 19 && j <= 18 && j >= 1 && maze.mazeDataArray[i][j + 1].value !== 1 && Math.random() > 0.5) {
                        barrier.push({
                            x1: x + 150,
                            y1: z - 150,
                            x2: x + 450,
                            y2: z + 150
                        });
                        maze.mazeDataArray[i][j + 1].value = 1;
                        let block = wallObj[Math.floor(Math.random() * 3) + 6];
                        block.castShadow = true;
                        block.position.set(x + 150, y, z);
                        scene.add(block.clone());
                    }
                    else if (i >= 1 && i <= 18 && j <= 19 && j >= 1 && maze.mazeDataArray[i + 1][j].value !== 1 && Math.random() > 0.5) {
                        barrier.push({
                            x1: x - 150,
                            y1: z + 150,
                            x2: x + 150,
                            y2: z + 450
                        });
                        maze.mazeDataArray[i + 1][j].value = 1;
                        let block = wallObj[Math.floor(Math.random() * 3) + 6];
                        block.position.set(x, y, z + 150);
                        block.rotation.y = Math.PI / 2;
                        block.castShadow = true;
                        scene.add(block.clone());
                        block.rotation.y = 0;
                    }
                    else {
                        let block = wallObj[Math.floor(Math.random() * 6)];
                        block.castShadow = true;
                        block.position.set(x, y, z);
                        scene.add(block.clone());
                    }
                    maze.mazeDataArray[i][j].value = 1;

                }
                x += 300;
            }
            z += 300;
            x = -3000;
        }
        return;
    }
    let file = wallFile.shift();
    let mtlFile;
    let mtlLoader = new THREE.MTLLoader();

    mtlLoader.setTexturePath('ExportedObj/');
    mtlLoader.setPath('ExportedObj/');
    if (file.charAt(0) === 'M') mtlFile = 'Mount.mtl';
    else if (file.charAt(0) === 'R') mtlFile = 'RockMid.mtl';
    else if (file.charAt(0) === 'B') mtlFile = 'BudBuilding_' + file.charAt(12) + '.mtl';
    mtlLoader.load(mtlFile, function (materials) {
        materials.preload();
        let objLoader = new THREE.OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.setPath('ExportedObj/');
        objLoader.load(file, function (object) {
            if (file.charAt(0) === 'M' || file.charAt(0) === 'B') object.scale.x = 1500;
            else if (file.charAt(0) === 'R') object.scale.x = 1500 * 1.3;
            object.scale.y = object.scale.z = 1500;
            object.castShadow = true;
            wallObj.push(object);
            wallGenerate();
        });
    });
}

function init() {

    ///////////
    // SCENE //
    ///////////
    scene = new THREE.Scene();
    ////////////
    // CAMERA //
    ////////////
    let SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
    let VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;
    camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
    scene.add(camera);
    camera.position.set(-2800, 200, -2800);
    camera.lookAt(scene.position);

    //////////////
    // RENDERER //
    //////////////

    renderer = new THREE.WebGLRenderer({antialias: true, preserveDrawingBuffer: true});
    //renderer = new THREE.CanvasRenderer();

    renderer.shadowMapEnabled = true;

    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    container = document.getElementById('ThreeJS');
    container.appendChild(renderer.domElement);

    ////////////
    // EVENTS //
    ////////////

    THREEx.WindowResize(renderer, camera);
    THREEx.FullScreen.bindKey({charCode: 'm'.charCodeAt(0)});

    //////////////
    // CONTROLS //
    //////////////

    controls = new THREE.OrbitControls(camera, renderer.domElement);

    ///////////
    // STATS //
    ///////////

    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.bottom = '0px';
    stats.domElement.style.zIndex = '100';
    container.appendChild(stats.domElement);

    ///////////
    // LIGHT //
    ///////////
    let light = new THREE.AmbientLight(0xffffff, 3);
    scene.add(light);
    // let light_1 = new THREE.PointLight(0xffffff);
    // light_1.position.set(-7000, 10000, -7000);
    // let light_2 = new THREE.PointLight(0xffffff);
    // light_2.position.set(7000, 10000, 7000);
    // let light_3 = new THREE.DirectionalLight(0xffffff, 1);
    // light_3.position.set(1, 0.5, 0);
    // scene.add(light_3);
    // let light_4 = new THREE.DirectionalLight(0xffffff, 1);
    // light_4.position.set(-1, 0.5, 0);
    // scene.add(light_4);
    // let light_5 = new THREE.DirectionalLight(0xffffff, 1);
    // light_5.position.set(0, 0.5, 1);
    // scene.add(light_5);
    // let light_6 = new THREE.DirectionalLight(0xffffff, 1);
    // light_6.position.set(0, 0.5, -1);
    // scene.add(light_6);
    // scene.add(light_2);
    //
    // light in the sun in the sky
    // let cloud_light = new THREE.PointLight(0xffffff);
    // cloud_light.castShadow = true;
    // cloud_light.position.set(3300,1200,0);
    // scene.add(cloud_light);


    ///////////
    //  MAZE //
    ///////////

    maze = new Maze(10, 10, [1, 1], [19, 19]);
    maze.generate();
    wallGenerate();

    //////////////
    //  SPHERE  //
    /////////////

    let sphereGeometry = new THREE.SphereGeometry(50, 32, 16);
    let sphereMaterial = new THREE.MeshBasicMaterial({color: 0x0000FF});
    MovingCube = new THREE.Mesh(sphereGeometry, sphereMaterial);
    MovingCube.position.set(-2700, 50, -2700);
    scene.add(MovingCube);

    ///////////
    // FLOOR //
    ///////////
    floorGenerate();

    /////////
    // SKY //
    /////////
    let imagePrefix = "images/";
    let directions = ["sky0", "sky1", "sky2", "sky3", "sky4", "sky5"];
    let imageSuffix = ".png";
    let skyGeometry = new THREE.CubeGeometry(8000, 2000, 8000);
    let materialArray = [];

    for (let i = 0; i < 6; i++)
        materialArray.push(new THREE.MeshBasicMaterial({
            map: THREE.ImageUtils.loadTexture(imagePrefix + directions[i] + imageSuffix),
            side: THREE.BackSide
        }));
    let skyMaterial = new THREE.MeshFaceMaterial(materialArray);
    let skyBox = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(skyBox);

    ///////////
    // CLOUD //
    ///////////
    // let mtlLoader = new THREE.MTLLoader();
    // mtlLoader.setBaseUrl('ExportedObj/');
    // mtlLoader.setPath('ExportedObj/');
    // mtlLoader.load('cloud.mtl', function (materials) {
    //     materials.preload();
    //
    //     let objLoader = new THREE.OBJLoader();
    //     objLoader.setMaterials(materials);
    //     objLoader.setPath('ExportedObj/');
    //     objLoader.load('cloud.obj', function (object) {
    //         object.position.set(-1050, 750, 700);
    //         object.scale.x = object.scale.z = 10;
    //         object.scale.y = 4;
    //         object.castShadow = true;
    //         scene.add(object);
    //
    //     });
    //
    //
    //     objLoader.load('cloud.obj', function (object) {
    //         object.position.set(-500, 750, 1750);
    //         object.scale.x = 10;
    //         object.scale.z = 8;
    //         object.scale.y = 4;
    //         object.rotation.y = 60;
    //         object.castShadow = true;
    //         scene.add(object);
    //
    //     });
    //
    //     objLoader.load('cloud1.obj', function (object) {
    //         object.position.set(450, 750, 950);
    //         object.scale.x = object.scale.z = 16;
    //         object.scale.y = 8;
    //         object.rotation.y = 0;
    //         object.castShadow = true;
    //         scene.add(object);
    //
    //     });
    //
    //     objLoader.load('cloud1.obj', function (object) {
    //         object.position.set(-1700, 750, 1550);
    //         object.scale.x = object.scale.z = 16;
    //         object.scale.y = 8;
    //         object.rotation.y = 0;
    //         object.castShadow = true;
    //         scene.add(object);
    //
    //     });
    //
    //     objLoader.load('cloud2.obj', function (object) {
    //         object.position.set(-800, 750, 1200);
    //         object.scale.x = object.scale.z = 10;
    //         object.scale.y = 4;
    //         object.rotation.y = 0;
    //         object.castShadow = true;
    //         scene.add(object);
    //
    //     });
    //
    //     objLoader.load('cloud2.obj', function (object) {
    //         object.position.set(-900, 750, -1700);
    //         object.scale.x = object.scale.z = 10;
    //         object.scale.y = 4;
    //         object.rotation.y = 0;
    //         object.castShadow = true;
    //         scene.add(object);
    //
    //     });
    //
    //     objLoader.load('cloud2.obj', function (object) {
    //         object.position.set(-2100, 750, 400);
    //         object.scale.x = object.scale.z = 10;
    //         object.scale.y = 4;
    //         object.rotation.y = 0;
    //         object.castShadow = true;
    //         scene.add(object);
    //
    //     });
    //
    //     objLoader.load('cloud2.obj', function (object) {
    //         object.position.set(-1500, 750, 150);
    //         object.scale.x = object.scale.z = 10;
    //         object.scale.y = 4;
    //         object.rotation.y = 0;
    //         object.castShadow = true;
    //         scene.add(object);
    //
    //     });
    //
    //     objLoader.load('cloud2.obj', function (object) {
    //         object.position.set(-700, 750, 300);
    //         object.scale.x = object.scale.z = 10;
    //         object.scale.y = 4;
    //         object.rotation.y = 0;
    //         object.castShadow = true;
    //         scene.add(object);
    //
    //     });
    //     objLoader.load('cloud2.obj', function (object) {
    //         object.position.set(0, 750, 0);
    //         object.scale.x = object.scale.z = 10;
    //         object.scale.y = 4;
    //         object.rotation.y = 50;
    //         object.castShadow = true;
    //         scene.add(object);
    //
    //     });
    //
    //     objLoader.load('cloud2.obj', function (object) {
    //         object.position.set(550, 750, 150);
    //         object.scale.x = object.scale.z = 10;
    //         object.scale.y = 4;
    //         object.rotation.y = -50;
    //         object.castShadow = true;
    //         scene.add(object);
    //
    //     });
    // });
    /////////
    // GUI //
    /////////

    let gui = new dat.GUI();
    let parameters =
        {
            cheatingEn: false,
            lightEn:false,
            autoGo:false,
            Screenshot: () => {
                if (!renderer) return;
                let img = renderer.domElement.toDataURL('image/png');
                let link = document.getElementById("screenshot");
                link.href = img.replace(/^data:image\/[^;]/, 'data:application/octet-stream');
                link.setAttribute("download", "screenshot.png");
                link.click();
            }
        };
    let tools = gui.addFolder('Tools');
    tools.add(parameters, 'Screenshot');
    let cheating = tools.add(parameters, 'cheatingEn').name("cheat").listen();
    cheating.onChange(function (value) {
        mouseEn = value;
    });
    let lightChange = tools.add(parameters, 'lightEn').name("Light").listen();
    lightChange.onChange(function (value) {
        lightchange = value;
    });
    let autogo = tools.add(parameters, 'autoGo').name("Auto").listen();
    autogo.onChange(function (value) {
        auto = value;
    });
    // tools.open();
    // gui.open();


}

function animate() {
    render();
    update();
    requestAnimationFrame(animate);
}

function update() {
    let delta = clock.getDelta();
    let moveDistance = 400 * delta; // 400 pixels per second
    let rotateAngle = Math.PI / 2 * delta;
    let tmpx = MovingCube.position.x;
    let tmpy = MovingCube.position.y;
    let tmpz = MovingCube.position.z;
    if (keyboard.pressed("W"))
        MovingCube.translateZ(-moveDistance);
    if (keyboard.pressed("S"))
        MovingCube.translateZ(moveDistance);
    if ((MovingCube.position.x > 2500 && MovingCube.position.z > 2500) || mouseEn === true) {
        if (keyboard.pressed("A"))
            MovingCube.translateX(-moveDistance);
        if (keyboard.pressed("D"))
            MovingCube.translateX(moveDistance);
    }
    let x1 = MovingCube.position.x - 30;
    let y1 = MovingCube.position.z - 30;
    let x2 = MovingCube.position.x + 30;
    let y2 = MovingCube.position.z + 30;
    let tag = 0;
    barrier.forEach(function (item) {
        let tmpx1 = Math.max(item.x1, x1);
        let tmpy1 = Math.max(item.y1, y1);
        let tmpx2 = Math.min(item.x2, x2);
        let tmpy2 = Math.min(item.y2, y2);
        if ((tmpx1 < tmpx2) && (tmpy1 < tmpy2)) {
            tag = 1;
        }
    });
    if (tag === 1) {
        MovingCube.position.set(tmpx, tmpy, tmpz);
    }
    if ((MovingCube.position.x > 2500 && MovingCube.position.z > 2500) || mouseEn === true) {
        count++;
        if (count === 1) {
            MovingCube.rotateOnAxis(new THREE.Vector3(0, 1, 0), -totAngle);
            camera.position.set(0, 8000, 0);
            camera.lookAt(scene.position);
        }
        controls.update();
    }
    else if (tag === 0) {
        if (count !== 0) {
            count = 0;
            MovingCube.rotateOnAxis(new THREE.Vector3(0, 1, 0), totAngle);
        }
        let relativeCameraOffset = new THREE.Vector3(0, 100, 200);
        let cameraOffset = relativeCameraOffset.applyMatrix4(MovingCube.matrixWorld);
        camera.position.x = cameraOffset.x;
        camera.position.y = cameraOffset.y;
        camera.position.z = cameraOffset.z;
        if (keyboard.pressed("A")) {
            totAngle += rotateAngle;
            MovingCube.rotateOnAxis(new THREE.Vector3(0, 1, 0), rotateAngle);
        }
        if (keyboard.pressed("D")) {
            totAngle -= rotateAngle;
            MovingCube.rotateOnAxis(new THREE.Vector3(0, 1, 0), -rotateAngle);
        }
        camera.lookAt(new THREE.Vector3(MovingCube.position.x, MovingCube.position.y + 100, MovingCube.position.z));
    }
    stats.update();
}

function render() {
    renderer.render(scene, camera);
}

function gameStart() {
    init();
    animate();
}
