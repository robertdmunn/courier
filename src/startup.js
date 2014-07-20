	var LESS_ENGINE = "less-1.7.0";
	var getScriptOptions = function () {

		var options = {},
			parts, src, query, startFile, env,
			scripts = document.getElementsByTagName("script");

		var script = scripts[scripts.length - 1];

		if (script) {

			// Split on question mark to get query
			parts = script.src.split("?");
			src = parts.shift();

			query = parts.join("?");

			// Split on comma to get startFile and env
			parts = query.split(",");

			if (src.indexOf("courier.production") > -1) {
				options.env = "production";
			}

			// Grab startFile
			startFile = parts[0];

			if (startFile) {
				options.startId = startFile;
			}

			// Grab env
			env = parts[1];

			if (env) {
				options.env = env;
			}

			// Split on / to get rootUrl
			parts = src.split("/");
			var lastPart = parts.pop();

			if(lastPart.indexOf("courier") === 0 && !System.paths["courier/dev"]) {
				options.paths = {
					"courier/*": parts.join("/")+"/*.js",
					"less" :  parts.join("/")+"/"+LESS_ENGINE+".js",
					"@traceur": parts.slice(0,-1).join("/")+"/traceur/traceur.js",
				};
			}

			if ( last(parts) === "courier" ) {
				parts.pop();
				if ( last(parts) === "bower_components" ) {
					parts.pop();
				}
			}

			each(script.attributes, function(attr){
				var optionName = 
					camelize( attr.nodeName.indexOf("data-") === 0 ?
						attr.nodeName.replace("data-","") :
						attr.nodeName );
				options[optionName] = attr.value;
			});
			if(!options.root && !options.baseUrl){
				options.root = parts.join("/")+"/";
			}

			// Set the bundles paths if in production
			if(options.env === "production") {
				var paths = options.paths = options.paths || {};
				var bundlesCSS = "bundles/*.css";
				var bundlesJS = "bundles/*";
				if(!paths[bundlesCSS]) {
					paths[bundlesCSS] = "dist/bundles/*css";
				}
				if(!paths[bundlesJS]) {
					paths[bundlesJS] = "dist/bundles/*.js";
				}
			}
		}

		return options;
	};

	var getOptionsFromCourierLocation = function(){
		var options = {};
		if(typeof __dirname === "string" && !System.paths["courier/dev"]) {
			options.paths = {
				"courier/*": __dirname+"/*.js",
				"@traceur": __dirname.split("/").slice(0,-1).join("/")+"/traceur/traceur.js"
			};
		}

		System.register("less",[], false, function(){
			var r = require;
			return r('less');
		});
		return options;
	};

	courier.startup = function(config){

		// get options from the script tag
		if(global.document) {
			var urlOptions = getScriptOptions();
		} else {
			var urlOptions = getOptionsFromCourierLocation();
		}

		extend(System.ext,{
			css: 'courier/css',
			less: 'courier/less'
		});

		// B: DO THINGS WITH OPTIONS
		// CALCULATE CURRENT LOCATION OF THINGS ...
		courier.config(urlOptions);
		if(config){
			courier.config(config);
		}


		var options = courier.config();
		// Read the env now because we can't overwrite everything yet

		// mark things that have already been loaded
		each(options.executed || [], function( i, stel ) {
			System.register(stel,[],function(){});
		});

		// immediate couriers we do
		var couriers = [];

		// add start files first
		if ( options.startIds ) {
			/// this can be a string or an array
			couriers.push.apply(couriers, isString(options.startIds) ? [options.startIds] : options.startIds);
			options.startIds = couriers.slice(0);
		}

		// we only load things with force = true
		if ( options.env == "production" && courier.System.main ) {

			return appDeferred = courier.System.import(courier.System.main)["catch"](function(e){
				console.log(e);
			});

		} else if(options.env == "development"){

			configDeferred = courier.System.import("courierconfig");

			devDeferred = configDeferred.then(function(){
				// If a configuration was passed to startup we'll use that to overwrite
				// what was loaded in courierconfig.js
				// This means we call it twice, but that's ok
				if(config) {
					courier.config(config);
				}

				return courier.System.import("courier/dev");
			},function(e){
				console.log("courier - error loading courierconfig.",e);
				return courier.System.import("courier/dev");
			});

			appDeferred = devDeferred.then(function(){

				// if there's a main, get it, otherwise, we are just loading
				// the config.
				return courier.System.main ? 
					System.import(courier.System.main):
					configDeferred;
			}).then(function(){
				if(courier.dev) {
					courier.dev.log("app loaded successfully")
				}
			}, function(error){
				console.log("error",error,  error.stack);
			});
			return appDeferred;
		}
	};

	return courier;

