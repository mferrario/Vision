// page init
jQuery(function(){
    initInfiniteScroll();
  	initSortSelect();
});

jQuery(window).load(function() {
  	initFixStructure();
});

function initFixStructure() {
    jQuery('form.variants .selector-wrapper').each(function() {
        var label = jQuery(this).find('label').text();
      	if(!label) label = jQuery(this).parent().find('label').text();
        var select = jQuery(this).find('select');
        if(select) {
            select.attr('title', label);
            label = label.replace(/[^a-zA-Z0-9\s]/g,"");
            label = label.toLowerCase();
            label = label.replace(/\s/g,'-');
            select.addClass(label);
            select.parent().addClass(label+'-variants');
        }
    });
}

/*============================*/
/* Update main product image. */
/*============================*/
var switchImage = function(newImageSrc, newImage, mainImageDomEl) {
  // newImageSrc is the path of the new image in the same size as originalImage is sized.
  // newImage is Shopify's object representation of the new image, with various attributes, such as scr, id, position.
  // mainImageDomEl is the passed domElement, which has not yet been manipulated. Let's manipulate it now.
  jQuery(mainImageDomEl).attr('src', newImageSrc);
  jQuery(mainImageDomEl).parents('a').attr('href', newImageSrc);
};

function initSortSelect(){
	var ajaxLoadingArray = [
		{
			holder: '.ajax-holder',
			items: '.ajax-item',
			nextPage: 'a.ajax-next'
		}
	];
	
	jQuery('#collection_tags').each(function(){
		var select = jQuery(this);
		var currentValue = false;
		select.on('change', function(){
			currentValue = this.value;
			refreshAjaxBox();
		});
		jQuery.each(ajaxLoadingArray, function(num, obj){
			jQuery(obj.holder).each(function(){
				var set = jQuery(this);
				var api = set.data('InfiniteLoad');
				if(api){
					api.options.onAfterDraw = function(){
						refreshAjaxBox();
					};
				}
			});
		});
		function refreshAjaxBox(){
			jQuery.each(ajaxLoadingArray, function(num, obj){
				jQuery(obj.holder).each(function(){
					var set = jQuery(this);
					var api = set.data('InfiniteLoad');
					if(api && currentValue){
						var filteringBoxes = api.holder.children();
						if(currentValue != 'all'){
							var boxes = jQuery.grep(api.holder.children(), function(el, n){
								if(jQuery(el).data('product-info').tag && jQuery(el).data('product-info').tag.indexOf(currentValue) != -1){
									return true;
								}
								else {
									return false;
								}
							});
							api.holder.children().addClass('filtering-hidden');
							jQuery(boxes).removeClass('filtering-hidden');
							api.checkPosition();
						}
						else {
							api.holder.children().removeClass('filtering-hidden');
						}
					}
				});
			});
          	if(window.picturefill) window.picturefill();
		};
		refreshAjaxBox(true);
	});
}

function initInfiniteScroll(){
	var ajaxLoadingArray = [
		{
			holder: '.ajax-holder',
			items: '.ajax-item',
			nextPage: 'a.ajax-next'
		}
	];
	for(var i = 0; i < ajaxLoadingArray.length; i++){
		jQuery(ajaxLoadingArray[i].holder).each(function(){
			var set = jQuery(this);
			var nextLink = set.next(ajaxLoadingArray[i].nextPage);
			set.infiniteLoad({
				items: ajaxLoadingArray[i].items,
				domHelperOptions: {
					holderClass: ajaxLoadingArray[i].holder,
					itemsClass: ajaxLoadingArray[i].items,
					nextPageClass: ajaxLoadingArray[i].nextPage
				},
				loadMoreLink: nextLink
			});
			nextLink.on('click touchstart', function(e){ e.preventDefault(); })
		});
	};
};

