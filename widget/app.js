(function (angular, buildfire) {
    'use strict';
    //created mediaCenterWidget module
    angular
        .module('mediaCenterWidget', [
            'mediaCenterEnums',
            'mediaCenterWidgetServices',
            'mediaCenterWidgetFilters',
            'mediaCenterWidgetModals',
            'ngAnimate',
            'ngRoute',
            'ui.bootstrap',
            'infinite-scroll',
            "ngSanitize",
            "ngTouch"
        ])
        //injected ngRoute for routing
        //injected ui.bootstrap for angular bootstrap component
        //injected ui.sortable for manual ordering of list
        //ngClipboard to provide copytoclipboard feature
        .config(['$routeProvider', '$httpProvider', '$compileProvider', function ($routeProvider, $httpProvider, $compileProvider) {

            /**
             * To make href urls safe on mobile
             */
            //$compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension|cdvfile):/);
            $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension|cdvfile|file):/);
            /**
             * Disable the pull down refresh
             */
            //buildfire.datastore.disableRefresh();

            $routeProvider
                .when('/', {
                    template: '<div></div>'
                })
                .when('/media/:mediaId', {
                    templateUrl: 'templates/media.html',
                    controllerAs: 'WidgetMedia',
                    controller: 'WidgetMediaCtrl',
                    resolve: {
                        media: ['$q', 'DB', 'AppDB', 'COLLECTIONS', 'Location', '$route', function ($q, DB, AppDB, COLLECTIONS, Location, $route) {

                            var deferred = $q.defer();
                            var GlobalPlaylist = new AppDB();

                            const getGlobalPlaylistItems = (mediaId) => {
                                    GlobalPlaylist.get()
                                    .then(result => {
                                        if (!result.data.playlist) {
                                            // If there is no object, then create the parent object
                                            Location.goToHome();
                                        } else {
                                            let mediaItem = {id: mediaId, data: result.data.playlist[mediaId]};

                                            if (mediaItem) {
                                                deferred.resolve(mediaItem);
                                            } else {
                                                Location.goToHome();
                                            }
                                        }
                                })
                            }
                            if ($route.current.params.mediaId) {
                                getGlobalPlaylistItems($route.current.params.mediaId);
                            }
                            return deferred.promise;
                        }]
                    }
                })
                .when('/media', {
                    templateUrl: 'templates/media.html',
                    controllerAs: 'WidgetMedia',
                    controller: 'WidgetMediaCtrl',
                    resolve: {
                        media: function () {
                            return null;
                        }
                    }
                })
                .when('/nowplaying/:mediaId', {
                    templateUrl: 'templates/layouts/now-playing.html',
                    controllerAs: 'NowPlaying',
                    controller: 'NowPlayingCtrl',
                    resolve: {
                        media: ['$q', 'DB', 'AppDB', 'COLLECTIONS', 'Location', '$route', function ($q, DB, AppDB, COLLECTIONS, Location, $route) {
                            var deferred = $q.defer();
                            var GlobalPlaylist = new AppDB();

                            const getGlobalPlaylistItems = (mediaId) => {
                                    GlobalPlaylist.get()
                                    .then(result => {
                                        if (!result.data.playlist) {
                                            // If there is no object, then create the parent object
                                            Location.goToHome();
                                        } else {
                                            let mediaItem = {id: mediaId, data: result.data.playlist[mediaId]};

                                            if (mediaItem) {
                                                deferred.resolve(mediaItem);
                                            } else {
                                                Location.goToHome();
                                            }
                                        }
                                })
                            }
                            if ($route.current.params.mediaId) {
                                getGlobalPlaylistItems($route.current.params.mediaId);
                            }
                            return deferred.promise;
                        }]
                    }
                })

                .otherwise('/');
            var interceptor = ['$q', function ($q) {
                var counter = 0;

                return {

                    request: function (config) {
                        if (buildfire.spinner)
                            buildfire.spinner.show();
                        //NProgress.start();

                        counter++;
                        return config;
                    },
                    response: function (response) {
                        counter--;
                        buildfire.spinner.hide();
                        return response;
                    },
                    responseError: function (rejection) {
                        counter--;
                        if (counter === 0) {

                            buildfire.spinner.hide();
                        }

                        return $q.reject(rejection);
                    }
                };
            }];

            $httpProvider.interceptors.push(interceptor);

        }])
        .run(['Location', '$location', '$rootScope', 'Messaging', 'EVENTS', 'PATHS', 'DB', 'COLLECTIONS', function (Location, $location, $rootScope, Messaging, EVENTS, PATHS, DB, COLLECTIONS) {
            buildfire.navigation.onBackButtonClick = function () {
                if($rootScope.fullScreen)
                {
                    $rootScope.goingBackFullScreen = true;
                    $rootScope.$digest();
                    return;
                }
                $rootScope.goingBackFullScreen=false;
                $rootScope.goingBack = true;
                var navigate = function () {
                    buildfire.history.pop();
                    console.log($("#feedView").hasClass('notshowing'))
                    if ($("#feedView").hasClass('notshowing')) {
                        Messaging.sendMessageToControl({
                            name: EVENTS.ROUTE_CHANGE,
                            message: {
                                path: PATHS.HOME
                            }
                        });
                        $("#showFeedBtn").click();
                    $rootScope.showGlobalPlaylistButtons = true;
                    if (!$rootScope.$$phase) $rootScope.$digest();
                    } else buildfire.navigation._goBackOne();
                }

                var path = $location.path();
                if (path.indexOf('/media') == 0) {
                    navigate();
                } else if (path.indexOf('/nowplaying') == 0) {
                    if ($rootScope.playlist) {
                        $rootScope.playlist = false;
                        $rootScope.$digest();
                    } else if ($rootScope.skipMediaPage) {
                        navigate();
                    } else {
                        Location.go("#/media/" + path.split("/")[2]);
                    }
                    if (!$rootScope.$$phase) $rootScope.$digest();
                } else if($rootScope.showEmptyState) {
                    angular.element('#emptyState').css('display', 'none');
                    angular.element('#home').css('display', 'block');
                    $rootScope.showGlobalPlaylistButtons = true;
                    $rootScope.showEmptyState = false;
                } else {
                    buildfire.navigation._goBackOne()
                    if (!$rootScope.$$phase) $rootScope.$digest();
                };
            }

            $rootScope.$on('$routeChangeSuccess', () => {
                var path = $location.path();
                if (path.indexOf('/media') == 0 || path.indexOf('/nowplaying') == 0) {
                    $rootScope.showGlobalPlaylistButtons = false;
                } else $rootScope.showGlobalPlaylistButtons = true;

                if (!$rootScope.$$phase) $rootScope.$digest();
              });

            buildfire.device.onAppBackgrounded(function () {
                $rootScope.$emit('deviceLocked', {});
            });
        }]);

})(window.angular, window.buildfire);
