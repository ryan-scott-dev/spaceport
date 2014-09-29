Spaceport.Behaviours.Loader = {

  create: function(params) {
    this._spawnedRobot = this.world.findRobot(params.robotId);
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
    this._spawnedRobot = this.world.createCargoRobot( { x: this.x, y: this.y, rotation: this.rotation } );
    this.world.addNewRobot(this._spawnedRobot);
  },

  getProperties: function() {
    return {
      robotId: this._spawnedRobot ? this._spawnedRobot.id : null,
    };
  },

  update: function() {
    this.ensureRobotSpawned();      
  },

};
