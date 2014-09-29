Spaceport.Game = function (game) {

  /* logic */
  this.buildings;
  this.robots;
  this.placing;

  /* ui */

  this.map;
  this.layer;

  this.marker;

  /* input */
  this.cursors;
  this.inputActions;
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
      place: this.input.keyboard.addKey(Phaser.Keyboard.ENTER),
    };

    this.loadState();
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
    var newRobot = this.createCargoRobot(robotTemplate.id, robotTemplate.x, robotTemplate.y, robotTemplate.rotation); 
    this.robots.push(newRobot);
  },

  addNewRobot: function(robot) {
    this.robots.push(robot);
    this.save();
  },

  findRobot: function(id) {
    return this.robots.find(function(robot) { return robot.id == id; } );
  },

  createBuilding: function(params) {
    var buildingGroup = this.add.group();
    buildingGroup.id = params.id || chance.guid();
    buildingGroup.x = params.x || 0;
    buildingGroup.y = params.y || 0;
    buildingGroup.rotation = params.rotation || 0;
    buildingGroup.type = params.type || 'unknown';
    buildingGroup.placed = params.placed || false;
    buildingGroup.pivot = params.pivot || this.lookupBuildingPivot(buildingGroup.type);

    buildingGroup.graphics = {};
    buildingGroup._behaviours = [];

    buildingGroup.serialize = function() {
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

    buildingGroup.addBehaviour = function(behaviour) {
      this._behaviours.push(behaviour);

      for (var property in behaviour) {
        if (behaviour.hasOwnProperty(property)) {
          this[property] = behaviour[property];
        }
      }
    };

    buildingGroup.update = function() {
      this._behaviours.filter(function(behaviour) {
        return !!behaviour.update;
      })
      .forEach(function(behaviour) {
        behaviour.update.call(buildingGroup, this);
      }.bind(this));
    };

    var behaviours = this.lookupBuildingBehaviours(params.type);
    if (behaviours) {
      behaviours.forEach(function(behaviour) {
        buildingGroup.addBehaviour(behaviour);
      });

      behaviours.filter(function(behaviour) {
        return !!behaviour.create;
      })
      .forEach(function(behaviour) {
        behaviour.create.call(buildingGroup, this, params);
      }.bind(this));
    }

    return buildingGroup;  
  },

  lookupBuildingPivot: function(type) {
    var building_pivots = {
      orbital: new Phaser.Point((32 * 3) / 2, (32 * 5) / 2),
      wall:    new Phaser.Point((32 * 1) / 2, (32 * 1) / 2),
      door:    new Phaser.Point((32 * 3) / 2, (32 * 1) / 2),
      loader:  new Phaser.Point((32 * 1) / 2, (32 * 1) / 2),
    };
    return building_pivots[type];
  },

  // var loaderBehaviour = {
  //   onCreate: function(params) {
  //     this._spawnedRobot = findRobot(params.robotId);
  //   },

  //   ensureRobotSpawned: function() {
  //     if (this.requiresRobotSpawn()) {
  //       this.spawnRobot();
  //     }
  //   },

  //   requiresRobotSpawn: function() {
  //     return !this._spawnedRobot && this.placed;
  //   },

  //   spawnRobot: function() {
  //     this._spawnedRobot = createCargoRobot(null, this.x, this.y, this.rotation);
  //     addNewRobot(this._spawnedRobot);
  //   },

  //   getProperties: function() {
  //     return {
  //       robotId: this._spawnedRobot ? this._spawnedRobot.id : null,
  //     };
  //   },

  //   onUpdate: function() {
  //     this.ensureRobotSpawned();      
  //   },
  // };

  lookupBuildingBehaviours: function(type) {
    var building_behaviours = {
      loader:   [sp.behaviours.visual.loader],
      door:     [sp.behaviours.visual.door],
      orbital:  [sp.behaviours.visual.orbital],
      wall:     [sp.behaviours.visual.wall],
    };
    return building_behaviours[type];
  },

  createCargoRobot: function(id, x, y, rotation) {
    var robot = this.add.graphics();
    robot.id = id || chance.guid();
    robot.x = x || 0;
    robot.y = y || 0;
    robot.rotation = rotation || 0;
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

    console.log('Placed Building');
    this.placing.placed = true;
    this.addBuilding(this.placing);
    this.saveState();
    /* TODO - Register building created */
    /* TODO - Make Sound Effect */
    /* TODO - Remove silhouette and add 'proper' implementation */

    this.stopPlacingBuilding();
  },

  startPlacingBuilding: function(type) {
    if (this.placing) return;

    this.placing = this.createBuilding({ type: type });
  },

  stopPlacingBuilding: function() {
    if (!this.placing) return;

    this.placing.destroy();
    this.placing = null;
  },

  updatePlacingBuilding: function() {
    if (!this.placing) return;

    this.placing.x = this.marker.x + 16;
    this.placing.y = this.marker.y + 16;
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
  },

  update: function() {
    if (this.inputActions.rotate.isDown && this.inputActions.rotate.repeats == 0) {
      this.rotateBuilding();
    }

    if (this.inputActions.place.isDown && this.inputActions.place.repeats == 0) {
      this.placeBuilding();
    }

    if (this.inputActions.place_orbital.isDown && this.inputActions.place_orbital.repeats == 0) {
      this.startPlacingBuilding('orbital');
    }

    if (this.inputActions.place_wall.isDown && this.inputActions.place_wall.repeats == 0) {
      this.startPlacingBuilding('wall');
    }

    if (this.inputActions.place_door.isDown && this.inputActions.place_door.repeats == 0) {
      this.startPlacingBuilding('door');
    }

    if (this.inputActions.place_loader.isDown && this.inputActions.place_loader.repeats == 0) {
      this.startPlacingBuilding('loader');
    }

    if (this.inputActions.cancel.isDown && this.inputActions.cancel.repeats == 0) {
      this.stopPlacingBuilding();
    }

    this.updatePlacingBuilding();

    this.updateCamera();
    this.updateMarker();
  }

};
