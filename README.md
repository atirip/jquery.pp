


### Common (jquery.pp.js)

Contains common code for all other modules. Using any module requires jquery.pp.js 

#### Small utilities

__id()__ creates running number id
__modifierPressed(event)__ true if modifier key was presses
__format(str, arguments)__ format("this {0} poor man {1} sprintf", "is", "simple") returns "this is poor man simple sprintf".

#### Dimensions

Theres a lot of various width's/height's we can query:
$().width()
$().outerWidth()
$().prop('clientWidth')
$().prop('offsetWidth')
	
The sole meaningful of tjem are width() and outerWidth(), which give you _real_ inner and outer width, but it is not
easy to _set_ them, so I wrote methods which in get mode encapsulate jQuery ones, but in set mode sets correct values
_reagerdless_ of box model used.

__$(selector).ppBoxModel()__ returns 'border-box' or 'content-box'
__$(selector).ppOuterWidth()__
__$(selector).ppInnerWidth()__
__$(selector).ppOuterHeight()__
__$(selector).ppInnerHeight()__

Use them as JQuery (outer)width/(outer)height 

__$(selector).ppFitInto(selector, margins)__ 

adjust _this_ size so it fits exactly inside _selector_ 
	<selector>
		<this style= width 100%, height 100%>
		</this>
	</selector>

	
__$(selector).ppEmbrace(selector, margins)__ 

adjust _this_ size so _selector_ fits exactly inside _this_
	<this>
		<selector>
		</selector>
	</this>


__$(selector).ppEqual(selector, margins)__ 

makes _this_ and _selector_ same size


__$(selector).ppCss(arguments)__

Wrapper of jQuery .css(), adds support for innerWidth, innerHeiht, outerWidth, outerHeight pseudo css values.


__$(selector).ppIsInside(outer)__

if _this_ is completely inside _outer_


__$(selector).ppIsOverlapping(selector)__

if _this_ and _selector_ overlap


__$(selector).ppWithLayout(callback, context)__

if _this_ is not visible (f.e display:none), allows temporarily to restore _this_ dimensions and in callback to do something with it, pass context if you wish to change callbacks this.


__$(selector).ppDimensions(margins)__

returns _this_ dimensions as following { top: , left: , right: , bottom: , width: , height:  }, NB! top & left are $.offset() ( not $.posiyion() )


__$(selector).ppPosRelativeTo(p, where, box)__

p - at which direction (jQuery.pp.verticalProperties or jQuery.pp.horizontalProperties)
where - float that specifies position

returns coordinate for _this_ to be placed according to the _box_

Example for some and meaningful values for when p = jQuery.pp.horizontalProperties:
 -1 _this_ right edge touches _box_ left edge
 0 _this_ left edge touches _box_ left edge
 0.5 _this_ and box are horizontally centered
 1 _this_ right edge touches _box's_ right edge
 2 _this_ left edge touches _box's_ right edge


__$(selector).ppFitBoxTo(viewport, box, options)__

Higher order positioning function.
Position _box_ inside _viewport_ accoording to _options_ which may be (shown are defaults):

	v: true - vertical or horizontal
	where: 2, - where as in ppPosRelativeTo
	flip: function(p) { 
		return 1 - p; 
	}, - function which calculates alternative _where_ when _box_ does not fit fully in _viewport_ default is to flip to the other side
	adjust: true - in flipped _box_ still does not fit, do we adjust its size to fit
	
	 

__$(selector).ppPositionAsDropbox(viewport, box, options )__

Positions box inside viewport as dropbox.
- first drops down
- if it does not fit fully then tries to position up
- if still does not fit, then adsjusts size
- first tries to align left's
- if it does not fit, flips and tries to adjust right's

#### jQuery plugins register

Standardized method to add jQuery plugins for jquery.pp. The real and main purpose of doing that is to allow communication between all jquery.pp UI plugins. I created this when I needed to have custom scrollbar support on custom select and event handlers started to clash (as long as you click on scrollbar, those click need not to affect select himself f.e).

__Basic jquery.pp module pattern:__

