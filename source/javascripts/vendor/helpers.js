Function.prototype.method = function (name, func) {
    this.prototype[name] = func;
    return this;
};

Function.method('mixin', function (properties) {
  for (var property in properties) {
    if (properties.hasOwnProperty(property)) {
      this.prototype[property] = properties[property];
    }
  }
});

Function.method('properties', function (properties) {
  for (var property in properties) {
    if (properties.hasOwnProperty(property)) {
      Object.defineProperty(this.prototype, property, properties[property]);
    }
  }
});

Function.method('handlers', function () {
  this.prototype.handlers = [];
  for (var i = 0; i < arguments.length; i++) {
    var eventHandler = arguments[i];
    this.prototype.handlers.push(eventHandler);
  }

  this.prototype.bindClassHandlers = function() {
    for (var i = 0; i < this.constructor.prototype.handlers.length; i++) {
      var handlerAttr = this.constructor.prototype.handlers[i];
      var target = handlerAttr.target ? this[handlerAttr.target] : this;
      target.on(handlerAttr.event, (this[handlerAttr.handler]).bind(this));
    };
  }
});
