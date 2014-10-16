Spaceport.Game = function (game) {

  /* logic */
  this.buildings;
  this.robots;
  this.placing;

  this.selected;

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
    this.map = this.add.tilemap();
    this.map.addTilesetImage('tiles');
    
    this.layer = this.map.create('Ground', 40, 30, 32, 32);
    this.layer.resizeWorld();

    this.stage.smoothed = false;
    this.stage.backgroundColor = '#2d2d2d';
    // Look at this.stage.setInteractionDelegate for events on other elements
    
    this.marker = this.add.graphics();
    this.marker.lineStyle(2, 0xFFFFFF, 1);
    this.marker.drawRect(0, 0, 32, 32);

    this.cursors = this.input.keyboard.createCursorKeys();

    this.inputActions = {
      rotate: this.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR ),
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

    this.onAction('select-wall', function() { this.setSelectedBuildingType('wall'); });
    this.onAction('select-room', function() { this.setSelectedBuildingType('room'); });
    this.onAction('select-door', function() { this.setSelectedBuildingType('door'); });
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
    var state = JSON.parse(localStorage.getItem('game.state'));
    this.fromGameState(state || {});
  },

  saveState: function() {
    var state = this.gameState();
    localStorage.setItem('game.state', JSON.stringify(state));
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
    this.marker.visible = (this.placing == null);
  },

  rotateBuilding: function() {
    if (!this.placing) return;

    this.placing.rotation += Math.PI / 2;
  },

  placeBuilding: function() {
    if (!this.placing) return;

    this.placing.placed = true;
    this.addBuilding(this.placing);
    this.saveState();
    
    /* TODO - Make Sound Effect */

    var placementBehaviours = this.lookupBuildingPlacementBehaviours(this.placing.type);
    this.stopPlacingBuilding();
    if (placementBehaviours.indexOf('deselect') == -1) {
      this.resetPlacing();
    }
  },

  resetPlacing: function() {
    this.setSelectedBuildingType(this._selectedBuilding);
    // this.startPlacingSelectedBuilding();
  },

  startPlacingBuilding: function(type) {
    if (this.placing) return;

    this.placing = this.createBuilding({ type: type });
  },

  stopPlacingBuilding: function() {
    if (!this.placing) return;

    this.placing.destroy();
    this.placing = null;

    this.updateToolbarUI();
  },

  updatePlacingBuilding: function() {
    if (!this.placing) return;

    this.placing.x = this.marker.x + 16;
    this.placing.y = this.marker.y + 16;
    
    if (this.placing.updateSilhouette) this.placing.updateSilhouette();
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

    this.dragCameraTowardPointer(this.input.activePointer);
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
    return (pointer.position.x < this.hotzone.width) || (pointer.position.x > this.game.width - this.hotzone.width) ||
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
    if (this.placing.readyToPlace) return;

    if (this._selectedBuilding == 'room') {
      // Store the current mouse position
    }

    this.placing.readyToPlace = true;
  },

  finishPlacingSelectedBuilding: function() {
    if (!this.placing) return;
    if (!this.placing.readyToPlace) return;

    this.placeBuilding();
    if (this._selectedBuilding == 'room') {
      // Create a series of wall buildings from the start position to the end position
    } else {
      // Do nothing
    }
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
    if (this.inputActions.rotate.isDown && this.inputActions.rotate.repeats == 0) {
      this.rotateBuilding();
    }

    // if (this.inputActions.place.isDown) {
    //   this.startPlacingSelectedBuilding();
    // }

    // Need to find a way to capture the release when the press started on another element
    if (this.inputActions.place.justReleased()) {
      this.startPlacingSelectedBuilding();
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

    this.updatePlacingBuilding();

    this.updateCamera();
    this.updateMarker();
  }

};
