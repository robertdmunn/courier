var courier = require('../main');


var localCourier =  courier.clone( courier.addCourier( courier.System.clone() ) );

global.courier = localCourier;
global.System = localCourier.System;


localCourier.config({
	config: __dirname+"/node_test_plugins/config.js",
	main: "main"
});

localCourier.startup().then(function(){
	console.log("worked");
},function(e){
	console.log(e);
})
