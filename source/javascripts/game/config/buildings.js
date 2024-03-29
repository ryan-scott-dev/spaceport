Spaceport.Config.Buildings = {

  dock: {
    has_id: true,
    render_order: 1,
    sprite: 'test_dock_sprite',
    tile_size: {x: 3, y: 5},
    components: [],
    pivot: new Phaser.Point((32 * 3) / 2, (32 * 5) / 2),
    placement_behaviours: ['single', 'deselect'],
  },

  loader: {
    has_id: true,
    render_order: 1,
    sprite: 'test_wall_sprite',
    components: [Spaceport.Behaviours.Loader],
    pivot: new Phaser.Point((32 * 1) / 2, (32 * 1) / 2),
    placement_behaviours: ['single', 'deselect'],
  },

  door: {
    has_id: true,
    render_order: 1,
    rotate_during_placement: true,
    sprite: 'test_door_sprite',
    components: [],
    tile_size: {x: 3, y: 1},
    pivot: new Phaser.Point((32 * 3) / 2, (32 * 1) / 2 + 6),
    placement_behaviours: ['single', 'deselect'],
  },

  wall: {
    has_id: false,
    render_order: 0,
    rotate_during_placement: true,
    sprite: 'test_wall_sprite',
    components: [],
    tile_size: {x: 1, y: 1},
    pivot: new Phaser.Point((32 * 1) / 2, (32 * 1) / 2 + 4),
    placement_behaviours: ['single', 'drag', 'deselect'],
  },

  floor: {
    has_id: false,
    render_order: -1,
    rotate_during_placement: false,
    sprite: 'test_floor_sprite',
    components: [],
    tile_size: {x: 1, y: 1},
    pivot: new Phaser.Point((32 * 1) / 2, (32 * 1) / 2),
    placement_behaviours: ['single', 'drag', 'deselect'],
  }

};
