/*
* MIT Licensed
* Copyright (c) 2012, Priit Pirita, atirip@yahoo.com
*/

+function(handler){ this[handler] = (function() {

	function constructor(pad, options) {

		this.pad = $(pad);
		var classNames = { 
			activeClass: "active",
			hoverClass: "hover",
			boxClass: "popup",
			selectClass: "select",
			selectedClass: "selected"
		};
		
		this.options = [];
		this.values = [];
		this.setValues(options.selected || 0, options.options || [], options.values || []);
		
		this.settings = $.extend({
			appendTo: 'body',
			hideOnScroll: false,
			hideOnResize: true,
			window: null,
			target: null,
			/* onChange: function(selected value, selected text) {} */
			prefix: 'pp-', 
			html: '<div class="{0}" data-value="{1}"><nobr>{2}</nobr></div>'
		}, options || {});

		this.settings.html = this.settings.html.replace(/pp-/g, this.settings.prefix);
		for( var i in classNames) {
			if( classNames.hasOwnProperty(i) ) {
				classNames[i] = this.settings.prefix + classNames[i];
			}
		}
		this.settings = $.extend(this.settings, classNames);

		this.box = $('<div style="position:absolute;" id="' + $.pp.id() +'" class="' + this.settings.boxClass + '"></div>').appendTo(this.settings.appendTo);					
		this.elem = null;		
		this.popup = new jQuery.pp.popupHandler(this, {
			hideOnScroll: this.settings.hideOnScroll,
			hideOnResize: this.settings.hideOnResize,
			window: this.settings.window
		});			
		
		var self = this;
		this.pad.bind('value', function(event) {
			self.setValues.apply(self, Array.prototype.slice.call( arguments, 1 ) );
			self.display();
		});			
		this.display();
	}

	function scrollTarget(obj) {
		if ( obj.find('.pp-scroll-area').length > 0 ) {
			return obj.krtScrollbar('content');
		} else {
			return obj;
		}
	}

	constructor.prototype = {

		setValues: function(selected, options, values) {
			if ( options ) {
				this.options = Array.prototype.slice.call(options);
			}
			if ( values ) {
				this.values = Array.prototype.slice.call(values);
			}
			if ( this.options.length != this.values.length ) {
				this.values = Array.prototype.slice.call(this.options);
			}
			if ( undefined === selected ) {
				selected = this.pad.attr('data-value');
			}
			if ( !selected ) {
				selected = this.values[0];
			}
			this.pad.attr('data-value', selected);		
		},
		
		renderSelects: function(selected, reverse) {
			selected = this.pad.attr('data-value');
			var html = '',
				render = function(i) {
					var hover = this.values[i] == selected ? ' ' + this.settings.selectedClass + ' ' + this.settings.hoverClass : '';
					if ( hover ) {
						selected = -1;
					}
					return jQuery.pp.format(this.settings.html, this.settings.selectClass + hover, this.values[i], this.options[i]);
				};

			for( var i = 0; i < this.options.length; i++) {
				html = reverse ? render.call(this, i) + html : html + render.call(this, i);
			}
			this.box.html( html );
			this.elem = this.box.children();
			this.popup.addEventHandlers();
		},

		change: function() {
			var selected = this.selected(),
				value;
			if ( selected.length ) {
				value = selected.attr('data-value');
				if ( value == this.pad.attr('data-value') ) {
					return;
				}
				this.pad.attr('data-value', value);
				this.display( value, selected.text(), 1);
			}
		},

		display: function(value, text, user) {
			if ( !text ) {
				var selected = this.pad.attr('data-value');
				for ( var l = this.values.length; l--;) {
					if ( selected == this.values[l] ) {
						value = selected;
						text = this.options[l];
					}
				}	
				text = text || '';
			}
			
			if ( this.settings.onChange ) {
				this.settings.onChange.call(this, value, text, user );
			} else {
				this.pad.trigger('change');
			}
			if ( this.settings.target ) {
				$(this.settings.target).text( text );
			}
		},
	
		selected: function() {
			return this.box.find('.' +  this.settings.hoverClass);
		},

		prev: function() {
			return this.selected().prev();
		},
		
		next: function() {
			return this.selected().next();
		},

		focus: function(elem) {
			$(elem).addClass(this.settings.hoverClass);
		},

		blur: function() {
			this.elem.removeClass(this.settings.hoverClass);
		},
		
		show: function() {
			var flipped = !!-this.box.attr('data-pp-flipped');
			this.renderSelects( this.pad.attr('data-value'), flipped);			
			
			this.box.css({width:'',height:''});
			this.box.ppWithLayout(function() {
				this.box.ppPositionAsDropbox(window, this.pad);
			}, this);
			
			if ( flipped != !!-this.box.attr('data-pp-flipped') ) {
				// render them again again
				this.renderSelects( this.pad.attr('data-value'), !flipped);			
			}
									
			this.pad.addClass(this.settings.activeClass);
			this.box.addClass(this.settings.activeClass).show();
		},

		hide: function() {
			this.pad.removeClass(this.settings.activeClass);
			this.box.removeClass(this.settings.activeClass).hide().empty();
		},

		// TODO: VERY old code, need testing (is it universal enough)
		scroll: function() {
			var selected = this.box.find('.' +  this.settings.hoverClass);
			if ( 1 != selected.length ) {
				return;
			}
			var box = scrollTarget(this.box);

			var bH = parseInt(box.css('borderTopWidth'), 10);
			var boxTop = box.offset().top + bH;
			var boxHeight = box.prop('clientHeight');
			
			var itemHeight = selected.prop('clientHeight');
			var itemTop = selected.offset().top;
			if ( (itemTop + itemHeight) > (boxTop + boxHeight) ) {
				box.scrollTop(box.scrollTop() + itemTop + itemHeight - boxTop - boxHeight + bH);
				return true;
			} else if ( itemTop < boxTop  ) {
				box.scrollTop(box.scrollTop() + itemTop - boxTop );
				return true;
			}
			return false;
		},
		
		pluginMethods : {
			set: function() { 
				var args = Array.prototype.slice.call(arguments);			
				return this.each(function() {
					$(this).trigger('value',  args);
				});
			},

			init : function( constructor, pop, options ) {
				options = options || {};
				return this.each(function() {
					new constructor($(this), pop, options);
				});
			}
			
		}

	};

	return constructor;
	
})(); 
jQuery.pp.register(handler, this[handler]);
}('selectpopup');

