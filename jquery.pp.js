/*
* MIT Licensed
* Copyright (c) 2012, Priit Pirita, atirip@yahoo.com
*/

jQuery.pp = {

	supportsTouches : "createTouch" in document,
	downStartEvent : "createTouch" in document ? "touchstart" : "mousedown",
	moveEvent : "createTouch" in document ? "touchmove" : "mousemove",
	upEndEvent : "createTouch" in document ? "touchend" : "mouseup",
	
	// windows mobile is touch device, but does not have touch events!
	touchDevice : "createTouch" in document ? true : false,


	id : function id() {
		if (!id.id) { id.id = 1; }
		return 'pp-id-' + id.id++;
	},

	components: {},
	register : function(name, obj) {
		var self = jQuery.pp;

		self[name] = obj;
		self.components[name] =	obj;
		self[name].prototype.U = self;
		self[name].prototype.N = name;
		
		// jqueryfi
		var Name = name.charAt(0).toUpperCase() + name.substr(1).toLowerCase();
		var methods = self[name].prototype.pluginMethods;
		if (  methods ) {
			$.fn['pp' + Name] = function( method ) {
				if ( methods[method] ) {
					return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
				} else {
					var args = Array.prototype.slice.call( arguments, 0);
					args.unshift(self[name]);
					return methods.init.apply( this, args);
				}

			};
		}

	},

	/*
		if some component is active, it has some signature eventhandlers registered on (usually) document
		for example a mousedown on dragging component event registers mousemove and mouseup event on document
		so to know if some component is active we need to find if document has namespaced eventhandlers as
		every component in kurat.ui registers only namespaced document events
	*/
	// componentnames :  Array
	componentActive: function(componentNames, element) {
		element = element || document;
		var events = $(element).data('events');
		
		// iterate over expected supreme handlers namespaces
		var el = componentNames.length;
		while(el--) {
			// iterate over all events for which handlers are set
			for (var ev in events) {
				if( events.hasOwnProperty(ev) ) { 
					var handlers = events[ev];
					// iterate over that event handlers
					var hl = handlers.length;
					while(hl--) {
						// so which is it?
						if ( handlers[hl].namespace == componentNames[el] ) {
							return true;
						}
					}
				}
			}
		}
		return false;
	},

	cancelEvent: function(event) {
		event.stopPropagation();
		event.preventDefault();
		return false;
	},

	// jQuery nixes touch events, we need them
	normEvent: function(event) {
		if ( jQuery.pp.supportsTouches && event.originalEvent.touches && event.originalEvent.touches.length > 0 ) {
			event = $.extend(event, event.originalEvent.touches[0]);
		}
		return event;
	},

	// shift,ctrl,alt,meta pressed
	modifierPressed: function(event) {
		if ( $.inArray(event.which, [16,17,18,91]) > -1 ) {
			return true;
		}
		if ( event.ctrlKey || event.shiftKey || event.altKey || event.metaKey) {
			return true;
		}	
		return false;	
	},

	format: function(str) {
		var i;
		for (i = 1; i < arguments.length; i++) {
			str = str.replace(new RegExp('\\{'+(i-1)+'\\}', 'gi'), arguments[i]);
		}
		return str;
	},
	
	verticalProperties: {
		top : 'top',
		left : 'left',

		bottom : 'bottom',
		right : 'right',

		height : 'height',
		width: 'width',

		minWidth : 'minWidth',
		scrollTop : 'scrollTop',
		scrollWidth : 'scrollWidth',
		scrollHeight : 'scrollHeight',
		
		clientHeight : 'clientHeight',
		clientWidth : 'clientWidth',

		outerHeight : 'outerHeight',
		outerWidth : 'outerWidth',

		innerHeight : 'innerHeight',
		innerWidth : 'innerWidth',

		ppOuterHeight : 'ppOuterHeight',
		ppOuterWidth : 'ppOuterWidth',

		ppInnerHeight : 'ppInnerHeight',
		ppInnerWidth : 'ppInnerWidth',

		offsetTop: 'offsetTop',
		offsetLeft: 'offsetLeft',

		pageY : 'pageY',
		pageX : 'pageX',
		marginLeft : 'marginLeft',
		marginRight : 'marginRight',
		marginTop : 'marginTop',
		marginBottom : 'marginBottom',
		borderTopWidth : 'borderTopWidth',
		borderBottomWidth : 'borderBottomWidth',
		paddingTop : 'paddingTop',
		paddingBottom : 'paddingBottom',
		paddingRight : 'paddingRight',
		overflowY : 'overflowY',
		overflowX : 'overflowX',		

		vertical: 'vertical',
		horizontal: 'horizontal'	
	},
	
	// to use same routines for horizontal calculations we just switch the properties
	horizontalProperties: {
		top : 'left',
		left : 'top',

		bottom : 'right',
		right : 'bottom',

		height : 'width',
		width: 'height',

		minWidth : 'minHeight',
		scrollTop : 'scrollLeft',
		scrollHeight : 'scrollWidth',
		scrollWidth : 'scrollHeight',

		clientHeight : 'clientWidth',
		clientWidth : 'clientHeight',

		outerHeight : 'outerWidth',
		outerWidth : 'outerHeight',

		innerHeight : 'innerWidth',
		innerWidth : 'innerHeight',

		ppOuterHeight : 'ppOuterWidth',
		ppOuterWidth : 'ppOuterHeight',

		ppInnerHeight : 'ppInnerWidth',
		ppInnerWidth : 'ppInnerHeight',

		offsetTop: 'offsetLeft',
		offsetLeft: 'offsetTop',


		pageY : 'pageX',
		pageX : 'pageY',
		marginLeft : 'marginTop',
		marginRight : 'marginBottom',
		marginTop : 'marginLeft',
		marginBottom : 'marginRight',
		borderTopWidth : 'borderLeftWidth',
		borderBottomWidth : 'borderRightWidth',
		paddingTop : 'paddingLeft',
		paddingBottom : 'paddingRight',
		paddingRight : 'paddingBottom',
		overflowY : 'overflowX',
		overflowX : 'overflowY',		

		vertical: 'horizontal',
		horizontal: 'vertical'	
	}
};


