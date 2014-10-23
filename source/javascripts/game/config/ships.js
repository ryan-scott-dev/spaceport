Spaceport.Config.Ships = {

  cargo: {
    has_id: true,
    render_order: 5,
    sprite: 'ship_cargo_sprite',
    tile_size: { x: 3, y: 3 },
    components: [Spaceport.Behaviours.MoveTowards],
    pivot: new Phaser.Point((32 * 3) / 2, (32 * 3) / 2),
  }

};
