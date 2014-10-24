Spaceport.Behaviours.MoveTowards = {

  create: function(params) {
  },

  hasMovementTarget: function() {
    if (this._target) return true;

    if (this.state == 'arrived') {
      return this._target = this.assignedDock.position;
    }

    if (this.state == 'docked') {
      return false;
    }

    if (this.state == 'leaving') {
      return this._target = this.exitPoint;
    }

    return false;
  },

  update: function() {
    if (this.hasMovementTarget()) {
      var position = this.position;
      var target = this._target;

      // TODO: RS - Make the rotation gradual
      this.rotation = this.game.physics.arcade.moveToXY(this, target.x, target.y, 200);
      var distance = Phaser.Math.distanceRounded(this.position.x, this.position.y, this._target.x, this._target.y);

      if (Phaser.Math.fuzzyLessThan(distance, 10, 1)) {
        if (this.state == 'arrived') {
          this.state = 'docked';
          this._target = null;  

          // Wait some time and then un-dock
          this.dockTimer = 0;
        }
        if (this.state == 'leaving') {
          if (this.assignedDock) {
            this.assignedDock.assignedShip = null;
            this.assignedDock = null;  
          }
          
          this.game.removeShip(this);
          this.destroy();
        }
      }
    } else {
      this.body.velocity.set(0, 0);

      if (this.state == 'docked') {
        this.dockTimer += this.game.time.elapsed;
        if (this.dockTimer > 3000) {
          this.state = 'leaving';
          this._target = null;
        }
      }
    }
  }

};
