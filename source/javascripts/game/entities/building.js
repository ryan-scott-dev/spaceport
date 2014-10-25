//= require game/entities/base_entity

Spaceport.Building = function (game, params) {
  Spaceport.BaseEntity.call(this, game, params, Spaceport.Config.Buildings);

  this.setPlaced(params.placed || false);
};

Spaceport.Building.prototype = Object.create(Spaceport.BaseEntity.prototype);
Spaceport.Building.prototype.constructor = Spaceport.Building;

Spaceport.Building.mixin({

  setPlaced: function(placed) {
    this.placed = placed;
    if (!this.placed) {
      this.tint = 0x1BFF1B;
    } else {
      this.tint = 0xFFFFFF;
    }
  }

});
