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
			coverClass: 'cover',
			closeButtonSelector: '.button',
			closeOnClickOutside: false
		}, options || {} );


		if ( $(this.settings.closeButtonSelector).length ) {
			this.elem = this.box.find(this.settings.closeButtonSelector);		
		} else {
			this.elem = this.box;
		}
		
		this.popupHandler = new jQuery.pp.popupHandler(this, {
			closeOnClickOutside: this.settings.closeOnClickOutside
		});		
		
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
			this.box.ppWithLayout(function() {
				this.box.ppPosTo(this.settings.horizontalPosition, this.settings.verticalPosition);
			}, this).css({
				position: 'absolute', 
				outline: 'none', 
				zIndex: $.ppCover(this.settings.coverClass, this.cover).css('zIndex') + 1
			}).show();
		},

		hide: function() {
			$('#' + this.cover).hide().remove();
			this.cover = false;
			this.box.hide();
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

