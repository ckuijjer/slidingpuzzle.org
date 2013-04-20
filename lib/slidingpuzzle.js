// game state
// game engine
// input manager
// solver
// random shuffler

// todo: needs a size parameter

(function(window) {
    var GameState = function(state) {
        var _this = this;
        var directions = {
            'top': 0,
            'right': 1,
            'bottom': 2,
            'left': 3
        };

        var getInitialState = function() {
            var size = 4,
                squared = size * size,
                state = [];

            for (var i = 0; i < squared - 1; i++) {
                state.push(i);
            }

            state.push(-1);

            return state;
        };

        if (state === undefined) {
            state = getInitialState();
        }

        this.state = state;
        this.area = state.length;
        this.side = Math.sqrt(this.area);

        this.toString = function() {
            var output = '';

            for (var i = 0; i < this.side; i++) {
                for (var j = 0; j < this.side; j++) {
                    var elem = this.state[i * this.side + j];
                    var elemoutput = '   ';
                    if (elem !== null) {
                        elemoutput += elem;
                    }

                    output += elemoutput.substring(elemoutput.length - 3, elemoutput.length);
                }
                output += '\n';
            }

            return output;
        };

        this.getOpenTile = function() {
            var index;

            for (var i = 0; i < this.area; i++) {
                if (this.state[i] === -1) {
                    index = i;
                }
            }

            return index;
        };

        var getSurroundings = function(tile) {
            var surroundings = [];

            if (tile % _this.side - 1 >= 0) {
                surroundings[directions.left] = tile - 1;
            }

            if (tile % _this.side + 1 < _this.side) {
                surroundings[directions.right] = tile + 1;
            }

            if (tile - _this.side >= 0) {
                surroundings[directions.top] = tile - _this.side;
            }

            if (tile + _this.side < _this.area) {
                surroundings[directions.bottom] = tile + _this.side;
            }

            return surroundings;
        };

        this.getPossibleMoves = function() {
            var openTile = _this.getOpenTile();
            var surroundings = getSurroundings(openTile);
            var possibleMoves = [];

            for (var i = 0; i < surroundings.length; i++) {
                var tile = surroundings[i];
                if (tile !== undefined) {
                    possibleMoves.push(tile);
                }
            }

            return possibleMoves;
        };

        this.getMoveUsingDirection = function(direction) {
            var openTile = this.getOpenTile();
            var surroundings = getSurroundings(openTile);

            return surroundings[directions[direction]];
        };

        this.isSolved = function() {
            var solvedGameState = new GameState();

            if (this.area !== solvedGameState.area) {
                return false;
            }

            for (var i = 0; i < this.area; i++) {
                if (this.state[i] !== solvedGameState.state[i]) {
                    return false;
                }
            }

            return true;
        };
    };

    window.GameState = GameState;
}(window));


(function(window) {
    var Player = function(options) {
        var opt = options || {};
        var game = opt.game;

        this.play = function(move) {
            game.play(move);
        };
    };

    window.Player = Player;
}(window));


(function(window) {
    var RandomPlayer = function(options) {
        var _this = this;

        var opt = options || {};
        var game = opt.game;
        var delay = opt.delay || 0;
        var playedMoves = [];

        var wait = function(fn, args) {
            window.setTimeout(function() {
                fn.call(null, args);
            }, delay);
        };

        this.play = function(numberOfMoves) {
            if (numberOfMoves === undefined) {
                numberOfMoves = 1;
            }
            if (numberOfMoves > 0) {
                playMove();
                wait(_this.play, numberOfMoves - 1);
            }
        };

        var playMove = function() {
            var gameState = game.getGameState();
            var possibleMoves = gameState.getPossibleMoves();
            var prunedMoves = getPrunedMoves(possibleMoves);
            var move = getRandomElement(prunedMoves);
            playedMoves.push(move);

            game.play(move);
        };

        var getRandomElement = function(elements) {
            return elements[Math.floor(Math.random() * elements.length)];
        };

        var getPrunedMoves = function(possibleMoves) {
            var prunedMoves = [];
            var secondLastMove = null;

            if (playedMoves.length >= 2) {
                secondLastMove = playedMoves[playedMoves.length - 2];
            }

            for (var i = 0; i < possibleMoves.length; i++) {
                var move = possibleMoves[i];

                if (move !== secondLastMove) {
                    prunedMoves.push(move);
                }
            }

            return prunedMoves;
        };
    };

    window.RandomPlayer = RandomPlayer;
}(window));


