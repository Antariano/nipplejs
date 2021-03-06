///////////////////////
///   THE NIPPLE    ///
///////////////////////

var Nipple = function (manager, options) {
    this.identifier = options.identifier;
    this.position = options.position;
    this.backPosition = options.backPosition;
    this.frontPosition = options.frontPosition;
    this.manager = manager;
    this.config(options);
    this.buildEl()
        .stylize();

    this.toReturn = {
        el: this.ui.el,
        on: this.on.bind(this),
        off: this.off.bind(this),
        show: this.show.bind(this),
        hide: this.hide.bind(this),
        add: this.addToDom.bind(this),
        remove: this.removeFromDom.bind(this),
        destroy: this.destroy.bind(this),
        computeDirection: this.computeDirection.bind(this),
        trigger: this.trigger.bind(this),
        position: this.position,
        backPosition: this.backPosition,
        frontPosition: this.frontPosition,
        ui: this.ui,
        identifier: this.identifier,
        options: this.options
    };

    return this.toReturn;
};

Nipple.prototype = new Super();

// Configure Nipple instance.
Nipple.prototype.config = function (options) {
    this.options = {};

    // Defaults
    this.options.size = 100;
    this.options.threshold = 0.1;
    this.options.color = 'white';
    this.options.fadeTime = 250;
    this.options.dataOnly = false;
    this.options.restOpacity = 0.5;
    this.options.mode = 'dynamic';

    // Overwrites
    for (var i in options) {
        if (this.options.hasOwnProperty(i)) {
            this.options[i] = options[i];
        }
    }

    if (this.options.mode === 'dynamic') {
        this.options.restOpacity = 0;
    }

    return this;
};

// Build the dom element of the Nipple instance.
Nipple.prototype.buildEl = function (options) {
    if (this.options.dataOnly) {
        return;
    }
    this.ui = {};
    this.ui.el = document.createElement('div');
    this.ui.back = document.createElement('div');
    this.ui.front = document.createElement('div');

    this.ui.el.className = 'nipple';
    this.ui.back.className = 'back';
    this.ui.front.className = 'front';

    this.ui.el.setAttribute('id', 'nipple_' + this.identifier);

    this.ui.el.appendChild(this.ui.back);
    this.ui.el.appendChild(this.ui.front);

    return this;
};

// Apply CSS to the Nipple instance.
Nipple.prototype.stylize = function () {
    if (this.options.dataOnly) {
        return;
    }
    var animTime = this.options.fadeTime + 'ms';
    var borderStyle = u.getVendorStyle('borderRadius', '50%');
    var transitStyle = u.getTransitionStyle('transition', 'opacity', animTime);
    var styles = {};
    styles.el = {
        width: this.options.size + 'px',
        height: this.options.size + 'px',
        position: 'absolute',
        opacity: this.options.restOpacity,
        display: 'block',
        'zIndex': 999
    };

    styles.back = {
        position: 'absolute',
        display: 'block',
        width: '100%',
        height: '100%',
        marginLeft: -this.options.size / 2 + 'px',
        marginTop: -this.options.size / 2 + 'px',
        background: this.options.color,
        'opacity': '.5'
    };

    styles.front = {
        width: '50%',
        height: '50%',
        position: 'absolute',
        display: 'block',
        marginLeft: -this.options.size / 4 + 'px',
        marginTop: -this.options.size / 4 + 'px',
        background: this.options.color,
        'opacity': '.5'
    };

    u.extend(styles.el, transitStyle);
    u.extend(styles.back, borderStyle);
    u.extend(styles.front, borderStyle);

    this.applyStyles(styles);

    return this;
};

Nipple.prototype.applyStyles = function (styles) {
    // Apply styles
    for (var i in this.ui) {
        if (this.ui.hasOwnProperty(i)) {
            for (var j in styles[i]) {
                this.ui[i].style[j] = styles[i][j];
            }
        }
    }

    return this;
};

// Inject the Nipple instance into DOM.
Nipple.prototype.addToDom = function () {
    // We're not adding it if we're dataOnly or already in dom.
    if (this.options.dataOnly || document.contains(this.ui.el)) {
        return;
    }
    this.manager.options.zone.appendChild(this.ui.el);
    return this;
};

// Remove the Nipple instance from DOM.
Nipple.prototype.removeFromDom = function () {
    if (this.options.dataOnly || !document.contains(this.ui.el)) {
        return;
    }
    this.manager.options.zone.removeChild(this.ui.el);
    return this;
};

// Entirely destroy this nipple
Nipple.prototype.destroy = function () {
    clearTimeout(this.removeTimeout);
    clearTimeout(this.showTimeout);
    clearTimeout(this.restTimeout);
    this.off();
    this.removeFromDom();
    this.trigger('destroyed', this.toReturn);
    this.manager.trigger('destroyed ' + this.identifier + ':destroyed',
        this.toReturn);
};