jQuery.fn.ppBoxModel = function(expected) {
	// border-box, content-box 
	var model = this.css('box-sizing') || this.css('-webkit-box-sizing') || this.css('-moz-box-sizing') || this.css('-ms-box-sizing');
	return expected ? model == expected : model;
};

/*
	theres a mess of various width's/height's we can query
	
	$().width();
	$().outerWidth();
	$().prop('clientWidth');
	$().prop('offsetWidth');
	
	the only meaningful are $().width(), $().outerWidth(), which give you REAL innerWidth and outerWidth, but it is not
	easy to SET them, so I wrote methods which in get mode encapsulate jQuery ones, but in set mode set correct values
	REGARDLESS of box model used.
	
*/
// Create get/set Inner/Outer Width/height methods
jQuery.each( ['Width', 'Height'], function(i, name, undef) {

	var lower = name.toLowerCase();

	jQuery.fn['ppOuter' + name] = function() {

		var a = Array.prototype.slice.call(arguments, 0);

		if ( 0 === a.length || (1 === a.length && Object.prototype.toString.call(a[0]).slice(8, -1).toLowerCase() === 'boolean') ) {
			// get
			if ( this[0] ) {
				if ( 1 == this.length) {
					var margins = !!a.pop();
					return this['outer' + name]( margins );
				} else {
					// if multiple elements, complicated, don't use!
					var t,b;
					if ( 'Height' == name ) {
						t = 'Top';
						b = 'Bottom';
					} else {
						t = 'Left';
						b = 'Right';
					}
					// always calculate WITH margins, because there's no point without - elements stay away of eacother when margins are
					// set so OuterHeight needs to contain margins
					var mt = parseInt(this.first().css('margin' + t), 10);
					var mb = parseInt(this.first().css('margin' + b), 10);
					return this.length * this.first()['outer' + name]() + mt + mb + (this.length-1) * Math.max(mt, mb);
				}
			}
			return undef;


		} else {
			// set
			var x = a[0];
			if ( this[0] ) {
				var diff = this.ppBoxModel('content-box') ? this['outer' + name]( a.pop() ) - this[lower]() : 0;
				this[lower]( x - diff );
			}
			return this;
			
		}  
		
	};

	jQuery.fn['ppInner' + name] = function(x) {
		if ( undef == x ) {
			if ( this[0] ) {
				return this[lower]();
			}
			return undef;
		} else {
			if ( this[0] ) {
				var diff = this.ppBoxModel('border-box') ? this[lower]() - this['outer' + name]() : 0;
				this[lower]( x - diff );
			}
			return this;
		}
	};

});	


