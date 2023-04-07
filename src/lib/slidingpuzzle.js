// game state
// game engine
// input manager
// solver
// random shuffler

// todo: needs a size parameter
(function (exports) {
  var GameState = function (state) {
    var _this = this;
    var directions = {
      top: 0,
      right: 1,
      bottom: 2,
      left: 3,
    };

    var getInitialState = function () {
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
      state = state.map(function (e) {
        return +e;
      });
    }

    this.state = state;
    this.area = state.length;
    this.side = Math.sqrt(this.area);

    this.toString = function () {
      var output = '';

      for (var i = 0; i < this.side; i++) {
        for (var j = 0; j < this.side; j++) {
          var elem = this.state[i * this.side + j];
          var elemoutput = '   ';
          if (elem !== null) {
            elemoutput += elem;
          }

          output += elemoutput.substring(
            elemoutput.length - 3,
            elemoutput.length,
          );
        }
        output += '\n';
      }

      return output;
    };

    this.getOpenTile = function () {
      var index;

      for (var i = 0; i < this.area; i++) {
        if (this.state[i] === -1) {
          index = i;
        }
      }

      return index;
    };

    var getSurroundings = function (tile) {
      var surroundings = [];

      if ((tile % _this.side) - 1 >= 0) {
        surroundings[directions.left] = tile - 1;
      }

      if ((tile % _this.side) + 1 < _this.side) {
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

    this.getPossibleMoves = function () {
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

    this.getMoveUsingDirection = function (direction) {
      var openTile = this.getOpenTile();
      var surroundings = getSurroundings(openTile);

      return surroundings[directions[direction]];
    };

    this.isSolved = function () {
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
})(window);

// todo: Why do we use the Player at all?
(function (exports) {
  var Player = function (options) {
    options = $.extend({}, options);
    var game = options.game;

    this.play = function (move) {
      game.play(move);
    };
  };

  exports.Player = Player;
})(window);

(function (exports, window) {
  var RandomPlayer = function (options) {
    options = $.extend({ delay: 0 }, options);
    var game = options.game;

    var playedMoves = [];
    var deferred;

    var wait = function (fn, args) {
      window.setTimeout(function () {
        fn.call(null, args);
      }, options.delay);
    };

    var getRandomElement = function (elements) {
      return elements[Math.floor(Math.random() * elements.length)];
    };

    var getPrunedMoves = function (possibleMoves) {
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

    var playMove = function () {
      var gameState = game.getGameState();
      var possibleMoves = gameState.getPossibleMoves();
      var prunedMoves = getPrunedMoves(possibleMoves);
      var move = getRandomElement(prunedMoves);
      playedMoves.push(move);

      game.play(move);
    };

    var playMoves = function (numberOfMoves) {
      if (numberOfMoves > 0) {
        playMove();
        wait(playMoves, numberOfMoves - 1);
      } else {
        deferred.resolve();
      }
    };

    this.play = function (numberOfMoves) {
      deferred = new $.Deferred();

      if (numberOfMoves === undefined) {
        numberOfMoves = 1;
      }

      playMoves(numberOfMoves);

      return deferred.promise();
    };
  };

  exports.RandomPlayer = RandomPlayer;
})(window, window);

(function (exports) {
  var SolvingPlayer = function () {
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
})(window);

(function (window, $, RandomPlayer, ColorTunes, Chroma, Logger) {
  var GameUI = function (options) {
    var _this = this;
    var opt = options || {};
    var game = opt.game;
    var player = opt.player;
    var dragging = null;
    var allowUserInput = false;
    var onSolved = opt.onSolved || function () {};

    var directions = ['right', 'bottom', 'left', 'top'];

    var renderTile = function (position, content) {
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

      $('#puzzle ' + selector).attr('class', classes);
    };

    this.render = function (gameState) {
      for (var i = 0; i < gameState.area; i++) {
        renderTile(i, gameState.state[i]);
      }
    };

    var getDirectionForKey = function (keyCode) {
      var direction = directions[keyCode - 37];
      return direction;
    };

    var onArrowKeyup = function (e) {
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

    var getPosition = function ($el) {
      return +$el.attr('class').match(/tile-pos-(\d+)/)[1];
    };

    var onDragStart = function (e) {
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
              top: pageY - initial.top,
            },
          };
        }
      }
    };

    var onDragMove = function (e) {
      if (!allowUserInput) {
        return;
      }

      var between = function (x, y, value) {
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

      var setDraggingReverseDirection = function (currentX, currentY) {
        var a = Math.abs(currentX - dragging.initial.left);
        var b = Math.abs(
          dragging.element.offset().left - dragging.initial.left,
        );
        var c = Math.abs(currentY - dragging.initial.top);
        var d = Math.abs(dragging.element.offset().top - dragging.initial.top);

        // if there is no movement, don't touch dragging.reverse
        if (a - b === 0 && c - d === 0) {
          return;
        }

        // if there is a move of at least one pixel, set
        dragging.reverse = a - b < 0 || c - d < 0;
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
          pageY - dragging.offset.top,
        );

        var currentX = between(
          dragging.initial.left,
          dragging.maximal.left,
          pageX - dragging.offset.left,
        );

        dragging.moved = true;
        setDraggingReverseDirection(currentX, currentY);

        dragging.element.offset({
          top: currentY,
          left: currentX,
        });
      }
    };

    var onDragEnd = function (e) {
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
            .css('left', '')
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

    var storeGameState = function () {
      window.localStorage.setItem(
        'slidingpuzzle_gamestate',
        game.getGameState().state,
      );
    };

    this.shuffle = function () {
      if (!allowUserInput) {
        return;
      }

      allowUserInput = false;

      var randomPlayer = new RandomPlayer({ game: game, delay: 100 });
      randomPlayer.play(50).done(function () {
        allowUserInput = true;
      });
    };

    var onSolvedInternal = function () {
      if (allowUserInput) {
        Logger.log('onSolved');
        onSolved();
      }
    };

    var initializeGameBindings = function () {
      game
        .bind('init', _this.render)
        .bind('move', _this.render)
        .bind('move', storeGameState)
        .bind('solved', onSolvedInternal);
    };

    var initializeInputBindings = function () {
      $(window).on('keyup', onArrowKeyup);

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

    var initializeBindings = function () {
      initializeGameBindings();
      initializeInputBindings();
    };

    this.setBackground = function (image, thumbnail) {
      var url = "url('" + image + "')";
      var hiddenImg = $('<img>')
        .attr('src', image)
        .load(function () {
          $('.tile-content').css('background-image', url);
          $('.status-image').css('background-image', url);
          hiddenImg.remove();
        });

      var hiddenThumbnailImg = $('<img>')
        .attr('crossOrigin', 'Anonymous')
        .attr('src', thumbnail)
        .load(function () {
          var palette = ColorTunes.getPalette(hiddenThumbnailImg[0]);

          var hook = $('body').find('#hook');
          if (!hook.length) {
            hook = $('<div id="hook"></div>')
              .css({
                position: 'fixed',
                bottom: '0',
              })
              .appendTo($('body'));
          }

          var changeClass = function (cls, property, value) {
            var sheet = document.styleSheets[0];
            var selector = '.' + cls;
            var declaration = property + ': ' + value + ';';

            if (sheet.insertRule) {
              sheet.insertRule(
                selector + ' { ' + declaration + ' }',
                sheet.cssRules.length,
              );
            } else {
              sheet.addRule(selector, property);
            }
          };

          var getColor = function (color, transparency) {
            if (transparency) {
              return (
                'rgb(' +
                color[0] +
                ', ' +
                color[1] +
                ', ' +
                color[2] +
                ', ' +
                transparency +
                ')'
              );
            } else {
              return (
                'rgb(' + color[0] + ', ' + color[1] + ', ' + color[2] + ')'
              );
            }
          };

          var palette1 = getColor(palette['bgColor']);
          var palette2 = getColor(palette['fgColor']);
          var palette3 = getColor(palette['fgColor2']);

          changeClass('palette-1-fg', 'color', palette1);
          changeClass('palette-1-bg', 'background-color', palette1);
          changeClass('palette-1-boxshadow', 'box-shadow', '0 3px ' + palette1);
          changeClass(
            'palette-1-bg-a',
            'background-color',
            'rgba(' + new Chroma(palette1).alpha(0.4).rgba() + ')',
          );
          changeClass(
            'palette-1-bg-a2',
            'background-color',
            'rgba(' + new Chroma(palette1).alpha(0.2).rgba() + ')',
          );

          changeClass('palette-2-fg', 'color', palette2);
          changeClass('palette-2-bg', 'background-color', palette2);
          changeClass('palette-2-boxshadow', 'box-shadow', '0 3px ' + palette2);
          changeClass(
            'palette-2-bg-a',
            'background-color',
            'rgba(' + new Chroma(palette2).alpha(0.4).rgba() + ')',
          );
          changeClass(
            'palette-2-bg-a2',
            'background-color',
            'rgba(' + new Chroma(palette2).alpha(0.2).rgba() + ')',
          );

          changeClass('palette-3-fg', 'color', palette3);
          changeClass('palette-3-bg', 'background-color', palette3);
          changeClass('palette-3-boxshadow', 'box-shadow', '0 3px ' + palette3);
          changeClass(
            'palette-3-bg-a',
            'background-color',
            'rgba(' + new Chroma(palette3).alpha(0.4).rgba() + ')',
          );
          changeClass(
            'palette-3-bg-a2',
            'background-color',
            'rgba(' + new Chroma(palette3).alpha(0.2).rgba() + ')',
          );

          hiddenThumbnailImg.remove();
        });

      window.localStorage.setItem('slidingpuzzle_background', image);
      if (thumbnail) {
        window.localStorage.setItem(
          'slidingpuzzle_background_thumbnail',
          thumbnail,
        );
      }
    };

    var initializeBackground = function () {
      var background = window.localStorage.getItem('slidingpuzzle_background');
      var background_thumbnail = window.localStorage.getItem(
        'slidingpuzzle_background_thumbnail',
      );

      if (background) {
        _this.setBackground(background, background_thumbnail);
      } else {
        _this.setBackground(opt.background, opt.background);
      }
    };

    var initialize = function () {
      initializeBindings();
      initializeBackground();

      _this.render(game.getGameState());

      allowUserInput = true;
    };

    initialize();
  };

  window.GameUI = GameUI;
})(
  window,
  jQuery,
  window.RandomPlayer,
  window.ColorTunes,
  window.chroma,
  window.Logger,
);

(function (exports, Events, GameState) {
  var Game = function (options) {
    var _this = this;
    var opt = options || {};
    var gameState = new GameState(opt.state);

    $.extend(this, new Events());

    this.getGameState = function () {
      return new GameState(gameState.state.slice());
    };

    this.play = function (move) {
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

// todo: the problem of first defining all page variables and then being able to
// use them should be solved by changing from a stateMachine to a router
var gameUIPage, solvedPage;

var game = new window.Game({ state: state });
var player = new window.Player({ game: game });
var gameUI = new window.GameUI({
  game: game,
  player: player,
  background: 'assisi.jpeg',
  onSolved: function () {
    // 200ms to let the css animation end
    window.setTimeout(solvedPage.activate, 200);
  },
});

// Instagram
var instagramLibrary = new InstagramLibrary({
  clientId: configuration.clientId,
  redirectUrl: configuration.redirectUrl,
  localStorageNamespace: 'instagram',
});

function addInstagramPictures(instagram, selector) {
  function setImage() {
    var i = $(this).data('counter');

    // use proxy to workaround cors issues
    var thumbnailUrl =
      configuration.proxyUrl + encodeURIComponent(instagram.thumbnails[i]);

    gameUI.setBackground(instagram.images[i], thumbnailUrl);
    gameUIPage.activate();
  }

  var promise = instagram.get();
  promise.done(function () {
    var div = $('<div class="thumbnails">');

    var imageHasLoaded = function () {
      this.removeClass('thumbnail--loading');
    };

    for (var i = 0; i < instagram.thumbnails.length; i++) {
      var src = instagram.thumbnails[i];
      var thumbnail = $('<div />');

      thumbnail
        .addClass('thumbnail')
        .addClass('thumbnail--loading')
        .append(
          $('<img />')
            .addClass('thumbnail__image')
            .data('counter', i)
            .click(setImage)
            .attr('src', src)
            .load($.proxy(imageHasLoaded, thumbnail)),
        )
        .append($('<div >/').addClass('thumbnail__loader'));

      div.append(thumbnail);
    }

    $(selector).replaceWith(div);
  });
}

// Pages
var stateMachine = new window.StateMachine();

var authenticateInstagramPage = new window.Page({
  elementId: 'authenticate',
  stateMachine: stateMachine,
  onInitialize: function () {
    var _this = this;
    $('#authenticate-back').click(_this.deactivate);
    $('#authenticate-allow').click(instagramLibrary.getAuthenticationToken);
  },
});

var instagramPopularPage = new window.Page({
  elementId: 'instagrampopular',
  stateMachine: stateMachine,
  onInitialize: function () {
    var _this = this;
    $('#instagrampopular-back').click(_this.deactivate);
  },
  onFirstActivation: function () {
    var instagram = new window.InstagramPopular({ library: instagramLibrary });
    var selector = '#instagrampopular .pictures';
    addInstagramPictures(instagram, selector);
  },
});

var instagramUserPage = new window.Page({
  elementId: 'instagramuser',
  stateMachine: stateMachine,
  onInitialize: function () {
    var _this = this;
    $('#instagramuser-back').click(_this.deactivate);
  },
  onFirstActivation: function () {
    var instagram = new window.InstagramUser({ library: instagramLibrary });
    var selector = '#instagramuser .pictures';
    addInstagramPictures(instagram, selector);
  },
});

var instagramFeedPage = new window.Page({
  elementId: 'instagramfeed',
  stateMachine: stateMachine,
  onInitialize: function () {
    var _this = this;
    $('#instagramfeed-back').click(_this.deactivate);
  },
  onFirstActivation: function () {
    var instagram = new window.InstagramFeed({ library: instagramLibrary });
    var selector = '#instagramfeed .pictures';
    addInstagramPictures(instagram, selector);
  },
});

var instagramLikedPage = new window.Page({
  elementId: 'instagramliked',
  stateMachine: stateMachine,
  onInitialize: function () {
    var _this = this;
    $('#instagramliked-back').click(_this.deactivate);
  },
  onFirstActivation: function () {
    var instagram = new window.InstagramLiked({ library: instagramLibrary });
    var selector = '#instagramliked .pictures';
    addInstagramPictures(instagram, selector);
  },
});

var backgroundPage = new window.Page({
  elementId: 'background',
  stateMachine: stateMachine,
  onInitialize: function () {
    var _this = this;
    $('#background-back').click(_this.deactivate);
    $('#background-popular').click(instagramPopularPage.activate);
    $('#background-user').click(instagramUserPage.activate);
    $('#background-feed').click(instagramFeedPage.activate);
    $('#background-liked').click(instagramLikedPage.activate);
  },
});

var aboutPage = new window.Page({
  elementId: 'about',
  stateMachine: stateMachine,
  onInitialize: function () {
    var _this = this;
    $('#about-back').click(_this.deactivate);
  },
});

var menuPage = new window.Page({
  elementId: 'menu',
  stateMachine: stateMachine,
  onInitialize: function () {
    var _this = this;
    $('#menu-back').click(_this.deactivate);

    $('#menu-shuffle').click(function () {
      gameUI.shuffle();
      _this.deactivate();
    });

    $('#menu-about').click(aboutPage.activate);

    $('#menu-background').click(function () {
      if (instagramLibrary.isAuthenticated()) {
        backgroundPage.activate();
      } else {
        authenticateInstagramPage.activate();
      }
    });
  },
});

var examplePage = new window.Page({
  elementId: 'example',
  stateMachine: stateMachine,
  onInitialize: function () {
    var _this = this;
    $('#example-back').click(_this.deactivate);
  },
});

gameUIPage = new window.Page({
  elementId: 'puzzle',
  stateMachine: stateMachine,
  onInitialize: function () {
    $('#puzzle-menu').click(function () {
      menuPage.activate();
    });
    $('#puzzle-example').click(function () {
      examplePage.activate();
    });
  },
});

var introductionPage = new window.Page({
  elementId: 'introduction',
  stateMachine: stateMachine,
  onInitialize: function () {
    // simply always deactivate the page whatever action is taken. This makes the gameUIPage
    // become the active one before switching to e.g. the menu.
    var _this = this;

    $('#introduction-menu').click(function () {
      // simply always deactivate the page whatever action is taken. This makes the gameUIPage
      // become the active one before switching to e.g. the menu.
      _this.deactivate();
      menuPage.activate();
    });
    $('#introduction-example').click(function () {
      examplePage.activate();
    });
    $('#introduction-btn').click(function () {
      gameUI.shuffle();
      _this.deactivate();
    });
  },
});

solvedPage = new window.Page({
  elementId: 'solved',
  stateMachine: stateMachine,
  onInitialize: function () {
    var _this = this;

    $('#solved-menu').click(function () {
      // simply always deactivate the page whatever action is taken. This makes the gameUIPage
      // become the active one before switching to e.g. the menu.
      _this.deactivate();
      menuPage.activate();
    });
    $('#solved-example').click(function () {
      examplePage.activate();
    });
    $('#solved-btn').click(function () {
      gameUI.shuffle();
      _this.deactivate();
    });
  },
});

// workaround jshint warnings for now
if (false) {
  solvedPage = solvedPage;
}

// start
gameUIPage.activate();

if (!state) {
  introductionPage.activate();
}

// bind fastclick
$(function () {
  window.FastClick.attach(document.body);
});
