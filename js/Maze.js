//////////
// MAIN //
//////////


let container, scene, camera, renderer, stats, controls;
let keyboard = new THREEx.KeyboardState();
let clock = new THREE.Clock();
let MovingCube;
let barrier = [];
let mouseEn;
let lightIntensity = 40;
let totAngle = 0;
let count = 0;
let maze;
let objFile = ['1_Grass_1.obj', '1_Grass_2.obj', '1_Grass_3.obj', '1_Grass_4.obj', '1_Grass_5.obj', '1_Grass_6.obj', '2_Grass_1.obj', '2_Grass_2.obj', '3_Grass_1.obj', '3_Grass_2.obj'];
let floorObj = [];
let wallFile = ['Mount_1.obj', 'Mount_2.obj', 'Mount_3.obj', 'BudBuilding_1.obj', 'BudBuilding_2.obj', 'BudBuilding_3.obj', 'RockMid_1.obj', 'RockMid_2.obj', 'RockMid_3.obj'];
let wallFile2 = ['Mount_1.obj', 'Mount_2.obj', 'Mount_3.obj', 'BudBuilding_1.obj', 'BudBuilding_2.obj', 'BudBuilding_3.obj', 'RockMid_1.obj', 'RockMid_2.obj', 'RockMid_3.obj'];
let wallObj = [];
let manFile = ['left.obj', 'left1.obj', 'mid.obj', 'right1.obj', 'right.obj'];
let manObj = [];
let tmpManObj = 3;
let tmpManObjRight = true;
let isSunny = 'Dark';//场景改变
let skyboxchange = false;
let collisionEn = false;
let skyBox;
let skyBoxBlack;
let cloud;
let cloudAngel = -Math.PI;
let cloudR = -3000;
let auto = false;//自动走迷宫
let role = [];
let roleHull = [];
for(let i = 0; i <= 5; i++)
    roleHull[i] = [];