/* adjust this size so it can be put inside selector as browser engine would
	<selector>
		<this style= width 100%, height 100%>
		</this>
	</selector>
*/
jQuery.fn.ppFitInto = function(selector, margins) {
	if ( this[0] ) {
		var s = jQuery(selector), elem = this;
		if ( s[0] ) {
			jQuery.each( ['Width', 'Height'], function(i, name) {
				elem['ppOuter' + name](s['ppInner' + name](), !!margins);
			});
		}
	}
	return this;
};

/* adjust this size so selector can be put inside this as browser engine would
	<this>
		<selector>
		</selector>
	</this>
*/
jQuery.fn.ppEmbrace = function(selector, margins) {
	if ( this[0] ) {
		var s = jQuery(selector), elem = this;
		if ( s[0] ) {
			jQuery.each( ['Width', 'Height'], function(i, name) {
				elem['ppInner' + name](s['ppOuter' + name](!!margins));
			});
		}
	}
	return this;
};

/*
	makes this and selector same size
*/
jQuery.fn.ppEqual = function(selector) {
	if ( this[0] ) {
		var s = jQuery(selector), elem = this;
		if ( s[0] ) {
			jQuery.each( ['Width', 'Height'], function(i, name) {
				elem['ppOuter' + name](s['ppOuter' + name]());
			});
		}
	}
	return this;
};

/*
	if this is inside outer
*/
jQuery.fn.ppIsInside = function(outer) {
	if ( this[0] ) {
		return jQuery.ppIsInside(jQuery.ppDimensions(outer), this.ppDimensions());
	}
	return false;
};

jQuery.ppIsInside = function(outer, inner) {
	if ( inner.left >= outer.left && inner.top >= outer.top && inner.right <= outer.right && inner.bottom <= outer.bottom && outer.width > 0 && outer.height > 0) {
		return true;
	}
	return false;
};

jQuery.fn.ppIsOverlapping = function(selector) {

	if ( this[0] ) {
		var ed = this.ppDimensions(),
			over = function(s, t) {
				return ( Math.max(s.left, t.left) > Math.min(s.right, t.right) || Math.max(s.top, t.top) > Math.min(s.bottom, t.bottom) ) ? false : true;
			};
	
		if ( jQuery.isPlainObject(selector)) {
			return over(ed, selector );
		} else {
			var s = jQuery(selector);
			if ( s.length ) {
				for ( var i = s.length; i--;) {
					if ( !over(ed, jQuery(s[0]).ppDimensions() ) ) {
						return false;
					}
				}
				return true;
			}

		}
	}
	return false;
};

/* if this is hidden (display:none), allows temporarily to restore this dimensions and in callback to do something with it*/
jQuery.fn.ppWithLayout = function(callback, context) {
	if ( this[0] && callback && jQuery.isFunction(callback) ) {
		var cssText = this[0].style.cssText,
			visibility = this.css('visibility'),
			display = this.css('display'),
			position = this.css('position');

		this.css({
			visibility: 'hidden',
			display: 'block',
			position: 'absolute'
		});
		callback.call(context ? context : this);
		this.css({
			visibility: -1 === cssText.indexOf('visibility') ? '' : visibility,
			display: -1 === cssText.indexOf('display') ? '' : display,
			position: -1 === cssText.indexOf('position') ? '' : position
		});
	}
	return this;
};

