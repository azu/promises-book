(function(undefined) {
  // @note
  //   A few conventions for the documentation of this file:
  //   1. Always use "//" (in contrast with "/**/")
  //   2. The syntax used is Yardoc (yardoc.org), which is intended for Ruby (se below)
  //   3. `@param` and `@return` types should be preceded by `JS.` when referring to
  //      JavaScript constructors (e.g. `JS.Function`) otherwise Ruby is assumed.
  //   4. `nil` and `null` being unambiguous refer to the respective
  //      objects/values in Ruby and JavaScript
  //   5. This is still WIP :) so please give feedback and suggestions on how
  //      to improve or for alternative solutions
  //
  //   The way the code is digested before going through Yardoc is a secret kept
  //   in the docs repo (https://github.com/opal/docs/tree/master).

  var global_object = this, console;

  // Detect the global object
  if (typeof(global) !== 'undefined') { global_object = global; }
  if (typeof(window) !== 'undefined') { global_object = window; }

  // Setup a dummy console object if missing
  if (typeof(global_object.console) === 'object') {
    console = global_object.console;
  } else if (global_object.console == null) {
    console = global_object.console = {};
  } else {
    console = {};
  }

  if (!('log' in console)) { console.log = function () {}; }
  if (!('warn' in console)) { console.warn = console.log; }

  if (typeof(this.Opal) !== 'undefined') {
    console.warn('Opal already loaded. Loading twice can cause troubles, please fix your setup.');
    return this.Opal;
  }

  var nil;

  // The actual class for BasicObject
  var BasicObject;

  // The actual Object class.
  // The leading underscore is to avoid confusion with window.Object()
  var _Object;

  // The actual Module class
  var Module;

  // The actual Class class
  var Class;

  // The Opal object that is exposed globally
  var Opal = this.Opal = {};

  // This is a useful reference to global object inside ruby files
  Opal.global = global_object;
  global_object.Opal = Opal;

  // Configure runtime behavior with regards to require and unsupported fearures
  Opal.config = {
    missing_require_severity: 'error',        // error, warning, ignore
    unsupported_features_severity: 'warning', // error, warning, ignore
    enable_stack_trace: true                  // true, false
  }

  // Minify common function calls
  var $hasOwn       = Object.hasOwnProperty;
  var $bind         = Function.prototype.bind;
  var $setPrototype = Object.setPrototypeOf;
  var $slice        = Array.prototype.slice;
  var $splice       = Array.prototype.splice;

  // Nil object id is always 4
  var nil_id = 4;

  // Generates even sequential numbers greater than 4
  // (nil_id) to serve as unique ids for ruby objects
  var unique_id = nil_id;

  // Return next unique id
  Opal.uid = function() {
    unique_id += 2;
    return unique_id;
  };

  // Retrieve or assign the id of an object
  Opal.id = function(obj) {
    if (obj.$$is_number) return (obj * 2)+1;
    if (obj.$$id != null) {
      return obj.$$id;
    };
    $defineProperty(obj, '$$id', Opal.uid());
    return obj.$$id;
  };

  // Globals table
  Opal.gvars = {};

  // Exit function, this should be replaced by platform specific implementation
  // (See nodejs and chrome for examples)
  Opal.exit = function(status) { if (Opal.gvars.DEBUG) console.log('Exited with status '+status); };

  // keeps track of exceptions for $!
  Opal.exceptions = [];

  // @private
  // Pops an exception from the stack and updates `$!`.
  Opal.pop_exception = function() {
    Opal.gvars["!"] = Opal.exceptions.pop() || nil;
  }

  // Inspect any kind of object, including non Ruby ones
  Opal.inspect = function(obj) {
    if (obj === undefined) {
      return "undefined";
    }
    else if (obj === null) {
      return "null";
    }
    else if (!obj.$$class) {
      return obj.toString();
    }
    else {
      return obj.$inspect();
    }
  }

  function $defineProperty(object, name, initialValue) {
    if (typeof(object) === "string") {
      // Special case for:
      //   s = "string"
      //   def s.m; end
      // String class is the only class that:
      // + compiles to JS primitive
      // + allows method definition directly on instances
      // numbers, true, false and nil do not support it.
      object[name] = initialValue;
    } else {
      Object.defineProperty(object, name, {
        value: initialValue,
        enumerable: false,
        configurable: true,
        writable: true
      });
    }
  }

  Opal.defineProperty = $defineProperty;

  Opal.slice = $slice;


  // Truth
  // -----

  Opal.truthy = function(val) {
    return (val !== nil && val != null && (!val.$$is_boolean || val == true));
  };

  Opal.falsy = function(val) {
    return (val === nil || val == null || (val.$$is_boolean && val == false))
  };


  // Constants
  // ---------
  //
  // For future reference:
  // - The Rails autoloading guide (http://guides.rubyonrails.org/v5.0/autoloading_and_reloading_constants.html)
  // - @ConradIrwin's 2012 post on “Everything you ever wanted to know about constant lookup in Ruby” (http://cirw.in/blog/constant-lookup.html)
  //
  // Legend of MRI concepts/names:
  // - constant reference (cref): the module/class that acts as a namespace
  // - nesting: the namespaces wrapping the current scope, e.g. nesting inside
  //            `module A; module B::C; end; end` is `[B::C, A]`

  // Get the constant in the scope of the current cref
  function const_get_name(cref, name) {
    if (cref) return cref.$$const[name];
  }

  // Walk up the nesting array looking for the constant
  function const_lookup_nesting(nesting, name) {
    var i, ii, result, constant;

    if (nesting.length === 0) return;

    // If the nesting is not empty the constant is looked up in its elements
    // and in order. The ancestors of those elements are ignored.
    for (i = 0, ii = nesting.length; i < ii; i++) {
      constant = nesting[i].$$const[name];
      if (constant != null) return constant;
    }
  }

  // Walk up the ancestors chain looking for the constant
  function const_lookup_ancestors(cref, name) {
    var i, ii, result, ancestors;

    if (cref == null) return;

    ancestors = Opal.ancestors(cref);

    for (i = 0, ii = ancestors.length; i < ii; i++) {
      if (ancestors[i].$$const && $hasOwn.call(ancestors[i].$$const, name)) {
        return ancestors[i].$$const[name];
      }
    }
  }

  // Walk up Object's ancestors chain looking for the constant,
  // but only if cref is missing or a module.
  function const_lookup_Object(cref, name) {
    if (cref == null || cref.$$is_module) {
      return const_lookup_ancestors(_Object, name);
    }
  }

  // Call const_missing if nothing else worked
  function const_missing(cref, name, skip_missing) {
    if (!skip_missing) {
      return (cref || _Object).$const_missing(name);
    }
  }

  // Look for the constant just in the current cref or call `#const_missing`
  Opal.const_get_local = function(cref, name, skip_missing) {
    var result;

    if (cref == null) return;

    if (cref === '::') cref = _Object;

    if (!cref.$$is_module && !cref.$$is_class) {
      throw new Opal.TypeError(cref.toString() + " is not a class/module");
    }

    result = const_get_name(cref, name);              if (result != null) return result;
    result = const_missing(cref, name, skip_missing); if (result != null) return result;
  }

  // Look for the constant relative to a cref or call `#const_missing` (when the
  // constant is prefixed by `::`).
  Opal.const_get_qualified = function(cref, name, skip_missing) {
    var result, cache, cached, current_version = Opal.const_cache_version;

    if (cref == null) return;

    if (cref === '::') cref = _Object;

    if (!cref.$$is_module && !cref.$$is_class) {
      throw new Opal.TypeError(cref.toString() + " is not a class/module");
    }

    if ((cache = cref.$$const_cache) == null) {
      $defineProperty(cref, '$$const_cache', Object.create(null));
      cache = cref.$$const_cache;
    }
    cached = cache[name];

    if (cached == null || cached[0] !== current_version) {
      ((result = const_get_name(cref, name))              != null) ||
      ((result = const_lookup_ancestors(cref, name))      != null);
      cache[name] = [current_version, result];
    } else {
      result = cached[1];
    }

    return result != null ? result : const_missing(cref, name, skip_missing);
  };

  // Initialize the top level constant cache generation counter
  Opal.const_cache_version = 1;

  // Look for the constant in the open using the current nesting and the nearest
  // cref ancestors or call `#const_missing` (when the constant has no :: prefix).
  Opal.const_get_relative = function(nesting, name, skip_missing) {
    var cref = nesting[0], result, current_version = Opal.const_cache_version, cache, cached;

    if ((cache = nesting.$$const_cache) == null) {
      $defineProperty(nesting, '$$const_cache', Object.create(null));
      cache = nesting.$$const_cache;
    }
    cached = cache[name];

    if (cached == null || cached[0] !== current_version) {
      ((result = const_get_name(cref, name))              != null) ||
      ((result = const_lookup_nesting(nesting, name))     != null) ||
      ((result = const_lookup_ancestors(cref, name))      != null) ||
      ((result = const_lookup_Object(cref, name))         != null);

      cache[name] = [current_version, result];
    } else {
      result = cached[1];
    }

    return result != null ? result : const_missing(cref, name, skip_missing);
  };

  // Register the constant on a cref and opportunistically set the name of
  // unnamed classes/modules.
  Opal.const_set = function(cref, name, value) {
    if (cref == null || cref === '::') cref = _Object;

    if (value.$$is_a_module) {
      if (value.$$name == null || value.$$name === nil) value.$$name = name;
      if (value.$$base_module == null) value.$$base_module = cref;
    }

    cref.$$const = (cref.$$const || Object.create(null));
    cref.$$const[name] = value;

    // Add a short helper to navigate constants manually.
    // @example
    //   Opal.$$.Regexp.$$.IGNORECASE
    cref.$$ = cref.$$const;

    Opal.const_cache_version++;

    // Expose top level constants onto the Opal object
    if (cref === _Object) Opal[name] = value;

    // Name new class directly onto current scope (Opal.Foo.Baz = klass)
    $defineProperty(cref, name, value);

    return value;
  };

  // Get all the constants reachable from a given cref, by default will include
  // inherited constants.
  Opal.constants = function(cref, inherit) {
    if (inherit == null) inherit = true;

    var module, modules = [cref], module_constants, i, ii, constants = {}, constant;

    if (inherit) modules = modules.concat(Opal.ancestors(cref));
    if (inherit && cref.$$is_module) modules = modules.concat([Opal.Object]).concat(Opal.ancestors(Opal.Object));

    for (i = 0, ii = modules.length; i < ii; i++) {
      module = modules[i];

      // Don not show Objects constants unless we're querying Object itself
      if (cref !== _Object && module == _Object) break;

      for (constant in module.$$const) {
        constants[constant] = true;
      }
    }

    return Object.keys(constants);
  };

  // Remove a constant from a cref.
  Opal.const_remove = function(cref, name) {
    Opal.const_cache_version++;

    if (cref.$$const[name] != null) {
      var old = cref.$$const[name];
      delete cref.$$const[name];
      return old;
    }

    if (cref.$$autoload != null && cref.$$autoload[name] != null) {
      delete cref.$$autoload[name];
      return nil;
    }

    throw Opal.NameError.$new("constant "+cref+"::"+cref.$name()+" not defined");
  };


  // Modules & Classes
  // -----------------

  // A `class Foo; end` expression in ruby is compiled to call this runtime
  // method which either returns an existing class of the given name, or creates
  // a new class in the given `base` scope.
  //
  // If a constant with the given name exists, then we check to make sure that
  // it is a class and also that the superclasses match. If either of these
  // fail, then we raise a `TypeError`. Note, `superclass` may be null if one
  // was not specified in the ruby code.
  //
  // We pass a constructor to this method of the form `function ClassName() {}`
  // simply so that classes show up with nicely formatted names inside debuggers
  // in the web browser (or node/sprockets).
  //
  // The `scope` is the current `self` value where the class is being created
  // from. We use this to get the scope for where the class should be created.
  // If `scope` is an object (not a class/module), we simple get its class and
  // use that as the scope instead.
  //
  // @param scope        [Object] where the class is being created
  // @param superclass  [Class,null] superclass of the new class (may be null)
  // @param id          [String] the name of the class to be created
  // @param constructor [JS.Function] function to use as constructor
  //
  // @return new [Class]  or existing ruby class
  //
  Opal.allocate_class = function(name, superclass) {
    var klass, constructor;

    if (superclass != null && superclass.$$bridge) {
      // Inheritance from bridged classes requires
      // calling original JS constructors
      constructor = function() {
        var args = $slice.call(arguments),
            self = new ($bind.apply(superclass.$$constructor, [null].concat(args)))();

        // and replacing a __proto__ manually
        $setPrototype(self, klass.$$prototype);
        return self;
      }
    } else {
      constructor = function(){};
    }

    if (name) {
      $defineProperty(constructor, 'displayName', '::'+name);
    }

    klass = constructor;

    $defineProperty(klass, '$$name', name);
    $defineProperty(klass, '$$constructor', constructor);
    $defineProperty(klass, '$$prototype', constructor.prototype);
    $defineProperty(klass, '$$const', {});
    $defineProperty(klass, '$$is_class', true);
    $defineProperty(klass, '$$is_a_module', true);
    $defineProperty(klass, '$$super', superclass);
    $defineProperty(klass, '$$cvars', {});
    $defineProperty(klass, '$$own_included_modules', []);
    $defineProperty(klass, '$$own_prepended_modules', []);
    $defineProperty(klass, '$$ancestors', []);
    $defineProperty(klass, '$$ancestors_cache_version', null);

    $defineProperty(klass.$$prototype, '$$class', klass);

    // By default if there are no singleton class methods
    // __proto__ is Class.prototype
    // Later singleton methods generate a singleton_class
    // and inject it into ancestors chain
    if (Opal.Class) {
      $setPrototype(klass, Opal.Class.prototype);
    }

    if (superclass != null) {
      $setPrototype(klass.$$prototype, superclass.$$prototype);

      if (superclass.$$meta) {
        // If superclass has metaclass then we have explicitely inherit it.
        Opal.build_class_singleton_class(klass);
      }
    };

    return klass;
  }


  function find_existing_class(scope, name) {
    // Try to find the class in the current scope
    var klass = const_get_name(scope, name);

    // If the class exists in the scope, then we must use that
    if (klass) {
      // Make sure the existing constant is a class, or raise error
      if (!klass.$$is_class) {
        throw Opal.TypeError.$new(name + " is not a class");
      }

      return klass;
    }
  }

  function ensureSuperclassMatch(klass, superclass) {
    if (klass.$$super !== superclass) {
      throw Opal.TypeError.$new("superclass mismatch for class " + klass.$$name);
    }
  }

  Opal.klass = function(scope, superclass, name) {
    var bridged;

    if (scope == null) {
      // Global scope
      scope = _Object;
    } else if (!scope.$$is_class && !scope.$$is_module) {
      // Scope is an object, use its class
      scope = scope.$$class;
    }

    // If the superclass is not an Opal-generated class then we're bridging a native JS class
    if (superclass != null && !superclass.hasOwnProperty('$$is_class')) {
      bridged = superclass;
      superclass = _Object;
    }

    var klass = find_existing_class(scope, name);

    if (klass) {
      if (superclass) {
        // Make sure existing class has same superclass
        ensureSuperclassMatch(klass, superclass);
      }
      return klass;
    }

    // Class doesn't exist, create a new one with given superclass...

    // Not specifying a superclass means we can assume it to be Object
    if (superclass == null) {
      superclass = _Object;
    }

    // Create the class object (instance of Class)
    klass = Opal.allocate_class(name, superclass);
    Opal.const_set(scope, name, klass);

    // Call .inherited() hook with new class on the superclass
    if (superclass.$inherited) {
      superclass.$inherited(klass);
    }

    if (bridged) {
      Opal.bridge(bridged, klass);
    }

    return klass;
  }

  // Define new module (or return existing module). The given `scope` is basically
  // the current `self` value the `module` statement was defined in. If this is
  // a ruby module or class, then it is used, otherwise if the scope is a ruby
  // object then that objects real ruby class is used (e.g. if the scope is the
  // main object, then the top level `Object` class is used as the scope).
  //
  // If a module of the given name is already defined in the scope, then that
  // instance is just returned.
  //
  // If there is a class of the given name in the scope, then an error is
  // generated instead (cannot have a class and module of same name in same scope).
  //
  // Otherwise, a new module is created in the scope with the given name, and that
  // new instance is returned back (to be referenced at runtime).
  //
  // @param  scope [Module, Class] class or module this definition is inside
  // @param  id   [String] the name of the new (or existing) module
  //
  // @return [Module]
  Opal.allocate_module = function(name) {
    var constructor = function(){};
    if (name) {
      $defineProperty(constructor, 'displayName', name+'.$$constructor');
    }

    var module = constructor;

    if (name)
      $defineProperty(constructor, 'displayName', name+'.constructor');

    $defineProperty(module, '$$name', name);
    $defineProperty(module, '$$prototype', constructor.prototype);
    $defineProperty(module, '$$const', {});
    $defineProperty(module, '$$is_module', true);
    $defineProperty(module, '$$is_a_module', true);
    $defineProperty(module, '$$cvars', {});
    $defineProperty(module, '$$iclasses', []);
    $defineProperty(module, '$$own_included_modules', []);
    $defineProperty(module, '$$own_prepended_modules', []);
    $defineProperty(module, '$$ancestors', [module]);
    $defineProperty(module, '$$ancestors_cache_version', null);

    $setPrototype(module, Opal.Module.prototype);

    return module;
  }

  function find_existing_module(scope, name) {
    var module = const_get_name(scope, name);
    if (module == null && scope === _Object) module = const_lookup_ancestors(_Object, name);

    if (module) {
      if (!module.$$is_module && module !== _Object) {
        throw Opal.TypeError.$new(name + " is not a module");
      }
    }

    return module;
  }

  Opal.module = function(scope, name) {
    var module;

    if (scope == null) {
      // Global scope
      scope = _Object;
    } else if (!scope.$$is_class && !scope.$$is_module) {
      // Scope is an object, use its class
      scope = scope.$$class;
    }

    module = find_existing_module(scope, name);

    if (module) {
      return module;
    }

    // Module doesnt exist, create a new one...
    module = Opal.allocate_module(name);
    Opal.const_set(scope, name, module);

    return module;
  }

  // Return the singleton class for the passed object.
  //
  // If the given object alredy has a singleton class, then it will be stored on
  // the object as the `$$meta` property. If this exists, then it is simply
  // returned back.
  //
  // Otherwise, a new singleton object for the class or object is created, set on
  // the object at `$$meta` for future use, and then returned.
  //
  // @param object [Object] the ruby object
  // @return [Class] the singleton class for object
  Opal.get_singleton_class = function(object) {
    if (object.$$meta) {
      return object.$$meta;
    }

    if (object.hasOwnProperty('$$is_class')) {
      return Opal.build_class_singleton_class(object);
    } else if (object.hasOwnProperty('$$is_module')) {
      return Opal.build_module_singletin_class(object);
    } else {
      return Opal.build_object_singleton_class(object);
    }
  };

  // Build the singleton class for an existing class. Class object are built
  // with their singleton class already in the prototype chain and inheriting
  // from their superclass object (up to `Class` itself).
  //
  // NOTE: Actually in MRI a class' singleton class inherits from its
  // superclass' singleton class which in turn inherits from Class.
  //
  // @param klass [Class]
  // @return [Class]
  Opal.build_class_singleton_class = function(klass) {
    var superclass, meta;

    if (klass.$$meta) {
      return klass.$$meta;
    }

    // The singleton_class superclass is the singleton_class of its superclass;
    // but BasicObject has no superclass (its `$$super` is null), thus we
    // fallback on `Class`.
    superclass = klass === BasicObject ? Class : Opal.get_singleton_class(klass.$$super);

    meta = Opal.allocate_class(null, superclass, function(){});

    $defineProperty(meta, '$$is_singleton', true);
    $defineProperty(meta, '$$singleton_of', klass);
    $defineProperty(klass, '$$meta', meta);
    $setPrototype(klass, meta.$$prototype);
    // Restoring ClassName.class
    $defineProperty(klass, '$$class', Opal.Class);

    return meta;
  };

  Opal.build_module_singletin_class = function(mod) {
    if (mod.$$meta) {
      return mod.$$meta;
    }

    var meta = Opal.allocate_class(null, Opal.Module, function(){});

    $defineProperty(meta, '$$is_singleton', true);
    $defineProperty(meta, '$$singleton_of', mod);
    $defineProperty(mod, '$$meta', meta);
    $setPrototype(mod, meta.$$prototype);
    // Restoring ModuleName.class
    $defineProperty(mod, '$$class', Opal.Module);

    return meta;
  }

  // Build the singleton class for a Ruby (non class) Object.
  //
  // @param object [Object]
  // @return [Class]
  Opal.build_object_singleton_class = function(object) {
    var superclass = object.$$class,
        klass = Opal.allocate_class(nil, superclass, function(){});

    $defineProperty(klass, '$$is_singleton', true);
    $defineProperty(klass, '$$singleton_of', object);

    delete klass.$$prototype.$$class;

    $defineProperty(object, '$$meta', klass);

    $setPrototype(object, object.$$meta.$$prototype);

    return klass;
  };

  Opal.is_method = function(prop) {
    return (prop[0] === '$' && prop[1] !== '$');
  }

  Opal.instance_methods = function(mod) {
    var exclude = [], results = [], ancestors = Opal.ancestors(mod);

    for (var i = 0, l = ancestors.length; i < l; i++) {
      var ancestor = ancestors[i],
          proto = ancestor.$$prototype;

      if (proto.hasOwnProperty('$$dummy')) {
        proto = proto.$$define_methods_on;
      }

      var props = Object.getOwnPropertyNames(proto);

      for (var j = 0, ll = props.length; j < ll; j++) {
        var prop = props[j];

        if (Opal.is_method(prop)) {
          var method_name = prop.slice(1),
              method = proto[prop];

          if (method.$$stub && exclude.indexOf(method_name) === -1) {
            exclude.push(method_name);
          }

          if (!method.$$stub && results.indexOf(method_name) === -1 && exclude.indexOf(method_name) === -1) {
            results.push(method_name);
          }
        }
      }
    }

    return results;
  }

  Opal.own_instance_methods = function(mod) {
    var results = [],
        proto = mod.$$prototype;

    if (proto.hasOwnProperty('$$dummy')) {
      proto = proto.$$define_methods_on;
    }

    var props = Object.getOwnPropertyNames(proto);

    for (var i = 0, length = props.length; i < length; i++) {
      var prop = props[i];

      if (Opal.is_method(prop)) {
        var method = proto[prop];

        if (!method.$$stub) {
          var method_name = prop.slice(1);
          results.push(method_name);
        }
      }
    }

    return results;
  }

  Opal.methods = function(obj) {
    return Opal.instance_methods(Opal.get_singleton_class(obj));
  }

  Opal.own_methods = function(obj) {
    return Opal.own_instance_methods(Opal.get_singleton_class(obj));
  }

  Opal.receiver_methods = function(obj) {
    var mod = Opal.get_singleton_class(obj);
    var singleton_methods = Opal.own_instance_methods(mod);
    var instance_methods = Opal.own_instance_methods(mod.$$super);
    return singleton_methods.concat(instance_methods);
  }

  // Returns an object containing all pairs of names/values
  // for all class variables defined in provided +module+
  // and its ancestors.
  //
  // @param module [Module]
  // @return [Object]
  Opal.class_variables = function(module) {
    var ancestors = Opal.ancestors(module),
        i, length = ancestors.length,
        result = {};

    for (i = length - 1; i >= 0; i--) {
      var ancestor = ancestors[i];

      for (var cvar in ancestor.$$cvars) {
        result[cvar] = ancestor.$$cvars[cvar];
      }
    }

    return result;
  }

  // Sets class variable with specified +name+ to +value+
  // in provided +module+
  //
  // @param module [Module]
  // @param name [String]
  // @param value [Object]
  Opal.class_variable_set = function(module, name, value) {
    var ancestors = Opal.ancestors(module),
        i, length = ancestors.length;

    for (i = length - 2; i >= 0; i--) {
      var ancestor = ancestors[i];

      if ($hasOwn.call(ancestor.$$cvars, name)) {
        ancestor.$$cvars[name] = value;
        return value;
      }
    }

    module.$$cvars[name] = value;

    return value;
  }

  function isRoot(proto) {
    return proto.hasOwnProperty('$$iclass') && proto.hasOwnProperty('$$root');
  }

  function own_included_modules(module) {
    var result = [], mod, proto = Object.getPrototypeOf(module.$$prototype);

    while (proto) {
      if (proto.hasOwnProperty('$$class')) {
        // superclass
        break;
      }
      mod = protoToModule(proto);
      if (mod) {
        result.push(mod);
      }
      proto = Object.getPrototypeOf(proto);
    }

    return result;
  }

  function own_prepended_modules(module) {
    var result = [], mod, proto = Object.getPrototypeOf(module.$$prototype);

    if (module.$$prototype.hasOwnProperty('$$dummy')) {
      while (proto) {
        if (proto === module.$$prototype.$$define_methods_on) {
          break;
        }

        mod = protoToModule(proto);
        if (mod) {
          result.push(mod);
        }

        proto = Object.getPrototypeOf(proto);
      }
    }

    return result;
  }


  // The actual inclusion of a module into a class.
  //
  // ## Class `$$parent` and `iclass`
  //
  // To handle `super` calls, every class has a `$$parent`. This parent is
  // used to resolve the next class for a super call. A normal class would
  // have this point to its superclass. However, if a class includes a module
  // then this would need to take into account the module. The module would
  // also have to then point its `$$parent` to the actual superclass. We
  // cannot modify modules like this, because it might be included in more
  // then one class. To fix this, we actually insert an `iclass` as the class'
  // `$$parent` which can then point to the superclass. The `iclass` acts as
  // a proxy to the actual module, so the `super` chain can then search it for
  // the required method.
  //
  // @param module [Module] the module to include
  // @param includer [Module] the target class to include module into
  // @return [null]
  Opal.append_features = function(module, includer) {
    var module_ancestors = Opal.ancestors(module);
    var iclasses = [];

    if (module_ancestors.indexOf(includer) !== -1) {
      throw Opal.ArgumentError.$new('cyclic include detected');
    }

    for (var i = 0, length = module_ancestors.length; i < length; i++) {
      var ancestor = module_ancestors[i], iclass = create_iclass(ancestor);
      $defineProperty(iclass, '$$included', true);
      iclasses.push(iclass);
    }
    var includer_ancestors = Opal.ancestors(includer),
        chain = chain_iclasses(iclasses),
        start_chain_after,
        end_chain_on;

    if (includer_ancestors.indexOf(module) === -1) {
      // first time include

      // includer -> chain.first -> ...chain... -> chain.last -> includer.parent
      start_chain_after = includer.$$prototype;
      end_chain_on = Object.getPrototypeOf(includer.$$prototype);
    } else {
      // The module has been already included,
      // we don't need to put it into the ancestors chain again,
      // but this module may have new included modules.
      // If it's true we need to copy them.
      //
      // The simplest way is to replace ancestors chain from
      //          parent
      //            |
      //   `module` iclass (has a $$root flag)
      //            |
      //   ...previos chain of module.included_modules ...
      //            |
      //  "next ancestor" (has a $$root flag or is a real class)
      //
      // to
      //          parent
      //            |
      //    `module` iclass (has a $$root flag)
      //            |
      //   ...regenerated chain of module.included_modules
      //            |
      //   "next ancestor" (has a $$root flag or is a real class)
      //
      // because there are no intermediate classes between `parent` and `next ancestor`.
      // It doesn't break any prototypes of other objects as we don't change class references.

      var proto = includer.$$prototype, parent = proto, module_iclass = Object.getPrototypeOf(parent);

      while (module_iclass != null) {
        if (isRoot(module_iclass) && module_iclass.$$module === module) {
          break;
        }

        parent = module_iclass;
        module_iclass = Object.getPrototypeOf(module_iclass);
      }

      var next_ancestor = Object.getPrototypeOf(module_iclass);

      // skip non-root iclasses (that were recursively included)
      while (next_ancestor.hasOwnProperty('$$iclass') && !isRoot(next_ancestor)) {
        next_ancestor = Object.getPrototypeOf(next_ancestor);
      }

      start_chain_after = parent;
      end_chain_on = next_ancestor;
    }

    $setPrototype(start_chain_after, chain.first);
    $setPrototype(chain.last, end_chain_on);

    // recalculate own_included_modules cache
    includer.$$own_included_modules = own_included_modules(includer);

    Opal.const_cache_version++;
  }

  Opal.prepend_features = function(module, prepender) {
    // Here we change the ancestors chain from
    //
    //   prepender
    //      |
    //    parent
    //
    // to:
    //
    // dummy(prepender)
    //      |
    //  iclass(module)
    //      |
    // iclass(prepender)
    //      |
    //    parent
    var module_ancestors = Opal.ancestors(module);
    var iclasses = [];

    if (module_ancestors.indexOf(prepender) !== -1) {
      throw Opal.ArgumentError.$new('cyclic prepend detected');
    }

    for (var i = 0, length = module_ancestors.length; i < length; i++) {
      var ancestor = module_ancestors[i], iclass = create_iclass(ancestor);
      $defineProperty(iclass, '$$prepended', true);
      iclasses.push(iclass);
    }

    var chain = chain_iclasses(iclasses),
        dummy_prepender = prepender.$$prototype,
        previous_parent = Object.getPrototypeOf(dummy_prepender),
        prepender_iclass,
        start_chain_after,
        end_chain_on;

    if (dummy_prepender.hasOwnProperty('$$dummy')) {
      // The module already has some prepended modules
      // which means that we don't need to make it "dummy"
      prepender_iclass = dummy_prepender.$$define_methods_on;
    } else {
      // Making the module "dummy"
      prepender_iclass = create_dummy_iclass(prepender);
      flush_methods_in(prepender);
      $defineProperty(dummy_prepender, '$$dummy', true);
      $defineProperty(dummy_prepender, '$$define_methods_on', prepender_iclass);

      // Converting
      //   dummy(prepender) -> previous_parent
      // to
      //   dummy(prepender) -> iclass(prepender) -> previous_parent
      $setPrototype(dummy_prepender, prepender_iclass);
      $setPrototype(prepender_iclass, previous_parent);
    }

    var prepender_ancestors = Opal.ancestors(prepender);

    if (prepender_ancestors.indexOf(module) === -1) {
      // first time prepend

      start_chain_after = dummy_prepender;

      // next $$root or prepender_iclass or non-$$iclass
      end_chain_on = Object.getPrototypeOf(dummy_prepender);
      while (end_chain_on != null) {
        if (
          end_chain_on.hasOwnProperty('$$root') ||
          end_chain_on === prepender_iclass ||
          !end_chain_on.hasOwnProperty('$$iclass')
        ) {
          break;
        }

        end_chain_on = Object.getPrototypeOf(end_chain_on);
      }
    } else {
      throw Opal.RuntimeError.$new("Prepending a module multiple times is not supported");
    }

    $setPrototype(start_chain_after, chain.first);
    $setPrototype(chain.last, end_chain_on);

    // recalculate own_prepended_modules cache
    prepender.$$own_prepended_modules = own_prepended_modules(prepender);

    Opal.const_cache_version++;
  }

  function flush_methods_in(module) {
    var proto = module.$$prototype,
        props = Object.getOwnPropertyNames(proto);

    for (var i = 0; i < props.length; i++) {
      var prop = props[i];
      if (Opal.is_method(prop)) {
        delete proto[prop];
      }
    }
  }

  function create_iclass(module) {
    var iclass = create_dummy_iclass(module);

    if (module.$$is_module) {
      module.$$iclasses.push(iclass);
    }

    return iclass;
  }

  // Dummy iclass doesn't receive updates when the module gets a new method.
  function create_dummy_iclass(module) {
    var iclass = {},
        proto = module.$$prototype;

    if (proto.hasOwnProperty('$$dummy')) {
      proto = proto.$$define_methods_on;
    }

    var props = Object.getOwnPropertyNames(proto),
        length = props.length, i;

    for (i = 0; i < length; i++) {
      var prop = props[i];
      $defineProperty(iclass, prop, proto[prop]);
    }

    $defineProperty(iclass, '$$iclass', true);
    $defineProperty(iclass, '$$module', module);

    return iclass;
  }

  function chain_iclasses(iclasses) {
    var length = iclasses.length, first = iclasses[0];

    $defineProperty(first, '$$root', true);

    if (length === 1) {
      return { first: first, last: first };
    }

    var previous = first;

    for (var i = 1; i < length; i++) {
      var current = iclasses[i];
      $setPrototype(previous, current);
      previous = current;
    }


    return { first: iclasses[0], last: iclasses[length - 1] };
  }

  // For performance, some core Ruby classes are toll-free bridged to their
  // native JavaScript counterparts (e.g. a Ruby Array is a JavaScript Array).
  //
  // This method is used to setup a native constructor (e.g. Array), to have
  // its prototype act like a normal Ruby class. Firstly, a new Ruby class is
  // created using the native constructor so that its prototype is set as the
  // target for the new class. Note: all bridged classes are set to inherit
  // from Object.
  //
  // Example:
  //
  //    Opal.bridge(self, Function);
  //
  // @param klass       [Class] the Ruby class to bridge
  // @param constructor [JS.Function] native JavaScript constructor to use
  // @return [Class] returns the passed Ruby class
  //
  Opal.bridge = function(native_klass, klass) {
    if (native_klass.hasOwnProperty('$$bridge')) {
      throw Opal.ArgumentError.$new("already bridged");
    }

    var klass_to_inject, klass_reference;

    klass_to_inject = klass.$$super || Opal.Object;
    klass_reference = klass;
    var original_prototype = klass.$$prototype;

    // constructor is a JS function with a prototype chain like:
    // - constructor
    //   - super
    //
    // What we need to do is to inject our class (with its prototype chain)
    // between constructor and super. For example, after injecting ::Object
    // into JS String we get:
    //
    // - constructor (window.String)
    //   - Opal.Object
    //     - Opal.Kernel
    //       - Opal.BasicObject
    //         - super (window.Object)
    //           - null
    //
    $defineProperty(native_klass, '$$bridge', klass);
    $setPrototype(native_klass.prototype, (klass.$$super || Opal.Object).$$prototype);
    $defineProperty(klass, '$$prototype', native_klass.prototype);

    $defineProperty(klass.$$prototype, '$$class', klass);
    $defineProperty(klass, '$$constructor', native_klass);
    $defineProperty(klass, '$$bridge', true);
  };

  function protoToModule(proto) {
    if (proto.hasOwnProperty('$$dummy')) {
      return;
    } else if (proto.hasOwnProperty('$$iclass')) {
      return proto.$$module;
    } else if (proto.hasOwnProperty('$$class')) {
      return proto.$$class;
    }
  }

  function own_ancestors(module) {
    return module.$$own_prepended_modules.concat([module]).concat(module.$$own_included_modules);
  }

  // The Array of ancestors for a given module/class
  Opal.ancestors = function(module) {
    if (!module) { return []; }

    if (module.$$ancestors_cache_version === Opal.const_cache_version) {
      return module.$$ancestors;
    }

    var result = [], i, mods, length;

    for (i = 0, mods = own_ancestors(module), length = mods.length; i < length; i++) {
      result.push(mods[i]);
    }

    if (module.$$super) {
      for (i = 0, mods = Opal.ancestors(module.$$super), length = mods.length; i < length; i++) {
        result.push(mods[i]);
      }
    }

    module.$$ancestors_cache_version = Opal.const_cache_version;
    module.$$ancestors = result;

    return result;
  }

  Opal.included_modules = function(module) {
    var result = [], mod = null, proto = Object.getPrototypeOf(module.$$prototype);

    for (; proto && Object.getPrototypeOf(proto); proto = Object.getPrototypeOf(proto)) {
      mod = protoToModule(proto);
      if (mod && mod.$$is_module && proto.$$iclass && proto.$$included) {
        result.push(mod);
      }
    }

    return result;
  }


  // Method Missing
  // --------------

  // Methods stubs are used to facilitate method_missing in opal. A stub is a
  // placeholder function which just calls `method_missing` on the receiver.
  // If no method with the given name is actually defined on an object, then it
  // is obvious to say that the stub will be called instead, and then in turn
  // method_missing will be called.
  //
  // When a file in ruby gets compiled to javascript, it includes a call to
  // this function which adds stubs for every method name in the compiled file.
  // It should then be safe to assume that method_missing will work for any
  // method call detected.
  //
  // Method stubs are added to the BasicObject prototype, which every other
  // ruby object inherits, so all objects should handle method missing. A stub
  // is only added if the given property name (method name) is not already
  // defined.
  //
  // Note: all ruby methods have a `$` prefix in javascript, so all stubs will
  // have this prefix as well (to make this method more performant).
  //
  //    Opal.add_stubs(["$foo", "$bar", "$baz="]);
  //
  // All stub functions will have a private `$$stub` property set to true so
  // that other internal methods can detect if a method is just a stub or not.
  // `Kernel#respond_to?` uses this property to detect a methods presence.
  //
  // @param stubs [Array] an array of method stubs to add
  // @return [undefined]
  Opal.add_stubs = function(stubs) {
    var proto = Opal.BasicObject.$$prototype;

    for (var i = 0, length = stubs.length; i < length; i++) {
      var stub = stubs[i], existing_method = proto[stub];

      if (existing_method == null || existing_method.$$stub) {
        Opal.add_stub_for(proto, stub);
      }
    }
  };

  // Add a method_missing stub function to the given prototype for the
  // given name.
  //
  // @param prototype [Prototype] the target prototype
  // @param stub [String] stub name to add (e.g. "$foo")
  // @return [undefined]
  Opal.add_stub_for = function(prototype, stub) {
    var method_missing_stub = Opal.stub_for(stub);
    $defineProperty(prototype, stub, method_missing_stub);
  };

  // Generate the method_missing stub for a given method name.
  //
  // @param method_name [String] The js-name of the method to stub (e.g. "$foo")
  // @return [undefined]
  Opal.stub_for = function(method_name) {
    function method_missing_stub() {
      // Copy any given block onto the method_missing dispatcher
      this.$method_missing.$$p = method_missing_stub.$$p;

      // Set block property to null ready for the next call (stop false-positives)
      method_missing_stub.$$p = null;

      // call method missing with correct args (remove '$' prefix on method name)
      var args_ary = new Array(arguments.length);
      for(var i = 0, l = args_ary.length; i < l; i++) { args_ary[i] = arguments[i]; }

      return this.$method_missing.apply(this, [method_name.slice(1)].concat(args_ary));
    }

    method_missing_stub.$$stub = true;

    return method_missing_stub;
  };


  // Methods
  // -------

  // Arity count error dispatcher for methods
  //
  // @param actual [Fixnum] number of arguments given to method
  // @param expected [Fixnum] expected number of arguments
  // @param object [Object] owner of the method +meth+
  // @param meth [String] method name that got wrong number of arguments
  // @raise [ArgumentError]
  Opal.ac = function(actual, expected, object, meth) {
    var inspect = '';
    if (object.$$is_a_module) {
      inspect += object.$$name + '.';
    }
    else {
      inspect += object.$$class.$$name + '#';
    }
    inspect += meth;

    throw Opal.ArgumentError.$new('[' + inspect + '] wrong number of arguments(' + actual + ' for ' + expected + ')');
  };

  // Arity count error dispatcher for blocks
  //
  // @param actual [Fixnum] number of arguments given to block
  // @param expected [Fixnum] expected number of arguments
  // @param context [Object] context of the block definition
  // @raise [ArgumentError]
  Opal.block_ac = function(actual, expected, context) {
    var inspect = "`block in " + context + "'";

    throw Opal.ArgumentError.$new(inspect + ': wrong number of arguments (' + actual + ' for ' + expected + ')');
  };

  // Super dispatcher
  Opal.find_super_dispatcher = function(obj, mid, current_func, defcheck, defs) {
    var jsid = '$' + mid, ancestors, super_method;

    if (obj.hasOwnProperty('$$meta')) {
      ancestors = Opal.ancestors(obj.$$meta);
    } else {
      ancestors = Opal.ancestors(obj.$$class);
    }

    var current_index = ancestors.indexOf(current_func.$$owner);

    for (var i = current_index + 1; i < ancestors.length; i++) {
      var ancestor = ancestors[i],
          proto = ancestor.$$prototype;

      if (proto.hasOwnProperty('$$dummy')) {
        proto = proto.$$define_methods_on;
      }

      if (proto.hasOwnProperty(jsid)) {
        var method = proto[jsid];

        if (!method.$$stub) {
          super_method = method;
        }
        break;
      }
    }

    if (!defcheck && super_method == null && Opal.Kernel.$method_missing === obj.$method_missing) {
      // method_missing hasn't been explicitly defined
      throw Opal.NoMethodError.$new('super: no superclass method `'+mid+"' for "+obj, mid);
    }

    return super_method;
  };

  // Iter dispatcher for super in a block
  Opal.find_iter_super_dispatcher = function(obj, jsid, current_func, defcheck, implicit) {
    var call_jsid = jsid;

    if (!current_func) {
      throw Opal.RuntimeError.$new("super called outside of method");
    }

    if (implicit && current_func.$$define_meth) {
      throw Opal.RuntimeError.$new("implicit argument passing of super from method defined by define_method() is not supported. Specify all arguments explicitly");
    }

    if (current_func.$$def) {
      call_jsid = current_func.$$jsid;
    }

    return Opal.find_super_dispatcher(obj, call_jsid, current_func, defcheck);
  };

  // Used to return as an expression. Sometimes, we can't simply return from
  // a javascript function as if we were a method, as the return is used as
  // an expression, or even inside a block which must "return" to the outer
  // method. This helper simply throws an error which is then caught by the
  // method. This approach is expensive, so it is only used when absolutely
  // needed.
  //
  Opal.ret = function(val) {
    Opal.returner.$v = val;
    throw Opal.returner;
  };

  // Used to break out of a block.
  Opal.brk = function(val, breaker) {
    breaker.$v = val;
    throw breaker;
  };

  // Builds a new unique breaker, this is to avoid multiple nested breaks to get
  // in the way of each other.
  Opal.new_brk = function() {
    return new Error('unexpected break');
  };

  // handles yield calls for 1 yielded arg
  Opal.yield1 = function(block, arg) {
    if (typeof(block) !== "function") {
      throw Opal.LocalJumpError.$new("no block given");
    }

    var has_mlhs = block.$$has_top_level_mlhs_arg,
        has_trailing_comma = block.$$has_trailing_comma_in_args;

    if (block.length > 1 || ((has_mlhs || has_trailing_comma) && block.length === 1)) {
      arg = Opal.to_ary(arg);
    }

    if ((block.length > 1 || (has_trailing_comma && block.length === 1)) && arg.$$is_array) {
      return block.apply(null, arg);
    }
    else {
      return block(arg);
    }
  };

  // handles yield for > 1 yielded arg
  Opal.yieldX = function(block, args) {
    if (typeof(block) !== "function") {
      throw Opal.LocalJumpError.$new("no block given");
    }

    if (block.length > 1 && args.length === 1) {
      if (args[0].$$is_array) {
        return block.apply(null, args[0]);
      }
    }

    if (!args.$$is_array) {
      var args_ary = new Array(args.length);
      for(var i = 0, l = args_ary.length; i < l; i++) { args_ary[i] = args[i]; }

      return block.apply(null, args_ary);
    }

    return block.apply(null, args);
  };

  // Finds the corresponding exception match in candidates.  Each candidate can
  // be a value, or an array of values.  Returns null if not found.
  Opal.rescue = function(exception, candidates) {
    for (var i = 0; i < candidates.length; i++) {
      var candidate = candidates[i];

      if (candidate.$$is_array) {
        var result = Opal.rescue(exception, candidate);

        if (result) {
          return result;
        }
      }
      else if (candidate === Opal.JS.Error) {
        return candidate;
      }
      else if (candidate['$==='](exception)) {
        return candidate;
      }
    }

    return null;
  };

  Opal.is_a = function(object, klass) {
    if (klass != null && object.$$meta === klass || object.$$class === klass) {
      return true;
    }

    if (object.$$is_number && klass.$$is_number_class) {
      return true;
    }

    var i, length, ancestors = Opal.ancestors(object.$$is_class ? Opal.get_singleton_class(object) : (object.$$meta || object.$$class));

    for (i = 0, length = ancestors.length; i < length; i++) {
      if (ancestors[i] === klass) {
        return true;
      }
    }

    return false;
  };

  // Helpers for extracting kwsplats
  // Used for: { **h }
  Opal.to_hash = function(value) {
    if (value.$$is_hash) {
      return value;
    }
    else if (value['$respond_to?']('to_hash', true)) {
      var hash = value.$to_hash();
      if (hash.$$is_hash) {
        return hash;
      }
      else {
        throw Opal.TypeError.$new("Can't convert " + value.$$class +
          " to Hash (" + value.$$class + "#to_hash gives " + hash.$$class + ")");
      }
    }
    else {
      throw Opal.TypeError.$new("no implicit conversion of " + value.$$class + " into Hash");
    }
  };

  // Helpers for implementing multiple assignment
  // Our code for extracting the values and assigning them only works if the
  // return value is a JS array.
  // So if we get an Array subclass, extract the wrapped JS array from it

  // Used for: a, b = something (no splat)
  Opal.to_ary = function(value) {
    if (value.$$is_array) {
      return value;
    }
    else if (value['$respond_to?']('to_ary', true)) {
      var ary = value.$to_ary();
      if (ary === nil) {
        return [value];
      }
      else if (ary.$$is_array) {
        return ary;
      }
      else {
        throw Opal.TypeError.$new("Can't convert " + value.$$class +
          " to Array (" + value.$$class + "#to_ary gives " + ary.$$class + ")");
      }
    }
    else {
      return [value];
    }
  };

  // Used for: a, b = *something (with splat)
  Opal.to_a = function(value) {
    if (value.$$is_array) {
      // A splatted array must be copied
      return value.slice();
    }
    else if (value['$respond_to?']('to_a', true)) {
      var ary = value.$to_a();
      if (ary === nil) {
        return [value];
      }
      else if (ary.$$is_array) {
        return ary;
      }
      else {
        throw Opal.TypeError.$new("Can't convert " + value.$$class +
          " to Array (" + value.$$class + "#to_a gives " + ary.$$class + ")");
      }
    }
    else {
      return [value];
    }
  };

  // Used for extracting keyword arguments from arguments passed to
  // JS function. If provided +arguments+ list doesn't have a Hash
  // as a last item, returns a blank Hash.
  //
  // @param parameters [Array]
  // @return [Hash]
  //
  Opal.extract_kwargs = function(parameters) {
    var kwargs = parameters[parameters.length - 1];
    if (kwargs != null && kwargs['$respond_to?']('to_hash', true)) {
      $splice.call(parameters, parameters.length - 1, 1);
      return kwargs.$to_hash();
    }
    else {
      return Opal.hash2([], {});
    }
  }

  // Used to get a list of rest keyword arguments. Method takes the given
  // keyword args, i.e. the hash literal passed to the method containing all
  // keyword arguemnts passed to method, as well as the used args which are
  // the names of required and optional arguments defined. This method then
  // just returns all key/value pairs which have not been used, in a new
  // hash literal.
  //
  // @param given_args [Hash] all kwargs given to method
  // @param used_args [Object<String: true>] all keys used as named kwargs
  // @return [Hash]
  //
  Opal.kwrestargs = function(given_args, used_args) {
    var keys      = [],
        map       = {},
        key       = null,
        given_map = given_args.$$smap;

    for (key in given_map) {
      if (!used_args[key]) {
        keys.push(key);
        map[key] = given_map[key];
      }
    }

    return Opal.hash2(keys, map);
  };

  // Calls passed method on a ruby object with arguments and block:
  //
  // Can take a method or a method name.
  //
  // 1. When method name gets passed it invokes it by its name
  //    and calls 'method_missing' when object doesn't have this method.
  //    Used internally by Opal to invoke method that takes a block or a splat.
  // 2. When method (i.e. method body) gets passed, it doesn't trigger 'method_missing'
  //    because it doesn't know the name of the actual method.
  //    Used internally by Opal to invoke 'super'.
  //
  // @example
  //   var my_array = [1, 2, 3, 4]
  //   Opal.send(my_array, 'length')                    # => 4
  //   Opal.send(my_array, my_array.$length)            # => 4
  //
  //   Opal.send(my_array, 'reverse!')                  # => [4, 3, 2, 1]
  //   Opal.send(my_array, my_array['$reverse!']')      # => [4, 3, 2, 1]
  //
  // @param recv [Object] ruby object
  // @param method [Function, String] method body or name of the method
  // @param args [Array] arguments that will be passed to the method call
  // @param block [Function] ruby block
  // @return [Object] returning value of the method call
  Opal.send = function(recv, method, args, block) {
    var body = (typeof(method) === 'string') ? recv['$'+method] : method;

    if (body != null) {
      if (typeof block === 'function') {
        body.$$p = block;
      }
      return body.apply(recv, args);
    }

    return recv.$method_missing.apply(recv, [method].concat(args));
  }

  Opal.lambda = function(block) {
    block.$$is_lambda = true;
    return block;
  }

  // Used to define methods on an object. This is a helper method, used by the
  // compiled source to define methods on special case objects when the compiler
  // can not determine the destination object, or the object is a Module
  // instance. This can get called by `Module#define_method` as well.
  //
  // ## Modules
  //
  // Any method defined on a module will come through this runtime helper.
  // The method is added to the module body, and the owner of the method is
  // set to be the module itself. This is used later when choosing which
  // method should show on a class if more than 1 included modules define
  // the same method. Finally, if the module is in `module_function` mode,
  // then the method is also defined onto the module itself.
  //
  // ## Classes
  //
  // This helper will only be called for classes when a method is being
  // defined indirectly; either through `Module#define_method`, or by a
  // literal `def` method inside an `instance_eval` or `class_eval` body. In
  // either case, the method is simply added to the class' prototype. A special
  // exception exists for `BasicObject` and `Object`. These two classes are
  // special because they are used in toll-free bridged classes. In each of
  // these two cases, extra work is required to define the methods on toll-free
  // bridged class' prototypes as well.
  //
  // ## Objects
  //
  // If a simple ruby object is the object, then the method is simply just
  // defined on the object as a singleton method. This would be the case when
  // a method is defined inside an `instance_eval` block.
  //
  // @param obj  [Object, Class] the actual obj to define method for
  // @param jsid [String] the JavaScript friendly method name (e.g. '$foo')
  // @param body [JS.Function] the literal JavaScript function used as method
  // @return [null]
  //
  Opal.def = function(obj, jsid, body) {
    // Special case for a method definition in the
    // top-level namespace
    if (obj === Opal.top) {
      Opal.defn(Opal.Object, jsid, body)
    }
    // if instance_eval is invoked on a module/class, it sets inst_eval_mod
    else if (!obj.$$eval && obj.$$is_a_module) {
      Opal.defn(obj, jsid, body);
    }
    else {
      Opal.defs(obj, jsid, body);
    }
  };

  // Define method on a module or class (see Opal.def).
  Opal.defn = function(module, jsid, body) {
    body.displayName = jsid;
    body.$$owner = module;

    var proto = module.$$prototype;
    if (proto.hasOwnProperty('$$dummy')) {
      proto = proto.$$define_methods_on;
    }
    $defineProperty(proto, jsid, body);

    if (module.$$is_module) {
      if (module.$$module_function) {
        Opal.defs(module, jsid, body)
      }

      for (var i = 0, iclasses = module.$$iclasses, length = iclasses.length; i < length; i++) {
        var iclass = iclasses[i];
        $defineProperty(iclass, jsid, body);
      }
    }

    var singleton_of = module.$$singleton_of;
    if (module.$method_added && !module.$method_added.$$stub && !singleton_of) {
      module.$method_added(jsid.substr(1));
    }
    else if (singleton_of && singleton_of.$singleton_method_added && !singleton_of.$singleton_method_added.$$stub) {
      singleton_of.$singleton_method_added(jsid.substr(1));
    }
  }

  // Define a singleton method on the given object (see Opal.def).
  Opal.defs = function(obj, jsid, body) {
    if (obj.$$is_string || obj.$$is_number) {
      throw Opal.TypeError.$new("can't define singleton");
    }
    Opal.defn(Opal.get_singleton_class(obj), jsid, body)
  };

  // Called from #remove_method.
  Opal.rdef = function(obj, jsid) {
    if (!$hasOwn.call(obj.$$prototype, jsid)) {
      throw Opal.NameError.$new("method '" + jsid.substr(1) + "' not defined in " + obj.$name());
    }

    delete obj.$$prototype[jsid];

    if (obj.$$is_singleton) {
      if (obj.$$prototype.$singleton_method_removed && !obj.$$prototype.$singleton_method_removed.$$stub) {
        obj.$$prototype.$singleton_method_removed(jsid.substr(1));
      }
    }
    else {
      if (obj.$method_removed && !obj.$method_removed.$$stub) {
        obj.$method_removed(jsid.substr(1));
      }
    }
  };

  // Called from #undef_method.
  Opal.udef = function(obj, jsid) {
    if (!obj.$$prototype[jsid] || obj.$$prototype[jsid].$$stub) {
      throw Opal.NameError.$new("method '" + jsid.substr(1) + "' not defined in " + obj.$name());
    }

    Opal.add_stub_for(obj.$$prototype, jsid);

    if (obj.$$is_singleton) {
      if (obj.$$prototype.$singleton_method_undefined && !obj.$$prototype.$singleton_method_undefined.$$stub) {
        obj.$$prototype.$singleton_method_undefined(jsid.substr(1));
      }
    }
    else {
      if (obj.$method_undefined && !obj.$method_undefined.$$stub) {
        obj.$method_undefined(jsid.substr(1));
      }
    }
  };

  function is_method_body(body) {
    return (typeof(body) === "function" && !body.$$stub);
  }

  Opal.alias = function(obj, name, old) {
    var id     = '$' + name,
        old_id = '$' + old,
        body   = obj.$$prototype['$' + old],
        alias;

    // When running inside #instance_eval the alias refers to class methods.
    if (obj.$$eval) {
      return Opal.alias(Opal.get_singleton_class(obj), name, old);
    }

    if (!is_method_body(body)) {
      var ancestor = obj.$$super;

      while (typeof(body) !== "function" && ancestor) {
        body     = ancestor[old_id];
        ancestor = ancestor.$$super;
      }

      if (!is_method_body(body) && obj.$$is_module) {
        // try to look into Object
        body = Opal.Object.$$prototype[old_id]
      }

      if (!is_method_body(body)) {
        throw Opal.NameError.$new("undefined method `" + old + "' for class `" + obj.$name() + "'")
      }
    }

    // If the body is itself an alias use the original body
    // to keep the max depth at 1.
    if (body.$$alias_of) body = body.$$alias_of;

    // We need a wrapper because otherwise properties
    // would be ovrewritten on the original body.
    alias = function() {
      var block = alias.$$p, args, i, ii;

      args = new Array(arguments.length);
      for(i = 0, ii = arguments.length; i < ii; i++) {
        args[i] = arguments[i];
      }

      if (block != null) { alias.$$p = null }

      return Opal.send(this, body, args, block);
    };

    // Try to make the browser pick the right name
    alias.displayName       = name;
    alias.length            = body.length;
    alias.$$arity           = body.$$arity;
    alias.$$parameters      = body.$$parameters;
    alias.$$source_location = body.$$source_location;
    alias.$$alias_of        = body;
    alias.$$alias_name      = name;

    Opal.defn(obj, id, alias);

    return obj;
  };

  Opal.alias_native = function(obj, name, native_name) {
    var id   = '$' + name,
        body = obj.$$prototype[native_name];

    if (typeof(body) !== "function" || body.$$stub) {
      throw Opal.NameError.$new("undefined native method `" + native_name + "' for class `" + obj.$name() + "'")
    }

    Opal.defn(obj, id, body);

    return obj;
  };


  // Hashes
  // ------

  Opal.hash_init = function(hash) {
    hash.$$smap = Object.create(null);
    hash.$$map  = Object.create(null);
    hash.$$keys = [];
  };

  Opal.hash_clone = function(from_hash, to_hash) {
    to_hash.$$none = from_hash.$$none;
    to_hash.$$proc = from_hash.$$proc;

    for (var i = 0, keys = from_hash.$$keys, smap = from_hash.$$smap, len = keys.length, key, value; i < len; i++) {
      key = keys[i];

      if (key.$$is_string) {
        value = smap[key];
      } else {
        value = key.value;
        key = key.key;
      }

      Opal.hash_put(to_hash, key, value);
    }
  };

  Opal.hash_put = function(hash, key, value) {
    if (key.$$is_string) {
      if (!$hasOwn.call(hash.$$smap, key)) {
        hash.$$keys.push(key);
      }
      hash.$$smap[key] = value;
      return;
    }

    var key_hash, bucket, last_bucket;
    key_hash = hash.$$by_identity ? Opal.id(key) : key.$hash();

    if (!$hasOwn.call(hash.$$map, key_hash)) {
      bucket = {key: key, key_hash: key_hash, value: value};
      hash.$$keys.push(bucket);
      hash.$$map[key_hash] = bucket;
      return;
    }

    bucket = hash.$$map[key_hash];

    while (bucket) {
      if (key === bucket.key || key['$eql?'](bucket.key)) {
        last_bucket = undefined;
        bucket.value = value;
        break;
      }
      last_bucket = bucket;
      bucket = bucket.next;
    }

    if (last_bucket) {
      bucket = {key: key, key_hash: key_hash, value: value};
      hash.$$keys.push(bucket);
      last_bucket.next = bucket;
    }
  };

  Opal.hash_get = function(hash, key) {
    if (key.$$is_string) {
      if ($hasOwn.call(hash.$$smap, key)) {
        return hash.$$smap[key];
      }
      return;
    }

    var key_hash, bucket;
    key_hash = hash.$$by_identity ? Opal.id(key) : key.$hash();

    if ($hasOwn.call(hash.$$map, key_hash)) {
      bucket = hash.$$map[key_hash];

      while (bucket) {
        if (key === bucket.key || key['$eql?'](bucket.key)) {
          return bucket.value;
        }
        bucket = bucket.next;
      }
    }
  };

  Opal.hash_delete = function(hash, key) {
    var i, keys = hash.$$keys, length = keys.length, value;

    if (key.$$is_string) {
      if (!$hasOwn.call(hash.$$smap, key)) {
        return;
      }

      for (i = 0; i < length; i++) {
        if (keys[i] === key) {
          keys.splice(i, 1);
          break;
        }
      }

      value = hash.$$smap[key];
      delete hash.$$smap[key];
      return value;
    }

    var key_hash = key.$hash();

    if (!$hasOwn.call(hash.$$map, key_hash)) {
      return;
    }

    var bucket = hash.$$map[key_hash], last_bucket;

    while (bucket) {
      if (key === bucket.key || key['$eql?'](bucket.key)) {
        value = bucket.value;

        for (i = 0; i < length; i++) {
          if (keys[i] === bucket) {
            keys.splice(i, 1);
            break;
          }
        }

        if (last_bucket && bucket.next) {
          last_bucket.next = bucket.next;
        }
        else if (last_bucket) {
          delete last_bucket.next;
        }
        else if (bucket.next) {
          hash.$$map[key_hash] = bucket.next;
        }
        else {
          delete hash.$$map[key_hash];
        }

        return value;
      }
      last_bucket = bucket;
      bucket = bucket.next;
    }
  };

  Opal.hash_rehash = function(hash) {
    for (var i = 0, length = hash.$$keys.length, key_hash, bucket, last_bucket; i < length; i++) {

      if (hash.$$keys[i].$$is_string) {
        continue;
      }

      key_hash = hash.$$keys[i].key.$hash();

      if (key_hash === hash.$$keys[i].key_hash) {
        continue;
      }

      bucket = hash.$$map[hash.$$keys[i].key_hash];
      last_bucket = undefined;

      while (bucket) {
        if (bucket === hash.$$keys[i]) {
          if (last_bucket && bucket.next) {
            last_bucket.next = bucket.next;
          }
          else if (last_bucket) {
            delete last_bucket.next;
          }
          else if (bucket.next) {
            hash.$$map[hash.$$keys[i].key_hash] = bucket.next;
          }
          else {
            delete hash.$$map[hash.$$keys[i].key_hash];
          }
          break;
        }
        last_bucket = bucket;
        bucket = bucket.next;
      }

      hash.$$keys[i].key_hash = key_hash;

      if (!$hasOwn.call(hash.$$map, key_hash)) {
        hash.$$map[key_hash] = hash.$$keys[i];
        continue;
      }

      bucket = hash.$$map[key_hash];
      last_bucket = undefined;

      while (bucket) {
        if (bucket === hash.$$keys[i]) {
          last_bucket = undefined;
          break;
        }
        last_bucket = bucket;
        bucket = bucket.next;
      }

      if (last_bucket) {
        last_bucket.next = hash.$$keys[i];
      }
    }
  };

  Opal.hash = function() {
    var arguments_length = arguments.length, args, hash, i, length, key, value;

    if (arguments_length === 1 && arguments[0].$$is_hash) {
      return arguments[0];
    }

    hash = new Opal.Hash();
    Opal.hash_init(hash);

    if (arguments_length === 1 && arguments[0].$$is_array) {
      args = arguments[0];
      length = args.length;

      for (i = 0; i < length; i++) {
        if (args[i].length !== 2) {
          throw Opal.ArgumentError.$new("value not of length 2: " + args[i].$inspect());
        }

        key = args[i][0];
        value = args[i][1];

        Opal.hash_put(hash, key, value);
      }

      return hash;
    }

    if (arguments_length === 1) {
      args = arguments[0];
      for (key in args) {
        if ($hasOwn.call(args, key)) {
          value = args[key];

          Opal.hash_put(hash, key, value);
        }
      }

      return hash;
    }

    if (arguments_length % 2 !== 0) {
      throw Opal.ArgumentError.$new("odd number of arguments for Hash");
    }

    for (i = 0; i < arguments_length; i += 2) {
      key = arguments[i];
      value = arguments[i + 1];

      Opal.hash_put(hash, key, value);
    }

    return hash;
  };

  // A faster Hash creator for hashes that just use symbols and
  // strings as keys. The map and keys array can be constructed at
  // compile time, so they are just added here by the constructor
  // function.
  //
  Opal.hash2 = function(keys, smap) {
    var hash = new Opal.Hash();

    hash.$$smap = smap;
    hash.$$map  = Object.create(null);
    hash.$$keys = keys;

    return hash;
  };

  // Create a new range instance with first and last values, and whether the
  // range excludes the last value.
  //
  Opal.range = function(first, last, exc) {
    var range         = new Opal.Range();
        range.begin   = first;
        range.end     = last;
        range.excl    = exc;

    return range;
  };

  // Get the ivar name for a given name.
  // Mostly adds a trailing $ to reserved names.
  //
  Opal.ivar = function(name) {
    if (
        // properties
        name === "constructor" ||
        name === "displayName" ||
        name === "__count__" ||
        name === "__noSuchMethod__" ||
        name === "__parent__" ||
        name === "__proto__" ||

        // methods
        name === "hasOwnProperty" ||
        name === "valueOf"
       )
    {
      return name + "$";
    }

    return name;
  };


  // Regexps
  // -------

  // Escape Regexp special chars letting the resulting string be used to build
  // a new Regexp.
  //
  Opal.escape_regexp = function(str) {
    return str.replace(/([-[\]\/{}()*+?.^$\\| ])/g, '\\$1')
              .replace(/[\n]/g, '\\n')
              .replace(/[\r]/g, '\\r')
              .replace(/[\f]/g, '\\f')
              .replace(/[\t]/g, '\\t');
  };

  // Create a global Regexp from a RegExp object and cache the result
  // on the object itself ($$g attribute).
  //
  Opal.global_regexp = function(pattern) {
    if (pattern.global) {
      return pattern; // RegExp already has the global flag
    }
    if (pattern.$$g == null) {
      pattern.$$g = new RegExp(pattern.source, (pattern.multiline ? 'gm' : 'g') + (pattern.ignoreCase ? 'i' : ''));
    } else {
      pattern.$$g.lastIndex = null; // reset lastIndex property
    }
    return pattern.$$g;
  };

  // Create a global multiline Regexp from a RegExp object and cache the result
  // on the object itself ($$gm or $$g attribute).
  //
  Opal.global_multiline_regexp = function(pattern) {
    var result;
    if (pattern.multiline) {
      if (pattern.global) {
        return pattern; // RegExp already has the global and multiline flag
      }
      // we are using the $$g attribute because the Regexp is already multiline
      if (pattern.$$g != null) {
        result = pattern.$$g;
      } else {
        result = pattern.$$g = new RegExp(pattern.source, 'gm' + (pattern.ignoreCase ? 'i' : ''));
      }
    } else if (pattern.$$gm != null) {
      result = pattern.$$gm;
    } else {
      result = pattern.$$gm = new RegExp(pattern.source, 'gm' + (pattern.ignoreCase ? 'i' : ''));
    }
    result.lastIndex = null; // reset lastIndex property
    return result;
  };

  // Require system
  // --------------

  Opal.modules         = {};
  Opal.loaded_features = ['corelib/runtime'];
  Opal.current_dir     = '.';
  Opal.require_table   = {'corelib/runtime': true};

  Opal.normalize = function(path) {
    var parts, part, new_parts = [], SEPARATOR = '/';

    if (Opal.current_dir !== '.') {
      path = Opal.current_dir.replace(/\/*$/, '/') + path;
    }

    path = path.replace(/^\.\//, '');
    path = path.replace(/\.(rb|opal|js)$/, '');
    parts = path.split(SEPARATOR);

    for (var i = 0, ii = parts.length; i < ii; i++) {
      part = parts[i];
      if (part === '') continue;
      (part === '..') ? new_parts.pop() : new_parts.push(part)
    }

    return new_parts.join(SEPARATOR);
  };

  Opal.loaded = function(paths) {
    var i, l, path;

    for (i = 0, l = paths.length; i < l; i++) {
      path = Opal.normalize(paths[i]);

      if (Opal.require_table[path]) {
        continue;
      }

      Opal.loaded_features.push(path);
      Opal.require_table[path] = true;
    }
  };

  Opal.load = function(path) {
    path = Opal.normalize(path);

    Opal.loaded([path]);

    var module = Opal.modules[path];

    if (module) {
      module(Opal);
    }
    else {
      var severity = Opal.config.missing_require_severity;
      var message  = 'cannot load such file -- ' + path;

      if (severity === "error") {
        if (Opal.LoadError) {
          throw Opal.LoadError.$new(message)
        } else {
          throw message
        }
      }
      else if (severity === "warning") {
        console.warn('WARNING: LoadError: ' + message);
      }
    }

    return true;
  };

  Opal.require = function(path) {
    path = Opal.normalize(path);

    if (Opal.require_table[path]) {
      return false;
    }

    return Opal.load(path);
  };


  // Initialization
  // --------------
  function $BasicObject() {};
  function $Object() {};
  function $Module() {};
  function $Class() {};

  Opal.BasicObject = BasicObject = Opal.allocate_class('BasicObject', null, $BasicObject);
  Opal.Object      = _Object     = Opal.allocate_class('Object', Opal.BasicObject, $Object);
  Opal.Module      = Module      = Opal.allocate_class('Module', Opal.Object, $Module);
  Opal.Class       = Class       = Opal.allocate_class('Class', Opal.Module, $Class);

  $setPrototype(Opal.BasicObject, Opal.Class.$$prototype);
  $setPrototype(Opal.Object, Opal.Class.$$prototype);
  $setPrototype(Opal.Module, Opal.Class.$$prototype);
  $setPrototype(Opal.Class, Opal.Class.$$prototype);

  // BasicObject can reach itself, avoid const_set to skip the $$base_module logic
  BasicObject.$$const["BasicObject"] = BasicObject;

  // Assign basic constants
  Opal.const_set(_Object, "BasicObject",  BasicObject);
  Opal.const_set(_Object, "Object",       _Object);
  Opal.const_set(_Object, "Module",       Module);
  Opal.const_set(_Object, "Class",        Class);

  // Fix booted classes to have correct .class value
  BasicObject.$$class = Class;
  _Object.$$class     = Class;
  Module.$$class      = Class;
  Class.$$class       = Class;

  // Forward .toString() to #to_s
  $defineProperty(_Object.$$prototype, 'toString', function() {
    var to_s = this.$to_s();
    if (to_s.$$is_string && typeof(to_s) === 'object') {
      // a string created using new String('string')
      return to_s.valueOf();
    } else {
      return to_s;
    }
  });

  // Make Kernel#require immediately available as it's needed to require all the
  // other corelib files.
  $defineProperty(_Object.$$prototype, '$require', Opal.require);

  // Add a short helper to navigate constants manually.
  // @example
  //   Opal.$$.Regexp.$$.IGNORECASE
  Opal.$$ = _Object.$$;

  // Instantiate the main object
  Opal.top = new _Object();
  Opal.top.$to_s = Opal.top.$inspect = function() { return 'main' };


  // Nil
  function $NilClass() {};
  Opal.NilClass = Opal.allocate_class('NilClass', Opal.Object, $NilClass);
  Opal.const_set(_Object, 'NilClass', Opal.NilClass);
  nil = Opal.nil = new Opal.NilClass();
  nil.$$id = nil_id;
  nil.call = nil.apply = function() { throw Opal.LocalJumpError.$new('no block given'); };

  // Errors
  Opal.breaker  = new Error('unexpected break (old)');
  Opal.returner = new Error('unexpected return');
  TypeError.$$super = Error;
}).call(this);
Opal.loaded(["corelib/runtime.js"]);
/* Generated by Opal 0.11.99.dev */
Opal.modules["corelib/helpers"] = function(Opal) {
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice, $module = Opal.module, $truthy = Opal.truthy;

  Opal.add_stubs(['$new', '$class', '$===', '$respond_to?', '$raise', '$type_error', '$__send__', '$coerce_to', '$nil?', '$<=>', '$coerce_to!', '$!=', '$[]', '$upcase']);
  return (function($base, $parent_nesting) {
    var self = $module($base, 'Opal');

    var $nesting = [self].concat($parent_nesting), $Opal_bridge$1, $Opal_type_error$2, $Opal_coerce_to$3, $Opal_coerce_to$excl$4, $Opal_coerce_to$ques$5, $Opal_try_convert$6, $Opal_compare$7, $Opal_destructure$8, $Opal_respond_to$ques$9, $Opal_inspect_obj$10, $Opal_instance_variable_name$excl$11, $Opal_class_variable_name$excl$12, $Opal_const_name$excl$13, $Opal_pristine$14;

    
    Opal.defs(self, '$bridge', $Opal_bridge$1 = function $$bridge(constructor, klass) {
      var self = this;

      return Opal.bridge(constructor, klass);
    }, $Opal_bridge$1.$$arity = 2);
    Opal.defs(self, '$type_error', $Opal_type_error$2 = function $$type_error(object, type, method, coerced) {
      var $a, self = this;

      
      
      if (method == null) {
        method = nil;
      };
      
      if (coerced == null) {
        coerced = nil;
      };
      if ($truthy(($truthy($a = method) ? coerced : $a))) {
        return $$($nesting, 'TypeError').$new("" + "can't convert " + (object.$class()) + " into " + (type) + " (" + (object.$class()) + "#" + (method) + " gives " + (coerced.$class()) + ")")
      } else {
        return $$($nesting, 'TypeError').$new("" + "no implicit conversion of " + (object.$class()) + " into " + (type))
      };
    }, $Opal_type_error$2.$$arity = -3);
    Opal.defs(self, '$coerce_to', $Opal_coerce_to$3 = function $$coerce_to(object, type, method) {
      var self = this;

      
      if ($truthy(type['$==='](object))) {
        return object};
      if ($truthy(object['$respond_to?'](method))) {
      } else {
        self.$raise(self.$type_error(object, type))
      };
      return object.$__send__(method);
    }, $Opal_coerce_to$3.$$arity = 3);
    Opal.defs(self, '$coerce_to!', $Opal_coerce_to$excl$4 = function(object, type, method) {
      var self = this, coerced = nil;

      
      coerced = self.$coerce_to(object, type, method);
      if ($truthy(type['$==='](coerced))) {
      } else {
        self.$raise(self.$type_error(object, type, method, coerced))
      };
      return coerced;
    }, $Opal_coerce_to$excl$4.$$arity = 3);
    Opal.defs(self, '$coerce_to?', $Opal_coerce_to$ques$5 = function(object, type, method) {
      var self = this, coerced = nil;

      
      if ($truthy(object['$respond_to?'](method))) {
      } else {
        return nil
      };
      coerced = self.$coerce_to(object, type, method);
      if ($truthy(coerced['$nil?']())) {
        return nil};
      if ($truthy(type['$==='](coerced))) {
      } else {
        self.$raise(self.$type_error(object, type, method, coerced))
      };
      return coerced;
    }, $Opal_coerce_to$ques$5.$$arity = 3);
    Opal.defs(self, '$try_convert', $Opal_try_convert$6 = function $$try_convert(object, type, method) {
      var self = this;

      
      if ($truthy(type['$==='](object))) {
        return object};
      if ($truthy(object['$respond_to?'](method))) {
        return object.$__send__(method)
      } else {
        return nil
      };
    }, $Opal_try_convert$6.$$arity = 3);
    Opal.defs(self, '$compare', $Opal_compare$7 = function $$compare(a, b) {
      var self = this, compare = nil;

      
      compare = a['$<=>'](b);
      if ($truthy(compare === nil)) {
        self.$raise($$($nesting, 'ArgumentError'), "" + "comparison of " + (a.$class()) + " with " + (b.$class()) + " failed")};
      return compare;
    }, $Opal_compare$7.$$arity = 2);
    Opal.defs(self, '$destructure', $Opal_destructure$8 = function $$destructure(args) {
      var self = this;

      
      if (args.length == 1) {
        return args[0];
      }
      else if (args.$$is_array) {
        return args;
      }
      else {
        var args_ary = new Array(args.length);
        for(var i = 0, l = args_ary.length; i < l; i++) { args_ary[i] = args[i]; }

        return args_ary;
      }
    
    }, $Opal_destructure$8.$$arity = 1);
    Opal.defs(self, '$respond_to?', $Opal_respond_to$ques$9 = function(obj, method, include_all) {
      var self = this;

      
      
      if (include_all == null) {
        include_all = false;
      };
      
      if (obj == null || !obj.$$class) {
        return false;
      }
    ;
      return obj['$respond_to?'](method, include_all);
    }, $Opal_respond_to$ques$9.$$arity = -3);
    Opal.defs(self, '$inspect_obj', $Opal_inspect_obj$10 = function $$inspect_obj(obj) {
      var self = this;

      return Opal.inspect(obj);
    }, $Opal_inspect_obj$10.$$arity = 1);
    Opal.defs(self, '$instance_variable_name!', $Opal_instance_variable_name$excl$11 = function(name) {
      var self = this;

      
      name = $$($nesting, 'Opal')['$coerce_to!'](name, $$($nesting, 'String'), "to_str");
      if ($truthy(/^@[a-zA-Z_][a-zA-Z0-9_]*?$/.test(name))) {
      } else {
        self.$raise($$($nesting, 'NameError').$new("" + "'" + (name) + "' is not allowed as an instance variable name", name))
      };
      return name;
    }, $Opal_instance_variable_name$excl$11.$$arity = 1);
    Opal.defs(self, '$class_variable_name!', $Opal_class_variable_name$excl$12 = function(name) {
      var self = this;

      
      name = $$($nesting, 'Opal')['$coerce_to!'](name, $$($nesting, 'String'), "to_str");
      if ($truthy(name.length < 3 || name.slice(0,2) !== '@@')) {
        self.$raise($$($nesting, 'NameError').$new("" + "`" + (name) + "' is not allowed as a class variable name", name))};
      return name;
    }, $Opal_class_variable_name$excl$12.$$arity = 1);
    Opal.defs(self, '$const_name!', $Opal_const_name$excl$13 = function(const_name) {
      var self = this;

      
      const_name = $$($nesting, 'Opal')['$coerce_to!'](const_name, $$($nesting, 'String'), "to_str");
      if ($truthy(const_name['$[]'](0)['$!='](const_name['$[]'](0).$upcase()))) {
        self.$raise($$($nesting, 'NameError'), "" + "wrong constant name " + (const_name))};
      return const_name;
    }, $Opal_const_name$excl$13.$$arity = 1);
    Opal.defs(self, '$pristine', $Opal_pristine$14 = function $$pristine(owner_class, $a) {
      var $post_args, method_names, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 1, arguments.length);
      
      method_names = $post_args;;
      
      var method_name, method;
      for (var i = method_names.length - 1; i >= 0; i--) {
        method_name = method_names[i];
        method = owner_class.$$prototype['$'+method_name];

        if (method && !method.$$stub) {
          method.$$pristine = true;
        }
      }
    ;
      return nil;
    }, $Opal_pristine$14.$$arity = -2);
  })($nesting[0], $nesting)
};

/* Generated by Opal 0.11.99.dev */
Opal.modules["corelib/module"] = function(Opal) {
  function $rb_lt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs < rhs : lhs['$<'](rhs);
  }
  function $rb_gt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs > rhs : lhs['$>'](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice, $klass = Opal.klass, $send = Opal.send, $truthy = Opal.truthy, $lambda = Opal.lambda, $range = Opal.range, $hash2 = Opal.hash2;

  Opal.add_stubs(['$module_eval', '$to_proc', '$===', '$raise', '$equal?', '$<', '$>', '$nil?', '$attr_reader', '$attr_writer', '$class_variable_name!', '$new', '$const_name!', '$=~', '$inject', '$split', '$const_get', '$==', '$!~', '$start_with?', '$bind', '$call', '$class', '$append_features', '$included', '$name', '$cover?', '$size', '$merge', '$compile', '$proc', '$any?', '$prepend_features', '$prepended', '$to_s', '$__id__', '$constants', '$include?', '$copy_class_variables', '$copy_constants']);
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Module');

    var $nesting = [self].concat($parent_nesting), $Module_allocate$1, $Module_initialize$2, $Module_$eq_eq_eq$3, $Module_$lt$4, $Module_$lt_eq$5, $Module_$gt$6, $Module_$gt_eq$7, $Module_$lt_eq_gt$8, $Module_alias_method$9, $Module_alias_native$10, $Module_ancestors$11, $Module_append_features$12, $Module_attr_accessor$13, $Module_attr_reader$14, $Module_attr_writer$15, $Module_autoload$16, $Module_class_variables$17, $Module_class_variable_get$18, $Module_class_variable_set$19, $Module_class_variable_defined$ques$20, $Module_remove_class_variable$21, $Module_constants$22, $Module_constants$23, $Module_nesting$24, $Module_const_defined$ques$25, $Module_const_get$26, $Module_const_missing$28, $Module_const_set$29, $Module_public_constant$30, $Module_define_method$31, $Module_remove_method$33, $Module_singleton_class$ques$34, $Module_include$35, $Module_included_modules$36, $Module_include$ques$37, $Module_instance_method$38, $Module_instance_methods$39, $Module_included$40, $Module_extended$41, $Module_extend_object$42, $Module_method_added$43, $Module_method_removed$44, $Module_method_undefined$45, $Module_module_eval$46, $Module_module_exec$48, $Module_method_defined$ques$49, $Module_module_function$50, $Module_name$51, $Module_prepend$52, $Module_prepend_features$53, $Module_prepended$54, $Module_remove_const$55, $Module_to_s$56, $Module_undef_method$57, $Module_instance_variables$58, $Module_dup$59, $Module_copy_class_variables$60, $Module_copy_constants$61;

    
    Opal.defs(self, '$allocate', $Module_allocate$1 = function $$allocate() {
      var self = this;

      
      var module = Opal.allocate_module(nil, function(){});
      // Link the prototype of Module subclasses
      if (self !== Opal.Module) Object.setPrototypeOf(module, self.$$prototype);
      return module;
    
    }, $Module_allocate$1.$$arity = 0);
    
    Opal.def(self, '$initialize', $Module_initialize$2 = function $$initialize() {
      var $iter = $Module_initialize$2.$$p, block = $iter || nil, self = this;

      if ($iter) $Module_initialize$2.$$p = null;
      
      
      if ($iter) $Module_initialize$2.$$p = null;;
      if ((block !== nil)) {
        return $send(self, 'module_eval', [], block.$to_proc())
      } else {
        return nil
      };
    }, $Module_initialize$2.$$arity = 0);
    
    Opal.def(self, '$===', $Module_$eq_eq_eq$3 = function(object) {
      var self = this;

      
      if ($truthy(object == null)) {
        return false};
      return Opal.is_a(object, self);;
    }, $Module_$eq_eq_eq$3.$$arity = 1);
    
    Opal.def(self, '$<', $Module_$lt$4 = function(other) {
      var self = this;

      
      if ($truthy($$($nesting, 'Module')['$==='](other))) {
      } else {
        self.$raise($$($nesting, 'TypeError'), "compared with non class/module")
      };
      
      var working = self,
          ancestors,
          i, length;

      if (working === other) {
        return false;
      }

      for (i = 0, ancestors = Opal.ancestors(self), length = ancestors.length; i < length; i++) {
        if (ancestors[i] === other) {
          return true;
        }
      }

      for (i = 0, ancestors = Opal.ancestors(other), length = ancestors.length; i < length; i++) {
        if (ancestors[i] === self) {
          return false;
        }
      }

      return nil;
    ;
    }, $Module_$lt$4.$$arity = 1);
    
    Opal.def(self, '$<=', $Module_$lt_eq$5 = function(other) {
      var $a, self = this;

      return ($truthy($a = self['$equal?'](other)) ? $a : $rb_lt(self, other))
    }, $Module_$lt_eq$5.$$arity = 1);
    
    Opal.def(self, '$>', $Module_$gt$6 = function(other) {
      var self = this;

      
      if ($truthy($$($nesting, 'Module')['$==='](other))) {
      } else {
        self.$raise($$($nesting, 'TypeError'), "compared with non class/module")
      };
      return $rb_lt(other, self);
    }, $Module_$gt$6.$$arity = 1);
    
    Opal.def(self, '$>=', $Module_$gt_eq$7 = function(other) {
      var $a, self = this;

      return ($truthy($a = self['$equal?'](other)) ? $a : $rb_gt(self, other))
    }, $Module_$gt_eq$7.$$arity = 1);
    
    Opal.def(self, '$<=>', $Module_$lt_eq_gt$8 = function(other) {
      var self = this, lt = nil;

      
      
      if (self === other) {
        return 0;
      }
    ;
      if ($truthy($$($nesting, 'Module')['$==='](other))) {
      } else {
        return nil
      };
      lt = $rb_lt(self, other);
      if ($truthy(lt['$nil?']())) {
        return nil};
      if ($truthy(lt)) {
        return -1
      } else {
        return 1
      };
    }, $Module_$lt_eq_gt$8.$$arity = 1);
    
    Opal.def(self, '$alias_method', $Module_alias_method$9 = function $$alias_method(newname, oldname) {
      var self = this;

      
      Opal.alias(self, newname, oldname);
      return self;
    }, $Module_alias_method$9.$$arity = 2);
    
    Opal.def(self, '$alias_native', $Module_alias_native$10 = function $$alias_native(mid, jsid) {
      var self = this;

      
      
      if (jsid == null) {
        jsid = mid;
      };
      Opal.alias_native(self, mid, jsid);
      return self;
    }, $Module_alias_native$10.$$arity = -2);
    
    Opal.def(self, '$ancestors', $Module_ancestors$11 = function $$ancestors() {
      var self = this;

      return Opal.ancestors(self);
    }, $Module_ancestors$11.$$arity = 0);
    
    Opal.def(self, '$append_features', $Module_append_features$12 = function $$append_features(includer) {
      var self = this;

      
      Opal.append_features(self, includer);
      return self;
    }, $Module_append_features$12.$$arity = 1);
    
    Opal.def(self, '$attr_accessor', $Module_attr_accessor$13 = function $$attr_accessor($a) {
      var $post_args, names, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      names = $post_args;;
      $send(self, 'attr_reader', Opal.to_a(names));
      return $send(self, 'attr_writer', Opal.to_a(names));
    }, $Module_attr_accessor$13.$$arity = -1);
    Opal.alias(self, "attr", "attr_accessor");
    
    Opal.def(self, '$attr_reader', $Module_attr_reader$14 = function $$attr_reader($a) {
      var $post_args, names, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      names = $post_args;;
      
      var proto = self.$$prototype;

      for (var i = names.length - 1; i >= 0; i--) {
        var name = names[i],
            id   = '$' + name,
            ivar = Opal.ivar(name);

        // the closure here is needed because name will change at the next
        // cycle, I wish we could use let.
        var body = (function(ivar) {
          return function() {
            if (this[ivar] == null) {
              return nil;
            }
            else {
              return this[ivar];
            }
          };
        })(ivar);

        // initialize the instance variable as nil
        Opal.defineProperty(proto, ivar, nil);

        body.$$parameters = [];
        body.$$arity = 0;

        Opal.defn(self, id, body);
      }
    ;
      return nil;
    }, $Module_attr_reader$14.$$arity = -1);
    
    Opal.def(self, '$attr_writer', $Module_attr_writer$15 = function $$attr_writer($a) {
      var $post_args, names, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      names = $post_args;;
      
      var proto = self.$$prototype;

      for (var i = names.length - 1; i >= 0; i--) {
        var name = names[i],
            id   = '$' + name + '=',
            ivar = Opal.ivar(name);

        // the closure here is needed because name will change at the next
        // cycle, I wish we could use let.
        var body = (function(ivar){
          return function(value) {
            return this[ivar] = value;
          }
        })(ivar);

        body.$$parameters = [['req']];
        body.$$arity = 1;

        // initialize the instance variable as nil
        Opal.defineProperty(proto, ivar, nil);

        Opal.defn(self, id, body);
      }
    ;
      return nil;
    }, $Module_attr_writer$15.$$arity = -1);
    
    Opal.def(self, '$autoload', $Module_autoload$16 = function $$autoload(const$, path) {
      var self = this;

      
      if (self.$$autoload == null) self.$$autoload = {};
      Opal.const_cache_version++;
      self.$$autoload[const$] = path;
      return nil;
    
    }, $Module_autoload$16.$$arity = 2);
    
    Opal.def(self, '$class_variables', $Module_class_variables$17 = function $$class_variables() {
      var self = this;

      return Object.keys(Opal.class_variables(self));
    }, $Module_class_variables$17.$$arity = 0);
    
    Opal.def(self, '$class_variable_get', $Module_class_variable_get$18 = function $$class_variable_get(name) {
      var self = this;

      
      name = $$($nesting, 'Opal')['$class_variable_name!'](name);
      
      var value = Opal.class_variables(self)[name];
      if (value == null) {
        self.$raise($$($nesting, 'NameError').$new("" + "uninitialized class variable " + (name) + " in " + (self), name))
      }
      return value;
    ;
    }, $Module_class_variable_get$18.$$arity = 1);
    
    Opal.def(self, '$class_variable_set', $Module_class_variable_set$19 = function $$class_variable_set(name, value) {
      var self = this;

      
      name = $$($nesting, 'Opal')['$class_variable_name!'](name);
      return Opal.class_variable_set(self, name, value);;
    }, $Module_class_variable_set$19.$$arity = 2);
    
    Opal.def(self, '$class_variable_defined?', $Module_class_variable_defined$ques$20 = function(name) {
      var self = this;

      
      name = $$($nesting, 'Opal')['$class_variable_name!'](name);
      return Opal.class_variables(self).hasOwnProperty(name);;
    }, $Module_class_variable_defined$ques$20.$$arity = 1);
    
    Opal.def(self, '$remove_class_variable', $Module_remove_class_variable$21 = function $$remove_class_variable(name) {
      var self = this;

      
      name = $$($nesting, 'Opal')['$class_variable_name!'](name);
      
      if (Opal.hasOwnProperty.call(self.$$cvars, name)) {
        var value = self.$$cvars[name];
        delete self.$$cvars[name];
        return value;
      } else {
        self.$raise($$($nesting, 'NameError'), "" + "cannot remove " + (name) + " for " + (self))
      }
    ;
    }, $Module_remove_class_variable$21.$$arity = 1);
    
    Opal.def(self, '$constants', $Module_constants$22 = function $$constants(inherit) {
      var self = this;

      
      
      if (inherit == null) {
        inherit = true;
      };
      return Opal.constants(self, inherit);;
    }, $Module_constants$22.$$arity = -1);
    Opal.defs(self, '$constants', $Module_constants$23 = function $$constants(inherit) {
      var self = this;

      
      ;
      
      if (inherit == null) {
        var nesting = (self.$$nesting || []).concat(Opal.Object),
            constant, constants = {},
            i, ii;

        for(i = 0, ii = nesting.length; i < ii; i++) {
          for (constant in nesting[i].$$const) {
            constants[constant] = true;
          }
        }
        return Object.keys(constants);
      } else {
        return Opal.constants(self, inherit)
      }
    ;
    }, $Module_constants$23.$$arity = -1);
    Opal.defs(self, '$nesting', $Module_nesting$24 = function $$nesting() {
      var self = this;

      return self.$$nesting || [];
    }, $Module_nesting$24.$$arity = 0);
    
    Opal.def(self, '$const_defined?', $Module_const_defined$ques$25 = function(name, inherit) {
      var self = this;

      
      
      if (inherit == null) {
        inherit = true;
      };
      name = $$($nesting, 'Opal')['$const_name!'](name);
      if ($truthy(name['$=~']($$$($$($nesting, 'Opal'), 'CONST_NAME_REGEXP')))) {
      } else {
        self.$raise($$($nesting, 'NameError').$new("" + "wrong constant name " + (name), name))
      };
      
      var module, modules = [self], module_constants, i, ii;

      // Add up ancestors if inherit is true
      if (inherit) {
        modules = modules.concat(Opal.ancestors(self));

        // Add Object's ancestors if it's a module – modules have no ancestors otherwise
        if (self.$$is_module) {
          modules = modules.concat([Opal.Object]).concat(Opal.ancestors(Opal.Object));
        }
      }

      for (i = 0, ii = modules.length; i < ii; i++) {
        module = modules[i];
        if (module.$$const[name] != null) {
          return true;
        }
      }

      return false;
    ;
    }, $Module_const_defined$ques$25.$$arity = -2);
    
    Opal.def(self, '$const_get', $Module_const_get$26 = function $$const_get(name, inherit) {
      var $$27, self = this;

      
      
      if (inherit == null) {
        inherit = true;
      };
      name = $$($nesting, 'Opal')['$const_name!'](name);
      
      if (name.indexOf('::') === 0 && name !== '::'){
        name = name.slice(2);
      }
    ;
      if ($truthy(name.indexOf('::') != -1 && name != '::')) {
        return $send(name.$split("::"), 'inject', [self], ($$27 = function(o, c){var self = $$27.$$s || this;

        
          
          if (o == null) {
            o = nil;
          };
          
          if (c == null) {
            c = nil;
          };
          return o.$const_get(c);}, $$27.$$s = self, $$27.$$arity = 2, $$27))};
      if ($truthy(name['$=~']($$$($$($nesting, 'Opal'), 'CONST_NAME_REGEXP')))) {
      } else {
        self.$raise($$($nesting, 'NameError').$new("" + "wrong constant name " + (name), name))
      };
      
      if (inherit) {
        return $$([self], name);
      } else {
        return Opal.const_get_local(self, name);
      }
    ;
    }, $Module_const_get$26.$$arity = -2);
    
    Opal.def(self, '$const_missing', $Module_const_missing$28 = function $$const_missing(name) {
      var self = this, full_const_name = nil;

      
      
      if (self.$$autoload) {
        var file = self.$$autoload[name];

        if (file) {
          self.$require(file);

          return self.$const_get(name);
        }
      }
    ;
      full_const_name = (function() {if (self['$==']($$($nesting, 'Object'))) {
        return name
      } else {
        return "" + (self) + "::" + (name)
      }; return nil; })();
      return self.$raise($$($nesting, 'NameError').$new("" + "uninitialized constant " + (full_const_name), name));
    }, $Module_const_missing$28.$$arity = 1);
    
    Opal.def(self, '$const_set', $Module_const_set$29 = function $$const_set(name, value) {
      var $a, self = this;

      
      name = $$($nesting, 'Opal')['$const_name!'](name);
      if ($truthy(($truthy($a = name['$!~']($$$($$($nesting, 'Opal'), 'CONST_NAME_REGEXP'))) ? $a : name['$start_with?']("::")))) {
        self.$raise($$($nesting, 'NameError').$new("" + "wrong constant name " + (name), name))};
      Opal.const_set(self, name, value);
      return value;
    }, $Module_const_set$29.$$arity = 2);
    
    Opal.def(self, '$public_constant', $Module_public_constant$30 = function $$public_constant(const_name) {
      var self = this;

      return nil
    }, $Module_public_constant$30.$$arity = 1);
    
    Opal.def(self, '$define_method', $Module_define_method$31 = function $$define_method(name, method) {
      var $iter = $Module_define_method$31.$$p, block = $iter || nil, $a, $$32, self = this, $case = nil;

      if ($iter) $Module_define_method$31.$$p = null;
      
      
      if ($iter) $Module_define_method$31.$$p = null;;
      ;
      if ($truthy(method === undefined && block === nil)) {
        self.$raise($$($nesting, 'ArgumentError'), "tried to create a Proc object without a block")};
      block = ($truthy($a = block) ? $a : (function() {$case = method;
      if ($$($nesting, 'Proc')['$===']($case)) {return method}
      else if ($$($nesting, 'Method')['$===']($case)) {return method.$to_proc().$$unbound}
      else if ($$($nesting, 'UnboundMethod')['$===']($case)) {return $lambda(($$32 = function($b){var self = $$32.$$s || this, $post_args, args, bound = nil;

      
        
        $post_args = Opal.slice.call(arguments, 0, arguments.length);
        
        args = $post_args;;
        bound = method.$bind(self);
        return $send(bound, 'call', Opal.to_a(args));}, $$32.$$s = self, $$32.$$arity = -1, $$32))}
      else {return self.$raise($$($nesting, 'TypeError'), "" + "wrong argument type " + (block.$class()) + " (expected Proc/Method)")}})());
      
      var id = '$' + name;

      block.$$jsid        = name;
      block.$$s           = null;
      block.$$def         = block;
      block.$$define_meth = true;

      Opal.defn(self, id, block);

      return name;
    ;
    }, $Module_define_method$31.$$arity = -2);
    
    Opal.def(self, '$remove_method', $Module_remove_method$33 = function $$remove_method($a) {
      var $post_args, names, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      names = $post_args;;
      
      for (var i = 0, length = names.length; i < length; i++) {
        Opal.rdef(self, "$" + names[i]);
      }
    ;
      return self;
    }, $Module_remove_method$33.$$arity = -1);
    
    Opal.def(self, '$singleton_class?', $Module_singleton_class$ques$34 = function() {
      var self = this;

      return !!self.$$is_singleton;
    }, $Module_singleton_class$ques$34.$$arity = 0);
    
    Opal.def(self, '$include', $Module_include$35 = function $$include($a) {
      var $post_args, mods, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      mods = $post_args;;
      
      for (var i = mods.length - 1; i >= 0; i--) {
        var mod = mods[i];

        if (!mod.$$is_module) {
          self.$raise($$($nesting, 'TypeError'), "" + "wrong argument type " + ((mod).$class()) + " (expected Module)");
        }

        (mod).$append_features(self);
        (mod).$included(self);
      }
    ;
      return self;
    }, $Module_include$35.$$arity = -1);
    
    Opal.def(self, '$included_modules', $Module_included_modules$36 = function $$included_modules() {
      var self = this;

      return Opal.included_modules(self);
    }, $Module_included_modules$36.$$arity = 0);
    
    Opal.def(self, '$include?', $Module_include$ques$37 = function(mod) {
      var self = this;

      
      if (!mod.$$is_module) {
        self.$raise($$($nesting, 'TypeError'), "" + "wrong argument type " + ((mod).$class()) + " (expected Module)");
      }

      var i, ii, mod2, ancestors = Opal.ancestors(self);

      for (i = 0, ii = ancestors.length; i < ii; i++) {
        mod2 = ancestors[i];
        if (mod2 === mod && mod2 !== self) {
          return true;
        }
      }

      return false;
    
    }, $Module_include$ques$37.$$arity = 1);
    
    Opal.def(self, '$instance_method', $Module_instance_method$38 = function $$instance_method(name) {
      var self = this;

      
      var meth = self.$$prototype['$' + name];

      if (!meth || meth.$$stub) {
        self.$raise($$($nesting, 'NameError').$new("" + "undefined method `" + (name) + "' for class `" + (self.$name()) + "'", name));
      }

      return $$($nesting, 'UnboundMethod').$new(self, meth.$$owner || self, meth, name);
    
    }, $Module_instance_method$38.$$arity = 1);
    
    Opal.def(self, '$instance_methods', $Module_instance_methods$39 = function $$instance_methods(include_super) {
      var self = this;

      
      
      if (include_super == null) {
        include_super = true;
      };
      
      if ($truthy(include_super)) {
        return Opal.instance_methods(self);
      } else {
        return Opal.own_instance_methods(self);
      }
    ;
    }, $Module_instance_methods$39.$$arity = -1);
    
    Opal.def(self, '$included', $Module_included$40 = function $$included(mod) {
      var self = this;

      return nil
    }, $Module_included$40.$$arity = 1);
    
    Opal.def(self, '$extended', $Module_extended$41 = function $$extended(mod) {
      var self = this;

      return nil
    }, $Module_extended$41.$$arity = 1);
    
    Opal.def(self, '$extend_object', $Module_extend_object$42 = function $$extend_object(object) {
      var self = this;

      return nil
    }, $Module_extend_object$42.$$arity = 1);
    
    Opal.def(self, '$method_added', $Module_method_added$43 = function $$method_added($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return nil;
    }, $Module_method_added$43.$$arity = -1);
    
    Opal.def(self, '$method_removed', $Module_method_removed$44 = function $$method_removed($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return nil;
    }, $Module_method_removed$44.$$arity = -1);
    
    Opal.def(self, '$method_undefined', $Module_method_undefined$45 = function $$method_undefined($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return nil;
    }, $Module_method_undefined$45.$$arity = -1);
    
    Opal.def(self, '$module_eval', $Module_module_eval$46 = function $$module_eval($a) {
      var $iter = $Module_module_eval$46.$$p, block = $iter || nil, $post_args, args, $b, $$47, self = this, string = nil, file = nil, _lineno = nil, default_eval_options = nil, compiling_options = nil, compiled = nil;

      if ($iter) $Module_module_eval$46.$$p = null;
      
      
      if ($iter) $Module_module_eval$46.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      if ($truthy(($truthy($b = block['$nil?']()) ? !!Opal.compile : $b))) {
        
        if ($truthy($range(1, 3, false)['$cover?'](args.$size()))) {
        } else {
          $$($nesting, 'Kernel').$raise($$($nesting, 'ArgumentError'), "wrong number of arguments (0 for 1..3)")
        };
        $b = [].concat(Opal.to_a(args)), (string = ($b[0] == null ? nil : $b[0])), (file = ($b[1] == null ? nil : $b[1])), (_lineno = ($b[2] == null ? nil : $b[2])), $b;
        default_eval_options = $hash2(["file", "eval"], {"file": ($truthy($b = file) ? $b : "(eval)"), "eval": true});
        compiling_options = Opal.hash({ arity_check: false }).$merge(default_eval_options);
        compiled = $$($nesting, 'Opal').$compile(string, compiling_options);
        block = $send($$($nesting, 'Kernel'), 'proc', [], ($$47 = function(){var self = $$47.$$s || this;

        
          return (function(self) {
            return eval(compiled);
          })(self)
        }, $$47.$$s = self, $$47.$$arity = 0, $$47));
      } else if ($truthy(args['$any?']())) {
        $$($nesting, 'Kernel').$raise($$($nesting, 'ArgumentError'), "" + ("" + "wrong number of arguments (" + (args.$size()) + " for 0)") + "\n\n  NOTE:If you want to enable passing a String argument please add \"require 'opal-parser'\" to your script\n")};
      
      var old = block.$$s,
          result;

      block.$$s = null;
      result = block.apply(self, [self]);
      block.$$s = old;

      return result;
    ;
    }, $Module_module_eval$46.$$arity = -1);
    Opal.alias(self, "class_eval", "module_eval");
    
    Opal.def(self, '$module_exec', $Module_module_exec$48 = function $$module_exec($a) {
      var $iter = $Module_module_exec$48.$$p, block = $iter || nil, $post_args, args, self = this;

      if ($iter) $Module_module_exec$48.$$p = null;
      
      
      if ($iter) $Module_module_exec$48.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      
      if (block === nil) {
        self.$raise($$($nesting, 'LocalJumpError'), "no block given")
      }

      var block_self = block.$$s, result;

      block.$$s = null;
      result = block.apply(self, args);
      block.$$s = block_self;

      return result;
    ;
    }, $Module_module_exec$48.$$arity = -1);
    Opal.alias(self, "class_exec", "module_exec");
    
    Opal.def(self, '$method_defined?', $Module_method_defined$ques$49 = function(method) {
      var self = this;

      
      var body = self.$$prototype['$' + method];
      return (!!body) && !body.$$stub;
    
    }, $Module_method_defined$ques$49.$$arity = 1);
    
    Opal.def(self, '$module_function', $Module_module_function$50 = function $$module_function($a) {
      var $post_args, methods, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      methods = $post_args;;
      
      if (methods.length === 0) {
        self.$$module_function = true;
      }
      else {
        for (var i = 0, length = methods.length; i < length; i++) {
          var meth = methods[i],
              id   = '$' + meth,
              func = self.$$prototype[id];

          Opal.defs(self, id, func);
        }
      }

      return self;
    ;
    }, $Module_module_function$50.$$arity = -1);
    
    Opal.def(self, '$name', $Module_name$51 = function $$name() {
      var self = this;

      
      if (self.$$full_name) {
        return self.$$full_name;
      }

      var result = [], base = self;

      while (base) {
        // Give up if any of the ancestors is unnamed
        if (base.$$name === nil || base.$$name == null) return nil;

        result.unshift(base.$$name);

        base = base.$$base_module;

        if (base === Opal.Object) {
          break;
        }
      }

      if (result.length === 0) {
        return nil;
      }

      return self.$$full_name = result.join('::');
    
    }, $Module_name$51.$$arity = 0);
    
    Opal.def(self, '$prepend', $Module_prepend$52 = function $$prepend($a) {
      var $post_args, mods, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      mods = $post_args;;
      
      if (mods.length === 0) {
        self.$raise($$($nesting, 'ArgumentError'), "wrong number of arguments (given 0, expected 1+)")
      }

      for (var i = mods.length - 1; i >= 0; i--) {
        var mod = mods[i];

        if (!mod.$$is_module) {
          self.$raise($$($nesting, 'TypeError'), "" + "wrong argument type " + ((mod).$class()) + " (expected Module)");
        }

        (mod).$prepend_features(self);
        (mod).$prepended(self);
      }
    ;
      return self;
    }, $Module_prepend$52.$$arity = -1);
    
    Opal.def(self, '$prepend_features', $Module_prepend_features$53 = function $$prepend_features(prepender) {
      var self = this;

      
      
      if (!self.$$is_module) {
        self.$raise($$($nesting, 'TypeError'), "" + "wrong argument type " + (self.$class()) + " (expected Module)");
      }

      Opal.prepend_features(self, prepender)
    ;
      return self;
    }, $Module_prepend_features$53.$$arity = 1);
    
    Opal.def(self, '$prepended', $Module_prepended$54 = function $$prepended(mod) {
      var self = this;

      return nil
    }, $Module_prepended$54.$$arity = 1);
    
    Opal.def(self, '$remove_const', $Module_remove_const$55 = function $$remove_const(name) {
      var self = this;

      return Opal.const_remove(self, name);
    }, $Module_remove_const$55.$$arity = 1);
    
    Opal.def(self, '$to_s', $Module_to_s$56 = function $$to_s() {
      var $a, self = this;

      return ($truthy($a = Opal.Module.$name.call(self)) ? $a : "" + "#<" + (self.$$is_module ? 'Module' : 'Class') + ":0x" + (self.$__id__().$to_s(16)) + ">")
    }, $Module_to_s$56.$$arity = 0);
    
    Opal.def(self, '$undef_method', $Module_undef_method$57 = function $$undef_method($a) {
      var $post_args, names, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      names = $post_args;;
      
      for (var i = 0, length = names.length; i < length; i++) {
        Opal.udef(self, "$" + names[i]);
      }
    ;
      return self;
    }, $Module_undef_method$57.$$arity = -1);
    
    Opal.def(self, '$instance_variables', $Module_instance_variables$58 = function $$instance_variables() {
      var self = this, consts = nil;

      
      consts = (Opal.Module.$$nesting = $nesting, self.$constants());
      
      var result = [];

      for (var name in self) {
        if (self.hasOwnProperty(name) && name.charAt(0) !== '$' && name !== 'constructor' && !consts['$include?'](name)) {
          result.push('@' + name);
        }
      }

      return result;
    ;
    }, $Module_instance_variables$58.$$arity = 0);
    
    Opal.def(self, '$dup', $Module_dup$59 = function $$dup() {
      var $iter = $Module_dup$59.$$p, $yield = $iter || nil, self = this, copy = nil, $zuper = nil, $zuper_i = nil, $zuper_ii = nil;

      if ($iter) $Module_dup$59.$$p = null;
      // Prepare super implicit arguments
      for($zuper_i = 0, $zuper_ii = arguments.length, $zuper = new Array($zuper_ii); $zuper_i < $zuper_ii; $zuper_i++) {
        $zuper[$zuper_i] = arguments[$zuper_i];
      }
      
      copy = $send(self, Opal.find_super_dispatcher(self, 'dup', $Module_dup$59, false), $zuper, $iter);
      copy.$copy_class_variables(self);
      copy.$copy_constants(self);
      return copy;
    }, $Module_dup$59.$$arity = 0);
    
    Opal.def(self, '$copy_class_variables', $Module_copy_class_variables$60 = function $$copy_class_variables(other) {
      var self = this;

      
      for (var name in other.$$cvars) {
        self.$$cvars[name] = other.$$cvars[name];
      }
    
    }, $Module_copy_class_variables$60.$$arity = 1);
    return (Opal.def(self, '$copy_constants', $Module_copy_constants$61 = function $$copy_constants(other) {
      var self = this;

      
      var name, other_constants = other.$$const;

      for (name in other_constants) {
        Opal.const_set(self, name, other_constants[name]);
      }
    
    }, $Module_copy_constants$61.$$arity = 1), nil) && 'copy_constants';
  })($nesting[0], null, $nesting)
};

/* Generated by Opal 0.11.99.dev */
Opal.modules["corelib/class"] = function(Opal) {
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice, $klass = Opal.klass, $send = Opal.send;

  Opal.add_stubs(['$require', '$class_eval', '$to_proc', '$initialize_copy', '$allocate', '$name', '$to_s']);
  
  self.$require("corelib/module");
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Class');

    var $nesting = [self].concat($parent_nesting), $Class_new$1, $Class_allocate$2, $Class_inherited$3, $Class_initialize_dup$4, $Class_new$5, $Class_superclass$6, $Class_to_s$7;

    
    Opal.defs(self, '$new', $Class_new$1 = function(superclass) {
      var $iter = $Class_new$1.$$p, block = $iter || nil, self = this;

      if ($iter) $Class_new$1.$$p = null;
      
      
      if ($iter) $Class_new$1.$$p = null;;
      
      if (superclass == null) {
        superclass = $$($nesting, 'Object');
      };
      
      if (!superclass.$$is_class) {
        throw Opal.TypeError.$new("superclass must be a Class");
      }

      var klass = Opal.allocate_class(nil, superclass);
      superclass.$inherited(klass);
      (function() {if ((block !== nil)) {
        return $send((klass), 'class_eval', [], block.$to_proc())
      } else {
        return nil
      }; return nil; })()
      return klass;
    ;
    }, $Class_new$1.$$arity = -1);
    
    Opal.def(self, '$allocate', $Class_allocate$2 = function $$allocate() {
      var self = this;

      
      var obj = new self.$$constructor();
      obj.$$id = Opal.uid();
      return obj;
    
    }, $Class_allocate$2.$$arity = 0);
    
    Opal.def(self, '$inherited', $Class_inherited$3 = function $$inherited(cls) {
      var self = this;

      return nil
    }, $Class_inherited$3.$$arity = 1);
    
    Opal.def(self, '$initialize_dup', $Class_initialize_dup$4 = function $$initialize_dup(original) {
      var self = this;

      
      self.$initialize_copy(original);
      
      self.$$name = null;
      self.$$full_name = null;
    ;
    }, $Class_initialize_dup$4.$$arity = 1);
    
    Opal.def(self, '$new', $Class_new$5 = function($a) {
      var $iter = $Class_new$5.$$p, block = $iter || nil, $post_args, args, self = this;

      if ($iter) $Class_new$5.$$p = null;
      
      
      if ($iter) $Class_new$5.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      
      var object = self.$allocate();
      Opal.send(object, object.$initialize, args, block);
      return object;
    ;
    }, $Class_new$5.$$arity = -1);
    
    Opal.def(self, '$superclass', $Class_superclass$6 = function $$superclass() {
      var self = this;

      return self.$$super || nil;
    }, $Class_superclass$6.$$arity = 0);
    return (Opal.def(self, '$to_s', $Class_to_s$7 = function $$to_s() {
      var $iter = $Class_to_s$7.$$p, $yield = $iter || nil, self = this;

      if ($iter) $Class_to_s$7.$$p = null;
      
      var singleton_of = self.$$singleton_of;

      if (singleton_of && (singleton_of.$$is_a_module)) {
        return "" + "#<Class:" + ((singleton_of).$name()) + ">";
      }
      else if (singleton_of) {
        // a singleton class created from an object
        return "" + "#<Class:#<" + ((singleton_of.$$class).$name()) + ":0x" + ((Opal.id(singleton_of)).$to_s(16)) + ">>";
      }
      return $send(self, Opal.find_super_dispatcher(self, 'to_s', $Class_to_s$7, false), [], null);
    
    }, $Class_to_s$7.$$arity = 0), nil) && 'to_s';
  })($nesting[0], null, $nesting);
};

/* Generated by Opal 0.11.99.dev */
Opal.modules["corelib/basic_object"] = function(Opal) {
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice, $klass = Opal.klass, $truthy = Opal.truthy, $range = Opal.range, $hash2 = Opal.hash2, $send = Opal.send;

  Opal.add_stubs(['$==', '$!', '$nil?', '$cover?', '$size', '$raise', '$merge', '$compile', '$proc', '$any?', '$inspect', '$new']);
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'BasicObject');

    var $nesting = [self].concat($parent_nesting), $BasicObject_initialize$1, $BasicObject_$eq_eq$2, $BasicObject_eql$ques$3, $BasicObject___id__$4, $BasicObject___send__$5, $BasicObject_$excl$6, $BasicObject_$not_eq$7, $BasicObject_instance_eval$8, $BasicObject_instance_exec$10, $BasicObject_singleton_method_added$11, $BasicObject_singleton_method_removed$12, $BasicObject_singleton_method_undefined$13, $BasicObject_class$14, $BasicObject_method_missing$15;

    
    
    Opal.def(self, '$initialize', $BasicObject_initialize$1 = function $$initialize($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return nil;
    }, $BasicObject_initialize$1.$$arity = -1);
    
    Opal.def(self, '$==', $BasicObject_$eq_eq$2 = function(other) {
      var self = this;

      return self === other;
    }, $BasicObject_$eq_eq$2.$$arity = 1);
    
    Opal.def(self, '$eql?', $BasicObject_eql$ques$3 = function(other) {
      var self = this;

      return self['$=='](other)
    }, $BasicObject_eql$ques$3.$$arity = 1);
    Opal.alias(self, "equal?", "==");
    
    Opal.def(self, '$__id__', $BasicObject___id__$4 = function $$__id__() {
      var self = this;

      
      if (self.$$id != null) {
        return self.$$id;
      }
      Opal.defineProperty(self, '$$id', Opal.uid());
      return self.$$id;
    
    }, $BasicObject___id__$4.$$arity = 0);
    
    Opal.def(self, '$__send__', $BasicObject___send__$5 = function $$__send__(symbol, $a) {
      var $iter = $BasicObject___send__$5.$$p, block = $iter || nil, $post_args, args, self = this;

      if ($iter) $BasicObject___send__$5.$$p = null;
      
      
      if ($iter) $BasicObject___send__$5.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 1, arguments.length);
      
      args = $post_args;;
      
      var func = self['$' + symbol]

      if (func) {
        if (block !== nil) {
          func.$$p = block;
        }

        return func.apply(self, args);
      }

      if (block !== nil) {
        self.$method_missing.$$p = block;
      }

      return self.$method_missing.apply(self, [symbol].concat(args));
    ;
    }, $BasicObject___send__$5.$$arity = -2);
    
    Opal.def(self, '$!', $BasicObject_$excl$6 = function() {
      var self = this;

      return false
    }, $BasicObject_$excl$6.$$arity = 0);
    
    Opal.def(self, '$!=', $BasicObject_$not_eq$7 = function(other) {
      var self = this;

      return self['$=='](other)['$!']()
    }, $BasicObject_$not_eq$7.$$arity = 1);
    
    Opal.def(self, '$instance_eval', $BasicObject_instance_eval$8 = function $$instance_eval($a) {
      var $iter = $BasicObject_instance_eval$8.$$p, block = $iter || nil, $post_args, args, $b, $$9, self = this, string = nil, file = nil, _lineno = nil, default_eval_options = nil, compiling_options = nil, compiled = nil;

      if ($iter) $BasicObject_instance_eval$8.$$p = null;
      
      
      if ($iter) $BasicObject_instance_eval$8.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      if ($truthy(($truthy($b = block['$nil?']()) ? !!Opal.compile : $b))) {
        
        if ($truthy($range(1, 3, false)['$cover?'](args.$size()))) {
        } else {
          $$$('::', 'Kernel').$raise($$$('::', 'ArgumentError'), "wrong number of arguments (0 for 1..3)")
        };
        $b = [].concat(Opal.to_a(args)), (string = ($b[0] == null ? nil : $b[0])), (file = ($b[1] == null ? nil : $b[1])), (_lineno = ($b[2] == null ? nil : $b[2])), $b;
        default_eval_options = $hash2(["file", "eval"], {"file": ($truthy($b = file) ? $b : "(eval)"), "eval": true});
        compiling_options = Opal.hash({ arity_check: false }).$merge(default_eval_options);
        compiled = $$$('::', 'Opal').$compile(string, compiling_options);
        block = $send($$$('::', 'Kernel'), 'proc', [], ($$9 = function(){var self = $$9.$$s || this;

        
          return (function(self) {
            return eval(compiled);
          })(self)
        }, $$9.$$s = self, $$9.$$arity = 0, $$9));
      } else if ($truthy(args['$any?']())) {
        $$$('::', 'Kernel').$raise($$$('::', 'ArgumentError'), "" + "wrong number of arguments (" + (args.$size()) + " for 0)")};
      
      var old = block.$$s,
          result;

      block.$$s = null;

      // Need to pass $$eval so that method definitions know if this is
      // being done on a class/module. Cannot be compiler driven since
      // send(:instance_eval) needs to work.
      if (self.$$is_a_module) {
        self.$$eval = true;
        try {
          result = block.call(self, self);
        }
        finally {
          self.$$eval = false;
        }
      }
      else {
        result = block.call(self, self);
      }

      block.$$s = old;

      return result;
    ;
    }, $BasicObject_instance_eval$8.$$arity = -1);
    
    Opal.def(self, '$instance_exec', $BasicObject_instance_exec$10 = function $$instance_exec($a) {
      var $iter = $BasicObject_instance_exec$10.$$p, block = $iter || nil, $post_args, args, self = this;

      if ($iter) $BasicObject_instance_exec$10.$$p = null;
      
      
      if ($iter) $BasicObject_instance_exec$10.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      if ($truthy(block)) {
      } else {
        $$$('::', 'Kernel').$raise($$$('::', 'ArgumentError'), "no block given")
      };
      
      var block_self = block.$$s,
          result;

      block.$$s = null;

      if (self.$$is_a_module) {
        self.$$eval = true;
        try {
          result = block.apply(self, args);
        }
        finally {
          self.$$eval = false;
        }
      }
      else {
        result = block.apply(self, args);
      }

      block.$$s = block_self;

      return result;
    ;
    }, $BasicObject_instance_exec$10.$$arity = -1);
    
    Opal.def(self, '$singleton_method_added', $BasicObject_singleton_method_added$11 = function $$singleton_method_added($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return nil;
    }, $BasicObject_singleton_method_added$11.$$arity = -1);
    
    Opal.def(self, '$singleton_method_removed', $BasicObject_singleton_method_removed$12 = function $$singleton_method_removed($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return nil;
    }, $BasicObject_singleton_method_removed$12.$$arity = -1);
    
    Opal.def(self, '$singleton_method_undefined', $BasicObject_singleton_method_undefined$13 = function $$singleton_method_undefined($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return nil;
    }, $BasicObject_singleton_method_undefined$13.$$arity = -1);
    
    Opal.def(self, '$class', $BasicObject_class$14 = function() {
      var self = this;

      return self.$$class;
    }, $BasicObject_class$14.$$arity = 0);
    return (Opal.def(self, '$method_missing', $BasicObject_method_missing$15 = function $$method_missing(symbol, $a) {
      var $iter = $BasicObject_method_missing$15.$$p, block = $iter || nil, $post_args, args, self = this, message = nil;

      if ($iter) $BasicObject_method_missing$15.$$p = null;
      
      
      if ($iter) $BasicObject_method_missing$15.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 1, arguments.length);
      
      args = $post_args;;
      message = (function() {if ($truthy(self.$inspect && !self.$inspect.$$stub)) {
        return "" + "undefined method `" + (symbol) + "' for " + (self.$inspect()) + ":" + (self.$$class)
      } else {
        return "" + "undefined method `" + (symbol) + "' for " + (self.$$class)
      }; return nil; })();
      return $$$('::', 'Kernel').$raise($$$('::', 'NoMethodError').$new(message, symbol));
    }, $BasicObject_method_missing$15.$$arity = -2), nil) && 'method_missing';
  })($nesting[0], null, $nesting)
};

/* Generated by Opal 0.11.99.dev */
Opal.modules["corelib/kernel"] = function(Opal) {
  function $rb_le(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs <= rhs : lhs['$<='](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice, $module = Opal.module, $truthy = Opal.truthy, $gvars = Opal.gvars, $hash2 = Opal.hash2, $send = Opal.send, $klass = Opal.klass;

  Opal.add_stubs(['$raise', '$new', '$inspect', '$!', '$=~', '$==', '$object_id', '$class', '$coerce_to?', '$<<', '$allocate', '$copy_instance_variables', '$copy_singleton_methods', '$initialize_clone', '$initialize_copy', '$define_method', '$singleton_class', '$to_proc', '$initialize_dup', '$for', '$empty?', '$pop', '$call', '$coerce_to', '$append_features', '$extend_object', '$extended', '$__id__', '$to_s', '$instance_variable_name!', '$respond_to?', '$to_int', '$coerce_to!', '$Integer', '$nil?', '$===', '$enum_for', '$result', '$any?', '$print', '$format', '$puts', '$each', '$<=', '$length', '$[]', '$exception', '$is_a?', '$rand', '$respond_to_missing?', '$try_convert!', '$expand_path', '$join', '$start_with?', '$new_seed', '$srand', '$sym', '$arg', '$open', '$include']);
  
  (function($base, $parent_nesting) {
    var self = $module($base, 'Kernel');

    var $nesting = [self].concat($parent_nesting), $Kernel_method_missing$1, $Kernel_$eq_tilde$2, $Kernel_$excl_tilde$3, $Kernel_$eq_eq_eq$4, $Kernel_$lt_eq_gt$5, $Kernel_method$6, $Kernel_methods$7, $Kernel_public_methods$8, $Kernel_Array$9, $Kernel_at_exit$10, $Kernel_caller$11, $Kernel_class$12, $Kernel_copy_instance_variables$13, $Kernel_copy_singleton_methods$14, $Kernel_clone$15, $Kernel_initialize_clone$16, $Kernel_define_singleton_method$17, $Kernel_dup$18, $Kernel_initialize_dup$19, $Kernel_enum_for$20, $Kernel_equal$ques$21, $Kernel_exit$22, $Kernel_extend$23, $Kernel_hash$24, $Kernel_initialize_copy$25, $Kernel_inspect$26, $Kernel_instance_of$ques$27, $Kernel_instance_variable_defined$ques$28, $Kernel_instance_variable_get$29, $Kernel_instance_variable_set$30, $Kernel_remove_instance_variable$31, $Kernel_instance_variables$32, $Kernel_Integer$33, $Kernel_Float$34, $Kernel_Hash$35, $Kernel_is_a$ques$36, $Kernel_itself$37, $Kernel_lambda$38, $Kernel_load$39, $Kernel_loop$40, $Kernel_nil$ques$42, $Kernel_printf$43, $Kernel_proc$44, $Kernel_puts$45, $Kernel_p$46, $Kernel_print$48, $Kernel_warn$49, $Kernel_raise$50, $Kernel_rand$51, $Kernel_respond_to$ques$52, $Kernel_respond_to_missing$ques$53, $Kernel_require$54, $Kernel_require_relative$55, $Kernel_require_tree$56, $Kernel_singleton_class$57, $Kernel_sleep$58, $Kernel_srand$59, $Kernel_String$60, $Kernel_tap$61, $Kernel_to_proc$62, $Kernel_to_s$63, $Kernel_catch$64, $Kernel_throw$65, $Kernel_open$66, $Kernel_yield_self$67;

    
    
    Opal.def(self, '$method_missing', $Kernel_method_missing$1 = function $$method_missing(symbol, $a) {
      var $iter = $Kernel_method_missing$1.$$p, block = $iter || nil, $post_args, args, self = this;

      if ($iter) $Kernel_method_missing$1.$$p = null;
      
      
      if ($iter) $Kernel_method_missing$1.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 1, arguments.length);
      
      args = $post_args;;
      return self.$raise($$($nesting, 'NoMethodError').$new("" + "undefined method `" + (symbol) + "' for " + (self.$inspect()), symbol, args));
    }, $Kernel_method_missing$1.$$arity = -2);
    
    Opal.def(self, '$=~', $Kernel_$eq_tilde$2 = function(obj) {
      var self = this;

      return false
    }, $Kernel_$eq_tilde$2.$$arity = 1);
    
    Opal.def(self, '$!~', $Kernel_$excl_tilde$3 = function(obj) {
      var self = this;

      return self['$=~'](obj)['$!']()
    }, $Kernel_$excl_tilde$3.$$arity = 1);
    
    Opal.def(self, '$===', $Kernel_$eq_eq_eq$4 = function(other) {
      var $a, self = this;

      return ($truthy($a = self.$object_id()['$=='](other.$object_id())) ? $a : self['$=='](other))
    }, $Kernel_$eq_eq_eq$4.$$arity = 1);
    
    Opal.def(self, '$<=>', $Kernel_$lt_eq_gt$5 = function(other) {
      var self = this;

      
      // set guard for infinite recursion
      self.$$comparable = true;

      var x = self['$=='](other);

      if (x && x !== nil) {
        return 0;
      }

      return nil;
    
    }, $Kernel_$lt_eq_gt$5.$$arity = 1);
    
    Opal.def(self, '$method', $Kernel_method$6 = function $$method(name) {
      var self = this;

      
      var meth = self['$' + name];

      if (!meth || meth.$$stub) {
        self.$raise($$($nesting, 'NameError').$new("" + "undefined method `" + (name) + "' for class `" + (self.$class()) + "'", name));
      }

      return $$($nesting, 'Method').$new(self, meth.$$owner || self.$class(), meth, name);
    
    }, $Kernel_method$6.$$arity = 1);
    
    Opal.def(self, '$methods', $Kernel_methods$7 = function $$methods(all) {
      var self = this;

      
      
      if (all == null) {
        all = true;
      };
      
      if ($truthy(all)) {
        return Opal.methods(self);
      } else {
        return Opal.own_methods(self);
      }
    ;
    }, $Kernel_methods$7.$$arity = -1);
    
    Opal.def(self, '$public_methods', $Kernel_public_methods$8 = function $$public_methods(all) {
      var self = this;

      
      
      if (all == null) {
        all = true;
      };
      
      if ($truthy(all)) {
        return Opal.methods(self);
      } else {
        return Opal.receiver_methods(self);
      }
    ;
    }, $Kernel_public_methods$8.$$arity = -1);
    
    Opal.def(self, '$Array', $Kernel_Array$9 = function $$Array(object) {
      var self = this;

      
      var coerced;

      if (object === nil) {
        return [];
      }

      if (object.$$is_array) {
        return object;
      }

      coerced = $$($nesting, 'Opal')['$coerce_to?'](object, $$($nesting, 'Array'), "to_ary");
      if (coerced !== nil) { return coerced; }

      coerced = $$($nesting, 'Opal')['$coerce_to?'](object, $$($nesting, 'Array'), "to_a");
      if (coerced !== nil) { return coerced; }

      return [object];
    
    }, $Kernel_Array$9.$$arity = 1);
    
    Opal.def(self, '$at_exit', $Kernel_at_exit$10 = function $$at_exit() {
      var $iter = $Kernel_at_exit$10.$$p, block = $iter || nil, $a, self = this;
      if ($gvars.__at_exit__ == null) $gvars.__at_exit__ = nil;

      if ($iter) $Kernel_at_exit$10.$$p = null;
      
      
      if ($iter) $Kernel_at_exit$10.$$p = null;;
      $gvars.__at_exit__ = ($truthy($a = $gvars.__at_exit__) ? $a : []);
      return $gvars.__at_exit__['$<<'](block);
    }, $Kernel_at_exit$10.$$arity = 0);
    
    Opal.def(self, '$caller', $Kernel_caller$11 = function $$caller($a) {
      var $post_args, args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      return [];
    }, $Kernel_caller$11.$$arity = -1);
    
    Opal.def(self, '$class', $Kernel_class$12 = function() {
      var self = this;

      return self.$$class;
    }, $Kernel_class$12.$$arity = 0);
    
    Opal.def(self, '$copy_instance_variables', $Kernel_copy_instance_variables$13 = function $$copy_instance_variables(other) {
      var self = this;

      
      var keys = Object.keys(other), i, ii, name;
      for (i = 0, ii = keys.length; i < ii; i++) {
        name = keys[i];
        if (name.charAt(0) !== '$' && other.hasOwnProperty(name)) {
          self[name] = other[name];
        }
      }
    
    }, $Kernel_copy_instance_variables$13.$$arity = 1);
    
    Opal.def(self, '$copy_singleton_methods', $Kernel_copy_singleton_methods$14 = function $$copy_singleton_methods(other) {
      var self = this;

      
      var i, name, names, length;

      if (other.hasOwnProperty('$$meta')) {
        var other_singleton_class = Opal.get_singleton_class(other);
        var self_singleton_class = Opal.get_singleton_class(self);
        names = Object.getOwnPropertyNames(other_singleton_class.$$prototype);

        for (i = 0, length = names.length; i < length; i++) {
          name = names[i];
          if (Opal.is_method(name)) {
            self_singleton_class.$$prototype[name] = other_singleton_class.$$prototype[name];
          }
        }

        self_singleton_class.$$const = Object.assign({}, other_singleton_class.$$const);
        Object.setPrototypeOf(
          self_singleton_class.$$prototype,
          Object.getPrototypeOf(other_singleton_class.$$prototype)
        );
      }

      for (i = 0, names = Object.getOwnPropertyNames(other), length = names.length; i < length; i++) {
        name = names[i];
        if (name.charAt(0) === '$' && name.charAt(1) !== '$' && other.hasOwnProperty(name)) {
          self[name] = other[name];
        }
      }
    
    }, $Kernel_copy_singleton_methods$14.$$arity = 1);
    
    Opal.def(self, '$clone', $Kernel_clone$15 = function $$clone($kwargs) {
      var freeze, self = this, copy = nil;

      
      
      if ($kwargs == null) {
        $kwargs = $hash2([], {});
      } else if (!$kwargs.$$is_hash) {
        throw Opal.ArgumentError.$new('expected kwargs');
      };
      
      freeze = $kwargs.$$smap["freeze"];
      if (freeze == null) {
        freeze = true
      };
      copy = self.$class().$allocate();
      copy.$copy_instance_variables(self);
      copy.$copy_singleton_methods(self);
      copy.$initialize_clone(self);
      return copy;
    }, $Kernel_clone$15.$$arity = -1);
    
    Opal.def(self, '$initialize_clone', $Kernel_initialize_clone$16 = function $$initialize_clone(other) {
      var self = this;

      return self.$initialize_copy(other)
    }, $Kernel_initialize_clone$16.$$arity = 1);
    
    Opal.def(self, '$define_singleton_method', $Kernel_define_singleton_method$17 = function $$define_singleton_method(name, method) {
      var $iter = $Kernel_define_singleton_method$17.$$p, block = $iter || nil, self = this;

      if ($iter) $Kernel_define_singleton_method$17.$$p = null;
      
      
      if ($iter) $Kernel_define_singleton_method$17.$$p = null;;
      ;
      return $send(self.$singleton_class(), 'define_method', [name, method], block.$to_proc());
    }, $Kernel_define_singleton_method$17.$$arity = -2);
    
    Opal.def(self, '$dup', $Kernel_dup$18 = function $$dup() {
      var self = this, copy = nil;

      
      copy = self.$class().$allocate();
      copy.$copy_instance_variables(self);
      copy.$initialize_dup(self);
      return copy;
    }, $Kernel_dup$18.$$arity = 0);
    
    Opal.def(self, '$initialize_dup', $Kernel_initialize_dup$19 = function $$initialize_dup(other) {
      var self = this;

      return self.$initialize_copy(other)
    }, $Kernel_initialize_dup$19.$$arity = 1);
    
    Opal.def(self, '$enum_for', $Kernel_enum_for$20 = function $$enum_for($a, $b) {
      var $iter = $Kernel_enum_for$20.$$p, block = $iter || nil, $post_args, method, args, self = this;

      if ($iter) $Kernel_enum_for$20.$$p = null;
      
      
      if ($iter) $Kernel_enum_for$20.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      if ($post_args.length > 0) {
        method = $post_args[0];
        $post_args.splice(0, 1);
      }
      if (method == null) {
        method = "each";
      };
      
      args = $post_args;;
      return $send($$($nesting, 'Enumerator'), 'for', [self, method].concat(Opal.to_a(args)), block.$to_proc());
    }, $Kernel_enum_for$20.$$arity = -1);
    Opal.alias(self, "to_enum", "enum_for");
    
    Opal.def(self, '$equal?', $Kernel_equal$ques$21 = function(other) {
      var self = this;

      return self === other;
    }, $Kernel_equal$ques$21.$$arity = 1);
    
    Opal.def(self, '$exit', $Kernel_exit$22 = function $$exit(status) {
      var $a, self = this, block = nil;
      if ($gvars.__at_exit__ == null) $gvars.__at_exit__ = nil;

      
      
      if (status == null) {
        status = true;
      };
      $gvars.__at_exit__ = ($truthy($a = $gvars.__at_exit__) ? $a : []);
      while (!($truthy($gvars.__at_exit__['$empty?']()))) {
        
        block = $gvars.__at_exit__.$pop();
        block.$call();
      };
      
      if (status.$$is_boolean) {
        status = status ? 0 : 1;
      } else {
        status = $$($nesting, 'Opal').$coerce_to(status, $$($nesting, 'Integer'), "to_int")
      }

      Opal.exit(status);
    ;
      return nil;
    }, $Kernel_exit$22.$$arity = -1);
    
    Opal.def(self, '$extend', $Kernel_extend$23 = function $$extend($a) {
      var $post_args, mods, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      mods = $post_args;;
      
      var singleton = self.$singleton_class();

      for (var i = mods.length - 1; i >= 0; i--) {
        var mod = mods[i];

        if (!mod.$$is_module) {
          self.$raise($$($nesting, 'TypeError'), "" + "wrong argument type " + ((mod).$class()) + " (expected Module)");
        }

        (mod).$append_features(singleton);
        (mod).$extend_object(self);
        (mod).$extended(self);
      }
    ;
      return self;
    }, $Kernel_extend$23.$$arity = -1);
    
    Opal.def(self, '$hash', $Kernel_hash$24 = function $$hash() {
      var self = this;

      return self.$__id__()
    }, $Kernel_hash$24.$$arity = 0);
    
    Opal.def(self, '$initialize_copy', $Kernel_initialize_copy$25 = function $$initialize_copy(other) {
      var self = this;

      return nil
    }, $Kernel_initialize_copy$25.$$arity = 1);
    
    Opal.def(self, '$inspect', $Kernel_inspect$26 = function $$inspect() {
      var self = this;

      return self.$to_s()
    }, $Kernel_inspect$26.$$arity = 0);
    
    Opal.def(self, '$instance_of?', $Kernel_instance_of$ques$27 = function(klass) {
      var self = this;

      
      if (!klass.$$is_class && !klass.$$is_module) {
        self.$raise($$($nesting, 'TypeError'), "class or module required");
      }

      return self.$$class === klass;
    
    }, $Kernel_instance_of$ques$27.$$arity = 1);
    
    Opal.def(self, '$instance_variable_defined?', $Kernel_instance_variable_defined$ques$28 = function(name) {
      var self = this;

      
      name = $$($nesting, 'Opal')['$instance_variable_name!'](name);
      return Opal.hasOwnProperty.call(self, name.substr(1));;
    }, $Kernel_instance_variable_defined$ques$28.$$arity = 1);
    
    Opal.def(self, '$instance_variable_get', $Kernel_instance_variable_get$29 = function $$instance_variable_get(name) {
      var self = this;

      
      name = $$($nesting, 'Opal')['$instance_variable_name!'](name);
      
      var ivar = self[Opal.ivar(name.substr(1))];

      return ivar == null ? nil : ivar;
    ;
    }, $Kernel_instance_variable_get$29.$$arity = 1);
    
    Opal.def(self, '$instance_variable_set', $Kernel_instance_variable_set$30 = function $$instance_variable_set(name, value) {
      var self = this;

      
      name = $$($nesting, 'Opal')['$instance_variable_name!'](name);
      return self[Opal.ivar(name.substr(1))] = value;;
    }, $Kernel_instance_variable_set$30.$$arity = 2);
    
    Opal.def(self, '$remove_instance_variable', $Kernel_remove_instance_variable$31 = function $$remove_instance_variable(name) {
      var self = this;

      
      name = $$($nesting, 'Opal')['$instance_variable_name!'](name);
      
      var key = Opal.ivar(name.substr(1)),
          val;
      if (self.hasOwnProperty(key)) {
        val = self[key];
        delete self[key];
        return val;
      }
    ;
      return self.$raise($$($nesting, 'NameError'), "" + "instance variable " + (name) + " not defined");
    }, $Kernel_remove_instance_variable$31.$$arity = 1);
    
    Opal.def(self, '$instance_variables', $Kernel_instance_variables$32 = function $$instance_variables() {
      var self = this;

      
      var result = [], ivar;

      for (var name in self) {
        if (self.hasOwnProperty(name) && name.charAt(0) !== '$') {
          if (name.substr(-1) === '$') {
            ivar = name.slice(0, name.length - 1);
          } else {
            ivar = name;
          }
          result.push('@' + ivar);
        }
      }

      return result;
    
    }, $Kernel_instance_variables$32.$$arity = 0);
    
    Opal.def(self, '$Integer', $Kernel_Integer$33 = function $$Integer(value, base) {
      var self = this;

      
      ;
      
      var i, str, base_digits;

      if (!value.$$is_string) {
        if (base !== undefined) {
          self.$raise($$($nesting, 'ArgumentError'), "base specified for non string value")
        }
        if (value === nil) {
          self.$raise($$($nesting, 'TypeError'), "can't convert nil into Integer")
        }
        if (value.$$is_number) {
          if (value === Infinity || value === -Infinity || isNaN(value)) {
            self.$raise($$($nesting, 'FloatDomainError'), value)
          }
          return Math.floor(value);
        }
        if (value['$respond_to?']("to_int")) {
          i = value.$to_int();
          if (i !== nil) {
            return i;
          }
        }
        return $$($nesting, 'Opal')['$coerce_to!'](value, $$($nesting, 'Integer'), "to_i");
      }

      if (value === "0") {
        return 0;
      }

      if (base === undefined) {
        base = 0;
      } else {
        base = $$($nesting, 'Opal').$coerce_to(base, $$($nesting, 'Integer'), "to_int");
        if (base === 1 || base < 0 || base > 36) {
          self.$raise($$($nesting, 'ArgumentError'), "" + "invalid radix " + (base))
        }
      }

      str = value.toLowerCase();

      str = str.replace(/(\d)_(?=\d)/g, '$1');

      str = str.replace(/^(\s*[+-]?)(0[bodx]?)/, function (_, head, flag) {
        switch (flag) {
        case '0b':
          if (base === 0 || base === 2) {
            base = 2;
            return head;
          }
        case '0':
        case '0o':
          if (base === 0 || base === 8) {
            base = 8;
            return head;
          }
        case '0d':
          if (base === 0 || base === 10) {
            base = 10;
            return head;
          }
        case '0x':
          if (base === 0 || base === 16) {
            base = 16;
            return head;
          }
        }
        self.$raise($$($nesting, 'ArgumentError'), "" + "invalid value for Integer(): \"" + (value) + "\"")
      });

      base = (base === 0 ? 10 : base);

      base_digits = '0-' + (base <= 10 ? base - 1 : '9a-' + String.fromCharCode(97 + (base - 11)));

      if (!(new RegExp('^\\s*[+-]?[' + base_digits + ']+\\s*$')).test(str)) {
        self.$raise($$($nesting, 'ArgumentError'), "" + "invalid value for Integer(): \"" + (value) + "\"")
      }

      i = parseInt(str, base);

      if (isNaN(i)) {
        self.$raise($$($nesting, 'ArgumentError'), "" + "invalid value for Integer(): \"" + (value) + "\"")
      }

      return i;
    ;
    }, $Kernel_Integer$33.$$arity = -2);
    
    Opal.def(self, '$Float', $Kernel_Float$34 = function $$Float(value) {
      var self = this;

      
      var str;

      if (value === nil) {
        self.$raise($$($nesting, 'TypeError'), "can't convert nil into Float")
      }

      if (value.$$is_string) {
        str = value.toString();

        str = str.replace(/(\d)_(?=\d)/g, '$1');

        //Special case for hex strings only:
        if (/^\s*[-+]?0[xX][0-9a-fA-F]+\s*$/.test(str)) {
          return self.$Integer(str);
        }

        if (!/^\s*[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?\s*$/.test(str)) {
          self.$raise($$($nesting, 'ArgumentError'), "" + "invalid value for Float(): \"" + (value) + "\"")
        }

        return parseFloat(str);
      }

      return $$($nesting, 'Opal')['$coerce_to!'](value, $$($nesting, 'Float'), "to_f");
    
    }, $Kernel_Float$34.$$arity = 1);
    
    Opal.def(self, '$Hash', $Kernel_Hash$35 = function $$Hash(arg) {
      var $a, self = this;

      
      if ($truthy(($truthy($a = arg['$nil?']()) ? $a : arg['$==']([])))) {
        return $hash2([], {})};
      if ($truthy($$($nesting, 'Hash')['$==='](arg))) {
        return arg};
      return $$($nesting, 'Opal')['$coerce_to!'](arg, $$($nesting, 'Hash'), "to_hash");
    }, $Kernel_Hash$35.$$arity = 1);
    
    Opal.def(self, '$is_a?', $Kernel_is_a$ques$36 = function(klass) {
      var self = this;

      
      if (!klass.$$is_class && !klass.$$is_module) {
        self.$raise($$($nesting, 'TypeError'), "class or module required");
      }

      return Opal.is_a(self, klass);
    
    }, $Kernel_is_a$ques$36.$$arity = 1);
    
    Opal.def(self, '$itself', $Kernel_itself$37 = function $$itself() {
      var self = this;

      return self
    }, $Kernel_itself$37.$$arity = 0);
    Opal.alias(self, "kind_of?", "is_a?");
    
    Opal.def(self, '$lambda', $Kernel_lambda$38 = function $$lambda() {
      var $iter = $Kernel_lambda$38.$$p, block = $iter || nil, self = this;

      if ($iter) $Kernel_lambda$38.$$p = null;
      
      
      if ($iter) $Kernel_lambda$38.$$p = null;;
      return Opal.lambda(block);;
    }, $Kernel_lambda$38.$$arity = 0);
    
    Opal.def(self, '$load', $Kernel_load$39 = function $$load(file) {
      var self = this;

      
      file = $$($nesting, 'Opal')['$coerce_to!'](file, $$($nesting, 'String'), "to_str");
      return Opal.load(file);
    }, $Kernel_load$39.$$arity = 1);
    
    Opal.def(self, '$loop', $Kernel_loop$40 = function $$loop() {
      var $$41, $a, $iter = $Kernel_loop$40.$$p, $yield = $iter || nil, self = this, e = nil;

      if ($iter) $Kernel_loop$40.$$p = null;
      
      if (($yield !== nil)) {
      } else {
        return $send(self, 'enum_for', ["loop"], ($$41 = function(){var self = $$41.$$s || this;

        return $$$($$($nesting, 'Float'), 'INFINITY')}, $$41.$$s = self, $$41.$$arity = 0, $$41))
      };
      while ($truthy(true)) {
        
        try {
          Opal.yieldX($yield, [])
        } catch ($err) {
          if (Opal.rescue($err, [$$($nesting, 'StopIteration')])) {e = $err;
            try {
              return e.$result()
            } finally { Opal.pop_exception() }
          } else { throw $err; }
        };
      };
      return self;
    }, $Kernel_loop$40.$$arity = 0);
    
    Opal.def(self, '$nil?', $Kernel_nil$ques$42 = function() {
      var self = this;

      return false
    }, $Kernel_nil$ques$42.$$arity = 0);
    Opal.alias(self, "object_id", "__id__");
    
    Opal.def(self, '$printf', $Kernel_printf$43 = function $$printf($a) {
      var $post_args, args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      if ($truthy(args['$any?']())) {
        self.$print($send(self, 'format', Opal.to_a(args)))};
      return nil;
    }, $Kernel_printf$43.$$arity = -1);
    
    Opal.def(self, '$proc', $Kernel_proc$44 = function $$proc() {
      var $iter = $Kernel_proc$44.$$p, block = $iter || nil, self = this;

      if ($iter) $Kernel_proc$44.$$p = null;
      
      
      if ($iter) $Kernel_proc$44.$$p = null;;
      if ($truthy(block)) {
      } else {
        self.$raise($$($nesting, 'ArgumentError'), "tried to create Proc object without a block")
      };
      block.$$is_lambda = false;
      return block;
    }, $Kernel_proc$44.$$arity = 0);
    
    Opal.def(self, '$puts', $Kernel_puts$45 = function $$puts($a) {
      var $post_args, strs, self = this;
      if ($gvars.stdout == null) $gvars.stdout = nil;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      strs = $post_args;;
      return $send($gvars.stdout, 'puts', Opal.to_a(strs));
    }, $Kernel_puts$45.$$arity = -1);
    
    Opal.def(self, '$p', $Kernel_p$46 = function $$p($a) {
      var $post_args, args, $$47, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      $send(args, 'each', [], ($$47 = function(obj){var self = $$47.$$s || this;
        if ($gvars.stdout == null) $gvars.stdout = nil;

      
        
        if (obj == null) {
          obj = nil;
        };
        return $gvars.stdout.$puts(obj.$inspect());}, $$47.$$s = self, $$47.$$arity = 1, $$47));
      if ($truthy($rb_le(args.$length(), 1))) {
        return args['$[]'](0)
      } else {
        return args
      };
    }, $Kernel_p$46.$$arity = -1);
    
    Opal.def(self, '$print', $Kernel_print$48 = function $$print($a) {
      var $post_args, strs, self = this;
      if ($gvars.stdout == null) $gvars.stdout = nil;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      strs = $post_args;;
      return $send($gvars.stdout, 'print', Opal.to_a(strs));
    }, $Kernel_print$48.$$arity = -1);
    
    Opal.def(self, '$warn', $Kernel_warn$49 = function $$warn($a) {
      var $post_args, strs, $b, self = this;
      if ($gvars.VERBOSE == null) $gvars.VERBOSE = nil;
      if ($gvars.stderr == null) $gvars.stderr = nil;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      strs = $post_args;;
      if ($truthy(($truthy($b = $gvars.VERBOSE['$nil?']()) ? $b : strs['$empty?']()))) {
        return nil
      } else {
        return $send($gvars.stderr, 'puts', Opal.to_a(strs))
      };
    }, $Kernel_warn$49.$$arity = -1);
    
    Opal.def(self, '$raise', $Kernel_raise$50 = function $$raise(exception, string, _backtrace) {
      var self = this;
      if ($gvars["!"] == null) $gvars["!"] = nil;

      
      ;
      
      if (string == null) {
        string = nil;
      };
      
      if (_backtrace == null) {
        _backtrace = nil;
      };
      
      if (exception == null && $gvars["!"] !== nil) {
        throw $gvars["!"];
      }
      if (exception == null) {
        exception = $$($nesting, 'RuntimeError').$new();
      }
      else if (exception.$$is_string) {
        exception = $$($nesting, 'RuntimeError').$new(exception);
      }
      // using respond_to? and not an undefined check to avoid method_missing matching as true
      else if (exception.$$is_class && exception['$respond_to?']("exception")) {
        exception = exception.$exception(string);
      }
      else if (exception['$is_a?']($$($nesting, 'Exception'))) {
        // exception is fine
      }
      else {
        exception = $$($nesting, 'TypeError').$new("exception class/object expected");
      }

      if ($gvars["!"] !== nil) {
        Opal.exceptions.push($gvars["!"]);
      }

      $gvars["!"] = exception;

      throw exception;
    ;
    }, $Kernel_raise$50.$$arity = -1);
    Opal.alias(self, "fail", "raise");
    
    Opal.def(self, '$rand', $Kernel_rand$51 = function $$rand(max) {
      var self = this;

      
      ;
      
      if (max === undefined) {
        return $$$($$($nesting, 'Random'), 'DEFAULT').$rand();
      }

      if (max.$$is_number) {
        if (max < 0) {
          max = Math.abs(max);
        }

        if (max % 1 !== 0) {
          max = max.$to_i();
        }

        if (max === 0) {
          max = undefined;
        }
      }
    ;
      return $$$($$($nesting, 'Random'), 'DEFAULT').$rand(max);
    }, $Kernel_rand$51.$$arity = -1);
    
    Opal.def(self, '$respond_to?', $Kernel_respond_to$ques$52 = function(name, include_all) {
      var self = this;

      
      
      if (include_all == null) {
        include_all = false;
      };
      if ($truthy(self['$respond_to_missing?'](name, include_all))) {
        return true};
      
      var body = self['$' + name];

      if (typeof(body) === "function" && !body.$$stub) {
        return true;
      }
    ;
      return false;
    }, $Kernel_respond_to$ques$52.$$arity = -2);
    
    Opal.def(self, '$respond_to_missing?', $Kernel_respond_to_missing$ques$53 = function(method_name, include_all) {
      var self = this;

      
      
      if (include_all == null) {
        include_all = false;
      };
      return false;
    }, $Kernel_respond_to_missing$ques$53.$$arity = -2);
    
    Opal.def(self, '$require', $Kernel_require$54 = function $$require(file) {
      var self = this;

      
      file = $$($nesting, 'Opal')['$coerce_to!'](file, $$($nesting, 'String'), "to_str");
      return Opal.require(file);
    }, $Kernel_require$54.$$arity = 1);
    
    Opal.def(self, '$require_relative', $Kernel_require_relative$55 = function $$require_relative(file) {
      var self = this;

      
      $$($nesting, 'Opal')['$try_convert!'](file, $$($nesting, 'String'), "to_str");
      file = $$($nesting, 'File').$expand_path($$($nesting, 'File').$join(Opal.current_file, "..", file));
      return Opal.require(file);
    }, $Kernel_require_relative$55.$$arity = 1);
    
    Opal.def(self, '$require_tree', $Kernel_require_tree$56 = function $$require_tree(path) {
      var self = this;

      
      var result = [];

      path = $$($nesting, 'File').$expand_path(path)
      path = Opal.normalize(path);
      if (path === '.') path = '';
      for (var name in Opal.modules) {
        if ((name)['$start_with?'](path)) {
          result.push([name, Opal.require(name)]);
        }
      }

      return result;
    
    }, $Kernel_require_tree$56.$$arity = 1);
    Opal.alias(self, "send", "__send__");
    Opal.alias(self, "public_send", "__send__");
    
    Opal.def(self, '$singleton_class', $Kernel_singleton_class$57 = function $$singleton_class() {
      var self = this;

      return Opal.get_singleton_class(self);
    }, $Kernel_singleton_class$57.$$arity = 0);
    
    Opal.def(self, '$sleep', $Kernel_sleep$58 = function $$sleep(seconds) {
      var self = this;

      
      
      if (seconds == null) {
        seconds = nil;
      };
      
      if (seconds === nil) {
        self.$raise($$($nesting, 'TypeError'), "can't convert NilClass into time interval")
      }
      if (!seconds.$$is_number) {
        self.$raise($$($nesting, 'TypeError'), "" + "can't convert " + (seconds.$class()) + " into time interval")
      }
      if (seconds < 0) {
        self.$raise($$($nesting, 'ArgumentError'), "time interval must be positive")
      }
      var get_time = Opal.global.performance ?
        function() {return performance.now()} :
        function() {return new Date()}

      var t = get_time();
      while (get_time() - t <= seconds * 1000);
      return seconds;
    ;
    }, $Kernel_sleep$58.$$arity = -1);
    
    Opal.def(self, '$srand', $Kernel_srand$59 = function $$srand(seed) {
      var self = this;

      
      
      if (seed == null) {
        seed = $$($nesting, 'Random').$new_seed();
      };
      return $$($nesting, 'Random').$srand(seed);
    }, $Kernel_srand$59.$$arity = -1);
    
    Opal.def(self, '$String', $Kernel_String$60 = function $$String(str) {
      var $a, self = this;

      return ($truthy($a = $$($nesting, 'Opal')['$coerce_to?'](str, $$($nesting, 'String'), "to_str")) ? $a : $$($nesting, 'Opal')['$coerce_to!'](str, $$($nesting, 'String'), "to_s"))
    }, $Kernel_String$60.$$arity = 1);
    
    Opal.def(self, '$tap', $Kernel_tap$61 = function $$tap() {
      var $iter = $Kernel_tap$61.$$p, block = $iter || nil, self = this;

      if ($iter) $Kernel_tap$61.$$p = null;
      
      
      if ($iter) $Kernel_tap$61.$$p = null;;
      Opal.yield1(block, self);
      return self;
    }, $Kernel_tap$61.$$arity = 0);
    
    Opal.def(self, '$to_proc', $Kernel_to_proc$62 = function $$to_proc() {
      var self = this;

      return self
    }, $Kernel_to_proc$62.$$arity = 0);
    
    Opal.def(self, '$to_s', $Kernel_to_s$63 = function $$to_s() {
      var self = this;

      return "" + "#<" + (self.$class()) + ":0x" + (self.$__id__().$to_s(16)) + ">"
    }, $Kernel_to_s$63.$$arity = 0);
    
    Opal.def(self, '$catch', $Kernel_catch$64 = function(sym) {
      var $iter = $Kernel_catch$64.$$p, $yield = $iter || nil, self = this, e = nil;

      if ($iter) $Kernel_catch$64.$$p = null;
      try {
        return Opal.yieldX($yield, []);
      } catch ($err) {
        if (Opal.rescue($err, [$$($nesting, 'UncaughtThrowError')])) {e = $err;
          try {
            
            if (e.$sym()['$=='](sym)) {
              return e.$arg()};
            return self.$raise();
          } finally { Opal.pop_exception() }
        } else { throw $err; }
      }
    }, $Kernel_catch$64.$$arity = 1);
    
    Opal.def(self, '$throw', $Kernel_throw$65 = function($a) {
      var $post_args, args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      return self.$raise($$($nesting, 'UncaughtThrowError'), args);
    }, $Kernel_throw$65.$$arity = -1);
    
    Opal.def(self, '$open', $Kernel_open$66 = function $$open($a) {
      var $iter = $Kernel_open$66.$$p, block = $iter || nil, $post_args, args, self = this;

      if ($iter) $Kernel_open$66.$$p = null;
      
      
      if ($iter) $Kernel_open$66.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      return $send($$($nesting, 'File'), 'open', Opal.to_a(args), block.$to_proc());
    }, $Kernel_open$66.$$arity = -1);
    
    Opal.def(self, '$yield_self', $Kernel_yield_self$67 = function $$yield_self() {
      var $$68, $iter = $Kernel_yield_self$67.$$p, $yield = $iter || nil, self = this;

      if ($iter) $Kernel_yield_self$67.$$p = null;
      
      if (($yield !== nil)) {
      } else {
        return $send(self, 'enum_for', ["yield_self"], ($$68 = function(){var self = $$68.$$s || this;

        return 1}, $$68.$$s = self, $$68.$$arity = 0, $$68))
      };
      return Opal.yield1($yield, self);;
    }, $Kernel_yield_self$67.$$arity = 0);
  })($nesting[0], $nesting);
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Object');

    var $nesting = [self].concat($parent_nesting);

    return self.$include($$($nesting, 'Kernel'))
  })($nesting[0], null, $nesting);
};

/* Generated by Opal 0.11.99.dev */
Opal.modules["corelib/error"] = function(Opal) {
  function $rb_plus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs + rhs : lhs['$+'](rhs);
  }
  function $rb_gt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs > rhs : lhs['$>'](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice, $klass = Opal.klass, $send = Opal.send, $truthy = Opal.truthy, $module = Opal.module, $hash2 = Opal.hash2;

  Opal.add_stubs(['$new', '$clone', '$to_s', '$empty?', '$class', '$raise', '$+', '$attr_reader', '$[]', '$>', '$length', '$inspect']);
  
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Exception');

    var $nesting = [self].concat($parent_nesting), $Exception_new$1, $Exception_exception$2, $Exception_initialize$3, $Exception_backtrace$4, $Exception_exception$5, $Exception_message$6, $Exception_inspect$7, $Exception_set_backtrace$8, $Exception_to_s$9;

    self.$$prototype.message = nil;
    
    var stack_trace_limit;
    Opal.defs(self, '$new', $Exception_new$1 = function($a) {
      var $post_args, args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      
      var message   = (args.length > 0) ? args[0] : nil;
      var error     = new self.$$constructor(message);
      error.name    = self.$$name;
      error.message = message;
      Opal.send(error, error.$initialize, args);

      // Error.captureStackTrace() will use .name and .toString to build the
      // first line of the stack trace so it must be called after the error
      // has been initialized.
      // https://nodejs.org/dist/latest-v6.x/docs/api/errors.html
      if (Opal.config.enable_stack_trace && Error.captureStackTrace) {
        // Passing Kernel.raise will cut the stack trace from that point above
        Error.captureStackTrace(error, stack_trace_limit);
      }

      return error;
    ;
    }, $Exception_new$1.$$arity = -1);
    stack_trace_limit = self.$new;
    Opal.defs(self, '$exception', $Exception_exception$2 = function $$exception($a) {
      var $post_args, args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      return $send(self, 'new', Opal.to_a(args));
    }, $Exception_exception$2.$$arity = -1);
    
    Opal.def(self, '$initialize', $Exception_initialize$3 = function $$initialize($a) {
      var $post_args, args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      return self.message = (args.length > 0) ? args[0] : nil;;
    }, $Exception_initialize$3.$$arity = -1);
    
    Opal.def(self, '$backtrace', $Exception_backtrace$4 = function $$backtrace() {
      var self = this;

      
      if (self.backtrace) {
        // nil is a valid backtrace
        return self.backtrace;
      }

      var backtrace = self.stack;

      if (typeof(backtrace) === 'string') {
        return backtrace.split("\n").slice(0, 15);
      }
      else if (backtrace) {
        return backtrace.slice(0, 15);
      }

      return [];
    
    }, $Exception_backtrace$4.$$arity = 0);
    
    Opal.def(self, '$exception', $Exception_exception$5 = function $$exception(str) {
      var self = this;

      
      
      if (str == null) {
        str = nil;
      };
      
      if (str === nil || self === str) {
        return self;
      }

      var cloned = self.$clone();
      cloned.message = str;
      return cloned;
    ;
    }, $Exception_exception$5.$$arity = -1);
    
    Opal.def(self, '$message', $Exception_message$6 = function $$message() {
      var self = this;

      return self.$to_s()
    }, $Exception_message$6.$$arity = 0);
    
    Opal.def(self, '$inspect', $Exception_inspect$7 = function $$inspect() {
      var self = this, as_str = nil;

      
      as_str = self.$to_s();
      if ($truthy(as_str['$empty?']())) {
        return self.$class().$to_s()
      } else {
        return "" + "#<" + (self.$class().$to_s()) + ": " + (self.$to_s()) + ">"
      };
    }, $Exception_inspect$7.$$arity = 0);
    
    Opal.def(self, '$set_backtrace', $Exception_set_backtrace$8 = function $$set_backtrace(backtrace) {
      var self = this;

      
      var valid = true, i, ii;

      if (backtrace === nil) {
        self.backtrace = nil;
      } else if (backtrace.$$is_string) {
        self.backtrace = [backtrace];
      } else {
        if (backtrace.$$is_array) {
          for (i = 0, ii = backtrace.length; i < ii; i++) {
            if (!backtrace[i].$$is_string) {
              valid = false;
              break;
            }
          }
        } else {
          valid = false;
        }

        if (valid === false) {
          self.$raise($$($nesting, 'TypeError'), "backtrace must be Array of String")
        }

        self.backtrace = backtrace;
      }

      return backtrace;
    
    }, $Exception_set_backtrace$8.$$arity = 1);
    return (Opal.def(self, '$to_s', $Exception_to_s$9 = function $$to_s() {
      var $a, $b, self = this;

      return ($truthy($a = ($truthy($b = self.message) ? self.message.$to_s() : $b)) ? $a : self.$class().$to_s())
    }, $Exception_to_s$9.$$arity = 0), nil) && 'to_s';
  })($nesting[0], Error, $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'ScriptError');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'Exception'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'SyntaxError');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'ScriptError'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'LoadError');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'ScriptError'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'NotImplementedError');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'ScriptError'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'SystemExit');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'Exception'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'NoMemoryError');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'Exception'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'SignalException');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'Exception'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Interrupt');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'Exception'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'SecurityError');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'Exception'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'StandardError');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'Exception'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'EncodingError');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'StandardError'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'ZeroDivisionError');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'StandardError'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'NameError');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'StandardError'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'NoMethodError');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'NameError'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'RuntimeError');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'StandardError'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'FrozenError');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'RuntimeError'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'LocalJumpError');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'StandardError'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'TypeError');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'StandardError'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'ArgumentError');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'StandardError'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'IndexError');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'StandardError'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'StopIteration');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'IndexError'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'KeyError');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'IndexError'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'RangeError');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'StandardError'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'FloatDomainError');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'RangeError'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'IOError');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'StandardError'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'SystemCallError');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'StandardError'), $nesting);
  (function($base, $parent_nesting) {
    var self = $module($base, 'Errno');

    var $nesting = [self].concat($parent_nesting);

    (function($base, $super, $parent_nesting) {
      var self = $klass($base, $super, 'EINVAL');

      var $nesting = [self].concat($parent_nesting), $EINVAL_new$10;

      return (Opal.defs(self, '$new', $EINVAL_new$10 = function(name) {
        var $iter = $EINVAL_new$10.$$p, $yield = $iter || nil, self = this, message = nil;

        if ($iter) $EINVAL_new$10.$$p = null;
        
        
        if (name == null) {
          name = nil;
        };
        message = "Invalid argument";
        if ($truthy(name)) {
          message = $rb_plus(message, "" + " - " + (name))};
        return $send(self, Opal.find_super_dispatcher(self, 'new', $EINVAL_new$10, false, self.$$class.$$prototype), [message], null);
      }, $EINVAL_new$10.$$arity = -1), nil) && 'new'
    })($nesting[0], $$($nesting, 'SystemCallError'), $nesting)
  })($nesting[0], $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'UncaughtThrowError');

    var $nesting = [self].concat($parent_nesting), $UncaughtThrowError_initialize$11;

    self.$$prototype.sym = nil;
    
    self.$attr_reader("sym", "arg");
    return (Opal.def(self, '$initialize', $UncaughtThrowError_initialize$11 = function $$initialize(args) {
      var $iter = $UncaughtThrowError_initialize$11.$$p, $yield = $iter || nil, self = this;

      if ($iter) $UncaughtThrowError_initialize$11.$$p = null;
      
      self.sym = args['$[]'](0);
      if ($truthy($rb_gt(args.$length(), 1))) {
        self.arg = args['$[]'](1)};
      return $send(self, Opal.find_super_dispatcher(self, 'initialize', $UncaughtThrowError_initialize$11, false), ["" + "uncaught throw " + (self.sym.$inspect())], null);
    }, $UncaughtThrowError_initialize$11.$$arity = 1), nil) && 'initialize';
  })($nesting[0], $$($nesting, 'ArgumentError'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'NameError');

    var $nesting = [self].concat($parent_nesting), $NameError_initialize$12;

    
    self.$attr_reader("name");
    return (Opal.def(self, '$initialize', $NameError_initialize$12 = function $$initialize(message, name) {
      var $iter = $NameError_initialize$12.$$p, $yield = $iter || nil, self = this;

      if ($iter) $NameError_initialize$12.$$p = null;
      
      
      if (name == null) {
        name = nil;
      };
      $send(self, Opal.find_super_dispatcher(self, 'initialize', $NameError_initialize$12, false), [message], null);
      return (self.name = name);
    }, $NameError_initialize$12.$$arity = -2), nil) && 'initialize';
  })($nesting[0], null, $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'NoMethodError');

    var $nesting = [self].concat($parent_nesting), $NoMethodError_initialize$13;

    
    self.$attr_reader("args");
    return (Opal.def(self, '$initialize', $NoMethodError_initialize$13 = function $$initialize(message, name, args) {
      var $iter = $NoMethodError_initialize$13.$$p, $yield = $iter || nil, self = this;

      if ($iter) $NoMethodError_initialize$13.$$p = null;
      
      
      if (name == null) {
        name = nil;
      };
      
      if (args == null) {
        args = [];
      };
      $send(self, Opal.find_super_dispatcher(self, 'initialize', $NoMethodError_initialize$13, false), [message, name], null);
      return (self.args = args);
    }, $NoMethodError_initialize$13.$$arity = -2), nil) && 'initialize';
  })($nesting[0], null, $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'StopIteration');

    var $nesting = [self].concat($parent_nesting);

    return self.$attr_reader("result")
  })($nesting[0], null, $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'KeyError');

    var $nesting = [self].concat($parent_nesting), $KeyError_initialize$14, $KeyError_receiver$15, $KeyError_key$16;

    self.$$prototype.receiver = self.$$prototype.key = nil;
    
    
    Opal.def(self, '$initialize', $KeyError_initialize$14 = function $$initialize(message, $kwargs) {
      var receiver, key, $iter = $KeyError_initialize$14.$$p, $yield = $iter || nil, self = this;

      if ($iter) $KeyError_initialize$14.$$p = null;
      
      
      if ($kwargs == null) {
        $kwargs = $hash2([], {});
      } else if (!$kwargs.$$is_hash) {
        throw Opal.ArgumentError.$new('expected kwargs');
      };
      
      receiver = $kwargs.$$smap["receiver"];
      if (receiver == null) {
        receiver = nil
      };
      
      key = $kwargs.$$smap["key"];
      if (key == null) {
        key = nil
      };
      $send(self, Opal.find_super_dispatcher(self, 'initialize', $KeyError_initialize$14, false), [message], null);
      self.receiver = receiver;
      return (self.key = key);
    }, $KeyError_initialize$14.$$arity = -2);
    
    Opal.def(self, '$receiver', $KeyError_receiver$15 = function $$receiver() {
      var $a, self = this;

      return ($truthy($a = self.receiver) ? $a : self.$raise($$($nesting, 'ArgumentError'), "no receiver is available"))
    }, $KeyError_receiver$15.$$arity = 0);
    return (Opal.def(self, '$key', $KeyError_key$16 = function $$key() {
      var $a, self = this;

      return ($truthy($a = self.key) ? $a : self.$raise($$($nesting, 'ArgumentError'), "no key is available"))
    }, $KeyError_key$16.$$arity = 0), nil) && 'key';
  })($nesting[0], null, $nesting);
  return (function($base, $parent_nesting) {
    var self = $module($base, 'JS');

    var $nesting = [self].concat($parent_nesting);

    (function($base, $super, $parent_nesting) {
      var self = $klass($base, $super, 'Error');

      var $nesting = [self].concat($parent_nesting);

      return nil
    })($nesting[0], null, $nesting)
  })($nesting[0], $nesting);
};

/* Generated by Opal 0.11.99.dev */
Opal.modules["corelib/constants"] = function(Opal) {
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice;

  
  Opal.const_set($nesting[0], 'RUBY_PLATFORM', "opal");
  Opal.const_set($nesting[0], 'RUBY_ENGINE', "opal");
  Opal.const_set($nesting[0], 'RUBY_VERSION', "2.5.1");
  Opal.const_set($nesting[0], 'RUBY_ENGINE_VERSION', "0.11.99.dev");
  Opal.const_set($nesting[0], 'RUBY_RELEASE_DATE', "2018-12-25");
  Opal.const_set($nesting[0], 'RUBY_PATCHLEVEL', 0);
  Opal.const_set($nesting[0], 'RUBY_REVISION', 0);
  Opal.const_set($nesting[0], 'RUBY_COPYRIGHT', "opal - Copyright (C) 2013-2018 Adam Beynon and the Opal contributors");
  return Opal.const_set($nesting[0], 'RUBY_DESCRIPTION', "" + "opal " + ($$($nesting, 'RUBY_ENGINE_VERSION')) + " (" + ($$($nesting, 'RUBY_RELEASE_DATE')) + " revision " + ($$($nesting, 'RUBY_REVISION')) + ")");
};

/* Generated by Opal 0.11.99.dev */
Opal.modules["opal/base"] = function(Opal) {
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice;

  Opal.add_stubs(['$require']);
  
  self.$require("corelib/runtime");
  self.$require("corelib/helpers");
  self.$require("corelib/module");
  self.$require("corelib/class");
  self.$require("corelib/basic_object");
  self.$require("corelib/kernel");
  self.$require("corelib/error");
  return self.$require("corelib/constants");
};

/* Generated by Opal 0.11.99.dev */
Opal.modules["corelib/nil"] = function(Opal) {
  function $rb_gt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs > rhs : lhs['$>'](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice, $klass = Opal.klass, $hash2 = Opal.hash2, $truthy = Opal.truthy;

  Opal.add_stubs(['$raise', '$name', '$new', '$>', '$length', '$Rational']);
  
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'NilClass');

    var $nesting = [self].concat($parent_nesting), $NilClass_$excl$2, $NilClass_$$3, $NilClass_$$4, $NilClass_$$5, $NilClass_$eq_eq$6, $NilClass_dup$7, $NilClass_clone$8, $NilClass_inspect$9, $NilClass_nil$ques$10, $NilClass_singleton_class$11, $NilClass_to_a$12, $NilClass_to_h$13, $NilClass_to_i$14, $NilClass_to_s$15, $NilClass_to_c$16, $NilClass_rationalize$17, $NilClass_to_r$18, $NilClass_instance_variables$19;

    
    self.$$prototype.$$meta = self;
    (function(self, $parent_nesting) {
      var $nesting = [self].concat($parent_nesting), $allocate$1;

      
      
      Opal.def(self, '$allocate', $allocate$1 = function $$allocate() {
        var self = this;

        return self.$raise($$($nesting, 'TypeError'), "" + "allocator undefined for " + (self.$name()))
      }, $allocate$1.$$arity = 0);
      
      
      Opal.udef(self, '$' + "new");;
      return nil;;
    })(Opal.get_singleton_class(self), $nesting);
    
    Opal.def(self, '$!', $NilClass_$excl$2 = function() {
      var self = this;

      return true
    }, $NilClass_$excl$2.$$arity = 0);
    
    Opal.def(self, '$&', $NilClass_$$3 = function(other) {
      var self = this;

      return false
    }, $NilClass_$$3.$$arity = 1);
    
    Opal.def(self, '$|', $NilClass_$$4 = function(other) {
      var self = this;

      return other !== false && other !== nil;
    }, $NilClass_$$4.$$arity = 1);
    
    Opal.def(self, '$^', $NilClass_$$5 = function(other) {
      var self = this;

      return other !== false && other !== nil;
    }, $NilClass_$$5.$$arity = 1);
    
    Opal.def(self, '$==', $NilClass_$eq_eq$6 = function(other) {
      var self = this;

      return other === nil;
    }, $NilClass_$eq_eq$6.$$arity = 1);
    
    Opal.def(self, '$dup', $NilClass_dup$7 = function $$dup() {
      var self = this;

      return nil
    }, $NilClass_dup$7.$$arity = 0);
    
    Opal.def(self, '$clone', $NilClass_clone$8 = function $$clone($kwargs) {
      var freeze, self = this;

      
      
      if ($kwargs == null) {
        $kwargs = $hash2([], {});
      } else if (!$kwargs.$$is_hash) {
        throw Opal.ArgumentError.$new('expected kwargs');
      };
      
      freeze = $kwargs.$$smap["freeze"];
      if (freeze == null) {
        freeze = true
      };
      return nil;
    }, $NilClass_clone$8.$$arity = -1);
    
    Opal.def(self, '$inspect', $NilClass_inspect$9 = function $$inspect() {
      var self = this;

      return "nil"
    }, $NilClass_inspect$9.$$arity = 0);
    
    Opal.def(self, '$nil?', $NilClass_nil$ques$10 = function() {
      var self = this;

      return true
    }, $NilClass_nil$ques$10.$$arity = 0);
    
    Opal.def(self, '$singleton_class', $NilClass_singleton_class$11 = function $$singleton_class() {
      var self = this;

      return $$($nesting, 'NilClass')
    }, $NilClass_singleton_class$11.$$arity = 0);
    
    Opal.def(self, '$to_a', $NilClass_to_a$12 = function $$to_a() {
      var self = this;

      return []
    }, $NilClass_to_a$12.$$arity = 0);
    
    Opal.def(self, '$to_h', $NilClass_to_h$13 = function $$to_h() {
      var self = this;

      return Opal.hash();
    }, $NilClass_to_h$13.$$arity = 0);
    
    Opal.def(self, '$to_i', $NilClass_to_i$14 = function $$to_i() {
      var self = this;

      return 0
    }, $NilClass_to_i$14.$$arity = 0);
    Opal.alias(self, "to_f", "to_i");
    
    Opal.def(self, '$to_s', $NilClass_to_s$15 = function $$to_s() {
      var self = this;

      return ""
    }, $NilClass_to_s$15.$$arity = 0);
    
    Opal.def(self, '$to_c', $NilClass_to_c$16 = function $$to_c() {
      var self = this;

      return $$($nesting, 'Complex').$new(0, 0)
    }, $NilClass_to_c$16.$$arity = 0);
    
    Opal.def(self, '$rationalize', $NilClass_rationalize$17 = function $$rationalize($a) {
      var $post_args, args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      if ($truthy($rb_gt(args.$length(), 1))) {
        self.$raise($$($nesting, 'ArgumentError'))};
      return self.$Rational(0, 1);
    }, $NilClass_rationalize$17.$$arity = -1);
    
    Opal.def(self, '$to_r', $NilClass_to_r$18 = function $$to_r() {
      var self = this;

      return self.$Rational(0, 1)
    }, $NilClass_to_r$18.$$arity = 0);
    return (Opal.def(self, '$instance_variables', $NilClass_instance_variables$19 = function $$instance_variables() {
      var self = this;

      return []
    }, $NilClass_instance_variables$19.$$arity = 0), nil) && 'instance_variables';
  })($nesting[0], null, $nesting);
  return Opal.const_set($nesting[0], 'NIL', nil);
};

/* Generated by Opal 0.11.99.dev */
Opal.modules["corelib/boolean"] = function(Opal) {
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice, $klass = Opal.klass, $hash2 = Opal.hash2;

  Opal.add_stubs(['$raise', '$name']);
  
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Boolean');

    var $nesting = [self].concat($parent_nesting), $Boolean___id__$2, $Boolean_$excl$3, $Boolean_$$4, $Boolean_$$5, $Boolean_$$6, $Boolean_$eq_eq$7, $Boolean_singleton_class$8, $Boolean_to_s$9, $Boolean_dup$10, $Boolean_clone$11;

    
    Opal.defineProperty(self.$$prototype, '$$is_boolean', true);
    Opal.defineProperty(self.$$prototype, '$$meta', self);
    (function(self, $parent_nesting) {
      var $nesting = [self].concat($parent_nesting), $allocate$1;

      
      
      Opal.def(self, '$allocate', $allocate$1 = function $$allocate() {
        var self = this;

        return self.$raise($$($nesting, 'TypeError'), "" + "allocator undefined for " + (self.$name()))
      }, $allocate$1.$$arity = 0);
      
      
      Opal.udef(self, '$' + "new");;
      return nil;;
    })(Opal.get_singleton_class(self), $nesting);
    
    Opal.def(self, '$__id__', $Boolean___id__$2 = function $$__id__() {
      var self = this;

      return self.valueOf() ? 2 : 0;
    }, $Boolean___id__$2.$$arity = 0);
    Opal.alias(self, "object_id", "__id__");
    
    Opal.def(self, '$!', $Boolean_$excl$3 = function() {
      var self = this;

      return self != true;
    }, $Boolean_$excl$3.$$arity = 0);
    
    Opal.def(self, '$&', $Boolean_$$4 = function(other) {
      var self = this;

      return (self == true) ? (other !== false && other !== nil) : false;
    }, $Boolean_$$4.$$arity = 1);
    
    Opal.def(self, '$|', $Boolean_$$5 = function(other) {
      var self = this;

      return (self == true) ? true : (other !== false && other !== nil);
    }, $Boolean_$$5.$$arity = 1);
    
    Opal.def(self, '$^', $Boolean_$$6 = function(other) {
      var self = this;

      return (self == true) ? (other === false || other === nil) : (other !== false && other !== nil);
    }, $Boolean_$$6.$$arity = 1);
    
    Opal.def(self, '$==', $Boolean_$eq_eq$7 = function(other) {
      var self = this;

      return (self == true) === other.valueOf();
    }, $Boolean_$eq_eq$7.$$arity = 1);
    Opal.alias(self, "equal?", "==");
    Opal.alias(self, "eql?", "==");
    
    Opal.def(self, '$singleton_class', $Boolean_singleton_class$8 = function $$singleton_class() {
      var self = this;

      return $$($nesting, 'Boolean')
    }, $Boolean_singleton_class$8.$$arity = 0);
    
    Opal.def(self, '$to_s', $Boolean_to_s$9 = function $$to_s() {
      var self = this;

      return (self == true) ? 'true' : 'false';
    }, $Boolean_to_s$9.$$arity = 0);
    
    Opal.def(self, '$dup', $Boolean_dup$10 = function $$dup() {
      var self = this;

      return self
    }, $Boolean_dup$10.$$arity = 0);
    return (Opal.def(self, '$clone', $Boolean_clone$11 = function $$clone($kwargs) {
      var freeze, self = this;

      
      
      if ($kwargs == null) {
        $kwargs = $hash2([], {});
      } else if (!$kwargs.$$is_hash) {
        throw Opal.ArgumentError.$new('expected kwargs');
      };
      
      freeze = $kwargs.$$smap["freeze"];
      if (freeze == null) {
        freeze = true
      };
      return self;
    }, $Boolean_clone$11.$$arity = -1), nil) && 'clone';
  })($nesting[0], Boolean, $nesting);
  Opal.const_set($nesting[0], 'TrueClass', $$($nesting, 'Boolean'));
  Opal.const_set($nesting[0], 'FalseClass', $$($nesting, 'Boolean'));
  Opal.const_set($nesting[0], 'TRUE', true);
  return Opal.const_set($nesting[0], 'FALSE', false);
};

/* Generated by Opal 0.11.99.dev */
Opal.modules["corelib/comparable"] = function(Opal) {
  function $rb_gt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs > rhs : lhs['$>'](rhs);
  }
  function $rb_lt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs < rhs : lhs['$<'](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice, $module = Opal.module, $truthy = Opal.truthy;

  Opal.add_stubs(['$===', '$>', '$<', '$equal?', '$<=>', '$normalize', '$raise', '$class']);
  return (function($base, $parent_nesting) {
    var self = $module($base, 'Comparable');

    var $nesting = [self].concat($parent_nesting), $Comparable_normalize$1, $Comparable_$eq_eq$2, $Comparable_$gt$3, $Comparable_$gt_eq$4, $Comparable_$lt$5, $Comparable_$lt_eq$6, $Comparable_between$ques$7, $Comparable_clamp$8;

    
    Opal.defs(self, '$normalize', $Comparable_normalize$1 = function $$normalize(what) {
      var self = this;

      
      if ($truthy($$($nesting, 'Integer')['$==='](what))) {
        return what};
      if ($truthy($rb_gt(what, 0))) {
        return 1};
      if ($truthy($rb_lt(what, 0))) {
        return -1};
      return 0;
    }, $Comparable_normalize$1.$$arity = 1);
    
    Opal.def(self, '$==', $Comparable_$eq_eq$2 = function(other) {
      var self = this, cmp = nil;

      try {
        
        if ($truthy(self['$equal?'](other))) {
          return true};
        
      if (self["$<=>"] == Opal.Kernel["$<=>"]) {
        return false;
      }

      // check for infinite recursion
      if (self.$$comparable) {
        delete self.$$comparable;
        return false;
      }
    ;
        if ($truthy((cmp = self['$<=>'](other)))) {
        } else {
          return false
        };
        return $$($nesting, 'Comparable').$normalize(cmp) == 0;
      } catch ($err) {
        if (Opal.rescue($err, [$$($nesting, 'StandardError')])) {
          try {
            return false
          } finally { Opal.pop_exception() }
        } else { throw $err; }
      }
    }, $Comparable_$eq_eq$2.$$arity = 1);
    
    Opal.def(self, '$>', $Comparable_$gt$3 = function(other) {
      var self = this, cmp = nil;

      
      if ($truthy((cmp = self['$<=>'](other)))) {
      } else {
        self.$raise($$($nesting, 'ArgumentError'), "" + "comparison of " + (self.$class()) + " with " + (other.$class()) + " failed")
      };
      return $$($nesting, 'Comparable').$normalize(cmp) > 0;
    }, $Comparable_$gt$3.$$arity = 1);
    
    Opal.def(self, '$>=', $Comparable_$gt_eq$4 = function(other) {
      var self = this, cmp = nil;

      
      if ($truthy((cmp = self['$<=>'](other)))) {
      } else {
        self.$raise($$($nesting, 'ArgumentError'), "" + "comparison of " + (self.$class()) + " with " + (other.$class()) + " failed")
      };
      return $$($nesting, 'Comparable').$normalize(cmp) >= 0;
    }, $Comparable_$gt_eq$4.$$arity = 1);
    
    Opal.def(self, '$<', $Comparable_$lt$5 = function(other) {
      var self = this, cmp = nil;

      
      if ($truthy((cmp = self['$<=>'](other)))) {
      } else {
        self.$raise($$($nesting, 'ArgumentError'), "" + "comparison of " + (self.$class()) + " with " + (other.$class()) + " failed")
      };
      return $$($nesting, 'Comparable').$normalize(cmp) < 0;
    }, $Comparable_$lt$5.$$arity = 1);
    
    Opal.def(self, '$<=', $Comparable_$lt_eq$6 = function(other) {
      var self = this, cmp = nil;

      
      if ($truthy((cmp = self['$<=>'](other)))) {
      } else {
        self.$raise($$($nesting, 'ArgumentError'), "" + "comparison of " + (self.$class()) + " with " + (other.$class()) + " failed")
      };
      return $$($nesting, 'Comparable').$normalize(cmp) <= 0;
    }, $Comparable_$lt_eq$6.$$arity = 1);
    
    Opal.def(self, '$between?', $Comparable_between$ques$7 = function(min, max) {
      var self = this;

      
      if ($rb_lt(self, min)) {
        return false};
      if ($rb_gt(self, max)) {
        return false};
      return true;
    }, $Comparable_between$ques$7.$$arity = 2);
    
    Opal.def(self, '$clamp', $Comparable_clamp$8 = function $$clamp(min, max) {
      var self = this, cmp = nil;

      
      cmp = min['$<=>'](max);
      if ($truthy(cmp)) {
      } else {
        self.$raise($$($nesting, 'ArgumentError'), "" + "comparison of " + (min.$class()) + " with " + (max.$class()) + " failed")
      };
      if ($truthy($rb_gt($$($nesting, 'Comparable').$normalize(cmp), 0))) {
        self.$raise($$($nesting, 'ArgumentError'), "min argument must be smaller than max argument")};
      if ($truthy($rb_lt($$($nesting, 'Comparable').$normalize(self['$<=>'](min)), 0))) {
        return min};
      if ($truthy($rb_gt($$($nesting, 'Comparable').$normalize(self['$<=>'](max)), 0))) {
        return max};
      return self;
    }, $Comparable_clamp$8.$$arity = 2);
  })($nesting[0], $nesting)
};

/* Generated by Opal 0.11.99.dev */
Opal.modules["corelib/regexp"] = function(Opal) {
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice, $klass = Opal.klass, $send = Opal.send, $truthy = Opal.truthy, $gvars = Opal.gvars;

  Opal.add_stubs(['$nil?', '$[]', '$raise', '$escape', '$options', '$to_str', '$new', '$join', '$coerce_to!', '$!', '$match', '$coerce_to?', '$begin', '$coerce_to', '$=~', '$attr_reader', '$===', '$inspect', '$to_a']);
  
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'RegexpError');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'StandardError'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Regexp');

    var $nesting = [self].concat($parent_nesting), $Regexp_$eq_eq$6, $Regexp_$eq_eq_eq$7, $Regexp_$eq_tilde$8, $Regexp_inspect$9, $Regexp_match$10, $Regexp_match$ques$11, $Regexp_$$12, $Regexp_source$13, $Regexp_options$14, $Regexp_casefold$ques$15;

    
    Opal.const_set($nesting[0], 'IGNORECASE', 1);
    Opal.const_set($nesting[0], 'EXTENDED', 2);
    Opal.const_set($nesting[0], 'MULTILINE', 4);
    Opal.defineProperty(self.$$prototype, '$$is_regexp', true);
    (function(self, $parent_nesting) {
      var $nesting = [self].concat($parent_nesting), $allocate$1, $escape$2, $last_match$3, $union$4, $new$5;

      
      
      Opal.def(self, '$allocate', $allocate$1 = function $$allocate() {
        var $iter = $allocate$1.$$p, $yield = $iter || nil, self = this, allocated = nil, $zuper = nil, $zuper_i = nil, $zuper_ii = nil;

        if ($iter) $allocate$1.$$p = null;
        // Prepare super implicit arguments
        for($zuper_i = 0, $zuper_ii = arguments.length, $zuper = new Array($zuper_ii); $zuper_i < $zuper_ii; $zuper_i++) {
          $zuper[$zuper_i] = arguments[$zuper_i];
        }
        
        allocated = $send(self, Opal.find_super_dispatcher(self, 'allocate', $allocate$1, false), $zuper, $iter);
        allocated.uninitialized = true;
        return allocated;
      }, $allocate$1.$$arity = 0);
      
      Opal.def(self, '$escape', $escape$2 = function $$escape(string) {
        var self = this;

        return Opal.escape_regexp(string);
      }, $escape$2.$$arity = 1);
      
      Opal.def(self, '$last_match', $last_match$3 = function $$last_match(n) {
        var self = this;
        if ($gvars["~"] == null) $gvars["~"] = nil;

        
        
        if (n == null) {
          n = nil;
        };
        if ($truthy(n['$nil?']())) {
          return $gvars["~"]
        } else {
          return $gvars["~"]['$[]'](n)
        };
      }, $last_match$3.$$arity = -1);
      Opal.alias(self, "quote", "escape");
      
      Opal.def(self, '$union', $union$4 = function $$union($a) {
        var $post_args, parts, self = this;

        
        
        $post_args = Opal.slice.call(arguments, 0, arguments.length);
        
        parts = $post_args;;
        
        var is_first_part_array, quoted_validated, part, options, each_part_options;
        if (parts.length == 0) {
          return /(?!)/;
        }
        // return fast if there's only one element
        if (parts.length == 1 && parts[0].$$is_regexp) {
          return parts[0];
        }
        // cover the 2 arrays passed as arguments case
        is_first_part_array = parts[0].$$is_array;
        if (parts.length > 1 && is_first_part_array) {
          self.$raise($$($nesting, 'TypeError'), "no implicit conversion of Array into String")
        }
        // deal with splat issues (related to https://github.com/opal/opal/issues/858)
        if (is_first_part_array) {
          parts = parts[0];
        }
        options = undefined;
        quoted_validated = [];
        for (var i=0; i < parts.length; i++) {
          part = parts[i];
          if (part.$$is_string) {
            quoted_validated.push(self.$escape(part));
          }
          else if (part.$$is_regexp) {
            each_part_options = (part).$options();
            if (options != undefined && options != each_part_options) {
              self.$raise($$($nesting, 'TypeError'), "All expressions must use the same options")
            }
            options = each_part_options;
            quoted_validated.push('('+part.source+')');
          }
          else {
            quoted_validated.push(self.$escape((part).$to_str()));
          }
        }
      ;
        return self.$new((quoted_validated).$join("|"), options);
      }, $union$4.$$arity = -1);
      return (Opal.def(self, '$new', $new$5 = function(regexp, options) {
        var self = this;

        
        ;
        
        if (regexp.$$is_regexp) {
          return new RegExp(regexp);
        }

        regexp = $$($nesting, 'Opal')['$coerce_to!'](regexp, $$($nesting, 'String'), "to_str");

        if (regexp.charAt(regexp.length - 1) === '\\' && regexp.charAt(regexp.length - 2) !== '\\') {
          self.$raise($$($nesting, 'RegexpError'), "" + "too short escape sequence: /" + (regexp) + "/")
        }

        if (options === undefined || options['$!']()) {
          return new RegExp(regexp);
        }

        if (options.$$is_number) {
          var temp = '';
          if ($$($nesting, 'IGNORECASE') & options) { temp += 'i'; }
          if ($$($nesting, 'MULTILINE')  & options) { temp += 'm'; }
          options = temp;
        }
        else {
          options = 'i';
        }

        return new RegExp(regexp, options);
      ;
      }, $new$5.$$arity = -2), nil) && 'new';
    })(Opal.get_singleton_class(self), $nesting);
    
    Opal.def(self, '$==', $Regexp_$eq_eq$6 = function(other) {
      var self = this;

      return other instanceof RegExp && self.toString() === other.toString();
    }, $Regexp_$eq_eq$6.$$arity = 1);
    
    Opal.def(self, '$===', $Regexp_$eq_eq_eq$7 = function(string) {
      var self = this;

      return self.$match($$($nesting, 'Opal')['$coerce_to?'](string, $$($nesting, 'String'), "to_str")) !== nil
    }, $Regexp_$eq_eq_eq$7.$$arity = 1);
    
    Opal.def(self, '$=~', $Regexp_$eq_tilde$8 = function(string) {
      var $a, self = this;
      if ($gvars["~"] == null) $gvars["~"] = nil;

      return ($truthy($a = self.$match(string)) ? $gvars["~"].$begin(0) : $a)
    }, $Regexp_$eq_tilde$8.$$arity = 1);
    Opal.alias(self, "eql?", "==");
    
    Opal.def(self, '$inspect', $Regexp_inspect$9 = function $$inspect() {
      var self = this;

      
      var regexp_format = /^\/(.*)\/([^\/]*)$/;
      var value = self.toString();
      var matches = regexp_format.exec(value);
      if (matches) {
        var regexp_pattern = matches[1];
        var regexp_flags = matches[2];
        var chars = regexp_pattern.split('');
        var chars_length = chars.length;
        var char_escaped = false;
        var regexp_pattern_escaped = '';
        for (var i = 0; i < chars_length; i++) {
          var current_char = chars[i];
          if (!char_escaped && current_char == '/') {
            regexp_pattern_escaped = regexp_pattern_escaped.concat('\\');
          }
          regexp_pattern_escaped = regexp_pattern_escaped.concat(current_char);
          if (current_char == '\\') {
            if (char_escaped) {
              // does not over escape
              char_escaped = false;
            } else {
              char_escaped = true;
            }
          } else {
            char_escaped = false;
          }
        }
        return '/' + regexp_pattern_escaped + '/' + regexp_flags;
      } else {
        return value;
      }
    
    }, $Regexp_inspect$9.$$arity = 0);
    
    Opal.def(self, '$match', $Regexp_match$10 = function $$match(string, pos) {
      var $iter = $Regexp_match$10.$$p, block = $iter || nil, self = this;
      if ($gvars["~"] == null) $gvars["~"] = nil;

      if ($iter) $Regexp_match$10.$$p = null;
      
      
      if ($iter) $Regexp_match$10.$$p = null;;
      ;
      
      if (self.uninitialized) {
        self.$raise($$($nesting, 'TypeError'), "uninitialized Regexp")
      }

      if (pos === undefined) {
        if (string === nil) return ($gvars["~"] = nil);
        var m = self.exec($$($nesting, 'Opal').$coerce_to(string, $$($nesting, 'String'), "to_str"));
        if (m) {
          ($gvars["~"] = $$($nesting, 'MatchData').$new(self, m));
          return block === nil ? $gvars["~"] : Opal.yield1(block, $gvars["~"]);
        } else {
          return ($gvars["~"] = nil);
        }
      }

      pos = $$($nesting, 'Opal').$coerce_to(pos, $$($nesting, 'Integer'), "to_int");

      if (string === nil) {
        return ($gvars["~"] = nil);
      }

      string = $$($nesting, 'Opal').$coerce_to(string, $$($nesting, 'String'), "to_str");

      if (pos < 0) {
        pos += string.length;
        if (pos < 0) {
          return ($gvars["~"] = nil);
        }
      }

      // global RegExp maintains state, so not using self/this
      var md, re = Opal.global_regexp(self);

      while (true) {
        md = re.exec(string);
        if (md === null) {
          return ($gvars["~"] = nil);
        }
        if (md.index >= pos) {
          ($gvars["~"] = $$($nesting, 'MatchData').$new(re, md));
          return block === nil ? $gvars["~"] : Opal.yield1(block, $gvars["~"]);
        }
        re.lastIndex = md.index + 1;
      }
    ;
    }, $Regexp_match$10.$$arity = -2);
    
    Opal.def(self, '$match?', $Regexp_match$ques$11 = function(string, pos) {
      var self = this;

      
      ;
      
      if (self.uninitialized) {
        self.$raise($$($nesting, 'TypeError'), "uninitialized Regexp")
      }

      if (pos === undefined) {
        return string === nil ? false : self.test($$($nesting, 'Opal').$coerce_to(string, $$($nesting, 'String'), "to_str"));
      }

      pos = $$($nesting, 'Opal').$coerce_to(pos, $$($nesting, 'Integer'), "to_int");

      if (string === nil) {
        return false;
      }

      string = $$($nesting, 'Opal').$coerce_to(string, $$($nesting, 'String'), "to_str");

      if (pos < 0) {
        pos += string.length;
        if (pos < 0) {
          return false;
        }
      }

      // global RegExp maintains state, so not using self/this
      var md, re = Opal.global_regexp(self);

      md = re.exec(string);
      if (md === null || md.index < pos) {
        return false;
      } else {
        return true;
      }
    ;
    }, $Regexp_match$ques$11.$$arity = -2);
    
    Opal.def(self, '$~', $Regexp_$$12 = function() {
      var self = this;
      if ($gvars._ == null) $gvars._ = nil;

      return self['$=~']($gvars._)
    }, $Regexp_$$12.$$arity = 0);
    
    Opal.def(self, '$source', $Regexp_source$13 = function $$source() {
      var self = this;

      return self.source;
    }, $Regexp_source$13.$$arity = 0);
    
    Opal.def(self, '$options', $Regexp_options$14 = function $$options() {
      var self = this;

      
      if (self.uninitialized) {
        self.$raise($$($nesting, 'TypeError'), "uninitialized Regexp")
      }
      var result = 0;
      // should be supported in IE6 according to https://msdn.microsoft.com/en-us/library/7f5z26w4(v=vs.94).aspx
      if (self.multiline) {
        result |= $$($nesting, 'MULTILINE');
      }
      if (self.ignoreCase) {
        result |= $$($nesting, 'IGNORECASE');
      }
      return result;
    
    }, $Regexp_options$14.$$arity = 0);
    
    Opal.def(self, '$casefold?', $Regexp_casefold$ques$15 = function() {
      var self = this;

      return self.ignoreCase;
    }, $Regexp_casefold$ques$15.$$arity = 0);
    return Opal.alias(self, "to_s", "source");
  })($nesting[0], RegExp, $nesting);
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'MatchData');

    var $nesting = [self].concat($parent_nesting), $MatchData_initialize$16, $MatchData_$$$17, $MatchData_offset$18, $MatchData_$eq_eq$19, $MatchData_begin$20, $MatchData_end$21, $MatchData_captures$22, $MatchData_inspect$23, $MatchData_length$24, $MatchData_to_a$25, $MatchData_to_s$26, $MatchData_values_at$27;

    self.$$prototype.matches = nil;
    
    self.$attr_reader("post_match", "pre_match", "regexp", "string");
    
    Opal.def(self, '$initialize', $MatchData_initialize$16 = function $$initialize(regexp, match_groups) {
      var self = this;

      
      $gvars["~"] = self;
      self.regexp = regexp;
      self.begin = match_groups.index;
      self.string = match_groups.input;
      self.pre_match = match_groups.input.slice(0, match_groups.index);
      self.post_match = match_groups.input.slice(match_groups.index + match_groups[0].length);
      self.matches = [];
      
      for (var i = 0, length = match_groups.length; i < length; i++) {
        var group = match_groups[i];

        if (group == null) {
          self.matches.push(nil);
        }
        else {
          self.matches.push(group);
        }
      }
    ;
    }, $MatchData_initialize$16.$$arity = 2);
    
    Opal.def(self, '$[]', $MatchData_$$$17 = function($a) {
      var $post_args, args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      return $send(self.matches, '[]', Opal.to_a(args));
    }, $MatchData_$$$17.$$arity = -1);
    
    Opal.def(self, '$offset', $MatchData_offset$18 = function $$offset(n) {
      var self = this;

      
      if (n !== 0) {
        self.$raise($$($nesting, 'ArgumentError'), "MatchData#offset only supports 0th element")
      }
      return [self.begin, self.begin + self.matches[n].length];
    
    }, $MatchData_offset$18.$$arity = 1);
    
    Opal.def(self, '$==', $MatchData_$eq_eq$19 = function(other) {
      var $a, $b, $c, $d, self = this;

      
      if ($truthy($$($nesting, 'MatchData')['$==='](other))) {
      } else {
        return false
      };
      return ($truthy($a = ($truthy($b = ($truthy($c = ($truthy($d = self.string == other.string) ? self.regexp.toString() == other.regexp.toString() : $d)) ? self.pre_match == other.pre_match : $c)) ? self.post_match == other.post_match : $b)) ? self.begin == other.begin : $a);
    }, $MatchData_$eq_eq$19.$$arity = 1);
    Opal.alias(self, "eql?", "==");
    
    Opal.def(self, '$begin', $MatchData_begin$20 = function $$begin(n) {
      var self = this;

      
      if (n !== 0) {
        self.$raise($$($nesting, 'ArgumentError'), "MatchData#begin only supports 0th element")
      }
      return self.begin;
    
    }, $MatchData_begin$20.$$arity = 1);
    
    Opal.def(self, '$end', $MatchData_end$21 = function $$end(n) {
      var self = this;

      
      if (n !== 0) {
        self.$raise($$($nesting, 'ArgumentError'), "MatchData#end only supports 0th element")
      }
      return self.begin + self.matches[n].length;
    
    }, $MatchData_end$21.$$arity = 1);
    
    Opal.def(self, '$captures', $MatchData_captures$22 = function $$captures() {
      var self = this;

      return self.matches.slice(1)
    }, $MatchData_captures$22.$$arity = 0);
    
    Opal.def(self, '$inspect', $MatchData_inspect$23 = function $$inspect() {
      var self = this;

      
      var str = "#<MatchData " + (self.matches[0]).$inspect();

      for (var i = 1, length = self.matches.length; i < length; i++) {
        str += " " + i + ":" + (self.matches[i]).$inspect();
      }

      return str + ">";
    
    }, $MatchData_inspect$23.$$arity = 0);
    
    Opal.def(self, '$length', $MatchData_length$24 = function $$length() {
      var self = this;

      return self.matches.length
    }, $MatchData_length$24.$$arity = 0);
    Opal.alias(self, "size", "length");
    
    Opal.def(self, '$to_a', $MatchData_to_a$25 = function $$to_a() {
      var self = this;

      return self.matches
    }, $MatchData_to_a$25.$$arity = 0);
    
    Opal.def(self, '$to_s', $MatchData_to_s$26 = function $$to_s() {
      var self = this;

      return self.matches[0]
    }, $MatchData_to_s$26.$$arity = 0);
    return (Opal.def(self, '$values_at', $MatchData_values_at$27 = function $$values_at($a) {
      var $post_args, args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      
      var i, a, index, values = [];

      for (i = 0; i < args.length; i++) {

        if (args[i].$$is_range) {
          a = (args[i]).$to_a();
          a.unshift(i, 1);
          Array.prototype.splice.apply(args, a);
        }

        index = $$($nesting, 'Opal')['$coerce_to!'](args[i], $$($nesting, 'Integer'), "to_int");

        if (index < 0) {
          index += self.matches.length;
          if (index < 0) {
            values.push(nil);
            continue;
          }
        }

        values.push(self.matches[index]);
      }

      return values;
    ;
    }, $MatchData_values_at$27.$$arity = -1), nil) && 'values_at';
  })($nesting[0], null, $nesting);
};

/* Generated by Opal 0.11.99.dev */
Opal.modules["corelib/string"] = function(Opal) {
  function $rb_divide(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs / rhs : lhs['$/'](rhs);
  }
  function $rb_plus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs + rhs : lhs['$+'](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice, $klass = Opal.klass, $truthy = Opal.truthy, $send = Opal.send, $gvars = Opal.gvars;

  Opal.add_stubs(['$require', '$include', '$coerce_to?', '$coerce_to', '$raise', '$===', '$format', '$to_s', '$respond_to?', '$to_str', '$<=>', '$==', '$=~', '$new', '$force_encoding', '$casecmp', '$empty?', '$ljust', '$ceil', '$/', '$+', '$rjust', '$floor', '$to_a', '$each_char', '$to_proc', '$coerce_to!', '$copy_singleton_methods', '$initialize_clone', '$initialize_dup', '$enum_for', '$size', '$chomp', '$[]', '$to_i', '$each_line', '$class', '$match', '$match?', '$captures', '$proc', '$succ', '$escape']);
  
  self.$require("corelib/comparable");
  self.$require("corelib/regexp");
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'String');

    var $nesting = [self].concat($parent_nesting), $String___id__$1, $String_try_convert$2, $String_new$3, $String_initialize$4, $String_$percent$5, $String_$$6, $String_$plus$7, $String_$lt_eq_gt$8, $String_$eq_eq$9, $String_$eq_tilde$10, $String_$$$11, $String_b$12, $String_capitalize$13, $String_casecmp$14, $String_casecmp$ques$15, $String_center$16, $String_chars$17, $String_chomp$18, $String_chop$19, $String_chr$20, $String_clone$21, $String_dup$22, $String_count$23, $String_delete$24, $String_delete_prefix$25, $String_delete_suffix$26, $String_downcase$27, $String_each_char$28, $String_each_line$30, $String_empty$ques$31, $String_end_with$ques$32, $String_gsub$33, $String_hash$34, $String_hex$35, $String_include$ques$36, $String_index$37, $String_inspect$38, $String_intern$39, $String_lines$40, $String_length$41, $String_ljust$42, $String_lstrip$43, $String_ascii_only$ques$44, $String_match$45, $String_match$ques$46, $String_next$47, $String_oct$48, $String_ord$49, $String_partition$50, $String_reverse$51, $String_rindex$52, $String_rjust$53, $String_rpartition$54, $String_rstrip$55, $String_scan$56, $String_split$57, $String_squeeze$58, $String_start_with$ques$59, $String_strip$60, $String_sub$61, $String_sum$62, $String_swapcase$63, $String_to_f$64, $String_to_i$65, $String_to_proc$66, $String_to_s$68, $String_tr$69, $String_tr_s$70, $String_upcase$71, $String_upto$72, $String_instance_variables$73, $String__load$74, $String_unicode_normalize$75, $String_unicode_normalized$ques$76, $String_unpack$77, $String_unpack1$78;

    
    self.$include($$($nesting, 'Comparable'));
    
    Opal.defineProperty(self.$$prototype, '$$is_string', true);

    Opal.defineProperty(self.$$prototype, '$$cast', function(string) {
      var klass = this.$$class;
      if (klass.$$constructor === String) {
        return string;
      } else {
        return new klass.$$constructor(string);
      }
    });
  ;
    
    Opal.def(self, '$__id__', $String___id__$1 = function $$__id__() {
      var self = this;

      return self.toString();
    }, $String___id__$1.$$arity = 0);
    Opal.alias(self, "object_id", "__id__");
    Opal.defs(self, '$try_convert', $String_try_convert$2 = function $$try_convert(what) {
      var self = this;

      return $$($nesting, 'Opal')['$coerce_to?'](what, $$($nesting, 'String'), "to_str")
    }, $String_try_convert$2.$$arity = 1);
    Opal.defs(self, '$new', $String_new$3 = function(str) {
      var self = this;

      
      
      if (str == null) {
        str = "";
      };
      str = $$($nesting, 'Opal').$coerce_to(str, $$($nesting, 'String'), "to_str");
      return new self.$$constructor(str);;
    }, $String_new$3.$$arity = -1);
    
    Opal.def(self, '$initialize', $String_initialize$4 = function $$initialize(str) {
      var self = this;

      
      ;
      
      if (str === undefined) {
        return self;
      }
    ;
      return self.$raise($$($nesting, 'NotImplementedError'), "Mutable strings are not supported in Opal.");
    }, $String_initialize$4.$$arity = -1);
    
    Opal.def(self, '$%', $String_$percent$5 = function(data) {
      var self = this;

      if ($truthy($$($nesting, 'Array')['$==='](data))) {
        return $send(self, 'format', [self].concat(Opal.to_a(data)))
      } else {
        return self.$format(self, data)
      }
    }, $String_$percent$5.$$arity = 1);
    
    Opal.def(self, '$*', $String_$$6 = function(count) {
      var self = this;

      
      count = $$($nesting, 'Opal').$coerce_to(count, $$($nesting, 'Integer'), "to_int");

      if (count < 0) {
        self.$raise($$($nesting, 'ArgumentError'), "negative argument")
      }

      if (count === 0) {
        return self.$$cast('');
      }

      var result = '',
          string = self.toString();

      // All credit for the bit-twiddling magic code below goes to Mozilla
      // polyfill implementation of String.prototype.repeat() posted here:
      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/repeat

      if (string.length * count >= 1 << 28) {
        self.$raise($$($nesting, 'RangeError'), "multiply count must not overflow maximum string size")
      }

      for (;;) {
        if ((count & 1) === 1) {
          result += string;
        }
        count >>>= 1;
        if (count === 0) {
          break;
        }
        string += string;
      }

      return self.$$cast(result);
    
    }, $String_$$6.$$arity = 1);
    
    Opal.def(self, '$+', $String_$plus$7 = function(other) {
      var self = this;

      
      other = $$($nesting, 'Opal').$coerce_to(other, $$($nesting, 'String'), "to_str");
      return self + other.$to_s();
    }, $String_$plus$7.$$arity = 1);
    
    Opal.def(self, '$<=>', $String_$lt_eq_gt$8 = function(other) {
      var self = this;

      if ($truthy(other['$respond_to?']("to_str"))) {
        
        other = other.$to_str().$to_s();
        return self > other ? 1 : (self < other ? -1 : 0);;
      } else {
        
        var cmp = other['$<=>'](self);

        if (cmp === nil) {
          return nil;
        }
        else {
          return cmp > 0 ? -1 : (cmp < 0 ? 1 : 0);
        }
      
      }
    }, $String_$lt_eq_gt$8.$$arity = 1);
    
    Opal.def(self, '$==', $String_$eq_eq$9 = function(other) {
      var self = this;

      
      if (other.$$is_string) {
        return self.toString() === other.toString();
      }
      if ($$($nesting, 'Opal')['$respond_to?'](other, "to_str")) {
        return other['$=='](self);
      }
      return false;
    
    }, $String_$eq_eq$9.$$arity = 1);
    Opal.alias(self, "eql?", "==");
    Opal.alias(self, "===", "==");
    
    Opal.def(self, '$=~', $String_$eq_tilde$10 = function(other) {
      var self = this;

      
      if (other.$$is_string) {
        self.$raise($$($nesting, 'TypeError'), "type mismatch: String given");
      }

      return other['$=~'](self);
    
    }, $String_$eq_tilde$10.$$arity = 1);
    
    Opal.def(self, '$[]', $String_$$$11 = function(index, length) {
      var self = this;

      
      ;
      
      var size = self.length, exclude;

      if (index.$$is_range) {
        exclude = index.excl;
        length  = $$($nesting, 'Opal').$coerce_to(index.end, $$($nesting, 'Integer'), "to_int");
        index   = $$($nesting, 'Opal').$coerce_to(index.begin, $$($nesting, 'Integer'), "to_int");

        if (Math.abs(index) > size) {
          return nil;
        }

        if (index < 0) {
          index += size;
        }

        if (length < 0) {
          length += size;
        }

        if (!exclude) {
          length += 1;
        }

        length = length - index;

        if (length < 0) {
          length = 0;
        }

        return self.$$cast(self.substr(index, length));
      }


      if (index.$$is_string) {
        if (length != null) {
          self.$raise($$($nesting, 'TypeError'))
        }
        return self.indexOf(index) !== -1 ? self.$$cast(index) : nil;
      }


      if (index.$$is_regexp) {
        var match = self.match(index);

        if (match === null) {
          ($gvars["~"] = nil)
          return nil;
        }

        ($gvars["~"] = $$($nesting, 'MatchData').$new(index, match))

        if (length == null) {
          return self.$$cast(match[0]);
        }

        length = $$($nesting, 'Opal').$coerce_to(length, $$($nesting, 'Integer'), "to_int");

        if (length < 0 && -length < match.length) {
          return self.$$cast(match[length += match.length]);
        }

        if (length >= 0 && length < match.length) {
          return self.$$cast(match[length]);
        }

        return nil;
      }


      index = $$($nesting, 'Opal').$coerce_to(index, $$($nesting, 'Integer'), "to_int");

      if (index < 0) {
        index += size;
      }

      if (length == null) {
        if (index >= size || index < 0) {
          return nil;
        }
        return self.$$cast(self.substr(index, 1));
      }

      length = $$($nesting, 'Opal').$coerce_to(length, $$($nesting, 'Integer'), "to_int");

      if (length < 0) {
        return nil;
      }

      if (index > size || index < 0) {
        return nil;
      }

      return self.$$cast(self.substr(index, length));
    ;
    }, $String_$$$11.$$arity = -2);
    Opal.alias(self, "byteslice", "[]");
    
    Opal.def(self, '$b', $String_b$12 = function $$b() {
      var self = this;

      return self.$force_encoding("binary")
    }, $String_b$12.$$arity = 0);
    
    Opal.def(self, '$capitalize', $String_capitalize$13 = function $$capitalize() {
      var self = this;

      return self.$$cast(self.charAt(0).toUpperCase() + self.substr(1).toLowerCase());
    }, $String_capitalize$13.$$arity = 0);
    
    Opal.def(self, '$casecmp', $String_casecmp$14 = function $$casecmp(other) {
      var self = this;

      
      if ($truthy(other['$respond_to?']("to_str"))) {
      } else {
        return nil
      };
      other = $$($nesting, 'Opal').$coerce_to(other, $$($nesting, 'String'), "to_str").$to_s();
      
      var ascii_only = /^[\x00-\x7F]*$/;
      if (ascii_only.test(self) && ascii_only.test(other)) {
        self = self.toLowerCase();
        other = other.toLowerCase();
      }
    ;
      return self['$<=>'](other);
    }, $String_casecmp$14.$$arity = 1);
    
    Opal.def(self, '$casecmp?', $String_casecmp$ques$15 = function(other) {
      var self = this;

      
      var cmp = self.$casecmp(other);
      if (cmp === nil) {
        return nil;
      } else {
        return cmp === 0;
      }
    
    }, $String_casecmp$ques$15.$$arity = 1);
    
    Opal.def(self, '$center', $String_center$16 = function $$center(width, padstr) {
      var self = this;

      
      
      if (padstr == null) {
        padstr = " ";
      };
      width = $$($nesting, 'Opal').$coerce_to(width, $$($nesting, 'Integer'), "to_int");
      padstr = $$($nesting, 'Opal').$coerce_to(padstr, $$($nesting, 'String'), "to_str").$to_s();
      if ($truthy(padstr['$empty?']())) {
        self.$raise($$($nesting, 'ArgumentError'), "zero width padding")};
      if ($truthy(width <= self.length)) {
        return self};
      
      var ljustified = self.$ljust($rb_divide($rb_plus(width, self.length), 2).$ceil(), padstr),
          rjustified = self.$rjust($rb_divide($rb_plus(width, self.length), 2).$floor(), padstr);

      return self.$$cast(rjustified + ljustified.slice(self.length));
    ;
    }, $String_center$16.$$arity = -2);
    
    Opal.def(self, '$chars', $String_chars$17 = function $$chars() {
      var $iter = $String_chars$17.$$p, block = $iter || nil, self = this;

      if ($iter) $String_chars$17.$$p = null;
      
      
      if ($iter) $String_chars$17.$$p = null;;
      if ($truthy(block)) {
      } else {
        return self.$each_char().$to_a()
      };
      return $send(self, 'each_char', [], block.$to_proc());
    }, $String_chars$17.$$arity = 0);
    
    Opal.def(self, '$chomp', $String_chomp$18 = function $$chomp(separator) {
      var self = this;
      if ($gvars["/"] == null) $gvars["/"] = nil;

      
      
      if (separator == null) {
        separator = $gvars["/"];
      };
      if ($truthy(separator === nil || self.length === 0)) {
        return self};
      separator = $$($nesting, 'Opal')['$coerce_to!'](separator, $$($nesting, 'String'), "to_str").$to_s();
      
      var result;

      if (separator === "\n") {
        result = self.replace(/\r?\n?$/, '');
      }
      else if (separator === "") {
        result = self.replace(/(\r?\n)+$/, '');
      }
      else if (self.length >= separator.length) {
        var tail = self.substr(self.length - separator.length, separator.length);

        if (tail === separator) {
          result = self.substr(0, self.length - separator.length);
        }
      }

      if (result != null) {
        return self.$$cast(result);
      }
    ;
      return self;
    }, $String_chomp$18.$$arity = -1);
    
    Opal.def(self, '$chop', $String_chop$19 = function $$chop() {
      var self = this;

      
      var length = self.length, result;

      if (length <= 1) {
        result = "";
      } else if (self.charAt(length - 1) === "\n" && self.charAt(length - 2) === "\r") {
        result = self.substr(0, length - 2);
      } else {
        result = self.substr(0, length - 1);
      }

      return self.$$cast(result);
    
    }, $String_chop$19.$$arity = 0);
    
    Opal.def(self, '$chr', $String_chr$20 = function $$chr() {
      var self = this;

      return self.charAt(0);
    }, $String_chr$20.$$arity = 0);
    
    Opal.def(self, '$clone', $String_clone$21 = function $$clone() {
      var self = this, copy = nil;

      
      copy = self.slice();
      copy.$copy_singleton_methods(self);
      copy.$initialize_clone(self);
      return copy;
    }, $String_clone$21.$$arity = 0);
    
    Opal.def(self, '$dup', $String_dup$22 = function $$dup() {
      var self = this, copy = nil;

      
      copy = self.slice();
      copy.$initialize_dup(self);
      return copy;
    }, $String_dup$22.$$arity = 0);
    
    Opal.def(self, '$count', $String_count$23 = function $$count($a) {
      var $post_args, sets, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      sets = $post_args;;
      
      if (sets.length === 0) {
        self.$raise($$($nesting, 'ArgumentError'), "ArgumentError: wrong number of arguments (0 for 1+)")
      }
      var char_class = char_class_from_char_sets(sets);
      if (char_class === null) {
        return 0;
      }
      return self.length - self.replace(new RegExp(char_class, 'g'), '').length;
    ;
    }, $String_count$23.$$arity = -1);
    
    Opal.def(self, '$delete', $String_delete$24 = function($a) {
      var $post_args, sets, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      sets = $post_args;;
      
      if (sets.length === 0) {
        self.$raise($$($nesting, 'ArgumentError'), "ArgumentError: wrong number of arguments (0 for 1+)")
      }
      var char_class = char_class_from_char_sets(sets);
      if (char_class === null) {
        return self;
      }
      return self.$$cast(self.replace(new RegExp(char_class, 'g'), ''));
    ;
    }, $String_delete$24.$$arity = -1);
    
    Opal.def(self, '$delete_prefix', $String_delete_prefix$25 = function $$delete_prefix(prefix) {
      var self = this;

      
      if (!prefix.$$is_string) {
        (prefix = $$($nesting, 'Opal').$coerce_to(prefix, $$($nesting, 'String'), "to_str"))
      }

      if (self.slice(0, prefix.length) === prefix) {
        return self.$$cast(self.slice(prefix.length));
      } else {
        return self;
      }
    
    }, $String_delete_prefix$25.$$arity = 1);
    
    Opal.def(self, '$delete_suffix', $String_delete_suffix$26 = function $$delete_suffix(suffix) {
      var self = this;

      
      if (!suffix.$$is_string) {
        (suffix = $$($nesting, 'Opal').$coerce_to(suffix, $$($nesting, 'String'), "to_str"))
      }

      if (self.slice(self.length - suffix.length) === suffix) {
        return self.$$cast(self.slice(0, self.length - suffix.length));
      } else {
        return self;
      }
    
    }, $String_delete_suffix$26.$$arity = 1);
    
    Opal.def(self, '$downcase', $String_downcase$27 = function $$downcase() {
      var self = this;

      return self.$$cast(self.toLowerCase());
    }, $String_downcase$27.$$arity = 0);
    
    Opal.def(self, '$each_char', $String_each_char$28 = function $$each_char() {
      var $iter = $String_each_char$28.$$p, block = $iter || nil, $$29, self = this;

      if ($iter) $String_each_char$28.$$p = null;
      
      
      if ($iter) $String_each_char$28.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["each_char"], ($$29 = function(){var self = $$29.$$s || this;

        return self.$size()}, $$29.$$s = self, $$29.$$arity = 0, $$29))
      };
      
      for (var i = 0, length = self.length; i < length; i++) {
        Opal.yield1(block, self.charAt(i));
      }
    ;
      return self;
    }, $String_each_char$28.$$arity = 0);
    
    Opal.def(self, '$each_line', $String_each_line$30 = function $$each_line(separator) {
      var $iter = $String_each_line$30.$$p, block = $iter || nil, self = this;
      if ($gvars["/"] == null) $gvars["/"] = nil;

      if ($iter) $String_each_line$30.$$p = null;
      
      
      if ($iter) $String_each_line$30.$$p = null;;
      
      if (separator == null) {
        separator = $gvars["/"];
      };
      if ((block !== nil)) {
      } else {
        return self.$enum_for("each_line", separator)
      };
      
      if (separator === nil) {
        Opal.yield1(block, self);

        return self;
      }

      separator = $$($nesting, 'Opal').$coerce_to(separator, $$($nesting, 'String'), "to_str")

      var a, i, n, length, chomped, trailing, splitted;

      if (separator.length === 0) {
        for (a = self.split(/(\n{2,})/), i = 0, n = a.length; i < n; i += 2) {
          if (a[i] || a[i + 1]) {
            var value = (a[i] || "") + (a[i + 1] || "");
            Opal.yield1(block, self.$$cast(value));
          }
        }

        return self;
      }

      chomped  = self.$chomp(separator);
      trailing = self.length != chomped.length;
      splitted = chomped.split(separator);

      for (i = 0, length = splitted.length; i < length; i++) {
        if (i < length - 1 || trailing) {
          Opal.yield1(block, self.$$cast(splitted[i] + separator));
        }
        else {
          Opal.yield1(block, self.$$cast(splitted[i]));
        }
      }
    ;
      return self;
    }, $String_each_line$30.$$arity = -1);
    
    Opal.def(self, '$empty?', $String_empty$ques$31 = function() {
      var self = this;

      return self.length === 0;
    }, $String_empty$ques$31.$$arity = 0);
    
    Opal.def(self, '$end_with?', $String_end_with$ques$32 = function($a) {
      var $post_args, suffixes, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      suffixes = $post_args;;
      
      for (var i = 0, length = suffixes.length; i < length; i++) {
        var suffix = $$($nesting, 'Opal').$coerce_to(suffixes[i], $$($nesting, 'String'), "to_str").$to_s();

        if (self.length >= suffix.length &&
            self.substr(self.length - suffix.length, suffix.length) == suffix) {
          return true;
        }
      }
    ;
      return false;
    }, $String_end_with$ques$32.$$arity = -1);
    Opal.alias(self, "equal?", "===");
    
    Opal.def(self, '$gsub', $String_gsub$33 = function $$gsub(pattern, replacement) {
      var $iter = $String_gsub$33.$$p, block = $iter || nil, self = this;

      if ($iter) $String_gsub$33.$$p = null;
      
      
      if ($iter) $String_gsub$33.$$p = null;;
      ;
      
      if (replacement === undefined && block === nil) {
        return self.$enum_for("gsub", pattern);
      }

      var result = '', match_data = nil, index = 0, match, _replacement;

      if (pattern.$$is_regexp) {
        pattern = Opal.global_multiline_regexp(pattern);
      } else {
        pattern = $$($nesting, 'Opal').$coerce_to(pattern, $$($nesting, 'String'), "to_str");
        pattern = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gm');
      }

      var lastIndex;
      while (true) {
        match = pattern.exec(self);

        if (match === null) {
          ($gvars["~"] = nil)
          result += self.slice(index);
          break;
        }

        match_data = $$($nesting, 'MatchData').$new(pattern, match);

        if (replacement === undefined) {
          lastIndex = pattern.lastIndex;
          _replacement = block(match[0]);
          pattern.lastIndex = lastIndex; // save and restore lastIndex
        }
        else if (replacement.$$is_hash) {
          _replacement = (replacement)['$[]'](match[0]).$to_s();
        }
        else {
          if (!replacement.$$is_string) {
            replacement = $$($nesting, 'Opal').$coerce_to(replacement, $$($nesting, 'String'), "to_str");
          }
          _replacement = replacement.replace(/([\\]+)([0-9+&`'])/g, function (original, slashes, command) {
            if (slashes.length % 2 === 0) {
              return original;
            }
            switch (command) {
            case "+":
              for (var i = match.length - 1; i > 0; i--) {
                if (match[i] !== undefined) {
                  return slashes.slice(1) + match[i];
                }
              }
              return '';
            case "&": return slashes.slice(1) + match[0];
            case "`": return slashes.slice(1) + self.slice(0, match.index);
            case "'": return slashes.slice(1) + self.slice(match.index + match[0].length);
            default:  return slashes.slice(1) + (match[command] || '');
            }
          }).replace(/\\\\/g, '\\');
        }

        if (pattern.lastIndex === match.index) {
          result += (_replacement + self.slice(index, match.index + 1))
          pattern.lastIndex += 1;
        }
        else {
          result += (self.slice(index, match.index) + _replacement)
        }
        index = pattern.lastIndex;
      }

      ($gvars["~"] = match_data)
      return self.$$cast(result);
    ;
    }, $String_gsub$33.$$arity = -2);
    
    Opal.def(self, '$hash', $String_hash$34 = function $$hash() {
      var self = this;

      return self.toString();
    }, $String_hash$34.$$arity = 0);
    
    Opal.def(self, '$hex', $String_hex$35 = function $$hex() {
      var self = this;

      return self.$to_i(16)
    }, $String_hex$35.$$arity = 0);
    
    Opal.def(self, '$include?', $String_include$ques$36 = function(other) {
      var self = this;

      
      if (!other.$$is_string) {
        (other = $$($nesting, 'Opal').$coerce_to(other, $$($nesting, 'String'), "to_str"))
      }
      return self.indexOf(other) !== -1;
    
    }, $String_include$ques$36.$$arity = 1);
    
    Opal.def(self, '$index', $String_index$37 = function $$index(search, offset) {
      var self = this;

      
      ;
      
      var index,
          match,
          regex;

      if (offset === undefined) {
        offset = 0;
      } else {
        offset = $$($nesting, 'Opal').$coerce_to(offset, $$($nesting, 'Integer'), "to_int");
        if (offset < 0) {
          offset += self.length;
          if (offset < 0) {
            return nil;
          }
        }
      }

      if (search.$$is_regexp) {
        regex = Opal.global_multiline_regexp(search);
        while (true) {
          match = regex.exec(self);
          if (match === null) {
            ($gvars["~"] = nil);
            index = -1;
            break;
          }
          if (match.index >= offset) {
            ($gvars["~"] = $$($nesting, 'MatchData').$new(regex, match))
            index = match.index;
            break;
          }
          regex.lastIndex = match.index + 1;
        }
      } else {
        search = $$($nesting, 'Opal').$coerce_to(search, $$($nesting, 'String'), "to_str");
        if (search.length === 0 && offset > self.length) {
          index = -1;
        } else {
          index = self.indexOf(search, offset);
        }
      }

      return index === -1 ? nil : index;
    ;
    }, $String_index$37.$$arity = -2);
    
    Opal.def(self, '$inspect', $String_inspect$38 = function $$inspect() {
      var self = this;

      
      var escapable = /[\\\"\x00-\x1f\u007F-\u009F\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
          meta = {
            '\u0007': '\\a',
            '\u001b': '\\e',
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '\v': '\\v',
            '"' : '\\"',
            '\\': '\\\\'
          },
          escaped = self.replace(escapable, function (chr) {
            return meta[chr] || '\\u' + ('0000' + chr.charCodeAt(0).toString(16).toUpperCase()).slice(-4);
          });
      return '"' + escaped.replace(/\#[\$\@\{]/g, '\\$&') + '"';
    
    }, $String_inspect$38.$$arity = 0);
    
    Opal.def(self, '$intern', $String_intern$39 = function $$intern() {
      var self = this;

      return self.toString();
    }, $String_intern$39.$$arity = 0);
    
    Opal.def(self, '$lines', $String_lines$40 = function $$lines(separator) {
      var $iter = $String_lines$40.$$p, block = $iter || nil, self = this, e = nil;
      if ($gvars["/"] == null) $gvars["/"] = nil;

      if ($iter) $String_lines$40.$$p = null;
      
      
      if ($iter) $String_lines$40.$$p = null;;
      
      if (separator == null) {
        separator = $gvars["/"];
      };
      e = $send(self, 'each_line', [separator], block.$to_proc());
      if ($truthy(block)) {
        return self
      } else {
        return e.$to_a()
      };
    }, $String_lines$40.$$arity = -1);
    
    Opal.def(self, '$length', $String_length$41 = function $$length() {
      var self = this;

      return self.length;
    }, $String_length$41.$$arity = 0);
    
    Opal.def(self, '$ljust', $String_ljust$42 = function $$ljust(width, padstr) {
      var self = this;

      
      
      if (padstr == null) {
        padstr = " ";
      };
      width = $$($nesting, 'Opal').$coerce_to(width, $$($nesting, 'Integer'), "to_int");
      padstr = $$($nesting, 'Opal').$coerce_to(padstr, $$($nesting, 'String'), "to_str").$to_s();
      if ($truthy(padstr['$empty?']())) {
        self.$raise($$($nesting, 'ArgumentError'), "zero width padding")};
      if ($truthy(width <= self.length)) {
        return self};
      
      var index  = -1,
          result = "";

      width -= self.length;

      while (++index < width) {
        result += padstr;
      }

      return self.$$cast(self + result.slice(0, width));
    ;
    }, $String_ljust$42.$$arity = -2);
    
    Opal.def(self, '$lstrip', $String_lstrip$43 = function $$lstrip() {
      var self = this;

      return self.replace(/^\s*/, '');
    }, $String_lstrip$43.$$arity = 0);
    
    Opal.def(self, '$ascii_only?', $String_ascii_only$ques$44 = function() {
      var self = this;

      return self.match(/[ -~\n]*/)[0] === self;
    }, $String_ascii_only$ques$44.$$arity = 0);
    
    Opal.def(self, '$match', $String_match$45 = function $$match(pattern, pos) {
      var $iter = $String_match$45.$$p, block = $iter || nil, $a, self = this;

      if ($iter) $String_match$45.$$p = null;
      
      
      if ($iter) $String_match$45.$$p = null;;
      ;
      if ($truthy(($truthy($a = $$($nesting, 'String')['$==='](pattern)) ? $a : pattern['$respond_to?']("to_str")))) {
        pattern = $$($nesting, 'Regexp').$new(pattern.$to_str())};
      if ($truthy($$($nesting, 'Regexp')['$==='](pattern))) {
      } else {
        self.$raise($$($nesting, 'TypeError'), "" + "wrong argument type " + (pattern.$class()) + " (expected Regexp)")
      };
      return $send(pattern, 'match', [self, pos], block.$to_proc());
    }, $String_match$45.$$arity = -2);
    
    Opal.def(self, '$match?', $String_match$ques$46 = function(pattern, pos) {
      var $a, self = this;

      
      ;
      if ($truthy(($truthy($a = $$($nesting, 'String')['$==='](pattern)) ? $a : pattern['$respond_to?']("to_str")))) {
        pattern = $$($nesting, 'Regexp').$new(pattern.$to_str())};
      if ($truthy($$($nesting, 'Regexp')['$==='](pattern))) {
      } else {
        self.$raise($$($nesting, 'TypeError'), "" + "wrong argument type " + (pattern.$class()) + " (expected Regexp)")
      };
      return pattern['$match?'](self, pos);
    }, $String_match$ques$46.$$arity = -2);
    
    Opal.def(self, '$next', $String_next$47 = function $$next() {
      var self = this;

      
      var i = self.length;
      if (i === 0) {
        return self.$$cast('');
      }
      var result = self;
      var first_alphanum_char_index = self.search(/[a-zA-Z0-9]/);
      var carry = false;
      var code;
      while (i--) {
        code = self.charCodeAt(i);
        if ((code >= 48 && code <= 57) ||
          (code >= 65 && code <= 90) ||
          (code >= 97 && code <= 122)) {
          switch (code) {
          case 57:
            carry = true;
            code = 48;
            break;
          case 90:
            carry = true;
            code = 65;
            break;
          case 122:
            carry = true;
            code = 97;
            break;
          default:
            carry = false;
            code += 1;
          }
        } else {
          if (first_alphanum_char_index === -1) {
            if (code === 255) {
              carry = true;
              code = 0;
            } else {
              carry = false;
              code += 1;
            }
          } else {
            carry = true;
          }
        }
        result = result.slice(0, i) + String.fromCharCode(code) + result.slice(i + 1);
        if (carry && (i === 0 || i === first_alphanum_char_index)) {
          switch (code) {
          case 65:
            break;
          case 97:
            break;
          default:
            code += 1;
          }
          if (i === 0) {
            result = String.fromCharCode(code) + result;
          } else {
            result = result.slice(0, i) + String.fromCharCode(code) + result.slice(i);
          }
          carry = false;
        }
        if (!carry) {
          break;
        }
      }
      return self.$$cast(result);
    
    }, $String_next$47.$$arity = 0);
    
    Opal.def(self, '$oct', $String_oct$48 = function $$oct() {
      var self = this;

      
      var result,
          string = self,
          radix = 8;

      if (/^\s*_/.test(string)) {
        return 0;
      }

      string = string.replace(/^(\s*[+-]?)(0[bodx]?)(.+)$/i, function (original, head, flag, tail) {
        switch (tail.charAt(0)) {
        case '+':
        case '-':
          return original;
        case '0':
          if (tail.charAt(1) === 'x' && flag === '0x') {
            return original;
          }
        }
        switch (flag) {
        case '0b':
          radix = 2;
          break;
        case '0':
        case '0o':
          radix = 8;
          break;
        case '0d':
          radix = 10;
          break;
        case '0x':
          radix = 16;
          break;
        }
        return head + tail;
      });

      result = parseInt(string.replace(/_(?!_)/g, ''), radix);
      return isNaN(result) ? 0 : result;
    
    }, $String_oct$48.$$arity = 0);
    
    Opal.def(self, '$ord', $String_ord$49 = function $$ord() {
      var self = this;

      return self.charCodeAt(0);
    }, $String_ord$49.$$arity = 0);
    
    Opal.def(self, '$partition', $String_partition$50 = function $$partition(sep) {
      var self = this;

      
      var i, m;

      if (sep.$$is_regexp) {
        m = sep.exec(self);
        if (m === null) {
          i = -1;
        } else {
          $$($nesting, 'MatchData').$new(sep, m);
          sep = m[0];
          i = m.index;
        }
      } else {
        sep = $$($nesting, 'Opal').$coerce_to(sep, $$($nesting, 'String'), "to_str");
        i = self.indexOf(sep);
      }

      if (i === -1) {
        return [self, '', ''];
      }

      return [
        self.slice(0, i),
        self.slice(i, i + sep.length),
        self.slice(i + sep.length)
      ];
    
    }, $String_partition$50.$$arity = 1);
    
    Opal.def(self, '$reverse', $String_reverse$51 = function $$reverse() {
      var self = this;

      return self.split('').reverse().join('');
    }, $String_reverse$51.$$arity = 0);
    
    Opal.def(self, '$rindex', $String_rindex$52 = function $$rindex(search, offset) {
      var self = this;

      
      ;
      
      var i, m, r, _m;

      if (offset === undefined) {
        offset = self.length;
      } else {
        offset = $$($nesting, 'Opal').$coerce_to(offset, $$($nesting, 'Integer'), "to_int");
        if (offset < 0) {
          offset += self.length;
          if (offset < 0) {
            return nil;
          }
        }
      }

      if (search.$$is_regexp) {
        m = null;
        r = Opal.global_multiline_regexp(search);
        while (true) {
          _m = r.exec(self);
          if (_m === null || _m.index > offset) {
            break;
          }
          m = _m;
          r.lastIndex = m.index + 1;
        }
        if (m === null) {
          ($gvars["~"] = nil)
          i = -1;
        } else {
          $$($nesting, 'MatchData').$new(r, m);
          i = m.index;
        }
      } else {
        search = $$($nesting, 'Opal').$coerce_to(search, $$($nesting, 'String'), "to_str");
        i = self.lastIndexOf(search, offset);
      }

      return i === -1 ? nil : i;
    ;
    }, $String_rindex$52.$$arity = -2);
    
    Opal.def(self, '$rjust', $String_rjust$53 = function $$rjust(width, padstr) {
      var self = this;

      
      
      if (padstr == null) {
        padstr = " ";
      };
      width = $$($nesting, 'Opal').$coerce_to(width, $$($nesting, 'Integer'), "to_int");
      padstr = $$($nesting, 'Opal').$coerce_to(padstr, $$($nesting, 'String'), "to_str").$to_s();
      if ($truthy(padstr['$empty?']())) {
        self.$raise($$($nesting, 'ArgumentError'), "zero width padding")};
      if ($truthy(width <= self.length)) {
        return self};
      
      var chars     = Math.floor(width - self.length),
          patterns  = Math.floor(chars / padstr.length),
          result    = Array(patterns + 1).join(padstr),
          remaining = chars - result.length;

      return self.$$cast(result + padstr.slice(0, remaining) + self);
    ;
    }, $String_rjust$53.$$arity = -2);
    
    Opal.def(self, '$rpartition', $String_rpartition$54 = function $$rpartition(sep) {
      var self = this;

      
      var i, m, r, _m;

      if (sep.$$is_regexp) {
        m = null;
        r = Opal.global_multiline_regexp(sep);

        while (true) {
          _m = r.exec(self);
          if (_m === null) {
            break;
          }
          m = _m;
          r.lastIndex = m.index + 1;
        }

        if (m === null) {
          i = -1;
        } else {
          $$($nesting, 'MatchData').$new(r, m);
          sep = m[0];
          i = m.index;
        }

      } else {
        sep = $$($nesting, 'Opal').$coerce_to(sep, $$($nesting, 'String'), "to_str");
        i = self.lastIndexOf(sep);
      }

      if (i === -1) {
        return ['', '', self];
      }

      return [
        self.slice(0, i),
        self.slice(i, i + sep.length),
        self.slice(i + sep.length)
      ];
    
    }, $String_rpartition$54.$$arity = 1);
    
    Opal.def(self, '$rstrip', $String_rstrip$55 = function $$rstrip() {
      var self = this;

      return self.replace(/[\s\u0000]*$/, '');
    }, $String_rstrip$55.$$arity = 0);
    
    Opal.def(self, '$scan', $String_scan$56 = function $$scan(pattern) {
      var $iter = $String_scan$56.$$p, block = $iter || nil, self = this;

      if ($iter) $String_scan$56.$$p = null;
      
      
      if ($iter) $String_scan$56.$$p = null;;
      
      var result = [],
          match_data = nil,
          match;

      if (pattern.$$is_regexp) {
        pattern = Opal.global_multiline_regexp(pattern);
      } else {
        pattern = $$($nesting, 'Opal').$coerce_to(pattern, $$($nesting, 'String'), "to_str");
        pattern = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gm');
      }

      while ((match = pattern.exec(self)) != null) {
        match_data = $$($nesting, 'MatchData').$new(pattern, match);
        if (block === nil) {
          match.length == 1 ? result.push(match[0]) : result.push((match_data).$captures());
        } else {
          match.length == 1 ? block(match[0]) : block.call(self, (match_data).$captures());
        }
        if (pattern.lastIndex === match.index) {
          pattern.lastIndex += 1;
        }
      }

      ($gvars["~"] = match_data)

      return (block !== nil ? self : result);
    ;
    }, $String_scan$56.$$arity = 1);
    Opal.alias(self, "size", "length");
    Opal.alias(self, "slice", "[]");
    
    Opal.def(self, '$split', $String_split$57 = function $$split(pattern, limit) {
      var $a, self = this;
      if ($gvars[";"] == null) $gvars[";"] = nil;

      
      ;
      ;
      
      if (self.length === 0) {
        return [];
      }

      if (limit === undefined) {
        limit = 0;
      } else {
        limit = $$($nesting, 'Opal')['$coerce_to!'](limit, $$($nesting, 'Integer'), "to_int");
        if (limit === 1) {
          return [self];
        }
      }

      if (pattern === undefined || pattern === nil) {
        pattern = ($truthy($a = $gvars[";"]) ? $a : " ");
      }

      var result = [],
          string = self.toString(),
          index = 0,
          match,
          i, ii;

      if (pattern.$$is_regexp) {
        pattern = Opal.global_multiline_regexp(pattern);
      } else {
        pattern = $$($nesting, 'Opal').$coerce_to(pattern, $$($nesting, 'String'), "to_str").$to_s();
        if (pattern === ' ') {
          pattern = /\s+/gm;
          string = string.replace(/^\s+/, '');
        } else {
          pattern = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gm');
        }
      }

      result = string.split(pattern);

      if (result.length === 1 && result[0] === string) {
        return [self.$$cast(result[0])];
      }

      while ((i = result.indexOf(undefined)) !== -1) {
        result.splice(i, 1);
      }

      function castResult() {
        for (i = 0; i < result.length; i++) {
          result[i] = self.$$cast(result[i]);
        }
      }

      if (limit === 0) {
        while (result[result.length - 1] === '') {
          result.length -= 1;
        }
        castResult();
        return result;
      }

      match = pattern.exec(string);

      if (limit < 0) {
        if (match !== null && match[0] === '' && pattern.source.indexOf('(?=') === -1) {
          for (i = 0, ii = match.length; i < ii; i++) {
            result.push('');
          }
        }
        castResult();
        return result;
      }

      if (match !== null && match[0] === '') {
        result.splice(limit - 1, result.length - 1, result.slice(limit - 1).join(''));
        castResult();
        return result;
      }

      if (limit >= result.length) {
        castResult();
        return result;
      }

      i = 0;
      while (match !== null) {
        i++;
        index = pattern.lastIndex;
        if (i + 1 === limit) {
          break;
        }
        match = pattern.exec(string);
      }
      result.splice(limit - 1, result.length - 1, string.slice(index));
      castResult();
      return result;
    ;
    }, $String_split$57.$$arity = -1);
    
    Opal.def(self, '$squeeze', $String_squeeze$58 = function $$squeeze($a) {
      var $post_args, sets, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      sets = $post_args;;
      
      if (sets.length === 0) {
        return self.$$cast(self.replace(/(.)\1+/g, '$1'));
      }
      var char_class = char_class_from_char_sets(sets);
      if (char_class === null) {
        return self;
      }
      return self.$$cast(self.replace(new RegExp('(' + char_class + ')\\1+', 'g'), '$1'));
    ;
    }, $String_squeeze$58.$$arity = -1);
    
    Opal.def(self, '$start_with?', $String_start_with$ques$59 = function($a) {
      var $post_args, prefixes, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      prefixes = $post_args;;
      
      for (var i = 0, length = prefixes.length; i < length; i++) {
        var prefix = $$($nesting, 'Opal').$coerce_to(prefixes[i], $$($nesting, 'String'), "to_str").$to_s();

        if (self.indexOf(prefix) === 0) {
          return true;
        }
      }

      return false;
    ;
    }, $String_start_with$ques$59.$$arity = -1);
    
    Opal.def(self, '$strip', $String_strip$60 = function $$strip() {
      var self = this;

      return self.replace(/^\s*/, '').replace(/[\s\u0000]*$/, '');
    }, $String_strip$60.$$arity = 0);
    
    Opal.def(self, '$sub', $String_sub$61 = function $$sub(pattern, replacement) {
      var $iter = $String_sub$61.$$p, block = $iter || nil, self = this;

      if ($iter) $String_sub$61.$$p = null;
      
      
      if ($iter) $String_sub$61.$$p = null;;
      ;
      
      if (!pattern.$$is_regexp) {
        pattern = $$($nesting, 'Opal').$coerce_to(pattern, $$($nesting, 'String'), "to_str");
        pattern = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      }

      var result, match = pattern.exec(self);

      if (match === null) {
        ($gvars["~"] = nil)
        result = self.toString();
      } else {
        $$($nesting, 'MatchData').$new(pattern, match)

        if (replacement === undefined) {

          if (block === nil) {
            self.$raise($$($nesting, 'ArgumentError'), "wrong number of arguments (1 for 2)")
          }
          result = self.slice(0, match.index) + block(match[0]) + self.slice(match.index + match[0].length);

        } else if (replacement.$$is_hash) {

          result = self.slice(0, match.index) + (replacement)['$[]'](match[0]).$to_s() + self.slice(match.index + match[0].length);

        } else {

          replacement = $$($nesting, 'Opal').$coerce_to(replacement, $$($nesting, 'String'), "to_str");

          replacement = replacement.replace(/([\\]+)([0-9+&`'])/g, function (original, slashes, command) {
            if (slashes.length % 2 === 0) {
              return original;
            }
            switch (command) {
            case "+":
              for (var i = match.length - 1; i > 0; i--) {
                if (match[i] !== undefined) {
                  return slashes.slice(1) + match[i];
                }
              }
              return '';
            case "&": return slashes.slice(1) + match[0];
            case "`": return slashes.slice(1) + self.slice(0, match.index);
            case "'": return slashes.slice(1) + self.slice(match.index + match[0].length);
            default:  return slashes.slice(1) + (match[command] || '');
            }
          }).replace(/\\\\/g, '\\');

          result = self.slice(0, match.index) + replacement + self.slice(match.index + match[0].length);
        }
      }

      return self.$$cast(result);
    ;
    }, $String_sub$61.$$arity = -2);
    Opal.alias(self, "succ", "next");
    
    Opal.def(self, '$sum', $String_sum$62 = function $$sum(n) {
      var self = this;

      
      
      if (n == null) {
        n = 16;
      };
      
      n = $$($nesting, 'Opal').$coerce_to(n, $$($nesting, 'Integer'), "to_int");

      var result = 0,
          length = self.length,
          i = 0;

      for (; i < length; i++) {
        result += self.charCodeAt(i);
      }

      if (n <= 0) {
        return result;
      }

      return result & (Math.pow(2, n) - 1);
    ;
    }, $String_sum$62.$$arity = -1);
    
    Opal.def(self, '$swapcase', $String_swapcase$63 = function $$swapcase() {
      var self = this;

      
      var str = self.replace(/([a-z]+)|([A-Z]+)/g, function($0,$1,$2) {
        return $1 ? $0.toUpperCase() : $0.toLowerCase();
      });

      if (self.constructor === String) {
        return str;
      }

      return self.$class().$new(str);
    
    }, $String_swapcase$63.$$arity = 0);
    
    Opal.def(self, '$to_f', $String_to_f$64 = function $$to_f() {
      var self = this;

      
      if (self.charAt(0) === '_') {
        return 0;
      }

      var result = parseFloat(self.replace(/_/g, ''));

      if (isNaN(result) || result == Infinity || result == -Infinity) {
        return 0;
      }
      else {
        return result;
      }
    
    }, $String_to_f$64.$$arity = 0);
    
    Opal.def(self, '$to_i', $String_to_i$65 = function $$to_i(base) {
      var self = this;

      
      
      if (base == null) {
        base = 10;
      };
      
      var result,
          string = self.toLowerCase(),
          radix = $$($nesting, 'Opal').$coerce_to(base, $$($nesting, 'Integer'), "to_int");

      if (radix === 1 || radix < 0 || radix > 36) {
        self.$raise($$($nesting, 'ArgumentError'), "" + "invalid radix " + (radix))
      }

      if (/^\s*_/.test(string)) {
        return 0;
      }

      string = string.replace(/^(\s*[+-]?)(0[bodx]?)(.+)$/, function (original, head, flag, tail) {
        switch (tail.charAt(0)) {
        case '+':
        case '-':
          return original;
        case '0':
          if (tail.charAt(1) === 'x' && flag === '0x' && (radix === 0 || radix === 16)) {
            return original;
          }
        }
        switch (flag) {
        case '0b':
          if (radix === 0 || radix === 2) {
            radix = 2;
            return head + tail;
          }
          break;
        case '0':
        case '0o':
          if (radix === 0 || radix === 8) {
            radix = 8;
            return head + tail;
          }
          break;
        case '0d':
          if (radix === 0 || radix === 10) {
            radix = 10;
            return head + tail;
          }
          break;
        case '0x':
          if (radix === 0 || radix === 16) {
            radix = 16;
            return head + tail;
          }
          break;
        }
        return original
      });

      result = parseInt(string.replace(/_(?!_)/g, ''), radix);
      return isNaN(result) ? 0 : result;
    ;
    }, $String_to_i$65.$$arity = -1);
    
    Opal.def(self, '$to_proc', $String_to_proc$66 = function $$to_proc() {
      var $$67, $iter = $String_to_proc$66.$$p, $yield = $iter || nil, self = this, method_name = nil;

      if ($iter) $String_to_proc$66.$$p = null;
      
      method_name = $rb_plus("$", self.valueOf());
      return $send(self, 'proc', [], ($$67 = function($a){var self = $$67.$$s || this, $iter = $$67.$$p, block = $iter || nil, $post_args, args;

      
        
        if ($iter) $$67.$$p = null;;
        
        $post_args = Opal.slice.call(arguments, 0, arguments.length);
        
        args = $post_args;;
        
        if (args.length === 0) {
          self.$raise($$($nesting, 'ArgumentError'), "no receiver given")
        }

        var recv = args[0];

        if (recv == null) recv = nil;

        var body = recv[method_name];

        if (!body) {
          return recv.$method_missing.apply(recv, args);
        }

        if (typeof block === 'function') {
          body.$$p = block;
        }

        if (args.length === 1) {
          return body.call(recv);
        } else {
          return body.apply(recv, args.slice(1));
        }
      ;}, $$67.$$s = self, $$67.$$arity = -1, $$67));
    }, $String_to_proc$66.$$arity = 0);
    
    Opal.def(self, '$to_s', $String_to_s$68 = function $$to_s() {
      var self = this;

      return self.toString();
    }, $String_to_s$68.$$arity = 0);
    Opal.alias(self, "to_str", "to_s");
    Opal.alias(self, "to_sym", "intern");
    
    Opal.def(self, '$tr', $String_tr$69 = function $$tr(from, to) {
      var self = this;

      
      from = $$($nesting, 'Opal').$coerce_to(from, $$($nesting, 'String'), "to_str").$to_s();
      to = $$($nesting, 'Opal').$coerce_to(to, $$($nesting, 'String'), "to_str").$to_s();
      
      if (from.length == 0 || from === to) {
        return self;
      }

      var i, in_range, c, ch, start, end, length;
      var subs = {};
      var from_chars = from.split('');
      var from_length = from_chars.length;
      var to_chars = to.split('');
      var to_length = to_chars.length;

      var inverse = false;
      var global_sub = null;
      if (from_chars[0] === '^' && from_chars.length > 1) {
        inverse = true;
        from_chars.shift();
        global_sub = to_chars[to_length - 1]
        from_length -= 1;
      }

      var from_chars_expanded = [];
      var last_from = null;
      in_range = false;
      for (i = 0; i < from_length; i++) {
        ch = from_chars[i];
        if (last_from == null) {
          last_from = ch;
          from_chars_expanded.push(ch);
        }
        else if (ch === '-') {
          if (last_from === '-') {
            from_chars_expanded.push('-');
            from_chars_expanded.push('-');
          }
          else if (i == from_length - 1) {
            from_chars_expanded.push('-');
          }
          else {
            in_range = true;
          }
        }
        else if (in_range) {
          start = last_from.charCodeAt(0);
          end = ch.charCodeAt(0);
          if (start > end) {
            self.$raise($$($nesting, 'ArgumentError'), "" + "invalid range \"" + (String.fromCharCode(start)) + "-" + (String.fromCharCode(end)) + "\" in string transliteration")
          }
          for (c = start + 1; c < end; c++) {
            from_chars_expanded.push(String.fromCharCode(c));
          }
          from_chars_expanded.push(ch);
          in_range = null;
          last_from = null;
        }
        else {
          from_chars_expanded.push(ch);
        }
      }

      from_chars = from_chars_expanded;
      from_length = from_chars.length;

      if (inverse) {
        for (i = 0; i < from_length; i++) {
          subs[from_chars[i]] = true;
        }
      }
      else {
        if (to_length > 0) {
          var to_chars_expanded = [];
          var last_to = null;
          in_range = false;
          for (i = 0; i < to_length; i++) {
            ch = to_chars[i];
            if (last_to == null) {
              last_to = ch;
              to_chars_expanded.push(ch);
            }
            else if (ch === '-') {
              if (last_to === '-') {
                to_chars_expanded.push('-');
                to_chars_expanded.push('-');
              }
              else if (i == to_length - 1) {
                to_chars_expanded.push('-');
              }
              else {
                in_range = true;
              }
            }
            else if (in_range) {
              start = last_to.charCodeAt(0);
              end = ch.charCodeAt(0);
              if (start > end) {
                self.$raise($$($nesting, 'ArgumentError'), "" + "invalid range \"" + (String.fromCharCode(start)) + "-" + (String.fromCharCode(end)) + "\" in string transliteration")
              }
              for (c = start + 1; c < end; c++) {
                to_chars_expanded.push(String.fromCharCode(c));
              }
              to_chars_expanded.push(ch);
              in_range = null;
              last_to = null;
            }
            else {
              to_chars_expanded.push(ch);
            }
          }

          to_chars = to_chars_expanded;
          to_length = to_chars.length;
        }

        var length_diff = from_length - to_length;
        if (length_diff > 0) {
          var pad_char = (to_length > 0 ? to_chars[to_length - 1] : '');
          for (i = 0; i < length_diff; i++) {
            to_chars.push(pad_char);
          }
        }

        for (i = 0; i < from_length; i++) {
          subs[from_chars[i]] = to_chars[i];
        }
      }

      var new_str = ''
      for (i = 0, length = self.length; i < length; i++) {
        ch = self.charAt(i);
        var sub = subs[ch];
        if (inverse) {
          new_str += (sub == null ? global_sub : ch);
        }
        else {
          new_str += (sub != null ? sub : ch);
        }
      }
      return self.$$cast(new_str);
    ;
    }, $String_tr$69.$$arity = 2);
    
    Opal.def(self, '$tr_s', $String_tr_s$70 = function $$tr_s(from, to) {
      var self = this;

      
      from = $$($nesting, 'Opal').$coerce_to(from, $$($nesting, 'String'), "to_str").$to_s();
      to = $$($nesting, 'Opal').$coerce_to(to, $$($nesting, 'String'), "to_str").$to_s();
      
      if (from.length == 0) {
        return self;
      }

      var i, in_range, c, ch, start, end, length;
      var subs = {};
      var from_chars = from.split('');
      var from_length = from_chars.length;
      var to_chars = to.split('');
      var to_length = to_chars.length;

      var inverse = false;
      var global_sub = null;
      if (from_chars[0] === '^' && from_chars.length > 1) {
        inverse = true;
        from_chars.shift();
        global_sub = to_chars[to_length - 1]
        from_length -= 1;
      }

      var from_chars_expanded = [];
      var last_from = null;
      in_range = false;
      for (i = 0; i < from_length; i++) {
        ch = from_chars[i];
        if (last_from == null) {
          last_from = ch;
          from_chars_expanded.push(ch);
        }
        else if (ch === '-') {
          if (last_from === '-') {
            from_chars_expanded.push('-');
            from_chars_expanded.push('-');
          }
          else if (i == from_length - 1) {
            from_chars_expanded.push('-');
          }
          else {
            in_range = true;
          }
        }
        else if (in_range) {
          start = last_from.charCodeAt(0);
          end = ch.charCodeAt(0);
          if (start > end) {
            self.$raise($$($nesting, 'ArgumentError'), "" + "invalid range \"" + (String.fromCharCode(start)) + "-" + (String.fromCharCode(end)) + "\" in string transliteration")
          }
          for (c = start + 1; c < end; c++) {
            from_chars_expanded.push(String.fromCharCode(c));
          }
          from_chars_expanded.push(ch);
          in_range = null;
          last_from = null;
        }
        else {
          from_chars_expanded.push(ch);
        }
      }

      from_chars = from_chars_expanded;
      from_length = from_chars.length;

      if (inverse) {
        for (i = 0; i < from_length; i++) {
          subs[from_chars[i]] = true;
        }
      }
      else {
        if (to_length > 0) {
          var to_chars_expanded = [];
          var last_to = null;
          in_range = false;
          for (i = 0; i < to_length; i++) {
            ch = to_chars[i];
            if (last_from == null) {
              last_from = ch;
              to_chars_expanded.push(ch);
            }
            else if (ch === '-') {
              if (last_to === '-') {
                to_chars_expanded.push('-');
                to_chars_expanded.push('-');
              }
              else if (i == to_length - 1) {
                to_chars_expanded.push('-');
              }
              else {
                in_range = true;
              }
            }
            else if (in_range) {
              start = last_from.charCodeAt(0);
              end = ch.charCodeAt(0);
              if (start > end) {
                self.$raise($$($nesting, 'ArgumentError'), "" + "invalid range \"" + (String.fromCharCode(start)) + "-" + (String.fromCharCode(end)) + "\" in string transliteration")
              }
              for (c = start + 1; c < end; c++) {
                to_chars_expanded.push(String.fromCharCode(c));
              }
              to_chars_expanded.push(ch);
              in_range = null;
              last_from = null;
            }
            else {
              to_chars_expanded.push(ch);
            }
          }

          to_chars = to_chars_expanded;
          to_length = to_chars.length;
        }

        var length_diff = from_length - to_length;
        if (length_diff > 0) {
          var pad_char = (to_length > 0 ? to_chars[to_length - 1] : '');
          for (i = 0; i < length_diff; i++) {
            to_chars.push(pad_char);
          }
        }

        for (i = 0; i < from_length; i++) {
          subs[from_chars[i]] = to_chars[i];
        }
      }
      var new_str = ''
      var last_substitute = null
      for (i = 0, length = self.length; i < length; i++) {
        ch = self.charAt(i);
        var sub = subs[ch]
        if (inverse) {
          if (sub == null) {
            if (last_substitute == null) {
              new_str += global_sub;
              last_substitute = true;
            }
          }
          else {
            new_str += ch;
            last_substitute = null;
          }
        }
        else {
          if (sub != null) {
            if (last_substitute == null || last_substitute !== sub) {
              new_str += sub;
              last_substitute = sub;
            }
          }
          else {
            new_str += ch;
            last_substitute = null;
          }
        }
      }
      return self.$$cast(new_str);
    ;
    }, $String_tr_s$70.$$arity = 2);
    
    Opal.def(self, '$upcase', $String_upcase$71 = function $$upcase() {
      var self = this;

      return self.$$cast(self.toUpperCase());
    }, $String_upcase$71.$$arity = 0);
    
    Opal.def(self, '$upto', $String_upto$72 = function $$upto(stop, excl) {
      var $iter = $String_upto$72.$$p, block = $iter || nil, self = this;

      if ($iter) $String_upto$72.$$p = null;
      
      
      if ($iter) $String_upto$72.$$p = null;;
      
      if (excl == null) {
        excl = false;
      };
      if ((block !== nil)) {
      } else {
        return self.$enum_for("upto", stop, excl)
      };
      stop = $$($nesting, 'Opal').$coerce_to(stop, $$($nesting, 'String'), "to_str");
      
      var a, b, s = self.toString();

      if (s.length === 1 && stop.length === 1) {

        a = s.charCodeAt(0);
        b = stop.charCodeAt(0);

        while (a <= b) {
          if (excl && a === b) {
            break;
          }

          block(String.fromCharCode(a));

          a += 1;
        }

      } else if (parseInt(s, 10).toString() === s && parseInt(stop, 10).toString() === stop) {

        a = parseInt(s, 10);
        b = parseInt(stop, 10);

        while (a <= b) {
          if (excl && a === b) {
            break;
          }

          block(a.toString());

          a += 1;
        }

      } else {

        while (s.length <= stop.length && s <= stop) {
          if (excl && s === stop) {
            break;
          }

          block(s);

          s = (s).$succ();
        }

      }
      return self;
    ;
    }, $String_upto$72.$$arity = -2);
    
    function char_class_from_char_sets(sets) {
      function explode_sequences_in_character_set(set) {
        var result = '',
            i, len = set.length,
            curr_char,
            skip_next_dash,
            char_code_from,
            char_code_upto,
            char_code;
        for (i = 0; i < len; i++) {
          curr_char = set.charAt(i);
          if (curr_char === '-' && i > 0 && i < (len - 1) && !skip_next_dash) {
            char_code_from = set.charCodeAt(i - 1);
            char_code_upto = set.charCodeAt(i + 1);
            if (char_code_from > char_code_upto) {
              self.$raise($$($nesting, 'ArgumentError'), "" + "invalid range \"" + (char_code_from) + "-" + (char_code_upto) + "\" in string transliteration")
            }
            for (char_code = char_code_from + 1; char_code < char_code_upto + 1; char_code++) {
              result += String.fromCharCode(char_code);
            }
            skip_next_dash = true;
            i++;
          } else {
            skip_next_dash = (curr_char === '\\');
            result += curr_char;
          }
        }
        return result;
      }

      function intersection(setA, setB) {
        if (setA.length === 0) {
          return setB;
        }
        var result = '',
            i, len = setA.length,
            chr;
        for (i = 0; i < len; i++) {
          chr = setA.charAt(i);
          if (setB.indexOf(chr) !== -1) {
            result += chr;
          }
        }
        return result;
      }

      var i, len, set, neg, chr, tmp,
          pos_intersection = '',
          neg_intersection = '';

      for (i = 0, len = sets.length; i < len; i++) {
        set = $$($nesting, 'Opal').$coerce_to(sets[i], $$($nesting, 'String'), "to_str");
        neg = (set.charAt(0) === '^' && set.length > 1);
        set = explode_sequences_in_character_set(neg ? set.slice(1) : set);
        if (neg) {
          neg_intersection = intersection(neg_intersection, set);
        } else {
          pos_intersection = intersection(pos_intersection, set);
        }
      }

      if (pos_intersection.length > 0 && neg_intersection.length > 0) {
        tmp = '';
        for (i = 0, len = pos_intersection.length; i < len; i++) {
          chr = pos_intersection.charAt(i);
          if (neg_intersection.indexOf(chr) === -1) {
            tmp += chr;
          }
        }
        pos_intersection = tmp;
        neg_intersection = '';
      }

      if (pos_intersection.length > 0) {
        return '[' + $$($nesting, 'Regexp').$escape(pos_intersection) + ']';
      }

      if (neg_intersection.length > 0) {
        return '[^' + $$($nesting, 'Regexp').$escape(neg_intersection) + ']';
      }

      return null;
    }
  ;
    
    Opal.def(self, '$instance_variables', $String_instance_variables$73 = function $$instance_variables() {
      var self = this;

      return []
    }, $String_instance_variables$73.$$arity = 0);
    Opal.defs(self, '$_load', $String__load$74 = function $$_load($a) {
      var $post_args, args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      return $send(self, 'new', Opal.to_a(args));
    }, $String__load$74.$$arity = -1);
    
    Opal.def(self, '$unicode_normalize', $String_unicode_normalize$75 = function $$unicode_normalize(form) {
      var self = this;

      
      ;
      return self.toString();;
    }, $String_unicode_normalize$75.$$arity = -1);
    
    Opal.def(self, '$unicode_normalized?', $String_unicode_normalized$ques$76 = function(form) {
      var self = this;

      
      ;
      return true;
    }, $String_unicode_normalized$ques$76.$$arity = -1);
    
    Opal.def(self, '$unpack', $String_unpack$77 = function $$unpack(format) {
      var self = this;

      return self.$raise("To use String#unpack, you must first require 'corelib/string/unpack'.")
    }, $String_unpack$77.$$arity = 1);
    return (Opal.def(self, '$unpack1', $String_unpack1$78 = function $$unpack1(format) {
      var self = this;

      return self.$raise("To use String#unpack1, you must first require 'corelib/string/unpack'.")
    }, $String_unpack1$78.$$arity = 1), nil) && 'unpack1';
  })($nesting[0], String, $nesting);
  return Opal.const_set($nesting[0], 'Symbol', $$($nesting, 'String'));
};

/* Generated by Opal 0.11.99.dev */
Opal.modules["corelib/enumerable"] = function(Opal) {
  function $rb_gt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs > rhs : lhs['$>'](rhs);
  }
  function $rb_times(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs * rhs : lhs['$*'](rhs);
  }
  function $rb_lt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs < rhs : lhs['$<'](rhs);
  }
  function $rb_plus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs + rhs : lhs['$+'](rhs);
  }
  function $rb_minus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs - rhs : lhs['$-'](rhs);
  }
  function $rb_divide(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs / rhs : lhs['$/'](rhs);
  }
  function $rb_le(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs <= rhs : lhs['$<='](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice, $module = Opal.module, $truthy = Opal.truthy, $send = Opal.send, $falsy = Opal.falsy, $hash2 = Opal.hash2, $lambda = Opal.lambda;

  Opal.add_stubs(['$each', '$public_send', '$destructure', '$to_enum', '$enumerator_size', '$new', '$yield', '$raise', '$slice_when', '$!', '$enum_for', '$flatten', '$map', '$warn', '$proc', '$==', '$nil?', '$respond_to?', '$coerce_to!', '$>', '$*', '$coerce_to', '$try_convert', '$<', '$+', '$-', '$ceil', '$/', '$size', '$__send__', '$length', '$<=', '$[]', '$push', '$<<', '$[]=', '$===', '$inspect', '$<=>', '$first', '$reverse', '$sort', '$to_proc', '$compare', '$call', '$dup', '$to_a', '$sort!', '$map!', '$key?', '$values', '$zip']);
  return (function($base, $parent_nesting) {
    var self = $module($base, 'Enumerable');

    var $nesting = [self].concat($parent_nesting), $Enumerable_all$ques$1, $Enumerable_any$ques$5, $Enumerable_chunk$9, $Enumerable_chunk_while$12, $Enumerable_collect$14, $Enumerable_collect_concat$16, $Enumerable_count$19, $Enumerable_cycle$23, $Enumerable_detect$25, $Enumerable_drop$27, $Enumerable_drop_while$28, $Enumerable_each_cons$29, $Enumerable_each_entry$31, $Enumerable_each_slice$33, $Enumerable_each_with_index$35, $Enumerable_each_with_object$37, $Enumerable_entries$39, $Enumerable_find_all$40, $Enumerable_find_index$42, $Enumerable_first$45, $Enumerable_grep$48, $Enumerable_grep_v$50, $Enumerable_group_by$52, $Enumerable_include$ques$54, $Enumerable_inject$56, $Enumerable_lazy$57, $Enumerable_enumerator_size$59, $Enumerable_max$60, $Enumerable_max_by$61, $Enumerable_min$63, $Enumerable_min_by$64, $Enumerable_minmax$66, $Enumerable_minmax_by$68, $Enumerable_none$ques$69, $Enumerable_one$ques$73, $Enumerable_partition$77, $Enumerable_reject$79, $Enumerable_reverse_each$81, $Enumerable_slice_before$83, $Enumerable_slice_after$85, $Enumerable_slice_when$88, $Enumerable_sort$90, $Enumerable_sort_by$92, $Enumerable_sum$97, $Enumerable_take$99, $Enumerable_take_while$100, $Enumerable_uniq$102, $Enumerable_zip$104;

    
    
    function comparableForPattern(value) {
      if (value.length === 0) {
        value = [nil];
      }

      if (value.length > 1) {
        value = [value];
      }

      return value;
    }
  ;
    
    Opal.def(self, '$all?', $Enumerable_all$ques$1 = function(pattern) {try {

      var $iter = $Enumerable_all$ques$1.$$p, block = $iter || nil, $$2, $$3, $$4, self = this;

      if ($iter) $Enumerable_all$ques$1.$$p = null;
      
      
      if ($iter) $Enumerable_all$ques$1.$$p = null;;
      ;
      if ($truthy(pattern !== undefined)) {
        $send(self, 'each', [], ($$2 = function($a){var self = $$2.$$s || this, $post_args, value, comparable = nil;

        
          
          $post_args = Opal.slice.call(arguments, 0, arguments.length);
          
          value = $post_args;;
          comparable = comparableForPattern(value);
          if ($truthy($send(pattern, 'public_send', ["==="].concat(Opal.to_a(comparable))))) {
            return nil
          } else {
            Opal.ret(false)
          };}, $$2.$$s = self, $$2.$$arity = -1, $$2))
      } else if ((block !== nil)) {
        $send(self, 'each', [], ($$3 = function($a){var self = $$3.$$s || this, $post_args, value;

        
          
          $post_args = Opal.slice.call(arguments, 0, arguments.length);
          
          value = $post_args;;
          if ($truthy(Opal.yieldX(block, Opal.to_a(value)))) {
            return nil
          } else {
            Opal.ret(false)
          };}, $$3.$$s = self, $$3.$$arity = -1, $$3))
      } else {
        $send(self, 'each', [], ($$4 = function($a){var self = $$4.$$s || this, $post_args, value;

        
          
          $post_args = Opal.slice.call(arguments, 0, arguments.length);
          
          value = $post_args;;
          if ($truthy($$($nesting, 'Opal').$destructure(value))) {
            return nil
          } else {
            Opal.ret(false)
          };}, $$4.$$s = self, $$4.$$arity = -1, $$4))
      };
      return true;
      } catch ($returner) { if ($returner === Opal.returner) { return $returner.$v } throw $returner; }
    }, $Enumerable_all$ques$1.$$arity = -1);
    
    Opal.def(self, '$any?', $Enumerable_any$ques$5 = function(pattern) {try {

      var $iter = $Enumerable_any$ques$5.$$p, block = $iter || nil, $$6, $$7, $$8, self = this;

      if ($iter) $Enumerable_any$ques$5.$$p = null;
      
      
      if ($iter) $Enumerable_any$ques$5.$$p = null;;
      ;
      if ($truthy(pattern !== undefined)) {
        $send(self, 'each', [], ($$6 = function($a){var self = $$6.$$s || this, $post_args, value, comparable = nil;

        
          
          $post_args = Opal.slice.call(arguments, 0, arguments.length);
          
          value = $post_args;;
          comparable = comparableForPattern(value);
          if ($truthy($send(pattern, 'public_send', ["==="].concat(Opal.to_a(comparable))))) {
            Opal.ret(true)
          } else {
            return nil
          };}, $$6.$$s = self, $$6.$$arity = -1, $$6))
      } else if ((block !== nil)) {
        $send(self, 'each', [], ($$7 = function($a){var self = $$7.$$s || this, $post_args, value;

        
          
          $post_args = Opal.slice.call(arguments, 0, arguments.length);
          
          value = $post_args;;
          if ($truthy(Opal.yieldX(block, Opal.to_a(value)))) {
            Opal.ret(true)
          } else {
            return nil
          };}, $$7.$$s = self, $$7.$$arity = -1, $$7))
      } else {
        $send(self, 'each', [], ($$8 = function($a){var self = $$8.$$s || this, $post_args, value;

        
          
          $post_args = Opal.slice.call(arguments, 0, arguments.length);
          
          value = $post_args;;
          if ($truthy($$($nesting, 'Opal').$destructure(value))) {
            Opal.ret(true)
          } else {
            return nil
          };}, $$8.$$s = self, $$8.$$arity = -1, $$8))
      };
      return false;
      } catch ($returner) { if ($returner === Opal.returner) { return $returner.$v } throw $returner; }
    }, $Enumerable_any$ques$5.$$arity = -1);
    
    Opal.def(self, '$chunk', $Enumerable_chunk$9 = function $$chunk() {
      var $iter = $Enumerable_chunk$9.$$p, block = $iter || nil, $$10, $$11, self = this;

      if ($iter) $Enumerable_chunk$9.$$p = null;
      
      
      if ($iter) $Enumerable_chunk$9.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'to_enum', ["chunk"], ($$10 = function(){var self = $$10.$$s || this;

        return self.$enumerator_size()}, $$10.$$s = self, $$10.$$arity = 0, $$10))
      };
      return $send($$$('::', 'Enumerator'), 'new', [], ($$11 = function(yielder){var self = $$11.$$s || this;

      
        
        if (yielder == null) {
          yielder = nil;
        };
        
        var previous = nil, accumulate = [];

        function releaseAccumulate() {
          if (accumulate.length > 0) {
            yielder.$yield(previous, accumulate)
          }
        }

        self.$each.$$p = function(value) {
          var key = Opal.yield1(block, value);

          if (key === nil) {
            releaseAccumulate();
            accumulate = [];
            previous = nil;
          } else {
            if (previous === nil || previous === key) {
              accumulate.push(value);
            } else {
              releaseAccumulate();
              accumulate = [value];
            }

            previous = key;
          }
        }

        self.$each();

        releaseAccumulate();
      ;}, $$11.$$s = self, $$11.$$arity = 1, $$11));
    }, $Enumerable_chunk$9.$$arity = 0);
    
    Opal.def(self, '$chunk_while', $Enumerable_chunk_while$12 = function $$chunk_while() {
      var $iter = $Enumerable_chunk_while$12.$$p, block = $iter || nil, $$13, self = this;

      if ($iter) $Enumerable_chunk_while$12.$$p = null;
      
      
      if ($iter) $Enumerable_chunk_while$12.$$p = null;;
      if ((block !== nil)) {
      } else {
        self.$raise($$($nesting, 'ArgumentError'), "no block given")
      };
      return $send(self, 'slice_when', [], ($$13 = function(before, after){var self = $$13.$$s || this;

      
        
        if (before == null) {
          before = nil;
        };
        
        if (after == null) {
          after = nil;
        };
        return Opal.yieldX(block, [before, after])['$!']();}, $$13.$$s = self, $$13.$$arity = 2, $$13));
    }, $Enumerable_chunk_while$12.$$arity = 0);
    
    Opal.def(self, '$collect', $Enumerable_collect$14 = function $$collect() {
      var $iter = $Enumerable_collect$14.$$p, block = $iter || nil, $$15, self = this;

      if ($iter) $Enumerable_collect$14.$$p = null;
      
      
      if ($iter) $Enumerable_collect$14.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["collect"], ($$15 = function(){var self = $$15.$$s || this;

        return self.$enumerator_size()}, $$15.$$s = self, $$15.$$arity = 0, $$15))
      };
      
      var result = [];

      self.$each.$$p = function() {
        var value = Opal.yieldX(block, arguments);

        result.push(value);
      };

      self.$each();

      return result;
    ;
    }, $Enumerable_collect$14.$$arity = 0);
    
    Opal.def(self, '$collect_concat', $Enumerable_collect_concat$16 = function $$collect_concat() {
      var $iter = $Enumerable_collect_concat$16.$$p, block = $iter || nil, $$17, $$18, self = this;

      if ($iter) $Enumerable_collect_concat$16.$$p = null;
      
      
      if ($iter) $Enumerable_collect_concat$16.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["collect_concat"], ($$17 = function(){var self = $$17.$$s || this;

        return self.$enumerator_size()}, $$17.$$s = self, $$17.$$arity = 0, $$17))
      };
      return $send(self, 'map', [], ($$18 = function(item){var self = $$18.$$s || this;

      
        
        if (item == null) {
          item = nil;
        };
        return Opal.yield1(block, item);;}, $$18.$$s = self, $$18.$$arity = 1, $$18)).$flatten(1);
    }, $Enumerable_collect_concat$16.$$arity = 0);
    
    Opal.def(self, '$count', $Enumerable_count$19 = function $$count(object) {
      var $iter = $Enumerable_count$19.$$p, block = $iter || nil, $$20, $$21, $$22, self = this, result = nil;

      if ($iter) $Enumerable_count$19.$$p = null;
      
      
      if ($iter) $Enumerable_count$19.$$p = null;;
      ;
      result = 0;
      
      if (object != null && block !== nil) {
        self.$warn("warning: given block not used")
      }
    ;
      if ($truthy(object != null)) {
        block = $send(self, 'proc', [], ($$20 = function($a){var self = $$20.$$s || this, $post_args, args;

        
          
          $post_args = Opal.slice.call(arguments, 0, arguments.length);
          
          args = $post_args;;
          return $$($nesting, 'Opal').$destructure(args)['$=='](object);}, $$20.$$s = self, $$20.$$arity = -1, $$20))
      } else if ($truthy(block['$nil?']())) {
        block = $send(self, 'proc', [], ($$21 = function(){var self = $$21.$$s || this;

        return true}, $$21.$$s = self, $$21.$$arity = 0, $$21))};
      $send(self, 'each', [], ($$22 = function($a){var self = $$22.$$s || this, $post_args, args;

      
        
        $post_args = Opal.slice.call(arguments, 0, arguments.length);
        
        args = $post_args;;
        if ($truthy(Opal.yieldX(block, args))) {
          return result++;
        } else {
          return nil
        };}, $$22.$$s = self, $$22.$$arity = -1, $$22));
      return result;
    }, $Enumerable_count$19.$$arity = -1);
    
    Opal.def(self, '$cycle', $Enumerable_cycle$23 = function $$cycle(n) {
      var $iter = $Enumerable_cycle$23.$$p, block = $iter || nil, $$24, self = this;

      if ($iter) $Enumerable_cycle$23.$$p = null;
      
      
      if ($iter) $Enumerable_cycle$23.$$p = null;;
      
      if (n == null) {
        n = nil;
      };
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["cycle", n], ($$24 = function(){var self = $$24.$$s || this;

        if ($truthy(n['$nil?']())) {
            if ($truthy(self['$respond_to?']("size"))) {
              return $$$($$($nesting, 'Float'), 'INFINITY')
            } else {
              return nil
            }
          } else {
            
            n = $$($nesting, 'Opal')['$coerce_to!'](n, $$($nesting, 'Integer'), "to_int");
            if ($truthy($rb_gt(n, 0))) {
              return $rb_times(self.$enumerator_size(), n)
            } else {
              return 0
            };
          }}, $$24.$$s = self, $$24.$$arity = 0, $$24))
      };
      if ($truthy(n['$nil?']())) {
      } else {
        
        n = $$($nesting, 'Opal')['$coerce_to!'](n, $$($nesting, 'Integer'), "to_int");
        if ($truthy(n <= 0)) {
          return nil};
      };
      
      var result,
          all = [], i, length, value;

      self.$each.$$p = function() {
        var param = $$($nesting, 'Opal').$destructure(arguments),
            value = Opal.yield1(block, param);

        all.push(param);
      }

      self.$each();

      if (result !== undefined) {
        return result;
      }

      if (all.length === 0) {
        return nil;
      }

      if (n === nil) {
        while (true) {
          for (i = 0, length = all.length; i < length; i++) {
            value = Opal.yield1(block, all[i]);
          }
        }
      }
      else {
        while (n > 1) {
          for (i = 0, length = all.length; i < length; i++) {
            value = Opal.yield1(block, all[i]);
          }

          n--;
        }
      }
    ;
    }, $Enumerable_cycle$23.$$arity = -1);
    
    Opal.def(self, '$detect', $Enumerable_detect$25 = function $$detect(ifnone) {try {

      var $iter = $Enumerable_detect$25.$$p, block = $iter || nil, $$26, self = this;

      if ($iter) $Enumerable_detect$25.$$p = null;
      
      
      if ($iter) $Enumerable_detect$25.$$p = null;;
      ;
      if ((block !== nil)) {
      } else {
        return self.$enum_for("detect", ifnone)
      };
      $send(self, 'each', [], ($$26 = function($a){var self = $$26.$$s || this, $post_args, args, value = nil;

      
        
        $post_args = Opal.slice.call(arguments, 0, arguments.length);
        
        args = $post_args;;
        value = $$($nesting, 'Opal').$destructure(args);
        if ($truthy(Opal.yield1(block, value))) {
          Opal.ret(value)
        } else {
          return nil
        };}, $$26.$$s = self, $$26.$$arity = -1, $$26));
      
      if (ifnone !== undefined) {
        if (typeof(ifnone) === 'function') {
          return ifnone();
        } else {
          return ifnone;
        }
      }
    ;
      return nil;
      } catch ($returner) { if ($returner === Opal.returner) { return $returner.$v } throw $returner; }
    }, $Enumerable_detect$25.$$arity = -1);
    
    Opal.def(self, '$drop', $Enumerable_drop$27 = function $$drop(number) {
      var self = this;

      
      number = $$($nesting, 'Opal').$coerce_to(number, $$($nesting, 'Integer'), "to_int");
      if ($truthy(number < 0)) {
        self.$raise($$($nesting, 'ArgumentError'), "attempt to drop negative size")};
      
      var result  = [],
          current = 0;

      self.$each.$$p = function() {
        if (number <= current) {
          result.push($$($nesting, 'Opal').$destructure(arguments));
        }

        current++;
      };

      self.$each()

      return result;
    ;
    }, $Enumerable_drop$27.$$arity = 1);
    
    Opal.def(self, '$drop_while', $Enumerable_drop_while$28 = function $$drop_while() {
      var $iter = $Enumerable_drop_while$28.$$p, block = $iter || nil, self = this;

      if ($iter) $Enumerable_drop_while$28.$$p = null;
      
      
      if ($iter) $Enumerable_drop_while$28.$$p = null;;
      if ((block !== nil)) {
      } else {
        return self.$enum_for("drop_while")
      };
      
      var result   = [],
          dropping = true;

      self.$each.$$p = function() {
        var param = $$($nesting, 'Opal').$destructure(arguments);

        if (dropping) {
          var value = Opal.yield1(block, param);

          if ($falsy(value)) {
            dropping = false;
            result.push(param);
          }
        }
        else {
          result.push(param);
        }
      };

      self.$each();

      return result;
    ;
    }, $Enumerable_drop_while$28.$$arity = 0);
    
    Opal.def(self, '$each_cons', $Enumerable_each_cons$29 = function $$each_cons(n) {
      var $iter = $Enumerable_each_cons$29.$$p, block = $iter || nil, $$30, self = this;

      if ($iter) $Enumerable_each_cons$29.$$p = null;
      
      
      if ($iter) $Enumerable_each_cons$29.$$p = null;;
      if ($truthy(arguments.length != 1)) {
        self.$raise($$($nesting, 'ArgumentError'), "" + "wrong number of arguments (" + (arguments.length) + " for 1)")};
      n = $$($nesting, 'Opal').$try_convert(n, $$($nesting, 'Integer'), "to_int");
      if ($truthy(n <= 0)) {
        self.$raise($$($nesting, 'ArgumentError'), "invalid size")};
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["each_cons", n], ($$30 = function(){var self = $$30.$$s || this, $a, enum_size = nil;

        
          enum_size = self.$enumerator_size();
          if ($truthy(enum_size['$nil?']())) {
            return nil
          } else if ($truthy(($truthy($a = enum_size['$=='](0)) ? $a : $rb_lt(enum_size, n)))) {
            return 0
          } else {
            return $rb_plus($rb_minus(enum_size, n), 1)
          };}, $$30.$$s = self, $$30.$$arity = 0, $$30))
      };
      
      var buffer = [], result = nil;

      self.$each.$$p = function() {
        var element = $$($nesting, 'Opal').$destructure(arguments);
        buffer.push(element);
        if (buffer.length > n) {
          buffer.shift();
        }
        if (buffer.length == n) {
          Opal.yield1(block, buffer.slice(0, n));
        }
      }

      self.$each();

      return result;
    ;
    }, $Enumerable_each_cons$29.$$arity = 1);
    
    Opal.def(self, '$each_entry', $Enumerable_each_entry$31 = function $$each_entry($a) {
      var $iter = $Enumerable_each_entry$31.$$p, block = $iter || nil, $post_args, data, $$32, self = this;

      if ($iter) $Enumerable_each_entry$31.$$p = null;
      
      
      if ($iter) $Enumerable_each_entry$31.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      data = $post_args;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'to_enum', ["each_entry"].concat(Opal.to_a(data)), ($$32 = function(){var self = $$32.$$s || this;

        return self.$enumerator_size()}, $$32.$$s = self, $$32.$$arity = 0, $$32))
      };
      
      self.$each.$$p = function() {
        var item = $$($nesting, 'Opal').$destructure(arguments);

        Opal.yield1(block, item);
      }

      self.$each.apply(self, data);

      return self;
    ;
    }, $Enumerable_each_entry$31.$$arity = -1);
    
    Opal.def(self, '$each_slice', $Enumerable_each_slice$33 = function $$each_slice(n) {
      var $iter = $Enumerable_each_slice$33.$$p, block = $iter || nil, $$34, self = this;

      if ($iter) $Enumerable_each_slice$33.$$p = null;
      
      
      if ($iter) $Enumerable_each_slice$33.$$p = null;;
      n = $$($nesting, 'Opal').$coerce_to(n, $$($nesting, 'Integer'), "to_int");
      if ($truthy(n <= 0)) {
        self.$raise($$($nesting, 'ArgumentError'), "invalid slice size")};
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["each_slice", n], ($$34 = function(){var self = $$34.$$s || this;

        if ($truthy(self['$respond_to?']("size"))) {
            return $rb_divide(self.$size(), n).$ceil()
          } else {
            return nil
          }}, $$34.$$s = self, $$34.$$arity = 0, $$34))
      };
      
      var result,
          slice = []

      self.$each.$$p = function() {
        var param = $$($nesting, 'Opal').$destructure(arguments);

        slice.push(param);

        if (slice.length === n) {
          Opal.yield1(block, slice);
          slice = [];
        }
      };

      self.$each();

      if (result !== undefined) {
        return result;
      }

      // our "last" group, if smaller than n then won't have been yielded
      if (slice.length > 0) {
        Opal.yield1(block, slice);
      }
    ;
      return nil;
    }, $Enumerable_each_slice$33.$$arity = 1);
    
    Opal.def(self, '$each_with_index', $Enumerable_each_with_index$35 = function $$each_with_index($a) {
      var $iter = $Enumerable_each_with_index$35.$$p, block = $iter || nil, $post_args, args, $$36, self = this;

      if ($iter) $Enumerable_each_with_index$35.$$p = null;
      
      
      if ($iter) $Enumerable_each_with_index$35.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["each_with_index"].concat(Opal.to_a(args)), ($$36 = function(){var self = $$36.$$s || this;

        return self.$enumerator_size()}, $$36.$$s = self, $$36.$$arity = 0, $$36))
      };
      
      var result,
          index = 0;

      self.$each.$$p = function() {
        var param = $$($nesting, 'Opal').$destructure(arguments);

        block(param, index);

        index++;
      };

      self.$each.apply(self, args);

      if (result !== undefined) {
        return result;
      }
    ;
      return self;
    }, $Enumerable_each_with_index$35.$$arity = -1);
    
    Opal.def(self, '$each_with_object', $Enumerable_each_with_object$37 = function $$each_with_object(object) {
      var $iter = $Enumerable_each_with_object$37.$$p, block = $iter || nil, $$38, self = this;

      if ($iter) $Enumerable_each_with_object$37.$$p = null;
      
      
      if ($iter) $Enumerable_each_with_object$37.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["each_with_object", object], ($$38 = function(){var self = $$38.$$s || this;

        return self.$enumerator_size()}, $$38.$$s = self, $$38.$$arity = 0, $$38))
      };
      
      var result;

      self.$each.$$p = function() {
        var param = $$($nesting, 'Opal').$destructure(arguments);

        block(param, object);
      };

      self.$each();

      if (result !== undefined) {
        return result;
      }
    ;
      return object;
    }, $Enumerable_each_with_object$37.$$arity = 1);
    
    Opal.def(self, '$entries', $Enumerable_entries$39 = function $$entries($a) {
      var $post_args, args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      
      var result = [];

      self.$each.$$p = function() {
        result.push($$($nesting, 'Opal').$destructure(arguments));
      };

      self.$each.apply(self, args);

      return result;
    ;
    }, $Enumerable_entries$39.$$arity = -1);
    Opal.alias(self, "find", "detect");
    
    Opal.def(self, '$find_all', $Enumerable_find_all$40 = function $$find_all() {
      var $iter = $Enumerable_find_all$40.$$p, block = $iter || nil, $$41, self = this;

      if ($iter) $Enumerable_find_all$40.$$p = null;
      
      
      if ($iter) $Enumerable_find_all$40.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["find_all"], ($$41 = function(){var self = $$41.$$s || this;

        return self.$enumerator_size()}, $$41.$$s = self, $$41.$$arity = 0, $$41))
      };
      
      var result = [];

      self.$each.$$p = function() {
        var param = $$($nesting, 'Opal').$destructure(arguments),
            value = Opal.yield1(block, param);

        if ($truthy(value)) {
          result.push(param);
        }
      };

      self.$each();

      return result;
    ;
    }, $Enumerable_find_all$40.$$arity = 0);
    
    Opal.def(self, '$find_index', $Enumerable_find_index$42 = function $$find_index(object) {try {

      var $iter = $Enumerable_find_index$42.$$p, block = $iter || nil, $$43, $$44, self = this, index = nil;

      if ($iter) $Enumerable_find_index$42.$$p = null;
      
      
      if ($iter) $Enumerable_find_index$42.$$p = null;;
      ;
      if ($truthy(object === undefined && block === nil)) {
        return self.$enum_for("find_index")};
      
      if (object != null && block !== nil) {
        self.$warn("warning: given block not used")
      }
    ;
      index = 0;
      if ($truthy(object != null)) {
        $send(self, 'each', [], ($$43 = function($a){var self = $$43.$$s || this, $post_args, value;

        
          
          $post_args = Opal.slice.call(arguments, 0, arguments.length);
          
          value = $post_args;;
          if ($$($nesting, 'Opal').$destructure(value)['$=='](object)) {
            Opal.ret(index)};
          return index += 1;;}, $$43.$$s = self, $$43.$$arity = -1, $$43))
      } else {
        $send(self, 'each', [], ($$44 = function($a){var self = $$44.$$s || this, $post_args, value;

        
          
          $post_args = Opal.slice.call(arguments, 0, arguments.length);
          
          value = $post_args;;
          if ($truthy(Opal.yieldX(block, Opal.to_a(value)))) {
            Opal.ret(index)};
          return index += 1;;}, $$44.$$s = self, $$44.$$arity = -1, $$44))
      };
      return nil;
      } catch ($returner) { if ($returner === Opal.returner) { return $returner.$v } throw $returner; }
    }, $Enumerable_find_index$42.$$arity = -1);
    
    Opal.def(self, '$first', $Enumerable_first$45 = function $$first(number) {try {

      var $$46, $$47, self = this, result = nil, current = nil;

      
      ;
      if ($truthy(number === undefined)) {
        return $send(self, 'each', [], ($$46 = function(value){var self = $$46.$$s || this;

        
          
          if (value == null) {
            value = nil;
          };
          Opal.ret(value);}, $$46.$$s = self, $$46.$$arity = 1, $$46))
      } else {
        
        result = [];
        number = $$($nesting, 'Opal').$coerce_to(number, $$($nesting, 'Integer'), "to_int");
        if ($truthy(number < 0)) {
          self.$raise($$($nesting, 'ArgumentError'), "attempt to take negative size")};
        if ($truthy(number == 0)) {
          return []};
        current = 0;
        $send(self, 'each', [], ($$47 = function($a){var self = $$47.$$s || this, $post_args, args;

        
          
          $post_args = Opal.slice.call(arguments, 0, arguments.length);
          
          args = $post_args;;
          result.push($$($nesting, 'Opal').$destructure(args));
          if ($truthy(number <= ++current)) {
            Opal.ret(result)
          } else {
            return nil
          };}, $$47.$$s = self, $$47.$$arity = -1, $$47));
        return result;
      };
      } catch ($returner) { if ($returner === Opal.returner) { return $returner.$v } throw $returner; }
    }, $Enumerable_first$45.$$arity = -1);
    Opal.alias(self, "flat_map", "collect_concat");
    
    Opal.def(self, '$grep', $Enumerable_grep$48 = function $$grep(pattern) {
      var $iter = $Enumerable_grep$48.$$p, block = $iter || nil, $$49, self = this, result = nil;

      if ($iter) $Enumerable_grep$48.$$p = null;
      
      
      if ($iter) $Enumerable_grep$48.$$p = null;;
      result = [];
      $send(self, 'each', [], ($$49 = function($a){var self = $$49.$$s || this, $post_args, value, cmp = nil;

      
        
        $post_args = Opal.slice.call(arguments, 0, arguments.length);
        
        value = $post_args;;
        cmp = comparableForPattern(value);
        if ($truthy($send(pattern, '__send__', ["==="].concat(Opal.to_a(cmp))))) {
        } else {
          return nil;
        };
        if ((block !== nil)) {
          
          if ($truthy($rb_gt(value.$length(), 1))) {
            value = [value]};
          value = Opal.yieldX(block, Opal.to_a(value));
        } else if ($truthy($rb_le(value.$length(), 1))) {
          value = value['$[]'](0)};
        return result.$push(value);}, $$49.$$s = self, $$49.$$arity = -1, $$49));
      return result;
    }, $Enumerable_grep$48.$$arity = 1);
    
    Opal.def(self, '$grep_v', $Enumerable_grep_v$50 = function $$grep_v(pattern) {
      var $iter = $Enumerable_grep_v$50.$$p, block = $iter || nil, $$51, self = this, result = nil;

      if ($iter) $Enumerable_grep_v$50.$$p = null;
      
      
      if ($iter) $Enumerable_grep_v$50.$$p = null;;
      result = [];
      $send(self, 'each', [], ($$51 = function($a){var self = $$51.$$s || this, $post_args, value, cmp = nil;

      
        
        $post_args = Opal.slice.call(arguments, 0, arguments.length);
        
        value = $post_args;;
        cmp = comparableForPattern(value);
        if ($truthy($send(pattern, '__send__', ["==="].concat(Opal.to_a(cmp))))) {
          return nil;};
        if ((block !== nil)) {
          
          if ($truthy($rb_gt(value.$length(), 1))) {
            value = [value]};
          value = Opal.yieldX(block, Opal.to_a(value));
        } else if ($truthy($rb_le(value.$length(), 1))) {
          value = value['$[]'](0)};
        return result.$push(value);}, $$51.$$s = self, $$51.$$arity = -1, $$51));
      return result;
    }, $Enumerable_grep_v$50.$$arity = 1);
    
    Opal.def(self, '$group_by', $Enumerable_group_by$52 = function $$group_by() {
      var $iter = $Enumerable_group_by$52.$$p, block = $iter || nil, $$53, $a, self = this, hash = nil, $writer = nil;

      if ($iter) $Enumerable_group_by$52.$$p = null;
      
      
      if ($iter) $Enumerable_group_by$52.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["group_by"], ($$53 = function(){var self = $$53.$$s || this;

        return self.$enumerator_size()}, $$53.$$s = self, $$53.$$arity = 0, $$53))
      };
      hash = $hash2([], {});
      
      var result;

      self.$each.$$p = function() {
        var param = $$($nesting, 'Opal').$destructure(arguments),
            value = Opal.yield1(block, param);

        ($truthy($a = hash['$[]'](value)) ? $a : (($writer = [value, []]), $send(hash, '[]=', Opal.to_a($writer)), $writer[$rb_minus($writer["length"], 1)]))['$<<'](param);
      }

      self.$each();

      if (result !== undefined) {
        return result;
      }
    ;
      return hash;
    }, $Enumerable_group_by$52.$$arity = 0);
    
    Opal.def(self, '$include?', $Enumerable_include$ques$54 = function(obj) {try {

      var $$55, self = this;

      
      $send(self, 'each', [], ($$55 = function($a){var self = $$55.$$s || this, $post_args, args;

      
        
        $post_args = Opal.slice.call(arguments, 0, arguments.length);
        
        args = $post_args;;
        if ($$($nesting, 'Opal').$destructure(args)['$=='](obj)) {
          Opal.ret(true)
        } else {
          return nil
        };}, $$55.$$s = self, $$55.$$arity = -1, $$55));
      return false;
      } catch ($returner) { if ($returner === Opal.returner) { return $returner.$v } throw $returner; }
    }, $Enumerable_include$ques$54.$$arity = 1);
    
    Opal.def(self, '$inject', $Enumerable_inject$56 = function $$inject(object, sym) {
      var $iter = $Enumerable_inject$56.$$p, block = $iter || nil, self = this;

      if ($iter) $Enumerable_inject$56.$$p = null;
      
      
      if ($iter) $Enumerable_inject$56.$$p = null;;
      ;
      ;
      
      var result = object;

      if (block !== nil && sym === undefined) {
        self.$each.$$p = function() {
          var value = $$($nesting, 'Opal').$destructure(arguments);

          if (result === undefined) {
            result = value;
            return;
          }

          value = Opal.yieldX(block, [result, value]);

          result = value;
        };
      }
      else {
        if (sym === undefined) {
          if (!$$($nesting, 'Symbol')['$==='](object)) {
            self.$raise($$($nesting, 'TypeError'), "" + (object.$inspect()) + " is not a Symbol");
          }

          sym    = object;
          result = undefined;
        }

        self.$each.$$p = function() {
          var value = $$($nesting, 'Opal').$destructure(arguments);

          if (result === undefined) {
            result = value;
            return;
          }

          result = (result).$__send__(sym, value);
        };
      }

      self.$each();

      return result == undefined ? nil : result;
    ;
    }, $Enumerable_inject$56.$$arity = -1);
    
    Opal.def(self, '$lazy', $Enumerable_lazy$57 = function $$lazy() {
      var $$58, self = this;

      return $send($$$($$($nesting, 'Enumerator'), 'Lazy'), 'new', [self, self.$enumerator_size()], ($$58 = function(enum$, $a){var self = $$58.$$s || this, $post_args, args;

      
        
        if (enum$ == null) {
          enum$ = nil;
        };
        
        $post_args = Opal.slice.call(arguments, 1, arguments.length);
        
        args = $post_args;;
        return $send(enum$, 'yield', Opal.to_a(args));}, $$58.$$s = self, $$58.$$arity = -2, $$58))
    }, $Enumerable_lazy$57.$$arity = 0);
    
    Opal.def(self, '$enumerator_size', $Enumerable_enumerator_size$59 = function $$enumerator_size() {
      var self = this;

      if ($truthy(self['$respond_to?']("size"))) {
        return self.$size()
      } else {
        return nil
      }
    }, $Enumerable_enumerator_size$59.$$arity = 0);
    Opal.alias(self, "map", "collect");
    
    Opal.def(self, '$max', $Enumerable_max$60 = function $$max(n) {
      var $iter = $Enumerable_max$60.$$p, block = $iter || nil, self = this;

      if ($iter) $Enumerable_max$60.$$p = null;
      
      
      if ($iter) $Enumerable_max$60.$$p = null;;
      ;
      
      if (n === undefined || n === nil) {
        var result, value;

        self.$each.$$p = function() {
          var item = $$($nesting, 'Opal').$destructure(arguments);

          if (result === undefined) {
            result = item;
            return;
          }

          if (block !== nil) {
            value = Opal.yieldX(block, [item, result]);
          } else {
            value = (item)['$<=>'](result);
          }

          if (value === nil) {
            self.$raise($$($nesting, 'ArgumentError'), "comparison failed");
          }

          if (value > 0) {
            result = item;
          }
        }

        self.$each();

        if (result === undefined) {
          return nil;
        } else {
          return result;
        }
      }
    ;
      n = $$($nesting, 'Opal').$coerce_to(n, $$($nesting, 'Integer'), "to_int");
      return $send(self, 'sort', [], block.$to_proc()).$reverse().$first(n);
    }, $Enumerable_max$60.$$arity = -1);
    
    Opal.def(self, '$max_by', $Enumerable_max_by$61 = function $$max_by() {
      var $iter = $Enumerable_max_by$61.$$p, block = $iter || nil, $$62, self = this;

      if ($iter) $Enumerable_max_by$61.$$p = null;
      
      
      if ($iter) $Enumerable_max_by$61.$$p = null;;
      if ($truthy(block)) {
      } else {
        return $send(self, 'enum_for', ["max_by"], ($$62 = function(){var self = $$62.$$s || this;

        return self.$enumerator_size()}, $$62.$$s = self, $$62.$$arity = 0, $$62))
      };
      
      var result,
          by;

      self.$each.$$p = function() {
        var param = $$($nesting, 'Opal').$destructure(arguments),
            value = Opal.yield1(block, param);

        if (result === undefined) {
          result = param;
          by     = value;
          return;
        }

        if ((value)['$<=>'](by) > 0) {
          result = param
          by     = value;
        }
      };

      self.$each();

      return result === undefined ? nil : result;
    ;
    }, $Enumerable_max_by$61.$$arity = 0);
    Opal.alias(self, "member?", "include?");
    
    Opal.def(self, '$min', $Enumerable_min$63 = function $$min() {
      var $iter = $Enumerable_min$63.$$p, block = $iter || nil, self = this;

      if ($iter) $Enumerable_min$63.$$p = null;
      
      
      if ($iter) $Enumerable_min$63.$$p = null;;
      
      var result;

      if (block !== nil) {
        self.$each.$$p = function() {
          var param = $$($nesting, 'Opal').$destructure(arguments);

          if (result === undefined) {
            result = param;
            return;
          }

          var value = block(param, result);

          if (value === nil) {
            self.$raise($$($nesting, 'ArgumentError'), "comparison failed");
          }

          if (value < 0) {
            result = param;
          }
        };
      }
      else {
        self.$each.$$p = function() {
          var param = $$($nesting, 'Opal').$destructure(arguments);

          if (result === undefined) {
            result = param;
            return;
          }

          if ($$($nesting, 'Opal').$compare(param, result) < 0) {
            result = param;
          }
        };
      }

      self.$each();

      return result === undefined ? nil : result;
    ;
    }, $Enumerable_min$63.$$arity = 0);
    
    Opal.def(self, '$min_by', $Enumerable_min_by$64 = function $$min_by() {
      var $iter = $Enumerable_min_by$64.$$p, block = $iter || nil, $$65, self = this;

      if ($iter) $Enumerable_min_by$64.$$p = null;
      
      
      if ($iter) $Enumerable_min_by$64.$$p = null;;
      if ($truthy(block)) {
      } else {
        return $send(self, 'enum_for', ["min_by"], ($$65 = function(){var self = $$65.$$s || this;

        return self.$enumerator_size()}, $$65.$$s = self, $$65.$$arity = 0, $$65))
      };
      
      var result,
          by;

      self.$each.$$p = function() {
        var param = $$($nesting, 'Opal').$destructure(arguments),
            value = Opal.yield1(block, param);

        if (result === undefined) {
          result = param;
          by     = value;
          return;
        }

        if ((value)['$<=>'](by) < 0) {
          result = param
          by     = value;
        }
      };

      self.$each();

      return result === undefined ? nil : result;
    ;
    }, $Enumerable_min_by$64.$$arity = 0);
    
    Opal.def(self, '$minmax', $Enumerable_minmax$66 = function $$minmax() {
      var $iter = $Enumerable_minmax$66.$$p, block = $iter || nil, $a, $$67, self = this;

      if ($iter) $Enumerable_minmax$66.$$p = null;
      
      
      if ($iter) $Enumerable_minmax$66.$$p = null;;
      block = ($truthy($a = block) ? $a : $send(self, 'proc', [], ($$67 = function(a, b){var self = $$67.$$s || this;

      
        
        if (a == null) {
          a = nil;
        };
        
        if (b == null) {
          b = nil;
        };
        return a['$<=>'](b);}, $$67.$$s = self, $$67.$$arity = 2, $$67)));
      
      var min = nil, max = nil, first_time = true;

      self.$each.$$p = function() {
        var element = $$($nesting, 'Opal').$destructure(arguments);
        if (first_time) {
          min = max = element;
          first_time = false;
        } else {
          var min_cmp = block.$call(min, element);

          if (min_cmp === nil) {
            self.$raise($$($nesting, 'ArgumentError'), "comparison failed")
          } else if (min_cmp > 0) {
            min = element;
          }

          var max_cmp = block.$call(max, element);

          if (max_cmp === nil) {
            self.$raise($$($nesting, 'ArgumentError'), "comparison failed")
          } else if (max_cmp < 0) {
            max = element;
          }
        }
      }

      self.$each();

      return [min, max];
    ;
    }, $Enumerable_minmax$66.$$arity = 0);
    
    Opal.def(self, '$minmax_by', $Enumerable_minmax_by$68 = function $$minmax_by() {
      var $iter = $Enumerable_minmax_by$68.$$p, block = $iter || nil, self = this;

      if ($iter) $Enumerable_minmax_by$68.$$p = null;
      
      
      if ($iter) $Enumerable_minmax_by$68.$$p = null;;
      return self.$raise($$($nesting, 'NotImplementedError'));
    }, $Enumerable_minmax_by$68.$$arity = 0);
    
    Opal.def(self, '$none?', $Enumerable_none$ques$69 = function(pattern) {try {

      var $iter = $Enumerable_none$ques$69.$$p, block = $iter || nil, $$70, $$71, $$72, self = this;

      if ($iter) $Enumerable_none$ques$69.$$p = null;
      
      
      if ($iter) $Enumerable_none$ques$69.$$p = null;;
      ;
      if ($truthy(pattern !== undefined)) {
        $send(self, 'each', [], ($$70 = function($a){var self = $$70.$$s || this, $post_args, value, comparable = nil;

        
          
          $post_args = Opal.slice.call(arguments, 0, arguments.length);
          
          value = $post_args;;
          comparable = comparableForPattern(value);
          if ($truthy($send(pattern, 'public_send', ["==="].concat(Opal.to_a(comparable))))) {
            Opal.ret(false)
          } else {
            return nil
          };}, $$70.$$s = self, $$70.$$arity = -1, $$70))
      } else if ((block !== nil)) {
        $send(self, 'each', [], ($$71 = function($a){var self = $$71.$$s || this, $post_args, value;

        
          
          $post_args = Opal.slice.call(arguments, 0, arguments.length);
          
          value = $post_args;;
          if ($truthy(Opal.yieldX(block, Opal.to_a(value)))) {
            Opal.ret(false)
          } else {
            return nil
          };}, $$71.$$s = self, $$71.$$arity = -1, $$71))
      } else {
        $send(self, 'each', [], ($$72 = function($a){var self = $$72.$$s || this, $post_args, value, item = nil;

        
          
          $post_args = Opal.slice.call(arguments, 0, arguments.length);
          
          value = $post_args;;
          item = $$($nesting, 'Opal').$destructure(value);
          if ($truthy(item)) {
            Opal.ret(false)
          } else {
            return nil
          };}, $$72.$$s = self, $$72.$$arity = -1, $$72))
      };
      return true;
      } catch ($returner) { if ($returner === Opal.returner) { return $returner.$v } throw $returner; }
    }, $Enumerable_none$ques$69.$$arity = -1);
    
    Opal.def(self, '$one?', $Enumerable_one$ques$73 = function(pattern) {try {

      var $iter = $Enumerable_one$ques$73.$$p, block = $iter || nil, $$74, $$75, $$76, self = this, count = nil;

      if ($iter) $Enumerable_one$ques$73.$$p = null;
      
      
      if ($iter) $Enumerable_one$ques$73.$$p = null;;
      ;
      count = 0;
      if ($truthy(pattern !== undefined)) {
        $send(self, 'each', [], ($$74 = function($a){var self = $$74.$$s || this, $post_args, value, comparable = nil;

        
          
          $post_args = Opal.slice.call(arguments, 0, arguments.length);
          
          value = $post_args;;
          comparable = comparableForPattern(value);
          if ($truthy($send(pattern, 'public_send', ["==="].concat(Opal.to_a(comparable))))) {
            
            count = $rb_plus(count, 1);
            if ($truthy($rb_gt(count, 1))) {
              Opal.ret(false)
            } else {
              return nil
            };
          } else {
            return nil
          };}, $$74.$$s = self, $$74.$$arity = -1, $$74))
      } else if ((block !== nil)) {
        $send(self, 'each', [], ($$75 = function($a){var self = $$75.$$s || this, $post_args, value;

        
          
          $post_args = Opal.slice.call(arguments, 0, arguments.length);
          
          value = $post_args;;
          if ($truthy(Opal.yieldX(block, Opal.to_a(value)))) {
          } else {
            return nil;
          };
          count = $rb_plus(count, 1);
          if ($truthy($rb_gt(count, 1))) {
            Opal.ret(false)
          } else {
            return nil
          };}, $$75.$$s = self, $$75.$$arity = -1, $$75))
      } else {
        $send(self, 'each', [], ($$76 = function($a){var self = $$76.$$s || this, $post_args, value;

        
          
          $post_args = Opal.slice.call(arguments, 0, arguments.length);
          
          value = $post_args;;
          if ($truthy($$($nesting, 'Opal').$destructure(value))) {
          } else {
            return nil;
          };
          count = $rb_plus(count, 1);
          if ($truthy($rb_gt(count, 1))) {
            Opal.ret(false)
          } else {
            return nil
          };}, $$76.$$s = self, $$76.$$arity = -1, $$76))
      };
      return count['$=='](1);
      } catch ($returner) { if ($returner === Opal.returner) { return $returner.$v } throw $returner; }
    }, $Enumerable_one$ques$73.$$arity = -1);
    
    Opal.def(self, '$partition', $Enumerable_partition$77 = function $$partition() {
      var $iter = $Enumerable_partition$77.$$p, block = $iter || nil, $$78, self = this;

      if ($iter) $Enumerable_partition$77.$$p = null;
      
      
      if ($iter) $Enumerable_partition$77.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["partition"], ($$78 = function(){var self = $$78.$$s || this;

        return self.$enumerator_size()}, $$78.$$s = self, $$78.$$arity = 0, $$78))
      };
      
      var truthy = [], falsy = [], result;

      self.$each.$$p = function() {
        var param = $$($nesting, 'Opal').$destructure(arguments),
            value = Opal.yield1(block, param);

        if ($truthy(value)) {
          truthy.push(param);
        }
        else {
          falsy.push(param);
        }
      };

      self.$each();

      return [truthy, falsy];
    ;
    }, $Enumerable_partition$77.$$arity = 0);
    Opal.alias(self, "reduce", "inject");
    
    Opal.def(self, '$reject', $Enumerable_reject$79 = function $$reject() {
      var $iter = $Enumerable_reject$79.$$p, block = $iter || nil, $$80, self = this;

      if ($iter) $Enumerable_reject$79.$$p = null;
      
      
      if ($iter) $Enumerable_reject$79.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["reject"], ($$80 = function(){var self = $$80.$$s || this;

        return self.$enumerator_size()}, $$80.$$s = self, $$80.$$arity = 0, $$80))
      };
      
      var result = [];

      self.$each.$$p = function() {
        var param = $$($nesting, 'Opal').$destructure(arguments),
            value = Opal.yield1(block, param);

        if ($falsy(value)) {
          result.push(param);
        }
      };

      self.$each();

      return result;
    ;
    }, $Enumerable_reject$79.$$arity = 0);
    
    Opal.def(self, '$reverse_each', $Enumerable_reverse_each$81 = function $$reverse_each() {
      var $iter = $Enumerable_reverse_each$81.$$p, block = $iter || nil, $$82, self = this;

      if ($iter) $Enumerable_reverse_each$81.$$p = null;
      
      
      if ($iter) $Enumerable_reverse_each$81.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["reverse_each"], ($$82 = function(){var self = $$82.$$s || this;

        return self.$enumerator_size()}, $$82.$$s = self, $$82.$$arity = 0, $$82))
      };
      
      var result = [];

      self.$each.$$p = function() {
        result.push(arguments);
      };

      self.$each();

      for (var i = result.length - 1; i >= 0; i--) {
        Opal.yieldX(block, result[i]);
      }

      return result;
    ;
    }, $Enumerable_reverse_each$81.$$arity = 0);
    Opal.alias(self, "select", "find_all");
    
    Opal.def(self, '$slice_before', $Enumerable_slice_before$83 = function $$slice_before(pattern) {
      var $iter = $Enumerable_slice_before$83.$$p, block = $iter || nil, $$84, self = this;

      if ($iter) $Enumerable_slice_before$83.$$p = null;
      
      
      if ($iter) $Enumerable_slice_before$83.$$p = null;;
      ;
      if ($truthy(pattern === undefined && block === nil)) {
        self.$raise($$($nesting, 'ArgumentError'), "both pattern and block are given")};
      if ($truthy(pattern !== undefined && block !== nil || arguments.length > 1)) {
        self.$raise($$($nesting, 'ArgumentError'), "" + "wrong number of arguments (" + (arguments.length) + " expected 1)")};
      return $send($$($nesting, 'Enumerator'), 'new', [], ($$84 = function(e){var self = $$84.$$s || this;

      
        
        if (e == null) {
          e = nil;
        };
        
        var slice = [];

        if (block !== nil) {
          if (pattern === undefined) {
            self.$each.$$p = function() {
              var param = $$($nesting, 'Opal').$destructure(arguments),
                  value = Opal.yield1(block, param);

              if ($truthy(value) && slice.length > 0) {
                e['$<<'](slice);
                slice = [];
              }

              slice.push(param);
            };
          }
          else {
            self.$each.$$p = function() {
              var param = $$($nesting, 'Opal').$destructure(arguments),
                  value = block(param, pattern.$dup());

              if ($truthy(value) && slice.length > 0) {
                e['$<<'](slice);
                slice = [];
              }

              slice.push(param);
            };
          }
        }
        else {
          self.$each.$$p = function() {
            var param = $$($nesting, 'Opal').$destructure(arguments),
                value = pattern['$==='](param);

            if ($truthy(value) && slice.length > 0) {
              e['$<<'](slice);
              slice = [];
            }

            slice.push(param);
          };
        }

        self.$each();

        if (slice.length > 0) {
          e['$<<'](slice);
        }
      ;}, $$84.$$s = self, $$84.$$arity = 1, $$84));
    }, $Enumerable_slice_before$83.$$arity = -1);
    
    Opal.def(self, '$slice_after', $Enumerable_slice_after$85 = function $$slice_after(pattern) {
      var $iter = $Enumerable_slice_after$85.$$p, block = $iter || nil, $$86, $$87, self = this;

      if ($iter) $Enumerable_slice_after$85.$$p = null;
      
      
      if ($iter) $Enumerable_slice_after$85.$$p = null;;
      ;
      if ($truthy(pattern === undefined && block === nil)) {
        self.$raise($$($nesting, 'ArgumentError'), "both pattern and block are given")};
      if ($truthy(pattern !== undefined && block !== nil || arguments.length > 1)) {
        self.$raise($$($nesting, 'ArgumentError'), "" + "wrong number of arguments (" + (arguments.length) + " expected 1)")};
      if ($truthy(pattern !== undefined)) {
        block = $send(self, 'proc', [], ($$86 = function(e){var self = $$86.$$s || this;

        
          
          if (e == null) {
            e = nil;
          };
          return pattern['$==='](e);}, $$86.$$s = self, $$86.$$arity = 1, $$86))};
      return $send($$($nesting, 'Enumerator'), 'new', [], ($$87 = function(yielder){var self = $$87.$$s || this;

      
        
        if (yielder == null) {
          yielder = nil;
        };
        
        var accumulate;

        self.$each.$$p = function() {
          var element = $$($nesting, 'Opal').$destructure(arguments),
              end_chunk = Opal.yield1(block, element);

          if (accumulate == null) {
            accumulate = [];
          }

          if ($truthy(end_chunk)) {
            accumulate.push(element);
            yielder.$yield(accumulate);
            accumulate = null;
          } else {
            accumulate.push(element)
          }
        }

        self.$each();

        if (accumulate != null) {
          yielder.$yield(accumulate);
        }
      ;}, $$87.$$s = self, $$87.$$arity = 1, $$87));
    }, $Enumerable_slice_after$85.$$arity = -1);
    
    Opal.def(self, '$slice_when', $Enumerable_slice_when$88 = function $$slice_when() {
      var $iter = $Enumerable_slice_when$88.$$p, block = $iter || nil, $$89, self = this;

      if ($iter) $Enumerable_slice_when$88.$$p = null;
      
      
      if ($iter) $Enumerable_slice_when$88.$$p = null;;
      if ((block !== nil)) {
      } else {
        self.$raise($$($nesting, 'ArgumentError'), "wrong number of arguments (0 for 1)")
      };
      return $send($$($nesting, 'Enumerator'), 'new', [], ($$89 = function(yielder){var self = $$89.$$s || this;

      
        
        if (yielder == null) {
          yielder = nil;
        };
        
        var slice = nil, last_after = nil;

        self.$each_cons.$$p = function() {
          var params = $$($nesting, 'Opal').$destructure(arguments),
              before = params[0],
              after = params[1],
              match = Opal.yieldX(block, [before, after]);

          last_after = after;

          if (slice === nil) {
            slice = [];
          }

          if ($truthy(match)) {
            slice.push(before);
            yielder.$yield(slice);
            slice = [];
          } else {
            slice.push(before);
          }
        }

        self.$each_cons(2);

        if (slice !== nil) {
          slice.push(last_after);
          yielder.$yield(slice);
        }
      ;}, $$89.$$s = self, $$89.$$arity = 1, $$89));
    }, $Enumerable_slice_when$88.$$arity = 0);
    
    Opal.def(self, '$sort', $Enumerable_sort$90 = function $$sort() {
      var $iter = $Enumerable_sort$90.$$p, block = $iter || nil, $$91, self = this, ary = nil;

      if ($iter) $Enumerable_sort$90.$$p = null;
      
      
      if ($iter) $Enumerable_sort$90.$$p = null;;
      ary = self.$to_a();
      if ((block !== nil)) {
      } else {
        block = $lambda(($$91 = function(a, b){var self = $$91.$$s || this;

        
          
          if (a == null) {
            a = nil;
          };
          
          if (b == null) {
            b = nil;
          };
          return a['$<=>'](b);}, $$91.$$s = self, $$91.$$arity = 2, $$91))
      };
      return $send(ary, 'sort', [], block.$to_proc());
    }, $Enumerable_sort$90.$$arity = 0);
    
    Opal.def(self, '$sort_by', $Enumerable_sort_by$92 = function $$sort_by() {
      var $iter = $Enumerable_sort_by$92.$$p, block = $iter || nil, $$93, $$94, $$95, $$96, self = this, dup = nil;

      if ($iter) $Enumerable_sort_by$92.$$p = null;
      
      
      if ($iter) $Enumerable_sort_by$92.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["sort_by"], ($$93 = function(){var self = $$93.$$s || this;

        return self.$enumerator_size()}, $$93.$$s = self, $$93.$$arity = 0, $$93))
      };
      dup = $send(self, 'map', [], ($$94 = function(){var self = $$94.$$s || this, arg = nil;

      
        arg = $$($nesting, 'Opal').$destructure(arguments);
        return [Opal.yield1(block, arg), arg];}, $$94.$$s = self, $$94.$$arity = 0, $$94));
      $send(dup, 'sort!', [], ($$95 = function(a, b){var self = $$95.$$s || this;

      
        
        if (a == null) {
          a = nil;
        };
        
        if (b == null) {
          b = nil;
        };
        return (a[0])['$<=>'](b[0]);}, $$95.$$s = self, $$95.$$arity = 2, $$95));
      return $send(dup, 'map!', [], ($$96 = function(i){var self = $$96.$$s || this;

      
        
        if (i == null) {
          i = nil;
        };
        return i[1];;}, $$96.$$s = self, $$96.$$arity = 1, $$96));
    }, $Enumerable_sort_by$92.$$arity = 0);
    
    Opal.def(self, '$sum', $Enumerable_sum$97 = function $$sum(initial) {
      var $$98, $iter = $Enumerable_sum$97.$$p, $yield = $iter || nil, self = this, result = nil;

      if ($iter) $Enumerable_sum$97.$$p = null;
      
      
      if (initial == null) {
        initial = 0;
      };
      result = initial;
      $send(self, 'each', [], ($$98 = function($a){var self = $$98.$$s || this, $post_args, args, item = nil;

      
        
        $post_args = Opal.slice.call(arguments, 0, arguments.length);
        
        args = $post_args;;
        item = (function() {if (($yield !== nil)) {
          return Opal.yieldX($yield, Opal.to_a(args));
        } else {
          return $$($nesting, 'Opal').$destructure(args)
        }; return nil; })();
        return (result = $rb_plus(result, item));}, $$98.$$s = self, $$98.$$arity = -1, $$98));
      return result;
    }, $Enumerable_sum$97.$$arity = -1);
    
    Opal.def(self, '$take', $Enumerable_take$99 = function $$take(num) {
      var self = this;

      return self.$first(num)
    }, $Enumerable_take$99.$$arity = 1);
    
    Opal.def(self, '$take_while', $Enumerable_take_while$100 = function $$take_while() {try {

      var $iter = $Enumerable_take_while$100.$$p, block = $iter || nil, $$101, self = this, result = nil;

      if ($iter) $Enumerable_take_while$100.$$p = null;
      
      
      if ($iter) $Enumerable_take_while$100.$$p = null;;
      if ($truthy(block)) {
      } else {
        return self.$enum_for("take_while")
      };
      result = [];
      return $send(self, 'each', [], ($$101 = function($a){var self = $$101.$$s || this, $post_args, args, value = nil;

      
        
        $post_args = Opal.slice.call(arguments, 0, arguments.length);
        
        args = $post_args;;
        value = $$($nesting, 'Opal').$destructure(args);
        if ($truthy(Opal.yield1(block, value))) {
        } else {
          Opal.ret(result)
        };
        return result.push(value);;}, $$101.$$s = self, $$101.$$arity = -1, $$101));
      } catch ($returner) { if ($returner === Opal.returner) { return $returner.$v } throw $returner; }
    }, $Enumerable_take_while$100.$$arity = 0);
    
    Opal.def(self, '$uniq', $Enumerable_uniq$102 = function $$uniq() {
      var $iter = $Enumerable_uniq$102.$$p, block = $iter || nil, $$103, self = this, hash = nil;

      if ($iter) $Enumerable_uniq$102.$$p = null;
      
      
      if ($iter) $Enumerable_uniq$102.$$p = null;;
      hash = $hash2([], {});
      $send(self, 'each', [], ($$103 = function($a){var self = $$103.$$s || this, $post_args, args, value = nil, produced = nil, $writer = nil;

      
        
        $post_args = Opal.slice.call(arguments, 0, arguments.length);
        
        args = $post_args;;
        value = $$($nesting, 'Opal').$destructure(args);
        produced = (function() {if ((block !== nil)) {
          return Opal.yield1(block, value);
        } else {
          return value
        }; return nil; })();
        if ($truthy(hash['$key?'](produced))) {
          return nil
        } else {
          
          $writer = [produced, value];
          $send(hash, '[]=', Opal.to_a($writer));
          return $writer[$rb_minus($writer["length"], 1)];
        };}, $$103.$$s = self, $$103.$$arity = -1, $$103));
      return hash.$values();
    }, $Enumerable_uniq$102.$$arity = 0);
    Opal.alias(self, "to_a", "entries");
    
    Opal.def(self, '$zip', $Enumerable_zip$104 = function $$zip($a) {
      var $iter = $Enumerable_zip$104.$$p, block = $iter || nil, $post_args, others, self = this;

      if ($iter) $Enumerable_zip$104.$$p = null;
      
      
      if ($iter) $Enumerable_zip$104.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      others = $post_args;;
      return $send(self.$to_a(), 'zip', Opal.to_a(others));
    }, $Enumerable_zip$104.$$arity = -1);
  })($nesting[0], $nesting)
};

/* Generated by Opal 0.11.99.dev */
Opal.modules["corelib/enumerator"] = function(Opal) {
  function $rb_plus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs + rhs : lhs['$+'](rhs);
  }
  function $rb_lt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs < rhs : lhs['$<'](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice, $klass = Opal.klass, $truthy = Opal.truthy, $send = Opal.send, $falsy = Opal.falsy;

  Opal.add_stubs(['$require', '$include', '$allocate', '$new', '$to_proc', '$coerce_to', '$nil?', '$empty?', '$+', '$class', '$__send__', '$===', '$call', '$enum_for', '$size', '$destructure', '$inspect', '$any?', '$[]', '$raise', '$yield', '$each', '$enumerator_size', '$respond_to?', '$try_convert', '$<', '$for']);
  
  self.$require("corelib/enumerable");
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Enumerator');

    var $nesting = [self].concat($parent_nesting), $Enumerator_for$1, $Enumerator_initialize$2, $Enumerator_each$3, $Enumerator_size$4, $Enumerator_with_index$5, $Enumerator_inspect$7;

    self.$$prototype.size = self.$$prototype.args = self.$$prototype.object = self.$$prototype.method = nil;
    
    self.$include($$($nesting, 'Enumerable'));
    self.$$prototype.$$is_enumerator = true;
    Opal.defs(self, '$for', $Enumerator_for$1 = function(object, $a, $b) {
      var $iter = $Enumerator_for$1.$$p, block = $iter || nil, $post_args, method, args, self = this;

      if ($iter) $Enumerator_for$1.$$p = null;
      
      
      if ($iter) $Enumerator_for$1.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 1, arguments.length);
      
      if ($post_args.length > 0) {
        method = $post_args[0];
        $post_args.splice(0, 1);
      }
      if (method == null) {
        method = "each";
      };
      
      args = $post_args;;
      
      var obj = self.$allocate();

      obj.object = object;
      obj.size   = block;
      obj.method = method;
      obj.args   = args;

      return obj;
    ;
    }, $Enumerator_for$1.$$arity = -2);
    
    Opal.def(self, '$initialize', $Enumerator_initialize$2 = function $$initialize($a) {
      var $iter = $Enumerator_initialize$2.$$p, block = $iter || nil, $post_args, self = this;

      if ($iter) $Enumerator_initialize$2.$$p = null;
      
      
      if ($iter) $Enumerator_initialize$2.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      if ($truthy(block)) {
        
        self.object = $send($$($nesting, 'Generator'), 'new', [], block.$to_proc());
        self.method = "each";
        self.args = [];
        self.size = arguments[0] || nil;
        if ($truthy(self.size)) {
          return (self.size = $$($nesting, 'Opal').$coerce_to(self.size, $$($nesting, 'Integer'), "to_int"))
        } else {
          return nil
        };
      } else {
        
        self.object = arguments[0];
        self.method = arguments[1] || "each";
        self.args = $slice.call(arguments, 2);
        return (self.size = nil);
      };
    }, $Enumerator_initialize$2.$$arity = -1);
    
    Opal.def(self, '$each', $Enumerator_each$3 = function $$each($a) {
      var $iter = $Enumerator_each$3.$$p, block = $iter || nil, $post_args, args, $b, self = this;

      if ($iter) $Enumerator_each$3.$$p = null;
      
      
      if ($iter) $Enumerator_each$3.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      if ($truthy(($truthy($b = block['$nil?']()) ? args['$empty?']() : $b))) {
        return self};
      args = $rb_plus(self.args, args);
      if ($truthy(block['$nil?']())) {
        return $send(self.$class(), 'new', [self.object, self.method].concat(Opal.to_a(args)))};
      return $send(self.object, '__send__', [self.method].concat(Opal.to_a(args)), block.$to_proc());
    }, $Enumerator_each$3.$$arity = -1);
    
    Opal.def(self, '$size', $Enumerator_size$4 = function $$size() {
      var self = this;

      if ($truthy($$($nesting, 'Proc')['$==='](self.size))) {
        return $send(self.size, 'call', Opal.to_a(self.args))
      } else {
        return self.size
      }
    }, $Enumerator_size$4.$$arity = 0);
    
    Opal.def(self, '$with_index', $Enumerator_with_index$5 = function $$with_index(offset) {
      var $iter = $Enumerator_with_index$5.$$p, block = $iter || nil, $$6, self = this;

      if ($iter) $Enumerator_with_index$5.$$p = null;
      
      
      if ($iter) $Enumerator_with_index$5.$$p = null;;
      
      if (offset == null) {
        offset = 0;
      };
      offset = (function() {if ($truthy(offset)) {
        return $$($nesting, 'Opal').$coerce_to(offset, $$($nesting, 'Integer'), "to_int")
      } else {
        return 0
      }; return nil; })();
      if ($truthy(block)) {
      } else {
        return $send(self, 'enum_for', ["with_index", offset], ($$6 = function(){var self = $$6.$$s || this;

        return self.$size()}, $$6.$$s = self, $$6.$$arity = 0, $$6))
      };
      
      var result, index = offset;

      self.$each.$$p = function() {
        var param = $$($nesting, 'Opal').$destructure(arguments),
            value = block(param, index);

        index++;

        return value;
      }

      return self.$each();
    ;
    }, $Enumerator_with_index$5.$$arity = -1);
    Opal.alias(self, "with_object", "each_with_object");
    
    Opal.def(self, '$inspect', $Enumerator_inspect$7 = function $$inspect() {
      var self = this, result = nil;

      
      result = "" + "#<" + (self.$class()) + ": " + (self.object.$inspect()) + ":" + (self.method);
      if ($truthy(self.args['$any?']())) {
        result = $rb_plus(result, "" + "(" + (self.args.$inspect()['$[]']($$($nesting, 'Range').$new(1, -2))) + ")")};
      return $rb_plus(result, ">");
    }, $Enumerator_inspect$7.$$arity = 0);
    (function($base, $super, $parent_nesting) {
      var self = $klass($base, $super, 'Generator');

      var $nesting = [self].concat($parent_nesting), $Generator_initialize$8, $Generator_each$9;

      self.$$prototype.block = nil;
      
      self.$include($$($nesting, 'Enumerable'));
      
      Opal.def(self, '$initialize', $Generator_initialize$8 = function $$initialize() {
        var $iter = $Generator_initialize$8.$$p, block = $iter || nil, self = this;

        if ($iter) $Generator_initialize$8.$$p = null;
        
        
        if ($iter) $Generator_initialize$8.$$p = null;;
        if ($truthy(block)) {
        } else {
          self.$raise($$($nesting, 'LocalJumpError'), "no block given")
        };
        return (self.block = block);
      }, $Generator_initialize$8.$$arity = 0);
      return (Opal.def(self, '$each', $Generator_each$9 = function $$each($a) {
        var $iter = $Generator_each$9.$$p, block = $iter || nil, $post_args, args, self = this, yielder = nil;

        if ($iter) $Generator_each$9.$$p = null;
        
        
        if ($iter) $Generator_each$9.$$p = null;;
        
        $post_args = Opal.slice.call(arguments, 0, arguments.length);
        
        args = $post_args;;
        yielder = $send($$($nesting, 'Yielder'), 'new', [], block.$to_proc());
        
        try {
          args.unshift(yielder);

          Opal.yieldX(self.block, args);
        }
        catch (e) {
          if (e === $breaker) {
            return $breaker.$v;
          }
          else {
            throw e;
          }
        }
      ;
        return self;
      }, $Generator_each$9.$$arity = -1), nil) && 'each';
    })($nesting[0], null, $nesting);
    (function($base, $super, $parent_nesting) {
      var self = $klass($base, $super, 'Yielder');

      var $nesting = [self].concat($parent_nesting), $Yielder_initialize$10, $Yielder_yield$11, $Yielder_$lt$lt$12;

      self.$$prototype.block = nil;
      
      
      Opal.def(self, '$initialize', $Yielder_initialize$10 = function $$initialize() {
        var $iter = $Yielder_initialize$10.$$p, block = $iter || nil, self = this;

        if ($iter) $Yielder_initialize$10.$$p = null;
        
        
        if ($iter) $Yielder_initialize$10.$$p = null;;
        return (self.block = block);
      }, $Yielder_initialize$10.$$arity = 0);
      
      Opal.def(self, '$yield', $Yielder_yield$11 = function($a) {
        var $post_args, values, self = this;

        
        
        $post_args = Opal.slice.call(arguments, 0, arguments.length);
        
        values = $post_args;;
        
        var value = Opal.yieldX(self.block, values);

        if (value === $breaker) {
          throw $breaker;
        }

        return value;
      ;
      }, $Yielder_yield$11.$$arity = -1);
      return (Opal.def(self, '$<<', $Yielder_$lt$lt$12 = function($a) {
        var $post_args, values, self = this;

        
        
        $post_args = Opal.slice.call(arguments, 0, arguments.length);
        
        values = $post_args;;
        $send(self, 'yield', Opal.to_a(values));
        return self;
      }, $Yielder_$lt$lt$12.$$arity = -1), nil) && '<<';
    })($nesting[0], null, $nesting);
    return (function($base, $super, $parent_nesting) {
      var self = $klass($base, $super, 'Lazy');

      var $nesting = [self].concat($parent_nesting), $Lazy_initialize$13, $Lazy_lazy$16, $Lazy_collect$17, $Lazy_collect_concat$19, $Lazy_drop$23, $Lazy_drop_while$25, $Lazy_enum_for$27, $Lazy_find_all$28, $Lazy_grep$30, $Lazy_reject$33, $Lazy_take$35, $Lazy_take_while$37, $Lazy_inspect$39;

      self.$$prototype.enumerator = nil;
      
      (function($base, $super, $parent_nesting) {
        var self = $klass($base, $super, 'StopLazyError');

        var $nesting = [self].concat($parent_nesting);

        return nil
      })($nesting[0], $$($nesting, 'Exception'), $nesting);
      
      Opal.def(self, '$initialize', $Lazy_initialize$13 = function $$initialize(object, size) {
        var $iter = $Lazy_initialize$13.$$p, block = $iter || nil, $$14, self = this;

        if ($iter) $Lazy_initialize$13.$$p = null;
        
        
        if ($iter) $Lazy_initialize$13.$$p = null;;
        
        if (size == null) {
          size = nil;
        };
        if ((block !== nil)) {
        } else {
          self.$raise($$($nesting, 'ArgumentError'), "tried to call lazy new without a block")
        };
        self.enumerator = object;
        return $send(self, Opal.find_super_dispatcher(self, 'initialize', $Lazy_initialize$13, false), [size], ($$14 = function(yielder, $a){var self = $$14.$$s || this, $post_args, each_args, $$15;

        
          
          if (yielder == null) {
            yielder = nil;
          };
          
          $post_args = Opal.slice.call(arguments, 1, arguments.length);
          
          each_args = $post_args;;
          try {
            return $send(object, 'each', Opal.to_a(each_args), ($$15 = function($b){var self = $$15.$$s || this, $post_args, args;

            
              
              $post_args = Opal.slice.call(arguments, 0, arguments.length);
              
              args = $post_args;;
              
            args.unshift(yielder);

            Opal.yieldX(block, args);
          ;}, $$15.$$s = self, $$15.$$arity = -1, $$15))
          } catch ($err) {
            if (Opal.rescue($err, [$$($nesting, 'Exception')])) {
              try {
                return nil
              } finally { Opal.pop_exception() }
            } else { throw $err; }
          };}, $$14.$$s = self, $$14.$$arity = -2, $$14));
      }, $Lazy_initialize$13.$$arity = -2);
      Opal.alias(self, "force", "to_a");
      
      Opal.def(self, '$lazy', $Lazy_lazy$16 = function $$lazy() {
        var self = this;

        return self
      }, $Lazy_lazy$16.$$arity = 0);
      
      Opal.def(self, '$collect', $Lazy_collect$17 = function $$collect() {
        var $iter = $Lazy_collect$17.$$p, block = $iter || nil, $$18, self = this;

        if ($iter) $Lazy_collect$17.$$p = null;
        
        
        if ($iter) $Lazy_collect$17.$$p = null;;
        if ($truthy(block)) {
        } else {
          self.$raise($$($nesting, 'ArgumentError'), "tried to call lazy map without a block")
        };
        return $send($$($nesting, 'Lazy'), 'new', [self, self.$enumerator_size()], ($$18 = function(enum$, $a){var self = $$18.$$s || this, $post_args, args;

        
          
          if (enum$ == null) {
            enum$ = nil;
          };
          
          $post_args = Opal.slice.call(arguments, 1, arguments.length);
          
          args = $post_args;;
          
          var value = Opal.yieldX(block, args);

          enum$.$yield(value);
        ;}, $$18.$$s = self, $$18.$$arity = -2, $$18));
      }, $Lazy_collect$17.$$arity = 0);
      
      Opal.def(self, '$collect_concat', $Lazy_collect_concat$19 = function $$collect_concat() {
        var $iter = $Lazy_collect_concat$19.$$p, block = $iter || nil, $$20, self = this;

        if ($iter) $Lazy_collect_concat$19.$$p = null;
        
        
        if ($iter) $Lazy_collect_concat$19.$$p = null;;
        if ($truthy(block)) {
        } else {
          self.$raise($$($nesting, 'ArgumentError'), "tried to call lazy map without a block")
        };
        return $send($$($nesting, 'Lazy'), 'new', [self, nil], ($$20 = function(enum$, $a){var self = $$20.$$s || this, $post_args, args, $$21, $$22;

        
          
          if (enum$ == null) {
            enum$ = nil;
          };
          
          $post_args = Opal.slice.call(arguments, 1, arguments.length);
          
          args = $post_args;;
          
          var value = Opal.yieldX(block, args);

          if ((value)['$respond_to?']("force") && (value)['$respond_to?']("each")) {
            $send((value), 'each', [], ($$21 = function(v){var self = $$21.$$s || this;

          
            
            if (v == null) {
              v = nil;
            };
            return enum$.$yield(v);}, $$21.$$s = self, $$21.$$arity = 1, $$21))
          }
          else {
            var array = $$($nesting, 'Opal').$try_convert(value, $$($nesting, 'Array'), "to_ary");

            if (array === nil) {
              enum$.$yield(value);
            }
            else {
              $send((value), 'each', [], ($$22 = function(v){var self = $$22.$$s || this;

          
            
            if (v == null) {
              v = nil;
            };
            return enum$.$yield(v);}, $$22.$$s = self, $$22.$$arity = 1, $$22));
            }
          }
        ;}, $$20.$$s = self, $$20.$$arity = -2, $$20));
      }, $Lazy_collect_concat$19.$$arity = 0);
      
      Opal.def(self, '$drop', $Lazy_drop$23 = function $$drop(n) {
        var $$24, self = this, current_size = nil, set_size = nil, dropped = nil;

        
        n = $$($nesting, 'Opal').$coerce_to(n, $$($nesting, 'Integer'), "to_int");
        if ($truthy($rb_lt(n, 0))) {
          self.$raise($$($nesting, 'ArgumentError'), "attempt to drop negative size")};
        current_size = self.$enumerator_size();
        set_size = (function() {if ($truthy($$($nesting, 'Integer')['$==='](current_size))) {
          if ($truthy($rb_lt(n, current_size))) {
            return n
          } else {
            return current_size
          }
        } else {
          return current_size
        }; return nil; })();
        dropped = 0;
        return $send($$($nesting, 'Lazy'), 'new', [self, set_size], ($$24 = function(enum$, $a){var self = $$24.$$s || this, $post_args, args;

        
          
          if (enum$ == null) {
            enum$ = nil;
          };
          
          $post_args = Opal.slice.call(arguments, 1, arguments.length);
          
          args = $post_args;;
          if ($truthy($rb_lt(dropped, n))) {
            return (dropped = $rb_plus(dropped, 1))
          } else {
            return $send(enum$, 'yield', Opal.to_a(args))
          };}, $$24.$$s = self, $$24.$$arity = -2, $$24));
      }, $Lazy_drop$23.$$arity = 1);
      
      Opal.def(self, '$drop_while', $Lazy_drop_while$25 = function $$drop_while() {
        var $iter = $Lazy_drop_while$25.$$p, block = $iter || nil, $$26, self = this, succeeding = nil;

        if ($iter) $Lazy_drop_while$25.$$p = null;
        
        
        if ($iter) $Lazy_drop_while$25.$$p = null;;
        if ($truthy(block)) {
        } else {
          self.$raise($$($nesting, 'ArgumentError'), "tried to call lazy drop_while without a block")
        };
        succeeding = true;
        return $send($$($nesting, 'Lazy'), 'new', [self, nil], ($$26 = function(enum$, $a){var self = $$26.$$s || this, $post_args, args;

        
          
          if (enum$ == null) {
            enum$ = nil;
          };
          
          $post_args = Opal.slice.call(arguments, 1, arguments.length);
          
          args = $post_args;;
          if ($truthy(succeeding)) {
            
            var value = Opal.yieldX(block, args);

            if ($falsy(value)) {
              succeeding = false;

              $send(enum$, 'yield', Opal.to_a(args));
            }
          
          } else {
            return $send(enum$, 'yield', Opal.to_a(args))
          };}, $$26.$$s = self, $$26.$$arity = -2, $$26));
      }, $Lazy_drop_while$25.$$arity = 0);
      
      Opal.def(self, '$enum_for', $Lazy_enum_for$27 = function $$enum_for($a, $b) {
        var $iter = $Lazy_enum_for$27.$$p, block = $iter || nil, $post_args, method, args, self = this;

        if ($iter) $Lazy_enum_for$27.$$p = null;
        
        
        if ($iter) $Lazy_enum_for$27.$$p = null;;
        
        $post_args = Opal.slice.call(arguments, 0, arguments.length);
        
        if ($post_args.length > 0) {
          method = $post_args[0];
          $post_args.splice(0, 1);
        }
        if (method == null) {
          method = "each";
        };
        
        args = $post_args;;
        return $send(self.$class(), 'for', [self, method].concat(Opal.to_a(args)), block.$to_proc());
      }, $Lazy_enum_for$27.$$arity = -1);
      
      Opal.def(self, '$find_all', $Lazy_find_all$28 = function $$find_all() {
        var $iter = $Lazy_find_all$28.$$p, block = $iter || nil, $$29, self = this;

        if ($iter) $Lazy_find_all$28.$$p = null;
        
        
        if ($iter) $Lazy_find_all$28.$$p = null;;
        if ($truthy(block)) {
        } else {
          self.$raise($$($nesting, 'ArgumentError'), "tried to call lazy select without a block")
        };
        return $send($$($nesting, 'Lazy'), 'new', [self, nil], ($$29 = function(enum$, $a){var self = $$29.$$s || this, $post_args, args;

        
          
          if (enum$ == null) {
            enum$ = nil;
          };
          
          $post_args = Opal.slice.call(arguments, 1, arguments.length);
          
          args = $post_args;;
          
          var value = Opal.yieldX(block, args);

          if ($truthy(value)) {
            $send(enum$, 'yield', Opal.to_a(args));
          }
        ;}, $$29.$$s = self, $$29.$$arity = -2, $$29));
      }, $Lazy_find_all$28.$$arity = 0);
      Opal.alias(self, "flat_map", "collect_concat");
      
      Opal.def(self, '$grep', $Lazy_grep$30 = function $$grep(pattern) {
        var $iter = $Lazy_grep$30.$$p, block = $iter || nil, $$31, $$32, self = this;

        if ($iter) $Lazy_grep$30.$$p = null;
        
        
        if ($iter) $Lazy_grep$30.$$p = null;;
        if ($truthy(block)) {
          return $send($$($nesting, 'Lazy'), 'new', [self, nil], ($$31 = function(enum$, $a){var self = $$31.$$s || this, $post_args, args;

          
            
            if (enum$ == null) {
              enum$ = nil;
            };
            
            $post_args = Opal.slice.call(arguments, 1, arguments.length);
            
            args = $post_args;;
            
            var param = $$($nesting, 'Opal').$destructure(args),
                value = pattern['$==='](param);

            if ($truthy(value)) {
              value = Opal.yield1(block, param);

              enum$.$yield(Opal.yield1(block, param));
            }
          ;}, $$31.$$s = self, $$31.$$arity = -2, $$31))
        } else {
          return $send($$($nesting, 'Lazy'), 'new', [self, nil], ($$32 = function(enum$, $a){var self = $$32.$$s || this, $post_args, args;

          
            
            if (enum$ == null) {
              enum$ = nil;
            };
            
            $post_args = Opal.slice.call(arguments, 1, arguments.length);
            
            args = $post_args;;
            
            var param = $$($nesting, 'Opal').$destructure(args),
                value = pattern['$==='](param);

            if ($truthy(value)) {
              enum$.$yield(param);
            }
          ;}, $$32.$$s = self, $$32.$$arity = -2, $$32))
        };
      }, $Lazy_grep$30.$$arity = 1);
      Opal.alias(self, "map", "collect");
      Opal.alias(self, "select", "find_all");
      
      Opal.def(self, '$reject', $Lazy_reject$33 = function $$reject() {
        var $iter = $Lazy_reject$33.$$p, block = $iter || nil, $$34, self = this;

        if ($iter) $Lazy_reject$33.$$p = null;
        
        
        if ($iter) $Lazy_reject$33.$$p = null;;
        if ($truthy(block)) {
        } else {
          self.$raise($$($nesting, 'ArgumentError'), "tried to call lazy reject without a block")
        };
        return $send($$($nesting, 'Lazy'), 'new', [self, nil], ($$34 = function(enum$, $a){var self = $$34.$$s || this, $post_args, args;

        
          
          if (enum$ == null) {
            enum$ = nil;
          };
          
          $post_args = Opal.slice.call(arguments, 1, arguments.length);
          
          args = $post_args;;
          
          var value = Opal.yieldX(block, args);

          if ($falsy(value)) {
            $send(enum$, 'yield', Opal.to_a(args));
          }
        ;}, $$34.$$s = self, $$34.$$arity = -2, $$34));
      }, $Lazy_reject$33.$$arity = 0);
      
      Opal.def(self, '$take', $Lazy_take$35 = function $$take(n) {
        var $$36, self = this, current_size = nil, set_size = nil, taken = nil;

        
        n = $$($nesting, 'Opal').$coerce_to(n, $$($nesting, 'Integer'), "to_int");
        if ($truthy($rb_lt(n, 0))) {
          self.$raise($$($nesting, 'ArgumentError'), "attempt to take negative size")};
        current_size = self.$enumerator_size();
        set_size = (function() {if ($truthy($$($nesting, 'Integer')['$==='](current_size))) {
          if ($truthy($rb_lt(n, current_size))) {
            return n
          } else {
            return current_size
          }
        } else {
          return current_size
        }; return nil; })();
        taken = 0;
        return $send($$($nesting, 'Lazy'), 'new', [self, set_size], ($$36 = function(enum$, $a){var self = $$36.$$s || this, $post_args, args;

        
          
          if (enum$ == null) {
            enum$ = nil;
          };
          
          $post_args = Opal.slice.call(arguments, 1, arguments.length);
          
          args = $post_args;;
          if ($truthy($rb_lt(taken, n))) {
            
            $send(enum$, 'yield', Opal.to_a(args));
            return (taken = $rb_plus(taken, 1));
          } else {
            return self.$raise($$($nesting, 'StopLazyError'))
          };}, $$36.$$s = self, $$36.$$arity = -2, $$36));
      }, $Lazy_take$35.$$arity = 1);
      
      Opal.def(self, '$take_while', $Lazy_take_while$37 = function $$take_while() {
        var $iter = $Lazy_take_while$37.$$p, block = $iter || nil, $$38, self = this;

        if ($iter) $Lazy_take_while$37.$$p = null;
        
        
        if ($iter) $Lazy_take_while$37.$$p = null;;
        if ($truthy(block)) {
        } else {
          self.$raise($$($nesting, 'ArgumentError'), "tried to call lazy take_while without a block")
        };
        return $send($$($nesting, 'Lazy'), 'new', [self, nil], ($$38 = function(enum$, $a){var self = $$38.$$s || this, $post_args, args;

        
          
          if (enum$ == null) {
            enum$ = nil;
          };
          
          $post_args = Opal.slice.call(arguments, 1, arguments.length);
          
          args = $post_args;;
          
          var value = Opal.yieldX(block, args);

          if ($truthy(value)) {
            $send(enum$, 'yield', Opal.to_a(args));
          }
          else {
            self.$raise($$($nesting, 'StopLazyError'));
          }
        ;}, $$38.$$s = self, $$38.$$arity = -2, $$38));
      }, $Lazy_take_while$37.$$arity = 0);
      Opal.alias(self, "to_enum", "enum_for");
      return (Opal.def(self, '$inspect', $Lazy_inspect$39 = function $$inspect() {
        var self = this;

        return "" + "#<" + (self.$class()) + ": " + (self.enumerator.$inspect()) + ">"
      }, $Lazy_inspect$39.$$arity = 0), nil) && 'inspect';
    })($nesting[0], self, $nesting);
  })($nesting[0], null, $nesting);
};

/* Generated by Opal 0.11.99.dev */
Opal.modules["corelib/numeric"] = function(Opal) {
  function $rb_minus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs - rhs : lhs['$-'](rhs);
  }
  function $rb_times(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs * rhs : lhs['$*'](rhs);
  }
  function $rb_lt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs < rhs : lhs['$<'](rhs);
  }
  function $rb_divide(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs / rhs : lhs['$/'](rhs);
  }
  function $rb_gt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs > rhs : lhs['$>'](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice, $klass = Opal.klass, $truthy = Opal.truthy, $hash2 = Opal.hash2;

  Opal.add_stubs(['$require', '$include', '$instance_of?', '$class', '$Float', '$respond_to?', '$coerce', '$__send__', '$===', '$raise', '$equal?', '$-', '$*', '$div', '$<', '$-@', '$ceil', '$to_f', '$denominator', '$to_r', '$==', '$floor', '$/', '$%', '$Complex', '$zero?', '$numerator', '$abs', '$arg', '$coerce_to!', '$round', '$to_i', '$truncate', '$>']);
  
  self.$require("corelib/comparable");
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Numeric');

    var $nesting = [self].concat($parent_nesting), $Numeric_coerce$1, $Numeric___coerced__$2, $Numeric_$lt_eq_gt$3, $Numeric_$plus$$4, $Numeric_$minus$$5, $Numeric_$percent$6, $Numeric_abs$7, $Numeric_abs2$8, $Numeric_angle$9, $Numeric_ceil$10, $Numeric_conj$11, $Numeric_denominator$12, $Numeric_div$13, $Numeric_divmod$14, $Numeric_fdiv$15, $Numeric_floor$16, $Numeric_i$17, $Numeric_imag$18, $Numeric_integer$ques$19, $Numeric_nonzero$ques$20, $Numeric_numerator$21, $Numeric_polar$22, $Numeric_quo$23, $Numeric_real$24, $Numeric_real$ques$25, $Numeric_rect$26, $Numeric_round$27, $Numeric_to_c$28, $Numeric_to_int$29, $Numeric_truncate$30, $Numeric_zero$ques$31, $Numeric_positive$ques$32, $Numeric_negative$ques$33, $Numeric_dup$34, $Numeric_clone$35, $Numeric_finite$ques$36, $Numeric_infinite$ques$37;

    
    self.$include($$($nesting, 'Comparable'));
    
    Opal.def(self, '$coerce', $Numeric_coerce$1 = function $$coerce(other) {
      var self = this;

      
      if ($truthy(other['$instance_of?'](self.$class()))) {
        return [other, self]};
      return [self.$Float(other), self.$Float(self)];
    }, $Numeric_coerce$1.$$arity = 1);
    
    Opal.def(self, '$__coerced__', $Numeric___coerced__$2 = function $$__coerced__(method, other) {
      var $a, $b, self = this, a = nil, b = nil, $case = nil;

      if ($truthy(other['$respond_to?']("coerce"))) {
        
        $b = other.$coerce(self), $a = Opal.to_ary($b), (a = ($a[0] == null ? nil : $a[0])), (b = ($a[1] == null ? nil : $a[1])), $b;
        return a.$__send__(method, b);
      } else {
        return (function() {$case = method;
        if ("+"['$===']($case) || "-"['$===']($case) || "*"['$===']($case) || "/"['$===']($case) || "%"['$===']($case) || "&"['$===']($case) || "|"['$===']($case) || "^"['$===']($case) || "**"['$===']($case)) {return self.$raise($$($nesting, 'TypeError'), "" + (other.$class()) + " can't be coerced into Numeric")}
        else if (">"['$===']($case) || ">="['$===']($case) || "<"['$===']($case) || "<="['$===']($case) || "<=>"['$===']($case)) {return self.$raise($$($nesting, 'ArgumentError'), "" + "comparison of " + (self.$class()) + " with " + (other.$class()) + " failed")}
        else { return nil }})()
      }
    }, $Numeric___coerced__$2.$$arity = 2);
    
    Opal.def(self, '$<=>', $Numeric_$lt_eq_gt$3 = function(other) {
      var self = this;

      
      if ($truthy(self['$equal?'](other))) {
        return 0};
      return nil;
    }, $Numeric_$lt_eq_gt$3.$$arity = 1);
    
    Opal.def(self, '$+@', $Numeric_$plus$$4 = function() {
      var self = this;

      return self
    }, $Numeric_$plus$$4.$$arity = 0);
    
    Opal.def(self, '$-@', $Numeric_$minus$$5 = function() {
      var self = this;

      return $rb_minus(0, self)
    }, $Numeric_$minus$$5.$$arity = 0);
    
    Opal.def(self, '$%', $Numeric_$percent$6 = function(other) {
      var self = this;

      return $rb_minus(self, $rb_times(other, self.$div(other)))
    }, $Numeric_$percent$6.$$arity = 1);
    
    Opal.def(self, '$abs', $Numeric_abs$7 = function $$abs() {
      var self = this;

      if ($rb_lt(self, 0)) {
        return self['$-@']()
      } else {
        return self
      }
    }, $Numeric_abs$7.$$arity = 0);
    
    Opal.def(self, '$abs2', $Numeric_abs2$8 = function $$abs2() {
      var self = this;

      return $rb_times(self, self)
    }, $Numeric_abs2$8.$$arity = 0);
    
    Opal.def(self, '$angle', $Numeric_angle$9 = function $$angle() {
      var self = this;

      if ($rb_lt(self, 0)) {
        return $$$($$($nesting, 'Math'), 'PI')
      } else {
        return 0
      }
    }, $Numeric_angle$9.$$arity = 0);
    Opal.alias(self, "arg", "angle");
    
    Opal.def(self, '$ceil', $Numeric_ceil$10 = function $$ceil(ndigits) {
      var self = this;

      
      
      if (ndigits == null) {
        ndigits = 0;
      };
      return self.$to_f().$ceil(ndigits);
    }, $Numeric_ceil$10.$$arity = -1);
    
    Opal.def(self, '$conj', $Numeric_conj$11 = function $$conj() {
      var self = this;

      return self
    }, $Numeric_conj$11.$$arity = 0);
    Opal.alias(self, "conjugate", "conj");
    
    Opal.def(self, '$denominator', $Numeric_denominator$12 = function $$denominator() {
      var self = this;

      return self.$to_r().$denominator()
    }, $Numeric_denominator$12.$$arity = 0);
    
    Opal.def(self, '$div', $Numeric_div$13 = function $$div(other) {
      var self = this;

      
      if (other['$=='](0)) {
        self.$raise($$($nesting, 'ZeroDivisionError'), "divided by o")};
      return $rb_divide(self, other).$floor();
    }, $Numeric_div$13.$$arity = 1);
    
    Opal.def(self, '$divmod', $Numeric_divmod$14 = function $$divmod(other) {
      var self = this;

      return [self.$div(other), self['$%'](other)]
    }, $Numeric_divmod$14.$$arity = 1);
    
    Opal.def(self, '$fdiv', $Numeric_fdiv$15 = function $$fdiv(other) {
      var self = this;

      return $rb_divide(self.$to_f(), other)
    }, $Numeric_fdiv$15.$$arity = 1);
    
    Opal.def(self, '$floor', $Numeric_floor$16 = function $$floor(ndigits) {
      var self = this;

      
      
      if (ndigits == null) {
        ndigits = 0;
      };
      return self.$to_f().$floor(ndigits);
    }, $Numeric_floor$16.$$arity = -1);
    
    Opal.def(self, '$i', $Numeric_i$17 = function $$i() {
      var self = this;

      return self.$Complex(0, self)
    }, $Numeric_i$17.$$arity = 0);
    
    Opal.def(self, '$imag', $Numeric_imag$18 = function $$imag() {
      var self = this;

      return 0
    }, $Numeric_imag$18.$$arity = 0);
    Opal.alias(self, "imaginary", "imag");
    
    Opal.def(self, '$integer?', $Numeric_integer$ques$19 = function() {
      var self = this;

      return false
    }, $Numeric_integer$ques$19.$$arity = 0);
    Opal.alias(self, "magnitude", "abs");
    Opal.alias(self, "modulo", "%");
    
    Opal.def(self, '$nonzero?', $Numeric_nonzero$ques$20 = function() {
      var self = this;

      if ($truthy(self['$zero?']())) {
        return nil
      } else {
        return self
      }
    }, $Numeric_nonzero$ques$20.$$arity = 0);
    
    Opal.def(self, '$numerator', $Numeric_numerator$21 = function $$numerator() {
      var self = this;

      return self.$to_r().$numerator()
    }, $Numeric_numerator$21.$$arity = 0);
    Opal.alias(self, "phase", "arg");
    
    Opal.def(self, '$polar', $Numeric_polar$22 = function $$polar() {
      var self = this;

      return [self.$abs(), self.$arg()]
    }, $Numeric_polar$22.$$arity = 0);
    
    Opal.def(self, '$quo', $Numeric_quo$23 = function $$quo(other) {
      var self = this;

      return $rb_divide($$($nesting, 'Opal')['$coerce_to!'](self, $$($nesting, 'Rational'), "to_r"), other)
    }, $Numeric_quo$23.$$arity = 1);
    
    Opal.def(self, '$real', $Numeric_real$24 = function $$real() {
      var self = this;

      return self
    }, $Numeric_real$24.$$arity = 0);
    
    Opal.def(self, '$real?', $Numeric_real$ques$25 = function() {
      var self = this;

      return true
    }, $Numeric_real$ques$25.$$arity = 0);
    
    Opal.def(self, '$rect', $Numeric_rect$26 = function $$rect() {
      var self = this;

      return [self, 0]
    }, $Numeric_rect$26.$$arity = 0);
    Opal.alias(self, "rectangular", "rect");
    
    Opal.def(self, '$round', $Numeric_round$27 = function $$round(digits) {
      var self = this;

      
      ;
      return self.$to_f().$round(digits);
    }, $Numeric_round$27.$$arity = -1);
    
    Opal.def(self, '$to_c', $Numeric_to_c$28 = function $$to_c() {
      var self = this;

      return self.$Complex(self, 0)
    }, $Numeric_to_c$28.$$arity = 0);
    
    Opal.def(self, '$to_int', $Numeric_to_int$29 = function $$to_int() {
      var self = this;

      return self.$to_i()
    }, $Numeric_to_int$29.$$arity = 0);
    
    Opal.def(self, '$truncate', $Numeric_truncate$30 = function $$truncate(ndigits) {
      var self = this;

      
      
      if (ndigits == null) {
        ndigits = 0;
      };
      return self.$to_f().$truncate(ndigits);
    }, $Numeric_truncate$30.$$arity = -1);
    
    Opal.def(self, '$zero?', $Numeric_zero$ques$31 = function() {
      var self = this;

      return self['$=='](0)
    }, $Numeric_zero$ques$31.$$arity = 0);
    
    Opal.def(self, '$positive?', $Numeric_positive$ques$32 = function() {
      var self = this;

      return $rb_gt(self, 0)
    }, $Numeric_positive$ques$32.$$arity = 0);
    
    Opal.def(self, '$negative?', $Numeric_negative$ques$33 = function() {
      var self = this;

      return $rb_lt(self, 0)
    }, $Numeric_negative$ques$33.$$arity = 0);
    
    Opal.def(self, '$dup', $Numeric_dup$34 = function $$dup() {
      var self = this;

      return self
    }, $Numeric_dup$34.$$arity = 0);
    
    Opal.def(self, '$clone', $Numeric_clone$35 = function $$clone($kwargs) {
      var freeze, self = this;

      
      
      if ($kwargs == null) {
        $kwargs = $hash2([], {});
      } else if (!$kwargs.$$is_hash) {
        throw Opal.ArgumentError.$new('expected kwargs');
      };
      
      freeze = $kwargs.$$smap["freeze"];
      if (freeze == null) {
        freeze = true
      };
      return self;
    }, $Numeric_clone$35.$$arity = -1);
    
    Opal.def(self, '$finite?', $Numeric_finite$ques$36 = function() {
      var self = this;

      return true
    }, $Numeric_finite$ques$36.$$arity = 0);
    return (Opal.def(self, '$infinite?', $Numeric_infinite$ques$37 = function() {
      var self = this;

      return nil
    }, $Numeric_infinite$ques$37.$$arity = 0), nil) && 'infinite?';
  })($nesting[0], null, $nesting);
};

/* Generated by Opal 0.11.99.dev */
Opal.modules["corelib/array"] = function(Opal) {
  function $rb_gt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs > rhs : lhs['$>'](rhs);
  }
  function $rb_times(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs * rhs : lhs['$*'](rhs);
  }
  function $rb_ge(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs >= rhs : lhs['$>='](rhs);
  }
  function $rb_lt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs < rhs : lhs['$<'](rhs);
  }
  function $rb_minus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs - rhs : lhs['$-'](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice, $klass = Opal.klass, $truthy = Opal.truthy, $hash2 = Opal.hash2, $send = Opal.send, $gvars = Opal.gvars;

  Opal.add_stubs(['$require', '$include', '$to_a', '$warn', '$raise', '$replace', '$respond_to?', '$to_ary', '$coerce_to', '$coerce_to?', '$===', '$join', '$to_str', '$class', '$hash', '$<=>', '$==', '$object_id', '$inspect', '$enum_for', '$bsearch_index', '$to_proc', '$nil?', '$coerce_to!', '$>', '$*', '$enumerator_size', '$empty?', '$size', '$map', '$equal?', '$dup', '$each', '$[]', '$dig', '$eql?', '$length', '$begin', '$end', '$exclude_end?', '$flatten', '$__id__', '$to_s', '$new', '$max', '$min', '$!', '$>=', '$**', '$delete_if', '$reverse', '$rotate', '$rand', '$at', '$keep_if', '$shuffle!', '$<', '$sort', '$sort_by', '$!=', '$times', '$[]=', '$-', '$<<', '$values', '$is_a?', '$last', '$first', '$upto', '$reject', '$pristine', '$singleton_class']);
  
  self.$require("corelib/enumerable");
  self.$require("corelib/numeric");
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Array');

    var $nesting = [self].concat($parent_nesting), $Array_$$$1, $Array_initialize$2, $Array_try_convert$3, $Array_$$4, $Array_$$5, $Array_$$6, $Array_$plus$7, $Array_$minus$8, $Array_$lt$lt$9, $Array_$lt_eq_gt$10, $Array_$eq_eq$11, $Array_$$$12, $Array_$$$eq$13, $Array_any$ques$14, $Array_assoc$15, $Array_at$16, $Array_bsearch_index$17, $Array_bsearch$18, $Array_cycle$19, $Array_clear$21, $Array_count$22, $Array_initialize_copy$23, $Array_collect$24, $Array_collect$excl$26, $Array_combination$28, $Array_repeated_combination$30, $Array_compact$32, $Array_compact$excl$33, $Array_concat$34, $Array_delete$37, $Array_delete_at$38, $Array_delete_if$39, $Array_dig$41, $Array_drop$42, $Array_dup$43, $Array_each$44, $Array_each_index$46, $Array_empty$ques$48, $Array_eql$ques$49, $Array_fetch$50, $Array_fill$51, $Array_first$52, $Array_flatten$53, $Array_flatten$excl$54, $Array_hash$55, $Array_include$ques$56, $Array_index$57, $Array_insert$58, $Array_inspect$59, $Array_join$60, $Array_keep_if$61, $Array_last$63, $Array_length$64, $Array_max$65, $Array_min$66, $Array_permutation$67, $Array_repeated_permutation$69, $Array_pop$71, $Array_product$72, $Array_push$73, $Array_rassoc$74, $Array_reject$75, $Array_reject$excl$77, $Array_replace$79, $Array_reverse$80, $Array_reverse$excl$81, $Array_reverse_each$82, $Array_rindex$84, $Array_rotate$85, $Array_rotate$excl$86, $Array_sample$89, $Array_select$90, $Array_select$excl$92, $Array_shift$94, $Array_shuffle$95, $Array_shuffle$excl$96, $Array_slice$excl$97, $Array_sort$98, $Array_sort$excl$99, $Array_sort_by$excl$100, $Array_take$102, $Array_take_while$103, $Array_to_a$104, $Array_to_h$105, $Array_transpose$106, $Array_uniq$109, $Array_uniq$excl$110, $Array_unshift$111, $Array_values_at$112, $Array_zip$115, $Array_inherited$116, $Array_instance_variables$117, $Array_pack$119;

    
    self.$include($$($nesting, 'Enumerable'));
    Opal.defineProperty(self.$$prototype, '$$is_array', true);
    
    function toArraySubclass(obj, klass) {
      if (klass.$$name === Opal.Array) {
        return obj;
      } else {
        return klass.$allocate().$replace((obj).$to_a());
      }
    }
  ;
    Opal.defs(self, '$[]', $Array_$$$1 = function($a) {
      var $post_args, objects, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      objects = $post_args;;
      return toArraySubclass(objects, self);;
    }, $Array_$$$1.$$arity = -1);
    
    Opal.def(self, '$initialize', $Array_initialize$2 = function $$initialize(size, obj) {
      var $iter = $Array_initialize$2.$$p, block = $iter || nil, self = this;

      if ($iter) $Array_initialize$2.$$p = null;
      
      
      if ($iter) $Array_initialize$2.$$p = null;;
      
      if (size == null) {
        size = nil;
      };
      
      if (obj == null) {
        obj = nil;
      };
      
      if (obj !== nil && block !== nil) {
        self.$warn("warning: block supersedes default value argument")
      }

      if (size > $$$($$($nesting, 'Integer'), 'MAX')) {
        self.$raise($$($nesting, 'ArgumentError'), "array size too big")
      }

      if (arguments.length > 2) {
        self.$raise($$($nesting, 'ArgumentError'), "" + "wrong number of arguments (" + (arguments.length) + " for 0..2)")
      }

      if (arguments.length === 0) {
        self.splice(0, self.length);
        return self;
      }

      if (arguments.length === 1) {
        if (size.$$is_array) {
          self.$replace(size.$to_a())
          return self;
        } else if (size['$respond_to?']("to_ary")) {
          self.$replace(size.$to_ary())
          return self;
        }
      }

      size = $$($nesting, 'Opal').$coerce_to(size, $$($nesting, 'Integer'), "to_int")

      if (size < 0) {
        self.$raise($$($nesting, 'ArgumentError'), "negative array size")
      }

      self.splice(0, self.length);
      var i, value;

      if (block === nil) {
        for (i = 0; i < size; i++) {
          self.push(obj);
        }
      }
      else {
        for (i = 0, value; i < size; i++) {
          value = block(i);
          self[i] = value;
        }
      }

      return self;
    ;
    }, $Array_initialize$2.$$arity = -1);
    Opal.defs(self, '$try_convert', $Array_try_convert$3 = function $$try_convert(obj) {
      var self = this;

      return $$($nesting, 'Opal')['$coerce_to?'](obj, $$($nesting, 'Array'), "to_ary")
    }, $Array_try_convert$3.$$arity = 1);
    
    Opal.def(self, '$&', $Array_$$4 = function(other) {
      var self = this;

      
      other = (function() {if ($truthy($$($nesting, 'Array')['$==='](other))) {
        return other.$to_a()
      } else {
        return $$($nesting, 'Opal').$coerce_to(other, $$($nesting, 'Array'), "to_ary").$to_a()
      }; return nil; })();
      
      var result = [], hash = $hash2([], {}), i, length, item;

      for (i = 0, length = other.length; i < length; i++) {
        Opal.hash_put(hash, other[i], true);
      }

      for (i = 0, length = self.length; i < length; i++) {
        item = self[i];
        if (Opal.hash_delete(hash, item) !== undefined) {
          result.push(item);
        }
      }

      return result;
    ;
    }, $Array_$$4.$$arity = 1);
    
    Opal.def(self, '$|', $Array_$$5 = function(other) {
      var self = this;

      
      other = (function() {if ($truthy($$($nesting, 'Array')['$==='](other))) {
        return other.$to_a()
      } else {
        return $$($nesting, 'Opal').$coerce_to(other, $$($nesting, 'Array'), "to_ary").$to_a()
      }; return nil; })();
      
      var hash = $hash2([], {}), i, length, item;

      for (i = 0, length = self.length; i < length; i++) {
        Opal.hash_put(hash, self[i], true);
      }

      for (i = 0, length = other.length; i < length; i++) {
        Opal.hash_put(hash, other[i], true);
      }

      return hash.$keys();
    ;
    }, $Array_$$5.$$arity = 1);
    
    Opal.def(self, '$*', $Array_$$6 = function(other) {
      var self = this;

      
      if ($truthy(other['$respond_to?']("to_str"))) {
        return self.$join(other.$to_str())};
      other = $$($nesting, 'Opal').$coerce_to(other, $$($nesting, 'Integer'), "to_int");
      if ($truthy(other < 0)) {
        self.$raise($$($nesting, 'ArgumentError'), "negative argument")};
      
      var result = [],
          converted = self.$to_a();

      for (var i = 0; i < other; i++) {
        result = result.concat(converted);
      }

      return toArraySubclass(result, self.$class());
    ;
    }, $Array_$$6.$$arity = 1);
    
    Opal.def(self, '$+', $Array_$plus$7 = function(other) {
      var self = this;

      
      other = (function() {if ($truthy($$($nesting, 'Array')['$==='](other))) {
        return other.$to_a()
      } else {
        return $$($nesting, 'Opal').$coerce_to(other, $$($nesting, 'Array'), "to_ary").$to_a()
      }; return nil; })();
      return self.concat(other);;
    }, $Array_$plus$7.$$arity = 1);
    
    Opal.def(self, '$-', $Array_$minus$8 = function(other) {
      var self = this;

      
      other = (function() {if ($truthy($$($nesting, 'Array')['$==='](other))) {
        return other.$to_a()
      } else {
        return $$($nesting, 'Opal').$coerce_to(other, $$($nesting, 'Array'), "to_ary").$to_a()
      }; return nil; })();
      if ($truthy(self.length === 0)) {
        return []};
      if ($truthy(other.length === 0)) {
        return self.slice()};
      
      var result = [], hash = $hash2([], {}), i, length, item;

      for (i = 0, length = other.length; i < length; i++) {
        Opal.hash_put(hash, other[i], true);
      }

      for (i = 0, length = self.length; i < length; i++) {
        item = self[i];
        if (Opal.hash_get(hash, item) === undefined) {
          result.push(item);
        }
      }

      return result;
    ;
    }, $Array_$minus$8.$$arity = 1);
    
    Opal.def(self, '$<<', $Array_$lt$lt$9 = function(object) {
      var self = this;

      
      self.push(object);
      return self;
    }, $Array_$lt$lt$9.$$arity = 1);
    
    Opal.def(self, '$<=>', $Array_$lt_eq_gt$10 = function(other) {
      var self = this;

      
      if ($truthy($$($nesting, 'Array')['$==='](other))) {
        other = other.$to_a()
      } else if ($truthy(other['$respond_to?']("to_ary"))) {
        other = other.$to_ary().$to_a()
      } else {
        return nil
      };
      
      if (self.$hash() === other.$hash()) {
        return 0;
      }

      var count = Math.min(self.length, other.length);

      for (var i = 0; i < count; i++) {
        var tmp = (self[i])['$<=>'](other[i]);

        if (tmp !== 0) {
          return tmp;
        }
      }

      return (self.length)['$<=>'](other.length);
    ;
    }, $Array_$lt_eq_gt$10.$$arity = 1);
    
    Opal.def(self, '$==', $Array_$eq_eq$11 = function(other) {
      var self = this;

      
      var recursed = {};

      function _eqeq(array, other) {
        var i, length, a, b;

        if (array === other)
          return true;

        if (!other.$$is_array) {
          if ($$($nesting, 'Opal')['$respond_to?'](other, "to_ary")) {
            return (other)['$=='](array);
          } else {
            return false;
          }
        }

        if (array.$$constructor !== Array)
          array = (array).$to_a();
        if (other.$$constructor !== Array)
          other = (other).$to_a();

        if (array.length !== other.length) {
          return false;
        }

        recursed[(array).$object_id()] = true;

        for (i = 0, length = array.length; i < length; i++) {
          a = array[i];
          b = other[i];
          if (a.$$is_array) {
            if (b.$$is_array && b.length !== a.length) {
              return false;
            }
            if (!recursed.hasOwnProperty((a).$object_id())) {
              if (!_eqeq(a, b)) {
                return false;
              }
            }
          } else {
            if (!(a)['$=='](b)) {
              return false;
            }
          }
        }

        return true;
      }

      return _eqeq(self, other);
    
    }, $Array_$eq_eq$11.$$arity = 1);
    
    function $array_slice_range(self, index) {
      var size = self.length,
          exclude, from, to, result;

      exclude = index.excl;
      from    = Opal.Opal.$coerce_to(index.begin, Opal.Integer, 'to_int');
      to      = Opal.Opal.$coerce_to(index.end, Opal.Integer, 'to_int');

      if (from < 0) {
        from += size;

        if (from < 0) {
          return nil;
        }
      }

      if (from > size) {
        return nil;
      }

      if (to < 0) {
        to += size;

        if (to < 0) {
          return [];
        }
      }

      if (!exclude) {
        to += 1;
      }

      result = self.slice(from, to);
      return toArraySubclass(result, self.$class());
    }

    function $array_slice_index_length(self, index, length) {
      var size = self.length,
          exclude, from, to, result;

      index = Opal.Opal.$coerce_to(index, Opal.Integer, 'to_int');

      if (index < 0) {
        index += size;

        if (index < 0) {
          return nil;
        }
      }

      if (length === undefined) {
        if (index >= size || index < 0) {
          return nil;
        }

        return self[index];
      }
      else {
        length = Opal.Opal.$coerce_to(length, Opal.Integer, 'to_int');

        if (length < 0 || index > size || index < 0) {
          return nil;
        }

        result = self.slice(index, index + length);
      }
      return toArraySubclass(result, self.$class());
    }
  ;
    
    Opal.def(self, '$[]', $Array_$$$12 = function(index, length) {
      var self = this;

      
      ;
      
      if (index.$$is_range) {
        return $array_slice_range(self, index);
      }
      else {
        return $array_slice_index_length(self, index, length);
      }
    ;
    }, $Array_$$$12.$$arity = -2);
    
    Opal.def(self, '$[]=', $Array_$$$eq$13 = function(index, value, extra) {
      var self = this, data = nil, length = nil;

      
      ;
            var i, size = self.length;;
      if ($truthy($$($nesting, 'Range')['$==='](index))) {
        
        data = (function() {if ($truthy($$($nesting, 'Array')['$==='](value))) {
          return value.$to_a()
        } else if ($truthy(value['$respond_to?']("to_ary"))) {
          return value.$to_ary().$to_a()
        } else {
          return [value]
        }; return nil; })();
        
        var exclude = index.excl,
            from    = $$($nesting, 'Opal').$coerce_to(index.begin, $$($nesting, 'Integer'), "to_int"),
            to      = $$($nesting, 'Opal').$coerce_to(index.end, $$($nesting, 'Integer'), "to_int");

        if (from < 0) {
          from += size;

          if (from < 0) {
            self.$raise($$($nesting, 'RangeError'), "" + (index.$inspect()) + " out of range");
          }
        }

        if (to < 0) {
          to += size;
        }

        if (!exclude) {
          to += 1;
        }

        if (from > size) {
          for (i = size; i < from; i++) {
            self[i] = nil;
          }
        }

        if (to < 0) {
          self.splice.apply(self, [from, 0].concat(data));
        }
        else {
          self.splice.apply(self, [from, to - from].concat(data));
        }

        return value;
      ;
      } else {
        
        if ($truthy(extra === undefined)) {
          length = 1
        } else {
          
          length = value;
          value = extra;
          data = (function() {if ($truthy($$($nesting, 'Array')['$==='](value))) {
            return value.$to_a()
          } else if ($truthy(value['$respond_to?']("to_ary"))) {
            return value.$to_ary().$to_a()
          } else {
            return [value]
          }; return nil; })();
        };
        
        var old;

        index  = $$($nesting, 'Opal').$coerce_to(index, $$($nesting, 'Integer'), "to_int");
        length = $$($nesting, 'Opal').$coerce_to(length, $$($nesting, 'Integer'), "to_int");

        if (index < 0) {
          old    = index;
          index += size;

          if (index < 0) {
            self.$raise($$($nesting, 'IndexError'), "" + "index " + (old) + " too small for array; minimum " + (-self.length));
          }
        }

        if (length < 0) {
          self.$raise($$($nesting, 'IndexError'), "" + "negative length (" + (length) + ")")
        }

        if (index > size) {
          for (i = size; i < index; i++) {
            self[i] = nil;
          }
        }

        if (extra === undefined) {
          self[index] = value;
        }
        else {
          self.splice.apply(self, [index, length].concat(data));
        }

        return value;
      ;
      };
    }, $Array_$$$eq$13.$$arity = -3);
    
    Opal.def(self, '$any?', $Array_any$ques$14 = function(pattern) {
      var $iter = $Array_any$ques$14.$$p, block = $iter || nil, self = this, $zuper = nil, $zuper_i = nil, $zuper_ii = nil;

      if ($iter) $Array_any$ques$14.$$p = null;
      // Prepare super implicit arguments
      for($zuper_i = 0, $zuper_ii = arguments.length, $zuper = new Array($zuper_ii); $zuper_i < $zuper_ii; $zuper_i++) {
        $zuper[$zuper_i] = arguments[$zuper_i];
      }
      
      
      if ($iter) $Array_any$ques$14.$$p = null;;
      ;
      if (self.length === 0) return false;
      return $send(self, Opal.find_super_dispatcher(self, 'any?', $Array_any$ques$14, false), $zuper, $iter);
    }, $Array_any$ques$14.$$arity = -1);
    
    Opal.def(self, '$assoc', $Array_assoc$15 = function $$assoc(object) {
      var self = this;

      
      for (var i = 0, length = self.length, item; i < length; i++) {
        if (item = self[i], item.length && (item[0])['$=='](object)) {
          return item;
        }
      }

      return nil;
    
    }, $Array_assoc$15.$$arity = 1);
    
    Opal.def(self, '$at', $Array_at$16 = function $$at(index) {
      var self = this;

      
      index = $$($nesting, 'Opal').$coerce_to(index, $$($nesting, 'Integer'), "to_int");
      
      if (index < 0) {
        index += self.length;
      }

      if (index < 0 || index >= self.length) {
        return nil;
      }

      return self[index];
    ;
    }, $Array_at$16.$$arity = 1);
    
    Opal.def(self, '$bsearch_index', $Array_bsearch_index$17 = function $$bsearch_index() {
      var $iter = $Array_bsearch_index$17.$$p, block = $iter || nil, self = this;

      if ($iter) $Array_bsearch_index$17.$$p = null;
      
      
      if ($iter) $Array_bsearch_index$17.$$p = null;;
      if ((block !== nil)) {
      } else {
        return self.$enum_for("bsearch_index")
      };
      
      var min = 0,
          max = self.length,
          mid,
          val,
          ret,
          smaller = false,
          satisfied = nil;

      while (min < max) {
        mid = min + Math.floor((max - min) / 2);
        val = self[mid];
        ret = Opal.yield1(block, val);

        if (ret === true) {
          satisfied = mid;
          smaller = true;
        }
        else if (ret === false || ret === nil) {
          smaller = false;
        }
        else if (ret.$$is_number) {
          if (ret === 0) { return mid; }
          smaller = (ret < 0);
        }
        else {
          self.$raise($$($nesting, 'TypeError'), "" + "wrong argument type " + ((ret).$class()) + " (must be numeric, true, false or nil)")
        }

        if (smaller) { max = mid; } else { min = mid + 1; }
      }

      return satisfied;
    ;
    }, $Array_bsearch_index$17.$$arity = 0);
    
    Opal.def(self, '$bsearch', $Array_bsearch$18 = function $$bsearch() {
      var $iter = $Array_bsearch$18.$$p, block = $iter || nil, self = this, index = nil;

      if ($iter) $Array_bsearch$18.$$p = null;
      
      
      if ($iter) $Array_bsearch$18.$$p = null;;
      if ((block !== nil)) {
      } else {
        return self.$enum_for("bsearch")
      };
      index = $send(self, 'bsearch_index', [], block.$to_proc());
      
      if (index != null && index.$$is_number) {
        return self[index];
      } else {
        return index;
      }
    ;
    }, $Array_bsearch$18.$$arity = 0);
    
    Opal.def(self, '$cycle', $Array_cycle$19 = function $$cycle(n) {
      var $iter = $Array_cycle$19.$$p, block = $iter || nil, $$20, $a, self = this;

      if ($iter) $Array_cycle$19.$$p = null;
      
      
      if ($iter) $Array_cycle$19.$$p = null;;
      
      if (n == null) {
        n = nil;
      };
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["cycle", n], ($$20 = function(){var self = $$20.$$s || this;

        if ($truthy(n['$nil?']())) {
            return $$$($$($nesting, 'Float'), 'INFINITY')
          } else {
            
            n = $$($nesting, 'Opal')['$coerce_to!'](n, $$($nesting, 'Integer'), "to_int");
            if ($truthy($rb_gt(n, 0))) {
              return $rb_times(self.$enumerator_size(), n)
            } else {
              return 0
            };
          }}, $$20.$$s = self, $$20.$$arity = 0, $$20))
      };
      if ($truthy(($truthy($a = self['$empty?']()) ? $a : n['$=='](0)))) {
        return nil};
      
      var i, length, value;

      if (n === nil) {
        while (true) {
          for (i = 0, length = self.length; i < length; i++) {
            value = Opal.yield1(block, self[i]);
          }
        }
      }
      else {
        n = $$($nesting, 'Opal')['$coerce_to!'](n, $$($nesting, 'Integer'), "to_int");
        if (n <= 0) {
          return self;
        }

        while (n > 0) {
          for (i = 0, length = self.length; i < length; i++) {
            value = Opal.yield1(block, self[i]);
          }

          n--;
        }
      }
    ;
      return self;
    }, $Array_cycle$19.$$arity = -1);
    
    Opal.def(self, '$clear', $Array_clear$21 = function $$clear() {
      var self = this;

      
      self.splice(0, self.length);
      return self;
    }, $Array_clear$21.$$arity = 0);
    
    Opal.def(self, '$count', $Array_count$22 = function $$count(object) {
      var $iter = $Array_count$22.$$p, block = $iter || nil, $a, self = this, $zuper = nil, $zuper_i = nil, $zuper_ii = nil;

      if ($iter) $Array_count$22.$$p = null;
      // Prepare super implicit arguments
      for($zuper_i = 0, $zuper_ii = arguments.length, $zuper = new Array($zuper_ii); $zuper_i < $zuper_ii; $zuper_i++) {
        $zuper[$zuper_i] = arguments[$zuper_i];
      }
      
      
      if ($iter) $Array_count$22.$$p = null;;
      
      if (object == null) {
        object = nil;
      };
      if ($truthy(($truthy($a = object) ? $a : block))) {
        return $send(self, Opal.find_super_dispatcher(self, 'count', $Array_count$22, false), $zuper, $iter)
      } else {
        return self.$size()
      };
    }, $Array_count$22.$$arity = -1);
    
    Opal.def(self, '$initialize_copy', $Array_initialize_copy$23 = function $$initialize_copy(other) {
      var self = this;

      return self.$replace(other)
    }, $Array_initialize_copy$23.$$arity = 1);
    
    Opal.def(self, '$collect', $Array_collect$24 = function $$collect() {
      var $iter = $Array_collect$24.$$p, block = $iter || nil, $$25, self = this;

      if ($iter) $Array_collect$24.$$p = null;
      
      
      if ($iter) $Array_collect$24.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["collect"], ($$25 = function(){var self = $$25.$$s || this;

        return self.$size()}, $$25.$$s = self, $$25.$$arity = 0, $$25))
      };
      
      var result = [];

      for (var i = 0, length = self.length; i < length; i++) {
        var value = Opal.yield1(block, self[i]);
        result.push(value);
      }

      return result;
    ;
    }, $Array_collect$24.$$arity = 0);
    
    Opal.def(self, '$collect!', $Array_collect$excl$26 = function() {
      var $iter = $Array_collect$excl$26.$$p, block = $iter || nil, $$27, self = this;

      if ($iter) $Array_collect$excl$26.$$p = null;
      
      
      if ($iter) $Array_collect$excl$26.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["collect!"], ($$27 = function(){var self = $$27.$$s || this;

        return self.$size()}, $$27.$$s = self, $$27.$$arity = 0, $$27))
      };
      
      for (var i = 0, length = self.length; i < length; i++) {
        var value = Opal.yield1(block, self[i]);
        self[i] = value;
      }
    ;
      return self;
    }, $Array_collect$excl$26.$$arity = 0);
    
    function binomial_coefficient(n, k) {
      if (n === k || k === 0) {
        return 1;
      }

      if (k > 0 && n > k) {
        return binomial_coefficient(n - 1, k - 1) + binomial_coefficient(n - 1, k);
      }

      return 0;
    }
  ;
    
    Opal.def(self, '$combination', $Array_combination$28 = function $$combination(n) {
      var $$29, $iter = $Array_combination$28.$$p, $yield = $iter || nil, self = this, num = nil;

      if ($iter) $Array_combination$28.$$p = null;
      
      num = $$($nesting, 'Opal')['$coerce_to!'](n, $$($nesting, 'Integer'), "to_int");
      if (($yield !== nil)) {
      } else {
        return $send(self, 'enum_for', ["combination", num], ($$29 = function(){var self = $$29.$$s || this;

        return binomial_coefficient(self.length, num)}, $$29.$$s = self, $$29.$$arity = 0, $$29))
      };
      
      var i, length, stack, chosen, lev, done, next;

      if (num === 0) {
        Opal.yield1($yield, [])
      } else if (num === 1) {
        for (i = 0, length = self.length; i < length; i++) {
          Opal.yield1($yield, [self[i]])
        }
      }
      else if (num === self.length) {
        Opal.yield1($yield, self.slice())
      }
      else if (num >= 0 && num < self.length) {
        stack = [];
        for (i = 0; i <= num + 1; i++) {
          stack.push(0);
        }

        chosen = [];
        lev = 0;
        done = false;
        stack[0] = -1;

        while (!done) {
          chosen[lev] = self[stack[lev+1]];
          while (lev < num - 1) {
            lev++;
            next = stack[lev+1] = stack[lev] + 1;
            chosen[lev] = self[next];
          }
          Opal.yield1($yield, chosen.slice())
          lev++;
          do {
            done = (lev === 0);
            stack[lev]++;
            lev--;
          } while ( stack[lev+1] + num === self.length + lev + 1 );
        }
      }
    ;
      return self;
    }, $Array_combination$28.$$arity = 1);
    
    Opal.def(self, '$repeated_combination', $Array_repeated_combination$30 = function $$repeated_combination(n) {
      var $$31, $iter = $Array_repeated_combination$30.$$p, $yield = $iter || nil, self = this, num = nil;

      if ($iter) $Array_repeated_combination$30.$$p = null;
      
      num = $$($nesting, 'Opal')['$coerce_to!'](n, $$($nesting, 'Integer'), "to_int");
      if (($yield !== nil)) {
      } else {
        return $send(self, 'enum_for', ["repeated_combination", num], ($$31 = function(){var self = $$31.$$s || this;

        return binomial_coefficient(self.length + num - 1, num);}, $$31.$$s = self, $$31.$$arity = 0, $$31))
      };
      
      function iterate(max, from, buffer, self) {
        if (buffer.length == max) {
          var copy = buffer.slice();
          Opal.yield1($yield, copy)
          return;
        }
        for (var i = from; i < self.length; i++) {
          buffer.push(self[i]);
          iterate(max, i, buffer, self);
          buffer.pop();
        }
      }

      if (num >= 0) {
        iterate(num, 0, [], self);
      }
    ;
      return self;
    }, $Array_repeated_combination$30.$$arity = 1);
    
    Opal.def(self, '$compact', $Array_compact$32 = function $$compact() {
      var self = this;

      
      var result = [];

      for (var i = 0, length = self.length, item; i < length; i++) {
        if ((item = self[i]) !== nil) {
          result.push(item);
        }
      }

      return result;
    
    }, $Array_compact$32.$$arity = 0);
    
    Opal.def(self, '$compact!', $Array_compact$excl$33 = function() {
      var self = this;

      
      var original = self.length;

      for (var i = 0, length = self.length; i < length; i++) {
        if (self[i] === nil) {
          self.splice(i, 1);

          length--;
          i--;
        }
      }

      return self.length === original ? nil : self;
    
    }, $Array_compact$excl$33.$$arity = 0);
    
    Opal.def(self, '$concat', $Array_concat$34 = function $$concat($a) {
      var $post_args, others, $$35, $$36, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      others = $post_args;;
      others = $send(others, 'map', [], ($$35 = function(other){var self = $$35.$$s || this;

      
        
        if (other == null) {
          other = nil;
        };
        other = (function() {if ($truthy($$($nesting, 'Array')['$==='](other))) {
          return other.$to_a()
        } else {
          return $$($nesting, 'Opal').$coerce_to(other, $$($nesting, 'Array'), "to_ary").$to_a()
        }; return nil; })();
        if ($truthy(other['$equal?'](self))) {
          other = other.$dup()};
        return other;}, $$35.$$s = self, $$35.$$arity = 1, $$35));
      $send(others, 'each', [], ($$36 = function(other){var self = $$36.$$s || this;

      
        
        if (other == null) {
          other = nil;
        };
        
        for (var i = 0, length = other.length; i < length; i++) {
          self.push(other[i]);
        }
      ;}, $$36.$$s = self, $$36.$$arity = 1, $$36));
      return self;
    }, $Array_concat$34.$$arity = -1);
    
    Opal.def(self, '$delete', $Array_delete$37 = function(object) {
      var $iter = $Array_delete$37.$$p, $yield = $iter || nil, self = this;

      if ($iter) $Array_delete$37.$$p = null;
      
      var original = self.length;

      for (var i = 0, length = original; i < length; i++) {
        if ((self[i])['$=='](object)) {
          self.splice(i, 1);

          length--;
          i--;
        }
      }

      if (self.length === original) {
        if (($yield !== nil)) {
          return Opal.yieldX($yield, []);
        }
        return nil;
      }
      return object;
    
    }, $Array_delete$37.$$arity = 1);
    
    Opal.def(self, '$delete_at', $Array_delete_at$38 = function $$delete_at(index) {
      var self = this;

      
      index = $$($nesting, 'Opal').$coerce_to(index, $$($nesting, 'Integer'), "to_int");

      if (index < 0) {
        index += self.length;
      }

      if (index < 0 || index >= self.length) {
        return nil;
      }

      var result = self[index];

      self.splice(index, 1);

      return result;
    
    }, $Array_delete_at$38.$$arity = 1);
    
    Opal.def(self, '$delete_if', $Array_delete_if$39 = function $$delete_if() {
      var $iter = $Array_delete_if$39.$$p, block = $iter || nil, $$40, self = this;

      if ($iter) $Array_delete_if$39.$$p = null;
      
      
      if ($iter) $Array_delete_if$39.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["delete_if"], ($$40 = function(){var self = $$40.$$s || this;

        return self.$size()}, $$40.$$s = self, $$40.$$arity = 0, $$40))
      };
      
      for (var i = 0, length = self.length, value; i < length; i++) {
        value = block(self[i]);

        if (value !== false && value !== nil) {
          self.splice(i, 1);

          length--;
          i--;
        }
      }
    ;
      return self;
    }, $Array_delete_if$39.$$arity = 0);
    
    Opal.def(self, '$dig', $Array_dig$41 = function $$dig(idx, $a) {
      var $post_args, idxs, self = this, item = nil;

      
      
      $post_args = Opal.slice.call(arguments, 1, arguments.length);
      
      idxs = $post_args;;
      item = self['$[]'](idx);
      
      if (item === nil || idxs.length === 0) {
        return item;
      }
    ;
      if ($truthy(item['$respond_to?']("dig"))) {
      } else {
        self.$raise($$($nesting, 'TypeError'), "" + (item.$class()) + " does not have #dig method")
      };
      return $send(item, 'dig', Opal.to_a(idxs));
    }, $Array_dig$41.$$arity = -2);
    
    Opal.def(self, '$drop', $Array_drop$42 = function $$drop(number) {
      var self = this;

      
      if (number < 0) {
        self.$raise($$($nesting, 'ArgumentError'))
      }

      return self.slice(number);
    
    }, $Array_drop$42.$$arity = 1);
    
    Opal.def(self, '$dup', $Array_dup$43 = function $$dup() {
      var $iter = $Array_dup$43.$$p, $yield = $iter || nil, self = this, $zuper = nil, $zuper_i = nil, $zuper_ii = nil;

      if ($iter) $Array_dup$43.$$p = null;
      // Prepare super implicit arguments
      for($zuper_i = 0, $zuper_ii = arguments.length, $zuper = new Array($zuper_ii); $zuper_i < $zuper_ii; $zuper_i++) {
        $zuper[$zuper_i] = arguments[$zuper_i];
      }
      
      
      if (self.$$class === Opal.Array &&
          self.$$class.$allocate.$$pristine &&
          self.$copy_instance_variables.$$pristine &&
          self.$initialize_dup.$$pristine) {
        return self.slice(0);
      }
    ;
      return $send(self, Opal.find_super_dispatcher(self, 'dup', $Array_dup$43, false), $zuper, $iter);
    }, $Array_dup$43.$$arity = 0);
    
    Opal.def(self, '$each', $Array_each$44 = function $$each() {
      var $iter = $Array_each$44.$$p, block = $iter || nil, $$45, self = this;

      if ($iter) $Array_each$44.$$p = null;
      
      
      if ($iter) $Array_each$44.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["each"], ($$45 = function(){var self = $$45.$$s || this;

        return self.$size()}, $$45.$$s = self, $$45.$$arity = 0, $$45))
      };
      
      for (var i = 0, length = self.length; i < length; i++) {
        var value = Opal.yield1(block, self[i]);
      }
    ;
      return self;
    }, $Array_each$44.$$arity = 0);
    
    Opal.def(self, '$each_index', $Array_each_index$46 = function $$each_index() {
      var $iter = $Array_each_index$46.$$p, block = $iter || nil, $$47, self = this;

      if ($iter) $Array_each_index$46.$$p = null;
      
      
      if ($iter) $Array_each_index$46.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["each_index"], ($$47 = function(){var self = $$47.$$s || this;

        return self.$size()}, $$47.$$s = self, $$47.$$arity = 0, $$47))
      };
      
      for (var i = 0, length = self.length; i < length; i++) {
        var value = Opal.yield1(block, i);
      }
    ;
      return self;
    }, $Array_each_index$46.$$arity = 0);
    
    Opal.def(self, '$empty?', $Array_empty$ques$48 = function() {
      var self = this;

      return self.length === 0;
    }, $Array_empty$ques$48.$$arity = 0);
    
    Opal.def(self, '$eql?', $Array_eql$ques$49 = function(other) {
      var self = this;

      
      var recursed = {};

      function _eql(array, other) {
        var i, length, a, b;

        if (!other.$$is_array) {
          return false;
        }

        other = other.$to_a();

        if (array.length !== other.length) {
          return false;
        }

        recursed[(array).$object_id()] = true;

        for (i = 0, length = array.length; i < length; i++) {
          a = array[i];
          b = other[i];
          if (a.$$is_array) {
            if (b.$$is_array && b.length !== a.length) {
              return false;
            }
            if (!recursed.hasOwnProperty((a).$object_id())) {
              if (!_eql(a, b)) {
                return false;
              }
            }
          } else {
            if (!(a)['$eql?'](b)) {
              return false;
            }
          }
        }

        return true;
      }

      return _eql(self, other);
    
    }, $Array_eql$ques$49.$$arity = 1);
    
    Opal.def(self, '$fetch', $Array_fetch$50 = function $$fetch(index, defaults) {
      var $iter = $Array_fetch$50.$$p, block = $iter || nil, self = this;

      if ($iter) $Array_fetch$50.$$p = null;
      
      
      if ($iter) $Array_fetch$50.$$p = null;;
      ;
      
      var original = index;

      index = $$($nesting, 'Opal').$coerce_to(index, $$($nesting, 'Integer'), "to_int");

      if (index < 0) {
        index += self.length;
      }

      if (index >= 0 && index < self.length) {
        return self[index];
      }

      if (block !== nil && defaults != null) {
        self.$warn("warning: block supersedes default value argument")
      }

      if (block !== nil) {
        return block(original);
      }

      if (defaults != null) {
        return defaults;
      }

      if (self.length === 0) {
        self.$raise($$($nesting, 'IndexError'), "" + "index " + (original) + " outside of array bounds: 0...0")
      }
      else {
        self.$raise($$($nesting, 'IndexError'), "" + "index " + (original) + " outside of array bounds: -" + (self.length) + "..." + (self.length));
      }
    ;
    }, $Array_fetch$50.$$arity = -2);
    
    Opal.def(self, '$fill', $Array_fill$51 = function $$fill($a) {
      var $iter = $Array_fill$51.$$p, block = $iter || nil, $post_args, args, $b, $c, self = this, one = nil, two = nil, obj = nil, left = nil, right = nil;

      if ($iter) $Array_fill$51.$$p = null;
      
      
      if ($iter) $Array_fill$51.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
            var i, length, value;;
      if ($truthy(block)) {
        
        if ($truthy(args.length > 2)) {
          self.$raise($$($nesting, 'ArgumentError'), "" + "wrong number of arguments (" + (args.$length()) + " for 0..2)")};
        $c = args, $b = Opal.to_ary($c), (one = ($b[0] == null ? nil : $b[0])), (two = ($b[1] == null ? nil : $b[1])), $c;
      } else {
        
        if ($truthy(args.length == 0)) {
          self.$raise($$($nesting, 'ArgumentError'), "wrong number of arguments (0 for 1..3)")
        } else if ($truthy(args.length > 3)) {
          self.$raise($$($nesting, 'ArgumentError'), "" + "wrong number of arguments (" + (args.$length()) + " for 1..3)")};
        $c = args, $b = Opal.to_ary($c), (obj = ($b[0] == null ? nil : $b[0])), (one = ($b[1] == null ? nil : $b[1])), (two = ($b[2] == null ? nil : $b[2])), $c;
      };
      if ($truthy($$($nesting, 'Range')['$==='](one))) {
        
        if ($truthy(two)) {
          self.$raise($$($nesting, 'TypeError'), "length invalid with range")};
        left = $$($nesting, 'Opal').$coerce_to(one.$begin(), $$($nesting, 'Integer'), "to_int");
        if ($truthy(left < 0)) {
          left += this.length};
        if ($truthy(left < 0)) {
          self.$raise($$($nesting, 'RangeError'), "" + (one.$inspect()) + " out of range")};
        right = $$($nesting, 'Opal').$coerce_to(one.$end(), $$($nesting, 'Integer'), "to_int");
        if ($truthy(right < 0)) {
          right += this.length};
        if ($truthy(one['$exclude_end?']())) {
        } else {
          right += 1
        };
        if ($truthy(right <= left)) {
          return self};
      } else if ($truthy(one)) {
        
        left = $$($nesting, 'Opal').$coerce_to(one, $$($nesting, 'Integer'), "to_int");
        if ($truthy(left < 0)) {
          left += this.length};
        if ($truthy(left < 0)) {
          left = 0};
        if ($truthy(two)) {
          
          right = $$($nesting, 'Opal').$coerce_to(two, $$($nesting, 'Integer'), "to_int");
          if ($truthy(right == 0)) {
            return self};
          right += left;
        } else {
          right = this.length
        };
      } else {
        
        left = 0;
        right = this.length;
      };
      if ($truthy(left > this.length)) {
        
        for (i = this.length; i < right; i++) {
          self[i] = nil;
        }
      };
      if ($truthy(right > this.length)) {
        this.length = right};
      if ($truthy(block)) {
        
        for (length = this.length; left < right; left++) {
          value = block(left);
          self[left] = value;
        }
      
      } else {
        
        for (length = this.length; left < right; left++) {
          self[left] = obj;
        }
      
      };
      return self;
    }, $Array_fill$51.$$arity = -1);
    
    Opal.def(self, '$first', $Array_first$52 = function $$first(count) {
      var self = this;

      
      ;
      
      if (count == null) {
        return self.length === 0 ? nil : self[0];
      }

      count = $$($nesting, 'Opal').$coerce_to(count, $$($nesting, 'Integer'), "to_int");

      if (count < 0) {
        self.$raise($$($nesting, 'ArgumentError'), "negative array size");
      }

      return self.slice(0, count);
    ;
    }, $Array_first$52.$$arity = -1);
    
    Opal.def(self, '$flatten', $Array_flatten$53 = function $$flatten(level) {
      var self = this;

      
      ;
      
      function _flatten(array, level) {
        var result = [],
            i, length,
            item, ary;

        array = (array).$to_a();

        for (i = 0, length = array.length; i < length; i++) {
          item = array[i];

          if (!$$($nesting, 'Opal')['$respond_to?'](item, "to_ary", true)) {
            result.push(item);
            continue;
          }

          ary = (item).$to_ary();

          if (ary === nil) {
            result.push(item);
            continue;
          }

          if (!ary.$$is_array) {
            self.$raise($$($nesting, 'TypeError'));
          }

          if (ary === self) {
            self.$raise($$($nesting, 'ArgumentError'));
          }

          switch (level) {
          case undefined:
            result = result.concat(_flatten(ary));
            break;
          case 0:
            result.push(ary);
            break;
          default:
            result.push.apply(result, _flatten(ary, level - 1));
          }
        }
        return result;
      }

      if (level !== undefined) {
        level = $$($nesting, 'Opal').$coerce_to(level, $$($nesting, 'Integer'), "to_int");
      }

      return toArraySubclass(_flatten(self, level), self.$class());
    ;
    }, $Array_flatten$53.$$arity = -1);
    
    Opal.def(self, '$flatten!', $Array_flatten$excl$54 = function(level) {
      var self = this;

      
      ;
      
      var flattened = self.$flatten(level);

      if (self.length == flattened.length) {
        for (var i = 0, length = self.length; i < length; i++) {
          if (self[i] !== flattened[i]) {
            break;
          }
        }

        if (i == length) {
          return nil;
        }
      }

      self.$replace(flattened);
    ;
      return self;
    }, $Array_flatten$excl$54.$$arity = -1);
    
    Opal.def(self, '$hash', $Array_hash$55 = function $$hash() {
      var self = this;

      
      var top = (Opal.hash_ids === undefined),
          result = ['A'],
          hash_id = self.$object_id(),
          item, i, key;

      try {
        if (top) {
          Opal.hash_ids = Object.create(null);
        }

        // return early for recursive structures
        if (Opal.hash_ids[hash_id]) {
          return 'self';
        }

        for (key in Opal.hash_ids) {
          item = Opal.hash_ids[key];
          if (self['$eql?'](item)) {
            return 'self';
          }
        }

        Opal.hash_ids[hash_id] = self;

        for (i = 0; i < self.length; i++) {
          item = self[i];
          result.push(item.$hash());
        }

        return result.join(',');
      } finally {
        if (top) {
          Opal.hash_ids = undefined;
        }
      }
    
    }, $Array_hash$55.$$arity = 0);
    
    Opal.def(self, '$include?', $Array_include$ques$56 = function(member) {
      var self = this;

      
      for (var i = 0, length = self.length; i < length; i++) {
        if ((self[i])['$=='](member)) {
          return true;
        }
      }

      return false;
    
    }, $Array_include$ques$56.$$arity = 1);
    
    Opal.def(self, '$index', $Array_index$57 = function $$index(object) {
      var $iter = $Array_index$57.$$p, block = $iter || nil, self = this;

      if ($iter) $Array_index$57.$$p = null;
      
      
      if ($iter) $Array_index$57.$$p = null;;
      ;
      
      var i, length, value;

      if (object != null && block !== nil) {
        self.$warn("warning: given block not used")
      }

      if (object != null) {
        for (i = 0, length = self.length; i < length; i++) {
          if ((self[i])['$=='](object)) {
            return i;
          }
        }
      }
      else if (block !== nil) {
        for (i = 0, length = self.length; i < length; i++) {
          value = block(self[i]);

          if (value !== false && value !== nil) {
            return i;
          }
        }
      }
      else {
        return self.$enum_for("index");
      }

      return nil;
    ;
    }, $Array_index$57.$$arity = -1);
    
    Opal.def(self, '$insert', $Array_insert$58 = function $$insert(index, $a) {
      var $post_args, objects, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 1, arguments.length);
      
      objects = $post_args;;
      
      index = $$($nesting, 'Opal').$coerce_to(index, $$($nesting, 'Integer'), "to_int");

      if (objects.length > 0) {
        if (index < 0) {
          index += self.length + 1;

          if (index < 0) {
            self.$raise($$($nesting, 'IndexError'), "" + (index) + " is out of bounds");
          }
        }
        if (index > self.length) {
          for (var i = self.length; i < index; i++) {
            self.push(nil);
          }
        }

        self.splice.apply(self, [index, 0].concat(objects));
      }
    ;
      return self;
    }, $Array_insert$58.$$arity = -2);
    
    Opal.def(self, '$inspect', $Array_inspect$59 = function $$inspect() {
      var self = this;

      
      var result = [],
          id     = self.$__id__();

      for (var i = 0, length = self.length; i < length; i++) {
        var item = self['$[]'](i);

        if ((item).$__id__() === id) {
          result.push('[...]');
        }
        else {
          result.push((item).$inspect());
        }
      }

      return '[' + result.join(', ') + ']';
    
    }, $Array_inspect$59.$$arity = 0);
    
    Opal.def(self, '$join', $Array_join$60 = function $$join(sep) {
      var self = this;
      if ($gvars[","] == null) $gvars[","] = nil;

      
      
      if (sep == null) {
        sep = nil;
      };
      if ($truthy(self.length === 0)) {
        return ""};
      if ($truthy(sep === nil)) {
        sep = $gvars[","]};
      
      var result = [];
      var i, length, item, tmp;

      for (i = 0, length = self.length; i < length; i++) {
        item = self[i];

        if ($$($nesting, 'Opal')['$respond_to?'](item, "to_str")) {
          tmp = (item).$to_str();

          if (tmp !== nil) {
            result.push((tmp).$to_s());

            continue;
          }
        }

        if ($$($nesting, 'Opal')['$respond_to?'](item, "to_ary")) {
          tmp = (item).$to_ary();

          if (tmp === self) {
            self.$raise($$($nesting, 'ArgumentError'));
          }

          if (tmp !== nil) {
            result.push((tmp).$join(sep));

            continue;
          }
        }

        if ($$($nesting, 'Opal')['$respond_to?'](item, "to_s")) {
          tmp = (item).$to_s();

          if (tmp !== nil) {
            result.push(tmp);

            continue;
          }
        }

        self.$raise($$($nesting, 'NoMethodError').$new("" + (Opal.inspect(item)) + " doesn't respond to #to_str, #to_ary or #to_s", "to_str"));
      }

      if (sep === nil) {
        return result.join('');
      }
      else {
        return result.join($$($nesting, 'Opal')['$coerce_to!'](sep, $$($nesting, 'String'), "to_str").$to_s());
      }
    ;
    }, $Array_join$60.$$arity = -1);
    
    Opal.def(self, '$keep_if', $Array_keep_if$61 = function $$keep_if() {
      var $iter = $Array_keep_if$61.$$p, block = $iter || nil, $$62, self = this;

      if ($iter) $Array_keep_if$61.$$p = null;
      
      
      if ($iter) $Array_keep_if$61.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["keep_if"], ($$62 = function(){var self = $$62.$$s || this;

        return self.$size()}, $$62.$$s = self, $$62.$$arity = 0, $$62))
      };
      
      for (var i = 0, length = self.length, value; i < length; i++) {
        value = block(self[i]);

        if (value === false || value === nil) {
          self.splice(i, 1);

          length--;
          i--;
        }
      }
    ;
      return self;
    }, $Array_keep_if$61.$$arity = 0);
    
    Opal.def(self, '$last', $Array_last$63 = function $$last(count) {
      var self = this;

      
      ;
      
      if (count == null) {
        return self.length === 0 ? nil : self[self.length - 1];
      }

      count = $$($nesting, 'Opal').$coerce_to(count, $$($nesting, 'Integer'), "to_int");

      if (count < 0) {
        self.$raise($$($nesting, 'ArgumentError'), "negative array size");
      }

      if (count > self.length) {
        count = self.length;
      }

      return self.slice(self.length - count, self.length);
    ;
    }, $Array_last$63.$$arity = -1);
    
    Opal.def(self, '$length', $Array_length$64 = function $$length() {
      var self = this;

      return self.length;
    }, $Array_length$64.$$arity = 0);
    Opal.alias(self, "map", "collect");
    Opal.alias(self, "map!", "collect!");
    
    Opal.def(self, '$max', $Array_max$65 = function $$max(n) {
      var $iter = $Array_max$65.$$p, block = $iter || nil, self = this;

      if ($iter) $Array_max$65.$$p = null;
      
      
      if ($iter) $Array_max$65.$$p = null;;
      ;
      return $send(self.$each(), 'max', [n], block.$to_proc());
    }, $Array_max$65.$$arity = -1);
    
    Opal.def(self, '$min', $Array_min$66 = function $$min() {
      var $iter = $Array_min$66.$$p, block = $iter || nil, self = this;

      if ($iter) $Array_min$66.$$p = null;
      
      
      if ($iter) $Array_min$66.$$p = null;;
      return $send(self.$each(), 'min', [], block.$to_proc());
    }, $Array_min$66.$$arity = 0);
    
    // Returns the product of from, from-1, ..., from - how_many + 1.
    function descending_factorial(from, how_many) {
      var count = how_many >= 0 ? 1 : 0;
      while (how_many) {
        count *= from;
        from--;
        how_many--;
      }
      return count;
    }
  ;
    
    Opal.def(self, '$permutation', $Array_permutation$67 = function $$permutation(num) {
      var $iter = $Array_permutation$67.$$p, block = $iter || nil, $$68, self = this, perm = nil, used = nil;

      if ($iter) $Array_permutation$67.$$p = null;
      
      
      if ($iter) $Array_permutation$67.$$p = null;;
      ;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["permutation", num], ($$68 = function(){var self = $$68.$$s || this;

        return descending_factorial(self.length, num === undefined ? self.length : num);}, $$68.$$s = self, $$68.$$arity = 0, $$68))
      };
      
      var permute, offensive, output;

      if (num === undefined) {
        num = self.length;
      }
      else {
        num = $$($nesting, 'Opal').$coerce_to(num, $$($nesting, 'Integer'), "to_int")
      }

      if (num < 0 || self.length < num) {
        // no permutations, yield nothing
      }
      else if (num === 0) {
        // exactly one permutation: the zero-length array
        Opal.yield1(block, [])
      }
      else if (num === 1) {
        // this is a special, easy case
        for (var i = 0; i < self.length; i++) {
          Opal.yield1(block, [self[i]])
        }
      }
      else {
        // this is the general case
        (perm = $$($nesting, 'Array').$new(num));
        (used = $$($nesting, 'Array').$new(self.length, false));

        permute = function(num, perm, index, used, blk) {
          self = this;
          for(var i = 0; i < self.length; i++){
            if(used['$[]'](i)['$!']()) {
              perm[index] = i;
              if(index < num - 1) {
                used[i] = true;
                permute.call(self, num, perm, index + 1, used, blk);
                used[i] = false;
              }
              else {
                output = [];
                for (var j = 0; j < perm.length; j++) {
                  output.push(self[perm[j]]);
                }
                Opal.yield1(blk, output);
              }
            }
          }
        }

        if ((block !== nil)) {
          // offensive (both definitions) copy.
          offensive = self.slice();
          permute.call(offensive, num, perm, 0, used, block);
        }
        else {
          permute.call(self, num, perm, 0, used, block);
        }
      }
    ;
      return self;
    }, $Array_permutation$67.$$arity = -1);
    
    Opal.def(self, '$repeated_permutation', $Array_repeated_permutation$69 = function $$repeated_permutation(n) {
      var $$70, $iter = $Array_repeated_permutation$69.$$p, $yield = $iter || nil, self = this, num = nil;

      if ($iter) $Array_repeated_permutation$69.$$p = null;
      
      num = $$($nesting, 'Opal')['$coerce_to!'](n, $$($nesting, 'Integer'), "to_int");
      if (($yield !== nil)) {
      } else {
        return $send(self, 'enum_for', ["repeated_permutation", num], ($$70 = function(){var self = $$70.$$s || this;

        if ($truthy($rb_ge(num, 0))) {
            return self.$size()['$**'](num)
          } else {
            return 0
          }}, $$70.$$s = self, $$70.$$arity = 0, $$70))
      };
      
      function iterate(max, buffer, self) {
        if (buffer.length == max) {
          var copy = buffer.slice();
          Opal.yield1($yield, copy)
          return;
        }
        for (var i = 0; i < self.length; i++) {
          buffer.push(self[i]);
          iterate(max, buffer, self);
          buffer.pop();
        }
      }

      iterate(num, [], self.slice());
    ;
      return self;
    }, $Array_repeated_permutation$69.$$arity = 1);
    
    Opal.def(self, '$pop', $Array_pop$71 = function $$pop(count) {
      var self = this;

      
      ;
      if ($truthy(count === undefined)) {
        
        if ($truthy(self.length === 0)) {
          return nil};
        return self.pop();};
      count = $$($nesting, 'Opal').$coerce_to(count, $$($nesting, 'Integer'), "to_int");
      if ($truthy(count < 0)) {
        self.$raise($$($nesting, 'ArgumentError'), "negative array size")};
      if ($truthy(self.length === 0)) {
        return []};
      if ($truthy(count > self.length)) {
        return self.splice(0, self.length);
      } else {
        return self.splice(self.length - count, self.length);
      };
    }, $Array_pop$71.$$arity = -1);
    
    Opal.def(self, '$product', $Array_product$72 = function $$product($a) {
      var $iter = $Array_product$72.$$p, block = $iter || nil, $post_args, args, self = this;

      if ($iter) $Array_product$72.$$p = null;
      
      
      if ($iter) $Array_product$72.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      
      var result = (block !== nil) ? null : [],
          n = args.length + 1,
          counters = new Array(n),
          lengths  = new Array(n),
          arrays   = new Array(n),
          i, m, subarray, len, resultlen = 1;

      arrays[0] = self;
      for (i = 1; i < n; i++) {
        arrays[i] = $$($nesting, 'Opal').$coerce_to(args[i - 1], $$($nesting, 'Array'), "to_ary");
      }

      for (i = 0; i < n; i++) {
        len = arrays[i].length;
        if (len === 0) {
          return result || self;
        }
        resultlen *= len;
        if (resultlen > 2147483647) {
          self.$raise($$($nesting, 'RangeError'), "too big to product")
        }
        lengths[i] = len;
        counters[i] = 0;
      }

      outer_loop: for (;;) {
        subarray = [];
        for (i = 0; i < n; i++) {
          subarray.push(arrays[i][counters[i]]);
        }
        if (result) {
          result.push(subarray);
        } else {
          Opal.yield1(block, subarray)
        }
        m = n - 1;
        counters[m]++;
        while (counters[m] === lengths[m]) {
          counters[m] = 0;
          if (--m < 0) break outer_loop;
          counters[m]++;
        }
      }

      return result || self;
    ;
    }, $Array_product$72.$$arity = -1);
    
    Opal.def(self, '$push', $Array_push$73 = function $$push($a) {
      var $post_args, objects, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      objects = $post_args;;
      
      for (var i = 0, length = objects.length; i < length; i++) {
        self.push(objects[i]);
      }
    ;
      return self;
    }, $Array_push$73.$$arity = -1);
    Opal.alias(self, "append", "push");
    
    Opal.def(self, '$rassoc', $Array_rassoc$74 = function $$rassoc(object) {
      var self = this;

      
      for (var i = 0, length = self.length, item; i < length; i++) {
        item = self[i];

        if (item.length && item[1] !== undefined) {
          if ((item[1])['$=='](object)) {
            return item;
          }
        }
      }

      return nil;
    
    }, $Array_rassoc$74.$$arity = 1);
    
    Opal.def(self, '$reject', $Array_reject$75 = function $$reject() {
      var $iter = $Array_reject$75.$$p, block = $iter || nil, $$76, self = this;

      if ($iter) $Array_reject$75.$$p = null;
      
      
      if ($iter) $Array_reject$75.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["reject"], ($$76 = function(){var self = $$76.$$s || this;

        return self.$size()}, $$76.$$s = self, $$76.$$arity = 0, $$76))
      };
      
      var result = [];

      for (var i = 0, length = self.length, value; i < length; i++) {
        value = block(self[i]);

        if (value === false || value === nil) {
          result.push(self[i]);
        }
      }
      return result;
    ;
    }, $Array_reject$75.$$arity = 0);
    
    Opal.def(self, '$reject!', $Array_reject$excl$77 = function() {
      var $iter = $Array_reject$excl$77.$$p, block = $iter || nil, $$78, self = this, original = nil;

      if ($iter) $Array_reject$excl$77.$$p = null;
      
      
      if ($iter) $Array_reject$excl$77.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["reject!"], ($$78 = function(){var self = $$78.$$s || this;

        return self.$size()}, $$78.$$s = self, $$78.$$arity = 0, $$78))
      };
      original = self.$length();
      $send(self, 'delete_if', [], block.$to_proc());
      if (self.$length()['$=='](original)) {
        return nil
      } else {
        return self
      };
    }, $Array_reject$excl$77.$$arity = 0);
    
    Opal.def(self, '$replace', $Array_replace$79 = function $$replace(other) {
      var self = this;

      
      other = (function() {if ($truthy($$($nesting, 'Array')['$==='](other))) {
        return other.$to_a()
      } else {
        return $$($nesting, 'Opal').$coerce_to(other, $$($nesting, 'Array'), "to_ary").$to_a()
      }; return nil; })();
      
      self.splice(0, self.length);
      self.push.apply(self, other);
    ;
      return self;
    }, $Array_replace$79.$$arity = 1);
    
    Opal.def(self, '$reverse', $Array_reverse$80 = function $$reverse() {
      var self = this;

      return self.slice(0).reverse();
    }, $Array_reverse$80.$$arity = 0);
    
    Opal.def(self, '$reverse!', $Array_reverse$excl$81 = function() {
      var self = this;

      return self.reverse();
    }, $Array_reverse$excl$81.$$arity = 0);
    
    Opal.def(self, '$reverse_each', $Array_reverse_each$82 = function $$reverse_each() {
      var $iter = $Array_reverse_each$82.$$p, block = $iter || nil, $$83, self = this;

      if ($iter) $Array_reverse_each$82.$$p = null;
      
      
      if ($iter) $Array_reverse_each$82.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["reverse_each"], ($$83 = function(){var self = $$83.$$s || this;

        return self.$size()}, $$83.$$s = self, $$83.$$arity = 0, $$83))
      };
      $send(self.$reverse(), 'each', [], block.$to_proc());
      return self;
    }, $Array_reverse_each$82.$$arity = 0);
    
    Opal.def(self, '$rindex', $Array_rindex$84 = function $$rindex(object) {
      var $iter = $Array_rindex$84.$$p, block = $iter || nil, self = this;

      if ($iter) $Array_rindex$84.$$p = null;
      
      
      if ($iter) $Array_rindex$84.$$p = null;;
      ;
      
      var i, value;

      if (object != null && block !== nil) {
        self.$warn("warning: given block not used")
      }

      if (object != null) {
        for (i = self.length - 1; i >= 0; i--) {
          if (i >= self.length) {
            break;
          }
          if ((self[i])['$=='](object)) {
            return i;
          }
        }
      }
      else if (block !== nil) {
        for (i = self.length - 1; i >= 0; i--) {
          if (i >= self.length) {
            break;
          }

          value = block(self[i]);

          if (value !== false && value !== nil) {
            return i;
          }
        }
      }
      else if (object == null) {
        return self.$enum_for("rindex");
      }

      return nil;
    ;
    }, $Array_rindex$84.$$arity = -1);
    
    Opal.def(self, '$rotate', $Array_rotate$85 = function $$rotate(n) {
      var self = this;

      
      
      if (n == null) {
        n = 1;
      };
      n = $$($nesting, 'Opal').$coerce_to(n, $$($nesting, 'Integer'), "to_int");
      
      var ary, idx, firstPart, lastPart;

      if (self.length === 1) {
        return self.slice();
      }
      if (self.length === 0) {
        return [];
      }

      ary = self.slice();
      idx = n % ary.length;

      firstPart = ary.slice(idx);
      lastPart = ary.slice(0, idx);
      return firstPart.concat(lastPart);
    ;
    }, $Array_rotate$85.$$arity = -1);
    
    Opal.def(self, '$rotate!', $Array_rotate$excl$86 = function(cnt) {
      var self = this, ary = nil;

      
      
      if (cnt == null) {
        cnt = 1;
      };
      
      if (self.length === 0 || self.length === 1) {
        return self;
      }
    ;
      cnt = $$($nesting, 'Opal').$coerce_to(cnt, $$($nesting, 'Integer'), "to_int");
      ary = self.$rotate(cnt);
      return self.$replace(ary);
    }, $Array_rotate$excl$86.$$arity = -1);
    (function($base, $super, $parent_nesting) {
      var self = $klass($base, $super, 'SampleRandom');

      var $nesting = [self].concat($parent_nesting), $SampleRandom_initialize$87, $SampleRandom_rand$88;

      self.$$prototype.rng = nil;
      
      
      Opal.def(self, '$initialize', $SampleRandom_initialize$87 = function $$initialize(rng) {
        var self = this;

        return (self.rng = rng)
      }, $SampleRandom_initialize$87.$$arity = 1);
      return (Opal.def(self, '$rand', $SampleRandom_rand$88 = function $$rand(size) {
        var self = this, random = nil;

        
        random = $$($nesting, 'Opal').$coerce_to(self.rng.$rand(size), $$($nesting, 'Integer'), "to_int");
        if ($truthy(random < 0)) {
          self.$raise($$($nesting, 'RangeError'), "random value must be >= 0")};
        if ($truthy(random < size)) {
        } else {
          self.$raise($$($nesting, 'RangeError'), "random value must be less than Array size")
        };
        return random;
      }, $SampleRandom_rand$88.$$arity = 1), nil) && 'rand';
    })($nesting[0], null, $nesting);
    
    Opal.def(self, '$sample', $Array_sample$89 = function $$sample(count, options) {
      var $a, self = this, o = nil, rng = nil;

      
      ;
      ;
      if ($truthy(count === undefined)) {
        return self.$at($$($nesting, 'Kernel').$rand(self.length))};
      if ($truthy(options === undefined)) {
        if ($truthy((o = $$($nesting, 'Opal')['$coerce_to?'](count, $$($nesting, 'Hash'), "to_hash")))) {
          
          options = o;
          count = nil;
        } else {
          
          options = nil;
          count = $$($nesting, 'Opal').$coerce_to(count, $$($nesting, 'Integer'), "to_int");
        }
      } else {
        
        count = $$($nesting, 'Opal').$coerce_to(count, $$($nesting, 'Integer'), "to_int");
        options = $$($nesting, 'Opal').$coerce_to(options, $$($nesting, 'Hash'), "to_hash");
      };
      if ($truthy(($truthy($a = count) ? count < 0 : $a))) {
        self.$raise($$($nesting, 'ArgumentError'), "count must be greater than 0")};
      if ($truthy(options)) {
        rng = options['$[]']("random")};
      rng = (function() {if ($truthy(($truthy($a = rng) ? rng['$respond_to?']("rand") : $a))) {
        return $$($nesting, 'SampleRandom').$new(rng)
      } else {
        return $$($nesting, 'Kernel')
      }; return nil; })();
      if ($truthy(count)) {
      } else {
        return self[rng.$rand(self.length)]
      };
      

      var abandon, spin, result, i, j, k, targetIndex, oldValue;

      if (count > self.length) {
        count = self.length;
      }

      switch (count) {
        case 0:
          return [];
          break;
        case 1:
          return [self[rng.$rand(self.length)]];
          break;
        case 2:
          i = rng.$rand(self.length);
          j = rng.$rand(self.length);
          if (i === j) {
            j = i === 0 ? i + 1 : i - 1;
          }
          return [self[i], self[j]];
          break;
        default:
          if (self.length / count > 3) {
            abandon = false;
            spin = 0;

            result = $$($nesting, 'Array').$new(count);
            i = 1;

            result[0] = rng.$rand(self.length);
            while (i < count) {
              k = rng.$rand(self.length);
              j = 0;

              while (j < i) {
                while (k === result[j]) {
                  spin++;
                  if (spin > 100) {
                    abandon = true;
                    break;
                  }
                  k = rng.$rand(self.length);
                }
                if (abandon) { break; }

                j++;
              }

              if (abandon) { break; }

              result[i] = k;

              i++;
            }

            if (!abandon) {
              i = 0;
              while (i < count) {
                result[i] = self[result[i]];
                i++;
              }

              return result;
            }
          }

          result = self.slice();

          for (var c = 0; c < count; c++) {
            targetIndex = rng.$rand(self.length);
            oldValue = result[c];
            result[c] = result[targetIndex];
            result[targetIndex] = oldValue;
          }

          return count === self.length ? result : (result)['$[]'](0, count);
      }
    ;
    }, $Array_sample$89.$$arity = -1);
    
    Opal.def(self, '$select', $Array_select$90 = function $$select() {
      var $iter = $Array_select$90.$$p, block = $iter || nil, $$91, self = this;

      if ($iter) $Array_select$90.$$p = null;
      
      
      if ($iter) $Array_select$90.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["select"], ($$91 = function(){var self = $$91.$$s || this;

        return self.$size()}, $$91.$$s = self, $$91.$$arity = 0, $$91))
      };
      
      var result = [];

      for (var i = 0, length = self.length, item, value; i < length; i++) {
        item = self[i];

        value = Opal.yield1(block, item);

        if (Opal.truthy(value)) {
          result.push(item);
        }
      }

      return result;
    ;
    }, $Array_select$90.$$arity = 0);
    
    Opal.def(self, '$select!', $Array_select$excl$92 = function() {
      var $iter = $Array_select$excl$92.$$p, block = $iter || nil, $$93, self = this;

      if ($iter) $Array_select$excl$92.$$p = null;
      
      
      if ($iter) $Array_select$excl$92.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["select!"], ($$93 = function(){var self = $$93.$$s || this;

        return self.$size()}, $$93.$$s = self, $$93.$$arity = 0, $$93))
      };
      
      var original = self.length;
      $send(self, 'keep_if', [], block.$to_proc());
      return self.length === original ? nil : self;
    ;
    }, $Array_select$excl$92.$$arity = 0);
    
    Opal.def(self, '$shift', $Array_shift$94 = function $$shift(count) {
      var self = this;

      
      ;
      if ($truthy(count === undefined)) {
        
        if ($truthy(self.length === 0)) {
          return nil};
        return self.shift();};
      count = $$($nesting, 'Opal').$coerce_to(count, $$($nesting, 'Integer'), "to_int");
      if ($truthy(count < 0)) {
        self.$raise($$($nesting, 'ArgumentError'), "negative array size")};
      if ($truthy(self.length === 0)) {
        return []};
      return self.splice(0, count);;
    }, $Array_shift$94.$$arity = -1);
    Opal.alias(self, "size", "length");
    
    Opal.def(self, '$shuffle', $Array_shuffle$95 = function $$shuffle(rng) {
      var self = this;

      
      ;
      return self.$dup().$to_a()['$shuffle!'](rng);
    }, $Array_shuffle$95.$$arity = -1);
    
    Opal.def(self, '$shuffle!', $Array_shuffle$excl$96 = function(rng) {
      var self = this;

      
      ;
      
      var randgen, i = self.length, j, tmp;

      if (rng !== undefined) {
        rng = $$($nesting, 'Opal')['$coerce_to?'](rng, $$($nesting, 'Hash'), "to_hash");

        if (rng !== nil) {
          rng = rng['$[]']("random");

          if (rng !== nil && rng['$respond_to?']("rand")) {
            randgen = rng;
          }
        }
      }

      while (i) {
        if (randgen) {
          j = randgen.$rand(i).$to_int();

          if (j < 0) {
            self.$raise($$($nesting, 'RangeError'), "" + "random number too small " + (j))
          }

          if (j >= i) {
            self.$raise($$($nesting, 'RangeError'), "" + "random number too big " + (j))
          }
        }
        else {
          j = self.$rand(i);
        }

        tmp = self[--i];
        self[i] = self[j];
        self[j] = tmp;
      }

      return self;
    ;
    }, $Array_shuffle$excl$96.$$arity = -1);
    Opal.alias(self, "slice", "[]");
    
    Opal.def(self, '$slice!', $Array_slice$excl$97 = function(index, length) {
      var self = this, result = nil, range = nil, range_start = nil, range_end = nil, start = nil;

      
      ;
      result = nil;
      if ($truthy(length === undefined)) {
        if ($truthy($$($nesting, 'Range')['$==='](index))) {
          
          range = index;
          result = self['$[]'](range);
          range_start = $$($nesting, 'Opal').$coerce_to(range.$begin(), $$($nesting, 'Integer'), "to_int");
          range_end = $$($nesting, 'Opal').$coerce_to(range.$end(), $$($nesting, 'Integer'), "to_int");
          
          if (range_start < 0) {
            range_start += self.length;
          }

          if (range_end < 0) {
            range_end += self.length;
          } else if (range_end >= self.length) {
            range_end = self.length - 1;
            if (range.excl) {
              range_end += 1;
            }
          }

          var range_length = range_end - range_start;
          if (range.excl) {
            range_end -= 1;
          } else {
            range_length += 1;
          }

          if (range_start < self.length && range_start >= 0 && range_end < self.length && range_end >= 0 && range_length > 0) {
            self.splice(range_start, range_length);
          }
        ;
        } else {
          
          start = $$($nesting, 'Opal').$coerce_to(index, $$($nesting, 'Integer'), "to_int");
          
          if (start < 0) {
            start += self.length;
          }

          if (start < 0 || start >= self.length) {
            return nil;
          }

          result = self[start];

          if (start === 0) {
            self.shift();
          } else {
            self.splice(start, 1);
          }
        ;
        }
      } else {
        
        start = $$($nesting, 'Opal').$coerce_to(index, $$($nesting, 'Integer'), "to_int");
        length = $$($nesting, 'Opal').$coerce_to(length, $$($nesting, 'Integer'), "to_int");
        
        if (length < 0) {
          return nil;
        }

        var end = start + length;

        result = self['$[]'](start, length);

        if (start < 0) {
          start += self.length;
        }

        if (start + length > self.length) {
          length = self.length - start;
        }

        if (start < self.length && start >= 0) {
          self.splice(start, length);
        }
      ;
      };
      return result;
    }, $Array_slice$excl$97.$$arity = -2);
    
    Opal.def(self, '$sort', $Array_sort$98 = function $$sort() {
      var $iter = $Array_sort$98.$$p, block = $iter || nil, self = this;

      if ($iter) $Array_sort$98.$$p = null;
      
      
      if ($iter) $Array_sort$98.$$p = null;;
      if ($truthy(self.length > 1)) {
      } else {
        return self
      };
      
      if (block === nil) {
        block = function(a, b) {
          return (a)['$<=>'](b);
        };
      }

      return self.slice().sort(function(x, y) {
        var ret = block(x, y);

        if (ret === nil) {
          self.$raise($$($nesting, 'ArgumentError'), "" + "comparison of " + ((x).$inspect()) + " with " + ((y).$inspect()) + " failed");
        }

        return $rb_gt(ret, 0) ? 1 : ($rb_lt(ret, 0) ? -1 : 0);
      });
    ;
    }, $Array_sort$98.$$arity = 0);
    
    Opal.def(self, '$sort!', $Array_sort$excl$99 = function() {
      var $iter = $Array_sort$excl$99.$$p, block = $iter || nil, self = this;

      if ($iter) $Array_sort$excl$99.$$p = null;
      
      
      if ($iter) $Array_sort$excl$99.$$p = null;;
      
      var result;

      if ((block !== nil)) {
        result = $send((self.slice()), 'sort', [], block.$to_proc());
      }
      else {
        result = (self.slice()).$sort();
      }

      self.length = 0;
      for(var i = 0, length = result.length; i < length; i++) {
        self.push(result[i]);
      }

      return self;
    ;
    }, $Array_sort$excl$99.$$arity = 0);
    
    Opal.def(self, '$sort_by!', $Array_sort_by$excl$100 = function() {
      var $iter = $Array_sort_by$excl$100.$$p, block = $iter || nil, $$101, self = this;

      if ($iter) $Array_sort_by$excl$100.$$p = null;
      
      
      if ($iter) $Array_sort_by$excl$100.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["sort_by!"], ($$101 = function(){var self = $$101.$$s || this;

        return self.$size()}, $$101.$$s = self, $$101.$$arity = 0, $$101))
      };
      return self.$replace($send(self, 'sort_by', [], block.$to_proc()));
    }, $Array_sort_by$excl$100.$$arity = 0);
    
    Opal.def(self, '$take', $Array_take$102 = function $$take(count) {
      var self = this;

      
      if (count < 0) {
        self.$raise($$($nesting, 'ArgumentError'));
      }

      return self.slice(0, count);
    
    }, $Array_take$102.$$arity = 1);
    
    Opal.def(self, '$take_while', $Array_take_while$103 = function $$take_while() {
      var $iter = $Array_take_while$103.$$p, block = $iter || nil, self = this;

      if ($iter) $Array_take_while$103.$$p = null;
      
      
      if ($iter) $Array_take_while$103.$$p = null;;
      
      var result = [];

      for (var i = 0, length = self.length, item, value; i < length; i++) {
        item = self[i];

        value = block(item);

        if (value === false || value === nil) {
          return result;
        }

        result.push(item);
      }

      return result;
    ;
    }, $Array_take_while$103.$$arity = 0);
    
    Opal.def(self, '$to_a', $Array_to_a$104 = function $$to_a() {
      var self = this;

      return self
    }, $Array_to_a$104.$$arity = 0);
    Opal.alias(self, "to_ary", "to_a");
    
    Opal.def(self, '$to_h', $Array_to_h$105 = function $$to_h() {
      var self = this;

      
      var i, len = self.length, ary, key, val, hash = $hash2([], {});

      for (i = 0; i < len; i++) {
        ary = $$($nesting, 'Opal')['$coerce_to?'](self[i], $$($nesting, 'Array'), "to_ary");
        if (!ary.$$is_array) {
          self.$raise($$($nesting, 'TypeError'), "" + "wrong element type " + ((ary).$class()) + " at " + (i) + " (expected array)")
        }
        if (ary.length !== 2) {
          self.$raise($$($nesting, 'ArgumentError'), "" + "wrong array length at " + (i) + " (expected 2, was " + ((ary).$length()) + ")")
        }
        key = ary[0];
        val = ary[1];
        Opal.hash_put(hash, key, val);
      }

      return hash;
    
    }, $Array_to_h$105.$$arity = 0);
    Opal.alias(self, "to_s", "inspect");
    
    Opal.def(self, '$transpose', $Array_transpose$106 = function $$transpose() {
      var $$107, self = this, result = nil, max = nil;

      
      if ($truthy(self['$empty?']())) {
        return []};
      result = [];
      max = nil;
      $send(self, 'each', [], ($$107 = function(row){var self = $$107.$$s || this, $a, $$108;

      
        
        if (row == null) {
          row = nil;
        };
        row = (function() {if ($truthy($$($nesting, 'Array')['$==='](row))) {
          return row.$to_a()
        } else {
          return $$($nesting, 'Opal').$coerce_to(row, $$($nesting, 'Array'), "to_ary").$to_a()
        }; return nil; })();
        max = ($truthy($a = max) ? $a : row.length);
        if ($truthy((row.length)['$!='](max))) {
          self.$raise($$($nesting, 'IndexError'), "" + "element size differs (" + (row.length) + " should be " + (max) + ")")};
        return $send((row.length), 'times', [], ($$108 = function(i){var self = $$108.$$s || this, $b, entry = nil, $writer = nil;

        
          
          if (i == null) {
            i = nil;
          };
          entry = ($truthy($b = result['$[]'](i)) ? $b : (($writer = [i, []]), $send(result, '[]=', Opal.to_a($writer)), $writer[$rb_minus($writer["length"], 1)]));
          return entry['$<<'](row.$at(i));}, $$108.$$s = self, $$108.$$arity = 1, $$108));}, $$107.$$s = self, $$107.$$arity = 1, $$107));
      return result;
    }, $Array_transpose$106.$$arity = 0);
    
    Opal.def(self, '$uniq', $Array_uniq$109 = function $$uniq() {
      var $iter = $Array_uniq$109.$$p, block = $iter || nil, self = this;

      if ($iter) $Array_uniq$109.$$p = null;
      
      
      if ($iter) $Array_uniq$109.$$p = null;;
      
      var hash = $hash2([], {}), i, length, item, key;

      if (block === nil) {
        for (i = 0, length = self.length; i < length; i++) {
          item = self[i];
          if (Opal.hash_get(hash, item) === undefined) {
            Opal.hash_put(hash, item, item);
          }
        }
      }
      else {
        for (i = 0, length = self.length; i < length; i++) {
          item = self[i];
          key = Opal.yield1(block, item);
          if (Opal.hash_get(hash, key) === undefined) {
            Opal.hash_put(hash, key, item);
          }
        }
      }

      return toArraySubclass((hash).$values(), self.$class());
    ;
    }, $Array_uniq$109.$$arity = 0);
    
    Opal.def(self, '$uniq!', $Array_uniq$excl$110 = function() {
      var $iter = $Array_uniq$excl$110.$$p, block = $iter || nil, self = this;

      if ($iter) $Array_uniq$excl$110.$$p = null;
      
      
      if ($iter) $Array_uniq$excl$110.$$p = null;;
      
      var original_length = self.length, hash = $hash2([], {}), i, length, item, key;

      for (i = 0, length = original_length; i < length; i++) {
        item = self[i];
        key = (block === nil ? item : Opal.yield1(block, item));

        if (Opal.hash_get(hash, key) === undefined) {
          Opal.hash_put(hash, key, item);
          continue;
        }

        self.splice(i, 1);
        length--;
        i--;
      }

      return self.length === original_length ? nil : self;
    ;
    }, $Array_uniq$excl$110.$$arity = 0);
    
    Opal.def(self, '$unshift', $Array_unshift$111 = function $$unshift($a) {
      var $post_args, objects, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      objects = $post_args;;
      
      for (var i = objects.length - 1; i >= 0; i--) {
        self.unshift(objects[i]);
      }
    ;
      return self;
    }, $Array_unshift$111.$$arity = -1);
    Opal.alias(self, "prepend", "unshift");
    
    Opal.def(self, '$values_at', $Array_values_at$112 = function $$values_at($a) {
      var $post_args, args, $$113, self = this, out = nil;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      out = [];
      $send(args, 'each', [], ($$113 = function(elem){var self = $$113.$$s || this, $$114, finish = nil, start = nil, i = nil;

      
        
        if (elem == null) {
          elem = nil;
        };
        if ($truthy(elem['$is_a?']($$($nesting, 'Range')))) {
          
          finish = $$($nesting, 'Opal').$coerce_to(elem.$last(), $$($nesting, 'Integer'), "to_int");
          start = $$($nesting, 'Opal').$coerce_to(elem.$first(), $$($nesting, 'Integer'), "to_int");
          
          if (start < 0) {
            start = start + self.length;
            return nil;;
          }
        ;
          
          if (finish < 0) {
            finish = finish + self.length;
          }
          if (elem['$exclude_end?']()) {
            finish--;
          }
          if (finish < start) {
            return nil;;
          }
        ;
          return $send(start, 'upto', [finish], ($$114 = function(i){var self = $$114.$$s || this;

          
            
            if (i == null) {
              i = nil;
            };
            return out['$<<'](self.$at(i));}, $$114.$$s = self, $$114.$$arity = 1, $$114));
        } else {
          
          i = $$($nesting, 'Opal').$coerce_to(elem, $$($nesting, 'Integer'), "to_int");
          return out['$<<'](self.$at(i));
        };}, $$113.$$s = self, $$113.$$arity = 1, $$113));
      return out;
    }, $Array_values_at$112.$$arity = -1);
    
    Opal.def(self, '$zip', $Array_zip$115 = function $$zip($a) {
      var $iter = $Array_zip$115.$$p, block = $iter || nil, $post_args, others, $b, self = this;

      if ($iter) $Array_zip$115.$$p = null;
      
      
      if ($iter) $Array_zip$115.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      others = $post_args;;
      
      var result = [], size = self.length, part, o, i, j, jj;

      for (j = 0, jj = others.length; j < jj; j++) {
        o = others[j];
        if (o.$$is_array) {
          continue;
        }
        if (o.$$is_enumerator) {
          if (o.$size() === Infinity) {
            others[j] = o.$take(size);
          } else {
            others[j] = o.$to_a();
          }
          continue;
        }
        others[j] = ($truthy($b = $$($nesting, 'Opal')['$coerce_to?'](o, $$($nesting, 'Array'), "to_ary")) ? $b : $$($nesting, 'Opal')['$coerce_to!'](o, $$($nesting, 'Enumerator'), "each")).$to_a();
      }

      for (i = 0; i < size; i++) {
        part = [self[i]];

        for (j = 0, jj = others.length; j < jj; j++) {
          o = others[j][i];

          if (o == null) {
            o = nil;
          }

          part[j + 1] = o;
        }

        result[i] = part;
      }

      if (block !== nil) {
        for (i = 0; i < size; i++) {
          block(result[i]);
        }

        return nil;
      }

      return result;
    ;
    }, $Array_zip$115.$$arity = -1);
    Opal.defs(self, '$inherited', $Array_inherited$116 = function $$inherited(klass) {
      var self = this;

      
      klass.$$prototype.$to_a = function() {
        return this.slice(0, this.length);
      }
    
    }, $Array_inherited$116.$$arity = 1);
    
    Opal.def(self, '$instance_variables', $Array_instance_variables$117 = function $$instance_variables() {
      var $$118, $iter = $Array_instance_variables$117.$$p, $yield = $iter || nil, self = this, $zuper = nil, $zuper_i = nil, $zuper_ii = nil;

      if ($iter) $Array_instance_variables$117.$$p = null;
      // Prepare super implicit arguments
      for($zuper_i = 0, $zuper_ii = arguments.length, $zuper = new Array($zuper_ii); $zuper_i < $zuper_ii; $zuper_i++) {
        $zuper[$zuper_i] = arguments[$zuper_i];
      }
      return $send($send(self, Opal.find_super_dispatcher(self, 'instance_variables', $Array_instance_variables$117, false), $zuper, $iter), 'reject', [], ($$118 = function(ivar){var self = $$118.$$s || this, $a;

      
        
        if (ivar == null) {
          ivar = nil;
        };
        return ($truthy($a = /^@\d+$/.test(ivar)) ? $a : ivar['$==']("@length"));}, $$118.$$s = self, $$118.$$arity = 1, $$118))
    }, $Array_instance_variables$117.$$arity = 0);
    $$($nesting, 'Opal').$pristine(self.$singleton_class(), "allocate");
    $$($nesting, 'Opal').$pristine(self, "copy_instance_variables", "initialize_dup");
    return (Opal.def(self, '$pack', $Array_pack$119 = function $$pack($a) {
      var $post_args, args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      return self.$raise("To use Array#pack, you must first require 'corelib/array/pack'.");
    }, $Array_pack$119.$$arity = -1), nil) && 'pack';
  })($nesting[0], Array, $nesting);
};

/* Generated by Opal 0.11.99.dev */
Opal.modules["corelib/hash"] = function(Opal) {
  function $rb_ge(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs >= rhs : lhs['$>='](rhs);
  }
  function $rb_gt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs > rhs : lhs['$>'](rhs);
  }
  function $rb_minus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs - rhs : lhs['$-'](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice, $klass = Opal.klass, $send = Opal.send, $hash2 = Opal.hash2, $truthy = Opal.truthy;

  Opal.add_stubs(['$require', '$include', '$coerce_to?', '$[]', '$merge!', '$allocate', '$raise', '$coerce_to!', '$each', '$fetch', '$>=', '$>', '$==', '$compare_by_identity', '$lambda?', '$abs', '$arity', '$enum_for', '$size', '$respond_to?', '$class', '$dig', '$new', '$inspect', '$map', '$to_proc', '$flatten', '$eql?', '$default', '$dup', '$default_proc', '$default_proc=', '$-', '$default=', '$proc']);
  
  self.$require("corelib/enumerable");
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Hash');

    var $nesting = [self].concat($parent_nesting), $Hash_$$$1, $Hash_allocate$2, $Hash_try_convert$3, $Hash_initialize$4, $Hash_$eq_eq$5, $Hash_$gt_eq$6, $Hash_$gt$8, $Hash_$lt$9, $Hash_$lt_eq$10, $Hash_$$$11, $Hash_$$$eq$12, $Hash_assoc$13, $Hash_clear$14, $Hash_clone$15, $Hash_compact$16, $Hash_compact$excl$17, $Hash_compare_by_identity$18, $Hash_compare_by_identity$ques$19, $Hash_default$20, $Hash_default$eq$21, $Hash_default_proc$22, $Hash_default_proc$eq$23, $Hash_delete$24, $Hash_delete_if$25, $Hash_dig$27, $Hash_each$28, $Hash_each_key$30, $Hash_each_value$32, $Hash_empty$ques$34, $Hash_fetch$35, $Hash_fetch_values$36, $Hash_flatten$38, $Hash_has_key$ques$39, $Hash_has_value$ques$40, $Hash_hash$41, $Hash_index$42, $Hash_indexes$43, $Hash_inspect$44, $Hash_invert$45, $Hash_keep_if$46, $Hash_keys$48, $Hash_length$49, $Hash_merge$50, $Hash_merge$excl$51, $Hash_rassoc$52, $Hash_rehash$53, $Hash_reject$54, $Hash_reject$excl$56, $Hash_replace$58, $Hash_select$59, $Hash_select$excl$61, $Hash_shift$63, $Hash_slice$64, $Hash_to_a$65, $Hash_to_h$66, $Hash_to_hash$67, $Hash_to_proc$68, $Hash_transform_keys$70, $Hash_transform_keys$excl$72, $Hash_transform_values$74, $Hash_transform_values$excl$76, $Hash_values$78;

    
    self.$include($$($nesting, 'Enumerable'));
    self.$$prototype.$$is_hash = true;
    Opal.defs(self, '$[]', $Hash_$$$1 = function($a) {
      var $post_args, argv, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      argv = $post_args;;
      
      var hash, argc = argv.length, i;

      if (argc === 1) {
        hash = $$($nesting, 'Opal')['$coerce_to?'](argv['$[]'](0), $$($nesting, 'Hash'), "to_hash");
        if (hash !== nil) {
          return self.$allocate()['$merge!'](hash);
        }

        argv = $$($nesting, 'Opal')['$coerce_to?'](argv['$[]'](0), $$($nesting, 'Array'), "to_ary");
        if (argv === nil) {
          self.$raise($$($nesting, 'ArgumentError'), "odd number of arguments for Hash")
        }

        argc = argv.length;
        hash = self.$allocate();

        for (i = 0; i < argc; i++) {
          if (!argv[i].$$is_array) continue;
          switch(argv[i].length) {
          case 1:
            hash.$store(argv[i][0], nil);
            break;
          case 2:
            hash.$store(argv[i][0], argv[i][1]);
            break;
          default:
            self.$raise($$($nesting, 'ArgumentError'), "" + "invalid number of elements (" + (argv[i].length) + " for 1..2)")
          }
        }

        return hash;
      }

      if (argc % 2 !== 0) {
        self.$raise($$($nesting, 'ArgumentError'), "odd number of arguments for Hash")
      }

      hash = self.$allocate();

      for (i = 0; i < argc; i += 2) {
        hash.$store(argv[i], argv[i + 1]);
      }

      return hash;
    ;
    }, $Hash_$$$1.$$arity = -1);
    Opal.defs(self, '$allocate', $Hash_allocate$2 = function $$allocate() {
      var self = this;

      
      var hash = new self.$$constructor();

      Opal.hash_init(hash);

      hash.$$none = nil;
      hash.$$proc = nil;

      return hash;
    
    }, $Hash_allocate$2.$$arity = 0);
    Opal.defs(self, '$try_convert', $Hash_try_convert$3 = function $$try_convert(obj) {
      var self = this;

      return $$($nesting, 'Opal')['$coerce_to?'](obj, $$($nesting, 'Hash'), "to_hash")
    }, $Hash_try_convert$3.$$arity = 1);
    
    Opal.def(self, '$initialize', $Hash_initialize$4 = function $$initialize(defaults) {
      var $iter = $Hash_initialize$4.$$p, block = $iter || nil, self = this;

      if ($iter) $Hash_initialize$4.$$p = null;
      
      
      if ($iter) $Hash_initialize$4.$$p = null;;
      ;
      
      if (defaults !== undefined && block !== nil) {
        self.$raise($$($nesting, 'ArgumentError'), "wrong number of arguments (1 for 0)")
      }
      self.$$none = (defaults === undefined ? nil : defaults);
      self.$$proc = block;

      return self;
    ;
    }, $Hash_initialize$4.$$arity = -1);
    
    Opal.def(self, '$==', $Hash_$eq_eq$5 = function(other) {
      var self = this;

      
      if (self === other) {
        return true;
      }

      if (!other.$$is_hash) {
        return false;
      }

      if (self.$$keys.length !== other.$$keys.length) {
        return false;
      }

      for (var i = 0, keys = self.$$keys, length = keys.length, key, value, other_value; i < length; i++) {
        key = keys[i];

        if (key.$$is_string) {
          value = self.$$smap[key];
          other_value = other.$$smap[key];
        } else {
          value = key.value;
          other_value = Opal.hash_get(other, key.key);
        }

        if (other_value === undefined || !value['$eql?'](other_value)) {
          return false;
        }
      }

      return true;
    
    }, $Hash_$eq_eq$5.$$arity = 1);
    
    Opal.def(self, '$>=', $Hash_$gt_eq$6 = function(other) {
      var $$7, self = this, result = nil;

      
      other = $$($nesting, 'Opal')['$coerce_to!'](other, $$($nesting, 'Hash'), "to_hash");
      
      if (self.$$keys.length < other.$$keys.length) {
        return false
      }
    ;
      result = true;
      $send(other, 'each', [], ($$7 = function(other_key, other_val){var self = $$7.$$s || this, val = nil;

      
        
        if (other_key == null) {
          other_key = nil;
        };
        
        if (other_val == null) {
          other_val = nil;
        };
        val = self.$fetch(other_key, null);
        
        if (val == null || val !== other_val) {
          result = false;
          return;
        }
      ;}, $$7.$$s = self, $$7.$$arity = 2, $$7));
      return result;
    }, $Hash_$gt_eq$6.$$arity = 1);
    
    Opal.def(self, '$>', $Hash_$gt$8 = function(other) {
      var self = this;

      
      other = $$($nesting, 'Opal')['$coerce_to!'](other, $$($nesting, 'Hash'), "to_hash");
      
      if (self.$$keys.length <= other.$$keys.length) {
        return false
      }
    ;
      return $rb_ge(self, other);
    }, $Hash_$gt$8.$$arity = 1);
    
    Opal.def(self, '$<', $Hash_$lt$9 = function(other) {
      var self = this;

      
      other = $$($nesting, 'Opal')['$coerce_to!'](other, $$($nesting, 'Hash'), "to_hash");
      return $rb_gt(other, self);
    }, $Hash_$lt$9.$$arity = 1);
    
    Opal.def(self, '$<=', $Hash_$lt_eq$10 = function(other) {
      var self = this;

      
      other = $$($nesting, 'Opal')['$coerce_to!'](other, $$($nesting, 'Hash'), "to_hash");
      return $rb_ge(other, self);
    }, $Hash_$lt_eq$10.$$arity = 1);
    
    Opal.def(self, '$[]', $Hash_$$$11 = function(key) {
      var self = this;

      
      var value = Opal.hash_get(self, key);

      if (value !== undefined) {
        return value;
      }

      return self.$default(key);
    
    }, $Hash_$$$11.$$arity = 1);
    
    Opal.def(self, '$[]=', $Hash_$$$eq$12 = function(key, value) {
      var self = this;

      
      Opal.hash_put(self, key, value);
      return value;
    
    }, $Hash_$$$eq$12.$$arity = 2);
    
    Opal.def(self, '$assoc', $Hash_assoc$13 = function $$assoc(object) {
      var self = this;

      
      for (var i = 0, keys = self.$$keys, length = keys.length, key; i < length; i++) {
        key = keys[i];

        if (key.$$is_string) {
          if ((key)['$=='](object)) {
            return [key, self.$$smap[key]];
          }
        } else {
          if ((key.key)['$=='](object)) {
            return [key.key, key.value];
          }
        }
      }

      return nil;
    
    }, $Hash_assoc$13.$$arity = 1);
    
    Opal.def(self, '$clear', $Hash_clear$14 = function $$clear() {
      var self = this;

      
      Opal.hash_init(self);
      return self;
    
    }, $Hash_clear$14.$$arity = 0);
    
    Opal.def(self, '$clone', $Hash_clone$15 = function $$clone() {
      var self = this;

      
      var hash = new self.$$class();

      Opal.hash_init(hash);
      Opal.hash_clone(self, hash);

      return hash;
    
    }, $Hash_clone$15.$$arity = 0);
    
    Opal.def(self, '$compact', $Hash_compact$16 = function $$compact() {
      var self = this;

      
      var hash = Opal.hash();

      for (var i = 0, keys = self.$$keys, length = keys.length, key, value, obj; i < length; i++) {
        key = keys[i];

        if (key.$$is_string) {
          value = self.$$smap[key];
        } else {
          value = key.value;
          key = key.key;
        }

        if (value !== nil) {
          Opal.hash_put(hash, key, value);
        }
      }

      return hash;
    
    }, $Hash_compact$16.$$arity = 0);
    
    Opal.def(self, '$compact!', $Hash_compact$excl$17 = function() {
      var self = this;

      
      var changes_were_made = false;

      for (var i = 0, keys = self.$$keys, length = keys.length, key, value, obj; i < length; i++) {
        key = keys[i];

        if (key.$$is_string) {
          value = self.$$smap[key];
        } else {
          value = key.value;
          key = key.key;
        }

        if (value === nil) {
          if (Opal.hash_delete(self, key) !== undefined) {
            changes_were_made = true;
            length--;
            i--;
          }
        }
      }

      return changes_were_made ? self : nil;
    
    }, $Hash_compact$excl$17.$$arity = 0);
    
    Opal.def(self, '$compare_by_identity', $Hash_compare_by_identity$18 = function $$compare_by_identity() {
      var self = this;

      
      var i, ii, key, keys = self.$$keys, identity_hash;

      if (self.$$by_identity) return self;
      if (self.$$keys.length === 0) {
        self.$$by_identity = true
        return self;
      }

      identity_hash = $hash2([], {}).$compare_by_identity();
      for(i = 0, ii = keys.length; i < ii; i++) {
        key = keys[i];
        if (!key.$$is_string) key = key.key;
        Opal.hash_put(identity_hash, key, Opal.hash_get(self, key));
      }

      self.$$by_identity = true;
      self.$$map = identity_hash.$$map;
      self.$$smap = identity_hash.$$smap;
      return self;
    
    }, $Hash_compare_by_identity$18.$$arity = 0);
    
    Opal.def(self, '$compare_by_identity?', $Hash_compare_by_identity$ques$19 = function() {
      var self = this;

      return self.$$by_identity === true;
    }, $Hash_compare_by_identity$ques$19.$$arity = 0);
    
    Opal.def(self, '$default', $Hash_default$20 = function(key) {
      var self = this;

      
      ;
      
      if (key !== undefined && self.$$proc !== nil && self.$$proc !== undefined) {
        return self.$$proc.$call(self, key);
      }
      if (self.$$none === undefined) {
        return nil;
      }
      return self.$$none;
    ;
    }, $Hash_default$20.$$arity = -1);
    
    Opal.def(self, '$default=', $Hash_default$eq$21 = function(object) {
      var self = this;

      
      self.$$proc = nil;
      self.$$none = object;

      return object;
    
    }, $Hash_default$eq$21.$$arity = 1);
    
    Opal.def(self, '$default_proc', $Hash_default_proc$22 = function $$default_proc() {
      var self = this;

      
      if (self.$$proc !== undefined) {
        return self.$$proc;
      }
      return nil;
    
    }, $Hash_default_proc$22.$$arity = 0);
    
    Opal.def(self, '$default_proc=', $Hash_default_proc$eq$23 = function(default_proc) {
      var self = this;

      
      var proc = default_proc;

      if (proc !== nil) {
        proc = $$($nesting, 'Opal')['$coerce_to!'](proc, $$($nesting, 'Proc'), "to_proc");

        if ((proc)['$lambda?']() && (proc).$arity().$abs() !== 2) {
          self.$raise($$($nesting, 'TypeError'), "default_proc takes two arguments");
        }
      }

      self.$$none = nil;
      self.$$proc = proc;

      return default_proc;
    
    }, $Hash_default_proc$eq$23.$$arity = 1);
    
    Opal.def(self, '$delete', $Hash_delete$24 = function(key) {
      var $iter = $Hash_delete$24.$$p, block = $iter || nil, self = this;

      if ($iter) $Hash_delete$24.$$p = null;
      
      
      if ($iter) $Hash_delete$24.$$p = null;;
      
      var value = Opal.hash_delete(self, key);

      if (value !== undefined) {
        return value;
      }

      if (block !== nil) {
        return Opal.yield1(block, key);
      }

      return nil;
    ;
    }, $Hash_delete$24.$$arity = 1);
    
    Opal.def(self, '$delete_if', $Hash_delete_if$25 = function $$delete_if() {
      var $iter = $Hash_delete_if$25.$$p, block = $iter || nil, $$26, self = this;

      if ($iter) $Hash_delete_if$25.$$p = null;
      
      
      if ($iter) $Hash_delete_if$25.$$p = null;;
      if ($truthy(block)) {
      } else {
        return $send(self, 'enum_for', ["delete_if"], ($$26 = function(){var self = $$26.$$s || this;

        return self.$size()}, $$26.$$s = self, $$26.$$arity = 0, $$26))
      };
      
      for (var i = 0, keys = self.$$keys, length = keys.length, key, value, obj; i < length; i++) {
        key = keys[i];

        if (key.$$is_string) {
          value = self.$$smap[key];
        } else {
          value = key.value;
          key = key.key;
        }

        obj = block(key, value);

        if (obj !== false && obj !== nil) {
          if (Opal.hash_delete(self, key) !== undefined) {
            length--;
            i--;
          }
        }
      }

      return self;
    ;
    }, $Hash_delete_if$25.$$arity = 0);
    Opal.alias(self, "dup", "clone");
    
    Opal.def(self, '$dig', $Hash_dig$27 = function $$dig(key, $a) {
      var $post_args, keys, self = this, item = nil;

      
      
      $post_args = Opal.slice.call(arguments, 1, arguments.length);
      
      keys = $post_args;;
      item = self['$[]'](key);
      
      if (item === nil || keys.length === 0) {
        return item;
      }
    ;
      if ($truthy(item['$respond_to?']("dig"))) {
      } else {
        self.$raise($$($nesting, 'TypeError'), "" + (item.$class()) + " does not have #dig method")
      };
      return $send(item, 'dig', Opal.to_a(keys));
    }, $Hash_dig$27.$$arity = -2);
    
    Opal.def(self, '$each', $Hash_each$28 = function $$each() {
      var $iter = $Hash_each$28.$$p, block = $iter || nil, $$29, self = this;

      if ($iter) $Hash_each$28.$$p = null;
      
      
      if ($iter) $Hash_each$28.$$p = null;;
      if ($truthy(block)) {
      } else {
        return $send(self, 'enum_for', ["each"], ($$29 = function(){var self = $$29.$$s || this;

        return self.$size()}, $$29.$$s = self, $$29.$$arity = 0, $$29))
      };
      
      for (var i = 0, keys = self.$$keys, length = keys.length, key, value; i < length; i++) {
        key = keys[i];

        if (key.$$is_string) {
          value = self.$$smap[key];
        } else {
          value = key.value;
          key = key.key;
        }

        Opal.yield1(block, [key, value]);
      }

      return self;
    ;
    }, $Hash_each$28.$$arity = 0);
    
    Opal.def(self, '$each_key', $Hash_each_key$30 = function $$each_key() {
      var $iter = $Hash_each_key$30.$$p, block = $iter || nil, $$31, self = this;

      if ($iter) $Hash_each_key$30.$$p = null;
      
      
      if ($iter) $Hash_each_key$30.$$p = null;;
      if ($truthy(block)) {
      } else {
        return $send(self, 'enum_for', ["each_key"], ($$31 = function(){var self = $$31.$$s || this;

        return self.$size()}, $$31.$$s = self, $$31.$$arity = 0, $$31))
      };
      
      for (var i = 0, keys = self.$$keys, length = keys.length, key; i < length; i++) {
        key = keys[i];

        block(key.$$is_string ? key : key.key);
      }

      return self;
    ;
    }, $Hash_each_key$30.$$arity = 0);
    Opal.alias(self, "each_pair", "each");
    
    Opal.def(self, '$each_value', $Hash_each_value$32 = function $$each_value() {
      var $iter = $Hash_each_value$32.$$p, block = $iter || nil, $$33, self = this;

      if ($iter) $Hash_each_value$32.$$p = null;
      
      
      if ($iter) $Hash_each_value$32.$$p = null;;
      if ($truthy(block)) {
      } else {
        return $send(self, 'enum_for', ["each_value"], ($$33 = function(){var self = $$33.$$s || this;

        return self.$size()}, $$33.$$s = self, $$33.$$arity = 0, $$33))
      };
      
      for (var i = 0, keys = self.$$keys, length = keys.length, key; i < length; i++) {
        key = keys[i];

        block(key.$$is_string ? self.$$smap[key] : key.value);
      }

      return self;
    ;
    }, $Hash_each_value$32.$$arity = 0);
    
    Opal.def(self, '$empty?', $Hash_empty$ques$34 = function() {
      var self = this;

      return self.$$keys.length === 0;
    }, $Hash_empty$ques$34.$$arity = 0);
    Opal.alias(self, "eql?", "==");
    
    Opal.def(self, '$fetch', $Hash_fetch$35 = function $$fetch(key, defaults) {
      var $iter = $Hash_fetch$35.$$p, block = $iter || nil, self = this;

      if ($iter) $Hash_fetch$35.$$p = null;
      
      
      if ($iter) $Hash_fetch$35.$$p = null;;
      ;
      
      var value = Opal.hash_get(self, key);

      if (value !== undefined) {
        return value;
      }

      if (block !== nil) {
        return block(key);
      }

      if (defaults !== undefined) {
        return defaults;
      }
    ;
      return self.$raise($$($nesting, 'KeyError').$new("" + "key not found: " + (key.$inspect()), $hash2(["key", "receiver"], {"key": key, "receiver": self})));
    }, $Hash_fetch$35.$$arity = -2);
    
    Opal.def(self, '$fetch_values', $Hash_fetch_values$36 = function $$fetch_values($a) {
      var $iter = $Hash_fetch_values$36.$$p, block = $iter || nil, $post_args, keys, $$37, self = this;

      if ($iter) $Hash_fetch_values$36.$$p = null;
      
      
      if ($iter) $Hash_fetch_values$36.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      keys = $post_args;;
      return $send(keys, 'map', [], ($$37 = function(key){var self = $$37.$$s || this;

      
        
        if (key == null) {
          key = nil;
        };
        return $send(self, 'fetch', [key], block.$to_proc());}, $$37.$$s = self, $$37.$$arity = 1, $$37));
    }, $Hash_fetch_values$36.$$arity = -1);
    
    Opal.def(self, '$flatten', $Hash_flatten$38 = function $$flatten(level) {
      var self = this;

      
      
      if (level == null) {
        level = 1;
      };
      level = $$($nesting, 'Opal')['$coerce_to!'](level, $$($nesting, 'Integer'), "to_int");
      
      var result = [];

      for (var i = 0, keys = self.$$keys, length = keys.length, key, value; i < length; i++) {
        key = keys[i];

        if (key.$$is_string) {
          value = self.$$smap[key];
        } else {
          value = key.value;
          key = key.key;
        }

        result.push(key);

        if (value.$$is_array) {
          if (level === 1) {
            result.push(value);
            continue;
          }

          result = result.concat((value).$flatten(level - 2));
          continue;
        }

        result.push(value);
      }

      return result;
    ;
    }, $Hash_flatten$38.$$arity = -1);
    
    Opal.def(self, '$has_key?', $Hash_has_key$ques$39 = function(key) {
      var self = this;

      return Opal.hash_get(self, key) !== undefined;
    }, $Hash_has_key$ques$39.$$arity = 1);
    
    Opal.def(self, '$has_value?', $Hash_has_value$ques$40 = function(value) {
      var self = this;

      
      for (var i = 0, keys = self.$$keys, length = keys.length, key; i < length; i++) {
        key = keys[i];

        if (((key.$$is_string ? self.$$smap[key] : key.value))['$=='](value)) {
          return true;
        }
      }

      return false;
    
    }, $Hash_has_value$ques$40.$$arity = 1);
    
    Opal.def(self, '$hash', $Hash_hash$41 = function $$hash() {
      var self = this;

      
      var top = (Opal.hash_ids === undefined),
          hash_id = self.$object_id(),
          result = ['Hash'],
          key, item;

      try {
        if (top) {
          Opal.hash_ids = Object.create(null);
        }

        if (Opal[hash_id]) {
          return 'self';
        }

        for (key in Opal.hash_ids) {
          item = Opal.hash_ids[key];
          if (self['$eql?'](item)) {
            return 'self';
          }
        }

        Opal.hash_ids[hash_id] = self;

        for (var i = 0, keys = self.$$keys, length = keys.length; i < length; i++) {
          key = keys[i];

          if (key.$$is_string) {
            result.push([key, self.$$smap[key].$hash()]);
          } else {
            result.push([key.key_hash, key.value.$hash()]);
          }
        }

        return result.sort().join();

      } finally {
        if (top) {
          Opal.hash_ids = undefined;
        }
      }
    
    }, $Hash_hash$41.$$arity = 0);
    Opal.alias(self, "include?", "has_key?");
    
    Opal.def(self, '$index', $Hash_index$42 = function $$index(object) {
      var self = this;

      
      for (var i = 0, keys = self.$$keys, length = keys.length, key, value; i < length; i++) {
        key = keys[i];

        if (key.$$is_string) {
          value = self.$$smap[key];
        } else {
          value = key.value;
          key = key.key;
        }

        if ((value)['$=='](object)) {
          return key;
        }
      }

      return nil;
    
    }, $Hash_index$42.$$arity = 1);
    
    Opal.def(self, '$indexes', $Hash_indexes$43 = function $$indexes($a) {
      var $post_args, args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      
      var result = [];

      for (var i = 0, length = args.length, key, value; i < length; i++) {
        key = args[i];
        value = Opal.hash_get(self, key);

        if (value === undefined) {
          result.push(self.$default());
          continue;
        }

        result.push(value);
      }

      return result;
    ;
    }, $Hash_indexes$43.$$arity = -1);
    Opal.alias(self, "indices", "indexes");
    var inspect_ids;
    
    Opal.def(self, '$inspect', $Hash_inspect$44 = function $$inspect() {
      var self = this;

      
      var top = (inspect_ids === undefined),
          hash_id = self.$object_id(),
          result = [];

      try {
        if (top) {
          inspect_ids = {};
        }

        if (inspect_ids.hasOwnProperty(hash_id)) {
          return '{...}';
        }

        inspect_ids[hash_id] = true;

        for (var i = 0, keys = self.$$keys, length = keys.length, key, value; i < length; i++) {
          key = keys[i];

          if (key.$$is_string) {
            value = self.$$smap[key];
          } else {
            value = key.value;
            key = key.key;
          }

          result.push(key.$inspect() + '=>' + value.$inspect());
        }

        return '{' + result.join(', ') + '}';

      } finally {
        if (top) {
          inspect_ids = undefined;
        }
      }
    
    }, $Hash_inspect$44.$$arity = 0);
    
    Opal.def(self, '$invert', $Hash_invert$45 = function $$invert() {
      var self = this;

      
      var hash = Opal.hash();

      for (var i = 0, keys = self.$$keys, length = keys.length, key, value; i < length; i++) {
        key = keys[i];

        if (key.$$is_string) {
          value = self.$$smap[key];
        } else {
          value = key.value;
          key = key.key;
        }

        Opal.hash_put(hash, value, key);
      }

      return hash;
    
    }, $Hash_invert$45.$$arity = 0);
    
    Opal.def(self, '$keep_if', $Hash_keep_if$46 = function $$keep_if() {
      var $iter = $Hash_keep_if$46.$$p, block = $iter || nil, $$47, self = this;

      if ($iter) $Hash_keep_if$46.$$p = null;
      
      
      if ($iter) $Hash_keep_if$46.$$p = null;;
      if ($truthy(block)) {
      } else {
        return $send(self, 'enum_for', ["keep_if"], ($$47 = function(){var self = $$47.$$s || this;

        return self.$size()}, $$47.$$s = self, $$47.$$arity = 0, $$47))
      };
      
      for (var i = 0, keys = self.$$keys, length = keys.length, key, value, obj; i < length; i++) {
        key = keys[i];

        if (key.$$is_string) {
          value = self.$$smap[key];
        } else {
          value = key.value;
          key = key.key;
        }

        obj = block(key, value);

        if (obj === false || obj === nil) {
          if (Opal.hash_delete(self, key) !== undefined) {
            length--;
            i--;
          }
        }
      }

      return self;
    ;
    }, $Hash_keep_if$46.$$arity = 0);
    Opal.alias(self, "key", "index");
    Opal.alias(self, "key?", "has_key?");
    
    Opal.def(self, '$keys', $Hash_keys$48 = function $$keys() {
      var self = this;

      
      var result = [];

      for (var i = 0, keys = self.$$keys, length = keys.length, key; i < length; i++) {
        key = keys[i];

        if (key.$$is_string) {
          result.push(key);
        } else {
          result.push(key.key);
        }
      }

      return result;
    
    }, $Hash_keys$48.$$arity = 0);
    
    Opal.def(self, '$length', $Hash_length$49 = function $$length() {
      var self = this;

      return self.$$keys.length;
    }, $Hash_length$49.$$arity = 0);
    Opal.alias(self, "member?", "has_key?");
    
    Opal.def(self, '$merge', $Hash_merge$50 = function $$merge(other) {
      var $iter = $Hash_merge$50.$$p, block = $iter || nil, self = this;

      if ($iter) $Hash_merge$50.$$p = null;
      
      
      if ($iter) $Hash_merge$50.$$p = null;;
      return $send(self.$dup(), 'merge!', [other], block.$to_proc());
    }, $Hash_merge$50.$$arity = 1);
    
    Opal.def(self, '$merge!', $Hash_merge$excl$51 = function(other) {
      var $iter = $Hash_merge$excl$51.$$p, block = $iter || nil, self = this;

      if ($iter) $Hash_merge$excl$51.$$p = null;
      
      
      if ($iter) $Hash_merge$excl$51.$$p = null;;
      
      if (!other.$$is_hash) {
        other = $$($nesting, 'Opal')['$coerce_to!'](other, $$($nesting, 'Hash'), "to_hash");
      }

      var i, other_keys = other.$$keys, length = other_keys.length, key, value, other_value;

      if (block === nil) {
        for (i = 0; i < length; i++) {
          key = other_keys[i];

          if (key.$$is_string) {
            other_value = other.$$smap[key];
          } else {
            other_value = key.value;
            key = key.key;
          }

          Opal.hash_put(self, key, other_value);
        }

        return self;
      }

      for (i = 0; i < length; i++) {
        key = other_keys[i];

        if (key.$$is_string) {
          other_value = other.$$smap[key];
        } else {
          other_value = key.value;
          key = key.key;
        }

        value = Opal.hash_get(self, key);

        if (value === undefined) {
          Opal.hash_put(self, key, other_value);
          continue;
        }

        Opal.hash_put(self, key, block(key, value, other_value));
      }

      return self;
    ;
    }, $Hash_merge$excl$51.$$arity = 1);
    
    Opal.def(self, '$rassoc', $Hash_rassoc$52 = function $$rassoc(object) {
      var self = this;

      
      for (var i = 0, keys = self.$$keys, length = keys.length, key, value; i < length; i++) {
        key = keys[i];

        if (key.$$is_string) {
          value = self.$$smap[key];
        } else {
          value = key.value;
          key = key.key;
        }

        if ((value)['$=='](object)) {
          return [key, value];
        }
      }

      return nil;
    
    }, $Hash_rassoc$52.$$arity = 1);
    
    Opal.def(self, '$rehash', $Hash_rehash$53 = function $$rehash() {
      var self = this;

      
      Opal.hash_rehash(self);
      return self;
    
    }, $Hash_rehash$53.$$arity = 0);
    
    Opal.def(self, '$reject', $Hash_reject$54 = function $$reject() {
      var $iter = $Hash_reject$54.$$p, block = $iter || nil, $$55, self = this;

      if ($iter) $Hash_reject$54.$$p = null;
      
      
      if ($iter) $Hash_reject$54.$$p = null;;
      if ($truthy(block)) {
      } else {
        return $send(self, 'enum_for', ["reject"], ($$55 = function(){var self = $$55.$$s || this;

        return self.$size()}, $$55.$$s = self, $$55.$$arity = 0, $$55))
      };
      
      var hash = Opal.hash();

      for (var i = 0, keys = self.$$keys, length = keys.length, key, value, obj; i < length; i++) {
        key = keys[i];

        if (key.$$is_string) {
          value = self.$$smap[key];
        } else {
          value = key.value;
          key = key.key;
        }

        obj = block(key, value);

        if (obj === false || obj === nil) {
          Opal.hash_put(hash, key, value);
        }
      }

      return hash;
    ;
    }, $Hash_reject$54.$$arity = 0);
    
    Opal.def(self, '$reject!', $Hash_reject$excl$56 = function() {
      var $iter = $Hash_reject$excl$56.$$p, block = $iter || nil, $$57, self = this;

      if ($iter) $Hash_reject$excl$56.$$p = null;
      
      
      if ($iter) $Hash_reject$excl$56.$$p = null;;
      if ($truthy(block)) {
      } else {
        return $send(self, 'enum_for', ["reject!"], ($$57 = function(){var self = $$57.$$s || this;

        return self.$size()}, $$57.$$s = self, $$57.$$arity = 0, $$57))
      };
      
      var changes_were_made = false;

      for (var i = 0, keys = self.$$keys, length = keys.length, key, value, obj; i < length; i++) {
        key = keys[i];

        if (key.$$is_string) {
          value = self.$$smap[key];
        } else {
          value = key.value;
          key = key.key;
        }

        obj = block(key, value);

        if (obj !== false && obj !== nil) {
          if (Opal.hash_delete(self, key) !== undefined) {
            changes_were_made = true;
            length--;
            i--;
          }
        }
      }

      return changes_were_made ? self : nil;
    ;
    }, $Hash_reject$excl$56.$$arity = 0);
    
    Opal.def(self, '$replace', $Hash_replace$58 = function $$replace(other) {
      var self = this, $writer = nil;

      
      other = $$($nesting, 'Opal')['$coerce_to!'](other, $$($nesting, 'Hash'), "to_hash");
      
      Opal.hash_init(self);

      for (var i = 0, other_keys = other.$$keys, length = other_keys.length, key, value, other_value; i < length; i++) {
        key = other_keys[i];

        if (key.$$is_string) {
          other_value = other.$$smap[key];
        } else {
          other_value = key.value;
          key = key.key;
        }

        Opal.hash_put(self, key, other_value);
      }
    ;
      if ($truthy(other.$default_proc())) {
        
        $writer = [other.$default_proc()];
        $send(self, 'default_proc=', Opal.to_a($writer));
        $writer[$rb_minus($writer["length"], 1)];
      } else {
        
        $writer = [other.$default()];
        $send(self, 'default=', Opal.to_a($writer));
        $writer[$rb_minus($writer["length"], 1)];
      };
      return self;
    }, $Hash_replace$58.$$arity = 1);
    
    Opal.def(self, '$select', $Hash_select$59 = function $$select() {
      var $iter = $Hash_select$59.$$p, block = $iter || nil, $$60, self = this;

      if ($iter) $Hash_select$59.$$p = null;
      
      
      if ($iter) $Hash_select$59.$$p = null;;
      if ($truthy(block)) {
      } else {
        return $send(self, 'enum_for', ["select"], ($$60 = function(){var self = $$60.$$s || this;

        return self.$size()}, $$60.$$s = self, $$60.$$arity = 0, $$60))
      };
      
      var hash = Opal.hash();

      for (var i = 0, keys = self.$$keys, length = keys.length, key, value, obj; i < length; i++) {
        key = keys[i];

        if (key.$$is_string) {
          value = self.$$smap[key];
        } else {
          value = key.value;
          key = key.key;
        }

        obj = block(key, value);

        if (obj !== false && obj !== nil) {
          Opal.hash_put(hash, key, value);
        }
      }

      return hash;
    ;
    }, $Hash_select$59.$$arity = 0);
    
    Opal.def(self, '$select!', $Hash_select$excl$61 = function() {
      var $iter = $Hash_select$excl$61.$$p, block = $iter || nil, $$62, self = this;

      if ($iter) $Hash_select$excl$61.$$p = null;
      
      
      if ($iter) $Hash_select$excl$61.$$p = null;;
      if ($truthy(block)) {
      } else {
        return $send(self, 'enum_for', ["select!"], ($$62 = function(){var self = $$62.$$s || this;

        return self.$size()}, $$62.$$s = self, $$62.$$arity = 0, $$62))
      };
      
      var result = nil;

      for (var i = 0, keys = self.$$keys, length = keys.length, key, value, obj; i < length; i++) {
        key = keys[i];

        if (key.$$is_string) {
          value = self.$$smap[key];
        } else {
          value = key.value;
          key = key.key;
        }

        obj = block(key, value);

        if (obj === false || obj === nil) {
          if (Opal.hash_delete(self, key) !== undefined) {
            length--;
            i--;
          }
          result = self;
        }
      }

      return result;
    ;
    }, $Hash_select$excl$61.$$arity = 0);
    
    Opal.def(self, '$shift', $Hash_shift$63 = function $$shift() {
      var self = this;

      
      var keys = self.$$keys,
          key;

      if (keys.length > 0) {
        key = keys[0];

        key = key.$$is_string ? key : key.key;

        return [key, Opal.hash_delete(self, key)];
      }

      return self.$default(nil);
    
    }, $Hash_shift$63.$$arity = 0);
    Opal.alias(self, "size", "length");
    
    Opal.def(self, '$slice', $Hash_slice$64 = function $$slice($a) {
      var $post_args, keys, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      keys = $post_args;;
      
      var result = Opal.hash();

      for (var i = 0, length = keys.length; i < length; i++) {
        var key = keys[i], value = Opal.hash_get(self, key);

        if (value !== undefined) {
          Opal.hash_put(result, key, value);
        }
      }

      return result;
    ;
    }, $Hash_slice$64.$$arity = -1);
    Opal.alias(self, "store", "[]=");
    
    Opal.def(self, '$to_a', $Hash_to_a$65 = function $$to_a() {
      var self = this;

      
      var result = [];

      for (var i = 0, keys = self.$$keys, length = keys.length, key, value; i < length; i++) {
        key = keys[i];

        if (key.$$is_string) {
          value = self.$$smap[key];
        } else {
          value = key.value;
          key = key.key;
        }

        result.push([key, value]);
      }

      return result;
    
    }, $Hash_to_a$65.$$arity = 0);
    
    Opal.def(self, '$to_h', $Hash_to_h$66 = function $$to_h() {
      var self = this;

      
      if (self.$$class === Opal.Hash) {
        return self;
      }

      var hash = new Opal.Hash();

      Opal.hash_init(hash);
      Opal.hash_clone(self, hash);

      return hash;
    
    }, $Hash_to_h$66.$$arity = 0);
    
    Opal.def(self, '$to_hash', $Hash_to_hash$67 = function $$to_hash() {
      var self = this;

      return self
    }, $Hash_to_hash$67.$$arity = 0);
    
    Opal.def(self, '$to_proc', $Hash_to_proc$68 = function $$to_proc() {
      var $$69, self = this;

      return $send(self, 'proc', [], ($$69 = function(key){var self = $$69.$$s || this;

      
        ;
        
        if (key == null) {
          self.$raise($$($nesting, 'ArgumentError'), "no key given")
        }
      ;
        return self['$[]'](key);}, $$69.$$s = self, $$69.$$arity = -1, $$69))
    }, $Hash_to_proc$68.$$arity = 0);
    Opal.alias(self, "to_s", "inspect");
    
    Opal.def(self, '$transform_keys', $Hash_transform_keys$70 = function $$transform_keys() {
      var $iter = $Hash_transform_keys$70.$$p, block = $iter || nil, $$71, self = this;

      if ($iter) $Hash_transform_keys$70.$$p = null;
      
      
      if ($iter) $Hash_transform_keys$70.$$p = null;;
      if ($truthy(block)) {
      } else {
        return $send(self, 'enum_for', ["transform_keys"], ($$71 = function(){var self = $$71.$$s || this;

        return self.$size()}, $$71.$$s = self, $$71.$$arity = 0, $$71))
      };
      
      var result = Opal.hash();

      for (var i = 0, keys = self.$$keys, length = keys.length, key, value; i < length; i++) {
        key = keys[i];

        if (key.$$is_string) {
          value = self.$$smap[key];
        } else {
          value = key.value;
          key = key.key;
        }

        key = Opal.yield1(block, key);

        Opal.hash_put(result, key, value);
      }

      return result;
    ;
    }, $Hash_transform_keys$70.$$arity = 0);
    
    Opal.def(self, '$transform_keys!', $Hash_transform_keys$excl$72 = function() {
      var $iter = $Hash_transform_keys$excl$72.$$p, block = $iter || nil, $$73, self = this;

      if ($iter) $Hash_transform_keys$excl$72.$$p = null;
      
      
      if ($iter) $Hash_transform_keys$excl$72.$$p = null;;
      if ($truthy(block)) {
      } else {
        return $send(self, 'enum_for', ["transform_keys!"], ($$73 = function(){var self = $$73.$$s || this;

        return self.$size()}, $$73.$$s = self, $$73.$$arity = 0, $$73))
      };
      
      var keys = Opal.slice.call(self.$$keys),
          i, length = keys.length, key, value, new_key;

      for (i = 0; i < length; i++) {
        key = keys[i];

        if (key.$$is_string) {
          value = self.$$smap[key];
        } else {
          value = key.value;
          key = key.key;
        }

        new_key = Opal.yield1(block, key);

        Opal.hash_delete(self, key);
        Opal.hash_put(self, new_key, value);
      }

      return self;
    ;
    }, $Hash_transform_keys$excl$72.$$arity = 0);
    
    Opal.def(self, '$transform_values', $Hash_transform_values$74 = function $$transform_values() {
      var $iter = $Hash_transform_values$74.$$p, block = $iter || nil, $$75, self = this;

      if ($iter) $Hash_transform_values$74.$$p = null;
      
      
      if ($iter) $Hash_transform_values$74.$$p = null;;
      if ($truthy(block)) {
      } else {
        return $send(self, 'enum_for', ["transform_values"], ($$75 = function(){var self = $$75.$$s || this;

        return self.$size()}, $$75.$$s = self, $$75.$$arity = 0, $$75))
      };
      
      var result = Opal.hash();

      for (var i = 0, keys = self.$$keys, length = keys.length, key, value; i < length; i++) {
        key = keys[i];

        if (key.$$is_string) {
          value = self.$$smap[key];
        } else {
          value = key.value;
          key = key.key;
        }

        value = Opal.yield1(block, value);

        Opal.hash_put(result, key, value);
      }

      return result;
    ;
    }, $Hash_transform_values$74.$$arity = 0);
    
    Opal.def(self, '$transform_values!', $Hash_transform_values$excl$76 = function() {
      var $iter = $Hash_transform_values$excl$76.$$p, block = $iter || nil, $$77, self = this;

      if ($iter) $Hash_transform_values$excl$76.$$p = null;
      
      
      if ($iter) $Hash_transform_values$excl$76.$$p = null;;
      if ($truthy(block)) {
      } else {
        return $send(self, 'enum_for', ["transform_values!"], ($$77 = function(){var self = $$77.$$s || this;

        return self.$size()}, $$77.$$s = self, $$77.$$arity = 0, $$77))
      };
      
      for (var i = 0, keys = self.$$keys, length = keys.length, key, value; i < length; i++) {
        key = keys[i];

        if (key.$$is_string) {
          value = self.$$smap[key];
        } else {
          value = key.value;
          key = key.key;
        }

        value = Opal.yield1(block, value);

        Opal.hash_put(self, key, value);
      }

      return self;
    ;
    }, $Hash_transform_values$excl$76.$$arity = 0);
    Opal.alias(self, "update", "merge!");
    Opal.alias(self, "value?", "has_value?");
    Opal.alias(self, "values_at", "indexes");
    return (Opal.def(self, '$values', $Hash_values$78 = function $$values() {
      var self = this;

      
      var result = [];

      for (var i = 0, keys = self.$$keys, length = keys.length, key; i < length; i++) {
        key = keys[i];

        if (key.$$is_string) {
          result.push(self.$$smap[key]);
        } else {
          result.push(key.value);
        }
      }

      return result;
    
    }, $Hash_values$78.$$arity = 0), nil) && 'values';
  })($nesting[0], null, $nesting);
};

/* Generated by Opal 0.11.99.dev */
Opal.modules["corelib/number"] = function(Opal) {
  function $rb_gt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs > rhs : lhs['$>'](rhs);
  }
  function $rb_lt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs < rhs : lhs['$<'](rhs);
  }
  function $rb_plus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs + rhs : lhs['$+'](rhs);
  }
  function $rb_minus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs - rhs : lhs['$-'](rhs);
  }
  function $rb_divide(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs / rhs : lhs['$/'](rhs);
  }
  function $rb_times(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs * rhs : lhs['$*'](rhs);
  }
  function $rb_le(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs <= rhs : lhs['$<='](rhs);
  }
  function $rb_ge(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs >= rhs : lhs['$>='](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice, $klass = Opal.klass, $truthy = Opal.truthy, $send = Opal.send, $hash2 = Opal.hash2;

  Opal.add_stubs(['$require', '$bridge', '$raise', '$name', '$class', '$Float', '$respond_to?', '$coerce_to!', '$__coerced__', '$===', '$!', '$>', '$**', '$new', '$<', '$to_f', '$==', '$nan?', '$infinite?', '$enum_for', '$+', '$-', '$gcd', '$lcm', '$%', '$/', '$frexp', '$to_i', '$ldexp', '$rationalize', '$*', '$<<', '$to_r', '$truncate', '$-@', '$size', '$<=', '$>=', '$<=>', '$compare', '$any?']);
  
  self.$require("corelib/numeric");
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Number');

    var $nesting = [self].concat($parent_nesting), $Number_coerce$2, $Number___id__$3, $Number_$plus$4, $Number_$minus$5, $Number_$$6, $Number_$slash$7, $Number_$percent$8, $Number_$$9, $Number_$$10, $Number_$$11, $Number_$lt$12, $Number_$lt_eq$13, $Number_$gt$14, $Number_$gt_eq$15, $Number_$lt_eq_gt$16, $Number_$lt$lt$17, $Number_$gt$gt$18, $Number_$$$19, $Number_$plus$$20, $Number_$minus$$21, $Number_$$22, $Number_$$$23, $Number_$eq_eq_eq$24, $Number_$eq_eq$25, $Number_abs$26, $Number_abs2$27, $Number_allbits$ques$28, $Number_anybits$ques$29, $Number_angle$30, $Number_bit_length$31, $Number_ceil$32, $Number_chr$33, $Number_denominator$34, $Number_downto$35, $Number_equal$ques$37, $Number_even$ques$38, $Number_floor$39, $Number_gcd$40, $Number_gcdlcm$41, $Number_integer$ques$42, $Number_is_a$ques$43, $Number_instance_of$ques$44, $Number_lcm$45, $Number_next$46, $Number_nobits$ques$47, $Number_nonzero$ques$48, $Number_numerator$49, $Number_odd$ques$50, $Number_ord$51, $Number_pow$52, $Number_pred$53, $Number_quo$54, $Number_rationalize$55, $Number_remainder$56, $Number_round$57, $Number_step$58, $Number_times$60, $Number_to_f$62, $Number_to_i$63, $Number_to_r$64, $Number_to_s$65, $Number_truncate$66, $Number_digits$67, $Number_divmod$68, $Number_upto$69, $Number_zero$ques$71, $Number_size$72, $Number_nan$ques$73, $Number_finite$ques$74, $Number_infinite$ques$75, $Number_positive$ques$76, $Number_negative$ques$77;

    
    $$($nesting, 'Opal').$bridge(Number, self);
    Opal.defineProperty(self.$$prototype, '$$is_number', true);
    self.$$is_number_class = true;
    (function(self, $parent_nesting) {
      var $nesting = [self].concat($parent_nesting), $allocate$1;

      
      
      Opal.def(self, '$allocate', $allocate$1 = function $$allocate() {
        var self = this;

        return self.$raise($$($nesting, 'TypeError'), "" + "allocator undefined for " + (self.$name()))
      }, $allocate$1.$$arity = 0);
      
      
      Opal.udef(self, '$' + "new");;
      return nil;;
    })(Opal.get_singleton_class(self), $nesting);
    
    Opal.def(self, '$coerce', $Number_coerce$2 = function $$coerce(other) {
      var self = this;

      
      if (other === nil) {
        self.$raise($$($nesting, 'TypeError'), "" + "can't convert " + (other.$class()) + " into Float");
      }
      else if (other.$$is_string) {
        return [self.$Float(other), self];
      }
      else if (other['$respond_to?']("to_f")) {
        return [$$($nesting, 'Opal')['$coerce_to!'](other, $$($nesting, 'Float'), "to_f"), self];
      }
      else if (other.$$is_number) {
        return [other, self];
      }
      else {
        self.$raise($$($nesting, 'TypeError'), "" + "can't convert " + (other.$class()) + " into Float");
      }
    
    }, $Number_coerce$2.$$arity = 1);
    
    Opal.def(self, '$__id__', $Number___id__$3 = function $$__id__() {
      var self = this;

      return (self * 2) + 1;
    }, $Number___id__$3.$$arity = 0);
    Opal.alias(self, "object_id", "__id__");
    
    Opal.def(self, '$+', $Number_$plus$4 = function(other) {
      var self = this;

      
      if (other.$$is_number) {
        return self + other;
      }
      else {
        return self.$__coerced__("+", other);
      }
    
    }, $Number_$plus$4.$$arity = 1);
    
    Opal.def(self, '$-', $Number_$minus$5 = function(other) {
      var self = this;

      
      if (other.$$is_number) {
        return self - other;
      }
      else {
        return self.$__coerced__("-", other);
      }
    
    }, $Number_$minus$5.$$arity = 1);
    
    Opal.def(self, '$*', $Number_$$6 = function(other) {
      var self = this;

      
      if (other.$$is_number) {
        return self * other;
      }
      else {
        return self.$__coerced__("*", other);
      }
    
    }, $Number_$$6.$$arity = 1);
    
    Opal.def(self, '$/', $Number_$slash$7 = function(other) {
      var self = this;

      
      if (other.$$is_number) {
        return self / other;
      }
      else {
        return self.$__coerced__("/", other);
      }
    
    }, $Number_$slash$7.$$arity = 1);
    Opal.alias(self, "fdiv", "/");
    
    Opal.def(self, '$%', $Number_$percent$8 = function(other) {
      var self = this;

      
      if (other.$$is_number) {
        if (other == -Infinity) {
          return other;
        }
        else if (other == 0) {
          self.$raise($$($nesting, 'ZeroDivisionError'), "divided by 0");
        }
        else if (other < 0 || self < 0) {
          return (self % other + other) % other;
        }
        else {
          return self % other;
        }
      }
      else {
        return self.$__coerced__("%", other);
      }
    
    }, $Number_$percent$8.$$arity = 1);
    
    Opal.def(self, '$&', $Number_$$9 = function(other) {
      var self = this;

      
      if (other.$$is_number) {
        return self & other;
      }
      else {
        return self.$__coerced__("&", other);
      }
    
    }, $Number_$$9.$$arity = 1);
    
    Opal.def(self, '$|', $Number_$$10 = function(other) {
      var self = this;

      
      if (other.$$is_number) {
        return self | other;
      }
      else {
        return self.$__coerced__("|", other);
      }
    
    }, $Number_$$10.$$arity = 1);
    
    Opal.def(self, '$^', $Number_$$11 = function(other) {
      var self = this;

      
      if (other.$$is_number) {
        return self ^ other;
      }
      else {
        return self.$__coerced__("^", other);
      }
    
    }, $Number_$$11.$$arity = 1);
    
    Opal.def(self, '$<', $Number_$lt$12 = function(other) {
      var self = this;

      
      if (other.$$is_number) {
        return self < other;
      }
      else {
        return self.$__coerced__("<", other);
      }
    
    }, $Number_$lt$12.$$arity = 1);
    
    Opal.def(self, '$<=', $Number_$lt_eq$13 = function(other) {
      var self = this;

      
      if (other.$$is_number) {
        return self <= other;
      }
      else {
        return self.$__coerced__("<=", other);
      }
    
    }, $Number_$lt_eq$13.$$arity = 1);
    
    Opal.def(self, '$>', $Number_$gt$14 = function(other) {
      var self = this;

      
      if (other.$$is_number) {
        return self > other;
      }
      else {
        return self.$__coerced__(">", other);
      }
    
    }, $Number_$gt$14.$$arity = 1);
    
    Opal.def(self, '$>=', $Number_$gt_eq$15 = function(other) {
      var self = this;

      
      if (other.$$is_number) {
        return self >= other;
      }
      else {
        return self.$__coerced__(">=", other);
      }
    
    }, $Number_$gt_eq$15.$$arity = 1);
    
    var spaceship_operator = function(self, other) {
      if (other.$$is_number) {
        if (isNaN(self) || isNaN(other)) {
          return nil;
        }

        if (self > other) {
          return 1;
        } else if (self < other) {
          return -1;
        } else {
          return 0;
        }
      }
      else {
        return self.$__coerced__("<=>", other);
      }
    }
  ;
    
    Opal.def(self, '$<=>', $Number_$lt_eq_gt$16 = function(other) {
      var self = this;

      try {
        return spaceship_operator(self, other);
      } catch ($err) {
        if (Opal.rescue($err, [$$($nesting, 'ArgumentError')])) {
          try {
            return nil
          } finally { Opal.pop_exception() }
        } else { throw $err; }
      }
    }, $Number_$lt_eq_gt$16.$$arity = 1);
    
    Opal.def(self, '$<<', $Number_$lt$lt$17 = function(count) {
      var self = this;

      
      count = $$($nesting, 'Opal')['$coerce_to!'](count, $$($nesting, 'Integer'), "to_int");
      return count > 0 ? self << count : self >> -count;
    }, $Number_$lt$lt$17.$$arity = 1);
    
    Opal.def(self, '$>>', $Number_$gt$gt$18 = function(count) {
      var self = this;

      
      count = $$($nesting, 'Opal')['$coerce_to!'](count, $$($nesting, 'Integer'), "to_int");
      return count > 0 ? self >> count : self << -count;
    }, $Number_$gt$gt$18.$$arity = 1);
    
    Opal.def(self, '$[]', $Number_$$$19 = function(bit) {
      var self = this;

      
      bit = $$($nesting, 'Opal')['$coerce_to!'](bit, $$($nesting, 'Integer'), "to_int");
      
      if (bit < 0) {
        return 0;
      }
      if (bit >= 32) {
        return self < 0 ? 1 : 0;
      }
      return (self >> bit) & 1;
    ;
    }, $Number_$$$19.$$arity = 1);
    
    Opal.def(self, '$+@', $Number_$plus$$20 = function() {
      var self = this;

      return +self;
    }, $Number_$plus$$20.$$arity = 0);
    
    Opal.def(self, '$-@', $Number_$minus$$21 = function() {
      var self = this;

      return -self;
    }, $Number_$minus$$21.$$arity = 0);
    
    Opal.def(self, '$~', $Number_$$22 = function() {
      var self = this;

      return ~self;
    }, $Number_$$22.$$arity = 0);
    
    Opal.def(self, '$**', $Number_$$$23 = function(other) {
      var $a, $b, self = this;

      if ($truthy($$($nesting, 'Integer')['$==='](other))) {
        if ($truthy(($truthy($a = $$($nesting, 'Integer')['$==='](self)['$!']()) ? $a : $rb_gt(other, 0)))) {
          return Math.pow(self, other);
        } else {
          return $$($nesting, 'Rational').$new(self, 1)['$**'](other)
        }
      } else if ($truthy((($a = $rb_lt(self, 0)) ? ($truthy($b = $$($nesting, 'Float')['$==='](other)) ? $b : $$($nesting, 'Rational')['$==='](other)) : $rb_lt(self, 0)))) {
        return $$($nesting, 'Complex').$new(self, 0)['$**'](other.$to_f())
      } else if ($truthy(other.$$is_number != null)) {
        return Math.pow(self, other);
      } else {
        return self.$__coerced__("**", other)
      }
    }, $Number_$$$23.$$arity = 1);
    
    Opal.def(self, '$===', $Number_$eq_eq_eq$24 = function(other) {
      var self = this;

      
      if (other.$$is_number) {
        return self.valueOf() === other.valueOf();
      }
      else if (other['$respond_to?']("==")) {
        return other['$=='](self);
      }
      else {
        return false;
      }
    
    }, $Number_$eq_eq_eq$24.$$arity = 1);
    
    Opal.def(self, '$==', $Number_$eq_eq$25 = function(other) {
      var self = this;

      
      if (other.$$is_number) {
        return self.valueOf() === other.valueOf();
      }
      else if (other['$respond_to?']("==")) {
        return other['$=='](self);
      }
      else {
        return false;
      }
    
    }, $Number_$eq_eq$25.$$arity = 1);
    
    Opal.def(self, '$abs', $Number_abs$26 = function $$abs() {
      var self = this;

      return Math.abs(self);
    }, $Number_abs$26.$$arity = 0);
    
    Opal.def(self, '$abs2', $Number_abs2$27 = function $$abs2() {
      var self = this;

      return Math.abs(self * self);
    }, $Number_abs2$27.$$arity = 0);
    
    Opal.def(self, '$allbits?', $Number_allbits$ques$28 = function(mask) {
      var self = this;

      
      mask = $$($nesting, 'Opal')['$coerce_to!'](mask, $$($nesting, 'Integer'), "to_int");
      return (self & mask) == mask;;
    }, $Number_allbits$ques$28.$$arity = 1);
    
    Opal.def(self, '$anybits?', $Number_anybits$ques$29 = function(mask) {
      var self = this;

      
      mask = $$($nesting, 'Opal')['$coerce_to!'](mask, $$($nesting, 'Integer'), "to_int");
      return (self & mask) !== 0;;
    }, $Number_anybits$ques$29.$$arity = 1);
    
    Opal.def(self, '$angle', $Number_angle$30 = function $$angle() {
      var self = this;

      
      if ($truthy(self['$nan?']())) {
        return self};
      
      if (self == 0) {
        if (1 / self > 0) {
          return 0;
        }
        else {
          return Math.PI;
        }
      }
      else if (self < 0) {
        return Math.PI;
      }
      else {
        return 0;
      }
    ;
    }, $Number_angle$30.$$arity = 0);
    Opal.alias(self, "arg", "angle");
    Opal.alias(self, "phase", "angle");
    
    Opal.def(self, '$bit_length', $Number_bit_length$31 = function $$bit_length() {
      var self = this;

      
      if ($truthy($$($nesting, 'Integer')['$==='](self))) {
      } else {
        self.$raise($$($nesting, 'NoMethodError').$new("" + "undefined method `bit_length` for " + (self) + ":Float", "bit_length"))
      };
      
      if (self === 0 || self === -1) {
        return 0;
      }

      var result = 0,
          value  = self < 0 ? ~self : self;

      while (value != 0) {
        result   += 1;
        value  >>>= 1;
      }

      return result;
    ;
    }, $Number_bit_length$31.$$arity = 0);
    
    Opal.def(self, '$ceil', $Number_ceil$32 = function $$ceil(ndigits) {
      var self = this;

      
      
      if (ndigits == null) {
        ndigits = 0;
      };
      
      var f = self.$to_f();

      if (f % 1 === 0 && ndigits >= 0) {
        return f;
      }

      var factor = Math.pow(10, ndigits),
          result = Math.ceil(f * factor) / factor;

      if (f % 1 === 0) {
        result = Math.round(result);
      }

      return result;
    ;
    }, $Number_ceil$32.$$arity = -1);
    
    Opal.def(self, '$chr', $Number_chr$33 = function $$chr(encoding) {
      var self = this;

      
      ;
      return String.fromCharCode(self);;
    }, $Number_chr$33.$$arity = -1);
    
    Opal.def(self, '$denominator', $Number_denominator$34 = function $$denominator() {
      var $a, $iter = $Number_denominator$34.$$p, $yield = $iter || nil, self = this, $zuper = nil, $zuper_i = nil, $zuper_ii = nil;

      if ($iter) $Number_denominator$34.$$p = null;
      // Prepare super implicit arguments
      for($zuper_i = 0, $zuper_ii = arguments.length, $zuper = new Array($zuper_ii); $zuper_i < $zuper_ii; $zuper_i++) {
        $zuper[$zuper_i] = arguments[$zuper_i];
      }
      if ($truthy(($truthy($a = self['$nan?']()) ? $a : self['$infinite?']()))) {
        return 1
      } else {
        return $send(self, Opal.find_super_dispatcher(self, 'denominator', $Number_denominator$34, false), $zuper, $iter)
      }
    }, $Number_denominator$34.$$arity = 0);
    
    Opal.def(self, '$downto', $Number_downto$35 = function $$downto(stop) {
      var $iter = $Number_downto$35.$$p, block = $iter || nil, $$36, self = this;

      if ($iter) $Number_downto$35.$$p = null;
      
      
      if ($iter) $Number_downto$35.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["downto", stop], ($$36 = function(){var self = $$36.$$s || this;

        
          if ($truthy($$($nesting, 'Numeric')['$==='](stop))) {
          } else {
            self.$raise($$($nesting, 'ArgumentError'), "" + "comparison of " + (self.$class()) + " with " + (stop.$class()) + " failed")
          };
          if ($truthy($rb_gt(stop, self))) {
            return 0
          } else {
            return $rb_plus($rb_minus(self, stop), 1)
          };}, $$36.$$s = self, $$36.$$arity = 0, $$36))
      };
      
      if (!stop.$$is_number) {
        self.$raise($$($nesting, 'ArgumentError'), "" + "comparison of " + (self.$class()) + " with " + (stop.$class()) + " failed")
      }
      for (var i = self; i >= stop; i--) {
        block(i);
      }
    ;
      return self;
    }, $Number_downto$35.$$arity = 1);
    Opal.alias(self, "eql?", "==");
    
    Opal.def(self, '$equal?', $Number_equal$ques$37 = function(other) {
      var $a, self = this;

      return ($truthy($a = self['$=='](other)) ? $a : isNaN(self) && isNaN(other))
    }, $Number_equal$ques$37.$$arity = 1);
    
    Opal.def(self, '$even?', $Number_even$ques$38 = function() {
      var self = this;

      return self % 2 === 0;
    }, $Number_even$ques$38.$$arity = 0);
    
    Opal.def(self, '$floor', $Number_floor$39 = function $$floor(ndigits) {
      var self = this;

      
      
      if (ndigits == null) {
        ndigits = 0;
      };
      
      var f = self.$to_f();

      if (f % 1 === 0 && ndigits >= 0) {
        return f;
      }

      var factor = Math.pow(10, ndigits),
          result = Math.floor(f * factor) / factor;

      if (f % 1 === 0) {
        result = Math.round(result);
      }

      return result;
    ;
    }, $Number_floor$39.$$arity = -1);
    
    Opal.def(self, '$gcd', $Number_gcd$40 = function $$gcd(other) {
      var self = this;

      
      if ($truthy($$($nesting, 'Integer')['$==='](other))) {
      } else {
        self.$raise($$($nesting, 'TypeError'), "not an integer")
      };
      
      var min = Math.abs(self),
          max = Math.abs(other);

      while (min > 0) {
        var tmp = min;

        min = max % min;
        max = tmp;
      }

      return max;
    ;
    }, $Number_gcd$40.$$arity = 1);
    
    Opal.def(self, '$gcdlcm', $Number_gcdlcm$41 = function $$gcdlcm(other) {
      var self = this;

      return [self.$gcd(), self.$lcm()]
    }, $Number_gcdlcm$41.$$arity = 1);
    
    Opal.def(self, '$integer?', $Number_integer$ques$42 = function() {
      var self = this;

      return self % 1 === 0;
    }, $Number_integer$ques$42.$$arity = 0);
    
    Opal.def(self, '$is_a?', $Number_is_a$ques$43 = function(klass) {
      var $a, $iter = $Number_is_a$ques$43.$$p, $yield = $iter || nil, self = this, $zuper = nil, $zuper_i = nil, $zuper_ii = nil;

      if ($iter) $Number_is_a$ques$43.$$p = null;
      // Prepare super implicit arguments
      for($zuper_i = 0, $zuper_ii = arguments.length, $zuper = new Array($zuper_ii); $zuper_i < $zuper_ii; $zuper_i++) {
        $zuper[$zuper_i] = arguments[$zuper_i];
      }
      
      if ($truthy((($a = klass['$==']($$($nesting, 'Integer'))) ? $$($nesting, 'Integer')['$==='](self) : klass['$==']($$($nesting, 'Integer'))))) {
        return true};
      if ($truthy((($a = klass['$==']($$($nesting, 'Integer'))) ? $$($nesting, 'Integer')['$==='](self) : klass['$==']($$($nesting, 'Integer'))))) {
        return true};
      if ($truthy((($a = klass['$==']($$($nesting, 'Float'))) ? $$($nesting, 'Float')['$==='](self) : klass['$==']($$($nesting, 'Float'))))) {
        return true};
      return $send(self, Opal.find_super_dispatcher(self, 'is_a?', $Number_is_a$ques$43, false), $zuper, $iter);
    }, $Number_is_a$ques$43.$$arity = 1);
    Opal.alias(self, "kind_of?", "is_a?");
    
    Opal.def(self, '$instance_of?', $Number_instance_of$ques$44 = function(klass) {
      var $a, $iter = $Number_instance_of$ques$44.$$p, $yield = $iter || nil, self = this, $zuper = nil, $zuper_i = nil, $zuper_ii = nil;

      if ($iter) $Number_instance_of$ques$44.$$p = null;
      // Prepare super implicit arguments
      for($zuper_i = 0, $zuper_ii = arguments.length, $zuper = new Array($zuper_ii); $zuper_i < $zuper_ii; $zuper_i++) {
        $zuper[$zuper_i] = arguments[$zuper_i];
      }
      
      if ($truthy((($a = klass['$==']($$($nesting, 'Integer'))) ? $$($nesting, 'Integer')['$==='](self) : klass['$==']($$($nesting, 'Integer'))))) {
        return true};
      if ($truthy((($a = klass['$==']($$($nesting, 'Integer'))) ? $$($nesting, 'Integer')['$==='](self) : klass['$==']($$($nesting, 'Integer'))))) {
        return true};
      if ($truthy((($a = klass['$==']($$($nesting, 'Float'))) ? $$($nesting, 'Float')['$==='](self) : klass['$==']($$($nesting, 'Float'))))) {
        return true};
      return $send(self, Opal.find_super_dispatcher(self, 'instance_of?', $Number_instance_of$ques$44, false), $zuper, $iter);
    }, $Number_instance_of$ques$44.$$arity = 1);
    
    Opal.def(self, '$lcm', $Number_lcm$45 = function $$lcm(other) {
      var self = this;

      
      if ($truthy($$($nesting, 'Integer')['$==='](other))) {
      } else {
        self.$raise($$($nesting, 'TypeError'), "not an integer")
      };
      
      if (self == 0 || other == 0) {
        return 0;
      }
      else {
        return Math.abs(self * other / self.$gcd(other));
      }
    ;
    }, $Number_lcm$45.$$arity = 1);
    Opal.alias(self, "magnitude", "abs");
    Opal.alias(self, "modulo", "%");
    
    Opal.def(self, '$next', $Number_next$46 = function $$next() {
      var self = this;

      return self + 1;
    }, $Number_next$46.$$arity = 0);
    
    Opal.def(self, '$nobits?', $Number_nobits$ques$47 = function(mask) {
      var self = this;

      
      mask = $$($nesting, 'Opal')['$coerce_to!'](mask, $$($nesting, 'Integer'), "to_int");
      return (self & mask) == 0;;
    }, $Number_nobits$ques$47.$$arity = 1);
    
    Opal.def(self, '$nonzero?', $Number_nonzero$ques$48 = function() {
      var self = this;

      return self == 0 ? nil : self;
    }, $Number_nonzero$ques$48.$$arity = 0);
    
    Opal.def(self, '$numerator', $Number_numerator$49 = function $$numerator() {
      var $a, $iter = $Number_numerator$49.$$p, $yield = $iter || nil, self = this, $zuper = nil, $zuper_i = nil, $zuper_ii = nil;

      if ($iter) $Number_numerator$49.$$p = null;
      // Prepare super implicit arguments
      for($zuper_i = 0, $zuper_ii = arguments.length, $zuper = new Array($zuper_ii); $zuper_i < $zuper_ii; $zuper_i++) {
        $zuper[$zuper_i] = arguments[$zuper_i];
      }
      if ($truthy(($truthy($a = self['$nan?']()) ? $a : self['$infinite?']()))) {
        return self
      } else {
        return $send(self, Opal.find_super_dispatcher(self, 'numerator', $Number_numerator$49, false), $zuper, $iter)
      }
    }, $Number_numerator$49.$$arity = 0);
    
    Opal.def(self, '$odd?', $Number_odd$ques$50 = function() {
      var self = this;

      return self % 2 !== 0;
    }, $Number_odd$ques$50.$$arity = 0);
    
    Opal.def(self, '$ord', $Number_ord$51 = function $$ord() {
      var self = this;

      return self
    }, $Number_ord$51.$$arity = 0);
    
    Opal.def(self, '$pow', $Number_pow$52 = function $$pow(b, m) {
      var self = this;

      
      ;
      
      if (self == 0) {
        self.$raise($$($nesting, 'ZeroDivisionError'), "divided by 0")
      }

      if (m === undefined) {
        return self['$**'](b);
      } else {
        if (!($$($nesting, 'Integer')['$==='](b))) {
          self.$raise($$($nesting, 'TypeError'), "Integer#pow() 2nd argument not allowed unless a 1st argument is integer")
        }

        if (b < 0) {
          self.$raise($$($nesting, 'TypeError'), "Integer#pow() 1st argument cannot be negative when 2nd argument specified")
        }

        if (!($$($nesting, 'Integer')['$==='](m))) {
          self.$raise($$($nesting, 'TypeError'), "Integer#pow() 2nd argument not allowed unless all arguments are integers")
        }

        if (m === 0) {
          self.$raise($$($nesting, 'ZeroDivisionError'), "divided by 0")
        }

        return self['$**'](b)['$%'](m)
      }
    ;
    }, $Number_pow$52.$$arity = -2);
    
    Opal.def(self, '$pred', $Number_pred$53 = function $$pred() {
      var self = this;

      return self - 1;
    }, $Number_pred$53.$$arity = 0);
    
    Opal.def(self, '$quo', $Number_quo$54 = function $$quo(other) {
      var $iter = $Number_quo$54.$$p, $yield = $iter || nil, self = this, $zuper = nil, $zuper_i = nil, $zuper_ii = nil;

      if ($iter) $Number_quo$54.$$p = null;
      // Prepare super implicit arguments
      for($zuper_i = 0, $zuper_ii = arguments.length, $zuper = new Array($zuper_ii); $zuper_i < $zuper_ii; $zuper_i++) {
        $zuper[$zuper_i] = arguments[$zuper_i];
      }
      if ($truthy($$($nesting, 'Integer')['$==='](self))) {
        return $send(self, Opal.find_super_dispatcher(self, 'quo', $Number_quo$54, false), $zuper, $iter)
      } else {
        return $rb_divide(self, other)
      }
    }, $Number_quo$54.$$arity = 1);
    
    Opal.def(self, '$rationalize', $Number_rationalize$55 = function $$rationalize(eps) {
      var $a, $b, self = this, f = nil, n = nil;

      
      ;
      
      if (arguments.length > 1) {
        self.$raise($$($nesting, 'ArgumentError'), "" + "wrong number of arguments (" + (arguments.length) + " for 0..1)");
      }
    ;
      if ($truthy($$($nesting, 'Integer')['$==='](self))) {
        return $$($nesting, 'Rational').$new(self, 1)
      } else if ($truthy(self['$infinite?']())) {
        return self.$raise($$($nesting, 'FloatDomainError'), "Infinity")
      } else if ($truthy(self['$nan?']())) {
        return self.$raise($$($nesting, 'FloatDomainError'), "NaN")
      } else if ($truthy(eps == null)) {
        
        $b = $$($nesting, 'Math').$frexp(self), $a = Opal.to_ary($b), (f = ($a[0] == null ? nil : $a[0])), (n = ($a[1] == null ? nil : $a[1])), $b;
        f = $$($nesting, 'Math').$ldexp(f, $$$($$($nesting, 'Float'), 'MANT_DIG')).$to_i();
        n = $rb_minus(n, $$$($$($nesting, 'Float'), 'MANT_DIG'));
        return $$($nesting, 'Rational').$new($rb_times(2, f), (1)['$<<']($rb_minus(1, n))).$rationalize($$($nesting, 'Rational').$new(1, (1)['$<<']($rb_minus(1, n))));
      } else {
        return self.$to_r().$rationalize(eps)
      };
    }, $Number_rationalize$55.$$arity = -1);
    
    Opal.def(self, '$remainder', $Number_remainder$56 = function $$remainder(y) {
      var self = this;

      return $rb_minus(self, $rb_times(y, $rb_divide(self, y).$truncate()))
    }, $Number_remainder$56.$$arity = 1);
    
    Opal.def(self, '$round', $Number_round$57 = function $$round(ndigits) {
      var $a, $b, self = this, _ = nil, exp = nil;

      
      ;
      if ($truthy($$($nesting, 'Integer')['$==='](self))) {
        
        if ($truthy(ndigits == null)) {
          return self};
        if ($truthy(($truthy($a = $$($nesting, 'Float')['$==='](ndigits)) ? ndigits['$infinite?']() : $a))) {
          self.$raise($$($nesting, 'RangeError'), "Infinity")};
        ndigits = $$($nesting, 'Opal')['$coerce_to!'](ndigits, $$($nesting, 'Integer'), "to_int");
        if ($truthy($rb_lt(ndigits, $$$($$($nesting, 'Integer'), 'MIN')))) {
          self.$raise($$($nesting, 'RangeError'), "out of bounds")};
        if ($truthy(ndigits >= 0)) {
          return self};
        ndigits = ndigits['$-@']();
        
        if (0.415241 * ndigits - 0.125 > self.$size()) {
          return 0;
        }

        var f = Math.pow(10, ndigits),
            x = Math.floor((Math.abs(x) + f / 2) / f) * f;

        return self < 0 ? -x : x;
      ;
      } else {
        
        if ($truthy(($truthy($a = self['$nan?']()) ? ndigits == null : $a))) {
          self.$raise($$($nesting, 'FloatDomainError'), "NaN")};
        ndigits = $$($nesting, 'Opal')['$coerce_to!'](ndigits || 0, $$($nesting, 'Integer'), "to_int");
        if ($truthy($rb_le(ndigits, 0))) {
          if ($truthy(self['$nan?']())) {
            self.$raise($$($nesting, 'RangeError'), "NaN")
          } else if ($truthy(self['$infinite?']())) {
            self.$raise($$($nesting, 'FloatDomainError'), "Infinity")}
        } else if (ndigits['$=='](0)) {
          return Math.round(self)
        } else if ($truthy(($truthy($a = self['$nan?']()) ? $a : self['$infinite?']()))) {
          return self};
        $b = $$($nesting, 'Math').$frexp(self), $a = Opal.to_ary($b), (_ = ($a[0] == null ? nil : $a[0])), (exp = ($a[1] == null ? nil : $a[1])), $b;
        if ($truthy($rb_ge(ndigits, $rb_minus($rb_plus($$$($$($nesting, 'Float'), 'DIG'), 2), (function() {if ($truthy($rb_gt(exp, 0))) {
          return $rb_divide(exp, 4)
        } else {
          return $rb_minus($rb_divide(exp, 3), 1)
        }; return nil; })())))) {
          return self};
        if ($truthy($rb_lt(ndigits, (function() {if ($truthy($rb_gt(exp, 0))) {
          return $rb_plus($rb_divide(exp, 3), 1)
        } else {
          return $rb_divide(exp, 4)
        }; return nil; })()['$-@']()))) {
          return 0};
        return Math.round(self * Math.pow(10, ndigits)) / Math.pow(10, ndigits);;
      };
    }, $Number_round$57.$$arity = -1);
    
    Opal.def(self, '$step', $Number_step$58 = function $$step($a, $b, $c) {
      var $iter = $Number_step$58.$$p, block = $iter || nil, $post_args, $kwargs, limit, step, to, by, $$59, self = this, positional_args = nil, keyword_args = nil;

      if ($iter) $Number_step$58.$$p = null;
      
      
      if ($iter) $Number_step$58.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      $kwargs = Opal.extract_kwargs($post_args);
      
      if ($kwargs == null) {
        $kwargs = $hash2([], {});
      } else if (!$kwargs.$$is_hash) {
        throw Opal.ArgumentError.$new('expected kwargs');
      };
      
      if ($post_args.length > 0) {
        limit = $post_args[0];
        $post_args.splice(0, 1);
      };
      
      if ($post_args.length > 0) {
        step = $post_args[0];
        $post_args.splice(0, 1);
      };
      
      to = $kwargs.$$smap["to"];;
      
      by = $kwargs.$$smap["by"];;
      
      if (limit !== undefined && to !== undefined) {
        self.$raise($$($nesting, 'ArgumentError'), "to is given twice")
      }

      if (step !== undefined && by !== undefined) {
        self.$raise($$($nesting, 'ArgumentError'), "step is given twice")
      }

      function validateParameters() {
        if (to !== undefined) {
          limit = to;
        }

        if (limit === undefined) {
          limit = nil;
        }

        if (step === nil) {
          self.$raise($$($nesting, 'TypeError'), "step must be numeric")
        }

        if (step === 0) {
          self.$raise($$($nesting, 'ArgumentError'), "step can't be 0")
        }

        if (by !== undefined) {
          step = by;
        }

        if (step === nil || step == null) {
          step = 1;
        }

        var sign = step['$<=>'](0);

        if (sign === nil) {
          self.$raise($$($nesting, 'ArgumentError'), "" + "0 can't be coerced into " + (step.$class()))
        }

        if (limit === nil || limit == null) {
          limit = sign > 0 ? $$$($$($nesting, 'Float'), 'INFINITY') : $$$($$($nesting, 'Float'), 'INFINITY')['$-@']();
        }

        $$($nesting, 'Opal').$compare(self, limit)
      }

      function stepFloatSize() {
        if ((step > 0 && self > limit) || (step < 0 && self < limit)) {
          return 0;
        } else if (step === Infinity || step === -Infinity) {
          return 1;
        } else {
          var abs = Math.abs, floor = Math.floor,
              err = (abs(self) + abs(limit) + abs(limit - self)) / abs(step) * $$$($$($nesting, 'Float'), 'EPSILON');

          if (err === Infinity || err === -Infinity) {
            return 0;
          } else {
            if (err > 0.5) {
              err = 0.5;
            }

            return floor((limit - self) / step + err) + 1
          }
        }
      }

      function stepSize() {
        validateParameters();

        if (step === 0) {
          return Infinity;
        }

        if (step % 1 !== 0) {
          return stepFloatSize();
        } else if ((step > 0 && self > limit) || (step < 0 && self < limit)) {
          return 0;
        } else {
          var ceil = Math.ceil, abs = Math.abs,
              lhs = abs(self - limit) + 1,
              rhs = abs(step);

          return ceil(lhs / rhs);
        }
      }
    ;
      if ((block !== nil)) {
      } else {
        
        positional_args = [];
        keyword_args = $hash2([], {});
        
        if (limit !== undefined) {
          positional_args.push(limit);
        }

        if (step !== undefined) {
          positional_args.push(step);
        }

        if (to !== undefined) {
          Opal.hash_put(keyword_args, "to", to);
        }

        if (by !== undefined) {
          Opal.hash_put(keyword_args, "by", by);
        }

        if (keyword_args['$any?']()) {
          positional_args.push(keyword_args);
        }
      ;
        return $send(self, 'enum_for', ["step"].concat(Opal.to_a(positional_args)), ($$59 = function(){var self = $$59.$$s || this;

        return stepSize();}, $$59.$$s = self, $$59.$$arity = 0, $$59));
      };
      
      validateParameters();

      if (step === 0) {
        while (true) {
          block(self);
        }
      }

      if (self % 1 !== 0 || limit % 1 !== 0 || step % 1 !== 0) {
        var n = stepFloatSize();

        if (n > 0) {
          if (step === Infinity || step === -Infinity) {
            block(self);
          } else {
            var i = 0, d;

            if (step > 0) {
              while (i < n) {
                d = i * step + self;
                if (limit < d) {
                  d = limit;
                }
                block(d);
                i += 1;
              }
            } else {
              while (i < n) {
                d = i * step + self;
                if (limit > d) {
                  d = limit;
                }
                block(d);
                i += 1
              }
            }
          }
        }
      } else {
        var value = self;

        if (step > 0) {
          while (value <= limit) {
            block(value);
            value += step;
          }
        } else {
          while (value >= limit) {
            block(value);
            value += step
          }
        }
      }

      return self;
    ;
    }, $Number_step$58.$$arity = -1);
    Opal.alias(self, "succ", "next");
    
    Opal.def(self, '$times', $Number_times$60 = function $$times() {
      var $iter = $Number_times$60.$$p, block = $iter || nil, $$61, self = this;

      if ($iter) $Number_times$60.$$p = null;
      
      
      if ($iter) $Number_times$60.$$p = null;;
      if ($truthy(block)) {
      } else {
        return $send(self, 'enum_for', ["times"], ($$61 = function(){var self = $$61.$$s || this;

        return self}, $$61.$$s = self, $$61.$$arity = 0, $$61))
      };
      
      for (var i = 0; i < self; i++) {
        block(i);
      }
    ;
      return self;
    }, $Number_times$60.$$arity = 0);
    
    Opal.def(self, '$to_f', $Number_to_f$62 = function $$to_f() {
      var self = this;

      return self
    }, $Number_to_f$62.$$arity = 0);
    
    Opal.def(self, '$to_i', $Number_to_i$63 = function $$to_i() {
      var self = this;

      return parseInt(self, 10);
    }, $Number_to_i$63.$$arity = 0);
    Opal.alias(self, "to_int", "to_i");
    
    Opal.def(self, '$to_r', $Number_to_r$64 = function $$to_r() {
      var $a, $b, self = this, f = nil, e = nil;

      if ($truthy($$($nesting, 'Integer')['$==='](self))) {
        return $$($nesting, 'Rational').$new(self, 1)
      } else {
        
        $b = $$($nesting, 'Math').$frexp(self), $a = Opal.to_ary($b), (f = ($a[0] == null ? nil : $a[0])), (e = ($a[1] == null ? nil : $a[1])), $b;
        f = $$($nesting, 'Math').$ldexp(f, $$$($$($nesting, 'Float'), 'MANT_DIG')).$to_i();
        e = $rb_minus(e, $$$($$($nesting, 'Float'), 'MANT_DIG'));
        return $rb_times(f, $$$($$($nesting, 'Float'), 'RADIX')['$**'](e)).$to_r();
      }
    }, $Number_to_r$64.$$arity = 0);
    
    Opal.def(self, '$to_s', $Number_to_s$65 = function $$to_s(base) {
      var $a, self = this;

      
      
      if (base == null) {
        base = 10;
      };
      base = $$($nesting, 'Opal')['$coerce_to!'](base, $$($nesting, 'Integer'), "to_int");
      if ($truthy(($truthy($a = $rb_lt(base, 2)) ? $a : $rb_gt(base, 36)))) {
        self.$raise($$($nesting, 'ArgumentError'), "" + "invalid radix " + (base))};
      return self.toString(base);;
    }, $Number_to_s$65.$$arity = -1);
    
    Opal.def(self, '$truncate', $Number_truncate$66 = function $$truncate(ndigits) {
      var self = this;

      
      
      if (ndigits == null) {
        ndigits = 0;
      };
      
      var f = self.$to_f();

      if (f % 1 === 0 && ndigits >= 0) {
        return f;
      }

      var factor = Math.pow(10, ndigits),
          result = parseInt(f * factor, 10) / factor;

      if (f % 1 === 0) {
        result = Math.round(result);
      }

      return result;
    ;
    }, $Number_truncate$66.$$arity = -1);
    Opal.alias(self, "inspect", "to_s");
    
    Opal.def(self, '$digits', $Number_digits$67 = function $$digits(base) {
      var self = this;

      
      
      if (base == null) {
        base = 10;
      };
      if ($rb_lt(self, 0)) {
        self.$raise($$$($$($nesting, 'Math'), 'DomainError'), "out of domain")};
      base = $$($nesting, 'Opal')['$coerce_to!'](base, $$($nesting, 'Integer'), "to_int");
      if ($truthy($rb_lt(base, 2))) {
        self.$raise($$($nesting, 'ArgumentError'), "" + "invalid radix " + (base))};
      
      var value = self, result = [];

      while (value !== 0) {
        result.push(value % base);
        value = parseInt(value / base, 10);
      }

      return result;
    ;
    }, $Number_digits$67.$$arity = -1);
    
    Opal.def(self, '$divmod', $Number_divmod$68 = function $$divmod(other) {
      var $a, $iter = $Number_divmod$68.$$p, $yield = $iter || nil, self = this, $zuper = nil, $zuper_i = nil, $zuper_ii = nil;

      if ($iter) $Number_divmod$68.$$p = null;
      // Prepare super implicit arguments
      for($zuper_i = 0, $zuper_ii = arguments.length, $zuper = new Array($zuper_ii); $zuper_i < $zuper_ii; $zuper_i++) {
        $zuper[$zuper_i] = arguments[$zuper_i];
      }
      if ($truthy(($truthy($a = self['$nan?']()) ? $a : other['$nan?']()))) {
        return self.$raise($$($nesting, 'FloatDomainError'), "NaN")
      } else if ($truthy(self['$infinite?']())) {
        return self.$raise($$($nesting, 'FloatDomainError'), "Infinity")
      } else {
        return $send(self, Opal.find_super_dispatcher(self, 'divmod', $Number_divmod$68, false), $zuper, $iter)
      }
    }, $Number_divmod$68.$$arity = 1);
    
    Opal.def(self, '$upto', $Number_upto$69 = function $$upto(stop) {
      var $iter = $Number_upto$69.$$p, block = $iter || nil, $$70, self = this;

      if ($iter) $Number_upto$69.$$p = null;
      
      
      if ($iter) $Number_upto$69.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["upto", stop], ($$70 = function(){var self = $$70.$$s || this;

        
          if ($truthy($$($nesting, 'Numeric')['$==='](stop))) {
          } else {
            self.$raise($$($nesting, 'ArgumentError'), "" + "comparison of " + (self.$class()) + " with " + (stop.$class()) + " failed")
          };
          if ($truthy($rb_lt(stop, self))) {
            return 0
          } else {
            return $rb_plus($rb_minus(stop, self), 1)
          };}, $$70.$$s = self, $$70.$$arity = 0, $$70))
      };
      
      if (!stop.$$is_number) {
        self.$raise($$($nesting, 'ArgumentError'), "" + "comparison of " + (self.$class()) + " with " + (stop.$class()) + " failed")
      }
      for (var i = self; i <= stop; i++) {
        block(i);
      }
    ;
      return self;
    }, $Number_upto$69.$$arity = 1);
    
    Opal.def(self, '$zero?', $Number_zero$ques$71 = function() {
      var self = this;

      return self == 0;
    }, $Number_zero$ques$71.$$arity = 0);
    
    Opal.def(self, '$size', $Number_size$72 = function $$size() {
      var self = this;

      return 4
    }, $Number_size$72.$$arity = 0);
    
    Opal.def(self, '$nan?', $Number_nan$ques$73 = function() {
      var self = this;

      return isNaN(self);
    }, $Number_nan$ques$73.$$arity = 0);
    
    Opal.def(self, '$finite?', $Number_finite$ques$74 = function() {
      var self = this;

      return self != Infinity && self != -Infinity && !isNaN(self);
    }, $Number_finite$ques$74.$$arity = 0);
    
    Opal.def(self, '$infinite?', $Number_infinite$ques$75 = function() {
      var self = this;

      
      if (self == Infinity) {
        return +1;
      }
      else if (self == -Infinity) {
        return -1;
      }
      else {
        return nil;
      }
    
    }, $Number_infinite$ques$75.$$arity = 0);
    
    Opal.def(self, '$positive?', $Number_positive$ques$76 = function() {
      var self = this;

      return self != 0 && (self == Infinity || 1 / self > 0);
    }, $Number_positive$ques$76.$$arity = 0);
    return (Opal.def(self, '$negative?', $Number_negative$ques$77 = function() {
      var self = this;

      return self == -Infinity || 1 / self < 0;
    }, $Number_negative$ques$77.$$arity = 0), nil) && 'negative?';
  })($nesting[0], $$($nesting, 'Numeric'), $nesting);
  Opal.const_set($nesting[0], 'Fixnum', $$($nesting, 'Number'));
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Integer');

    var $nesting = [self].concat($parent_nesting);

    
    self.$$is_number_class = true;
    (function(self, $parent_nesting) {
      var $nesting = [self].concat($parent_nesting), $allocate$78, $eq_eq_eq$79, $sqrt$80;

      
      
      Opal.def(self, '$allocate', $allocate$78 = function $$allocate() {
        var self = this;

        return self.$raise($$($nesting, 'TypeError'), "" + "allocator undefined for " + (self.$name()))
      }, $allocate$78.$$arity = 0);
      
      Opal.udef(self, '$' + "new");;
      
      Opal.def(self, '$===', $eq_eq_eq$79 = function(other) {
        var self = this;

        
        if (!other.$$is_number) {
          return false;
        }

        return (other % 1) === 0;
      
      }, $eq_eq_eq$79.$$arity = 1);
      return (Opal.def(self, '$sqrt', $sqrt$80 = function $$sqrt(n) {
        var self = this;

        
        n = $$($nesting, 'Opal')['$coerce_to!'](n, $$($nesting, 'Integer'), "to_int");
        
        if (n < 0) {
          self.$raise($$$($$($nesting, 'Math'), 'DomainError'), "Numerical argument is out of domain - \"isqrt\"")
        }

        return parseInt(Math.sqrt(n), 10);
      ;
      }, $sqrt$80.$$arity = 1), nil) && 'sqrt';
    })(Opal.get_singleton_class(self), $nesting);
    Opal.const_set($nesting[0], 'MAX', Math.pow(2, 30) - 1);
    return Opal.const_set($nesting[0], 'MIN', -Math.pow(2, 30));
  })($nesting[0], $$($nesting, 'Numeric'), $nesting);
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Float');

    var $nesting = [self].concat($parent_nesting);

    
    self.$$is_number_class = true;
    (function(self, $parent_nesting) {
      var $nesting = [self].concat($parent_nesting), $allocate$81, $eq_eq_eq$82;

      
      
      Opal.def(self, '$allocate', $allocate$81 = function $$allocate() {
        var self = this;

        return self.$raise($$($nesting, 'TypeError'), "" + "allocator undefined for " + (self.$name()))
      }, $allocate$81.$$arity = 0);
      
      Opal.udef(self, '$' + "new");;
      return (Opal.def(self, '$===', $eq_eq_eq$82 = function(other) {
        var self = this;

        return !!other.$$is_number;
      }, $eq_eq_eq$82.$$arity = 1), nil) && '===';
    })(Opal.get_singleton_class(self), $nesting);
    Opal.const_set($nesting[0], 'INFINITY', Infinity);
    Opal.const_set($nesting[0], 'MAX', Number.MAX_VALUE);
    Opal.const_set($nesting[0], 'MIN', Number.MIN_VALUE);
    Opal.const_set($nesting[0], 'NAN', NaN);
    Opal.const_set($nesting[0], 'DIG', 15);
    Opal.const_set($nesting[0], 'MANT_DIG', 53);
    Opal.const_set($nesting[0], 'RADIX', 2);
    return Opal.const_set($nesting[0], 'EPSILON', Number.EPSILON || 2.2204460492503130808472633361816E-16);
  })($nesting[0], $$($nesting, 'Numeric'), $nesting);
};

/* Generated by Opal 0.11.99.dev */
Opal.modules["corelib/range"] = function(Opal) {
  function $rb_le(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs <= rhs : lhs['$<='](rhs);
  }
  function $rb_lt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs < rhs : lhs['$<'](rhs);
  }
  function $rb_gt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs > rhs : lhs['$>'](rhs);
  }
  function $rb_minus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs - rhs : lhs['$-'](rhs);
  }
  function $rb_divide(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs / rhs : lhs['$/'](rhs);
  }
  function $rb_plus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs + rhs : lhs['$+'](rhs);
  }
  function $rb_times(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs * rhs : lhs['$*'](rhs);
  }
  function $rb_ge(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs >= rhs : lhs['$>='](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice, $klass = Opal.klass, $truthy = Opal.truthy, $send = Opal.send;

  Opal.add_stubs(['$require', '$include', '$attr_reader', '$raise', '$<=>', '$include?', '$<=', '$<', '$enum_for', '$upto', '$to_proc', '$respond_to?', '$class', '$succ', '$!', '$==', '$===', '$exclude_end?', '$eql?', '$begin', '$end', '$last', '$to_a', '$>', '$-', '$abs', '$to_i', '$coerce_to!', '$ceil', '$/', '$size', '$loop', '$+', '$*', '$>=', '$each_with_index', '$%', '$bsearch', '$inspect', '$[]', '$hash']);
  
  self.$require("corelib/enumerable");
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Range');

    var $nesting = [self].concat($parent_nesting), $Range_initialize$1, $Range_$eq_eq$2, $Range_$eq_eq_eq$3, $Range_cover$ques$4, $Range_each$5, $Range_eql$ques$6, $Range_exclude_end$ques$7, $Range_first$8, $Range_last$9, $Range_max$10, $Range_min$11, $Range_size$12, $Range_step$13, $Range_bsearch$17, $Range_to_s$18, $Range_inspect$19, $Range_marshal_load$20, $Range_hash$21;

    self.$$prototype.begin = self.$$prototype.end = self.$$prototype.excl = nil;
    
    self.$include($$($nesting, 'Enumerable'));
    self.$$prototype.$$is_range = true;
    self.$attr_reader("begin", "end");
    
    Opal.def(self, '$initialize', $Range_initialize$1 = function $$initialize(first, last, exclude) {
      var self = this;

      
      
      if (exclude == null) {
        exclude = false;
      };
      if ($truthy(self.begin)) {
        self.$raise($$($nesting, 'NameError'), "'initialize' called twice")};
      if ($truthy(first['$<=>'](last))) {
      } else {
        self.$raise($$($nesting, 'ArgumentError'), "bad value for range")
      };
      self.begin = first;
      self.end = last;
      return (self.excl = exclude);
    }, $Range_initialize$1.$$arity = -3);
    
    Opal.def(self, '$==', $Range_$eq_eq$2 = function(other) {
      var self = this;

      
      if (!other.$$is_range) {
        return false;
      }

      return self.excl  === other.excl &&
             self.begin ==  other.begin &&
             self.end   ==  other.end;
    
    }, $Range_$eq_eq$2.$$arity = 1);
    
    Opal.def(self, '$===', $Range_$eq_eq_eq$3 = function(value) {
      var self = this;

      return self['$include?'](value)
    }, $Range_$eq_eq_eq$3.$$arity = 1);
    
    Opal.def(self, '$cover?', $Range_cover$ques$4 = function(value) {
      var $a, self = this, beg_cmp = nil, end_cmp = nil;

      
      beg_cmp = self.begin['$<=>'](value);
      if ($truthy(($truthy($a = beg_cmp) ? $rb_le(beg_cmp, 0) : $a))) {
      } else {
        return false
      };
      end_cmp = value['$<=>'](self.end);
      if ($truthy(self.excl)) {
        return ($truthy($a = end_cmp) ? $rb_lt(end_cmp, 0) : $a)
      } else {
        return ($truthy($a = end_cmp) ? $rb_le(end_cmp, 0) : $a)
      };
    }, $Range_cover$ques$4.$$arity = 1);
    
    Opal.def(self, '$each', $Range_each$5 = function $$each() {
      var $iter = $Range_each$5.$$p, block = $iter || nil, $a, self = this, current = nil, last = nil;

      if ($iter) $Range_each$5.$$p = null;
      
      
      if ($iter) $Range_each$5.$$p = null;;
      if ((block !== nil)) {
      } else {
        return self.$enum_for("each")
      };
      
      var i, limit;

      if (self.begin.$$is_number && self.end.$$is_number) {
        if (self.begin % 1 !== 0 || self.end % 1 !== 0) {
          self.$raise($$($nesting, 'TypeError'), "can't iterate from Float")
        }

        for (i = self.begin, limit = self.end + (function() {if ($truthy(self.excl)) {
        return 0
      } else {
        return 1
      }; return nil; })(); i < limit; i++) {
          block(i);
        }

        return self;
      }

      if (self.begin.$$is_string && self.end.$$is_string) {
        $send(self.begin, 'upto', [self.end, self.excl], block.$to_proc())
        return self;
      }
    ;
      current = self.begin;
      last = self.end;
      if ($truthy(current['$respond_to?']("succ"))) {
      } else {
        self.$raise($$($nesting, 'TypeError'), "" + "can't iterate from " + (current.$class()))
      };
      while ($truthy($rb_lt(current['$<=>'](last), 0))) {
        
        Opal.yield1(block, current);
        current = current.$succ();
      };
      if ($truthy(($truthy($a = self.excl['$!']()) ? current['$=='](last) : $a))) {
        Opal.yield1(block, current)};
      return self;
    }, $Range_each$5.$$arity = 0);
    
    Opal.def(self, '$eql?', $Range_eql$ques$6 = function(other) {
      var $a, $b, self = this;

      
      if ($truthy($$($nesting, 'Range')['$==='](other))) {
      } else {
        return false
      };
      return ($truthy($a = ($truthy($b = self.excl['$==='](other['$exclude_end?']())) ? self.begin['$eql?'](other.$begin()) : $b)) ? self.end['$eql?'](other.$end()) : $a);
    }, $Range_eql$ques$6.$$arity = 1);
    
    Opal.def(self, '$exclude_end?', $Range_exclude_end$ques$7 = function() {
      var self = this;

      return self.excl
    }, $Range_exclude_end$ques$7.$$arity = 0);
    
    Opal.def(self, '$first', $Range_first$8 = function $$first(n) {
      var $iter = $Range_first$8.$$p, $yield = $iter || nil, self = this, $zuper = nil, $zuper_i = nil, $zuper_ii = nil;

      if ($iter) $Range_first$8.$$p = null;
      // Prepare super implicit arguments
      for($zuper_i = 0, $zuper_ii = arguments.length, $zuper = new Array($zuper_ii); $zuper_i < $zuper_ii; $zuper_i++) {
        $zuper[$zuper_i] = arguments[$zuper_i];
      }
      
      ;
      if ($truthy(n == null)) {
        return self.begin};
      return $send(self, Opal.find_super_dispatcher(self, 'first', $Range_first$8, false), $zuper, $iter);
    }, $Range_first$8.$$arity = -1);
    Opal.alias(self, "include?", "cover?");
    
    Opal.def(self, '$last', $Range_last$9 = function $$last(n) {
      var self = this;

      
      ;
      if ($truthy(n == null)) {
        return self.end};
      return self.$to_a().$last(n);
    }, $Range_last$9.$$arity = -1);
    
    Opal.def(self, '$max', $Range_max$10 = function $$max() {
      var $a, $iter = $Range_max$10.$$p, $yield = $iter || nil, self = this, $zuper = nil, $zuper_i = nil, $zuper_ii = nil;

      if ($iter) $Range_max$10.$$p = null;
      // Prepare super implicit arguments
      for($zuper_i = 0, $zuper_ii = arguments.length, $zuper = new Array($zuper_ii); $zuper_i < $zuper_ii; $zuper_i++) {
        $zuper[$zuper_i] = arguments[$zuper_i];
      }
      if (($yield !== nil)) {
        return $send(self, Opal.find_super_dispatcher(self, 'max', $Range_max$10, false), $zuper, $iter)
      } else if ($truthy($rb_gt(self.begin, self.end))) {
        return nil
      } else if ($truthy(($truthy($a = self.excl) ? self.begin['$=='](self.end) : $a))) {
        return nil
      } else {
        return self.excl ? self.end - 1 : self.end
      }
    }, $Range_max$10.$$arity = 0);
    Opal.alias(self, "member?", "cover?");
    
    Opal.def(self, '$min', $Range_min$11 = function $$min() {
      var $a, $iter = $Range_min$11.$$p, $yield = $iter || nil, self = this, $zuper = nil, $zuper_i = nil, $zuper_ii = nil;

      if ($iter) $Range_min$11.$$p = null;
      // Prepare super implicit arguments
      for($zuper_i = 0, $zuper_ii = arguments.length, $zuper = new Array($zuper_ii); $zuper_i < $zuper_ii; $zuper_i++) {
        $zuper[$zuper_i] = arguments[$zuper_i];
      }
      if (($yield !== nil)) {
        return $send(self, Opal.find_super_dispatcher(self, 'min', $Range_min$11, false), $zuper, $iter)
      } else if ($truthy($rb_gt(self.begin, self.end))) {
        return nil
      } else if ($truthy(($truthy($a = self.excl) ? self.begin['$=='](self.end) : $a))) {
        return nil
      } else {
        return self.begin
      }
    }, $Range_min$11.$$arity = 0);
    
    Opal.def(self, '$size', $Range_size$12 = function $$size() {
      var $a, self = this, range_begin = nil, range_end = nil, infinity = nil;

      
      range_begin = self.begin;
      range_end = self.end;
      if ($truthy(self.excl)) {
        range_end = $rb_minus(range_end, 1)};
      if ($truthy(($truthy($a = $$($nesting, 'Numeric')['$==='](range_begin)) ? $$($nesting, 'Numeric')['$==='](range_end) : $a))) {
      } else {
        return nil
      };
      if ($truthy($rb_lt(range_end, range_begin))) {
        return 0};
      infinity = $$$($$($nesting, 'Float'), 'INFINITY');
      if ($truthy([range_begin.$abs(), range_end.$abs()]['$include?'](infinity))) {
        return infinity};
      return (Math.abs(range_end - range_begin) + 1).$to_i();
    }, $Range_size$12.$$arity = 0);
    
    Opal.def(self, '$step', $Range_step$13 = function $$step(n) {
      var $$14, $$15, $$16, $iter = $Range_step$13.$$p, $yield = $iter || nil, self = this, i = nil;

      if ($iter) $Range_step$13.$$p = null;
      
      
      if (n == null) {
        n = 1;
      };
      
      function coerceStepSize() {
        if (!n.$$is_number) {
          n = $$($nesting, 'Opal')['$coerce_to!'](n, $$($nesting, 'Integer'), "to_int")
        }

        if (n < 0) {
          self.$raise($$($nesting, 'ArgumentError'), "step can't be negative")
        } else if (n === 0) {
          self.$raise($$($nesting, 'ArgumentError'), "step can't be 0")
        }
      }

      function enumeratorSize() {
        if (!self.begin['$respond_to?']("succ")) {
          return nil;
        }

        if (self.begin.$$is_string && self.end.$$is_string) {
          return nil;
        }

        if (n % 1 === 0) {
          return $rb_divide(self.$size(), n).$ceil();
        } else {
          // n is a float
          var begin = self.begin, end = self.end,
              abs = Math.abs, floor = Math.floor,
              err = (abs(begin) + abs(end) + abs(end - begin)) / abs(n) * $$$($$($nesting, 'Float'), 'EPSILON'),
              size;

          if (err > 0.5) {
            err = 0.5;
          }

          if (self.excl) {
            size = floor((end - begin) / n - err);
            if (size * n + begin < end) {
              size++;
            }
          } else {
            size = floor((end - begin) / n + err) + 1
          }

          return size;
        }
      }
    ;
      if (($yield !== nil)) {
      } else {
        return $send(self, 'enum_for', ["step", n], ($$14 = function(){var self = $$14.$$s || this;

        
          coerceStepSize();
          return enumeratorSize();
        }, $$14.$$s = self, $$14.$$arity = 0, $$14))
      };
      coerceStepSize();
      if ($truthy(self.begin.$$is_number && self.end.$$is_number)) {
        
        i = 0;
        (function(){var $brk = Opal.new_brk(); try {return $send(self, 'loop', [], ($$15 = function(){var self = $$15.$$s || this, current = nil;
          if (self.begin == null) self.begin = nil;
          if (self.excl == null) self.excl = nil;
          if (self.end == null) self.end = nil;

        
          current = $rb_plus(self.begin, $rb_times(i, n));
          if ($truthy(self.excl)) {
            if ($truthy($rb_ge(current, self.end))) {
              
              Opal.brk(nil, $brk)}
          } else if ($truthy($rb_gt(current, self.end))) {
            
            Opal.brk(nil, $brk)};
          Opal.yield1($yield, current);
          return (i = $rb_plus(i, 1));}, $$15.$$s = self, $$15.$$brk = $brk, $$15.$$arity = 0, $$15))
        } catch (err) { if (err === $brk) { return err.$v } else { throw err } }})();
      } else {
        
        
        if (self.begin.$$is_string && self.end.$$is_string && n % 1 !== 0) {
          self.$raise($$($nesting, 'TypeError'), "no implicit conversion to float from string")
        }
      ;
        $send(self, 'each_with_index', [], ($$16 = function(value, idx){var self = $$16.$$s || this;

        
          
          if (value == null) {
            value = nil;
          };
          
          if (idx == null) {
            idx = nil;
          };
          if (idx['$%'](n)['$=='](0)) {
            return Opal.yield1($yield, value);
          } else {
            return nil
          };}, $$16.$$s = self, $$16.$$arity = 2, $$16));
      };
      return self;
    }, $Range_step$13.$$arity = -1);
    
    Opal.def(self, '$bsearch', $Range_bsearch$17 = function $$bsearch() {
      var $iter = $Range_bsearch$17.$$p, block = $iter || nil, self = this;

      if ($iter) $Range_bsearch$17.$$p = null;
      
      
      if ($iter) $Range_bsearch$17.$$p = null;;
      if ((block !== nil)) {
      } else {
        return self.$enum_for("bsearch")
      };
      if ($truthy(self.begin.$$is_number && self.end.$$is_number)) {
      } else {
        self.$raise($$($nesting, 'TypeError'), "" + "can't do binary search for " + (self.begin.$class()))
      };
      return $send(self.$to_a(), 'bsearch', [], block.$to_proc());
    }, $Range_bsearch$17.$$arity = 0);
    
    Opal.def(self, '$to_s', $Range_to_s$18 = function $$to_s() {
      var self = this;

      return "" + (self.begin) + ((function() {if ($truthy(self.excl)) {
        return "..."
      } else {
        return ".."
      }; return nil; })()) + (self.end)
    }, $Range_to_s$18.$$arity = 0);
    
    Opal.def(self, '$inspect', $Range_inspect$19 = function $$inspect() {
      var self = this;

      return "" + (self.begin.$inspect()) + ((function() {if ($truthy(self.excl)) {
        return "..."
      } else {
        return ".."
      }; return nil; })()) + (self.end.$inspect())
    }, $Range_inspect$19.$$arity = 0);
    
    Opal.def(self, '$marshal_load', $Range_marshal_load$20 = function $$marshal_load(args) {
      var self = this;

      
      self.begin = args['$[]']("begin");
      self.end = args['$[]']("end");
      return (self.excl = args['$[]']("excl"));
    }, $Range_marshal_load$20.$$arity = 1);
    return (Opal.def(self, '$hash', $Range_hash$21 = function $$hash() {
      var self = this;

      return [self.begin, self.end, self.excl].$hash()
    }, $Range_hash$21.$$arity = 0), nil) && 'hash';
  })($nesting[0], null, $nesting);
};

/* Generated by Opal 0.11.99.dev */
Opal.modules["corelib/proc"] = function(Opal) {
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice, $klass = Opal.klass, $truthy = Opal.truthy;

  Opal.add_stubs(['$raise', '$coerce_to!']);
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Proc');

    var $nesting = [self].concat($parent_nesting), $Proc_new$1, $Proc_call$2, $Proc_to_proc$3, $Proc_lambda$ques$4, $Proc_arity$5, $Proc_source_location$6, $Proc_binding$7, $Proc_parameters$8, $Proc_curry$9, $Proc_dup$10;

    
    Opal.defineProperty(self.$$prototype, '$$is_proc', true);
    Opal.defineProperty(self.$$prototype, '$$is_lambda', false);
    Opal.defs(self, '$new', $Proc_new$1 = function() {
      var $iter = $Proc_new$1.$$p, block = $iter || nil, self = this;

      if ($iter) $Proc_new$1.$$p = null;
      
      
      if ($iter) $Proc_new$1.$$p = null;;
      if ($truthy(block)) {
      } else {
        self.$raise($$($nesting, 'ArgumentError'), "tried to create a Proc object without a block")
      };
      return block;
    }, $Proc_new$1.$$arity = 0);
    
    Opal.def(self, '$call', $Proc_call$2 = function $$call($a) {
      var $iter = $Proc_call$2.$$p, block = $iter || nil, $post_args, args, self = this;

      if ($iter) $Proc_call$2.$$p = null;
      
      
      if ($iter) $Proc_call$2.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      
      if (block !== nil) {
        self.$$p = block;
      }

      var result, $brk = self.$$brk;

      if ($brk) {
        try {
          if (self.$$is_lambda) {
            result = self.apply(null, args);
          }
          else {
            result = Opal.yieldX(self, args);
          }
        } catch (err) {
          if (err === $brk) {
            return $brk.$v
          }
          else {
            throw err
          }
        }
      }
      else {
        if (self.$$is_lambda) {
          result = self.apply(null, args);
        }
        else {
          result = Opal.yieldX(self, args);
        }
      }

      return result;
    ;
    }, $Proc_call$2.$$arity = -1);
    Opal.alias(self, "[]", "call");
    Opal.alias(self, "===", "call");
    Opal.alias(self, "yield", "call");
    
    Opal.def(self, '$to_proc', $Proc_to_proc$3 = function $$to_proc() {
      var self = this;

      return self
    }, $Proc_to_proc$3.$$arity = 0);
    
    Opal.def(self, '$lambda?', $Proc_lambda$ques$4 = function() {
      var self = this;

      return !!self.$$is_lambda;
    }, $Proc_lambda$ques$4.$$arity = 0);
    
    Opal.def(self, '$arity', $Proc_arity$5 = function $$arity() {
      var self = this;

      
      if (self.$$is_curried) {
        return -1;
      } else {
        return self.$$arity;
      }
    
    }, $Proc_arity$5.$$arity = 0);
    
    Opal.def(self, '$source_location', $Proc_source_location$6 = function $$source_location() {
      var self = this;

      
      if (self.$$is_curried) { return nil; };
      return nil;
    }, $Proc_source_location$6.$$arity = 0);
    
    Opal.def(self, '$binding', $Proc_binding$7 = function $$binding() {
      var self = this;

      
      if (self.$$is_curried) { self.$raise($$($nesting, 'ArgumentError'), "Can't create Binding") };
      return nil;
    }, $Proc_binding$7.$$arity = 0);
    
    Opal.def(self, '$parameters', $Proc_parameters$8 = function $$parameters() {
      var self = this;

      
      if (self.$$is_curried) {
        return [["rest"]];
      } else if (self.$$parameters) {
        if (self.$$is_lambda) {
          return self.$$parameters;
        } else {
          var result = [], i, length;

          for (i = 0, length = self.$$parameters.length; i < length; i++) {
            var parameter = self.$$parameters[i];

            if (parameter[0] === 'req') {
              // required arguments always have name
              parameter = ['opt', parameter[1]];
            }

            result.push(parameter);
          }

          return result;
        }
      } else {
        return [];
      }
    
    }, $Proc_parameters$8.$$arity = 0);
    
    Opal.def(self, '$curry', $Proc_curry$9 = function $$curry(arity) {
      var self = this;

      
      ;
      
      if (arity === undefined) {
        arity = self.length;
      }
      else {
        arity = $$($nesting, 'Opal')['$coerce_to!'](arity, $$($nesting, 'Integer'), "to_int");
        if (self.$$is_lambda && arity !== self.length) {
          self.$raise($$($nesting, 'ArgumentError'), "" + "wrong number of arguments (" + (arity) + " for " + (self.length) + ")")
        }
      }

      function curried () {
        var args = $slice.call(arguments),
            length = args.length,
            result;

        if (length > arity && self.$$is_lambda && !self.$$is_curried) {
          self.$raise($$($nesting, 'ArgumentError'), "" + "wrong number of arguments (" + (length) + " for " + (arity) + ")")
        }

        if (length >= arity) {
          return self.$call.apply(self, args);
        }

        result = function () {
          return curried.apply(null,
            args.concat($slice.call(arguments)));
        }
        result.$$is_lambda = self.$$is_lambda;
        result.$$is_curried = true;

        return result;
      };

      curried.$$is_lambda = self.$$is_lambda;
      curried.$$is_curried = true;
      return curried;
    ;
    }, $Proc_curry$9.$$arity = -1);
    
    Opal.def(self, '$dup', $Proc_dup$10 = function $$dup() {
      var self = this;

      
      var original_proc = self.$$original_proc || self,
          proc = function () {
            return original_proc.apply(this, arguments);
          };

      for (var prop in self) {
        if (self.hasOwnProperty(prop)) {
          proc[prop] = self[prop];
        }
      }

      return proc;
    
    }, $Proc_dup$10.$$arity = 0);
    return Opal.alias(self, "clone", "dup");
  })($nesting[0], Function, $nesting)
};

/* Generated by Opal 0.11.99.dev */
Opal.modules["corelib/method"] = function(Opal) {
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice, $klass = Opal.klass, $truthy = Opal.truthy;

  Opal.add_stubs(['$attr_reader', '$arity', '$new', '$class', '$join', '$source_location', '$raise']);
  
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Method');

    var $nesting = [self].concat($parent_nesting), $Method_initialize$1, $Method_arity$2, $Method_parameters$3, $Method_source_location$4, $Method_comments$5, $Method_call$6, $Method_unbind$7, $Method_to_proc$8, $Method_inspect$9;

    self.$$prototype.method = self.$$prototype.receiver = self.$$prototype.owner = self.$$prototype.name = nil;
    
    self.$attr_reader("owner", "receiver", "name");
    
    Opal.def(self, '$initialize', $Method_initialize$1 = function $$initialize(receiver, owner, method, name) {
      var self = this;

      
      self.receiver = receiver;
      self.owner = owner;
      self.name = name;
      return (self.method = method);
    }, $Method_initialize$1.$$arity = 4);
    
    Opal.def(self, '$arity', $Method_arity$2 = function $$arity() {
      var self = this;

      return self.method.$arity()
    }, $Method_arity$2.$$arity = 0);
    
    Opal.def(self, '$parameters', $Method_parameters$3 = function $$parameters() {
      var self = this;

      return self.method.$$parameters
    }, $Method_parameters$3.$$arity = 0);
    
    Opal.def(self, '$source_location', $Method_source_location$4 = function $$source_location() {
      var $a, self = this;

      return ($truthy($a = self.method.$$source_location) ? $a : ["(eval)", 0])
    }, $Method_source_location$4.$$arity = 0);
    
    Opal.def(self, '$comments', $Method_comments$5 = function $$comments() {
      var $a, self = this;

      return ($truthy($a = self.method.$$comments) ? $a : [])
    }, $Method_comments$5.$$arity = 0);
    
    Opal.def(self, '$call', $Method_call$6 = function $$call($a) {
      var $iter = $Method_call$6.$$p, block = $iter || nil, $post_args, args, self = this;

      if ($iter) $Method_call$6.$$p = null;
      
      
      if ($iter) $Method_call$6.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      
      self.method.$$p = block;

      return self.method.apply(self.receiver, args);
    ;
    }, $Method_call$6.$$arity = -1);
    Opal.alias(self, "[]", "call");
    
    Opal.def(self, '$unbind', $Method_unbind$7 = function $$unbind() {
      var self = this;

      return $$($nesting, 'UnboundMethod').$new(self.receiver.$class(), self.owner, self.method, self.name)
    }, $Method_unbind$7.$$arity = 0);
    
    Opal.def(self, '$to_proc', $Method_to_proc$8 = function $$to_proc() {
      var self = this;

      
      var proc = self.$call.bind(self);
      proc.$$unbound = self.method;
      proc.$$is_lambda = true;
      proc.$$arity = self.method.$$arity;
      proc.$$parameters = self.method.$$parameters;
      return proc;
    
    }, $Method_to_proc$8.$$arity = 0);
    return (Opal.def(self, '$inspect', $Method_inspect$9 = function $$inspect() {
      var self = this;

      return "" + "#<" + (self.$class()) + ": " + (self.receiver.$class()) + "#" + (self.name) + " (defined in " + (self.owner) + " in " + (self.$source_location().$join(":")) + ")>"
    }, $Method_inspect$9.$$arity = 0), nil) && 'inspect';
  })($nesting[0], null, $nesting);
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'UnboundMethod');

    var $nesting = [self].concat($parent_nesting), $UnboundMethod_initialize$10, $UnboundMethod_arity$11, $UnboundMethod_parameters$12, $UnboundMethod_source_location$13, $UnboundMethod_comments$14, $UnboundMethod_bind$15, $UnboundMethod_inspect$16;

    self.$$prototype.method = self.$$prototype.owner = self.$$prototype.name = self.$$prototype.source = nil;
    
    self.$attr_reader("source", "owner", "name");
    
    Opal.def(self, '$initialize', $UnboundMethod_initialize$10 = function $$initialize(source, owner, method, name) {
      var self = this;

      
      self.source = source;
      self.owner = owner;
      self.method = method;
      return (self.name = name);
    }, $UnboundMethod_initialize$10.$$arity = 4);
    
    Opal.def(self, '$arity', $UnboundMethod_arity$11 = function $$arity() {
      var self = this;

      return self.method.$arity()
    }, $UnboundMethod_arity$11.$$arity = 0);
    
    Opal.def(self, '$parameters', $UnboundMethod_parameters$12 = function $$parameters() {
      var self = this;

      return self.method.$$parameters
    }, $UnboundMethod_parameters$12.$$arity = 0);
    
    Opal.def(self, '$source_location', $UnboundMethod_source_location$13 = function $$source_location() {
      var $a, self = this;

      return ($truthy($a = self.method.$$source_location) ? $a : ["(eval)", 0])
    }, $UnboundMethod_source_location$13.$$arity = 0);
    
    Opal.def(self, '$comments', $UnboundMethod_comments$14 = function $$comments() {
      var $a, self = this;

      return ($truthy($a = self.method.$$comments) ? $a : [])
    }, $UnboundMethod_comments$14.$$arity = 0);
    
    Opal.def(self, '$bind', $UnboundMethod_bind$15 = function $$bind(object) {
      var self = this;

      
      if (self.owner.$$is_module || Opal.is_a(object, self.owner)) {
        return $$($nesting, 'Method').$new(object, self.owner, self.method, self.name);
      }
      else {
        self.$raise($$($nesting, 'TypeError'), "" + "can't bind singleton method to a different class (expected " + (object) + ".kind_of?(" + (self.owner) + " to be true)");
      }
    
    }, $UnboundMethod_bind$15.$$arity = 1);
    return (Opal.def(self, '$inspect', $UnboundMethod_inspect$16 = function $$inspect() {
      var self = this;

      return "" + "#<" + (self.$class()) + ": " + (self.source) + "#" + (self.name) + " (defined in " + (self.owner) + " in " + (self.$source_location().$join(":")) + ")>"
    }, $UnboundMethod_inspect$16.$$arity = 0), nil) && 'inspect';
  })($nesting[0], null, $nesting);
};

/* Generated by Opal 0.11.99.dev */
Opal.modules["corelib/variables"] = function(Opal) {
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice, $gvars = Opal.gvars, $hash2 = Opal.hash2;

  Opal.add_stubs(['$new']);
  
  $gvars['&'] = $gvars['~'] = $gvars['`'] = $gvars["'"] = nil;
  $gvars.LOADED_FEATURES = ($gvars["\""] = Opal.loaded_features);
  $gvars.LOAD_PATH = ($gvars[":"] = []);
  $gvars["/"] = "\n";
  $gvars[","] = nil;
  Opal.const_set($nesting[0], 'ARGV', []);
  Opal.const_set($nesting[0], 'ARGF', $$($nesting, 'Object').$new());
  Opal.const_set($nesting[0], 'ENV', $hash2([], {}));
  $gvars.VERBOSE = false;
  $gvars.DEBUG = false;
  return ($gvars.SAFE = 0);
};

/* Generated by Opal 0.11.99.dev */
Opal.modules["opal/regexp_anchors"] = function(Opal) {
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice, $module = Opal.module;

  Opal.add_stubs(['$==', '$new']);
  return (function($base, $parent_nesting) {
    var self = $module($base, 'Opal');

    var $nesting = [self].concat($parent_nesting);

    
    Opal.const_set($nesting[0], 'REGEXP_START', (function() {if ($$($nesting, 'RUBY_ENGINE')['$==']("opal")) {
      return "^"
    } else {
      return nil
    }; return nil; })());
    Opal.const_set($nesting[0], 'REGEXP_END', (function() {if ($$($nesting, 'RUBY_ENGINE')['$==']("opal")) {
      return "$"
    } else {
      return nil
    }; return nil; })());
    Opal.const_set($nesting[0], 'FORBIDDEN_STARTING_IDENTIFIER_CHARS', "\\u0001-\\u002F\\u003A-\\u0040\\u005B-\\u005E\\u0060\\u007B-\\u007F");
    Opal.const_set($nesting[0], 'FORBIDDEN_ENDING_IDENTIFIER_CHARS', "\\u0001-\\u0020\\u0022-\\u002F\\u003A-\\u003E\\u0040\\u005B-\\u005E\\u0060\\u007B-\\u007F");
    Opal.const_set($nesting[0], 'INLINE_IDENTIFIER_REGEXP', $$($nesting, 'Regexp').$new("" + "[^" + ($$($nesting, 'FORBIDDEN_STARTING_IDENTIFIER_CHARS')) + "]*[^" + ($$($nesting, 'FORBIDDEN_ENDING_IDENTIFIER_CHARS')) + "]"));
    Opal.const_set($nesting[0], 'FORBIDDEN_CONST_NAME_CHARS', "\\u0001-\\u0020\\u0021-\\u002F\\u003B-\\u003F\\u0040\\u005B-\\u005E\\u0060\\u007B-\\u007F");
    Opal.const_set($nesting[0], 'CONST_NAME_REGEXP', $$($nesting, 'Regexp').$new("" + ($$($nesting, 'REGEXP_START')) + "(::)?[A-Z][^" + ($$($nesting, 'FORBIDDEN_CONST_NAME_CHARS')) + "]*" + ($$($nesting, 'REGEXP_END'))));
  })($nesting[0], $nesting)
};

/* Generated by Opal 0.11.99.dev */
Opal.modules["opal/mini"] = function(Opal) {
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice;

  Opal.add_stubs(['$require']);
  
  self.$require("opal/base");
  self.$require("corelib/nil");
  self.$require("corelib/boolean");
  self.$require("corelib/string");
  self.$require("corelib/comparable");
  self.$require("corelib/enumerable");
  self.$require("corelib/enumerator");
  self.$require("corelib/array");
  self.$require("corelib/hash");
  self.$require("corelib/number");
  self.$require("corelib/range");
  self.$require("corelib/proc");
  self.$require("corelib/method");
  self.$require("corelib/regexp");
  self.$require("corelib/variables");
  return self.$require("opal/regexp_anchors");
};

/* Generated by Opal 0.11.99.dev */
Opal.modules["corelib/string/encoding"] = function(Opal) {
  function $rb_plus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs + rhs : lhs['$+'](rhs);
  }
  var $$12, $$15, $$18, $$21, $$24, self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice, $klass = Opal.klass, $hash2 = Opal.hash2, $truthy = Opal.truthy, $send = Opal.send;

  Opal.add_stubs(['$require', '$+', '$[]', '$new', '$to_proc', '$each', '$const_set', '$sub', '$==', '$default_external', '$upcase', '$raise', '$attr_accessor', '$attr_reader', '$register', '$length', '$bytes', '$to_a', '$each_byte', '$bytesize', '$enum_for', '$force_encoding', '$dup', '$coerce_to!', '$find', '$getbyte']);
  
  self.$require("corelib/string");
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Encoding');

    var $nesting = [self].concat($parent_nesting), $Encoding_register$1, $Encoding_find$3, $Encoding_initialize$4, $Encoding_ascii_compatible$ques$5, $Encoding_dummy$ques$6, $Encoding_to_s$7, $Encoding_inspect$8, $Encoding_each_byte$9, $Encoding_getbyte$10, $Encoding_bytesize$11;

    self.$$prototype.ascii = self.$$prototype.dummy = self.$$prototype.name = nil;
    
    Opal.defineProperty(self, '$$register', {});
    Opal.defs(self, '$register', $Encoding_register$1 = function $$register(name, options) {
      var $iter = $Encoding_register$1.$$p, block = $iter || nil, $a, $$2, self = this, names = nil, encoding = nil, register = nil;

      if ($iter) $Encoding_register$1.$$p = null;
      
      
      if ($iter) $Encoding_register$1.$$p = null;;
      
      if (options == null) {
        options = $hash2([], {});
      };
      names = $rb_plus([name], ($truthy($a = options['$[]']("aliases")) ? $a : []));
      encoding = $send($$($nesting, 'Class'), 'new', [self], block.$to_proc()).$new(name, names, ($truthy($a = options['$[]']("ascii")) ? $a : false), ($truthy($a = options['$[]']("dummy")) ? $a : false));
      register = self["$$register"];
      return $send(names, 'each', [], ($$2 = function(encoding_name){var self = $$2.$$s || this;

      
        
        if (encoding_name == null) {
          encoding_name = nil;
        };
        self.$const_set(encoding_name.$sub("-", "_"), encoding);
        return register["" + "$$" + (encoding_name)] = encoding;}, $$2.$$s = self, $$2.$$arity = 1, $$2));
    }, $Encoding_register$1.$$arity = -2);
    Opal.defs(self, '$find', $Encoding_find$3 = function $$find(name) {
      var $a, self = this, register = nil, encoding = nil;

      
      if (name['$==']("default_external")) {
        return self.$default_external()};
      register = self["$$register"];
      encoding = ($truthy($a = register["" + "$$" + (name)]) ? $a : register["" + "$$" + (name.$upcase())]);
      if ($truthy(encoding)) {
      } else {
        self.$raise($$($nesting, 'ArgumentError'), "" + "unknown encoding name - " + (name))
      };
      return encoding;
    }, $Encoding_find$3.$$arity = 1);
    (function(self, $parent_nesting) {
      var $nesting = [self].concat($parent_nesting);

      return self.$attr_accessor("default_external")
    })(Opal.get_singleton_class(self), $nesting);
    self.$attr_reader("name", "names");
    
    Opal.def(self, '$initialize', $Encoding_initialize$4 = function $$initialize(name, names, ascii, dummy) {
      var self = this;

      
      self.name = name;
      self.names = names;
      self.ascii = ascii;
      return (self.dummy = dummy);
    }, $Encoding_initialize$4.$$arity = 4);
    
    Opal.def(self, '$ascii_compatible?', $Encoding_ascii_compatible$ques$5 = function() {
      var self = this;

      return self.ascii
    }, $Encoding_ascii_compatible$ques$5.$$arity = 0);
    
    Opal.def(self, '$dummy?', $Encoding_dummy$ques$6 = function() {
      var self = this;

      return self.dummy
    }, $Encoding_dummy$ques$6.$$arity = 0);
    
    Opal.def(self, '$to_s', $Encoding_to_s$7 = function $$to_s() {
      var self = this;

      return self.name
    }, $Encoding_to_s$7.$$arity = 0);
    
    Opal.def(self, '$inspect', $Encoding_inspect$8 = function $$inspect() {
      var self = this;

      return "" + "#<Encoding:" + (self.name) + ((function() {if ($truthy(self.dummy)) {
        return " (dummy)"
      } else {
        return nil
      }; return nil; })()) + ">"
    }, $Encoding_inspect$8.$$arity = 0);
    
    Opal.def(self, '$each_byte', $Encoding_each_byte$9 = function $$each_byte($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return self.$raise($$($nesting, 'NotImplementedError'));
    }, $Encoding_each_byte$9.$$arity = -1);
    
    Opal.def(self, '$getbyte', $Encoding_getbyte$10 = function $$getbyte($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return self.$raise($$($nesting, 'NotImplementedError'));
    }, $Encoding_getbyte$10.$$arity = -1);
    
    Opal.def(self, '$bytesize', $Encoding_bytesize$11 = function $$bytesize($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return self.$raise($$($nesting, 'NotImplementedError'));
    }, $Encoding_bytesize$11.$$arity = -1);
    (function($base, $super, $parent_nesting) {
      var self = $klass($base, $super, 'EncodingError');

      var $nesting = [self].concat($parent_nesting);

      return nil
    })($nesting[0], $$($nesting, 'StandardError'), $nesting);
    return (function($base, $super, $parent_nesting) {
      var self = $klass($base, $super, 'CompatibilityError');

      var $nesting = [self].concat($parent_nesting);

      return nil
    })($nesting[0], $$($nesting, 'EncodingError'), $nesting);
  })($nesting[0], null, $nesting);
  $send($$($nesting, 'Encoding'), 'register', ["UTF-8", $hash2(["aliases", "ascii"], {"aliases": ["CP65001"], "ascii": true})], ($$12 = function(){var self = $$12.$$s || this, $each_byte$13, $bytesize$14;

  
    
    Opal.def(self, '$each_byte', $each_byte$13 = function $$each_byte(string) {
      var $iter = $each_byte$13.$$p, block = $iter || nil, self = this;

      if ($iter) $each_byte$13.$$p = null;
      
      
      if ($iter) $each_byte$13.$$p = null;;
      
      for (var i = 0, length = string.length; i < length; i++) {
        var code = string.charCodeAt(i);

        if (code <= 0x7f) {
          Opal.yield1(block, code);
        }
        else {
          var encoded = encodeURIComponent(string.charAt(i)).substr(1).split('%');

          for (var j = 0, encoded_length = encoded.length; j < encoded_length; j++) {
            Opal.yield1(block, parseInt(encoded[j], 16));
          }
        }
      }
    ;
    }, $each_byte$13.$$arity = 1);
    return (Opal.def(self, '$bytesize', $bytesize$14 = function $$bytesize(string) {
      var self = this;

      return string.$bytes().$length()
    }, $bytesize$14.$$arity = 1), nil) && 'bytesize';}, $$12.$$s = self, $$12.$$arity = 0, $$12));
  $send($$($nesting, 'Encoding'), 'register', ["UTF-16LE"], ($$15 = function(){var self = $$15.$$s || this, $each_byte$16, $bytesize$17;

  
    
    Opal.def(self, '$each_byte', $each_byte$16 = function $$each_byte(string) {
      var $iter = $each_byte$16.$$p, block = $iter || nil, self = this;

      if ($iter) $each_byte$16.$$p = null;
      
      
      if ($iter) $each_byte$16.$$p = null;;
      
      for (var i = 0, length = string.length; i < length; i++) {
        var code = string.charCodeAt(i);

        Opal.yield1(block, code & 0xff);
        Opal.yield1(block, code >> 8);
      }
    ;
    }, $each_byte$16.$$arity = 1);
    return (Opal.def(self, '$bytesize', $bytesize$17 = function $$bytesize(string) {
      var self = this;

      return string.$bytes().$length()
    }, $bytesize$17.$$arity = 1), nil) && 'bytesize';}, $$15.$$s = self, $$15.$$arity = 0, $$15));
  $send($$($nesting, 'Encoding'), 'register', ["UTF-16BE"], ($$18 = function(){var self = $$18.$$s || this, $each_byte$19, $bytesize$20;

  
    
    Opal.def(self, '$each_byte', $each_byte$19 = function $$each_byte(string) {
      var $iter = $each_byte$19.$$p, block = $iter || nil, self = this;

      if ($iter) $each_byte$19.$$p = null;
      
      
      if ($iter) $each_byte$19.$$p = null;;
      
      for (var i = 0, length = string.length; i < length; i++) {
        var code = string.charCodeAt(i);

        Opal.yield1(block, code >> 8);
        Opal.yield1(block, code & 0xff);
      }
    ;
    }, $each_byte$19.$$arity = 1);
    return (Opal.def(self, '$bytesize', $bytesize$20 = function $$bytesize(string) {
      var self = this;

      return string.$bytes().$length()
    }, $bytesize$20.$$arity = 1), nil) && 'bytesize';}, $$18.$$s = self, $$18.$$arity = 0, $$18));
  $send($$($nesting, 'Encoding'), 'register', ["UTF-32LE"], ($$21 = function(){var self = $$21.$$s || this, $each_byte$22, $bytesize$23;

  
    
    Opal.def(self, '$each_byte', $each_byte$22 = function $$each_byte(string) {
      var $iter = $each_byte$22.$$p, block = $iter || nil, self = this;

      if ($iter) $each_byte$22.$$p = null;
      
      
      if ($iter) $each_byte$22.$$p = null;;
      
      for (var i = 0, length = string.length; i < length; i++) {
        var code = string.charCodeAt(i);

        Opal.yield1(block, code & 0xff);
        Opal.yield1(block, code >> 8);
      }
    ;
    }, $each_byte$22.$$arity = 1);
    return (Opal.def(self, '$bytesize', $bytesize$23 = function $$bytesize(string) {
      var self = this;

      return string.$bytes().$length()
    }, $bytesize$23.$$arity = 1), nil) && 'bytesize';}, $$21.$$s = self, $$21.$$arity = 0, $$21));
  $send($$($nesting, 'Encoding'), 'register', ["ASCII-8BIT", $hash2(["aliases", "ascii", "dummy"], {"aliases": ["BINARY", "US-ASCII", "ASCII"], "ascii": true, "dummy": true})], ($$24 = function(){var self = $$24.$$s || this, $each_byte$25, $bytesize$26;

  
    
    Opal.def(self, '$each_byte', $each_byte$25 = function $$each_byte(string) {
      var $iter = $each_byte$25.$$p, block = $iter || nil, self = this;

      if ($iter) $each_byte$25.$$p = null;
      
      
      if ($iter) $each_byte$25.$$p = null;;
      
      for (var i = 0, length = string.length; i < length; i++) {
        var code = string.charCodeAt(i);
        Opal.yield1(block, code & 0xff);
        Opal.yield1(block, code >> 8);
      }
    ;
    }, $each_byte$25.$$arity = 1);
    return (Opal.def(self, '$bytesize', $bytesize$26 = function $$bytesize(string) {
      var self = this;

      return string.$bytes().$length()
    }, $bytesize$26.$$arity = 1), nil) && 'bytesize';}, $$24.$$s = self, $$24.$$arity = 0, $$24));
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'String');

    var $nesting = [self].concat($parent_nesting), $String_bytes$27, $String_bytesize$28, $String_each_byte$29, $String_encode$30, $String_force_encoding$31, $String_getbyte$32, $String_valid_encoding$ques$33;

    self.$$prototype.encoding = nil;
    
    self.$attr_reader("encoding");
    Opal.defineProperty(String.prototype, 'encoding', $$$($$($nesting, 'Encoding'), 'UTF_16LE'));
    
    Opal.def(self, '$bytes', $String_bytes$27 = function $$bytes() {
      var self = this;

      return self.$each_byte().$to_a()
    }, $String_bytes$27.$$arity = 0);
    
    Opal.def(self, '$bytesize', $String_bytesize$28 = function $$bytesize() {
      var self = this;

      return self.encoding.$bytesize(self)
    }, $String_bytesize$28.$$arity = 0);
    
    Opal.def(self, '$each_byte', $String_each_byte$29 = function $$each_byte() {
      var $iter = $String_each_byte$29.$$p, block = $iter || nil, self = this;

      if ($iter) $String_each_byte$29.$$p = null;
      
      
      if ($iter) $String_each_byte$29.$$p = null;;
      if ((block !== nil)) {
      } else {
        return self.$enum_for("each_byte")
      };
      $send(self.encoding, 'each_byte', [self], block.$to_proc());
      return self;
    }, $String_each_byte$29.$$arity = 0);
    
    Opal.def(self, '$encode', $String_encode$30 = function $$encode(encoding) {
      var self = this;

      return self.$dup().$force_encoding(encoding)
    }, $String_encode$30.$$arity = 1);
    
    Opal.def(self, '$force_encoding', $String_force_encoding$31 = function $$force_encoding(encoding) {
      var self = this;

      
      if (encoding === self.encoding) { return self; }

      encoding = $$($nesting, 'Opal')['$coerce_to!'](encoding, $$($nesting, 'String'), "to_s");
      encoding = $$($nesting, 'Encoding').$find(encoding);

      if (encoding === self.encoding) { return self; }

      self.encoding = encoding;
      return self;
    
    }, $String_force_encoding$31.$$arity = 1);
    
    Opal.def(self, '$getbyte', $String_getbyte$32 = function $$getbyte(idx) {
      var self = this;

      return self.encoding.$getbyte(self, idx)
    }, $String_getbyte$32.$$arity = 1);
    return (Opal.def(self, '$valid_encoding?', $String_valid_encoding$ques$33 = function() {
      var self = this;

      return true
    }, $String_valid_encoding$ques$33.$$arity = 0), nil) && 'valid_encoding?';
  })($nesting[0], null, $nesting);
};

/* Generated by Opal 0.11.99.dev */
Opal.modules["corelib/struct"] = function(Opal) {
  function $rb_gt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs > rhs : lhs['$>'](rhs);
  }
  function $rb_minus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs - rhs : lhs['$-'](rhs);
  }
  function $rb_lt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs < rhs : lhs['$<'](rhs);
  }
  function $rb_ge(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs >= rhs : lhs['$>='](rhs);
  }
  function $rb_plus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs + rhs : lhs['$+'](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice, $klass = Opal.klass, $hash2 = Opal.hash2, $truthy = Opal.truthy, $send = Opal.send;

  Opal.add_stubs(['$require', '$include', '$const_name!', '$unshift', '$map', '$coerce_to!', '$new', '$each', '$define_struct_attribute', '$allocate', '$initialize', '$alias_method', '$module_eval', '$to_proc', '$const_set', '$==', '$raise', '$<<', '$members', '$define_method', '$instance_eval', '$class', '$last', '$>', '$length', '$-', '$keys', '$any?', '$join', '$[]', '$[]=', '$each_with_index', '$hash', '$===', '$<', '$-@', '$size', '$>=', '$include?', '$to_sym', '$instance_of?', '$__id__', '$eql?', '$enum_for', '$name', '$+', '$each_pair', '$inspect', '$each_with_object', '$flatten', '$to_a', '$respond_to?', '$dig']);
  
  self.$require("corelib/enumerable");
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Struct');

    var $nesting = [self].concat($parent_nesting), $Struct_new$1, $Struct_define_struct_attribute$6, $Struct_members$9, $Struct_inherited$10, $Struct_initialize$12, $Struct_members$15, $Struct_hash$16, $Struct_$$$17, $Struct_$$$eq$18, $Struct_$eq_eq$19, $Struct_eql$ques$20, $Struct_each$21, $Struct_each_pair$24, $Struct_length$27, $Struct_to_a$28, $Struct_inspect$30, $Struct_to_h$32, $Struct_values_at$34, $Struct_dig$36;

    
    self.$include($$($nesting, 'Enumerable'));
    Opal.defs(self, '$new', $Struct_new$1 = function(const_name, $a, $b) {
      var $iter = $Struct_new$1.$$p, block = $iter || nil, $post_args, $kwargs, args, keyword_init, $$2, $$3, self = this, klass = nil;

      if ($iter) $Struct_new$1.$$p = null;
      
      
      if ($iter) $Struct_new$1.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 1, arguments.length);
      
      $kwargs = Opal.extract_kwargs($post_args);
      
      if ($kwargs == null) {
        $kwargs = $hash2([], {});
      } else if (!$kwargs.$$is_hash) {
        throw Opal.ArgumentError.$new('expected kwargs');
      };
      
      args = $post_args;;
      
      keyword_init = $kwargs.$$smap["keyword_init"];
      if (keyword_init == null) {
        keyword_init = false
      };
      if ($truthy(const_name)) {
        
        try {
          const_name = $$($nesting, 'Opal')['$const_name!'](const_name)
        } catch ($err) {
          if (Opal.rescue($err, [$$($nesting, 'TypeError'), $$($nesting, 'NameError')])) {
            try {
              
              args.$unshift(const_name);
              const_name = nil;
            } finally { Opal.pop_exception() }
          } else { throw $err; }
        };};
      $send(args, 'map', [], ($$2 = function(arg){var self = $$2.$$s || this;

      
        
        if (arg == null) {
          arg = nil;
        };
        return $$($nesting, 'Opal')['$coerce_to!'](arg, $$($nesting, 'String'), "to_str");}, $$2.$$s = self, $$2.$$arity = 1, $$2));
      klass = $send($$($nesting, 'Class'), 'new', [self], ($$3 = function(){var self = $$3.$$s || this, $$4;

      
        $send(args, 'each', [], ($$4 = function(arg){var self = $$4.$$s || this;

        
          
          if (arg == null) {
            arg = nil;
          };
          return self.$define_struct_attribute(arg);}, $$4.$$s = self, $$4.$$arity = 1, $$4));
        return (function(self, $parent_nesting) {
          var $nesting = [self].concat($parent_nesting), $new$5;

          
          
          Opal.def(self, '$new', $new$5 = function($a) {
            var $post_args, args, self = this, instance = nil;

            
            
            $post_args = Opal.slice.call(arguments, 0, arguments.length);
            
            args = $post_args;;
            instance = self.$allocate();
            instance.$$data = {};
            $send(instance, 'initialize', Opal.to_a(args));
            return instance;
          }, $new$5.$$arity = -1);
          return self.$alias_method("[]", "new");
        })(Opal.get_singleton_class(self), $nesting);}, $$3.$$s = self, $$3.$$arity = 0, $$3));
      if ($truthy(block)) {
        $send(klass, 'module_eval', [], block.$to_proc())};
      klass.$$keyword_init = keyword_init;
      if ($truthy(const_name)) {
        $$($nesting, 'Struct').$const_set(const_name, klass)};
      return klass;
    }, $Struct_new$1.$$arity = -2);
    Opal.defs(self, '$define_struct_attribute', $Struct_define_struct_attribute$6 = function $$define_struct_attribute(name) {
      var $$7, $$8, self = this;

      
      if (self['$==']($$($nesting, 'Struct'))) {
        self.$raise($$($nesting, 'ArgumentError'), "you cannot define attributes to the Struct class")};
      self.$members()['$<<'](name);
      $send(self, 'define_method', [name], ($$7 = function(){var self = $$7.$$s || this;

      return self.$$data[name];}, $$7.$$s = self, $$7.$$arity = 0, $$7));
      return $send(self, 'define_method', ["" + (name) + "="], ($$8 = function(value){var self = $$8.$$s || this;

      
        
        if (value == null) {
          value = nil;
        };
        return self.$$data[name] = value;;}, $$8.$$s = self, $$8.$$arity = 1, $$8));
    }, $Struct_define_struct_attribute$6.$$arity = 1);
    Opal.defs(self, '$members', $Struct_members$9 = function $$members() {
      var $a, self = this;
      if (self.members == null) self.members = nil;

      
      if (self['$==']($$($nesting, 'Struct'))) {
        self.$raise($$($nesting, 'ArgumentError'), "the Struct class has no members")};
      return (self.members = ($truthy($a = self.members) ? $a : []));
    }, $Struct_members$9.$$arity = 0);
    Opal.defs(self, '$inherited', $Struct_inherited$10 = function $$inherited(klass) {
      var $$11, self = this, members = nil;
      if (self.members == null) self.members = nil;

      
      members = self.members;
      return $send(klass, 'instance_eval', [], ($$11 = function(){var self = $$11.$$s || this;

      return (self.members = members)}, $$11.$$s = self, $$11.$$arity = 0, $$11));
    }, $Struct_inherited$10.$$arity = 1);
    
    Opal.def(self, '$initialize', $Struct_initialize$12 = function $$initialize($a) {
      var $post_args, args, $b, $$13, $$14, self = this, kwargs = nil, extra = nil;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      if ($truthy(self.$class().$$keyword_init)) {
        
        kwargs = ($truthy($b = args.$last()) ? $b : $hash2([], {}));
        if ($truthy(($truthy($b = $rb_gt(args.$length(), 1)) ? $b : (args.length === 1 && !kwargs.$$is_hash)))) {
          self.$raise($$($nesting, 'ArgumentError'), "" + "wrong number of arguments (given " + (args.$length()) + ", expected 0)")};
        extra = $rb_minus(kwargs.$keys(), self.$class().$members());
        if ($truthy(extra['$any?']())) {
          self.$raise($$($nesting, 'ArgumentError'), "" + "unknown keywords: " + (extra.$join(", ")))};
        return $send(self.$class().$members(), 'each', [], ($$13 = function(name){var self = $$13.$$s || this, $writer = nil;

        
          
          if (name == null) {
            name = nil;
          };
          $writer = [name, kwargs['$[]'](name)];
          $send(self, '[]=', Opal.to_a($writer));
          return $writer[$rb_minus($writer["length"], 1)];}, $$13.$$s = self, $$13.$$arity = 1, $$13));
      } else {
        
        if ($truthy($rb_gt(args.$length(), self.$class().$members().$length()))) {
          self.$raise($$($nesting, 'ArgumentError'), "struct size differs")};
        return $send(self.$class().$members(), 'each_with_index', [], ($$14 = function(name, index){var self = $$14.$$s || this, $writer = nil;

        
          
          if (name == null) {
            name = nil;
          };
          
          if (index == null) {
            index = nil;
          };
          $writer = [name, args['$[]'](index)];
          $send(self, '[]=', Opal.to_a($writer));
          return $writer[$rb_minus($writer["length"], 1)];}, $$14.$$s = self, $$14.$$arity = 2, $$14));
      };
    }, $Struct_initialize$12.$$arity = -1);
    
    Opal.def(self, '$members', $Struct_members$15 = function $$members() {
      var self = this;

      return self.$class().$members()
    }, $Struct_members$15.$$arity = 0);
    
    Opal.def(self, '$hash', $Struct_hash$16 = function $$hash() {
      var self = this;

      return $$($nesting, 'Hash').$new(self.$$data).$hash()
    }, $Struct_hash$16.$$arity = 0);
    
    Opal.def(self, '$[]', $Struct_$$$17 = function(name) {
      var self = this;

      
      if ($truthy($$($nesting, 'Integer')['$==='](name))) {
        
        if ($truthy($rb_lt(name, self.$class().$members().$size()['$-@']()))) {
          self.$raise($$($nesting, 'IndexError'), "" + "offset " + (name) + " too small for struct(size:" + (self.$class().$members().$size()) + ")")};
        if ($truthy($rb_ge(name, self.$class().$members().$size()))) {
          self.$raise($$($nesting, 'IndexError'), "" + "offset " + (name) + " too large for struct(size:" + (self.$class().$members().$size()) + ")")};
        name = self.$class().$members()['$[]'](name);
      } else if ($truthy($$($nesting, 'String')['$==='](name))) {
        
        if(!self.$$data.hasOwnProperty(name)) {
          self.$raise($$($nesting, 'NameError').$new("" + "no member '" + (name) + "' in struct", name))
        }
      
      } else {
        self.$raise($$($nesting, 'TypeError'), "" + "no implicit conversion of " + (name.$class()) + " into Integer")
      };
      name = $$($nesting, 'Opal')['$coerce_to!'](name, $$($nesting, 'String'), "to_str");
      return self.$$data[name];;
    }, $Struct_$$$17.$$arity = 1);
    
    Opal.def(self, '$[]=', $Struct_$$$eq$18 = function(name, value) {
      var self = this;

      
      if ($truthy($$($nesting, 'Integer')['$==='](name))) {
        
        if ($truthy($rb_lt(name, self.$class().$members().$size()['$-@']()))) {
          self.$raise($$($nesting, 'IndexError'), "" + "offset " + (name) + " too small for struct(size:" + (self.$class().$members().$size()) + ")")};
        if ($truthy($rb_ge(name, self.$class().$members().$size()))) {
          self.$raise($$($nesting, 'IndexError'), "" + "offset " + (name) + " too large for struct(size:" + (self.$class().$members().$size()) + ")")};
        name = self.$class().$members()['$[]'](name);
      } else if ($truthy($$($nesting, 'String')['$==='](name))) {
        if ($truthy(self.$class().$members()['$include?'](name.$to_sym()))) {
        } else {
          self.$raise($$($nesting, 'NameError').$new("" + "no member '" + (name) + "' in struct", name))
        }
      } else {
        self.$raise($$($nesting, 'TypeError'), "" + "no implicit conversion of " + (name.$class()) + " into Integer")
      };
      name = $$($nesting, 'Opal')['$coerce_to!'](name, $$($nesting, 'String'), "to_str");
      return self.$$data[name] = value;;
    }, $Struct_$$$eq$18.$$arity = 2);
    
    Opal.def(self, '$==', $Struct_$eq_eq$19 = function(other) {
      var self = this;

      
      if ($truthy(other['$instance_of?'](self.$class()))) {
      } else {
        return false
      };
      
      var recursed1 = {}, recursed2 = {};

      function _eqeq(struct, other) {
        var key, a, b;

        recursed1[(struct).$__id__()] = true;
        recursed2[(other).$__id__()] = true;

        for (key in struct.$$data) {
          a = struct.$$data[key];
          b = other.$$data[key];

          if ($$($nesting, 'Struct')['$==='](a)) {
            if (!recursed1.hasOwnProperty((a).$__id__()) || !recursed2.hasOwnProperty((b).$__id__())) {
              if (!_eqeq(a, b)) {
                return false;
              }
            }
          } else {
            if (!(a)['$=='](b)) {
              return false;
            }
          }
        }

        return true;
      }

      return _eqeq(self, other);
    ;
    }, $Struct_$eq_eq$19.$$arity = 1);
    
    Opal.def(self, '$eql?', $Struct_eql$ques$20 = function(other) {
      var self = this;

      
      if ($truthy(other['$instance_of?'](self.$class()))) {
      } else {
        return false
      };
      
      var recursed1 = {}, recursed2 = {};

      function _eqeq(struct, other) {
        var key, a, b;

        recursed1[(struct).$__id__()] = true;
        recursed2[(other).$__id__()] = true;

        for (key in struct.$$data) {
          a = struct.$$data[key];
          b = other.$$data[key];

          if ($$($nesting, 'Struct')['$==='](a)) {
            if (!recursed1.hasOwnProperty((a).$__id__()) || !recursed2.hasOwnProperty((b).$__id__())) {
              if (!_eqeq(a, b)) {
                return false;
              }
            }
          } else {
            if (!(a)['$eql?'](b)) {
              return false;
            }
          }
        }

        return true;
      }

      return _eqeq(self, other);
    ;
    }, $Struct_eql$ques$20.$$arity = 1);
    
    Opal.def(self, '$each', $Struct_each$21 = function $$each() {
      var $$22, $$23, $iter = $Struct_each$21.$$p, $yield = $iter || nil, self = this;

      if ($iter) $Struct_each$21.$$p = null;
      
      if (($yield !== nil)) {
      } else {
        return $send(self, 'enum_for', ["each"], ($$22 = function(){var self = $$22.$$s || this;

        return self.$size()}, $$22.$$s = self, $$22.$$arity = 0, $$22))
      };
      $send(self.$class().$members(), 'each', [], ($$23 = function(name){var self = $$23.$$s || this;

      
        
        if (name == null) {
          name = nil;
        };
        return Opal.yield1($yield, self['$[]'](name));;}, $$23.$$s = self, $$23.$$arity = 1, $$23));
      return self;
    }, $Struct_each$21.$$arity = 0);
    
    Opal.def(self, '$each_pair', $Struct_each_pair$24 = function $$each_pair() {
      var $$25, $$26, $iter = $Struct_each_pair$24.$$p, $yield = $iter || nil, self = this;

      if ($iter) $Struct_each_pair$24.$$p = null;
      
      if (($yield !== nil)) {
      } else {
        return $send(self, 'enum_for', ["each_pair"], ($$25 = function(){var self = $$25.$$s || this;

        return self.$size()}, $$25.$$s = self, $$25.$$arity = 0, $$25))
      };
      $send(self.$class().$members(), 'each', [], ($$26 = function(name){var self = $$26.$$s || this;

      
        
        if (name == null) {
          name = nil;
        };
        return Opal.yield1($yield, [name, self['$[]'](name)]);;}, $$26.$$s = self, $$26.$$arity = 1, $$26));
      return self;
    }, $Struct_each_pair$24.$$arity = 0);
    
    Opal.def(self, '$length', $Struct_length$27 = function $$length() {
      var self = this;

      return self.$class().$members().$length()
    }, $Struct_length$27.$$arity = 0);
    Opal.alias(self, "size", "length");
    
    Opal.def(self, '$to_a', $Struct_to_a$28 = function $$to_a() {
      var $$29, self = this;

      return $send(self.$class().$members(), 'map', [], ($$29 = function(name){var self = $$29.$$s || this;

      
        
        if (name == null) {
          name = nil;
        };
        return self['$[]'](name);}, $$29.$$s = self, $$29.$$arity = 1, $$29))
    }, $Struct_to_a$28.$$arity = 0);
    Opal.alias(self, "values", "to_a");
    
    Opal.def(self, '$inspect', $Struct_inspect$30 = function $$inspect() {
      var $a, $$31, self = this, result = nil;

      
      result = "#<struct ";
      if ($truthy(($truthy($a = $$($nesting, 'Struct')['$==='](self)) ? self.$class().$name() : $a))) {
        result = $rb_plus(result, "" + (self.$class()) + " ")};
      result = $rb_plus(result, $send(self.$each_pair(), 'map', [], ($$31 = function(name, value){var self = $$31.$$s || this;

      
        
        if (name == null) {
          name = nil;
        };
        
        if (value == null) {
          value = nil;
        };
        return "" + (name) + "=" + (value.$inspect());}, $$31.$$s = self, $$31.$$arity = 2, $$31)).$join(", "));
      result = $rb_plus(result, ">");
      return result;
    }, $Struct_inspect$30.$$arity = 0);
    Opal.alias(self, "to_s", "inspect");
    
    Opal.def(self, '$to_h', $Struct_to_h$32 = function $$to_h() {
      var $$33, self = this;

      return $send(self.$class().$members(), 'each_with_object', [$hash2([], {})], ($$33 = function(name, h){var self = $$33.$$s || this, $writer = nil;

      
        
        if (name == null) {
          name = nil;
        };
        
        if (h == null) {
          h = nil;
        };
        $writer = [name, self['$[]'](name)];
        $send(h, '[]=', Opal.to_a($writer));
        return $writer[$rb_minus($writer["length"], 1)];}, $$33.$$s = self, $$33.$$arity = 2, $$33))
    }, $Struct_to_h$32.$$arity = 0);
    
    Opal.def(self, '$values_at', $Struct_values_at$34 = function $$values_at($a) {
      var $post_args, args, $$35, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      args = $send(args, 'map', [], ($$35 = function(arg){var self = $$35.$$s || this;

      
        
        if (arg == null) {
          arg = nil;
        };
        return arg.$$is_range ? arg.$to_a() : arg;}, $$35.$$s = self, $$35.$$arity = 1, $$35)).$flatten();
      
      var result = [];
      for (var i = 0, len = args.length; i < len; i++) {
        if (!args[i].$$is_number) {
          self.$raise($$($nesting, 'TypeError'), "" + "no implicit conversion of " + ((args[i]).$class()) + " into Integer")
        }
        result.push(self['$[]'](args[i]));
      }
      return result;
    ;
    }, $Struct_values_at$34.$$arity = -1);
    return (Opal.def(self, '$dig', $Struct_dig$36 = function $$dig(key, $a) {
      var $post_args, keys, self = this, item = nil;

      
      
      $post_args = Opal.slice.call(arguments, 1, arguments.length);
      
      keys = $post_args;;
      item = (function() {if ($truthy(key.$$is_string && self.$$data.hasOwnProperty(key))) {
        return self.$$data[key] || nil;
      } else {
        return nil
      }; return nil; })();
      
      if (item === nil || keys.length === 0) {
        return item;
      }
    ;
      if ($truthy(item['$respond_to?']("dig"))) {
      } else {
        self.$raise($$($nesting, 'TypeError'), "" + (item.$class()) + " does not have #dig method")
      };
      return $send(item, 'dig', Opal.to_a(keys));
    }, $Struct_dig$36.$$arity = -2), nil) && 'dig';
  })($nesting[0], null, $nesting);
};

/* Generated by Opal 0.11.99.dev */
Opal.modules["corelib/io"] = function(Opal) {
  function $rb_minus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs - rhs : lhs['$-'](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice, $klass = Opal.klass, $module = Opal.module, $send = Opal.send, $gvars = Opal.gvars, $truthy = Opal.truthy, $writer = nil;

  Opal.add_stubs(['$attr_accessor', '$size', '$write', '$join', '$map', '$String', '$empty?', '$concat', '$chomp', '$getbyte', '$getc', '$raise', '$new', '$write_proc=', '$-', '$extend']);
  
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'IO');

    var $nesting = [self].concat($parent_nesting), $IO_tty$ques$1, $IO_closed$ques$2, $IO_write$3, $IO_flush$4;

    self.$$prototype.tty = self.$$prototype.closed = nil;
    
    Opal.const_set($nesting[0], 'SEEK_SET', 0);
    Opal.const_set($nesting[0], 'SEEK_CUR', 1);
    Opal.const_set($nesting[0], 'SEEK_END', 2);
    
    Opal.def(self, '$tty?', $IO_tty$ques$1 = function() {
      var self = this;

      return self.tty
    }, $IO_tty$ques$1.$$arity = 0);
    
    Opal.def(self, '$closed?', $IO_closed$ques$2 = function() {
      var self = this;

      return self.closed
    }, $IO_closed$ques$2.$$arity = 0);
    self.$attr_accessor("write_proc");
    
    Opal.def(self, '$write', $IO_write$3 = function $$write(string) {
      var self = this;

      
      self.write_proc(string);
      return string.$size();
    }, $IO_write$3.$$arity = 1);
    self.$attr_accessor("sync", "tty");
    
    Opal.def(self, '$flush', $IO_flush$4 = function $$flush() {
      var self = this;

      return nil
    }, $IO_flush$4.$$arity = 0);
    (function($base, $parent_nesting) {
      var self = $module($base, 'Writable');

      var $nesting = [self].concat($parent_nesting), $Writable_$lt$lt$5, $Writable_print$6, $Writable_puts$8;

      
      
      Opal.def(self, '$<<', $Writable_$lt$lt$5 = function(string) {
        var self = this;

        
        self.$write(string);
        return self;
      }, $Writable_$lt$lt$5.$$arity = 1);
      
      Opal.def(self, '$print', $Writable_print$6 = function $$print($a) {
        var $post_args, args, $$7, self = this;
        if ($gvars[","] == null) $gvars[","] = nil;

        
        
        $post_args = Opal.slice.call(arguments, 0, arguments.length);
        
        args = $post_args;;
        self.$write($send(args, 'map', [], ($$7 = function(arg){var self = $$7.$$s || this;

        
          
          if (arg == null) {
            arg = nil;
          };
          return self.$String(arg);}, $$7.$$s = self, $$7.$$arity = 1, $$7)).$join($gvars[","]));
        return nil;
      }, $Writable_print$6.$$arity = -1);
      
      Opal.def(self, '$puts', $Writable_puts$8 = function $$puts($a) {
        var $post_args, args, $$9, self = this, newline = nil;
        if ($gvars["/"] == null) $gvars["/"] = nil;

        
        
        $post_args = Opal.slice.call(arguments, 0, arguments.length);
        
        args = $post_args;;
        newline = $gvars["/"];
        if ($truthy(args['$empty?']())) {
          self.$write($gvars["/"])
        } else {
          self.$write($send(args, 'map', [], ($$9 = function(arg){var self = $$9.$$s || this;

          
            
            if (arg == null) {
              arg = nil;
            };
            return self.$String(arg).$chomp();}, $$9.$$s = self, $$9.$$arity = 1, $$9)).$concat([nil]).$join(newline))
        };
        return nil;
      }, $Writable_puts$8.$$arity = -1);
    })($nesting[0], $nesting);
    return (function($base, $parent_nesting) {
      var self = $module($base, 'Readable');

      var $nesting = [self].concat($parent_nesting), $Readable_readbyte$10, $Readable_readchar$11, $Readable_readline$12, $Readable_readpartial$13;

      
      
      Opal.def(self, '$readbyte', $Readable_readbyte$10 = function $$readbyte() {
        var self = this;

        return self.$getbyte()
      }, $Readable_readbyte$10.$$arity = 0);
      
      Opal.def(self, '$readchar', $Readable_readchar$11 = function $$readchar() {
        var self = this;

        return self.$getc()
      }, $Readable_readchar$11.$$arity = 0);
      
      Opal.def(self, '$readline', $Readable_readline$12 = function $$readline(sep) {
        var self = this;
        if ($gvars["/"] == null) $gvars["/"] = nil;

        
        
        if (sep == null) {
          sep = $gvars["/"];
        };
        return self.$raise($$($nesting, 'NotImplementedError'));
      }, $Readable_readline$12.$$arity = -1);
      
      Opal.def(self, '$readpartial', $Readable_readpartial$13 = function $$readpartial(integer, outbuf) {
        var self = this;

        
        
        if (outbuf == null) {
          outbuf = nil;
        };
        return self.$raise($$($nesting, 'NotImplementedError'));
      }, $Readable_readpartial$13.$$arity = -2);
    })($nesting[0], $nesting);
  })($nesting[0], null, $nesting);
  Opal.const_set($nesting[0], 'STDERR', ($gvars.stderr = $$($nesting, 'IO').$new()));
  Opal.const_set($nesting[0], 'STDIN', ($gvars.stdin = $$($nesting, 'IO').$new()));
  Opal.const_set($nesting[0], 'STDOUT', ($gvars.stdout = $$($nesting, 'IO').$new()));
  var console = Opal.global.console;
  
  $writer = [typeof(process) === 'object' && typeof(process.stdout) === 'object' ? function(s){process.stdout.write(s)} : function(s){console.log(s)}];
  $send($$($nesting, 'STDOUT'), 'write_proc=', Opal.to_a($writer));
  $writer[$rb_minus($writer["length"], 1)];;
  
  $writer = [typeof(process) === 'object' && typeof(process.stderr) === 'object' ? function(s){process.stderr.write(s)} : function(s){console.warn(s)}];
  $send($$($nesting, 'STDERR'), 'write_proc=', Opal.to_a($writer));
  $writer[$rb_minus($writer["length"], 1)];;
  $$($nesting, 'STDOUT').$extend($$$($$($nesting, 'IO'), 'Writable'));
  return $$($nesting, 'STDERR').$extend($$$($$($nesting, 'IO'), 'Writable'));
};

/* Generated by Opal 0.11.99.dev */
Opal.modules["corelib/main"] = function(Opal) {
  var $to_s$1, $include$2, self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice;

  Opal.add_stubs(['$include']);
  
  Opal.defs(self, '$to_s', $to_s$1 = function $$to_s() {
    var self = this;

    return "main"
  }, $to_s$1.$$arity = 0);
  return (Opal.defs(self, '$include', $include$2 = function $$include(mod) {
    var self = this;

    return $$($nesting, 'Object').$include(mod)
  }, $include$2.$$arity = 1), nil) && 'include';
};

/* Generated by Opal 0.11.99.dev */
Opal.modules["corelib/dir"] = function(Opal) {
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice, $klass = Opal.klass, $truthy = Opal.truthy;

  Opal.add_stubs(['$[]']);
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Dir');

    var $nesting = [self].concat($parent_nesting);

    return (function(self, $parent_nesting) {
      var $nesting = [self].concat($parent_nesting), $chdir$1, $pwd$2, $home$3;

      
      
      Opal.def(self, '$chdir', $chdir$1 = function $$chdir(dir) {
        var $iter = $chdir$1.$$p, $yield = $iter || nil, self = this, prev_cwd = nil;

        if ($iter) $chdir$1.$$p = null;
        return (function() { try {
        
        prev_cwd = Opal.current_dir;
        Opal.current_dir = dir;
        return Opal.yieldX($yield, []);;
        } finally {
          Opal.current_dir = prev_cwd
        }; })()
      }, $chdir$1.$$arity = 1);
      
      Opal.def(self, '$pwd', $pwd$2 = function $$pwd() {
        var self = this;

        return Opal.current_dir || '.';
      }, $pwd$2.$$arity = 0);
      Opal.alias(self, "getwd", "pwd");
      return (Opal.def(self, '$home', $home$3 = function $$home() {
        var $a, self = this;

        return ($truthy($a = $$($nesting, 'ENV')['$[]']("HOME")) ? $a : ".")
      }, $home$3.$$arity = 0), nil) && 'home';
    })(Opal.get_singleton_class(self), $nesting)
  })($nesting[0], null, $nesting)
};

/* Generated by Opal 0.11.99.dev */
Opal.modules["corelib/file"] = function(Opal) {
  function $rb_plus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs + rhs : lhs['$+'](rhs);
  }
  function $rb_minus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs - rhs : lhs['$-'](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice, $klass = Opal.klass, $truthy = Opal.truthy, $range = Opal.range, $send = Opal.send;

  Opal.add_stubs(['$respond_to?', '$to_path', '$pwd', '$split', '$sub', '$+', '$unshift', '$join', '$home', '$raise', '$start_with?', '$absolute_path', '$coerce_to!', '$basename', '$empty?', '$rindex', '$[]', '$nil?', '$==', '$-', '$length', '$gsub', '$find', '$=~', '$map', '$each_with_index', '$flatten', '$reject', '$to_proc', '$end_with?']);
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'File');

    var $nesting = [self].concat($parent_nesting), windows_root_rx = nil;

    
    Opal.const_set($nesting[0], 'Separator', Opal.const_set($nesting[0], 'SEPARATOR', "/"));
    Opal.const_set($nesting[0], 'ALT_SEPARATOR', nil);
    Opal.const_set($nesting[0], 'PATH_SEPARATOR', ":");
    Opal.const_set($nesting[0], 'FNM_SYSCASE', 0);
    windows_root_rx = /^[a-zA-Z]:(?:\\|\/)/;
    return (function(self, $parent_nesting) {
      var $nesting = [self].concat($parent_nesting), $absolute_path$1, $expand_path$2, $dirname$3, $basename$4, $extname$5, $exist$ques$6, $directory$ques$7, $join$9, $split$12;

      
      
      Opal.def(self, '$absolute_path', $absolute_path$1 = function $$absolute_path(path, basedir) {
        var $a, self = this, sep = nil, sep_chars = nil, new_parts = nil, path_abs = nil, basedir_abs = nil, parts = nil, leading_sep = nil, abs = nil, new_path = nil;

        
        
        if (basedir == null) {
          basedir = nil;
        };
        sep = $$($nesting, 'SEPARATOR');
        sep_chars = $sep_chars();
        new_parts = [];
        path = (function() {if ($truthy(path['$respond_to?']("to_path"))) {
          return path.$to_path()
        } else {
          return path
        }; return nil; })();
        basedir = ($truthy($a = basedir) ? $a : $$($nesting, 'Dir').$pwd());
        path_abs = path.substr(0, sep.length) === sep || windows_root_rx.test(path);
        basedir_abs = basedir.substr(0, sep.length) === sep || windows_root_rx.test(basedir);
        if ($truthy(path_abs)) {
          
          parts = path.$split(new RegExp("" + "[" + (sep_chars) + "]"));
          leading_sep = windows_root_rx.test(path) ? '' : path.$sub(new RegExp("" + "^([" + (sep_chars) + "]+).*$"), "\\1");
          abs = true;
        } else {
          
          parts = $rb_plus(basedir.$split(new RegExp("" + "[" + (sep_chars) + "]")), path.$split(new RegExp("" + "[" + (sep_chars) + "]")));
          leading_sep = windows_root_rx.test(basedir) ? '' : basedir.$sub(new RegExp("" + "^([" + (sep_chars) + "]+).*$"), "\\1");
          abs = basedir_abs;
        };
        
        var part;
        for (var i = 0, ii = parts.length; i < ii; i++) {
          part = parts[i];

          if (
            (part === nil) ||
            (part === ''  && ((new_parts.length === 0) || abs)) ||
            (part === '.' && ((new_parts.length === 0) || abs))
          ) {
            continue;
          }
          if (part === '..') {
            new_parts.pop();
          } else {
            new_parts.push(part);
          }
        }

        if (!abs && parts[0] !== '.') {
          new_parts.$unshift(".")
        }
      ;
        new_path = new_parts.$join(sep);
        if ($truthy(abs)) {
          new_path = $rb_plus(leading_sep, new_path)};
        return new_path;
      }, $absolute_path$1.$$arity = -2);
      
      Opal.def(self, '$expand_path', $expand_path$2 = function $$expand_path(path, basedir) {
        var self = this, sep = nil, sep_chars = nil, home = nil, leading_sep = nil, home_path_regexp = nil;

        
        
        if (basedir == null) {
          basedir = nil;
        };
        sep = $$($nesting, 'SEPARATOR');
        sep_chars = $sep_chars();
        if ($truthy(path[0] === '~' || (basedir && basedir[0] === '~'))) {
          
          home = $$($nesting, 'Dir').$home();
          if ($truthy(home)) {
          } else {
            self.$raise($$($nesting, 'ArgumentError'), "couldn't find HOME environment -- expanding `~'")
          };
          leading_sep = windows_root_rx.test(home) ? '' : home.$sub(new RegExp("" + "^([" + (sep_chars) + "]+).*$"), "\\1");
          if ($truthy(home['$start_with?'](leading_sep))) {
          } else {
            self.$raise($$($nesting, 'ArgumentError'), "non-absolute home")
          };
          home = $rb_plus(home, sep);
          home_path_regexp = new RegExp("" + "^\\~(?:" + (sep) + "|$)");
          path = path.$sub(home_path_regexp, home);
          if ($truthy(basedir)) {
            basedir = basedir.$sub(home_path_regexp, home)};};
        return self.$absolute_path(path, basedir);
      }, $expand_path$2.$$arity = -2);
      Opal.alias(self, "realpath", "expand_path");
      
      // Coerce a given path to a path string using #to_path and #to_str
      function $coerce_to_path(path) {
        if ($truthy((path)['$respond_to?']("to_path"))) {
          path = path.$to_path();
        }

        path = $$($nesting, 'Opal')['$coerce_to!'](path, $$($nesting, 'String'), "to_str");

        return path;
      }

      // Return a RegExp compatible char class
      function $sep_chars() {
        if ($$($nesting, 'ALT_SEPARATOR') === nil) {
          return Opal.escape_regexp($$($nesting, 'SEPARATOR'));
        } else {
          return Opal.escape_regexp($rb_plus($$($nesting, 'SEPARATOR'), $$($nesting, 'ALT_SEPARATOR')));
        }
      }
    ;
      
      Opal.def(self, '$dirname', $dirname$3 = function $$dirname(path) {
        var self = this, sep_chars = nil;

        
        sep_chars = $sep_chars();
        path = $coerce_to_path(path);
        
        var absolute = path.match(new RegExp("" + "^[" + (sep_chars) + "]"));

        path = path.replace(new RegExp("" + "[" + (sep_chars) + "]+$"), ''); // remove trailing separators
        path = path.replace(new RegExp("" + "[^" + (sep_chars) + "]+$"), ''); // remove trailing basename
        path = path.replace(new RegExp("" + "[" + (sep_chars) + "]+$"), ''); // remove final trailing separators

        if (path === '') {
          return absolute ? '/' : '.';
        }

        return path;
      ;
      }, $dirname$3.$$arity = 1);
      
      Opal.def(self, '$basename', $basename$4 = function $$basename(name, suffix) {
        var self = this, sep_chars = nil;

        
        
        if (suffix == null) {
          suffix = nil;
        };
        sep_chars = $sep_chars();
        name = $coerce_to_path(name);
        
        if (name.length == 0) {
          return name;
        }

        if (suffix !== nil) {
          suffix = $$($nesting, 'Opal')['$coerce_to!'](suffix, $$($nesting, 'String'), "to_str")
        } else {
          suffix = null;
        }

        name = name.replace(new RegExp("" + "(.)[" + (sep_chars) + "]*$"), '$1');
        name = name.replace(new RegExp("" + "^(?:.*[" + (sep_chars) + "])?([^" + (sep_chars) + "]+)$"), '$1');

        if (suffix === ".*") {
          name = name.replace(/\.[^\.]+$/, '');
        } else if(suffix !== null) {
          suffix = Opal.escape_regexp(suffix);
          name = name.replace(new RegExp("" + (suffix) + "$"), '');
        }

        return name;
      ;
      }, $basename$4.$$arity = -2);
      
      Opal.def(self, '$extname', $extname$5 = function $$extname(path) {
        var $a, self = this, filename = nil, last_dot_idx = nil;

        
        path = $coerce_to_path(path);
        filename = self.$basename(path);
        if ($truthy(filename['$empty?']())) {
          return ""};
        last_dot_idx = filename['$[]']($range(1, -1, false)).$rindex(".");
        if ($truthy(($truthy($a = last_dot_idx['$nil?']()) ? $a : $rb_plus(last_dot_idx, 1)['$==']($rb_minus(filename.$length(), 1))))) {
          return ""
        } else {
          return filename['$[]'](Opal.Range.$new($rb_plus(last_dot_idx, 1), -1, false))
        };
      }, $extname$5.$$arity = 1);
      
      Opal.def(self, '$exist?', $exist$ques$6 = function(path) {
        var self = this;

        return Opal.modules[path] != null
      }, $exist$ques$6.$$arity = 1);
      Opal.alias(self, "exists?", "exist?");
      
      Opal.def(self, '$directory?', $directory$ques$7 = function(path) {
        var $$8, self = this, files = nil, file = nil;

        
        files = [];
        
        for (var key in Opal.modules) {
          files.push(key)
        }
      ;
        path = path.$gsub(new RegExp("" + "(^." + ($$($nesting, 'SEPARATOR')) + "+|" + ($$($nesting, 'SEPARATOR')) + "+$)"));
        file = $send(files, 'find', [], ($$8 = function(f){var self = $$8.$$s || this;

        
          
          if (f == null) {
            f = nil;
          };
          return f['$=~'](new RegExp("" + "^" + (path)));}, $$8.$$s = self, $$8.$$arity = 1, $$8));
        return file;
      }, $directory$ques$7.$$arity = 1);
      
      Opal.def(self, '$join', $join$9 = function $$join($a) {
        var $post_args, paths, $$10, $$11, self = this, result = nil;

        
        
        $post_args = Opal.slice.call(arguments, 0, arguments.length);
        
        paths = $post_args;;
        if ($truthy(paths['$empty?']())) {
          return ""};
        result = "";
        paths = $send(paths.$flatten().$each_with_index(), 'map', [], ($$10 = function(item, index){var self = $$10.$$s || this, $b;

        
          
          if (item == null) {
            item = nil;
          };
          
          if (index == null) {
            index = nil;
          };
          if ($truthy((($b = index['$=='](0)) ? item['$empty?']() : index['$=='](0)))) {
            return $$($nesting, 'SEPARATOR')
          } else if ($truthy((($b = paths.$length()['$==']($rb_plus(index, 1))) ? item['$empty?']() : paths.$length()['$==']($rb_plus(index, 1))))) {
            return $$($nesting, 'SEPARATOR')
          } else {
            return item
          };}, $$10.$$s = self, $$10.$$arity = 2, $$10));
        paths = $send(paths, 'reject', [], "empty?".$to_proc());
        $send(paths, 'each_with_index', [], ($$11 = function(item, index){var self = $$11.$$s || this, $b, next_item = nil;

        
          
          if (item == null) {
            item = nil;
          };
          
          if (index == null) {
            index = nil;
          };
          next_item = paths['$[]']($rb_plus(index, 1));
          if ($truthy(next_item['$nil?']())) {
            return (result = "" + (result) + (item))
          } else {
            
            if ($truthy(($truthy($b = item['$end_with?']($$($nesting, 'SEPARATOR'))) ? next_item['$start_with?']($$($nesting, 'SEPARATOR')) : $b))) {
              item = item.$sub(new RegExp("" + ($$($nesting, 'SEPARATOR')) + "+$"), "")};
            return (result = (function() {if ($truthy(($truthy($b = item['$end_with?']($$($nesting, 'SEPARATOR'))) ? $b : next_item['$start_with?']($$($nesting, 'SEPARATOR'))))) {
              return "" + (result) + (item)
            } else {
              return "" + (result) + (item) + ($$($nesting, 'SEPARATOR'))
            }; return nil; })());
          };}, $$11.$$s = self, $$11.$$arity = 2, $$11));
        return result;
      }, $join$9.$$arity = -1);
      return (Opal.def(self, '$split', $split$12 = function $$split(path) {
        var self = this;

        return path.$split($$($nesting, 'SEPARATOR'))
      }, $split$12.$$arity = 1), nil) && 'split';
    })(Opal.get_singleton_class(self), $nesting);
  })($nesting[0], $$($nesting, 'IO'), $nesting)
};

/* Generated by Opal 0.11.99.dev */
Opal.modules["corelib/process"] = function(Opal) {
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice, $klass = Opal.klass, $truthy = Opal.truthy;

  Opal.add_stubs(['$const_set', '$size', '$<<', '$__register_clock__', '$to_f', '$now', '$new', '$[]', '$raise']);
  
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Process');

    var $nesting = [self].concat($parent_nesting), $Process___register_clock__$1, $Process_pid$2, $Process_times$3, $Process_clock_gettime$4, monotonic = nil;

    
    self.__clocks__ = [];
    Opal.defs(self, '$__register_clock__', $Process___register_clock__$1 = function $$__register_clock__(name, func) {
      var self = this;
      if (self.__clocks__ == null) self.__clocks__ = nil;

      
      self.$const_set(name, self.__clocks__.$size());
      return self.__clocks__['$<<'](func);
    }, $Process___register_clock__$1.$$arity = 2);
    self.$__register_clock__("CLOCK_REALTIME", function() { return Date.now() });
    monotonic = false;
    
    if (Opal.global.performance) {
      monotonic = function() {
        return performance.now()
      };
    }
    else if (Opal.global.process && process.hrtime) {
      // let now be the base to get smaller numbers
      var hrtime_base = process.hrtime();

      monotonic = function() {
        var hrtime = process.hrtime(hrtime_base);
        var us = (hrtime[1] / 1000) | 0; // cut below microsecs;
        return ((hrtime[0] * 1000) + (us / 1000));
      };
    }
  ;
    if ($truthy(monotonic)) {
      self.$__register_clock__("CLOCK_MONOTONIC", monotonic)};
    Opal.defs(self, '$pid', $Process_pid$2 = function $$pid() {
      var self = this;

      return 0
    }, $Process_pid$2.$$arity = 0);
    Opal.defs(self, '$times', $Process_times$3 = function $$times() {
      var self = this, t = nil;

      
      t = $$($nesting, 'Time').$now().$to_f();
      return $$$($$($nesting, 'Benchmark'), 'Tms').$new(t, t, t, t, t);
    }, $Process_times$3.$$arity = 0);
    return (Opal.defs(self, '$clock_gettime', $Process_clock_gettime$4 = function $$clock_gettime(clock_id, unit) {
      var $a, self = this, clock = nil;
      if (self.__clocks__ == null) self.__clocks__ = nil;

      
      
      if (unit == null) {
        unit = "float_second";
      };
      ($truthy($a = (clock = self.__clocks__['$[]'](clock_id))) ? $a : self.$raise($$$($$($nesting, 'Errno'), 'EINVAL'), "" + "clock_gettime(" + (clock_id) + ") " + (self.__clocks__['$[]'](clock_id))));
      
      var ms = clock();
      switch (unit) {
        case 'float_second':      return  (ms / 1000);         // number of seconds as a float (default)
        case 'float_millisecond': return  (ms / 1);            // number of milliseconds as a float
        case 'float_microsecond': return  (ms * 1000);         // number of microseconds as a float
        case 'second':            return ((ms / 1000)    | 0); // number of seconds as an integer
        case 'millisecond':       return ((ms / 1)       | 0); // number of milliseconds as an integer
        case 'microsecond':       return ((ms * 1000)    | 0); // number of microseconds as an integer
        case 'nanosecond':        return ((ms * 1000000) | 0); // number of nanoseconds as an integer
        default: self.$raise($$($nesting, 'ArgumentError'), "" + "unexpected unit: " + (unit))
      }
    ;
    }, $Process_clock_gettime$4.$$arity = -2), nil) && 'clock_gettime';
  })($nesting[0], null, $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Signal');

    var $nesting = [self].concat($parent_nesting), $Signal_trap$5;

    return (Opal.defs(self, '$trap', $Signal_trap$5 = function $$trap($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return nil;
    }, $Signal_trap$5.$$arity = -1), nil) && 'trap'
  })($nesting[0], null, $nesting);
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'GC');

    var $nesting = [self].concat($parent_nesting), $GC_start$6;

    return (Opal.defs(self, '$start', $GC_start$6 = function $$start() {
      var self = this;

      return nil
    }, $GC_start$6.$$arity = 0), nil) && 'start'
  })($nesting[0], null, $nesting);
};

/* Generated by Opal 0.11.99.dev */
Opal.modules["corelib/unsupported"] = function(Opal) {
  var $public$35, $private$36, self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice, $klass = Opal.klass, $module = Opal.module;

  Opal.add_stubs(['$raise', '$warn', '$%']);
  
  
  var warnings = {};

  function handle_unsupported_feature(message) {
    switch (Opal.config.unsupported_features_severity) {
    case 'error':
      $$($nesting, 'Kernel').$raise($$($nesting, 'NotImplementedError'), message)
      break;
    case 'warning':
      warn(message)
      break;
    default: // ignore
      // noop
    }
  }

  function warn(string) {
    if (warnings[string]) {
      return;
    }

    warnings[string] = true;
    self.$warn(string);
  }
;
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'String');

    var $nesting = [self].concat($parent_nesting), $String_$lt$lt$1, $String_capitalize$excl$2, $String_chomp$excl$3, $String_chop$excl$4, $String_downcase$excl$5, $String_gsub$excl$6, $String_lstrip$excl$7, $String_next$excl$8, $String_reverse$excl$9, $String_slice$excl$10, $String_squeeze$excl$11, $String_strip$excl$12, $String_sub$excl$13, $String_succ$excl$14, $String_swapcase$excl$15, $String_tr$excl$16, $String_tr_s$excl$17, $String_upcase$excl$18, $String_prepend$19, $String_$$$eq$20, $String_clear$21, $String_encode$excl$22, $String_unicode_normalize$excl$23;

    
    var ERROR = "String#%s not supported. Mutable String methods are not supported in Opal.";
    
    Opal.def(self, '$<<', $String_$lt$lt$1 = function($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("<<"));
    }, $String_$lt$lt$1.$$arity = -1);
    
    Opal.def(self, '$capitalize!', $String_capitalize$excl$2 = function($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("capitalize!"));
    }, $String_capitalize$excl$2.$$arity = -1);
    
    Opal.def(self, '$chomp!', $String_chomp$excl$3 = function($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("chomp!"));
    }, $String_chomp$excl$3.$$arity = -1);
    
    Opal.def(self, '$chop!', $String_chop$excl$4 = function($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("chop!"));
    }, $String_chop$excl$4.$$arity = -1);
    
    Opal.def(self, '$downcase!', $String_downcase$excl$5 = function($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("downcase!"));
    }, $String_downcase$excl$5.$$arity = -1);
    
    Opal.def(self, '$gsub!', $String_gsub$excl$6 = function($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("gsub!"));
    }, $String_gsub$excl$6.$$arity = -1);
    
    Opal.def(self, '$lstrip!', $String_lstrip$excl$7 = function($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("lstrip!"));
    }, $String_lstrip$excl$7.$$arity = -1);
    
    Opal.def(self, '$next!', $String_next$excl$8 = function($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("next!"));
    }, $String_next$excl$8.$$arity = -1);
    
    Opal.def(self, '$reverse!', $String_reverse$excl$9 = function($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("reverse!"));
    }, $String_reverse$excl$9.$$arity = -1);
    
    Opal.def(self, '$slice!', $String_slice$excl$10 = function($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("slice!"));
    }, $String_slice$excl$10.$$arity = -1);
    
    Opal.def(self, '$squeeze!', $String_squeeze$excl$11 = function($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("squeeze!"));
    }, $String_squeeze$excl$11.$$arity = -1);
    
    Opal.def(self, '$strip!', $String_strip$excl$12 = function($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("strip!"));
    }, $String_strip$excl$12.$$arity = -1);
    
    Opal.def(self, '$sub!', $String_sub$excl$13 = function($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("sub!"));
    }, $String_sub$excl$13.$$arity = -1);
    
    Opal.def(self, '$succ!', $String_succ$excl$14 = function($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("succ!"));
    }, $String_succ$excl$14.$$arity = -1);
    
    Opal.def(self, '$swapcase!', $String_swapcase$excl$15 = function($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("swapcase!"));
    }, $String_swapcase$excl$15.$$arity = -1);
    
    Opal.def(self, '$tr!', $String_tr$excl$16 = function($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("tr!"));
    }, $String_tr$excl$16.$$arity = -1);
    
    Opal.def(self, '$tr_s!', $String_tr_s$excl$17 = function($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("tr_s!"));
    }, $String_tr_s$excl$17.$$arity = -1);
    
    Opal.def(self, '$upcase!', $String_upcase$excl$18 = function($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("upcase!"));
    }, $String_upcase$excl$18.$$arity = -1);
    
    Opal.def(self, '$prepend', $String_prepend$19 = function $$prepend($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("prepend"));
    }, $String_prepend$19.$$arity = -1);
    
    Opal.def(self, '$[]=', $String_$$$eq$20 = function($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("[]="));
    }, $String_$$$eq$20.$$arity = -1);
    
    Opal.def(self, '$clear', $String_clear$21 = function $$clear($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("clear"));
    }, $String_clear$21.$$arity = -1);
    
    Opal.def(self, '$encode!', $String_encode$excl$22 = function($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("encode!"));
    }, $String_encode$excl$22.$$arity = -1);
    return (Opal.def(self, '$unicode_normalize!', $String_unicode_normalize$excl$23 = function($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("unicode_normalize!"));
    }, $String_unicode_normalize$excl$23.$$arity = -1), nil) && 'unicode_normalize!';
  })($nesting[0], null, $nesting);
  (function($base, $parent_nesting) {
    var self = $module($base, 'Kernel');

    var $nesting = [self].concat($parent_nesting), $Kernel_freeze$24, $Kernel_frozen$ques$25;

    
    var ERROR = "Object freezing is not supported by Opal";
    
    Opal.def(self, '$freeze', $Kernel_freeze$24 = function $$freeze() {
      var self = this;

      
      handle_unsupported_feature(ERROR);
      return self;
    }, $Kernel_freeze$24.$$arity = 0);
    
    Opal.def(self, '$frozen?', $Kernel_frozen$ques$25 = function() {
      var self = this;

      
      handle_unsupported_feature(ERROR);
      return false;
    }, $Kernel_frozen$ques$25.$$arity = 0);
  })($nesting[0], $nesting);
  (function($base, $parent_nesting) {
    var self = $module($base, 'Kernel');

    var $nesting = [self].concat($parent_nesting), $Kernel_taint$26, $Kernel_untaint$27, $Kernel_tainted$ques$28;

    
    var ERROR = "Object tainting is not supported by Opal";
    
    Opal.def(self, '$taint', $Kernel_taint$26 = function $$taint() {
      var self = this;

      
      handle_unsupported_feature(ERROR);
      return self;
    }, $Kernel_taint$26.$$arity = 0);
    
    Opal.def(self, '$untaint', $Kernel_untaint$27 = function $$untaint() {
      var self = this;

      
      handle_unsupported_feature(ERROR);
      return self;
    }, $Kernel_untaint$27.$$arity = 0);
    
    Opal.def(self, '$tainted?', $Kernel_tainted$ques$28 = function() {
      var self = this;

      
      handle_unsupported_feature(ERROR);
      return false;
    }, $Kernel_tainted$ques$28.$$arity = 0);
  })($nesting[0], $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Module');

    var $nesting = [self].concat($parent_nesting), $Module_public$29, $Module_private_class_method$30, $Module_private_method_defined$ques$31, $Module_private_constant$32;

    
    
    Opal.def(self, '$public', $Module_public$29 = function($a) {
      var $post_args, methods, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      methods = $post_args;;
      
      if (methods.length === 0) {
        self.$$module_function = false;
      }

      return nil;
    ;
    }, $Module_public$29.$$arity = -1);
    Opal.alias(self, "private", "public");
    Opal.alias(self, "protected", "public");
    Opal.alias(self, "nesting", "public");
    
    Opal.def(self, '$private_class_method', $Module_private_class_method$30 = function $$private_class_method($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return self;
    }, $Module_private_class_method$30.$$arity = -1);
    Opal.alias(self, "public_class_method", "private_class_method");
    
    Opal.def(self, '$private_method_defined?', $Module_private_method_defined$ques$31 = function(obj) {
      var self = this;

      return false
    }, $Module_private_method_defined$ques$31.$$arity = 1);
    
    Opal.def(self, '$private_constant', $Module_private_constant$32 = function $$private_constant($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return nil;
    }, $Module_private_constant$32.$$arity = -1);
    Opal.alias(self, "protected_method_defined?", "private_method_defined?");
    Opal.alias(self, "public_instance_methods", "instance_methods");
    Opal.alias(self, "public_instance_method", "instance_method");
    return Opal.alias(self, "public_method_defined?", "method_defined?");
  })($nesting[0], null, $nesting);
  (function($base, $parent_nesting) {
    var self = $module($base, 'Kernel');

    var $nesting = [self].concat($parent_nesting), $Kernel_private_methods$33;

    
    
    Opal.def(self, '$private_methods', $Kernel_private_methods$33 = function $$private_methods($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return [];
    }, $Kernel_private_methods$33.$$arity = -1);
    Opal.alias(self, "private_instance_methods", "private_methods");
  })($nesting[0], $nesting);
  (function($base, $parent_nesting) {
    var self = $module($base, 'Kernel');

    var $nesting = [self].concat($parent_nesting), $Kernel_eval$34;

    
    Opal.def(self, '$eval', $Kernel_eval$34 = function($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return self.$raise($$($nesting, 'NotImplementedError'), "" + "To use Kernel#eval, you must first require 'opal-parser'. " + ("" + "See https://github.com/opal/opal/blob/" + ($$($nesting, 'RUBY_ENGINE_VERSION')) + "/docs/opal_parser.md for details."));
    }, $Kernel_eval$34.$$arity = -1)
  })($nesting[0], $nesting);
  Opal.defs(self, '$public', $public$35 = function($a) {
    var $post_args, self = this;

    
    
    $post_args = Opal.slice.call(arguments, 0, arguments.length);
    ;
    return nil;
  }, $public$35.$$arity = -1);
  return (Opal.defs(self, '$private', $private$36 = function($a) {
    var $post_args, self = this;

    
    
    $post_args = Opal.slice.call(arguments, 0, arguments.length);
    ;
    return nil;
  }, $private$36.$$arity = -1), nil) && 'private';
};

/* Generated by Opal 0.11.99.dev */
(function(Opal) {
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice;

  Opal.add_stubs(['$require']);
  
  self.$require("opal/base");
  self.$require("opal/mini");
  self.$require("corelib/string/encoding");
  self.$require("corelib/struct");
  self.$require("corelib/io");
  self.$require("corelib/main");
  self.$require("corelib/dir");
  self.$require("corelib/file");
  self.$require("corelib/process");
  return self.$require("corelib/unsupported");
})(Opal);
