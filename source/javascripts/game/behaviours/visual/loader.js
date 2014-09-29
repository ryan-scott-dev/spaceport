sp.behaviours.visual.loader = {
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
};
