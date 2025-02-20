import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as THREE from 'three';

export default class Scene extends THREE.Scene {
    constructor() {
        super();
        this.setScene();
    }

    setScene() {
        this.background = new THREE.Color(0xa0a0a0);

        this.camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 1, 1000);
        this.camera.position.set(300, 200, 500);

        this.textureLoader = new THREE.TextureLoader();
        this.createPlainRoad(); // Default road
        this.loadCarModel();

        this.setLights();
        this.setRenderer();
        this.setControls();

        this.speed = 0.5; // Default speed
        this.isCarLoaded = false;

        this.addUIControls();
        this.animateCar(); // Start the animation loop
    }

    createPlainRoad() {
        if (this.plane) this.remove(this.plane);

        const roadTexture = this.createRoadTexture();
        const planeGeometry = new THREE.PlaneGeometry(200, 500);
        const planeMaterial = new THREE.MeshPhongMaterial({
            map: roadTexture,
            side: THREE.DoubleSide
        });

        this.plane = new THREE.Mesh(planeGeometry, planeMaterial);
        this.plane.rotation.x = -Math.PI / 2;
        this.plane.receiveShadow = true;
        this.add(this.plane);
    }

    createBumpyRoad() {
        if (this.plane) this.remove(this.plane);

        const roadTexture = this.createRoadTexture();
        const bumpMap = this.generateBumpTexture(256, 256);

        const planeGeometry = new THREE.PlaneGeometry(200, 500, 100, 100);
        const planeMaterial = new THREE.MeshStandardMaterial({
            map: roadTexture,
            displacementMap: bumpMap,
            displacementScale: 5,
            side: THREE.DoubleSide
        });

        this.plane = new THREE.Mesh(planeGeometry, planeMaterial);
        this.plane.rotation.x = -Math.PI / 2;
        this.plane.receiveShadow = true;
        this.add(this.plane);
    }

    createRoadTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, 512, 1024);

        ctx.strokeStyle = 'white';
        ctx.lineWidth = 10;
        ctx.setLineDash([40, 20]);
        ctx.beginPath();
        ctx.moveTo(256, 0);
        ctx.lineTo(256, 1024);
        ctx.stroke();

        return new THREE.CanvasTexture(canvas);
    }

    generateBumpTexture(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        for (let i = 0; i < width; i += 20) {
            for (let j = 0; j < height; j += 20) {
                const noise = Math.random() * 255;
                ctx.fillStyle = `rgb(${noise}, ${noise}, ${noise})`;
                ctx.fillRect(i, j, 20, 20);
            }
        }

        return new THREE.CanvasTexture(canvas);
    }

    loadCarModel() {
        const loader = new GLTFLoader();
        loader.load('street_car.glb', (gltf) => {
            this.car = gltf.scene;
            this.car.scale.set(5, 5, 5);
            this.car.position.set(0, 3, -200);
            this.car.castShadow = true;
            this.add(this.car);
            this.isCarLoaded = true;
        });
    }

    animateCar() {
        requestAnimationFrame(() => this.animateCar());

        if (this.isCarLoaded && this.car) {
            this.car.position.z += this.speed;

            // Reset position to loop movement
            if (this.car.position.z > 200) {
                this.car.position.z = -200;
            }

            // Camera follows the car smoothly
            this.camera.position.z = this.car.position.z + 50;
            this.camera.lookAt(this.car.position);
        }

        this.renderer.render(this, this.camera);
    }

    addUIControls() {
        const uiContainer = document.createElement('div');
        uiContainer.style.position = 'absolute';
        uiContainer.style.top = '10px';
        uiContainer.style.left = '10px';
        uiContainer.style.zIndex = '100';
        uiContainer.style.display = 'flex';
        uiContainer.style.flexDirection = 'column';

        const speedLabel = document.createElement('label');
        speedLabel.innerText = 'Speed: ';
        speedLabel.style.color = 'white';

        const speedInput = document.createElement('input');
        speedInput.type = 'number';
        speedInput.value = this.speed;
        speedInput.min = '0.1';
        speedInput.step = '0.1';
        speedInput.style.marginBottom = '5px';
        speedInput.oninput = () => {
            this.speed = parseFloat(speedInput.value);
        };

        const bumpyButton = document.createElement('button');
        bumpyButton.innerText = 'Bumpy Road';
        bumpyButton.style.margin = '5px';
        bumpyButton.onclick = () => this.createBumpyRoad();

        const plainButton = document.createElement('button');
        plainButton.innerText = 'Plain Surface';
        plainButton.style.margin = '5px';
        plainButton.onclick = () => this.createPlainRoad();

        uiContainer.appendChild(speedLabel);
        uiContainer.appendChild(speedInput);
        uiContainer.appendChild(bumpyButton);
        uiContainer.appendChild(plainButton);
        document.body.appendChild(uiContainer);
    }

    setLights() {
        this.hemLight = new THREE.HemisphereLight(0xffffff, 0x404040, 1);
        this.add(this.hemLight);

        this.light = new THREE.DirectionalLight(0xffffff, 0.5);
        this.light.castShadow = true;
        this.light.position.set(0, 50, 0);

        this.light.shadow.mapSize.width = 1024;
        this.light.shadow.mapSize.height = 1024;
        this.light.shadow.camera.near = 0.5;
        this.light.shadow.camera.far = 500;
        const mapArea = 100;
        this.light.shadow.camera.left = this.light.shadow.camera.bottom = -mapArea;
        this.light.shadow.camera.top = this.light.shadow.camera.right = mapArea;
        this.light.shadow.bias = -0.001;

        this.add(this.light);
    }

    setRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        document.body.appendChild(this.renderer.domElement);
    }

    setControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.maxPolarAngle = Math.PI / 2;
        this.controls.maxDistance = 2000;
        this.controls.target = new THREE.Vector3(0, 15, 0);
        this.controls.update();
    }
}
