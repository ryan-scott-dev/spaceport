Spaceport.BuildingPlacement = function(params) {

  this.isPlacing = false;
  this.startedPlacing = false;

  this.game = params.game;
  this.placementSilhouettes = [];

};

Spaceport.BuildingPlacement.mixin({
  
  isPlacingStartPosition: function() {
    return this.isPlacing && !this.startPlacing;
  },

});
