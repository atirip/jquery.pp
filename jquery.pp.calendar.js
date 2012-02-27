/**
 * Copyright (c) 2008 Kelvin Luck (http://www.kelvinluck.com/)
 * Dual licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) 
 * and GPL (http://www.opensource.org/licenses/gpl-license.php) licenses.
 * .
 * $Id: jquery.datePicker.js 103 2010-09-22 08:54:28Z kelvin.luck $
 * 
 * THIS is what's left of Kevin Luck's original datepicker (not much, only bare essentials I needed) .... but I don't mind of original copyright notice 
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
			cellspacing: 2			
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

 
