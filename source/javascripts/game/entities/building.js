Spaceport.Building = function (game, params) {

  var type = params.type || 'unknown';
  var config = Spaceport.Config.Buildings[type];
  var spriteImage = params.sprite || config.sprite;
  var x = params.x || 0;
  var y = params.y || 0;
  
  Phaser.Sprite.call(this, game, x, y, spriteImage);

  if (config.has_id) {
    this.id = params.id || chance.guid();  
  }
  
  this.rotation = params.rotation || 0;
  this.type = type;
  
  this.pivot = params.pivot || config.pivot;
  this.renderOrder = params.renderOrder || config.render_order;

  this.behaviours = [];

  this.setPlaced(params.placed || false);

  var behaviours = config.components;
  if (behaviours) {
    behaviours.forEach(function(behaviour) {
      this.addBehaviour(behaviour);
    }.bind(this));

    // TODO: RS - Only call create if not loading the game state
    behaviours.filter(function(behaviour) {
      return !!behaviour.create;
    })
    .forEach(function(behaviour) {
      behaviour.create.call(this, params);
    }.bind(this));
  }
};

Spaceport.Building.prototype = Object.create(Phaser.Sprite.prototype);
Spaceport.Building.prototype.constructor = Spaceport.Building;

Spaceport.Building.mixin({

  setPlaced: function(placed) {
    this.placed = placed;
    if (!this.placed) {
      this.tint = 0x1BFF1B;
    } else {
      this.tint = 0xFFFFFF;
    }
  },

  serialize: function() {
    var properties = {
      id: this.id,
      type: this.type,
      x: this.x,
      y: this.y,
      rotation: this.rotation,
    };

    this.behaviours.forEach(function(behaviour) {
      var customProperties = behaviour.getProperties ? behaviour.getProperties.call(this) : {};
      for(var property in customProperties) {
        properties[property] = customProperties[property];
      }
    }.bind(this));
    
    return properties;
  },

  addBehaviour: function(behaviour) {
    this.behaviours.push(behaviour);

    for (var property in behaviour) {
      if (behaviour.hasOwnProperty(property)) {
        this[property] = behaviour[property];
      }
    }
  },

  update: function() {
    this.behaviours.filter(function(behaviour) {
      return !!behaviour.update;
    })
    .forEach(function(behaviour) {
      behaviour.update.call(buildingSprite);
    });
  }

});
