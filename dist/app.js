/*! slidingpuzzle - v0.0.0 - 2014-05-21
* Copyright (c) 2014 ; Licensed  */
window.configuration = {
	debugMode: true,
    clientId: '502ddb21affe4ab3aa2ed53f08c73daa',
    redirectUrl: 'http://localhost:9087',
};
// var instagramLibrary = new InstagramLibrary({
//     clientId: 'c91373d75d7742bab4a678204d416b0c',
//     redirectUrl: 'http://www.slidingpuzzle.org',
//     localStorageNamespace: 'instagram'
// });

(function (exports, configuration) {
    var debug = configuration.debugMode;

    var Logger = {
        log: function(msg) {
            if (debug) {
                console.log(msg);
            }
        },
        dir: function(msg) {
            if (debug) {
                console.dir(msg);
            }
        }
    };

    exports.Logger = Logger;
})(window, window.configuration);

(function (exports) {
    var Events = function () {
        this.events = [];
    };

    Events.fn = Events.prototype;

    Events.fn.bind = function (eventName, handler) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        this.events[eventName].push(handler);
        return this;
    };

    Events.fn.trigger = function (eventName) {
        var handlers = this.events[eventName];
        if (handlers) {
            var args = [].slice.call(arguments, 1);
            for (var i = 0, j = handlers.length; i < j; i++) {
                handlers[i].apply(this, args);
            }
        }
        return this;
    };
    exports.Events = Events;
})(window);

(function (exports, Logger) {
    var StateMachine = function() {
        this.stack = [];
        this.states = [];
    };

    StateMachine.fn = StateMachine.prototype;
    
    StateMachine.fn.add = function(controller) {
        Logger.log('StateMachine add ' + controller.toString());

        var _this = this;
        this.states.push(controller);

        controller.activate = wrap(controller.activate, function() {
            _this.activate(controller);
        });

        controller.deactivate = wrap(controller.deactivate, function() {
            _this.deactivate(controller);
        });
    };

    var wrap = function(fn, wrapper) {
        if (typeof fn !== 'function') {
            fn = function() {};
        }

        wrapper._fn = fn;
        return wrapper;
    };

    StateMachine.fn.activate = function(controller) {
        Logger.log(this.toString() + ' activate ' + controller.toString());

        var current = this.stack.slice(-1)[0];
        if (current === controller) {
            return;
        }

        $(this.states).each(function() {
            if (this !== controller) {
                Logger.log(this.toString() + ' deactivating ' + this.toString());
                this.deactivate._fn();
            }
        });

        $(this.states).each(function() {
            if (this === controller) {
                Logger.log(this.toString() + ' activating ' + this.toString());
                this.activate._fn();
            }
        });

        this.stack.push(controller);
    };

    StateMachine.fn.deactivate = function(controller) {
        Logger.log(this.toString() + ' deactivate ' + controller.toString());

        var current = this.stack.slice(-1)[0];
        var previous = this.stack.slice(-2, -1)[0];

        if (current === controller && previous) {
            this.stack = this.stack.slice(0,-2);
            this.activate(previous);
        }
    };

    StateMachine.fn.toString = function() {
        return '[StateMachine]';
    };

    exports.StateMachine = StateMachine;
})(window, window.Logger);

