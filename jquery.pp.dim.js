/*
* MIT Licensed
* Copyright (c) 2012, Priit Pirita, atirip@yahoo.com
*/

// can be used separately 

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
		overlaps: false,
		flip: function(p) { 
			return 1 - p; 
		},
		adjust: true
	}, options || {});
	
	var p = options.v ? jQuery.pp.verticalProperties : jQuery.pp.horizontalProperties,
		pos = this.ppPosRelativeTo(p, options.where, pad),
		dim = this.ppDimensions(),
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