;(function($){
	function InfiniteLoad(options){
		this.options = jQuery.extend({
			holder: null,
			items: '.items',
			domHelperOptions: false,
			nameSpase: '.InfiniteLoad',
			loadMoreLink: false,
			loadingClass: 'loading-state',
			fullLoadClass: 'full-load'
		}, options);
		this.init();
	};
	InfiniteLoad.prototype = {
		init: function(){
			if(this.options.holder){
				this.findElements();
				this.attachEvents();
			}
		},
		findElements: function(){
			this.holder = jQuery(this.options.holder);
			this.win = jQuery(window);
			if(this.options.loadMoreLink.length){
				this.nextUrl = this.options.loadMoreLink.attr('href')
			}
		},
		attachEvents: function(){
			var self = this;
			jQuery(window).on('scroll'  + this.options.nameSpase + ' resize'  + this.options.nameSpase + ' orientationchange' + this.options.nameSpase + ' load' + this.options.nameSpase, function(){
				self.checkPosition();
			});
		},
		checkPosition: function(){
			var self = this;
			if(this.nextUrl){
				var bottomOffset = this.holder.offset().top + this.holder.outerHeight();
				if(!this.loading && (this.win.scrollTop() + this.win.height() >= bottomOffset || !this.checkSumm())){
					this.loadMore(self.nextUrl).done(function(txt){
						self.drawItems(txt);
					});
					bottomOffset = this.holder.offset().top + this.holder.outerHeight();
				}
			}
		},
		checkSumm: function(){
			var summ = 0;
			this.holder.find(this.options.items).each(function(){
				summ += jQuery(this).outerWidth(true)
			});
			return this.holder.width() < summ;
		},
		drawItems: function(htmlCode){
			var self = this;
			var indexesList = DOMHelper.findBlockCode(htmlCode, this.options.domHelperOptions.holderClass);
			var listHTML = htmlCode.substring(indexesList.start, indexesList.end);
			this.holder.append(jQuery(listHTML).find(this.options.items));
			this.options.loadMoreLink.removeClass(this.options.loadingClass + '-link');
			this.holder.removeClass(this.options.loadingClass);
			/* go to next page */
			var indexesLink = DOMHelper.findBlockCode(htmlCode, this.options.domHelperOptions.nextPageClass);
			if(indexesLink){
				var linkHTML = htmlCode.substring(indexesLink.start, indexesLink.end);
				this.nextUrl = jQuery(linkHTML).attr('href');
				// setTimeout(function(){
					self.loading = false;
					self.checkPosition();
				// }, 1000);
			}
			else {
				this.options.loadMoreLink.addClass(this.options.fullLoadClass + '-link');
				this.holder.addClass(this.options.fullLoadClass);
			}
          	if(window.picturefill) window.picturefill();
			this.makeCallback('onAfterDraw', this);
		},
		loadMore: function(url){
			var d = jQuery.Deferred();
			var self = this;
			if(url){
				this.loading = true;
				this.options.loadMoreLink.addClass(this.options.loadingClass + '-link');
				this.holder.addClass(this.options.loadingClass);
				jQuery.ajax({
					url: url,
					type: 'get',
					data:'ajax=1',
					success: function(txt){
						d.resolve(txt);
					},
					error: function(){
						d.fail();
					}
				})
			}
			return d;
		},
		makeCallback: function(name) {
			if(typeof this.options[name] === 'function') {
				var args = Array.prototype.slice.call(arguments);
				args.shift();
				this.options[name].apply(this, args);
			}
		}
	};
	
	jQuery.fn.infiniteLoad = function(opt){
		return this.each(function(){
			if(!jQuery(this).data('InfiniteLoad')) jQuery(this).data('InfiniteLoad', new InfiniteLoad(jQuery.extend(opt,{holder:this})));
		});
	};
}(window.jQuery));


/*! Hammer.JS - v1.0.5 - 2013-04-07
 * http://eightmedia.github.com/hammer.js
 *
 * Copyright (c) 2013 Jorik Tangelder <j.tangelder@gmail.com>;
 * Licensed under the MIT license */