// Fade in the Nipple instance.
Nipple.prototype.show = function (cb) {
    var self = this;

    if (self.options.dataOnly) {
        return;
    }

    clearTimeout(self.removeTimeout);
    clearTimeout(self.showTimeout);
    clearTimeout(self.restTimeout);

    self.addToDom();

    self.restCallback();

    setTimeout(function () {
        self.ui.el.style.opacity = 1;
    }, 0);

    self.showTimeout = setTimeout(function () {
        self.trigger('shown', self.toReturn);
        self.manager.trigger('shown ' + self.identifier + ':shown',
            self.toReturn);
        if (typeof cb === 'function') {
            cb.call(this);
        }
    }, self.options.fadeTime);

    return self;
};

// Fade out the Nipple instance.
Nipple.prototype.hide = function (cb) {
    var self = this;

    if (self.options.dataOnly) {
        return;
    }

    self.ui.el.style.opacity = self.options.restOpacity;

    clearTimeout(self.removeTimeout);
    clearTimeout(self.showTimeout);
    clearTimeout(self.restTimeout);

    self.removeTimeout = setTimeout(
        function () {
            var display = self.options.mode === 'dynamic' ? 'none' : 'block';
            self.ui.el.style.display = display;
            if (typeof cb === 'function') {
                cb.call(self);
            }

            self.trigger('hidden', self.toReturn);
            self.manager.trigger('hidden ' + self.identifier + ':hidden',
                self.toReturn);
        },
        self.options.fadeTime
    );
    self.restPosition();

    return self;
};

Nipple.prototype.restPosition = function (cb) {
    var self = this;
    self.frontPosition = {
        x: 0,
        y: 0
    };
    var animTime = self.options.fadeTime + 'ms';

    var transitStyle = {};
    transitStyle.front = u.getTransitionStyle('transition',
        ['top', 'left'], animTime);

    var styles = {front: {}};
    styles.front = {
        left: self.frontPosition.x + 'px',
        top: self.frontPosition.y + 'px'
    };

    self.applyStyles(transitStyle);
    self.applyStyles(styles);

    self.restTimeout = setTimeout(
        function () {
            if (typeof cb === 'function') {
                cb.call(self);
            }
            self.restCallback();
        },
        self.options.fadeTime
    );
};

Nipple.prototype.restCallback = function () {
    var self = this;
    var transitStyle = {};
    transitStyle.front = u.getTransitionStyle('transition', 'none', '');
    self.applyStyles(transitStyle);
    self.trigger('rested', self.toReturn);
    self.manager.trigger('rested ' + self.identifier + ':rested',
        self.toReturn);
};

Nipple.prototype.computeDirection = function (obj) {
    var rAngle = obj.angle.radian;
    var angle45 = Math.PI / 4;
    var angle90 = Math.PI / 2;
    var direction, directionX, directionY;

    // Angular direction
    //     \  UP /
    //      \   /
    // LEFT       RIGHT
    //      /   \
    //     /DOWN \
    //
    if (rAngle > angle45 && rAngle < (angle45 * 3)) {
        direction = 'up';
    } else if (rAngle > -angle45 && rAngle <= angle45) {
        direction = 'left';
    } else if (rAngle > (-angle45 * 3) && rAngle <= -angle45) {
        direction = 'down';
    } else {
        direction = 'right';
    }

    // Plain direction
    //    UP                 |
    // _______               | RIGHT
    //                  LEFT |
    //   DOWN                |
    if (rAngle > -angle90 && rAngle < angle90) {
        directionX = 'left';
    } else {
        directionX = 'right';
    }

    if (rAngle > 0) {
        directionY = 'up';
    } else {
        directionY = 'down';
    }

    if (obj.force > this.options.threshold) {
        var oldDirection = {};
        for (var i in this.direction) {
            if (this.direction.hasOwnProperty(i)) {
                oldDirection[i] = this.direction[i];
            }
        }
        var same = true;

        this.direction = {
            x: directionX,
            y: directionY,
            angle: direction
        };

        obj.direction = this.direction;

        for (var i in oldDirection) {
            if (oldDirection[i] !== this.direction[i]) {
                same = false;
            }
        }

        if (same) {
            return obj;
        }

        if (oldDirection.x !== this.direction.x ||
            oldDirection.y !== this.direction.y) {
            this.trigger('plain', obj);
            this.manager.trigger('plain ' + this.identifier + ':plain', obj);
        }

        if (oldDirection.x !== this.direction.x) {
            this.trigger('plain:' + directionX, obj);
            this.manager.trigger('plain:' + directionX + ' ' +
                this.identifier + ':plain:' + directionX, obj);
        }

        if (oldDirection.y !== this.direction.y) {
            this.trigger('plain:' + directionY, obj);
            this.manager.trigger('plain:' + directionY + ' ' +
                this.identifier + ':plain:' + directionY, obj);
        }

        if (oldDirection.angle !== this.direction.angle) {
            this.trigger('dir dir:' + direction, obj);
            this.manager.trigger('dir dir:' + direction + ' ' +
                this.identifier + ':dir ' +
                this.identifier + ':dir:' + direction, obj);
        }
    }
    return obj;
};
