courier(function(){
	
	if(typeof window !== "undefined" && window.QUnit) {
		QUnit.deepEqual(courier.config("bundle"),["foo"], "read back bundle");
		
		QUnit.start();
		removeMyself();
	} else {
		console.log("basics loaded", module);
	}
	
});
