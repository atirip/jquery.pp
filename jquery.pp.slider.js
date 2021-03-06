/*SLIDER*/
+function(handler){ this[handler] = (function() {

	var eventName = '.pp',
		startY, height, maxHeight;

	function constructor(sliderContainer, options) {
		this.container = sliderContainer;
		if ( isNumeric(this.container.attr("data-value")) )
			return;
			
		this.settings = {
			dir: 'H',
			value: 0,
			min: 0,
			max: 100,
			step: 1,
			duration: 500,
			setValueOnDrag: true,
			sliderClass:  'pp-slider',
			rangeClass:  'pp-slider-range',
			thumbClass:  'pp-slider-thumb',
			callback: null
		};
		( options ) && $.extend( this.settings, options );

		this.range = $('<div class="'+this.settings.rangeClass+'"></div>').appendTo(this.container);
		this.thumb = $('<div class="'+this.settings.thumbClass+'"></div>').appendTo(this.container);
		this.container.addClass(this.settings.sliderClass);
		this.props = ('V' == this.settings.dir ) ? jQuery.pp.verticalProperties : jQuery.pp.horizontalProperties;
			
		var self = this;
		this.thumb.bind(jQuery.pp.downStartEvent + eventName, function(event) {
			thumbDown.call(self, event);
		});			

		if ( !jQuery.pp.touchDevice ) {
			this.container.bind(jQuery.pp.downStartEvent + eventName, function(event) {
				sliderClick.call(self, event);
			});			
		}

		this.container.bind('value', function(event) {
			var args = Array.prototype.slice.call(arguments, 1);
			self.setValue( args[0], self.settings.callback, args.slice(1) );
		});			

		this.container.bind('option', function(event) {
			var args = Array.prototype.slice.call(arguments, 1);
			return self.getOption.apply(self, args);
		});			

		this.setValue(this.settings.value);
	}

	function isNumeric(num) {
		return !/^(NaN|-?Infinity)$/.test(+num);
	}

	function thumbDown(event) { // event, props, container
		event = jQuery.pp.normEvent(event);

		var self = this;
		$(document).bind(jQuery.pp.moveEvent + eventName, function(e) {
			thumbDrag.call(self, e);
		}).bind(jQuery.pp.upEndEvent + eventName, function(e) {
			thumbUp.call(self, e); //1
		}).bind('touchcancel' + eventName, function(e) {
			thumbUp.call(self, e); //2
		});

		var p =	this.props;
		startY = event[p.pageY];
		// cache for drag
		maxHeight = this.container[p.height]();
		height = this.range[p.height]();
			
		return jQuery.pp.cancelEvent(event);
	}

	function thumbDrag(event) {
		event = jQuery.pp.normEvent(event);
		var p =	this.props;
		var newH = Math.max(Math.min(height + event[p.pageY] - startY, maxHeight), 0);
		this.range[p.height](newH);
		this.thumb.css(p.top, newH);
		if ( this.settings.setValueOnDrag ) {
			var val = ( newH / maxHeight * (this.settings.max - this.settings.min) ) + this.settings.min;
			val = this.roundValue(val);
			if ( val != this.container.attr('data-value') ) {
				this.container.attr('data-value', val);
				this.settings.callback && this.settings.callback(val);
			}
		}
		return jQuery.pp.cancelEvent(event);
	}

	function thumbUp(event) {
		$(document).unbind(eventName);
		var p =	this.props;
		var val = ( this.range[p.height]() / maxHeight * (this.settings.max - this.settings.min) ) + this.settings.min;
		this.setValue(val, this.settings.callback);
	}

	function sliderClick(event) { // event, props, container
		var p = this.props;
		var newH = event[p.pageY] - this.container.offset()[p.top];
		var val = ( newH / this.container[p.height]() * (this.settings.max - this.settings.min) ) + this.settings.min;
		this.setValue(val, this.settings.callback);
		return jQuery.pp.cancelEvent(event);
	}

	constructor.prototype = {
	
		roundValue: function(val) {
			// lifted from jquery-ui-slider
			var step = ( this.settings.step > 0 ) ? this.settings.step : 1,
				valModStep = (val - this.settings.min) % step,
				alignValue = val - valModStep;

			if ( Math.abs(valModStep) * 2 >= step ) {
				alignValue += ( valModStep > 0 ) ? step : ( -step );
			}
			// end of lifting
			return alignValue;
		},


		setValue: function(val, callback, params) {

			if ( !isNumeric(val) )
				return;
			val = this.roundValue(val);
			
			var p = this.props;
			var newH = this.container[this.props.height]() * val / (this.settings.max - this.settings.min);
			var rh = {};
			rh[p.height] = newH;
			var tt = {};
			tt[p.top] = newH;
			if ( Math.abs(this.range[p.height]() - newH) < 10 ) {
				this.thumb.css(tt);
				this.range.css(rh);
			} else {
				this.thumb.animate(tt, this.duration, 'swing');
				this.range.animate(rh, this.duration, 'swing');
			}
			
			if ( val == this.container.attr('data-value') ) return;
			this.container.attr('data-value', val);
			callback && callback(val, params);
		},

		
		getOption: function(name) {
			return this.settings[name];
		},
		
		pluginMethods : {
			init : function( constructor, options ) {
				options = options || {};
				return this.each(function() {
					new constructor($(this), options);
				});
			},

			//set: function(val) { 
			set: function() { 
				var args = Array.prototype.slice.call(arguments);
				return this.each(function() {
					$(this).triggerHandler('value',  args);
				});
			},

			get: function() {
				return $(this).attr('data-value');
			},
			
			
			// some jquery ui slider compatibility
			value: function() {
				var args = Array.prototype.slice.call(arguments);
				return this.each(function() {
					$(this).triggerHandler('value',  args);
				});
			},

			option: function(name) {
				return $(this).triggerHandler('option', name);
			}

			
		}

	};
	
	
	return constructor;
	
})(); // end of slider class definition
jQuery.pp.register(handler, this[handler]);
}('slider');