let bpoint;
let light = new THREE.AmbientLight(0xffffff, lightIntensity/10);
let isLightChange = false;
///////////////
// FUNCTIONS //
///////////////
let remainLoading = 8;
function onStart() {
    document.getElementById("ThreeJS").setAttribute("style", "position: absolute; left:0; top:0;");
    document.getElementById("Loading").setAttribute("style", "display:none;");
}
function onLoadObject() {
     if(--remainLoading === 0) {
         document.getElementById("startButton").disabled = false;
         document.getElementById("startButton").addEventListener('click', onStart ,false);
    }
}
function add(x,y){
    return {x:x.x+y.x,y:x.y+y.y};
}
function sub(x,y){
    return {x:x.x-y.x,y:x.y-y.y};
}
function multi(x,d){
    return {x:x.x*d,y:x.y*d};
}
function div(x,d){
    return {x:x.x/d,y:x.y/d};
}
function dot(x,y){
    return x.x*y.x+x.y*y.y;
}
function det(x,y){
    return x.x*y.y-x.y*y.x;
}
function inter(x,y){
    let u=div(x.P,y.P);
    let t=det(u,y.v)/det(y.v,x.v);
    return add(x.P,multi(x.v,t));
}
function parallel(x,y){
    return det(y.v,x.v)===0;
}
function lineleft(x,y){
    let tp=det(x.v,y.v);
    return (tp>0)||((tp===0)&&det(x.v,sub(y.P,x.P))>0);
}
function ptright(x, y){
    return det(y.v,sub(x,y.P))<=0;
}///<=
function cmp(x,y){//极角排序
    if(x.v.y===0 && y.v.y===0) return x.v.x<y.v.x;//y都为0
    if(x.v.y<=0 && y.v.y<=0) return lineleft(x,y);//同在上部
    if(x.v.y>0  && y.v.y>0 ) return lineleft(x,y);//同在下部
    return x.v.y<y.v.y;//一上一下
}
let l = [];
let s = [];
function half_plane_intersection(){//half-plane intersection
    l.sort(cmp);//sort
    let m = l.length;
    let tp=-1;
    for(let i=0;i<m;i++){
        if(i===0||!parallel(l[i],l[i-1])) tp++;//平行特判
        l[tp-1]=l[i];
    }
    m=tp;
    let L=1;
    let R=2;
    s[1]=l[0];
    s[2]=l[1];
    for(let i=2;i<=m;i++){
        while(L<R && ptright(inter(s[R],s[R-1]),l[i])) R--;
        while(L<R && ptright(inter(s[L],s[L+1]),l[i])) L++;
        console.log(L,R);
        R++;
        s[R]=l[i];
    }
    while(L<R && ptright(inter(s[R],s[R-1]),s[L])) R--;//最后删除无用平面
    return R-L>1;
}
// 可以借助cos a 在0-180之间，单调递减！！！
// 这里用的是叉积，正弦的判断
function multiply(p1,p2,p0){
    return((p1.x-p0.x)*(p2.y-p0.y)-(p2.x-p0.x)*(p1.y-p0.y));
}
function distance_no_sqrt(p1,p2)
{
    return((p1.x-p2.x)*(p1.x-p2.x)+(p1.y-p2.y)*(p1.y-p2.y));
}
function compare(p1,p2)
{
    if((multiply(p1, p2, bpoint) > 0) || (multiply(p1, p2, bpoint) === 0 && distance_no_sqrt(bpoint, p1) < distance_no_sqrt(bpoint, p2)))
    {
        return -1;
    }
    else return 1;
}
function Graham_scan(pointSet,ch,n){
    // 这里会修改pointSet
    let i, k = 0, top = 2;
    // 找到一个基点，基本就是保证最下面最左面的点
    for(i=1;i<n;i++){
        if((pointSet[i].y<pointSet[k].y) || ((pointSet[i].y===pointSet[k].y) && (pointSet[i].x<pointSet[k].x))){
            k=i;
        }
    }
    let tmp = pointSet[0];
    pointSet[0]=pointSet[k];
    pointSet[k]=tmp;
    bpoint = pointSet[0];
    pointSet.sort(compare);
    ch.push(pointSet[0]);
    ch.push(pointSet[1]);
    ch.push(pointSet[2]);
    for (i=3;i<n;i++){
        while (top !== 0 && !(multiply(ch[top-1],ch[top],pointSet[i]) > 0)) {
            top--;
            ch.pop();
        }
        top++;
        ch.push(pointSet[i]);
    }
}
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
            onLoadObject();
        });
    });
}

// Generate the wall.
let x = -3000, y = 30, z = -3000;
let mapArr = [];

