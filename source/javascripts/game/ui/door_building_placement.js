Spaceport.DoorBuildingPlacement = function(params) {
  Spaceport.BuildingPlacement.call(this, params);
};

Spaceport.DoorBuildingPlacement.mixin(Spaceport.BuildingPlacement.prototype);

Spaceport.DoorBuildingPlacement.mixin({

  calculatePlacingPositions: function() {

    // Find the dominate axis
    var startPos = this.currentStartPlacementPosition;
    var endPos = this.currentEndPlacementPosition || new Phaser.Point(startPos.x + 32, startPos.y);

    var start = startPos.clone();
    var end = endPos.clone();

    var placementZone = new Phaser.Rectangle(start.x, start.y,  start.x - end.x, end.y - start.y);
    var width = Math.abs(placementZone.width);
    var height = Math.abs(placementZone.height);
    var placingPositions = [];
    var buildingTileSize = this.lookupBuildingTileSize(this.selectedBuildingType);
    
    if (width > height) {
      if (start.x > end.x) {
        start.x = endPos.x;
        end.x = startPos.x;
      }
      var basePosition = start.clone();

      var buildingWidth = 32 * buildingTileSize.x;
      var buildingHeight = 32 * buildingTileSize.y;
      
      // Width is the dominate axis
      var numberOfBuildings = Math.floor(width / buildingWidth);
      
      // Determine how many buildings can be fit....
      for (var i = 0; i < numberOfBuildings; i++) {
        var buildingPosition = basePosition.clone();
        buildingPosition.x += (i * buildingWidth);
        placingPositions.push(buildingPosition);
      }

    } else {
      var buildingWidth = 32 * buildingTileSize.y;
      var buildingHeight = 32 * buildingTileSize.x;

      // Height is the dominate axis
      var numberOfBuildings = Math.floor(height / buildingHeight);
      if (start.y > end.y) {
        start.y = endPos.y;
        end.y = startPos.y;
      }
      var basePosition = start.clone();

      basePosition.x -= 32;
      basePosition.y += 32;

      // Determine how many buildings can be fit....
      for (var i = 0; i < numberOfBuildings; i++) {
        var buildingPosition = basePosition.clone();
        buildingPosition.y += (i * buildingHeight);
        placingPositions.push(buildingPosition);
      }
    }

    return placingPositions;
  },

  startMarkerOffset: function() {
    if (this.placingPositions.length > 1) {
      startPosition = this.placingPositions[0]; 
      endPosition = this.placingPositions[this.placingPositions.length - 1]; 
      
      if (startPosition.y != endPosition.y) {
        return new Phaser.Point(32, -32);    
      }
    }
    return new Phaser.Point(0, 0);
  },

  endMarkerOffset: function() {
    return new Phaser.Point(32, 0);
  },

});
