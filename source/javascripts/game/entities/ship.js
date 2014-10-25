//= require game/entities/base_entity

Spaceport.Ship = function (game, params) {

  Spaceport.BaseEntity.call(this, game, params, Spaceport.Config.Ships);

  game.physics.arcade.enable(this);

  var assignedDockId = params.assignedDockId;
  if (assignedDockId) {
    params.assignedDock = this.game.findBuildingById(assignedDockId);
  }
  this.assignedDock = params.assignedDock || params.assignedDockId;
  if (this.assignedDock) {
    this.assignedDock.assignedShip = this;
  }

  this.state = params.state || 'arrived';
  if (params.exitPointX && params.exitPointY) {
   params.exitPoint = new Phaser.Point(params.exitPointX, params.exitPointY); 
  }
  this.exitPoint = params.exitPoint || new Phaser.Point(this.x, this.y);
  this.dockTimer = params.dockTimer || 0;
};

Spaceport.Ship.prototype = Object.create(Spaceport.BaseEntity.prototype);
Spaceport.Ship.prototype.constructor = Spaceport.Ship;

Spaceport.Ship.mixin({

  getAssignedDockId: function() {
    if (!this.assignedDock) return null;
    return this.assignedDock.id;
  },  

  getEntityProperties: function() {
    return {
      state: this.state,
      assignedDockId: this.getAssignedDockId(),

      exitPointX: this.exitPoint.x,
      exitPointY: this.exitPoint.y,

      dockTimer: this.dockTimer
    };
  }

});