jQuery.fn.ppDimensions = function(margins) {
	var t, l, w, h, o;
	if ( !this[0] ) { 
		return { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, error: 1 }; 
	}
	if ( jQuery.isWindow(this[0]) ) {
		t = this.scrollTop();
		l = this.scrollLeft();
		w = this.width();
		h = this.height();
	} else {
		o = this.offset();
		t = o.top;
		l = o.left;
		margins = margins ? [true]: [];
		w = jQuery.fn.ppOuterWidth.apply(this, margins);
		h = jQuery.fn.ppOuterHeight.apply(this, margins);
	}
	return { left: l, top: t, right: l + w, bottom: t + h, width: w, height : h };	
};

jQuery.ppDimensions = function(element, margins) {
	if ( !jQuery.isPlainObject(element)) { // expecting dimensions or selector
		return jQuery.fn.ppDimensions.apply(jQuery(element), margins ? [true]: []);
	} else {
		element.error = 0;
		return jQuery.extend( jQuery.fn.ppDimensions.call(jQuery), element);
	}
};

/*
	returns coordinate for this to be placed according to the box
	where - float that specifies position
	p - properties
	
	Example for some and meaningful values for when p = horizontalProperties:
	-1 this right edge touches box left edge
	0 this left edge touches box left edge
	0.5 this and box are horizontally centered
	1 this right edge touches box's right edge
	2 this left edge touches box's right edge

	
*/
jQuery.fn.ppPosRelativeTo = function(p, where, box) {
	var	dim,
		result = {},
		v = jQuery.ppDimensions(box || window);

	result[p.top] = v[p.top];

	if ( this[0] ) { 
		where = parseFloat(where || 0);
		dim = this.ppDimensions(true);
		if ( where < 0 ) {
			result[p.top] += dim[p.height] * where;
		} else if ( where > 1 ) { 
			result[p.top] += v[p.height] + dim[p.height] * (where - 2);
		} else {
			result[p.top] += (v[p.height] - dim[p.height]) * where;
		}
	}
	return result;
};

jQuery.fn.ppPosTo = function(horiz, vert, box) {
	return this.css({
		top: this.ppPosRelativeTo(jQuery.pp.verticalProperties, vert).top,
		left: this.ppPosRelativeTo(jQuery.pp.horizontalProperties, horiz).left
	});
};


jQuery.pp.fitBoxFlip = function(p) { 
	return 1 - p; 
};

jQuery.fn.ppFitBoxTo = function(viewport, pad, options ) {
	if ( !this[0] ) {
		return;
	}
	viewport = jQuery.ppDimensions(viewport);
	pad = jQuery.ppDimensions(pad);
	if ( !jQuery.ppIsInside(viewport, pad ) ){
		return;
	}
	/*
		v - true = vertical positioning, false = horizontal positioning
		SO:
			if v = false, then to position left use -1, to right use 2 to primary
		
	*/
	options = jQuery.extend({
		v: true,
		where: 2,
		flip: function(p) { 
			return 1 - p; 
		},
		adjust: true
	}, options || {});
	
	var p = options.v ? jQuery.pp.verticalProperties : jQuery.pp.horizontalProperties,
		pos = this.ppPosRelativeTo(p, options.where, pad),
		dim = this.ppDimensions(true),
		pos2dim = function(pos) {
			var pd = {}, w = 1;
			pd[p.top]= pos[p.top];
			pd[p.bottom]= pos[p.top] + dim[p.height];			
			pd[p.height]= dim[p.height];
			pd[p.left]= dim[p.left];	
			// width is not important - height must fit, width not		
			pd[p.right]= dim[p.left] + w; 
			pd[p.width]= w; 
			return pd;
		},
		maxOver = function(pos) {
			return Math.max( (pos[p.top] < viewport[p.top] ? viewport[p.top] - pos[p.top] : 0), (pos[p.bottom] > viewport[p.bottom] ? pos[p.bottom] - viewport[p.bottom] : 0) );
		},
		delta, flipped;
		
	if ( !jQuery.ppIsInside(viewport, pos2dim(pos) ) && options.where != 0.5 ) {
		flipped = this.ppPosRelativeTo(p, options.flip.call(this, options.where), pad);
		if ( maxOver( pos2dim(pos) ) > maxOver( pos2dim(flipped) ) ) {
			pos = flipped;
		} else {
			options.flip.call(this, options.where);
		}
	}
	
	if ( options.adjust && !jQuery.ppIsInside(viewport, pos2dim(pos) ) ) {
		// still does not fit - leave it there, but adjust size
		if ( pos[p.top] < viewport[p.top] ) {
			delta = pos[p.top] - viewport[p.top];
			pos[p.top] = pos[p.top] - delta;
			pos[p.outerHeight] = dim[p.height] + delta;	
		} else {
			pos[p.outerHeight] = viewport[p.bottom] - pos[p.top];	
		}
	}
	
	return pos;
};

