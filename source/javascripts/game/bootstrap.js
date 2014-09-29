(function () {

    var game = new Phaser.Game('100', '100', Phaser.AUTO, $('.canvas_container')[0]);

    game.state.add('Boot', Spaceport.Boot);
    game.state.add('Preloader', Spaceport.Preloader);
    game.state.add('Game', Spaceport.Game);

    game.state.start('Boot');

})();
