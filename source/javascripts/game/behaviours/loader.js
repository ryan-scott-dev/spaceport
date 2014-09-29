sp.behaviours.loader = {

  onCreate: function(params) {
    this._spawnedRobot = sp.game.map.findRobot(params.robotId);
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
    this._spawnedRobot = sp.game.map.createCargoRobot(null, this.x, this.y, this.rotation);
    sp.game.map.robots.push(this._spawnedRobot);
    sp.game.save();
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