/* supports outer/inner widths */
jQuery.fn.ppCss = function() {
	if ( jQuery.isPlainObject(arguments[0]) ) {
		var css = arguments[0],
			self = this;
		jQuery.each( ['outerHeight', 'outerWidth', 'innerWidth', 'innerHeight'], function(i, name) {
			if ( css[name] ) {
				self['pp' + name.charAt(0).toUpperCase() + name.substr(1)](css[name]);
				delete css[name];
			}
		});
	}
	return this.css.apply(this, arguments);
};

jQuery.fn.ppPositionAsDropbox = function(viewport, pad, options ) {
	if ( !this[0] ) {
		return;
	}
	
	var flipped = false,
		pos;
	// 1. position vertically, down first
	pos = this.ppFitBoxTo(viewport, pad, $.extend({
		v: true,
		where: 2,
		flip: function(p) { 
			flipped = !flipped;
			return 1 - p; 
		}
	}, options || {}) );
	this.ppCss(pos).attr('data-pp-flipped', flipped ? 1 : 0);

	// 2. position horizontally to left
	pos = this.ppFitBoxTo(viewport, pad, $.extend({
		v: false,
		where: 0
	}, options || {}) );
	this.ppCss(pos);

	return this;
};

jQuery.ppCover = function(className, id) {

	var cover = $('<div style="position:absolute;" id="' + (id || 'cover-' + $.pp.id()) +'" class="' + (className || '') + '"></div>').appendTo('body'),
		wd = $(window).ppDimensions(),
		bd = $('html').ppDimensions();

	cover.css({
		top: 0,
		left: 0,
		width: Math.max(wd.width, bd.width),
		height: Math.max(wd.height, bd.height)	
	});
	return cover;
};


