# CourierJS

CourierJS is an ES6, AMD, CommonJS, and courier client-side loader. 

#CourierJS is designed
#to simplify dependency management while being extremely powerful and flexible.

Courier is a fork of [StealJS](https://github.com/bitovi/steal), which builds from [SystemJS](https://github.com/systemjs/systemjs) and 
[ES6ModuleLoader](https://github.com/ModuleLoader/es6-module-loader) and adds:

 - global configuration
 - css and less support
 - plugin extension mapping _(upcoming)_
 - production builds with [courier-tools](https://github.com/bitovi/courier-tools)

But it's __killer__ feature - progressively loaded apps that balance caching and the 
number of script requests.

CourierJS supports IE8+ with AMD, CommonJS, and Courier syntax and IE9+ for ES6 syntax.

## Use

### Hello World Example

Lets see how to get a basic app up and running.

1. Install CourierJS:
  
  With [Bower](http://bower.io/)

  > bower install courier#0.1.1 -S

2. Create `courierconfig.js`:

  Add a `courierconfig.js` file directly within your "root" folder. Your
  "root" folder should contain all your static scripts and resources.
  
  By default, courier will assume `courierconfig.js` is a sibling of `bower_components`:

      ROOT/
        bower.json
        bower_components
        courierconfig.js
    
  `courierconfig.js` will be loaded by every page in your project.  It is used to configure
  the location to modules and other behavior.    
    
3. Add `main` module:

  Add a `main.js` to your project. This will load your apps other modules.
  
      ROOT/
        bower.json
        bower_components
        courierconfig.js
        main.js
      
  Within `main.js` add:
  
  ```js
  console.log("hello world");
  ```
 
4. Create an HTML page:

  Create an `index.html` page that specifies the location of `courierconfig.js` and
  the `main` module name:
  
      ROOT/
        bower.json
        bower_components
        courierconfig.js
        index.html

  Within `index.html` add:

  ```html
  <!DOCTYPE html>
  <html>
    <body>
      <script src='./bower_components/courier/courier.js'
              data-config='courierconfig.js'
              data-main='main'></script>
    </body>
  </html>
  ```
  
  To build this app, read [CourierTools](https://github.com/bitovi/courier-tools/tree/systemjs) docs.


### Adding jQuery

1. Install jQuery:
   
   With [Bower](http://bower.io/)
   
   > bower install jquery -S

2. Configure jQuery's path and export:

   Add a config for `System.paths` to `courierconfig.js` to tell courier where to find
   jQuery. Add a config for `System.meta` to tell SystemJS that jQuery exports the "jQuery"
   variable.
   
   ```js
   System.paths.jquery = "bower_components/jquery/dist/jquery.js";
   System.meta.jquery = { exports: "jQuery" };
   ```

3. Load jQuery.
  
  Import "jquery" with ES6 module syntax in `main.js`:
  
  ```js
  import $ from "jquery";
  $(document.body).append("<h1>Hello World!</h1>");
  ```


## Developing

After cloning ...

1.  Install npm modules
  
    > npm install
 
2. Install bower modules
  
    > bower install
    
3. Setup grunt watch
  
    > grunt watch
    
  This will automatically build when anything in `src` change.  
  
  To test, open:

      test/test.html
      
  And make sure everything passes.
