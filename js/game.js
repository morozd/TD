/**
 * game logic goes here
 */
function Game(canvas, document, window) {

    /////////////////////
    // VAR DECLARATION //
    /////////////////////

    /**
     * reference to the canvas DOM element
     * @type {Object}
     */
    this.canvas = canvas;
    /**
     * reference to the object to draw at
     * @type {Object}
     */
    this.stage  = this.canvas.getContext('2d');
    /**
     * width of the stage
     * @type {Number}
     */
    this.width  = this.canvas.width;
    /**
     * height of the stage
     * @type {Number}
     */
    this.height = this.canvas.height;
    /**
     * aimed frames per second
     * @type {Number}
     */
    this.FPS    = 30;
    /**
     * stores the games state ("unitialized"|"running"|"paused")
     * @type {String}
     */
    this.state  = "unitialized";
    /**
     * map - stores all the information about the map
     * @type {Object}
     */
    this.map = {
        /**
         * stores info about the map
         * @type {Graph}
         */
        tiles: new Graph([
            [1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,0,1,1,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
            [1,0,1,1,1,0,1,1,1,0,1,0,1,1,1,1,1,1,0,1],
            [1,0,1,1,1,0,1,1,1,0,1,0,0,0,0,1,1,1,0,1],
            [1,0,2,2,0,0,2,2,2,0,1,1,1,1,0,1,1,1,0,1],
            [1,0,2,2,0,0,1,1,1,0,1,1,1,1,0,1,1,1,0,1],
            [1,0,0,0,0,0,1,1,1,0,1,1,1,1,0,1,1,1,0,1],
            [1,0,0,0,0,0,1,1,1,0,2,2,1,1,0,1,1,1,0,1],
            [1,0,0,0,0,0,1,1,1,0,1,2,1,1,0,1,1,1,0,1],
            [1,0,0,0,0,0,1,1,1,0,1,2,1,1,0,1,1,1,0,1],
            [1,0,0,0,0,0,1,1,1,0,1,2,2,2,0,1,1,1,0,1],
            [1,0,0,0,0,0,1,1,1,0,1,1,1,1,0,1,1,1,0,1],
            [1,0,0,0,0,0,1,1,1,0,1,1,1,1,0,1,1,1,0,1],
            [1,0,0,0,0,0,1,1,1,0,1,1,1,1,0,1,1,1,0,1],
            [1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,1,1,1,0,1]
        ]),
        /**
         * width and height of the single tiles
         * @type {Number}
         */
        gutterWidth: 40
    };
    /**
     * number of columns
     * @type {Number}
     */
    this.map.columns = this.width  / this.map.gutterWidth;
    /**
     * number of rows
     * @type {Number}
     */
    this.map.rows    = this.height / this.map.gutterWidth;
    /**
     * point where creeps spawn
     * @type {Object}
     */
    this.map.startingPoint = this.map.tiles.nodes[0][1];
    /**
     * point where creeps want to get to
     * @type {Object}
     */
    this.map.endingPoint = this.map.tiles.nodes[14][18];
    /**
     * Array with points the path consists of
     * @type {Array}
     */
    this.map.path = astar.search(this.map.tiles.nodes, this.map.startingPoint, this.map.endingPoint);
    /**
     * Array with the corner points the path consists of
     * @type {Array}
     */
    this.map.pathEdges = (function(path){
        /**
         * new path which will be returned (only storing the edges)
         * @type {Array}
         */
        var newPath = [],
        /**
         * variable for storing the current direction
         * @type {String}
         */
            dir,
        /**
         * variable for storing the previous direction
         * @type {String}
         */
            _dir;

        // loop through all points of the path
        for (var i = 0; i < path.length-1; i++) { // path.length-1 because there we are always checking the next point as well (path[i+1]...)
            _dir = dir; // store the previous direction
            if (path[i].x !== path[i+1].x) { // if the new x position is != the old one, there's a change in direction
                dir="x";
            }
            else {
                dir="y";
            }

            if (dir !== _dir) { // if direction has changed, path[i] is a corner point
                newPath.push(path[i]); // push it into the array which is to be returned
            }
        };

        newPath.push(path[path.length-1]); // don't forget (to manually push) the last point...

        return newPath; // now return the calculated path

    })(this.map.path);
    /**
     * storing all the games infos like resources, lives, ...
     * @type {Object}
     */
    this.internal = {
        /**
         * if 100 creeps pass, you've lost
         * @type {Number}
         */
        lives: 100,
        /**
         * how far did you get?
         * @type {Number}
         */
        score: 0,
        /**
         * resources needed to build towers
         * @type {Object}
         */
        resources: {
            wood:  100,
            steel: 100
        },
        /**
         * stores references to all the creeps
         * @type {Array}
         */
        creeps: [],
        /**
         * stores references to all the turrets
         * @type {Array}
         */
        turrets: [],
        /**
         * stores references to all the bullets
         * @type {Array}
         */
        bullets: [],
        /**
         * how much does each turret cost
         * @type {Object}
         */
        costs: {
            /**
             * the normal tower costs...
             * @type {Array}
             */
            normal: [["wood", 100],["steel",100]]
        },
        /**
         * storing the amount of waves which have already been survived
         * @type {Number}
         */
        waveCount: 0
    };
    /**
     * stores some variables for debugging
     * @type {Object}
     */
    this.debug = {
        /**
         * should the path be highlighted or not?
         * @type {Boolean}
         */
        highlightPath: false,
        /**
         * should a health bar be indicated above creeps?
         * @type {Boolean}
         */
        healthBar: true
    }
    /**
     * stores the coordinates of the currently hovered tile
     * @type {Object}
     */
    this.hoveredTile = {}
    /**
     * global shorthand for gutterWidth
     * @type {Number}
     */
    var w = this.map.gutterWidth;

    /**
     * we want to position text as we are used to...
     */
    this.stage.textBaseline = "hanging";

    ////////////////////
    // CORE FUNCTIONS //
    ////////////////////
    
    /**
     * sets up the interval
     * @param  {Object} game reference to the Game object
     */
    function startGameLoop(game){
        game.state = "running";
        game.ticker = window.setInterval(function() {
            game.update();
            game.render();
        }, 1000/game.FPS);
    }

    /**
     * setup the entire game and define initial default values
     */
    this.init   = function() {
        startGameLoop(this); // start the ticker
        /**
         * stores the tiles' visualization
         * @type {Map}
         */
        this.bg_map = new Map(this);
        this.internal.wave = new Wave(this,[["normal",5]]); // initiate a new wave
        /**
         * reference to the menu object
         * @type {Menu}
         */
        this.menu = new Menu(this, document);

        this.menu.hint("starting the game - how about placing a tower?");
    }

    /**
     * clears the ticker
     */
    this.pause  = function() {
        this.state = "paused";
        this.menu.hint("game is paused(/stopped)");
        window.clearInterval(this.ticker);
    }

    /**
     * resumes the game after stopping it
     */
    this.resume = function() {
        startGameLoop(this);
        this.menu.hint("resuming game!");
    }

    /**
     * game logic like updating lives, etc. goes here
     */
    this.update = function() {
        if (this.internal.lives > 0) {
            // calculate the currently hovered tile's coordinates
            this.hoveredTile.x = (mouse.x-(mouse.x%w))/w;
            this.hoveredTile.y = (mouse.y-(mouse.y%w))/w;

            ////////////////////////////////////////////////////////////////////////////////////////
            // define these variables inside this function as they have to be updated every time! //
            ////////////////////////////////////////////////////////////////////////////////////////

            /**
             * shorthand for list of all creeps
             * @type {Array}
             */
            var creeps = this.internal.creeps,
            /**
             * shorthand for the wave object
             * @type {Wave}
             */
                wave   = this.internal.wave,
            /**
             * shorthand for list of all bullets
             * @type {Array}
             */
                bullets = this.internal.bullets,
            /**
             * shorthand for list of all turrets
             * @type {Array}
             */
                turrets = this.internal.turrets;


            if (!wave.spawning) { // if wave has just started to spawn, no creep is active --> this would mess it up
                wave.active = false; // false if there still are creeps (but only if wave has not just begun to spawn enemies)
            }

            for (var i = 0; i < creeps.length; i++) { // update position of all creeps
                if (creeps[i].spawned) { // don't try to update deleted creeps
                    creeps[i].update();
                    wave.active = true; // if there is an active creep, the wave is not finished yet
                }
            };

            if (!wave.active) { // if the wave is finished clean up all the garbage
                // don't use shorthand here because we want to reset the original values and not the aliases!
                this.internal.creeps = [];  // reset creeps array
                this.internal.bullets = []; // reset bullets array
            }

            for (var i = 0; i < turrets.length; i++) { // update all turrets (e.g. try to target a creep and shoot)
                turrets[i].update();
            };

            for (var i = 0; i < bullets.length; i++) {  // for every bullet...
                if (bullets[i].active) {
                    bullets[i].update(); // update all bullets (move them and check for collisions)
                    for (var j = 0; j < creeps.length; j++) { // every bullet should look loop through all enemies and...
                        if (creeps[j].spawned) { // only check collisions for creeps that are still living
                            if (collides(bullets[i], creeps[j])) { // ... check if they collide
                                bullets[i].hit(creeps[j]); // call the hit function (every type of bullet may have their own one)
                                return; // don't try it once again - we don't want one bullet to kill 2 enemies
                            }
                        }
                    };
                }
            };
        }
        else { // if this.internal.lives <= 0
            this.pause(); // stop game
            alert("game over - you have scored "+this.internal.score+" points!");
        }
    }

    /**
     * render the entire logic
     */
    this.render = function() {

        ////////////////////////////////////////////////////////////////////////////////////////
        // define these variables inside this function as they have to be updated every time! //
        ////////////////////////////////////////////////////////////////////////////////////////

        /**
         * shorthand for list of all creeps
         * @type {Array}
         */
        var creeps = this.internal.creeps,
        /**
         * shorthand for the wave object
         * @type {Wave}
         */
            wave   = this.internal.wave,
        /**
         * shorthand for list of all bullets
         * @type {Array}
         */
            bullets = this.internal.bullets,
        /**
         * shorthand for list of all turrets
         * @type {Array}
         */
            turrets = this.internal.turrets;

        this.stage.clearRect(0, 0, this.width, this.height); // make canvas white again to draw something new onto it

        this.bg_map.render(); // render the tiles

        if (this.debug.highlightPath) {
            this.bg_map.highlightPath(); // highlight the path (rather for testing purposes)
        }

        for (var i = 0; i < creeps.length; i++) { // update position of all creeps
            if (creeps[i].spawned) { // don't try to render deleted creeps
                creeps[i].render();
            }
        };

        for (var i = 0; i < turrets.length; i++) { // render all turrets
            turrets[i].render();
        };

        for (var i = 0; i < bullets.length; i++) { // render all bullets
            if (bullets[i].active) {
                bullets[i].render();
            }
        };

        this.bg_map.highlightTile(this.hoveredTile); // highlight the hovered tile

        this.menu.render(); // render the menu to display options, infos, etc.
    }

    //////////////////
    // INGAME STUFF //
    //////////////////

    /**
     * Menu Class
     * @param {Object} game   reference to the game object
     */
    function Menu(game) {
        /**
         * storing all the references to DOM elements
         * @type {Object}
         */
        this.displays = {};
        /**
         * reference to the DOM element displaying the lives
         * @type {Object}
         */
        this.displays.lives = document.getElementById("lives");        
        /**
         * reference to the DOM element displaying the score
         * @type {Object}
         */
        this.displays.score = document.getElementById("score");
        /**
         * reference to the DOM element displaying hints
         * @type {Object}
         */
        this.displays.hints = document.getElementById("hints");
        /**
         * reference to the DOM element showing the options for a specific turret
         * @type {Object}
         */
        this.displays.turretMenu = document.getElementById("turretMenu");
        /**
         * storing references to resource displays
         * @type {Object}
         */
        this.displays.resources = {};
        /**
         * reference to the DOM element displaying the amount of wood
         * @type {Object}
         */
        this.displays.resources.wood  = document.getElementById("wood");
        /**
         * reference to the DOM element displaying the amount of steel
         * @type {Object}
         */
        this.displays.resources.steel = document.getElementById("steel");

        /**
         * display the information
         */
        this.render = function(){
            // updating lives and score
            this.displays.lives.innerHTML = game.internal.lives+''; // +'' converts Number to String
            this.displays.score.innerHTML = game.internal.score+''; // +'' converts Number to String
            // updating resources
            this.displays.resources.wood.innerHTML  = game.internal.resources.wood +''; // +'' converts Number to String
            this.displays.resources.steel.innerHTML = game.internal.resources.steel+''; // +'' converts Number to String
        }
        /**
         * shows a hint to the player
         * @type {String} msg message to be displayed
         */
        this.hint = function(msg){
            var hint = this.displays.hints;
            hint.innerHTML = msg+''; // +'' converts Number to String
            $(hint).addClass("highlight").delay(2000).removeClass("highlight");
        }
        /**
         * show options for a specific tower
         * @param  {Turret} tower tower to show (and apply) the options for(/to)
         */
        this.showTurretMenu = function(turret) {
            document.getElementById(turret.focus).checked = "checked"; // set the current behavior to checked
            $("input:radio", "#focusRadios").removeAttr("disabled").on("change", function(e){ // listen to changes
                turret.focus = e.target.id; // set the focus to the ID of the clicked element (IDs are the possible types of the turrets' focus attribute)
            });
            turret.drawRadius = true;
        }
        /**
         * removes event listeners
         */
        this.hideTurretMenu = function() {
            $("input:radio", "#focusRadios").attr("disabled","disabled").off("change");
        }
    }

    /**
     * Map Class drawing the map as a background
     * @param {Object} game reference to the current game instance (Map class needs information about the tiles and access to the canvas 2D context)
     */
    function Map(game) {
        /**
         * renders all the tiles
         */
        this.render = function(){
            /**
             * shorthand for the tiles Array storing the type of each tile
             * @type {Array}
             */
            var tiles = game.map.tiles.input;
            game.stage.save();
                for (var i = 0; i < tiles.length; i++) { // i = row
                    for (var j = 0; j < tiles[i].length; j++) { // j = column
                        switch(tiles[i][j]) { // depending on which type a tile is, take a different color to draw it
                            case 0:
                                game.stage.fillStyle = "#FFF";
                                break;
                            case 1:
                                game.stage.fillStyle = "#000";
                                break;
                            case 2:
                                game.stage.fillStyle = "#FA0";
                                break;
                            default:
                                game.stage.fillStyle = "#000";
                                break;
                        }
                        game.stage.fillRect(j*w,i*w,w,w); // draw the tile
                    };
                };
            game.stage.restore();
        }
        /**
         * distinguish the path from other tiles
         */
        this.highlightPath = function(){
            /**
             * shorthand for path
             * @type {Array}
             */
            var path = game.map.path;
                
            game.stage.save();
                game.stage.fillStyle = "#000";
                game.stage.globalAlpha = 0.6;
                for (var i = 0; i < path.length; i++) { //for every part of the path...
                    game.stage.fillRect(path[i].y*w,path[i].x*w,w,w); // ... draw a rect
                    game.stage.font = "12px Helvetica";
                    game.stage.fillText(i,path[i].y*w + 2, path[i].x*w + 2); // ... and add the index of it
                };
            game.stage.restore();
        }
        /**
         * highlight a specific tile
         * @param  {Object} tile tile to be highlighted
         */
        this.highlightTile = function(tile){
            game.stage.save();
                game.stage.fillStyle = "#C0F";
                game.stage.globalAlpha = 0.6;
                game.stage.fillRect(tile.x*w,tile.y*w,w,w); // ... draw a rect
            game.stage.restore();
        }
    }
    /**
     * initiates a new wave when being called
     * @param {Object} game      reference to the current game instance
     * @param {Array}  creepList creeps to be spawned
     */
    function Wave(game, creepList) {
        /**
         * indicates whether there are still enemies (if there are, no new wave can be initiated)
         * @type {Boolean}
         */
        this.active = true;
        /**
         * indicates whether wave is still spawning enemies
         * @type {Boolean}
         */
        this.spawning = true;
        /**
         * shorthand for the list of creeps
         * @type {Array}
         */
        var creeps = game.internal.creeps,
        /**
         * reference to the Wave object (=this), as "this" = "window" inside the window.setInterval function
         * @type {Object}
         */
            _this = this,
        /**
         * calls the spawnCreep function every second to spawn a new creep
         * @type {Interval}
         */
            creepSpawner = window.setInterval(function(){
                _this.spawnCreep(); // call it like that because within a setInterval function, this refers to window
            }, 500),
        /**
         * counter used to iterate through the list of all creeps
         * @type {Number}
         */
            i = 0;

        game.internal.waveCount++; // increase waveCount by one when launching a new wave

        for (var i = 0; i < creepList.length; i++) { // for every group of creeps...
            for (var j = 0; j < creepList[i][1]; j++) { // ...spawn given amount of creeps
                switch (creepList[i][0]) {
                    case "normal":
                        creeps[creeps.length] = new Creep(game, 100, 2, "#C0F");
                        break;
                    case "fast":
                        creeps[creeps.length] = new Creep(game, 50,  4, "#FF0");
                        break;
                    case "hard":
                        creeps[creeps.length] = new Creep(game, 200, 1, "#0F0");
                        break;
                    default:
                        creeps[creeps.length] = new Creep(game, 100, 2, "#C0F");
                        break;
                }
            };
        };

        /**
         * spawns the "i"th creep of the game.internal.creeps Array until there is none left --> then clear the timer (creepSpawner)
         */
        this.spawnCreep = function(){
            creeps[i].spawn();
            i++;
            if (creeps[i] === undefined) { // if there is no more creep to spawn...
                window.clearInterval(creepSpawner); // ... stop the timer
                this.spawning = false; // wave is not spawning enemies anymore
            }
        }
    }
    /**
     * basic creep class
     * @param {Object} game  reference to the game object
     * @param {Number} lives number of maximum lives
     * @param {Number} speed how fast does it move
     * @param {String} color which color does it have
     */
    function Creep(game, lives, speed, color) {
        /**
         * counter - stands for the "i"th point of the path the creep is on
         * @type {Number}
         */
        var i        = 0,
        /**
         * shorthand for tiles
         * @type {Object}
         */
            tiles     = game.map.tiles,
        /**
         * shorthand for path
         * @type {Array}
         */
            path      = game.map.pathEdges,
        /**
         * tolerance whether a point has been reached or not (if set to 0 the creep has to be exactly on the point - this will never be the case though)
         * @type {Number}
         */
            tolerance = speed/w;
        /**
         * x-coordinate, is _not_ in pixels, but in squares (e.g. 3 squares from the left)
         * @type {Number}
         */
        this.x        = path[i].x;
        /**
         * y-coordinate, is _not_ in pixels, but in squares (e.g. 2 squares from the top)
         * @type {Number}
         */
        this.y        = path[i].y;
        /**
         * how fast the creep is moving
         * @type {Number}
         */
        this.speed    = speed;
        /**
         * for resetting (stores the original speed)
         * @type {Number}
         */
        this._speed   = this.speed;
        /**
         * stores the coordinates of the next point the creep moves towards to
         * @type {Object}
         */
        this.next     = {
            "x": path[i+1].x,
            "y": path[i+1].y
        };
        /**
         * indicates whether the creep is spawned (--> moves) or not (has not yet been spawned, has reached the end or has been killed) 
         * @type {Boolean}
         */
        this.spawned  = false;
        /**
         * how much can this creep take?
         * @type {Number}
         */
        this.lives    = lives;
        /**
         * storing number of maximum lives
         * @type {Number}
         */
        this._lives   = this.lives;
        /**
         * killing this creep gives the player the set amount of points
         * @type {Number}
         */
        this.scoreVal = this._lives * this._speed;
        /**
         * width of the creep - needed to calculate collisions
         * @type {Number}
         */
        this.width    = w/2;
        /**
         * height of the creep - needed to calculate collisions
         * @type {Number}
         */
        this.height   = this.width;
        /**
         * what will the player get when killing this creep?
         * @type {Array}
         */
        this.gives    = [
            /**
             * drops 10 units of wood with a possibility of 90%
             * @type {Array}
             */
            ["wood", 10, 100],
            /**
             * drops 50 units of steel with a possibility of 10%
             * @type {Array}
             */
            ["steel", 10, 100]
        ];

        /**
         * recalculates the position of the creep and checks on which tile it is (--> adjusts speed) and checks whether it's been killed
         */
        this.update   = function(){
            if (this.lives <= 0) { // if creep has been killed...

                /////////////////////////////////
                // give the player his rewards //
                /////////////////////////////////

                game.internal.score += this.scoreVal;

                for (var j = 0; j < this.gives.length; j++) { // for every element which can be dropped
                    /**
                     * shorthand for what it gives
                     * @type {String}
                     */
                    var type        = this.gives[j][0],
                    /**
                     * shorthand for how much of [type] it gives
                     * @type {Number}
                     */
                        amount      = this.gives[j][1],
                    /**
                     * shorthand for possibility that creep drops it
                     * @type {[type]}
                     */
                        possibility = this.gives[j][2];

                    if (Math.random() < possibility/100) { // for [possibility]% it will drop
                        game.internal.resources[type] += amount; // add it to the resources
                    }
                };

                this.spawned = false; // it is dead --> it doesn't have to be rendered any more
                return; // we don't need to calculate anything anymore
            }

            /**
             * shorthand for the tile value of the tile which is currently walked on
             * @type {Number}
             */
            var type = tiles.input[Math.floor(this.x)][Math.floor(this.y)]; // strip out everything after the coordinates' comma to get decimal numbers and check what type of tile it is in order to adjust speed, etc.
            switch(type) {
                case 2:
                    this.speed = this._speed/2; // slow down if type == 2
                    break;
                default:
                    this.speed = this._speed; // do nothing(/reset to default) if there's nothing special
                    break;
            }

            // this block of code is kind of weird because of the map's nature x and y are swapped
            // moves creep dependent on their speed (it's "/w" because the creep's coordinates are not in pixels --> don't move 2 fields when speed = 2)
            if ((this.next.x - this.x) < 0) { // if we are moving right
                this.x -= this.speed/w;
            } 
            if ((this.next.x - this.x) > 0) { // if we are moving left
                this.x += this.speed/w;
            }
            if ((this.next.y - this.y) < 0) { // if we are moving up
                this.y -= this.speed/w;
            }
            if ((this.next.y - this.y) > 0) { // if we are moving down
                this.y += this.speed/w;
            }

            if ((this.x <= this.next.x+tolerance && this.x >= this.next.x-tolerance) && (this.y <= this.next.y+tolerance && this.y >= this.next.y-tolerance)) { // if next point has been reached
                this.x = this.next.x;
                this.y = this.next.y;

                i++; // increase counter by one
                if (path[i+1] !== undefined) { // check if there is a next point and if so ...
                    // ... set next.x and next.y to the ones of the next point
                    this.next.x = path[i+1].x;
                    this.next.y = path[i+1].y;
                }
                else { // if there is no point left, creep has reached the end
                    this.spawned = false; // remove it
                    game.internal.lives--; // remove one life
                }
            }
        }
        /**
         * display the creep
         */
        this.render  = function(){
            game.stage.save();
                game.stage.fillStyle = color;
                game.stage.fillRect(this.y*w + this.width/2, this.x*w + this.height/2, this.width, this.height); // remember coordinates are not in pixels --> we have to multiply them with the gutterWidth
            game.stage.restore();

            if (game.debug.healthBar) {
                game.stage.save();
                    game.stage.fillStyle = "#480";
                    game.stage.fillRect(this.y*w, this.x*w, this.lives/this._lives*w, w/8); // remember coordinates are not in pixels --> we have to multiply them with the gutterWidth
                game.stage.restore();
            }
        }
        /**
         * spawn a creep
         */
        this.spawn   = function(){
            this.spawned = true;
        }
    }

    /**
     * Turret class
     * @param {Object} game reference to the game object (needed to access global variables like creeps)
     * @param {Number} x    storing the x-position of the turret (not in pixels, but in "grids")
     * @param {Number} y    storing the y-position of the turret (not in pixels, but in "grids")
     */
    function Turret(game,x,y) {
        /**
         * storing the x-position of the turret (not in pixels, but in "grids")
         * @type {Number}
         */
        this.x = x;
        /**
         * storing the y-position of the turret (not in pixels, but in "grids")
         * @type {Number}
         */
        this.y = y;
        /**
         * radius in which enemies can be targeted
         * @type {Number}
         */
        this.range = 5;
        /**
         * list of creeps that may be targeted
         * @type {Array}
         */
        this.creepsInRange = [];
        /**
         * how often will the tower shoot per second
         * @type {Number}
         */
        this.speed = 1;
        /**
         * how long will it take until the tower can shoot again
         * @type {Number}
         */
        this.coolDown = 0;
        /**
         * how many lives will take away
         * @type {Number}
         */
        this.attackPower = 100;
        /**
         * option which type of creep should be focused ("first"|"last"|"weakest"|"strongest")
         * @type {String}
         */
        this.focus = "first";
        /**
         * if set to true, the radius will be visualized
         * @type {Boolean}
         */
        this.drawRadius = false;

        /**
         * try to target a creep and shoot/handle cooldown
         */
        this.update = function() {
            this.creepsInRange = lookForEnemies(game.internal.creeps, this, this.focus); // look for creeps around the tower

            if ((this.coolDown <= 0) && (this.creepsInRange[0]) !== undefined) {
                // go shoot a creep
                this.shoot(Bullet, this.creepsInRange[0]);
                // reset the timer --> tower should only shoot "this.speed" times every second 
                // don't use 1000 here because the update function will not be called 1000 times a second, but only "FPS" times per second
                this.coolDown = game.FPS/this.speed;
            }
            else {
                this.coolDown--;
            }
        }
        /**
         * draws the tower on the stage
         */
        this.render = function() {
            game.stage.save();
                game.stage.fillStyle = "#C00";
                game.stage.fillRect(this.y*w, this.x*w, w, w); // remember coordinates are not in pixels --> we have to multiply them with the gutterWidth
            game.stage.restore();
            if (this.drawRadius) {
                game.stage.save();
                    game.stage.globalAlpha = 0.2;
                    game.stage.beginPath();
                        game.stage.fillStyle = "#C00";                
                        game.stage.arc((this.y+.5)*w-this.range, (this.x+.5)*w-this.range, this.range*w, 0, Math.PI*2, false);
                        game.stage.fill();
                    game.stage.closePath();
                    game.stage.fillRect(this.y*w, this.x*w, w, w); // remember coordinates are not in pixels --> we have to multiply them with the gutterWidth
                game.stage.restore();
            }
        }
        /**
         * launches a bullet in the creep's direction
         * @param  {Bullet} Bullet type of bullet to be shot - atm there's only the basic Bullet class
         * @param  {Creep}  creep  creep to be targeted
         */
        this.shoot = function(bullet, creep) {
            var bulletList = game.internal.bullets;
            bulletList[bulletList.length] = new bullet(game, creep, this.x, this.y, this.attackPower);
        }
        /**
         * look for enemies within range
         * @param  {Array}  creepList list of all the creeps currently spawned
         * @param  {Number} turret    reference to the itself (the tower object)
         * @return {Array}            list of creeps within range of the tower
         */
        function lookForEnemies(creepList, turret, focus) {
            var creepsInRange = [];

            for (var i = 0; i < creepList.length; i++) { // for every creep... (beginning with the first one!)
                /**
                 * reference to the "i"th creep on the stage
                 * @type {Creep}
                 */
                var creep = creepList[i];

                if (creep.spawned) { // don't calculate for dead/... creeps
                    if (Math.sqrt(Math.pow((creep.x - turret.x),2)+Math.pow((creep.y - turret.y),2)) < turret.range) { // check if distance between the position of the current creep and the turret is less that the turrets range
                        switch(focus) { // it will always shoot the first creep in the array --> make sure the wanted creep is first (keep in mind: it will loop through the creeps beginning with the first one)
                            case "first": // the first one will be the first...
                                creepsInRange.push(creep);
                                break;
                            case "last": // push every item in the first place of the array --> reverted order
                                creepsInRange = [creep].concat(creepsInRange);
                                break;
                            case "weakest":
                                for (var j = 0; j < creepsInRange.length; j++) { // loop through all enemies that are already in the creepsInRange array
                                    if (creep.lives < creepsInRange[j].lives) { // if the creep has less lives than the current creep in the creepsInRange array...
                                        creepsInRange.splice(j,0,creep); // ...add the creep at that position ...
                                        break; // ... and stop looping through (we already added it)
                                    }
                                };
                                creepsInRange.push(creep); // if there are no more creeps in the list to check for (and no one was weaker than the creep we want to add)...
                                break;
                            case "strongest":
                                for (var j = 0; j < creepsInRange.length; j++) { // loop through all enemies that are already in the creepsInRange array
                                    if (creep.lives > creepsInRange[j].lives) { // if the creep has more lives than the current creep in the creepsInRange array...
                                        creepsInRange.splice(j,0,creep); // ...add the creep at that position ...
                                        break; // ... and stop looping through (we already added it)
                                    }
                                };
                                creepsInRange.push(creep); // if there are no more creeps in the list to check for (and no one was weaker than the creep we want to add)...
                                break;
                        }
                    }
                }
            };
            return creepsInRange;
        }
    }
    /**
     * Bullet class
     * @param {Object} game   reference to the game object
     * @param {Object} target should store have a "x" and a "y" value
     * @param {Number} x      x-coordinate to start from
     * @param {Number} y      y-coordinate to start from
     * @param {Number} power  how much damage does it deal
     * @param {Number} speed  how fast does it move
     */
    function Bullet(game, target, x, y, power) {
        /**
         * x-coordinate to start from
         * @type {Number}
         */
        this.x = x;
        /**
         * y-coordinate to start from
         * @type {Number}
         */
        this.y = y;
        /**
         * distance to travel on the x-axis to reach the target
         * @type {Number}
         */
        this.dx = target.x - this.x;
        /**
         * distance to travel on the y-axis to reach the target
         * @type {Number}
         */
        this.dy = target.y - this.y;
        /**
         * distance to travel until the target is reached
         * @type {Number}
         */
        this.distance = Math.sqrt(Math.pow(this.dx,2)+Math.pow(this.dy,2));
        /**
         * how fast does it move
         * @type {Number}
         */
        this.speed = 15;
        /**
         * x value of vector for moving the bullet
         * @type {Number}
         */
        this.vx = this.dx / this.distance * this.speed/w;
        /**
         * y value of vector for moving the bullet
         * @type {Number}
         */
        this.vy = this.dy / this.distance * this.speed/w;
        /**
         * how much damage does it deal
         * @type {Number}
         */
        this.power = power;
        /**
         * width of the bullet
         * @type {Number}
         */
        this.width = w/4; // make it a little bigger than it is rendered, to circumstance difficulties with hitting enemies
        /**
         * height of the bullet
         * @type {Number}
         */
        this.height= this.width;
        /**
         * indicates whether this bullet is still flying/whatever or has already hit an enemy
         * @type {Boolean}
         */
        this.active = true;

        /**
         * calculates bullet's position and checks for collision, etc.
         */
        this.update = function(){
            // move the bullet
            this.x += this.vx;
            this.y += this.vy;
        }
        /**
         * draws the bullet on the stage
         */
        this.render = function(){
            game.stage.save();
                game.stage.fillStyle = "#F00";
                game.stage.fillRect(this.y*w-this.width/2+w/2, this.x*w-this.height/2+w/2, this.width/2, this.height/2); // remember coordinates are not in pixels --> we have to multiply them with the gutterWidth
            game.stage.restore();
        }
        /**
         * function to be called when a creep is hit
         * @param  {[type]} creep creep that is hit
         */
        this.hit = function(creep) {
            creep.lives -= this.power; // reduce the creep's lives
            this.active  = false; // remove the bullet
        }
    }

    //////////
    // API  //
    //////////
    
    /**
     * returns the turret for a given position
     * @param  {Number} x x-coordinate (not in pixels!)
     * @param  {Number} y y-coordinate (not in pixels!)
     * @return {Turret}   turret that is on this position
     */
    this.getTurret = function(x,y) {
        /**
         * shorthand for the turret list
         * @type {Array}
         */
        var turrets = this.internal.turrets;

        for (var i = 0; i < turrets.length; i++) { // loop through all turrets
            if(turrets[i].x == x && turrets[i].y == y) { // and check if coordinates are the same
                return turrets[i]; // if so, return this tower
            }
        };

        return false; // if no turret was found, return false
    }

    /**
     * send in a new wave
     * @param  {Array} creeps information how many of which type of creep to send in (e.g. [[Creep,10],[Creep,5]])
     */
    this.callNewWave = function() {
        /**
         * stores how many of which creeps are sent with the next wave
         * @type {Array}
         */
        var creeps = [];
        // depending on how many waves you have survived, send different kind of waves
        switch(this.internal.waveCount) {
            case 1:
                creeps = [["normal",20]];
                break;
            case 2:
                creeps = [["normal",40], ["fast",10], ["hard",10]];
                break;
            case 3:
                creeps = [["normal",40], ["fast",20], ["hard",20]];
                break;
            case 4:
                creeps = [["hard",40], ["normal",10], ["fast",30], ["hard",20]];
                break;
            default:
                creeps = [["hard",40], ["normal",20], ["fast",20], ["hard",100]];
                break;
        }

        if (!this.internal.wave.active) { // if the current wave is finished...
            this.internal.wave = new Wave(this, creeps); // initiate a new wave
            this.menu.hint("a new wave is being launched");
        }
        else {
            this.menu.hint("shouldn't you get rid of these enemies first?");
        }
    }

    /**
     * places a tower on the given coordinates
     * @param  {String} type type of tower which should be placed
     * @param  {Number} x    x coordinate to place the tower on
     * @param  {Number} y    y coordinate to place the tower on
     * @return {Object}      returns whether it was successful or not (if not, why)
     */
    this.placeTower = function(type, x, y) {
        /**
         * shorthand for the turrets array
         * @type {Array}
         */
        var turrets = this.internal.turrets,
        /**
         * shorthand for the array storing the tiles' type of the map
         * @type {Array}
         */
            tiles = this.map.tiles.input;

        if (tiles[x][y]===1) { // if hovered tile is a wall, we can place a tower there
            /**
             * by default we assume that the tile is occupied
             * @type {Boolean}
             */
            var tileOccupied = false;

            for (var i = 0; i < turrets.length; i++) { // loop through all turrets
                if ((turrets[i].x == x) && (turrets[i].y == y)) { // and check if there already is one with these coordinates
                    tileOccupied = true;
                }
            };

            if (!tileOccupied) { // if you can place a tower on the desired coordinates
                /**
                 * indicates whether enough resources are available
                 * @type {Boolean}
                 */
                var resourcesAvailable = true;

                for (var i = 0; i < this.internal.costs[type].length; i++) {
                    /**
                     * shorthand for the type of resource (e.g. "wood")
                     * @type {String}
                     */
                    var resourceNeeded = this.internal.costs[type][i][0];
                    /**
                     * shorthand for the amount needed of it
                     * @type {Number}
                     */
                    var amountNeeded   = this.internal.costs[type][i][1];

                    if (this.internal.resources[resourceNeeded] < amountNeeded) { // if we don't have enough resources of any type needed, we can't build the tower
                        resourcesAvailable = false;
                    }
                };

                if (resourcesAvailable) {
                    // place the desired tower
                    switch(type) {
                        case "normal":
                            turrets[turrets.length] = new Turret(this, x, y);
                            break;
                        default:
                            turrets[turrets.length] = new Turret(this, x, y);
                            break;
                    }
                    // trigger the selection event
                    $("#game").trigger("select:tower", turrets[turrets.length-1]);

                    // subtract the costs from the resources
                    for (var i = 0; i < this.internal.costs[type].length; i++) {
                        /**
                         * shorthand for the type of resource (e.g. "wood")
                         * @type {String}
                         */
                        var resourceNeeded = this.internal.costs[type][i][0];
                        /**
                         * shorthand for the amount needed of it
                         * @type {Number}
                         */
                        var amountNeeded   = this.internal.costs[type][i][1];

                        this.internal.resources[resourceNeeded] -= amountNeeded;
                    }
                    return {
                        error: 0 // no error
                    }
                }
                else { // if resources are not available
                    return {
                        error: 3 // error 3 means you don't have enough resources
                    }
                }
            }
            else { // if there is already another tower at this position
                return {
                    error: 2 // error 2 means that there's already another tower
                }
            }
        }
        else { // if you try to place a tower on the road
            return {
                error: 1 // error 1 means that you can't build anything on that tile
            }
        }
    }

    //////////
    // MISC //
    //////////

    /**
     * checks whether two (rectangular) objects collide or not (objects must have x, y and width, height properties!)
     * @param  {Object}  a first object
     * @param  {Object}  b second object
     * @return {Boolean}   do they collide or not?
     */
    function collides(a,b) {
        return  a.x*w < b.x*w + b.width &&
                a.x*w + a.width > b.x*w &&
                a.y*w < b.y*w + b.height &&
                a.y*w + a.height > b.y*w;
    }

    this.init(); // initiate the whole game
}

    /**
     * initiate the keyboard library
     * @type {Kibo}
     */
var k     = new Kibo(),
    /**
     * DOM reference to the canvas object
     * @type {Object}
     */
   _game  = document.getElementById("game"),
    /**
     * start the game
     * @type {Game}
     */
    game  = new Game(_game, document, window),
    /**
     * stores mouse position relative to the canvas object
     * @type {Object}
     */
    mouse = {};

///////////////////////////////
// update the mouse position //
///////////////////////////////
$(document).mousemove(function(e){
    mouse.x = e.pageX - _game.offsetLeft;
    mouse.y = e.pageY - _game.offsetTop;
});

///////////////////////////////////////////
// add some keyboard input functionality //
///////////////////////////////////////////
k.up("alt p", function(){
    (game.state==="running") ? game.pause() : game.resume();
}).up("alt c", function(){
    console.log(game.internal.creeps);
});

///////////////////////////////////////////////
// add some settings to be made via the menu //
///////////////////////////////////////////////
$("#highlightPath").on("click",function(){
    game.debug.highlightPath = this.checked; // toggle the highlightPath option
});
$("#showHealthBars").attr("checked","checked").on("click",function(){ // by default make it checked
    game.debug.healthBar = this.checked; // toggle the healthBar option
});

////////////////////
// basic commands //
////////////////////

$("#callNewWave").on("click",function(){
    game.callNewWave();
});

$(_game).on("click",function(){ // when clicking somewhere
    $("#game").trigger("deselect:tower"); // trigger the deselect:tower event
    /**
     * stores the returned information from the placeTower function
     * @type {Object}
     */
    var returned = game.placeTower("normal", game.hoveredTile.y, game.hoveredTile.x);
    switch(returned.error) { // function returns an error object, telling you what happened
        case 0: // no error
            game.menu.hint("placed a tower!"); // signal the user that tower has been placed
            break;
        case 1: // you can't build on this tile
            this.menu.hint("you cannot place a tower here!");
            break;
        case 2: // there is already another tower
            game.menu.hint("selected a tower");
            $("#game").trigger("select:tower", game.getTurret(game.hoveredTile.y, game.hoveredTile.x)); // trigger the select:tower event and pass the selected tower as argument
            break;
        case 3: // you don't have enough resources
            game.menu.hint("you have to gather more resources to build this tower!");
            break;
    }
});

$("#game").bind("select:tower", function(e,turret){ // when selecting a tower...
    game.menu.showTurretMenu(turret); // ...show turret menu 
}).bind("deselect:tower", function(){ // when deselecting a tower...
    game.menu.hideTurretMenu(); // ...hide the menu and...
    for (var i = 0; i < game.internal.turrets.length; i++) { // ...loop through all turrets and...
        game.internal.turrets[i].drawRadius = false; // ...reset the drawRadius setting
    };
})