(function(global){

	// helpers
	var camelize = function(str){
		return str.replace(/-+(.)?/g, function(match, chr){ 
			return chr ? chr.toUpperCase() : '' 
		});
	},
		each = function( o, cb){
			var i, len;

			// weak array detection, but we only use this internally so don't
			// pass it weird stuff
			if ( typeof o.length == 'number' && (o.length - 1) in o) {
				for ( i = 0, len = o.length; i < len; i++ ) {
					cb.call(o[i], o[i], i, o);
				}
			} else {
				for ( i in o ) {
					if(o.hasOwnProperty(i)){
						cb.call(o[i], o[i], i, o);
					}
				}
			}
			return o;
		},
		map = function(o, cb) {
			var arr = [];
			each(o, function(item, i){
				arr[i] = cb(item, i);
			});
			return arr;
		},
		isString = function(o) {
			return typeof o == "string";
		},
		extend = function(d,s){
			each(s, function(v, p){
				d[p] = v;
			});
			return d;
		},
		dir = function(uri){
			var lastSlash = uri.lastIndexOf("/");
			if(lastSlash !== -1) {
				return uri.substr(0, lastSlash);
			} else {
				return uri;
			}
		},
		last = function(arr){
			return arr[arr.length - 1];
		},
		parseURI = function(url) {
			var m = String(url).replace(/^\s+|\s+$/g, '').match(/^([^:\/?#]+:)?(\/\/(?:[^:@]*(?::[^:@]*)?@)?(([^:\/?#]*)(?::(\d*))?))?([^?#]*)(\?[^#]*)?(#[\s\S]*)?/);
				// authority = '//' + user + ':' + pass '@' + hostname + ':' port
				return (m ? {
				href     : m[0] || '',
				protocol : m[1] || '',
				authority: m[2] || '',
				host     : m[3] || '',
				hostname : m[4] || '',
				port     : m[5] || '',
				pathname : m[6] || '',
				search   : m[7] || '',
				hash     : m[8] || ''
			} : null);
		},
		  
		joinURIs = function(base, href) {
			function removeDotSegments(input) {
				var output = [];
				input.replace(/^(\.\.?(\/|$))+/, '')
					.replace(/\/(\.(\/|$))+/g, '/')
					.replace(/\/\.\.$/, '/../')
					.replace(/\/?[^\/]*/g, function (p) {
						if (p === '/..') {
							output.pop();
						} else {
							output.push(p);
						}
					});
				return output.join('').replace(/^\//, input.charAt(0) === '/' ? '/' : '');
			}

			href = parseURI(href || '');
			base = parseURI(base || '');

			return !href || !base ? null : (href.protocol || base.protocol) +
				(href.protocol || href.authority ? href.authority : base.authority) +
				removeDotSegments(href.protocol || href.authority || href.pathname.charAt(0) === '/' ? href.pathname : (href.pathname ? ((base.authority && !base.pathname ? '/' : '') + base.pathname.slice(0, base.pathname.lastIndexOf('/') + 1) + href.pathname) : base.pathname)) +
					(href.protocol || href.authority || href.pathname ? href.search : (href.search || base.search)) +
					href.hash;
		};


	var filename = function(uri){
		var lastSlash = uri.lastIndexOf("/"),
			matches = ( lastSlash == -1 ? uri : uri.substr(lastSlash+1) ).match(/^[\w-\s\.]+/);
		return matches ? matches[0] : "";
	};
	
	var ext = function(uri){
		var fn = filename(uri);
		var dot = fn.lastIndexOf(".");
		if(dot !== -1) {
			return fn.substr(dot+1);
		} else {
			return "";
		}
	};

	var pluginCache = {};
	
	var normalize = function(name, loader){

		// Detech if this name contains a plugin part like: app.less!courier/less
		// and catch the plugin name so that when it is normalized we do not perform
		// Courier's normalization against it.
		var pluginIndex = name.lastIndexOf('!');
		var pluginPart = "";
		if (pluginIndex != -1) {
			// argumentName is the part before the !
			var argumentName = name.substr(0, pluginIndex);
			var pluginName = name.substr(pluginIndex + 1);
			pluginPart = "!" + pluginName;

			// Set the name to the argument name so that we can normalize it alone.
			name = argumentName;
		} 
		
		var last = filename(name),
			extension = ext(name);
		// if the name ends with /
		if(	name[name.length -1] === "/" ) {
			return name+filename( name.substr(0, name.length-1) ) + pluginPart;
		} else if(	!/^(\w+(?:s)?:\/\/|\.|file|\/)/.test(name) &&
			// and doesn't end with a dot
			 last.indexOf(".") === -1 
			) {
			return name+"/"+last + pluginPart;
		} else {
			if(extension === "js") {
				return name.substr(0, name.lastIndexOf(".")) + pluginPart;
			} else {
				return name + pluginPart;
			}
		}
	};

var makeCourier = function(System){
	
		
	var configDeferred,
		devDeferred,
		appDeferred;

	var courier = function(){
		var args = arguments;
		var afterConfig = function(){
			var imports = [];
			var factory;
			each(args, function(arg){
				if(isString(arg)) {
					imports.push( courier.System['import']( normalize(arg) ) );
				} else if(typeof arg === "function") {
					factory = arg;
				}
			});
			
			var modules = Promise.all(imports);
			if(factory) {
				return modules.then(function(modules) {
			        return factory && factory.apply(null, modules);
			   });
			} else {
				return modules;
			}
		};
		if(courier.config().env === "production") {
			return afterConfig();
		} else {
			// wait until the config has loaded
			return configDeferred.then(afterConfig,afterConfig);
		}
		
	};
	
	courier.System = System;
	courier.parseURI = parseURI;
	courier.joinURIs = joinURIs;
	courier.normalize = normalize;

	// System.ext = {bar: "path/to/bar"}
	// foo.bar! -> foo.bar!path/to/bar
	var addExt = function(loader) {
		
		loader.ext = {};
		
		var normalize = loader.normalize,
			endingExtension = /\.(\w+)!$/;
			
		loader.normalize = function(name, parentName, parentAddress){
			var matches = name.match(endingExtension),
				ext;
			
			if(matches && loader.ext[ext = matches[1]]) {
				name = name + loader.ext[ext];
			}
			return normalize.call(this, name, parentName, parentAddress);
		};
	};

	if(typeof System){
		addExt(System);
	}
	


	// "path/to/folder/" -> "path/to/folder/folder"
	var addForwardSlash = function(loader) {
		var normalize = loader.normalize;

		loader.normalize = function(name, parentName, parentAddress) {
			var lastPos = name.length - 1,
				secondToLast,
				folderName;

			if (name[lastPos] === "/") {
				secondToLast = name.substring(0, lastPos).lastIndexOf("/");
				folderName = name.substring(secondToLast + 1, lastPos);
				name += folderName;
			}
			return normalize.call(this, name, parentName, parentAddress);
		};
	};

	if (typeof System) {
		addForwardSlash(System);
	}

	var configData = {
		env: "development"
	};
	
	courier.config = function(data, value){
		if(isString(data)) {
			var name = data;
			if(arguments.length >= 2) {
				
			} else {
				
				var special = configSpecial[name];
				if(special && special.get) {
					return special.get();
				} else {
					return configData[name];
				}
			}
		} else if(typeof data === "object") {
			data = extend({},data);
			each(configSpecial, function(special, name){
				if(special.set && data[name]){
					var res = special.set(data[name]);
					if(res !== undefined) {
						configData[name] = res;
					} 
					delete data[name];
					
				}
			});
			
			extend(configData, data);
			
		} else {
			var config = {};
			
			each(configSpecial, function(special, name){
				if(special.get){
					config[name] = special.get();
				}
			});
			return extend(config, configData);	
		}
	};

	var getSetToSystem = function(prop){
		return {
			get: function(){
				return courier.System[prop];
			},
			set: function(val){
				if(typeof val === "object" && typeof courier.System[prop] === "object") {
					courier.System[prop] = extend(courier.System[prop] || {},val || {});
				} else {
					courier.System[prop] = val;
				}
			}
		};
	};
	
	var configSpecial = {
		env: {
			set: function(val){
				addProductionBundles();
				return val;
			}
		},
		baseUrl: getSetToSystem("baseURL"),
		root: getSetToSystem("baseURL"),
		config: {
			set: function(val){
				var name = filename(val),
					root = dir(val);
				System.paths["courierconfig"] = name;
				configSpecial.root.set( (root === val ? "." : root)  +"/");
			}
		},
		paths: getSetToSystem("paths"),
		map: getSetToSystem("map"),
		startId: {
			set: function(val){
				configSpecial.main.set(  normalize(val) );
			},
			get: function(){
				return System.main;
			}
		},
		main: {
			get: getSetToSystem("main").get,
			set: function(val){
				System.main = val;
				addProductionBundles();
			}
		},
		meta: getSetToSystem("meta"),
		ext: getSetToSystem("ext")
	};
	
	var addProductionBundles = function(){
		if(configData.env === "production" && System.main) {
			var main = System.main,
				bundlesDir = System.bundlesPath || "bundles/",
				bundleName = bundlesDir+filename(main);
	
			System.meta[bundleName] = {format:"amd"};
			System.bundles[bundleName] = [main];
		}
	};

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


};
/*
  SystemJS Courier Format
  Provides the Courier module format definition.
*/
function addCourier(loader) {

  // Courier Module Format Detection RegEx
  // courier(module, ...)
  var courierRegEx = /(?:^\s*|[}{\(\);,\n\?\&]\s*)courier\s*\(\s*((?:"[^"]+"\s*,|'[^']+'\s*,\s*)*)/;

  // What we stole.
  var courierInstantiateResult;
  
  function createCourier(loader) {
    courierInstantiateResult = null;

    // ensure no NodeJS environment detection
    loader.global.module = undefined;
    loader.global.exports = undefined;

    function courier() {
      var deps = [];
      var factory;
      
      for( var i = 0; i < arguments.length; i++ ) {
        if (typeof arguments[i] === 'string') {
          deps.push( normalize(arguments[i]) );
        } else {
          factory = arguments[i];
        }
      }

      if (typeof factory !== 'function') {
        factory = (function(factory) {
          return function() { return factory; };
        })(factory);
      }

      courierInstantiateResult = {
        deps: deps,
        execute: function(require, exports, moduleName) {

          var depValues = [];
          for (var i = 0; i < deps.length; i++) {
            depValues.push(require(deps[i]));
          }

          var output = factory.apply(loader.global, depValues);

          if (typeof output !== 'undefined') {
            return output;
          }
        }
      };
    }

    loader.global.courier = courier;
  }

  var loaderInstantiate = loader.instantiate;
  loader.instantiate = function(load) {
    var loader = this;

    if (load.metadata.format === 'courier' || !load.metadata.format && load.source.match(courierRegEx)) {
      load.metadata.format = 'courier';

      var oldCourier = loader.global.courier;

      createCourier(loader);

      loader.__exec(load);

      loader.global.courier = oldCourier;

      if (!courierInstantiateResult) {
        throw "Courier module " + load.name + " did not call courier";
      }

      if (courierInstantiateResult) {
        load.metadata.deps = load.metadata.deps ? load.metadata.deps.concat(courierInstantiateResult.deps) : courierInstantiateResult.deps;
        load.metadata.execute = courierInstantiateResult.execute;
      }
    }
    return loaderInstantiate.call(loader, load);
  };

  return loader;
}

if (typeof System !== "undefined") {
  addCourier(System);
}

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