Spaceport.Behaviours.Visual.Loader = {
  create: function() {
    this.graphics.triggerZone = this.game.add.graphics(0, -32, this);
    this.graphics.triggerZone.lineStyle(1, 0x00FF00, 0.5);
    this.graphics.triggerZone.drawRect(0, 0, 32, 32);
  
    this.graphics.base = this.game.add.graphics(0, 0, this);
    this.graphics.base.lineStyle(2, 0x4D3D1F, 1);
    this.graphics.base.drawRect(0, 0, 32, 32);
  },

  update: function() {
    this.graphics.triggerZone.visible = !this.placed;
  }
};
