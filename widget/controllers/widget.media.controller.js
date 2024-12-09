(function (angular, window) {
    angular
        .module('mediaCenterWidget')
        .controller('WidgetMediaCtrl', ['$scope', 'Messaging', 'Buildfire', 'COLLECTIONS', 'media', 'EVENTS', '$timeout', "$sce", "DB", 'AppDB', 'PATHS', '$rootScope','Location', 'VideoJSController',
            function ($scope, Messaging, Buildfire, COLLECTIONS, media, EVENTS, $timeout, $sce, DB, AppDB, PATHS, $rootScope,Location, VideoJSController) {
                var WidgetMedia = this;
                WidgetMedia.mediaType = null;
                WidgetMedia.showSource = false;
                WidgetMedia.loadingVideo = false;
                WidgetMedia.showVideo = false;
                WidgetMedia.emptyBG = '../../../styles/media/holder-16x9.png';

                WidgetMedia.fullScreen = false;
                WidgetMedia.oldVideoStyle={position:"",width:"",height:"",marginTop:""};
                WidgetMedia.oldiFrameStyle={height:""};
                WidgetMedia.oldBackgroundStyle={height:"",color:""};

                var Android = /(android)/i.test(navigator.userAgent);
                if(!buildfire.isWeb() && Android ) {
                    document.onfullscreenchange = function ( event ) {
                        if((document.fullscreenElement && document.fullscreenElement.id && (document.fullscreenElement instanceof HTMLVideoElement))){
                            document.exitFullscreen();
                            WidgetMedia.handeFullScreen();
                        }
                    };
                }

                let MediaCenter = new DB(COLLECTIONS.MediaCenter),
                    GlobalPlaylist = new AppDB();

                WidgetMedia.handeFullScreen = function(){
                        WidgetMedia.fullScreen=!WidgetMedia.fullScreen;
                        $rootScope.fullScreen=WidgetMedia.fullScreen;
                        var video=document.getElementById("myVideo");
                        var backgroundImage=document.getElementById("backgroundImage");
                        if(WidgetMedia.fullScreen){
                                buildfire.appearance.fullScreenMode.enable(null, (err) => {
                                    WidgetMedia.oldVideoStyle.position=video.style.position;
                                    WidgetMedia.oldVideoStyle.width=video.style.width;
                                    WidgetMedia.oldVideoStyle.height=video.style.height;
                                    WidgetMedia.oldVideoStyle.marginTop=video.style.marginTop;
                                    WidgetMedia.oldBackgroundStyle.height=backgroundImage.style.height;
                                    WidgetMedia.oldBackgroundStyle.color=backgroundImage.style.backgroundColor;
                                    video.style.webkitTransform = 'rotate(90deg)';
                                    video.style.mozTransform = 'rotate(90deg)';
                                    video.style.msTransform = 'rotate(90deg)';
                                    video.style.oTransform = 'rotate(90deg)';
                                    video.style.transform = "rotate(90deg)";
                                    video.style.transformOrigin = "bottom left";
                                    video.style.position = "absolute";
                                    video.style.width = "calc(100vw*16/9)";
                                    video.style.height = "100vw";
                                    video.style.marginTop = "calc(-100vw + calc(100vh - calc(100vw * 16 / 9)) / 2)";
                                    backgroundImage.style.height ="100vh";
                                    backgroundImage.style.backgroundColor="black";
                                    if(video.getElementsByTagName('iframe') && video.getElementsByTagName('iframe')[0]){
                                        WidgetMedia.oldiFrameStyle.height=video.getElementsByTagName('iframe')[0].style.height;
                                        video.getElementsByTagName('iframe')[0].style.height="100vw";
                                    }
                            });
                            } else {
                                    buildfire.appearance.fullScreenMode.disable(null, (err) => {
                                    backgroundImage.style.height=WidgetMedia.oldBackgroundStyle.height;
                                    backgroundImage.style.backgroundColor=WidgetMedia.oldBackgroundStyle.color;
                                    video.style.webkitTransform = 'rotate(0deg)';
                                    video.style.mozTransform = 'rotate(0deg)';
                                    video.style.msTransform = 'rotate(0deg)';
                                    video.style.oTransform = 'rotate(0deg)';
                                    video.style.transform = "rotate(0deg)";
                                    video.style.position=WidgetMedia.oldVideoStyle.position;
                                    video.style.width=WidgetMedia.oldVideoStyle.width;
                                    video.style.height=WidgetMedia.oldVideoStyle.height;
                                    video.style.marginTop=WidgetMedia.oldVideoStyle.marginTop;
                                    if(video.getElementsByTagName('iframe') && video.getElementsByTagName('iframe')[0]){
                                        video.getElementsByTagName('iframe')[0].style.height=WidgetMedia.oldiFrameStyle.height;
                                    }
                                });
                            }
                        $scope.$apply();
                }

                WidgetMedia.changeVideoSrc = function () {
                    if (WidgetMedia.item.data.videoUrl){
                        let videoType;
                        let videoUrlToSend=WidgetMedia.item.data.videoUrl;
                        if(videoUrlToSend.includes("www.dropbox")||videoUrlToSend.includes("dl.dropbox.com")){
                            videoUrlToSend=videoUrlToSend.replace("www.dropbox","dl.dropboxusercontent").split("?dl=")[0];
                            videoUrlToSend=videoUrlToSend.replace("dl.dropbox.com","dl.dropboxusercontent.com");
                        }

                        if (videoUrlToSend.includes("youtube.com") || videoUrlToSend.includes("youtu.be")) {
                            videoType = "video/youtube";
                        } else if (videoUrlToSend.includes("vimeo.com")) {
                            videoType = "video/vimeo";
                        } else {
                            videoType = "video/mp4";
                        }

                        WidgetMedia.videoType = videoType;
                    }
                };

                MediaCenter.get().then(function (data) {
                    WidgetMedia.media = {
                        data: data.data
                    };
                    $rootScope.backgroundImage = WidgetMedia.media && WidgetMedia.media.data && WidgetMedia.media.data.design && WidgetMedia.media.data.design.backgroundImage;
                }, function (err) {
                    WidgetMedia.media = {
                        data: {}
                    };
                });

                WidgetMedia.item = {
                    data: {
                        audioUrl: "",
                        body: "",
                        bodyHTML: "",
                        deepLinkUrl: "",
                        image: "",
                        links: [],
                        srcUrl: "",
                        summary: "",
                        title: "",
                        topImage: "",
                        videoUrl: ""
                    }
                };

                if (media) {
                    if (!media.data.videoUrl && !media.data.audioUrl && $rootScope.autoPlay) return setTimeout($rootScope.playNextItem, 1500); // Wait for the page to load before moving

                    WidgetMedia.item = media;
                    WidgetMedia.mediaType = media.data.audioUrl ? 'AUDIO' : (media.data.videoUrl ?  'VIDEO' : null);
                    WidgetMedia.item.srcUrl = media.data.srcUrl ? media.data.srcUrl
                    : (media.data.audioUrl ? media.data.audioUrl : media.data.videoUrl);
                    bookmarks.sync($scope);
                    WidgetMedia.changeVideoSrc();
                    WidgetMedia.iframeSrcUrl = $sce.trustAsUrl(WidgetMedia.item.data.srcUrl);
                }
                else {
                    WidgetMedia.iframeSrcUrl = '';
                }

                /*declare the device width heights*/
                $rootScope.deviceHeight = WidgetMedia.deviceHeight = window.innerHeight;
                $rootScope.deviceWidth = WidgetMedia.deviceWidth = window.innerWidth;

                /*initialize the device width heights*/
                var initDeviceSize = function (callback) {
                    WidgetMedia.deviceHeight = window.innerHeight;
                    WidgetMedia.deviceWidth = window.innerWidth;
                    if (callback) {
                        if (WidgetMedia.deviceWidth == 0 || WidgetMedia.deviceHeight == 0) {
                            setTimeout(function () {
                                initDeviceSize(callback);
                            }, 500);
                        } else {
                            callback();
                            if (!$scope.$$phase && !$scope.$root.$$phase) {
                                $scope.$apply();
                            }
                        }
                    }
                };

                Messaging.onReceivedMessage(function (event) {
                    if (event) {
                        switch (event.name) {
                            case EVENTS.ROUTE_CHANGE:
                                var path = event.message.path,
                                    id = event.message.id;
                                var url = "#/";
                                switch (path) {
                                    case PATHS.MEDIA:
                                        url = url + "media";
                                        if (id) {
                                            url = url + "/" + id;
                                        }
                                        break;
                                    default :

                                        break
                                }
                                Location.go(url);
                                break;
                        }
                    }
                });

                WidgetMedia.onUpdateFn = Buildfire.datastore.onUpdate(function (event) {
                    switch (event.tag) {
                        case COLLECTIONS.MediaContent:
                            if (event.data) {
                                WidgetMedia.item = event;
                                $scope.$digest();
                                // Update item in globalPlaylist
                                if ($rootScope.isInGlobalPlaylist(event.id)) {
                                    if (event.data) {
                                        GlobalPlaylist.insertAndUpdate(event).then(() => {
                                            $rootScope.globalPlaylistItems.playlist[event.id] = event.data;
                                        });
                                    } else {
                                        // If there is no data, it means the the item has been deleted
                                        GlobalPlaylist.delete(event.id).then(() => {
                                            delete $rootScope.globalPlaylistItems.playlist[event.id];
                                        });
                                    }
                                }
                            }
                            break;
                        case COLLECTIONS.MediaCenter:
                            var old = WidgetMedia.media.data.design.itemLayout;
                            WidgetMedia.media = event;
                            $rootScope.backgroundImage = WidgetMedia.media.data.design.backgroundImage;
                            // $rootScope.allowSource = WidgetMedia.media.data.content.allowSource;
                            $rootScope.transferAudioContentToPlayList = false; // WidgetMedia.media.data.content.transferAudioContentToPlayList;
                            $rootScope.forceAutoPlay = false; // WidgetMedia.media.data.content.forceAutoPlay;
                            // $rootScope.skipMediaPage = WidgetMedia.media.data.design.skipMediaPage;

                            $rootScope.autoPlay = typeof WidgetMedia.media.data.content.autoPlay !== 'undefined' ? WidgetMedia.media.data.content.autoPlay : true;
                            $rootScope.autoPlayDelay = typeof WidgetMedia.media.data.content.autoPlayDelay !== 'undefined' ? WidgetMedia.media.data.content.autoPlayDelay : { label: "Off", value: 0 };
                            $rootScope.playAllButton =  typeof WidgetMedia.media.data.content.playAllButton !== 'undefined' ? WidgetMedia.media.data.content.playAllButton : false;
                            // Update Data in media contoller
                            $rootScope.refreshItems();

                            WidgetMedia.media.data.design.itemLayout = event.data.design.itemLayout;
                            if(old == WidgetMedia.media.data.design.itemLayout)WidgetMedia.ApplayUpdates();
                            $scope.$apply();
                            if(old != WidgetMedia.media.data.design.itemLayout)
                            $scope.$$postDigest(function () {
                                WidgetMedia.ApplayUpdates();
                              })
                            break;
                    }
                });

                Buildfire.appData.onUpdate(event => {
                    // Tag name for global playlist
                    const globalPlaylistTag = 'MediaContent' + ($rootScope.user && $rootScope.user._id ? $rootScope.user._id : Buildfire.context.deviceId ? Buildfire.context.deviceId : 'globalPlaylist');
                    if (event) {
                        if (event.tag === "GlobalPlayListSettings") {
                            if (event.data) {
                                $rootScope.globalPlaylistLimit = event.data.globalPlaylistLimit;
                            }
                        } else if (event.tag === globalPlaylistTag) {
                            if (event.data.playlist && event.data.playlist) {
                                $rootScope.globalPlaylistItems.playlist = event.data.playlist;
                            }
                        }
                    }
                });

                WidgetMedia.playAudio = function () {
                    Location.go('#/nowplaying/' + WidgetMedia.item.id, true);
                }

                WidgetMedia.ApplayUpdates = function () {
                    if ($rootScope.skipMediaPage && !WidgetMedia.item.data.videoUrl && WidgetMedia.item.data.audioUrl) {
                        if (WidgetMedia.showVideo) {
                            WidgetMedia.showVideo = false;
                            VideoJSController.pause();
                        }
                        WidgetMedia.playAudio();
                    }  else if ($rootScope.autoPlay && !WidgetMedia.item.data.videoUrl && WidgetMedia.item.data.audioUrl) {
                        if (WidgetMedia.showVideo) {
                            WidgetMedia.showVideo = false;
                            VideoJSController.pause();
                        }
                        WidgetMedia.playAudio()
                    }
                    else if ($rootScope.autoPlay && WidgetMedia.item.data.videoUrl) {
                        WidgetMedia.toggleShowVideo(true);
                    }
                    else if ($rootScope.skipMediaPage && WidgetMedia.item.data.videoUrl) {
                        WidgetMedia.showVideo = true;
                    } else {
                        WidgetMedia.showVideo = false;
                        VideoJSController.pause();
                    }
                };

                WidgetMedia.goToNextItem = () => {
                    $rootScope.playNextItem();
                }

                WidgetMedia.toggleShowVideo = function (showVideo) {
                    WidgetMedia.showVideo = showVideo;
                    if (!$scope.$$phase) {
                        $scope.$apply();
                        $scope.$digest();
                    }
                };

                WidgetMedia.showSourceIframe = function () {
                    var link = WidgetMedia.item.data.srcUrl;
                    if (!/^(?:f|ht)tps?\:\/\//.test(link)) {
                        link = "http://" + link;
                    }
                    Buildfire.navigation.openWindow(link, '_system');
                };

                WidgetMedia.openLinks = function (actionItems) {
                    if (actionItems && actionItems.length) {
                        var options = {};
                        var callback = function (error, result) {
                            if (error) {
                                console.error('Error:', error);
                            }
                        };
                        Buildfire.actionItems.list(actionItems, options, callback);
                    }
                };

                WidgetMedia.executeAction = function (actionItem) {
                    Buildfire.actionItems.execute(actionItem);
                };

                buildfire.auth.onLogin(function (user) {
                    buildfire.spinner.show();
                    bookmarks.sync($scope);
                    $rootScope.user = user;
                    $rootScope.refreshItems();
                });

                buildfire.auth.onLogout(function () {
                    buildfire.spinner.show();
                    bookmarks.sync($scope);
                    $rootScope.user = null;
                    $rootScope.refreshItems();
                });

                WidgetMedia.bookmark = function ($event) {
                    $event.stopImmediatePropagation();
                    var isBookmarked = WidgetMedia.item.data.bookmarked ? true : false;
                    if (isBookmarked) {
                        bookmarks.delete($scope, WidgetMedia.item);
                    } else {
                        bookmarks.add($scope, WidgetMedia.item);
                    }
                };

                WidgetMedia.share = function ($event) {
                    $event.stopImmediatePropagation();

                    var link = {};
                    link.title = WidgetMedia.item.data.title;
                    link.type = "website";
                    link.description = WidgetMedia.item.data.summary ? WidgetMedia.item.data.summary : '';
                    link.data = {
                        "mediaId": WidgetMedia.item.id
                    };

                    buildfire.deeplink.generateUrl(link, function (err, result) {
                        if (err) {
                            console.error(err)
                        } else {
                            buildfire.device.share({
                                subject: link.title,
                                text: link.description,
                                image: link.imageUrl,
                                link: result.url
                            }, function(err, result) {});

                        }
                    });
                };

                WidgetMedia.addNote = function () {
                    var options = {
                        itemId: WidgetMedia.item.id,
                        title: WidgetMedia.item.data.title,
                        imageUrl: WidgetMedia.item.data.topImage
                    };
                    if (WidgetMedia.mediaType === 'VIDEO') {
                        options.timeIndex = VideoJSController.currentTime;
                    }

                    var callback = function (err, data) {
                        if (err) throw err;
                        console.log(data);
                    };

                    buildfire.notes.openDialog(options, callback);
                };

                WidgetMedia.openLink = function (link) {
                    Buildfire.navigation.openWindow(link, '_system');
                };

                WidgetMedia.initVideoPlayer = () => {
                    const videoContainer = document.getElementById('videoContainer');
                    if (!WidgetMedia.item.data.videoUrl || !videoContainer) return;
                    WidgetMedia.loadingVideo = true;
                    WidgetMedia.toggleShowVideo(($rootScope.skipMediaPage || $rootScope.autoPlay) && WidgetMedia.item.data.videoUrl);
                    Buildfire.services.media.audioPlayer.pause();

                    const videoOptions = {
                        item: {
                            ...WidgetMedia.item.data,
                            title: WidgetMedia.item.data.title.replaceAll('"', '&quot;'),
                            id: WidgetMedia.item.id
                        },
                        videoType: WidgetMedia.videoType,
                        startAt: $rootScope.seekTime
                    }

                    VideoJSController.init(videoOptions);

                    VideoJSController.onVideoReady(() => {
                        WidgetMedia.loadingVideo = false;
                        if (!$scope.$$phase) {
                            $scope.$apply();
                            $scope.$digest();
                        }
                    });
                    VideoJSController.onPlayerReady(() => {
                        VideoJSController.onVideoPlayed(() => {
                            Buildfire.services.media.audioPlayer.pause();
                            $scope.videoPlayed = true;
                        });
                        VideoJSController.onVideoPaused(() => {
                            Buildfire.services.media.audioPlayer.pause();
                            $scope.videoPlayed = false;
                        });
                        VideoJSController.onVideoEnded(() => {
                            if ($rootScope.autoPlay) {
                                $rootScope.playNextItem();
                            }
                        });
                    })
                };

              var initializing = true;
                $scope.$watch(function () {
                    return WidgetMedia.item.data.videoUrl;
                }, function () {
                    if (initializing) {
                        $timeout(function () {
                            initializing = false;
                        });
                    } else {
                        WidgetMedia.changeVideoSrc();
                    }
                });
                $scope.$on("$destroy", function () {
                    WidgetMedia.onUpdateFn.clear();
                    if (WidgetMedia && WidgetMedia.clearCountdown) {
                        WidgetMedia.clearCountdown();
                    }
                });

                //Sync with Control section
                Messaging.sendMessageToControl({
                    name: EVENTS.ROUTE_CHANGE,
                    message: {
                        path: PATHS.MEDIA,
                        id: WidgetMedia.item.id || null
                    }
                });

                $rootScope.$watch('goingBackFullScreen', function () {
                    if($rootScope.goingBackFullScreen){
                        $rootScope.fullScreen=false;
                        WidgetMedia.handeFullScreen();
                    }
                });


                $rootScope.$on('deviceLocked', function () {
                    VideoJSController.pause();
                });

            }]);
})(window.angular, window);
