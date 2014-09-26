//= require_tree ./game

window.gameRuntime = (function() {
  function preload() {
    game.load.image('tiles', 'assets/tmw_desert_spacing.png');
  }

  function create() {
    game.scale.scaleMode = Phaser.ScaleManager.RESIZE;
    game.stage.backgroundColor = '#2d2d2d';

    map = game.add.tilemap();
    map.addTilesetImage('tiles');

    layer = map.create('Ground', 40, 30, 32, 32);

    layer.resizeWorld();

    marker = game.add.graphics();
    marker.lineStyle(2, 0xFFFFFF, 1);
    marker.drawRect(0, 0, 32, 32);

    buildings = [];
    robots = [];
    chance = new Chance();

    placing = null;
    cursors = game.input.keyboard.createCursorKeys();

    actions = {
      rotate: game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR ),
      place_orbital: game.input.keyboard.addKey(Phaser.Keyboard.O),
      place_wall: game.input.keyboard.addKey(Phaser.Keyboard.W),
      place_door: game.input.keyboard.addKey(Phaser.Keyboard.D),
      place_loader: game.input.keyboard.addKey(Phaser.Keyboard.L),

      cancel: game.input.keyboard.addKey(Phaser.Keyboard.ESC),
      place: game.input.keyboard.addKey(Phaser.Keyboard.ENTER),
    };

    load();
  }

  function load() {
    var state = JSON.parse(localStorage.getItem('game.state'));
    fromGameState(state || {});
  }

  function save() {
    var state = gameState();
    localStorage.setItem('game.state', JSON.stringify(state));
  }

  function gameState() {
    return {
      buildings: this.buildings.map(function(building) { return building.serialize(); }),
      robots: this.robots.map(function(robot) { return robot.serialize(); })
    }
  }

  function fromGameState(state) {
    state.buildings = state.buildings || [];
    state.robots = state.robots || [];

    state.robots.forEach(function(robot) {
      addRobot(robot);
    });

    state.buildings.forEach(function(building) {
      building.placed = true;
      addBuilding(building);
    });
  };

  function createBuilding(template) {
    switch (template.type) {
      case 'wall': {
        return createWallSilhouette(template);
      }
      case 'orbital': {
        return createOrbitalSilhouette(template);
      }
      case 'door': {
        return createDoorSilhouette(template);
      }
      case 'loader': {
        return createLoaderSilhouette(template);
      }
      default: {
        console.error("Unable to create building of type '" + template.type + "'");
      }
    }
    return null;
  }

  function addBuilding(buildingTemplate) {
    var newBuilding = createBuilding(buildingTemplate); 
    this.buildings.push(newBuilding);
  };

  function addRobot(robotTemplate) {
    var newRobot = createCargoRobot(robotTemplate.id, robotTemplate.x, robotTemplate.y, robotTemplate.rotation); 
    this.robots.push(newRobot);
  };

  function findRobot(id) {
    return this.robots.find(function(robot) { return robot.id == id; } );
  }

  function createABuilding(params) {
    var buildingGroup = game.add.group();
    buildingGroup.id = params.id || chance.guid();
    buildingGroup.x = params.x || 0;
    buildingGroup.y = params.y || 0;
    buildingGroup.rotation = params.rotation || 0;
    buildingGroup.type = params.type || 'unknown';
    buildingGroup.placed = params.placed || false;
    buildingGroup.pivot = params.pivot || lookupBuildingPivot(buildingGroup.type);
    
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
        var customProperties = behaviour.getProperties ? behaviour.getProperties.apply(self) : {};
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
      var self = this;
      this._behaviours.forEach(function(behaviour) {
        behaviour.onUpdate.apply(self);
      });
    };

    buildingGroup._behaviours.forEach(function(behaviour) {
      behaviour.onCreate.apply(buildingGroup)
    });
    
    return buildingGroup;  
  };

  function setupOrbitalGraphics(building) {
    var orbital = game.add.graphics(0, 0, building);
    orbital.lineStyle(2, 0xFF00FF, 1);
    orbital.drawRect(0, 0, 32 * 3, 32 * 4);
    
    if (building.placed) {
      orbital.beginFill(0xFF00FF, 0.5);
      orbital.drawRect(0, 0, 32 * 3, 32 * 4);
      orbital.endFill();
    } else {
      var orbitalLoadZone = game.add.graphics(0, 128, building);
      orbitalLoadZone.lineStyle(1, 0x00FF00, 0.5);
      orbitalLoadZone.drawRect(0, 0, 32 * 3, 32);  
    }
  };

  function createOrbitalSilhouette(params) {
    var orbitalGroup = createABuilding(params);
    setupOrbitalGraphics(orbitalGroup);

    return orbitalGroup;
  }

  function setupWallGraphics(building) {
    var wall = game.add.graphics(0, 0, building);
    
    wall.lineStyle(2, 0xFF1D3D, 1);
    wall.moveTo(0, 0);
    wall.lineTo(32 * 1, 0);
  };

  function createWallSilhouette(params) {
    var wallGroup = createABuilding(params);
    setupWallGraphics(wallGroup);

    return wallGroup;
  }

  function setupDoorGraphics(building) {
    if (!building.placed) {
      var doorTriggerZone1 = game.add.graphics(0, -32, building);
      doorTriggerZone1.lineStyle(1, 0x00FF00, 0.5);
      doorTriggerZone1.drawRect(0, 0, 32 * 3, 32);

      var doorTriggerZone2 = game.add.graphics(0, 0, building);
      doorTriggerZone2.lineStyle(1, 0x00FF00, 0.5);
      doorTriggerZone2.drawRect(0, 0, 32 * 3, 32);
    }

    var door = game.add.graphics(0, 0, building);
    door.lineStyle(2, 0x1D3DFF, 1);
    door.moveTo(0, 0);
    door.lineTo(32 * 3, 0);
  };

  function createDoorSilhouette(params) {
    var doorGroup = createABuilding(params);
    setupDoorGraphics(doorGroup);

    return doorGroup;
  }

  function setupLoaderGraphics(building) {
    if (!building.placed) {
      var doorTriggerZone1 = game.add.graphics(0, -32, building);
      doorTriggerZone1.lineStyle(1, 0x00FF00, 0.5);
      doorTriggerZone1.drawRect(0, 0, 32, 32);
    }

    var loader = game.add.graphics(0, 0, building);
    loader.lineStyle(2, 0x4D3D1F, 1);
    loader.drawRect(0, 0, 32, 32);
  };

  function lookupBuildingPivot(type) {
    building_pivots = {
      orbital: new Phaser.Point((32 * 3) / 2, (32 * 5) / 2),
      wall:    new Phaser.Point((32 * 1) / 2, (32 * 1) / 2),
      door:    new Phaser.Point((32 * 3) / 2, (32 * 1) / 2),
      loader:  new Phaser.Point((32 * 1) / 2, (32 * 1) / 2),
    };
    return building_pivots[type];
  };

  function createLoaderSilhouette(params) {
    var loaderGroup = createABuilding(params);
    loaderGroup._spawnedRobot = findRobot(params.robotId);
    
    setupLoaderGraphics(loaderGroup);

    var loaderBehaviour = {
      onCreate: function(params) {
        this._spawnedRobot = findRobot(params.robotId);
      },

      ensureRobotSpawned: function() {
        if (this.requiresRobotSpawn()) {
          this.spawnRobot();
        }
      },

      requiresRobotSpawn: function() {
        return !this._spawnedRobot && this.placed;
      },

      spawnRobot: function() {
        this._spawnedRobot = createCargoRobot(null, this.x, this.y, this.rotation);
        robots.push(this._spawnedRobot);
        save();
      },

      getProperties: function() {
        return {
          robotId: this._spawnedRobot ? this._spawnedRobot.id : null,
        };
      },

      onUpdate: function() {
        this.ensureRobotSpawned();      
      },
    };

    loaderGroup.addBehaviour(loaderBehaviour);

    return loaderGroup;
  }

  function createCargoRobot(id, x, y, rotation) {
    var robot = game.add.graphics();
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
  };

  function updateMarker() {
    marker.x = layer.getTileX(game.input.activePointer.worldX) * 32;
    marker.y = layer.getTileY(game.input.activePointer.worldY) * 32;
    marker.visible = (placing == null);
  }

  function rotateBuilding() {
    if (!placing) return;

    placing.rotation += Math.PI / 2;
  }

  function placeBuilding() {
    if (!placing) return;

    console.log('Placed Building');
    placing.placed = true;
    addBuilding(placing);
    save();
    /* TODO - Register building created */
    /* TODO - Make Sound Effect */
    /* TODO - Remove silhouette and add 'proper' implementation */

    stopPlacingBuilding();
  }

  function startPlacingBuilding(type) {
    if (placing) return;

    placing = createBuilding({ type: type });
  }

  function stopPlacingBuilding() {
    if (!placing) return;

    placing.destroy();
    placing = null;
  }

  function updatePlacingBuilding() {
    if (!placing) return;

    placing.x = marker.x + 16;
    placing.y = marker.y + 16;
  }

  function updateCamera() {
    if (cursors.left.isDown) {
      game.camera.x -= 4;
    } else if (cursors.right.isDown) {
      game.camera.x += 4;
    }

    if (cursors.up.isDown) {
      game.camera.y -= 4;
    } else if (cursors.down.isDown) {
      game.camera.y += 4;
    }
  }

  function update() {

    if (actions.rotate.isDown && actions.rotate.repeats == 0) {
      rotateBuilding();
    }

    if (actions.place.isDown && actions.place.repeats == 0) {
      placeBuilding();
    }

    if (actions.place_orbital.isDown && actions.place_orbital.repeats == 0) {
      startPlacingBuilding('orbital');
    }

    if (actions.place_wall.isDown && actions.place_wall.repeats == 0) {
      startPlacingBuilding('wall');
    }

    if (actions.place_door.isDown && actions.place_door.repeats == 0) {
      startPlacingBuilding('door');
    }

    if (actions.place_loader.isDown && actions.place_loader.repeats == 0) {
      startPlacingBuilding('loader');
    }

    if (actions.cancel.isDown && actions.cancel.repeats == 0) {
      stopPlacingBuilding();
    }

    updatePlacingBuilding();

    updateCamera();
    updateMarker();
  }

  var game = new Phaser.Game('100', '100', Phaser.AUTO, $('.canvas_container')[0], { 
    preload: preload, 
    create: create, 
    update: update 
  });

  return game;
})();
