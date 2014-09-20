//= require_tree ./game

window.gameRuntime = (function() {
  var game = new Phaser.Game(800, 600, Phaser.AUTO, 'phaser-stage', { preload: preload, create: create, update: update });

  function preload() {
    game.load.image('renderTest', 'assets/mario.png');
  }

  function create() {
    game.add.sprite(400 - 32, 300 - 32, 'renderTest');
  }

  function update() {
      
  }

  return game;
})();
