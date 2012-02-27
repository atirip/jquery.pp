/*
* MIT Licensed
* Copyright (c) 2012, Priit Pirita, atirip@yahoo.com
*/

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

			$(document).bind(jQuery.pp.downStartEvent + eventName, function(event) {
				if ( supremeHandlerExists.call(self) ) {
					return true;
				}
				// click outside will hide
				if ( !jQuery.pp.modifierPressed(event) ) {
					self.hide();
				}
			});
			
			$(document).bind(jQuery.pp.upEndEvent + eventName, function(event) {
				if ( supremeHandlerExists.call(self) ) {
					return true;
				}
				// drag outside and up will hide
				if ( !jQuery.pp.modifierPressed(event) ) {
					self.hide();
				}
			});

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