function wallGenerate() {
    if (wallFile.length === 0) {
        for (let i = 0; i <= 20; i++) {
            let arr = [];
            for (let j = 0; j <= 20; j++) {
                if ((0 === i && 0 === j) || (20 === i && 20 === j) || (1 === i && 0 === j) || (0 === i && 1 === j) || (20 === i && 19 === j) || (19 === i && 20 === j)) {
                    barrier.push({
                        x1: x - 150,
                        y1: z - 150,
                        x2: x + 150,
                        y2: z + 150,
                        i: i,
                        j: j,
                        x: x,
                        z: z,
                        r: false
                    });
                    let block = wallObj[Math.floor(Math.random() * 3)];
                    arr[j] = Math.floor(Math.random() * 3);
                    block.castShadow = true;
                    block.position.set(x, y, z);
                    scene.add(block.clone());
                }
                else if (i === 0 || j === 0 || i === 20 || j === 20) {
                    let r = false;
                    let block = wallObj[4];
                    arr[j] = 4;
                    if (j === 0 || j === 20) {
                        block.rotation.y = Math.PI / 2;
                        r = true;
                    }
                    else block.rotation.y = 0;
                    barrier.push({
                        x1: x - 150,
                        y1: z - 150,
                        x2: x + 150,
                        y2: z + 150,
                        i: i,
                        j: j,
                        x: x,
                        z: z,
                        r: r
                    });
                    block.castShadow = true;
                    block.position.set(x, y, z);
                    scene.add(block.clone());
                }
                else if (maze.mazeDataArray[i][j].value !== 1) {
                    if (i >= 1 && i <= 19 && j <= 18 && j >= 1 && maze.mazeDataArray[i][j + 1].value !== 1 && Math.random() > 0.5) {
                        barrier.push({
                            x1: x - 150,
                            y1: z - 150,
                            x2: x + 450,
                            y2: z + 150,
                            i: i,
                            j: j,
                            x: x + 150,
                            z: z,
                            r: false
                        });
                        maze.mazeDataArray[i][j + 1].value = 1;
                        let block = wallObj[Math.floor(Math.random() * 3) + 6];
                        arr[j] = Math.floor(Math.random() * 3) + 6;
                        block.castShadow = true;
                        block.position.set(x + 150, y, z);
                        scene.add(block.clone());
                    }
                    else if (i >= 1 && i <= 18 && j <= 19 && j >= 1 && maze.mazeDataArray[i + 1][j].value !== 1 && Math.random() > 0.5) {
                        barrier.push({
                            x1: x - 150,
                            y1: z - 150,
                            x2: x + 150,
                            y2: z + 450,
                            i: i,
                            j: j,
                            x: x,
                            z: z + 150,
                            r: true
                        });
                        maze.mazeDataArray[i + 1][j].value = 1;
                        let block = wallObj[Math.floor(Math.random() * 3) + 6];
                        arr[j] = Math.floor(Math.random() * 3) + 6;
                        block.position.set(x, y, z + 150);
                        block.rotation.y = Math.PI / 2;
                        block.castShadow = true;
                        scene.add(block.clone());
                        block.rotation.y = 0;
                    }
                    else {
                        barrier.push({
                            x1: x - 150,
                            y1: z - 150,
                            x2: x + 150,
                            y2: z + 150,
                            i: i,
                            j: j,
                            x: x,
                            z: z,
                            r: false
                        });
                        let block = wallObj[Math.floor(Math.random() * 6)];
                        arr[j] = Math.floor(Math.random() * 6);
                        block.castShadow = true;
                        block.position.set(x, y, z);
                        scene.add(block.clone());
                    }
                    maze.mazeDataArray[i][j].value = 1;
                }
                x += 300;
            }
            mapArr[i] = arr;
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
    camera.lookAt(-scene.position);

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

    windowResize(renderer, camera);

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
    console.log(mapArr);
    //////////////
    //  SPHERE  //
    /////////////

    let sphereGeometry = new THREE.SphereGeometry(0, 0, 0);
    let sphereMaterial = new THREE.MeshBasicMaterial({color: 0x0000FF});
    MovingCube = new THREE.Mesh(sphereGeometry, sphereMaterial);
    MovingCube.position.set(-2700, 50, -2700);
    for(let k=0; k<5; k++){
        manObj[k] = new THREE.Mesh(sphereGeometry, sphereMaterial);
        manObj[k].position.set(-2700, 50, -2700);
    }
    //scene.add(MovingCube);
    let mtlLoaderMan = new THREE.MTLLoader();
    mtlLoaderMan.setTexturePath('ExportedObj/Man/');
    mtlLoaderMan.setPath('ExportedObj/Man/');
    mtlLoaderMan.load('mid.mtl', function (materials) {
        materials.preload();
    
        let objLoader = new THREE.OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.setPath('ExportedObj/Man/');
        objLoader.load(manFile[0], function (object) {
            object.traverse( function ( child ) {
                        if ( child instanceof THREE.Mesh ) {  
                            child.rotateOnAxis(new THREE.Vector3(0, 1, 0), Math.PI );
                        }  
                    } ); 
            object.scale.x = object.scale.y = object.scale.z = 20;
            object.position.set(-2700 , 50, -2700);
            object.rotation.y = 0;
            manObj[0] = object;
            let arr = [];
            let url = 'ExportedObj/Man/' + manFile[0];
            let htmlobj =  $.ajax({url:url,async:false});
            let dataList = htmlobj.responseText.split("\n");
            let hull = [];
            for(let i = 0; i < dataList.length; i++)
            {
                let pointList = dataList[i].split(" ");
                if(pointList[0] === 'v')
                {
                    hull.push({
                        x: parseFloat(pointList[1])*20,
                        y: parseFloat(pointList[2])*20
                    });
                }
            }
            Graham_scan(hull, arr, hull.length);
            roleHull[0] = arr;
        });
    });
    mtlLoaderMan.load('mid.mtl', function (materials) {
        materials.preload();
    
        let objLoader = new THREE.OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.setPath('ExportedObj/Man/');
        objLoader.load(manFile[1], function (object) {
            object.traverse( function ( child ) {
                        if ( child instanceof THREE.Mesh ) {  
                            child.rotateOnAxis(new THREE.Vector3(0, 1, 0), Math.PI );
                        }  
                    } ); 
            object.scale.x = object.scale.y = object.scale.z = 20;
            object.position.set(-2700 , 50, -2700);
            object.rotation.y = 0;
            manObj[1] = object;
            let arr = [];
            let url = 'ExportedObj/Man/' + manFile[1];
            let htmlobj =  $.ajax({url:url,async:false});
            let dataList = htmlobj.responseText.split("\n");
            let hull = [];
            for(let i = 0; i < dataList.length; i++)
            {
                let pointList = dataList[i].split(" ");
                if(pointList[0] === 'v')
                {
                    hull.push({
                        x: parseFloat(pointList[1])*20,
                        y: parseFloat(pointList[3])*20
                    });
                }
            }
            Graham_scan(hull, arr, hull.length);
            roleHull[1] = arr;
        });
    });    
    mtlLoaderMan.load('mid.mtl', function (materials) {
        materials.preload();
    
        let objLoader = new THREE.OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.setPath('ExportedObj/Man/');
        objLoader.load(manFile[2], function (object) {
            object.traverse( function ( child ) {
                        if ( child instanceof THREE.Mesh ) {  
                            child.rotateOnAxis(new THREE.Vector3(0, 1, 0), 0.62 * Math.PI );
                        }  
                    } ); 
            object.scale.x = object.scale.y = object.scale.z = 20;
            object.position.set(-2700 , 50, -2700);
            object.rotation.y = 0;
            manObj[2] = object;
            MovingCube = object;
            scene.add(object);
            let arr = [];
            let url = 'ExportedObj/Man/' + manFile[2];
            let htmlobj =  $.ajax({url:url,async:false});
            let dataList = htmlobj.responseText.split("\n");
            let hull = [];
            for(let i = 0; i < dataList.length; i++)
            {
                let pointList = dataList[i].split(" ");
                if(pointList[0] === 'v')
                {
                    hull.push({
                        x: parseFloat(pointList[1])*20,
                        y: parseFloat(pointList[3])*20
                    });
                }
            }
            Graham_scan(hull, arr, hull.length);
            roleHull[2] = arr;
            for(let i = 0; i < arr.length; i++)
            {
                role.push({
                    x: arr[i].x,
                    y: arr[i].y
                })
            }
        });
    });
    console.log(role);
    mtlLoaderMan.load('mid.mtl', function (materials) {
        materials.preload();
    
        let objLoader = new THREE.OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.setPath('ExportedObj/Man/');
        objLoader.load(manFile[3], function (object) {
            object.traverse( function ( child ) {
                        if ( child instanceof THREE.Mesh ) {  
                            child.rotateOnAxis(new THREE.Vector3(0, 1, 0), 0.85 * Math.PI );
                        }  
                    } ); 
            object.scale.x = object.scale.y = object.scale.z = 20;
            object.position.set(-2700 , 50, -2700);
            object.rotation.y = 0;
            manObj[3] = object;
            let arr = [];
            let url = 'ExportedObj/Man/' + manFile[3];
            let htmlobj =  $.ajax({url:url,async:false});
            let dataList = htmlobj.responseText.split("\n");
            let hull = [];
            for(let i = 0; i < dataList.length; i++)
            {
                let pointList = dataList[i].split(" ");
                if(pointList[0] === 'v')
                {
                    hull.push({
                        x: parseFloat(pointList[1])*20,
                        y: parseFloat(pointList[3])*20
                    });
                }
            }
            Graham_scan(hull, arr, hull.length);
            roleHull[3] = arr;
        });
    });
    mtlLoaderMan.load('mid.mtl', function (materials) {
        materials.preload();
    
        let objLoader = new THREE.OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.setPath('ExportedObj/Man/');
        objLoader.load(manFile[4], function (object) {
            object.traverse( function ( child ) {
                        if ( child instanceof THREE.Mesh ) {  
                            child.rotateOnAxis(new THREE.Vector3(0, 1, 0), 0.79 * Math.PI );
                        }  
                    } ); 
            object.scale.x = object.scale.y = object.scale.z = 20;
            object.rotation.y = 0;
            object.position.set(-2700 , 50, -2700);
            manObj[4] = object;
            let arr = [];
            let url = 'ExportedObj/Man/' + manFile[4];
            let htmlobj =  $.ajax({url:url,async:false});
            let dataList = htmlobj.responseText.split("\n");
            let hull = [];
            for(let i = 0; i < dataList.length; i++)
            {
                let pointList = dataList[i].split(" ");
                if(pointList[0] === 'v')
                {
                    hull.push({
                        x: parseFloat(pointList[1])*20,
                        y: parseFloat(pointList[3])*20
                    });
                }
            }
            Graham_scan(hull, arr, hull.length);
            roleHull[4] = arr;
        });
    });
    ///////////
    // FLOOR //
    ///////////
    floorGenerate();

    /////////
    // SKY //
    /////////
    let imagePrefixBlack = "images/black";
    let imagePrefix = "images/";
    let directions = ["posx", "negx", "posy", "negy", "posz", "negz"];
    let imageSuffix = ".png";
    let skyGeometry = new THREE.CubeGeometry(8000, 8000, 8000);
    let materialArrayBlack = [];
    let materialArray = [];

    for (let i = 0; i < 6; i++)
        materialArrayBlack.push(new THREE.MeshBasicMaterial({
            map: THREE.ImageUtils.loadTexture(imagePrefixBlack + directions[i] + imageSuffix),
            side: THREE.BackSide
        }));
    for (let i = 0; i < 6; i++)
        materialArray.push(new THREE.MeshBasicMaterial({
            map: THREE.ImageUtils.loadTexture(imagePrefix + directions[i] + imageSuffix),
            side: THREE.BackSide
        }));
    let skyMaterialBlack = new THREE.MeshFaceMaterial(materialArrayBlack);
    let skyMaterial = new THREE.MeshFaceMaterial(materialArray);
    skyBoxBlack = new THREE.Mesh(skyGeometry, skyMaterialBlack);
    skyBox = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(skyBoxBlack);

    ///////////
    // CLOUD //
    ///////////
    cloud = new THREE.Mesh(sphereGeometry, sphereMaterial);
    cloud.position.set(2000, 2000, 2000);
    let mtlLoaderCloud = new THREE.MTLLoader();
    mtlLoaderCloud.setBaseUrl('ExportedObj/');
    mtlLoaderCloud.setPath('ExportedObj/');
    mtlLoaderCloud.load('cloud.mtl', function (materials) {
        materials.preload();
    
        let objLoader = new THREE.OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.setPath('ExportedObj/');
        objLoader.load('cloud.obj', function (object) {
            //cloud = object;
            object.position.set(cloudR*Math.cos(cloudAngel), 2000, cloudR*Math.sin(cloudAngel));
            object.scale.x = object.scale.z = 10;
            object.scale.y = 5;
            object.castShadow = true;
            cloud = object;
            scene.add(object);
    
        });
        //scene.add(cloud);
    });
    /////////
    // GUI //
    /////////

    let gui = new dat.GUI();
    let parameters =
        {
            cheatingEn: false,
            scene:'Dark',
            autoGo:false,
            collisionEn:false,
            Intensity:40,
            Screenshot: () => {
                if (!renderer) return;
                let img = renderer.domElement.toDataURL('image/png');
                let link = document.getElementById("screenshot");
                link.href = img.replace(/^data:image\/[^;]/, 'data:application/octet-stream');
                let myDate = new Date();
                link.setAttribute("download", "screenshot"+myDate.getHours().toString()
                    +myDate.getMinutes().toString()+myDate.getSeconds().toString()+".png");
                link.click();
            }
        };
    gui.add(parameters, 'Screenshot');
    let cheating = gui.add(parameters, 'cheatingEn').name("cheat").listen();
    cheating.onChange(function (value) {
        mouseEn = value;
    });
    let autogo = gui.add(parameters, 'autoGo').name("Auto").listen();
    autogo.onChange(function (value) {
        auto = value;
    });
    let collision = gui.add(parameters, 'collisionEn').name("Collision").listen();
    collision.onChange(function (value) {
        collisionEn = value;
    });
    let issunny = gui.add(parameters, 'scene',['Dark','BlueSky']).name("Scene").listen();
    issunny.onChange(function (value) {
        isSunny = value;
    });
    let lightChange = gui.add(parameters, 'Intensity', 0, 100).name("Light").listen();
    lightChange.onChange(function (value) {
       lightIntensity = value;
       isLightChange = true;
    });
    gui.close();
}

function animate() {
    render();
    update();
    requestAnimationFrame(animate);
}
let cnt = 0;
function update() {
    let delta = clock.getDelta();
    let moveDistance = 400 * delta; // 400 pixels per second
    let rotateAngle = Math.PI / 2 * delta;
    let tmpx = MovingCube.position.x;
    let tmpy = MovingCube.position.y;
    let tmpz = MovingCube.position.z;
    let newtmp = 2;
    let newtmpright = false;
    cloudAngel += Math.PI/500;
    if(cloudAngel > Math.PI)
        cloudAngel = cloudAngel-2*Math.PI;
    cloudR += 1;
    if(cloudR > 3000)
        cloudR = cloudR - 6000;
    cloud.position.set(cloudR*Math.cos(cloudAngel), 2000, cloudR*Math.sin(cloudAngel));
    if(tmpManObjRight && cnt % 6 === 0) {
        if (tmpManObj < 4)
            newtmp = tmpManObj + 1;
        else {
            newtmp = tmpManObj - 1;
            newtmpright = false;
        }
    }
    else if(cnt % 8 === 0){
        if (tmpManObj > 1)
            newtmp = tmpManObj - 1;
        else {
            newtmp = tmpManObj + 1;
            newtmpright = true;
        }
    }
    else
    {
        newtmp = tmpManObj;
        newtmpright = tmpManObjRight;
    }
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
            if(collisionEn === true) {
                //console.log("FUCKING",item.i ,item.j, item.x, item.z);
                let url = 'ExportedObj/' + wallFile2[mapArr[item.i][item.j]];
                let htmlobj = $.ajax({url: url, async: false});
                let dataList = htmlobj.responseText.split("\n");
                let hull = [];
                for (let i = 0; i < dataList.length; i++) {
                    let pointList = dataList[i].split(" ");
                    if (pointList[0] === 'v') {
                        if (item.r === false) {
                            if (wallFile2[mapArr[item.i][item.j]].charAt(0) === 'M' || wallFile2[mapArr[item.i][item.j]].charAt(0) === 'B') {
                                hull.push({
                                    x: parseFloat(pointList[1]) * 1500 + item.x,
                                    y: parseFloat(pointList[3]) * 1500 + item.z
                                });
                            }
                            else if (wallFile2[mapArr[item.i][item.j]].charAt(0) === 'R') {
                                hull.push({
                                    x: parseFloat(pointList[1]) * 1500 * 1.3 + item.x,
                                    y: parseFloat(pointList[3]) * 1500 + item.z
                                });
                            }
                        }
                        else {
                            if (wallFile2[mapArr[item.i][item.j]].charAt(0) === 'M' || wallFile2[mapArr[item.i][item.j]].charAt(0) === 'B') {
                                hull.push({
                                    x: -1 * (parseFloat(pointList[3]) * 1500) + item.x,
                                    y: parseFloat(pointList[1]) * 1500 + item.z
                                });
                            }
                            else if (wallFile2[mapArr[item.i][item.j]].charAt(0) === 'R') {
                                hull.push({
                                    x: -1 * (parseFloat(pointList[3]) * 1500) + item.x,
                                    y: parseFloat(pointList[1]) * 1500 * 1.3 + item.z
                                });
                            }
                        }
                    }
                }
                let fhull = [];
                Graham_scan(hull, fhull, hull.length);
                let geometry = new THREE.Geometry();
                for (let i = 0; i < fhull.length; i++) {
                    //给空白几何体添加点信息，这里写3个点，geometry会把这些点自动组合成线，面。
                    geometry.vertices.push(new THREE.Vector3(fhull[i].x, 50, fhull[i].y));
                }
                //线构造
                let line = new THREE.Line(geometry);
                //scene.add(line);
                let geometry2 = new THREE.Geometry();
                for (let i = 0; i < role.length; i++) {
                    //给空白几何体添加点信息，这里写3个点，geometry会把这些点自动组合成线，面。
                    geometry2.vertices.push(new THREE.Vector3(role[i].x + MovingCube.position.x, 50, role[i].y + MovingCube.position.z));
                }
                //线构造
                let line2 = new THREE.Line(geometry2);
                //scene.add(line2);
                //console.log(fhull.length);
                for (let i = 0; i < role.length; i++) {
                    let tmphull = [];
                    let ftmphull = [];
                    for (let j = 0; j < fhull.length; j++) {
                        tmphull.push(fhull[j]);
                    }
                    tmphull.push({
                        x: role[i].x + MovingCube.position.x,
                        y: role[i].y + MovingCube.position.z
                    });
                    Graham_scan(tmphull, ftmphull, tmphull.length);
                    let tagTmp = 0;
                    for (let j = 0; j < ftmphull.length; j++) {
                        if (ftmphull[j].x === role[i].x + MovingCube.position.x && ftmphull[j].y === role[i].y + MovingCube.position.z) {
                            tagTmp = 1;
                        }
                    }
                    if (tagTmp === 0) {
                        tag = 1;
                    }
                }
                l.splice(0,l.length);
                fhull.reverse();
                role.reverse();
                for(let i = 1; i < fhull.length; i++)
                {
                   l.push({
                       P: fhull[i-1],
                       v: sub(fhull[i], fhull[i-1])
                   })
                }
                l.push({
                    P: fhull[fhull.length - 1],
                    v: sub(fhull[0], fhull[fhull.length - 1])
                });
                for(let i = 1; i < role.length; i++)
                {
                    l.push({
                        P: role[i-1],
                        v: sub(role[i], role[i-1])
                    })
                }
                l.push({
                    P: role[role.length - 1],
                    v: sub(role[0], role[role.length - 1])
                });
                console.log(half_plane_intersection());
            }
            else
            {
                tag = 1;
            }
        }
    });
    if (tag === 1) {
        MovingCube.position.set(tmpx, tmpy, tmpz);
    }
    if ((MovingCube.position.x > 2500 && MovingCube.position.z > 2500) || mouseEn === true) {
        count++;
        if (count === 1) {
            //MovingCube.rotateOnAxis(new THREE.Vector3(0, 1, 0), -totAngle);
            for(let k=0; k<5; k++){
                manObj[k].rotateOnAxis(new THREE.Vector3(0,1, 0), -totAngle);
            }
            camera.position.set(0, 8000, 0);
            camera.lookAt(scene.position);
        }
        controls.update();
    }
    else if (tag === 0) {
        if (count !== 0) {
            count = 0;
            //MovingCube.rotateOnAxis(new THREE.Vector3(0, 1, 0), totAngle);
            for(let k=0; k<5; k++){
                manObj[k].rotateOnAxis(new THREE.Vector3(0, 1, 0), totAngle);
            }
        }
        let relativeCameraOffset = new THREE.Vector3(0, 10, 30);
        let cameraOffset;
        if((MovingCube.position.x !== tmpx)||(MovingCube.position.z !== tmpz))
            cameraOffset = relativeCameraOffset.applyMatrix4(MovingCube.matrixWorld);
        else
            cameraOffset = relativeCameraOffset.applyMatrix4(MovingCube.matrixWorld);
        camera.position.x = cameraOffset.x;
        camera.position.y = cameraOffset.y;
        camera.position.z = cameraOffset.z;
        if (keyboard.pressed("A")) {
            totAngle += rotateAngle;
            for(let k=0; k<5; k++){
                manObj[k].rotateOnAxis(new THREE.Vector3(0, 1, 0), rotateAngle);
            }
        }
        if (keyboard.pressed("D")) {
            totAngle -= rotateAngle;
            for(let k=0; k<5; k++){
                manObj[k].rotateOnAxis(new THREE.Vector3(0, 1, 0), -rotateAngle);
            }
    }
        camera.lookAt(new THREE.Vector3(MovingCube.position.x, MovingCube.position.y + 100, MovingCube.position.z));
    }
    if(isSunny==='BlueSky'){
        if(skyboxchange === false){
            scene.remove(skyBoxBlack);
            scene.add(skyBox);
            skyboxchange = true;
        }
    }
    else{
        if(skyboxchange === true){
            scene.remove(skyBox);
            scene.add(skyBoxBlack);
            skyboxchange = false;
        }
    }

    if(isLightChange)
    {
        scene.remove(light);
        light = new THREE.AmbientLight(0xffffff, lightIntensity/10);
        scene.add(light);
        isLightChange = false;
    }
    if((MovingCube.position.x === tmpx)&&(MovingCube.position.z === tmpz)){
        scene.remove(manObj[tmpManObj]);
        manObj[2].position.set(MovingCube.position.x, 50, MovingCube.position.z);
        scene.add(manObj[2]);
        tmpManObj = 2;
        tmpManObjRight = true;
        role.splice(0,role.length);
        for(let i = 0; i < roleHull[2].length; i++)
        {
            role.push({
                x: roleHull[2][i].x * Math.cos(manObj[2].rotation.y) - roleHull[2][i].y * Math.sin(manObj[2].rotation.y),
                y: roleHull[2][i].y * Math.cos(manObj[2].rotation.y) + roleHull[2][i].x * Math.sin(manObj[2].rotation.y)
            })
        }
    }
    else{
        scene.remove(manObj[tmpManObj]);
        tmpManObj=newtmp;
        tmpManObjRight=newtmpright;
        manObj[tmpManObj].position.set(MovingCube.position.x, 50, MovingCube.position.z);
        scene.add(manObj[tmpManObj]);
        role.splice(0,role.length);
        for(let i = 0; i < roleHull[tmpManObj].length; i++)
        {
            role.push({
                x: roleHull[tmpManObj][i].x * Math.cos(manObj[tmpManObj].rotation.y) - roleHull[tmpManObj][i].y * Math.sin(manObj[tmpManObj].rotation.y),
                y: roleHull[tmpManObj][i].y * Math.cos(manObj[tmpManObj].rotation.y) + roleHull[tmpManObj][i].x * Math.sin(manObj[tmpManObj].rotation.y)
            })
        }
    }
    cnt++;
    stats.update();
}

function render() {
    renderer.render(scene, camera);
}
function windowResize(renderer, camera){
    let callback	= function(){
        // notify the renderer of the size change
        renderer.setSize( window.innerWidth, window.innerHeight );
        // update the camera
        camera.aspect	= window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    };
    // bind the resize event
    window.addEventListener('resize', callback, false);
    // return .stop() the function to stop watching window resize
    return {
        /**
         * Stop watching window resize
         */
        stop: function(){
            window.removeEventListener('resize', callback);
        }
    };
}

function gameStart() {
    init();
    animate();
}
