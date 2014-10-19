Spaceport.Config.Buildings = {

  orbital: {
    sprite: 'test_wall_sprite',
    components: [],
    pivot: new Phaser.Point((32 * 3) / 2, (32 * 5) / 2),
    placement_behaviours: ['single', 'deselect'],
  },

  loader: {
    sprite: 'test_wall_sprite',
    components: [Spaceport.Behaviours.Loader],
    pivot: new Phaser.Point((32 * 1) / 2, (32 * 1) / 2),
    placement_behaviours: ['single', 'deselect'],
  },

  door: {
    sprite: 'test_door_sprite',
    components: [],
    tile_size: {x: 3, y: 1},
    pivot: new Phaser.Point((32 * 3) / 2, (32 * 1) / 2 + 6),
    placement_behaviours: ['single', 'deselect'],
  },

  wall: {
    sprite: 'test_wall_sprite',
    components: [],
    tile_size: {x: 1, y: 1},
    pivot: new Phaser.Point((32 * 1) / 2, (32 * 1) / 2 + 4),
    placement_behaviours: ['single', 'drag', 'deselect'],
  }

};