(function(exports, Logger) {
    var Page = function(options) {
        var _this = this;

        var hasBeenActivated = false;
        var isActive = false;
        var elementId = options.elementId;
        var $element = $('#' + elementId);

        var escapeHandler = function(e) {
            if (e.keyCode === 27) {
                Logger.log(_this.toString() + ' escape pressed');
                _this.deactivate();
                return false;
            }
        };

        this.activate = function() {
            if (!hasBeenActivated && options.onFirstActivation && typeof options.onFirstActivation === 'function') {
                Logger.log(_this.toString() + ' onFirstActivation');

                options.onFirstActivation.apply(_this);
            }

            $(window).on('keyup', escapeHandler);
            hasBeenActivated = true;
            isActive = true;
            $element.removeClass('hidden');
        };

        this.deactivate = function() {
            $(window).off('keyup', escapeHandler);
            isActive = false;
            $element.addClass('hidden');
        };

        this.toString = function() {
            return '[Page #' + elementId + ']';
        };

        var initialize = function() {
            // First add it to the statemachine as that changes the activate/deactivate functions            
            if (options.stateMachine) {
                options.stateMachine.add(_this);
            }

            if (options.onInitialize && typeof options.onInitialize === 'function') {
                Logger.log(_this.toString() + ' onInitialize');
                options.onInitialize.apply(_this); // as otherwise this is the options hash
            }
        };

        initialize();
    };

    exports.Page = Page;
}(window, window.Logger));
(function(exports, Logger) {
    var InstagramLibrary = function(options) {
        var clientId = options.clientId;
        var redirectUrl = options.redirectUrl;
        var accessToken = options.accessToken;
        var localStorageNamespace = options.localStorageNamespace || 'instagram';

        var apiBase = 'https://api.instagram.com/v1/';
        var apiAuthenticationBase = 'https://instagram.com/oauth/authorize/';

        var getAuthenticationUrl = function() {
            var url = [apiAuthenticationBase, 
                '?client_id=',
                encodeURIComponent(clientId),
                '&redirect_uri=',
                encodeURIComponent(redirectUrl),
                '&response_type=token'].join('');

            return url;
        };

        var getEndpointUrl = function(endpoint) {
            var url = [apiBase,
                endpoint,
                '?access_token=',
                accessToken,
                '&callback=?'].join('');

            return url;
        };

        this.getAuthenticationToken = function() {
            var url = getAuthenticationUrl();
            document.location.href = url;
        };

        var parseAuthenticationToken = function() {
            var accessTokenName = localStorageNamespace + '_accessToken';
            accessToken = window.localStorage.getItem(accessTokenName);
            if (accessToken) {
                Logger.log('InstagramLibrary parseAuthenticationToken accessToken found');
            } else {
                var hash = document.location.hash;
                var kv = hash.split('=');
                if (kv.length === 2 && kv[0] === '#access_token') {
                    Logger.log('InstagramLibrary parseAuthenticationToken accessToken found in url');

                    accessToken = kv[1];
                    window.localStorage.setItem(accessTokenName, accessToken);
                } else {
                    Logger.log('InstagramLibrary parseAuthenticationToken accessToken not found');
                }
            }
        };

        this.isAuthenticated = function() {
            return accessToken;
        };

        this.get = function(endpoint) {
            if (!accessToken) {
                this.getAuthenticationToken();
            }

            var url = getEndpointUrl(endpoint);
            var jqxhr = $.getJSON(url);
            return jqxhr;
        };

        parseAuthenticationToken();
    };

    var Instagram = function(options) {
        var _this = this;
        var endpoint = options.endpoint;

        this.images = [];
        this.thumbnails = [];

        this.get = function() {
            var promise = this.library.get(endpoint);
            promise.then(function(data) {
                _this.images = [];
                _this.thumbnails = [];

                for (var i = 0; i < data.data.length; i++) {
                    _this.thumbnails.push(data.data[i].images.thumbnail.url);
                    _this.images.push(data.data[i].images.standard_resolution.url);
                }
            });
            return promise;
        };
    };

    var InstagramPopular = function(options) { this.library = options.library; };
    InstagramPopular.prototype = new Instagram({'endpoint': 'media/popular'});

    var InstagramUser = function(options) { this.library = options.library; };
    InstagramUser.prototype = new Instagram({'endpoint': 'users/self/media/recent'});

    exports.InstagramLibrary = InstagramLibrary;
    exports.InstagramPopular = InstagramPopular;
    exports.InstagramUser = InstagramUser;
}(window, window.Logger));

// game state
// game engine
// input manager
// solver
// random shuffler

// todo: needs a size parameter
(function(exports) {
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

    exports.GameState = GameState;
}(window));


// todo: Why do we use the Player at all?
(function(exports) {
    var Player = function(options) {
        options = $.extend({}, options);
        var game = options.game;

        this.play = function(move) {
            game.play(move);
        };
    };

    exports.Player = Player;
}(window));


