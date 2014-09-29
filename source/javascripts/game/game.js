sp.game.runtime = (function() {
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

  function createBuilding(params) {
    var buildingGroup = sp.game.runtime.add.group();
    buildingGroup.id = params.id || chance.guid();
    buildingGroup.x = params.x || 0;
    buildingGroup.y = params.y || 0;
    buildingGroup.rotation = params.rotation || 0;
    buildingGroup.type = params.type || 'unknown';
    buildingGroup.placed = params.placed || false;
    buildingGroup.pivot = params.pivot || lookupBuildingPivot(buildingGroup.type);

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
      var self = this;
      this._behaviours.filter(function(behaviour) {
        return !!behaviour.onUpdate;
      })
      .forEach(function(behaviour) {
        behaviour.onUpdate.call(self);
      });
    };

    var behaviours = lookupBuildingBehaviours(params.type);
    if (behaviours) {
      behaviours.forEach(function(behaviour) {
        buildingGroup.addBehaviour(behaviour);
      });

      behaviours.filter(function(behaviour) {
        return !!behaviour.onCreate;
      })
      .forEach(function(behaviour) {
        behaviour.onCreate.call(buildingGroup, params);
      });
    }

    return buildingGroup;  
  };

  var orbitalVisual = {
    onCreate: function() {
      this.graphics.orbital = sp.game.runtime.add.graphics(0, 0, this);
      this.graphics.orbital.lineStyle(2, 0xFF00FF, 1);
      this.graphics.orbital.drawRect(0, 0, 32 * 3, 32 * 4);
      
      this.graphics.orbital.beginFill(0xFF00FF, 0.5);
      this.graphics.orbital.drawRect(0, 0, 32 * 3, 32 * 4);
      this.graphics.orbital.endFill();

      this.graphics.triggerZone = sp.game.runtime.add.graphics(0, 128, this);
      this.graphics.triggerZone.lineStyle(1, 0x00FF00, 0.5);
      this.graphics.triggerZone.drawRect(0, 0, 32 * 3, 32);  
    },

    onUpdate: function() {
      this.graphics.triggerZone.visible = !this.placed;
    }
  }

  var wallVisual = {
    onCreate: function() {
      this.graphics.wall = sp.game.runtime.add.graphics(0, 0, this);
      
      this.graphics.wall.lineStyle(2, 0xFF1D3D, 1);
      this.graphics.wall.moveTo(0, 0);
      this.graphics.wall.lineTo(32 * 1, 0);
    }
  }

  var doorVisual = {
    onCreate: function() {
      this.graphics.triggerZone1 = sp.game.runtime.add.graphics(0, -32, this);
      this.graphics.triggerZone1.lineStyle(1, 0x00FF00, 0.5);
      this.graphics.triggerZone1.drawRect(0, 0, 32 * 3, 32);

      this.graphics.triggerZone2 = sp.game.runtime.add.graphics(0, 0, this);
      this.graphics.triggerZone2.lineStyle(1, 0x00FF00, 0.5);
      this.graphics.triggerZone2.drawRect(0, 0, 32 * 3, 32);
    
      this.graphics.base = sp.game.runtime.add.graphics(0, 0, this);
      this.graphics.base.lineStyle(2, 0x1D3DFF, 1);
      this.graphics.base.moveTo(0, 0);
      this.graphics.base.lineTo(32 * 3, 0);
    },

    onUpdate: function() {
      this.graphics.triggerZone1.visible = 
      this.graphics.triggerZone2.visible = 
        !this.placed;
    }
  }

  function lookupBuildingPivot(type) {
    var building_pivots = {
      orbital: new Phaser.Point((32 * 3) / 2, (32 * 5) / 2),
      wall:    new Phaser.Point((32 * 1) / 2, (32 * 1) / 2),
      door:    new Phaser.Point((32 * 3) / 2, (32 * 1) / 2),
      loader:  new Phaser.Point((32 * 1) / 2, (32 * 1) / 2),
    };
    return building_pivots[type];
  };

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

  var loaderVisual = {
    onCreate: function() {
      this.graphics.triggerZone = sp.game.runtime.add.graphics(0, -32, this);
      this.graphics.triggerZone.lineStyle(1, 0x00FF00, 0.5);
      this.graphics.triggerZone.drawRect(0, 0, 32, 32);
    
      this.graphics.base = sp.game.runtime.add.graphics(0, 0, this);
      this.graphics.base.lineStyle(2, 0x4D3D1F, 1);
      this.graphics.base.drawRect(0, 0, 32, 32);
    },

    onUpdate: function() {
      this.graphics.triggerZone.visible = !this.placed;
    }
  }

  function lookupBuildingBehaviours(type) {
    var building_behaviours = {
      loader:   [loaderBehaviour, loaderVisual],
      door:     [doorVisual],
      orbital:  [orbitalVisual],
      wall:     [wallVisual],
    };
    return building_behaviours[type];
  };

  function createCargoRobot(id, x, y, rotation) {
    var robot = sp.game.runtime.add.graphics();
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
