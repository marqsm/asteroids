/**********************************************
 * utils
 **********************************************/
var getVelocity = function(angle, speed) {
    return {
        x: Math.sin(toRadians(angle)) * speed,
        y: -Math.cos(toRadians(angle)) * speed
    }
}

// rotation around origin
var rotate2d = function(point, angle) {
    return {
        x : point.x * Math.cos(toRadians(angle)) - point.y * (Math.sin(toRadians(angle))),
        y : point.y * Math.cos(toRadians(angle)) + point.x * (Math.sin(toRadians(angle)))
    }
}

var toRadians = function(angle) {
    return angle * Math.PI / 180;
}

var toDegrees = function(angle) {
    return angle * 180 / Math.PI;
}

var drawRect = function(screen, body) {
    screen.fillRect(body.center.x - body.size.x / 2, body.center.y - body.size.y / 2,
                body.size.x, body.size.y);
};

var forceToRange = function(n, min, max) {
    if      (n > max) return min;
    else if (n < min) return max;
    return n;
};


/**********************************************
 * Game variables & code.
 **********************************************/

var canvas,
    screen;


var Game = function(canvasId) {
    canvas = document.getElementById(canvasId);
    screen = canvas.getContext('2d');

    var gameSize = {
        x: canvas.width,
        y: canvas.height
    };

    this.bodies = [];
    this.bodies = this.bodies.concat(new Player(this, gameSize));

    for (var i=0; i < 5; i++) {
        this.bodies = this.bodies.concat(new Asteroid(gameSize, {
                                            x: Math.random()*gameSize.x,
                                            y: Math.random()*gameSize.y
                                        }, {
                                            x: Math.random()*4,
                                            y: Math.random()*4
                                        }
        ));
    }

    var self = this;

    var tick = function() {
        self.update();
        self.draw(screen, gameSize);

        // Queue up the next call to tick with the browser.
        requestAnimationFrame(tick);
    };

    // Kick off the game tick.
    tick();

}

Game.prototype = {
    update: function() {
        for (var i = 0; i < this.bodies.length; i++) {
            this.bodies[i].update();
        }
    },

    draw: function(screen, gameSize) {
        screen.clearRect(0, 0, gameSize.x, gameSize.y);

        for (var i = 0; i < this.bodies.length; i++) {
            this.bodies[i].draw(screen);
        }
    },

    addBody: function(body) {
        this.bodies.push(body);
    }
}




var Bullet = function(center, velocity) {
    this.center = center;
    this.velocity = velocity;
    this.size = {
        x: 3,
        y: 3
    }
    return this;
}

Bullet.prototype = {
    update: function() {
        this.center.x += this.velocity.x;
        this.center.y += this.velocity.y;
    },
    draw : function(screen) {
        drawRect(screen, this);
    }
}

var Player = function(game, gameSize) {
    this.SPEED = 0.2;
    this.FRICTION = 0.98;
    this.ROTATION_SPEED = 5;
    this.BULLET_SPEED = 10;

    this.game = game;
    this.gameSize = gameSize;
    this.size = { x: 15, y: 15 };
    this.center = {
        x: gameSize.x / 2,
        y: gameSize.y / 2 - this.size.y * 2
    };
    this.velocity = {
        x : 0,
        y : 0
    }
    this.rotation = 0;
    this.keyboarder = new Keyboarder();
}

Player.prototype = {
    shoot: function() {
        var bullet = new Bullet({
                                x: this.center.x,
                                y: this.center.y
                            }, getVelocity(this.rotation, this.BULLET_SPEED));
        this.game.addBody(bullet);
        console.log('piu');
    },

    update: function() {
        if (this.keyboarder.isDown(this.keyboarder.KEYS.SPACE)) {
            this.shoot();
        }

        // get keyboard UP, LEFT, RIGHT
        if (this.keyboarder.isDown(this.keyboarder.KEYS.RIGHT)) {
            this.rotation += this.ROTATION_SPEED % 360;
        } else if (this.keyboarder.isDown(this.keyboarder.KEYS.LEFT)) {
            this.rotation -= this.ROTATION_SPEED % 360;
        }

        if (this.keyboarder.isDown(this.keyboarder.KEYS.UP)) {
            var velocity_change = getVelocity(this.rotation, this.SPEED);
            this.velocity.x += velocity_change.x;
            this.velocity.y += velocity_change.y;
        } else {
            this.velocity.x = this.velocity.x * this.FRICTION;
            this.velocity.y = this.velocity.y * this.FRICTION;
        }

        // move ship
        this.center.x += this.velocity.x;
        this.center.y += this.velocity.y;

        //f went over the edge, teleport to other edge.
        this.center.x = forceToRange(this.center.x, 0, this.gameSize.x);
        this.center.y = forceToRange(this.center.y, 0, this.gameSize.y);


        // calculate velocity to new frame
        // console.log('dx: ' + this.velocity.x + ' dy: ' + this.velocity.y + ' speed: ' + this.SPEED + ' rotation: ' + this.rotation);
    },

    draw : function(screen) {
        var p1 = rotate2d({ x: 0, y: -30 }, this.rotation),
            p2 = rotate2d({ x: 15, y: 20 }, this.rotation),
            p3 = rotate2d({ x: -15, y: 20 }, this.rotation);

        screen.beginPath();
        screen.fillStyle = "rgb(200,0,0)";
        screen.moveTo(this.center.x + p1.x, this.center.y + p1.y);
        screen.lineTo(this.center.x + p2.x, this.center.y + p2.y);
        screen.lineTo(this.center.x + p3.x, this.center.y + p3.y);
        screen.fill();
    }
}

var Keyboarder = function() {
    var keyState = {};
    this.KEYS = {
        LEFT: 37,
        RIGHT: 39,
        UP: 38,
        DOWN: 40,
        SPACE: 32
    }

    window.onkeydown = function(event) {
        keyState[event.keyCode] = true;
    }

    window.onkeyup = function(event) {
        keyState[event.keyCode] = false;
    }

    this.isDown = function(keyCode) {
        return keyState[keyCode] === true;
    }
}


var Asteroid = function(gameSize, center, velocity) {
    this.center = center;
    this.gameSize = gameSize;
    this.velocity = velocity;
    this.size = {
        x: 15,
        y: 15
    }
    return this;
}

Asteroid.prototype = {
    update: function() {
        this.center.x += this.velocity.x;
        this.center.y += this.velocity.y;

        //f went over the edge, teleport to other edge.
        this.center.x = forceToRange(this.center.x, 0, this.gameSize.x);
        this.center.y = forceToRange(this.center.y, 0, this.gameSize.y);

    },
    draw : function(screen) {
        drawRect(screen, this);
    }
}

/**********************************************
 * Initialization
 **********************************************/

window.onload = function() {
    new Game('screen');
}