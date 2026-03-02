

import { Scene, Vector3, Camera, MeshBuilder,StandardMaterial,CubeTexture,PhotoDome } from 'babylonjs'

import * as BABYLON from 'babylonjs'

export function createSkyBox(scene: Scene){
    // 创建天空盒
	var skybox = MeshBuilder.CreateBox("skyBox", {size:5000.0}, scene);
    skybox.isPickable=false
	var skyboxMaterial = new StandardMaterial("skyBox", scene);
	skyboxMaterial.backFaceCulling = false;
	skyboxMaterial.reflectionTexture = new CubeTexture("textures/skybox/skybox", scene);
	skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
	// 使用明亮的颜色而不是黑色
	skyboxMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.9, 1.0); // 明亮的天蓝色
	skyboxMaterial.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
	skyboxMaterial.emissiveColor = new BABYLON.Color3(0.6, 0.7, 0.9); // 增加自发光
    skybox.infiniteDistance = true;
    skybox.renderingGroupId = 0;
    skyboxMaterial.disableLighting = true;
	skybox.material = skyboxMaterial;	

    console.log('[SkyBox] 天空盒创建成功，使用明亮的蓝色配色')
}

//360 穹顶
export  function CreatePhotoDome(scene: Scene){
    var dome = new PhotoDome(
        "dome",
        "/textures/Small_Cloud_06.jpg",
        {
            resolution: 32,
            size: 3000,
            faceForward: false,
        },
        scene
    );
    dome.fovMultiplier = 0.2;
    dome.imageMode = PhotoDome.MODE_MONOSCOPIC;
    // dome.material._needDepthPrePass=true;
    // dome.material.diffuseTexture.level = 2;

   var dome_mesh= scene.getMeshByName("dome_mesh")
   dome_mesh!.isPickable=false
}

export function CreateShdrTexture(scene: Scene){
    const hdrTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("/textures/environment.env", scene); //加载环境反射贴图
    
    scene.environmentTexture = hdrTexture;
            scene.environmentIntensity=0.1;
            //   0.165, 0.294, 0.494
            scene.clearColor = new BABYLON.Color4(0.035, 0.043, 0.059)
}