;(function(t,e){"use strict";function n(){if(!i.READY){i.event.determineEventTypes();for(var t in i.gestures)i.gestures.hasOwnProperty(t)&&i.detection.register(i.gestures[t]);i.event.onTouch(i.DOCUMENT,i.EVENT_MOVE,i.detection.detect),i.event.onTouch(i.DOCUMENT,i.EVENT_END,i.detection.detect),i.READY=!0}}var i=function(t,e){return new i.Instance(t,e||{})};i.defaults={stop_browser_behavior:{userSelect:"none",touchAction:"none",touchCallout:"none",contentZooming:"none",userDrag:"none",tapHighlightColor:"rgba(0,0,0,0)"}},i.HAS_POINTEREVENTS=navigator.pointerEnabled||navigator.msPointerEnabled,i.HAS_TOUCHEVENTS="ontouchstart"in t,i.MOBILE_REGEX=/mobile|tablet|ip(ad|hone|od)|android/i,i.NO_MOUSEEVENTS=i.HAS_TOUCHEVENTS&&navigator.userAgent.match(i.MOBILE_REGEX),i.EVENT_TYPES={},i.DIRECTION_DOWN="down",i.DIRECTION_LEFT="left",i.DIRECTION_UP="up",i.DIRECTION_RIGHT="right",i.POINTER_MOUSE="mouse",i.POINTER_TOUCH="touch",i.POINTER_PEN="pen",i.EVENT_START="start",i.EVENT_MOVE="move",i.EVENT_END="end",i.DOCUMENT=document,i.plugins={},i.READY=!1,i.Instance=function(t,e){var r=this;return n(),this.element=t,this.enabled=!0,this.options=i.utils.extend(i.utils.extend({},i.defaults),e||{}),this.options.stop_browser_behavior&&i.utils.stopDefaultBrowserBehavior(this.element,this.options.stop_browser_behavior),i.event.onTouch(t,i.EVENT_START,function(t){r.enabled&&i.detection.startDetect(r,t)}),this},i.Instance.prototype={on:function(t,e){for(var n=t.split(" "),i=0;n.length>i;i++)this.element.addEventListener(n[i],e,!1);return this},off:function(t,e){for(var n=t.split(" "),i=0;n.length>i;i++)this.element.removeEventListener(n[i],e,!1);return this},trigger:function(t,e){var n=i.DOCUMENT.createEvent("Event");n.initEvent(t,!0,!0),n.gesture=e;var r=this.element;return i.utils.hasParent(e.target,r)&&(r=e.target),r.dispatchEvent(n),this},enable:function(t){return this.enabled=t,this}};var r=null,o=!1,s=!1;i.event={bindDom:function(t,e,n){for(var i=e.split(" "),r=0;i.length>r;r++)t.addEventListener(i[r],n,!1)},onTouch:function(t,e,n){var a=this;this.bindDom(t,i.EVENT_TYPES[e],function(c){var u=c.type.toLowerCase();if(!u.match(/mouse/)||!s){(u.match(/touch/)||u.match(/pointerdown/)||u.match(/mouse/)&&1===c.which)&&(o=!0),u.match(/touch|pointer/)&&(s=!0);var h=0;o&&(i.HAS_POINTEREVENTS&&e!=i.EVENT_END?h=i.PointerEvent.updatePointer(e,c):u.match(/touch/)?h=c.touches.length:s||(h=u.match(/up/)?0:1),h>0&&e==i.EVENT_END?e=i.EVENT_MOVE:h||(e=i.EVENT_END),h||null===r?r=c:c=r,n.call(i.detection,a.collectEventData(t,e,c)),i.HAS_POINTEREVENTS&&e==i.EVENT_END&&(h=i.PointerEvent.updatePointer(e,c))),h||(r=null,o=!1,s=!1,i.PointerEvent.reset())}})},determineEventTypes:function(){var t;t=i.HAS_POINTEREVENTS?i.PointerEvent.getEvents():i.NO_MOUSEEVENTS?["touchstart","touchmove","touchend touchcancel"]:["touchstart mousedown","touchmove mousemove","touchend touchcancel mouseup"],i.EVENT_TYPES[i.EVENT_START]=t[0],i.EVENT_TYPES[i.EVENT_MOVE]=t[1],i.EVENT_TYPES[i.EVENT_END]=t[2]},getTouchList:function(t){return i.HAS_POINTEREVENTS?i.PointerEvent.getTouchList():t.touches?t.touches:[{identifier:1,pageX:t.pageX,pageY:t.pageY,target:t.target}]},collectEventData:function(t,e,n){var r=this.getTouchList(n,e),o=i.POINTER_TOUCH;return(n.type.match(/mouse/)||i.PointerEvent.matchType(i.POINTER_MOUSE,n))&&(o=i.POINTER_MOUSE),{center:i.utils.getCenter(r),timeStamp:(new Date).getTime(),target:n.target,touches:r,eventType:e,pointerType:o,srcEvent:n,preventDefault:function(){this.srcEvent.preventManipulation&&this.srcEvent.preventManipulation(),this.srcEvent.preventDefault&&this.srcEvent.preventDefault()},stopPropagation:function(){this.srcEvent.stopPropagation()},stopDetect:function(){return i.detection.stopDetect()}}}},i.PointerEvent={pointers:{},getTouchList:function(){var t=this,e=[];return Object.keys(t.pointers).sort().forEach(function(n){e.push(t.pointers[n])}),e},updatePointer:function(t,e){return t==i.EVENT_END?this.pointers={}:(e.identifier=e.pointerId,this.pointers[e.pointerId]=e),Object.keys(this.pointers).length},matchType:function(t,e){if(!e.pointerType)return!1;var n={};return n[i.POINTER_MOUSE]=e.pointerType==e.MSPOINTER_TYPE_MOUSE||e.pointerType==i.POINTER_MOUSE,n[i.POINTER_TOUCH]=e.pointerType==e.MSPOINTER_TYPE_TOUCH||e.pointerType==i.POINTER_TOUCH,n[i.POINTER_PEN]=e.pointerType==e.MSPOINTER_TYPE_PEN||e.pointerType==i.POINTER_PEN,n[t]},getEvents:function(){return["pointerdown MSPointerDown","pointermove MSPointerMove","pointerup pointercancel MSPointerUp MSPointerCancel"]},reset:function(){this.pointers={}}},i.utils={extend:function(t,n,i){for(var r in n)t[r]!==e&&i||(t[r]=n[r]);return t},hasParent:function(t,e){for(;t;){if(t==e)return!0;t=t.parentNode}return!1},getCenter:function(t){for(var e=[],n=[],i=0,r=t.length;r>i;i++)e.push(t[i].pageX),n.push(t[i].pageY);return{pageX:(Math.min.apply(Math,e)+Math.max.apply(Math,e))/2,pageY:(Math.min.apply(Math,n)+Math.max.apply(Math,n))/2}},getVelocity:function(t,e,n){return{x:Math.abs(e/t)||0,y:Math.abs(n/t)||0}},getAngle:function(t,e){var n=e.pageY-t.pageY,i=e.pageX-t.pageX;return 180*Math.atan2(n,i)/Math.PI},getDirection:function(t,e){var n=Math.abs(t.pageX-e.pageX),r=Math.abs(t.pageY-e.pageY);return n>=r?t.pageX-e.pageX>0?i.DIRECTION_LEFT:i.DIRECTION_RIGHT:t.pageY-e.pageY>0?i.DIRECTION_UP:i.DIRECTION_DOWN},getDistance:function(t,e){var n=e.pageX-t.pageX,i=e.pageY-t.pageY;return Math.sqrt(n*n+i*i)},getScale:function(t,e){return t.length>=2&&e.length>=2?this.getDistance(e[0],e[1])/this.getDistance(t[0],t[1]):1},getRotation:function(t,e){return t.length>=2&&e.length>=2?this.getAngle(e[1],e[0])-this.getAngle(t[1],t[0]):0},isVertical:function(t){return t==i.DIRECTION_UP||t==i.DIRECTION_DOWN},stopDefaultBrowserBehavior:function(t,e){var n,i=["webkit","khtml","moz","ms","o",""];if(e&&t.style){for(var r=0;i.length>r;r++)for(var o in e)e.hasOwnProperty(o)&&(n=o,i[r]&&(n=i[r]+n.substring(0,1).toUpperCase()+n.substring(1)),t.style[n]=e[o]);"none"==e.userSelect&&(t.onselectstart=function(){return!1})}}},i.detection={gestures:[],current:null,previous:null,stopped:!1,startDetect:function(t,e){this.current||(this.stopped=!1,this.current={inst:t,startEvent:i.utils.extend({},e),lastEvent:!1,name:""},this.detect(e))},detect:function(t){if(this.current&&!this.stopped){t=this.extendEventData(t);for(var e=this.current.inst.options,n=0,r=this.gestures.length;r>n;n++){var o=this.gestures[n];if(!this.stopped&&e[o.name]!==!1&&o.handler.call(o,t,this.current.inst)===!1){this.stopDetect();break}}return this.current&&(this.current.lastEvent=t),t.eventType==i.EVENT_END&&!t.touches.length-1&&this.stopDetect(),t}},stopDetect:function(){this.previous=i.utils.extend({},this.current),this.current=null,this.stopped=!0},extendEventData:function(t){var e=this.current.startEvent;if(e&&(t.touches.length!=e.touches.length||t.touches===e.touches)){e.touches=[];for(var n=0,r=t.touches.length;r>n;n++)e.touches.push(i.utils.extend({},t.touches[n]))}var o=t.timeStamp-e.timeStamp,s=t.center.pageX-e.center.pageX,a=t.center.pageY-e.center.pageY,c=i.utils.getVelocity(o,s,a);return i.utils.extend(t,{deltaTime:o,deltaX:s,deltaY:a,velocityX:c.x,velocityY:c.y,distance:i.utils.getDistance(e.center,t.center),angle:i.utils.getAngle(e.center,t.center),direction:i.utils.getDirection(e.center,t.center),scale:i.utils.getScale(e.touches,t.touches),rotation:i.utils.getRotation(e.touches,t.touches),startEvent:e}),t},register:function(t){var n=t.defaults||{};return n[t.name]===e&&(n[t.name]=!0),i.utils.extend(i.defaults,n,!0),t.index=t.index||1e3,this.gestures.push(t),this.gestures.sort(function(t,e){return t.index<e.index?-1:t.index>e.index?1:0}),this.gestures}},i.gestures=i.gestures||{},i.gestures.Hold={name:"hold",index:10,defaults:{hold_timeout:500,hold_threshold:1},timer:null,handler:function(t,e){switch(t.eventType){case i.EVENT_START:clearTimeout(this.timer),i.detection.current.name=this.name,this.timer=setTimeout(function(){"hold"==i.detection.current.name&&e.trigger("hold",t)},e.options.hold_timeout);break;case i.EVENT_MOVE:t.distance>e.options.hold_threshold&&clearTimeout(this.timer);break;case i.EVENT_END:clearTimeout(this.timer)}}},i.gestures.Tap={name:"tap",index:100,defaults:{tap_max_touchtime:250,tap_max_distance:10,tap_always:!0,doubletap_distance:20,doubletap_interval:300},handler:function(t,e){if(t.eventType==i.EVENT_END){var n=i.detection.previous,r=!1;if(t.deltaTime>e.options.tap_max_touchtime||t.distance>e.options.tap_max_distance)return;n&&"tap"==n.name&&t.timeStamp-n.lastEvent.timeStamp<e.options.doubletap_interval&&t.distance<e.options.doubletap_distance&&(e.trigger("doubletap",t),r=!0),(!r||e.options.tap_always)&&(i.detection.current.name="tap",e.trigger(i.detection.current.name,t))}}},i.gestures.Swipe={name:"swipe",index:40,defaults:{swipe_max_touches:1,swipe_velocity:.7},handler:function(t,e){if(t.eventType==i.EVENT_END){if(e.options.swipe_max_touches>0&&t.touches.length>e.options.swipe_max_touches)return;(t.velocityX>e.options.swipe_velocity||t.velocityY>e.options.swipe_velocity)&&(e.trigger(this.name,t),e.trigger(this.name+t.direction,t))}}},i.gestures.Drag={name:"drag",index:50,defaults:{drag_min_distance:10,drag_max_touches:1,drag_block_horizontal:!1,drag_block_vertical:!1,drag_lock_to_axis:!1,drag_lock_min_distance:25},triggered:!1,handler:function(t,n){if(i.detection.current.name!=this.name&&this.triggered)return n.trigger(this.name+"end",t),this.triggered=!1,e;if(!(n.options.drag_max_touches>0&&t.touches.length>n.options.drag_max_touches))switch(t.eventType){case i.EVENT_START:this.triggered=!1;break;case i.EVENT_MOVE:if(t.distance<n.options.drag_min_distance&&i.detection.current.name!=this.name)return;i.detection.current.name=this.name,(i.detection.current.lastEvent.drag_locked_to_axis||n.options.drag_lock_to_axis&&n.options.drag_lock_min_distance<=t.distance)&&(t.drag_locked_to_axis=!0);var r=i.detection.current.lastEvent.direction;t.drag_locked_to_axis&&r!==t.direction&&(t.direction=i.utils.isVertical(r)?0>t.deltaY?i.DIRECTION_UP:i.DIRECTION_DOWN:0>t.deltaX?i.DIRECTION_LEFT:i.DIRECTION_RIGHT),this.triggered||(n.trigger(this.name+"start",t),this.triggered=!0),n.trigger(this.name,t),n.trigger(this.name+t.direction,t),(n.options.drag_block_vertical&&i.utils.isVertical(t.direction)||n.options.drag_block_horizontal&&!i.utils.isVertical(t.direction))&&t.preventDefault();break;case i.EVENT_END:this.triggered&&n.trigger(this.name+"end",t),this.triggered=!1}}},i.gestures.Transform={name:"transform",index:45,defaults:{transform_min_scale:.01,transform_min_rotation:1,transform_always_block:!1},triggered:!1,handler:function(t,n){if(i.detection.current.name!=this.name&&this.triggered)return n.trigger(this.name+"end",t),this.triggered=!1,e;if(!(2>t.touches.length))switch(n.options.transform_always_block&&t.preventDefault(),t.eventType){case i.EVENT_START:this.triggered=!1;break;case i.EVENT_MOVE:var r=Math.abs(1-t.scale),o=Math.abs(t.rotation);if(n.options.transform_min_scale>r&&n.options.transform_min_rotation>o)return;i.detection.current.name=this.name,this.triggered||(n.trigger(this.name+"start",t),this.triggered=!0),n.trigger(this.name,t),o>n.options.transform_min_rotation&&n.trigger("rotate",t),r>n.options.transform_min_scale&&(n.trigger("pinch",t),n.trigger("pinch"+(1>t.scale?"in":"out"),t));break;case i.EVENT_END:this.triggered&&n.trigger(this.name+"end",t),this.triggered=!1}}},i.gestures.Touch={name:"touch",index:-1/0,defaults:{prevent_default:!1,prevent_mouseevents:!1},handler:function(t,n){return n.options.prevent_mouseevents&&t.pointerType==i.POINTER_MOUSE?(t.stopDetect(),e):(n.options.prevent_default&&t.preventDefault(),t.eventType==i.EVENT_START&&n.trigger(this.name,t),e)}},i.gestures.Release={name:"release",index:1/0,handler:function(t,e){t.eventType==i.EVENT_END&&e.trigger(this.name,t)}},"object"==typeof module&&"object"==typeof module.exports?module.exports=i:(t.Hammer=i,"function"==typeof t.define&&t.define.amd&&t.define("hammer",[],function(){return i}))})(this),function(t,e){"use strict";t!==e&&(Hammer.event.bindDom=function(n,i,r){t(n).on(i,function(t){var n=t.originalEvent||t;n.pageX===e&&(n.pageX=t.pageX,n.pageY=t.pageY),n.target||(n.target=t.target),n.which===e&&(n.which=n.button),n.preventDefault||(n.preventDefault=t.preventDefault),n.stopPropagation||(n.stopPropagation=t.stopPropagation),r.call(this,n)})},Hammer.Instance.prototype.on=function(e,n){return t(this.element).on(e,n)},Hammer.Instance.prototype.off=function(e,n){return t(this.element).off(e,n)},Hammer.Instance.prototype.trigger=function(e,n){var i=t(this.element);return i.has(n.target).length&&(i=t(n.target)),i.trigger({type:e,gesture:n})},t.fn.hammer=function(e){return this.each(function(){var n=t(this),i=n.data("hammer");i?i&&e&&Hammer.utils.extend(i.options,e):n.data("hammer",new Hammer(this,e||{}))})})}(window.jQuery||window.Zepto);
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        /*
 * DOMHelper Class
 */
