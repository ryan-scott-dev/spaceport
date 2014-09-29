sp.behaviours.visual.door = {
  create: function() {
    this.graphics.triggerZone1 = this.game.add.graphics(0, -32, this);
    this.graphics.triggerZone1.lineStyle(1, 0x00FF00, 0.5);
    this.graphics.triggerZone1.drawRect(0, 0, 32 * 3, 32);

    this.graphics.triggerZone2 = this.game.add.graphics(0, 0, this);
    this.graphics.triggerZone2.lineStyle(1, 0x00FF00, 0.5);
    this.graphics.triggerZone2.drawRect(0, 0, 32 * 3, 32);
  
    this.graphics.base = this.game.add.graphics(0, 0, this);
    this.graphics.base.lineStyle(2, 0x1D3DFF, 1);
    this.graphics.base.moveTo(0, 0);
    this.graphics.base.lineTo(32 * 3, 0);
  },

  update: function() {
    this.graphics.triggerZone1.visible = 
    this.graphics.triggerZone2.visible = 
      !this.placed;
  }
};
