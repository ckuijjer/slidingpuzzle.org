// game state
// game engine
// input manager
// solver
// random shuffler


(function(self) {
    var GameState = function(state) {
        this.state = state;
        this.area = state.length;
        this.side = Math.sqrt(this.area);
    };

    GameState.prototype.toString = function() {
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

    GameState.prototype.getIndexOfOpenTile = function() {
        var index;

        for (var i = 0; i < this.area; i++) {
            if (this.state[i] === null) {
                index = i;
            }
        }

        return index;
    };

    GameState.prototype.getPossibleMoves = function() {
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

    self.GameState = GameState;
}(self));


function getInitialState() {
    var size = 4,
        squared = size * size,
        state = [];

    for (var i = 0; i < squared - 1; i++) {
        state.push(i);
    }

    state.push(null);

    return state;
}

function playMove(gameState, move) {
    var open = gameState.getIndexOfOpenTile();
    var tile = gameState.state[move];

    gameState.state[open] = tile;
    gameState.state[move] = null;
}

function getRandomElement(elements) {
    return elements[Math.floor(Math.random() * elements.length)];
}


function setTile(position, content) {
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
}

function setTiles(gameState) {
    for (var i = 0; i < gameState.area; i++) {
        setTile(i, gameState.state[i]);
    }
}

function getPrunedMoves(moves, playedMoves) {
    var prunedMoves = [];
    var secondLastMove = null;

    if (playedMoves.length >= 2) {
        secondLastMove = playedMoves[playedMoves.length - 2];
    }

    for (var i = 0; i < moves.length; i++) {
        var move = moves[i];

        if (move !== secondLastMove) {
            prunedMoves.push(move);
        }
    }

    return prunedMoves;
}

var steps = 100;
var gameState = new window.GameState(getInitialState());
var delay = 100;

function play(playedMoves) {
    playedMoves = playedMoves || [];

    var possibleMoves = gameState.getPossibleMoves();
    var prunedMoves = getPrunedMoves(possibleMoves, playedMoves);
    var move = getRandomElement(prunedMoves);

    playedMoves.push(move);

    playMove(gameState, move);
    setTiles(gameState);

    if (steps) {
        steps -= 1;
        window.setTimeout(function() { play(playedMoves); }, delay);
    }
}

function toggleShowNumber() {
    $('.tile-content').toggleClass('tile-content-shownumber');

}

if (false) {
    play();
    toggleShowNumber();
}
