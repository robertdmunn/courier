	if (typeof window != 'undefined') {
		var oldCourier = window.courier;
		window.courier = makeCourier(System);
		window.courier.startup(oldCourier && typeof oldCourier == 'object' && oldCourier  );
		window.courier.addCourier = addCourier;
		
	} else {
    	
		require('systemjs');
			
		global.courier = makeCourier(System);
		global.courier.System = System;
		global.courier.dev = require("./dev.js");
		courier.clone = makeCourier;
		module.exports = global.courier;
		global.courier.addCourier = addCourier;
	}
    
    
})(typeof window == "undefined" ? global : window);