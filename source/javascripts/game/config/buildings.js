Spaceport.Config.Buildings = {

  orbital: {
    render_order: 1,
    sprite: 'test_wall_sprite',
    components: [],
    pivot: new Phaser.Point((32 * 3) / 2, (32 * 5) / 2),
    placement_behaviours: ['single', 'deselect'],
  },

  loader: {
    render_order: 1,
    sprite: 'test_wall_sprite',
    components: [Spaceport.Behaviours.Loader],
    pivot: new Phaser.Point((32 * 1) / 2, (32 * 1) / 2),
    placement_behaviours: ['single', 'deselect'],
  },

  door: {
    render_order: 1,
    sprite: 'test_door_sprite',
    components: [],
    tile_size: {x: 3, y: 1},
    pivot: new Phaser.Point((32 * 3) / 2, (32 * 1) / 2 + 6),
    placement_behaviours: ['single', 'deselect'],
  },

  wall: {
    render_order: 0,
    sprite: 'test_wall_sprite',
    components: [],
    tile_size: {x: 1, y: 1},
    pivot: new Phaser.Point((32 * 1) / 2, (32 * 1) / 2 + 4),
    placement_behaviours: ['single', 'drag', 'deselect'],
  },

  floor: {
    render_order: -1,
    sprite: 'test_floor_sprite',
    components: [],
    tile_size: {x: 1, y: 1},
    pivot: new Phaser.Point((32 * 1) / 2, (32 * 1) / 2),
    placement_behaviours: ['single', 'drag', 'deselect'],
  }

};
