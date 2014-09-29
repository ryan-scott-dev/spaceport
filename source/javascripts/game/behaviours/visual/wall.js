sp.behaviours.visual.wall = {
  onCreate: function(game) {
    this.graphics.wall = game.add.graphics(0, 0, this);
    
    this.graphics.wall.lineStyle(2, 0xFF1D3D, 1);
    this.graphics.wall.moveTo(0, 0);
    this.graphics.wall.lineTo(32 * 1, 0);
  }
};
