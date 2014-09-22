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
    placing = null;
    cursors = game.input.keyboard.createCursorKeys();

    actions = {
      rotate: game.input.keyboard.addKey(Phaser.Keyboard.R),
      place_orbital: game.input.keyboard.addKey(Phaser.Keyboard.O),
      place_wall: game.input.keyboard.addKey(Phaser.Keyboard.W),
      place_door: game.input.keyboard.addKey(Phaser.Keyboard.D),

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
      buildings: this.buildings.map(function(building) { return building.serialize(); })
    }
  }

  function fromGameState(state) {
    state.buildings = state.buildings || [];

    state.buildings.forEach(function(building) {
      switch (building.type) {
        case 'wall': {
          var wall = createWallSilhouette(building.x, building.y, building.rotation);
          this.buildings.push(wall);
          break;
        }
        case 'orbital': {
          var orbital = createOrbitalSilhouette(building.x, building.y, building.rotation);
          this.buildings.push(orbital);
          break;
        }
        case 'door': {
          var door = createDoorSilhouette(building.x, building.y, building.rotation);
          this.buildings.push(door);
          break;
        }
        default: {
          console.error("Unable to create building of type '" + building.type + "'");
        }
      }
    });
  }

  function createOrbitalSilhouette(x, y, rotation) {
    var orbitalGroup = game.add.group();
    orbitalGroup.x = x || 0;
    orbitalGroup.y = y || 0;
    orbitalGroup.rotation = rotation || 0;
    orbitalGroup.pivot.x = (32 * 3) / 2;
    orbitalGroup.pivot.y = (32 * 5) / 2;

    var orbital = game.add.graphics(0, 0, orbitalGroup);
    orbital.lineStyle(2, 0xFF00FF, 1);
    orbital.drawRect(0, 0, 32 * 3, 32 * 4);

    var orbitalLoadZone = game.add.graphics(0, 128, orbitalGroup);
    orbitalLoadZone.lineStyle(2, 0x00FF00, 1);
    orbitalLoadZone.drawRect(0, 0, 32 * 3, 32);

    orbitalGroup.serialize = function() {
      return {
        type: 'orbital',
        x: this.x,
        y: this.y,
        rotation: this.rotation,
      };
    };

    return orbitalGroup;
  }

  function createWallSilhouette(x, y, rotation) {
    var wall = game.add.graphics();
    wall.x = x || 0;
    wall.y = y || 0;
    wall.rotation = rotation || 0;
    wall.pivot.x = (32 * 1) / 2;
    wall.pivot.y = 16;
    wall.lineStyle(2, 0xFF1D3D, 1);
    wall.moveTo(0, 0);
    wall.lineTo(32 * 1, 0);

    wall.serialize = function() {
      return {
        type: 'wall',
        x: this.x,
        y: this.y,
        rotation: this.rotation,
      };
    };

    return wall;
  }

  function createDoorSilhouette(x, y, rotation) {
    var door = game.add.graphics();
    door.x = x || 0;
    door.y = y || 0;
    door.rotation = rotation || 0;
    door.pivot.x = (32 * 3) / 2;
    door.pivot.y = 16;
    door.lineStyle(2, 0x1D3DFF, 1);
    door.moveTo(0, 0);
    door.lineTo(32 * 3, 0);

    door.serialize = function() {
      return {
        type: 'door',
        x: this.x,
        y: this.y,
        rotation: this.rotation,
      };
    };

    return door;
  }

  function update() {
    marker.x = layer.getTileX(game.input.activePointer.worldX) * 32;
    marker.y = layer.getTileY(game.input.activePointer.worldY) * 32;
    
    if (cursors.left.isDown) {
      game.camera.x -= 4;
    } else if (cursors.right.isDown) {
      game.camera.x += 4;
    }

    if (actions.rotate.isDown && actions.rotate.repeats == 0 && placing) {
      placing.rotation += Math.PI / 2;
    }

    if (actions.place.isDown && actions.place.repeats == 0 && placing) {
      console.log('Placed Building');
      
      buildings.push(placing);
      save();
      /* TODO - Register building created */
      /* TODO - Make Sound Effect */
      /* TODO - Remove silhouette and add 'proper' implementation */

      placing = null;
    }

    if (actions.place_orbital.isDown && actions.place_orbital.repeats == 0 && !placing) {
      console.log('Placing Orbital Dock');
      placing = createOrbitalSilhouette();
    }

    if (actions.place_wall.isDown && actions.place_wall.repeats == 0 && !placing) {
      console.log('Placing Wall');
      placing = createWallSilhouette();
    }

    if (actions.place_door.isDown && actions.place_door.repeats == 0 && !placing) {
      console.log('Placing Door');
      placing = createDoorSilhouette();
    }

    if (actions.cancel.isDown && actions.cancel.repeats == 0) {
      console.log('CANCELLED');
      
      if (placing) {
        placing.destroy();
        placing = null;
      }
    }

    if (placing) {
      placing.x = marker.x + 16;
      placing.y = marker.y + 16;
    }

    if (cursors.up.isDown) {
      game.camera.y -= 4;
    } else if (cursors.down.isDown) {
      game.camera.y += 4;
    }
  }

  var game = new Phaser.Game('100', '100', Phaser.AUTO, $('.canvas_container')[0], { 
    preload: preload, 
    create: create, 
    update: update 
  });

  return game;
})();
