// game state
// game engine
// input manager
// solver
// random shuffler

// todo: needs a size parameter

(function(window) {
    var GameState = function(state) {
        var getInitialState = function() {
            var size = 4,
                squared = size * size,
                state = [];

            for (var i = 0; i < squared - 1; i++) {
                state.push(i);
            }

            state.push(null);

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

        this.getIndexOfOpenTile = function() {
            var index;

            for (var i = 0; i < this.area; i++) {
                if (this.state[i] === null) {
                    index = i;
                }
            }

            return index;
        };

        this.getPossibleMoves = function() {
            var possibleMoves = [];
            var open = this.getIndexOfOpenTile();

            if (open % this.side - 1 >= 0) {
                possibleMoves.push(open - 1);
            }

            if (open % this.side + 1 < this.side) {
                possibleMoves.push(open + 1);
            }

            if (open - this.side >= 0) {
                possibleMoves.push(open - this.side);
            }

            if (open + this.side < this.area) {
                possibleMoves.push(open + this.side);
            }

            return possibleMoves;
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
    var GameUI = function() {

        var renderTile = function(position, content) {
            var selector;
            var classes = 'tile tile-pos-' + position;

            if (content == null) {
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
            // todo: check if the move is allowed
            var open = gameState.getIndexOfOpenTile();
            var tile = gameState.state[move];

            gameState.state[open] = tile;
            gameState.state[move] = null;

            this.notify('onMove');
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
var gameUI = new window.GameUI();
var game = new window.Game({ events: {
    onMove: [gameUI.render]
}});

var randomPlayer = new window.RandomPlayer({ game: game, delay: 200 });
randomPlayer.play(100);
// randomPlayer.play();
