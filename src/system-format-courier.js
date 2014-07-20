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
