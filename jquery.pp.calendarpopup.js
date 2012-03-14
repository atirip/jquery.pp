/**
 * Copyright (c) 2008 Kelvin Luck (http://www.kelvinluck.com/)
 * Dual licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) 
 * and GPL (http://www.opensource.org/licenses/gpl-license.php) licenses.
 * .
 * $Id: jquery.datePicker.js 103 2010-09-22 08:54:28Z kelvin.luck $
 * 
 * THIS class is what's left of Kevin Luck's original datepicker (not much, only bare essentials I needed) .... but I don't mind of original copyright notice 
 * Priit Pirita, atirip@yahoo.com
*/

('undefined' == typeof jQuery.pp) && (jQuery.pp = {});

jQuery.pp.calendar = (function() {

	function constructor(options) {

		this.settings = jQuery.extend({
			selected: undefined,
			month: undefined,
			year: undefined,
			startDate: undefined,
			endDate	: undefined,
			showHeader: 1,
			shortHeader: 1,
			monthFormat: 'mmmm',
			yearFormat: 'yyyy',
			cellspacing: 2,
			calendarClass: 'calendar',
			todayClass: 'today',
			disabledClass: 'disabled',
			otherClass: 'other'			
		}, options || {} );

		this.displayedMonth = this.settings.month;
		this.displayedYear = this.settings.year;

		this.startDate = undefined;
		this.endDate = undefined;
		
		this.setStartDate(this.settings.startDate);
		this.setEndDate(this.settings.endDate);		
		this.setSelectedDate(this.settings.selected);
		this.setDisplayedMonth(this.displayedMonth, this.displayedYear);
	}
	
	constructor.prototype = {
	
		// mean't to be used afterwards
		setDates: function(options) {
			options = $.extend({
				month: this.displayedMonth,
				year: this.displayedYear,
				startDate: this.startDate,
				endDate	: this.endDate					
			}, options);			
			this.setStartDate(options.startDate);
			this.setEndDate(options.endDate);		

			if (this.endDate.getTime() < this.startDate.getTime()) {
				this.endDate = this.startDate;
			}
			this.setDisplayedMonth(options.month, options.year);
		},

		setDate : function(d, t, c) {
			if ( d ) {
				if (d instanceof Date) {
					this[t] = d;
				} else {
					this[t] = Date.fromString(d);
				}
			}
			if ( !this[t] ) {
				this[t] = c.call(this);
			}
		},

		
		setStartDate : function(d) {
			this.setDate(d, 'startDate', function() { return (new Date()).zeroTime(); });
		},
		
		setEndDate : function(d){
			this.setDate(d, 'endDate', function() { return new Date('12/31/2999'); });
			if (this.endDate.getTime() < this.startDate.getTime()) {
				this.endDate = this.startDate;
			}
		},

		setSelectedDate : function(d) {
			this.setDate(d, 'selectedDate', function() { return undefined; });
			if ( this.selectedDate ) {
				this.selectedDate = (new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth(), this.selectedDate.getDate(), 0, 0, 0));
			}
			return this.selectedDate;
		},

		setDisplayedMonth : function(m, y) {		
			if (this.startDate === undefined || this.endDate === undefined) {
				return;
			}
			
			var s = new Date( this.startDate.getTime() ),
				e = new Date( this.endDate.getTime() ),
				t;

			s.setDate(1);
			e.setDate(1);
			
			if ((!m && !y) || (isNaN(m) && isNaN(y))) {
				// no month or year passed - default to current month
				t = new Date().zeroTime();
				t.setDate(1);
			} else if (isNaN(m)) {
				// just year passed in - presume we want the displayedMonth
				t = new Date(y, this.displayedMonth, 1);
			} else if (isNaN(y)) {
				// just month passed in - presume we want the displayedYear
				t = new Date(this.displayedYear, m, 1);
			} else {
				// year and month passed in - that's the date we want!
				t = new Date(y, m, 1);
			}
			// check if the desired date is within the range of our defined startDate and endDate
			if (t.getTime() < s.getTime()) {
				t = s;
			} else if (t.getTime() > e.getTime()) {
				t = e;
			}
			this.displayedMonth = t.getMonth();
			this.displayedYear = t.getFullYear();

		},

		render: function(w) {
			switch(w) {
				case '-M':
					if (!(this.displayedYear == this.startDate.getFullYear() && this.displayedMonth <= this.startDate.getMonth())) {
						this.setDisplayedMonth(this.displayedMonth - 1, this.displayedYear);
					}
					break;
					
				case '+M':
					if (!(this.displayedYear == this.endDate.getFullYear() && this.displayedMonth >= this.endDate.getMonth())) {
						this.setDisplayedMonth(this.displayedMonth + 1, this.displayedYear);
					}
					break;
					
				case '-Y':
					if (this.displayedYear > this.startDate.getFullYear()) {
						this.setDisplayedMonth(this.displayedMonth, this.displayedYear - 1);
					}
					break;
					
				case '+Y':
					if (this.displayedYear < this.endDate.getFullYear()) {
						this.setDisplayedMonth(this.displayedMonth, this.displayedYear + 1);
					}
					break;
					
				default:
					//today
			}
			return {
				month: new Date(this.displayedYear, this.displayedMonth, 1).asString(this.settings.monthFormat),
				year: new Date(this.displayedYear, this.displayedMonth, 1).asString(this.settings.yearFormat),

				prevMonth: this.displayedYear == this.startDate.getFullYear() && this.displayedMonth <= this.startDate.getMonth() ? '' : '-M',
				nextMonth: this.displayedYear == this.endDate.getFullYear() && this.displayedMonth >= this.endDate.getMonth() ? '' : '+M',

				prevYear: this.displayedYear > this.startDate.getFullYear() ? '-Y' : '',
				nextYear: this.displayedYear < this.endDate.getFullYear() ? '+Y' : '',
				calendar: this.renderCalendar(this.displayedMonth, this.displayedYear)
			};
		},

		renderCalendar: function(month, year) {

			var s = this.settings,
				str = '<table cellspacing=' + s.cellspacing + ' class="' + s.calendarClass +'">', 
				i;
				
			if (this.settings.showHeader > 0 ) {	
				str += '<thead><tr>';
				for (i = Date.firstDayOfWeek; i < Date.firstDayOfWeek + 7; i++) {
					var weekday = i % 7,
						day = Date.dayNames[weekday];			
					str += jQuery.pp.format('<th title={0}>{1}', day, this.settings.shortHeader ? day.substr(0, 1) : day);
				}
			}

			str += '<tbody>';
			
			var today = (new Date()).zeroTime();
			today.setHours(12);			
			month = month === undefined ? today.getMonth() : month;
			year = year || today.getFullYear();			
			
			var currentDate = (new Date(year, month, 1, 0, 0, 0)),				
				firstDayOffset = Date.firstDayOfWeek - currentDate.getDay() + 1;
			if (firstDayOffset > 1) { 
				firstDayOffset -= 7; 
			}
			var weeksToDraw = Math.ceil(( (-1 * firstDayOffset + 1) + currentDate.getDaysInMonth() ) / 7);
			currentDate.addDays(firstDayOffset - 1);

			var w = 0, thisMonth,
				selTime = this.selectedDate ? this.selectedDate.getTime() : 0;
			while ( w++ < weeksToDraw ) {
				str += '<tr>';
				for (i = 0; i < 7; i++) {

					thisMonth = currentDate.getMonth() == month;
					str += jQuery.pp.format('<td data-pp-date="{5}" class="{0} {1} {2} {3}">{4}', 
							/*0 this month? */ thisMonth ? '' : s.otherClass, 
							/*1*/ /*thisMonth && currentDate.getTime() == today.getTime() ? s.todayClass : */'', 
							/*2 out of range? */ currentDate < this.startDate || currentDate > this.endDate? s.disabledClass: '',
							/*3 selected date */ selTime == currentDate.getTime() ? s.todayClass : '',
							/*4*/ currentDate.getDate(),
							/*4*/ currentDate.asString() 
					);
					currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()+1, 0, 0, 0);
				}
			}			
			return str + '</table>';
		}
	};

	return constructor;
	
})();

 


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
		this.box = $('<div style="position:absolute; display:none;" id="' + $.pp.id() +'" class="' + this.settings.boxClass + '"></div>').appendTo(this.settings.appendTo);	
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
				var args = Array.prototype.slice.call(arguments);			
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

