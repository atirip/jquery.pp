/*
* MIT Licensed
* Copyright (c) 2012, Priit Pirita, atirip@yahoo.com
*/

+function(handler){ this[handler] = (function() {

	function constructor(element, options) {		

		this.box = $(element);
		if ( this.box.attr('data-pp') ) {
			return;
		}

		this.box.hide().attr('data-pp', 1);

		var self = this;

		this.settings = jQuery.extend({
			verticalPosition: 0.2,
			horizontalPosition: 0.5,
			positionFixed: false,
			coverClass: 'cover',
			coverOnClass: 'on',
			closeButtonSelector: '.button',
			closeOnClickOutside: false
		}, options || {} );


		var closeButtons = this.box.find(this.settings.closeButtonSelector);
		if ( closeButtons.length ) {
			this.elem = closeButtons;		
		} else {
			this.elem = this.box;
		}

		
		this.popupHandler = new jQuery.pp.popupHandler(this, {
			addEventHandlers: false,
			hideOnScroll: false,
			hideOnResize: false,
			closeOnClickOutside: this.settings.closeOnClickOutside,
			keycodeTranslator: function(code) {
				return 27 == code ? code : 0;
			}
		});		
		this.popupHandler.addBoxHandlers = function() {
			this.addKeybHandlers();
			return this;
		}; 

		this.box.bind('show', function(event) {
			self.popupHandler.show();
		}).bind('hide', function(event) {
			self.popupHandler.hide();
		});			
		
		this.cover = false;
	}
	
	constructor.prototype = {

		show: function() {
			if ( this.box.is(':visible') ) {
				this.box.trigger('hide');
			}
			this.cover = 'cover-' + $.pp.id();
			var cover = $.ppCover(this.settings.coverClass, this.cover, this.settings.positionFixed);
			this.box.ppWithLayout(function() {
				var d = $(window).ppDimensions();
				if (this.settings.positionFixed) {
					d.left = 0;
					d.top = 0;
				}
				this.box.ppPosTo(this.settings.horizontalPosition, this.settings.verticalPosition, d);
			}, this).css({
				position: this.settings.positionFixed && !jQuery.pp.touchDevice ? 'fixed' : 'absolute', 
				outline: 'none', 
				zIndex: cover.css('zIndex') + 1
			}).show();
			cover.addClass(this.settings.coverOnClass);
			this.popupHandler.addEventHandlers();	
		},

		hide: function() {
			$('#' + this.cover).hide().remove();
			this.cover = false;
			this.box.hide();
			this.popupHandler.removeEventHandlers();	
		},		

		pluginMethods : {
			init: function( constructor, options) {
				return this.each(function() {
					new constructor( $(this), options );
				});
			}
		}
	};
	
	return constructor;
})(); 
jQuery.pp.register(handler, this[handler]);
}('modal'); 

