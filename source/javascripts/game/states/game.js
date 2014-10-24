Spaceport.Game = function (game) {

  /* logic */
  this.buildings;
  this.robots;
  this.ships;

  this.saveTimerElapsed;

  /* Building Placement */
  this.buildingPlacement;

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
    this.ships = [];
    
    this.saveTimerElapsed = 0;

    this.map = this.add.tilemap();
    this.map.addTilesetImage('tiles');

    this.layer = this.map.create('Ground', 60, 30, 32, 32);
    this.layer.resizeWorld();

    this.stage.smoothed = false;
    this.stage.backgroundColor = '#1A1A1A';

    this.physics.startSystem(Phaser.Physics.ARCADE);

    // RS: Look at this.stage.setInteractionDelegate for events on other elements
    
    this.marker = this.add.graphics();
    this.marker.lineStyle(2, 0xFFFFFF, 1);
    this.marker.drawRect(0, 0, 32, 32);

    this.buildingPlacement = null;
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
    this.onAction('select-floor',   function() { this.setSelectedBuildingType('floor');    });
    this.onAction('select-door',    function() { this.setSelectedBuildingType('door');    });
    this.onAction('select-dock', function() { this.setSelectedBuildingType('dock'); });
  },

  bindViews: function() {
    for (var i = 0; i < arguments.length; i++) {
      var view = arguments[i]
      this.bindView($("[view='" + view + "']"));
    }
  },

  bindView: function(viewElement) {
    var elementsWithActions = $('[action]', viewElement);
    elementsWithActions.on('click', function(evt) {
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
    this.updateRenderOrder();

    console.time('saveState');
    var state = this.gameState();
    localStorage.setItem('game.state', JSON.stringify(state));
    console.timeEnd('saveState');
  },

  gameState: function() {
    return {
      buildings: this.buildings.map(function(building) { return building.serialize(); }),
      robots: this.robots.map(function(robot) { return robot.serialize(); }),
      ships: this.ships.map(function(ship) { return ship.serialize(); })
    }
  },

  fromGameState: function(state) {
    state.buildings = state.buildings || [];
    state.robots = state.robots || [];
    state.ships = state.ships || [];

    state.robots.forEach(function(robot) {
      this.addRobot(robot);
    }.bind(this));

    state.buildings.forEach(function(building) {
      building.placed = true;
      this.addBuilding(building);
    }.bind(this));

    state.ships.forEach(function(ship) {
      this.addShip(ship);
    }.bind(this));

    this.updateRenderOrder();
  },

  findBuildingById: function(id) {
    return this.buildings.find(function(building) { return building.id == id; } );
  },

  addBuilding: function(buildingTemplate) {
    var newBuilding = this.createBuilding(buildingTemplate);
    this.buildings.push(newBuilding);
  },

  createBuilding: function(params) {
    var buildingSprite = new Spaceport.Building(this, params);
    this.world.add(buildingSprite);
    return buildingSprite;
  },

  addShip: function(params) {
    var newShip = this.createShip(params);
    this.ships.push(newShip);
  },

  createShip: function(params) {
    var shipSprite = new Spaceport.Ship(this, params);
    this.world.add(shipSprite);
    return shipSprite;
  },

  removeShip: function(ship) {
    var shipIndex = this.ships.indexOf(ship);
    if (shipIndex < 0) return;
    
    this.ships.splice(shipIndex, 1);
  },

  lookupBuildingPlacementBehaviours: function(type) {
    return Spaceport.Config.Buildings[type].placement_behaviours;
  },

  updateMarker: function () {
    this.marker.x = this.layer.getTileX(this.input.activePointer.worldX) * 32;
    this.marker.y = this.layer.getTileY(this.input.activePointer.worldY) * 32;
    this.marker.visible = (!this.buildingPlacement || !this.buildingPlacement.isPlacing);
  },

  updateBuildingPlacement: function() {
    if (!this.buildingPlacement) return;

    this.buildingPlacement.update();
  },

  placeBuildings: function(buildings) {
    buildings.forEach(function(building) {
      building.setPlaced(true);
      this.addBuilding(building);
    }.bind(this));
    
    this.saveState();
  },

  startPlacingSelectedBuilding: function() {
    if (this.buildingPlacement) {
      this.buildingPlacement.startPlacingSelectedBuilding();  
    }
  },

  finishPlacingSelectedBuilding: function() {
    if (this.buildingPlacement && this.buildingPlacement.canFinishPlacement()) {
      this.buildingPlacement.finishPlacingSelectedBuilding();

      this.buildingPlacement.destroy();
      this.buildingPlacement = null;
    }
  },

  stopPlacingBuilding: function() {
    if (this.buildingPlacement) {
      this.buildingPlacement.stopPlacingBuilding();

      this.buildingPlacement.destroy();
      this.buildingPlacement = null;
    }
  },

  lookupBuildingPlacementConstructor: function(type) {
    return type.capitalize() + 'BuildingPlacement';
  },

  setSelectedBuildingType: function(type) {
    if (this.buildingPlacement) {
      this.buildingPlacement.destroy();
      this.buildingPlacement = null;
    }
    if (type) {
      var buildingPlacementConstructor = this.lookupBuildingPlacementConstructor(type);
      this.buildingPlacement = new (Spaceport[buildingPlacementConstructor])({ game: this, type: type });  
    }
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

    if (!this.buildingPlacement || this.buildingPlacement.noSelectedBuildingType()) {
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

  updateToolbarUI: function(activeType) {
    $('.active[action]').removeClass('active');  
    if (activeType) {
      $('[action="select-' + activeType + '"]').addClass('active');
    }
  },

  updateRenderOrder: function() {
    this.removeBuildingDuplicates();

    console.time('updateRenderOrder');

    this.world.customSort(function(self, other) {
      var selfOrder = self.renderOrder || 0;
      var otherOrder = other.renderOrder || 0;

      if (selfOrder > otherOrder) return 1;
      if (selfOrder < otherOrder) return -1;
      return 0;
    });

    console.timeEnd('updateRenderOrder');
  },

  removeBuildingDuplicates: function() {
    // Check if there are buildings with the same type, position, and rotation and remove them
    // An exception exists for floors which there can only be one of that type on each position
  },

  spawnShipForDock: function(dock) {
    var x = dock.x;
    var y = this.map.heightInPixels + 300;
    var ship = this.addShip({ type: 'cargo', x: x, y: y, assignedDock: dock });
    return ship;
  },

  spawnShips: function() {
    // If there are any docks that are placed which don't have an assigned ship
    var docks = this.buildings.filter(function(building) {
      return building.type == 'dock';
    });

    var unassignedDocks = docks.filter(function(dock) {
      return dock.assignedShip == null;
    });

    unassignedDocks.forEach(function(unassignedDock) {
      // Spawn a new ship at the bottom of the map, assigned to the dock
      this.spawnShipForDock(unassignedDock);  
    }.bind(this));
  },

  updateSaveTimer: function() {
    this.saveTimerElapsed += this.time.elapsed;
    if (this.saveTimerElapsed > 3000) {
      this.saveState();
      this.saveTimerElapsed = 0;
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

    if (this.inputActions.cancel.isDown && this.inputActions.cancel.repeats == 0) {
      this.stopPlacingBuilding();
    }

    this.updateCamera();
    this.updateBuildingPlacement();
    this.updateMarker();

    this.updateSaveTimer();

    this.spawnShips();
  }

};
