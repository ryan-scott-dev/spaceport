Spaceport.BaseEntity = function(game, params, entityConfig) {
  var type = params.type || 'unknown';
  var config = entityConfig[type];
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

Spaceport.BaseEntity.prototype = Object.create(Phaser.Sprite.prototype);
Spaceport.BaseEntity.prototype.constructor = Spaceport.BaseEntity;

Spaceport.BaseEntity.mixin({

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
  },

  getEntityProperties: function() {
    return {};
  },

  serialize: function() {
    var properties = {
      id: this.id,
      type: this.type,
      x: this.x,
      y: this.y,
      rotation: this.rotation
    };

    var entityProperties = this.getEntityProperties();
    for(var property in entityProperties) {
      properties[property] = entityProperties[property];
    }

    this.behaviours.forEach(function(behaviour) {
      var customProperties = behaviour.getProperties ? behaviour.getProperties.call(this) : {};
      for(var property in customProperties) {
        properties[property] = customProperties[property];
      }
    }.bind(this));
    
    return properties;
  },

});