+function(handler){ this[handler] = (function() {
	var variable = null;

	function constructor(element, options, ...) {
		// plugins constructor
		…
		// optional
		var self = this;
		$(element).bind('myevent', function(event) {
			self.publicBar(...);
		});
	}
	function privateFoo() {
		// optional private function 
		variable = ...;
	}
	constructor.prototype = {		publicBar: function(...) {
			....
			privateFoo();
			...
		},
		// required class of plugins Methods
		pluginMethods : {
		
			// optional
			foo: function() { 
				// plugin method
				var args = Array.prototype.slice.call(arguments);	
				return this.each(function() {
					$(this).trigger('myevent',  args);
				});
			},
			
			// required
			init : function( constructor, options, ... ) {
				// plugins constructor
				options = options || {};
				return this.each(function() {
					new constructor($(this), options, ...);
				});
			}
		}
	};
	return constructor;
})(); 
jQuery.pp.register(handler, this[handler]);
}('myplugin'); // the name of the plugin which will be Sentensecased for name so MyPluGin here connverts yo ppMyplugin

And afterwards you call your plugin like this:

to init: __$(selector).ppMyplugin(options)__
to call plugin method(s): __$(selector).ppMyplugin('foo', options)__

Please notice that created class instance is stored in nowhere (or "lives" in closure), so to access some property later on you must do this with custom event, exactly like in this example code: add event handler (myevent) to pad and define plugin method that triggers this event.


#### Popup Handler

Handles events for jquery.pp popup's. A popup combo consists 2 mandatory DOM elements: 
_pad_ - something to click to activate popup, pad must exists in DOM 
_box_ - the popped up box, may not exist, can (and mostly is) be dynamically created inside of popup's constructor
third, optional, one: 
_elem_ - is collection of elements in the box which can be clicked, can be created dynamically

Popuphandler handles events for mouse and for touch devices - which behave differently.

__Mouse device__
	- mousedeown event on the pad activates box immediately
	- mousedrag event while button is pressed down overs over elem (which receive mouseover events) and when button is released, fires select event, popup closes
	- mouseup event after mousedown event (no mousemove) on the pad and following mouse over over elem fires mouseover events on elem. Click on elem fires select event, popup closes
	- click event on pad toggles box
	- click outside of pad or box closes box
	- window resize closes box
	- window scroll optionally closes box
	- has basic keyboard support (esc to close, enter to select, up-down to move between elem)

__Touch device__
	- only tuouchend without touchmove opens box, touchstart and then touchmove on pad does nothing, 
	- no mouseover events fired on elem
	- click on pad toggles
	- click ouside pad or box closes box
	- window resize closes box
	- window scroll optinally closes box

Popup handler calls predefined methods of actual popup plugin:

Required:
__show()__ called when popup needs to be shown

__hide()__ called when popup needs to be hidden

Optional:
__focus(elem)__ called when elem is hovered or selected with keyboard, expected behaviuor is popup plugin to highlight that elem

__blur()__ called always before focus, expected behaviour is to blur _all_ elem in popup box

__change()__ called when box is closed with selection made, notice that popup handler dos not know what elem is choosen

__selected()__ called when handler needs to know focused/selected/current elem, expected behaviour is to return $(that elem)

__scroll()__ called when focus changes, expected bahaviour is to scroll the popup box (if needed) so the newly selected elem becomes fully visible

__prev()__ called when up key is pressed, expected bahaviour is to return $(next elem) of currently focused elem or $(empty)

__next()__ called when down key is pressed, expected bahaviour is to return $(prev elem) of currently focused elem or $(empty)


Simple demo code how one makes a fully working popup plugin using basic pattern described above.

In constructor I create box, attach it to the <body> tag and initialize handler. Then I add requied methods. In show I create some divs as list inside box, call popupHandler to add event handlers to the box, position that box next to pad and show it.

function constructor(pad, options, ...) {
	this.settings = $.extend({
		hoverClass = 'hover'
	}, options || {});
	this.pad = $(pad);	
	this.box = $('<div style="position:absolute;" id="' + $.pp.id()'"></div>').appendTo('body');					
	this.elem = null;		
	this.popupHandler = new jQuery.pp.popupHandler(this);		
}

constructor.prototype = {
	show: function() {
		this.box.html( '<div></div><div></div><div></div>' );
		this.elem = this.box.children();
		this.popupHandler.addEventHandlers();
		this.box.ppWithLayout(function() {
			this.box.ppPositionAsDropbox(window, this.pad);
		}, this);
		this.box.show();
	},

	selected: function() {
		return this.box.find('.' +  this.settings.hoverClass);
	},
	focus: function(elem) {
		$(elem).addClass(this.settings.hoverClass);
	},
	blur: function() {
		this.elem.removeClass(this.settings.hoverClass);
	},
	change: function() {
		var selected = this.selected();
	},
	hide: function() {
		this.pad.removeClass(this.settings.activeClass);
		this.box.hide().empty();
	},		
}

