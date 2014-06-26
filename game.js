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

// if greater than max, reset to min. If smaller than min, reset to max.
var forceToRange = function(n, min, max) {
    if      (n > max) return min;
    else if (n < min) return max;
    return n;
};

/**********************************************
 * Game variables & code.
 **********************************************/

var canvas,
    screen
    ASTEROID_COUNT = 3,
    ASTEROID_MAX_SPEED = 3,
    ASTEROID_SIZES = [15, 20, 28, 36, 44];


var Game = function(canvasId) {
    canvas = document.getElementById(canvasId);
    screen = canvas.getContext('2d');

    var gameSize = {
        x: canvas.width,
        y: canvas.height
    };

    this.bodies = [];
    this.removeQueue = [];
    this.bodies = this.bodies.concat(new Player(this, gameSize));

    for (var i=0; i < ASTEROID_COUNT; i++) {
        this.bodies = this.bodies.concat(new Asteroid(this, gameSize, {
                                            x: Math.random()*gameSize.x,
                                            y: Math.random()*gameSize.y
                                        }, {
                                            x: Math.random()*ASTEROID_MAX_SPEED,
                                            y: Math.random()*ASTEROID_MAX_SPEED
                                        }, Math.floor(Math.random()*3 + 2)
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


var colliding = function(a, b) {
    if (a === b) return false;

    // on the left or right side
    if (a.center.x + a.size.x/2 < b.center.x - b.size.x/2 ||
        a.center.x - a.size.x/2 > b.center.x + b.size.x/2) return false;
    // x in range, but is above or below?
    if (a.center.y + a.size.y/2 < b.center.y - b.size.y/2 ||
        a.center.y - a.size.y/2 > b.center.y + b.size.y/2) return false;

    return true;
}


Game.prototype = {
    update: function() {
        var collisions = [],
            self = this;

        // get collisions with other objects
        for (var i = 0; i < this.bodies.length; i++) {
            this.bodies[i].update();
        }

        for (var i = 0; i < this.bodies.length; i++) {
            for (var j = i+1; j < this.bodies.length; j++) {
                if (colliding(this.bodies[i], this.bodies[j])) {
                    this.bodies[i].collision(this.bodies[j]);
                    this.bodies[j].collision(this.bodies[i]);
                }
            }
        }
        this.emptyRemoveQueue();
    },

    draw: function(screen, gameSize) {
        screen.clearRect(0, 0, gameSize.x, gameSize.y);

        for (var i = 0; i < this.bodies.length; i++) {
            this.bodies[i].draw(screen);
        }
    },

    addBodies: function(bodies) {
        this.bodies.push(bodies);
    },

    removeBody: function(body) {
        this.removeQueue.push(body);
    },

    emptyRemoveQueue: function() {
        if (this.removeQueue.length > 0)
        for (var i=0; i < this.removeQueue.length; i++) {
            this.bodies.splice(this.bodies.indexOf(this.removeQueue[i]), 1);
        }
        this.removeQueue = [];
    }

}


var Bullet = function(game, center, velocity) {
    this.game = game;
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
        screen.fillStyle = "rgb(250,250,250)";
        drawRect(screen, this);
    },
    collision: function() {
        this.game.removeBody(this);
        console.log('bullet collision');
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
        var bullet, tip;

        tip = rotate2d({x: 0, y: 20}, this.rotation);
        bullet = new Bullet(this.game, {x: this.center.x - tip.x, y: this.center.y - tip.y},
                            getVelocity(this.rotation, this.BULLET_SPEED));
        this.game.addBodies(bullet);
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
        var p1 = rotate2d({ x: 0, y: -20 }, this.rotation),
            p2 = rotate2d({ x: 10, y: 10 }, this.rotation),
            p3 = rotate2d({ x: -10, y: 10 }, this.rotation);

        screen.beginPath();
        screen.strokeStyle = "rgb(250,250,250)";
        screen.moveTo(this.center.x + p1.x, this.center.y + p1.y);
        screen.lineTo(this.center.x + p2.x, this.center.y + p2.y);
        screen.lineTo(this.center.x + p3.x, this.center.y + p3.y);
        screen.closePath();
        screen.lineWidth = 1;
        screen.stroke();
    },
    collision: function(obj) {
        console.log('player collided')
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


var Asteroid = function(game, gameSize, center, velocity, power) {
    this.center = center;
    this.game = game;
    this.power = power;
    this.gameSize = gameSize;
    this.velocity = velocity;
    this.size = {
        x: ASTEROID_SIZES[this.power],
        y: ASTEROID_SIZES[this.power]
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
        screen.fillStyle = "rgb(200,0,0)";
        drawRect(screen, this);
    },
    collision: function(collidingBody) {
        if (!(collidingBody instanceof Asteroid)) {
            this.game.removeBody(this);

            this.power -= 1;
            if (this.power > 0) {
                this.game.addBodies(new Asteroid(this.game, this.gameSize,
                    {x: this.center.x, y: this.center.y},
                    {x: Math.random()*ASTEROID_MAX_SPEED, y: Math.random()*ASTEROID_MAX_SPEED },
                    this.power
                ));
                this.game.addBodies(new Asteroid(this.game, this.gameSize,
                    {x: this.center.x, y: this.center.y},
                    {x: Math.random()*ASTEROID_MAX_SPEED, y: Math.random()*ASTEROID_MAX_SPEED },
                    this.power
                ));
                this.game.addBodies(new Asteroid(this.game, this.gameSize,
                    {x: this.center.x, y: this.center.y},
                    {x: Math.random()*ASTEROID_MAX_SPEED, y: Math.random()*ASTEROID_MAX_SPEED },
                    this.power
                ));
            }
            console.log('asteroid and something else bang!')
        } else {
            console.log('asteroid to asteroid bang')
        }
    }

}

/**********************************************
 * Initialization
 **********************************************/

window.onload = function() {
    new Game('screen');
}