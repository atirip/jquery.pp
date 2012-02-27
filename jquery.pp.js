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

