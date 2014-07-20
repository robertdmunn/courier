/*global  window: false, console: true, opera: true */
//
/**
 * @property courier.dev
 * @parent courierjs
 * 
 * Provides helper functions for development that get removed when put in production mode.
 * This means you can leave <code>courier.dev.log("hello world")</code> in your code and it
 * will get removed in prodution.
 *
 * ## Examples
 * 
 *     courier.dev.log("Something is happening");
 *     courier.dev.warn("Something bad is happening");
 * 
 */
(function(){
var dev = {
	regexps: {
		colons: /::/,
		words: /([A-Z]+)([A-Z][a-z])/g,
		lowerUpper: /([a-z\d])([A-Z])/g,
		dash: /([a-z\d])([A-Z])/g
	},
	underscore: function( s ) {
		var regs = this.regexps;
		return s.replace(regs.colons, '/').
		replace(regs.words, '$1_$2').
		replace(regs.lowerUpper, '$1_$2').
		replace(regs.dash, '_').toLowerCase();
	},
	isHappyName: function( name ) {
		//make sure names are close to the current path
		var path = courier.cur().path.replace(/\.[^$]+$/, "").split('/'),
			//make sure parts in name match
			parts = name.split('.');
		
		for ( var i = 0; i < parts.length && path.length; i++ ) {
			if (path[i] && parts[i].toLowerCase() != path[i] && this.underscore(parts[i]) != path[i] && this.underscore(parts[i]) != path[i].replace(/_controller/, "") ) {
				this.warn("Are you sure " + name + " belongs in " + courier.cur().path);
			}
		}
		
		
	},

	logLevel : 0,
	/**
	 * @function courier.dev.warn
	 * @parent courier.dev
	 * 
	 * @signature `courier.dev.warn(out)`
	 * @param {String} out the message
	 *
	 * @body
	 * Adds a warning message to the console.
	 * 
	 *     courier.dev.warn("something evil");
	 * 
	 */
	warn: function( out ) {
		var ll = courier.config().logLevel;
		if(ll < 2){
			Array.prototype.unshift.call(arguments, 'courier.js WARN:');
			if ( window.console && console.warn ) {
				this._logger( "warn", Array.prototype.slice.call(arguments) );
			} else if ( window.console && console.log ) {
				this._logger( "log", Array.prototype.slice.call(arguments) );
			} else if ( window.opera && window.opera.postError ) {
				opera.postError("courier.js WARNING: " + out);
			}
		}
		
	},
	/**
	 * @function courier.dev.log
	 * @parent courier.dev
	 * 
	 * @signature `courier.dev.log(out)`
	 * @param {String} out the message
	 *
	 * @body
	 * Adds a message to the console.
	 * 
	 *     courier.dev.log("hi");
	 * 
	 */
	log: function( out ) {
		var ll = courier.config().logLevel;
		if (ll < 1) {
			if (window.console && console.log) {
				Array.prototype.unshift.call(arguments, 'courier.js INFO:');
				this._logger( "log", Array.prototype.slice.call(arguments) );
			}
			else if (window.opera && window.opera.postError) {
				opera.postError("courier.js INFO: " + out);
			}
		}
	},
	_logger:function(type, arr){
		if(console.log.apply){
			console[type].apply(console, arr)
		} else {
			console[type](arr)
		}
	} 
};
	if(typeof courier !== "undefined") {
		courier.dev= dev;
	} else {
		module.exports = dev;
	}
})();
