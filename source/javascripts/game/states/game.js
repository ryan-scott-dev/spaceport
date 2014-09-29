Spaceport.Game = function (game) {
  this.buildings;
  this.robots;
};

Spaceport.Game.prototype = {

  create: function () {

    this.buildings = [];
    this.robots = [];
    
    this.stage.smoothed = false;
    this.stage.backgroundColor = '#2d2d2d';
  },


  update: function () {
  },

};
