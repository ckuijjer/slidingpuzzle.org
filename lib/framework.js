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