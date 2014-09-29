Spaceport.Preloader = function (game) {

  this.background = null;
  this.preloadBar = null;

  this.ready = false;

};

Spaceport.Preloader.prototype = {

  preload: function () {

    this.preloadBar = this.add.sprite(0, 100, 'preloaderBar');

    this.load.setPreloadSprite(this.preloadBar);

    this.load.image('tiles', 'assets/tmw_desert_spacing.png');
  },

  create: function () {

    this.preloadBar.cropEnabled = false;

    this.state.start('Game');

  },

  update: function () {

  }

};