(function(exports, window) {
    var RandomPlayer = function(options) {
        options = $.extend({ delay: 0 }, options);
        var game = options.game;

        var playedMoves = [];
        var deferred;

        var wait = function(fn, args) {
            window.setTimeout(function() {
                fn.call(null, args);
            }, options.delay);
        };

        this.play = function(numberOfMoves) {
            deferred = new $.Deferred();

            if (numberOfMoves === undefined) {
                numberOfMoves = 1;
            }

            playMoves(numberOfMoves);

            return deferred.promise();
        };

        var playMoves = function(numberOfMoves) {
            if (numberOfMoves > 0) {
                playMove();
                wait(playMoves, numberOfMoves - 1);
            } else {
                deferred.resolve();
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

    exports.RandomPlayer = RandomPlayer;
}(window, window));


(function(exports) {
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

    exports.SolvingPlayer = SolvingPlayer;
}(window));


(function(window, $, RandomPlayer) {
    var GameUI = function(options) {
        var _this = this;
        var opt = options || {};
        var game = opt.game;
        var player = opt.player;
        var dragging = null;
        var allowUserInput = false;

        var directions = ['right', 'bottom', 'left', 'top'];

        var renderTile = function(position, content) {
            var selector;
            // todo: why do these classes exist both in the css file and in the js?
            var classes = 'tile tile-animated tile-pos-' + position;

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

        var onArrowKeyup = function(e) {
            if (!allowUserInput) {
                return;
            }

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

        var onDragStart = function(e) {
            if (!allowUserInput) {
                return;
            }

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
                    // don't animate movements using css3 animations
                    $el.removeClass('tile-animated');

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
            if (!allowUserInput) {
                return;
            }

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

            // not working properly
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
            if (!allowUserInput) {
                return;
            }

            e.originalEvent.preventDefault();

            if (dragging) {
                if (dragging.moved) {
                    // todo: i'm not sure if dragging.element is a single
                    // tile or all tiles at once.
                    dragging.element
                        .css('top', '')
                        .css('left','')
                        .addClass('tile-animated');

                    if (!dragging.reverse) {
                        player.play(dragging.move);
                    }
                } else {
                    // simple click event, always move
                    player.play(dragging.move);
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

        // this.solve = function() {
        //     if (!allowUserInput) {
        //         return;
        //     }

        //     allowUserInput = false;

        //     var solvingPlayer = new SolvingPlayer();
        //     solvingPlayer
        //         .play()
        //         .done(function() { allowUserInput = true; });

        //     allowUserInput = true;
        // };

        this.shuffle = function() {
            if (!allowUserInput) {
                return;
            }

            allowUserInput = false;

            var randomPlayer = new RandomPlayer({ game: game, delay: 100 });
            randomPlayer
                .play(50)
                .done(function() { allowUserInput = true; });
        };

        var initializeGameBindings = function() {
            game.bind('init', _this.render)
                .bind('move', _this.render)
                .bind('move', storeGameState)
                .bind('solved', onSolved);
        };

        var initializeInputBindings = function() {
            $(window)
                .on('keyup', onArrowKeyup);

            $('.puzzle-content')
                .on('mousedown', onDragStart)
                .on('mouseup', onDragEnd)
                .on('mouseleave', onDragEnd)
                .on('mousemove', onDragMove)
                .on('touchstart', onDragStart)
                .on('touchmove', onDragMove)
                .on('touchend', onDragEnd)
                .on('touchleave', onDragEnd);
        };

        var initializeBindings = function() {
            initializeGameBindings();
            initializeInputBindings();
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
                _this.setBackground(opt.background);
            }

            _this.render(game.getGameState());

            allowUserInput = true;
        };

        initialize();
    };

    window.GameUI = GameUI;
}(window, jQuery, window.RandomPlayer));


(function(exports, Events, GameState) {
    var Game = function(options) {
        var _this = this;
        var opt = options || {};
        var gameState = new GameState(opt.state);

        $.extend(this, new Events());

        this.getGameState = function() {
            return new GameState(gameState.state.slice());
        };

        this.play = function(move) {
            if (gameState.getPossibleMoves().indexOf(+move) !== -1) {
                var open = gameState.getOpenTile();
                var tile = gameState.state[move];

                gameState.state[open] = tile;
                gameState.state[move] = -1;

                this.trigger('move', _this.getGameState());

                if (gameState.isSolved()) {
                    this.trigger('solved', _this.getGameState());
                }
            }
        };

        this.trigger('init', _this.getGameState());
    };

    exports.Game = Game;
})(window, Events, window.GameState);


// todo: everything below this point needs to be refactored
var configuration = window.configuration;

// storing the gamestate is in the GameUI, but loading occurs here. that feels strange.
var state = window.localStorage.getItem('slidingpuzzle_gamestate');
if (state) {
    state = state.split(',');
}
var game = new window.Game({ state: state });
var player = new window.Player({ game: game });
var gameUI = new window.GameUI({
    game: game,
    player: player,
    background: 'assisi.jpeg'
});

// todo: the problem of first defining all page variables and then being able to
// use them should be solved by changing from a stateMachine to a router
var gameUIPage;

// Instagram
var instagramLibrary = new InstagramLibrary({
    clientId: configuration.clientId,
    redirectUrl: configuration.redirectUrl,
    localStorageNamespace: 'instagram'
});

function addInstagramPictures(instagram, selector) {
    function setImage() {
        var i = $(this).data('counter');
        gameUI.setBackground(instagram.images[i]);
        gameUIPage.activate();
    }

    var promise = instagram.get();
    promise.done(function() {
        var div = $('<div class="pictures">');

        for (var i = 0; i < instagram.thumbnails.length; i++) {
            var src = instagram.thumbnails[i];
            var html = $('<img>')
                .data('counter', i)
                .click(setImage)
                .attr('src', src);

            div.append(html);
        }

        $(selector).replaceWith(div);
    });
}

// Pages
var stateMachine = new window.StateMachine();

var authenticateInstagramPage = new window.Page({
    elementId: 'authenticate',
    stateMachine: stateMachine
});

var instagramPopularPage = new window.Page({
    elementId: 'instagrampopular',
    stateMachine: stateMachine,
    onInitialize: function() {
        var _this = this;
        $('#instagrampopular-back').click(_this.deactivate);
    },
    onFirstActivation: function() { 
        var instagram = new window.InstagramPopular({ library: instagramLibrary });
        var selector = '#instagrampopular .pictures';
        addInstagramPictures(instagram, selector);
    }
});


var instagramUserPage = new window.Page({
    elementId: 'instagramuser',
    stateMachine: stateMachine,
    onInitialize: function() {
        var _this = this;
        $('#instagramuser-back').click(_this.deactivate);
    },
    onFirstActivation: function() { 
        var instagram = new window.InstagramUser({ library: instagramLibrary });
        var selector = '#instagramuser .pictures';
        addInstagramPictures(instagram, selector);
    }
});

var backgroundPage = new window.Page({
    elementId: 'background',
    stateMachine: stateMachine,
    onInitialize: function() {
        var _this = this;
        $('#background-back').click(_this.deactivate);
        $('#background-popular').click(instagramPopularPage.activate);
        $('#background-user').click(instagramUserPage.activate);
    }
});

var aboutPage = new window.Page({
    elementId: 'about',
    stateMachine: stateMachine,
    onInitialize: function() {
        var _this = this;
        $('#about-back').click(_this.deactivate);
    }
});

var menuPage = new window.Page({
    elementId: 'menu',
    stateMachine: stateMachine,
    onInitialize: function() {
        var _this = this;
        $('#menu-back').click(_this.deactivate);

        $('#menu-shuffle').click(function() {
            gameUI.shuffle();
            _this.deactivate();
        });

        $('#menu-about').click(aboutPage.activate);

        $('#menu-background').click(function() {
            if (instagramLibrary.isAuthenticated()) {
                backgroundPage.activate();
            } else {
                authenticateInstagramPage.activate();
            }
        });
    }
});

gameUIPage = new window.Page({
    elementId: 'puzzle',
    stateMachine: stateMachine,
    onInitialize: function() {
        $('#puzzle-menu').click(function() {
            menuPage.activate();
        });
    }
});

gameUIPage.activate();

// to skip an error from jsHint
if (false) {
    gameUI = gameUI;
    player = player;
    gameUIPage = gameUIPage;
}



