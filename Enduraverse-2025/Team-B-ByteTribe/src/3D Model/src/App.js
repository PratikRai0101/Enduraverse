import Scene from './scripts/Scene';
import Load from './scripts/Load';
import Showroom from './scripts/Showroom';


class App {
	constructor() {
		this.scene = null;
		this.load = null;
		this.showroom = null;
	

		this.letsPlay();
	}

	async letsPlay() {
		this.scene = new Scene();
		this.load = new Load(this.scene, this.currentModel);
		this.showroom = new Showroom(this.scene);
		

		await this.load.loadSample('./models/gltf/motorbike.glb');
		

		this.init();
		this.animate();
	}

	init() {
		document.body.appendChild(this.scene.renderer.domElement);
		window.addEventListener('resize', this.onWindowResize.bind(this), false);
	}

	onWindowResize() {
		this.scene.camera.aspect = window.innerWidth / window.innerHeight;
		this.scene.camera.updateProjectionMatrix();
		this.scene.renderer.setSize(window.innerWidth, window.innerHeight);x
	}

	animate() {
		requestAnimationFrame(this.animate.bind(this));
	
		if (this.load.currentModel) {
			const speed = parseFloat(document.getElementById("speedInput")?.value) || 0.50; // Get speed from input or default to 0.5
			this.load.currentModel.position.z += speed; // Moves forward
	
			// Reset position if the car moves beyond a certain Z limit
			if (this.load.currentModel.position.z > 200) {  // Adjust the value based on road length
				this.load.currentModel.position.z = -200; // Reset to starting point
			}
		}
	
		this.scene.renderer.render(this.scene, this.scene.camera);

	}
	
	
}

new App();
