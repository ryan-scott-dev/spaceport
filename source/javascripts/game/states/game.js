Spaceport.Game = function (game) {

  /* logic */
  this.buildings;
  this.robots;
  this.placing;
  
  this.startPlacingMarker;
  this.endPlacingMarker;

  this.selected;
  this.startPlacing;
  this.placementSilhouettes;

  /* ui */
  this.map;
  this.layer;

  this.marker;

  /* input */
  this.cursors;
  this.inputActions;

  /* events */
  this.actionHandlers;
};

Spaceport.Game.prototype = {

  create: function () {

    this.buildings = [];
    this.robots = [];
    this.placementSilhouettes = [];
    this._placingPositions = [];

    this.map = this.add.tilemap();
    this.map.addTilesetImage('tiles');

    this.layer = this.map.create('Ground', 60, 30, 32, 32);
    this.layer.resizeWorld();

    this.stage.smoothed = false;
    this.stage.backgroundColor = '#2d2d2d';
    // Look at this.stage.setInteractionDelegate for events on other elements
    
    this.marker = this.add.graphics();
    this.marker.lineStyle(2, 0xFFFFFF, 1);
    this.marker.drawRect(0, 0, 32, 32);

    this.startPlacingMarker = this.add.sprite(0, 0, 'placement');
    this.endPlacingMarker = this.add.sprite(0, 0, 'placement');

    this.cursors = this.input.keyboard.createCursorKeys();

    this.inputActions = {
      place_orbital: this.input.keyboard.addKey(Phaser.Keyboard.O),
      place_wall: this.input.keyboard.addKey(Phaser.Keyboard.W),
      place_door: this.input.keyboard.addKey(Phaser.Keyboard.D),
      place_loader: this.input.keyboard.addKey(Phaser.Keyboard.L),

      cancel: this.input.keyboard.addKey(Phaser.Keyboard.ESC),
      place: this.input.mousePointer,
    };

    this.loadState();

    this.hotzone = {
      width: (this.game.width * 0.1),
      height: (this.game.height * 0.1)
    };

    this.cameraMoveSpeed = 4;

    this.actionHandlers = {};
    this.bindViews('game-toolbar');

    this.onAction('select-wall',    function() { this.setSelectedBuildingType('wall');    });
    this.onAction('select-room',    function() { this.setSelectedBuildingType('room');    });
    this.onAction('select-door',    function() { this.setSelectedBuildingType('door');    });
    this.onAction('select-orbital', function() { this.setSelectedBuildingType('orbital'); });
  },

  bindViews: function() {
    for (var i = 0; i < arguments.length; i++) {
      var view = arguments[i]
      this.bindView($("[view='" + view + "']"));
    }
  },

  bindView: function(viewElement) {
    var elementsWithActions = $('[action]', viewElement);
    elementsWithActions.on('mousedown', function(evt) {
      this.handleElementClicked(evt);
    }.bind(this));
  },

  handleElementClicked: function(evt) {
    evt.preventDefault();

    var element = $(evt.target);
    var action = element.attr('action');

    if (!action) {
      console.log("No action attribute defined for this element", element);
    }
    this.raiseAction(action);
  },

  raiseAction: function(action) {
    console.log('Action raised: ' + action);
    (this.actionHandlers[action] || []).forEach(function(handler) {
      handler.call(this);
    }.bind(this));
  },

  onAction: function(action, handler) {
    if (!this.actionHandlers[action]) { 
      this.actionHandlers[action] = [];
    }
    this.actionHandlers[action].push(handler);
  },

  loadState: function() {
    console.time('loadState');
    var state = JSON.parse(localStorage.getItem('game.state'));
    this.fromGameState(state || {});
    console.timeEnd('loadState');
  },

  saveState: function() {
    console.time('saveState');
    var state = this.gameState();
    localStorage.setItem('game.state', JSON.stringify(state));
    console.timeEnd('saveState');
  },

  gameState: function() {
    return {
      buildings: this.buildings.map(function(building) { return building.serialize(); }),
      robots: this.robots.map(function(robot) { return robot.serialize(); })
    }
  },

  fromGameState: function(state) {
    state.buildings = state.buildings || [];
    state.robots = state.robots || [];

    state.robots.forEach(function(robot) {
      this.addRobot(robot);
    }.bind(this));

    state.buildings.forEach(function(building) {
      building.placed = true;
      this.addBuilding(building);
    }.bind(this));
  },

  addBuilding: function(buildingTemplate) {
    var newBuilding = this.createBuilding(buildingTemplate); 
    this.buildings.push(newBuilding);
  },

  addRobot: function(robotTemplate) {
    var newRobot = this.createCargoRobot(robotTemplate); 
    this.robots.push(newRobot);
  },

  addNewRobot: function(robot) {
    this.robots.push(robot);
    this.saveState();
  },

  findRobot: function(id) {
    return this.robots.find(function(robot) { return robot.id == id; } );
  },

  createBuilding: function(params) {
    var type = params.type || 'unknown';
    var spriteImage = params.sprite || this.lookupBuildingSprite(type)
    var x = params.x || 0;
    var y = params.y || 0;
    var buildingSprite = this.add.sprite(x, y, spriteImage);
    buildingSprite.id = params.id || chance.guid();
    buildingSprite.rotation = params.rotation || 0;
    buildingSprite.type = type;
    buildingSprite.placed = params.placed || false;
    buildingSprite.pivot = params.pivot || this.lookupBuildingPivot(type);

    buildingSprite.spWorld = this;
    buildingSprite.graphics = {};
    buildingSprite._behaviours = [];

    buildingSprite.serialize = function() {
      var properties = {
        id: this.id,
        type: this.type,
        x: this.x,
        y: this.y,
        rotation: this.rotation,
      };

      var self = this;
      this._behaviours.forEach(function(behaviour) {
        var customProperties = behaviour.getProperties ? behaviour.getProperties.call(self) : {};
        for(var property in customProperties) {
          properties[property] = customProperties[property];
        }
      });
      
      return properties;
    };

    buildingSprite.addBehaviour = function(behaviour) {
      this._behaviours.push(behaviour);

      for (var property in behaviour) {
        if (behaviour.hasOwnProperty(property)) {
          this[property] = behaviour[property];
        }
      }
    };

    buildingSprite.update = function() {
      this._behaviours.filter(function(behaviour) {
        return !!behaviour.update;
      })
      .forEach(function(behaviour) {
        behaviour.update.call(buildingSprite);
      });
    };

    var behaviours = this.lookupBuildingBehaviours(params.type);
    if (behaviours) {
      behaviours.forEach(function(behaviour) {
        buildingSprite.addBehaviour(behaviour);
      });

      behaviours.filter(function(behaviour) {
        return !!behaviour.create;
      })
      .forEach(function(behaviour) {
        behaviour.create.call(buildingSprite, params);
      }.bind(this));
    }

    return buildingSprite;  
  },

  lookupBuildingPivot: function(type) {
    return Spaceport.Config.Buildings[type].pivot;
  },

  lookupBuildingSprite: function(type) {
    return Spaceport.Config.Buildings[type].sprite;
  },

  lookupBuildingBehaviours: function(type) {
    return Spaceport.Config.Buildings[type].components;
  },

  lookupBuildingPlacementBehaviours: function(type) {
    return Spaceport.Config.Buildings[type].placement_behaviours;
  },

  createCargoRobot: function(params) {
    var robot = this.add.graphics();
    robot.id = params.id || chance.guid();
    robot.x = params.x || 0;
    robot.y = params.y || 0;
    robot.rotation = params.rotation || 0;
    robot.type = 'cargo';
    robot.pivot.x = (32 * 1) / 2;
    robot.pivot.y = (32 * 1) / 2;

    robot.lineStyle(1, 0x1BFFA2, 1);
    robot.drawRect(3, 3, 26, 26);

    robot.serialize = function() {
      return {
        id: this.id,
        type: this.type,
        x: this.x,
        y: this.y,
        rotation: this.rotation,
      };
    };

    robot.isIdle = function() {
      return true;
    };

    robot.broadcastLookingForWork = function() {
      if (this._hasBroadcastedLookingForWork) return;

      this._hasBroadcastedLookingForWork = true;
      console.log('Beep - Looking for work!');  
    };

    robot.update = function() {
      if (this.isIdle()) {
        this.broadcastLookingForWork();
      }
    };

    return robot;
  },

  updateMarker: function () {
    this.marker.x = this.layer.getTileX(this.input.activePointer.worldX) * 32;
    this.marker.y = this.layer.getTileY(this.input.activePointer.worldY) * 32;
    this.marker.visible = (!this.placing);
    
    // Start, End, and Current Mouse Position

    var currentPosition = (this._currentStartPlacementPosition || new Phaser.Point()).clone();
    this.startPlacingMarker.x = currentPosition.x - 6;
    this.startPlacingMarker.y = currentPosition.y - 6;
    this.startPlacingMarker.visible = (this._selectedBuilding != null);

    if (this._placingPositions.length > 1) {
      var startPosition = this._placingPositions[0];
      var endPosition = this._placingPositions[this._placingPositions.length - 1];

      this.startPlacingMarker.x = startPosition.x - 6;
      this.startPlacingMarker.y = startPosition.y - 6;

      this.endPlacingMarker.x = endPosition.x - 6;
      this.endPlacingMarker.y = endPosition.y - 6;  

      if (startPosition.y != endPosition.y) {
        this.startPlacingMarker.y -= 32;
      } else {
        this.startPlacingMarker.x -= 32;
      }
    }
    this.startPlacingMarker.visible = (this._selectedBuilding != null);
    this.endPlacingMarker.visible = (this._selectedBuilding != null && 
                                     this._currentEndPlacementPosition != undefined &&
                                     this._placingPositions.length > 1);

    if (this.placing) {
      this.calculatePlacementPosition();
      this.updatePlacingSilhouette();
      this.updatePreviousPlacementPosition();
    }
  },

  isPlacingStartPosition: function() {
    return this.placing && !this.startPlacing;
  },

  calculatePlacementPosition: function() {
    var currentPosition = new Phaser.Point(
      Phaser.Math.snapTo(this.input.activePointer.worldX, 32),
      Phaser.Math.snapTo(this.input.activePointer.worldY, 32));

    if (this.isPlacingStartPosition()) {
      this._currentStartPlacementPosition = currentPosition;
      this._currentEndPlacementPosition = undefined;
    } else {
      this._currentEndPlacementPosition = currentPosition;
    }
  },

  updatePreviousPlacementPosition: function() {
    this._lastStartPlacementPosition = this._currentStartPlacementPosition;
    this._lastEndPlacementPosition = this._currentEndPlacementPosition;
  },

  startPlacingMoved: function() {
    return this._lastStartPlacementPosition && 
           this._currentStartPlacementPosition &&
          !this._lastStartPlacementPosition.equals(this._currentStartPlacementPosition);
  },

  endPlacingMoved: function() {
    return this._lastEndPlacementPosition &&
           this._currentEndPlacementPosition &&
          !this._lastEndPlacementPosition.equals(this._currentEndPlacementPosition);
  },

  updatePlacingSilhouette: function() {
    if (this.startPlacingMoved() || this.endPlacingMoved()) {
      this.generatePlacingSilhouette();
    }
  },

  calculatePlacingPositions: function() {
    // Find the dominate axis
    var start = this._currentStartPlacementPosition;
    var end = this._currentEndPlacementPosition || start;

    var placementZone = new Phaser.Rectangle(start.x, start.y,  start.x - end.x, end.y - start.y);
    var width = Math.abs(placementZone.width);
    var height = Math.abs(placementZone.height);
    var placingPositions = [];
    var buildingWidth = 32;
    var buildingHeight = 32;
    var basePosition = start.clone();

    if (width > height) {      
      // Width is the dominate axis
      var numberOfBuildings = Math.floor(width / buildingWidth);
      if (start.x > end.x) {
        start = end;
      }

      // Determine how many buildings can be fit....
      for (var i = 1; i <= numberOfBuildings && numberOfBuildings > 0; i++) {
        var buildingPosition = basePosition.clone();
        buildingPosition.x = start.x + (i * buildingWidth);
        placingPositions.push(buildingPosition);
      }

    } else {
      // Height is the dominate axis
      var numberOfBuildings = Math.floor(height / buildingHeight);
      if (start.y > end.y) {
        start = end;
      }

      // Determine how many buildings can be fit....
      for (var i = 1; i <= numberOfBuildings && numberOfBuildings > 0; i++) {
        var buildingPosition = basePosition.clone();
        buildingPosition.y = start.y + (i * buildingHeight);
        placingPositions.push(buildingPosition);
      }
    }

    return placingPositions;
  },

  generatePlacingBuildings: function() {
    this._placingPositions = this.calculatePlacingPositions();
    var buildingType = this._selectedBuilding;

    var startPosition = this._currentStartPlacementPosition;
    var endPosition = startPosition;
    var rotate = false;

    if (this._placingPositions.length > 1) {
      startPosition = this._placingPositions[0]; 
      endPosition = this._placingPositions[this._placingPositions.length - 1]; 
      rotate = (startPosition.y != endPosition.y); 
    }

    return this._placingPositions.map(function(placementPosition) {
      // Generate new building at the placement position
      var buildingParams = {
        type: buildingType, 
        x: placementPosition.x - 16, 
        y: placementPosition.y + 16,
      };

      if (rotate) {
        buildingParams.rotation = Math.PI / 2;
        buildingParams.y = placementPosition.y - 16;
      }

      return this.createBuilding(buildingParams);
    }.bind(this));
  },

  generatePlacingSilhouette: function() {
    this.clearPlacementSilhouettes();

    // Generate new silhouettes
    this.placementSilhouettes = this.generatePlacingBuildings();

    console.log("Generated buildings at positions: ", this._placingPositions.map(function(placingPosition) { return placingPosition.toString(); }));
  },

  clearPlacementSilhouettes: function() {
    if (!this.placementSilhouettes) return;

    this.placementSilhouettes.forEach(function(placementSilhouette) {
      placementSilhouette.destroy();
    });
    this.placementSilhouettes.length = 0;
  },

  startPlacingBuilding: function(type) {
    if (this.placing) return;

    this.placing = true;
    this.calculatePlacementPosition();
  },

  stopPlacingBuilding: function() {
    if (!this.placing) return;

    this.clearPlacementSilhouettes();

    this._selectedBuilding = null;
    this.startPlacing = false;
    this.placing = false;

    this.updateToolbarUI();
  },

  updateCamera: function() {
    if (this.cursors.left.isDown) {
      this.camera.x -= 4;
    } else if (this.cursors.right.isDown) {
      this.camera.x += 4;
    }

    if (this.cursors.up.isDown) {
      this.camera.y -= 4;
    } else if (this.cursors.down.isDown) {
      this.camera.y += 4;
    }

    if (!this._selectedBuilding) {
      this.dragCameraTowardPointer(this.input.activePointer);  
    }
  },

  dragCameraTowardPointer: function(pointer) {
    if (pointer.isDown) {
        if (this.lastPointerPosition) {
            this.game.camera.x += this.lastPointerPosition.x - pointer.position.x;
            this.game.camera.y += this.lastPointerPosition.y - pointer.position.y;
        }
        this.lastPointerPosition = pointer.position.clone();
    }
    if (pointer.isUp) { this.lastPointerPosition = null; }
  },

  isPointerInsideCameraHotzone: function(pointer) {
    return (pointer.position.x < this.hotzone.width)  || (pointer.position.x > this.game.width - this.hotzone.width) ||
           (pointer.position.y < this.hotzone.height) || (pointer.position.y > this.game.height - this.hotzone.height);
  },

  moveCameraTowardsPointer: function(pointer) {
    var offset = new Phaser.Point(pointer.position.x - (this.game.width / 2.0), 
                                  pointer.position.y - (this.game.height / 2.0)).normalize();
    this.camera.x += offset.x * this.cameraMoveSpeed; 
    this.camera.y += offset.y * this.cameraMoveSpeed;
  },

  startPlacingSelectedBuilding: function() {
    if (!this._selectedBuilding) return;
    if (!this.placing) return;
    if (this.startPlacing) return;

    if (this._selectedBuilding == 'room') {
      // Store the current mouse position
    }

    this.startPlacing = true;
  },

  finishPlacingSelectedBuilding: function() {
    if (!this.placing) return;
    if (!this.startPlacing) return;

    console.log("Placed building from, to ", 
      this._currentStartPlacementPosition.toString(), 
      this._currentEndPlacementPosition.toString());

    var buildings = this.generatePlacingBuildings();
    buildings.forEach(function(building) {
      building.placed = true;
      this.addBuilding(building);
    }.bind(this));
    
    this.saveState();

    this.stopPlacingBuilding();
  },

  setSelectedBuildingType: function(type) {
    this._selectedBuilding = type;
    this.stopPlacingBuilding();
    this.startPlacingBuilding(this._selectedBuilding);
    this.updateToolbarUI(type);
  },

  updateToolbarUI: function(activeType) {
    $('.active[action]').removeClass('active');  
    if (activeType) {
      $('[action="select-' + activeType + '"]').addClass('active');
    }
  },

  update: function() {
    if (this.inputActions.place.isDown) {
      this.startPlacingSelectedBuilding();
    }

    // Need to find a way to capture the release when the press started on another element
    if (this.inputActions.place.justReleased()) {
      this.finishPlacingSelectedBuilding();
    }

    if (this.inputActions.place_orbital.isDown && this.inputActions.place_orbital.repeats == 0) {
      // this.startPlacingBuilding('orbital');
      this.setSelectedBuildingType('orbital');
    }

    // if (this.inputActions.place_room.isDown && this.inputActions.place_room.repeats == 0) {
    //   // this.startPlacingBuilding('room');
    //   this._selectedBuilding = 'room';
    // }

    if (this.inputActions.place_wall.isDown && this.inputActions.place_wall.repeats == 0) {
      // this.startPlacingBuilding('wall');
      this.setSelectedBuildingType('wall');
    }

    if (this.inputActions.place_door.isDown && this.inputActions.place_door.repeats == 0) {
      // this.startPlacingBuilding('door');
      this.setSelectedBuildingType('door');
    }

    if (this.inputActions.place_loader.isDown && this.inputActions.place_loader.repeats == 0) {
      // this.startPlacingBuilding('loader');
      this.setSelectedBuildingType('loader');
    }

    if (this.inputActions.cancel.isDown && this.inputActions.cancel.repeats == 0) {
      this.stopPlacingBuilding();
    }

    this.updateCamera();
    this.updateMarker();
  }

};
