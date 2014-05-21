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
