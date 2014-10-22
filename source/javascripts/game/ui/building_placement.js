Spaceport.BuildingPlacement = function(params) {

  this.isPlacing = false;
  this.startedPlacing = false;

  this.game = params.game;
  this.placementSilhouettes = [];
  this.placingPositions = [];

  this.selectedBuildingType = null;
  if (params.type) {
    this.setSelectedBuildingType(params.type);
  }

  this._currentStartPlacementPosition = null;
  this._currentEndPlacementPosition = null;

  this._lastStartPlacementPosition = null;
  this._lastEndPlacementPosition = null;

  this.startPlacingMarker = this.game.add.sprite(0, 0, 'placement');
  this.startPlacingMarker.renderOrder = 10;
  this.endPlacingMarker = this.game.add.sprite(0, 0, 'placement');
  this.endPlacingMarker.renderOrder = 10;
};

Spaceport.BuildingPlacement.mixin({
  
  destroy: function() {
    this.clearPlacementSilhouettes();
    this.startPlacingMarker.destroy();
    this.endPlacingMarker.destroy();

    this.game = null;
  },

  lookupBuildingTileSize: function(type) {
    return Spaceport.Config.Buildings[type].tile_size;
  },

  lookupBuildingRotateDuringPlacement: function(type) {
    return Spaceport.Config.Buildings[type].rotate_during_placement;
  },

  isPlacingStartPosition: function() {
    return this.isPlacing && !this.startedPlacing;
  },

  currentPlacementPositionMoved: function() {
    return this.startPlacingMoved() || this.endPlacingMoved();
  },

  startPlacingMoved: function() {
    return this.lastStartPlacementPosition && 
           this.currentStartPlacementPosition &&
          !this.lastStartPlacementPosition.equals(this.currentStartPlacementPosition);
  },

  endPlacingMoved: function() {
    return this.lastEndPlacementPosition &&
           this.currentEndPlacementPosition &&
          !this.lastEndPlacementPosition.equals(this.currentEndPlacementPosition);
  },

  clearPlacementSilhouettes: function() {
    if (!this.placementSilhouettes) return;

    this.placementSilhouettes.forEach(function(placementSilhouette) {
      placementSilhouette.destroy();
    });
    this.placementSilhouettes.length = 0;
  },

  generatePlacingBuildings: function() {
    this.placingPositions = this.calculatePlacingPositions();
    var buildingType = this.selectedBuildingType;

    var startPosition = this.currentStartPlacementPosition;
    var endPosition = startPosition;
    var rotate = false;
    var rotatesDuringPlacement = this.lookupBuildingRotateDuringPlacement(buildingType);;

    if (this.placingPositions.length > 1) {
      startPosition = this.placingPositions[0]; 
      endPosition = this.placingPositions[this.placingPositions.length - 1]; 
      rotate = (startPosition.y != endPosition.y); 
    }

    return this.placingPositions.map(function(placementPosition) {
      // Generate new building at the placement position
      var buildingParams = {
        type: buildingType, 
        x: placementPosition.x + 16, 
        y: placementPosition.y + 16,
      };

      if (rotate && rotatesDuringPlacement) {
        buildingParams.rotation = -Math.PI / 2;
        buildingParams.x = placementPosition.x + 48;
        buildingParams.y = placementPosition.y - 16;
      }

      return this.game.createBuilding(buildingParams);
    }.bind(this));
  },

  generatePlacingSilhouette: function() {
    this.clearPlacementSilhouettes();
    this.placementSilhouettes = this.generatePlacingBuildings();

    // console.log("Generated buildings at positions: ", this.placingPositions.map(function(placingPosition) { return placingPosition.toString(); }));
  },

  updatePlacingSilhouette: function() {
    if (this.currentPlacementPositionMoved()) {
      this.generatePlacingSilhouette();
    }
  },

  updatePreviousPlacementPosition: function() {
    this.lastStartPlacementPosition = this.currentStartPlacementPosition;
    this.lastEndPlacementPosition = this.currentEndPlacementPosition;
  },

  calculatePlacementPosition: function() {
    var currentPosition = new Phaser.Point(
      Phaser.Math.snapTo(this.game.input.activePointer.worldX, 32),
      Phaser.Math.snapTo(this.game.input.activePointer.worldY, 32));

    if (this.isPlacingStartPosition()) {
      this.currentStartPlacementPosition = currentPosition;
      this.currentEndPlacementPosition = undefined;
    } else {
      this.currentEndPlacementPosition = currentPosition;
    }
  },

  update: function() {
    if (this.isPlacing) {
      this.calculatePlacementPosition();
      this.updatePlacingSilhouette();
      this.updatePreviousPlacementPosition();
    }

    this.updateMarkerPositions();
    this.updateMarkerVisibility();
  },

  updateMarkerVisibility: function() {
    this.startPlacingMarker.visible = (this.selectedBuildingType != null);
    this.endPlacingMarker.visible = (this.selectedBuildingType != null);
  },

  startMarkerOffset: function() {
    return new Phaser.Point(0, 0);
  },

  endMarkerOffset: function() {
    return new Phaser.Point(0, 0);
  },

  updateMarkerPositions: function() {
    if (this.placingPositions.length > 0) {
      var startPosition = this.placingPositions[0];
      var endPosition = this.placingPositions[this.placingPositions.length - 1];
    } else {
      var startPosition = (this.currentStartPlacementPosition || new Phaser.Point()).clone();
      var endPosition = startPosition;
    }

    var startMarkerOffset = this.startMarkerOffset();
    this.startPlacingMarker.x = startPosition.x - 6 + startMarkerOffset.x;
    this.startPlacingMarker.y = startPosition.y - 6 + startMarkerOffset.y;

    var endMarkerOffset = this.endMarkerOffset();
    this.endPlacingMarker.x = endPosition.x - 6 + endMarkerOffset.x;
    this.endPlacingMarker.y = endPosition.y - 6 + endMarkerOffset.y;  
  },

  startPlacingSelectedBuilding: function() {
    if (this.noSelectedBuildingType()) return;
    if (!this.isPlacing) return;
    if (this.startedPlacing) return;

    this.startedPlacing = true;
  },

  noSelectedBuildingType: function() {
    return !this.selectedBuildingType;
  },
  
  setSelectedBuildingType: function(type) {
    this.selectedBuildingType = type;
    this.stopPlacingBuilding();
    this.startPlacingBuilding();
    this.game.updateToolbarUI(type);
  },

  startPlacingBuilding: function() {
    if (this.isPlacing) return;

    this.isPlacing = true;
    this.calculatePlacementPosition();
  },

  stopPlacingBuilding: function() {
    if (!this.isPlacing) return;

    this.clearPlacementSilhouettes();

    this.selectedBuildingType = null;
    this.startedPlacing = false;
    this.isPlacing = false;

    this.game.updateToolbarUI();
  },

  canFinishPlacement: function() {
    return this.isPlacing && this.startedPlacing;
  },

  finishPlacingSelectedBuilding: function() {
    if (!this.canFinishPlacement()) return;
    
    // console.log("Placed building from, to ", 
    //   this.currentStartPlacementPosition.toString(), 
    //   this.currentEndPlacementPosition.toString());

    var buildings = this.generatePlacingBuildings();
    this.game.placeBuildings(buildings);

    this.stopPlacingBuilding();
  },
});
