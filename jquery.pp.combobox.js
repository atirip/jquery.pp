

/*combobox*/
+function(handler){ this[handler] = (function() {

	var U, eventName; // utility functions namespace

	function constructor() {
		eventName = '.' + this.N;
		U = this.U;
		this.lastSearch = null;
		this.lastInputValue = null;
		this.init.apply(this, arguments);
	}

	function selectFirstItem() {
		this.lastInputValue = this.input.val();
		this.elem.removeClass( this.settings.hoverClass).first().addClass( this.settings.hoverClass);
	}

	function setInputValue(jObj, value) {
		if ( this.settings.setInputValueCallback ) {
			return this.settings.setInputValueCallback(jObj, this.input, value);
		} else {
			var newValue = null == value ? jObj.text() : value;
			if ( this.input.val() != newValue ) {
				// setting new input value will move caret to the end, so do this only when real change
				this.input.val(newValue);
			}
			return newValue;
		}
	}

	function changeInput() {
		var value = null;
		if ( 1 == arguments.length ) {
			value = arguments[0];
		}
		this.lastSearch = setInputValue.call(this, this.selected(), value);
//		this.lastSearch = this.input.val();
//		this.lastSearch = getInputValue.call(this);
	}
			
	function getInputValue() {
		if ( this.settings.getInputValueCallback ) {
			return this.settings.getInputValueCallback(this.input);
		} else {
			return this.input.val();
		}
	}	

	function hide() {
		this.box.hide();
		this.lastSearch = null;
		this.box.children().remove();
		this.input.blur();

		this.settings.dropdownHiddenCallback && this.settings.dropdownHiddenCallback.call(this);

	}
	
	function renderListItem(i, data) {
		if ( this.settings.renderListItemCallback ) {
			return this.settings.renderListItemCallback.call(this, i, data);
		} else {
			return '<div class="'+this.settings.elementClass+'"><nobr>' + U.htmlEscape(data.content) + '</nobr></div>';
			/*return '<div class="'+this.settings.elementClass+'"><nobr>' + U.htmlEscape(data.content) + '</nobr><div></div></div>';*/
		}
	}

	
	constructor.prototype = {

		init:function(input, options) {

			this.input = input;

			// avoid duplicate installs
			if ( this.input.attr('data-' + this.N + '-id') )
				return;

			this.id = U.id();
			this.input.attr('data-' + this.N + '-id', this.id);

			
			this.settings = {
				selectFirstResult: true,
				dataCallback: null,
				submitCallback: null,
				delay: 500, /*delay before search of autocmplete items*/

				hoverClass: window.K.kurat + '-dropdown-hover',
				boxClass: window.K.kurat + '-combobox',
				elementClass: window.K.kurat + '-combobox-item',
				
				dropdownSetupCallback: null,
				dropdownElementSetupCallback: null,

				dropdownShownCallback: null,
				dropdownHiddenCallback: null,
				
				renderElementCallback: null,
				setInputValueCallback: null,
				getInputValueCallback: null,

				window: null
			};
			( options ) && $.extend( this.settings, options );

			this.window = this.settings.window || window;

			this.input.attr("autocomplete", "off");

			this.changed = false;

			this.popup = new kurat.ui.popupHandler(this);
			this.popup.addKeybHandlers();


			var self = this;

			this.dropdownThrottle = (function() {
			}).throttle(self.settings.delay, {
				after: function() { 
					var val = jQuery.trim(arguments[0]);
					if ( val.match(/\S/)  ) {
						if ( self.lastSearch != val) {
							self.settings.dataCallback(val, function(data) {
								self.dropDown.call(self, data);
							}, self.input);
							self.lastSearch = val;
						}
					} else {
						self.dropDown.call(self, []);
						self.lastSearch = null;
					}
				}
			});

			this.input.keydown(function(event){
				if ( self.lastSearch != $.trim($(this).val()) ) {
					self.box && self.blur();
				}
			});

			this.input.keyup(function(event){
				if ( $.inArray(event.which, [38, 40]) > -1 )
					return;
				self.dropdownThrottle($(this).val());
			});
			
			this.input.bind(U.downStartEvent, function(event) {
				if ( !U.modifierPressed(event) )
					event.stopPropagation();
			});

			this.input.bind(U.upEndEvent, function(event) {
				if ( !U.modifierPressed(event) )
					event.stopPropagation();
			});

			this.input.bind('focus', $.proxy( function() {
				if ( this.elem && this.elem.length && !this.box.is(':visible') ) {
					this.popup.show();
					this.settings.dropdownShownCallback && this.settings.dropdownShownCallback.call(this);
					//selectFirstItem.call(this);
				} 
			}, this) );			
			
			
			this.input.bind('clear', function() {
				self.dropDown.call(self, []);
				self.lastSearch = null;
				self.lastInputValue = self.lastSearch;
			});
			
			this.input.bind('submit', function() {
				if ( U.empty(self.input.val()) )
					return;

				var selected = self.box.find('.' +  self.settings.hoverClass);

				/*
				if ( self.settings.selectFirstResult && self.elem && self.elem.length ) {
					// special case if input val MAY not be first result
					var prev = selected.prev();
					if ( 0 == prev.length ) {
						// we are indeed on first, so force it
						setInputValue.call(self, self.elem.first());
					}
				}
				*/
				return self.settings.submitCallback.call(self, getInputValue.call(self), selected.length );
			});

		},
		
		show: function() {
			var self = this;
			this.box.krtWithLayout(function() {
				self.positioner.setPosAsDropbox('toBottom', 0, {elem: 'noflip'});
			}).show();
			
			this.settings.dropdownShownCallback && this.settings.dropdownShownCallback.call(this);

		},

		hide: function() {
			this.box && this.box.hide();
			
			this.settings.dropdownHiddenCallback && this.settings.dropdownHiddenCallback.call(this);
			//console.log('popup hide', arguments.callee.caller);
		},

		change: function() {
			this.changed = true;

			if ( U.empty(this.input.val()) )
				return;
			/*
			if ( this.settings.selectFirstResult && this.elem && this.elem.length ) {
				// special case if input val MAY not be first result
				var prev = this.selected().prev();
				if ( 0 == prev.length ) {
					// we are indeed on first, so force it
					setInputValue.call(this, this.elem.first());
				}
			}
			*/
			return this.settings.submitCallback.call(this, getInputValue.call(this), this.isSelected() );
		},

		focus: function () {
			U.select.prototype.focus.apply(this, arguments);
			changeInput.call(this);
		},

		blur: function () {
			return U.select.prototype.blur.call(this, arguments);
		},

		prev: function() {
			var prev = this.selected().prev();
			if ( 0 == prev.length ) {
				// remove selection from dropdown, restore value
				changeInput.call(this, this.lastInputValue);
				this.lastSearch = this.lastInputValue;
				this.blur();	
				//prev.end().removeClass(this.settings.hoverClass);
				return false;
			} else {
				return U.select.prototype.prev.call(this, arguments);
			}
		},

		next: function() {
			if ( this.elem && this.elem.length && !this.box.is(':visible') ) {
				this.popup.show();
				this.settings.dropdownShownCallback && this.settings.dropdownShownCallback.call(this);
				selectFirstItem.call(this);
				return false;
			} 
			
			if ( this.elem && this.elem.length && this.box.is(':visible') && !this.isSelected() ) {
				selectFirstItem.call(this);
				return false;
			}

			return U.select.prototype.next.call(this, arguments);
		},

		scroll: function() {
			return U.select.prototype.scroll.call(this, arguments);
		},

		selected: function() {
			return this.box ? U.select.prototype.selected.call(this, arguments) : [];
		},

		isSelected: function() {
			return U.select.prototype.isSelected.call(this, arguments);
		},

		dropDown: function(data) {
			
			var self = this;

			if ( !this.box ) {
				// create dropdown DIV
				var myId = this.input.prop('id') || this.input.prop('name');					
				this.box = $('<div id="'+myId+'-dropdown" style="outline:none;overflow-x:hidden;overflow-y:auto"></div>').appendTo('body');
				
				this.box.css(
					U.styleDiff(this.box, this.input)
				).krtZeroCss('pm').addClass(this.input.prop("className") + ' ' + this.settings.boxClass).krtEraseClassDefinedStyles();


				this.box.css({position: 'absolute', display: 'none'}).krtEraseBrowserSpecificStyles();

				// to finetune dropdown, use thiscallback
				this.settings.dropdownSetupCallback && this.settings.dropdownSetupCallback.call(this);

				var customScrollbars = ("createTouch" in document) ? false : !("webkitTransform" in document.documentElement.style) && !!kurat.ui.systemScrollbarWidth();
				var params = !customScrollbars ? {} : {
					addScrollbarsCallback : function() {
						self.box.krtScrollbar({disableWheelOnBar: true});
					},
					adjustScrollbarsCallback : function(scrollTop) {
						self.box.krtScrollbar('redraw').krtScrollbar('content').scrollTop(scrollTop);
					}
				};
				
				this.positioner = new kurat.ui.positioner(this.input, this.box, params);
			}

			this.box.children().remove();

			if ( !this.changed ) {
				var s = '';
				for(var i= 0, l= data.length; i< l; i++) {
					s += renderListItem.call(this, i, data[i]);
				}
				this.box.append(s);
			}
			this.changed = false;

			this.elem = this.box.children();


			if ( this.elem.length ) {

				this.box.krtWithLayout(function() {
				
					self.box.krtEqual(self.input);

					self.elem.css( 
						U.styleDiff(self.elem.first(), self.input)
					).krtEraseBrowserSpecificStyles().addClass(self.input.prop("className")).krtEraseClassDefinedStyles().krtZeroCss('mbrs').css({
						top:0, left:0,
						position: 'relative', overflowX: 'hidden', overflowY: 'hidden', height: 'auto'
					}).krtOuterWidth( self.box.innerWidth() );
					//}).krtFitInto(self.box);

				});


				this.elem.first().addClass(this.settings.elementClass + '-first').krtEraseClassDefinedStyles();		
				this.elem.last().addClass(this.settings.elementClass + '-last').krtEraseClassDefinedStyles();
				this.settings.selectFirstResult && selectFirstItem.call(this);
				
				this.positioner.reset();
				this.popup.addBoxHandlers(false).addElemHandlers().show();

				this.settings.dropdownShownCallback && this.settings.dropdownShownCallback.call(this);
				
			} else {
				this.popup.hide();
				this.settings.dropdownHiddenCallback && this.settings.dropdownHiddenCallback.call(this);
			}
		},
 
		pluginMethods : { 
			init : function( constructor, options ) {
				options = options || {};
				return this.each(function() {
					new constructor($(this), options);
				});
			}

		}
		
	};

	return constructor;
	
})(); // end of class definition
kurat.ui.register(handler, this[handler]);
}('combobox');
