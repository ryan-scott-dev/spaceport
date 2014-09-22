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
  }

  function createDockSilhouette(x, y, rotation) {
    orbitalGroup = game.add.group();
    orbitalGroup.x = x || 0;
    orbitalGroup.y = y || 0;
    orbitalGroup.rotation = rotation || 0;
    orbitalGroup.pivot.x = (32 * 3) / 2;
    orbitalGroup.pivot.y = (32 * 5) / 2;

    orbital = game.add.graphics(0, 0, orbitalGroup);
    orbital.lineStyle(2, 0xFF00FF, 1);
    orbital.drawRect(0, 0, 32 * 3, 32 * 4);

    orbitalLoadZone = game.add.graphics(0, 128, orbitalGroup);
    orbitalLoadZone.lineStyle(2, 0x00FF00, 1);
    orbitalLoadZone.drawRect(0, 0, 32 * 3, 32);

    orbitalGroup.serialize = function() {
      return {
        type: 'orbital',
        x: orbitalGroup.x,
        y: orbitalGroup.y,
        rotation: orbitalGroup.rotation,
      };
    };

    return orbitalGroup;
  }

  function createWallSilhouette(x, y, rotation) {
    wall = game.add.graphics();
    wall.x = x || 0;
    wall.y = y || 0;
    wall.rotation = rotation || 0;
    wall.pivot.x = (32 * 1) / 2;
    wall.pivot.y = (32 * 1) / 2;
    wall.lineStyle(2, 0xFF1D3D, 1);
    wall.drawRect(0, 0, 32 * 1, 32 * 1);

    wall.serialize = function() {
      return {
        type: 'wall',
        x: wall.x,
        y: wall.y,
        rotation: wall.rotation,
      };
    };

    return wall;
  }

  function createDoorSilhouette(x, y, rotation) {
    door = game.add.graphics();
    door.x = x || 0;
    door.y = y || 0;
    door.rotation = rotation || 0;
    door.pivot.x = (32 * 1) - 16;
    door.pivot.y = (32 * 1) / 2;
    door.lineStyle(2, 0x1D3DFF, 1);
    door.drawRect(0, 0, 32 * 2, 32 * 1);

    door.serialize = function() {
      return {
        type: 'door',
        x: door.x,
        y: door.y,
        rotation: door.rotation,
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
      placing.rotation += -Math.PI / 2;
    }

    if (actions.place.isDown && actions.place.repeats == 0 && placing) {
      console.log('Placed Building');
      
      /* TODO - Register building created */
      /* TODO - Make Sound Effect */
      /* TODO - Remove silhouette and add 'proper' implementation */

      placing = null;
    }

    if (actions.place_orbital.isDown && actions.place_orbital.repeats == 0 && !placing) {
      console.log('Placing Orbital Dock');
      placing = createDockSilhouette();
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