+function(handler){ this[handler] = (function() {

	var X,Y,
		eventName = '.pp',
		mouseMoved = false, 
		firstClick = false,
		justScrolled = false;

	function constructor() {
		this.init.apply(this, arguments);
	}

	function supremeHandlerExists() {
		return jQuery.pp.componentActive(['scrollbar']);
	}

	constructor.prototype = {

		init:function(parent, options) {
			try {
				this.parent = parent;
				this.settings = $.extend({
					window: false,
					hideOnScroll: false,
					hideOnResize: true,
					closeOnClickOutside: true,
					keycodeTranslator: function(code, event) { return code == 32 ? 13 : code; },
					keyUpHandler: function(code, event) { return true; },
					keyDownHandler: function(code, event) { return true; }
				}, options || {});
				this.window = this.settings.window ? $(this.settings.window) : window;
			} catch(e) {
				return;
			}

			var self = this;
			if ( this.parent.pad ) {
				this.parent.pad.bind(jQuery.pp.downStartEvent + eventName, function(event) {
					if ( jQuery.pp.modifierPressed(event) ) {
						return true;
					}
					self.toggle(event);
					return jQuery.pp.cancelEvent(event); // prevents drag start
				});

				this.parent.pad.bind(jQuery.pp.upEndEvent + eventName, function(event) {
					if ( !jQuery.pp.touchDevice && mouseMoved ) {
						self.hide();
					}
					firstClick = false;
					return jQuery.pp.cancelEvent(event); 
				});
			}
			self.addEventHandlers();
		},

		destroy: function() {
			$(document).unbind(eventName);
			$(this.window).unbind(eventName);
			if ( this.parent.pad ) { this.parent.pad.unbind(eventName); }
			if ( this.parent.box ) { this.parent.box.unbind(eventName); }
			if ( this.parent.elem ) { this.parent.elem.unbind(eventName); }
			if ( !jQuery.pp.touchDevice && this.parent.input ) { this.parent.input.unbind(eventName); }
		},
		
		toggle: function(event) {
			if ( this.parent.box && this.parent.box.is(':visible') ) {
				this.hide();
			} else {
				this.show(event);
			}
			return this;
		},

		blur: function() {
			if ( this.parent.blur ) { this.parent.blur(); }
			return this;
		},	

		selected: function () {
			return this.parent.selected ? this.parent.selected.apply(this.parent, arguments) : true;
		},	
	
		change: function() {
			if ( this.parent.change ) { this.parent.change.apply(this.parent, arguments); }
			return this;
		},

		focus: function () {
			this.blur();
			if ( this.parent.focus && arguments.length ) { this.parent.focus.apply(this.parent, arguments); }
			return this;
		},
		
		select: function() {
			if ( arguments[0] && arguments[0].length) {
				this.focus.apply(this, arguments);
				justScrolled = this.parent.scroll ? this.parent.scroll() : false;
			}
			return this;
		},

		hide: function() {
			this.parent.hide(null);
			if ( this.parent.box ) { this.parent.box.blur().removeAttr('tabindex'); }
			$(document).unbind(eventName);
			$(this.window).unbind(eventName);
			return this;
		},

		show: function(event) {

			var self = this;

			// hide all others possibly up
			$(document).trigger(jQuery.pp.downStartEvent + eventName);

			if ( !jQuery.pp.touchDevice ) {
				firstClick = true;
				mouseMoved = false;
				X = event ? event.pageX : 0;
				Y = event ? event.pageY : 0;
			}

		
			if ( self.settings.closeOnClickOutside ) {
				$(document).bind(jQuery.pp.downStartEvent + eventName, function(event) {
					if ( supremeHandlerExists.call(self) ) {
						return true;
					}
					// click outside will hide
					if ( !jQuery.pp.modifierPressed(event) ) {
						self.hide();
					}
				});
			}
			
			if ( self.settings.closeOnClickOutside ) {
				$(document).bind(jQuery.pp.upEndEvent + eventName, function(event) {
					if ( supremeHandlerExists.call(self) ) {
						return true;
					}
					// drag outside and up will hide
					if ( !jQuery.pp.modifierPressed(event) ) {
						self.hide();
					}
				});
			}

			if ( !jQuery.pp.touchDevice ) {
				$(document).one(jQuery.pp.moveEvent + eventName, function(event) {
					event = jQuery.pp.normEvent(event);				
					if ( !mouseMoved && (event.pageX != X || event.pageY != Y) ) {
						// mouse moved
						mouseMoved = true;
					}
					return jQuery.pp.cancelEvent(event);
				});
			}
			
			if ( self.settings.hideOnSceoll ) {
				$(self.window).bind('scroll' + eventName, function() {
					if ( mouseMoved ) {
						self.hide();
					}
				});
			}
			
			if ( self.settings.hideOnResize ) {
				$(self.window).bind('resize' + eventName, function() {
					self.hide();
				});
			}

			this.parent.show(null);
			
			if ( this.parent.scroll ) {
				this.parent.scroll();
			}
			
			if ( !this.parent.input ) {
				this.parent.box.attr('tabindex', 0).focus();
			}
			return this;
		},

		addEventHandlers: function() {
			this.addBoxHandlers();
			this.addElemHandlers();
			return this;
		},

		addBoxHandlers: function(addKeyb) {
			
			if ( !this.parent.box ) {
				return false;
			}
				
			var self = this;

			this.parent.box.unbind(eventName);
			
			this.parent.box.bind(jQuery.pp.downStartEvent, function(event) {
				if ( !jQuery.pp.modifierPressed(event) ) {
					return jQuery.pp.cancelEvent(event);
				}
			});

			this.parent.box.bind(jQuery.pp.upEndEvent, function(event) {
				if ( supremeHandlerExists.call(self) ) {
					return true;
				}
				if ( !jQuery.pp.modifierPressed(event) ) {
					return jQuery.pp.cancelEvent(event);
				}
			});
			
			addKeyb = addKeyb === false ? false : true;
			addKeyb && this.addKeybHandlers();
			return this;
		}, 
		
		addElemHandlers: function() {
			if ( !this.parent.elem || 0 === this.parent.elem.length ) {
				return false;
			}
			var self = this;

			self.parent.elem.unbind(eventName);

			self.parent.elem.bind(jQuery.pp.downStartEvent + eventName, function(event) {
				if ( !jQuery.pp.modifierPressed(event) ) {
					self.focus(this);
					return jQuery.pp.cancelEvent(event);
				}
			});
			
			self.parent.elem.bind(jQuery.pp.upEndEvent + eventName, function(event) {
				if ( supremeHandlerExists.call(self) ) {
					return true;
				}
				if ( firstClick ) {
					firstClick = false;
				} else { 
					if ( jQuery.pp.touchDevice || !jQuery.pp.modifierPressed(event) ) {
						if ( self.selected(event, this) ) {
							self.change(event, this);
							self.hide();
						}
					}
				}
			});
			
			if ( jQuery.pp.touchDevice ) {			
				self.parent.elem.bind(jQuery.pp.moveEvent + eventName, function(event) {
					self.blur();
				});

			} else {
				self.parent.elem.bind(jQuery.pp.moveEvent + eventName, function(event) {
					firstClick = false;						
					if ( justScrolled ) {
						justScrolled = false;
					} else {
						self.focus(this);
					}
				});
			}			

			return this;
		},

		addKeybHandlers: function() {

			var self = this,
				keybTarget = this.parent.input ? this.parent.input : this.parent.box;
				
			if ( !jQuery.pp.touchDevice ) {

				keybTarget.unbind(eventName);
			
				keybTarget.bind('keyup' + eventName, function(event) {
					var code = self.settings.keycodeTranslator ? self.settings.keycodeTranslator.call(self, event.which, event) : event.which;					
					switch( code) {
						case 13: // enter
							if ( !jQuery.pp.modifierPressed(event) ) {
								self.change(event);
								self.hide();
								return false;
							}
							break;
							
						case 27: // esc
							if ( !jQuery.pp.modifierPressed(event) ) {
								self.hide();
								return false;
							}
							break;
						default:
							if ( self.settings.keyUpHandler ) {
								return self.settings.keyUpHandler.call(self, code, event);
							}
					}
					return true; 
				});

				keybTarget.bind('keydown' + eventName, function(event) {
					var code = self.settings.keycodeTranslator ? self.settings.keycodeTranslator.call(self, event.which, event) : event.which;					
					switch( code) {
						case 38:
							if ( !jQuery.pp.modifierPressed(event) && self.parent.prev) {
								self.select(self.parent.prev() );
								return false;
							}
							break;
						case 40:
							if ( !jQuery.pp.modifierPressed(event) && self.parent.next) {
								self.select(self.parent.next() );
								return false;
							}
							break;
						default:
							if ( self.settings.keyDownHandler ) {
								return self.settings.keyDownHandler.call(self, code, event);
							}
					} 
					return true; 
				});
			}
			return this;
		
		}

	};
	return constructor;

})(); // end class definition
jQuery.pp.register(handler, this[handler]);
}('popupHandler'); 