(function(window) {
    var SolvingPlayer = function() {
        // var misplacedTilesHeuristic = function(gameState) {
        //     var solvedGameState = new window.GameState();
        //     var misplaced = 0;

        //     for (var i = 0; i < gameState.area; i++) {
        //         if (gameState.state[i] !== solvedGameState[i]) {
        //             misplaced += 1;
        //         }
        //     }

        //     return misplaced;
        // };
    };

    window.SolvingPlayer = SolvingPlayer;
}(window));


(function(window, $) {
    var GameUI = function(options) {
        var _this = this;
        var opt = options || {};
        var game = opt.game;
        var player = opt.player;

        // todo: left action is right arrow
        var directions = ['right', 'bottom', 'left', 'top'];

        var renderTile = function(position, content) {
            var selector;
            var classes = 'tile tile-pos-' + position;

            if (content === -1) {
                selector = '.tile-content-empty';
                classes += ' tile-content-empty';
            } else {
                selector = '.tile-content-' + content;
                classes += ' tile-content tile-content-' + content;
            }

            $(selector).attr('class', classes);
        };

        this.render = function(gameState) {
            for (var i = 0; i < gameState.area; i++) {
                renderTile(i, gameState.state[i]);
            }
        };
        
        this.toggleShowNumber = function() {
            $('.tile-content').toggleClass('tile-content-shownumber');
        };

        var onArrowKeyup = function(event) {
            var direction = getDirection(event.keyCode);
            if (direction) {
                var gameState = game.getGameState();
                var move = gameState.getMoveUsingDirection(direction);
                player.play(move);
                event.preventDefault();
            }
        };

        var getDirection = function(keyCode) {
            var direction = directions[keyCode - 37];
            return direction;
        };

        var onTileClick = function() {
            var position = $(this).attr('class').match(/tile-pos-(\d+)/)[1];
            player.play(position);
        };

        var onScroll = function(event) {
            console.dir(event);
            event.preventDefault();
        };

        var initializeBindings = function() {
            game.bind('onMove', _this.render);
            game.bind('onSolved', function() { console.log('solved!'); });
            $(window).keyup(onArrowKeyup);
            $(window).scroll(onScroll);
            $(window).bind('touchmove', onScroll);
            $('.tile').click(onTileClick);
        };

        var setBackground = function(image) {
            var url = "url('" + image + "')";
           $('.tile-content').css('background-image', url);
        };

        var initialize = function() {
            initializeBindings();
            setBackground('fillmurray_1224.jpeg');
        };
        
        initialize();
    };

    window.GameUI = GameUI;
}(window, jQuery));


(function() {
    var Game = function(options) {
        var _this = this;
        var opt = options || {};
        var events = opt.events || {};
        var gameState = new window.GameState();

        this.getGameState = function() {
            // todo: this should be a deep clone
            return gameState;
        };

        this.play = function(move) {
            if (gameState.getPossibleMoves().indexOf(+move) !== -1) {
                var open = gameState.getOpenTile();
                var tile = gameState.state[move];

                gameState.state[open] = tile;
                gameState.state[move] = -1;

                this.notify('onMove');

                if (gameState.isSolved()) {
                    this.notify('onSolved');
                }
            }
        };

        this.bind = function(eventName, handler) {
            if (!(eventName in events)) {
                events[eventName] = [];
            }
            var handlers = events[eventName];
            handlers.push(handler);
        };

        this.notify = function(eventName) {
            if (eventName in events) {
                var handlers = events[eventName];
                for (var i = 0; i < handlers.length; i++) {
                    var handler = handlers[i];
                    handler.call(null, _this.getGameState());
                }
            }
        };
    };

    window.Game = Game;
}(window));

// Start a new game and make 100 random moves
var game = new window.Game();
var player = new window.Player({ game: game });
var gameUI = new window.GameUI({ game: game, player: player });

if (false) {
    gameUI = gameUI;
    player = player;
}

// var randomPlayer = new window.RandomPlayer({ game: game, delay: 200 });
// randomPlayer.play(100);
// randomPlayer.play();
