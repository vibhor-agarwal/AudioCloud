﻿
function AudioPlayer(options) {
    this.$el = $(".main-content");
    this.$player = $(".player");
    this.$playlist = $(".playlist");

    this.fileList = [];

    this.getListItems = function (fileList) {
        var items = [];
        var otherFilesFound = false;
        var self = this;
        var currentCount = 0;
        var cumulCount = this.historySize();
        $.each(fileList, function (i, file) {

            var imageType = /audio.*/;

            if (file.type.match(imageType)) {

                self.fileList.push(file);

                //file control
                var $fileControl = $("<input type='file'></input>");
                $fileControl.data("index", i);
                $fileControl[0].files = fileList;
                $fileControl[0].files = fileList;

                //link control
                var $linkRemove = $("<a href='javascript:void(0);' title='Remove'></a>");
                $linkRemove.off("click").on("click", self.itemDelete);

                //list item
                var $listItem = $("<li title='Play'>");
                $listItem.text(file.name);
                $listItem.off("click").on("click", self.itemClicked);

                $listItem.append($fileControl);
                $listItem.append($linkRemove);
                $listItem.hide();
                items.push($listItem);

                //history
                currentCount = i + 1;
                localStorage.setItem(["history", (cumulCount + currentCount)].join(""), file.name);
            }
            else {
                otherFilesFound = true;
            }
        });

        //history

        this.historySize(this.historySize() + currentCount);

        if (otherFilesFound) {
            setTimeout(function () {
                alert("Non-audio files weren't added to the Playlist.");
            }, 500);
        }
        return items;
    };

    this.dropped = (function (ctx) {
        return function (e) {
            var fileList = e.originalEvent.dataTransfer.files; // FileList object

            var listElements = ctx.getListItems(fileList);

            $(".playlist .list .outer").remove();
            $(".playlist .list").append(listElements);

            $.each(listElements, function (i, x) {
                //$(x).off("click").on("click", this.itemClicked);
                x.show("normal");
            });

            e.originalEvent.preventDefault();
        };

    })(this);

    this.draggedOverOrEntered = (function (ctx) {
        return function (e) {
            e.originalEvent.preventDefault();
        };
    })(this);

    this.deleteAllClicked = (function (ctx) {
        return function (e) {
            var $listItems = $(".playlist .list li");
            $listItems.fadeOut("slow", function () { $(this).remove(); });
        };
    })(this);

    this.itemClicked = (function (ctx) {
        return function (e) {
            $(".overlay").show();
            var $el = $(e.currentTarget);

            //var index = $("input[type='file']", $el).data("index");
            //var fileControl = $("input[type='file']", $el)[0];
            //var fileList = fileControl.files;
            //var file = fileList[index];

            var file = ctx.fileList[$el.index()];

            var fileReader = new FileReader();

            // Closure to capture the file information.
            fileReader.onload = (function (file) {
                return function (e) {
                    var $td = $(".track-details");

                    $(".name", $td).text(file.name);
                    $(".type", $td).text(file.type);
                    $(".size", $td).text([file.size, "bytes"].join(" "));

                    $(".player audio").attr("src", e.target.result);
                    $(".overlay").hide();
                };
            })(file);

            fileReader.readAsDataURL(file);
        };
    })(this);

    this.itemDelete = (function (ctx) {
        return function (e) {
            e.stopPropagation();
            var $el = $(e.currentTarget);

            var index = $el.parents(".playlist .list li").index();
            var fileToDelete = ctx.fileList[index];
            ctx.fileList.splice(index, 1);
            /*ignore jslint start*/
            delete fileToDelete;
            /*ignore jslint end*/

            $el.parent("li:first").fadeOut("normal", function () {
                $(this).remove();
            });
        };
    })(this);

    this.historySize = function (size) {
        if (size) {
            localStorage.setItem("historySize", size);
        }
        else {
            var temp = localStorage.getItem("historySize");
            temp = temp ? parseInt(temp, 10) : 0;
            localStorage.setItem("historySize", temp);
            return temp;
        }
    };

    this.toggleHistoryList = (function (ctx) {
        return function (e) {
            var $el = $(".history", ctx.$playlist);
            $el.empty();
            for (var i = 1; i <= ctx.historySize(); i = i + 1) {
                var key = i;
                var value = localStorage.getItem(["history", i].join(""));

                var $item = $("<li></li>");
                $item.text(value);

                $(".history", ctx.$playlist).append($item);
            }
            $el.slideToggle("slow");
        };
    })(this);

    this.showLocationOnMap = function (position) {
        var mapCanvas = document.getElementById("map-canvas");
        $(mapCanvas).css("height", "500px");
        $(mapCanvas).css("width", "500px");
        var latLon = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        var mapOptions = {
            center: latLon,
            zoom: 8,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        var map = new google.maps.Map(mapCanvas, mapOptions);
        var marker = new google.maps.Marker({ position: latLon, map: map, title: "You are here!" });
    };

    this.$playlist.off("dragover").on("dragover", this.draggedOverOrEntered);

    this.$playlist.off("drop").on("drop", this.dropped);

    $(".icon-deleteAll", this.$playlist).off("click").on("click", this.deleteAllClicked);
    $(".icon-history", this.$playlist).off("click").on("click", this.toggleHistoryList);
}

$(function () {
    var audioPlayer = new AudioPlayer();
    navigator.geolocation.getCurrentPosition(audioPlayer.showLocationOnMap);
    
});