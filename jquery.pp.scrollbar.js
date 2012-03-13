



/*SCROLLBAR*/
+function(handler){ this[handler] = (function() {

	var eventName = '.pp',
	
		thumbSizeRatio = 3,	/* scrollbar width * ratio = scrollbar minimum height */
	
		// used by thumb drag
		scrollArea = null,
		barOffset = null,		/* scroll bar offset from top */
		areaRange = 0,			/* scroll area range  0..areaRange */
		startY = 0,				/* pos inside thumb where dragging started  */
		maxY = 0,				/* scroll bar maxY for thumb, thumb's css top position's range accordingly is startY..maxY */
		
		thumbY = 0,
		
		// used by bubbling
		bubblingTimer = null,	/* setTimeout timer when holding mouse button down on scrollbar */
		bubblingCounter = 0,	/* bubbling counter, first delay is longer */
		bubble = true,			/* stupid flag */
		
		verticalProperties = {
			thumbSelector : 'pp-scroll-thumb-v',
			barSelector : 'pp-scroll-bar-v',
			coverSelector : 'pp-scroll-cover-v'
		},
		
		// to use same routines for horizontal bar we just switch the properties
		horizontalProperties = {
			thumbSelector : 'pp-scroll-thumb-h',
			barSelector : 'pp-scroll-bar-h',
			coverSelector : 'pp-scroll-cover-h'
		};

	function constructor() {
		$.extend(verticalProperties, jQuery.pp.verticalProperties);
		$.extend(horizontalProperties, jQuery.pp.verticalProperties);
	}

	function systemScrollbarWidth() {
		// system scrollbar width
		if ( typeof systemScrollbarWidth.width !== 'undefined' ) {
			return systemScrollbarWidth.width;
		}
		systemScrollbarWidth.width = 0;
		if ( !jQuery.pp.supportsTouches ) {
			var m = $('<div style="visibility:hidden;overflow-y:scroll;">blaah</div>').appendTo('body');
			systemScrollbarWidth.width = m.prop('offsetWidth') - m.prop('clientWidth');
			m.remove();
		}
		return systemScrollbarWidth.width;
	}

	function sumCSSProps(jQobj, props) {
		var r = 0, v = 0;
		$.each(props, function(key,value){
			v = parseInt(jQobj.css(value), 10);
			r += isNaN(v) ? 0 : v;
		});
		return r;
	}
	
	function getPageScrollAmount(x)  {
		/*
			perfectly reverse engineered :-)
			
			- every browser does it differently
			- DEFAULT and most used is 12,5% e.g. by scrolling to next/prev page not full viewport height is being scrolled, but 12,5% less
			- Firefox calculates this by pixel: 16px in OSX, 19px in Win.			
			- Opera, dumb fuck, does not reduce anything			
			- And the most clever is Safari in OSX (not in Windows!) amount is MIN(12,5% less or 40px)
		*/
		if ( $.browser.webkit ) {
			if ( /mac/.test(navigator.userAgent.toLowerCase()) ) {
				// safari on osx
				return x - Math.min(40, x * 0.125);
			} else {
				return x * 0.875;
			}
		} else if ( $.browser.mozilla ) {
			if ( /mac/.test(navigator.userAgent.toLowerCase()) ) {
				// osx
				return x - 16;
			} else {
				return x - 18;
			}
		} else if ( window.opera ) {
			return x;
		} else {
			return x * 0.875;
		}
	}

	function getBubblingDelay() {
	
		/* 
			reverse engineered

			delay for the first bubble is longer

			PS! it's not that precise try to time native bubbling effects with javascript,
			anybody want's to dig in and adjust those values for better?
			
		*/
		var b = $.browser;
		if ( b.webkit ) {
			return bubblingCounter == 1 ? 500 : 50;
		} else if ( b.mozilla ) {
			return bubblingCounter == 1 ? 125 : 25;
		} else if ( window.opera ) {
			return bubblingCounter == 1 ? 350 : 150;
		} else {
			return bubblingCounter == 1 ? 125 : 15;
		}

	}

	// One of the key princiles: thumb moves ONLY by listening scrollarea scroll events, we NEVER move thumb by ourselves.
	function setThumbPos(p, s, b, t) { // props, scrollarea, bar, thumb
		/*
			thumb top min = always 0, max = scrollbar inner height - thumb height
			percent of scrolled =  scrolltop / (scrollHeight - scrollAreaHeight)						
			correct pos = (max - min) * percent
		*/

		t.css(p.top, Math.round(
			(b[p.height]() - t[p.height]()) / (s.prop(p.scrollHeight) - (s.prop(p.clientHeight))) * s[p.scrollTop]() 
		));
		
	}
	
	function scrollByPage(event, p, s, t) { // event, props, scrollarea, thumb
		var h = getPageScrollAmount( s.prop(p.clientHeight) ),
			o = t.offset(),
			y = -1;
		if ( event[p.pageY] < o[p.top] ) {
			y = Math.max(0, s[p.scrollTop]() - h);
		} else if (event[p.pageY] > (o[p.top] + t[p.height]())) {
			y = Math.min(s[p.scrollTop]() + h, s.prop(p.scrollHeight));
		}
		
		if ( y > -1 ) {	
			( bubble ) && s[p.scrollTop](y);
			bubblingCounter++;	
			bubblingTimer = setTimeout( function() {
				// smoothness..smoothness..
				setTimeout(function() { scrollByPage(event, p, s, t); }, 0);
			}, getBubblingDelay() );
		}
	}

	function startPagingBubbling(event, p, s, t) {// event, props, scrollarea, thumb
		$(document).bind('mousemove' + eventName, {thumb: t, props: p}, bubbleDrag).bind('mouseup' + eventName, bubbleUp);
		bubble = true;
		// break out this thread, helps IE a bit
		setTimeout(function() { scrollByPage(event, p, s, t); }, 0);
		// add bubbling pagination handlers
	}

	function bubbleDrag(event) {		
		var t =	event.data.thumb;
		var p =	event.data.props;
		var left = t.offset()[p.left];
		// if user drags outside of the scrollbar stop bubbling temporarily (cancel only with mouseup event), 
		// so if you drag back on bar, bubbling continues
		bubble = ( event[p.pageX] < left || event[p.pageX] > (left + t[p.width]()) )  ? false : true;
	}
	
	function bubbleUp(event) {
		$(document).unbind(eventName);
		//$(document).unbind('mousemove', bubbleDrag).unbind('mouseup', bubbleUp);
		bubble = false;
		bubblingCounter = 0;
		if ( bubblingTimer ) {
			clearTimeout( bubblingTimer );
			bubblingTimer = null;
		}	
	}

	function thumbDown(event, p, container) { // event, props, container
		event.preventDefault();
		event.stopPropagation();
		event = jQuery.pp.normEvent(event);
		$(document).bind(jQuery.pp.moveEvent + eventName, {props: p}, thumbDrag).bind(jQuery.pp.upEndEvent + eventName, thumbUp).bind('touchcancel' + eventName, thumbUp);

		scrollArea = container.find("div.pp-scroll-area");
		var thumb = container.find("div." + p.thumbSelector);		
		var bar = container.find("div." + p.barSelector);		

		startY = event[p.pageY] - thumb.offset()[p.top];
		maxY = startY + bar[p.height]() - thumb[p.height]();
		areaRange = scrollArea.prop(p.scrollHeight) - scrollArea.prop(p.clientHeight);
		barOffset = bar.offset()[p.top] + parseInt(bar.css(p.paddingTop), 10);

		return false;
	}

	function thumbDrag(event) {
		var p =	event.data.props;

		event.preventDefault();
		event.stopPropagation();
		event = jQuery.pp.normEvent(event);

		var sY = event[p.pageY] - barOffset;
		var minY = startY;
		
		var scrollTop = 0; // zero if < minY
		if ( sY > maxY ) {
			scrollTop = areaRange; // max
		} else if ( sY >= minY ) {
			scrollTop = (sY - minY) / (maxY - minY) * areaRange;
		}
		// thumb dragging scrolls scrollarea and scroll events move thumb
		scrollArea[p.scrollTop](scrollTop);
		return true;
	}

	function thumbUp(event) {
		$(document).unbind(eventName);
	}
	
	function barNeeded(p, jObj) { // props, object
		return jObj.prop(p.clientHeight) < jObj.prop(p.scrollHeight);
	}

	// how much space sroll bar takes away from the content
	function scrollBarSpace(p, c, s) { // props, container, scrollarea
		if ( barNeeded(p, s) ) { // if something to scroll, show bar
		//if ( s.prop(p.clientHeight) < s.prop(p.scrollHeight) ) { // if something to scroll, show bar
			var b = c.find("div." + p.barSelector);
			b.show();
			//  = bar clientwidth + bar css right pos (default is 0) + bar margins
			var x =  b.prop(p.clientWidth) + parseInt(b.css(p.right), 10) + sumCSSProps(b,[p.marginLeft, p.marginRight]);
			return b.prop(p.clientWidth) + parseInt(b.css(p.right), 10) + sumCSSProps(b,[p.marginLeft, p.marginRight]);
		}
		return 0;
	}

	function scrollBarSpaces(w, c, s) { // what, container, scrollarea
		var V = ('h' != w) ? scrollBarSpace(verticalProperties, c, s) : 0;
		var H = ('v' != w) ? scrollBarSpace(horizontalProperties, c, s) : 0;
		return {v: V, h: H};
	}
	
	function change(p, c, s, mySpace, otherSpace, setHeight) { // props, container, scrollarea, scrollbarspace

		var b = c.find("div." + p.barSelector);
		var t = c.find("div." + p.thumbSelector);

		( mySpace > 0 ) ? b.show() : b.hide();
		
		// 2. scrollarea
		s.css(p.overflowY, 'scroll').css(p.width, c[p.width]() + systemScrollbarWidth() - mySpace).css(p.paddingRight, parseInt(c.css(p.paddingRight), 10) + mySpace);
		if ( setHeight )
			s.css(p.height, c[p.height]());

		// 3. scrollbar height
		b[p.height]( c.prop(p.clientHeight) - otherSpace - sumCSSProps(b, [p.paddingTop, p.paddingBottom, p.borderTopWidth, p.borderBottomWidth, p.marginTop, p.marginBottom]) );

		// 4. thumb height
		t[p.height](Math.max(thumbSizeRatio * t[p.width](), Math.round(s.prop(p.clientHeight) / s.prop(p.scrollHeight) * b[p.height]())));								

		setThumbPos(p, s, b, t);
		
	}

	function onChange(w, c, s) { // what, container, scrollarea
		var sbspaces = scrollBarSpaces(w, c, s);
		// last argument - if only one bar, set both - width & height on scrollarea, but when both do only one
		( 'h' != w ) && change(verticalProperties, c, s, sbspaces.v, sbspaces.h, 'b' == w ? false : true);
		( 'v' != w ) && change(horizontalProperties, c, s, sbspaces.h, sbspaces.v, 'b' == w ? false : true);
	}

	function addScrollBar(p, container, c, s, settings, scrollWindowStyle, w) { // props, container, $(container), scrollarea
		// add more markup		
		c.append('<div class="'+p.barSelector+' pp-scroll-bar" style="position:absolute;'+p.top+':0px;overflow:hidden;"><div class="'+p.thumbSelector+' pp-scroll-thumb" style="position:relative;margin:0;padding:0;border:0;overflow:hidden;left:0px;top:0px;"></div></div>');

		// pointers
		var t = container.find("div." + p.thumbSelector);
		var b = container.find("div." + p.barSelector);


		// bar
		var bw = settings.thumbWidth ? settings.thumbWidth : b[p.width]();
		bw = bw < 5 ? systemScrollbarWidth() : bw;

		b.css(p.right, b.css(p.right) - bw).css(p.width, bw);

		// thumb
		t[p.width]( bw );

		/*	selecting text and dragging mouse right out causes strange effect when Webkit tries to "scroll" bigger element (area)
			within smaller one (window)...and native scrollbar becomes visible. This one cleans the mess...
		*/						

		if ( !jQuery.pp.supportsTouches && $.browser.webkit ) {
			// cover for native scrollbar
			container.find('div.pp-scroll-window').append('<div class="'+p.coverSelector+'" style="position:absolute;'+p.top+':0px;'+p.height+':100%"></div>');
			container.find("div." + p.coverSelector).css(p.right, -bw).css(p.width, bw).css('backgroundColor', container.css('backgroundColor'));
		}

		// scrolling event moves the thumb
		s.scroll(function(){
			setThumbPos(p, s, b, t);
			// if you had some scroll events on original, those do not fire anymore
			container.trigger('scroll');
		});

		// bind mousedown to thumb
		t.bind(jQuery.pp.downStartEvent,  function(event) {
			thumbDown(event, p, container);
		});			

		// only mouse, NO click to scroll on bar with touch interface, only drag!
		if ( !jQuery.pp.supportsTouches ) {
			// supporting pointer-events: Gecko, Webkit, IE9(?)
			var pe = !!s.css('pointerEvents');
			
			// this trick does not work on both bars - scrollbar needs to be on "clear" surface
			if ( 'b' == w )
				settings.wheelOnBarForIE = false;
				
			if ( !settings.disableWheelOnBar && (pe || settings.wheelOnBarForIE) ) {
				if ( pe ) {
					// set bar "invisible" to events, nice 
					b.css('pointerEvents', 'none');
				} else {
					// some trickery for other browsers
					// kill scroll-area background 
					s.css('background', 'transparent');
					// position bar UNDER the scroll-area
					b.css('z-index', -1);
					// add layer on the very bottom
					container.find('div.pp-scroll-window').append('<div class="pp-scroll-cover" style="z-index:-1;'+scrollWindowStyle+'"></div>');
					// add container styles for that layer (ve are interested only for background properties)
					container.find('div.pp-scroll-cover').addClass(container.prop("className"));
					// kill container's background
					container.css('background', 'transparent');
				}
				s.mousedown(function(event){
					event = jQuery.pp.normEvent(event);
					var o = t.offset();
					if ( event[p.pageX] >= o[p.left] && event[p.pageX] <= (o[p.left] + t[p.width]()) ) {
						// click "on" scrollbar
						event.preventDefault();
						event.stopPropagation();
						if ( event[p.pageY] >= o[p.top] && event[p.pageY] <= (o[p.top] + t[p.height]()) ) {
							// on thumb, trigger down event
							thumbDown(event, p, container);
						} else {
							// outside of thumb
							startPagingBubbling(event, p, s, t);
						}
						// kill all selection attempts, otherwise accidental doubleclick on bar will trigger selection on content
						return true;
					}
				});

			} else {
				// fail grafcefully for on IE<9 & Opera, no wheel scrolling when cursor is ON the bar
				b.dblclick(function(event) {
					return true;
				});
				b.mousedown(function(event) {
					event = jQuery.pp.normEvent(event);
					var o = t.offset();
					if ( event[p.pageY] < o[p.top] || event[p.pageY] > (o[p.top] + t[p.height]()) ) {
						// click outside the thumb
						startPagingBubbling(event, p, s, t);
					}
				});
			}
		}
	}
	
	constructor.prototype = {
		add: function(container, options) {

			var settings = {
				'thumbWidth' : 0, /* speeds things up conciderably in some cases */
				'ignore' : false,
				'disableWheelOnBar' : true,
				'wheelOnBarForIE' : false
			};
			
			( options ) && $.extend( settings, options );
			
			// be nice catch errors
			try {
			
				container = $(container);

				var what = '';
				var sY = container.css('overflowY');
				var sX = container.css('overflowX');					
				( 'auto' == sY || 'scroll' == sY ) && ( what += 'v' );
				( 'auto' == sX || 'scroll' == sX ) && ( what += 'h' );
				if ( 2 == what.length )
					what = 'b';
				else if ( 0 === what.length )
					return false;
				
				// prevent double add
				if ( container.find('div.pp-scroll-area').length )
					return false;

				// so far, ignore only IE6, add native bars and that's it. I COULD make it work in IE6 but so far didn't bother
				if (settings.ignore) {
					if ( 'h' != what)
						container.css('overflowY', 'scroll');
					if ( 'v' != what)
						container.css('overflowX', 'scroll');
					return false;
				}
			
				// remove native scrollbars if any
				container.css('overflow', 'hidden');
			
				var scrollWindowStyle = "overflow:hidden;position:absolute;top:0px;left:0px;width:100%;height:100%;margin:0;padding:0;border:0;";
				// add universal markup
				var c = container.wrapInner('<div class="pp-scroll-area" tabindex="0" style="position:absolute;top:0px;left:0px;outline:none;margin:0;border:0;overflow:hidden;width:100%;height:100%;"/>').wrapInner('<div class="pp-scroll-window" style="' + scrollWindowStyle + '"/>');

				var s = container.find('div.pp-scroll-area');
			
				// copy container classes to scroll area
				s.addClass(container.prop("className"));
				
				if ( 'v' == what )
					s.css('overflowX', 'hidden');
				if ( 'h' == what )
					s.css('overflowY', 'hidden');

				if ( 'h' != what )
					addScrollBar(verticalProperties, container, c, s, settings, scrollWindowStyle, what);
				if ( 'v' != what )
					addScrollBar(horizontalProperties, container, c, s, settings, scrollWindowStyle, what);


				$(container).resize(function(event) {
					setTimeout(function() {onChange(what, container, s); }, 0);
				}).resize();

				$(container).bind('change', function(event) {
					setTimeout(function() {onChange(what, container, s); }, 0);
				});

				
				/* selecting text and dragging mouse right out causes strange effect when Webkit tries to "scroll" bigger element (area)
				 within smaller one (window)...and native scrollbar becomes visible. This one cleans the mess...
				*/						
				if ( false && !jQuery.pp.supportsTouches && $.browser.webkit ) {
					s.mousedown(function(){
						$(document).bind('mouseup' + eventName, function(event){
							var sPos = s.position();
							var sOff = s.offset();
							var sT = 0, sL = 0, cT = 0, cL = 0;
							
							if ( ('h' != what) && sPos.left !== 0 ) {
								sT = sOff.top;
								sL = sOff.left - sPos.left;
								cT = 0;
								cL = sPos.left;							
							}

							if ( ('v' != what) && sPos.top !== 0 ) {
								sT = sOff.top - sPos.top;
								sL = sOff.left;
								cT = sPos.top;
								cL = 0;							
							}
							
							// ah, don't ask, so much trouble to neuter such a webkit quirk
							// no way I will spend my time to optimize THIS
							if ( sT > 0 || sL > 0 ) {
								s.offset({top: sT, left: sL}).offset({top: sT, left: sL});

								var vCover = container.find('div.pp-scroll-cover-v');
								var vOff = vCover.offset();
								vCover.offset({top: vOff.top - cT, left: vOff.left - cL}).offset({top: vOff.top - cT, left: vOff.left - cL});
								
								var hCover = container.find('div.pp-scroll-cover-h');
								var hOff = hCover.offset();
								hCover.offset({top: hOff.top - cT, left: hOff.left - cL}).offset({top: hOff.top - cT, left: hOff.left - cL});
							}
							
							$(this).unbind(event);
						});
					});
				}
			} catch(e) { $.error(e); }
		},

		pluginMethods : {
			init : function( constructor, options ) {
				return this.each(function() {
					var data = $.data(window, 'pp' + handler) || {};
					// have only one instance
					if ( !data.instance ) {
						data.instance = new constructor();
						$.data(window, 'pp' + handler, data);
					}
					
					if ( data.options ) {
						if ( options ) {
							$.extend( options,data.options );
							//$.extend( data.options, options );
						} else {
							options = data.options;
						}
					}
					// scrollBar class has only one public method: add
					data.instance.add(this, options);
				});
			},

			// set global options, call it like this: jQuery.fn.ppScrollbar('options', {ignore: true});
			options: function(options) { 
				var data = $.data(window, 'pp' + handler) || {};
				data.options = options;
				$.data(window, 'pp' + handler, data);
				return this;
			},

			ignore: function() { 
				var data = $.data(window, 'pp' + handler) || {};
				if ( data && data.options )
					return data.options.ignore;
				return false;
			},

			// if something changes that doesn't fire resize event on original element, call this method
			redraw: function() { 
				return this.each(function() {
					if ( !$(this).hasClass('pp-scroll-area') ) {
						$(this).trigger('change');
					}
				});

			},
		
			// to access original content
			content: function() { 
				return this.find('div.pp-scroll-area');
			},

			// to access scrollbar
			bars: function( ) {  
				return this.find('div.pp-scroll-bar');
			},
			vbar: function( ) {  
				return this.find('div.pp-scroll-bar-v');
			},
			hbar: function( ) {  
				return this.find('div.pp-scroll-bar-h');
			},
			
			// to access scrollbar thumb
			thumbs: function( ) { 
				return this.find('div.pp-scroll-thumb');
			},
			vthumb: function( ) { 
				return this.find('div.pp-scroll-thumb-v');
			},
			hthumb: function( ) { 
				return this.find('div.pp-scroll-thumb-h');
			}
		}

	};

	return constructor;
	
})(); // end of Scrollbar class definition
jQuery.pp.register(handler, this[handler]);
}('scrollbar');