DOMHelper = {
	// find block start and end indexes
	findBlockCode: function(sourceHTML, blockSelector) {
		// find start tag position
		var tagStartPos = this.findTagBySelector(sourceHTML, blockSelector);
		if(typeof tagStartPos === 'number') {
			// find tag body (end index)
			var tagEndPos = this.findTagBody(sourceHTML, tagStartPos);
			if(typeof tagEndPos === 'number') {
				return {start: tagStartPos, end: tagEndPos};
			}
		}
	},

	// try select header block
	replaceInCode: function(sourceHTML, replaceHTML, blockSelector, callback) {
		// find start tag position
		var tagIndexes = this.findBlockCode(sourceHTML, blockSelector);
		var resultHTML = '', replacedHTML = '';

		if(tagIndexes) {
			replacedHTML = sourceHTML.substring(tagIndexes.start, tagIndexes.end);
			resultHTML = sourceHTML.substr(0,tagIndexes.start) + replaceHTML + sourceHTML.substr(tagIndexes.end);
			// replacing done callback
			if(typeof callback === 'function') {
				callback(resultHTML, replacedHTML);
			}
		} else {
			// nothing found callback
			if(typeof callback === 'function') {
				callback(false);
			}
		}
	},

	// search tag by selector
	findTagBySelector: function(sourceHTML, blockSelector) {
		// parse selector data
		var matchData = blockSelector.match(/(?:(.*)(#|\.)(.*))|(?:(.*))/);
		var tag = matchData[4] || matchData[1];
		var attr = matchData[2];
		var value = matchData[3];
		if(attr) {
			attr = (attr === '.' ? 'class' : 'id');
		}

		// search html code for matching selector
		var searchReg;
		switch(attr) {
			case undefined: searchReg = new RegExp('<'+tag); break;
			case 'id': searchReg = new RegExp('<'+(tag || '')+'.* id="'+value+'".*>'); break;
			case 'class': searchReg = new RegExp('<'+(tag || '')+'.* class=".*'+value+'.*".*>'); break;
		}

		// get first matched element
		var searchData = searchReg.exec(sourceHTML);
		if(searchData) {
			return searchData.index;
		}
	},

	// find tag body
	findTagBody: function(sourceHTML, startIndex) {
		// check for single tag
		var singleTagEnd = sourceHTML.indexOf('/>', startIndex);
		if(singleTagEnd != -1 && singleTagEnd < sourceHTML.indexOf('>', startIndex)) {
			return singleTagEnd + '/>'.length;
		}

		// otherwise check for matching tags
		var codePart = sourceHTML.substr(startIndex);
		var tagData = codePart.match(/<(\w*)( |>)/);
		if(tagData) {
			var tagName = tagData[1], openedCount = 0, closedCount = 0, curPosition = 0;
			var tagStartStr = '<'+tagName, tagEndStr = '/'+tagName+'>';
			var tmpPos1, tmpPos2;

			// skip initial tag
			do {
				tmpPos1 = codePart.indexOf(tagStartStr, curPosition);
				tmpPos2 = codePart.indexOf(tagEndStr, curPosition);

				// check if opening tag exists before closing tag
				if(tmpPos1 != -1 && tmpPos1 < tmpPos2) {
					openedCount++;
					curPosition = tmpPos1 + tagStartStr.length;
				}

				// check for closing tag
				if((tmpPos1 != -1 && tmpPos2 != -1 && tmpPos2 < tmpPos1) || (tmpPos1 < 0 && tmpPos2 != -1))  {
					closedCount++;
					curPosition = tmpPos2 + tagEndStr.length;
				}
			} while(openedCount != closedCount);
			return startIndex + curPosition;
		}
	},

	// text specific functions
	indent: function(code, size) {
		// indent code using tabs
		var codeData = code.split('\n');
		var indentText = '', rebuiltCode = '', indentSize = size || 1;
		indentText = (new Array(indentSize + 1)).join('\t');
		for(i = 0; i < codeData.length; i++) {
			rebuiltCode += indentText + codeData[i] + (i < codeData.length - 1 ? '\n' : '');
		}
		return rebuiltCode;
	},
	unindent: function(code) {
		// remove unneeded lines and unindent code
		var trimmedCode = code.replace(/(^[\s]*[\n])|([\s\n]+$)/gi, '');
		var minIndentSize = /(^\t+)/gi.exec(trimmedCode);
		if(minIndentSize) {
			minIndentSize = minIndentSize[0].length;
			return trimmedCode.replace(new RegExp('(^|[\\n])([\\t]{' + minIndentSize + '})', 'gi'), '$1');
		}
		return code;
	},
	fixCodeIndent: function(code) {
		// fix first XML line indentation and unindent code if possible
		var codeStrings = code.split(code.indexOf('\n') != -1 ? '\n' : '\r'); // handle different OS \r\n
		var lastLine = codeStrings[codeStrings.length - 1];
		var minIndentSize = /(^\t+)/gi.exec(lastLine);
		if(codeStrings.length > 1 && minIndentSize) {
			codeStrings[0] = minIndentSize[0] + codeStrings[0];
			return this.unindent(codeStrings.join('\n'));
		}
		return code;
	}
};