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

        if (state === undefined || state === null) {
            state = getInitialState();
        } else {
            state = state.map(function (e) { return +e; });
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
        var dragging = null;

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
        
        // this.toggleShowNumber = function() {
        //     $('.tile-content').toggleClass('tile-content-shownumber');
        // };

        var onArrowKeyup = function(e) {
            var direction = getDirectionForKey(e.keyCode);
            if (direction) {
                var gameState = game.getGameState();
                var move = gameState.getMoveUsingDirection(direction);
                player.play(move);
                event.preventDefault();
            }
        };

        var getDirectionForKey = function(keyCode) {
            var direction = directions[keyCode - 37];
            return direction;
        };

        var getPosition = function($el) {
            return +$el.attr('class').match(/tile-pos-(\d+)/)[1];
        };

        // var onScroll = function(event) {
        //     event.preventDefault();
        // };

        var onDragStart = function(e) {
            var pageX, pageY;

            if (e.type === 'touchstart') {
                pageX = e.originalEvent.touches[0].pageX;
                pageY = e.originalEvent.touches[0].pageY;
            } else {
                pageX = e.pageX;
                pageY = e.pageY;
            }
            e.originalEvent.preventDefault();

            var $el = $(e.target);
            if ($el.is('.tile-content')) {
                var gameState = game.getGameState();
                var possibleMoves = gameState.getPossibleMoves();
                var position = getPosition($el);

                if (possibleMoves.indexOf(position) !== -1) {
                    var $openTile = $('.tile-pos-' + gameState.getOpenTile());
                    var initial = $el.offset();

                    dragging = {
                        element: $el,
                        moved: false,
                        reverse: false,
                        move: position,
                        initial: initial,
                        maximal: $openTile.offset(),
                        offset: {
                            left: pageX - initial.left,
                            top: pageY - initial.top
                        }
                    };
                }
            }
        };

        var onDragMove = function(e) {
            var between = function(x, y, value) {
                var a = Math.min(x, y);
                var b = Math.max(x, y);

                if (value < a) {
                    return a;
                } else if (value > b) {
                    return b;
                } else {
                    return value;
                }
            };

            var isReverseDirection = function(currentX, currentY) {
                var a = Math.abs(currentX - dragging.initial.left); 
                var b = Math.abs(dragging.element.offset().left - dragging.initial.left);
                var c = Math.abs(currentY - dragging.initial.top);
                var d = Math.abs(dragging.element.offset().top - dragging.initial.top);
                // there needs to be at least a move of one pixel in order to be
                // in reverse direction (pixels are not rounded numbers, and other-
                // wise it'll sometimes reverse unwanted.
                return a - b < -1 || c - d < -1;
            };

            if (dragging) {
                var pageX, pageY;

                if (e.type === 'touchmove') {
                    pageX = e.originalEvent.touches[0].pageX;
                    pageY = e.originalEvent.touches[0].pageY;
                } else {
                    pageX = e.pageX;
                    pageY = e.pageY;
                }

                var currentY = between(
                        dragging.initial.top,
                        dragging.maximal.top,
                        pageY - dragging.offset.top);

                var currentX = between(
                        dragging.initial.left,
                        dragging.maximal.left,
                        pageX - dragging.offset.left);

                dragging.moved = true;
                dragging.reverse = isReverseDirection(currentX, currentY);

                dragging.element.offset({
                    top: currentY,
                    left: currentX
                });
            }
        };

        var onDragEnd = function(e) {
            e.originalEvent.preventDefault();

            if (dragging) {
                if (dragging.moved) {
                    dragging.element.css('top', '').css('left','');

                    if (!dragging.reverse) {
                        game.play(dragging.move);
                    }
                } else {
                    // simple click event, always move
                    game.play(dragging.move);
                }

                dragging = null;
            }
        };

        var onSolved = function() {
            console.log('solved!');
        };

        var storeGameState = function() {
            window.localStorage.setItem('slidingpuzzle_gamestate', game.getGameState().state);
        };

        var initializeBindings = function() {
            // bindings to the game
            game.bind('onInit', _this.render);
            game.bind('onMove', _this.render);
            game.bind('onMove', storeGameState);
            game.bind('onSolved', onSolved);

            // bindings to the UI
            $(window)
                .on('keyup', onArrowKeyup);

            $('.container')
                .on('mousedown', onDragStart)
                .on('mouseup', onDragEnd)
                .on('mousemove', onDragMove)
                .on('touchstart', onDragStart)
                .on('touchmove', onDragMove)
                .on('touchend', onDragEnd)
                .on('touchleave', onDragEnd);
        };

        this.setBackground = function(image) {
            var url = "url('" + image + "')";
            var hiddenImg = $('<img>')
                .attr('src', image)
                // .hide()
                .load(function() {
                   $('.tile-content').css('background-image', url);
                   $('.status-image').css('background-image', url);
                   hiddenImg.remove();
                });
            window.localStorage.setItem('slidingpuzzle_background', image);
        };

        var initialize = function() {
            initializeBindings();

            var background = window.localStorage.getItem('slidingpuzzle_background');
            if (background) {
                _this.setBackground(background);
            } else {
                _this.setBackground('fillmurray_1224.jpeg');
            }

            _this.render(game.getGameState());
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
        var gameState = new window.GameState(opt.state);

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

        this.notify('onInit');
    };

    window.Game = Game;
}(window));

// todo: everything below this point needs to be refactored

// storing the gamestate is in the GameUI, but loading occurs here. that feels strange.
var state = window.localStorage.getItem('slidingpuzzle_gamestate');
if (state) {
    state = state.split(',');
}
var game = new window.Game({ state: state });
var player = new window.Player({ game: game });
var gameUI = new window.GameUI({ game: game, player: player });

if (false) {
    gameUI = gameUI;
    player = player;
}

// $('.status-text').fitText();

var instagram = new window.InstagramPopular();


function showPopup() {
    $('.popup').removeClass('hidden');
    $('.popup-backdrop').removeClass('hidden');
}

function hidePopup() {
    $('.popup').addClass('hidden');
    $('.popup-backdrop').addClass('hidden');
}

function setImage() {
    var i = $(this).data('counter');
    gameUI.setBackground(instagram.images[i]);
    hidePopup();
}

// function setPalette() {
//     console.dir(window.ColorTunes.getPalette(this));
// }

$('#btn-change-picture').click(function() {
    showPopup();
});

// function getCrossDomainSource(src) {
//     return src.split('.com/')[0] + '.com/crossdomain.xml';
// }

var promise = instagram.get();
promise.done(function() {
    var div = $('<div class="pictures">');

    for (var i = 0; i < instagram.thumbnails.length; i++) {
        var src = instagram.thumbnails[i];
        var html = $('<img>')
            .data('counter', i)
            .click(setImage)
            // .load(setPalette)
            // .attr('crossOrigin', getCrossDomainSource(src))
            // .attr('crossOrigin', 'anonymous')
            .attr('src', src);

        div.append(html);
    }

    $('.pictures').replaceWith(div);
});


// var randomPlayer = new window.RandomPlayer({ game: game, delay: 200 });
// randomPlayer.play(100);
// randomPlayer.play();