Thats minimum needed to create a very simplepopup.

### Simple Select Popup (jquery.pp.selectpopup.js)

Mimics html <select>. 

Options with their default values:
	prefix: "pp-"
		prefix for the classes below 
	activeClass: "active"
		class added to pad & box when popped up
	hoverClass: "hover"
		class added to elem when hovered
	boxClass: "popup"
		class added to box
	selectClass: "select"
		class added to every elem
	selectedClass: "selected" 
		added to elem which is selected initally when box pops up
	selected: 0
		no of elem initially selected 
	options: []
		array of options as in <option>foo</option> 
	values: []
		array of option values as in <option value=foo>
	appendTo: 'body'
		jquery selector of tag to which box is to be appended
	hideOnScroll: false
		close box when window scrolls
	hideOnResize: true
		close box when window resizes
	window: null
		selector which resize & scroll events to observe, default is window
	target: null
		selector of DOM element (child of pad or pad itself) which contains just the text of current selection. 
	onChange: function(selected value, selected text) {} 
		callback which called if user selected something different of current selection
	html: '<div class="{0}" data-value="{1}"><nobr>{2}</nobr></div>' 
		elem html template


### Simple Calendar Popup (jquery.pp.calendarpopup.js)

#### Calendar

What's left of Kevin Luck's original datepicker. I did need only essential calendar rendering functions from it.

calendar = new __jquery.pp.calendar__({
	selected: ...,
	month: undefined,
	year: undefined,
	startDate: undefined,
	endDate	: undefined,
	monthFormat: 'mmmm',
	yearFormat: 'yyyy',
	cellspacing: 2,			
	calendarClass: 'calendar',
	todayClass: 'today',
	disabledClass: 'disabled',
	otherClass: 'other'			
})

functions are pretty self explanatory

__setDates__({
	month:  ...,
	year: ...,
	startDate: ...,
	endDate	: ...					
})

__renderCalendar(month, year)__

renders calendar as HTML table like this (yes, without any mandatory end-tags)

<table cellspacing="2" class="calendar">
	<thead>
		<tr>
			<th title="Monday">M
			<th title="Tuesday">T
			....
		
	<tbody>
		<tr>
			<td data-pp-date="30.01.2012" class="other">30
			<td data-pp-date="31.01.2012" class="other">31
			<td data-pp-date="01.02.2012" >1
			<td data-pp-date="02.02.2012" class="today">2
			<td data-pp-date="03.02.2012" class="disabled">3
			...
</table>

__render(what)__

where what is 
	'undefined' for month, year specifed in options or setDates or current month, or
	'+M', '-M', '+Y', '-Y' for paging rendering by months or years ( +M - render +one month of current month)
	
	return {
		month: formatted (options.monthFormat) month string,
		year: formatted (optons.yearFormat) year string,

		prevMonth: if allowed then '-M' 
		nextMonth: if alloved then '+M'
		prevYear:  if allowed then '-Y'
		nextYear: if allowed then '+Y'
		
		calendar: renderCalendar() output
	}

	#### Calendar Popup
	
Options with their default values:
			activeClass: "active"
				class added to pad & box when popped up
			hoverClass: "hover"
				class added to date when hovered
			boxClass: "popup",				class added to box
			nextMonthClass: "nav-next-month"
			prevMonthClass: "nav-prev-month",			nextYearClass: "nav-next-year",			prevYearClass: "nav-prev-year",
				classes of next-prev buttons 
			disabledClass: 'disabled',				class of dates which cannot be selected
			hiddenClass: 'hidden',
				class of prev-hav buttons that cannot be pressed
			calendarClass: 'calendar',				class on calendar <table>
			todayClass: 'today',
				class of today
			otherClass: 'other'				class of dates of not the displayed month
			onOpen: function() { return {}; },	
				called when popup is created, return class of options
			onChange: function(date choosen) {}
			appendTo: 'body',			hideOnScroll: false,			hideOnResize: true,
			window: null,
			prefix: "pp-",						html: 
				same as in Simple Select Popup

		
	