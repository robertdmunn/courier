module("courier via system import");

QUnit.config.testTimeout = 30000;

(function(){

	var writeIframe = function(html){
		var iframe = document.createElement('iframe');
		window.removeMyself = function(){
			delete window.removeMyself;
			document.body.removeChild(iframe);
		};
		document.body.appendChild(iframe);
		iframe.contentWindow.document.open();
		iframe.contentWindow.document.write(html);
		iframe.contentWindow.document.close();
	};
	var makePassQUnitHTML = function(){
		return "<script>\
			window.QUnit = window.parent.QUnit;\
			window.removeMyself = window.parent.removeMyself;\
			</script>";

	};
	var makeCourierHTML = function(url, src, code){
		return "<!doctype html>\
			<html>\
				<head>" + makePassQUnitHTML() +"\n"+
					"<base href='"+url+"'/>"+
				"</head>\
				<body>\
					<script "+src+"></script>"+
					(code ? "<script>\n"+code+"</script>" :"") +
				"</body></html>";

	};
	var makeIframe = function(src){
		var iframe = document.createElement('iframe');
		window.removeMyself = function(){
			delete window.removeMyself;
			document.body.removeChild(iframe);
		};
		document.body.appendChild(iframe);
		iframe.src = src;
	};

	asyncTest('courier basics', function(){
		System['import']('tests/module').then(function(m){
			equal(m.name,"module.js", "module returned" );
			equal(m.bar.name, "bar", "module.js was not able to get bar");
			start();
		}, function(err){
			ok(false, "courier not loaded");
			start();
		});
	});

	asyncTest("courier's normalize", function(){
		System['import']('tests/mod/mod').then(function(m){
			equal(m.name,"mod", "mod returned" );
			equal(m.module.bar.name, "bar", "module.js was able to get bar");
			equal(m.widget(), "widget", "got a function");
			start();
		}, function(){
			ok(false, "courier not loaded");
			start();
		});
	});

	asyncTest("courier's normalize with a plugin", function(){
		System.instantiate({
			name: "foo",
			metadata: {format: "courier"},
			source: 'courier("foo/bar!foo/bar", function(){})'
		}).then(function(result){
			equal(result.deps[0], "foo/bar/bar!foo/bar", "normalize fixed part before !");
			start();
		});
	});

	asyncTest("courier's normalize with plugin only the bang", function(){
		System.instantiate({
			name: "foobar",
			metadata: {format: "courier"},
			source: 'courier("./rdfa.stache!", function(){})'
		}).then(function(result){
			System.normalize(result.deps[0], "foo","http://abc.com").then(function(result){
				equal(result, "rdfa.stache!stache", "normalize fixed part before !");
				start();
			});
		});
	});


module("courier via html");

	asyncTest("basics", function(){
		makeIframe("basics/basics.html");
	});

	asyncTest("basics with generated html", function(){
		writeIframe(makeCourierHTML(
			"basics/basics.html",
			'src="../../courier.js?basics" data-config="../config.js"'));
	});

	asyncTest("default config path", function(){
		writeIframe(makeCourierHTML(
			"basics/basics.html",
			'src="../courier.js?basics"'));
	});

	asyncTest("default config path", function(){
		writeIframe(makeCourierHTML(
			"basics/basics.html",
			'src="../courier/courier.js?basics"'));
	});

	asyncTest("inline", function(){
		makeIframe("basics/inline_basics.html");
	});

	asyncTest("default bower_components config path", function(){
		writeIframe(makeCourierHTML(
			"basics/basics.html",
			'src="../bower_components/courier/courier.js?basics"'));
	});

	asyncTest("default bower_components without config still works", function(){
		makeIframe("basics/noconfig.html");
	});

	asyncTest("map works", function(){
		makeIframe("map/map.html");
	});

	asyncTest("read config", function(){
		writeIframe(makeCourierHTML(
			"basics/basics.html",
			'src="../../courier.js?configed" data-config="../config.js"'));
	});

	asyncTest("compat - product bundle works", function(){
		makeIframe("production/prod.html");
	});

	asyncTest("product bundle specifying main works", function(){
		makeIframe("production/prod-main.html");
	});

	asyncTest("automatic loading of css plugin", function(){
		makeIframe("plugins/site.html");
	});

	asyncTest("product bundle with css", function(){
		makeIframe("production/prod-bar.html");
	});

	asyncTest("automatic loading of less plugin", function(){
		makeIframe("dep_plugins/site.html");
	});

	asyncTest("Using path's * qualifier", function(){
		writeIframe(makeCourierHTML(
			"basics/basics.html",
			'src="../courier.js?../paths" data-config="../paths/config.js"'));
	});

	asyncTest("url paths in css work", function(){
		makeIframe("css_paths/site.html");
	});

	asyncTest("ext extension", function(){
		makeIframe("extensions/site.html");
	});

	asyncTest("forward slash extension", function(){
		makeIframe("forward_slash/site.html");
	});

	asyncTest("a courier object in the page before courier.js is loaded will be used for configuration",function(){
		makeIframe("configed/courier_object.html");
	});

})();
