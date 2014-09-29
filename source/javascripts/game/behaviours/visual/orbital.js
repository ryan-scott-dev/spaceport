Spaceport.Behaviours.Visual.Orbital = {
  create: function() {
    this.graphics.orbital = this.game.add.graphics(0, 0, this);
    this.graphics.orbital.lineStyle(2, 0xFF00FF, 1);
    this.graphics.orbital.drawRect(0, 0, 32 * 3, 32 * 4);
    
    this.graphics.orbital.beginFill(0xFF00FF, 0.5);
    this.graphics.orbital.drawRect(0, 0, 32 * 3, 32 * 4);
    this.graphics.orbital.endFill();

    this.graphics.triggerZone = this.game.add.graphics(0, 128, this);
    this.graphics.triggerZone.lineStyle(1, 0x00FF00, 0.5);
    this.graphics.triggerZone.drawRect(0, 0, 32 * 3, 32);  
  },

  update: function() {
    this.graphics.triggerZone.visible = !this.placed;
  }
};
