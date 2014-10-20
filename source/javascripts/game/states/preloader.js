Spaceport.Preloader = function (game) {

  this.background = null;
  this.preloadBar = null;

  this.ready = false;

};

Spaceport.Preloader.prototype = {

  preload: function () {

    this.preloadBar = this.add.sprite(0, 100, 'preloaderBar');

    this.load.setPreloadSprite(this.preloadBar);

    this.load.image('tiles', '/assets/tmw_desert_spacing.png');
    this.load.image('test_door_sprite', '/assets/door.png');
    this.load.image('test_wall_sprite', '/assets/wall.png');

    this.load.image('placement', '/assets/placement.png');
  },

  create: function () {

    this.preloadBar.cropEnabled = false;

    this.state.start('Game');

  },

  update: function () {
  }

};
