// game state
// game engine
// input manager
// solver
// random shuffler

function SlidingPuzzle() {
    var _this = this;
    var _state = 

    SlidingPuzzle.prototype.isSolved = function() {

    };
}

var GameState = (function() {
    function getSolvedState(size) {
        var square = size * size;
        var state = [];

        for (var i = 0; i < square; i++) {
            state.push(i + 1);
        }

        return state;
    }

    var GameState = function(options) {
        var _size = options.size || 4;
        var _state = options.state || getSolvedState(_size);


        GameState.prototype.toString = function() {

        };

        GameState.prototype.isSolved = function() {
        };
    };

    return GameState;
}());
