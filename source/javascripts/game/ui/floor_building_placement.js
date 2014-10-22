Spaceport.FloorBuildingPlacement = function(params) {
  Spaceport.BuildingPlacement.call(this, params);
};

Spaceport.FloorBuildingPlacement.mixin(Spaceport.BuildingPlacement.prototype);

Spaceport.FloorBuildingPlacement.mixin({
  endMarkerOffset: function() {
    return new Phaser.Point(32, 32);
  },

  calculatePlacingPositions: function() {
    // Find the dominate axis
    var startPos = this.currentStartPlacementPosition;
    var endPos = this.currentEndPlacementPosition || new Phaser.Point(startPos.x + 32, startPos.y + 32);

    var start = startPos.clone();
    var end = endPos.clone();

    if (startPos.x > endPos.x) {
      start.x = endPos.x;
      end.x = startPos.x;
    }

    if (startPos.y > endPos.y) {
      start.y = endPos.y;
      end.y = startPos.y;
    }

    var placementZone = new Phaser.Rectangle(start.x, start.y,  start.x - end.x, end.y - start.y);
    var width = Math.abs(placementZone.width);
    var height = Math.abs(placementZone.height);
    var placingPositions = [];
    var buildingTileSize = this.lookupBuildingTileSize(this.selectedBuildingType);
    var basePosition = start.clone();

    var buildingWidth = 32 * buildingTileSize.x;
    var buildingHeight = 32 * buildingTileSize.y;
    
    var numberOfBuildingsAcross = Math.floor(width / buildingWidth);
    var numberOfBuildingsDown = Math.floor(height / buildingHeight);

    for (var x = 0; x < numberOfBuildingsAcross; x++) {
      for (var y = 0; y < numberOfBuildingsDown; y++) {
        var buildingPosition = basePosition.clone();
        buildingPosition.x = start.x + (x * buildingWidth);
        buildingPosition.y = start.y + (y * buildingHeight);
        placingPositions.push(buildingPosition);
      }
    }

    return placingPositions;
  },
});
