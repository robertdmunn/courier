(function(){
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

})();