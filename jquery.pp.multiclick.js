/*
* MIT Licensed
* Copyright (c) 2012, Priit Pirita, atirip@yahoo.com
*/


(function($){ // secure $ jQuery alias


$.fn.multiclick = function( fn1 ){
	return !fn1 ? this.trigger('multiclick') // 0 args
		: this.bind('multiclick', fn1 ); // 1+ args
	};


function bindStr() {
	var s, names = Array.prototype.slice.call(arguments, 1);
	while(names.length) {
		s += ' ' + names.pop() + '.' + multiclick.id;
	}
	return s.substr(1);
}


// local refs
var $event = $.event, 
	$special = $event.special;

var multiclick = $special.multiclick = {

	distance: jQuery.pp.supportsTouches ? 10: 5, // distance dragged before hold canceled or drag initalised
	holdDelay: 1000, // delay before event is fired in ms
	clickDelay: 300, // delay to wait for dblclick
	doubleClick: false,

	clickPassthruTags: ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'],
	
	fingers: 0,
	moved: false,
	changed: false,
	holdTimer: false,
	holdFired: false,	
	clickTimer: false,	
	gesture: false,
	id : jQuery.pp.id(),
	
	
	setup: function( data ){

		data = $.extend({
			distance: multiclick.distance,
			holdDelay: multiclick.holdDelay,
			clickDelay: multiclick.clickDelay,
			doubleClick: multiclick.doubleClick
			}, data || {});

		data.clickDelay = data.doubleClick ? data.clickDelay : 5;
		data.fingers = 0;
		data.moved = false;
		data.dragged = false;
		data.changed = false;
		data.holdTimer = false;
		data.holdFired = false;
		data.clickTimer = false;
		data.gesture = false;
//		data.id = id;
		data.distance = squared( data.distance ); //  x≤ + y≤ = distance≤

		$event.add( this, bindStr(jQuery.pp.StartEvent, "touchcancel", "gesturestart"), handler, data );
	},
	
	teardown: function(){
		$event.remove( this, bindStr(jQuery.pp.StartEvent, "touchcancel", "gesturestart"), handler );
	}
};

function clearTimer(t) {
	clearTimeout(t);
	return false;
}
	
// set event type to custom value, and handle it
function hijack( event, type, data ){
	var elem = data.elem;
	event.type = 'multiclick'; 
	var handlers = ( jQuery.data(elem, "events") || {} )[event.type];

	for ( var j = handlers.length; j--; ) {
		var handler = handlers[j];
		if ( 'undefined' == typeof handler.data ) {
			handler.data = {};
		}			
		$.extend(handler.data, data);
		handler.data.type = type;
	}

	var result = $.event.handle.call( elem, event );
	return result===false ? false : result || event.result;
}


// return the value squared	
function squared ( value ){
	return Math.pow( value, 2 );
}

function handler ( event ){ 
	var elem = this, 
		data = event.data || {},
		e;

	switch ( event.type ){
		case 'gesturestart':
			if ( !data.gesture ) {
				$event.add( document, bindStr(data, "gestureend", "gesturechange"), handler, data );
				$.extend( data, {elem: this}); 
				data.gesture = true;
				data.changed = false;
			}
			break;
			
		case 'gesturechange':
			data.changed = true;
			break;
			
		case 'gestureend':
			if ( data.gesture ) {
				$event.remove( document, bindStr(data, "gestureend", "gesturechange"), handler );
				data.gesture = false;
				if ( !data.changed ) {
					hijack( event, "twofingertap", data );					
					hijack( event, "stop", data );					
				}

			}
			break;
		
		case jQuery.pp.StartEvent:

			data.fingers = event.originalEvent.touches ? event.originalEvent.touches.length : 1;

			if ( data.fingers > 1 ) {
				// tear it all down
				if ( data.holdTimer || data.clickTimer) {
					data.holdTimer = clearTimer( data.holdTimer );
					data.clickTimer = clearTimer( data.clickTimer );
					$event.remove( document, bindStr(data, jQuery.pp.MoveEvent, jQuery.pp.EndEvent), handler );
				}
				return false;
			}

			e = jQuery.pp.normEvent(event); 

			var rightclick;
			if (e.which) {
				rightclick = (e.which == 3);
			} else if (e.button) {
				rightclick = (e.button == 2);
			}
			if (rightclick) { return true; }

			$.extend( data, { pageX: e.pageX, pageY: e.pageY, elem: this, originalTarget: e.target, currentTarget: e.target}); 

			if ( $.inArray(e.target.tagName, multiclick.clickPassthruTags) > - 1) {
				return true;
			}	
			$event.add( document, bindStr(data, jQuery.pp.MoveEvent, jQuery.pp.EndEvent), handler, data );

			data.holdFired = false;
			data.moved = false;
			data.dragged = false;
			
			if ( data.holdDelay ) {
				data.holdTimer = setTimeout( function() {
					data.holdFired = true;
					data.holdTimer = false;
					if ( 1 == data.fingers ) {
						hijack( event, "hold", data );					
					}
				}, data.holdDelay);
			}

			if ( !data.clickTimer ) {
				hijack( event, "start", data );
			}

			if ( jQuery.pp.supportsTouches) {
				return true;
			}
			return (event.data.startDrag ?  false : true);
					
		case jQuery.pp.MoveEvent:
			e = jQuery.pp.normEvent(event); 

			if ( data.moved ) {
				if ( data.dragged ) { 
					hijack( event, "drag", data );
				}
				var target = jQuery.pp.supportsTouches ? document.elementFromPoint(e.pageX, e.pageY) : e.target;
				if ( data.currentTarget != target ) {
					hijack( event, "out", data );
					data.currentTarget = target;
					hijack( event, "over", data );
				}

			} else if ( !data.gesture && squared( e.pageX-data.pageX )  + squared( e.pageY-data.pageY ) > data.distance  ) {
				data.holdTimer = clearTimer( data.holdTimer );
				data.horizontal = squared( e.pageX-data.pageX ) > squared( e.pageY-data.pageY );
				
				// moved to start
				hijack( event, "dragstart", data );
				data.moved = true;
				if ( event.data.startDrag ) {
					event.data.startDrag = 0;
					data.dragged = true;					
				}
			}
			return true;

		case 'touchcancel':
		case 'multiclick':
		case jQuery.pp.EndEvent: 

			if ( data.fingers > 1 ) {
				return false;
			}
			
			$event.remove( document, bindStr(data, jQuery.pp.MoveEvent, jQuery.pp.EndEvent), handler );
			if ( data.holdTimer ) {
				data.holdTimer = clearTimer( data.holdTimer );
			}

			if ( data.holdFired ) {
				hijack( event, "stop", data );					
				break;
			}
		
			var now = new Date().getTime();
			var lastTouch = data.lastTouch || now + 1 /** the first time this will make delta a negative number */;
			var delta = now - lastTouch;

			data.lastTouch = now; 
			if( (delta < data.clickDelay && delta > 0) ) {
				data.clickTimer = clearTimer(data.clickTimer);
				hijack( event, "doubleclick", data );					
				hijack( event, "stop", data );
				break;					
			} else if (false === data.clickTimer && !data.moved ) {
				data.clickTimer = setTimeout( function() {
					data.clickTimer = false;
					hijack( event, "singleclick", data );
					hijack( event, "stop", data );
				}, data.clickDelay);
				break;
			}

			if ( data.dragged ) {
				data.clickTimer = clearTimer( data.clickTimer );
				return hijack( event, "dragstop", data );					
			} else {
				return hijack( event, "stop", data );					
			}
			break;
	}
	return true; 
}


	/* EVENT HANDLERS
	
		if we have global click & tap event handler attached to document 
		
		shortly: all click and taps are translated into singleclik sub-event
		add data-singleclick=handler attribute to tag to respond
		
		var handler = function(event, target, original) {
			event - jquery normalized event
			target - jquery object of target
			original - where originally clicked
			
			
			return as normal event handler
			
			false - stop here
			true - continue
		}

		Example
		
		<div id=handler data-singleclik=handler>
			<div id=foo data-singleclick=foo>
				<span>Blaah</span>
			</div>
		</div>
		
		
		click or tap on SPAN
		
		function foo(event, target, original) {
			
			target == div#foo
			original == span
			
			return false; / handler() is never called
		
		}
		

	// globale event handler
	$(document).bind('multiclick', {clickDelay: 1}, function( event ){
        return jQuery.pp.multiclick.handleEvent(event, event.data.type, window, 'doubleclick');
    });

    $(document).delegate('select, input', 'change.multiclick', function( event ) {
    	// mimic multiclick
		return jQuery.pp.multiclick.synthesizeSingleclick(event, this, window);
    });
		
	*/


$.extend($.pp, {multiclick:{

	handlerTree: function(target, original) {
		return original.parentsUntil(target);
	},

	handleEvent: function(event, type, context, ignore) {
		var func,
			handler,
			target = $(event.data.originalTarget),
			original = target;

		if ( ignore && target.hasClass(ignore) ) {
			return true;
		}
		type = 'data-'+ type;
		context = context || window;
		while( (handler = target.closest('[' + type + ']')).length ) {
			func = context[handler.attr(type)]; 
			if ( func ) {
				if ( !func.call(context, event, handler, original) ) {
					return false;
				}
			}
			target = handler.parent();
		}
		return true;
	},

	hasHandler: function(event, type) {
		return $(event.data.originalTarget).parents().andSelf().filter('[data-'+ type +']').length;
	},

	synthesizeEvent: function(event, elem, type, context) {
		var e = jQuery.pp.normEvent(event);
		event.data = { 
			type: type,
			pageX: e.pageX,
			pageY: e.pageY,
			elem: elem, 
			originalTarget: e.target,
			currentTarget: e.target
		}; 
		return jQuery.multiclick.handleEvent(event, event.data.type, context);
	},

	synthesizeSingleclick: function(event, elem, context) {
		return jQuery.multiclick.synthesizeEvent(event, elem, 'singleclick', context);
	}


}});

/*******************************************************************************************/
})( jQuery ); 
