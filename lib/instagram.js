(function(window) {
    var InstagramLibrary = function() {
        var clientId = 'c91373d75d7742bab4a678204d416b0c';
        var redirectUrl = 'http://localhost:8000';
        var apiBase = 'https://api.instagram.com/v1/';
        var apiAuthenticationBase = 'https://instagram.com/oauth/authorize/';
        var accessToken = null;

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

        var getAuthenticationToken = function() {
            var url = getAuthenticationUrl();
            document.location.href = url;
        };

        var parseAuthenticationToken = function() {
            accessToken = window.localStorage.getItem('instagram_accessToken');
            if (!accessToken) {
                var hash = document.location.hash;
                var kv = hash.split('=');
                if (kv.length === 2 && kv[0] === '#access_token') {
                    accessToken = kv[1];
                    window.localStorage.setItem('instagram_accessToken', accessToken);
                }
            }
        };

        this.get = function(endpoint) {
            if (!accessToken) {
                getAuthenticationToken();
            }

            var url = getEndpointUrl(endpoint);
            var jqxhr = $.getJSON(url);
            return jqxhr;
        };

        parseAuthenticationToken();
    };

    var instagram = new InstagramLibrary();

    var InstagramPopular = function() {
        var _this = this;
        var endpoint = 'media/popular';

        this.images = [];
        this.thumbnails = [];

        this.get = function() {
            var promise = instagram.get(endpoint);
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

    var InstagramUser = function() {
        var _this = this;
        var endpoint = 'users/self/media/recent';
        this.images = [];
        this.thumbnails = [];

        this.get = function() {
            var promise = instagram.get(endpoint);
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

    window.InstagramPopular = InstagramPopular;
    window.InstagramUser = InstagramUser;
}(window));
