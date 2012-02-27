/*
* MIT Licensed
* Copyright (c) 2012, Priit Pirita, atirip@yahoo.com
*/

+function(handler){ this[handler] = (function() {

	function constructor(pad, options) {
	
		var classNames = { 
			activeClass: "active",
			hoverClass: "hover",
			boxClass: "popup",
			nextMonthClass: "nav-next-month",
			prevMonthClass: "nav-prev-month",
			nextYearClass: "nav-next-year",
			prevYearClass: "nav-prev-year",
			disabledClass: 'disabled',
			hiddenClass: 'hidden',

			calendarClass: 'calendar',
			todayClass: 'today',
			otherClass: 'other'

		};

		this.settings = $.extend({
			onOpen: function() { return {/* return calendar settings */}; },
			/* onChange: function(date choosen) {} */
			appendTo: 'body',
			hideOnScroll: false,
			hideOnResize: true,
			window: null,
			prefix: "pp-",			
			html: '<h2>{0} {1}</h2>'+
			'<div class="pp-nav-prev {2}"><a class="pp-nav-prev-month" href="#"></a></div>'+
			'<div class="pp-nav-next {3}"><a class="pp-nav-next-month" href="#"></a></div>'+
			'<div class="pp-calendar">{4}</div>'+
			'<div class="pp-bottom">'+
			'	<div class="pp-bottom-prev {5}"><a class="pp-nav-prev-year" href="#">{6}</a></div>'+
			'	<div class="pp-bottom-next {7}"><a class="pp-nav-next-year" href="#">{8}</a></div>'+
			'</div>'
			
		}, options || {});
		
		this.settings.html = this.settings.html.replace(/pp-/g, this.settings.prefix);
		for( var i in classNames) {
			if( classNames.hasOwnProperty(i) ) {
				classNames[i] = this.settings.prefix + classNames[i];
			}
		}
		this.settings = $.extend(this.settings, classNames);
		
		this.pad = $(pad);
		this.box = $('<div style="position:absolute;" id="' + $.pp.id() +'" class="' + this.settings.boxClass + '"></div>').appendTo(this.settings.appendTo);	
		this.cal = new $.pp.calendar( $.extend(this.settings, this.settings.onOpen ? this.settings.onOpen() : {}) );
		
		this.elem = null;
		var self = this;		
		this.popup = new jQuery.pp.popupHandler(this, {
			hideOnScroll: this.settings.hideOnScroll,
			hideOnResize: this.settings.hideOnResize,
			window: this.settings.window,
			keycodeTranslator: null,
			keyDownHandler: function(code, event) { 
				switch(code) {
					case 37: 
						if ( !jQuery.pp.modifierPressed(event) ) {
							self.renderCalendar('-M');
							return false;
						}
						break;
						
					case 39: 
						if ( !jQuery.pp.modifierPressed(event) ) {
							self.renderCalendar('+M');
							return false;
						}
						break;
				}
				return true;	
			}
		});			

		this.pad.bind('value', function(event, value) {
			self.cal.setSelectedDate(value);			
			self.display();
		});			

		this.display();
	}

	constructor.prototype = {

		adjustCalendar: function(options) {
			this.cal.setDates(options);
		},

		renderCalendar: function(w) {
			var r = this.cal.render(w);
			var h = this.settings.hiddenClass;
			this.box.html( $.pp.format(this.settings.html, r.month, r.year, r.prevMonth ? '':h,  r.nextMonth ? '':h, r.calendar, r.prevYear ? '':h, r.year-1, r.nextYear ? '':h, -(-r.year-1)) );
			this.elem = this.box.find('td, a');
			this.popup.addElemHandlers();
		},

		change: function() {
			var target = $(arguments[1]),
				date = target.attr('data-pp-date');
			this.cal.setSelectedDate(date);
			this.display(date, true);
		},

		display: function(date, user) {
			date = date || this.cal.selectedDate.asString();
			if ( this.settings.target ) {
				$(this.settings.target).text( date );
			}
			if ( this.settings.onChange ) {
				this.settings.onChange.call(this, date, user);
			}
		},
	
		selected: function() {
			var target = $(arguments[1]),
				s = this.settings;
			if ( 'TD' == target.prop('tagName') ) {
				if ( !target.hasClass(s.disabledClass) ) {
					return true;
				}
			} else if ( target.hasClass(s.nextMonthClass) ) {
				this.renderCalendar('+M');
			} else if ( target.hasClass(s.prevMonthClass) ) {
				this.renderCalendar('-M');
			} else if ( target.hasClass(s.nextYearClass) ) {
				this.renderCalendar('+Y');
			} else if ( target.hasClass(s.prevYearClass) ) {
				this.renderCalendar('-Y');
			}
			return false;
		},

		focus: function(elem) {
			$(elem).addClass(this.settings.hoverClass);
		},

		blur: function() {
			this.elem.removeClass(this.settings.hoverClass);
		},
		
		show: function() {
			this.renderCalendar();			
			this.popup.addEventHandlers();
			this.box.ppWithLayout(function() {
				this.box.ppPositionAsDropbox(window, this.pad);
			}, this);			
			this.pad.addClass(this.settings.activeClass);
			this.box.addClass(this.settings.activeClass).show();
		},

		hide: function() {
			this.pad.removeClass(this.settings.activeClass);
			this.box.removeClass(this.settings.activeClass).hide().empty();
		},
		
		pluginMethods : {
			//set: function(val) { 
			set: function() { 
				args = Array.prototype.slice.call(arguments)			
				return this.each(function() {
					$(this).trigger('value',  args);
				});
			},

			init : function( constructor, options ) {
				options = options || {};
				return this.each(function() {
					new constructor($(this), options);
				});
			}

			
		}

	};

	return constructor;
	
})(); 
jQuery.pp.register(handler, this[handler]);
}('calendarpopup');

