import * as THREE from "three";
import GUI from "lil-gui";

const gui = new GUI();

export default class Gui {
   constructor(scene, load, showroom) {
      this.scene = scene;
   },
   constructor(scene, load, showroom) {
      this.scene = scene;
      this.load = load;
      this.showroom = showroom;

      this.sampleModels = { samples: "Street Car" };
   }

  
}
