Spaceport.Config.Buildings = {

  orbital: {
    components: [Spaceport.Behaviours.Visual.Orbital],
    pivot: new Phaser.Point((32 * 3) / 2, (32 * 5) / 2),
  },

  loader: {
    components: [Spaceport.Behaviours.Visual.Loader, Spaceport.Behaviours.Loader],
    pivot: new Phaser.Point((32 * 1) / 2, (32 * 1) / 2),
  },

  door: {
    components: [Spaceport.Behaviours.Visual.Door],
    pivot: new Phaser.Point((32 * 3) / 2, (32 * 1) / 2),
  },

  wall: {
    components: [Spaceport.Behaviours.Visual.Wall],
    pivot: new Phaser.Point((32 * 1) / 2, (32 * 1) / 2),
  }

};
