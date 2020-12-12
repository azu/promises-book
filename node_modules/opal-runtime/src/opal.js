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
  Opal.allocate_class = function(name, superclass, constructor) {
    var klass = constructor;

    if (superclass != null && superclass.$$bridge) {
      // Inheritance from bridged classes requires
      // calling original JS constructors
      klass = function SubclassOfNativeClass() {
        var args = $slice.call(arguments),
            self = new ($bind.apply(superclass, [null].concat(args)))();

        // and replacing a __proto__ manually
        $setPrototype(self, klass.prototype);
        return self;
      }
    }

    $defineProperty(klass, '$$name', name);
    $defineProperty(klass, '$$const', {});
    $defineProperty(klass, '$$is_class', true);
    $defineProperty(klass, '$$is_a_module', true);
    $defineProperty(klass, '$$super', superclass);
    $defineProperty(klass, '$$cvars', {});
    $defineProperty(klass, '$$own_included_modules', []);
    $defineProperty(klass, '$$own_prepended_modules', []);
    $defineProperty(klass, '$$ancestors', []);
    $defineProperty(klass, '$$ancestors_cache_version', null);

    $defineProperty(klass.prototype, '$$class', klass);

    // By default if there are no singleton class methods
    // __proto__ is Class.prototype
    // Later singleton methods generate a singleton_class
    // and inject it into ancestors chain
    if (Opal.Class) {
      $setPrototype(klass, Opal.Class.prototype);
    }

    if (superclass != null) {
      $setPrototype(klass.prototype, superclass.prototype);

      if (superclass !== Opal.Module && superclass.$$meta) {
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

  Opal.klass = function(scope, superclass, name, constructor) {
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

    // Class doesnt exist, create a new one with given superclass...

    // Not specifying a superclass means we can assume it to be Object
    if (superclass == null) {
      superclass = _Object;
    }

    if (bridged) {
      Opal.bridge(bridged);
      klass = bridged;
      Opal.const_set(scope, name, klass);
    } else {
      // Create the class object (instance of Class)
      klass = Opal.allocate_class(name, superclass, constructor);
      Opal.const_set(scope, name, klass);
      // Call .inherited() hook with new class on the superclass
      if (superclass.$inherited) {
        superclass.$inherited(klass);
      }
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
  Opal.allocate_module = function(name, constructor) {
    var module = constructor;

    $defineProperty(module, '$$name', name);
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

  Opal.module = function(scope, name, constructor) {
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
    module = Opal.allocate_module(name, constructor);
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
    $setPrototype(klass, meta.prototype);
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
    $setPrototype(mod, meta.prototype);
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

    delete klass.prototype.$$class;

    $defineProperty(object, '$$meta', klass);

    $setPrototype(object, object.$$meta.prototype);

    return klass;
  };

  Opal.is_method = function(prop) {
    return (prop[0] === '$' && prop[1] !== '$');
  }

  Opal.instance_methods = function(mod) {
    var exclude = [], results = [], ancestors = Opal.ancestors(mod);

    for (var i = 0, l = ancestors.length; i < l; i++) {
      var ancestor = ancestors[i],
          proto = ancestor.prototype;

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
        proto = mod.prototype;

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
    var result = [], mod, proto = Object.getPrototypeOf(module.prototype);

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
    var result = [], mod, proto = Object.getPrototypeOf(module.prototype);

    if (module.prototype.hasOwnProperty('$$dummy')) {
      while (proto) {
        if (proto === module.prototype.$$define_methods_on) {
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
      start_chain_after = includer.prototype;
      end_chain_on = Object.getPrototypeOf(includer.prototype);
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

      var proto = includer.prototype, parent = proto, module_iclass = Object.getPrototypeOf(parent);

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
        dummy_prepender = prepender.prototype,
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
    var proto = module.prototype,
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
        proto = module.prototype;

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
  // target for th new class. Note: all bridged classes are set to inherit
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
  Opal.bridge = function(constructor, klass) {
    if (constructor.hasOwnProperty('$$bridge')) {
      throw Opal.ArgumentError.$new("already bridged");
    }

    var klass_to_inject, klass_reference;

    if (klass == null) {
      klass_to_inject = Opal.Object;
      klass_reference = constructor;
    } else {
      klass_to_inject = klass;
      klass_reference = klass;
    }

    // constructor is a JS function with a prototype chain like:
    // - constructor
    //   - super
    //
    // What we need to do is to inject our class (with its prototype chain)
    // between constructor and super. For example, after injecting Ruby Object into JS Error we get:
    // - constructor
    //   - Opal.Object
    //     - Opal.Kernel
    //       - Opal.BasicObject
    //         - super
    //

    $setPrototype(constructor.prototype, klass_to_inject.prototype);
    $defineProperty(constructor.prototype, '$$class', klass_reference);
    $defineProperty(constructor, '$$bridge', true);
    $defineProperty(constructor, '$$is_class', true);
    $defineProperty(constructor, '$$is_a_module', true);
    $defineProperty(constructor, '$$super', klass_to_inject);
    $defineProperty(constructor, '$$const', {});
    $defineProperty(constructor, '$$own_included_modules', []);
    $defineProperty(constructor, '$$own_prepended_modules', []);
    $defineProperty(constructor, '$$ancestors', []);
    $defineProperty(constructor, '$$ancestors_cache_version', null);
    $setPrototype(constructor, Opal.Class.prototype);
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
    var result = [], mod = null, proto = Object.getPrototypeOf(module.prototype);

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
    var proto = Opal.BasicObject.prototype;

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
          proto = ancestor.prototype;

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
      Array.prototype.splice.call(parameters, parameters.length - 1, 1);
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
    body.$$owner = module;

    var proto = module.prototype;
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
      // That's simply impossible
      return;
    }
    Opal.defn(Opal.get_singleton_class(obj), jsid, body)
  };

  // Called from #remove_method.
  Opal.rdef = function(obj, jsid) {
    if (!$hasOwn.call(obj.prototype, jsid)) {
      throw Opal.NameError.$new("method '" + jsid.substr(1) + "' not defined in " + obj.$name());
    }

    delete obj.prototype[jsid];

    if (obj.$$is_singleton) {
      if (obj.prototype.$singleton_method_removed && !obj.prototype.$singleton_method_removed.$$stub) {
        obj.prototype.$singleton_method_removed(jsid.substr(1));
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
    if (!obj.prototype[jsid] || obj.prototype[jsid].$$stub) {
      throw Opal.NameError.$new("method '" + jsid.substr(1) + "' not defined in " + obj.$name());
    }

    Opal.add_stub_for(obj.prototype, jsid);

    if (obj.$$is_singleton) {
      if (obj.prototype.$singleton_method_undefined && !obj.prototype.$singleton_method_undefined.$$stub) {
        obj.prototype.$singleton_method_undefined(jsid.substr(1));
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
        body   = obj.prototype['$' + old],
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
        body = Opal.Object.prototype[old_id]
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
        body = obj.prototype[native_name];

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

  $setPrototype(Opal.BasicObject, Opal.Class.prototype);
  $setPrototype(Opal.Object, Opal.Class.prototype);
  $setPrototype(Opal.Module, Opal.Class.prototype);
  $setPrototype(Opal.Class, Opal.Class.prototype);

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
  $defineProperty(_Object.prototype, 'toString', function() {
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
  $defineProperty(_Object.prototype, '$require', Opal.require);

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
    function $Opal() {};
    var self = $Opal = $module($base, 'Opal', $Opal);

    var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_Opal_bridge_1, TMP_Opal_type_error_2, TMP_Opal_coerce_to_3, TMP_Opal_coerce_to$B_4, TMP_Opal_coerce_to$q_5, TMP_Opal_try_convert_6, TMP_Opal_compare_7, TMP_Opal_destructure_8, TMP_Opal_respond_to$q_9, TMP_Opal_inspect_obj_10, TMP_Opal_instance_variable_name$B_11, TMP_Opal_class_variable_name$B_12, TMP_Opal_const_name$B_13, TMP_Opal_pristine_14;

    
    Opal.defs(self, '$bridge', TMP_Opal_bridge_1 = function $$bridge(constructor, klass) {
      var self = this;

      return Opal.bridge(constructor, klass);
    }, TMP_Opal_bridge_1.$$arity = 2);
    Opal.defs(self, '$type_error', TMP_Opal_type_error_2 = function $$type_error(object, type, method, coerced) {
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
    }, TMP_Opal_type_error_2.$$arity = -3);
    Opal.defs(self, '$coerce_to', TMP_Opal_coerce_to_3 = function $$coerce_to(object, type, method) {
      var self = this;

      
      if ($truthy(type['$==='](object))) {
        return object};
      if ($truthy(object['$respond_to?'](method))) {
      } else {
        self.$raise(self.$type_error(object, type))
      };
      return object.$__send__(method);
    }, TMP_Opal_coerce_to_3.$$arity = 3);
    Opal.defs(self, '$coerce_to!', TMP_Opal_coerce_to$B_4 = function(object, type, method) {
      var self = this, coerced = nil;

      
      coerced = self.$coerce_to(object, type, method);
      if ($truthy(type['$==='](coerced))) {
      } else {
        self.$raise(self.$type_error(object, type, method, coerced))
      };
      return coerced;
    }, TMP_Opal_coerce_to$B_4.$$arity = 3);
    Opal.defs(self, '$coerce_to?', TMP_Opal_coerce_to$q_5 = function(object, type, method) {
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
    }, TMP_Opal_coerce_to$q_5.$$arity = 3);
    Opal.defs(self, '$try_convert', TMP_Opal_try_convert_6 = function $$try_convert(object, type, method) {
      var self = this;

      
      if ($truthy(type['$==='](object))) {
        return object};
      if ($truthy(object['$respond_to?'](method))) {
        return object.$__send__(method)
      } else {
        return nil
      };
    }, TMP_Opal_try_convert_6.$$arity = 3);
    Opal.defs(self, '$compare', TMP_Opal_compare_7 = function $$compare(a, b) {
      var self = this, compare = nil;

      
      compare = a['$<=>'](b);
      if ($truthy(compare === nil)) {
        self.$raise($$($nesting, 'ArgumentError'), "" + "comparison of " + (a.$class()) + " with " + (b.$class()) + " failed")};
      return compare;
    }, TMP_Opal_compare_7.$$arity = 2);
    Opal.defs(self, '$destructure', TMP_Opal_destructure_8 = function $$destructure(args) {
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
    
    }, TMP_Opal_destructure_8.$$arity = 1);
    Opal.defs(self, '$respond_to?', TMP_Opal_respond_to$q_9 = function(obj, method, include_all) {
      var self = this;

      
      
      if (include_all == null) {
        include_all = false;
      };
      
      if (obj == null || !obj.$$class) {
        return false;
      }
    ;
      return obj['$respond_to?'](method, include_all);
    }, TMP_Opal_respond_to$q_9.$$arity = -3);
    Opal.defs(self, '$inspect_obj', TMP_Opal_inspect_obj_10 = function $$inspect_obj(obj) {
      var self = this;

      return Opal.inspect(obj);
    }, TMP_Opal_inspect_obj_10.$$arity = 1);
    Opal.defs(self, '$instance_variable_name!', TMP_Opal_instance_variable_name$B_11 = function(name) {
      var self = this;

      
      name = $$($nesting, 'Opal')['$coerce_to!'](name, $$($nesting, 'String'), "to_str");
      if ($truthy(/^@[a-zA-Z_][a-zA-Z0-9_]*?$/.test(name))) {
      } else {
        self.$raise($$($nesting, 'NameError').$new("" + "'" + (name) + "' is not allowed as an instance variable name", name))
      };
      return name;
    }, TMP_Opal_instance_variable_name$B_11.$$arity = 1);
    Opal.defs(self, '$class_variable_name!', TMP_Opal_class_variable_name$B_12 = function(name) {
      var self = this;

      
      name = $$($nesting, 'Opal')['$coerce_to!'](name, $$($nesting, 'String'), "to_str");
      if ($truthy(name.length < 3 || name.slice(0,2) !== '@@')) {
        self.$raise($$($nesting, 'NameError').$new("" + "`" + (name) + "' is not allowed as a class variable name", name))};
      return name;
    }, TMP_Opal_class_variable_name$B_12.$$arity = 1);
    Opal.defs(self, '$const_name!', TMP_Opal_const_name$B_13 = function(const_name) {
      var self = this;

      
      const_name = $$($nesting, 'Opal')['$coerce_to!'](const_name, $$($nesting, 'String'), "to_str");
      if ($truthy(const_name['$[]'](0)['$!='](const_name['$[]'](0).$upcase()))) {
        self.$raise($$($nesting, 'NameError'), "" + "wrong constant name " + (const_name))};
      return const_name;
    }, TMP_Opal_const_name$B_13.$$arity = 1);
    Opal.defs(self, '$pristine', TMP_Opal_pristine_14 = function $$pristine(owner_class, $a) {
      var $post_args, method_names, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 1, arguments.length);
      
      method_names = $post_args;;
      
      var method_name, method;
      for (var i = method_names.length - 1; i >= 0; i--) {
        method_name = method_names[i];
        method = owner_class.prototype['$'+method_name];

        if (method && !method.$$stub) {
          method.$$pristine = true;
        }
      }
    ;
      return nil;
    }, TMP_Opal_pristine_14.$$arity = -2);
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
    function $Module(){};
    var self = $Module = $klass($base, $super, 'Module', $Module);

    var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_Module_allocate_1, TMP_Module_inherited_2, TMP_Module_initialize_3, TMP_Module_$eq$eq$eq_4, TMP_Module_$lt_5, TMP_Module_$lt$eq_6, TMP_Module_$gt_7, TMP_Module_$gt$eq_8, TMP_Module_$lt$eq$gt_9, TMP_Module_alias_method_10, TMP_Module_alias_native_11, TMP_Module_ancestors_12, TMP_Module_append_features_13, TMP_Module_attr_accessor_14, TMP_Module_attr_reader_15, TMP_Module_attr_writer_16, TMP_Module_autoload_17, TMP_Module_class_variables_18, TMP_Module_class_variable_get_19, TMP_Module_class_variable_set_20, TMP_Module_class_variable_defined$q_21, TMP_Module_remove_class_variable_22, TMP_Module_constants_23, TMP_Module_constants_24, TMP_Module_nesting_25, TMP_Module_const_defined$q_26, TMP_Module_const_get_27, TMP_Module_const_missing_29, TMP_Module_const_set_30, TMP_Module_public_constant_31, TMP_Module_define_method_32, TMP_Module_remove_method_34, TMP_Module_singleton_class$q_35, TMP_Module_include_36, TMP_Module_included_modules_37, TMP_Module_include$q_38, TMP_Module_instance_method_39, TMP_Module_instance_methods_40, TMP_Module_included_41, TMP_Module_extended_42, TMP_Module_extend_object_43, TMP_Module_method_added_44, TMP_Module_method_removed_45, TMP_Module_method_undefined_46, TMP_Module_module_eval_47, TMP_Module_module_exec_49, TMP_Module_method_defined$q_50, TMP_Module_module_function_51, TMP_Module_name_52, TMP_Module_prepend_53, TMP_Module_prepend_features_54, TMP_Module_prepended_55, TMP_Module_remove_const_56, TMP_Module_to_s_57, TMP_Module_undef_method_58, TMP_Module_instance_variables_59, TMP_Module_dup_60, TMP_Module_copy_class_variables_61, TMP_Module_copy_constants_62;

    
    Opal.defs(self, '$allocate', TMP_Module_allocate_1 = function $$allocate() {
      var self = this;

      
      var module = Opal.allocate_module(nil, function(){});
      return module;
    
    }, TMP_Module_allocate_1.$$arity = 0);
    Opal.defs(self, '$inherited', TMP_Module_inherited_2 = function $$inherited(klass) {
      var self = this;

      
      klass.$allocate = function() {
        var module = Opal.allocate_module(nil, function(){});
        Object.setPrototypeOf(module, klass.prototype);
        return module;
      }
    
    }, TMP_Module_inherited_2.$$arity = 1);
    
    Opal.def(self, '$initialize', TMP_Module_initialize_3 = function $$initialize() {
      var $iter = TMP_Module_initialize_3.$$p, block = $iter || nil, self = this;

      if ($iter) TMP_Module_initialize_3.$$p = null;
      
      
      if ($iter) TMP_Module_initialize_3.$$p = null;;
      if ((block !== nil)) {
        return $send(self, 'module_eval', [], block.$to_proc())
      } else {
        return nil
      };
    }, TMP_Module_initialize_3.$$arity = 0);
    
    Opal.def(self, '$===', TMP_Module_$eq$eq$eq_4 = function(object) {
      var self = this;

      
      if ($truthy(object == null)) {
        return false};
      return Opal.is_a(object, self);;
    }, TMP_Module_$eq$eq$eq_4.$$arity = 1);
    
    Opal.def(self, '$<', TMP_Module_$lt_5 = function(other) {
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
    }, TMP_Module_$lt_5.$$arity = 1);
    
    Opal.def(self, '$<=', TMP_Module_$lt$eq_6 = function(other) {
      var $a, self = this;

      return ($truthy($a = self['$equal?'](other)) ? $a : $rb_lt(self, other))
    }, TMP_Module_$lt$eq_6.$$arity = 1);
    
    Opal.def(self, '$>', TMP_Module_$gt_7 = function(other) {
      var self = this;

      
      if ($truthy($$($nesting, 'Module')['$==='](other))) {
      } else {
        self.$raise($$($nesting, 'TypeError'), "compared with non class/module")
      };
      return $rb_lt(other, self);
    }, TMP_Module_$gt_7.$$arity = 1);
    
    Opal.def(self, '$>=', TMP_Module_$gt$eq_8 = function(other) {
      var $a, self = this;

      return ($truthy($a = self['$equal?'](other)) ? $a : $rb_gt(self, other))
    }, TMP_Module_$gt$eq_8.$$arity = 1);
    
    Opal.def(self, '$<=>', TMP_Module_$lt$eq$gt_9 = function(other) {
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
    }, TMP_Module_$lt$eq$gt_9.$$arity = 1);
    
    Opal.def(self, '$alias_method', TMP_Module_alias_method_10 = function $$alias_method(newname, oldname) {
      var self = this;

      
      Opal.alias(self, newname, oldname);
      return self;
    }, TMP_Module_alias_method_10.$$arity = 2);
    
    Opal.def(self, '$alias_native', TMP_Module_alias_native_11 = function $$alias_native(mid, jsid) {
      var self = this;

      
      
      if (jsid == null) {
        jsid = mid;
      };
      Opal.alias_native(self, mid, jsid);
      return self;
    }, TMP_Module_alias_native_11.$$arity = -2);
    
    Opal.def(self, '$ancestors', TMP_Module_ancestors_12 = function $$ancestors() {
      var self = this;

      return Opal.ancestors(self);
    }, TMP_Module_ancestors_12.$$arity = 0);
    
    Opal.def(self, '$append_features', TMP_Module_append_features_13 = function $$append_features(includer) {
      var self = this;

      
      Opal.append_features(self, includer);
      return self;
    }, TMP_Module_append_features_13.$$arity = 1);
    
    Opal.def(self, '$attr_accessor', TMP_Module_attr_accessor_14 = function $$attr_accessor($a) {
      var $post_args, names, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      names = $post_args;;
      $send(self, 'attr_reader', Opal.to_a(names));
      return $send(self, 'attr_writer', Opal.to_a(names));
    }, TMP_Module_attr_accessor_14.$$arity = -1);
    Opal.alias(self, "attr", "attr_accessor");
    
    Opal.def(self, '$attr_reader', TMP_Module_attr_reader_15 = function $$attr_reader($a) {
      var $post_args, names, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      names = $post_args;;
      
      var proto = self.prototype;

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
    }, TMP_Module_attr_reader_15.$$arity = -1);
    
    Opal.def(self, '$attr_writer', TMP_Module_attr_writer_16 = function $$attr_writer($a) {
      var $post_args, names, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      names = $post_args;;
      
      var proto = self.prototype;

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
    }, TMP_Module_attr_writer_16.$$arity = -1);
    
    Opal.def(self, '$autoload', TMP_Module_autoload_17 = function $$autoload(const$, path) {
      var self = this;

      
      if (self.$$autoload == null) self.$$autoload = {};
      Opal.const_cache_version++;
      self.$$autoload[const$] = path;
      return nil;
    
    }, TMP_Module_autoload_17.$$arity = 2);
    
    Opal.def(self, '$class_variables', TMP_Module_class_variables_18 = function $$class_variables() {
      var self = this;

      return Object.keys(Opal.class_variables(self));
    }, TMP_Module_class_variables_18.$$arity = 0);
    
    Opal.def(self, '$class_variable_get', TMP_Module_class_variable_get_19 = function $$class_variable_get(name) {
      var self = this;

      
      name = $$($nesting, 'Opal')['$class_variable_name!'](name);
      
      var value = Opal.class_variables(self)[name];
      if (value == null) {
        self.$raise($$($nesting, 'NameError').$new("" + "uninitialized class variable " + (name) + " in " + (self), name))
      }
      return value;
    ;
    }, TMP_Module_class_variable_get_19.$$arity = 1);
    
    Opal.def(self, '$class_variable_set', TMP_Module_class_variable_set_20 = function $$class_variable_set(name, value) {
      var self = this;

      
      name = $$($nesting, 'Opal')['$class_variable_name!'](name);
      return Opal.class_variable_set(self, name, value);;
    }, TMP_Module_class_variable_set_20.$$arity = 2);
    
    Opal.def(self, '$class_variable_defined?', TMP_Module_class_variable_defined$q_21 = function(name) {
      var self = this;

      
      name = $$($nesting, 'Opal')['$class_variable_name!'](name);
      return Opal.class_variables(self).hasOwnProperty(name);;
    }, TMP_Module_class_variable_defined$q_21.$$arity = 1);
    
    Opal.def(self, '$remove_class_variable', TMP_Module_remove_class_variable_22 = function $$remove_class_variable(name) {
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
    }, TMP_Module_remove_class_variable_22.$$arity = 1);
    
    Opal.def(self, '$constants', TMP_Module_constants_23 = function $$constants(inherit) {
      var self = this;

      
      
      if (inherit == null) {
        inherit = true;
      };
      return Opal.constants(self, inherit);;
    }, TMP_Module_constants_23.$$arity = -1);
    Opal.defs(self, '$constants', TMP_Module_constants_24 = function $$constants(inherit) {
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
    }, TMP_Module_constants_24.$$arity = -1);
    Opal.defs(self, '$nesting', TMP_Module_nesting_25 = function $$nesting() {
      var self = this;

      return self.$$nesting || [];
    }, TMP_Module_nesting_25.$$arity = 0);
    
    Opal.def(self, '$const_defined?', TMP_Module_const_defined$q_26 = function(name, inherit) {
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
    }, TMP_Module_const_defined$q_26.$$arity = -2);
    
    Opal.def(self, '$const_get', TMP_Module_const_get_27 = function $$const_get(name, inherit) {
      var TMP_28, self = this;

      
      
      if (inherit == null) {
        inherit = true;
      };
      name = $$($nesting, 'Opal')['$const_name!'](name);
      
      if (name.indexOf('::') === 0 && name !== '::'){
        name = name.slice(2);
      }
    ;
      if ($truthy(name.indexOf('::') != -1 && name != '::')) {
        return $send(name.$split("::"), 'inject', [self], (TMP_28 = function(o, c){var self = TMP_28.$$s || this;

        
          
          if (o == null) {
            o = nil;
          };
          
          if (c == null) {
            c = nil;
          };
          return o.$const_get(c);}, TMP_28.$$s = self, TMP_28.$$arity = 2, TMP_28))};
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
    }, TMP_Module_const_get_27.$$arity = -2);
    
    Opal.def(self, '$const_missing', TMP_Module_const_missing_29 = function $$const_missing(name) {
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
    }, TMP_Module_const_missing_29.$$arity = 1);
    
    Opal.def(self, '$const_set', TMP_Module_const_set_30 = function $$const_set(name, value) {
      var $a, self = this;

      
      name = $$($nesting, 'Opal')['$const_name!'](name);
      if ($truthy(($truthy($a = name['$!~']($$$($$($nesting, 'Opal'), 'CONST_NAME_REGEXP'))) ? $a : name['$start_with?']("::")))) {
        self.$raise($$($nesting, 'NameError').$new("" + "wrong constant name " + (name), name))};
      Opal.const_set(self, name, value);
      return value;
    }, TMP_Module_const_set_30.$$arity = 2);
    
    Opal.def(self, '$public_constant', TMP_Module_public_constant_31 = function $$public_constant(const_name) {
      var self = this;

      return nil
    }, TMP_Module_public_constant_31.$$arity = 1);
    
    Opal.def(self, '$define_method', TMP_Module_define_method_32 = function $$define_method(name, method) {
      var $iter = TMP_Module_define_method_32.$$p, block = $iter || nil, $a, TMP_33, self = this, $case = nil;

      if ($iter) TMP_Module_define_method_32.$$p = null;
      
      
      if ($iter) TMP_Module_define_method_32.$$p = null;;
      ;
      if ($truthy(method === undefined && block === nil)) {
        self.$raise($$($nesting, 'ArgumentError'), "tried to create a Proc object without a block")};
      block = ($truthy($a = block) ? $a : (function() {$case = method;
      if ($$($nesting, 'Proc')['$===']($case)) {return method}
      else if ($$($nesting, 'Method')['$===']($case)) {return method.$to_proc().$$unbound}
      else if ($$($nesting, 'UnboundMethod')['$===']($case)) {return $lambda((TMP_33 = function($b){var self = TMP_33.$$s || this, $post_args, args, bound = nil;

      
        
        $post_args = Opal.slice.call(arguments, 0, arguments.length);
        
        args = $post_args;;
        bound = method.$bind(self);
        return $send(bound, 'call', Opal.to_a(args));}, TMP_33.$$s = self, TMP_33.$$arity = -1, TMP_33))}
      else {return self.$raise($$($nesting, 'TypeError'), "" + "wrong argument type " + (block.$class()) + " (expected Proc/Method)")}})());
      
      var id = '$' + name;

      block.$$jsid        = name;
      block.$$s           = null;
      block.$$def         = block;
      block.$$define_meth = true;

      Opal.defn(self, id, block);

      return name;
    ;
    }, TMP_Module_define_method_32.$$arity = -2);
    
    Opal.def(self, '$remove_method', TMP_Module_remove_method_34 = function $$remove_method($a) {
      var $post_args, names, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      names = $post_args;;
      
      for (var i = 0, length = names.length; i < length; i++) {
        Opal.rdef(self, "$" + names[i]);
      }
    ;
      return self;
    }, TMP_Module_remove_method_34.$$arity = -1);
    
    Opal.def(self, '$singleton_class?', TMP_Module_singleton_class$q_35 = function() {
      var self = this;

      return !!self.$$is_singleton;
    }, TMP_Module_singleton_class$q_35.$$arity = 0);
    
    Opal.def(self, '$include', TMP_Module_include_36 = function $$include($a) {
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
    }, TMP_Module_include_36.$$arity = -1);
    
    Opal.def(self, '$included_modules', TMP_Module_included_modules_37 = function $$included_modules() {
      var self = this;

      return Opal.included_modules(self);
    }, TMP_Module_included_modules_37.$$arity = 0);
    
    Opal.def(self, '$include?', TMP_Module_include$q_38 = function(mod) {
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
    
    }, TMP_Module_include$q_38.$$arity = 1);
    
    Opal.def(self, '$instance_method', TMP_Module_instance_method_39 = function $$instance_method(name) {
      var self = this;

      
      var meth = self.prototype['$' + name];

      if (!meth || meth.$$stub) {
        self.$raise($$($nesting, 'NameError').$new("" + "undefined method `" + (name) + "' for class `" + (self.$name()) + "'", name));
      }

      return $$($nesting, 'UnboundMethod').$new(self, meth.$$owner || self, meth, name);
    
    }, TMP_Module_instance_method_39.$$arity = 1);
    
    Opal.def(self, '$instance_methods', TMP_Module_instance_methods_40 = function $$instance_methods(include_super) {
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
    }, TMP_Module_instance_methods_40.$$arity = -1);
    
    Opal.def(self, '$included', TMP_Module_included_41 = function $$included(mod) {
      var self = this;

      return nil
    }, TMP_Module_included_41.$$arity = 1);
    
    Opal.def(self, '$extended', TMP_Module_extended_42 = function $$extended(mod) {
      var self = this;

      return nil
    }, TMP_Module_extended_42.$$arity = 1);
    
    Opal.def(self, '$extend_object', TMP_Module_extend_object_43 = function $$extend_object(object) {
      var self = this;

      return nil
    }, TMP_Module_extend_object_43.$$arity = 1);
    
    Opal.def(self, '$method_added', TMP_Module_method_added_44 = function $$method_added($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return nil;
    }, TMP_Module_method_added_44.$$arity = -1);
    
    Opal.def(self, '$method_removed', TMP_Module_method_removed_45 = function $$method_removed($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return nil;
    }, TMP_Module_method_removed_45.$$arity = -1);
    
    Opal.def(self, '$method_undefined', TMP_Module_method_undefined_46 = function $$method_undefined($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return nil;
    }, TMP_Module_method_undefined_46.$$arity = -1);
    
    Opal.def(self, '$module_eval', TMP_Module_module_eval_47 = function $$module_eval($a) {
      var $iter = TMP_Module_module_eval_47.$$p, block = $iter || nil, $post_args, args, $b, TMP_48, self = this, string = nil, file = nil, _lineno = nil, default_eval_options = nil, compiling_options = nil, compiled = nil;

      if ($iter) TMP_Module_module_eval_47.$$p = null;
      
      
      if ($iter) TMP_Module_module_eval_47.$$p = null;;
      
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
        block = $send($$($nesting, 'Kernel'), 'proc', [], (TMP_48 = function(){var self = TMP_48.$$s || this;

        
          return (function(self) {
            return eval(compiled);
          })(self)
        }, TMP_48.$$s = self, TMP_48.$$arity = 0, TMP_48));
      } else if ($truthy(args['$any?']())) {
        $$($nesting, 'Kernel').$raise($$($nesting, 'ArgumentError'), "" + ("" + "wrong number of arguments (" + (args.$size()) + " for 0)") + "\n\n  NOTE:If you want to enable passing a String argument please add \"require 'opal-parser'\" to your script\n")};
      
      var old = block.$$s,
          result;

      block.$$s = null;
      result = block.apply(self, [self]);
      block.$$s = old;

      return result;
    ;
    }, TMP_Module_module_eval_47.$$arity = -1);
    Opal.alias(self, "class_eval", "module_eval");
    
    Opal.def(self, '$module_exec', TMP_Module_module_exec_49 = function $$module_exec($a) {
      var $iter = TMP_Module_module_exec_49.$$p, block = $iter || nil, $post_args, args, self = this;

      if ($iter) TMP_Module_module_exec_49.$$p = null;
      
      
      if ($iter) TMP_Module_module_exec_49.$$p = null;;
      
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
    }, TMP_Module_module_exec_49.$$arity = -1);
    Opal.alias(self, "class_exec", "module_exec");
    
    Opal.def(self, '$method_defined?', TMP_Module_method_defined$q_50 = function(method) {
      var self = this;

      
      var body = self.prototype['$' + method];
      return (!!body) && !body.$$stub;
    
    }, TMP_Module_method_defined$q_50.$$arity = 1);
    
    Opal.def(self, '$module_function', TMP_Module_module_function_51 = function $$module_function($a) {
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
              func = self.prototype[id];

          Opal.defs(self, id, func);
        }
      }

      return self;
    ;
    }, TMP_Module_module_function_51.$$arity = -1);
    
    Opal.def(self, '$name', TMP_Module_name_52 = function $$name() {
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
    
    }, TMP_Module_name_52.$$arity = 0);
    
    Opal.def(self, '$prepend', TMP_Module_prepend_53 = function $$prepend($a) {
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
    }, TMP_Module_prepend_53.$$arity = -1);
    
    Opal.def(self, '$prepend_features', TMP_Module_prepend_features_54 = function $$prepend_features(prepender) {
      var self = this;

      
      
      if (!self.$$is_module) {
        self.$raise($$($nesting, 'TypeError'), "" + "wrong argument type " + (self.$class()) + " (expected Module)");
      }

      Opal.prepend_features(self, prepender)
    ;
      return self;
    }, TMP_Module_prepend_features_54.$$arity = 1);
    
    Opal.def(self, '$prepended', TMP_Module_prepended_55 = function $$prepended(mod) {
      var self = this;

      return nil
    }, TMP_Module_prepended_55.$$arity = 1);
    
    Opal.def(self, '$remove_const', TMP_Module_remove_const_56 = function $$remove_const(name) {
      var self = this;

      return Opal.const_remove(self, name);
    }, TMP_Module_remove_const_56.$$arity = 1);
    
    Opal.def(self, '$to_s', TMP_Module_to_s_57 = function $$to_s() {
      var $a, self = this;

      return ($truthy($a = Opal.Module.$name.call(self)) ? $a : "" + "#<" + (self.$$is_module ? 'Module' : 'Class') + ":0x" + (self.$__id__().$to_s(16)) + ">")
    }, TMP_Module_to_s_57.$$arity = 0);
    
    Opal.def(self, '$undef_method', TMP_Module_undef_method_58 = function $$undef_method($a) {
      var $post_args, names, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      names = $post_args;;
      
      for (var i = 0, length = names.length; i < length; i++) {
        Opal.udef(self, "$" + names[i]);
      }
    ;
      return self;
    }, TMP_Module_undef_method_58.$$arity = -1);
    
    Opal.def(self, '$instance_variables', TMP_Module_instance_variables_59 = function $$instance_variables() {
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
    }, TMP_Module_instance_variables_59.$$arity = 0);
    
    Opal.def(self, '$dup', TMP_Module_dup_60 = function $$dup() {
      var $iter = TMP_Module_dup_60.$$p, $yield = $iter || nil, self = this, copy = nil, $zuper = nil, $zuper_i = nil, $zuper_ii = nil;

      if ($iter) TMP_Module_dup_60.$$p = null;
      // Prepare super implicit arguments
      for($zuper_i = 0, $zuper_ii = arguments.length, $zuper = new Array($zuper_ii); $zuper_i < $zuper_ii; $zuper_i++) {
        $zuper[$zuper_i] = arguments[$zuper_i];
      }
      
      copy = $send(self, Opal.find_super_dispatcher(self, 'dup', TMP_Module_dup_60, false), $zuper, $iter);
      copy.$copy_class_variables(self);
      copy.$copy_constants(self);
      return copy;
    }, TMP_Module_dup_60.$$arity = 0);
    
    Opal.def(self, '$copy_class_variables', TMP_Module_copy_class_variables_61 = function $$copy_class_variables(other) {
      var self = this;

      
      for (var name in other.$$cvars) {
        self.$$cvars[name] = other.$$cvars[name];
      }
    
    }, TMP_Module_copy_class_variables_61.$$arity = 1);
    return (Opal.def(self, '$copy_constants', TMP_Module_copy_constants_62 = function $$copy_constants(other) {
      var self = this;

      
      var name, other_constants = other.$$const;

      for (name in other_constants) {
        Opal.const_set(self, name, other_constants[name]);
      }
    
    }, TMP_Module_copy_constants_62.$$arity = 1), nil) && 'copy_constants';
  })($nesting[0], null, $nesting)
};

/* Generated by Opal 0.11.99.dev */
Opal.modules["corelib/class"] = function(Opal) {
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice, $klass = Opal.klass, $send = Opal.send;

  Opal.add_stubs(['$require', '$class_eval', '$to_proc', '$initialize_copy', '$allocate', '$name', '$to_s']);
  
  self.$require("corelib/module");
  return (function($base, $super, $parent_nesting) {
    function $Class(){};
    var self = $Class = $klass($base, $super, 'Class', $Class);

    var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_Class_new_1, TMP_Class_allocate_2, TMP_Class_inherited_3, TMP_Class_initialize_dup_4, TMP_Class_new_5, TMP_Class_superclass_6, TMP_Class_to_s_7;

    
    Opal.defs(self, '$new', TMP_Class_new_1 = function(superclass) {
      var $iter = TMP_Class_new_1.$$p, block = $iter || nil, self = this;

      if ($iter) TMP_Class_new_1.$$p = null;
      
      
      if ($iter) TMP_Class_new_1.$$p = null;;
      
      if (superclass == null) {
        superclass = $$($nesting, 'Object');
      };
      
      if (!superclass.$$is_class) {
        throw Opal.TypeError.$new("superclass must be a Class");
      }

      var klass = Opal.allocate_class(nil, superclass, function(){});
      superclass.$inherited(klass);
      (function() {if ((block !== nil)) {
        return $send((klass), 'class_eval', [], block.$to_proc())
      } else {
        return nil
      }; return nil; })()
      return klass;
    ;
    }, TMP_Class_new_1.$$arity = -1);
    
    Opal.def(self, '$allocate', TMP_Class_allocate_2 = function $$allocate() {
      var self = this;

      
      var obj = new self();
      obj.$$id = Opal.uid();
      return obj;
    
    }, TMP_Class_allocate_2.$$arity = 0);
    
    Opal.def(self, '$inherited', TMP_Class_inherited_3 = function $$inherited(cls) {
      var self = this;

      return nil
    }, TMP_Class_inherited_3.$$arity = 1);
    
    Opal.def(self, '$initialize_dup', TMP_Class_initialize_dup_4 = function $$initialize_dup(original) {
      var self = this;

      
      self.$initialize_copy(original);
      
      self.$$name = null;
      self.$$full_name = null;
    ;
    }, TMP_Class_initialize_dup_4.$$arity = 1);
    
    Opal.def(self, '$new', TMP_Class_new_5 = function($a) {
      var $iter = TMP_Class_new_5.$$p, block = $iter || nil, $post_args, args, self = this;

      if ($iter) TMP_Class_new_5.$$p = null;
      
      
      if ($iter) TMP_Class_new_5.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      
      var object = self.$allocate();
      Opal.send(object, object.$initialize, args, block);
      return object;
    ;
    }, TMP_Class_new_5.$$arity = -1);
    
    Opal.def(self, '$superclass', TMP_Class_superclass_6 = function $$superclass() {
      var self = this;

      return self.$$super || nil;
    }, TMP_Class_superclass_6.$$arity = 0);
    return (Opal.def(self, '$to_s', TMP_Class_to_s_7 = function $$to_s() {
      var $iter = TMP_Class_to_s_7.$$p, $yield = $iter || nil, self = this;

      if ($iter) TMP_Class_to_s_7.$$p = null;
      
      var singleton_of = self.$$singleton_of;

      if (singleton_of && (singleton_of.$$is_a_module)) {
        return "" + "#<Class:" + ((singleton_of).$name()) + ">";
      }
      else if (singleton_of) {
        // a singleton class created from an object
        return "" + "#<Class:#<" + ((singleton_of.$$class).$name()) + ":0x" + ((Opal.id(singleton_of)).$to_s(16)) + ">>";
      }
      return $send(self, Opal.find_super_dispatcher(self, 'to_s', TMP_Class_to_s_7, false), [], null);
    
    }, TMP_Class_to_s_7.$$arity = 0), nil) && 'to_s';
  })($nesting[0], null, $nesting);
};

/* Generated by Opal 0.11.99.dev */
Opal.modules["corelib/basic_object"] = function(Opal) {
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice, $klass = Opal.klass, $truthy = Opal.truthy, $range = Opal.range, $hash2 = Opal.hash2, $send = Opal.send;

  Opal.add_stubs(['$==', '$!', '$nil?', '$cover?', '$size', '$raise', '$merge', '$compile', '$proc', '$any?', '$inspect', '$new']);
  return (function($base, $super, $parent_nesting) {
    function $BasicObject(){};
    var self = $BasicObject = $klass($base, $super, 'BasicObject', $BasicObject);

    var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_BasicObject_initialize_1, TMP_BasicObject_$eq$eq_2, TMP_BasicObject_eql$q_3, TMP_BasicObject___id___4, TMP_BasicObject___send___5, TMP_BasicObject_$B_6, TMP_BasicObject_$B$eq_7, TMP_BasicObject_instance_eval_8, TMP_BasicObject_instance_exec_10, TMP_BasicObject_singleton_method_added_11, TMP_BasicObject_singleton_method_removed_12, TMP_BasicObject_singleton_method_undefined_13, TMP_BasicObject_class_14, TMP_BasicObject_method_missing_15;

    
    
    Opal.def(self, '$initialize', TMP_BasicObject_initialize_1 = function $$initialize($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return nil;
    }, TMP_BasicObject_initialize_1.$$arity = -1);
    
    Opal.def(self, '$==', TMP_BasicObject_$eq$eq_2 = function(other) {
      var self = this;

      return self === other;
    }, TMP_BasicObject_$eq$eq_2.$$arity = 1);
    
    Opal.def(self, '$eql?', TMP_BasicObject_eql$q_3 = function(other) {
      var self = this;

      return self['$=='](other)
    }, TMP_BasicObject_eql$q_3.$$arity = 1);
    Opal.alias(self, "equal?", "==");
    
    Opal.def(self, '$__id__', TMP_BasicObject___id___4 = function $$__id__() {
      var self = this;

      
      if (self.$$id != null) {
        return self.$$id;
      }
      Opal.defineProperty(self, '$$id', Opal.uid());
      return self.$$id;
    
    }, TMP_BasicObject___id___4.$$arity = 0);
    
    Opal.def(self, '$__send__', TMP_BasicObject___send___5 = function $$__send__(symbol, $a) {
      var $iter = TMP_BasicObject___send___5.$$p, block = $iter || nil, $post_args, args, self = this;

      if ($iter) TMP_BasicObject___send___5.$$p = null;
      
      
      if ($iter) TMP_BasicObject___send___5.$$p = null;;
      
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
    }, TMP_BasicObject___send___5.$$arity = -2);
    
    Opal.def(self, '$!', TMP_BasicObject_$B_6 = function() {
      var self = this;

      return false
    }, TMP_BasicObject_$B_6.$$arity = 0);
    
    Opal.def(self, '$!=', TMP_BasicObject_$B$eq_7 = function(other) {
      var self = this;

      return self['$=='](other)['$!']()
    }, TMP_BasicObject_$B$eq_7.$$arity = 1);
    
    Opal.def(self, '$instance_eval', TMP_BasicObject_instance_eval_8 = function $$instance_eval($a) {
      var $iter = TMP_BasicObject_instance_eval_8.$$p, block = $iter || nil, $post_args, args, $b, TMP_9, self = this, string = nil, file = nil, _lineno = nil, default_eval_options = nil, compiling_options = nil, compiled = nil;

      if ($iter) TMP_BasicObject_instance_eval_8.$$p = null;
      
      
      if ($iter) TMP_BasicObject_instance_eval_8.$$p = null;;
      
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
        block = $send($$$('::', 'Kernel'), 'proc', [], (TMP_9 = function(){var self = TMP_9.$$s || this;

        
          return (function(self) {
            return eval(compiled);
          })(self)
        }, TMP_9.$$s = self, TMP_9.$$arity = 0, TMP_9));
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
    }, TMP_BasicObject_instance_eval_8.$$arity = -1);
    
    Opal.def(self, '$instance_exec', TMP_BasicObject_instance_exec_10 = function $$instance_exec($a) {
      var $iter = TMP_BasicObject_instance_exec_10.$$p, block = $iter || nil, $post_args, args, self = this;

      if ($iter) TMP_BasicObject_instance_exec_10.$$p = null;
      
      
      if ($iter) TMP_BasicObject_instance_exec_10.$$p = null;;
      
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
    }, TMP_BasicObject_instance_exec_10.$$arity = -1);
    
    Opal.def(self, '$singleton_method_added', TMP_BasicObject_singleton_method_added_11 = function $$singleton_method_added($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return nil;
    }, TMP_BasicObject_singleton_method_added_11.$$arity = -1);
    
    Opal.def(self, '$singleton_method_removed', TMP_BasicObject_singleton_method_removed_12 = function $$singleton_method_removed($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return nil;
    }, TMP_BasicObject_singleton_method_removed_12.$$arity = -1);
    
    Opal.def(self, '$singleton_method_undefined', TMP_BasicObject_singleton_method_undefined_13 = function $$singleton_method_undefined($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return nil;
    }, TMP_BasicObject_singleton_method_undefined_13.$$arity = -1);
    
    Opal.def(self, '$class', TMP_BasicObject_class_14 = function() {
      var self = this;

      return self.$$class;
    }, TMP_BasicObject_class_14.$$arity = 0);
    return (Opal.def(self, '$method_missing', TMP_BasicObject_method_missing_15 = function $$method_missing(symbol, $a) {
      var $iter = TMP_BasicObject_method_missing_15.$$p, block = $iter || nil, $post_args, args, self = this, message = nil;

      if ($iter) TMP_BasicObject_method_missing_15.$$p = null;
      
      
      if ($iter) TMP_BasicObject_method_missing_15.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 1, arguments.length);
      
      args = $post_args;;
      message = (function() {if ($truthy(self.$inspect && !self.$inspect.$$stub)) {
        return "" + "undefined method `" + (symbol) + "' for " + (self.$inspect()) + ":" + (self.$$class)
      } else {
        return "" + "undefined method `" + (symbol) + "' for " + (self.$$class)
      }; return nil; })();
      return $$$('::', 'Kernel').$raise($$$('::', 'NoMethodError').$new(message, symbol));
    }, TMP_BasicObject_method_missing_15.$$arity = -2), nil) && 'method_missing';
  })($nesting[0], null, $nesting)
};

/* Generated by Opal 0.11.99.dev */
Opal.modules["corelib/kernel"] = function(Opal) {
  function $rb_le(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs <= rhs : lhs['$<='](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice, $module = Opal.module, $truthy = Opal.truthy, $gvars = Opal.gvars, $hash2 = Opal.hash2, $send = Opal.send, $klass = Opal.klass;

  Opal.add_stubs(['$raise', '$new', '$inspect', '$!', '$=~', '$==', '$object_id', '$class', '$coerce_to?', '$<<', '$allocate', '$copy_instance_variables', '$copy_singleton_methods', '$initialize_clone', '$initialize_copy', '$define_method', '$singleton_class', '$to_proc', '$initialize_dup', '$for', '$empty?', '$pop', '$call', '$coerce_to', '$append_features', '$extend_object', '$extended', '$length', '$respond_to?', '$[]', '$nil?', '$to_a', '$to_int', '$fetch', '$Integer', '$Float', '$to_ary', '$to_str', '$to_s', '$__id__', '$instance_variable_name!', '$coerce_to!', '$===', '$enum_for', '$result', '$any?', '$print', '$format', '$puts', '$each', '$<=', '$exception', '$is_a?', '$rand', '$respond_to_missing?', '$try_convert!', '$expand_path', '$join', '$start_with?', '$new_seed', '$srand', '$sym', '$arg', '$open', '$include']);
  
  (function($base, $parent_nesting) {
    function $Kernel() {};
    var self = $Kernel = $module($base, 'Kernel', $Kernel);

    var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_Kernel_method_missing_1, TMP_Kernel_$eq$_2, TMP_Kernel_$B$_3, TMP_Kernel_$eq$eq$eq_4, TMP_Kernel_$lt$eq$gt_5, TMP_Kernel_method_6, TMP_Kernel_methods_7, TMP_Kernel_public_methods_8, TMP_Kernel_Array_9, TMP_Kernel_at_exit_10, TMP_Kernel_caller_11, TMP_Kernel_class_12, TMP_Kernel_copy_instance_variables_13, TMP_Kernel_copy_singleton_methods_14, TMP_Kernel_clone_15, TMP_Kernel_initialize_clone_16, TMP_Kernel_define_singleton_method_17, TMP_Kernel_dup_18, TMP_Kernel_initialize_dup_19, TMP_Kernel_enum_for_20, TMP_Kernel_equal$q_21, TMP_Kernel_exit_22, TMP_Kernel_extend_23, TMP_Kernel_format_24, TMP_Kernel_hash_25, TMP_Kernel_initialize_copy_26, TMP_Kernel_inspect_27, TMP_Kernel_instance_of$q_28, TMP_Kernel_instance_variable_defined$q_29, TMP_Kernel_instance_variable_get_30, TMP_Kernel_instance_variable_set_31, TMP_Kernel_remove_instance_variable_32, TMP_Kernel_instance_variables_33, TMP_Kernel_Integer_34, TMP_Kernel_Float_35, TMP_Kernel_Hash_36, TMP_Kernel_is_a$q_37, TMP_Kernel_itself_38, TMP_Kernel_lambda_39, TMP_Kernel_load_40, TMP_Kernel_loop_41, TMP_Kernel_nil$q_43, TMP_Kernel_printf_44, TMP_Kernel_proc_45, TMP_Kernel_puts_46, TMP_Kernel_p_47, TMP_Kernel_print_49, TMP_Kernel_warn_50, TMP_Kernel_raise_51, TMP_Kernel_rand_52, TMP_Kernel_respond_to$q_53, TMP_Kernel_respond_to_missing$q_54, TMP_Kernel_require_55, TMP_Kernel_require_relative_56, TMP_Kernel_require_tree_57, TMP_Kernel_singleton_class_58, TMP_Kernel_sleep_59, TMP_Kernel_srand_60, TMP_Kernel_String_61, TMP_Kernel_tap_62, TMP_Kernel_to_proc_63, TMP_Kernel_to_s_64, TMP_Kernel_catch_65, TMP_Kernel_throw_66, TMP_Kernel_open_67, TMP_Kernel_yield_self_68;

    
    
    Opal.def(self, '$method_missing', TMP_Kernel_method_missing_1 = function $$method_missing(symbol, $a) {
      var $iter = TMP_Kernel_method_missing_1.$$p, block = $iter || nil, $post_args, args, self = this;

      if ($iter) TMP_Kernel_method_missing_1.$$p = null;
      
      
      if ($iter) TMP_Kernel_method_missing_1.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 1, arguments.length);
      
      args = $post_args;;
      return self.$raise($$($nesting, 'NoMethodError').$new("" + "undefined method `" + (symbol) + "' for " + (self.$inspect()), symbol, args));
    }, TMP_Kernel_method_missing_1.$$arity = -2);
    
    Opal.def(self, '$=~', TMP_Kernel_$eq$_2 = function(obj) {
      var self = this;

      return false
    }, TMP_Kernel_$eq$_2.$$arity = 1);
    
    Opal.def(self, '$!~', TMP_Kernel_$B$_3 = function(obj) {
      var self = this;

      return self['$=~'](obj)['$!']()
    }, TMP_Kernel_$B$_3.$$arity = 1);
    
    Opal.def(self, '$===', TMP_Kernel_$eq$eq$eq_4 = function(other) {
      var $a, self = this;

      return ($truthy($a = self.$object_id()['$=='](other.$object_id())) ? $a : self['$=='](other))
    }, TMP_Kernel_$eq$eq$eq_4.$$arity = 1);
    
    Opal.def(self, '$<=>', TMP_Kernel_$lt$eq$gt_5 = function(other) {
      var self = this;

      
      // set guard for infinite recursion
      self.$$comparable = true;

      var x = self['$=='](other);

      if (x && x !== nil) {
        return 0;
      }

      return nil;
    
    }, TMP_Kernel_$lt$eq$gt_5.$$arity = 1);
    
    Opal.def(self, '$method', TMP_Kernel_method_6 = function $$method(name) {
      var self = this;

      
      var meth = self['$' + name];

      if (!meth || meth.$$stub) {
        self.$raise($$($nesting, 'NameError').$new("" + "undefined method `" + (name) + "' for class `" + (self.$class()) + "'", name));
      }

      return $$($nesting, 'Method').$new(self, meth.$$owner || self.$class(), meth, name);
    
    }, TMP_Kernel_method_6.$$arity = 1);
    
    Opal.def(self, '$methods', TMP_Kernel_methods_7 = function $$methods(all) {
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
    }, TMP_Kernel_methods_7.$$arity = -1);
    
    Opal.def(self, '$public_methods', TMP_Kernel_public_methods_8 = function $$public_methods(all) {
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
    }, TMP_Kernel_public_methods_8.$$arity = -1);
    
    Opal.def(self, '$Array', TMP_Kernel_Array_9 = function $$Array(object) {
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
    
    }, TMP_Kernel_Array_9.$$arity = 1);
    
    Opal.def(self, '$at_exit', TMP_Kernel_at_exit_10 = function $$at_exit() {
      var $iter = TMP_Kernel_at_exit_10.$$p, block = $iter || nil, $a, self = this;
      if ($gvars.__at_exit__ == null) $gvars.__at_exit__ = nil;

      if ($iter) TMP_Kernel_at_exit_10.$$p = null;
      
      
      if ($iter) TMP_Kernel_at_exit_10.$$p = null;;
      $gvars.__at_exit__ = ($truthy($a = $gvars.__at_exit__) ? $a : []);
      return $gvars.__at_exit__['$<<'](block);
    }, TMP_Kernel_at_exit_10.$$arity = 0);
    
    Opal.def(self, '$caller', TMP_Kernel_caller_11 = function $$caller($a) {
      var $post_args, args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      return [];
    }, TMP_Kernel_caller_11.$$arity = -1);
    
    Opal.def(self, '$class', TMP_Kernel_class_12 = function() {
      var self = this;

      return self.$$class;
    }, TMP_Kernel_class_12.$$arity = 0);
    
    Opal.def(self, '$copy_instance_variables', TMP_Kernel_copy_instance_variables_13 = function $$copy_instance_variables(other) {
      var self = this;

      
      var keys = Object.keys(other), i, ii, name;
      for (i = 0, ii = keys.length; i < ii; i++) {
        name = keys[i];
        if (name.charAt(0) !== '$' && other.hasOwnProperty(name)) {
          self[name] = other[name];
        }
      }
    
    }, TMP_Kernel_copy_instance_variables_13.$$arity = 1);
    
    Opal.def(self, '$copy_singleton_methods', TMP_Kernel_copy_singleton_methods_14 = function $$copy_singleton_methods(other) {
      var self = this;

      
      var i, name, names, length;

      if (other.hasOwnProperty('$$meta')) {
        var other_singleton_class = Opal.get_singleton_class(other);
        var self_singleton_class = Opal.get_singleton_class(self);
        names = Object.getOwnPropertyNames(other_singleton_class.prototype);

        for (i = 0, length = names.length; i < length; i++) {
          name = names[i];
          if (Opal.is_method(name)) {
            self_singleton_class.prototype[name] = other_singleton_class.prototype[name];
          }
        }

        self_singleton_class.$$const = Object.assign({}, other_singleton_class.$$const);
        Object.setPrototypeOf(
          self_singleton_class.prototype,
          Object.getPrototypeOf(other_singleton_class.prototype)
        );
      }

      for (i = 0, names = Object.getOwnPropertyNames(other), length = names.length; i < length; i++) {
        name = names[i];
        if (name.charAt(0) === '$' && name.charAt(1) !== '$' && other.hasOwnProperty(name)) {
          self[name] = other[name];
        }
      }
    
    }, TMP_Kernel_copy_singleton_methods_14.$$arity = 1);
    
    Opal.def(self, '$clone', TMP_Kernel_clone_15 = function $$clone($kwargs) {
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
    }, TMP_Kernel_clone_15.$$arity = -1);
    
    Opal.def(self, '$initialize_clone', TMP_Kernel_initialize_clone_16 = function $$initialize_clone(other) {
      var self = this;

      return self.$initialize_copy(other)
    }, TMP_Kernel_initialize_clone_16.$$arity = 1);
    
    Opal.def(self, '$define_singleton_method', TMP_Kernel_define_singleton_method_17 = function $$define_singleton_method(name, method) {
      var $iter = TMP_Kernel_define_singleton_method_17.$$p, block = $iter || nil, self = this;

      if ($iter) TMP_Kernel_define_singleton_method_17.$$p = null;
      
      
      if ($iter) TMP_Kernel_define_singleton_method_17.$$p = null;;
      ;
      return $send(self.$singleton_class(), 'define_method', [name, method], block.$to_proc());
    }, TMP_Kernel_define_singleton_method_17.$$arity = -2);
    
    Opal.def(self, '$dup', TMP_Kernel_dup_18 = function $$dup() {
      var self = this, copy = nil;

      
      copy = self.$class().$allocate();
      copy.$copy_instance_variables(self);
      copy.$initialize_dup(self);
      return copy;
    }, TMP_Kernel_dup_18.$$arity = 0);
    
    Opal.def(self, '$initialize_dup', TMP_Kernel_initialize_dup_19 = function $$initialize_dup(other) {
      var self = this;

      return self.$initialize_copy(other)
    }, TMP_Kernel_initialize_dup_19.$$arity = 1);
    
    Opal.def(self, '$enum_for', TMP_Kernel_enum_for_20 = function $$enum_for($a, $b) {
      var $iter = TMP_Kernel_enum_for_20.$$p, block = $iter || nil, $post_args, method, args, self = this;

      if ($iter) TMP_Kernel_enum_for_20.$$p = null;
      
      
      if ($iter) TMP_Kernel_enum_for_20.$$p = null;;
      
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
    }, TMP_Kernel_enum_for_20.$$arity = -1);
    Opal.alias(self, "to_enum", "enum_for");
    
    Opal.def(self, '$equal?', TMP_Kernel_equal$q_21 = function(other) {
      var self = this;

      return self === other;
    }, TMP_Kernel_equal$q_21.$$arity = 1);
    
    Opal.def(self, '$exit', TMP_Kernel_exit_22 = function $$exit(status) {
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
    }, TMP_Kernel_exit_22.$$arity = -1);
    
    Opal.def(self, '$extend', TMP_Kernel_extend_23 = function $$extend($a) {
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
    }, TMP_Kernel_extend_23.$$arity = -1);
    
    Opal.def(self, '$format', TMP_Kernel_format_24 = function $$format(format_string, $a) {
      var $post_args, args, $b, self = this, ary = nil;
      if ($gvars.DEBUG == null) $gvars.DEBUG = nil;

      
      
      $post_args = Opal.slice.call(arguments, 1, arguments.length);
      
      args = $post_args;;
      if ($truthy((($b = args.$length()['$=='](1)) ? args['$[]'](0)['$respond_to?']("to_ary") : args.$length()['$=='](1)))) {
        
        ary = $$($nesting, 'Opal')['$coerce_to?'](args['$[]'](0), $$($nesting, 'Array'), "to_ary");
        if ($truthy(ary['$nil?']())) {
        } else {
          args = ary.$to_a()
        };};
      
      var result = '',
          //used for slicing:
          begin_slice = 0,
          end_slice,
          //used for iterating over the format string:
          i,
          len = format_string.length,
          //used for processing field values:
          arg,
          str,
          //used for processing %g and %G fields:
          exponent,
          //used for keeping track of width and precision:
          width,
          precision,
          //used for holding temporary values:
          tmp_num,
          //used for processing %{} and %<> fileds:
          hash_parameter_key,
          closing_brace_char,
          //used for processing %b, %B, %o, %x, and %X fields:
          base_number,
          base_prefix,
          base_neg_zero_regex,
          base_neg_zero_digit,
          //used for processing arguments:
          next_arg,
          seq_arg_num = 1,
          pos_arg_num = 0,
          //used for keeping track of flags:
          flags,
          FNONE  = 0,
          FSHARP = 1,
          FMINUS = 2,
          FPLUS  = 4,
          FZERO  = 8,
          FSPACE = 16,
          FWIDTH = 32,
          FPREC  = 64,
          FPREC0 = 128;

      function CHECK_FOR_FLAGS() {
        if (flags&FWIDTH) { self.$raise($$($nesting, 'ArgumentError'), "flag after width") }
        if (flags&FPREC0) { self.$raise($$($nesting, 'ArgumentError'), "flag after precision") }
      }

      function CHECK_FOR_WIDTH() {
        if (flags&FWIDTH) { self.$raise($$($nesting, 'ArgumentError'), "width given twice") }
        if (flags&FPREC0) { self.$raise($$($nesting, 'ArgumentError'), "width after precision") }
      }

      function GET_NTH_ARG(num) {
        if (num >= args.length) { self.$raise($$($nesting, 'ArgumentError'), "too few arguments") }
        return args[num];
      }

      function GET_NEXT_ARG() {
        switch (pos_arg_num) {
        case -1: self.$raise($$($nesting, 'ArgumentError'), "" + "unnumbered(" + (seq_arg_num) + ") mixed with numbered")
        case -2: self.$raise($$($nesting, 'ArgumentError'), "" + "unnumbered(" + (seq_arg_num) + ") mixed with named")
        }
        pos_arg_num = seq_arg_num++;
        return GET_NTH_ARG(pos_arg_num - 1);
      }

      function GET_POS_ARG(num) {
        if (pos_arg_num > 0) {
          self.$raise($$($nesting, 'ArgumentError'), "" + "numbered(" + (num) + ") after unnumbered(" + (pos_arg_num) + ")")
        }
        if (pos_arg_num === -2) {
          self.$raise($$($nesting, 'ArgumentError'), "" + "numbered(" + (num) + ") after named")
        }
        if (num < 1) {
          self.$raise($$($nesting, 'ArgumentError'), "" + "invalid index - " + (num) + "$")
        }
        pos_arg_num = -1;
        return GET_NTH_ARG(num - 1);
      }

      function GET_ARG() {
        return (next_arg === undefined ? GET_NEXT_ARG() : next_arg);
      }

      function READ_NUM(label) {
        var num, str = '';
        for (;; i++) {
          if (i === len) {
            self.$raise($$($nesting, 'ArgumentError'), "malformed format string - %*[0-9]")
          }
          if (format_string.charCodeAt(i) < 48 || format_string.charCodeAt(i) > 57) {
            i--;
            num = parseInt(str, 10) || 0;
            if (num > 2147483647) {
              self.$raise($$($nesting, 'ArgumentError'), "" + (label) + " too big")
            }
            return num;
          }
          str += format_string.charAt(i);
        }
      }

      function READ_NUM_AFTER_ASTER(label) {
        var arg, num = READ_NUM(label);
        if (format_string.charAt(i + 1) === '$') {
          i++;
          arg = GET_POS_ARG(num);
        } else {
          arg = GET_NEXT_ARG();
        }
        return (arg).$to_int();
      }

      for (i = format_string.indexOf('%'); i !== -1; i = format_string.indexOf('%', i)) {
        str = undefined;

        flags = FNONE;
        width = -1;
        precision = -1;
        next_arg = undefined;

        end_slice = i;

        i++;

        switch (format_string.charAt(i)) {
        case '%':
          begin_slice = i;
        case '':
        case '\n':
        case '\0':
          i++;
          continue;
        }

        format_sequence: for (; i < len; i++) {
          switch (format_string.charAt(i)) {

          case ' ':
            CHECK_FOR_FLAGS();
            flags |= FSPACE;
            continue format_sequence;

          case '#':
            CHECK_FOR_FLAGS();
            flags |= FSHARP;
            continue format_sequence;

          case '+':
            CHECK_FOR_FLAGS();
            flags |= FPLUS;
            continue format_sequence;

          case '-':
            CHECK_FOR_FLAGS();
            flags |= FMINUS;
            continue format_sequence;

          case '0':
            CHECK_FOR_FLAGS();
            flags |= FZERO;
            continue format_sequence;

          case '1':
          case '2':
          case '3':
          case '4':
          case '5':
          case '6':
          case '7':
          case '8':
          case '9':
            tmp_num = READ_NUM('width');
            if (format_string.charAt(i + 1) === '$') {
              if (i + 2 === len) {
                str = '%';
                i++;
                break format_sequence;
              }
              if (next_arg !== undefined) {
                self.$raise($$($nesting, 'ArgumentError'), "" + "value given twice - %" + (tmp_num) + "$")
              }
              next_arg = GET_POS_ARG(tmp_num);
              i++;
            } else {
              CHECK_FOR_WIDTH();
              flags |= FWIDTH;
              width = tmp_num;
            }
            continue format_sequence;

          case '<':
          case '\{':
            closing_brace_char = (format_string.charAt(i) === '<' ? '>' : '\}');
            hash_parameter_key = '';

            i++;

            for (;; i++) {
              if (i === len) {
                self.$raise($$($nesting, 'ArgumentError'), "malformed name - unmatched parenthesis")
              }
              if (format_string.charAt(i) === closing_brace_char) {

                if (pos_arg_num > 0) {
                  self.$raise($$($nesting, 'ArgumentError'), "" + "named " + (hash_parameter_key) + " after unnumbered(" + (pos_arg_num) + ")")
                }
                if (pos_arg_num === -1) {
                  self.$raise($$($nesting, 'ArgumentError'), "" + "named " + (hash_parameter_key) + " after numbered")
                }
                pos_arg_num = -2;

                if (args[0] === undefined || !args[0].$$is_hash) {
                  self.$raise($$($nesting, 'ArgumentError'), "one hash required")
                }

                next_arg = (args[0]).$fetch(hash_parameter_key);

                if (closing_brace_char === '>') {
                  continue format_sequence;
                } else {
                  str = next_arg.toString();
                  if (precision !== -1) { str = str.slice(0, precision); }
                  if (flags&FMINUS) {
                    while (str.length < width) { str = str + ' '; }
                  } else {
                    while (str.length < width) { str = ' ' + str; }
                  }
                  break format_sequence;
                }
              }
              hash_parameter_key += format_string.charAt(i);
            }

          case '*':
            i++;
            CHECK_FOR_WIDTH();
            flags |= FWIDTH;
            width = READ_NUM_AFTER_ASTER('width');
            if (width < 0) {
              flags |= FMINUS;
              width = -width;
            }
            continue format_sequence;

          case '.':
            if (flags&FPREC0) {
              self.$raise($$($nesting, 'ArgumentError'), "precision given twice")
            }
            flags |= FPREC|FPREC0;
            precision = 0;
            i++;
            if (format_string.charAt(i) === '*') {
              i++;
              precision = READ_NUM_AFTER_ASTER('precision');
              if (precision < 0) {
                flags &= ~FPREC;
              }
              continue format_sequence;
            }
            precision = READ_NUM('precision');
            continue format_sequence;

          case 'd':
          case 'i':
          case 'u':
            arg = self.$Integer(GET_ARG());
            if (arg >= 0) {
              str = arg.toString();
              while (str.length < precision) { str = '0' + str; }
              if (flags&FMINUS) {
                if (flags&FPLUS || flags&FSPACE) { str = (flags&FPLUS ? '+' : ' ') + str; }
                while (str.length < width) { str = str + ' '; }
              } else {
                if (flags&FZERO && precision === -1) {
                  while (str.length < width - ((flags&FPLUS || flags&FSPACE) ? 1 : 0)) { str = '0' + str; }
                  if (flags&FPLUS || flags&FSPACE) { str = (flags&FPLUS ? '+' : ' ') + str; }
                } else {
                  if (flags&FPLUS || flags&FSPACE) { str = (flags&FPLUS ? '+' : ' ') + str; }
                  while (str.length < width) { str = ' ' + str; }
                }
              }
            } else {
              str = (-arg).toString();
              while (str.length < precision) { str = '0' + str; }
              if (flags&FMINUS) {
                str = '-' + str;
                while (str.length < width) { str = str + ' '; }
              } else {
                if (flags&FZERO && precision === -1) {
                  while (str.length < width - 1) { str = '0' + str; }
                  str = '-' + str;
                } else {
                  str = '-' + str;
                  while (str.length < width) { str = ' ' + str; }
                }
              }
            }
            break format_sequence;

          case 'b':
          case 'B':
          case 'o':
          case 'x':
          case 'X':
            switch (format_string.charAt(i)) {
            case 'b':
            case 'B':
              base_number = 2;
              base_prefix = '0b';
              base_neg_zero_regex = /^1+/;
              base_neg_zero_digit = '1';
              break;
            case 'o':
              base_number = 8;
              base_prefix = '0';
              base_neg_zero_regex = /^3?7+/;
              base_neg_zero_digit = '7';
              break;
            case 'x':
            case 'X':
              base_number = 16;
              base_prefix = '0x';
              base_neg_zero_regex = /^f+/;
              base_neg_zero_digit = 'f';
              break;
            }
            arg = self.$Integer(GET_ARG());
            if (arg >= 0) {
              str = arg.toString(base_number);
              while (str.length < precision) { str = '0' + str; }
              if (flags&FMINUS) {
                if (flags&FPLUS || flags&FSPACE) { str = (flags&FPLUS ? '+' : ' ') + str; }
                if (flags&FSHARP && arg !== 0) { str = base_prefix + str; }
                while (str.length < width) { str = str + ' '; }
              } else {
                if (flags&FZERO && precision === -1) {
                  while (str.length < width - ((flags&FPLUS || flags&FSPACE) ? 1 : 0) - ((flags&FSHARP && arg !== 0) ? base_prefix.length : 0)) { str = '0' + str; }
                  if (flags&FSHARP && arg !== 0) { str = base_prefix + str; }
                  if (flags&FPLUS || flags&FSPACE) { str = (flags&FPLUS ? '+' : ' ') + str; }
                } else {
                  if (flags&FSHARP && arg !== 0) { str = base_prefix + str; }
                  if (flags&FPLUS || flags&FSPACE) { str = (flags&FPLUS ? '+' : ' ') + str; }
                  while (str.length < width) { str = ' ' + str; }
                }
              }
            } else {
              if (flags&FPLUS || flags&FSPACE) {
                str = (-arg).toString(base_number);
                while (str.length < precision) { str = '0' + str; }
                if (flags&FMINUS) {
                  if (flags&FSHARP) { str = base_prefix + str; }
                  str = '-' + str;
                  while (str.length < width) { str = str + ' '; }
                } else {
                  if (flags&FZERO && precision === -1) {
                    while (str.length < width - 1 - (flags&FSHARP ? 2 : 0)) { str = '0' + str; }
                    if (flags&FSHARP) { str = base_prefix + str; }
                    str = '-' + str;
                  } else {
                    if (flags&FSHARP) { str = base_prefix + str; }
                    str = '-' + str;
                    while (str.length < width) { str = ' ' + str; }
                  }
                }
              } else {
                str = (arg >>> 0).toString(base_number).replace(base_neg_zero_regex, base_neg_zero_digit);
                while (str.length < precision - 2) { str = base_neg_zero_digit + str; }
                if (flags&FMINUS) {
                  str = '..' + str;
                  if (flags&FSHARP) { str = base_prefix + str; }
                  while (str.length < width) { str = str + ' '; }
                } else {
                  if (flags&FZERO && precision === -1) {
                    while (str.length < width - 2 - (flags&FSHARP ? base_prefix.length : 0)) { str = base_neg_zero_digit + str; }
                    str = '..' + str;
                    if (flags&FSHARP) { str = base_prefix + str; }
                  } else {
                    str = '..' + str;
                    if (flags&FSHARP) { str = base_prefix + str; }
                    while (str.length < width) { str = ' ' + str; }
                  }
                }
              }
            }
            if (format_string.charAt(i) === format_string.charAt(i).toUpperCase()) {
              str = str.toUpperCase();
            }
            break format_sequence;

          case 'f':
          case 'e':
          case 'E':
          case 'g':
          case 'G':
            arg = self.$Float(GET_ARG());
            if (arg >= 0 || isNaN(arg)) {
              if (arg === Infinity) {
                str = 'Inf';
              } else {
                switch (format_string.charAt(i)) {
                case 'f':
                  str = arg.toFixed(precision === -1 ? 6 : precision);
                  break;
                case 'e':
                case 'E':
                  str = arg.toExponential(precision === -1 ? 6 : precision);
                  break;
                case 'g':
                case 'G':
                  str = arg.toExponential();
                  exponent = parseInt(str.split('e')[1], 10);
                  if (!(exponent < -4 || exponent >= (precision === -1 ? 6 : precision))) {
                    str = arg.toPrecision(precision === -1 ? (flags&FSHARP ? 6 : undefined) : precision);
                  }
                  break;
                }
              }
              if (flags&FMINUS) {
                if (flags&FPLUS || flags&FSPACE) { str = (flags&FPLUS ? '+' : ' ') + str; }
                while (str.length < width) { str = str + ' '; }
              } else {
                if (flags&FZERO && arg !== Infinity && !isNaN(arg)) {
                  while (str.length < width - ((flags&FPLUS || flags&FSPACE) ? 1 : 0)) { str = '0' + str; }
                  if (flags&FPLUS || flags&FSPACE) { str = (flags&FPLUS ? '+' : ' ') + str; }
                } else {
                  if (flags&FPLUS || flags&FSPACE) { str = (flags&FPLUS ? '+' : ' ') + str; }
                  while (str.length < width) { str = ' ' + str; }
                }
              }
            } else {
              if (arg === -Infinity) {
                str = 'Inf';
              } else {
                switch (format_string.charAt(i)) {
                case 'f':
                  str = (-arg).toFixed(precision === -1 ? 6 : precision);
                  break;
                case 'e':
                case 'E':
                  str = (-arg).toExponential(precision === -1 ? 6 : precision);
                  break;
                case 'g':
                case 'G':
                  str = (-arg).toExponential();
                  exponent = parseInt(str.split('e')[1], 10);
                  if (!(exponent < -4 || exponent >= (precision === -1 ? 6 : precision))) {
                    str = (-arg).toPrecision(precision === -1 ? (flags&FSHARP ? 6 : undefined) : precision);
                  }
                  break;
                }
              }
              if (flags&FMINUS) {
                str = '-' + str;
                while (str.length < width) { str = str + ' '; }
              } else {
                if (flags&FZERO && arg !== -Infinity) {
                  while (str.length < width - 1) { str = '0' + str; }
                  str = '-' + str;
                } else {
                  str = '-' + str;
                  while (str.length < width) { str = ' ' + str; }
                }
              }
            }
            if (format_string.charAt(i) === format_string.charAt(i).toUpperCase() && arg !== Infinity && arg !== -Infinity && !isNaN(arg)) {
              str = str.toUpperCase();
            }
            str = str.replace(/([eE][-+]?)([0-9])$/, '$10$2');
            break format_sequence;

          case 'a':
          case 'A':
            // Not implemented because there are no specs for this field type.
            self.$raise($$($nesting, 'NotImplementedError'), "`A` and `a` format field types are not implemented in Opal yet")

          case 'c':
            arg = GET_ARG();
            if ((arg)['$respond_to?']("to_ary")) { arg = (arg).$to_ary()[0]; }
            if ((arg)['$respond_to?']("to_str")) {
              str = (arg).$to_str();
            } else {
              str = String.fromCharCode($$($nesting, 'Opal').$coerce_to(arg, $$($nesting, 'Integer'), "to_int"));
            }
            if (str.length !== 1) {
              self.$raise($$($nesting, 'ArgumentError'), "%c requires a character")
            }
            if (flags&FMINUS) {
              while (str.length < width) { str = str + ' '; }
            } else {
              while (str.length < width) { str = ' ' + str; }
            }
            break format_sequence;

          case 'p':
            str = (GET_ARG()).$inspect();
            if (precision !== -1) { str = str.slice(0, precision); }
            if (flags&FMINUS) {
              while (str.length < width) { str = str + ' '; }
            } else {
              while (str.length < width) { str = ' ' + str; }
            }
            break format_sequence;

          case 's':
            str = (GET_ARG()).$to_s();
            if (precision !== -1) { str = str.slice(0, precision); }
            if (flags&FMINUS) {
              while (str.length < width) { str = str + ' '; }
            } else {
              while (str.length < width) { str = ' ' + str; }
            }
            break format_sequence;

          default:
            self.$raise($$($nesting, 'ArgumentError'), "" + "malformed format string - %" + (format_string.charAt(i)))
          }
        }

        if (str === undefined) {
          self.$raise($$($nesting, 'ArgumentError'), "malformed format string - %")
        }

        result += format_string.slice(begin_slice, end_slice) + str;
        begin_slice = i + 1;
      }

      if ($gvars.DEBUG && pos_arg_num >= 0 && seq_arg_num < args.length) {
        self.$raise($$($nesting, 'ArgumentError'), "too many arguments for format string")
      }

      return result + format_string.slice(begin_slice);
    ;
    }, TMP_Kernel_format_24.$$arity = -2);
    
    Opal.def(self, '$hash', TMP_Kernel_hash_25 = function $$hash() {
      var self = this;

      return self.$__id__()
    }, TMP_Kernel_hash_25.$$arity = 0);
    
    Opal.def(self, '$initialize_copy', TMP_Kernel_initialize_copy_26 = function $$initialize_copy(other) {
      var self = this;

      return nil
    }, TMP_Kernel_initialize_copy_26.$$arity = 1);
    
    Opal.def(self, '$inspect', TMP_Kernel_inspect_27 = function $$inspect() {
      var self = this;

      return self.$to_s()
    }, TMP_Kernel_inspect_27.$$arity = 0);
    
    Opal.def(self, '$instance_of?', TMP_Kernel_instance_of$q_28 = function(klass) {
      var self = this;

      
      if (!klass.$$is_class && !klass.$$is_module) {
        self.$raise($$($nesting, 'TypeError'), "class or module required");
      }

      return self.$$class === klass;
    
    }, TMP_Kernel_instance_of$q_28.$$arity = 1);
    
    Opal.def(self, '$instance_variable_defined?', TMP_Kernel_instance_variable_defined$q_29 = function(name) {
      var self = this;

      
      name = $$($nesting, 'Opal')['$instance_variable_name!'](name);
      return Opal.hasOwnProperty.call(self, name.substr(1));;
    }, TMP_Kernel_instance_variable_defined$q_29.$$arity = 1);
    
    Opal.def(self, '$instance_variable_get', TMP_Kernel_instance_variable_get_30 = function $$instance_variable_get(name) {
      var self = this;

      
      name = $$($nesting, 'Opal')['$instance_variable_name!'](name);
      
      var ivar = self[Opal.ivar(name.substr(1))];

      return ivar == null ? nil : ivar;
    ;
    }, TMP_Kernel_instance_variable_get_30.$$arity = 1);
    
    Opal.def(self, '$instance_variable_set', TMP_Kernel_instance_variable_set_31 = function $$instance_variable_set(name, value) {
      var self = this;

      
      name = $$($nesting, 'Opal')['$instance_variable_name!'](name);
      return self[Opal.ivar(name.substr(1))] = value;;
    }, TMP_Kernel_instance_variable_set_31.$$arity = 2);
    
    Opal.def(self, '$remove_instance_variable', TMP_Kernel_remove_instance_variable_32 = function $$remove_instance_variable(name) {
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
    }, TMP_Kernel_remove_instance_variable_32.$$arity = 1);
    
    Opal.def(self, '$instance_variables', TMP_Kernel_instance_variables_33 = function $$instance_variables() {
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
    
    }, TMP_Kernel_instance_variables_33.$$arity = 0);
    
    Opal.def(self, '$Integer', TMP_Kernel_Integer_34 = function $$Integer(value, base) {
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
    }, TMP_Kernel_Integer_34.$$arity = -2);
    
    Opal.def(self, '$Float', TMP_Kernel_Float_35 = function $$Float(value) {
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
    
    }, TMP_Kernel_Float_35.$$arity = 1);
    
    Opal.def(self, '$Hash', TMP_Kernel_Hash_36 = function $$Hash(arg) {
      var $a, self = this;

      
      if ($truthy(($truthy($a = arg['$nil?']()) ? $a : arg['$==']([])))) {
        return $hash2([], {})};
      if ($truthy($$($nesting, 'Hash')['$==='](arg))) {
        return arg};
      return $$($nesting, 'Opal')['$coerce_to!'](arg, $$($nesting, 'Hash'), "to_hash");
    }, TMP_Kernel_Hash_36.$$arity = 1);
    
    Opal.def(self, '$is_a?', TMP_Kernel_is_a$q_37 = function(klass) {
      var self = this;

      
      if (!klass.$$is_class && !klass.$$is_module) {
        self.$raise($$($nesting, 'TypeError'), "class or module required");
      }

      return Opal.is_a(self, klass);
    
    }, TMP_Kernel_is_a$q_37.$$arity = 1);
    
    Opal.def(self, '$itself', TMP_Kernel_itself_38 = function $$itself() {
      var self = this;

      return self
    }, TMP_Kernel_itself_38.$$arity = 0);
    Opal.alias(self, "kind_of?", "is_a?");
    
    Opal.def(self, '$lambda', TMP_Kernel_lambda_39 = function $$lambda() {
      var $iter = TMP_Kernel_lambda_39.$$p, block = $iter || nil, self = this;

      if ($iter) TMP_Kernel_lambda_39.$$p = null;
      
      
      if ($iter) TMP_Kernel_lambda_39.$$p = null;;
      return Opal.lambda(block);;
    }, TMP_Kernel_lambda_39.$$arity = 0);
    
    Opal.def(self, '$load', TMP_Kernel_load_40 = function $$load(file) {
      var self = this;

      
      file = $$($nesting, 'Opal')['$coerce_to!'](file, $$($nesting, 'String'), "to_str");
      return Opal.load(file);
    }, TMP_Kernel_load_40.$$arity = 1);
    
    Opal.def(self, '$loop', TMP_Kernel_loop_41 = function $$loop() {
      var TMP_42, $a, $iter = TMP_Kernel_loop_41.$$p, $yield = $iter || nil, self = this, e = nil;

      if ($iter) TMP_Kernel_loop_41.$$p = null;
      
      if (($yield !== nil)) {
      } else {
        return $send(self, 'enum_for', ["loop"], (TMP_42 = function(){var self = TMP_42.$$s || this;

        return $$$($$($nesting, 'Float'), 'INFINITY')}, TMP_42.$$s = self, TMP_42.$$arity = 0, TMP_42))
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
    }, TMP_Kernel_loop_41.$$arity = 0);
    
    Opal.def(self, '$nil?', TMP_Kernel_nil$q_43 = function() {
      var self = this;

      return false
    }, TMP_Kernel_nil$q_43.$$arity = 0);
    Opal.alias(self, "object_id", "__id__");
    
    Opal.def(self, '$printf', TMP_Kernel_printf_44 = function $$printf($a) {
      var $post_args, args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      if ($truthy(args['$any?']())) {
        self.$print($send(self, 'format', Opal.to_a(args)))};
      return nil;
    }, TMP_Kernel_printf_44.$$arity = -1);
    
    Opal.def(self, '$proc', TMP_Kernel_proc_45 = function $$proc() {
      var $iter = TMP_Kernel_proc_45.$$p, block = $iter || nil, self = this;

      if ($iter) TMP_Kernel_proc_45.$$p = null;
      
      
      if ($iter) TMP_Kernel_proc_45.$$p = null;;
      if ($truthy(block)) {
      } else {
        self.$raise($$($nesting, 'ArgumentError'), "tried to create Proc object without a block")
      };
      block.$$is_lambda = false;
      return block;
    }, TMP_Kernel_proc_45.$$arity = 0);
    
    Opal.def(self, '$puts', TMP_Kernel_puts_46 = function $$puts($a) {
      var $post_args, strs, self = this;
      if ($gvars.stdout == null) $gvars.stdout = nil;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      strs = $post_args;;
      return $send($gvars.stdout, 'puts', Opal.to_a(strs));
    }, TMP_Kernel_puts_46.$$arity = -1);
    
    Opal.def(self, '$p', TMP_Kernel_p_47 = function $$p($a) {
      var $post_args, args, TMP_48, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      $send(args, 'each', [], (TMP_48 = function(obj){var self = TMP_48.$$s || this;
        if ($gvars.stdout == null) $gvars.stdout = nil;

      
        
        if (obj == null) {
          obj = nil;
        };
        return $gvars.stdout.$puts(obj.$inspect());}, TMP_48.$$s = self, TMP_48.$$arity = 1, TMP_48));
      if ($truthy($rb_le(args.$length(), 1))) {
        return args['$[]'](0)
      } else {
        return args
      };
    }, TMP_Kernel_p_47.$$arity = -1);
    
    Opal.def(self, '$print', TMP_Kernel_print_49 = function $$print($a) {
      var $post_args, strs, self = this;
      if ($gvars.stdout == null) $gvars.stdout = nil;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      strs = $post_args;;
      return $send($gvars.stdout, 'print', Opal.to_a(strs));
    }, TMP_Kernel_print_49.$$arity = -1);
    
    Opal.def(self, '$warn', TMP_Kernel_warn_50 = function $$warn($a) {
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
    }, TMP_Kernel_warn_50.$$arity = -1);
    
    Opal.def(self, '$raise', TMP_Kernel_raise_51 = function $$raise(exception, string, _backtrace) {
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
    }, TMP_Kernel_raise_51.$$arity = -1);
    Opal.alias(self, "fail", "raise");
    
    Opal.def(self, '$rand', TMP_Kernel_rand_52 = function $$rand(max) {
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
    }, TMP_Kernel_rand_52.$$arity = -1);
    
    Opal.def(self, '$respond_to?', TMP_Kernel_respond_to$q_53 = function(name, include_all) {
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
    }, TMP_Kernel_respond_to$q_53.$$arity = -2);
    
    Opal.def(self, '$respond_to_missing?', TMP_Kernel_respond_to_missing$q_54 = function(method_name, include_all) {
      var self = this;

      
      
      if (include_all == null) {
        include_all = false;
      };
      return false;
    }, TMP_Kernel_respond_to_missing$q_54.$$arity = -2);
    
    Opal.def(self, '$require', TMP_Kernel_require_55 = function $$require(file) {
      var self = this;

      
      file = $$($nesting, 'Opal')['$coerce_to!'](file, $$($nesting, 'String'), "to_str");
      return Opal.require(file);
    }, TMP_Kernel_require_55.$$arity = 1);
    
    Opal.def(self, '$require_relative', TMP_Kernel_require_relative_56 = function $$require_relative(file) {
      var self = this;

      
      $$($nesting, 'Opal')['$try_convert!'](file, $$($nesting, 'String'), "to_str");
      file = $$($nesting, 'File').$expand_path($$($nesting, 'File').$join(Opal.current_file, "..", file));
      return Opal.require(file);
    }, TMP_Kernel_require_relative_56.$$arity = 1);
    
    Opal.def(self, '$require_tree', TMP_Kernel_require_tree_57 = function $$require_tree(path) {
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
    
    }, TMP_Kernel_require_tree_57.$$arity = 1);
    Opal.alias(self, "send", "__send__");
    Opal.alias(self, "public_send", "__send__");
    
    Opal.def(self, '$singleton_class', TMP_Kernel_singleton_class_58 = function $$singleton_class() {
      var self = this;

      return Opal.get_singleton_class(self);
    }, TMP_Kernel_singleton_class_58.$$arity = 0);
    
    Opal.def(self, '$sleep', TMP_Kernel_sleep_59 = function $$sleep(seconds) {
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
    }, TMP_Kernel_sleep_59.$$arity = -1);
    Opal.alias(self, "sprintf", "format");
    
    Opal.def(self, '$srand', TMP_Kernel_srand_60 = function $$srand(seed) {
      var self = this;

      
      
      if (seed == null) {
        seed = $$($nesting, 'Random').$new_seed();
      };
      return $$($nesting, 'Random').$srand(seed);
    }, TMP_Kernel_srand_60.$$arity = -1);
    
    Opal.def(self, '$String', TMP_Kernel_String_61 = function $$String(str) {
      var $a, self = this;

      return ($truthy($a = $$($nesting, 'Opal')['$coerce_to?'](str, $$($nesting, 'String'), "to_str")) ? $a : $$($nesting, 'Opal')['$coerce_to!'](str, $$($nesting, 'String'), "to_s"))
    }, TMP_Kernel_String_61.$$arity = 1);
    
    Opal.def(self, '$tap', TMP_Kernel_tap_62 = function $$tap() {
      var $iter = TMP_Kernel_tap_62.$$p, block = $iter || nil, self = this;

      if ($iter) TMP_Kernel_tap_62.$$p = null;
      
      
      if ($iter) TMP_Kernel_tap_62.$$p = null;;
      Opal.yield1(block, self);
      return self;
    }, TMP_Kernel_tap_62.$$arity = 0);
    
    Opal.def(self, '$to_proc', TMP_Kernel_to_proc_63 = function $$to_proc() {
      var self = this;

      return self
    }, TMP_Kernel_to_proc_63.$$arity = 0);
    
    Opal.def(self, '$to_s', TMP_Kernel_to_s_64 = function $$to_s() {
      var self = this;

      return "" + "#<" + (self.$class()) + ":0x" + (self.$__id__().$to_s(16)) + ">"
    }, TMP_Kernel_to_s_64.$$arity = 0);
    
    Opal.def(self, '$catch', TMP_Kernel_catch_65 = function(sym) {
      var $iter = TMP_Kernel_catch_65.$$p, $yield = $iter || nil, self = this, e = nil;

      if ($iter) TMP_Kernel_catch_65.$$p = null;
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
    }, TMP_Kernel_catch_65.$$arity = 1);
    
    Opal.def(self, '$throw', TMP_Kernel_throw_66 = function($a) {
      var $post_args, args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      return self.$raise($$($nesting, 'UncaughtThrowError'), args);
    }, TMP_Kernel_throw_66.$$arity = -1);
    
    Opal.def(self, '$open', TMP_Kernel_open_67 = function $$open($a) {
      var $iter = TMP_Kernel_open_67.$$p, block = $iter || nil, $post_args, args, self = this;

      if ($iter) TMP_Kernel_open_67.$$p = null;
      
      
      if ($iter) TMP_Kernel_open_67.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      return $send($$($nesting, 'File'), 'open', Opal.to_a(args), block.$to_proc());
    }, TMP_Kernel_open_67.$$arity = -1);
    
    Opal.def(self, '$yield_self', TMP_Kernel_yield_self_68 = function $$yield_self() {
      var TMP_69, $iter = TMP_Kernel_yield_self_68.$$p, $yield = $iter || nil, self = this;

      if ($iter) TMP_Kernel_yield_self_68.$$p = null;
      
      if (($yield !== nil)) {
      } else {
        return $send(self, 'enum_for', ["yield_self"], (TMP_69 = function(){var self = TMP_69.$$s || this;

        return 1}, TMP_69.$$s = self, TMP_69.$$arity = 0, TMP_69))
      };
      return Opal.yield1($yield, self);;
    }, TMP_Kernel_yield_self_68.$$arity = 0);
  })($nesting[0], $nesting);
  return (function($base, $super, $parent_nesting) {
    function $Object(){};
    var self = $Object = $klass($base, $super, 'Object', $Object);

    var def = self.prototype, $nesting = [self].concat($parent_nesting);

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
    function $Exception(){};
    var self = $Exception = $klass($base, $super, 'Exception', $Exception);

    var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_Exception_new_1, TMP_Exception_exception_2, TMP_Exception_initialize_3, TMP_Exception_backtrace_4, TMP_Exception_exception_5, TMP_Exception_message_6, TMP_Exception_inspect_7, TMP_Exception_set_backtrace_8, TMP_Exception_to_s_9;

    def.message = nil;
    
    var stack_trace_limit;
    Opal.defs(self, '$new', TMP_Exception_new_1 = function($a) {
      var $post_args, args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      
      var message   = (args.length > 0) ? args[0] : nil;
      var error     = new self(message);
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
    }, TMP_Exception_new_1.$$arity = -1);
    stack_trace_limit = self.$new;
    Opal.defs(self, '$exception', TMP_Exception_exception_2 = function $$exception($a) {
      var $post_args, args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      return $send(self, 'new', Opal.to_a(args));
    }, TMP_Exception_exception_2.$$arity = -1);
    
    Opal.def(self, '$initialize', TMP_Exception_initialize_3 = function $$initialize($a) {
      var $post_args, args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      return self.message = (args.length > 0) ? args[0] : nil;;
    }, TMP_Exception_initialize_3.$$arity = -1);
    
    Opal.def(self, '$backtrace', TMP_Exception_backtrace_4 = function $$backtrace() {
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
    
    }, TMP_Exception_backtrace_4.$$arity = 0);
    
    Opal.def(self, '$exception', TMP_Exception_exception_5 = function $$exception(str) {
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
    }, TMP_Exception_exception_5.$$arity = -1);
    
    Opal.def(self, '$message', TMP_Exception_message_6 = function $$message() {
      var self = this;

      return self.$to_s()
    }, TMP_Exception_message_6.$$arity = 0);
    
    Opal.def(self, '$inspect', TMP_Exception_inspect_7 = function $$inspect() {
      var self = this, as_str = nil;

      
      as_str = self.$to_s();
      if ($truthy(as_str['$empty?']())) {
        return self.$class().$to_s()
      } else {
        return "" + "#<" + (self.$class().$to_s()) + ": " + (self.$to_s()) + ">"
      };
    }, TMP_Exception_inspect_7.$$arity = 0);
    
    Opal.def(self, '$set_backtrace', TMP_Exception_set_backtrace_8 = function $$set_backtrace(backtrace) {
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
    
    }, TMP_Exception_set_backtrace_8.$$arity = 1);
    return (Opal.def(self, '$to_s', TMP_Exception_to_s_9 = function $$to_s() {
      var $a, $b, self = this;

      return ($truthy($a = ($truthy($b = self.message) ? self.message.$to_s() : $b)) ? $a : self.$class().$to_s())
    }, TMP_Exception_to_s_9.$$arity = 0), nil) && 'to_s';
  })($nesting[0], Error, $nesting);
  (function($base, $super, $parent_nesting) {
    function $ScriptError(){};
    var self = $ScriptError = $klass($base, $super, 'ScriptError', $ScriptError);

    var def = self.prototype, $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'Exception'), $nesting);
  (function($base, $super, $parent_nesting) {
    function $SyntaxError(){};
    var self = $SyntaxError = $klass($base, $super, 'SyntaxError', $SyntaxError);

    var def = self.prototype, $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'ScriptError'), $nesting);
  (function($base, $super, $parent_nesting) {
    function $LoadError(){};
    var self = $LoadError = $klass($base, $super, 'LoadError', $LoadError);

    var def = self.prototype, $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'ScriptError'), $nesting);
  (function($base, $super, $parent_nesting) {
    function $NotImplementedError(){};
    var self = $NotImplementedError = $klass($base, $super, 'NotImplementedError', $NotImplementedError);

    var def = self.prototype, $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'ScriptError'), $nesting);
  (function($base, $super, $parent_nesting) {
    function $SystemExit(){};
    var self = $SystemExit = $klass($base, $super, 'SystemExit', $SystemExit);

    var def = self.prototype, $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'Exception'), $nesting);
  (function($base, $super, $parent_nesting) {
    function $NoMemoryError(){};
    var self = $NoMemoryError = $klass($base, $super, 'NoMemoryError', $NoMemoryError);

    var def = self.prototype, $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'Exception'), $nesting);
  (function($base, $super, $parent_nesting) {
    function $SignalException(){};
    var self = $SignalException = $klass($base, $super, 'SignalException', $SignalException);

    var def = self.prototype, $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'Exception'), $nesting);
  (function($base, $super, $parent_nesting) {
    function $Interrupt(){};
    var self = $Interrupt = $klass($base, $super, 'Interrupt', $Interrupt);

    var def = self.prototype, $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'Exception'), $nesting);
  (function($base, $super, $parent_nesting) {
    function $SecurityError(){};
    var self = $SecurityError = $klass($base, $super, 'SecurityError', $SecurityError);

    var def = self.prototype, $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'Exception'), $nesting);
  (function($base, $super, $parent_nesting) {
    function $StandardError(){};
    var self = $StandardError = $klass($base, $super, 'StandardError', $StandardError);

    var def = self.prototype, $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'Exception'), $nesting);
  (function($base, $super, $parent_nesting) {
    function $EncodingError(){};
    var self = $EncodingError = $klass($base, $super, 'EncodingError', $EncodingError);

    var def = self.prototype, $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'StandardError'), $nesting);
  (function($base, $super, $parent_nesting) {
    function $ZeroDivisionError(){};
    var self = $ZeroDivisionError = $klass($base, $super, 'ZeroDivisionError', $ZeroDivisionError);

    var def = self.prototype, $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'StandardError'), $nesting);
  (function($base, $super, $parent_nesting) {
    function $NameError(){};
    var self = $NameError = $klass($base, $super, 'NameError', $NameError);

    var def = self.prototype, $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'StandardError'), $nesting);
  (function($base, $super, $parent_nesting) {
    function $NoMethodError(){};
    var self = $NoMethodError = $klass($base, $super, 'NoMethodError', $NoMethodError);

    var def = self.prototype, $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'NameError'), $nesting);
  (function($base, $super, $parent_nesting) {
    function $RuntimeError(){};
    var self = $RuntimeError = $klass($base, $super, 'RuntimeError', $RuntimeError);

    var def = self.prototype, $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'StandardError'), $nesting);
  (function($base, $super, $parent_nesting) {
    function $FrozenError(){};
    var self = $FrozenError = $klass($base, $super, 'FrozenError', $FrozenError);

    var def = self.prototype, $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'RuntimeError'), $nesting);
  (function($base, $super, $parent_nesting) {
    function $LocalJumpError(){};
    var self = $LocalJumpError = $klass($base, $super, 'LocalJumpError', $LocalJumpError);

    var def = self.prototype, $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'StandardError'), $nesting);
  (function($base, $super, $parent_nesting) {
    function $TypeError(){};
    var self = $TypeError = $klass($base, $super, 'TypeError', $TypeError);

    var def = self.prototype, $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'StandardError'), $nesting);
  (function($base, $super, $parent_nesting) {
    function $ArgumentError(){};
    var self = $ArgumentError = $klass($base, $super, 'ArgumentError', $ArgumentError);

    var def = self.prototype, $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'StandardError'), $nesting);
  (function($base, $super, $parent_nesting) {
    function $IndexError(){};
    var self = $IndexError = $klass($base, $super, 'IndexError', $IndexError);

    var def = self.prototype, $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'StandardError'), $nesting);
  (function($base, $super, $parent_nesting) {
    function $StopIteration(){};
    var self = $StopIteration = $klass($base, $super, 'StopIteration', $StopIteration);

    var def = self.prototype, $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'IndexError'), $nesting);
  (function($base, $super, $parent_nesting) {
    function $KeyError(){};
    var self = $KeyError = $klass($base, $super, 'KeyError', $KeyError);

    var def = self.prototype, $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'IndexError'), $nesting);
  (function($base, $super, $parent_nesting) {
    function $RangeError(){};
    var self = $RangeError = $klass($base, $super, 'RangeError', $RangeError);

    var def = self.prototype, $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'StandardError'), $nesting);
  (function($base, $super, $parent_nesting) {
    function $FloatDomainError(){};
    var self = $FloatDomainError = $klass($base, $super, 'FloatDomainError', $FloatDomainError);

    var def = self.prototype, $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'RangeError'), $nesting);
  (function($base, $super, $parent_nesting) {
    function $IOError(){};
    var self = $IOError = $klass($base, $super, 'IOError', $IOError);

    var def = self.prototype, $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'StandardError'), $nesting);
  (function($base, $super, $parent_nesting) {
    function $SystemCallError(){};
    var self = $SystemCallError = $klass($base, $super, 'SystemCallError', $SystemCallError);

    var def = self.prototype, $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'StandardError'), $nesting);
  (function($base, $parent_nesting) {
    function $Errno() {};
    var self = $Errno = $module($base, 'Errno', $Errno);

    var def = self.prototype, $nesting = [self].concat($parent_nesting);

    (function($base, $super, $parent_nesting) {
      function $EINVAL(){};
      var self = $EINVAL = $klass($base, $super, 'EINVAL', $EINVAL);

      var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_EINVAL_new_10;

      return (Opal.defs(self, '$new', TMP_EINVAL_new_10 = function(name) {
        var $iter = TMP_EINVAL_new_10.$$p, $yield = $iter || nil, self = this, message = nil;

        if ($iter) TMP_EINVAL_new_10.$$p = null;
        
        
        if (name == null) {
          name = nil;
        };
        message = "Invalid argument";
        if ($truthy(name)) {
          message = $rb_plus(message, "" + " - " + (name))};
        return $send(self, Opal.find_super_dispatcher(self, 'new', TMP_EINVAL_new_10, false, $EINVAL), [message], null);
      }, TMP_EINVAL_new_10.$$arity = -1), nil) && 'new'
    })($nesting[0], $$($nesting, 'SystemCallError'), $nesting)
  })($nesting[0], $nesting);
  (function($base, $super, $parent_nesting) {
    function $UncaughtThrowError(){};
    var self = $UncaughtThrowError = $klass($base, $super, 'UncaughtThrowError', $UncaughtThrowError);

    var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_UncaughtThrowError_initialize_11;

    def.sym = nil;
    
    self.$attr_reader("sym", "arg");
    return (Opal.def(self, '$initialize', TMP_UncaughtThrowError_initialize_11 = function $$initialize(args) {
      var $iter = TMP_UncaughtThrowError_initialize_11.$$p, $yield = $iter || nil, self = this;

      if ($iter) TMP_UncaughtThrowError_initialize_11.$$p = null;
      
      self.sym = args['$[]'](0);
      if ($truthy($rb_gt(args.$length(), 1))) {
        self.arg = args['$[]'](1)};
      return $send(self, Opal.find_super_dispatcher(self, 'initialize', TMP_UncaughtThrowError_initialize_11, false), ["" + "uncaught throw " + (self.sym.$inspect())], null);
    }, TMP_UncaughtThrowError_initialize_11.$$arity = 1), nil) && 'initialize';
  })($nesting[0], $$($nesting, 'ArgumentError'), $nesting);
  (function($base, $super, $parent_nesting) {
    function $NameError(){};
    var self = $NameError = $klass($base, $super, 'NameError', $NameError);

    var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_NameError_initialize_12;

    
    self.$attr_reader("name");
    return (Opal.def(self, '$initialize', TMP_NameError_initialize_12 = function $$initialize(message, name) {
      var $iter = TMP_NameError_initialize_12.$$p, $yield = $iter || nil, self = this;

      if ($iter) TMP_NameError_initialize_12.$$p = null;
      
      
      if (name == null) {
        name = nil;
      };
      $send(self, Opal.find_super_dispatcher(self, 'initialize', TMP_NameError_initialize_12, false), [message], null);
      return (self.name = name);
    }, TMP_NameError_initialize_12.$$arity = -2), nil) && 'initialize';
  })($nesting[0], null, $nesting);
  (function($base, $super, $parent_nesting) {
    function $NoMethodError(){};
    var self = $NoMethodError = $klass($base, $super, 'NoMethodError', $NoMethodError);

    var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_NoMethodError_initialize_13;

    
    self.$attr_reader("args");
    return (Opal.def(self, '$initialize', TMP_NoMethodError_initialize_13 = function $$initialize(message, name, args) {
      var $iter = TMP_NoMethodError_initialize_13.$$p, $yield = $iter || nil, self = this;

      if ($iter) TMP_NoMethodError_initialize_13.$$p = null;
      
      
      if (name == null) {
        name = nil;
      };
      
      if (args == null) {
        args = [];
      };
      $send(self, Opal.find_super_dispatcher(self, 'initialize', TMP_NoMethodError_initialize_13, false), [message, name], null);
      return (self.args = args);
    }, TMP_NoMethodError_initialize_13.$$arity = -2), nil) && 'initialize';
  })($nesting[0], null, $nesting);
  (function($base, $super, $parent_nesting) {
    function $StopIteration(){};
    var self = $StopIteration = $klass($base, $super, 'StopIteration', $StopIteration);

    var def = self.prototype, $nesting = [self].concat($parent_nesting);

    return self.$attr_reader("result")
  })($nesting[0], null, $nesting);
  (function($base, $super, $parent_nesting) {
    function $KeyError(){};
    var self = $KeyError = $klass($base, $super, 'KeyError', $KeyError);

    var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_KeyError_initialize_14, TMP_KeyError_receiver_15, TMP_KeyError_key_16;

    def.receiver = def.key = nil;
    
    
    Opal.def(self, '$initialize', TMP_KeyError_initialize_14 = function $$initialize(message, $kwargs) {
      var receiver, key, $iter = TMP_KeyError_initialize_14.$$p, $yield = $iter || nil, self = this;

      if ($iter) TMP_KeyError_initialize_14.$$p = null;
      
      
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
      $send(self, Opal.find_super_dispatcher(self, 'initialize', TMP_KeyError_initialize_14, false), [message], null);
      self.receiver = receiver;
      return (self.key = key);
    }, TMP_KeyError_initialize_14.$$arity = -2);
    
    Opal.def(self, '$receiver', TMP_KeyError_receiver_15 = function $$receiver() {
      var $a, self = this;

      return ($truthy($a = self.receiver) ? $a : self.$raise($$($nesting, 'ArgumentError'), "no receiver is available"))
    }, TMP_KeyError_receiver_15.$$arity = 0);
    return (Opal.def(self, '$key', TMP_KeyError_key_16 = function $$key() {
      var $a, self = this;

      return ($truthy($a = self.key) ? $a : self.$raise($$($nesting, 'ArgumentError'), "no key is available"))
    }, TMP_KeyError_key_16.$$arity = 0), nil) && 'key';
  })($nesting[0], null, $nesting);
  return (function($base, $parent_nesting) {
    function $JS() {};
    var self = $JS = $module($base, 'JS', $JS);

    var def = self.prototype, $nesting = [self].concat($parent_nesting);

    (function($base, $super, $parent_nesting) {
      function $Error(){};
      var self = $Error = $klass($base, $super, 'Error', $Error);

      var def = self.prototype, $nesting = [self].concat($parent_nesting);

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
    function $NilClass(){};
    var self = $NilClass = $klass($base, $super, 'NilClass', $NilClass);

    var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_NilClass_$B_2, TMP_NilClass_$_3, TMP_NilClass_$_4, TMP_NilClass_$_5, TMP_NilClass_$eq$eq_6, TMP_NilClass_dup_7, TMP_NilClass_clone_8, TMP_NilClass_inspect_9, TMP_NilClass_nil$q_10, TMP_NilClass_singleton_class_11, TMP_NilClass_to_a_12, TMP_NilClass_to_h_13, TMP_NilClass_to_i_14, TMP_NilClass_to_s_15, TMP_NilClass_to_c_16, TMP_NilClass_rationalize_17, TMP_NilClass_to_r_18, TMP_NilClass_instance_variables_19;

    
    def.$$meta = self;
    (function(self, $parent_nesting) {
      var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_allocate_1;

      
      
      Opal.def(self, '$allocate', TMP_allocate_1 = function $$allocate() {
        var self = this;

        return self.$raise($$($nesting, 'TypeError'), "" + "allocator undefined for " + (self.$name()))
      }, TMP_allocate_1.$$arity = 0);
      
      
      Opal.udef(self, '$' + "new");;
      return nil;;
    })(Opal.get_singleton_class(self), $nesting);
    
    Opal.def(self, '$!', TMP_NilClass_$B_2 = function() {
      var self = this;

      return true
    }, TMP_NilClass_$B_2.$$arity = 0);
    
    Opal.def(self, '$&', TMP_NilClass_$_3 = function(other) {
      var self = this;

      return false
    }, TMP_NilClass_$_3.$$arity = 1);
    
    Opal.def(self, '$|', TMP_NilClass_$_4 = function(other) {
      var self = this;

      return other !== false && other !== nil;
    }, TMP_NilClass_$_4.$$arity = 1);
    
    Opal.def(self, '$^', TMP_NilClass_$_5 = function(other) {
      var self = this;

      return other !== false && other !== nil;
    }, TMP_NilClass_$_5.$$arity = 1);
    
    Opal.def(self, '$==', TMP_NilClass_$eq$eq_6 = function(other) {
      var self = this;

      return other === nil;
    }, TMP_NilClass_$eq$eq_6.$$arity = 1);
    
    Opal.def(self, '$dup', TMP_NilClass_dup_7 = function $$dup() {
      var self = this;

      return nil
    }, TMP_NilClass_dup_7.$$arity = 0);
    
    Opal.def(self, '$clone', TMP_NilClass_clone_8 = function $$clone($kwargs) {
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
    }, TMP_NilClass_clone_8.$$arity = -1);
    
    Opal.def(self, '$inspect', TMP_NilClass_inspect_9 = function $$inspect() {
      var self = this;

      return "nil"
    }, TMP_NilClass_inspect_9.$$arity = 0);
    
    Opal.def(self, '$nil?', TMP_NilClass_nil$q_10 = function() {
      var self = this;

      return true
    }, TMP_NilClass_nil$q_10.$$arity = 0);
    
    Opal.def(self, '$singleton_class', TMP_NilClass_singleton_class_11 = function $$singleton_class() {
      var self = this;

      return $$($nesting, 'NilClass')
    }, TMP_NilClass_singleton_class_11.$$arity = 0);
    
    Opal.def(self, '$to_a', TMP_NilClass_to_a_12 = function $$to_a() {
      var self = this;

      return []
    }, TMP_NilClass_to_a_12.$$arity = 0);
    
    Opal.def(self, '$to_h', TMP_NilClass_to_h_13 = function $$to_h() {
      var self = this;

      return Opal.hash();
    }, TMP_NilClass_to_h_13.$$arity = 0);
    
    Opal.def(self, '$to_i', TMP_NilClass_to_i_14 = function $$to_i() {
      var self = this;

      return 0
    }, TMP_NilClass_to_i_14.$$arity = 0);
    Opal.alias(self, "to_f", "to_i");
    
    Opal.def(self, '$to_s', TMP_NilClass_to_s_15 = function $$to_s() {
      var self = this;

      return ""
    }, TMP_NilClass_to_s_15.$$arity = 0);
    
    Opal.def(self, '$to_c', TMP_NilClass_to_c_16 = function $$to_c() {
      var self = this;

      return $$($nesting, 'Complex').$new(0, 0)
    }, TMP_NilClass_to_c_16.$$arity = 0);
    
    Opal.def(self, '$rationalize', TMP_NilClass_rationalize_17 = function $$rationalize($a) {
      var $post_args, args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      if ($truthy($rb_gt(args.$length(), 1))) {
        self.$raise($$($nesting, 'ArgumentError'))};
      return self.$Rational(0, 1);
    }, TMP_NilClass_rationalize_17.$$arity = -1);
    
    Opal.def(self, '$to_r', TMP_NilClass_to_r_18 = function $$to_r() {
      var self = this;

      return self.$Rational(0, 1)
    }, TMP_NilClass_to_r_18.$$arity = 0);
    return (Opal.def(self, '$instance_variables', TMP_NilClass_instance_variables_19 = function $$instance_variables() {
      var self = this;

      return []
    }, TMP_NilClass_instance_variables_19.$$arity = 0), nil) && 'instance_variables';
  })($nesting[0], null, $nesting);
  return Opal.const_set($nesting[0], 'NIL', nil);
};

/* Generated by Opal 0.11.99.dev */
Opal.modules["corelib/boolean"] = function(Opal) {
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice, $klass = Opal.klass, $hash2 = Opal.hash2;

  Opal.add_stubs(['$raise', '$name']);
  
  (function($base, $super, $parent_nesting) {
    function $Boolean(){};
    var self = $Boolean = $klass($base, $super, 'Boolean', $Boolean);

    var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_Boolean___id___2, TMP_Boolean_$B_3, TMP_Boolean_$_4, TMP_Boolean_$_5, TMP_Boolean_$_6, TMP_Boolean_$eq$eq_7, TMP_Boolean_singleton_class_8, TMP_Boolean_to_s_9, TMP_Boolean_dup_10, TMP_Boolean_clone_11;

    
    Opal.defineProperty(Boolean.prototype, '$$is_boolean', true);
    Opal.defineProperty(Boolean.prototype, '$$meta', self);
    (function(self, $parent_nesting) {
      var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_allocate_1;

      
      
      Opal.def(self, '$allocate', TMP_allocate_1 = function $$allocate() {
        var self = this;

        return self.$raise($$($nesting, 'TypeError'), "" + "allocator undefined for " + (self.$name()))
      }, TMP_allocate_1.$$arity = 0);
      
      
      Opal.udef(self, '$' + "new");;
      return nil;;
    })(Opal.get_singleton_class(self), $nesting);
    
    Opal.def(self, '$__id__', TMP_Boolean___id___2 = function $$__id__() {
      var self = this;

      return self.valueOf() ? 2 : 0;
    }, TMP_Boolean___id___2.$$arity = 0);
    Opal.alias(self, "object_id", "__id__");
    
    Opal.def(self, '$!', TMP_Boolean_$B_3 = function() {
      var self = this;

      return self != true;
    }, TMP_Boolean_$B_3.$$arity = 0);
    
    Opal.def(self, '$&', TMP_Boolean_$_4 = function(other) {
      var self = this;

      return (self == true) ? (other !== false && other !== nil) : false;
    }, TMP_Boolean_$_4.$$arity = 1);
    
    Opal.def(self, '$|', TMP_Boolean_$_5 = function(other) {
      var self = this;

      return (self == true) ? true : (other !== false && other !== nil);
    }, TMP_Boolean_$_5.$$arity = 1);
    
    Opal.def(self, '$^', TMP_Boolean_$_6 = function(other) {
      var self = this;

      return (self == true) ? (other === false || other === nil) : (other !== false && other !== nil);
    }, TMP_Boolean_$_6.$$arity = 1);
    
    Opal.def(self, '$==', TMP_Boolean_$eq$eq_7 = function(other) {
      var self = this;

      return (self == true) === other.valueOf();
    }, TMP_Boolean_$eq$eq_7.$$arity = 1);
    Opal.alias(self, "equal?", "==");
    Opal.alias(self, "eql?", "==");
    
    Opal.def(self, '$singleton_class', TMP_Boolean_singleton_class_8 = function $$singleton_class() {
      var self = this;

      return $$($nesting, 'Boolean')
    }, TMP_Boolean_singleton_class_8.$$arity = 0);
    
    Opal.def(self, '$to_s', TMP_Boolean_to_s_9 = function $$to_s() {
      var self = this;

      return (self == true) ? 'true' : 'false';
    }, TMP_Boolean_to_s_9.$$arity = 0);
    
    Opal.def(self, '$dup', TMP_Boolean_dup_10 = function $$dup() {
      var self = this;

      return self
    }, TMP_Boolean_dup_10.$$arity = 0);
    return (Opal.def(self, '$clone', TMP_Boolean_clone_11 = function $$clone($kwargs) {
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
    }, TMP_Boolean_clone_11.$$arity = -1), nil) && 'clone';
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
    function $Comparable() {};
    var self = $Comparable = $module($base, 'Comparable', $Comparable);

    var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_Comparable_normalize_1, TMP_Comparable_$eq$eq_2, TMP_Comparable_$gt_3, TMP_Comparable_$gt$eq_4, TMP_Comparable_$lt_5, TMP_Comparable_$lt$eq_6, TMP_Comparable_between$q_7, TMP_Comparable_clamp_8;

    
    Opal.defs(self, '$normalize', TMP_Comparable_normalize_1 = function $$normalize(what) {
      var self = this;

      
      if ($truthy($$($nesting, 'Integer')['$==='](what))) {
        return what};
      if ($truthy($rb_gt(what, 0))) {
        return 1};
      if ($truthy($rb_lt(what, 0))) {
        return -1};
      return 0;
    }, TMP_Comparable_normalize_1.$$arity = 1);
    
    Opal.def(self, '$==', TMP_Comparable_$eq$eq_2 = function(other) {
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
    }, TMP_Comparable_$eq$eq_2.$$arity = 1);
    
    Opal.def(self, '$>', TMP_Comparable_$gt_3 = function(other) {
      var self = this, cmp = nil;

      
      if ($truthy((cmp = self['$<=>'](other)))) {
      } else {
        self.$raise($$($nesting, 'ArgumentError'), "" + "comparison of " + (self.$class()) + " with " + (other.$class()) + " failed")
      };
      return $$($nesting, 'Comparable').$normalize(cmp) > 0;
    }, TMP_Comparable_$gt_3.$$arity = 1);
    
    Opal.def(self, '$>=', TMP_Comparable_$gt$eq_4 = function(other) {
      var self = this, cmp = nil;

      
      if ($truthy((cmp = self['$<=>'](other)))) {
      } else {
        self.$raise($$($nesting, 'ArgumentError'), "" + "comparison of " + (self.$class()) + " with " + (other.$class()) + " failed")
      };
      return $$($nesting, 'Comparable').$normalize(cmp) >= 0;
    }, TMP_Comparable_$gt$eq_4.$$arity = 1);
    
    Opal.def(self, '$<', TMP_Comparable_$lt_5 = function(other) {
      var self = this, cmp = nil;

      
      if ($truthy((cmp = self['$<=>'](other)))) {
      } else {
        self.$raise($$($nesting, 'ArgumentError'), "" + "comparison of " + (self.$class()) + " with " + (other.$class()) + " failed")
      };
      return $$($nesting, 'Comparable').$normalize(cmp) < 0;
    }, TMP_Comparable_$lt_5.$$arity = 1);
    
    Opal.def(self, '$<=', TMP_Comparable_$lt$eq_6 = function(other) {
      var self = this, cmp = nil;

      
      if ($truthy((cmp = self['$<=>'](other)))) {
      } else {
        self.$raise($$($nesting, 'ArgumentError'), "" + "comparison of " + (self.$class()) + " with " + (other.$class()) + " failed")
      };
      return $$($nesting, 'Comparable').$normalize(cmp) <= 0;
    }, TMP_Comparable_$lt$eq_6.$$arity = 1);
    
    Opal.def(self, '$between?', TMP_Comparable_between$q_7 = function(min, max) {
      var self = this;

      
      if ($rb_lt(self, min)) {
        return false};
      if ($rb_gt(self, max)) {
        return false};
      return true;
    }, TMP_Comparable_between$q_7.$$arity = 2);
    
    Opal.def(self, '$clamp', TMP_Comparable_clamp_8 = function $$clamp(min, max) {
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
    }, TMP_Comparable_clamp_8.$$arity = 2);
  })($nesting[0], $nesting)
};

/* Generated by Opal 0.11.99.dev */
Opal.modules["corelib/regexp"] = function(Opal) {
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice, $klass = Opal.klass, $send = Opal.send, $truthy = Opal.truthy, $gvars = Opal.gvars;

  Opal.add_stubs(['$nil?', '$[]', '$raise', '$escape', '$options', '$to_str', '$new', '$join', '$coerce_to!', '$!', '$match', '$coerce_to?', '$begin', '$coerce_to', '$=~', '$attr_reader', '$===', '$inspect', '$to_a']);
  
  (function($base, $super, $parent_nesting) {
    function $RegexpError(){};
    var self = $RegexpError = $klass($base, $super, 'RegexpError', $RegexpError);

    var def = self.prototype, $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'StandardError'), $nesting);
  (function($base, $super, $parent_nesting) {
    function $Regexp(){};
    var self = $Regexp = $klass($base, $super, 'Regexp', $Regexp);

    var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_Regexp_$eq$eq_6, TMP_Regexp_$eq$eq$eq_7, TMP_Regexp_$eq$_8, TMP_Regexp_inspect_9, TMP_Regexp_match_10, TMP_Regexp_match$q_11, TMP_Regexp_$_12, TMP_Regexp_source_13, TMP_Regexp_options_14, TMP_Regexp_casefold$q_15;

    
    Opal.const_set($nesting[0], 'IGNORECASE', 1);
    Opal.const_set($nesting[0], 'EXTENDED', 2);
    Opal.const_set($nesting[0], 'MULTILINE', 4);
    Opal.defineProperty(RegExp.prototype, '$$is_regexp', true);
    (function(self, $parent_nesting) {
      var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_allocate_1, TMP_escape_2, TMP_last_match_3, TMP_union_4, TMP_new_5;

      
      
      Opal.def(self, '$allocate', TMP_allocate_1 = function $$allocate() {
        var $iter = TMP_allocate_1.$$p, $yield = $iter || nil, self = this, allocated = nil, $zuper = nil, $zuper_i = nil, $zuper_ii = nil;

        if ($iter) TMP_allocate_1.$$p = null;
        // Prepare super implicit arguments
        for($zuper_i = 0, $zuper_ii = arguments.length, $zuper = new Array($zuper_ii); $zuper_i < $zuper_ii; $zuper_i++) {
          $zuper[$zuper_i] = arguments[$zuper_i];
        }
        
        allocated = $send(self, Opal.find_super_dispatcher(self, 'allocate', TMP_allocate_1, false), $zuper, $iter);
        allocated.uninitialized = true;
        return allocated;
      }, TMP_allocate_1.$$arity = 0);
      
      Opal.def(self, '$escape', TMP_escape_2 = function $$escape(string) {
        var self = this;

        return Opal.escape_regexp(string);
      }, TMP_escape_2.$$arity = 1);
      
      Opal.def(self, '$last_match', TMP_last_match_3 = function $$last_match(n) {
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
      }, TMP_last_match_3.$$arity = -1);
      Opal.alias(self, "quote", "escape");
      
      Opal.def(self, '$union', TMP_union_4 = function $$union($a) {
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
      }, TMP_union_4.$$arity = -1);
      return (Opal.def(self, '$new', TMP_new_5 = function(regexp, options) {
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
      }, TMP_new_5.$$arity = -2), nil) && 'new';
    })(Opal.get_singleton_class(self), $nesting);
    
    Opal.def(self, '$==', TMP_Regexp_$eq$eq_6 = function(other) {
      var self = this;

      return other instanceof RegExp && self.toString() === other.toString();
    }, TMP_Regexp_$eq$eq_6.$$arity = 1);
    
    Opal.def(self, '$===', TMP_Regexp_$eq$eq$eq_7 = function(string) {
      var self = this;

      return self.$match($$($nesting, 'Opal')['$coerce_to?'](string, $$($nesting, 'String'), "to_str")) !== nil
    }, TMP_Regexp_$eq$eq$eq_7.$$arity = 1);
    
    Opal.def(self, '$=~', TMP_Regexp_$eq$_8 = function(string) {
      var $a, self = this;
      if ($gvars["~"] == null) $gvars["~"] = nil;

      return ($truthy($a = self.$match(string)) ? $gvars["~"].$begin(0) : $a)
    }, TMP_Regexp_$eq$_8.$$arity = 1);
    Opal.alias(self, "eql?", "==");
    
    Opal.def(self, '$inspect', TMP_Regexp_inspect_9 = function $$inspect() {
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
    
    }, TMP_Regexp_inspect_9.$$arity = 0);
    
    Opal.def(self, '$match', TMP_Regexp_match_10 = function $$match(string, pos) {
      var $iter = TMP_Regexp_match_10.$$p, block = $iter || nil, self = this;
      if ($gvars["~"] == null) $gvars["~"] = nil;

      if ($iter) TMP_Regexp_match_10.$$p = null;
      
      
      if ($iter) TMP_Regexp_match_10.$$p = null;;
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
    }, TMP_Regexp_match_10.$$arity = -2);
    
    Opal.def(self, '$match?', TMP_Regexp_match$q_11 = function(string, pos) {
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
    }, TMP_Regexp_match$q_11.$$arity = -2);
    
    Opal.def(self, '$~', TMP_Regexp_$_12 = function() {
      var self = this;
      if ($gvars._ == null) $gvars._ = nil;

      return self['$=~']($gvars._)
    }, TMP_Regexp_$_12.$$arity = 0);
    
    Opal.def(self, '$source', TMP_Regexp_source_13 = function $$source() {
      var self = this;

      return self.source;
    }, TMP_Regexp_source_13.$$arity = 0);
    
    Opal.def(self, '$options', TMP_Regexp_options_14 = function $$options() {
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
    
    }, TMP_Regexp_options_14.$$arity = 0);
    
    Opal.def(self, '$casefold?', TMP_Regexp_casefold$q_15 = function() {
      var self = this;

      return self.ignoreCase;
    }, TMP_Regexp_casefold$q_15.$$arity = 0);
    return Opal.alias(self, "to_s", "source");
  })($nesting[0], RegExp, $nesting);
  return (function($base, $super, $parent_nesting) {
    function $MatchData(){};
    var self = $MatchData = $klass($base, $super, 'MatchData', $MatchData);

    var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_MatchData_initialize_16, TMP_MatchData_$$_17, TMP_MatchData_offset_18, TMP_MatchData_$eq$eq_19, TMP_MatchData_begin_20, TMP_MatchData_end_21, TMP_MatchData_captures_22, TMP_MatchData_inspect_23, TMP_MatchData_length_24, TMP_MatchData_to_a_25, TMP_MatchData_to_s_26, TMP_MatchData_values_at_27;

    def.matches = nil;
    
    self.$attr_reader("post_match", "pre_match", "regexp", "string");
    
    Opal.def(self, '$initialize', TMP_MatchData_initialize_16 = function $$initialize(regexp, match_groups) {
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
    }, TMP_MatchData_initialize_16.$$arity = 2);
    
    Opal.def(self, '$[]', TMP_MatchData_$$_17 = function($a) {
      var $post_args, args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      return $send(self.matches, '[]', Opal.to_a(args));
    }, TMP_MatchData_$$_17.$$arity = -1);
    
    Opal.def(self, '$offset', TMP_MatchData_offset_18 = function $$offset(n) {
      var self = this;

      
      if (n !== 0) {
        self.$raise($$($nesting, 'ArgumentError'), "MatchData#offset only supports 0th element")
      }
      return [self.begin, self.begin + self.matches[n].length];
    
    }, TMP_MatchData_offset_18.$$arity = 1);
    
    Opal.def(self, '$==', TMP_MatchData_$eq$eq_19 = function(other) {
      var $a, $b, $c, $d, self = this;

      
      if ($truthy($$($nesting, 'MatchData')['$==='](other))) {
      } else {
        return false
      };
      return ($truthy($a = ($truthy($b = ($truthy($c = ($truthy($d = self.string == other.string) ? self.regexp.toString() == other.regexp.toString() : $d)) ? self.pre_match == other.pre_match : $c)) ? self.post_match == other.post_match : $b)) ? self.begin == other.begin : $a);
    }, TMP_MatchData_$eq$eq_19.$$arity = 1);
    Opal.alias(self, "eql?", "==");
    
    Opal.def(self, '$begin', TMP_MatchData_begin_20 = function $$begin(n) {
      var self = this;

      
      if (n !== 0) {
        self.$raise($$($nesting, 'ArgumentError'), "MatchData#begin only supports 0th element")
      }
      return self.begin;
    
    }, TMP_MatchData_begin_20.$$arity = 1);
    
    Opal.def(self, '$end', TMP_MatchData_end_21 = function $$end(n) {
      var self = this;

      
      if (n !== 0) {
        self.$raise($$($nesting, 'ArgumentError'), "MatchData#end only supports 0th element")
      }
      return self.begin + self.matches[n].length;
    
    }, TMP_MatchData_end_21.$$arity = 1);
    
    Opal.def(self, '$captures', TMP_MatchData_captures_22 = function $$captures() {
      var self = this;

      return self.matches.slice(1)
    }, TMP_MatchData_captures_22.$$arity = 0);
    
    Opal.def(self, '$inspect', TMP_MatchData_inspect_23 = function $$inspect() {
      var self = this;

      
      var str = "#<MatchData " + (self.matches[0]).$inspect();

      for (var i = 1, length = self.matches.length; i < length; i++) {
        str += " " + i + ":" + (self.matches[i]).$inspect();
      }

      return str + ">";
    
    }, TMP_MatchData_inspect_23.$$arity = 0);
    
    Opal.def(self, '$length', TMP_MatchData_length_24 = function $$length() {
      var self = this;

      return self.matches.length
    }, TMP_MatchData_length_24.$$arity = 0);
    Opal.alias(self, "size", "length");
    
    Opal.def(self, '$to_a', TMP_MatchData_to_a_25 = function $$to_a() {
      var self = this;

      return self.matches
    }, TMP_MatchData_to_a_25.$$arity = 0);
    
    Opal.def(self, '$to_s', TMP_MatchData_to_s_26 = function $$to_s() {
      var self = this;

      return self.matches[0]
    }, TMP_MatchData_to_s_26.$$arity = 0);
    return (Opal.def(self, '$values_at', TMP_MatchData_values_at_27 = function $$values_at($a) {
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
    }, TMP_MatchData_values_at_27.$$arity = -1), nil) && 'values_at';
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
    function $String(){};
    var self = $String = $klass($base, $super, 'String', $String);

    var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_String___id___1, TMP_String_try_convert_2, TMP_String_new_3, TMP_String_initialize_4, TMP_String_$_5, TMP_String_$_6, TMP_String_$_7, TMP_String_$lt$eq$gt_8, TMP_String_$eq$eq_9, TMP_String_$eq$_10, TMP_String_$$_11, TMP_String_b_12, TMP_String_capitalize_13, TMP_String_casecmp_14, TMP_String_casecmp$q_15, TMP_String_center_16, TMP_String_chars_17, TMP_String_chomp_18, TMP_String_chop_19, TMP_String_chr_20, TMP_String_clone_21, TMP_String_dup_22, TMP_String_count_23, TMP_String_delete_24, TMP_String_delete_prefix_25, TMP_String_delete_suffix_26, TMP_String_downcase_27, TMP_String_each_char_28, TMP_String_each_line_30, TMP_String_empty$q_31, TMP_String_end_with$q_32, TMP_String_gsub_33, TMP_String_hash_34, TMP_String_hex_35, TMP_String_include$q_36, TMP_String_index_37, TMP_String_inspect_38, TMP_String_intern_39, TMP_String_lines_40, TMP_String_length_41, TMP_String_ljust_42, TMP_String_lstrip_43, TMP_String_ascii_only$q_44, TMP_String_match_45, TMP_String_match$q_46, TMP_String_next_47, TMP_String_oct_48, TMP_String_ord_49, TMP_String_partition_50, TMP_String_reverse_51, TMP_String_rindex_52, TMP_String_rjust_53, TMP_String_rpartition_54, TMP_String_rstrip_55, TMP_String_scan_56, TMP_String_split_57, TMP_String_squeeze_58, TMP_String_start_with$q_59, TMP_String_strip_60, TMP_String_sub_61, TMP_String_sum_62, TMP_String_swapcase_63, TMP_String_to_f_64, TMP_String_to_i_65, TMP_String_to_proc_66, TMP_String_to_s_68, TMP_String_tr_69, TMP_String_tr_s_70, TMP_String_upcase_71, TMP_String_upto_72, TMP_String_instance_variables_73, TMP_String__load_74, TMP_String_unicode_normalize_75, TMP_String_unicode_normalized$q_76, TMP_String_unpack_77, TMP_String_unpack1_78;

    
    self.$include($$($nesting, 'Comparable'));
    
    Opal.defineProperty(String.prototype, '$$is_string', true);

    Opal.defineProperty(String.prototype, '$$cast', function(string) {
      var klass = this.$$class;
      if (klass === String) {
        return string;
      } else {
        return new klass(string);
      }
    });
  ;
    
    Opal.def(self, '$__id__', TMP_String___id___1 = function $$__id__() {
      var self = this;

      return self.toString();
    }, TMP_String___id___1.$$arity = 0);
    Opal.alias(self, "object_id", "__id__");
    Opal.defs(self, '$try_convert', TMP_String_try_convert_2 = function $$try_convert(what) {
      var self = this;

      return $$($nesting, 'Opal')['$coerce_to?'](what, $$($nesting, 'String'), "to_str")
    }, TMP_String_try_convert_2.$$arity = 1);
    Opal.defs(self, '$new', TMP_String_new_3 = function(str) {
      var self = this;

      
      
      if (str == null) {
        str = "";
      };
      str = $$($nesting, 'Opal').$coerce_to(str, $$($nesting, 'String'), "to_str");
      return new self(str);;
    }, TMP_String_new_3.$$arity = -1);
    
    Opal.def(self, '$initialize', TMP_String_initialize_4 = function $$initialize(str) {
      var self = this;

      
      ;
      
      if (str === undefined) {
        return self;
      }
    ;
      return self.$raise($$($nesting, 'NotImplementedError'), "Mutable strings are not supported in Opal.");
    }, TMP_String_initialize_4.$$arity = -1);
    
    Opal.def(self, '$%', TMP_String_$_5 = function(data) {
      var self = this;

      if ($truthy($$($nesting, 'Array')['$==='](data))) {
        return $send(self, 'format', [self].concat(Opal.to_a(data)))
      } else {
        return self.$format(self, data)
      }
    }, TMP_String_$_5.$$arity = 1);
    
    Opal.def(self, '$*', TMP_String_$_6 = function(count) {
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
    
    }, TMP_String_$_6.$$arity = 1);
    
    Opal.def(self, '$+', TMP_String_$_7 = function(other) {
      var self = this;

      
      other = $$($nesting, 'Opal').$coerce_to(other, $$($nesting, 'String'), "to_str");
      return self + other.$to_s();
    }, TMP_String_$_7.$$arity = 1);
    
    Opal.def(self, '$<=>', TMP_String_$lt$eq$gt_8 = function(other) {
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
    }, TMP_String_$lt$eq$gt_8.$$arity = 1);
    
    Opal.def(self, '$==', TMP_String_$eq$eq_9 = function(other) {
      var self = this;

      
      if (other.$$is_string) {
        return self.toString() === other.toString();
      }
      if ($$($nesting, 'Opal')['$respond_to?'](other, "to_str")) {
        return other['$=='](self);
      }
      return false;
    
    }, TMP_String_$eq$eq_9.$$arity = 1);
    Opal.alias(self, "eql?", "==");
    Opal.alias(self, "===", "==");
    
    Opal.def(self, '$=~', TMP_String_$eq$_10 = function(other) {
      var self = this;

      
      if (other.$$is_string) {
        self.$raise($$($nesting, 'TypeError'), "type mismatch: String given");
      }

      return other['$=~'](self);
    
    }, TMP_String_$eq$_10.$$arity = 1);
    
    Opal.def(self, '$[]', TMP_String_$$_11 = function(index, length) {
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
    }, TMP_String_$$_11.$$arity = -2);
    Opal.alias(self, "byteslice", "[]");
    
    Opal.def(self, '$b', TMP_String_b_12 = function $$b() {
      var self = this;

      return self.$force_encoding("binary")
    }, TMP_String_b_12.$$arity = 0);
    
    Opal.def(self, '$capitalize', TMP_String_capitalize_13 = function $$capitalize() {
      var self = this;

      return self.$$cast(self.charAt(0).toUpperCase() + self.substr(1).toLowerCase());
    }, TMP_String_capitalize_13.$$arity = 0);
    
    Opal.def(self, '$casecmp', TMP_String_casecmp_14 = function $$casecmp(other) {
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
    }, TMP_String_casecmp_14.$$arity = 1);
    
    Opal.def(self, '$casecmp?', TMP_String_casecmp$q_15 = function(other) {
      var self = this;

      
      var cmp = self.$casecmp(other);
      if (cmp === nil) {
        return nil;
      } else {
        return cmp === 0;
      }
    
    }, TMP_String_casecmp$q_15.$$arity = 1);
    
    Opal.def(self, '$center', TMP_String_center_16 = function $$center(width, padstr) {
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
    }, TMP_String_center_16.$$arity = -2);
    
    Opal.def(self, '$chars', TMP_String_chars_17 = function $$chars() {
      var $iter = TMP_String_chars_17.$$p, block = $iter || nil, self = this;

      if ($iter) TMP_String_chars_17.$$p = null;
      
      
      if ($iter) TMP_String_chars_17.$$p = null;;
      if ($truthy(block)) {
      } else {
        return self.$each_char().$to_a()
      };
      return $send(self, 'each_char', [], block.$to_proc());
    }, TMP_String_chars_17.$$arity = 0);
    
    Opal.def(self, '$chomp', TMP_String_chomp_18 = function $$chomp(separator) {
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
      else if (self.length > separator.length) {
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
    }, TMP_String_chomp_18.$$arity = -1);
    
    Opal.def(self, '$chop', TMP_String_chop_19 = function $$chop() {
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
    
    }, TMP_String_chop_19.$$arity = 0);
    
    Opal.def(self, '$chr', TMP_String_chr_20 = function $$chr() {
      var self = this;

      return self.charAt(0);
    }, TMP_String_chr_20.$$arity = 0);
    
    Opal.def(self, '$clone', TMP_String_clone_21 = function $$clone() {
      var self = this, copy = nil;

      
      copy = self.slice();
      copy.$copy_singleton_methods(self);
      copy.$initialize_clone(self);
      return copy;
    }, TMP_String_clone_21.$$arity = 0);
    
    Opal.def(self, '$dup', TMP_String_dup_22 = function $$dup() {
      var self = this, copy = nil;

      
      copy = self.slice();
      copy.$initialize_dup(self);
      return copy;
    }, TMP_String_dup_22.$$arity = 0);
    
    Opal.def(self, '$count', TMP_String_count_23 = function $$count($a) {
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
    }, TMP_String_count_23.$$arity = -1);
    
    Opal.def(self, '$delete', TMP_String_delete_24 = function($a) {
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
    }, TMP_String_delete_24.$$arity = -1);
    
    Opal.def(self, '$delete_prefix', TMP_String_delete_prefix_25 = function $$delete_prefix(prefix) {
      var self = this;

      
      if (!prefix.$$is_string) {
        (prefix = $$($nesting, 'Opal').$coerce_to(prefix, $$($nesting, 'String'), "to_str"))
      }

      if (self.slice(0, prefix.length) === prefix) {
        return self.$$cast(self.slice(prefix.length));
      } else {
        return self;
      }
    
    }, TMP_String_delete_prefix_25.$$arity = 1);
    
    Opal.def(self, '$delete_suffix', TMP_String_delete_suffix_26 = function $$delete_suffix(suffix) {
      var self = this;

      
      if (!suffix.$$is_string) {
        (suffix = $$($nesting, 'Opal').$coerce_to(suffix, $$($nesting, 'String'), "to_str"))
      }

      if (self.slice(self.length - suffix.length) === suffix) {
        return self.$$cast(self.slice(0, self.length - suffix.length));
      } else {
        return self;
      }
    
    }, TMP_String_delete_suffix_26.$$arity = 1);
    
    Opal.def(self, '$downcase', TMP_String_downcase_27 = function $$downcase() {
      var self = this;

      return self.$$cast(self.toLowerCase());
    }, TMP_String_downcase_27.$$arity = 0);
    
    Opal.def(self, '$each_char', TMP_String_each_char_28 = function $$each_char() {
      var $iter = TMP_String_each_char_28.$$p, block = $iter || nil, TMP_29, self = this;

      if ($iter) TMP_String_each_char_28.$$p = null;
      
      
      if ($iter) TMP_String_each_char_28.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["each_char"], (TMP_29 = function(){var self = TMP_29.$$s || this;

        return self.$size()}, TMP_29.$$s = self, TMP_29.$$arity = 0, TMP_29))
      };
      
      for (var i = 0, length = self.length; i < length; i++) {
        Opal.yield1(block, self.charAt(i));
      }
    ;
      return self;
    }, TMP_String_each_char_28.$$arity = 0);
    
    Opal.def(self, '$each_line', TMP_String_each_line_30 = function $$each_line(separator) {
      var $iter = TMP_String_each_line_30.$$p, block = $iter || nil, self = this;
      if ($gvars["/"] == null) $gvars["/"] = nil;

      if ($iter) TMP_String_each_line_30.$$p = null;
      
      
      if ($iter) TMP_String_each_line_30.$$p = null;;
      
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
    }, TMP_String_each_line_30.$$arity = -1);
    
    Opal.def(self, '$empty?', TMP_String_empty$q_31 = function() {
      var self = this;

      return self.length === 0;
    }, TMP_String_empty$q_31.$$arity = 0);
    
    Opal.def(self, '$end_with?', TMP_String_end_with$q_32 = function($a) {
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
    }, TMP_String_end_with$q_32.$$arity = -1);
    Opal.alias(self, "equal?", "===");
    
    Opal.def(self, '$gsub', TMP_String_gsub_33 = function $$gsub(pattern, replacement) {
      var $iter = TMP_String_gsub_33.$$p, block = $iter || nil, self = this;

      if ($iter) TMP_String_gsub_33.$$p = null;
      
      
      if ($iter) TMP_String_gsub_33.$$p = null;;
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
    }, TMP_String_gsub_33.$$arity = -2);
    
    Opal.def(self, '$hash', TMP_String_hash_34 = function $$hash() {
      var self = this;

      return self.toString();
    }, TMP_String_hash_34.$$arity = 0);
    
    Opal.def(self, '$hex', TMP_String_hex_35 = function $$hex() {
      var self = this;

      return self.$to_i(16)
    }, TMP_String_hex_35.$$arity = 0);
    
    Opal.def(self, '$include?', TMP_String_include$q_36 = function(other) {
      var self = this;

      
      if (!other.$$is_string) {
        (other = $$($nesting, 'Opal').$coerce_to(other, $$($nesting, 'String'), "to_str"))
      }
      return self.indexOf(other) !== -1;
    
    }, TMP_String_include$q_36.$$arity = 1);
    
    Opal.def(self, '$index', TMP_String_index_37 = function $$index(search, offset) {
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
    }, TMP_String_index_37.$$arity = -2);
    
    Opal.def(self, '$inspect', TMP_String_inspect_38 = function $$inspect() {
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
    
    }, TMP_String_inspect_38.$$arity = 0);
    
    Opal.def(self, '$intern', TMP_String_intern_39 = function $$intern() {
      var self = this;

      return self.toString();
    }, TMP_String_intern_39.$$arity = 0);
    
    Opal.def(self, '$lines', TMP_String_lines_40 = function $$lines(separator) {
      var $iter = TMP_String_lines_40.$$p, block = $iter || nil, self = this, e = nil;
      if ($gvars["/"] == null) $gvars["/"] = nil;

      if ($iter) TMP_String_lines_40.$$p = null;
      
      
      if ($iter) TMP_String_lines_40.$$p = null;;
      
      if (separator == null) {
        separator = $gvars["/"];
      };
      e = $send(self, 'each_line', [separator], block.$to_proc());
      if ($truthy(block)) {
        return self
      } else {
        return e.$to_a()
      };
    }, TMP_String_lines_40.$$arity = -1);
    
    Opal.def(self, '$length', TMP_String_length_41 = function $$length() {
      var self = this;

      return self.length;
    }, TMP_String_length_41.$$arity = 0);
    
    Opal.def(self, '$ljust', TMP_String_ljust_42 = function $$ljust(width, padstr) {
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
    }, TMP_String_ljust_42.$$arity = -2);
    
    Opal.def(self, '$lstrip', TMP_String_lstrip_43 = function $$lstrip() {
      var self = this;

      return self.replace(/^\s*/, '');
    }, TMP_String_lstrip_43.$$arity = 0);
    
    Opal.def(self, '$ascii_only?', TMP_String_ascii_only$q_44 = function() {
      var self = this;

      return self.match(/[ -~\n]*/)[0] === self;
    }, TMP_String_ascii_only$q_44.$$arity = 0);
    
    Opal.def(self, '$match', TMP_String_match_45 = function $$match(pattern, pos) {
      var $iter = TMP_String_match_45.$$p, block = $iter || nil, $a, self = this;

      if ($iter) TMP_String_match_45.$$p = null;
      
      
      if ($iter) TMP_String_match_45.$$p = null;;
      ;
      if ($truthy(($truthy($a = $$($nesting, 'String')['$==='](pattern)) ? $a : pattern['$respond_to?']("to_str")))) {
        pattern = $$($nesting, 'Regexp').$new(pattern.$to_str())};
      if ($truthy($$($nesting, 'Regexp')['$==='](pattern))) {
      } else {
        self.$raise($$($nesting, 'TypeError'), "" + "wrong argument type " + (pattern.$class()) + " (expected Regexp)")
      };
      return $send(pattern, 'match', [self, pos], block.$to_proc());
    }, TMP_String_match_45.$$arity = -2);
    
    Opal.def(self, '$match?', TMP_String_match$q_46 = function(pattern, pos) {
      var $a, self = this;

      
      ;
      if ($truthy(($truthy($a = $$($nesting, 'String')['$==='](pattern)) ? $a : pattern['$respond_to?']("to_str")))) {
        pattern = $$($nesting, 'Regexp').$new(pattern.$to_str())};
      if ($truthy($$($nesting, 'Regexp')['$==='](pattern))) {
      } else {
        self.$raise($$($nesting, 'TypeError'), "" + "wrong argument type " + (pattern.$class()) + " (expected Regexp)")
      };
      return pattern['$match?'](self, pos);
    }, TMP_String_match$q_46.$$arity = -2);
    
    Opal.def(self, '$next', TMP_String_next_47 = function $$next() {
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
    
    }, TMP_String_next_47.$$arity = 0);
    
    Opal.def(self, '$oct', TMP_String_oct_48 = function $$oct() {
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
    
    }, TMP_String_oct_48.$$arity = 0);
    
    Opal.def(self, '$ord', TMP_String_ord_49 = function $$ord() {
      var self = this;

      return self.charCodeAt(0);
    }, TMP_String_ord_49.$$arity = 0);
    
    Opal.def(self, '$partition', TMP_String_partition_50 = function $$partition(sep) {
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
    
    }, TMP_String_partition_50.$$arity = 1);
    
    Opal.def(self, '$reverse', TMP_String_reverse_51 = function $$reverse() {
      var self = this;

      return self.split('').reverse().join('');
    }, TMP_String_reverse_51.$$arity = 0);
    
    Opal.def(self, '$rindex', TMP_String_rindex_52 = function $$rindex(search, offset) {
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
    }, TMP_String_rindex_52.$$arity = -2);
    
    Opal.def(self, '$rjust', TMP_String_rjust_53 = function $$rjust(width, padstr) {
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
    }, TMP_String_rjust_53.$$arity = -2);
    
    Opal.def(self, '$rpartition', TMP_String_rpartition_54 = function $$rpartition(sep) {
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
    
    }, TMP_String_rpartition_54.$$arity = 1);
    
    Opal.def(self, '$rstrip', TMP_String_rstrip_55 = function $$rstrip() {
      var self = this;

      return self.replace(/[\s\u0000]*$/, '');
    }, TMP_String_rstrip_55.$$arity = 0);
    
    Opal.def(self, '$scan', TMP_String_scan_56 = function $$scan(pattern) {
      var $iter = TMP_String_scan_56.$$p, block = $iter || nil, self = this;

      if ($iter) TMP_String_scan_56.$$p = null;
      
      
      if ($iter) TMP_String_scan_56.$$p = null;;
      
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
    }, TMP_String_scan_56.$$arity = 1);
    Opal.alias(self, "size", "length");
    Opal.alias(self, "slice", "[]");
    
    Opal.def(self, '$split', TMP_String_split_57 = function $$split(pattern, limit) {
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
    }, TMP_String_split_57.$$arity = -1);
    
    Opal.def(self, '$squeeze', TMP_String_squeeze_58 = function $$squeeze($a) {
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
    }, TMP_String_squeeze_58.$$arity = -1);
    
    Opal.def(self, '$start_with?', TMP_String_start_with$q_59 = function($a) {
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
    }, TMP_String_start_with$q_59.$$arity = -1);
    
    Opal.def(self, '$strip', TMP_String_strip_60 = function $$strip() {
      var self = this;

      return self.replace(/^\s*/, '').replace(/[\s\u0000]*$/, '');
    }, TMP_String_strip_60.$$arity = 0);
    
    Opal.def(self, '$sub', TMP_String_sub_61 = function $$sub(pattern, replacement) {
      var $iter = TMP_String_sub_61.$$p, block = $iter || nil, self = this;

      if ($iter) TMP_String_sub_61.$$p = null;
      
      
      if ($iter) TMP_String_sub_61.$$p = null;;
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
    }, TMP_String_sub_61.$$arity = -2);
    Opal.alias(self, "succ", "next");
    
    Opal.def(self, '$sum', TMP_String_sum_62 = function $$sum(n) {
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
    }, TMP_String_sum_62.$$arity = -1);
    
    Opal.def(self, '$swapcase', TMP_String_swapcase_63 = function $$swapcase() {
      var self = this;

      
      var str = self.replace(/([a-z]+)|([A-Z]+)/g, function($0,$1,$2) {
        return $1 ? $0.toUpperCase() : $0.toLowerCase();
      });

      if (self.constructor === String) {
        return str;
      }

      return self.$class().$new(str);
    
    }, TMP_String_swapcase_63.$$arity = 0);
    
    Opal.def(self, '$to_f', TMP_String_to_f_64 = function $$to_f() {
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
    
    }, TMP_String_to_f_64.$$arity = 0);
    
    Opal.def(self, '$to_i', TMP_String_to_i_65 = function $$to_i(base) {
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
    }, TMP_String_to_i_65.$$arity = -1);
    
    Opal.def(self, '$to_proc', TMP_String_to_proc_66 = function $$to_proc() {
      var TMP_67, $iter = TMP_String_to_proc_66.$$p, $yield = $iter || nil, self = this, method_name = nil;

      if ($iter) TMP_String_to_proc_66.$$p = null;
      
      method_name = $rb_plus("$", self.valueOf());
      return $send(self, 'proc', [], (TMP_67 = function($a){var self = TMP_67.$$s || this, $iter = TMP_67.$$p, block = $iter || nil, $post_args, args;

      
        
        if ($iter) TMP_67.$$p = null;;
        
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
      ;}, TMP_67.$$s = self, TMP_67.$$arity = -1, TMP_67));
    }, TMP_String_to_proc_66.$$arity = 0);
    
    Opal.def(self, '$to_s', TMP_String_to_s_68 = function $$to_s() {
      var self = this;

      return self.toString();
    }, TMP_String_to_s_68.$$arity = 0);
    Opal.alias(self, "to_str", "to_s");
    Opal.alias(self, "to_sym", "intern");
    
    Opal.def(self, '$tr', TMP_String_tr_69 = function $$tr(from, to) {
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
    }, TMP_String_tr_69.$$arity = 2);
    
    Opal.def(self, '$tr_s', TMP_String_tr_s_70 = function $$tr_s(from, to) {
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
    }, TMP_String_tr_s_70.$$arity = 2);
    
    Opal.def(self, '$upcase', TMP_String_upcase_71 = function $$upcase() {
      var self = this;

      return self.$$cast(self.toUpperCase());
    }, TMP_String_upcase_71.$$arity = 0);
    
    Opal.def(self, '$upto', TMP_String_upto_72 = function $$upto(stop, excl) {
      var $iter = TMP_String_upto_72.$$p, block = $iter || nil, self = this;

      if ($iter) TMP_String_upto_72.$$p = null;
      
      
      if ($iter) TMP_String_upto_72.$$p = null;;
      
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
    }, TMP_String_upto_72.$$arity = -2);
    
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
    
    Opal.def(self, '$instance_variables', TMP_String_instance_variables_73 = function $$instance_variables() {
      var self = this;

      return []
    }, TMP_String_instance_variables_73.$$arity = 0);
    Opal.defs(self, '$_load', TMP_String__load_74 = function $$_load($a) {
      var $post_args, args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      return $send(self, 'new', Opal.to_a(args));
    }, TMP_String__load_74.$$arity = -1);
    
    Opal.def(self, '$unicode_normalize', TMP_String_unicode_normalize_75 = function $$unicode_normalize(form) {
      var self = this;

      
      ;
      return self.toString();;
    }, TMP_String_unicode_normalize_75.$$arity = -1);
    
    Opal.def(self, '$unicode_normalized?', TMP_String_unicode_normalized$q_76 = function(form) {
      var self = this;

      
      ;
      return true;
    }, TMP_String_unicode_normalized$q_76.$$arity = -1);
    
    Opal.def(self, '$unpack', TMP_String_unpack_77 = function $$unpack(format) {
      var self = this;

      return self.$raise("To use String#unpack, you must first require 'corelib/string/unpack'.")
    }, TMP_String_unpack_77.$$arity = 1);
    return (Opal.def(self, '$unpack1', TMP_String_unpack1_78 = function $$unpack1(format) {
      var self = this;

      return self.$raise("To use String#unpack1, you must first require 'corelib/string/unpack'.")
    }, TMP_String_unpack1_78.$$arity = 1), nil) && 'unpack1';
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
    function $Enumerable() {};
    var self = $Enumerable = $module($base, 'Enumerable', $Enumerable);

    var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_Enumerable_all$q_1, TMP_Enumerable_any$q_5, TMP_Enumerable_chunk_9, TMP_Enumerable_chunk_while_12, TMP_Enumerable_collect_14, TMP_Enumerable_collect_concat_16, TMP_Enumerable_count_19, TMP_Enumerable_cycle_23, TMP_Enumerable_detect_25, TMP_Enumerable_drop_27, TMP_Enumerable_drop_while_28, TMP_Enumerable_each_cons_29, TMP_Enumerable_each_entry_31, TMP_Enumerable_each_slice_33, TMP_Enumerable_each_with_index_35, TMP_Enumerable_each_with_object_37, TMP_Enumerable_entries_39, TMP_Enumerable_find_all_40, TMP_Enumerable_find_index_42, TMP_Enumerable_first_45, TMP_Enumerable_grep_48, TMP_Enumerable_grep_v_50, TMP_Enumerable_group_by_52, TMP_Enumerable_include$q_54, TMP_Enumerable_inject_56, TMP_Enumerable_lazy_57, TMP_Enumerable_enumerator_size_59, TMP_Enumerable_max_60, TMP_Enumerable_max_by_61, TMP_Enumerable_min_63, TMP_Enumerable_min_by_64, TMP_Enumerable_minmax_66, TMP_Enumerable_minmax_by_68, TMP_Enumerable_none$q_69, TMP_Enumerable_one$q_73, TMP_Enumerable_partition_77, TMP_Enumerable_reject_79, TMP_Enumerable_reverse_each_81, TMP_Enumerable_slice_before_83, TMP_Enumerable_slice_after_85, TMP_Enumerable_slice_when_88, TMP_Enumerable_sort_90, TMP_Enumerable_sort_by_92, TMP_Enumerable_sum_97, TMP_Enumerable_take_99, TMP_Enumerable_take_while_100, TMP_Enumerable_uniq_102, TMP_Enumerable_zip_104;

    
    
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
    
    Opal.def(self, '$all?', TMP_Enumerable_all$q_1 = function(pattern) {try {

      var $iter = TMP_Enumerable_all$q_1.$$p, block = $iter || nil, TMP_2, TMP_3, TMP_4, self = this;

      if ($iter) TMP_Enumerable_all$q_1.$$p = null;
      
      
      if ($iter) TMP_Enumerable_all$q_1.$$p = null;;
      ;
      if ($truthy(pattern !== undefined)) {
        $send(self, 'each', [], (TMP_2 = function($a){var self = TMP_2.$$s || this, $post_args, value, comparable = nil;

        
          
          $post_args = Opal.slice.call(arguments, 0, arguments.length);
          
          value = $post_args;;
          comparable = comparableForPattern(value);
          if ($truthy($send(pattern, 'public_send', ["==="].concat(Opal.to_a(comparable))))) {
            return nil
          } else {
            Opal.ret(false)
          };}, TMP_2.$$s = self, TMP_2.$$arity = -1, TMP_2))
      } else if ((block !== nil)) {
        $send(self, 'each', [], (TMP_3 = function($a){var self = TMP_3.$$s || this, $post_args, value;

        
          
          $post_args = Opal.slice.call(arguments, 0, arguments.length);
          
          value = $post_args;;
          if ($truthy(Opal.yieldX(block, Opal.to_a(value)))) {
            return nil
          } else {
            Opal.ret(false)
          };}, TMP_3.$$s = self, TMP_3.$$arity = -1, TMP_3))
      } else {
        $send(self, 'each', [], (TMP_4 = function($a){var self = TMP_4.$$s || this, $post_args, value;

        
          
          $post_args = Opal.slice.call(arguments, 0, arguments.length);
          
          value = $post_args;;
          if ($truthy($$($nesting, 'Opal').$destructure(value))) {
            return nil
          } else {
            Opal.ret(false)
          };}, TMP_4.$$s = self, TMP_4.$$arity = -1, TMP_4))
      };
      return true;
      } catch ($returner) { if ($returner === Opal.returner) { return $returner.$v } throw $returner; }
    }, TMP_Enumerable_all$q_1.$$arity = -1);
    
    Opal.def(self, '$any?', TMP_Enumerable_any$q_5 = function(pattern) {try {

      var $iter = TMP_Enumerable_any$q_5.$$p, block = $iter || nil, TMP_6, TMP_7, TMP_8, self = this;

      if ($iter) TMP_Enumerable_any$q_5.$$p = null;
      
      
      if ($iter) TMP_Enumerable_any$q_5.$$p = null;;
      ;
      if ($truthy(pattern !== undefined)) {
        $send(self, 'each', [], (TMP_6 = function($a){var self = TMP_6.$$s || this, $post_args, value, comparable = nil;

        
          
          $post_args = Opal.slice.call(arguments, 0, arguments.length);
          
          value = $post_args;;
          comparable = comparableForPattern(value);
          if ($truthy($send(pattern, 'public_send', ["==="].concat(Opal.to_a(comparable))))) {
            Opal.ret(true)
          } else {
            return nil
          };}, TMP_6.$$s = self, TMP_6.$$arity = -1, TMP_6))
      } else if ((block !== nil)) {
        $send(self, 'each', [], (TMP_7 = function($a){var self = TMP_7.$$s || this, $post_args, value;

        
          
          $post_args = Opal.slice.call(arguments, 0, arguments.length);
          
          value = $post_args;;
          if ($truthy(Opal.yieldX(block, Opal.to_a(value)))) {
            Opal.ret(true)
          } else {
            return nil
          };}, TMP_7.$$s = self, TMP_7.$$arity = -1, TMP_7))
      } else {
        $send(self, 'each', [], (TMP_8 = function($a){var self = TMP_8.$$s || this, $post_args, value;

        
          
          $post_args = Opal.slice.call(arguments, 0, arguments.length);
          
          value = $post_args;;
          if ($truthy($$($nesting, 'Opal').$destructure(value))) {
            Opal.ret(true)
          } else {
            return nil
          };}, TMP_8.$$s = self, TMP_8.$$arity = -1, TMP_8))
      };
      return false;
      } catch ($returner) { if ($returner === Opal.returner) { return $returner.$v } throw $returner; }
    }, TMP_Enumerable_any$q_5.$$arity = -1);
    
    Opal.def(self, '$chunk', TMP_Enumerable_chunk_9 = function $$chunk() {
      var $iter = TMP_Enumerable_chunk_9.$$p, block = $iter || nil, TMP_10, TMP_11, self = this;

      if ($iter) TMP_Enumerable_chunk_9.$$p = null;
      
      
      if ($iter) TMP_Enumerable_chunk_9.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'to_enum', ["chunk"], (TMP_10 = function(){var self = TMP_10.$$s || this;

        return self.$enumerator_size()}, TMP_10.$$s = self, TMP_10.$$arity = 0, TMP_10))
      };
      return $send($$$('::', 'Enumerator'), 'new', [], (TMP_11 = function(yielder){var self = TMP_11.$$s || this;

      
        
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
      ;}, TMP_11.$$s = self, TMP_11.$$arity = 1, TMP_11));
    }, TMP_Enumerable_chunk_9.$$arity = 0);
    
    Opal.def(self, '$chunk_while', TMP_Enumerable_chunk_while_12 = function $$chunk_while() {
      var $iter = TMP_Enumerable_chunk_while_12.$$p, block = $iter || nil, TMP_13, self = this;

      if ($iter) TMP_Enumerable_chunk_while_12.$$p = null;
      
      
      if ($iter) TMP_Enumerable_chunk_while_12.$$p = null;;
      if ((block !== nil)) {
      } else {
        self.$raise($$($nesting, 'ArgumentError'), "no block given")
      };
      return $send(self, 'slice_when', [], (TMP_13 = function(before, after){var self = TMP_13.$$s || this;

      
        
        if (before == null) {
          before = nil;
        };
        
        if (after == null) {
          after = nil;
        };
        return Opal.yieldX(block, [before, after])['$!']();}, TMP_13.$$s = self, TMP_13.$$arity = 2, TMP_13));
    }, TMP_Enumerable_chunk_while_12.$$arity = 0);
    
    Opal.def(self, '$collect', TMP_Enumerable_collect_14 = function $$collect() {
      var $iter = TMP_Enumerable_collect_14.$$p, block = $iter || nil, TMP_15, self = this;

      if ($iter) TMP_Enumerable_collect_14.$$p = null;
      
      
      if ($iter) TMP_Enumerable_collect_14.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["collect"], (TMP_15 = function(){var self = TMP_15.$$s || this;

        return self.$enumerator_size()}, TMP_15.$$s = self, TMP_15.$$arity = 0, TMP_15))
      };
      
      var result = [];

      self.$each.$$p = function() {
        var value = Opal.yieldX(block, arguments);

        result.push(value);
      };

      self.$each();

      return result;
    ;
    }, TMP_Enumerable_collect_14.$$arity = 0);
    
    Opal.def(self, '$collect_concat', TMP_Enumerable_collect_concat_16 = function $$collect_concat() {
      var $iter = TMP_Enumerable_collect_concat_16.$$p, block = $iter || nil, TMP_17, TMP_18, self = this;

      if ($iter) TMP_Enumerable_collect_concat_16.$$p = null;
      
      
      if ($iter) TMP_Enumerable_collect_concat_16.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["collect_concat"], (TMP_17 = function(){var self = TMP_17.$$s || this;

        return self.$enumerator_size()}, TMP_17.$$s = self, TMP_17.$$arity = 0, TMP_17))
      };
      return $send(self, 'map', [], (TMP_18 = function(item){var self = TMP_18.$$s || this;

      
        
        if (item == null) {
          item = nil;
        };
        return Opal.yield1(block, item);;}, TMP_18.$$s = self, TMP_18.$$arity = 1, TMP_18)).$flatten(1);
    }, TMP_Enumerable_collect_concat_16.$$arity = 0);
    
    Opal.def(self, '$count', TMP_Enumerable_count_19 = function $$count(object) {
      var $iter = TMP_Enumerable_count_19.$$p, block = $iter || nil, TMP_20, TMP_21, TMP_22, self = this, result = nil;

      if ($iter) TMP_Enumerable_count_19.$$p = null;
      
      
      if ($iter) TMP_Enumerable_count_19.$$p = null;;
      ;
      result = 0;
      
      if (object != null && block !== nil) {
        self.$warn("warning: given block not used")
      }
    ;
      if ($truthy(object != null)) {
        block = $send(self, 'proc', [], (TMP_20 = function($a){var self = TMP_20.$$s || this, $post_args, args;

        
          
          $post_args = Opal.slice.call(arguments, 0, arguments.length);
          
          args = $post_args;;
          return $$($nesting, 'Opal').$destructure(args)['$=='](object);}, TMP_20.$$s = self, TMP_20.$$arity = -1, TMP_20))
      } else if ($truthy(block['$nil?']())) {
        block = $send(self, 'proc', [], (TMP_21 = function(){var self = TMP_21.$$s || this;

        return true}, TMP_21.$$s = self, TMP_21.$$arity = 0, TMP_21))};
      $send(self, 'each', [], (TMP_22 = function($a){var self = TMP_22.$$s || this, $post_args, args;

      
        
        $post_args = Opal.slice.call(arguments, 0, arguments.length);
        
        args = $post_args;;
        if ($truthy(Opal.yieldX(block, args))) {
          return result++;
        } else {
          return nil
        };}, TMP_22.$$s = self, TMP_22.$$arity = -1, TMP_22));
      return result;
    }, TMP_Enumerable_count_19.$$arity = -1);
    
    Opal.def(self, '$cycle', TMP_Enumerable_cycle_23 = function $$cycle(n) {
      var $iter = TMP_Enumerable_cycle_23.$$p, block = $iter || nil, TMP_24, self = this;

      if ($iter) TMP_Enumerable_cycle_23.$$p = null;
      
      
      if ($iter) TMP_Enumerable_cycle_23.$$p = null;;
      
      if (n == null) {
        n = nil;
      };
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["cycle", n], (TMP_24 = function(){var self = TMP_24.$$s || this;

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
          }}, TMP_24.$$s = self, TMP_24.$$arity = 0, TMP_24))
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
    }, TMP_Enumerable_cycle_23.$$arity = -1);
    
    Opal.def(self, '$detect', TMP_Enumerable_detect_25 = function $$detect(ifnone) {try {

      var $iter = TMP_Enumerable_detect_25.$$p, block = $iter || nil, TMP_26, self = this;

      if ($iter) TMP_Enumerable_detect_25.$$p = null;
      
      
      if ($iter) TMP_Enumerable_detect_25.$$p = null;;
      ;
      if ((block !== nil)) {
      } else {
        return self.$enum_for("detect", ifnone)
      };
      $send(self, 'each', [], (TMP_26 = function($a){var self = TMP_26.$$s || this, $post_args, args, value = nil;

      
        
        $post_args = Opal.slice.call(arguments, 0, arguments.length);
        
        args = $post_args;;
        value = $$($nesting, 'Opal').$destructure(args);
        if ($truthy(Opal.yield1(block, value))) {
          Opal.ret(value)
        } else {
          return nil
        };}, TMP_26.$$s = self, TMP_26.$$arity = -1, TMP_26));
      
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
    }, TMP_Enumerable_detect_25.$$arity = -1);
    
    Opal.def(self, '$drop', TMP_Enumerable_drop_27 = function $$drop(number) {
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
    }, TMP_Enumerable_drop_27.$$arity = 1);
    
    Opal.def(self, '$drop_while', TMP_Enumerable_drop_while_28 = function $$drop_while() {
      var $iter = TMP_Enumerable_drop_while_28.$$p, block = $iter || nil, self = this;

      if ($iter) TMP_Enumerable_drop_while_28.$$p = null;
      
      
      if ($iter) TMP_Enumerable_drop_while_28.$$p = null;;
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
    }, TMP_Enumerable_drop_while_28.$$arity = 0);
    
    Opal.def(self, '$each_cons', TMP_Enumerable_each_cons_29 = function $$each_cons(n) {
      var $iter = TMP_Enumerable_each_cons_29.$$p, block = $iter || nil, TMP_30, self = this;

      if ($iter) TMP_Enumerable_each_cons_29.$$p = null;
      
      
      if ($iter) TMP_Enumerable_each_cons_29.$$p = null;;
      if ($truthy(arguments.length != 1)) {
        self.$raise($$($nesting, 'ArgumentError'), "" + "wrong number of arguments (" + (arguments.length) + " for 1)")};
      n = $$($nesting, 'Opal').$try_convert(n, $$($nesting, 'Integer'), "to_int");
      if ($truthy(n <= 0)) {
        self.$raise($$($nesting, 'ArgumentError'), "invalid size")};
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["each_cons", n], (TMP_30 = function(){var self = TMP_30.$$s || this, $a, enum_size = nil;

        
          enum_size = self.$enumerator_size();
          if ($truthy(enum_size['$nil?']())) {
            return nil
          } else if ($truthy(($truthy($a = enum_size['$=='](0)) ? $a : $rb_lt(enum_size, n)))) {
            return 0
          } else {
            return $rb_plus($rb_minus(enum_size, n), 1)
          };}, TMP_30.$$s = self, TMP_30.$$arity = 0, TMP_30))
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
    }, TMP_Enumerable_each_cons_29.$$arity = 1);
    
    Opal.def(self, '$each_entry', TMP_Enumerable_each_entry_31 = function $$each_entry($a) {
      var $iter = TMP_Enumerable_each_entry_31.$$p, block = $iter || nil, $post_args, data, TMP_32, self = this;

      if ($iter) TMP_Enumerable_each_entry_31.$$p = null;
      
      
      if ($iter) TMP_Enumerable_each_entry_31.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      data = $post_args;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'to_enum', ["each_entry"].concat(Opal.to_a(data)), (TMP_32 = function(){var self = TMP_32.$$s || this;

        return self.$enumerator_size()}, TMP_32.$$s = self, TMP_32.$$arity = 0, TMP_32))
      };
      
      self.$each.$$p = function() {
        var item = $$($nesting, 'Opal').$destructure(arguments);

        Opal.yield1(block, item);
      }

      self.$each.apply(self, data);

      return self;
    ;
    }, TMP_Enumerable_each_entry_31.$$arity = -1);
    
    Opal.def(self, '$each_slice', TMP_Enumerable_each_slice_33 = function $$each_slice(n) {
      var $iter = TMP_Enumerable_each_slice_33.$$p, block = $iter || nil, TMP_34, self = this;

      if ($iter) TMP_Enumerable_each_slice_33.$$p = null;
      
      
      if ($iter) TMP_Enumerable_each_slice_33.$$p = null;;
      n = $$($nesting, 'Opal').$coerce_to(n, $$($nesting, 'Integer'), "to_int");
      if ($truthy(n <= 0)) {
        self.$raise($$($nesting, 'ArgumentError'), "invalid slice size")};
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["each_slice", n], (TMP_34 = function(){var self = TMP_34.$$s || this;

        if ($truthy(self['$respond_to?']("size"))) {
            return $rb_divide(self.$size(), n).$ceil()
          } else {
            return nil
          }}, TMP_34.$$s = self, TMP_34.$$arity = 0, TMP_34))
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
    }, TMP_Enumerable_each_slice_33.$$arity = 1);
    
    Opal.def(self, '$each_with_index', TMP_Enumerable_each_with_index_35 = function $$each_with_index($a) {
      var $iter = TMP_Enumerable_each_with_index_35.$$p, block = $iter || nil, $post_args, args, TMP_36, self = this;

      if ($iter) TMP_Enumerable_each_with_index_35.$$p = null;
      
      
      if ($iter) TMP_Enumerable_each_with_index_35.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["each_with_index"].concat(Opal.to_a(args)), (TMP_36 = function(){var self = TMP_36.$$s || this;

        return self.$enumerator_size()}, TMP_36.$$s = self, TMP_36.$$arity = 0, TMP_36))
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
    }, TMP_Enumerable_each_with_index_35.$$arity = -1);
    
    Opal.def(self, '$each_with_object', TMP_Enumerable_each_with_object_37 = function $$each_with_object(object) {
      var $iter = TMP_Enumerable_each_with_object_37.$$p, block = $iter || nil, TMP_38, self = this;

      if ($iter) TMP_Enumerable_each_with_object_37.$$p = null;
      
      
      if ($iter) TMP_Enumerable_each_with_object_37.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["each_with_object", object], (TMP_38 = function(){var self = TMP_38.$$s || this;

        return self.$enumerator_size()}, TMP_38.$$s = self, TMP_38.$$arity = 0, TMP_38))
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
    }, TMP_Enumerable_each_with_object_37.$$arity = 1);
    
    Opal.def(self, '$entries', TMP_Enumerable_entries_39 = function $$entries($a) {
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
    }, TMP_Enumerable_entries_39.$$arity = -1);
    Opal.alias(self, "find", "detect");
    
    Opal.def(self, '$find_all', TMP_Enumerable_find_all_40 = function $$find_all() {
      var $iter = TMP_Enumerable_find_all_40.$$p, block = $iter || nil, TMP_41, self = this;

      if ($iter) TMP_Enumerable_find_all_40.$$p = null;
      
      
      if ($iter) TMP_Enumerable_find_all_40.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["find_all"], (TMP_41 = function(){var self = TMP_41.$$s || this;

        return self.$enumerator_size()}, TMP_41.$$s = self, TMP_41.$$arity = 0, TMP_41))
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
    }, TMP_Enumerable_find_all_40.$$arity = 0);
    
    Opal.def(self, '$find_index', TMP_Enumerable_find_index_42 = function $$find_index(object) {try {

      var $iter = TMP_Enumerable_find_index_42.$$p, block = $iter || nil, TMP_43, TMP_44, self = this, index = nil;

      if ($iter) TMP_Enumerable_find_index_42.$$p = null;
      
      
      if ($iter) TMP_Enumerable_find_index_42.$$p = null;;
      ;
      if ($truthy(object === undefined && block === nil)) {
        return self.$enum_for("find_index")};
      
      if (object != null && block !== nil) {
        self.$warn("warning: given block not used")
      }
    ;
      index = 0;
      if ($truthy(object != null)) {
        $send(self, 'each', [], (TMP_43 = function($a){var self = TMP_43.$$s || this, $post_args, value;

        
          
          $post_args = Opal.slice.call(arguments, 0, arguments.length);
          
          value = $post_args;;
          if ($$($nesting, 'Opal').$destructure(value)['$=='](object)) {
            Opal.ret(index)};
          return index += 1;;}, TMP_43.$$s = self, TMP_43.$$arity = -1, TMP_43))
      } else {
        $send(self, 'each', [], (TMP_44 = function($a){var self = TMP_44.$$s || this, $post_args, value;

        
          
          $post_args = Opal.slice.call(arguments, 0, arguments.length);
          
          value = $post_args;;
          if ($truthy(Opal.yieldX(block, Opal.to_a(value)))) {
            Opal.ret(index)};
          return index += 1;;}, TMP_44.$$s = self, TMP_44.$$arity = -1, TMP_44))
      };
      return nil;
      } catch ($returner) { if ($returner === Opal.returner) { return $returner.$v } throw $returner; }
    }, TMP_Enumerable_find_index_42.$$arity = -1);
    
    Opal.def(self, '$first', TMP_Enumerable_first_45 = function $$first(number) {try {

      var TMP_46, TMP_47, self = this, result = nil, current = nil;

      
      ;
      if ($truthy(number === undefined)) {
        return $send(self, 'each', [], (TMP_46 = function(value){var self = TMP_46.$$s || this;

        
          
          if (value == null) {
            value = nil;
          };
          Opal.ret(value);}, TMP_46.$$s = self, TMP_46.$$arity = 1, TMP_46))
      } else {
        
        result = [];
        number = $$($nesting, 'Opal').$coerce_to(number, $$($nesting, 'Integer'), "to_int");
        if ($truthy(number < 0)) {
          self.$raise($$($nesting, 'ArgumentError'), "attempt to take negative size")};
        if ($truthy(number == 0)) {
          return []};
        current = 0;
        $send(self, 'each', [], (TMP_47 = function($a){var self = TMP_47.$$s || this, $post_args, args;

        
          
          $post_args = Opal.slice.call(arguments, 0, arguments.length);
          
          args = $post_args;;
          result.push($$($nesting, 'Opal').$destructure(args));
          if ($truthy(number <= ++current)) {
            Opal.ret(result)
          } else {
            return nil
          };}, TMP_47.$$s = self, TMP_47.$$arity = -1, TMP_47));
        return result;
      };
      } catch ($returner) { if ($returner === Opal.returner) { return $returner.$v } throw $returner; }
    }, TMP_Enumerable_first_45.$$arity = -1);
    Opal.alias(self, "flat_map", "collect_concat");
    
    Opal.def(self, '$grep', TMP_Enumerable_grep_48 = function $$grep(pattern) {
      var $iter = TMP_Enumerable_grep_48.$$p, block = $iter || nil, TMP_49, self = this, result = nil;

      if ($iter) TMP_Enumerable_grep_48.$$p = null;
      
      
      if ($iter) TMP_Enumerable_grep_48.$$p = null;;
      result = [];
      $send(self, 'each', [], (TMP_49 = function($a){var self = TMP_49.$$s || this, $post_args, value, cmp = nil;

      
        
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
        return result.$push(value);}, TMP_49.$$s = self, TMP_49.$$arity = -1, TMP_49));
      return result;
    }, TMP_Enumerable_grep_48.$$arity = 1);
    
    Opal.def(self, '$grep_v', TMP_Enumerable_grep_v_50 = function $$grep_v(pattern) {
      var $iter = TMP_Enumerable_grep_v_50.$$p, block = $iter || nil, TMP_51, self = this, result = nil;

      if ($iter) TMP_Enumerable_grep_v_50.$$p = null;
      
      
      if ($iter) TMP_Enumerable_grep_v_50.$$p = null;;
      result = [];
      $send(self, 'each', [], (TMP_51 = function($a){var self = TMP_51.$$s || this, $post_args, value, cmp = nil;

      
        
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
        return result.$push(value);}, TMP_51.$$s = self, TMP_51.$$arity = -1, TMP_51));
      return result;
    }, TMP_Enumerable_grep_v_50.$$arity = 1);
    
    Opal.def(self, '$group_by', TMP_Enumerable_group_by_52 = function $$group_by() {
      var $iter = TMP_Enumerable_group_by_52.$$p, block = $iter || nil, TMP_53, $a, self = this, hash = nil, $writer = nil;

      if ($iter) TMP_Enumerable_group_by_52.$$p = null;
      
      
      if ($iter) TMP_Enumerable_group_by_52.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["group_by"], (TMP_53 = function(){var self = TMP_53.$$s || this;

        return self.$enumerator_size()}, TMP_53.$$s = self, TMP_53.$$arity = 0, TMP_53))
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
    }, TMP_Enumerable_group_by_52.$$arity = 0);
    
    Opal.def(self, '$include?', TMP_Enumerable_include$q_54 = function(obj) {try {

      var TMP_55, self = this;

      
      $send(self, 'each', [], (TMP_55 = function($a){var self = TMP_55.$$s || this, $post_args, args;

      
        
        $post_args = Opal.slice.call(arguments, 0, arguments.length);
        
        args = $post_args;;
        if ($$($nesting, 'Opal').$destructure(args)['$=='](obj)) {
          Opal.ret(true)
        } else {
          return nil
        };}, TMP_55.$$s = self, TMP_55.$$arity = -1, TMP_55));
      return false;
      } catch ($returner) { if ($returner === Opal.returner) { return $returner.$v } throw $returner; }
    }, TMP_Enumerable_include$q_54.$$arity = 1);
    
    Opal.def(self, '$inject', TMP_Enumerable_inject_56 = function $$inject(object, sym) {
      var $iter = TMP_Enumerable_inject_56.$$p, block = $iter || nil, self = this;

      if ($iter) TMP_Enumerable_inject_56.$$p = null;
      
      
      if ($iter) TMP_Enumerable_inject_56.$$p = null;;
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
    }, TMP_Enumerable_inject_56.$$arity = -1);
    
    Opal.def(self, '$lazy', TMP_Enumerable_lazy_57 = function $$lazy() {
      var TMP_58, self = this;

      return $send($$$($$($nesting, 'Enumerator'), 'Lazy'), 'new', [self, self.$enumerator_size()], (TMP_58 = function(enum$, $a){var self = TMP_58.$$s || this, $post_args, args;

      
        
        if (enum$ == null) {
          enum$ = nil;
        };
        
        $post_args = Opal.slice.call(arguments, 1, arguments.length);
        
        args = $post_args;;
        return $send(enum$, 'yield', Opal.to_a(args));}, TMP_58.$$s = self, TMP_58.$$arity = -2, TMP_58))
    }, TMP_Enumerable_lazy_57.$$arity = 0);
    
    Opal.def(self, '$enumerator_size', TMP_Enumerable_enumerator_size_59 = function $$enumerator_size() {
      var self = this;

      if ($truthy(self['$respond_to?']("size"))) {
        return self.$size()
      } else {
        return nil
      }
    }, TMP_Enumerable_enumerator_size_59.$$arity = 0);
    Opal.alias(self, "map", "collect");
    
    Opal.def(self, '$max', TMP_Enumerable_max_60 = function $$max(n) {
      var $iter = TMP_Enumerable_max_60.$$p, block = $iter || nil, self = this;

      if ($iter) TMP_Enumerable_max_60.$$p = null;
      
      
      if ($iter) TMP_Enumerable_max_60.$$p = null;;
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
    }, TMP_Enumerable_max_60.$$arity = -1);
    
    Opal.def(self, '$max_by', TMP_Enumerable_max_by_61 = function $$max_by() {
      var $iter = TMP_Enumerable_max_by_61.$$p, block = $iter || nil, TMP_62, self = this;

      if ($iter) TMP_Enumerable_max_by_61.$$p = null;
      
      
      if ($iter) TMP_Enumerable_max_by_61.$$p = null;;
      if ($truthy(block)) {
      } else {
        return $send(self, 'enum_for', ["max_by"], (TMP_62 = function(){var self = TMP_62.$$s || this;

        return self.$enumerator_size()}, TMP_62.$$s = self, TMP_62.$$arity = 0, TMP_62))
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
    }, TMP_Enumerable_max_by_61.$$arity = 0);
    Opal.alias(self, "member?", "include?");
    
    Opal.def(self, '$min', TMP_Enumerable_min_63 = function $$min() {
      var $iter = TMP_Enumerable_min_63.$$p, block = $iter || nil, self = this;

      if ($iter) TMP_Enumerable_min_63.$$p = null;
      
      
      if ($iter) TMP_Enumerable_min_63.$$p = null;;
      
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
    }, TMP_Enumerable_min_63.$$arity = 0);
    
    Opal.def(self, '$min_by', TMP_Enumerable_min_by_64 = function $$min_by() {
      var $iter = TMP_Enumerable_min_by_64.$$p, block = $iter || nil, TMP_65, self = this;

      if ($iter) TMP_Enumerable_min_by_64.$$p = null;
      
      
      if ($iter) TMP_Enumerable_min_by_64.$$p = null;;
      if ($truthy(block)) {
      } else {
        return $send(self, 'enum_for', ["min_by"], (TMP_65 = function(){var self = TMP_65.$$s || this;

        return self.$enumerator_size()}, TMP_65.$$s = self, TMP_65.$$arity = 0, TMP_65))
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
    }, TMP_Enumerable_min_by_64.$$arity = 0);
    
    Opal.def(self, '$minmax', TMP_Enumerable_minmax_66 = function $$minmax() {
      var $iter = TMP_Enumerable_minmax_66.$$p, block = $iter || nil, $a, TMP_67, self = this;

      if ($iter) TMP_Enumerable_minmax_66.$$p = null;
      
      
      if ($iter) TMP_Enumerable_minmax_66.$$p = null;;
      block = ($truthy($a = block) ? $a : $send(self, 'proc', [], (TMP_67 = function(a, b){var self = TMP_67.$$s || this;

      
        
        if (a == null) {
          a = nil;
        };
        
        if (b == null) {
          b = nil;
        };
        return a['$<=>'](b);}, TMP_67.$$s = self, TMP_67.$$arity = 2, TMP_67)));
      
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
    }, TMP_Enumerable_minmax_66.$$arity = 0);
    
    Opal.def(self, '$minmax_by', TMP_Enumerable_minmax_by_68 = function $$minmax_by() {
      var $iter = TMP_Enumerable_minmax_by_68.$$p, block = $iter || nil, self = this;

      if ($iter) TMP_Enumerable_minmax_by_68.$$p = null;
      
      
      if ($iter) TMP_Enumerable_minmax_by_68.$$p = null;;
      return self.$raise($$($nesting, 'NotImplementedError'));
    }, TMP_Enumerable_minmax_by_68.$$arity = 0);
    
    Opal.def(self, '$none?', TMP_Enumerable_none$q_69 = function(pattern) {try {

      var $iter = TMP_Enumerable_none$q_69.$$p, block = $iter || nil, TMP_70, TMP_71, TMP_72, self = this;

      if ($iter) TMP_Enumerable_none$q_69.$$p = null;
      
      
      if ($iter) TMP_Enumerable_none$q_69.$$p = null;;
      ;
      if ($truthy(pattern !== undefined)) {
        $send(self, 'each', [], (TMP_70 = function($a){var self = TMP_70.$$s || this, $post_args, value, comparable = nil;

        
          
          $post_args = Opal.slice.call(arguments, 0, arguments.length);
          
          value = $post_args;;
          comparable = comparableForPattern(value);
          if ($truthy($send(pattern, 'public_send', ["==="].concat(Opal.to_a(comparable))))) {
            Opal.ret(false)
          } else {
            return nil
          };}, TMP_70.$$s = self, TMP_70.$$arity = -1, TMP_70))
      } else if ((block !== nil)) {
        $send(self, 'each', [], (TMP_71 = function($a){var self = TMP_71.$$s || this, $post_args, value;

        
          
          $post_args = Opal.slice.call(arguments, 0, arguments.length);
          
          value = $post_args;;
          if ($truthy(Opal.yieldX(block, Opal.to_a(value)))) {
            Opal.ret(false)
          } else {
            return nil
          };}, TMP_71.$$s = self, TMP_71.$$arity = -1, TMP_71))
      } else {
        $send(self, 'each', [], (TMP_72 = function($a){var self = TMP_72.$$s || this, $post_args, value, item = nil;

        
          
          $post_args = Opal.slice.call(arguments, 0, arguments.length);
          
          value = $post_args;;
          item = $$($nesting, 'Opal').$destructure(value);
          if ($truthy(item)) {
            Opal.ret(false)
          } else {
            return nil
          };}, TMP_72.$$s = self, TMP_72.$$arity = -1, TMP_72))
      };
      return true;
      } catch ($returner) { if ($returner === Opal.returner) { return $returner.$v } throw $returner; }
    }, TMP_Enumerable_none$q_69.$$arity = -1);
    
    Opal.def(self, '$one?', TMP_Enumerable_one$q_73 = function(pattern) {try {

      var $iter = TMP_Enumerable_one$q_73.$$p, block = $iter || nil, TMP_74, TMP_75, TMP_76, self = this, count = nil;

      if ($iter) TMP_Enumerable_one$q_73.$$p = null;
      
      
      if ($iter) TMP_Enumerable_one$q_73.$$p = null;;
      ;
      count = 0;
      if ($truthy(pattern !== undefined)) {
        $send(self, 'each', [], (TMP_74 = function($a){var self = TMP_74.$$s || this, $post_args, value, comparable = nil;

        
          
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
          };}, TMP_74.$$s = self, TMP_74.$$arity = -1, TMP_74))
      } else if ((block !== nil)) {
        $send(self, 'each', [], (TMP_75 = function($a){var self = TMP_75.$$s || this, $post_args, value;

        
          
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
          };}, TMP_75.$$s = self, TMP_75.$$arity = -1, TMP_75))
      } else {
        $send(self, 'each', [], (TMP_76 = function($a){var self = TMP_76.$$s || this, $post_args, value;

        
          
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
          };}, TMP_76.$$s = self, TMP_76.$$arity = -1, TMP_76))
      };
      return count['$=='](1);
      } catch ($returner) { if ($returner === Opal.returner) { return $returner.$v } throw $returner; }
    }, TMP_Enumerable_one$q_73.$$arity = -1);
    
    Opal.def(self, '$partition', TMP_Enumerable_partition_77 = function $$partition() {
      var $iter = TMP_Enumerable_partition_77.$$p, block = $iter || nil, TMP_78, self = this;

      if ($iter) TMP_Enumerable_partition_77.$$p = null;
      
      
      if ($iter) TMP_Enumerable_partition_77.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["partition"], (TMP_78 = function(){var self = TMP_78.$$s || this;

        return self.$enumerator_size()}, TMP_78.$$s = self, TMP_78.$$arity = 0, TMP_78))
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
    }, TMP_Enumerable_partition_77.$$arity = 0);
    Opal.alias(self, "reduce", "inject");
    
    Opal.def(self, '$reject', TMP_Enumerable_reject_79 = function $$reject() {
      var $iter = TMP_Enumerable_reject_79.$$p, block = $iter || nil, TMP_80, self = this;

      if ($iter) TMP_Enumerable_reject_79.$$p = null;
      
      
      if ($iter) TMP_Enumerable_reject_79.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["reject"], (TMP_80 = function(){var self = TMP_80.$$s || this;

        return self.$enumerator_size()}, TMP_80.$$s = self, TMP_80.$$arity = 0, TMP_80))
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
    }, TMP_Enumerable_reject_79.$$arity = 0);
    
    Opal.def(self, '$reverse_each', TMP_Enumerable_reverse_each_81 = function $$reverse_each() {
      var $iter = TMP_Enumerable_reverse_each_81.$$p, block = $iter || nil, TMP_82, self = this;

      if ($iter) TMP_Enumerable_reverse_each_81.$$p = null;
      
      
      if ($iter) TMP_Enumerable_reverse_each_81.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["reverse_each"], (TMP_82 = function(){var self = TMP_82.$$s || this;

        return self.$enumerator_size()}, TMP_82.$$s = self, TMP_82.$$arity = 0, TMP_82))
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
    }, TMP_Enumerable_reverse_each_81.$$arity = 0);
    Opal.alias(self, "select", "find_all");
    
    Opal.def(self, '$slice_before', TMP_Enumerable_slice_before_83 = function $$slice_before(pattern) {
      var $iter = TMP_Enumerable_slice_before_83.$$p, block = $iter || nil, TMP_84, self = this;

      if ($iter) TMP_Enumerable_slice_before_83.$$p = null;
      
      
      if ($iter) TMP_Enumerable_slice_before_83.$$p = null;;
      ;
      if ($truthy(pattern === undefined && block === nil)) {
        self.$raise($$($nesting, 'ArgumentError'), "both pattern and block are given")};
      if ($truthy(pattern !== undefined && block !== nil || arguments.length > 1)) {
        self.$raise($$($nesting, 'ArgumentError'), "" + "wrong number of arguments (" + (arguments.length) + " expected 1)")};
      return $send($$($nesting, 'Enumerator'), 'new', [], (TMP_84 = function(e){var self = TMP_84.$$s || this;

      
        
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
      ;}, TMP_84.$$s = self, TMP_84.$$arity = 1, TMP_84));
    }, TMP_Enumerable_slice_before_83.$$arity = -1);
    
    Opal.def(self, '$slice_after', TMP_Enumerable_slice_after_85 = function $$slice_after(pattern) {
      var $iter = TMP_Enumerable_slice_after_85.$$p, block = $iter || nil, TMP_86, TMP_87, self = this;

      if ($iter) TMP_Enumerable_slice_after_85.$$p = null;
      
      
      if ($iter) TMP_Enumerable_slice_after_85.$$p = null;;
      ;
      if ($truthy(pattern === undefined && block === nil)) {
        self.$raise($$($nesting, 'ArgumentError'), "both pattern and block are given")};
      if ($truthy(pattern !== undefined && block !== nil || arguments.length > 1)) {
        self.$raise($$($nesting, 'ArgumentError'), "" + "wrong number of arguments (" + (arguments.length) + " expected 1)")};
      if ($truthy(pattern !== undefined)) {
        block = $send(self, 'proc', [], (TMP_86 = function(e){var self = TMP_86.$$s || this;

        
          
          if (e == null) {
            e = nil;
          };
          return pattern['$==='](e);}, TMP_86.$$s = self, TMP_86.$$arity = 1, TMP_86))};
      return $send($$($nesting, 'Enumerator'), 'new', [], (TMP_87 = function(yielder){var self = TMP_87.$$s || this;

      
        
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
      ;}, TMP_87.$$s = self, TMP_87.$$arity = 1, TMP_87));
    }, TMP_Enumerable_slice_after_85.$$arity = -1);
    
    Opal.def(self, '$slice_when', TMP_Enumerable_slice_when_88 = function $$slice_when() {
      var $iter = TMP_Enumerable_slice_when_88.$$p, block = $iter || nil, TMP_89, self = this;

      if ($iter) TMP_Enumerable_slice_when_88.$$p = null;
      
      
      if ($iter) TMP_Enumerable_slice_when_88.$$p = null;;
      if ((block !== nil)) {
      } else {
        self.$raise($$($nesting, 'ArgumentError'), "wrong number of arguments (0 for 1)")
      };
      return $send($$($nesting, 'Enumerator'), 'new', [], (TMP_89 = function(yielder){var self = TMP_89.$$s || this;

      
        
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
      ;}, TMP_89.$$s = self, TMP_89.$$arity = 1, TMP_89));
    }, TMP_Enumerable_slice_when_88.$$arity = 0);
    
    Opal.def(self, '$sort', TMP_Enumerable_sort_90 = function $$sort() {
      var $iter = TMP_Enumerable_sort_90.$$p, block = $iter || nil, TMP_91, self = this, ary = nil;

      if ($iter) TMP_Enumerable_sort_90.$$p = null;
      
      
      if ($iter) TMP_Enumerable_sort_90.$$p = null;;
      ary = self.$to_a();
      if ((block !== nil)) {
      } else {
        block = $lambda((TMP_91 = function(a, b){var self = TMP_91.$$s || this;

        
          
          if (a == null) {
            a = nil;
          };
          
          if (b == null) {
            b = nil;
          };
          return a['$<=>'](b);}, TMP_91.$$s = self, TMP_91.$$arity = 2, TMP_91))
      };
      return $send(ary, 'sort', [], block.$to_proc());
    }, TMP_Enumerable_sort_90.$$arity = 0);
    
    Opal.def(self, '$sort_by', TMP_Enumerable_sort_by_92 = function $$sort_by() {
      var $iter = TMP_Enumerable_sort_by_92.$$p, block = $iter || nil, TMP_93, TMP_94, TMP_95, TMP_96, self = this, dup = nil;

      if ($iter) TMP_Enumerable_sort_by_92.$$p = null;
      
      
      if ($iter) TMP_Enumerable_sort_by_92.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["sort_by"], (TMP_93 = function(){var self = TMP_93.$$s || this;

        return self.$enumerator_size()}, TMP_93.$$s = self, TMP_93.$$arity = 0, TMP_93))
      };
      dup = $send(self, 'map', [], (TMP_94 = function(){var self = TMP_94.$$s || this, arg = nil;

      
        arg = $$($nesting, 'Opal').$destructure(arguments);
        return [Opal.yield1(block, arg), arg];}, TMP_94.$$s = self, TMP_94.$$arity = 0, TMP_94));
      $send(dup, 'sort!', [], (TMP_95 = function(a, b){var self = TMP_95.$$s || this;

      
        
        if (a == null) {
          a = nil;
        };
        
        if (b == null) {
          b = nil;
        };
        return (a[0])['$<=>'](b[0]);}, TMP_95.$$s = self, TMP_95.$$arity = 2, TMP_95));
      return $send(dup, 'map!', [], (TMP_96 = function(i){var self = TMP_96.$$s || this;

      
        
        if (i == null) {
          i = nil;
        };
        return i[1];;}, TMP_96.$$s = self, TMP_96.$$arity = 1, TMP_96));
    }, TMP_Enumerable_sort_by_92.$$arity = 0);
    
    Opal.def(self, '$sum', TMP_Enumerable_sum_97 = function $$sum(initial) {
      var TMP_98, $iter = TMP_Enumerable_sum_97.$$p, $yield = $iter || nil, self = this, result = nil;

      if ($iter) TMP_Enumerable_sum_97.$$p = null;
      
      
      if (initial == null) {
        initial = 0;
      };
      result = initial;
      $send(self, 'each', [], (TMP_98 = function($a){var self = TMP_98.$$s || this, $post_args, args, item = nil;

      
        
        $post_args = Opal.slice.call(arguments, 0, arguments.length);
        
        args = $post_args;;
        item = (function() {if (($yield !== nil)) {
          return Opal.yieldX($yield, Opal.to_a(args));
        } else {
          return $$($nesting, 'Opal').$destructure(args)
        }; return nil; })();
        return (result = $rb_plus(result, item));}, TMP_98.$$s = self, TMP_98.$$arity = -1, TMP_98));
      return result;
    }, TMP_Enumerable_sum_97.$$arity = -1);
    
    Opal.def(self, '$take', TMP_Enumerable_take_99 = function $$take(num) {
      var self = this;

      return self.$first(num)
    }, TMP_Enumerable_take_99.$$arity = 1);
    
    Opal.def(self, '$take_while', TMP_Enumerable_take_while_100 = function $$take_while() {try {

      var $iter = TMP_Enumerable_take_while_100.$$p, block = $iter || nil, TMP_101, self = this, result = nil;

      if ($iter) TMP_Enumerable_take_while_100.$$p = null;
      
      
      if ($iter) TMP_Enumerable_take_while_100.$$p = null;;
      if ($truthy(block)) {
      } else {
        return self.$enum_for("take_while")
      };
      result = [];
      return $send(self, 'each', [], (TMP_101 = function($a){var self = TMP_101.$$s || this, $post_args, args, value = nil;

      
        
        $post_args = Opal.slice.call(arguments, 0, arguments.length);
        
        args = $post_args;;
        value = $$($nesting, 'Opal').$destructure(args);
        if ($truthy(Opal.yield1(block, value))) {
        } else {
          Opal.ret(result)
        };
        return result.push(value);;}, TMP_101.$$s = self, TMP_101.$$arity = -1, TMP_101));
      } catch ($returner) { if ($returner === Opal.returner) { return $returner.$v } throw $returner; }
    }, TMP_Enumerable_take_while_100.$$arity = 0);
    
    Opal.def(self, '$uniq', TMP_Enumerable_uniq_102 = function $$uniq() {
      var $iter = TMP_Enumerable_uniq_102.$$p, block = $iter || nil, TMP_103, self = this, hash = nil;

      if ($iter) TMP_Enumerable_uniq_102.$$p = null;
      
      
      if ($iter) TMP_Enumerable_uniq_102.$$p = null;;
      hash = $hash2([], {});
      $send(self, 'each', [], (TMP_103 = function($a){var self = TMP_103.$$s || this, $post_args, args, value = nil, produced = nil, $writer = nil;

      
        
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
        };}, TMP_103.$$s = self, TMP_103.$$arity = -1, TMP_103));
      return hash.$values();
    }, TMP_Enumerable_uniq_102.$$arity = 0);
    Opal.alias(self, "to_a", "entries");
    
    Opal.def(self, '$zip', TMP_Enumerable_zip_104 = function $$zip($a) {
      var $iter = TMP_Enumerable_zip_104.$$p, block = $iter || nil, $post_args, others, self = this;

      if ($iter) TMP_Enumerable_zip_104.$$p = null;
      
      
      if ($iter) TMP_Enumerable_zip_104.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      others = $post_args;;
      return $send(self.$to_a(), 'zip', Opal.to_a(others));
    }, TMP_Enumerable_zip_104.$$arity = -1);
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
    function $Enumerator(){};
    var self = $Enumerator = $klass($base, $super, 'Enumerator', $Enumerator);

    var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_Enumerator_for_1, TMP_Enumerator_initialize_2, TMP_Enumerator_each_3, TMP_Enumerator_size_4, TMP_Enumerator_with_index_5, TMP_Enumerator_inspect_7;

    def.size = def.args = def.object = def.method = nil;
    
    self.$include($$($nesting, 'Enumerable'));
    def.$$is_enumerator = true;
    Opal.defs(self, '$for', TMP_Enumerator_for_1 = function(object, $a, $b) {
      var $iter = TMP_Enumerator_for_1.$$p, block = $iter || nil, $post_args, method, args, self = this;

      if ($iter) TMP_Enumerator_for_1.$$p = null;
      
      
      if ($iter) TMP_Enumerator_for_1.$$p = null;;
      
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
    }, TMP_Enumerator_for_1.$$arity = -2);
    
    Opal.def(self, '$initialize', TMP_Enumerator_initialize_2 = function $$initialize($a) {
      var $iter = TMP_Enumerator_initialize_2.$$p, block = $iter || nil, $post_args, self = this;

      if ($iter) TMP_Enumerator_initialize_2.$$p = null;
      
      
      if ($iter) TMP_Enumerator_initialize_2.$$p = null;;
      
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
    }, TMP_Enumerator_initialize_2.$$arity = -1);
    
    Opal.def(self, '$each', TMP_Enumerator_each_3 = function $$each($a) {
      var $iter = TMP_Enumerator_each_3.$$p, block = $iter || nil, $post_args, args, $b, self = this;

      if ($iter) TMP_Enumerator_each_3.$$p = null;
      
      
      if ($iter) TMP_Enumerator_each_3.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      if ($truthy(($truthy($b = block['$nil?']()) ? args['$empty?']() : $b))) {
        return self};
      args = $rb_plus(self.args, args);
      if ($truthy(block['$nil?']())) {
        return $send(self.$class(), 'new', [self.object, self.method].concat(Opal.to_a(args)))};
      return $send(self.object, '__send__', [self.method].concat(Opal.to_a(args)), block.$to_proc());
    }, TMP_Enumerator_each_3.$$arity = -1);
    
    Opal.def(self, '$size', TMP_Enumerator_size_4 = function $$size() {
      var self = this;

      if ($truthy($$($nesting, 'Proc')['$==='](self.size))) {
        return $send(self.size, 'call', Opal.to_a(self.args))
      } else {
        return self.size
      }
    }, TMP_Enumerator_size_4.$$arity = 0);
    
    Opal.def(self, '$with_index', TMP_Enumerator_with_index_5 = function $$with_index(offset) {
      var $iter = TMP_Enumerator_with_index_5.$$p, block = $iter || nil, TMP_6, self = this;

      if ($iter) TMP_Enumerator_with_index_5.$$p = null;
      
      
      if ($iter) TMP_Enumerator_with_index_5.$$p = null;;
      
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
        return $send(self, 'enum_for', ["with_index", offset], (TMP_6 = function(){var self = TMP_6.$$s || this;

        return self.$size()}, TMP_6.$$s = self, TMP_6.$$arity = 0, TMP_6))
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
    }, TMP_Enumerator_with_index_5.$$arity = -1);
    Opal.alias(self, "with_object", "each_with_object");
    
    Opal.def(self, '$inspect', TMP_Enumerator_inspect_7 = function $$inspect() {
      var self = this, result = nil;

      
      result = "" + "#<" + (self.$class()) + ": " + (self.object.$inspect()) + ":" + (self.method);
      if ($truthy(self.args['$any?']())) {
        result = $rb_plus(result, "" + "(" + (self.args.$inspect()['$[]']($$($nesting, 'Range').$new(1, -2))) + ")")};
      return $rb_plus(result, ">");
    }, TMP_Enumerator_inspect_7.$$arity = 0);
    (function($base, $super, $parent_nesting) {
      function $Generator(){};
      var self = $Generator = $klass($base, $super, 'Generator', $Generator);

      var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_Generator_initialize_8, TMP_Generator_each_9;

      def.block = nil;
      
      self.$include($$($nesting, 'Enumerable'));
      
      Opal.def(self, '$initialize', TMP_Generator_initialize_8 = function $$initialize() {
        var $iter = TMP_Generator_initialize_8.$$p, block = $iter || nil, self = this;

        if ($iter) TMP_Generator_initialize_8.$$p = null;
        
        
        if ($iter) TMP_Generator_initialize_8.$$p = null;;
        if ($truthy(block)) {
        } else {
          self.$raise($$($nesting, 'LocalJumpError'), "no block given")
        };
        return (self.block = block);
      }, TMP_Generator_initialize_8.$$arity = 0);
      return (Opal.def(self, '$each', TMP_Generator_each_9 = function $$each($a) {
        var $iter = TMP_Generator_each_9.$$p, block = $iter || nil, $post_args, args, self = this, yielder = nil;

        if ($iter) TMP_Generator_each_9.$$p = null;
        
        
        if ($iter) TMP_Generator_each_9.$$p = null;;
        
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
      }, TMP_Generator_each_9.$$arity = -1), nil) && 'each';
    })($nesting[0], null, $nesting);
    (function($base, $super, $parent_nesting) {
      function $Yielder(){};
      var self = $Yielder = $klass($base, $super, 'Yielder', $Yielder);

      var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_Yielder_initialize_10, TMP_Yielder_yield_11, TMP_Yielder_$lt$lt_12;

      def.block = nil;
      
      
      Opal.def(self, '$initialize', TMP_Yielder_initialize_10 = function $$initialize() {
        var $iter = TMP_Yielder_initialize_10.$$p, block = $iter || nil, self = this;

        if ($iter) TMP_Yielder_initialize_10.$$p = null;
        
        
        if ($iter) TMP_Yielder_initialize_10.$$p = null;;
        return (self.block = block);
      }, TMP_Yielder_initialize_10.$$arity = 0);
      
      Opal.def(self, '$yield', TMP_Yielder_yield_11 = function($a) {
        var $post_args, values, self = this;

        
        
        $post_args = Opal.slice.call(arguments, 0, arguments.length);
        
        values = $post_args;;
        
        var value = Opal.yieldX(self.block, values);

        if (value === $breaker) {
          throw $breaker;
        }

        return value;
      ;
      }, TMP_Yielder_yield_11.$$arity = -1);
      return (Opal.def(self, '$<<', TMP_Yielder_$lt$lt_12 = function($a) {
        var $post_args, values, self = this;

        
        
        $post_args = Opal.slice.call(arguments, 0, arguments.length);
        
        values = $post_args;;
        $send(self, 'yield', Opal.to_a(values));
        return self;
      }, TMP_Yielder_$lt$lt_12.$$arity = -1), nil) && '<<';
    })($nesting[0], null, $nesting);
    return (function($base, $super, $parent_nesting) {
      function $Lazy(){};
      var self = $Lazy = $klass($base, $super, 'Lazy', $Lazy);

      var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_Lazy_initialize_13, TMP_Lazy_lazy_16, TMP_Lazy_collect_17, TMP_Lazy_collect_concat_19, TMP_Lazy_drop_23, TMP_Lazy_drop_while_25, TMP_Lazy_enum_for_27, TMP_Lazy_find_all_28, TMP_Lazy_grep_30, TMP_Lazy_reject_33, TMP_Lazy_take_35, TMP_Lazy_take_while_37, TMP_Lazy_inspect_39;

      def.enumerator = nil;
      
      (function($base, $super, $parent_nesting) {
        function $StopLazyError(){};
        var self = $StopLazyError = $klass($base, $super, 'StopLazyError', $StopLazyError);

        var def = self.prototype, $nesting = [self].concat($parent_nesting);

        return nil
      })($nesting[0], $$($nesting, 'Exception'), $nesting);
      
      Opal.def(self, '$initialize', TMP_Lazy_initialize_13 = function $$initialize(object, size) {
        var $iter = TMP_Lazy_initialize_13.$$p, block = $iter || nil, TMP_14, self = this;

        if ($iter) TMP_Lazy_initialize_13.$$p = null;
        
        
        if ($iter) TMP_Lazy_initialize_13.$$p = null;;
        
        if (size == null) {
          size = nil;
        };
        if ((block !== nil)) {
        } else {
          self.$raise($$($nesting, 'ArgumentError'), "tried to call lazy new without a block")
        };
        self.enumerator = object;
        return $send(self, Opal.find_super_dispatcher(self, 'initialize', TMP_Lazy_initialize_13, false), [size], (TMP_14 = function(yielder, $a){var self = TMP_14.$$s || this, $post_args, each_args, TMP_15;

        
          
          if (yielder == null) {
            yielder = nil;
          };
          
          $post_args = Opal.slice.call(arguments, 1, arguments.length);
          
          each_args = $post_args;;
          try {
            return $send(object, 'each', Opal.to_a(each_args), (TMP_15 = function($b){var self = TMP_15.$$s || this, $post_args, args;

            
              
              $post_args = Opal.slice.call(arguments, 0, arguments.length);
              
              args = $post_args;;
              
            args.unshift(yielder);

            Opal.yieldX(block, args);
          ;}, TMP_15.$$s = self, TMP_15.$$arity = -1, TMP_15))
          } catch ($err) {
            if (Opal.rescue($err, [$$($nesting, 'Exception')])) {
              try {
                return nil
              } finally { Opal.pop_exception() }
            } else { throw $err; }
          };}, TMP_14.$$s = self, TMP_14.$$arity = -2, TMP_14));
      }, TMP_Lazy_initialize_13.$$arity = -2);
      Opal.alias(self, "force", "to_a");
      
      Opal.def(self, '$lazy', TMP_Lazy_lazy_16 = function $$lazy() {
        var self = this;

        return self
      }, TMP_Lazy_lazy_16.$$arity = 0);
      
      Opal.def(self, '$collect', TMP_Lazy_collect_17 = function $$collect() {
        var $iter = TMP_Lazy_collect_17.$$p, block = $iter || nil, TMP_18, self = this;

        if ($iter) TMP_Lazy_collect_17.$$p = null;
        
        
        if ($iter) TMP_Lazy_collect_17.$$p = null;;
        if ($truthy(block)) {
        } else {
          self.$raise($$($nesting, 'ArgumentError'), "tried to call lazy map without a block")
        };
        return $send($$($nesting, 'Lazy'), 'new', [self, self.$enumerator_size()], (TMP_18 = function(enum$, $a){var self = TMP_18.$$s || this, $post_args, args;

        
          
          if (enum$ == null) {
            enum$ = nil;
          };
          
          $post_args = Opal.slice.call(arguments, 1, arguments.length);
          
          args = $post_args;;
          
          var value = Opal.yieldX(block, args);

          enum$.$yield(value);
        ;}, TMP_18.$$s = self, TMP_18.$$arity = -2, TMP_18));
      }, TMP_Lazy_collect_17.$$arity = 0);
      
      Opal.def(self, '$collect_concat', TMP_Lazy_collect_concat_19 = function $$collect_concat() {
        var $iter = TMP_Lazy_collect_concat_19.$$p, block = $iter || nil, TMP_20, self = this;

        if ($iter) TMP_Lazy_collect_concat_19.$$p = null;
        
        
        if ($iter) TMP_Lazy_collect_concat_19.$$p = null;;
        if ($truthy(block)) {
        } else {
          self.$raise($$($nesting, 'ArgumentError'), "tried to call lazy map without a block")
        };
        return $send($$($nesting, 'Lazy'), 'new', [self, nil], (TMP_20 = function(enum$, $a){var self = TMP_20.$$s || this, $post_args, args, TMP_21, TMP_22;

        
          
          if (enum$ == null) {
            enum$ = nil;
          };
          
          $post_args = Opal.slice.call(arguments, 1, arguments.length);
          
          args = $post_args;;
          
          var value = Opal.yieldX(block, args);

          if ((value)['$respond_to?']("force") && (value)['$respond_to?']("each")) {
            $send((value), 'each', [], (TMP_21 = function(v){var self = TMP_21.$$s || this;

          
            
            if (v == null) {
              v = nil;
            };
            return enum$.$yield(v);}, TMP_21.$$s = self, TMP_21.$$arity = 1, TMP_21))
          }
          else {
            var array = $$($nesting, 'Opal').$try_convert(value, $$($nesting, 'Array'), "to_ary");

            if (array === nil) {
              enum$.$yield(value);
            }
            else {
              $send((value), 'each', [], (TMP_22 = function(v){var self = TMP_22.$$s || this;

          
            
            if (v == null) {
              v = nil;
            };
            return enum$.$yield(v);}, TMP_22.$$s = self, TMP_22.$$arity = 1, TMP_22));
            }
          }
        ;}, TMP_20.$$s = self, TMP_20.$$arity = -2, TMP_20));
      }, TMP_Lazy_collect_concat_19.$$arity = 0);
      
      Opal.def(self, '$drop', TMP_Lazy_drop_23 = function $$drop(n) {
        var TMP_24, self = this, current_size = nil, set_size = nil, dropped = nil;

        
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
        return $send($$($nesting, 'Lazy'), 'new', [self, set_size], (TMP_24 = function(enum$, $a){var self = TMP_24.$$s || this, $post_args, args;

        
          
          if (enum$ == null) {
            enum$ = nil;
          };
          
          $post_args = Opal.slice.call(arguments, 1, arguments.length);
          
          args = $post_args;;
          if ($truthy($rb_lt(dropped, n))) {
            return (dropped = $rb_plus(dropped, 1))
          } else {
            return $send(enum$, 'yield', Opal.to_a(args))
          };}, TMP_24.$$s = self, TMP_24.$$arity = -2, TMP_24));
      }, TMP_Lazy_drop_23.$$arity = 1);
      
      Opal.def(self, '$drop_while', TMP_Lazy_drop_while_25 = function $$drop_while() {
        var $iter = TMP_Lazy_drop_while_25.$$p, block = $iter || nil, TMP_26, self = this, succeeding = nil;

        if ($iter) TMP_Lazy_drop_while_25.$$p = null;
        
        
        if ($iter) TMP_Lazy_drop_while_25.$$p = null;;
        if ($truthy(block)) {
        } else {
          self.$raise($$($nesting, 'ArgumentError'), "tried to call lazy drop_while without a block")
        };
        succeeding = true;
        return $send($$($nesting, 'Lazy'), 'new', [self, nil], (TMP_26 = function(enum$, $a){var self = TMP_26.$$s || this, $post_args, args;

        
          
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
          };}, TMP_26.$$s = self, TMP_26.$$arity = -2, TMP_26));
      }, TMP_Lazy_drop_while_25.$$arity = 0);
      
      Opal.def(self, '$enum_for', TMP_Lazy_enum_for_27 = function $$enum_for($a, $b) {
        var $iter = TMP_Lazy_enum_for_27.$$p, block = $iter || nil, $post_args, method, args, self = this;

        if ($iter) TMP_Lazy_enum_for_27.$$p = null;
        
        
        if ($iter) TMP_Lazy_enum_for_27.$$p = null;;
        
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
      }, TMP_Lazy_enum_for_27.$$arity = -1);
      
      Opal.def(self, '$find_all', TMP_Lazy_find_all_28 = function $$find_all() {
        var $iter = TMP_Lazy_find_all_28.$$p, block = $iter || nil, TMP_29, self = this;

        if ($iter) TMP_Lazy_find_all_28.$$p = null;
        
        
        if ($iter) TMP_Lazy_find_all_28.$$p = null;;
        if ($truthy(block)) {
        } else {
          self.$raise($$($nesting, 'ArgumentError'), "tried to call lazy select without a block")
        };
        return $send($$($nesting, 'Lazy'), 'new', [self, nil], (TMP_29 = function(enum$, $a){var self = TMP_29.$$s || this, $post_args, args;

        
          
          if (enum$ == null) {
            enum$ = nil;
          };
          
          $post_args = Opal.slice.call(arguments, 1, arguments.length);
          
          args = $post_args;;
          
          var value = Opal.yieldX(block, args);

          if ($truthy(value)) {
            $send(enum$, 'yield', Opal.to_a(args));
          }
        ;}, TMP_29.$$s = self, TMP_29.$$arity = -2, TMP_29));
      }, TMP_Lazy_find_all_28.$$arity = 0);
      Opal.alias(self, "flat_map", "collect_concat");
      
      Opal.def(self, '$grep', TMP_Lazy_grep_30 = function $$grep(pattern) {
        var $iter = TMP_Lazy_grep_30.$$p, block = $iter || nil, TMP_31, TMP_32, self = this;

        if ($iter) TMP_Lazy_grep_30.$$p = null;
        
        
        if ($iter) TMP_Lazy_grep_30.$$p = null;;
        if ($truthy(block)) {
          return $send($$($nesting, 'Lazy'), 'new', [self, nil], (TMP_31 = function(enum$, $a){var self = TMP_31.$$s || this, $post_args, args;

          
            
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
          ;}, TMP_31.$$s = self, TMP_31.$$arity = -2, TMP_31))
        } else {
          return $send($$($nesting, 'Lazy'), 'new', [self, nil], (TMP_32 = function(enum$, $a){var self = TMP_32.$$s || this, $post_args, args;

          
            
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
          ;}, TMP_32.$$s = self, TMP_32.$$arity = -2, TMP_32))
        };
      }, TMP_Lazy_grep_30.$$arity = 1);
      Opal.alias(self, "map", "collect");
      Opal.alias(self, "select", "find_all");
      
      Opal.def(self, '$reject', TMP_Lazy_reject_33 = function $$reject() {
        var $iter = TMP_Lazy_reject_33.$$p, block = $iter || nil, TMP_34, self = this;

        if ($iter) TMP_Lazy_reject_33.$$p = null;
        
        
        if ($iter) TMP_Lazy_reject_33.$$p = null;;
        if ($truthy(block)) {
        } else {
          self.$raise($$($nesting, 'ArgumentError'), "tried to call lazy reject without a block")
        };
        return $send($$($nesting, 'Lazy'), 'new', [self, nil], (TMP_34 = function(enum$, $a){var self = TMP_34.$$s || this, $post_args, args;

        
          
          if (enum$ == null) {
            enum$ = nil;
          };
          
          $post_args = Opal.slice.call(arguments, 1, arguments.length);
          
          args = $post_args;;
          
          var value = Opal.yieldX(block, args);

          if ($falsy(value)) {
            $send(enum$, 'yield', Opal.to_a(args));
          }
        ;}, TMP_34.$$s = self, TMP_34.$$arity = -2, TMP_34));
      }, TMP_Lazy_reject_33.$$arity = 0);
      
      Opal.def(self, '$take', TMP_Lazy_take_35 = function $$take(n) {
        var TMP_36, self = this, current_size = nil, set_size = nil, taken = nil;

        
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
        return $send($$($nesting, 'Lazy'), 'new', [self, set_size], (TMP_36 = function(enum$, $a){var self = TMP_36.$$s || this, $post_args, args;

        
          
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
          };}, TMP_36.$$s = self, TMP_36.$$arity = -2, TMP_36));
      }, TMP_Lazy_take_35.$$arity = 1);
      
      Opal.def(self, '$take_while', TMP_Lazy_take_while_37 = function $$take_while() {
        var $iter = TMP_Lazy_take_while_37.$$p, block = $iter || nil, TMP_38, self = this;

        if ($iter) TMP_Lazy_take_while_37.$$p = null;
        
        
        if ($iter) TMP_Lazy_take_while_37.$$p = null;;
        if ($truthy(block)) {
        } else {
          self.$raise($$($nesting, 'ArgumentError'), "tried to call lazy take_while without a block")
        };
        return $send($$($nesting, 'Lazy'), 'new', [self, nil], (TMP_38 = function(enum$, $a){var self = TMP_38.$$s || this, $post_args, args;

        
          
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
        ;}, TMP_38.$$s = self, TMP_38.$$arity = -2, TMP_38));
      }, TMP_Lazy_take_while_37.$$arity = 0);
      Opal.alias(self, "to_enum", "enum_for");
      return (Opal.def(self, '$inspect', TMP_Lazy_inspect_39 = function $$inspect() {
        var self = this;

        return "" + "#<" + (self.$class()) + ": " + (self.enumerator.$inspect()) + ">"
      }, TMP_Lazy_inspect_39.$$arity = 0), nil) && 'inspect';
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
    function $Numeric(){};
    var self = $Numeric = $klass($base, $super, 'Numeric', $Numeric);

    var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_Numeric_coerce_1, TMP_Numeric___coerced___2, TMP_Numeric_$lt$eq$gt_3, TMP_Numeric_$$_4, TMP_Numeric_$$_5, TMP_Numeric_$_6, TMP_Numeric_abs_7, TMP_Numeric_abs2_8, TMP_Numeric_angle_9, TMP_Numeric_ceil_10, TMP_Numeric_conj_11, TMP_Numeric_denominator_12, TMP_Numeric_div_13, TMP_Numeric_divmod_14, TMP_Numeric_fdiv_15, TMP_Numeric_floor_16, TMP_Numeric_i_17, TMP_Numeric_imag_18, TMP_Numeric_integer$q_19, TMP_Numeric_nonzero$q_20, TMP_Numeric_numerator_21, TMP_Numeric_polar_22, TMP_Numeric_quo_23, TMP_Numeric_real_24, TMP_Numeric_real$q_25, TMP_Numeric_rect_26, TMP_Numeric_round_27, TMP_Numeric_to_c_28, TMP_Numeric_to_int_29, TMP_Numeric_truncate_30, TMP_Numeric_zero$q_31, TMP_Numeric_positive$q_32, TMP_Numeric_negative$q_33, TMP_Numeric_dup_34, TMP_Numeric_clone_35, TMP_Numeric_finite$q_36, TMP_Numeric_infinite$q_37;

    
    self.$include($$($nesting, 'Comparable'));
    
    Opal.def(self, '$coerce', TMP_Numeric_coerce_1 = function $$coerce(other) {
      var self = this;

      
      if ($truthy(other['$instance_of?'](self.$class()))) {
        return [other, self]};
      return [self.$Float(other), self.$Float(self)];
    }, TMP_Numeric_coerce_1.$$arity = 1);
    
    Opal.def(self, '$__coerced__', TMP_Numeric___coerced___2 = function $$__coerced__(method, other) {
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
    }, TMP_Numeric___coerced___2.$$arity = 2);
    
    Opal.def(self, '$<=>', TMP_Numeric_$lt$eq$gt_3 = function(other) {
      var self = this;

      
      if ($truthy(self['$equal?'](other))) {
        return 0};
      return nil;
    }, TMP_Numeric_$lt$eq$gt_3.$$arity = 1);
    
    Opal.def(self, '$+@', TMP_Numeric_$$_4 = function() {
      var self = this;

      return self
    }, TMP_Numeric_$$_4.$$arity = 0);
    
    Opal.def(self, '$-@', TMP_Numeric_$$_5 = function() {
      var self = this;

      return $rb_minus(0, self)
    }, TMP_Numeric_$$_5.$$arity = 0);
    
    Opal.def(self, '$%', TMP_Numeric_$_6 = function(other) {
      var self = this;

      return $rb_minus(self, $rb_times(other, self.$div(other)))
    }, TMP_Numeric_$_6.$$arity = 1);
    
    Opal.def(self, '$abs', TMP_Numeric_abs_7 = function $$abs() {
      var self = this;

      if ($rb_lt(self, 0)) {
        return self['$-@']()
      } else {
        return self
      }
    }, TMP_Numeric_abs_7.$$arity = 0);
    
    Opal.def(self, '$abs2', TMP_Numeric_abs2_8 = function $$abs2() {
      var self = this;

      return $rb_times(self, self)
    }, TMP_Numeric_abs2_8.$$arity = 0);
    
    Opal.def(self, '$angle', TMP_Numeric_angle_9 = function $$angle() {
      var self = this;

      if ($rb_lt(self, 0)) {
        return $$$($$($nesting, 'Math'), 'PI')
      } else {
        return 0
      }
    }, TMP_Numeric_angle_9.$$arity = 0);
    Opal.alias(self, "arg", "angle");
    
    Opal.def(self, '$ceil', TMP_Numeric_ceil_10 = function $$ceil(ndigits) {
      var self = this;

      
      
      if (ndigits == null) {
        ndigits = 0;
      };
      return self.$to_f().$ceil(ndigits);
    }, TMP_Numeric_ceil_10.$$arity = -1);
    
    Opal.def(self, '$conj', TMP_Numeric_conj_11 = function $$conj() {
      var self = this;

      return self
    }, TMP_Numeric_conj_11.$$arity = 0);
    Opal.alias(self, "conjugate", "conj");
    
    Opal.def(self, '$denominator', TMP_Numeric_denominator_12 = function $$denominator() {
      var self = this;

      return self.$to_r().$denominator()
    }, TMP_Numeric_denominator_12.$$arity = 0);
    
    Opal.def(self, '$div', TMP_Numeric_div_13 = function $$div(other) {
      var self = this;

      
      if (other['$=='](0)) {
        self.$raise($$($nesting, 'ZeroDivisionError'), "divided by o")};
      return $rb_divide(self, other).$floor();
    }, TMP_Numeric_div_13.$$arity = 1);
    
    Opal.def(self, '$divmod', TMP_Numeric_divmod_14 = function $$divmod(other) {
      var self = this;

      return [self.$div(other), self['$%'](other)]
    }, TMP_Numeric_divmod_14.$$arity = 1);
    
    Opal.def(self, '$fdiv', TMP_Numeric_fdiv_15 = function $$fdiv(other) {
      var self = this;

      return $rb_divide(self.$to_f(), other)
    }, TMP_Numeric_fdiv_15.$$arity = 1);
    
    Opal.def(self, '$floor', TMP_Numeric_floor_16 = function $$floor(ndigits) {
      var self = this;

      
      
      if (ndigits == null) {
        ndigits = 0;
      };
      return self.$to_f().$floor(ndigits);
    }, TMP_Numeric_floor_16.$$arity = -1);
    
    Opal.def(self, '$i', TMP_Numeric_i_17 = function $$i() {
      var self = this;

      return self.$Complex(0, self)
    }, TMP_Numeric_i_17.$$arity = 0);
    
    Opal.def(self, '$imag', TMP_Numeric_imag_18 = function $$imag() {
      var self = this;

      return 0
    }, TMP_Numeric_imag_18.$$arity = 0);
    Opal.alias(self, "imaginary", "imag");
    
    Opal.def(self, '$integer?', TMP_Numeric_integer$q_19 = function() {
      var self = this;

      return false
    }, TMP_Numeric_integer$q_19.$$arity = 0);
    Opal.alias(self, "magnitude", "abs");
    Opal.alias(self, "modulo", "%");
    
    Opal.def(self, '$nonzero?', TMP_Numeric_nonzero$q_20 = function() {
      var self = this;

      if ($truthy(self['$zero?']())) {
        return nil
      } else {
        return self
      }
    }, TMP_Numeric_nonzero$q_20.$$arity = 0);
    
    Opal.def(self, '$numerator', TMP_Numeric_numerator_21 = function $$numerator() {
      var self = this;

      return self.$to_r().$numerator()
    }, TMP_Numeric_numerator_21.$$arity = 0);
    Opal.alias(self, "phase", "arg");
    
    Opal.def(self, '$polar', TMP_Numeric_polar_22 = function $$polar() {
      var self = this;

      return [self.$abs(), self.$arg()]
    }, TMP_Numeric_polar_22.$$arity = 0);
    
    Opal.def(self, '$quo', TMP_Numeric_quo_23 = function $$quo(other) {
      var self = this;

      return $rb_divide($$($nesting, 'Opal')['$coerce_to!'](self, $$($nesting, 'Rational'), "to_r"), other)
    }, TMP_Numeric_quo_23.$$arity = 1);
    
    Opal.def(self, '$real', TMP_Numeric_real_24 = function $$real() {
      var self = this;

      return self
    }, TMP_Numeric_real_24.$$arity = 0);
    
    Opal.def(self, '$real?', TMP_Numeric_real$q_25 = function() {
      var self = this;

      return true
    }, TMP_Numeric_real$q_25.$$arity = 0);
    
    Opal.def(self, '$rect', TMP_Numeric_rect_26 = function $$rect() {
      var self = this;

      return [self, 0]
    }, TMP_Numeric_rect_26.$$arity = 0);
    Opal.alias(self, "rectangular", "rect");
    
    Opal.def(self, '$round', TMP_Numeric_round_27 = function $$round(digits) {
      var self = this;

      
      ;
      return self.$to_f().$round(digits);
    }, TMP_Numeric_round_27.$$arity = -1);
    
    Opal.def(self, '$to_c', TMP_Numeric_to_c_28 = function $$to_c() {
      var self = this;

      return self.$Complex(self, 0)
    }, TMP_Numeric_to_c_28.$$arity = 0);
    
    Opal.def(self, '$to_int', TMP_Numeric_to_int_29 = function $$to_int() {
      var self = this;

      return self.$to_i()
    }, TMP_Numeric_to_int_29.$$arity = 0);
    
    Opal.def(self, '$truncate', TMP_Numeric_truncate_30 = function $$truncate(ndigits) {
      var self = this;

      
      
      if (ndigits == null) {
        ndigits = 0;
      };
      return self.$to_f().$truncate(ndigits);
    }, TMP_Numeric_truncate_30.$$arity = -1);
    
    Opal.def(self, '$zero?', TMP_Numeric_zero$q_31 = function() {
      var self = this;

      return self['$=='](0)
    }, TMP_Numeric_zero$q_31.$$arity = 0);
    
    Opal.def(self, '$positive?', TMP_Numeric_positive$q_32 = function() {
      var self = this;

      return $rb_gt(self, 0)
    }, TMP_Numeric_positive$q_32.$$arity = 0);
    
    Opal.def(self, '$negative?', TMP_Numeric_negative$q_33 = function() {
      var self = this;

      return $rb_lt(self, 0)
    }, TMP_Numeric_negative$q_33.$$arity = 0);
    
    Opal.def(self, '$dup', TMP_Numeric_dup_34 = function $$dup() {
      var self = this;

      return self
    }, TMP_Numeric_dup_34.$$arity = 0);
    
    Opal.def(self, '$clone', TMP_Numeric_clone_35 = function $$clone($kwargs) {
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
    }, TMP_Numeric_clone_35.$$arity = -1);
    
    Opal.def(self, '$finite?', TMP_Numeric_finite$q_36 = function() {
      var self = this;

      return true
    }, TMP_Numeric_finite$q_36.$$arity = 0);
    return (Opal.def(self, '$infinite?', TMP_Numeric_infinite$q_37 = function() {
      var self = this;

      return nil
    }, TMP_Numeric_infinite$q_37.$$arity = 0), nil) && 'infinite?';
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
    function $Array(){};
    var self = $Array = $klass($base, $super, 'Array', $Array);

    var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_Array_$$_1, TMP_Array_initialize_2, TMP_Array_try_convert_3, TMP_Array_$_4, TMP_Array_$_5, TMP_Array_$_6, TMP_Array_$_7, TMP_Array_$_8, TMP_Array_$lt$lt_9, TMP_Array_$lt$eq$gt_10, TMP_Array_$eq$eq_11, TMP_Array_$$_12, TMP_Array_$$$eq_13, TMP_Array_any$q_14, TMP_Array_assoc_15, TMP_Array_at_16, TMP_Array_bsearch_index_17, TMP_Array_bsearch_18, TMP_Array_cycle_19, TMP_Array_clear_21, TMP_Array_count_22, TMP_Array_initialize_copy_23, TMP_Array_collect_24, TMP_Array_collect$B_26, TMP_Array_combination_28, TMP_Array_repeated_combination_30, TMP_Array_compact_32, TMP_Array_compact$B_33, TMP_Array_concat_34, TMP_Array_delete_37, TMP_Array_delete_at_38, TMP_Array_delete_if_39, TMP_Array_dig_41, TMP_Array_drop_42, TMP_Array_dup_43, TMP_Array_each_44, TMP_Array_each_index_46, TMP_Array_empty$q_48, TMP_Array_eql$q_49, TMP_Array_fetch_50, TMP_Array_fill_51, TMP_Array_first_52, TMP_Array_flatten_53, TMP_Array_flatten$B_54, TMP_Array_hash_55, TMP_Array_include$q_56, TMP_Array_index_57, TMP_Array_insert_58, TMP_Array_inspect_59, TMP_Array_join_60, TMP_Array_keep_if_61, TMP_Array_last_63, TMP_Array_length_64, TMP_Array_max_65, TMP_Array_min_66, TMP_Array_permutation_67, TMP_Array_repeated_permutation_69, TMP_Array_pop_71, TMP_Array_product_72, TMP_Array_push_73, TMP_Array_rassoc_74, TMP_Array_reject_75, TMP_Array_reject$B_77, TMP_Array_replace_79, TMP_Array_reverse_80, TMP_Array_reverse$B_81, TMP_Array_reverse_each_82, TMP_Array_rindex_84, TMP_Array_rotate_85, TMP_Array_rotate$B_86, TMP_Array_sample_89, TMP_Array_select_90, TMP_Array_select$B_92, TMP_Array_shift_94, TMP_Array_shuffle_95, TMP_Array_shuffle$B_96, TMP_Array_slice$B_97, TMP_Array_sort_98, TMP_Array_sort$B_99, TMP_Array_sort_by$B_100, TMP_Array_take_102, TMP_Array_take_while_103, TMP_Array_to_a_104, TMP_Array_to_h_105, TMP_Array_transpose_106, TMP_Array_uniq_109, TMP_Array_uniq$B_110, TMP_Array_unshift_111, TMP_Array_values_at_112, TMP_Array_zip_115, TMP_Array_inherited_116, TMP_Array_instance_variables_117, TMP_Array_pack_119;

    
    self.$include($$($nesting, 'Enumerable'));
    Opal.defineProperty(Array.prototype, '$$is_array', true);
    
    function toArraySubclass(obj, klass) {
      if (klass.$$name === Opal.Array) {
        return obj;
      } else {
        return klass.$allocate().$replace((obj).$to_a());
      }
    }
  ;
    Opal.defs(self, '$[]', TMP_Array_$$_1 = function($a) {
      var $post_args, objects, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      objects = $post_args;;
      return toArraySubclass(objects, self);;
    }, TMP_Array_$$_1.$$arity = -1);
    
    Opal.def(self, '$initialize', TMP_Array_initialize_2 = function $$initialize(size, obj) {
      var $iter = TMP_Array_initialize_2.$$p, block = $iter || nil, self = this;

      if ($iter) TMP_Array_initialize_2.$$p = null;
      
      
      if ($iter) TMP_Array_initialize_2.$$p = null;;
      
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
    }, TMP_Array_initialize_2.$$arity = -1);
    Opal.defs(self, '$try_convert', TMP_Array_try_convert_3 = function $$try_convert(obj) {
      var self = this;

      return $$($nesting, 'Opal')['$coerce_to?'](obj, $$($nesting, 'Array'), "to_ary")
    }, TMP_Array_try_convert_3.$$arity = 1);
    
    Opal.def(self, '$&', TMP_Array_$_4 = function(other) {
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
    }, TMP_Array_$_4.$$arity = 1);
    
    Opal.def(self, '$|', TMP_Array_$_5 = function(other) {
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
    }, TMP_Array_$_5.$$arity = 1);
    
    Opal.def(self, '$*', TMP_Array_$_6 = function(other) {
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
    }, TMP_Array_$_6.$$arity = 1);
    
    Opal.def(self, '$+', TMP_Array_$_7 = function(other) {
      var self = this;

      
      other = (function() {if ($truthy($$($nesting, 'Array')['$==='](other))) {
        return other.$to_a()
      } else {
        return $$($nesting, 'Opal').$coerce_to(other, $$($nesting, 'Array'), "to_ary").$to_a()
      }; return nil; })();
      return self.concat(other);;
    }, TMP_Array_$_7.$$arity = 1);
    
    Opal.def(self, '$-', TMP_Array_$_8 = function(other) {
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
    }, TMP_Array_$_8.$$arity = 1);
    
    Opal.def(self, '$<<', TMP_Array_$lt$lt_9 = function(object) {
      var self = this;

      
      self.push(object);
      return self;
    }, TMP_Array_$lt$lt_9.$$arity = 1);
    
    Opal.def(self, '$<=>', TMP_Array_$lt$eq$gt_10 = function(other) {
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
    }, TMP_Array_$lt$eq$gt_10.$$arity = 1);
    
    Opal.def(self, '$==', TMP_Array_$eq$eq_11 = function(other) {
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

        if (array.constructor !== Array)
          array = (array).$to_a();
        if (other.constructor !== Array)
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
    
    }, TMP_Array_$eq$eq_11.$$arity = 1);
    
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
    
    Opal.def(self, '$[]', TMP_Array_$$_12 = function(index, length) {
      var self = this;

      
      ;
      
      if (index.$$is_range) {
        return $array_slice_range(self, index);
      }
      else {
        return $array_slice_index_length(self, index, length);
      }
    ;
    }, TMP_Array_$$_12.$$arity = -2);
    
    Opal.def(self, '$[]=', TMP_Array_$$$eq_13 = function(index, value, extra) {
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
    }, TMP_Array_$$$eq_13.$$arity = -3);
    
    Opal.def(self, '$any?', TMP_Array_any$q_14 = function(pattern) {
      var $iter = TMP_Array_any$q_14.$$p, block = $iter || nil, self = this, $zuper = nil, $zuper_i = nil, $zuper_ii = nil;

      if ($iter) TMP_Array_any$q_14.$$p = null;
      // Prepare super implicit arguments
      for($zuper_i = 0, $zuper_ii = arguments.length, $zuper = new Array($zuper_ii); $zuper_i < $zuper_ii; $zuper_i++) {
        $zuper[$zuper_i] = arguments[$zuper_i];
      }
      
      
      if ($iter) TMP_Array_any$q_14.$$p = null;;
      ;
      if (self.length === 0) return false;
      return $send(self, Opal.find_super_dispatcher(self, 'any?', TMP_Array_any$q_14, false), $zuper, $iter);
    }, TMP_Array_any$q_14.$$arity = -1);
    
    Opal.def(self, '$assoc', TMP_Array_assoc_15 = function $$assoc(object) {
      var self = this;

      
      for (var i = 0, length = self.length, item; i < length; i++) {
        if (item = self[i], item.length && (item[0])['$=='](object)) {
          return item;
        }
      }

      return nil;
    
    }, TMP_Array_assoc_15.$$arity = 1);
    
    Opal.def(self, '$at', TMP_Array_at_16 = function $$at(index) {
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
    }, TMP_Array_at_16.$$arity = 1);
    
    Opal.def(self, '$bsearch_index', TMP_Array_bsearch_index_17 = function $$bsearch_index() {
      var $iter = TMP_Array_bsearch_index_17.$$p, block = $iter || nil, self = this;

      if ($iter) TMP_Array_bsearch_index_17.$$p = null;
      
      
      if ($iter) TMP_Array_bsearch_index_17.$$p = null;;
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
    }, TMP_Array_bsearch_index_17.$$arity = 0);
    
    Opal.def(self, '$bsearch', TMP_Array_bsearch_18 = function $$bsearch() {
      var $iter = TMP_Array_bsearch_18.$$p, block = $iter || nil, self = this, index = nil;

      if ($iter) TMP_Array_bsearch_18.$$p = null;
      
      
      if ($iter) TMP_Array_bsearch_18.$$p = null;;
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
    }, TMP_Array_bsearch_18.$$arity = 0);
    
    Opal.def(self, '$cycle', TMP_Array_cycle_19 = function $$cycle(n) {
      var $iter = TMP_Array_cycle_19.$$p, block = $iter || nil, TMP_20, $a, self = this;

      if ($iter) TMP_Array_cycle_19.$$p = null;
      
      
      if ($iter) TMP_Array_cycle_19.$$p = null;;
      
      if (n == null) {
        n = nil;
      };
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["cycle", n], (TMP_20 = function(){var self = TMP_20.$$s || this;

        if ($truthy(n['$nil?']())) {
            return $$$($$($nesting, 'Float'), 'INFINITY')
          } else {
            
            n = $$($nesting, 'Opal')['$coerce_to!'](n, $$($nesting, 'Integer'), "to_int");
            if ($truthy($rb_gt(n, 0))) {
              return $rb_times(self.$enumerator_size(), n)
            } else {
              return 0
            };
          }}, TMP_20.$$s = self, TMP_20.$$arity = 0, TMP_20))
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
    }, TMP_Array_cycle_19.$$arity = -1);
    
    Opal.def(self, '$clear', TMP_Array_clear_21 = function $$clear() {
      var self = this;

      
      self.splice(0, self.length);
      return self;
    }, TMP_Array_clear_21.$$arity = 0);
    
    Opal.def(self, '$count', TMP_Array_count_22 = function $$count(object) {
      var $iter = TMP_Array_count_22.$$p, block = $iter || nil, $a, self = this, $zuper = nil, $zuper_i = nil, $zuper_ii = nil;

      if ($iter) TMP_Array_count_22.$$p = null;
      // Prepare super implicit arguments
      for($zuper_i = 0, $zuper_ii = arguments.length, $zuper = new Array($zuper_ii); $zuper_i < $zuper_ii; $zuper_i++) {
        $zuper[$zuper_i] = arguments[$zuper_i];
      }
      
      
      if ($iter) TMP_Array_count_22.$$p = null;;
      
      if (object == null) {
        object = nil;
      };
      if ($truthy(($truthy($a = object) ? $a : block))) {
        return $send(self, Opal.find_super_dispatcher(self, 'count', TMP_Array_count_22, false), $zuper, $iter)
      } else {
        return self.$size()
      };
    }, TMP_Array_count_22.$$arity = -1);
    
    Opal.def(self, '$initialize_copy', TMP_Array_initialize_copy_23 = function $$initialize_copy(other) {
      var self = this;

      return self.$replace(other)
    }, TMP_Array_initialize_copy_23.$$arity = 1);
    
    Opal.def(self, '$collect', TMP_Array_collect_24 = function $$collect() {
      var $iter = TMP_Array_collect_24.$$p, block = $iter || nil, TMP_25, self = this;

      if ($iter) TMP_Array_collect_24.$$p = null;
      
      
      if ($iter) TMP_Array_collect_24.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["collect"], (TMP_25 = function(){var self = TMP_25.$$s || this;

        return self.$size()}, TMP_25.$$s = self, TMP_25.$$arity = 0, TMP_25))
      };
      
      var result = [];

      for (var i = 0, length = self.length; i < length; i++) {
        var value = Opal.yield1(block, self[i]);
        result.push(value);
      }

      return result;
    ;
    }, TMP_Array_collect_24.$$arity = 0);
    
    Opal.def(self, '$collect!', TMP_Array_collect$B_26 = function() {
      var $iter = TMP_Array_collect$B_26.$$p, block = $iter || nil, TMP_27, self = this;

      if ($iter) TMP_Array_collect$B_26.$$p = null;
      
      
      if ($iter) TMP_Array_collect$B_26.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["collect!"], (TMP_27 = function(){var self = TMP_27.$$s || this;

        return self.$size()}, TMP_27.$$s = self, TMP_27.$$arity = 0, TMP_27))
      };
      
      for (var i = 0, length = self.length; i < length; i++) {
        var value = Opal.yield1(block, self[i]);
        self[i] = value;
      }
    ;
      return self;
    }, TMP_Array_collect$B_26.$$arity = 0);
    
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
    
    Opal.def(self, '$combination', TMP_Array_combination_28 = function $$combination(n) {
      var TMP_29, $iter = TMP_Array_combination_28.$$p, $yield = $iter || nil, self = this, num = nil;

      if ($iter) TMP_Array_combination_28.$$p = null;
      
      num = $$($nesting, 'Opal')['$coerce_to!'](n, $$($nesting, 'Integer'), "to_int");
      if (($yield !== nil)) {
      } else {
        return $send(self, 'enum_for', ["combination", num], (TMP_29 = function(){var self = TMP_29.$$s || this;

        return binomial_coefficient(self.length, num)}, TMP_29.$$s = self, TMP_29.$$arity = 0, TMP_29))
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
    }, TMP_Array_combination_28.$$arity = 1);
    
    Opal.def(self, '$repeated_combination', TMP_Array_repeated_combination_30 = function $$repeated_combination(n) {
      var TMP_31, $iter = TMP_Array_repeated_combination_30.$$p, $yield = $iter || nil, self = this, num = nil;

      if ($iter) TMP_Array_repeated_combination_30.$$p = null;
      
      num = $$($nesting, 'Opal')['$coerce_to!'](n, $$($nesting, 'Integer'), "to_int");
      if (($yield !== nil)) {
      } else {
        return $send(self, 'enum_for', ["repeated_combination", num], (TMP_31 = function(){var self = TMP_31.$$s || this;

        return binomial_coefficient(self.length + num - 1, num);}, TMP_31.$$s = self, TMP_31.$$arity = 0, TMP_31))
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
    }, TMP_Array_repeated_combination_30.$$arity = 1);
    
    Opal.def(self, '$compact', TMP_Array_compact_32 = function $$compact() {
      var self = this;

      
      var result = [];

      for (var i = 0, length = self.length, item; i < length; i++) {
        if ((item = self[i]) !== nil) {
          result.push(item);
        }
      }

      return result;
    
    }, TMP_Array_compact_32.$$arity = 0);
    
    Opal.def(self, '$compact!', TMP_Array_compact$B_33 = function() {
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
    
    }, TMP_Array_compact$B_33.$$arity = 0);
    
    Opal.def(self, '$concat', TMP_Array_concat_34 = function $$concat($a) {
      var $post_args, others, TMP_35, TMP_36, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      others = $post_args;;
      others = $send(others, 'map', [], (TMP_35 = function(other){var self = TMP_35.$$s || this;

      
        
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
        return other;}, TMP_35.$$s = self, TMP_35.$$arity = 1, TMP_35));
      $send(others, 'each', [], (TMP_36 = function(other){var self = TMP_36.$$s || this;

      
        
        if (other == null) {
          other = nil;
        };
        
        for (var i = 0, length = other.length; i < length; i++) {
          self.push(other[i]);
        }
      ;}, TMP_36.$$s = self, TMP_36.$$arity = 1, TMP_36));
      return self;
    }, TMP_Array_concat_34.$$arity = -1);
    
    Opal.def(self, '$delete', TMP_Array_delete_37 = function(object) {
      var $iter = TMP_Array_delete_37.$$p, $yield = $iter || nil, self = this;

      if ($iter) TMP_Array_delete_37.$$p = null;
      
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
    
    }, TMP_Array_delete_37.$$arity = 1);
    
    Opal.def(self, '$delete_at', TMP_Array_delete_at_38 = function $$delete_at(index) {
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
    
    }, TMP_Array_delete_at_38.$$arity = 1);
    
    Opal.def(self, '$delete_if', TMP_Array_delete_if_39 = function $$delete_if() {
      var $iter = TMP_Array_delete_if_39.$$p, block = $iter || nil, TMP_40, self = this;

      if ($iter) TMP_Array_delete_if_39.$$p = null;
      
      
      if ($iter) TMP_Array_delete_if_39.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["delete_if"], (TMP_40 = function(){var self = TMP_40.$$s || this;

        return self.$size()}, TMP_40.$$s = self, TMP_40.$$arity = 0, TMP_40))
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
    }, TMP_Array_delete_if_39.$$arity = 0);
    
    Opal.def(self, '$dig', TMP_Array_dig_41 = function $$dig(idx, $a) {
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
    }, TMP_Array_dig_41.$$arity = -2);
    
    Opal.def(self, '$drop', TMP_Array_drop_42 = function $$drop(number) {
      var self = this;

      
      if (number < 0) {
        self.$raise($$($nesting, 'ArgumentError'))
      }

      return self.slice(number);
    
    }, TMP_Array_drop_42.$$arity = 1);
    
    Opal.def(self, '$dup', TMP_Array_dup_43 = function $$dup() {
      var $iter = TMP_Array_dup_43.$$p, $yield = $iter || nil, self = this, $zuper = nil, $zuper_i = nil, $zuper_ii = nil;

      if ($iter) TMP_Array_dup_43.$$p = null;
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
      return $send(self, Opal.find_super_dispatcher(self, 'dup', TMP_Array_dup_43, false), $zuper, $iter);
    }, TMP_Array_dup_43.$$arity = 0);
    
    Opal.def(self, '$each', TMP_Array_each_44 = function $$each() {
      var $iter = TMP_Array_each_44.$$p, block = $iter || nil, TMP_45, self = this;

      if ($iter) TMP_Array_each_44.$$p = null;
      
      
      if ($iter) TMP_Array_each_44.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["each"], (TMP_45 = function(){var self = TMP_45.$$s || this;

        return self.$size()}, TMP_45.$$s = self, TMP_45.$$arity = 0, TMP_45))
      };
      
      for (var i = 0, length = self.length; i < length; i++) {
        var value = Opal.yield1(block, self[i]);
      }
    ;
      return self;
    }, TMP_Array_each_44.$$arity = 0);
    
    Opal.def(self, '$each_index', TMP_Array_each_index_46 = function $$each_index() {
      var $iter = TMP_Array_each_index_46.$$p, block = $iter || nil, TMP_47, self = this;

      if ($iter) TMP_Array_each_index_46.$$p = null;
      
      
      if ($iter) TMP_Array_each_index_46.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["each_index"], (TMP_47 = function(){var self = TMP_47.$$s || this;

        return self.$size()}, TMP_47.$$s = self, TMP_47.$$arity = 0, TMP_47))
      };
      
      for (var i = 0, length = self.length; i < length; i++) {
        var value = Opal.yield1(block, i);
      }
    ;
      return self;
    }, TMP_Array_each_index_46.$$arity = 0);
    
    Opal.def(self, '$empty?', TMP_Array_empty$q_48 = function() {
      var self = this;

      return self.length === 0;
    }, TMP_Array_empty$q_48.$$arity = 0);
    
    Opal.def(self, '$eql?', TMP_Array_eql$q_49 = function(other) {
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
    
    }, TMP_Array_eql$q_49.$$arity = 1);
    
    Opal.def(self, '$fetch', TMP_Array_fetch_50 = function $$fetch(index, defaults) {
      var $iter = TMP_Array_fetch_50.$$p, block = $iter || nil, self = this;

      if ($iter) TMP_Array_fetch_50.$$p = null;
      
      
      if ($iter) TMP_Array_fetch_50.$$p = null;;
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
    }, TMP_Array_fetch_50.$$arity = -2);
    
    Opal.def(self, '$fill', TMP_Array_fill_51 = function $$fill($a) {
      var $iter = TMP_Array_fill_51.$$p, block = $iter || nil, $post_args, args, $b, $c, self = this, one = nil, two = nil, obj = nil, left = nil, right = nil;

      if ($iter) TMP_Array_fill_51.$$p = null;
      
      
      if ($iter) TMP_Array_fill_51.$$p = null;;
      
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
    }, TMP_Array_fill_51.$$arity = -1);
    
    Opal.def(self, '$first', TMP_Array_first_52 = function $$first(count) {
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
    }, TMP_Array_first_52.$$arity = -1);
    
    Opal.def(self, '$flatten', TMP_Array_flatten_53 = function $$flatten(level) {
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
    }, TMP_Array_flatten_53.$$arity = -1);
    
    Opal.def(self, '$flatten!', TMP_Array_flatten$B_54 = function(level) {
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
    }, TMP_Array_flatten$B_54.$$arity = -1);
    
    Opal.def(self, '$hash', TMP_Array_hash_55 = function $$hash() {
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
    
    }, TMP_Array_hash_55.$$arity = 0);
    
    Opal.def(self, '$include?', TMP_Array_include$q_56 = function(member) {
      var self = this;

      
      for (var i = 0, length = self.length; i < length; i++) {
        if ((self[i])['$=='](member)) {
          return true;
        }
      }

      return false;
    
    }, TMP_Array_include$q_56.$$arity = 1);
    
    Opal.def(self, '$index', TMP_Array_index_57 = function $$index(object) {
      var $iter = TMP_Array_index_57.$$p, block = $iter || nil, self = this;

      if ($iter) TMP_Array_index_57.$$p = null;
      
      
      if ($iter) TMP_Array_index_57.$$p = null;;
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
    }, TMP_Array_index_57.$$arity = -1);
    
    Opal.def(self, '$insert', TMP_Array_insert_58 = function $$insert(index, $a) {
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
    }, TMP_Array_insert_58.$$arity = -2);
    
    Opal.def(self, '$inspect', TMP_Array_inspect_59 = function $$inspect() {
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
    
    }, TMP_Array_inspect_59.$$arity = 0);
    
    Opal.def(self, '$join', TMP_Array_join_60 = function $$join(sep) {
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
    }, TMP_Array_join_60.$$arity = -1);
    
    Opal.def(self, '$keep_if', TMP_Array_keep_if_61 = function $$keep_if() {
      var $iter = TMP_Array_keep_if_61.$$p, block = $iter || nil, TMP_62, self = this;

      if ($iter) TMP_Array_keep_if_61.$$p = null;
      
      
      if ($iter) TMP_Array_keep_if_61.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["keep_if"], (TMP_62 = function(){var self = TMP_62.$$s || this;

        return self.$size()}, TMP_62.$$s = self, TMP_62.$$arity = 0, TMP_62))
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
    }, TMP_Array_keep_if_61.$$arity = 0);
    
    Opal.def(self, '$last', TMP_Array_last_63 = function $$last(count) {
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
    }, TMP_Array_last_63.$$arity = -1);
    
    Opal.def(self, '$length', TMP_Array_length_64 = function $$length() {
      var self = this;

      return self.length;
    }, TMP_Array_length_64.$$arity = 0);
    Opal.alias(self, "map", "collect");
    Opal.alias(self, "map!", "collect!");
    
    Opal.def(self, '$max', TMP_Array_max_65 = function $$max(n) {
      var $iter = TMP_Array_max_65.$$p, block = $iter || nil, self = this;

      if ($iter) TMP_Array_max_65.$$p = null;
      
      
      if ($iter) TMP_Array_max_65.$$p = null;;
      ;
      return $send(self.$each(), 'max', [n], block.$to_proc());
    }, TMP_Array_max_65.$$arity = -1);
    
    Opal.def(self, '$min', TMP_Array_min_66 = function $$min() {
      var $iter = TMP_Array_min_66.$$p, block = $iter || nil, self = this;

      if ($iter) TMP_Array_min_66.$$p = null;
      
      
      if ($iter) TMP_Array_min_66.$$p = null;;
      return $send(self.$each(), 'min', [], block.$to_proc());
    }, TMP_Array_min_66.$$arity = 0);
    
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
    
    Opal.def(self, '$permutation', TMP_Array_permutation_67 = function $$permutation(num) {
      var $iter = TMP_Array_permutation_67.$$p, block = $iter || nil, TMP_68, self = this, perm = nil, used = nil;

      if ($iter) TMP_Array_permutation_67.$$p = null;
      
      
      if ($iter) TMP_Array_permutation_67.$$p = null;;
      ;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["permutation", num], (TMP_68 = function(){var self = TMP_68.$$s || this;

        return descending_factorial(self.length, num === undefined ? self.length : num);}, TMP_68.$$s = self, TMP_68.$$arity = 0, TMP_68))
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
    }, TMP_Array_permutation_67.$$arity = -1);
    
    Opal.def(self, '$repeated_permutation', TMP_Array_repeated_permutation_69 = function $$repeated_permutation(n) {
      var TMP_70, $iter = TMP_Array_repeated_permutation_69.$$p, $yield = $iter || nil, self = this, num = nil;

      if ($iter) TMP_Array_repeated_permutation_69.$$p = null;
      
      num = $$($nesting, 'Opal')['$coerce_to!'](n, $$($nesting, 'Integer'), "to_int");
      if (($yield !== nil)) {
      } else {
        return $send(self, 'enum_for', ["repeated_permutation", num], (TMP_70 = function(){var self = TMP_70.$$s || this;

        if ($truthy($rb_ge(num, 0))) {
            return self.$size()['$**'](num)
          } else {
            return 0
          }}, TMP_70.$$s = self, TMP_70.$$arity = 0, TMP_70))
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
    }, TMP_Array_repeated_permutation_69.$$arity = 1);
    
    Opal.def(self, '$pop', TMP_Array_pop_71 = function $$pop(count) {
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
    }, TMP_Array_pop_71.$$arity = -1);
    
    Opal.def(self, '$product', TMP_Array_product_72 = function $$product($a) {
      var $iter = TMP_Array_product_72.$$p, block = $iter || nil, $post_args, args, self = this;

      if ($iter) TMP_Array_product_72.$$p = null;
      
      
      if ($iter) TMP_Array_product_72.$$p = null;;
      
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
    }, TMP_Array_product_72.$$arity = -1);
    
    Opal.def(self, '$push', TMP_Array_push_73 = function $$push($a) {
      var $post_args, objects, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      objects = $post_args;;
      
      for (var i = 0, length = objects.length; i < length; i++) {
        self.push(objects[i]);
      }
    ;
      return self;
    }, TMP_Array_push_73.$$arity = -1);
    Opal.alias(self, "append", "push");
    
    Opal.def(self, '$rassoc', TMP_Array_rassoc_74 = function $$rassoc(object) {
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
    
    }, TMP_Array_rassoc_74.$$arity = 1);
    
    Opal.def(self, '$reject', TMP_Array_reject_75 = function $$reject() {
      var $iter = TMP_Array_reject_75.$$p, block = $iter || nil, TMP_76, self = this;

      if ($iter) TMP_Array_reject_75.$$p = null;
      
      
      if ($iter) TMP_Array_reject_75.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["reject"], (TMP_76 = function(){var self = TMP_76.$$s || this;

        return self.$size()}, TMP_76.$$s = self, TMP_76.$$arity = 0, TMP_76))
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
    }, TMP_Array_reject_75.$$arity = 0);
    
    Opal.def(self, '$reject!', TMP_Array_reject$B_77 = function() {
      var $iter = TMP_Array_reject$B_77.$$p, block = $iter || nil, TMP_78, self = this, original = nil;

      if ($iter) TMP_Array_reject$B_77.$$p = null;
      
      
      if ($iter) TMP_Array_reject$B_77.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["reject!"], (TMP_78 = function(){var self = TMP_78.$$s || this;

        return self.$size()}, TMP_78.$$s = self, TMP_78.$$arity = 0, TMP_78))
      };
      original = self.$length();
      $send(self, 'delete_if', [], block.$to_proc());
      if (self.$length()['$=='](original)) {
        return nil
      } else {
        return self
      };
    }, TMP_Array_reject$B_77.$$arity = 0);
    
    Opal.def(self, '$replace', TMP_Array_replace_79 = function $$replace(other) {
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
    }, TMP_Array_replace_79.$$arity = 1);
    
    Opal.def(self, '$reverse', TMP_Array_reverse_80 = function $$reverse() {
      var self = this;

      return self.slice(0).reverse();
    }, TMP_Array_reverse_80.$$arity = 0);
    
    Opal.def(self, '$reverse!', TMP_Array_reverse$B_81 = function() {
      var self = this;

      return self.reverse();
    }, TMP_Array_reverse$B_81.$$arity = 0);
    
    Opal.def(self, '$reverse_each', TMP_Array_reverse_each_82 = function $$reverse_each() {
      var $iter = TMP_Array_reverse_each_82.$$p, block = $iter || nil, TMP_83, self = this;

      if ($iter) TMP_Array_reverse_each_82.$$p = null;
      
      
      if ($iter) TMP_Array_reverse_each_82.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["reverse_each"], (TMP_83 = function(){var self = TMP_83.$$s || this;

        return self.$size()}, TMP_83.$$s = self, TMP_83.$$arity = 0, TMP_83))
      };
      $send(self.$reverse(), 'each', [], block.$to_proc());
      return self;
    }, TMP_Array_reverse_each_82.$$arity = 0);
    
    Opal.def(self, '$rindex', TMP_Array_rindex_84 = function $$rindex(object) {
      var $iter = TMP_Array_rindex_84.$$p, block = $iter || nil, self = this;

      if ($iter) TMP_Array_rindex_84.$$p = null;
      
      
      if ($iter) TMP_Array_rindex_84.$$p = null;;
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
    }, TMP_Array_rindex_84.$$arity = -1);
    
    Opal.def(self, '$rotate', TMP_Array_rotate_85 = function $$rotate(n) {
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
    }, TMP_Array_rotate_85.$$arity = -1);
    
    Opal.def(self, '$rotate!', TMP_Array_rotate$B_86 = function(cnt) {
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
    }, TMP_Array_rotate$B_86.$$arity = -1);
    (function($base, $super, $parent_nesting) {
      function $SampleRandom(){};
      var self = $SampleRandom = $klass($base, $super, 'SampleRandom', $SampleRandom);

      var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_SampleRandom_initialize_87, TMP_SampleRandom_rand_88;

      def.rng = nil;
      
      
      Opal.def(self, '$initialize', TMP_SampleRandom_initialize_87 = function $$initialize(rng) {
        var self = this;

        return (self.rng = rng)
      }, TMP_SampleRandom_initialize_87.$$arity = 1);
      return (Opal.def(self, '$rand', TMP_SampleRandom_rand_88 = function $$rand(size) {
        var self = this, random = nil;

        
        random = $$($nesting, 'Opal').$coerce_to(self.rng.$rand(size), $$($nesting, 'Integer'), "to_int");
        if ($truthy(random < 0)) {
          self.$raise($$($nesting, 'RangeError'), "random value must be >= 0")};
        if ($truthy(random < size)) {
        } else {
          self.$raise($$($nesting, 'RangeError'), "random value must be less than Array size")
        };
        return random;
      }, TMP_SampleRandom_rand_88.$$arity = 1), nil) && 'rand';
    })($nesting[0], null, $nesting);
    
    Opal.def(self, '$sample', TMP_Array_sample_89 = function $$sample(count, options) {
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
    }, TMP_Array_sample_89.$$arity = -1);
    
    Opal.def(self, '$select', TMP_Array_select_90 = function $$select() {
      var $iter = TMP_Array_select_90.$$p, block = $iter || nil, TMP_91, self = this;

      if ($iter) TMP_Array_select_90.$$p = null;
      
      
      if ($iter) TMP_Array_select_90.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["select"], (TMP_91 = function(){var self = TMP_91.$$s || this;

        return self.$size()}, TMP_91.$$s = self, TMP_91.$$arity = 0, TMP_91))
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
    }, TMP_Array_select_90.$$arity = 0);
    
    Opal.def(self, '$select!', TMP_Array_select$B_92 = function() {
      var $iter = TMP_Array_select$B_92.$$p, block = $iter || nil, TMP_93, self = this;

      if ($iter) TMP_Array_select$B_92.$$p = null;
      
      
      if ($iter) TMP_Array_select$B_92.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["select!"], (TMP_93 = function(){var self = TMP_93.$$s || this;

        return self.$size()}, TMP_93.$$s = self, TMP_93.$$arity = 0, TMP_93))
      };
      
      var original = self.length;
      $send(self, 'keep_if', [], block.$to_proc());
      return self.length === original ? nil : self;
    ;
    }, TMP_Array_select$B_92.$$arity = 0);
    
    Opal.def(self, '$shift', TMP_Array_shift_94 = function $$shift(count) {
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
    }, TMP_Array_shift_94.$$arity = -1);
    Opal.alias(self, "size", "length");
    
    Opal.def(self, '$shuffle', TMP_Array_shuffle_95 = function $$shuffle(rng) {
      var self = this;

      
      ;
      return self.$dup().$to_a()['$shuffle!'](rng);
    }, TMP_Array_shuffle_95.$$arity = -1);
    
    Opal.def(self, '$shuffle!', TMP_Array_shuffle$B_96 = function(rng) {
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
    }, TMP_Array_shuffle$B_96.$$arity = -1);
    Opal.alias(self, "slice", "[]");
    
    Opal.def(self, '$slice!', TMP_Array_slice$B_97 = function(index, length) {
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
    }, TMP_Array_slice$B_97.$$arity = -2);
    
    Opal.def(self, '$sort', TMP_Array_sort_98 = function $$sort() {
      var $iter = TMP_Array_sort_98.$$p, block = $iter || nil, self = this;

      if ($iter) TMP_Array_sort_98.$$p = null;
      
      
      if ($iter) TMP_Array_sort_98.$$p = null;;
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
    }, TMP_Array_sort_98.$$arity = 0);
    
    Opal.def(self, '$sort!', TMP_Array_sort$B_99 = function() {
      var $iter = TMP_Array_sort$B_99.$$p, block = $iter || nil, self = this;

      if ($iter) TMP_Array_sort$B_99.$$p = null;
      
      
      if ($iter) TMP_Array_sort$B_99.$$p = null;;
      
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
    }, TMP_Array_sort$B_99.$$arity = 0);
    
    Opal.def(self, '$sort_by!', TMP_Array_sort_by$B_100 = function() {
      var $iter = TMP_Array_sort_by$B_100.$$p, block = $iter || nil, TMP_101, self = this;

      if ($iter) TMP_Array_sort_by$B_100.$$p = null;
      
      
      if ($iter) TMP_Array_sort_by$B_100.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["sort_by!"], (TMP_101 = function(){var self = TMP_101.$$s || this;

        return self.$size()}, TMP_101.$$s = self, TMP_101.$$arity = 0, TMP_101))
      };
      return self.$replace($send(self, 'sort_by', [], block.$to_proc()));
    }, TMP_Array_sort_by$B_100.$$arity = 0);
    
    Opal.def(self, '$take', TMP_Array_take_102 = function $$take(count) {
      var self = this;

      
      if (count < 0) {
        self.$raise($$($nesting, 'ArgumentError'));
      }

      return self.slice(0, count);
    
    }, TMP_Array_take_102.$$arity = 1);
    
    Opal.def(self, '$take_while', TMP_Array_take_while_103 = function $$take_while() {
      var $iter = TMP_Array_take_while_103.$$p, block = $iter || nil, self = this;

      if ($iter) TMP_Array_take_while_103.$$p = null;
      
      
      if ($iter) TMP_Array_take_while_103.$$p = null;;
      
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
    }, TMP_Array_take_while_103.$$arity = 0);
    
    Opal.def(self, '$to_a', TMP_Array_to_a_104 = function $$to_a() {
      var self = this;

      return self
    }, TMP_Array_to_a_104.$$arity = 0);
    Opal.alias(self, "to_ary", "to_a");
    
    Opal.def(self, '$to_h', TMP_Array_to_h_105 = function $$to_h() {
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
    
    }, TMP_Array_to_h_105.$$arity = 0);
    Opal.alias(self, "to_s", "inspect");
    
    Opal.def(self, '$transpose', TMP_Array_transpose_106 = function $$transpose() {
      var TMP_107, self = this, result = nil, max = nil;

      
      if ($truthy(self['$empty?']())) {
        return []};
      result = [];
      max = nil;
      $send(self, 'each', [], (TMP_107 = function(row){var self = TMP_107.$$s || this, $a, TMP_108;

      
        
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
        return $send((row.length), 'times', [], (TMP_108 = function(i){var self = TMP_108.$$s || this, $b, entry = nil, $writer = nil;

        
          
          if (i == null) {
            i = nil;
          };
          entry = ($truthy($b = result['$[]'](i)) ? $b : (($writer = [i, []]), $send(result, '[]=', Opal.to_a($writer)), $writer[$rb_minus($writer["length"], 1)]));
          return entry['$<<'](row.$at(i));}, TMP_108.$$s = self, TMP_108.$$arity = 1, TMP_108));}, TMP_107.$$s = self, TMP_107.$$arity = 1, TMP_107));
      return result;
    }, TMP_Array_transpose_106.$$arity = 0);
    
    Opal.def(self, '$uniq', TMP_Array_uniq_109 = function $$uniq() {
      var $iter = TMP_Array_uniq_109.$$p, block = $iter || nil, self = this;

      if ($iter) TMP_Array_uniq_109.$$p = null;
      
      
      if ($iter) TMP_Array_uniq_109.$$p = null;;
      
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
    }, TMP_Array_uniq_109.$$arity = 0);
    
    Opal.def(self, '$uniq!', TMP_Array_uniq$B_110 = function() {
      var $iter = TMP_Array_uniq$B_110.$$p, block = $iter || nil, self = this;

      if ($iter) TMP_Array_uniq$B_110.$$p = null;
      
      
      if ($iter) TMP_Array_uniq$B_110.$$p = null;;
      
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
    }, TMP_Array_uniq$B_110.$$arity = 0);
    
    Opal.def(self, '$unshift', TMP_Array_unshift_111 = function $$unshift($a) {
      var $post_args, objects, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      objects = $post_args;;
      
      for (var i = objects.length - 1; i >= 0; i--) {
        self.unshift(objects[i]);
      }
    ;
      return self;
    }, TMP_Array_unshift_111.$$arity = -1);
    Opal.alias(self, "prepend", "unshift");
    
    Opal.def(self, '$values_at', TMP_Array_values_at_112 = function $$values_at($a) {
      var $post_args, args, TMP_113, self = this, out = nil;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      out = [];
      $send(args, 'each', [], (TMP_113 = function(elem){var self = TMP_113.$$s || this, TMP_114, finish = nil, start = nil, i = nil;

      
        
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
          return $send(start, 'upto', [finish], (TMP_114 = function(i){var self = TMP_114.$$s || this;

          
            
            if (i == null) {
              i = nil;
            };
            return out['$<<'](self.$at(i));}, TMP_114.$$s = self, TMP_114.$$arity = 1, TMP_114));
        } else {
          
          i = $$($nesting, 'Opal').$coerce_to(elem, $$($nesting, 'Integer'), "to_int");
          return out['$<<'](self.$at(i));
        };}, TMP_113.$$s = self, TMP_113.$$arity = 1, TMP_113));
      return out;
    }, TMP_Array_values_at_112.$$arity = -1);
    
    Opal.def(self, '$zip', TMP_Array_zip_115 = function $$zip($a) {
      var $iter = TMP_Array_zip_115.$$p, block = $iter || nil, $post_args, others, $b, self = this;

      if ($iter) TMP_Array_zip_115.$$p = null;
      
      
      if ($iter) TMP_Array_zip_115.$$p = null;;
      
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
    }, TMP_Array_zip_115.$$arity = -1);
    Opal.defs(self, '$inherited', TMP_Array_inherited_116 = function $$inherited(klass) {
      var self = this;

      
      klass.prototype.$to_a = function() {
        return this.slice(0, this.length);
      }
    
    }, TMP_Array_inherited_116.$$arity = 1);
    
    Opal.def(self, '$instance_variables', TMP_Array_instance_variables_117 = function $$instance_variables() {
      var TMP_118, $iter = TMP_Array_instance_variables_117.$$p, $yield = $iter || nil, self = this, $zuper = nil, $zuper_i = nil, $zuper_ii = nil;

      if ($iter) TMP_Array_instance_variables_117.$$p = null;
      // Prepare super implicit arguments
      for($zuper_i = 0, $zuper_ii = arguments.length, $zuper = new Array($zuper_ii); $zuper_i < $zuper_ii; $zuper_i++) {
        $zuper[$zuper_i] = arguments[$zuper_i];
      }
      return $send($send(self, Opal.find_super_dispatcher(self, 'instance_variables', TMP_Array_instance_variables_117, false), $zuper, $iter), 'reject', [], (TMP_118 = function(ivar){var self = TMP_118.$$s || this, $a;

      
        
        if (ivar == null) {
          ivar = nil;
        };
        return ($truthy($a = /^@\d+$/.test(ivar)) ? $a : ivar['$==']("@length"));}, TMP_118.$$s = self, TMP_118.$$arity = 1, TMP_118))
    }, TMP_Array_instance_variables_117.$$arity = 0);
    $$($nesting, 'Opal').$pristine(self.$singleton_class(), "allocate");
    $$($nesting, 'Opal').$pristine(self, "copy_instance_variables", "initialize_dup");
    return (Opal.def(self, '$pack', TMP_Array_pack_119 = function $$pack($a) {
      var $post_args, args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      return self.$raise("To use Array#pack, you must first require 'corelib/array/pack'.");
    }, TMP_Array_pack_119.$$arity = -1), nil) && 'pack';
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
    function $Hash(){};
    var self = $Hash = $klass($base, $super, 'Hash', $Hash);

    var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_Hash_$$_1, TMP_Hash_allocate_2, TMP_Hash_try_convert_3, TMP_Hash_initialize_4, TMP_Hash_$eq$eq_5, TMP_Hash_$gt$eq_6, TMP_Hash_$gt_8, TMP_Hash_$lt_9, TMP_Hash_$lt$eq_10, TMP_Hash_$$_11, TMP_Hash_$$$eq_12, TMP_Hash_assoc_13, TMP_Hash_clear_14, TMP_Hash_clone_15, TMP_Hash_compact_16, TMP_Hash_compact$B_17, TMP_Hash_compare_by_identity_18, TMP_Hash_compare_by_identity$q_19, TMP_Hash_default_20, TMP_Hash_default$eq_21, TMP_Hash_default_proc_22, TMP_Hash_default_proc$eq_23, TMP_Hash_delete_24, TMP_Hash_delete_if_25, TMP_Hash_dig_27, TMP_Hash_each_28, TMP_Hash_each_key_30, TMP_Hash_each_value_32, TMP_Hash_empty$q_34, TMP_Hash_fetch_35, TMP_Hash_fetch_values_36, TMP_Hash_flatten_38, TMP_Hash_has_key$q_39, TMP_Hash_has_value$q_40, TMP_Hash_hash_41, TMP_Hash_index_42, TMP_Hash_indexes_43, TMP_Hash_inspect_44, TMP_Hash_invert_45, TMP_Hash_keep_if_46, TMP_Hash_keys_48, TMP_Hash_length_49, TMP_Hash_merge_50, TMP_Hash_merge$B_51, TMP_Hash_rassoc_52, TMP_Hash_rehash_53, TMP_Hash_reject_54, TMP_Hash_reject$B_56, TMP_Hash_replace_58, TMP_Hash_select_59, TMP_Hash_select$B_61, TMP_Hash_shift_63, TMP_Hash_slice_64, TMP_Hash_to_a_65, TMP_Hash_to_h_66, TMP_Hash_to_hash_67, TMP_Hash_to_proc_68, TMP_Hash_transform_keys_70, TMP_Hash_transform_keys$B_72, TMP_Hash_transform_values_74, TMP_Hash_transform_values$B_76, TMP_Hash_values_78;

    
    self.$include($$($nesting, 'Enumerable'));
    def.$$is_hash = true;
    Opal.defs(self, '$[]', TMP_Hash_$$_1 = function($a) {
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
    }, TMP_Hash_$$_1.$$arity = -1);
    Opal.defs(self, '$allocate', TMP_Hash_allocate_2 = function $$allocate() {
      var self = this;

      
      var hash = new self();

      Opal.hash_init(hash);

      hash.$$none = nil;
      hash.$$proc = nil;

      return hash;
    
    }, TMP_Hash_allocate_2.$$arity = 0);
    Opal.defs(self, '$try_convert', TMP_Hash_try_convert_3 = function $$try_convert(obj) {
      var self = this;

      return $$($nesting, 'Opal')['$coerce_to?'](obj, $$($nesting, 'Hash'), "to_hash")
    }, TMP_Hash_try_convert_3.$$arity = 1);
    
    Opal.def(self, '$initialize', TMP_Hash_initialize_4 = function $$initialize(defaults) {
      var $iter = TMP_Hash_initialize_4.$$p, block = $iter || nil, self = this;

      if ($iter) TMP_Hash_initialize_4.$$p = null;
      
      
      if ($iter) TMP_Hash_initialize_4.$$p = null;;
      ;
      
      if (defaults !== undefined && block !== nil) {
        self.$raise($$($nesting, 'ArgumentError'), "wrong number of arguments (1 for 0)")
      }
      self.$$none = (defaults === undefined ? nil : defaults);
      self.$$proc = block;

      return self;
    ;
    }, TMP_Hash_initialize_4.$$arity = -1);
    
    Opal.def(self, '$==', TMP_Hash_$eq$eq_5 = function(other) {
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
    
    }, TMP_Hash_$eq$eq_5.$$arity = 1);
    
    Opal.def(self, '$>=', TMP_Hash_$gt$eq_6 = function(other) {
      var TMP_7, self = this, result = nil;

      
      other = $$($nesting, 'Opal')['$coerce_to!'](other, $$($nesting, 'Hash'), "to_hash");
      
      if (self.$$keys.length < other.$$keys.length) {
        return false
      }
    ;
      result = true;
      $send(other, 'each', [], (TMP_7 = function(other_key, other_val){var self = TMP_7.$$s || this, val = nil;

      
        
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
      ;}, TMP_7.$$s = self, TMP_7.$$arity = 2, TMP_7));
      return result;
    }, TMP_Hash_$gt$eq_6.$$arity = 1);
    
    Opal.def(self, '$>', TMP_Hash_$gt_8 = function(other) {
      var self = this;

      
      other = $$($nesting, 'Opal')['$coerce_to!'](other, $$($nesting, 'Hash'), "to_hash");
      
      if (self.$$keys.length <= other.$$keys.length) {
        return false
      }
    ;
      return $rb_ge(self, other);
    }, TMP_Hash_$gt_8.$$arity = 1);
    
    Opal.def(self, '$<', TMP_Hash_$lt_9 = function(other) {
      var self = this;

      
      other = $$($nesting, 'Opal')['$coerce_to!'](other, $$($nesting, 'Hash'), "to_hash");
      return $rb_gt(other, self);
    }, TMP_Hash_$lt_9.$$arity = 1);
    
    Opal.def(self, '$<=', TMP_Hash_$lt$eq_10 = function(other) {
      var self = this;

      
      other = $$($nesting, 'Opal')['$coerce_to!'](other, $$($nesting, 'Hash'), "to_hash");
      return $rb_ge(other, self);
    }, TMP_Hash_$lt$eq_10.$$arity = 1);
    
    Opal.def(self, '$[]', TMP_Hash_$$_11 = function(key) {
      var self = this;

      
      var value = Opal.hash_get(self, key);

      if (value !== undefined) {
        return value;
      }

      return self.$default(key);
    
    }, TMP_Hash_$$_11.$$arity = 1);
    
    Opal.def(self, '$[]=', TMP_Hash_$$$eq_12 = function(key, value) {
      var self = this;

      
      Opal.hash_put(self, key, value);
      return value;
    
    }, TMP_Hash_$$$eq_12.$$arity = 2);
    
    Opal.def(self, '$assoc', TMP_Hash_assoc_13 = function $$assoc(object) {
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
    
    }, TMP_Hash_assoc_13.$$arity = 1);
    
    Opal.def(self, '$clear', TMP_Hash_clear_14 = function $$clear() {
      var self = this;

      
      Opal.hash_init(self);
      return self;
    
    }, TMP_Hash_clear_14.$$arity = 0);
    
    Opal.def(self, '$clone', TMP_Hash_clone_15 = function $$clone() {
      var self = this;

      
      var hash = new self.$$class();

      Opal.hash_init(hash);
      Opal.hash_clone(self, hash);

      return hash;
    
    }, TMP_Hash_clone_15.$$arity = 0);
    
    Opal.def(self, '$compact', TMP_Hash_compact_16 = function $$compact() {
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
    
    }, TMP_Hash_compact_16.$$arity = 0);
    
    Opal.def(self, '$compact!', TMP_Hash_compact$B_17 = function() {
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
    
    }, TMP_Hash_compact$B_17.$$arity = 0);
    
    Opal.def(self, '$compare_by_identity', TMP_Hash_compare_by_identity_18 = function $$compare_by_identity() {
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
    
    }, TMP_Hash_compare_by_identity_18.$$arity = 0);
    
    Opal.def(self, '$compare_by_identity?', TMP_Hash_compare_by_identity$q_19 = function() {
      var self = this;

      return self.$$by_identity === true;
    }, TMP_Hash_compare_by_identity$q_19.$$arity = 0);
    
    Opal.def(self, '$default', TMP_Hash_default_20 = function(key) {
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
    }, TMP_Hash_default_20.$$arity = -1);
    
    Opal.def(self, '$default=', TMP_Hash_default$eq_21 = function(object) {
      var self = this;

      
      self.$$proc = nil;
      self.$$none = object;

      return object;
    
    }, TMP_Hash_default$eq_21.$$arity = 1);
    
    Opal.def(self, '$default_proc', TMP_Hash_default_proc_22 = function $$default_proc() {
      var self = this;

      
      if (self.$$proc !== undefined) {
        return self.$$proc;
      }
      return nil;
    
    }, TMP_Hash_default_proc_22.$$arity = 0);
    
    Opal.def(self, '$default_proc=', TMP_Hash_default_proc$eq_23 = function(default_proc) {
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
    
    }, TMP_Hash_default_proc$eq_23.$$arity = 1);
    
    Opal.def(self, '$delete', TMP_Hash_delete_24 = function(key) {
      var $iter = TMP_Hash_delete_24.$$p, block = $iter || nil, self = this;

      if ($iter) TMP_Hash_delete_24.$$p = null;
      
      
      if ($iter) TMP_Hash_delete_24.$$p = null;;
      
      var value = Opal.hash_delete(self, key);

      if (value !== undefined) {
        return value;
      }

      if (block !== nil) {
        return Opal.yield1(block, key);
      }

      return nil;
    ;
    }, TMP_Hash_delete_24.$$arity = 1);
    
    Opal.def(self, '$delete_if', TMP_Hash_delete_if_25 = function $$delete_if() {
      var $iter = TMP_Hash_delete_if_25.$$p, block = $iter || nil, TMP_26, self = this;

      if ($iter) TMP_Hash_delete_if_25.$$p = null;
      
      
      if ($iter) TMP_Hash_delete_if_25.$$p = null;;
      if ($truthy(block)) {
      } else {
        return $send(self, 'enum_for', ["delete_if"], (TMP_26 = function(){var self = TMP_26.$$s || this;

        return self.$size()}, TMP_26.$$s = self, TMP_26.$$arity = 0, TMP_26))
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
    }, TMP_Hash_delete_if_25.$$arity = 0);
    Opal.alias(self, "dup", "clone");
    
    Opal.def(self, '$dig', TMP_Hash_dig_27 = function $$dig(key, $a) {
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
    }, TMP_Hash_dig_27.$$arity = -2);
    
    Opal.def(self, '$each', TMP_Hash_each_28 = function $$each() {
      var $iter = TMP_Hash_each_28.$$p, block = $iter || nil, TMP_29, self = this;

      if ($iter) TMP_Hash_each_28.$$p = null;
      
      
      if ($iter) TMP_Hash_each_28.$$p = null;;
      if ($truthy(block)) {
      } else {
        return $send(self, 'enum_for', ["each"], (TMP_29 = function(){var self = TMP_29.$$s || this;

        return self.$size()}, TMP_29.$$s = self, TMP_29.$$arity = 0, TMP_29))
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
    }, TMP_Hash_each_28.$$arity = 0);
    
    Opal.def(self, '$each_key', TMP_Hash_each_key_30 = function $$each_key() {
      var $iter = TMP_Hash_each_key_30.$$p, block = $iter || nil, TMP_31, self = this;

      if ($iter) TMP_Hash_each_key_30.$$p = null;
      
      
      if ($iter) TMP_Hash_each_key_30.$$p = null;;
      if ($truthy(block)) {
      } else {
        return $send(self, 'enum_for', ["each_key"], (TMP_31 = function(){var self = TMP_31.$$s || this;

        return self.$size()}, TMP_31.$$s = self, TMP_31.$$arity = 0, TMP_31))
      };
      
      for (var i = 0, keys = self.$$keys, length = keys.length, key; i < length; i++) {
        key = keys[i];

        block(key.$$is_string ? key : key.key);
      }

      return self;
    ;
    }, TMP_Hash_each_key_30.$$arity = 0);
    Opal.alias(self, "each_pair", "each");
    
    Opal.def(self, '$each_value', TMP_Hash_each_value_32 = function $$each_value() {
      var $iter = TMP_Hash_each_value_32.$$p, block = $iter || nil, TMP_33, self = this;

      if ($iter) TMP_Hash_each_value_32.$$p = null;
      
      
      if ($iter) TMP_Hash_each_value_32.$$p = null;;
      if ($truthy(block)) {
      } else {
        return $send(self, 'enum_for', ["each_value"], (TMP_33 = function(){var self = TMP_33.$$s || this;

        return self.$size()}, TMP_33.$$s = self, TMP_33.$$arity = 0, TMP_33))
      };
      
      for (var i = 0, keys = self.$$keys, length = keys.length, key; i < length; i++) {
        key = keys[i];

        block(key.$$is_string ? self.$$smap[key] : key.value);
      }

      return self;
    ;
    }, TMP_Hash_each_value_32.$$arity = 0);
    
    Opal.def(self, '$empty?', TMP_Hash_empty$q_34 = function() {
      var self = this;

      return self.$$keys.length === 0;
    }, TMP_Hash_empty$q_34.$$arity = 0);
    Opal.alias(self, "eql?", "==");
    
    Opal.def(self, '$fetch', TMP_Hash_fetch_35 = function $$fetch(key, defaults) {
      var $iter = TMP_Hash_fetch_35.$$p, block = $iter || nil, self = this;

      if ($iter) TMP_Hash_fetch_35.$$p = null;
      
      
      if ($iter) TMP_Hash_fetch_35.$$p = null;;
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
    }, TMP_Hash_fetch_35.$$arity = -2);
    
    Opal.def(self, '$fetch_values', TMP_Hash_fetch_values_36 = function $$fetch_values($a) {
      var $iter = TMP_Hash_fetch_values_36.$$p, block = $iter || nil, $post_args, keys, TMP_37, self = this;

      if ($iter) TMP_Hash_fetch_values_36.$$p = null;
      
      
      if ($iter) TMP_Hash_fetch_values_36.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      keys = $post_args;;
      return $send(keys, 'map', [], (TMP_37 = function(key){var self = TMP_37.$$s || this;

      
        
        if (key == null) {
          key = nil;
        };
        return $send(self, 'fetch', [key], block.$to_proc());}, TMP_37.$$s = self, TMP_37.$$arity = 1, TMP_37));
    }, TMP_Hash_fetch_values_36.$$arity = -1);
    
    Opal.def(self, '$flatten', TMP_Hash_flatten_38 = function $$flatten(level) {
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
    }, TMP_Hash_flatten_38.$$arity = -1);
    
    Opal.def(self, '$has_key?', TMP_Hash_has_key$q_39 = function(key) {
      var self = this;

      return Opal.hash_get(self, key) !== undefined;
    }, TMP_Hash_has_key$q_39.$$arity = 1);
    
    Opal.def(self, '$has_value?', TMP_Hash_has_value$q_40 = function(value) {
      var self = this;

      
      for (var i = 0, keys = self.$$keys, length = keys.length, key; i < length; i++) {
        key = keys[i];

        if (((key.$$is_string ? self.$$smap[key] : key.value))['$=='](value)) {
          return true;
        }
      }

      return false;
    
    }, TMP_Hash_has_value$q_40.$$arity = 1);
    
    Opal.def(self, '$hash', TMP_Hash_hash_41 = function $$hash() {
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
    
    }, TMP_Hash_hash_41.$$arity = 0);
    Opal.alias(self, "include?", "has_key?");
    
    Opal.def(self, '$index', TMP_Hash_index_42 = function $$index(object) {
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
    
    }, TMP_Hash_index_42.$$arity = 1);
    
    Opal.def(self, '$indexes', TMP_Hash_indexes_43 = function $$indexes($a) {
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
    }, TMP_Hash_indexes_43.$$arity = -1);
    Opal.alias(self, "indices", "indexes");
    var inspect_ids;
    
    Opal.def(self, '$inspect', TMP_Hash_inspect_44 = function $$inspect() {
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
    
    }, TMP_Hash_inspect_44.$$arity = 0);
    
    Opal.def(self, '$invert', TMP_Hash_invert_45 = function $$invert() {
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
    
    }, TMP_Hash_invert_45.$$arity = 0);
    
    Opal.def(self, '$keep_if', TMP_Hash_keep_if_46 = function $$keep_if() {
      var $iter = TMP_Hash_keep_if_46.$$p, block = $iter || nil, TMP_47, self = this;

      if ($iter) TMP_Hash_keep_if_46.$$p = null;
      
      
      if ($iter) TMP_Hash_keep_if_46.$$p = null;;
      if ($truthy(block)) {
      } else {
        return $send(self, 'enum_for', ["keep_if"], (TMP_47 = function(){var self = TMP_47.$$s || this;

        return self.$size()}, TMP_47.$$s = self, TMP_47.$$arity = 0, TMP_47))
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
    }, TMP_Hash_keep_if_46.$$arity = 0);
    Opal.alias(self, "key", "index");
    Opal.alias(self, "key?", "has_key?");
    
    Opal.def(self, '$keys', TMP_Hash_keys_48 = function $$keys() {
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
    
    }, TMP_Hash_keys_48.$$arity = 0);
    
    Opal.def(self, '$length', TMP_Hash_length_49 = function $$length() {
      var self = this;

      return self.$$keys.length;
    }, TMP_Hash_length_49.$$arity = 0);
    Opal.alias(self, "member?", "has_key?");
    
    Opal.def(self, '$merge', TMP_Hash_merge_50 = function $$merge(other) {
      var $iter = TMP_Hash_merge_50.$$p, block = $iter || nil, self = this;

      if ($iter) TMP_Hash_merge_50.$$p = null;
      
      
      if ($iter) TMP_Hash_merge_50.$$p = null;;
      return $send(self.$dup(), 'merge!', [other], block.$to_proc());
    }, TMP_Hash_merge_50.$$arity = 1);
    
    Opal.def(self, '$merge!', TMP_Hash_merge$B_51 = function(other) {
      var $iter = TMP_Hash_merge$B_51.$$p, block = $iter || nil, self = this;

      if ($iter) TMP_Hash_merge$B_51.$$p = null;
      
      
      if ($iter) TMP_Hash_merge$B_51.$$p = null;;
      
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
    }, TMP_Hash_merge$B_51.$$arity = 1);
    
    Opal.def(self, '$rassoc', TMP_Hash_rassoc_52 = function $$rassoc(object) {
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
    
    }, TMP_Hash_rassoc_52.$$arity = 1);
    
    Opal.def(self, '$rehash', TMP_Hash_rehash_53 = function $$rehash() {
      var self = this;

      
      Opal.hash_rehash(self);
      return self;
    
    }, TMP_Hash_rehash_53.$$arity = 0);
    
    Opal.def(self, '$reject', TMP_Hash_reject_54 = function $$reject() {
      var $iter = TMP_Hash_reject_54.$$p, block = $iter || nil, TMP_55, self = this;

      if ($iter) TMP_Hash_reject_54.$$p = null;
      
      
      if ($iter) TMP_Hash_reject_54.$$p = null;;
      if ($truthy(block)) {
      } else {
        return $send(self, 'enum_for', ["reject"], (TMP_55 = function(){var self = TMP_55.$$s || this;

        return self.$size()}, TMP_55.$$s = self, TMP_55.$$arity = 0, TMP_55))
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
    }, TMP_Hash_reject_54.$$arity = 0);
    
    Opal.def(self, '$reject!', TMP_Hash_reject$B_56 = function() {
      var $iter = TMP_Hash_reject$B_56.$$p, block = $iter || nil, TMP_57, self = this;

      if ($iter) TMP_Hash_reject$B_56.$$p = null;
      
      
      if ($iter) TMP_Hash_reject$B_56.$$p = null;;
      if ($truthy(block)) {
      } else {
        return $send(self, 'enum_for', ["reject!"], (TMP_57 = function(){var self = TMP_57.$$s || this;

        return self.$size()}, TMP_57.$$s = self, TMP_57.$$arity = 0, TMP_57))
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
    }, TMP_Hash_reject$B_56.$$arity = 0);
    
    Opal.def(self, '$replace', TMP_Hash_replace_58 = function $$replace(other) {
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
    }, TMP_Hash_replace_58.$$arity = 1);
    
    Opal.def(self, '$select', TMP_Hash_select_59 = function $$select() {
      var $iter = TMP_Hash_select_59.$$p, block = $iter || nil, TMP_60, self = this;

      if ($iter) TMP_Hash_select_59.$$p = null;
      
      
      if ($iter) TMP_Hash_select_59.$$p = null;;
      if ($truthy(block)) {
      } else {
        return $send(self, 'enum_for', ["select"], (TMP_60 = function(){var self = TMP_60.$$s || this;

        return self.$size()}, TMP_60.$$s = self, TMP_60.$$arity = 0, TMP_60))
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
    }, TMP_Hash_select_59.$$arity = 0);
    
    Opal.def(self, '$select!', TMP_Hash_select$B_61 = function() {
      var $iter = TMP_Hash_select$B_61.$$p, block = $iter || nil, TMP_62, self = this;

      if ($iter) TMP_Hash_select$B_61.$$p = null;
      
      
      if ($iter) TMP_Hash_select$B_61.$$p = null;;
      if ($truthy(block)) {
      } else {
        return $send(self, 'enum_for', ["select!"], (TMP_62 = function(){var self = TMP_62.$$s || this;

        return self.$size()}, TMP_62.$$s = self, TMP_62.$$arity = 0, TMP_62))
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
    }, TMP_Hash_select$B_61.$$arity = 0);
    
    Opal.def(self, '$shift', TMP_Hash_shift_63 = function $$shift() {
      var self = this;

      
      var keys = self.$$keys,
          key;

      if (keys.length > 0) {
        key = keys[0];

        key = key.$$is_string ? key : key.key;

        return [key, Opal.hash_delete(self, key)];
      }

      return self.$default(nil);
    
    }, TMP_Hash_shift_63.$$arity = 0);
    Opal.alias(self, "size", "length");
    
    Opal.def(self, '$slice', TMP_Hash_slice_64 = function $$slice($a) {
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
    }, TMP_Hash_slice_64.$$arity = -1);
    Opal.alias(self, "store", "[]=");
    
    Opal.def(self, '$to_a', TMP_Hash_to_a_65 = function $$to_a() {
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
    
    }, TMP_Hash_to_a_65.$$arity = 0);
    
    Opal.def(self, '$to_h', TMP_Hash_to_h_66 = function $$to_h() {
      var self = this;

      
      if (self.$$class === Opal.Hash) {
        return self;
      }

      var hash = new Opal.Hash();

      Opal.hash_init(hash);
      Opal.hash_clone(self, hash);

      return hash;
    
    }, TMP_Hash_to_h_66.$$arity = 0);
    
    Opal.def(self, '$to_hash', TMP_Hash_to_hash_67 = function $$to_hash() {
      var self = this;

      return self
    }, TMP_Hash_to_hash_67.$$arity = 0);
    
    Opal.def(self, '$to_proc', TMP_Hash_to_proc_68 = function $$to_proc() {
      var TMP_69, self = this;

      return $send(self, 'proc', [], (TMP_69 = function(key){var self = TMP_69.$$s || this;

      
        ;
        
        if (key == null) {
          self.$raise($$($nesting, 'ArgumentError'), "no key given")
        }
      ;
        return self['$[]'](key);}, TMP_69.$$s = self, TMP_69.$$arity = -1, TMP_69))
    }, TMP_Hash_to_proc_68.$$arity = 0);
    Opal.alias(self, "to_s", "inspect");
    
    Opal.def(self, '$transform_keys', TMP_Hash_transform_keys_70 = function $$transform_keys() {
      var $iter = TMP_Hash_transform_keys_70.$$p, block = $iter || nil, TMP_71, self = this;

      if ($iter) TMP_Hash_transform_keys_70.$$p = null;
      
      
      if ($iter) TMP_Hash_transform_keys_70.$$p = null;;
      if ($truthy(block)) {
      } else {
        return $send(self, 'enum_for', ["transform_keys"], (TMP_71 = function(){var self = TMP_71.$$s || this;

        return self.$size()}, TMP_71.$$s = self, TMP_71.$$arity = 0, TMP_71))
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
    }, TMP_Hash_transform_keys_70.$$arity = 0);
    
    Opal.def(self, '$transform_keys!', TMP_Hash_transform_keys$B_72 = function() {
      var $iter = TMP_Hash_transform_keys$B_72.$$p, block = $iter || nil, TMP_73, self = this;

      if ($iter) TMP_Hash_transform_keys$B_72.$$p = null;
      
      
      if ($iter) TMP_Hash_transform_keys$B_72.$$p = null;;
      if ($truthy(block)) {
      } else {
        return $send(self, 'enum_for', ["transform_keys!"], (TMP_73 = function(){var self = TMP_73.$$s || this;

        return self.$size()}, TMP_73.$$s = self, TMP_73.$$arity = 0, TMP_73))
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
    }, TMP_Hash_transform_keys$B_72.$$arity = 0);
    
    Opal.def(self, '$transform_values', TMP_Hash_transform_values_74 = function $$transform_values() {
      var $iter = TMP_Hash_transform_values_74.$$p, block = $iter || nil, TMP_75, self = this;

      if ($iter) TMP_Hash_transform_values_74.$$p = null;
      
      
      if ($iter) TMP_Hash_transform_values_74.$$p = null;;
      if ($truthy(block)) {
      } else {
        return $send(self, 'enum_for', ["transform_values"], (TMP_75 = function(){var self = TMP_75.$$s || this;

        return self.$size()}, TMP_75.$$s = self, TMP_75.$$arity = 0, TMP_75))
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
    }, TMP_Hash_transform_values_74.$$arity = 0);
    
    Opal.def(self, '$transform_values!', TMP_Hash_transform_values$B_76 = function() {
      var $iter = TMP_Hash_transform_values$B_76.$$p, block = $iter || nil, TMP_77, self = this;

      if ($iter) TMP_Hash_transform_values$B_76.$$p = null;
      
      
      if ($iter) TMP_Hash_transform_values$B_76.$$p = null;;
      if ($truthy(block)) {
      } else {
        return $send(self, 'enum_for', ["transform_values!"], (TMP_77 = function(){var self = TMP_77.$$s || this;

        return self.$size()}, TMP_77.$$s = self, TMP_77.$$arity = 0, TMP_77))
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
    }, TMP_Hash_transform_values$B_76.$$arity = 0);
    Opal.alias(self, "update", "merge!");
    Opal.alias(self, "value?", "has_value?");
    Opal.alias(self, "values_at", "indexes");
    return (Opal.def(self, '$values', TMP_Hash_values_78 = function $$values() {
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
    
    }, TMP_Hash_values_78.$$arity = 0), nil) && 'values';
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
    function $Number(){};
    var self = $Number = $klass($base, $super, 'Number', $Number);

    var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_Number_coerce_2, TMP_Number___id___3, TMP_Number_$_4, TMP_Number_$_5, TMP_Number_$_6, TMP_Number_$_7, TMP_Number_$_8, TMP_Number_$_9, TMP_Number_$_10, TMP_Number_$_11, TMP_Number_$lt_12, TMP_Number_$lt$eq_13, TMP_Number_$gt_14, TMP_Number_$gt$eq_15, TMP_Number_$lt$eq$gt_16, TMP_Number_$lt$lt_17, TMP_Number_$gt$gt_18, TMP_Number_$$_19, TMP_Number_$$_20, TMP_Number_$$_21, TMP_Number_$_22, TMP_Number_$$_23, TMP_Number_$eq$eq$eq_24, TMP_Number_$eq$eq_25, TMP_Number_abs_26, TMP_Number_abs2_27, TMP_Number_allbits$q_28, TMP_Number_anybits$q_29, TMP_Number_angle_30, TMP_Number_bit_length_31, TMP_Number_ceil_32, TMP_Number_chr_33, TMP_Number_denominator_34, TMP_Number_downto_35, TMP_Number_equal$q_37, TMP_Number_even$q_38, TMP_Number_floor_39, TMP_Number_gcd_40, TMP_Number_gcdlcm_41, TMP_Number_integer$q_42, TMP_Number_is_a$q_43, TMP_Number_instance_of$q_44, TMP_Number_lcm_45, TMP_Number_next_46, TMP_Number_nobits$q_47, TMP_Number_nonzero$q_48, TMP_Number_numerator_49, TMP_Number_odd$q_50, TMP_Number_ord_51, TMP_Number_pow_52, TMP_Number_pred_53, TMP_Number_quo_54, TMP_Number_rationalize_55, TMP_Number_remainder_56, TMP_Number_round_57, TMP_Number_step_58, TMP_Number_times_60, TMP_Number_to_f_62, TMP_Number_to_i_63, TMP_Number_to_r_64, TMP_Number_to_s_65, TMP_Number_truncate_66, TMP_Number_digits_67, TMP_Number_divmod_68, TMP_Number_upto_69, TMP_Number_zero$q_71, TMP_Number_size_72, TMP_Number_nan$q_73, TMP_Number_finite$q_74, TMP_Number_infinite$q_75, TMP_Number_positive$q_76, TMP_Number_negative$q_77;

    
    $$($nesting, 'Opal').$bridge(Number, self);
    Opal.defineProperty(Number.prototype, '$$is_number', true);
    self.$$is_number_class = true;
    (function(self, $parent_nesting) {
      var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_allocate_1;

      
      
      Opal.def(self, '$allocate', TMP_allocate_1 = function $$allocate() {
        var self = this;

        return self.$raise($$($nesting, 'TypeError'), "" + "allocator undefined for " + (self.$name()))
      }, TMP_allocate_1.$$arity = 0);
      
      
      Opal.udef(self, '$' + "new");;
      return nil;;
    })(Opal.get_singleton_class(self), $nesting);
    
    Opal.def(self, '$coerce', TMP_Number_coerce_2 = function $$coerce(other) {
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
    
    }, TMP_Number_coerce_2.$$arity = 1);
    
    Opal.def(self, '$__id__', TMP_Number___id___3 = function $$__id__() {
      var self = this;

      return (self * 2) + 1;
    }, TMP_Number___id___3.$$arity = 0);
    Opal.alias(self, "object_id", "__id__");
    
    Opal.def(self, '$+', TMP_Number_$_4 = function(other) {
      var self = this;

      
      if (other.$$is_number) {
        return self + other;
      }
      else {
        return self.$__coerced__("+", other);
      }
    
    }, TMP_Number_$_4.$$arity = 1);
    
    Opal.def(self, '$-', TMP_Number_$_5 = function(other) {
      var self = this;

      
      if (other.$$is_number) {
        return self - other;
      }
      else {
        return self.$__coerced__("-", other);
      }
    
    }, TMP_Number_$_5.$$arity = 1);
    
    Opal.def(self, '$*', TMP_Number_$_6 = function(other) {
      var self = this;

      
      if (other.$$is_number) {
        return self * other;
      }
      else {
        return self.$__coerced__("*", other);
      }
    
    }, TMP_Number_$_6.$$arity = 1);
    
    Opal.def(self, '$/', TMP_Number_$_7 = function(other) {
      var self = this;

      
      if (other.$$is_number) {
        return self / other;
      }
      else {
        return self.$__coerced__("/", other);
      }
    
    }, TMP_Number_$_7.$$arity = 1);
    Opal.alias(self, "fdiv", "/");
    
    Opal.def(self, '$%', TMP_Number_$_8 = function(other) {
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
    
    }, TMP_Number_$_8.$$arity = 1);
    
    Opal.def(self, '$&', TMP_Number_$_9 = function(other) {
      var self = this;

      
      if (other.$$is_number) {
        return self & other;
      }
      else {
        return self.$__coerced__("&", other);
      }
    
    }, TMP_Number_$_9.$$arity = 1);
    
    Opal.def(self, '$|', TMP_Number_$_10 = function(other) {
      var self = this;

      
      if (other.$$is_number) {
        return self | other;
      }
      else {
        return self.$__coerced__("|", other);
      }
    
    }, TMP_Number_$_10.$$arity = 1);
    
    Opal.def(self, '$^', TMP_Number_$_11 = function(other) {
      var self = this;

      
      if (other.$$is_number) {
        return self ^ other;
      }
      else {
        return self.$__coerced__("^", other);
      }
    
    }, TMP_Number_$_11.$$arity = 1);
    
    Opal.def(self, '$<', TMP_Number_$lt_12 = function(other) {
      var self = this;

      
      if (other.$$is_number) {
        return self < other;
      }
      else {
        return self.$__coerced__("<", other);
      }
    
    }, TMP_Number_$lt_12.$$arity = 1);
    
    Opal.def(self, '$<=', TMP_Number_$lt$eq_13 = function(other) {
      var self = this;

      
      if (other.$$is_number) {
        return self <= other;
      }
      else {
        return self.$__coerced__("<=", other);
      }
    
    }, TMP_Number_$lt$eq_13.$$arity = 1);
    
    Opal.def(self, '$>', TMP_Number_$gt_14 = function(other) {
      var self = this;

      
      if (other.$$is_number) {
        return self > other;
      }
      else {
        return self.$__coerced__(">", other);
      }
    
    }, TMP_Number_$gt_14.$$arity = 1);
    
    Opal.def(self, '$>=', TMP_Number_$gt$eq_15 = function(other) {
      var self = this;

      
      if (other.$$is_number) {
        return self >= other;
      }
      else {
        return self.$__coerced__(">=", other);
      }
    
    }, TMP_Number_$gt$eq_15.$$arity = 1);
    
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
    
    Opal.def(self, '$<=>', TMP_Number_$lt$eq$gt_16 = function(other) {
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
    }, TMP_Number_$lt$eq$gt_16.$$arity = 1);
    
    Opal.def(self, '$<<', TMP_Number_$lt$lt_17 = function(count) {
      var self = this;

      
      count = $$($nesting, 'Opal')['$coerce_to!'](count, $$($nesting, 'Integer'), "to_int");
      return count > 0 ? self << count : self >> -count;
    }, TMP_Number_$lt$lt_17.$$arity = 1);
    
    Opal.def(self, '$>>', TMP_Number_$gt$gt_18 = function(count) {
      var self = this;

      
      count = $$($nesting, 'Opal')['$coerce_to!'](count, $$($nesting, 'Integer'), "to_int");
      return count > 0 ? self >> count : self << -count;
    }, TMP_Number_$gt$gt_18.$$arity = 1);
    
    Opal.def(self, '$[]', TMP_Number_$$_19 = function(bit) {
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
    }, TMP_Number_$$_19.$$arity = 1);
    
    Opal.def(self, '$+@', TMP_Number_$$_20 = function() {
      var self = this;

      return +self;
    }, TMP_Number_$$_20.$$arity = 0);
    
    Opal.def(self, '$-@', TMP_Number_$$_21 = function() {
      var self = this;

      return -self;
    }, TMP_Number_$$_21.$$arity = 0);
    
    Opal.def(self, '$~', TMP_Number_$_22 = function() {
      var self = this;

      return ~self;
    }, TMP_Number_$_22.$$arity = 0);
    
    Opal.def(self, '$**', TMP_Number_$$_23 = function(other) {
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
    }, TMP_Number_$$_23.$$arity = 1);
    
    Opal.def(self, '$===', TMP_Number_$eq$eq$eq_24 = function(other) {
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
    
    }, TMP_Number_$eq$eq$eq_24.$$arity = 1);
    
    Opal.def(self, '$==', TMP_Number_$eq$eq_25 = function(other) {
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
    
    }, TMP_Number_$eq$eq_25.$$arity = 1);
    
    Opal.def(self, '$abs', TMP_Number_abs_26 = function $$abs() {
      var self = this;

      return Math.abs(self);
    }, TMP_Number_abs_26.$$arity = 0);
    
    Opal.def(self, '$abs2', TMP_Number_abs2_27 = function $$abs2() {
      var self = this;

      return Math.abs(self * self);
    }, TMP_Number_abs2_27.$$arity = 0);
    
    Opal.def(self, '$allbits?', TMP_Number_allbits$q_28 = function(mask) {
      var self = this;

      
      mask = $$($nesting, 'Opal')['$coerce_to!'](mask, $$($nesting, 'Integer'), "to_int");
      return (self & mask) == mask;;
    }, TMP_Number_allbits$q_28.$$arity = 1);
    
    Opal.def(self, '$anybits?', TMP_Number_anybits$q_29 = function(mask) {
      var self = this;

      
      mask = $$($nesting, 'Opal')['$coerce_to!'](mask, $$($nesting, 'Integer'), "to_int");
      return (self & mask) !== 0;;
    }, TMP_Number_anybits$q_29.$$arity = 1);
    
    Opal.def(self, '$angle', TMP_Number_angle_30 = function $$angle() {
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
    }, TMP_Number_angle_30.$$arity = 0);
    Opal.alias(self, "arg", "angle");
    Opal.alias(self, "phase", "angle");
    
    Opal.def(self, '$bit_length', TMP_Number_bit_length_31 = function $$bit_length() {
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
    }, TMP_Number_bit_length_31.$$arity = 0);
    
    Opal.def(self, '$ceil', TMP_Number_ceil_32 = function $$ceil(ndigits) {
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
    }, TMP_Number_ceil_32.$$arity = -1);
    
    Opal.def(self, '$chr', TMP_Number_chr_33 = function $$chr(encoding) {
      var self = this;

      
      ;
      return String.fromCharCode(self);;
    }, TMP_Number_chr_33.$$arity = -1);
    
    Opal.def(self, '$denominator', TMP_Number_denominator_34 = function $$denominator() {
      var $a, $iter = TMP_Number_denominator_34.$$p, $yield = $iter || nil, self = this, $zuper = nil, $zuper_i = nil, $zuper_ii = nil;

      if ($iter) TMP_Number_denominator_34.$$p = null;
      // Prepare super implicit arguments
      for($zuper_i = 0, $zuper_ii = arguments.length, $zuper = new Array($zuper_ii); $zuper_i < $zuper_ii; $zuper_i++) {
        $zuper[$zuper_i] = arguments[$zuper_i];
      }
      if ($truthy(($truthy($a = self['$nan?']()) ? $a : self['$infinite?']()))) {
        return 1
      } else {
        return $send(self, Opal.find_super_dispatcher(self, 'denominator', TMP_Number_denominator_34, false), $zuper, $iter)
      }
    }, TMP_Number_denominator_34.$$arity = 0);
    
    Opal.def(self, '$downto', TMP_Number_downto_35 = function $$downto(stop) {
      var $iter = TMP_Number_downto_35.$$p, block = $iter || nil, TMP_36, self = this;

      if ($iter) TMP_Number_downto_35.$$p = null;
      
      
      if ($iter) TMP_Number_downto_35.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["downto", stop], (TMP_36 = function(){var self = TMP_36.$$s || this;

        
          if ($truthy($$($nesting, 'Numeric')['$==='](stop))) {
          } else {
            self.$raise($$($nesting, 'ArgumentError'), "" + "comparison of " + (self.$class()) + " with " + (stop.$class()) + " failed")
          };
          if ($truthy($rb_gt(stop, self))) {
            return 0
          } else {
            return $rb_plus($rb_minus(self, stop), 1)
          };}, TMP_36.$$s = self, TMP_36.$$arity = 0, TMP_36))
      };
      
      if (!stop.$$is_number) {
        self.$raise($$($nesting, 'ArgumentError'), "" + "comparison of " + (self.$class()) + " with " + (stop.$class()) + " failed")
      }
      for (var i = self; i >= stop; i--) {
        block(i);
      }
    ;
      return self;
    }, TMP_Number_downto_35.$$arity = 1);
    Opal.alias(self, "eql?", "==");
    
    Opal.def(self, '$equal?', TMP_Number_equal$q_37 = function(other) {
      var $a, self = this;

      return ($truthy($a = self['$=='](other)) ? $a : isNaN(self) && isNaN(other))
    }, TMP_Number_equal$q_37.$$arity = 1);
    
    Opal.def(self, '$even?', TMP_Number_even$q_38 = function() {
      var self = this;

      return self % 2 === 0;
    }, TMP_Number_even$q_38.$$arity = 0);
    
    Opal.def(self, '$floor', TMP_Number_floor_39 = function $$floor(ndigits) {
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
    }, TMP_Number_floor_39.$$arity = -1);
    
    Opal.def(self, '$gcd', TMP_Number_gcd_40 = function $$gcd(other) {
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
    }, TMP_Number_gcd_40.$$arity = 1);
    
    Opal.def(self, '$gcdlcm', TMP_Number_gcdlcm_41 = function $$gcdlcm(other) {
      var self = this;

      return [self.$gcd(), self.$lcm()]
    }, TMP_Number_gcdlcm_41.$$arity = 1);
    
    Opal.def(self, '$integer?', TMP_Number_integer$q_42 = function() {
      var self = this;

      return self % 1 === 0;
    }, TMP_Number_integer$q_42.$$arity = 0);
    
    Opal.def(self, '$is_a?', TMP_Number_is_a$q_43 = function(klass) {
      var $a, $iter = TMP_Number_is_a$q_43.$$p, $yield = $iter || nil, self = this, $zuper = nil, $zuper_i = nil, $zuper_ii = nil;

      if ($iter) TMP_Number_is_a$q_43.$$p = null;
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
      return $send(self, Opal.find_super_dispatcher(self, 'is_a?', TMP_Number_is_a$q_43, false), $zuper, $iter);
    }, TMP_Number_is_a$q_43.$$arity = 1);
    Opal.alias(self, "kind_of?", "is_a?");
    
    Opal.def(self, '$instance_of?', TMP_Number_instance_of$q_44 = function(klass) {
      var $a, $iter = TMP_Number_instance_of$q_44.$$p, $yield = $iter || nil, self = this, $zuper = nil, $zuper_i = nil, $zuper_ii = nil;

      if ($iter) TMP_Number_instance_of$q_44.$$p = null;
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
      return $send(self, Opal.find_super_dispatcher(self, 'instance_of?', TMP_Number_instance_of$q_44, false), $zuper, $iter);
    }, TMP_Number_instance_of$q_44.$$arity = 1);
    
    Opal.def(self, '$lcm', TMP_Number_lcm_45 = function $$lcm(other) {
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
    }, TMP_Number_lcm_45.$$arity = 1);
    Opal.alias(self, "magnitude", "abs");
    Opal.alias(self, "modulo", "%");
    
    Opal.def(self, '$next', TMP_Number_next_46 = function $$next() {
      var self = this;

      return self + 1;
    }, TMP_Number_next_46.$$arity = 0);
    
    Opal.def(self, '$nobits?', TMP_Number_nobits$q_47 = function(mask) {
      var self = this;

      
      mask = $$($nesting, 'Opal')['$coerce_to!'](mask, $$($nesting, 'Integer'), "to_int");
      return (self & mask) == 0;;
    }, TMP_Number_nobits$q_47.$$arity = 1);
    
    Opal.def(self, '$nonzero?', TMP_Number_nonzero$q_48 = function() {
      var self = this;

      return self == 0 ? nil : self;
    }, TMP_Number_nonzero$q_48.$$arity = 0);
    
    Opal.def(self, '$numerator', TMP_Number_numerator_49 = function $$numerator() {
      var $a, $iter = TMP_Number_numerator_49.$$p, $yield = $iter || nil, self = this, $zuper = nil, $zuper_i = nil, $zuper_ii = nil;

      if ($iter) TMP_Number_numerator_49.$$p = null;
      // Prepare super implicit arguments
      for($zuper_i = 0, $zuper_ii = arguments.length, $zuper = new Array($zuper_ii); $zuper_i < $zuper_ii; $zuper_i++) {
        $zuper[$zuper_i] = arguments[$zuper_i];
      }
      if ($truthy(($truthy($a = self['$nan?']()) ? $a : self['$infinite?']()))) {
        return self
      } else {
        return $send(self, Opal.find_super_dispatcher(self, 'numerator', TMP_Number_numerator_49, false), $zuper, $iter)
      }
    }, TMP_Number_numerator_49.$$arity = 0);
    
    Opal.def(self, '$odd?', TMP_Number_odd$q_50 = function() {
      var self = this;

      return self % 2 !== 0;
    }, TMP_Number_odd$q_50.$$arity = 0);
    
    Opal.def(self, '$ord', TMP_Number_ord_51 = function $$ord() {
      var self = this;

      return self
    }, TMP_Number_ord_51.$$arity = 0);
    
    Opal.def(self, '$pow', TMP_Number_pow_52 = function $$pow(b, m) {
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
    }, TMP_Number_pow_52.$$arity = -2);
    
    Opal.def(self, '$pred', TMP_Number_pred_53 = function $$pred() {
      var self = this;

      return self - 1;
    }, TMP_Number_pred_53.$$arity = 0);
    
    Opal.def(self, '$quo', TMP_Number_quo_54 = function $$quo(other) {
      var $iter = TMP_Number_quo_54.$$p, $yield = $iter || nil, self = this, $zuper = nil, $zuper_i = nil, $zuper_ii = nil;

      if ($iter) TMP_Number_quo_54.$$p = null;
      // Prepare super implicit arguments
      for($zuper_i = 0, $zuper_ii = arguments.length, $zuper = new Array($zuper_ii); $zuper_i < $zuper_ii; $zuper_i++) {
        $zuper[$zuper_i] = arguments[$zuper_i];
      }
      if ($truthy($$($nesting, 'Integer')['$==='](self))) {
        return $send(self, Opal.find_super_dispatcher(self, 'quo', TMP_Number_quo_54, false), $zuper, $iter)
      } else {
        return $rb_divide(self, other)
      }
    }, TMP_Number_quo_54.$$arity = 1);
    
    Opal.def(self, '$rationalize', TMP_Number_rationalize_55 = function $$rationalize(eps) {
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
    }, TMP_Number_rationalize_55.$$arity = -1);
    
    Opal.def(self, '$remainder', TMP_Number_remainder_56 = function $$remainder(y) {
      var self = this;

      return $rb_minus(self, $rb_times(y, $rb_divide(self, y).$truncate()))
    }, TMP_Number_remainder_56.$$arity = 1);
    
    Opal.def(self, '$round', TMP_Number_round_57 = function $$round(ndigits) {
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
    }, TMP_Number_round_57.$$arity = -1);
    
    Opal.def(self, '$step', TMP_Number_step_58 = function $$step($a, $b, $c) {
      var $iter = TMP_Number_step_58.$$p, block = $iter || nil, $post_args, $kwargs, limit, step, to, by, TMP_59, self = this, positional_args = nil, keyword_args = nil;

      if ($iter) TMP_Number_step_58.$$p = null;
      
      
      if ($iter) TMP_Number_step_58.$$p = null;;
      
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
        return $send(self, 'enum_for', ["step"].concat(Opal.to_a(positional_args)), (TMP_59 = function(){var self = TMP_59.$$s || this;

        return stepSize();}, TMP_59.$$s = self, TMP_59.$$arity = 0, TMP_59));
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
    }, TMP_Number_step_58.$$arity = -1);
    Opal.alias(self, "succ", "next");
    
    Opal.def(self, '$times', TMP_Number_times_60 = function $$times() {
      var $iter = TMP_Number_times_60.$$p, block = $iter || nil, TMP_61, self = this;

      if ($iter) TMP_Number_times_60.$$p = null;
      
      
      if ($iter) TMP_Number_times_60.$$p = null;;
      if ($truthy(block)) {
      } else {
        return $send(self, 'enum_for', ["times"], (TMP_61 = function(){var self = TMP_61.$$s || this;

        return self}, TMP_61.$$s = self, TMP_61.$$arity = 0, TMP_61))
      };
      
      for (var i = 0; i < self; i++) {
        block(i);
      }
    ;
      return self;
    }, TMP_Number_times_60.$$arity = 0);
    
    Opal.def(self, '$to_f', TMP_Number_to_f_62 = function $$to_f() {
      var self = this;

      return self
    }, TMP_Number_to_f_62.$$arity = 0);
    
    Opal.def(self, '$to_i', TMP_Number_to_i_63 = function $$to_i() {
      var self = this;

      return parseInt(self, 10);
    }, TMP_Number_to_i_63.$$arity = 0);
    Opal.alias(self, "to_int", "to_i");
    
    Opal.def(self, '$to_r', TMP_Number_to_r_64 = function $$to_r() {
      var $a, $b, self = this, f = nil, e = nil;

      if ($truthy($$($nesting, 'Integer')['$==='](self))) {
        return $$($nesting, 'Rational').$new(self, 1)
      } else {
        
        $b = $$($nesting, 'Math').$frexp(self), $a = Opal.to_ary($b), (f = ($a[0] == null ? nil : $a[0])), (e = ($a[1] == null ? nil : $a[1])), $b;
        f = $$($nesting, 'Math').$ldexp(f, $$$($$($nesting, 'Float'), 'MANT_DIG')).$to_i();
        e = $rb_minus(e, $$$($$($nesting, 'Float'), 'MANT_DIG'));
        return $rb_times(f, $$$($$($nesting, 'Float'), 'RADIX')['$**'](e)).$to_r();
      }
    }, TMP_Number_to_r_64.$$arity = 0);
    
    Opal.def(self, '$to_s', TMP_Number_to_s_65 = function $$to_s(base) {
      var $a, self = this;

      
      
      if (base == null) {
        base = 10;
      };
      base = $$($nesting, 'Opal')['$coerce_to!'](base, $$($nesting, 'Integer'), "to_int");
      if ($truthy(($truthy($a = $rb_lt(base, 2)) ? $a : $rb_gt(base, 36)))) {
        self.$raise($$($nesting, 'ArgumentError'), "" + "invalid radix " + (base))};
      return self.toString(base);;
    }, TMP_Number_to_s_65.$$arity = -1);
    
    Opal.def(self, '$truncate', TMP_Number_truncate_66 = function $$truncate(ndigits) {
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
    }, TMP_Number_truncate_66.$$arity = -1);
    Opal.alias(self, "inspect", "to_s");
    
    Opal.def(self, '$digits', TMP_Number_digits_67 = function $$digits(base) {
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
    }, TMP_Number_digits_67.$$arity = -1);
    
    Opal.def(self, '$divmod', TMP_Number_divmod_68 = function $$divmod(other) {
      var $a, $iter = TMP_Number_divmod_68.$$p, $yield = $iter || nil, self = this, $zuper = nil, $zuper_i = nil, $zuper_ii = nil;

      if ($iter) TMP_Number_divmod_68.$$p = null;
      // Prepare super implicit arguments
      for($zuper_i = 0, $zuper_ii = arguments.length, $zuper = new Array($zuper_ii); $zuper_i < $zuper_ii; $zuper_i++) {
        $zuper[$zuper_i] = arguments[$zuper_i];
      }
      if ($truthy(($truthy($a = self['$nan?']()) ? $a : other['$nan?']()))) {
        return self.$raise($$($nesting, 'FloatDomainError'), "NaN")
      } else if ($truthy(self['$infinite?']())) {
        return self.$raise($$($nesting, 'FloatDomainError'), "Infinity")
      } else {
        return $send(self, Opal.find_super_dispatcher(self, 'divmod', TMP_Number_divmod_68, false), $zuper, $iter)
      }
    }, TMP_Number_divmod_68.$$arity = 1);
    
    Opal.def(self, '$upto', TMP_Number_upto_69 = function $$upto(stop) {
      var $iter = TMP_Number_upto_69.$$p, block = $iter || nil, TMP_70, self = this;

      if ($iter) TMP_Number_upto_69.$$p = null;
      
      
      if ($iter) TMP_Number_upto_69.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["upto", stop], (TMP_70 = function(){var self = TMP_70.$$s || this;

        
          if ($truthy($$($nesting, 'Numeric')['$==='](stop))) {
          } else {
            self.$raise($$($nesting, 'ArgumentError'), "" + "comparison of " + (self.$class()) + " with " + (stop.$class()) + " failed")
          };
          if ($truthy($rb_lt(stop, self))) {
            return 0
          } else {
            return $rb_plus($rb_minus(stop, self), 1)
          };}, TMP_70.$$s = self, TMP_70.$$arity = 0, TMP_70))
      };
      
      if (!stop.$$is_number) {
        self.$raise($$($nesting, 'ArgumentError'), "" + "comparison of " + (self.$class()) + " with " + (stop.$class()) + " failed")
      }
      for (var i = self; i <= stop; i++) {
        block(i);
      }
    ;
      return self;
    }, TMP_Number_upto_69.$$arity = 1);
    
    Opal.def(self, '$zero?', TMP_Number_zero$q_71 = function() {
      var self = this;

      return self == 0;
    }, TMP_Number_zero$q_71.$$arity = 0);
    
    Opal.def(self, '$size', TMP_Number_size_72 = function $$size() {
      var self = this;

      return 4
    }, TMP_Number_size_72.$$arity = 0);
    
    Opal.def(self, '$nan?', TMP_Number_nan$q_73 = function() {
      var self = this;

      return isNaN(self);
    }, TMP_Number_nan$q_73.$$arity = 0);
    
    Opal.def(self, '$finite?', TMP_Number_finite$q_74 = function() {
      var self = this;

      return self != Infinity && self != -Infinity && !isNaN(self);
    }, TMP_Number_finite$q_74.$$arity = 0);
    
    Opal.def(self, '$infinite?', TMP_Number_infinite$q_75 = function() {
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
    
    }, TMP_Number_infinite$q_75.$$arity = 0);
    
    Opal.def(self, '$positive?', TMP_Number_positive$q_76 = function() {
      var self = this;

      return self != 0 && (self == Infinity || 1 / self > 0);
    }, TMP_Number_positive$q_76.$$arity = 0);
    return (Opal.def(self, '$negative?', TMP_Number_negative$q_77 = function() {
      var self = this;

      return self == -Infinity || 1 / self < 0;
    }, TMP_Number_negative$q_77.$$arity = 0), nil) && 'negative?';
  })($nesting[0], $$($nesting, 'Numeric'), $nesting);
  Opal.const_set($nesting[0], 'Fixnum', $$($nesting, 'Number'));
  (function($base, $super, $parent_nesting) {
    function $Integer(){};
    var self = $Integer = $klass($base, $super, 'Integer', $Integer);

    var def = self.prototype, $nesting = [self].concat($parent_nesting);

    
    self.$$is_number_class = true;
    (function(self, $parent_nesting) {
      var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_allocate_78, TMP_$eq$eq$eq_79, TMP_sqrt_80;

      
      
      Opal.def(self, '$allocate', TMP_allocate_78 = function $$allocate() {
        var self = this;

        return self.$raise($$($nesting, 'TypeError'), "" + "allocator undefined for " + (self.$name()))
      }, TMP_allocate_78.$$arity = 0);
      
      Opal.udef(self, '$' + "new");;
      
      Opal.def(self, '$===', TMP_$eq$eq$eq_79 = function(other) {
        var self = this;

        
        if (!other.$$is_number) {
          return false;
        }

        return (other % 1) === 0;
      
      }, TMP_$eq$eq$eq_79.$$arity = 1);
      return (Opal.def(self, '$sqrt', TMP_sqrt_80 = function $$sqrt(n) {
        var self = this;

        
        n = $$($nesting, 'Opal')['$coerce_to!'](n, $$($nesting, 'Integer'), "to_int");
        
        if (n < 0) {
          self.$raise($$$($$($nesting, 'Math'), 'DomainError'), "Numerical argument is out of domain - \"isqrt\"")
        }

        return parseInt(Math.sqrt(n), 10);
      ;
      }, TMP_sqrt_80.$$arity = 1), nil) && 'sqrt';
    })(Opal.get_singleton_class(self), $nesting);
    Opal.const_set($nesting[0], 'MAX', Math.pow(2, 30) - 1);
    return Opal.const_set($nesting[0], 'MIN', -Math.pow(2, 30));
  })($nesting[0], $$($nesting, 'Numeric'), $nesting);
  return (function($base, $super, $parent_nesting) {
    function $Float(){};
    var self = $Float = $klass($base, $super, 'Float', $Float);

    var def = self.prototype, $nesting = [self].concat($parent_nesting);

    
    self.$$is_number_class = true;
    (function(self, $parent_nesting) {
      var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_allocate_81, TMP_$eq$eq$eq_82;

      
      
      Opal.def(self, '$allocate', TMP_allocate_81 = function $$allocate() {
        var self = this;

        return self.$raise($$($nesting, 'TypeError'), "" + "allocator undefined for " + (self.$name()))
      }, TMP_allocate_81.$$arity = 0);
      
      Opal.udef(self, '$' + "new");;
      return (Opal.def(self, '$===', TMP_$eq$eq$eq_82 = function(other) {
        var self = this;

        return !!other.$$is_number;
      }, TMP_$eq$eq$eq_82.$$arity = 1), nil) && '===';
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
    function $Range(){};
    var self = $Range = $klass($base, $super, 'Range', $Range);

    var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_Range_initialize_1, TMP_Range_$eq$eq_2, TMP_Range_$eq$eq$eq_3, TMP_Range_cover$q_4, TMP_Range_each_5, TMP_Range_eql$q_6, TMP_Range_exclude_end$q_7, TMP_Range_first_8, TMP_Range_last_9, TMP_Range_max_10, TMP_Range_min_11, TMP_Range_size_12, TMP_Range_step_13, TMP_Range_bsearch_17, TMP_Range_to_s_18, TMP_Range_inspect_19, TMP_Range_marshal_load_20, TMP_Range_hash_21;

    def.begin = def.end = def.excl = nil;
    
    self.$include($$($nesting, 'Enumerable'));
    def.$$is_range = true;
    self.$attr_reader("begin", "end");
    
    Opal.def(self, '$initialize', TMP_Range_initialize_1 = function $$initialize(first, last, exclude) {
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
    }, TMP_Range_initialize_1.$$arity = -3);
    
    Opal.def(self, '$==', TMP_Range_$eq$eq_2 = function(other) {
      var self = this;

      
      if (!other.$$is_range) {
        return false;
      }

      return self.excl  === other.excl &&
             self.begin ==  other.begin &&
             self.end   ==  other.end;
    
    }, TMP_Range_$eq$eq_2.$$arity = 1);
    
    Opal.def(self, '$===', TMP_Range_$eq$eq$eq_3 = function(value) {
      var self = this;

      return self['$include?'](value)
    }, TMP_Range_$eq$eq$eq_3.$$arity = 1);
    
    Opal.def(self, '$cover?', TMP_Range_cover$q_4 = function(value) {
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
    }, TMP_Range_cover$q_4.$$arity = 1);
    
    Opal.def(self, '$each', TMP_Range_each_5 = function $$each() {
      var $iter = TMP_Range_each_5.$$p, block = $iter || nil, $a, self = this, current = nil, last = nil;

      if ($iter) TMP_Range_each_5.$$p = null;
      
      
      if ($iter) TMP_Range_each_5.$$p = null;;
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
    }, TMP_Range_each_5.$$arity = 0);
    
    Opal.def(self, '$eql?', TMP_Range_eql$q_6 = function(other) {
      var $a, $b, self = this;

      
      if ($truthy($$($nesting, 'Range')['$==='](other))) {
      } else {
        return false
      };
      return ($truthy($a = ($truthy($b = self.excl['$==='](other['$exclude_end?']())) ? self.begin['$eql?'](other.$begin()) : $b)) ? self.end['$eql?'](other.$end()) : $a);
    }, TMP_Range_eql$q_6.$$arity = 1);
    
    Opal.def(self, '$exclude_end?', TMP_Range_exclude_end$q_7 = function() {
      var self = this;

      return self.excl
    }, TMP_Range_exclude_end$q_7.$$arity = 0);
    
    Opal.def(self, '$first', TMP_Range_first_8 = function $$first(n) {
      var $iter = TMP_Range_first_8.$$p, $yield = $iter || nil, self = this, $zuper = nil, $zuper_i = nil, $zuper_ii = nil;

      if ($iter) TMP_Range_first_8.$$p = null;
      // Prepare super implicit arguments
      for($zuper_i = 0, $zuper_ii = arguments.length, $zuper = new Array($zuper_ii); $zuper_i < $zuper_ii; $zuper_i++) {
        $zuper[$zuper_i] = arguments[$zuper_i];
      }
      
      ;
      if ($truthy(n == null)) {
        return self.begin};
      return $send(self, Opal.find_super_dispatcher(self, 'first', TMP_Range_first_8, false), $zuper, $iter);
    }, TMP_Range_first_8.$$arity = -1);
    Opal.alias(self, "include?", "cover?");
    
    Opal.def(self, '$last', TMP_Range_last_9 = function $$last(n) {
      var self = this;

      
      ;
      if ($truthy(n == null)) {
        return self.end};
      return self.$to_a().$last(n);
    }, TMP_Range_last_9.$$arity = -1);
    
    Opal.def(self, '$max', TMP_Range_max_10 = function $$max() {
      var $a, $iter = TMP_Range_max_10.$$p, $yield = $iter || nil, self = this, $zuper = nil, $zuper_i = nil, $zuper_ii = nil;

      if ($iter) TMP_Range_max_10.$$p = null;
      // Prepare super implicit arguments
      for($zuper_i = 0, $zuper_ii = arguments.length, $zuper = new Array($zuper_ii); $zuper_i < $zuper_ii; $zuper_i++) {
        $zuper[$zuper_i] = arguments[$zuper_i];
      }
      if (($yield !== nil)) {
        return $send(self, Opal.find_super_dispatcher(self, 'max', TMP_Range_max_10, false), $zuper, $iter)
      } else if ($truthy($rb_gt(self.begin, self.end))) {
        return nil
      } else if ($truthy(($truthy($a = self.excl) ? self.begin['$=='](self.end) : $a))) {
        return nil
      } else {
        return self.excl ? self.end - 1 : self.end
      }
    }, TMP_Range_max_10.$$arity = 0);
    Opal.alias(self, "member?", "cover?");
    
    Opal.def(self, '$min', TMP_Range_min_11 = function $$min() {
      var $a, $iter = TMP_Range_min_11.$$p, $yield = $iter || nil, self = this, $zuper = nil, $zuper_i = nil, $zuper_ii = nil;

      if ($iter) TMP_Range_min_11.$$p = null;
      // Prepare super implicit arguments
      for($zuper_i = 0, $zuper_ii = arguments.length, $zuper = new Array($zuper_ii); $zuper_i < $zuper_ii; $zuper_i++) {
        $zuper[$zuper_i] = arguments[$zuper_i];
      }
      if (($yield !== nil)) {
        return $send(self, Opal.find_super_dispatcher(self, 'min', TMP_Range_min_11, false), $zuper, $iter)
      } else if ($truthy($rb_gt(self.begin, self.end))) {
        return nil
      } else if ($truthy(($truthy($a = self.excl) ? self.begin['$=='](self.end) : $a))) {
        return nil
      } else {
        return self.begin
      }
    }, TMP_Range_min_11.$$arity = 0);
    
    Opal.def(self, '$size', TMP_Range_size_12 = function $$size() {
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
    }, TMP_Range_size_12.$$arity = 0);
    
    Opal.def(self, '$step', TMP_Range_step_13 = function $$step(n) {
      var TMP_14, TMP_15, TMP_16, $iter = TMP_Range_step_13.$$p, $yield = $iter || nil, self = this, i = nil;

      if ($iter) TMP_Range_step_13.$$p = null;
      
      
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
        return $send(self, 'enum_for', ["step", n], (TMP_14 = function(){var self = TMP_14.$$s || this;

        
          coerceStepSize();
          return enumeratorSize();
        }, TMP_14.$$s = self, TMP_14.$$arity = 0, TMP_14))
      };
      coerceStepSize();
      if ($truthy(self.begin.$$is_number && self.end.$$is_number)) {
        
        i = 0;
        (function(){var $brk = Opal.new_brk(); try {return $send(self, 'loop', [], (TMP_15 = function(){var self = TMP_15.$$s || this, current = nil;
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
          return (i = $rb_plus(i, 1));}, TMP_15.$$s = self, TMP_15.$$brk = $brk, TMP_15.$$arity = 0, TMP_15))
        } catch (err) { if (err === $brk) { return err.$v } else { throw err } }})();
      } else {
        
        
        if (self.begin.$$is_string && self.end.$$is_string && n % 1 !== 0) {
          self.$raise($$($nesting, 'TypeError'), "no implicit conversion to float from string")
        }
      ;
        $send(self, 'each_with_index', [], (TMP_16 = function(value, idx){var self = TMP_16.$$s || this;

        
          
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
          };}, TMP_16.$$s = self, TMP_16.$$arity = 2, TMP_16));
      };
      return self;
    }, TMP_Range_step_13.$$arity = -1);
    
    Opal.def(self, '$bsearch', TMP_Range_bsearch_17 = function $$bsearch() {
      var $iter = TMP_Range_bsearch_17.$$p, block = $iter || nil, self = this;

      if ($iter) TMP_Range_bsearch_17.$$p = null;
      
      
      if ($iter) TMP_Range_bsearch_17.$$p = null;;
      if ((block !== nil)) {
      } else {
        return self.$enum_for("bsearch")
      };
      if ($truthy(self.begin.$$is_number && self.end.$$is_number)) {
      } else {
        self.$raise($$($nesting, 'TypeError'), "" + "can't do binary search for " + (self.begin.$class()))
      };
      return $send(self.$to_a(), 'bsearch', [], block.$to_proc());
    }, TMP_Range_bsearch_17.$$arity = 0);
    
    Opal.def(self, '$to_s', TMP_Range_to_s_18 = function $$to_s() {
      var self = this;

      return "" + (self.begin) + ((function() {if ($truthy(self.excl)) {
        return "..."
      } else {
        return ".."
      }; return nil; })()) + (self.end)
    }, TMP_Range_to_s_18.$$arity = 0);
    
    Opal.def(self, '$inspect', TMP_Range_inspect_19 = function $$inspect() {
      var self = this;

      return "" + (self.begin.$inspect()) + ((function() {if ($truthy(self.excl)) {
        return "..."
      } else {
        return ".."
      }; return nil; })()) + (self.end.$inspect())
    }, TMP_Range_inspect_19.$$arity = 0);
    
    Opal.def(self, '$marshal_load', TMP_Range_marshal_load_20 = function $$marshal_load(args) {
      var self = this;

      
      self.begin = args['$[]']("begin");
      self.end = args['$[]']("end");
      return (self.excl = args['$[]']("excl"));
    }, TMP_Range_marshal_load_20.$$arity = 1);
    return (Opal.def(self, '$hash', TMP_Range_hash_21 = function $$hash() {
      var self = this;

      return [self.begin, self.end, self.excl].$hash()
    }, TMP_Range_hash_21.$$arity = 0), nil) && 'hash';
  })($nesting[0], null, $nesting);
};

/* Generated by Opal 0.11.99.dev */
Opal.modules["corelib/proc"] = function(Opal) {
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice, $klass = Opal.klass, $truthy = Opal.truthy;

  Opal.add_stubs(['$raise', '$coerce_to!']);
  return (function($base, $super, $parent_nesting) {
    function $Proc(){};
    var self = $Proc = $klass($base, $super, 'Proc', $Proc);

    var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_Proc_new_1, TMP_Proc_call_2, TMP_Proc_to_proc_3, TMP_Proc_lambda$q_4, TMP_Proc_arity_5, TMP_Proc_source_location_6, TMP_Proc_binding_7, TMP_Proc_parameters_8, TMP_Proc_curry_9, TMP_Proc_dup_10;

    
    Opal.defineProperty(Function.prototype, '$$is_proc', true);
    Opal.defineProperty(Function.prototype, '$$is_lambda', false);
    Opal.defs(self, '$new', TMP_Proc_new_1 = function() {
      var $iter = TMP_Proc_new_1.$$p, block = $iter || nil, self = this;

      if ($iter) TMP_Proc_new_1.$$p = null;
      
      
      if ($iter) TMP_Proc_new_1.$$p = null;;
      if ($truthy(block)) {
      } else {
        self.$raise($$($nesting, 'ArgumentError'), "tried to create a Proc object without a block")
      };
      return block;
    }, TMP_Proc_new_1.$$arity = 0);
    
    Opal.def(self, '$call', TMP_Proc_call_2 = function $$call($a) {
      var $iter = TMP_Proc_call_2.$$p, block = $iter || nil, $post_args, args, self = this;

      if ($iter) TMP_Proc_call_2.$$p = null;
      
      
      if ($iter) TMP_Proc_call_2.$$p = null;;
      
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
    }, TMP_Proc_call_2.$$arity = -1);
    Opal.alias(self, "[]", "call");
    Opal.alias(self, "===", "call");
    Opal.alias(self, "yield", "call");
    
    Opal.def(self, '$to_proc', TMP_Proc_to_proc_3 = function $$to_proc() {
      var self = this;

      return self
    }, TMP_Proc_to_proc_3.$$arity = 0);
    
    Opal.def(self, '$lambda?', TMP_Proc_lambda$q_4 = function() {
      var self = this;

      return !!self.$$is_lambda;
    }, TMP_Proc_lambda$q_4.$$arity = 0);
    
    Opal.def(self, '$arity', TMP_Proc_arity_5 = function $$arity() {
      var self = this;

      
      if (self.$$is_curried) {
        return -1;
      } else {
        return self.$$arity;
      }
    
    }, TMP_Proc_arity_5.$$arity = 0);
    
    Opal.def(self, '$source_location', TMP_Proc_source_location_6 = function $$source_location() {
      var self = this;

      
      if (self.$$is_curried) { return nil; };
      return nil;
    }, TMP_Proc_source_location_6.$$arity = 0);
    
    Opal.def(self, '$binding', TMP_Proc_binding_7 = function $$binding() {
      var self = this;

      
      if (self.$$is_curried) { self.$raise($$($nesting, 'ArgumentError'), "Can't create Binding") };
      return nil;
    }, TMP_Proc_binding_7.$$arity = 0);
    
    Opal.def(self, '$parameters', TMP_Proc_parameters_8 = function $$parameters() {
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
    
    }, TMP_Proc_parameters_8.$$arity = 0);
    
    Opal.def(self, '$curry', TMP_Proc_curry_9 = function $$curry(arity) {
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
    }, TMP_Proc_curry_9.$$arity = -1);
    
    Opal.def(self, '$dup', TMP_Proc_dup_10 = function $$dup() {
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
    
    }, TMP_Proc_dup_10.$$arity = 0);
    return Opal.alias(self, "clone", "dup");
  })($nesting[0], Function, $nesting)
};

/* Generated by Opal 0.11.99.dev */
Opal.modules["corelib/method"] = function(Opal) {
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice, $klass = Opal.klass, $truthy = Opal.truthy;

  Opal.add_stubs(['$attr_reader', '$arity', '$new', '$class', '$join', '$source_location', '$raise']);
  
  (function($base, $super, $parent_nesting) {
    function $Method(){};
    var self = $Method = $klass($base, $super, 'Method', $Method);

    var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_Method_initialize_1, TMP_Method_arity_2, TMP_Method_parameters_3, TMP_Method_source_location_4, TMP_Method_comments_5, TMP_Method_call_6, TMP_Method_unbind_7, TMP_Method_to_proc_8, TMP_Method_inspect_9;

    def.method = def.receiver = def.owner = def.name = nil;
    
    self.$attr_reader("owner", "receiver", "name");
    
    Opal.def(self, '$initialize', TMP_Method_initialize_1 = function $$initialize(receiver, owner, method, name) {
      var self = this;

      
      self.receiver = receiver;
      self.owner = owner;
      self.name = name;
      return (self.method = method);
    }, TMP_Method_initialize_1.$$arity = 4);
    
    Opal.def(self, '$arity', TMP_Method_arity_2 = function $$arity() {
      var self = this;

      return self.method.$arity()
    }, TMP_Method_arity_2.$$arity = 0);
    
    Opal.def(self, '$parameters', TMP_Method_parameters_3 = function $$parameters() {
      var self = this;

      return self.method.$$parameters
    }, TMP_Method_parameters_3.$$arity = 0);
    
    Opal.def(self, '$source_location', TMP_Method_source_location_4 = function $$source_location() {
      var $a, self = this;

      return ($truthy($a = self.method.$$source_location) ? $a : ["(eval)", 0])
    }, TMP_Method_source_location_4.$$arity = 0);
    
    Opal.def(self, '$comments', TMP_Method_comments_5 = function $$comments() {
      var $a, self = this;

      return ($truthy($a = self.method.$$comments) ? $a : [])
    }, TMP_Method_comments_5.$$arity = 0);
    
    Opal.def(self, '$call', TMP_Method_call_6 = function $$call($a) {
      var $iter = TMP_Method_call_6.$$p, block = $iter || nil, $post_args, args, self = this;

      if ($iter) TMP_Method_call_6.$$p = null;
      
      
      if ($iter) TMP_Method_call_6.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      
      self.method.$$p = block;

      return self.method.apply(self.receiver, args);
    ;
    }, TMP_Method_call_6.$$arity = -1);
    Opal.alias(self, "[]", "call");
    
    Opal.def(self, '$unbind', TMP_Method_unbind_7 = function $$unbind() {
      var self = this;

      return $$($nesting, 'UnboundMethod').$new(self.receiver.$class(), self.owner, self.method, self.name)
    }, TMP_Method_unbind_7.$$arity = 0);
    
    Opal.def(self, '$to_proc', TMP_Method_to_proc_8 = function $$to_proc() {
      var self = this;

      
      var proc = self.$call.bind(self);
      proc.$$unbound = self.method;
      proc.$$is_lambda = true;
      return proc;
    
    }, TMP_Method_to_proc_8.$$arity = 0);
    return (Opal.def(self, '$inspect', TMP_Method_inspect_9 = function $$inspect() {
      var self = this;

      return "" + "#<" + (self.$class()) + ": " + (self.receiver.$class()) + "#" + (self.name) + " (defined in " + (self.owner) + " in " + (self.$source_location().$join(":")) + ")>"
    }, TMP_Method_inspect_9.$$arity = 0), nil) && 'inspect';
  })($nesting[0], null, $nesting);
  return (function($base, $super, $parent_nesting) {
    function $UnboundMethod(){};
    var self = $UnboundMethod = $klass($base, $super, 'UnboundMethod', $UnboundMethod);

    var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_UnboundMethod_initialize_10, TMP_UnboundMethod_arity_11, TMP_UnboundMethod_parameters_12, TMP_UnboundMethod_source_location_13, TMP_UnboundMethod_comments_14, TMP_UnboundMethod_bind_15, TMP_UnboundMethod_inspect_16;

    def.method = def.owner = def.name = def.source = nil;
    
    self.$attr_reader("source", "owner", "name");
    
    Opal.def(self, '$initialize', TMP_UnboundMethod_initialize_10 = function $$initialize(source, owner, method, name) {
      var self = this;

      
      self.source = source;
      self.owner = owner;
      self.method = method;
      return (self.name = name);
    }, TMP_UnboundMethod_initialize_10.$$arity = 4);
    
    Opal.def(self, '$arity', TMP_UnboundMethod_arity_11 = function $$arity() {
      var self = this;

      return self.method.$arity()
    }, TMP_UnboundMethod_arity_11.$$arity = 0);
    
    Opal.def(self, '$parameters', TMP_UnboundMethod_parameters_12 = function $$parameters() {
      var self = this;

      return self.method.$$parameters
    }, TMP_UnboundMethod_parameters_12.$$arity = 0);
    
    Opal.def(self, '$source_location', TMP_UnboundMethod_source_location_13 = function $$source_location() {
      var $a, self = this;

      return ($truthy($a = self.method.$$source_location) ? $a : ["(eval)", 0])
    }, TMP_UnboundMethod_source_location_13.$$arity = 0);
    
    Opal.def(self, '$comments', TMP_UnboundMethod_comments_14 = function $$comments() {
      var $a, self = this;

      return ($truthy($a = self.method.$$comments) ? $a : [])
    }, TMP_UnboundMethod_comments_14.$$arity = 0);
    
    Opal.def(self, '$bind', TMP_UnboundMethod_bind_15 = function $$bind(object) {
      var self = this;

      
      if (self.owner.$$is_module || Opal.is_a(object, self.owner)) {
        return $$($nesting, 'Method').$new(object, self.owner, self.method, self.name);
      }
      else {
        self.$raise($$($nesting, 'TypeError'), "" + "can't bind singleton method to a different class (expected " + (object) + ".kind_of?(" + (self.owner) + " to be true)");
      }
    
    }, TMP_UnboundMethod_bind_15.$$arity = 1);
    return (Opal.def(self, '$inspect', TMP_UnboundMethod_inspect_16 = function $$inspect() {
      var self = this;

      return "" + "#<" + (self.$class()) + ": " + (self.source) + "#" + (self.name) + " (defined in " + (self.owner) + " in " + (self.$source_location().$join(":")) + ")>"
    }, TMP_UnboundMethod_inspect_16.$$arity = 0), nil) && 'inspect';
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
    function $Opal() {};
    var self = $Opal = $module($base, 'Opal', $Opal);

    var def = self.prototype, $nesting = [self].concat($parent_nesting);

    
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
  var TMP_12, TMP_15, TMP_18, TMP_21, TMP_24, self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice, $klass = Opal.klass, $hash2 = Opal.hash2, $truthy = Opal.truthy, $send = Opal.send;

  Opal.add_stubs(['$require', '$+', '$[]', '$new', '$to_proc', '$each', '$const_set', '$sub', '$==', '$default_external', '$upcase', '$raise', '$attr_accessor', '$attr_reader', '$register', '$length', '$bytes', '$to_a', '$each_byte', '$bytesize', '$enum_for', '$force_encoding', '$dup', '$coerce_to!', '$find', '$getbyte']);
  
  self.$require("corelib/string");
  (function($base, $super, $parent_nesting) {
    function $Encoding(){};
    var self = $Encoding = $klass($base, $super, 'Encoding', $Encoding);

    var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_Encoding_register_1, TMP_Encoding_find_3, TMP_Encoding_initialize_4, TMP_Encoding_ascii_compatible$q_5, TMP_Encoding_dummy$q_6, TMP_Encoding_to_s_7, TMP_Encoding_inspect_8, TMP_Encoding_each_byte_9, TMP_Encoding_getbyte_10, TMP_Encoding_bytesize_11;

    def.ascii = def.dummy = def.name = nil;
    
    Opal.defineProperty(self, '$$register', {});
    Opal.defs(self, '$register', TMP_Encoding_register_1 = function $$register(name, options) {
      var $iter = TMP_Encoding_register_1.$$p, block = $iter || nil, $a, TMP_2, self = this, names = nil, encoding = nil, register = nil;

      if ($iter) TMP_Encoding_register_1.$$p = null;
      
      
      if ($iter) TMP_Encoding_register_1.$$p = null;;
      
      if (options == null) {
        options = $hash2([], {});
      };
      names = $rb_plus([name], ($truthy($a = options['$[]']("aliases")) ? $a : []));
      encoding = $send($$($nesting, 'Class'), 'new', [self], block.$to_proc()).$new(name, names, ($truthy($a = options['$[]']("ascii")) ? $a : false), ($truthy($a = options['$[]']("dummy")) ? $a : false));
      register = self["$$register"];
      return $send(names, 'each', [], (TMP_2 = function(encoding_name){var self = TMP_2.$$s || this;

      
        
        if (encoding_name == null) {
          encoding_name = nil;
        };
        self.$const_set(encoding_name.$sub("-", "_"), encoding);
        return register["" + "$$" + (encoding_name)] = encoding;}, TMP_2.$$s = self, TMP_2.$$arity = 1, TMP_2));
    }, TMP_Encoding_register_1.$$arity = -2);
    Opal.defs(self, '$find', TMP_Encoding_find_3 = function $$find(name) {
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
    }, TMP_Encoding_find_3.$$arity = 1);
    (function(self, $parent_nesting) {
      var def = self.prototype, $nesting = [self].concat($parent_nesting);

      return self.$attr_accessor("default_external")
    })(Opal.get_singleton_class(self), $nesting);
    self.$attr_reader("name", "names");
    
    Opal.def(self, '$initialize', TMP_Encoding_initialize_4 = function $$initialize(name, names, ascii, dummy) {
      var self = this;

      
      self.name = name;
      self.names = names;
      self.ascii = ascii;
      return (self.dummy = dummy);
    }, TMP_Encoding_initialize_4.$$arity = 4);
    
    Opal.def(self, '$ascii_compatible?', TMP_Encoding_ascii_compatible$q_5 = function() {
      var self = this;

      return self.ascii
    }, TMP_Encoding_ascii_compatible$q_5.$$arity = 0);
    
    Opal.def(self, '$dummy?', TMP_Encoding_dummy$q_6 = function() {
      var self = this;

      return self.dummy
    }, TMP_Encoding_dummy$q_6.$$arity = 0);
    
    Opal.def(self, '$to_s', TMP_Encoding_to_s_7 = function $$to_s() {
      var self = this;

      return self.name
    }, TMP_Encoding_to_s_7.$$arity = 0);
    
    Opal.def(self, '$inspect', TMP_Encoding_inspect_8 = function $$inspect() {
      var self = this;

      return "" + "#<Encoding:" + (self.name) + ((function() {if ($truthy(self.dummy)) {
        return " (dummy)"
      } else {
        return nil
      }; return nil; })()) + ">"
    }, TMP_Encoding_inspect_8.$$arity = 0);
    
    Opal.def(self, '$each_byte', TMP_Encoding_each_byte_9 = function $$each_byte($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return self.$raise($$($nesting, 'NotImplementedError'));
    }, TMP_Encoding_each_byte_9.$$arity = -1);
    
    Opal.def(self, '$getbyte', TMP_Encoding_getbyte_10 = function $$getbyte($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return self.$raise($$($nesting, 'NotImplementedError'));
    }, TMP_Encoding_getbyte_10.$$arity = -1);
    
    Opal.def(self, '$bytesize', TMP_Encoding_bytesize_11 = function $$bytesize($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return self.$raise($$($nesting, 'NotImplementedError'));
    }, TMP_Encoding_bytesize_11.$$arity = -1);
    (function($base, $super, $parent_nesting) {
      function $EncodingError(){};
      var self = $EncodingError = $klass($base, $super, 'EncodingError', $EncodingError);

      var def = self.prototype, $nesting = [self].concat($parent_nesting);

      return nil
    })($nesting[0], $$($nesting, 'StandardError'), $nesting);
    return (function($base, $super, $parent_nesting) {
      function $CompatibilityError(){};
      var self = $CompatibilityError = $klass($base, $super, 'CompatibilityError', $CompatibilityError);

      var def = self.prototype, $nesting = [self].concat($parent_nesting);

      return nil
    })($nesting[0], $$($nesting, 'EncodingError'), $nesting);
  })($nesting[0], null, $nesting);
  $send($$($nesting, 'Encoding'), 'register', ["UTF-8", $hash2(["aliases", "ascii"], {"aliases": ["CP65001"], "ascii": true})], (TMP_12 = function(){var self = TMP_12.$$s || this, TMP_each_byte_13, TMP_bytesize_14;

  
    
    Opal.def(self, '$each_byte', TMP_each_byte_13 = function $$each_byte(string) {
      var $iter = TMP_each_byte_13.$$p, block = $iter || nil, self = this;

      if ($iter) TMP_each_byte_13.$$p = null;
      
      
      if ($iter) TMP_each_byte_13.$$p = null;;
      
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
    }, TMP_each_byte_13.$$arity = 1);
    return (Opal.def(self, '$bytesize', TMP_bytesize_14 = function $$bytesize(string) {
      var self = this;

      return string.$bytes().$length()
    }, TMP_bytesize_14.$$arity = 1), nil) && 'bytesize';}, TMP_12.$$s = self, TMP_12.$$arity = 0, TMP_12));
  $send($$($nesting, 'Encoding'), 'register', ["UTF-16LE"], (TMP_15 = function(){var self = TMP_15.$$s || this, TMP_each_byte_16, TMP_bytesize_17;

  
    
    Opal.def(self, '$each_byte', TMP_each_byte_16 = function $$each_byte(string) {
      var $iter = TMP_each_byte_16.$$p, block = $iter || nil, self = this;

      if ($iter) TMP_each_byte_16.$$p = null;
      
      
      if ($iter) TMP_each_byte_16.$$p = null;;
      
      for (var i = 0, length = string.length; i < length; i++) {
        var code = string.charCodeAt(i);

        Opal.yield1(block, code & 0xff);
        Opal.yield1(block, code >> 8);
      }
    ;
    }, TMP_each_byte_16.$$arity = 1);
    return (Opal.def(self, '$bytesize', TMP_bytesize_17 = function $$bytesize(string) {
      var self = this;

      return string.$bytes().$length()
    }, TMP_bytesize_17.$$arity = 1), nil) && 'bytesize';}, TMP_15.$$s = self, TMP_15.$$arity = 0, TMP_15));
  $send($$($nesting, 'Encoding'), 'register', ["UTF-16BE"], (TMP_18 = function(){var self = TMP_18.$$s || this, TMP_each_byte_19, TMP_bytesize_20;

  
    
    Opal.def(self, '$each_byte', TMP_each_byte_19 = function $$each_byte(string) {
      var $iter = TMP_each_byte_19.$$p, block = $iter || nil, self = this;

      if ($iter) TMP_each_byte_19.$$p = null;
      
      
      if ($iter) TMP_each_byte_19.$$p = null;;
      
      for (var i = 0, length = string.length; i < length; i++) {
        var code = string.charCodeAt(i);

        Opal.yield1(block, code >> 8);
        Opal.yield1(block, code & 0xff);
      }
    ;
    }, TMP_each_byte_19.$$arity = 1);
    return (Opal.def(self, '$bytesize', TMP_bytesize_20 = function $$bytesize(string) {
      var self = this;

      return string.$bytes().$length()
    }, TMP_bytesize_20.$$arity = 1), nil) && 'bytesize';}, TMP_18.$$s = self, TMP_18.$$arity = 0, TMP_18));
  $send($$($nesting, 'Encoding'), 'register', ["UTF-32LE"], (TMP_21 = function(){var self = TMP_21.$$s || this, TMP_each_byte_22, TMP_bytesize_23;

  
    
    Opal.def(self, '$each_byte', TMP_each_byte_22 = function $$each_byte(string) {
      var $iter = TMP_each_byte_22.$$p, block = $iter || nil, self = this;

      if ($iter) TMP_each_byte_22.$$p = null;
      
      
      if ($iter) TMP_each_byte_22.$$p = null;;
      
      for (var i = 0, length = string.length; i < length; i++) {
        var code = string.charCodeAt(i);

        Opal.yield1(block, code & 0xff);
        Opal.yield1(block, code >> 8);
      }
    ;
    }, TMP_each_byte_22.$$arity = 1);
    return (Opal.def(self, '$bytesize', TMP_bytesize_23 = function $$bytesize(string) {
      var self = this;

      return string.$bytes().$length()
    }, TMP_bytesize_23.$$arity = 1), nil) && 'bytesize';}, TMP_21.$$s = self, TMP_21.$$arity = 0, TMP_21));
  $send($$($nesting, 'Encoding'), 'register', ["ASCII-8BIT", $hash2(["aliases", "ascii", "dummy"], {"aliases": ["BINARY", "US-ASCII", "ASCII"], "ascii": true, "dummy": true})], (TMP_24 = function(){var self = TMP_24.$$s || this, TMP_each_byte_25, TMP_bytesize_26;

  
    
    Opal.def(self, '$each_byte', TMP_each_byte_25 = function $$each_byte(string) {
      var $iter = TMP_each_byte_25.$$p, block = $iter || nil, self = this;

      if ($iter) TMP_each_byte_25.$$p = null;
      
      
      if ($iter) TMP_each_byte_25.$$p = null;;
      
      for (var i = 0, length = string.length; i < length; i++) {
        var code = string.charCodeAt(i);
        Opal.yield1(block, code & 0xff);
        Opal.yield1(block, code >> 8);
      }
    ;
    }, TMP_each_byte_25.$$arity = 1);
    return (Opal.def(self, '$bytesize', TMP_bytesize_26 = function $$bytesize(string) {
      var self = this;

      return string.$bytes().$length()
    }, TMP_bytesize_26.$$arity = 1), nil) && 'bytesize';}, TMP_24.$$s = self, TMP_24.$$arity = 0, TMP_24));
  return (function($base, $super, $parent_nesting) {
    function $String(){};
    var self = $String = $klass($base, $super, 'String', $String);

    var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_String_bytes_27, TMP_String_bytesize_28, TMP_String_each_byte_29, TMP_String_encode_30, TMP_String_force_encoding_31, TMP_String_getbyte_32, TMP_String_valid_encoding$q_33;

    def.encoding = nil;
    
    self.$attr_reader("encoding");
    Opal.defineProperty(String.prototype, 'encoding', $$$($$($nesting, 'Encoding'), 'UTF_16LE'));
    
    Opal.def(self, '$bytes', TMP_String_bytes_27 = function $$bytes() {
      var self = this;

      return self.$each_byte().$to_a()
    }, TMP_String_bytes_27.$$arity = 0);
    
    Opal.def(self, '$bytesize', TMP_String_bytesize_28 = function $$bytesize() {
      var self = this;

      return self.encoding.$bytesize(self)
    }, TMP_String_bytesize_28.$$arity = 0);
    
    Opal.def(self, '$each_byte', TMP_String_each_byte_29 = function $$each_byte() {
      var $iter = TMP_String_each_byte_29.$$p, block = $iter || nil, self = this;

      if ($iter) TMP_String_each_byte_29.$$p = null;
      
      
      if ($iter) TMP_String_each_byte_29.$$p = null;;
      if ((block !== nil)) {
      } else {
        return self.$enum_for("each_byte")
      };
      $send(self.encoding, 'each_byte', [self], block.$to_proc());
      return self;
    }, TMP_String_each_byte_29.$$arity = 0);
    
    Opal.def(self, '$encode', TMP_String_encode_30 = function $$encode(encoding) {
      var self = this;

      return self.$dup().$force_encoding(encoding)
    }, TMP_String_encode_30.$$arity = 1);
    
    Opal.def(self, '$force_encoding', TMP_String_force_encoding_31 = function $$force_encoding(encoding) {
      var self = this;

      
      if (encoding === self.encoding) { return self; }

      encoding = $$($nesting, 'Opal')['$coerce_to!'](encoding, $$($nesting, 'String'), "to_s");
      encoding = $$($nesting, 'Encoding').$find(encoding);

      if (encoding === self.encoding) { return self; }

      self.encoding = encoding;
      return self;
    
    }, TMP_String_force_encoding_31.$$arity = 1);
    
    Opal.def(self, '$getbyte', TMP_String_getbyte_32 = function $$getbyte(idx) {
      var self = this;

      return self.encoding.$getbyte(self, idx)
    }, TMP_String_getbyte_32.$$arity = 1);
    return (Opal.def(self, '$valid_encoding?', TMP_String_valid_encoding$q_33 = function() {
      var self = this;

      return true
    }, TMP_String_valid_encoding$q_33.$$arity = 0), nil) && 'valid_encoding?';
  })($nesting[0], null, $nesting);
};

/* Generated by Opal 0.11.99.dev */
Opal.modules["corelib/math"] = function(Opal) {
  function $rb_minus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs - rhs : lhs['$-'](rhs);
  }
  function $rb_divide(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs / rhs : lhs['$/'](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice, $module = Opal.module, $truthy = Opal.truthy;

  Opal.add_stubs(['$new', '$raise', '$Float', '$type_error', '$Integer', '$module_function', '$checked', '$float!', '$===', '$gamma', '$-', '$integer!', '$/', '$infinite?']);
  return (function($base, $parent_nesting) {
    function $Math() {};
    var self = $Math = $module($base, 'Math', $Math);

    var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_Math_checked_1, TMP_Math_float$B_2, TMP_Math_integer$B_3, TMP_Math_acos_4, TMP_Math_acosh_5, TMP_Math_asin_6, TMP_Math_asinh_7, TMP_Math_atan_8, TMP_Math_atan2_9, TMP_Math_atanh_10, TMP_Math_cbrt_11, TMP_Math_cos_12, TMP_Math_cosh_13, TMP_Math_erf_14, TMP_Math_erfc_15, TMP_Math_exp_16, TMP_Math_frexp_17, TMP_Math_gamma_18, TMP_Math_hypot_19, TMP_Math_ldexp_20, TMP_Math_lgamma_21, TMP_Math_log_22, TMP_Math_log10_23, TMP_Math_log2_24, TMP_Math_sin_25, TMP_Math_sinh_26, TMP_Math_sqrt_27, TMP_Math_tan_28, TMP_Math_tanh_29;

    
    Opal.const_set($nesting[0], 'E', Math.E);
    Opal.const_set($nesting[0], 'PI', Math.PI);
    Opal.const_set($nesting[0], 'DomainError', $$($nesting, 'Class').$new($$($nesting, 'StandardError')));
    Opal.defs(self, '$checked', TMP_Math_checked_1 = function $$checked(method, $a) {
      var $post_args, args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 1, arguments.length);
      
      args = $post_args;;
      
      if (isNaN(args[0]) || (args.length == 2 && isNaN(args[1]))) {
        return NaN;
      }

      var result = Math[method].apply(null, args);

      if (isNaN(result)) {
        self.$raise($$($nesting, 'DomainError'), "" + "Numerical argument is out of domain - \"" + (method) + "\"");
      }

      return result;
    ;
    }, TMP_Math_checked_1.$$arity = -2);
    Opal.defs(self, '$float!', TMP_Math_float$B_2 = function(value) {
      var self = this;

      try {
        return self.$Float(value)
      } catch ($err) {
        if (Opal.rescue($err, [$$($nesting, 'ArgumentError')])) {
          try {
            return self.$raise($$($nesting, 'Opal').$type_error(value, $$($nesting, 'Float')))
          } finally { Opal.pop_exception() }
        } else { throw $err; }
      }
    }, TMP_Math_float$B_2.$$arity = 1);
    Opal.defs(self, '$integer!', TMP_Math_integer$B_3 = function(value) {
      var self = this;

      try {
        return self.$Integer(value)
      } catch ($err) {
        if (Opal.rescue($err, [$$($nesting, 'ArgumentError')])) {
          try {
            return self.$raise($$($nesting, 'Opal').$type_error(value, $$($nesting, 'Integer')))
          } finally { Opal.pop_exception() }
        } else { throw $err; }
      }
    }, TMP_Math_integer$B_3.$$arity = 1);
    self.$module_function();
    
    Opal.def(self, '$acos', TMP_Math_acos_4 = function $$acos(x) {
      var self = this;

      return $$($nesting, 'Math').$checked("acos", $$($nesting, 'Math')['$float!'](x))
    }, TMP_Math_acos_4.$$arity = 1);
    if ($truthy((typeof(Math.acosh) !== "undefined"))) {
    } else {
      
      Math.acosh = function(x) {
        return Math.log(x + Math.sqrt(x * x - 1));
      }
    
    };
    
    Opal.def(self, '$acosh', TMP_Math_acosh_5 = function $$acosh(x) {
      var self = this;

      return $$($nesting, 'Math').$checked("acosh", $$($nesting, 'Math')['$float!'](x))
    }, TMP_Math_acosh_5.$$arity = 1);
    
    Opal.def(self, '$asin', TMP_Math_asin_6 = function $$asin(x) {
      var self = this;

      return $$($nesting, 'Math').$checked("asin", $$($nesting, 'Math')['$float!'](x))
    }, TMP_Math_asin_6.$$arity = 1);
    if ($truthy((typeof(Math.asinh) !== "undefined"))) {
    } else {
      
      Math.asinh = function(x) {
        return Math.log(x + Math.sqrt(x * x + 1))
      }
    
    };
    
    Opal.def(self, '$asinh', TMP_Math_asinh_7 = function $$asinh(x) {
      var self = this;

      return $$($nesting, 'Math').$checked("asinh", $$($nesting, 'Math')['$float!'](x))
    }, TMP_Math_asinh_7.$$arity = 1);
    
    Opal.def(self, '$atan', TMP_Math_atan_8 = function $$atan(x) {
      var self = this;

      return $$($nesting, 'Math').$checked("atan", $$($nesting, 'Math')['$float!'](x))
    }, TMP_Math_atan_8.$$arity = 1);
    
    Opal.def(self, '$atan2', TMP_Math_atan2_9 = function $$atan2(y, x) {
      var self = this;

      return $$($nesting, 'Math').$checked("atan2", $$($nesting, 'Math')['$float!'](y), $$($nesting, 'Math')['$float!'](x))
    }, TMP_Math_atan2_9.$$arity = 2);
    if ($truthy((typeof(Math.atanh) !== "undefined"))) {
    } else {
      
      Math.atanh = function(x) {
        return 0.5 * Math.log((1 + x) / (1 - x));
      }
    
    };
    
    Opal.def(self, '$atanh', TMP_Math_atanh_10 = function $$atanh(x) {
      var self = this;

      return $$($nesting, 'Math').$checked("atanh", $$($nesting, 'Math')['$float!'](x))
    }, TMP_Math_atanh_10.$$arity = 1);
    if ($truthy((typeof(Math.cbrt) !== "undefined"))) {
    } else {
      
      Math.cbrt = function(x) {
        if (x == 0) {
          return 0;
        }

        if (x < 0) {
          return -Math.cbrt(-x);
        }

        var r  = x,
            ex = 0;

        while (r < 0.125) {
          r *= 8;
          ex--;
        }

        while (r > 1.0) {
          r *= 0.125;
          ex++;
        }

        r = (-0.46946116 * r + 1.072302) * r + 0.3812513;

        while (ex < 0) {
          r *= 0.5;
          ex++;
        }

        while (ex > 0) {
          r *= 2;
          ex--;
        }

        r = (2.0 / 3.0) * r + (1.0 / 3.0) * x / (r * r);
        r = (2.0 / 3.0) * r + (1.0 / 3.0) * x / (r * r);
        r = (2.0 / 3.0) * r + (1.0 / 3.0) * x / (r * r);
        r = (2.0 / 3.0) * r + (1.0 / 3.0) * x / (r * r);

        return r;
      }
    
    };
    
    Opal.def(self, '$cbrt', TMP_Math_cbrt_11 = function $$cbrt(x) {
      var self = this;

      return $$($nesting, 'Math').$checked("cbrt", $$($nesting, 'Math')['$float!'](x))
    }, TMP_Math_cbrt_11.$$arity = 1);
    
    Opal.def(self, '$cos', TMP_Math_cos_12 = function $$cos(x) {
      var self = this;

      return $$($nesting, 'Math').$checked("cos", $$($nesting, 'Math')['$float!'](x))
    }, TMP_Math_cos_12.$$arity = 1);
    if ($truthy((typeof(Math.cosh) !== "undefined"))) {
    } else {
      
      Math.cosh = function(x) {
        return (Math.exp(x) + Math.exp(-x)) / 2;
      }
    
    };
    
    Opal.def(self, '$cosh', TMP_Math_cosh_13 = function $$cosh(x) {
      var self = this;

      return $$($nesting, 'Math').$checked("cosh", $$($nesting, 'Math')['$float!'](x))
    }, TMP_Math_cosh_13.$$arity = 1);
    if ($truthy((typeof(Math.erf) !== "undefined"))) {
    } else {
      
      Opal.defineProperty(Math, 'erf', function(x) {
        var A1 =  0.254829592,
            A2 = -0.284496736,
            A3 =  1.421413741,
            A4 = -1.453152027,
            A5 =  1.061405429,
            P  =  0.3275911;

        var sign = 1;

        if (x < 0) {
            sign = -1;
        }

        x = Math.abs(x);

        var t = 1.0 / (1.0 + P * x);
        var y = 1.0 - (((((A5 * t + A4) * t) + A3) * t + A2) * t + A1) * t * Math.exp(-x * x);

        return sign * y;
      });
    
    };
    
    Opal.def(self, '$erf', TMP_Math_erf_14 = function $$erf(x) {
      var self = this;

      return $$($nesting, 'Math').$checked("erf", $$($nesting, 'Math')['$float!'](x))
    }, TMP_Math_erf_14.$$arity = 1);
    if ($truthy((typeof(Math.erfc) !== "undefined"))) {
    } else {
      
      Opal.defineProperty(Math, 'erfc', function(x) {
        var z = Math.abs(x),
            t = 1.0 / (0.5 * z + 1.0);

        var A1 = t * 0.17087277 + -0.82215223,
            A2 = t * A1 + 1.48851587,
            A3 = t * A2 + -1.13520398,
            A4 = t * A3 + 0.27886807,
            A5 = t * A4 + -0.18628806,
            A6 = t * A5 + 0.09678418,
            A7 = t * A6 + 0.37409196,
            A8 = t * A7 + 1.00002368,
            A9 = t * A8,
            A10 = -z * z - 1.26551223 + A9;

        var a = t * Math.exp(A10);

        if (x < 0.0) {
          return 2.0 - a;
        }
        else {
          return a;
        }
      });
    
    };
    
    Opal.def(self, '$erfc', TMP_Math_erfc_15 = function $$erfc(x) {
      var self = this;

      return $$($nesting, 'Math').$checked("erfc", $$($nesting, 'Math')['$float!'](x))
    }, TMP_Math_erfc_15.$$arity = 1);
    
    Opal.def(self, '$exp', TMP_Math_exp_16 = function $$exp(x) {
      var self = this;

      return $$($nesting, 'Math').$checked("exp", $$($nesting, 'Math')['$float!'](x))
    }, TMP_Math_exp_16.$$arity = 1);
    
    Opal.def(self, '$frexp', TMP_Math_frexp_17 = function $$frexp(x) {
      var self = this;

      
      x = $$($nesting, 'Math')['$float!'](x);
      
      if (isNaN(x)) {
        return [NaN, 0];
      }

      var ex   = Math.floor(Math.log(Math.abs(x)) / Math.log(2)) + 1,
          frac = x / Math.pow(2, ex);

      return [frac, ex];
    ;
    }, TMP_Math_frexp_17.$$arity = 1);
    
    Opal.def(self, '$gamma', TMP_Math_gamma_18 = function $$gamma(n) {
      var self = this;

      
      n = $$($nesting, 'Math')['$float!'](n);
      
      var i, t, x, value, result, twoN, threeN, fourN, fiveN;

      var G = 4.7421875;

      var P = [
         0.99999999999999709182,
         57.156235665862923517,
        -59.597960355475491248,
         14.136097974741747174,
        -0.49191381609762019978,
         0.33994649984811888699e-4,
         0.46523628927048575665e-4,
        -0.98374475304879564677e-4,
         0.15808870322491248884e-3,
        -0.21026444172410488319e-3,
         0.21743961811521264320e-3,
        -0.16431810653676389022e-3,
         0.84418223983852743293e-4,
        -0.26190838401581408670e-4,
         0.36899182659531622704e-5
      ];


      if (isNaN(n)) {
        return NaN;
      }

      if (n === 0 && 1 / n < 0) {
        return -Infinity;
      }

      if (n === -1 || n === -Infinity) {
        self.$raise($$($nesting, 'DomainError'), "Numerical argument is out of domain - \"gamma\"");
      }

      if ($$($nesting, 'Integer')['$==='](n)) {
        if (n <= 0) {
          return isFinite(n) ? Infinity : NaN;
        }

        if (n > 171) {
          return Infinity;
        }

        value  = n - 2;
        result = n - 1;

        while (value > 1) {
          result *= value;
          value--;
        }

        if (result == 0) {
          result = 1;
        }

        return result;
      }

      if (n < 0.5) {
        return Math.PI / (Math.sin(Math.PI * n) * $$($nesting, 'Math').$gamma($rb_minus(1, n)));
      }

      if (n >= 171.35) {
        return Infinity;
      }

      if (n > 85.0) {
        twoN   = n * n;
        threeN = twoN * n;
        fourN  = threeN * n;
        fiveN  = fourN * n;

        return Math.sqrt(2 * Math.PI / n) * Math.pow((n / Math.E), n) *
          (1 + 1 / (12 * n) + 1 / (288 * twoN) - 139 / (51840 * threeN) -
          571 / (2488320 * fourN) + 163879 / (209018880 * fiveN) +
          5246819 / (75246796800 * fiveN * n));
      }

      n -= 1;
      x  = P[0];

      for (i = 1; i < P.length; ++i) {
        x += P[i] / (n + i);
      }

      t = n + G + 0.5;

      return Math.sqrt(2 * Math.PI) * Math.pow(t, n + 0.5) * Math.exp(-t) * x;
    ;
    }, TMP_Math_gamma_18.$$arity = 1);
    if ($truthy((typeof(Math.hypot) !== "undefined"))) {
    } else {
      
      Math.hypot = function(x, y) {
        return Math.sqrt(x * x + y * y)
      }
    
    };
    
    Opal.def(self, '$hypot', TMP_Math_hypot_19 = function $$hypot(x, y) {
      var self = this;

      return $$($nesting, 'Math').$checked("hypot", $$($nesting, 'Math')['$float!'](x), $$($nesting, 'Math')['$float!'](y))
    }, TMP_Math_hypot_19.$$arity = 2);
    
    Opal.def(self, '$ldexp', TMP_Math_ldexp_20 = function $$ldexp(mantissa, exponent) {
      var self = this;

      
      mantissa = $$($nesting, 'Math')['$float!'](mantissa);
      exponent = $$($nesting, 'Math')['$integer!'](exponent);
      
      if (isNaN(exponent)) {
        self.$raise($$($nesting, 'RangeError'), "float NaN out of range of integer");
      }

      return mantissa * Math.pow(2, exponent);
    ;
    }, TMP_Math_ldexp_20.$$arity = 2);
    
    Opal.def(self, '$lgamma', TMP_Math_lgamma_21 = function $$lgamma(n) {
      var self = this;

      
      if (n == -1) {
        return [Infinity, 1];
      }
      else {
        return [Math.log(Math.abs($$($nesting, 'Math').$gamma(n))), $$($nesting, 'Math').$gamma(n) < 0 ? -1 : 1];
      }
    
    }, TMP_Math_lgamma_21.$$arity = 1);
    
    Opal.def(self, '$log', TMP_Math_log_22 = function $$log(x, base) {
      var self = this;

      
      ;
      if ($truthy($$($nesting, 'String')['$==='](x))) {
        self.$raise($$($nesting, 'Opal').$type_error(x, $$($nesting, 'Float')))};
      if ($truthy(base == null)) {
        return $$($nesting, 'Math').$checked("log", $$($nesting, 'Math')['$float!'](x))
      } else {
        
        if ($truthy($$($nesting, 'String')['$==='](base))) {
          self.$raise($$($nesting, 'Opal').$type_error(base, $$($nesting, 'Float')))};
        return $rb_divide($$($nesting, 'Math').$checked("log", $$($nesting, 'Math')['$float!'](x)), $$($nesting, 'Math').$checked("log", $$($nesting, 'Math')['$float!'](base)));
      };
    }, TMP_Math_log_22.$$arity = -2);
    if ($truthy((typeof(Math.log10) !== "undefined"))) {
    } else {
      
      Math.log10 = function(x) {
        return Math.log(x) / Math.LN10;
      }
    
    };
    
    Opal.def(self, '$log10', TMP_Math_log10_23 = function $$log10(x) {
      var self = this;

      
      if ($truthy($$($nesting, 'String')['$==='](x))) {
        self.$raise($$($nesting, 'Opal').$type_error(x, $$($nesting, 'Float')))};
      return $$($nesting, 'Math').$checked("log10", $$($nesting, 'Math')['$float!'](x));
    }, TMP_Math_log10_23.$$arity = 1);
    if ($truthy((typeof(Math.log2) !== "undefined"))) {
    } else {
      
      Math.log2 = function(x) {
        return Math.log(x) / Math.LN2;
      }
    
    };
    
    Opal.def(self, '$log2', TMP_Math_log2_24 = function $$log2(x) {
      var self = this;

      
      if ($truthy($$($nesting, 'String')['$==='](x))) {
        self.$raise($$($nesting, 'Opal').$type_error(x, $$($nesting, 'Float')))};
      return $$($nesting, 'Math').$checked("log2", $$($nesting, 'Math')['$float!'](x));
    }, TMP_Math_log2_24.$$arity = 1);
    
    Opal.def(self, '$sin', TMP_Math_sin_25 = function $$sin(x) {
      var self = this;

      return $$($nesting, 'Math').$checked("sin", $$($nesting, 'Math')['$float!'](x))
    }, TMP_Math_sin_25.$$arity = 1);
    if ($truthy((typeof(Math.sinh) !== "undefined"))) {
    } else {
      
      Math.sinh = function(x) {
        return (Math.exp(x) - Math.exp(-x)) / 2;
      }
    
    };
    
    Opal.def(self, '$sinh', TMP_Math_sinh_26 = function $$sinh(x) {
      var self = this;

      return $$($nesting, 'Math').$checked("sinh", $$($nesting, 'Math')['$float!'](x))
    }, TMP_Math_sinh_26.$$arity = 1);
    
    Opal.def(self, '$sqrt', TMP_Math_sqrt_27 = function $$sqrt(x) {
      var self = this;

      return $$($nesting, 'Math').$checked("sqrt", $$($nesting, 'Math')['$float!'](x))
    }, TMP_Math_sqrt_27.$$arity = 1);
    
    Opal.def(self, '$tan', TMP_Math_tan_28 = function $$tan(x) {
      var self = this;

      
      x = $$($nesting, 'Math')['$float!'](x);
      if ($truthy(x['$infinite?']())) {
        return $$$($$($nesting, 'Float'), 'NAN')};
      return $$($nesting, 'Math').$checked("tan", $$($nesting, 'Math')['$float!'](x));
    }, TMP_Math_tan_28.$$arity = 1);
    if ($truthy((typeof(Math.tanh) !== "undefined"))) {
    } else {
      
      Math.tanh = function(x) {
        if (x == Infinity) {
          return 1;
        }
        else if (x == -Infinity) {
          return -1;
        }
        else {
          return (Math.exp(x) - Math.exp(-x)) / (Math.exp(x) + Math.exp(-x));
        }
      }
    
    };
    
    Opal.def(self, '$tanh', TMP_Math_tanh_29 = function $$tanh(x) {
      var self = this;

      return $$($nesting, 'Math').$checked("tanh", $$($nesting, 'Math')['$float!'](x))
    }, TMP_Math_tanh_29.$$arity = 1);
  })($nesting[0], $nesting)
};

/* Generated by Opal 0.11.99.dev */
Opal.modules["corelib/complex"] = function(Opal) {
  function $rb_times(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs * rhs : lhs['$*'](rhs);
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
  function $rb_gt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs > rhs : lhs['$>'](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice, $klass = Opal.klass, $truthy = Opal.truthy, $module = Opal.module;

  Opal.add_stubs(['$require', '$===', '$real?', '$raise', '$new', '$*', '$cos', '$sin', '$attr_reader', '$class', '$==', '$real', '$imag', '$Complex', '$-@', '$+', '$__coerced__', '$-', '$nan?', '$/', '$conj', '$abs2', '$quo', '$polar', '$exp', '$log', '$>', '$!=', '$divmod', '$**', '$hypot', '$atan2', '$lcm', '$denominator', '$finite?', '$infinite?', '$numerator', '$abs', '$arg', '$rationalize', '$to_f', '$to_i', '$to_r', '$inspect', '$positive?', '$zero?', '$Rational']);
  
  self.$require("corelib/numeric");
  (function($base, $super, $parent_nesting) {
    function $Complex(){};
    var self = $Complex = $klass($base, $super, 'Complex', $Complex);

    var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_Complex_rect_1, TMP_Complex_polar_2, TMP_Complex_initialize_3, TMP_Complex_coerce_4, TMP_Complex_$eq$eq_5, TMP_Complex_$$_6, TMP_Complex_$_7, TMP_Complex_$_8, TMP_Complex_$_9, TMP_Complex_$_10, TMP_Complex_$$_11, TMP_Complex_abs_12, TMP_Complex_abs2_13, TMP_Complex_angle_14, TMP_Complex_conj_15, TMP_Complex_denominator_16, TMP_Complex_eql$q_17, TMP_Complex_fdiv_18, TMP_Complex_finite$q_19, TMP_Complex_hash_20, TMP_Complex_infinite$q_21, TMP_Complex_inspect_22, TMP_Complex_numerator_23, TMP_Complex_polar_24, TMP_Complex_rationalize_25, TMP_Complex_real$q_26, TMP_Complex_rect_27, TMP_Complex_to_f_28, TMP_Complex_to_i_29, TMP_Complex_to_r_30, TMP_Complex_to_s_31;

    def.real = def.imag = nil;
    
    Opal.defs(self, '$rect', TMP_Complex_rect_1 = function $$rect(real, imag) {
      var $a, $b, $c, self = this;

      
      
      if (imag == null) {
        imag = 0;
      };
      if ($truthy(($truthy($a = ($truthy($b = ($truthy($c = $$($nesting, 'Numeric')['$==='](real)) ? real['$real?']() : $c)) ? $$($nesting, 'Numeric')['$==='](imag) : $b)) ? imag['$real?']() : $a))) {
      } else {
        self.$raise($$($nesting, 'TypeError'), "not a real")
      };
      return self.$new(real, imag);
    }, TMP_Complex_rect_1.$$arity = -2);
    (function(self, $parent_nesting) {
      var def = self.prototype, $nesting = [self].concat($parent_nesting);

      return Opal.alias(self, "rectangular", "rect")
    })(Opal.get_singleton_class(self), $nesting);
    Opal.defs(self, '$polar', TMP_Complex_polar_2 = function $$polar(r, theta) {
      var $a, $b, $c, self = this;

      
      
      if (theta == null) {
        theta = 0;
      };
      if ($truthy(($truthy($a = ($truthy($b = ($truthy($c = $$($nesting, 'Numeric')['$==='](r)) ? r['$real?']() : $c)) ? $$($nesting, 'Numeric')['$==='](theta) : $b)) ? theta['$real?']() : $a))) {
      } else {
        self.$raise($$($nesting, 'TypeError'), "not a real")
      };
      return self.$new($rb_times(r, $$($nesting, 'Math').$cos(theta)), $rb_times(r, $$($nesting, 'Math').$sin(theta)));
    }, TMP_Complex_polar_2.$$arity = -2);
    self.$attr_reader("real", "imag");
    
    Opal.def(self, '$initialize', TMP_Complex_initialize_3 = function $$initialize(real, imag) {
      var self = this;

      
      
      if (imag == null) {
        imag = 0;
      };
      self.real = real;
      return (self.imag = imag);
    }, TMP_Complex_initialize_3.$$arity = -2);
    
    Opal.def(self, '$coerce', TMP_Complex_coerce_4 = function $$coerce(other) {
      var $a, self = this;

      if ($truthy($$($nesting, 'Complex')['$==='](other))) {
        return [other, self]
      } else if ($truthy(($truthy($a = $$($nesting, 'Numeric')['$==='](other)) ? other['$real?']() : $a))) {
        return [$$($nesting, 'Complex').$new(other, 0), self]
      } else {
        return self.$raise($$($nesting, 'TypeError'), "" + (other.$class()) + " can't be coerced into Complex")
      }
    }, TMP_Complex_coerce_4.$$arity = 1);
    
    Opal.def(self, '$==', TMP_Complex_$eq$eq_5 = function(other) {
      var $a, self = this;

      if ($truthy($$($nesting, 'Complex')['$==='](other))) {
        return (($a = self.real['$=='](other.$real())) ? self.imag['$=='](other.$imag()) : self.real['$=='](other.$real()))
      } else if ($truthy(($truthy($a = $$($nesting, 'Numeric')['$==='](other)) ? other['$real?']() : $a))) {
        return (($a = self.real['$=='](other)) ? self.imag['$=='](0) : self.real['$=='](other))
      } else {
        return other['$=='](self)
      }
    }, TMP_Complex_$eq$eq_5.$$arity = 1);
    
    Opal.def(self, '$-@', TMP_Complex_$$_6 = function() {
      var self = this;

      return self.$Complex(self.real['$-@'](), self.imag['$-@']())
    }, TMP_Complex_$$_6.$$arity = 0);
    
    Opal.def(self, '$+', TMP_Complex_$_7 = function(other) {
      var $a, self = this;

      if ($truthy($$($nesting, 'Complex')['$==='](other))) {
        return self.$Complex($rb_plus(self.real, other.$real()), $rb_plus(self.imag, other.$imag()))
      } else if ($truthy(($truthy($a = $$($nesting, 'Numeric')['$==='](other)) ? other['$real?']() : $a))) {
        return self.$Complex($rb_plus(self.real, other), self.imag)
      } else {
        return self.$__coerced__("+", other)
      }
    }, TMP_Complex_$_7.$$arity = 1);
    
    Opal.def(self, '$-', TMP_Complex_$_8 = function(other) {
      var $a, self = this;

      if ($truthy($$($nesting, 'Complex')['$==='](other))) {
        return self.$Complex($rb_minus(self.real, other.$real()), $rb_minus(self.imag, other.$imag()))
      } else if ($truthy(($truthy($a = $$($nesting, 'Numeric')['$==='](other)) ? other['$real?']() : $a))) {
        return self.$Complex($rb_minus(self.real, other), self.imag)
      } else {
        return self.$__coerced__("-", other)
      }
    }, TMP_Complex_$_8.$$arity = 1);
    
    Opal.def(self, '$*', TMP_Complex_$_9 = function(other) {
      var $a, self = this;

      if ($truthy($$($nesting, 'Complex')['$==='](other))) {
        return self.$Complex($rb_minus($rb_times(self.real, other.$real()), $rb_times(self.imag, other.$imag())), $rb_plus($rb_times(self.real, other.$imag()), $rb_times(self.imag, other.$real())))
      } else if ($truthy(($truthy($a = $$($nesting, 'Numeric')['$==='](other)) ? other['$real?']() : $a))) {
        return self.$Complex($rb_times(self.real, other), $rb_times(self.imag, other))
      } else {
        return self.$__coerced__("*", other)
      }
    }, TMP_Complex_$_9.$$arity = 1);
    
    Opal.def(self, '$/', TMP_Complex_$_10 = function(other) {
      var $a, $b, $c, $d, self = this;

      if ($truthy($$($nesting, 'Complex')['$==='](other))) {
        if ($truthy(($truthy($a = ($truthy($b = ($truthy($c = ($truthy($d = $$($nesting, 'Number')['$==='](self.real)) ? self.real['$nan?']() : $d)) ? $c : ($truthy($d = $$($nesting, 'Number')['$==='](self.imag)) ? self.imag['$nan?']() : $d))) ? $b : ($truthy($c = $$($nesting, 'Number')['$==='](other.$real())) ? other.$real()['$nan?']() : $c))) ? $a : ($truthy($b = $$($nesting, 'Number')['$==='](other.$imag())) ? other.$imag()['$nan?']() : $b)))) {
          return $$($nesting, 'Complex').$new($$$($$($nesting, 'Float'), 'NAN'), $$$($$($nesting, 'Float'), 'NAN'))
        } else {
          return $rb_divide($rb_times(self, other.$conj()), other.$abs2())
        }
      } else if ($truthy(($truthy($a = $$($nesting, 'Numeric')['$==='](other)) ? other['$real?']() : $a))) {
        return self.$Complex(self.real.$quo(other), self.imag.$quo(other))
      } else {
        return self.$__coerced__("/", other)
      }
    }, TMP_Complex_$_10.$$arity = 1);
    
    Opal.def(self, '$**', TMP_Complex_$$_11 = function(other) {
      var $a, $b, $c, $d, self = this, r = nil, theta = nil, ore = nil, oim = nil, nr = nil, ntheta = nil, x = nil, z = nil, n = nil, div = nil, mod = nil;

      
      if (other['$=='](0)) {
        return $$($nesting, 'Complex').$new(1, 0)};
      if ($truthy($$($nesting, 'Complex')['$==='](other))) {
        
        $b = self.$polar(), $a = Opal.to_ary($b), (r = ($a[0] == null ? nil : $a[0])), (theta = ($a[1] == null ? nil : $a[1])), $b;
        ore = other.$real();
        oim = other.$imag();
        nr = $$($nesting, 'Math').$exp($rb_minus($rb_times(ore, $$($nesting, 'Math').$log(r)), $rb_times(oim, theta)));
        ntheta = $rb_plus($rb_times(theta, ore), $rb_times(oim, $$($nesting, 'Math').$log(r)));
        return $$($nesting, 'Complex').$polar(nr, ntheta);
      } else if ($truthy($$($nesting, 'Integer')['$==='](other))) {
        if ($truthy($rb_gt(other, 0))) {
          
          x = self;
          z = x;
          n = $rb_minus(other, 1);
          while ($truthy(n['$!='](0))) {
            
            $c = n.$divmod(2), $b = Opal.to_ary($c), (div = ($b[0] == null ? nil : $b[0])), (mod = ($b[1] == null ? nil : $b[1])), $c;
            while (mod['$=='](0)) {
              
              x = self.$Complex($rb_minus($rb_times(x.$real(), x.$real()), $rb_times(x.$imag(), x.$imag())), $rb_times($rb_times(2, x.$real()), x.$imag()));
              n = div;
              $d = n.$divmod(2), $c = Opal.to_ary($d), (div = ($c[0] == null ? nil : $c[0])), (mod = ($c[1] == null ? nil : $c[1])), $d;
            };
            z = $rb_times(z, x);
            n = $rb_minus(n, 1);
          };
          return z;
        } else {
          return $rb_divide($$($nesting, 'Rational').$new(1, 1), self)['$**'](other['$-@']())
        }
      } else if ($truthy(($truthy($a = $$($nesting, 'Float')['$==='](other)) ? $a : $$($nesting, 'Rational')['$==='](other)))) {
        
        $b = self.$polar(), $a = Opal.to_ary($b), (r = ($a[0] == null ? nil : $a[0])), (theta = ($a[1] == null ? nil : $a[1])), $b;
        return $$($nesting, 'Complex').$polar(r['$**'](other), $rb_times(theta, other));
      } else {
        return self.$__coerced__("**", other)
      };
    }, TMP_Complex_$$_11.$$arity = 1);
    
    Opal.def(self, '$abs', TMP_Complex_abs_12 = function $$abs() {
      var self = this;

      return $$($nesting, 'Math').$hypot(self.real, self.imag)
    }, TMP_Complex_abs_12.$$arity = 0);
    
    Opal.def(self, '$abs2', TMP_Complex_abs2_13 = function $$abs2() {
      var self = this;

      return $rb_plus($rb_times(self.real, self.real), $rb_times(self.imag, self.imag))
    }, TMP_Complex_abs2_13.$$arity = 0);
    
    Opal.def(self, '$angle', TMP_Complex_angle_14 = function $$angle() {
      var self = this;

      return $$($nesting, 'Math').$atan2(self.imag, self.real)
    }, TMP_Complex_angle_14.$$arity = 0);
    Opal.alias(self, "arg", "angle");
    
    Opal.def(self, '$conj', TMP_Complex_conj_15 = function $$conj() {
      var self = this;

      return self.$Complex(self.real, self.imag['$-@']())
    }, TMP_Complex_conj_15.$$arity = 0);
    Opal.alias(self, "conjugate", "conj");
    
    Opal.def(self, '$denominator', TMP_Complex_denominator_16 = function $$denominator() {
      var self = this;

      return self.real.$denominator().$lcm(self.imag.$denominator())
    }, TMP_Complex_denominator_16.$$arity = 0);
    Opal.alias(self, "divide", "/");
    
    Opal.def(self, '$eql?', TMP_Complex_eql$q_17 = function(other) {
      var $a, $b, self = this;

      return ($truthy($a = ($truthy($b = $$($nesting, 'Complex')['$==='](other)) ? self.real.$class()['$=='](self.imag.$class()) : $b)) ? self['$=='](other) : $a)
    }, TMP_Complex_eql$q_17.$$arity = 1);
    
    Opal.def(self, '$fdiv', TMP_Complex_fdiv_18 = function $$fdiv(other) {
      var self = this;

      
      if ($truthy($$($nesting, 'Numeric')['$==='](other))) {
      } else {
        self.$raise($$($nesting, 'TypeError'), "" + (other.$class()) + " can't be coerced into Complex")
      };
      return $rb_divide(self, other);
    }, TMP_Complex_fdiv_18.$$arity = 1);
    
    Opal.def(self, '$finite?', TMP_Complex_finite$q_19 = function() {
      var $a, self = this;

      return ($truthy($a = self.real['$finite?']()) ? self.imag['$finite?']() : $a)
    }, TMP_Complex_finite$q_19.$$arity = 0);
    
    Opal.def(self, '$hash', TMP_Complex_hash_20 = function $$hash() {
      var self = this;

      return "" + "Complex:" + (self.real) + ":" + (self.imag)
    }, TMP_Complex_hash_20.$$arity = 0);
    Opal.alias(self, "imaginary", "imag");
    
    Opal.def(self, '$infinite?', TMP_Complex_infinite$q_21 = function() {
      var $a, self = this;

      return ($truthy($a = self.real['$infinite?']()) ? $a : self.imag['$infinite?']())
    }, TMP_Complex_infinite$q_21.$$arity = 0);
    
    Opal.def(self, '$inspect', TMP_Complex_inspect_22 = function $$inspect() {
      var self = this;

      return "" + "(" + (self) + ")"
    }, TMP_Complex_inspect_22.$$arity = 0);
    Opal.alias(self, "magnitude", "abs");
    
    Opal.udef(self, '$' + "negative?");;
    
    Opal.def(self, '$numerator', TMP_Complex_numerator_23 = function $$numerator() {
      var self = this, d = nil;

      
      d = self.$denominator();
      return self.$Complex($rb_times(self.real.$numerator(), $rb_divide(d, self.real.$denominator())), $rb_times(self.imag.$numerator(), $rb_divide(d, self.imag.$denominator())));
    }, TMP_Complex_numerator_23.$$arity = 0);
    Opal.alias(self, "phase", "arg");
    
    Opal.def(self, '$polar', TMP_Complex_polar_24 = function $$polar() {
      var self = this;

      return [self.$abs(), self.$arg()]
    }, TMP_Complex_polar_24.$$arity = 0);
    
    Opal.udef(self, '$' + "positive?");;
    Opal.alias(self, "quo", "/");
    
    Opal.def(self, '$rationalize', TMP_Complex_rationalize_25 = function $$rationalize(eps) {
      var self = this;

      
      ;
      
      if (arguments.length > 1) {
        self.$raise($$($nesting, 'ArgumentError'), "" + "wrong number of arguments (" + (arguments.length) + " for 0..1)");
      }
    ;
      if ($truthy(self.imag['$!='](0))) {
        self.$raise($$($nesting, 'RangeError'), "" + "can't' convert " + (self) + " into Rational")};
      return self.$real().$rationalize(eps);
    }, TMP_Complex_rationalize_25.$$arity = -1);
    
    Opal.def(self, '$real?', TMP_Complex_real$q_26 = function() {
      var self = this;

      return false
    }, TMP_Complex_real$q_26.$$arity = 0);
    
    Opal.def(self, '$rect', TMP_Complex_rect_27 = function $$rect() {
      var self = this;

      return [self.real, self.imag]
    }, TMP_Complex_rect_27.$$arity = 0);
    Opal.alias(self, "rectangular", "rect");
    
    Opal.def(self, '$to_f', TMP_Complex_to_f_28 = function $$to_f() {
      var self = this;

      
      if (self.imag['$=='](0)) {
      } else {
        self.$raise($$($nesting, 'RangeError'), "" + "can't convert " + (self) + " into Float")
      };
      return self.real.$to_f();
    }, TMP_Complex_to_f_28.$$arity = 0);
    
    Opal.def(self, '$to_i', TMP_Complex_to_i_29 = function $$to_i() {
      var self = this;

      
      if (self.imag['$=='](0)) {
      } else {
        self.$raise($$($nesting, 'RangeError'), "" + "can't convert " + (self) + " into Integer")
      };
      return self.real.$to_i();
    }, TMP_Complex_to_i_29.$$arity = 0);
    
    Opal.def(self, '$to_r', TMP_Complex_to_r_30 = function $$to_r() {
      var self = this;

      
      if (self.imag['$=='](0)) {
      } else {
        self.$raise($$($nesting, 'RangeError'), "" + "can't convert " + (self) + " into Rational")
      };
      return self.real.$to_r();
    }, TMP_Complex_to_r_30.$$arity = 0);
    
    Opal.def(self, '$to_s', TMP_Complex_to_s_31 = function $$to_s() {
      var $a, $b, $c, self = this, result = nil;

      
      result = self.real.$inspect();
      result = $rb_plus(result, (function() {if ($truthy(($truthy($a = ($truthy($b = ($truthy($c = $$($nesting, 'Number')['$==='](self.imag)) ? self.imag['$nan?']() : $c)) ? $b : self.imag['$positive?']())) ? $a : self.imag['$zero?']()))) {
        return "+"
      } else {
        return "-"
      }; return nil; })());
      result = $rb_plus(result, self.imag.$abs().$inspect());
      if ($truthy(($truthy($a = $$($nesting, 'Number')['$==='](self.imag)) ? ($truthy($b = self.imag['$nan?']()) ? $b : self.imag['$infinite?']()) : $a))) {
        result = $rb_plus(result, "*")};
      return $rb_plus(result, "i");
    }, TMP_Complex_to_s_31.$$arity = 0);
    return Opal.const_set($nesting[0], 'I', self.$new(0, 1));
  })($nesting[0], $$($nesting, 'Numeric'), $nesting);
  (function($base, $parent_nesting) {
    function $Kernel() {};
    var self = $Kernel = $module($base, 'Kernel', $Kernel);

    var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_Kernel_Complex_32;

    
    Opal.def(self, '$Complex', TMP_Kernel_Complex_32 = function $$Complex(real, imag) {
      var self = this;

      
      
      if (imag == null) {
        imag = nil;
      };
      if ($truthy(imag)) {
        return $$($nesting, 'Complex').$new(real, imag)
      } else {
        return $$($nesting, 'Complex').$new(real, 0)
      };
    }, TMP_Kernel_Complex_32.$$arity = -2)
  })($nesting[0], $nesting);
  return (function($base, $super, $parent_nesting) {
    function $String(){};
    var self = $String = $klass($base, $super, 'String', $String);

    var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_String_to_c_33;

    return (Opal.def(self, '$to_c', TMP_String_to_c_33 = function $$to_c() {
      var self = this;

      
      var str = self,
          re = /[+-]?[\d_]+(\.[\d_]+)?(e\d+)?/,
          match = str.match(re),
          real, imag, denominator;

      function isFloat() {
        return re.test(str);
      }

      function cutFloat() {
        var match = str.match(re);
        var number = match[0];
        str = str.slice(number.length);
        return number.replace(/_/g, '');
      }

      // handles both floats and rationals
      function cutNumber() {
        if (isFloat()) {
          var numerator = parseFloat(cutFloat());

          if (str[0] === '/') {
            // rational real part
            str = str.slice(1);

            if (isFloat()) {
              var denominator = parseFloat(cutFloat());
              return self.$Rational(numerator, denominator);
            } else {
              // reverting '/'
              str = '/' + str;
              return numerator;
            }
          } else {
            // float real part, no denominator
            return numerator;
          }
        } else {
          return null;
        }
      }

      real = cutNumber();

      if (!real) {
        if (str[0] === 'i') {
          // i => Complex(0, 1)
          return self.$Complex(0, 1);
        }
        if (str[0] === '-' && str[1] === 'i') {
          // -i => Complex(0, -1)
          return self.$Complex(0, -1);
        }
        if (str[0] === '+' && str[1] === 'i') {
          // +i => Complex(0, 1)
          return self.$Complex(0, 1);
        }
        // anything => Complex(0, 0)
        return self.$Complex(0, 0);
      }

      imag = cutNumber();
      if (!imag) {
        if (str[0] === 'i') {
          // 3i => Complex(0, 3)
          return self.$Complex(0, real);
        } else {
          // 3 => Complex(3, 0)
          return self.$Complex(real, 0);
        }
      } else {
        // 3+2i => Complex(3, 2)
        return self.$Complex(real, imag);
      }
    
    }, TMP_String_to_c_33.$$arity = 0), nil) && 'to_c'
  })($nesting[0], null, $nesting);
};

/* Generated by Opal 0.11.99.dev */
Opal.modules["corelib/rational"] = function(Opal) {
  function $rb_lt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs < rhs : lhs['$<'](rhs);
  }
  function $rb_divide(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs / rhs : lhs['$/'](rhs);
  }
  function $rb_minus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs - rhs : lhs['$-'](rhs);
  }
  function $rb_times(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs * rhs : lhs['$*'](rhs);
  }
  function $rb_plus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs + rhs : lhs['$+'](rhs);
  }
  function $rb_gt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs > rhs : lhs['$>'](rhs);
  }
  function $rb_le(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs <= rhs : lhs['$<='](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice, $klass = Opal.klass, $truthy = Opal.truthy, $module = Opal.module;

  Opal.add_stubs(['$require', '$to_i', '$==', '$raise', '$<', '$-@', '$new', '$gcd', '$/', '$nil?', '$===', '$reduce', '$to_r', '$equal?', '$!', '$coerce_to!', '$to_f', '$numerator', '$denominator', '$<=>', '$-', '$*', '$__coerced__', '$+', '$Rational', '$>', '$**', '$abs', '$ceil', '$with_precision', '$floor', '$<=', '$truncate', '$send', '$convert']);
  
  self.$require("corelib/numeric");
  (function($base, $super, $parent_nesting) {
    function $Rational(){};
    var self = $Rational = $klass($base, $super, 'Rational', $Rational);

    var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_Rational_reduce_1, TMP_Rational_convert_2, TMP_Rational_initialize_3, TMP_Rational_numerator_4, TMP_Rational_denominator_5, TMP_Rational_coerce_6, TMP_Rational_$eq$eq_7, TMP_Rational_$lt$eq$gt_8, TMP_Rational_$_9, TMP_Rational_$_10, TMP_Rational_$_11, TMP_Rational_$_12, TMP_Rational_$$_13, TMP_Rational_abs_14, TMP_Rational_ceil_15, TMP_Rational_floor_16, TMP_Rational_hash_17, TMP_Rational_inspect_18, TMP_Rational_rationalize_19, TMP_Rational_round_20, TMP_Rational_to_f_21, TMP_Rational_to_i_22, TMP_Rational_to_r_23, TMP_Rational_to_s_24, TMP_Rational_truncate_25, TMP_Rational_with_precision_26;

    def.num = def.den = nil;
    
    Opal.defs(self, '$reduce', TMP_Rational_reduce_1 = function $$reduce(num, den) {
      var self = this, gcd = nil;

      
      num = num.$to_i();
      den = den.$to_i();
      if (den['$=='](0)) {
        self.$raise($$($nesting, 'ZeroDivisionError'), "divided by 0")
      } else if ($truthy($rb_lt(den, 0))) {
        
        num = num['$-@']();
        den = den['$-@']();
      } else if (den['$=='](1)) {
        return self.$new(num, den)};
      gcd = num.$gcd(den);
      return self.$new($rb_divide(num, gcd), $rb_divide(den, gcd));
    }, TMP_Rational_reduce_1.$$arity = 2);
    Opal.defs(self, '$convert', TMP_Rational_convert_2 = function $$convert(num, den) {
      var $a, $b, self = this;

      
      if ($truthy(($truthy($a = num['$nil?']()) ? $a : den['$nil?']()))) {
        self.$raise($$($nesting, 'TypeError'), "cannot convert nil into Rational")};
      if ($truthy(($truthy($a = $$($nesting, 'Integer')['$==='](num)) ? $$($nesting, 'Integer')['$==='](den) : $a))) {
        return self.$reduce(num, den)};
      if ($truthy(($truthy($a = ($truthy($b = $$($nesting, 'Float')['$==='](num)) ? $b : $$($nesting, 'String')['$==='](num))) ? $a : $$($nesting, 'Complex')['$==='](num)))) {
        num = num.$to_r()};
      if ($truthy(($truthy($a = ($truthy($b = $$($nesting, 'Float')['$==='](den)) ? $b : $$($nesting, 'String')['$==='](den))) ? $a : $$($nesting, 'Complex')['$==='](den)))) {
        den = den.$to_r()};
      if ($truthy(($truthy($a = den['$equal?'](1)) ? $$($nesting, 'Integer')['$==='](num)['$!']() : $a))) {
        return $$($nesting, 'Opal')['$coerce_to!'](num, $$($nesting, 'Rational'), "to_r")
      } else if ($truthy(($truthy($a = $$($nesting, 'Numeric')['$==='](num)) ? $$($nesting, 'Numeric')['$==='](den) : $a))) {
        return $rb_divide(num, den)
      } else {
        return self.$reduce(num, den)
      };
    }, TMP_Rational_convert_2.$$arity = 2);
    
    Opal.def(self, '$initialize', TMP_Rational_initialize_3 = function $$initialize(num, den) {
      var self = this;

      
      self.num = num;
      return (self.den = den);
    }, TMP_Rational_initialize_3.$$arity = 2);
    
    Opal.def(self, '$numerator', TMP_Rational_numerator_4 = function $$numerator() {
      var self = this;

      return self.num
    }, TMP_Rational_numerator_4.$$arity = 0);
    
    Opal.def(self, '$denominator', TMP_Rational_denominator_5 = function $$denominator() {
      var self = this;

      return self.den
    }, TMP_Rational_denominator_5.$$arity = 0);
    
    Opal.def(self, '$coerce', TMP_Rational_coerce_6 = function $$coerce(other) {
      var self = this, $case = nil;

      return (function() {$case = other;
      if ($$($nesting, 'Rational')['$===']($case)) {return [other, self]}
      else if ($$($nesting, 'Integer')['$===']($case)) {return [other.$to_r(), self]}
      else if ($$($nesting, 'Float')['$===']($case)) {return [other, self.$to_f()]}
      else { return nil }})()
    }, TMP_Rational_coerce_6.$$arity = 1);
    
    Opal.def(self, '$==', TMP_Rational_$eq$eq_7 = function(other) {
      var $a, self = this, $case = nil;

      return (function() {$case = other;
      if ($$($nesting, 'Rational')['$===']($case)) {return (($a = self.num['$=='](other.$numerator())) ? self.den['$=='](other.$denominator()) : self.num['$=='](other.$numerator()))}
      else if ($$($nesting, 'Integer')['$===']($case)) {return (($a = self.num['$=='](other)) ? self.den['$=='](1) : self.num['$=='](other))}
      else if ($$($nesting, 'Float')['$===']($case)) {return self.$to_f()['$=='](other)}
      else {return other['$=='](self)}})()
    }, TMP_Rational_$eq$eq_7.$$arity = 1);
    
    Opal.def(self, '$<=>', TMP_Rational_$lt$eq$gt_8 = function(other) {
      var self = this, $case = nil;

      return (function() {$case = other;
      if ($$($nesting, 'Rational')['$===']($case)) {return $rb_minus($rb_times(self.num, other.$denominator()), $rb_times(self.den, other.$numerator()))['$<=>'](0)}
      else if ($$($nesting, 'Integer')['$===']($case)) {return $rb_minus(self.num, $rb_times(self.den, other))['$<=>'](0)}
      else if ($$($nesting, 'Float')['$===']($case)) {return self.$to_f()['$<=>'](other)}
      else {return self.$__coerced__("<=>", other)}})()
    }, TMP_Rational_$lt$eq$gt_8.$$arity = 1);
    
    Opal.def(self, '$+', TMP_Rational_$_9 = function(other) {
      var self = this, $case = nil, num = nil, den = nil;

      return (function() {$case = other;
      if ($$($nesting, 'Rational')['$===']($case)) {
      num = $rb_plus($rb_times(self.num, other.$denominator()), $rb_times(self.den, other.$numerator()));
      den = $rb_times(self.den, other.$denominator());
      return self.$Rational(num, den);}
      else if ($$($nesting, 'Integer')['$===']($case)) {return self.$Rational($rb_plus(self.num, $rb_times(other, self.den)), self.den)}
      else if ($$($nesting, 'Float')['$===']($case)) {return $rb_plus(self.$to_f(), other)}
      else {return self.$__coerced__("+", other)}})()
    }, TMP_Rational_$_9.$$arity = 1);
    
    Opal.def(self, '$-', TMP_Rational_$_10 = function(other) {
      var self = this, $case = nil, num = nil, den = nil;

      return (function() {$case = other;
      if ($$($nesting, 'Rational')['$===']($case)) {
      num = $rb_minus($rb_times(self.num, other.$denominator()), $rb_times(self.den, other.$numerator()));
      den = $rb_times(self.den, other.$denominator());
      return self.$Rational(num, den);}
      else if ($$($nesting, 'Integer')['$===']($case)) {return self.$Rational($rb_minus(self.num, $rb_times(other, self.den)), self.den)}
      else if ($$($nesting, 'Float')['$===']($case)) {return $rb_minus(self.$to_f(), other)}
      else {return self.$__coerced__("-", other)}})()
    }, TMP_Rational_$_10.$$arity = 1);
    
    Opal.def(self, '$*', TMP_Rational_$_11 = function(other) {
      var self = this, $case = nil, num = nil, den = nil;

      return (function() {$case = other;
      if ($$($nesting, 'Rational')['$===']($case)) {
      num = $rb_times(self.num, other.$numerator());
      den = $rb_times(self.den, other.$denominator());
      return self.$Rational(num, den);}
      else if ($$($nesting, 'Integer')['$===']($case)) {return self.$Rational($rb_times(self.num, other), self.den)}
      else if ($$($nesting, 'Float')['$===']($case)) {return $rb_times(self.$to_f(), other)}
      else {return self.$__coerced__("*", other)}})()
    }, TMP_Rational_$_11.$$arity = 1);
    
    Opal.def(self, '$/', TMP_Rational_$_12 = function(other) {
      var self = this, $case = nil, num = nil, den = nil;

      return (function() {$case = other;
      if ($$($nesting, 'Rational')['$===']($case)) {
      num = $rb_times(self.num, other.$denominator());
      den = $rb_times(self.den, other.$numerator());
      return self.$Rational(num, den);}
      else if ($$($nesting, 'Integer')['$===']($case)) {if (other['$=='](0)) {
        return $rb_divide(self.$to_f(), 0.0)
      } else {
        return self.$Rational(self.num, $rb_times(self.den, other))
      }}
      else if ($$($nesting, 'Float')['$===']($case)) {return $rb_divide(self.$to_f(), other)}
      else {return self.$__coerced__("/", other)}})()
    }, TMP_Rational_$_12.$$arity = 1);
    
    Opal.def(self, '$**', TMP_Rational_$$_13 = function(other) {
      var $a, self = this, $case = nil;

      return (function() {$case = other;
      if ($$($nesting, 'Integer')['$===']($case)) {if ($truthy((($a = self['$=='](0)) ? $rb_lt(other, 0) : self['$=='](0)))) {
        return $$$($$($nesting, 'Float'), 'INFINITY')
      } else if ($truthy($rb_gt(other, 0))) {
        return self.$Rational(self.num['$**'](other), self.den['$**'](other))
      } else if ($truthy($rb_lt(other, 0))) {
        return self.$Rational(self.den['$**'](other['$-@']()), self.num['$**'](other['$-@']()))
      } else {
        return self.$Rational(1, 1)
      }}
      else if ($$($nesting, 'Float')['$===']($case)) {return self.$to_f()['$**'](other)}
      else if ($$($nesting, 'Rational')['$===']($case)) {if (other['$=='](0)) {
        return self.$Rational(1, 1)
      } else if (other.$denominator()['$=='](1)) {
        if ($truthy($rb_lt(other, 0))) {
          return self.$Rational(self.den['$**'](other.$numerator().$abs()), self.num['$**'](other.$numerator().$abs()))
        } else {
          return self.$Rational(self.num['$**'](other.$numerator()), self.den['$**'](other.$numerator()))
        }
      } else if ($truthy((($a = self['$=='](0)) ? $rb_lt(other, 0) : self['$=='](0)))) {
        return self.$raise($$($nesting, 'ZeroDivisionError'), "divided by 0")
      } else {
        return self.$to_f()['$**'](other)
      }}
      else {return self.$__coerced__("**", other)}})()
    }, TMP_Rational_$$_13.$$arity = 1);
    
    Opal.def(self, '$abs', TMP_Rational_abs_14 = function $$abs() {
      var self = this;

      return self.$Rational(self.num.$abs(), self.den.$abs())
    }, TMP_Rational_abs_14.$$arity = 0);
    
    Opal.def(self, '$ceil', TMP_Rational_ceil_15 = function $$ceil(precision) {
      var self = this;

      
      
      if (precision == null) {
        precision = 0;
      };
      if (precision['$=='](0)) {
        return $rb_divide(self.num['$-@'](), self.den)['$-@']().$ceil()
      } else {
        return self.$with_precision("ceil", precision)
      };
    }, TMP_Rational_ceil_15.$$arity = -1);
    Opal.alias(self, "divide", "/");
    
    Opal.def(self, '$floor', TMP_Rational_floor_16 = function $$floor(precision) {
      var self = this;

      
      
      if (precision == null) {
        precision = 0;
      };
      if (precision['$=='](0)) {
        return $rb_divide(self.num['$-@'](), self.den)['$-@']().$floor()
      } else {
        return self.$with_precision("floor", precision)
      };
    }, TMP_Rational_floor_16.$$arity = -1);
    
    Opal.def(self, '$hash', TMP_Rational_hash_17 = function $$hash() {
      var self = this;

      return "" + "Rational:" + (self.num) + ":" + (self.den)
    }, TMP_Rational_hash_17.$$arity = 0);
    
    Opal.def(self, '$inspect', TMP_Rational_inspect_18 = function $$inspect() {
      var self = this;

      return "" + "(" + (self) + ")"
    }, TMP_Rational_inspect_18.$$arity = 0);
    Opal.alias(self, "quo", "/");
    
    Opal.def(self, '$rationalize', TMP_Rational_rationalize_19 = function $$rationalize(eps) {
      var self = this;

      
      ;
      
      if (arguments.length > 1) {
        self.$raise($$($nesting, 'ArgumentError'), "" + "wrong number of arguments (" + (arguments.length) + " for 0..1)");
      }

      if (eps == null) {
        return self;
      }

      var e = eps.$abs(),
          a = $rb_minus(self, e),
          b = $rb_plus(self, e);

      var p0 = 0,
          p1 = 1,
          q0 = 1,
          q1 = 0,
          p2, q2;

      var c, k, t;

      while (true) {
        c = (a).$ceil();

        if ($rb_le(c, b)) {
          break;
        }

        k  = c - 1;
        p2 = k * p1 + p0;
        q2 = k * q1 + q0;
        t  = $rb_divide(1, $rb_minus(b, k));
        b  = $rb_divide(1, $rb_minus(a, k));
        a  = t;

        p0 = p1;
        q0 = q1;
        p1 = p2;
        q1 = q2;
      }

      return self.$Rational(c * p1 + p0, c * q1 + q0);
    ;
    }, TMP_Rational_rationalize_19.$$arity = -1);
    
    Opal.def(self, '$round', TMP_Rational_round_20 = function $$round(precision) {
      var self = this, num = nil, den = nil, approx = nil;

      
      
      if (precision == null) {
        precision = 0;
      };
      if (precision['$=='](0)) {
      } else {
        return self.$with_precision("round", precision)
      };
      if (self.num['$=='](0)) {
        return 0};
      if (self.den['$=='](1)) {
        return self.num};
      num = $rb_plus($rb_times(self.num.$abs(), 2), self.den);
      den = $rb_times(self.den, 2);
      approx = $rb_divide(num, den).$truncate();
      if ($truthy($rb_lt(self.num, 0))) {
        return approx['$-@']()
      } else {
        return approx
      };
    }, TMP_Rational_round_20.$$arity = -1);
    
    Opal.def(self, '$to_f', TMP_Rational_to_f_21 = function $$to_f() {
      var self = this;

      return $rb_divide(self.num, self.den)
    }, TMP_Rational_to_f_21.$$arity = 0);
    
    Opal.def(self, '$to_i', TMP_Rational_to_i_22 = function $$to_i() {
      var self = this;

      return self.$truncate()
    }, TMP_Rational_to_i_22.$$arity = 0);
    
    Opal.def(self, '$to_r', TMP_Rational_to_r_23 = function $$to_r() {
      var self = this;

      return self
    }, TMP_Rational_to_r_23.$$arity = 0);
    
    Opal.def(self, '$to_s', TMP_Rational_to_s_24 = function $$to_s() {
      var self = this;

      return "" + (self.num) + "/" + (self.den)
    }, TMP_Rational_to_s_24.$$arity = 0);
    
    Opal.def(self, '$truncate', TMP_Rational_truncate_25 = function $$truncate(precision) {
      var self = this;

      
      
      if (precision == null) {
        precision = 0;
      };
      if (precision['$=='](0)) {
        if ($truthy($rb_lt(self.num, 0))) {
          return self.$ceil()
        } else {
          return self.$floor()
        }
      } else {
        return self.$with_precision("truncate", precision)
      };
    }, TMP_Rational_truncate_25.$$arity = -1);
    return (Opal.def(self, '$with_precision', TMP_Rational_with_precision_26 = function $$with_precision(method, precision) {
      var self = this, p = nil, s = nil;

      
      if ($truthy($$($nesting, 'Integer')['$==='](precision))) {
      } else {
        self.$raise($$($nesting, 'TypeError'), "not an Integer")
      };
      p = (10)['$**'](precision);
      s = $rb_times(self, p);
      if ($truthy($rb_lt(precision, 1))) {
        return $rb_divide(s.$send(method), p).$to_i()
      } else {
        return self.$Rational(s.$send(method), p)
      };
    }, TMP_Rational_with_precision_26.$$arity = 2), nil) && 'with_precision';
  })($nesting[0], $$($nesting, 'Numeric'), $nesting);
  (function($base, $parent_nesting) {
    function $Kernel() {};
    var self = $Kernel = $module($base, 'Kernel', $Kernel);

    var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_Kernel_Rational_27;

    
    Opal.def(self, '$Rational', TMP_Kernel_Rational_27 = function $$Rational(numerator, denominator) {
      var self = this;

      
      
      if (denominator == null) {
        denominator = 1;
      };
      return $$($nesting, 'Rational').$convert(numerator, denominator);
    }, TMP_Kernel_Rational_27.$$arity = -2)
  })($nesting[0], $nesting);
  return (function($base, $super, $parent_nesting) {
    function $String(){};
    var self = $String = $klass($base, $super, 'String', $String);

    var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_String_to_r_28;

    return (Opal.def(self, '$to_r', TMP_String_to_r_28 = function $$to_r() {
      var self = this;

      
      var str = self.trimLeft(),
          re = /^[+-]?[\d_]+(\.[\d_]+)?/,
          match = str.match(re),
          numerator, denominator;

      function isFloat() {
        return re.test(str);
      }

      function cutFloat() {
        var match = str.match(re);
        var number = match[0];
        str = str.slice(number.length);
        return number.replace(/_/g, '');
      }

      if (isFloat()) {
        numerator = parseFloat(cutFloat());

        if (str[0] === '/') {
          // rational real part
          str = str.slice(1);

          if (isFloat()) {
            denominator = parseFloat(cutFloat());
            return self.$Rational(numerator, denominator);
          } else {
            return self.$Rational(numerator, 1);
          }
        } else {
          return self.$Rational(numerator, 1);
        }
      } else {
        return self.$Rational(0, 1);
      }
    
    }, TMP_String_to_r_28.$$arity = 0), nil) && 'to_r'
  })($nesting[0], null, $nesting);
};

/* Generated by Opal 0.11.99.dev */
Opal.modules["corelib/time"] = function(Opal) {
  function $rb_gt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs > rhs : lhs['$>'](rhs);
  }
  function $rb_lt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs < rhs : lhs['$<'](rhs);
  }
  function $rb_plus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs + rhs : lhs['$+'](rhs);
  }
  function $rb_divide(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs / rhs : lhs['$/'](rhs);
  }
  function $rb_minus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs - rhs : lhs['$-'](rhs);
  }
  function $rb_le(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs <= rhs : lhs['$<='](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice, $klass = Opal.klass, $truthy = Opal.truthy, $range = Opal.range;

  Opal.add_stubs(['$require', '$include', '$===', '$raise', '$coerce_to!', '$respond_to?', '$to_str', '$to_i', '$new', '$<=>', '$to_f', '$nil?', '$>', '$<', '$strftime', '$year', '$month', '$day', '$+', '$round', '$/', '$-', '$copy_instance_variables', '$initialize_dup', '$is_a?', '$zero?', '$wday', '$utc?', '$mon', '$yday', '$hour', '$min', '$sec', '$rjust', '$ljust', '$zone', '$to_s', '$[]', '$cweek_cyear', '$isdst', '$<=', '$!=', '$==', '$ceil']);
  
  self.$require("corelib/comparable");
  return (function($base, $super, $parent_nesting) {
    function $Time(){};
    var self = $Time = $klass($base, $super, 'Time', $Time);

    var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_Time_at_1, TMP_Time_new_2, TMP_Time_local_3, TMP_Time_gm_4, TMP_Time_now_5, TMP_Time_$_6, TMP_Time_$_7, TMP_Time_$lt$eq$gt_8, TMP_Time_$eq$eq_9, TMP_Time_asctime_10, TMP_Time_day_11, TMP_Time_yday_12, TMP_Time_isdst_13, TMP_Time_dup_14, TMP_Time_eql$q_15, TMP_Time_friday$q_16, TMP_Time_hash_17, TMP_Time_hour_18, TMP_Time_inspect_19, TMP_Time_min_20, TMP_Time_mon_21, TMP_Time_monday$q_22, TMP_Time_saturday$q_23, TMP_Time_sec_24, TMP_Time_succ_25, TMP_Time_usec_26, TMP_Time_zone_27, TMP_Time_getgm_28, TMP_Time_gmtime_29, TMP_Time_gmt$q_30, TMP_Time_gmt_offset_31, TMP_Time_strftime_32, TMP_Time_sunday$q_33, TMP_Time_thursday$q_34, TMP_Time_to_a_35, TMP_Time_to_f_36, TMP_Time_to_i_37, TMP_Time_tuesday$q_38, TMP_Time_wday_39, TMP_Time_wednesday$q_40, TMP_Time_year_41, TMP_Time_cweek_cyear_42;

    
    self.$include($$($nesting, 'Comparable'));
    
    var days_of_week = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        short_days   = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        short_months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        long_months  = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  ;
    Opal.defs(self, '$at', TMP_Time_at_1 = function $$at(seconds, frac) {
      var self = this;

      
      ;
      
      var result;

      if ($$($nesting, 'Time')['$==='](seconds)) {
        if (frac !== undefined) {
          self.$raise($$($nesting, 'TypeError'), "can't convert Time into an exact number")
        }
        result = new Date(seconds.getTime());
        result.is_utc = seconds.is_utc;
        return result;
      }

      if (!seconds.$$is_number) {
        seconds = $$($nesting, 'Opal')['$coerce_to!'](seconds, $$($nesting, 'Integer'), "to_int");
      }

      if (frac === undefined) {
        return new Date(seconds * 1000);
      }

      if (!frac.$$is_number) {
        frac = $$($nesting, 'Opal')['$coerce_to!'](frac, $$($nesting, 'Integer'), "to_int");
      }

      return new Date(seconds * 1000 + (frac / 1000));
    ;
    }, TMP_Time_at_1.$$arity = -2);
    
    function time_params(year, month, day, hour, min, sec) {
      if (year.$$is_string) {
        year = parseInt(year, 10);
      } else {
        year = $$($nesting, 'Opal')['$coerce_to!'](year, $$($nesting, 'Integer'), "to_int");
      }

      if (month === nil) {
        month = 1;
      } else if (!month.$$is_number) {
        if ((month)['$respond_to?']("to_str")) {
          month = (month).$to_str();
          switch (month.toLowerCase()) {
          case 'jan': month =  1; break;
          case 'feb': month =  2; break;
          case 'mar': month =  3; break;
          case 'apr': month =  4; break;
          case 'may': month =  5; break;
          case 'jun': month =  6; break;
          case 'jul': month =  7; break;
          case 'aug': month =  8; break;
          case 'sep': month =  9; break;
          case 'oct': month = 10; break;
          case 'nov': month = 11; break;
          case 'dec': month = 12; break;
          default: month = (month).$to_i();
          }
        } else {
          month = $$($nesting, 'Opal')['$coerce_to!'](month, $$($nesting, 'Integer'), "to_int");
        }
      }

      if (month < 1 || month > 12) {
        self.$raise($$($nesting, 'ArgumentError'), "" + "month out of range: " + (month))
      }
      month = month - 1;

      if (day === nil) {
        day = 1;
      } else if (day.$$is_string) {
        day = parseInt(day, 10);
      } else {
        day = $$($nesting, 'Opal')['$coerce_to!'](day, $$($nesting, 'Integer'), "to_int");
      }

      if (day < 1 || day > 31) {
        self.$raise($$($nesting, 'ArgumentError'), "" + "day out of range: " + (day))
      }

      if (hour === nil) {
        hour = 0;
      } else if (hour.$$is_string) {
        hour = parseInt(hour, 10);
      } else {
        hour = $$($nesting, 'Opal')['$coerce_to!'](hour, $$($nesting, 'Integer'), "to_int");
      }

      if (hour < 0 || hour > 24) {
        self.$raise($$($nesting, 'ArgumentError'), "" + "hour out of range: " + (hour))
      }

      if (min === nil) {
        min = 0;
      } else if (min.$$is_string) {
        min = parseInt(min, 10);
      } else {
        min = $$($nesting, 'Opal')['$coerce_to!'](min, $$($nesting, 'Integer'), "to_int");
      }

      if (min < 0 || min > 59) {
        self.$raise($$($nesting, 'ArgumentError'), "" + "min out of range: " + (min))
      }

      if (sec === nil) {
        sec = 0;
      } else if (!sec.$$is_number) {
        if (sec.$$is_string) {
          sec = parseInt(sec, 10);
        } else {
          sec = $$($nesting, 'Opal')['$coerce_to!'](sec, $$($nesting, 'Integer'), "to_int");
        }
      }

      if (sec < 0 || sec > 60) {
        self.$raise($$($nesting, 'ArgumentError'), "" + "sec out of range: " + (sec))
      }

      return [year, month, day, hour, min, sec];
    }
  ;
    Opal.defs(self, '$new', TMP_Time_new_2 = function(year, month, day, hour, min, sec, utc_offset) {
      var self = this;

      
      ;
      
      if (month == null) {
        month = nil;
      };
      
      if (day == null) {
        day = nil;
      };
      
      if (hour == null) {
        hour = nil;
      };
      
      if (min == null) {
        min = nil;
      };
      
      if (sec == null) {
        sec = nil;
      };
      
      if (utc_offset == null) {
        utc_offset = nil;
      };
      
      var args, result;

      if (year === undefined) {
        return new Date();
      }

      if (utc_offset !== nil) {
        self.$raise($$($nesting, 'ArgumentError'), "Opal does not support explicitly specifying UTC offset for Time")
      }

      args  = time_params(year, month, day, hour, min, sec);
      year  = args[0];
      month = args[1];
      day   = args[2];
      hour  = args[3];
      min   = args[4];
      sec   = args[5];

      result = new Date(year, month, day, hour, min, 0, sec * 1000);
      if (year < 100) {
        result.setFullYear(year);
      }
      return result;
    ;
    }, TMP_Time_new_2.$$arity = -1);
    Opal.defs(self, '$local', TMP_Time_local_3 = function $$local(year, month, day, hour, min, sec, millisecond, _dummy1, _dummy2, _dummy3) {
      var self = this;

      
      
      if (month == null) {
        month = nil;
      };
      
      if (day == null) {
        day = nil;
      };
      
      if (hour == null) {
        hour = nil;
      };
      
      if (min == null) {
        min = nil;
      };
      
      if (sec == null) {
        sec = nil;
      };
      
      if (millisecond == null) {
        millisecond = nil;
      };
      
      if (_dummy1 == null) {
        _dummy1 = nil;
      };
      
      if (_dummy2 == null) {
        _dummy2 = nil;
      };
      
      if (_dummy3 == null) {
        _dummy3 = nil;
      };
      
      var args, result;

      if (arguments.length === 10) {
        args  = $slice.call(arguments);
        year  = args[5];
        month = args[4];
        day   = args[3];
        hour  = args[2];
        min   = args[1];
        sec   = args[0];
      }

      args  = time_params(year, month, day, hour, min, sec);
      year  = args[0];
      month = args[1];
      day   = args[2];
      hour  = args[3];
      min   = args[4];
      sec   = args[5];

      result = new Date(year, month, day, hour, min, 0, sec * 1000);
      if (year < 100) {
        result.setFullYear(year);
      }
      return result;
    ;
    }, TMP_Time_local_3.$$arity = -2);
    Opal.defs(self, '$gm', TMP_Time_gm_4 = function $$gm(year, month, day, hour, min, sec, millisecond, _dummy1, _dummy2, _dummy3) {
      var self = this;

      
      
      if (month == null) {
        month = nil;
      };
      
      if (day == null) {
        day = nil;
      };
      
      if (hour == null) {
        hour = nil;
      };
      
      if (min == null) {
        min = nil;
      };
      
      if (sec == null) {
        sec = nil;
      };
      
      if (millisecond == null) {
        millisecond = nil;
      };
      
      if (_dummy1 == null) {
        _dummy1 = nil;
      };
      
      if (_dummy2 == null) {
        _dummy2 = nil;
      };
      
      if (_dummy3 == null) {
        _dummy3 = nil;
      };
      
      var args, result;

      if (arguments.length === 10) {
        args  = $slice.call(arguments);
        year  = args[5];
        month = args[4];
        day   = args[3];
        hour  = args[2];
        min   = args[1];
        sec   = args[0];
      }

      args  = time_params(year, month, day, hour, min, sec);
      year  = args[0];
      month = args[1];
      day   = args[2];
      hour  = args[3];
      min   = args[4];
      sec   = args[5];

      result = new Date(Date.UTC(year, month, day, hour, min, 0, sec * 1000));
      if (year < 100) {
        result.setUTCFullYear(year);
      }
      result.is_utc = true;
      return result;
    ;
    }, TMP_Time_gm_4.$$arity = -2);
    (function(self, $parent_nesting) {
      var def = self.prototype, $nesting = [self].concat($parent_nesting);

      
      Opal.alias(self, "mktime", "local");
      return Opal.alias(self, "utc", "gm");
    })(Opal.get_singleton_class(self), $nesting);
    Opal.defs(self, '$now', TMP_Time_now_5 = function $$now() {
      var self = this;

      return self.$new()
    }, TMP_Time_now_5.$$arity = 0);
    
    Opal.def(self, '$+', TMP_Time_$_6 = function(other) {
      var self = this;

      
      if ($truthy($$($nesting, 'Time')['$==='](other))) {
        self.$raise($$($nesting, 'TypeError'), "time + time?")};
      
      if (!other.$$is_number) {
        other = $$($nesting, 'Opal')['$coerce_to!'](other, $$($nesting, 'Integer'), "to_int");
      }
      var result = new Date(self.getTime() + (other * 1000));
      result.is_utc = self.is_utc;
      return result;
    ;
    }, TMP_Time_$_6.$$arity = 1);
    
    Opal.def(self, '$-', TMP_Time_$_7 = function(other) {
      var self = this;

      
      if ($truthy($$($nesting, 'Time')['$==='](other))) {
        return (self.getTime() - other.getTime()) / 1000};
      
      if (!other.$$is_number) {
        other = $$($nesting, 'Opal')['$coerce_to!'](other, $$($nesting, 'Integer'), "to_int");
      }
      var result = new Date(self.getTime() - (other * 1000));
      result.is_utc = self.is_utc;
      return result;
    ;
    }, TMP_Time_$_7.$$arity = 1);
    
    Opal.def(self, '$<=>', TMP_Time_$lt$eq$gt_8 = function(other) {
      var self = this, r = nil;

      if ($truthy($$($nesting, 'Time')['$==='](other))) {
        return self.$to_f()['$<=>'](other.$to_f())
      } else {
        
        r = other['$<=>'](self);
        if ($truthy(r['$nil?']())) {
          return nil
        } else if ($truthy($rb_gt(r, 0))) {
          return -1
        } else if ($truthy($rb_lt(r, 0))) {
          return 1
        } else {
          return 0
        };
      }
    }, TMP_Time_$lt$eq$gt_8.$$arity = 1);
    
    Opal.def(self, '$==', TMP_Time_$eq$eq_9 = function(other) {
      var $a, self = this;

      return ($truthy($a = $$($nesting, 'Time')['$==='](other)) ? self.$to_f() === other.$to_f() : $a)
    }, TMP_Time_$eq$eq_9.$$arity = 1);
    
    Opal.def(self, '$asctime', TMP_Time_asctime_10 = function $$asctime() {
      var self = this;

      return self.$strftime("%a %b %e %H:%M:%S %Y")
    }, TMP_Time_asctime_10.$$arity = 0);
    Opal.alias(self, "ctime", "asctime");
    
    Opal.def(self, '$day', TMP_Time_day_11 = function $$day() {
      var self = this;

      return self.is_utc ? self.getUTCDate() : self.getDate();
    }, TMP_Time_day_11.$$arity = 0);
    
    Opal.def(self, '$yday', TMP_Time_yday_12 = function $$yday() {
      var self = this, start_of_year = nil, start_of_day = nil, one_day = nil;

      
      start_of_year = $$($nesting, 'Time').$new(self.$year()).$to_i();
      start_of_day = $$($nesting, 'Time').$new(self.$year(), self.$month(), self.$day()).$to_i();
      one_day = 86400;
      return $rb_plus($rb_divide($rb_minus(start_of_day, start_of_year), one_day).$round(), 1);
    }, TMP_Time_yday_12.$$arity = 0);
    
    Opal.def(self, '$isdst', TMP_Time_isdst_13 = function $$isdst() {
      var self = this;

      
      var jan = new Date(self.getFullYear(), 0, 1),
          jul = new Date(self.getFullYear(), 6, 1);
      return self.getTimezoneOffset() < Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
    
    }, TMP_Time_isdst_13.$$arity = 0);
    Opal.alias(self, "dst?", "isdst");
    
    Opal.def(self, '$dup', TMP_Time_dup_14 = function $$dup() {
      var self = this, copy = nil;

      
      copy = new Date(self.getTime());
      copy.$copy_instance_variables(self);
      copy.$initialize_dup(self);
      return copy;
    }, TMP_Time_dup_14.$$arity = 0);
    
    Opal.def(self, '$eql?', TMP_Time_eql$q_15 = function(other) {
      var $a, self = this;

      return ($truthy($a = other['$is_a?']($$($nesting, 'Time'))) ? self['$<=>'](other)['$zero?']() : $a)
    }, TMP_Time_eql$q_15.$$arity = 1);
    
    Opal.def(self, '$friday?', TMP_Time_friday$q_16 = function() {
      var self = this;

      return self.$wday() == 5
    }, TMP_Time_friday$q_16.$$arity = 0);
    
    Opal.def(self, '$hash', TMP_Time_hash_17 = function $$hash() {
      var self = this;

      return 'Time:' + self.getTime();
    }, TMP_Time_hash_17.$$arity = 0);
    
    Opal.def(self, '$hour', TMP_Time_hour_18 = function $$hour() {
      var self = this;

      return self.is_utc ? self.getUTCHours() : self.getHours();
    }, TMP_Time_hour_18.$$arity = 0);
    
    Opal.def(self, '$inspect', TMP_Time_inspect_19 = function $$inspect() {
      var self = this;

      if ($truthy(self['$utc?']())) {
        return self.$strftime("%Y-%m-%d %H:%M:%S UTC")
      } else {
        return self.$strftime("%Y-%m-%d %H:%M:%S %z")
      }
    }, TMP_Time_inspect_19.$$arity = 0);
    Opal.alias(self, "mday", "day");
    
    Opal.def(self, '$min', TMP_Time_min_20 = function $$min() {
      var self = this;

      return self.is_utc ? self.getUTCMinutes() : self.getMinutes();
    }, TMP_Time_min_20.$$arity = 0);
    
    Opal.def(self, '$mon', TMP_Time_mon_21 = function $$mon() {
      var self = this;

      return (self.is_utc ? self.getUTCMonth() : self.getMonth()) + 1;
    }, TMP_Time_mon_21.$$arity = 0);
    
    Opal.def(self, '$monday?', TMP_Time_monday$q_22 = function() {
      var self = this;

      return self.$wday() == 1
    }, TMP_Time_monday$q_22.$$arity = 0);
    Opal.alias(self, "month", "mon");
    
    Opal.def(self, '$saturday?', TMP_Time_saturday$q_23 = function() {
      var self = this;

      return self.$wday() == 6
    }, TMP_Time_saturday$q_23.$$arity = 0);
    
    Opal.def(self, '$sec', TMP_Time_sec_24 = function $$sec() {
      var self = this;

      return self.is_utc ? self.getUTCSeconds() : self.getSeconds();
    }, TMP_Time_sec_24.$$arity = 0);
    
    Opal.def(self, '$succ', TMP_Time_succ_25 = function $$succ() {
      var self = this;

      
      var result = new Date(self.getTime() + 1000);
      result.is_utc = self.is_utc;
      return result;
    
    }, TMP_Time_succ_25.$$arity = 0);
    
    Opal.def(self, '$usec', TMP_Time_usec_26 = function $$usec() {
      var self = this;

      return self.getMilliseconds() * 1000;
    }, TMP_Time_usec_26.$$arity = 0);
    
    Opal.def(self, '$zone', TMP_Time_zone_27 = function $$zone() {
      var self = this;

      
      var string = self.toString(),
          result;

      if (string.indexOf('(') == -1) {
        result = string.match(/[A-Z]{3,4}/)[0];
      }
      else {
        result = string.match(/\((.+)\)(?:\s|$)/)[1]
      }

      if (result == "GMT" && /(GMT\W*\d{4})/.test(string)) {
        return RegExp.$1;
      }
      else {
        return result;
      }
    
    }, TMP_Time_zone_27.$$arity = 0);
    
    Opal.def(self, '$getgm', TMP_Time_getgm_28 = function $$getgm() {
      var self = this;

      
      var result = new Date(self.getTime());
      result.is_utc = true;
      return result;
    
    }, TMP_Time_getgm_28.$$arity = 0);
    Opal.alias(self, "getutc", "getgm");
    
    Opal.def(self, '$gmtime', TMP_Time_gmtime_29 = function $$gmtime() {
      var self = this;

      
      self.is_utc = true;
      return self;
    
    }, TMP_Time_gmtime_29.$$arity = 0);
    Opal.alias(self, "utc", "gmtime");
    
    Opal.def(self, '$gmt?', TMP_Time_gmt$q_30 = function() {
      var self = this;

      return self.is_utc === true;
    }, TMP_Time_gmt$q_30.$$arity = 0);
    
    Opal.def(self, '$gmt_offset', TMP_Time_gmt_offset_31 = function $$gmt_offset() {
      var self = this;

      return -self.getTimezoneOffset() * 60;
    }, TMP_Time_gmt_offset_31.$$arity = 0);
    
    Opal.def(self, '$strftime', TMP_Time_strftime_32 = function $$strftime(format) {
      var self = this;

      
      return format.replace(/%([\-_#^0]*:{0,2})(\d+)?([EO]*)(.)/g, function(full, flags, width, _, conv) {
        var result = "",
            zero   = flags.indexOf('0') !== -1,
            pad    = flags.indexOf('-') === -1,
            blank  = flags.indexOf('_') !== -1,
            upcase = flags.indexOf('^') !== -1,
            invert = flags.indexOf('#') !== -1,
            colons = (flags.match(':') || []).length;

        width = parseInt(width, 10);

        if (zero && blank) {
          if (flags.indexOf('0') < flags.indexOf('_')) {
            zero = false;
          }
          else {
            blank = false;
          }
        }

        switch (conv) {
          case 'Y':
            result += self.$year();
            break;

          case 'C':
            zero    = !blank;
            result += Math.round(self.$year() / 100);
            break;

          case 'y':
            zero    = !blank;
            result += (self.$year() % 100);
            break;

          case 'm':
            zero    = !blank;
            result += self.$mon();
            break;

          case 'B':
            result += long_months[self.$mon() - 1];
            break;

          case 'b':
          case 'h':
            blank   = !zero;
            result += short_months[self.$mon() - 1];
            break;

          case 'd':
            zero    = !blank
            result += self.$day();
            break;

          case 'e':
            blank   = !zero
            result += self.$day();
            break;

          case 'j':
            result += self.$yday();
            break;

          case 'H':
            zero    = !blank;
            result += self.$hour();
            break;

          case 'k':
            blank   = !zero;
            result += self.$hour();
            break;

          case 'I':
            zero    = !blank;
            result += (self.$hour() % 12 || 12);
            break;

          case 'l':
            blank   = !zero;
            result += (self.$hour() % 12 || 12);
            break;

          case 'P':
            result += (self.$hour() >= 12 ? "pm" : "am");
            break;

          case 'p':
            result += (self.$hour() >= 12 ? "PM" : "AM");
            break;

          case 'M':
            zero    = !blank;
            result += self.$min();
            break;

          case 'S':
            zero    = !blank;
            result += self.$sec()
            break;

          case 'L':
            zero    = !blank;
            width   = isNaN(width) ? 3 : width;
            result += self.getMilliseconds();
            break;

          case 'N':
            width   = isNaN(width) ? 9 : width;
            result += (self.getMilliseconds().toString()).$rjust(3, "0");
            result  = (result).$ljust(width, "0");
            break;

          case 'z':
            var offset  = self.getTimezoneOffset(),
                hours   = Math.floor(Math.abs(offset) / 60),
                minutes = Math.abs(offset) % 60;

            result += offset < 0 ? "+" : "-";
            result += hours < 10 ? "0" : "";
            result += hours;

            if (colons > 0) {
              result += ":";
            }

            result += minutes < 10 ? "0" : "";
            result += minutes;

            if (colons > 1) {
              result += ":00";
            }

            break;

          case 'Z':
            result += self.$zone();
            break;

          case 'A':
            result += days_of_week[self.$wday()];
            break;

          case 'a':
            result += short_days[self.$wday()];
            break;

          case 'u':
            result += (self.$wday() + 1);
            break;

          case 'w':
            result += self.$wday();
            break;

          case 'V':
            result += self.$cweek_cyear()['$[]'](0).$to_s().$rjust(2, "0");
            break;

          case 'G':
            result += self.$cweek_cyear()['$[]'](1);
            break;

          case 'g':
            result += self.$cweek_cyear()['$[]'](1)['$[]']($range(-2, -1, false));
            break;

          case 's':
            result += self.$to_i();
            break;

          case 'n':
            result += "\n";
            break;

          case 't':
            result += "\t";
            break;

          case '%':
            result += "%";
            break;

          case 'c':
            result += self.$strftime("%a %b %e %T %Y");
            break;

          case 'D':
          case 'x':
            result += self.$strftime("%m/%d/%y");
            break;

          case 'F':
            result += self.$strftime("%Y-%m-%d");
            break;

          case 'v':
            result += self.$strftime("%e-%^b-%4Y");
            break;

          case 'r':
            result += self.$strftime("%I:%M:%S %p");
            break;

          case 'R':
            result += self.$strftime("%H:%M");
            break;

          case 'T':
          case 'X':
            result += self.$strftime("%H:%M:%S");
            break;

          default:
            return full;
        }

        if (upcase) {
          result = result.toUpperCase();
        }

        if (invert) {
          result = result.replace(/[A-Z]/, function(c) { c.toLowerCase() }).
                          replace(/[a-z]/, function(c) { c.toUpperCase() });
        }

        if (pad && (zero || blank)) {
          result = (result).$rjust(isNaN(width) ? 2 : width, blank ? " " : "0");
        }

        return result;
      });
    
    }, TMP_Time_strftime_32.$$arity = 1);
    
    Opal.def(self, '$sunday?', TMP_Time_sunday$q_33 = function() {
      var self = this;

      return self.$wday() == 0
    }, TMP_Time_sunday$q_33.$$arity = 0);
    
    Opal.def(self, '$thursday?', TMP_Time_thursday$q_34 = function() {
      var self = this;

      return self.$wday() == 4
    }, TMP_Time_thursday$q_34.$$arity = 0);
    
    Opal.def(self, '$to_a', TMP_Time_to_a_35 = function $$to_a() {
      var self = this;

      return [self.$sec(), self.$min(), self.$hour(), self.$day(), self.$month(), self.$year(), self.$wday(), self.$yday(), self.$isdst(), self.$zone()]
    }, TMP_Time_to_a_35.$$arity = 0);
    
    Opal.def(self, '$to_f', TMP_Time_to_f_36 = function $$to_f() {
      var self = this;

      return self.getTime() / 1000;
    }, TMP_Time_to_f_36.$$arity = 0);
    
    Opal.def(self, '$to_i', TMP_Time_to_i_37 = function $$to_i() {
      var self = this;

      return parseInt(self.getTime() / 1000, 10);
    }, TMP_Time_to_i_37.$$arity = 0);
    Opal.alias(self, "to_s", "inspect");
    
    Opal.def(self, '$tuesday?', TMP_Time_tuesday$q_38 = function() {
      var self = this;

      return self.$wday() == 2
    }, TMP_Time_tuesday$q_38.$$arity = 0);
    Opal.alias(self, "tv_sec", "to_i");
    Opal.alias(self, "tv_usec", "usec");
    Opal.alias(self, "utc?", "gmt?");
    Opal.alias(self, "gmtoff", "gmt_offset");
    Opal.alias(self, "utc_offset", "gmt_offset");
    
    Opal.def(self, '$wday', TMP_Time_wday_39 = function $$wday() {
      var self = this;

      return self.is_utc ? self.getUTCDay() : self.getDay();
    }, TMP_Time_wday_39.$$arity = 0);
    
    Opal.def(self, '$wednesday?', TMP_Time_wednesday$q_40 = function() {
      var self = this;

      return self.$wday() == 3
    }, TMP_Time_wednesday$q_40.$$arity = 0);
    
    Opal.def(self, '$year', TMP_Time_year_41 = function $$year() {
      var self = this;

      return self.is_utc ? self.getUTCFullYear() : self.getFullYear();
    }, TMP_Time_year_41.$$arity = 0);
    return (Opal.def(self, '$cweek_cyear', TMP_Time_cweek_cyear_42 = function $$cweek_cyear() {
      var $a, self = this, jan01 = nil, jan01_wday = nil, first_monday = nil, year = nil, offset = nil, week = nil, dec31 = nil, dec31_wday = nil;

      
      jan01 = $$($nesting, 'Time').$new(self.$year(), 1, 1);
      jan01_wday = jan01.$wday();
      first_monday = 0;
      year = self.$year();
      if ($truthy(($truthy($a = $rb_le(jan01_wday, 4)) ? jan01_wday['$!='](0) : $a))) {
        offset = $rb_minus(jan01_wday, 1)
      } else {
        
        offset = $rb_minus($rb_minus(jan01_wday, 7), 1);
        if (offset['$=='](-8)) {
          offset = -1};
      };
      week = $rb_divide($rb_plus(self.$yday(), offset), 7.0).$ceil();
      if ($truthy($rb_le(week, 0))) {
        return $$($nesting, 'Time').$new($rb_minus(self.$year(), 1), 12, 31).$cweek_cyear()
      } else if (week['$=='](53)) {
        
        dec31 = $$($nesting, 'Time').$new(self.$year(), 12, 31);
        dec31_wday = dec31.$wday();
        if ($truthy(($truthy($a = $rb_le(dec31_wday, 3)) ? dec31_wday['$!='](0) : $a))) {
          
          week = 1;
          year = $rb_plus(year, 1);};};
      return [week, year];
    }, TMP_Time_cweek_cyear_42.$$arity = 0), nil) && 'cweek_cyear';
  })($nesting[0], Date, $nesting);
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
    function $Struct(){};
    var self = $Struct = $klass($base, $super, 'Struct', $Struct);

    var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_Struct_new_1, TMP_Struct_define_struct_attribute_6, TMP_Struct_members_9, TMP_Struct_inherited_10, TMP_Struct_initialize_12, TMP_Struct_members_15, TMP_Struct_hash_16, TMP_Struct_$$_17, TMP_Struct_$$$eq_18, TMP_Struct_$eq$eq_19, TMP_Struct_eql$q_20, TMP_Struct_each_21, TMP_Struct_each_pair_24, TMP_Struct_length_27, TMP_Struct_to_a_28, TMP_Struct_inspect_30, TMP_Struct_to_h_32, TMP_Struct_values_at_34, TMP_Struct_dig_36;

    
    self.$include($$($nesting, 'Enumerable'));
    Opal.defs(self, '$new', TMP_Struct_new_1 = function(const_name, $a, $b) {
      var $iter = TMP_Struct_new_1.$$p, block = $iter || nil, $post_args, $kwargs, args, keyword_init, TMP_2, TMP_3, self = this, klass = nil;

      if ($iter) TMP_Struct_new_1.$$p = null;
      
      
      if ($iter) TMP_Struct_new_1.$$p = null;;
      
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
      $send(args, 'map', [], (TMP_2 = function(arg){var self = TMP_2.$$s || this;

      
        
        if (arg == null) {
          arg = nil;
        };
        return $$($nesting, 'Opal')['$coerce_to!'](arg, $$($nesting, 'String'), "to_str");}, TMP_2.$$s = self, TMP_2.$$arity = 1, TMP_2));
      klass = $send($$($nesting, 'Class'), 'new', [self], (TMP_3 = function(){var self = TMP_3.$$s || this, TMP_4;

      
        $send(args, 'each', [], (TMP_4 = function(arg){var self = TMP_4.$$s || this;

        
          
          if (arg == null) {
            arg = nil;
          };
          return self.$define_struct_attribute(arg);}, TMP_4.$$s = self, TMP_4.$$arity = 1, TMP_4));
        return (function(self, $parent_nesting) {
          var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_new_5;

          
          
          Opal.def(self, '$new', TMP_new_5 = function($a) {
            var $post_args, args, self = this, instance = nil;

            
            
            $post_args = Opal.slice.call(arguments, 0, arguments.length);
            
            args = $post_args;;
            instance = self.$allocate();
            instance.$$data = {};
            $send(instance, 'initialize', Opal.to_a(args));
            return instance;
          }, TMP_new_5.$$arity = -1);
          return self.$alias_method("[]", "new");
        })(Opal.get_singleton_class(self), $nesting);}, TMP_3.$$s = self, TMP_3.$$arity = 0, TMP_3));
      if ($truthy(block)) {
        $send(klass, 'module_eval', [], block.$to_proc())};
      klass.$$keyword_init = keyword_init;
      if ($truthy(const_name)) {
        $$($nesting, 'Struct').$const_set(const_name, klass)};
      return klass;
    }, TMP_Struct_new_1.$$arity = -2);
    Opal.defs(self, '$define_struct_attribute', TMP_Struct_define_struct_attribute_6 = function $$define_struct_attribute(name) {
      var TMP_7, TMP_8, self = this;

      
      if (self['$==']($$($nesting, 'Struct'))) {
        self.$raise($$($nesting, 'ArgumentError'), "you cannot define attributes to the Struct class")};
      self.$members()['$<<'](name);
      $send(self, 'define_method', [name], (TMP_7 = function(){var self = TMP_7.$$s || this;

      return self.$$data[name];}, TMP_7.$$s = self, TMP_7.$$arity = 0, TMP_7));
      return $send(self, 'define_method', ["" + (name) + "="], (TMP_8 = function(value){var self = TMP_8.$$s || this;

      
        
        if (value == null) {
          value = nil;
        };
        return self.$$data[name] = value;;}, TMP_8.$$s = self, TMP_8.$$arity = 1, TMP_8));
    }, TMP_Struct_define_struct_attribute_6.$$arity = 1);
    Opal.defs(self, '$members', TMP_Struct_members_9 = function $$members() {
      var $a, self = this;
      if (self.members == null) self.members = nil;

      
      if (self['$==']($$($nesting, 'Struct'))) {
        self.$raise($$($nesting, 'ArgumentError'), "the Struct class has no members")};
      return (self.members = ($truthy($a = self.members) ? $a : []));
    }, TMP_Struct_members_9.$$arity = 0);
    Opal.defs(self, '$inherited', TMP_Struct_inherited_10 = function $$inherited(klass) {
      var TMP_11, self = this, members = nil;
      if (self.members == null) self.members = nil;

      
      members = self.members;
      return $send(klass, 'instance_eval', [], (TMP_11 = function(){var self = TMP_11.$$s || this;

      return (self.members = members)}, TMP_11.$$s = self, TMP_11.$$arity = 0, TMP_11));
    }, TMP_Struct_inherited_10.$$arity = 1);
    
    Opal.def(self, '$initialize', TMP_Struct_initialize_12 = function $$initialize($a) {
      var $post_args, args, $b, TMP_13, TMP_14, self = this, kwargs = nil, extra = nil;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      if ($truthy(self.$class().$$keyword_init)) {
        
        kwargs = ($truthy($b = args.$last()) ? $b : $hash2([], {}));
        if ($truthy(($truthy($b = $rb_gt(args.$length(), 1)) ? $b : (args.length === 1 && !kwargs.$$is_hash)))) {
          self.$raise($$($nesting, 'ArgumentError'), "" + "wrong number of arguments (given " + (args.$length()) + ", expected 0)")};
        extra = $rb_minus(kwargs.$keys(), self.$class().$members());
        if ($truthy(extra['$any?']())) {
          self.$raise($$($nesting, 'ArgumentError'), "" + "unknown keywords: " + (extra.$join(", ")))};
        return $send(self.$class().$members(), 'each', [], (TMP_13 = function(name){var self = TMP_13.$$s || this, $writer = nil;

        
          
          if (name == null) {
            name = nil;
          };
          $writer = [name, kwargs['$[]'](name)];
          $send(self, '[]=', Opal.to_a($writer));
          return $writer[$rb_minus($writer["length"], 1)];}, TMP_13.$$s = self, TMP_13.$$arity = 1, TMP_13));
      } else {
        
        if ($truthy($rb_gt(args.$length(), self.$class().$members().$length()))) {
          self.$raise($$($nesting, 'ArgumentError'), "struct size differs")};
        return $send(self.$class().$members(), 'each_with_index', [], (TMP_14 = function(name, index){var self = TMP_14.$$s || this, $writer = nil;

        
          
          if (name == null) {
            name = nil;
          };
          
          if (index == null) {
            index = nil;
          };
          $writer = [name, args['$[]'](index)];
          $send(self, '[]=', Opal.to_a($writer));
          return $writer[$rb_minus($writer["length"], 1)];}, TMP_14.$$s = self, TMP_14.$$arity = 2, TMP_14));
      };
    }, TMP_Struct_initialize_12.$$arity = -1);
    
    Opal.def(self, '$members', TMP_Struct_members_15 = function $$members() {
      var self = this;

      return self.$class().$members()
    }, TMP_Struct_members_15.$$arity = 0);
    
    Opal.def(self, '$hash', TMP_Struct_hash_16 = function $$hash() {
      var self = this;

      return $$($nesting, 'Hash').$new(self.$$data).$hash()
    }, TMP_Struct_hash_16.$$arity = 0);
    
    Opal.def(self, '$[]', TMP_Struct_$$_17 = function(name) {
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
    }, TMP_Struct_$$_17.$$arity = 1);
    
    Opal.def(self, '$[]=', TMP_Struct_$$$eq_18 = function(name, value) {
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
    }, TMP_Struct_$$$eq_18.$$arity = 2);
    
    Opal.def(self, '$==', TMP_Struct_$eq$eq_19 = function(other) {
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
    }, TMP_Struct_$eq$eq_19.$$arity = 1);
    
    Opal.def(self, '$eql?', TMP_Struct_eql$q_20 = function(other) {
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
    }, TMP_Struct_eql$q_20.$$arity = 1);
    
    Opal.def(self, '$each', TMP_Struct_each_21 = function $$each() {
      var TMP_22, TMP_23, $iter = TMP_Struct_each_21.$$p, $yield = $iter || nil, self = this;

      if ($iter) TMP_Struct_each_21.$$p = null;
      
      if (($yield !== nil)) {
      } else {
        return $send(self, 'enum_for', ["each"], (TMP_22 = function(){var self = TMP_22.$$s || this;

        return self.$size()}, TMP_22.$$s = self, TMP_22.$$arity = 0, TMP_22))
      };
      $send(self.$class().$members(), 'each', [], (TMP_23 = function(name){var self = TMP_23.$$s || this;

      
        
        if (name == null) {
          name = nil;
        };
        return Opal.yield1($yield, self['$[]'](name));;}, TMP_23.$$s = self, TMP_23.$$arity = 1, TMP_23));
      return self;
    }, TMP_Struct_each_21.$$arity = 0);
    
    Opal.def(self, '$each_pair', TMP_Struct_each_pair_24 = function $$each_pair() {
      var TMP_25, TMP_26, $iter = TMP_Struct_each_pair_24.$$p, $yield = $iter || nil, self = this;

      if ($iter) TMP_Struct_each_pair_24.$$p = null;
      
      if (($yield !== nil)) {
      } else {
        return $send(self, 'enum_for', ["each_pair"], (TMP_25 = function(){var self = TMP_25.$$s || this;

        return self.$size()}, TMP_25.$$s = self, TMP_25.$$arity = 0, TMP_25))
      };
      $send(self.$class().$members(), 'each', [], (TMP_26 = function(name){var self = TMP_26.$$s || this;

      
        
        if (name == null) {
          name = nil;
        };
        return Opal.yield1($yield, [name, self['$[]'](name)]);;}, TMP_26.$$s = self, TMP_26.$$arity = 1, TMP_26));
      return self;
    }, TMP_Struct_each_pair_24.$$arity = 0);
    
    Opal.def(self, '$length', TMP_Struct_length_27 = function $$length() {
      var self = this;

      return self.$class().$members().$length()
    }, TMP_Struct_length_27.$$arity = 0);
    Opal.alias(self, "size", "length");
    
    Opal.def(self, '$to_a', TMP_Struct_to_a_28 = function $$to_a() {
      var TMP_29, self = this;

      return $send(self.$class().$members(), 'map', [], (TMP_29 = function(name){var self = TMP_29.$$s || this;

      
        
        if (name == null) {
          name = nil;
        };
        return self['$[]'](name);}, TMP_29.$$s = self, TMP_29.$$arity = 1, TMP_29))
    }, TMP_Struct_to_a_28.$$arity = 0);
    Opal.alias(self, "values", "to_a");
    
    Opal.def(self, '$inspect', TMP_Struct_inspect_30 = function $$inspect() {
      var $a, TMP_31, self = this, result = nil;

      
      result = "#<struct ";
      if ($truthy(($truthy($a = $$($nesting, 'Struct')['$==='](self)) ? self.$class().$name() : $a))) {
        result = $rb_plus(result, "" + (self.$class()) + " ")};
      result = $rb_plus(result, $send(self.$each_pair(), 'map', [], (TMP_31 = function(name, value){var self = TMP_31.$$s || this;

      
        
        if (name == null) {
          name = nil;
        };
        
        if (value == null) {
          value = nil;
        };
        return "" + (name) + "=" + (value.$inspect());}, TMP_31.$$s = self, TMP_31.$$arity = 2, TMP_31)).$join(", "));
      result = $rb_plus(result, ">");
      return result;
    }, TMP_Struct_inspect_30.$$arity = 0);
    Opal.alias(self, "to_s", "inspect");
    
    Opal.def(self, '$to_h', TMP_Struct_to_h_32 = function $$to_h() {
      var TMP_33, self = this;

      return $send(self.$class().$members(), 'each_with_object', [$hash2([], {})], (TMP_33 = function(name, h){var self = TMP_33.$$s || this, $writer = nil;

      
        
        if (name == null) {
          name = nil;
        };
        
        if (h == null) {
          h = nil;
        };
        $writer = [name, self['$[]'](name)];
        $send(h, '[]=', Opal.to_a($writer));
        return $writer[$rb_minus($writer["length"], 1)];}, TMP_33.$$s = self, TMP_33.$$arity = 2, TMP_33))
    }, TMP_Struct_to_h_32.$$arity = 0);
    
    Opal.def(self, '$values_at', TMP_Struct_values_at_34 = function $$values_at($a) {
      var $post_args, args, TMP_35, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      args = $send(args, 'map', [], (TMP_35 = function(arg){var self = TMP_35.$$s || this;

      
        
        if (arg == null) {
          arg = nil;
        };
        return arg.$$is_range ? arg.$to_a() : arg;}, TMP_35.$$s = self, TMP_35.$$arity = 1, TMP_35)).$flatten();
      
      var result = [];
      for (var i = 0, len = args.length; i < len; i++) {
        if (!args[i].$$is_number) {
          self.$raise($$($nesting, 'TypeError'), "" + "no implicit conversion of " + ((args[i]).$class()) + " into Integer")
        }
        result.push(self['$[]'](args[i]));
      }
      return result;
    ;
    }, TMP_Struct_values_at_34.$$arity = -1);
    return (Opal.def(self, '$dig', TMP_Struct_dig_36 = function $$dig(key, $a) {
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
    }, TMP_Struct_dig_36.$$arity = -2), nil) && 'dig';
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
    function $IO(){};
    var self = $IO = $klass($base, $super, 'IO', $IO);

    var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_IO_tty$q_1, TMP_IO_closed$q_2, TMP_IO_write_3, TMP_IO_flush_4;

    def.tty = def.closed = nil;
    
    Opal.const_set($nesting[0], 'SEEK_SET', 0);
    Opal.const_set($nesting[0], 'SEEK_CUR', 1);
    Opal.const_set($nesting[0], 'SEEK_END', 2);
    
    Opal.def(self, '$tty?', TMP_IO_tty$q_1 = function() {
      var self = this;

      return self.tty
    }, TMP_IO_tty$q_1.$$arity = 0);
    
    Opal.def(self, '$closed?', TMP_IO_closed$q_2 = function() {
      var self = this;

      return self.closed
    }, TMP_IO_closed$q_2.$$arity = 0);
    self.$attr_accessor("write_proc");
    
    Opal.def(self, '$write', TMP_IO_write_3 = function $$write(string) {
      var self = this;

      
      self.write_proc(string);
      return string.$size();
    }, TMP_IO_write_3.$$arity = 1);
    self.$attr_accessor("sync", "tty");
    
    Opal.def(self, '$flush', TMP_IO_flush_4 = function $$flush() {
      var self = this;

      return nil
    }, TMP_IO_flush_4.$$arity = 0);
    (function($base, $parent_nesting) {
      function $Writable() {};
      var self = $Writable = $module($base, 'Writable', $Writable);

      var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_Writable_$lt$lt_5, TMP_Writable_print_6, TMP_Writable_puts_8;

      
      
      Opal.def(self, '$<<', TMP_Writable_$lt$lt_5 = function(string) {
        var self = this;

        
        self.$write(string);
        return self;
      }, TMP_Writable_$lt$lt_5.$$arity = 1);
      
      Opal.def(self, '$print', TMP_Writable_print_6 = function $$print($a) {
        var $post_args, args, TMP_7, self = this;
        if ($gvars[","] == null) $gvars[","] = nil;

        
        
        $post_args = Opal.slice.call(arguments, 0, arguments.length);
        
        args = $post_args;;
        self.$write($send(args, 'map', [], (TMP_7 = function(arg){var self = TMP_7.$$s || this;

        
          
          if (arg == null) {
            arg = nil;
          };
          return self.$String(arg);}, TMP_7.$$s = self, TMP_7.$$arity = 1, TMP_7)).$join($gvars[","]));
        return nil;
      }, TMP_Writable_print_6.$$arity = -1);
      
      Opal.def(self, '$puts', TMP_Writable_puts_8 = function $$puts($a) {
        var $post_args, args, TMP_9, self = this, newline = nil;
        if ($gvars["/"] == null) $gvars["/"] = nil;

        
        
        $post_args = Opal.slice.call(arguments, 0, arguments.length);
        
        args = $post_args;;
        newline = $gvars["/"];
        if ($truthy(args['$empty?']())) {
          self.$write($gvars["/"])
        } else {
          self.$write($send(args, 'map', [], (TMP_9 = function(arg){var self = TMP_9.$$s || this;

          
            
            if (arg == null) {
              arg = nil;
            };
            return self.$String(arg).$chomp();}, TMP_9.$$s = self, TMP_9.$$arity = 1, TMP_9)).$concat([nil]).$join(newline))
        };
        return nil;
      }, TMP_Writable_puts_8.$$arity = -1);
    })($nesting[0], $nesting);
    return (function($base, $parent_nesting) {
      function $Readable() {};
      var self = $Readable = $module($base, 'Readable', $Readable);

      var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_Readable_readbyte_10, TMP_Readable_readchar_11, TMP_Readable_readline_12, TMP_Readable_readpartial_13;

      
      
      Opal.def(self, '$readbyte', TMP_Readable_readbyte_10 = function $$readbyte() {
        var self = this;

        return self.$getbyte()
      }, TMP_Readable_readbyte_10.$$arity = 0);
      
      Opal.def(self, '$readchar', TMP_Readable_readchar_11 = function $$readchar() {
        var self = this;

        return self.$getc()
      }, TMP_Readable_readchar_11.$$arity = 0);
      
      Opal.def(self, '$readline', TMP_Readable_readline_12 = function $$readline(sep) {
        var self = this;
        if ($gvars["/"] == null) $gvars["/"] = nil;

        
        
        if (sep == null) {
          sep = $gvars["/"];
        };
        return self.$raise($$($nesting, 'NotImplementedError'));
      }, TMP_Readable_readline_12.$$arity = -1);
      
      Opal.def(self, '$readpartial', TMP_Readable_readpartial_13 = function $$readpartial(integer, outbuf) {
        var self = this;

        
        
        if (outbuf == null) {
          outbuf = nil;
        };
        return self.$raise($$($nesting, 'NotImplementedError'));
      }, TMP_Readable_readpartial_13.$$arity = -2);
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
  var TMP_to_s_1, TMP_include_2, self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice;

  Opal.add_stubs(['$include']);
  
  Opal.defs(self, '$to_s', TMP_to_s_1 = function $$to_s() {
    var self = this;

    return "main"
  }, TMP_to_s_1.$$arity = 0);
  return (Opal.defs(self, '$include', TMP_include_2 = function $$include(mod) {
    var self = this;

    return $$($nesting, 'Object').$include(mod)
  }, TMP_include_2.$$arity = 1), nil) && 'include';
};

/* Generated by Opal 0.11.99.dev */
Opal.modules["corelib/dir"] = function(Opal) {
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice, $klass = Opal.klass, $truthy = Opal.truthy;

  Opal.add_stubs(['$[]']);
  return (function($base, $super, $parent_nesting) {
    function $Dir(){};
    var self = $Dir = $klass($base, $super, 'Dir', $Dir);

    var def = self.prototype, $nesting = [self].concat($parent_nesting);

    return (function(self, $parent_nesting) {
      var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_chdir_1, TMP_pwd_2, TMP_home_3;

      
      
      Opal.def(self, '$chdir', TMP_chdir_1 = function $$chdir(dir) {
        var $iter = TMP_chdir_1.$$p, $yield = $iter || nil, self = this, prev_cwd = nil;

        if ($iter) TMP_chdir_1.$$p = null;
        return (function() { try {
        
        prev_cwd = Opal.current_dir;
        Opal.current_dir = dir;
        return Opal.yieldX($yield, []);;
        } finally {
          Opal.current_dir = prev_cwd
        }; })()
      }, TMP_chdir_1.$$arity = 1);
      
      Opal.def(self, '$pwd', TMP_pwd_2 = function $$pwd() {
        var self = this;

        return Opal.current_dir || '.';
      }, TMP_pwd_2.$$arity = 0);
      Opal.alias(self, "getwd", "pwd");
      return (Opal.def(self, '$home', TMP_home_3 = function $$home() {
        var $a, self = this;

        return ($truthy($a = $$($nesting, 'ENV')['$[]']("HOME")) ? $a : ".")
      }, TMP_home_3.$$arity = 0), nil) && 'home';
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

  Opal.add_stubs(['$home', '$raise', '$start_with?', '$+', '$sub', '$pwd', '$split', '$unshift', '$join', '$respond_to?', '$coerce_to!', '$basename', '$empty?', '$rindex', '$[]', '$nil?', '$==', '$-', '$length', '$gsub', '$find', '$=~', '$map', '$each_with_index', '$flatten', '$reject', '$to_proc', '$end_with?']);
  return (function($base, $super, $parent_nesting) {
    function $File(){};
    var self = $File = $klass($base, $super, 'File', $File);

    var def = self.prototype, $nesting = [self].concat($parent_nesting), windows_root_rx = nil;

    
    Opal.const_set($nesting[0], 'Separator', Opal.const_set($nesting[0], 'SEPARATOR', "/"));
    Opal.const_set($nesting[0], 'ALT_SEPARATOR', nil);
    Opal.const_set($nesting[0], 'PATH_SEPARATOR', ":");
    Opal.const_set($nesting[0], 'FNM_SYSCASE', 0);
    windows_root_rx = /^[a-zA-Z]:(?:\\|\/)/;
    return (function(self, $parent_nesting) {
      var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_expand_path_1, TMP_dirname_2, TMP_basename_3, TMP_extname_4, TMP_exist$q_5, TMP_directory$q_6, TMP_join_8, TMP_split_11;

      
      
      Opal.def(self, '$expand_path', TMP_expand_path_1 = function $$expand_path(path, basedir) {
        var $a, self = this, sep = nil, sep_chars = nil, new_parts = nil, home = nil, home_path_regexp = nil, path_abs = nil, basedir_abs = nil, parts = nil, leading_sep = nil, abs = nil, new_path = nil;

        
        
        if (basedir == null) {
          basedir = nil;
        };
        sep = $$($nesting, 'SEPARATOR');
        sep_chars = $sep_chars();
        new_parts = [];
        if ($truthy(path[0] === '~' || (basedir && basedir[0] === '~'))) {
          
          home = $$($nesting, 'Dir').$home();
          if ($truthy(home)) {
          } else {
            self.$raise($$($nesting, 'ArgumentError'), "couldn't find HOME environment -- expanding `~'")
          };
          if ($truthy(home['$start_with?'](sep))) {
          } else {
            self.$raise($$($nesting, 'ArgumentError'), "non-absolute home")
          };
          home = $rb_plus(home, sep);
          home_path_regexp = new RegExp("" + "^\\~(?:" + (sep) + "|$)");
          path = path.$sub(home_path_regexp, home);
          if ($truthy(basedir)) {
            basedir = basedir.$sub(home_path_regexp, home)};};
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
      }, TMP_expand_path_1.$$arity = -2);
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
      
      Opal.def(self, '$dirname', TMP_dirname_2 = function $$dirname(path) {
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
      }, TMP_dirname_2.$$arity = 1);
      
      Opal.def(self, '$basename', TMP_basename_3 = function $$basename(name, suffix) {
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
      }, TMP_basename_3.$$arity = -2);
      
      Opal.def(self, '$extname', TMP_extname_4 = function $$extname(path) {
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
      }, TMP_extname_4.$$arity = 1);
      
      Opal.def(self, '$exist?', TMP_exist$q_5 = function(path) {
        var self = this;

        return Opal.modules[path] != null
      }, TMP_exist$q_5.$$arity = 1);
      Opal.alias(self, "exists?", "exist?");
      
      Opal.def(self, '$directory?', TMP_directory$q_6 = function(path) {
        var TMP_7, self = this, files = nil, file = nil;

        
        files = [];
        
        for (var key in Opal.modules) {
          files.push(key)
        }
      ;
        path = path.$gsub(new RegExp("" + "(^." + ($$($nesting, 'SEPARATOR')) + "+|" + ($$($nesting, 'SEPARATOR')) + "+$)"));
        file = $send(files, 'find', [], (TMP_7 = function(f){var self = TMP_7.$$s || this;

        
          
          if (f == null) {
            f = nil;
          };
          return f['$=~'](new RegExp("" + "^" + (path)));}, TMP_7.$$s = self, TMP_7.$$arity = 1, TMP_7));
        return file;
      }, TMP_directory$q_6.$$arity = 1);
      
      Opal.def(self, '$join', TMP_join_8 = function $$join($a) {
        var $post_args, paths, TMP_9, TMP_10, self = this, result = nil;

        
        
        $post_args = Opal.slice.call(arguments, 0, arguments.length);
        
        paths = $post_args;;
        if ($truthy(paths['$empty?']())) {
          return ""};
        result = "";
        paths = $send(paths.$flatten().$each_with_index(), 'map', [], (TMP_9 = function(item, index){var self = TMP_9.$$s || this, $b;

        
          
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
          };}, TMP_9.$$s = self, TMP_9.$$arity = 2, TMP_9));
        paths = $send(paths, 'reject', [], "empty?".$to_proc());
        $send(paths, 'each_with_index', [], (TMP_10 = function(item, index){var self = TMP_10.$$s || this, $b, next_item = nil;

        
          
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
          };}, TMP_10.$$s = self, TMP_10.$$arity = 2, TMP_10));
        return result;
      }, TMP_join_8.$$arity = -1);
      return (Opal.def(self, '$split', TMP_split_11 = function $$split(path) {
        var self = this;

        return path.$split($$($nesting, 'SEPARATOR'))
      }, TMP_split_11.$$arity = 1), nil) && 'split';
    })(Opal.get_singleton_class(self), $nesting);
  })($nesting[0], $$($nesting, 'IO'), $nesting)
};

/* Generated by Opal 0.11.99.dev */
Opal.modules["corelib/process"] = function(Opal) {
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice, $klass = Opal.klass, $truthy = Opal.truthy;

  Opal.add_stubs(['$const_set', '$size', '$<<', '$__register_clock__', '$to_f', '$now', '$new', '$[]', '$raise']);
  
  (function($base, $super, $parent_nesting) {
    function $Process(){};
    var self = $Process = $klass($base, $super, 'Process', $Process);

    var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_Process___register_clock___1, TMP_Process_pid_2, TMP_Process_times_3, TMP_Process_clock_gettime_4, monotonic = nil;

    
    self.__clocks__ = [];
    Opal.defs(self, '$__register_clock__', TMP_Process___register_clock___1 = function $$__register_clock__(name, func) {
      var self = this;
      if (self.__clocks__ == null) self.__clocks__ = nil;

      
      self.$const_set(name, self.__clocks__.$size());
      return self.__clocks__['$<<'](func);
    }, TMP_Process___register_clock___1.$$arity = 2);
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
    Opal.defs(self, '$pid', TMP_Process_pid_2 = function $$pid() {
      var self = this;

      return 0
    }, TMP_Process_pid_2.$$arity = 0);
    Opal.defs(self, '$times', TMP_Process_times_3 = function $$times() {
      var self = this, t = nil;

      
      t = $$($nesting, 'Time').$now().$to_f();
      return $$$($$($nesting, 'Benchmark'), 'Tms').$new(t, t, t, t, t);
    }, TMP_Process_times_3.$$arity = 0);
    return (Opal.defs(self, '$clock_gettime', TMP_Process_clock_gettime_4 = function $$clock_gettime(clock_id, unit) {
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
    }, TMP_Process_clock_gettime_4.$$arity = -2), nil) && 'clock_gettime';
  })($nesting[0], null, $nesting);
  (function($base, $super, $parent_nesting) {
    function $Signal(){};
    var self = $Signal = $klass($base, $super, 'Signal', $Signal);

    var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_Signal_trap_5;

    return (Opal.defs(self, '$trap', TMP_Signal_trap_5 = function $$trap($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return nil;
    }, TMP_Signal_trap_5.$$arity = -1), nil) && 'trap'
  })($nesting[0], null, $nesting);
  return (function($base, $super, $parent_nesting) {
    function $GC(){};
    var self = $GC = $klass($base, $super, 'GC', $GC);

    var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_GC_start_6;

    return (Opal.defs(self, '$start', TMP_GC_start_6 = function $$start() {
      var self = this;

      return nil
    }, TMP_GC_start_6.$$arity = 0), nil) && 'start'
  })($nesting[0], null, $nesting);
};

/* Generated by Opal 0.11.99.dev */
Opal.modules["corelib/random"] = function(Opal) {
  function $rb_lt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs < rhs : lhs['$<'](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice, $klass = Opal.klass, $truthy = Opal.truthy, $send = Opal.send;

  Opal.add_stubs(['$attr_reader', '$new_seed', '$coerce_to!', '$reseed', '$rand', '$seed', '$<', '$raise', '$encode', '$join', '$new', '$chr', '$===', '$==', '$state', '$const_defined?', '$const_set']);
  return (function($base, $super, $parent_nesting) {
    function $Random(){};
    var self = $Random = $klass($base, $super, 'Random', $Random);

    var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_Random_initialize_1, TMP_Random_reseed_2, TMP_Random_new_seed_3, TMP_Random_rand_4, TMP_Random_srand_5, TMP_Random_urandom_6, TMP_Random_$eq$eq_8, TMP_Random_bytes_9, TMP_Random_rand_11, TMP_Random_generator$eq_12;

    
    self.$attr_reader("seed", "state");
    
    Opal.def(self, '$initialize', TMP_Random_initialize_1 = function $$initialize(seed) {
      var self = this;

      
      
      if (seed == null) {
        seed = $$($nesting, 'Random').$new_seed();
      };
      seed = $$($nesting, 'Opal')['$coerce_to!'](seed, $$($nesting, 'Integer'), "to_int");
      self.state = seed;
      return self.$reseed(seed);
    }, TMP_Random_initialize_1.$$arity = -1);
    
    Opal.def(self, '$reseed', TMP_Random_reseed_2 = function $$reseed(seed) {
      var self = this;

      
      self.seed = seed;
      return self.$rng = Opal.$$rand.reseed(seed);;
    }, TMP_Random_reseed_2.$$arity = 1);
    Opal.defs(self, '$new_seed', TMP_Random_new_seed_3 = function $$new_seed() {
      var self = this;

      return Opal.$$rand.new_seed();
    }, TMP_Random_new_seed_3.$$arity = 0);
    Opal.defs(self, '$rand', TMP_Random_rand_4 = function $$rand(limit) {
      var self = this;

      
      ;
      return $$($nesting, 'DEFAULT').$rand(limit);
    }, TMP_Random_rand_4.$$arity = -1);
    Opal.defs(self, '$srand', TMP_Random_srand_5 = function $$srand(n) {
      var self = this, previous_seed = nil;

      
      
      if (n == null) {
        n = $$($nesting, 'Random').$new_seed();
      };
      n = $$($nesting, 'Opal')['$coerce_to!'](n, $$($nesting, 'Integer'), "to_int");
      previous_seed = $$($nesting, 'DEFAULT').$seed();
      $$($nesting, 'DEFAULT').$reseed(n);
      return previous_seed;
    }, TMP_Random_srand_5.$$arity = -1);
    Opal.defs(self, '$urandom', TMP_Random_urandom_6 = function $$urandom(size) {
      var TMP_7, self = this;

      
      size = $$($nesting, 'Opal')['$coerce_to!'](size, $$($nesting, 'Integer'), "to_int");
      if ($truthy($rb_lt(size, 0))) {
        self.$raise($$($nesting, 'ArgumentError'), "negative string size (or size too big)")};
      return $send($$($nesting, 'Array'), 'new', [size], (TMP_7 = function(){var self = TMP_7.$$s || this;

      return self.$rand(255).$chr()}, TMP_7.$$s = self, TMP_7.$$arity = 0, TMP_7)).$join().$encode("ASCII-8BIT");
    }, TMP_Random_urandom_6.$$arity = 1);
    
    Opal.def(self, '$==', TMP_Random_$eq$eq_8 = function(other) {
      var $a, self = this;

      
      if ($truthy($$($nesting, 'Random')['$==='](other))) {
      } else {
        return false
      };
      return (($a = self.$seed()['$=='](other.$seed())) ? self.$state()['$=='](other.$state()) : self.$seed()['$=='](other.$seed()));
    }, TMP_Random_$eq$eq_8.$$arity = 1);
    
    Opal.def(self, '$bytes', TMP_Random_bytes_9 = function $$bytes(length) {
      var TMP_10, self = this;

      
      length = $$($nesting, 'Opal')['$coerce_to!'](length, $$($nesting, 'Integer'), "to_int");
      return $send($$($nesting, 'Array'), 'new', [length], (TMP_10 = function(){var self = TMP_10.$$s || this;

      return self.$rand(255).$chr()}, TMP_10.$$s = self, TMP_10.$$arity = 0, TMP_10)).$join().$encode("ASCII-8BIT");
    }, TMP_Random_bytes_9.$$arity = 1);
    
    Opal.def(self, '$rand', TMP_Random_rand_11 = function $$rand(limit) {
      var self = this;

      
      ;
      
      function randomFloat() {
        self.state++;
        return Opal.$$rand.rand(self.$rng);
      }

      function randomInt() {
        return Math.floor(randomFloat() * limit);
      }

      function randomRange() {
        var min = limit.begin,
            max = limit.end;

        if (min === nil || max === nil) {
          return nil;
        }

        var length = max - min;

        if (length < 0) {
          return nil;
        }

        if (length === 0) {
          return min;
        }

        if (max % 1 === 0 && min % 1 === 0 && !limit.excl) {
          length++;
        }

        return self.$rand(length) + min;
      }

      if (limit == null) {
        return randomFloat();
      } else if (limit.$$is_range) {
        return randomRange();
      } else if (limit.$$is_number) {
        if (limit <= 0) {
          self.$raise($$($nesting, 'ArgumentError'), "" + "invalid argument - " + (limit))
        }

        if (limit % 1 === 0) {
          // integer
          return randomInt();
        } else {
          return randomFloat() * limit;
        }
      } else {
        limit = $$($nesting, 'Opal')['$coerce_to!'](limit, $$($nesting, 'Integer'), "to_int");

        if (limit <= 0) {
          self.$raise($$($nesting, 'ArgumentError'), "" + "invalid argument - " + (limit))
        }

        return randomInt();
      }
    ;
    }, TMP_Random_rand_11.$$arity = -1);
    return (Opal.defs(self, '$generator=', TMP_Random_generator$eq_12 = function(generator) {
      var self = this;

      
      Opal.$$rand = generator;
      if ($truthy(self['$const_defined?']("DEFAULT"))) {
        return $$($nesting, 'DEFAULT').$reseed()
      } else {
        return self.$const_set("DEFAULT", self.$new(self.$new_seed()))
      };
    }, TMP_Random_generator$eq_12.$$arity = 1), nil) && 'generator=';
  })($nesting[0], null, $nesting)
};

/*
This is based on an adaptation of Makoto Matsumoto and Takuji Nishimura's code
done by Sean McCullough <banksean@gmail.com> and Dave Heitzman
<daveheitzman@yahoo.com>, subsequently readapted from an updated version of
ruby's random.c (rev c38a183032a7826df1adabd8aa0725c713d53e1c).

The original copyright notice from random.c follows.

  This is based on trimmed version of MT19937.  To get the original version,
  contact <http://www.math.sci.hiroshima-u.ac.jp/~m-mat/MT/emt.html>.

  The original copyright notice follows.

     A C-program for MT19937, with initialization improved 2002/2/10.
     Coded by Takuji Nishimura and Makoto Matsumoto.
     This is a faster version by taking Shawn Cokus's optimization,
     Matthe Bellew's simplification, Isaku Wada's real version.

     Before using, initialize the state by using init_genrand(mt, seed)
     or init_by_array(mt, init_key, key_length).

     Copyright (C) 1997 - 2002, Makoto Matsumoto and Takuji Nishimura,
     All rights reserved.

     Redistribution and use in source and binary forms, with or without
     modification, are permitted provided that the following conditions
     are met:

       1. Redistributions of source code must retain the above copyright
          notice, this list of conditions and the following disclaimer.

       2. Redistributions in binary form must reproduce the above copyright
          notice, this list of conditions and the following disclaimer in the
          documentation and/or other materials provided with the distribution.

       3. The names of its contributors may not be used to endorse or promote
          products derived from this software without specific prior written
          permission.

     THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
     "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
     LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
     A PARTICULAR PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL THE COPYRIGHT OWNER OR
     CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
     EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
     PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
     PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
     LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
     NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
     SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.


     Any feedback is very welcome.
     http://www.math.keio.ac.jp/matumoto/emt.html
     email: matumoto@math.keio.ac.jp
*/
var MersenneTwister = (function() {
  /* Period parameters */
  var N = 624;
  var M = 397;
  var MATRIX_A = 0x9908b0df;      /* constant vector a */
  var UMASK = 0x80000000;         /* most significant w-r bits */
  var LMASK = 0x7fffffff;         /* least significant r bits */
  var MIXBITS = function(u,v) { return ( ((u) & UMASK) | ((v) & LMASK) ); };
  var TWIST = function(u,v) { return (MIXBITS((u),(v)) >>> 1) ^ ((v & 0x1) ? MATRIX_A : 0x0); };

  function init(s) {
    var mt = {left: 0, next: N, state: new Array(N)};
    init_genrand(mt, s);
    return mt;
  }

  /* initializes mt[N] with a seed */
  function init_genrand(mt, s) {
    var j, i;
    mt.state[0] = s >>> 0;
    for (j=1; j<N; j++) {
      mt.state[j] = (1812433253 * ((mt.state[j-1] ^ (mt.state[j-1] >> 30) >>> 0)) + j);
      /* See Knuth TAOCP Vol2. 3rd Ed. P.106 for multiplier. */
      /* In the previous versions, MSBs of the seed affect   */
      /* only MSBs of the array state[].                     */
      /* 2002/01/09 modified by Makoto Matsumoto             */
      mt.state[j] &= 0xffffffff;  /* for >32 bit machines */
    }
    mt.left = 1;
    mt.next = N;
  }

  /* generate N words at one time */
  function next_state(mt) {
    var p = 0, _p = mt.state;
    var j;

    mt.left = N;
    mt.next = 0;

    for (j=N-M+1; --j; p++)
      _p[p] = _p[p+(M)] ^ TWIST(_p[p+(0)], _p[p+(1)]);

    for (j=M; --j; p++)
      _p[p] = _p[p+(M-N)] ^ TWIST(_p[p+(0)], _p[p+(1)]);

    _p[p] = _p[p+(M-N)] ^ TWIST(_p[p+(0)], _p[0]);
  }

  /* generates a random number on [0,0xffffffff]-interval */
  function genrand_int32(mt) {
    /* mt must be initialized */
    var y;

    if (--mt.left <= 0) next_state(mt);
    y = mt.state[mt.next++];

    /* Tempering */
    y ^= (y >>> 11);
    y ^= (y << 7) & 0x9d2c5680;
    y ^= (y << 15) & 0xefc60000;
    y ^= (y >>> 18);

    return y >>> 0;
  }

  function int_pair_to_real_exclusive(a, b) {
    a >>>= 5;
    b >>>= 6;
    return(a*67108864.0+b)*(1.0/9007199254740992.0);
  }

  // generates a random number on [0,1) with 53-bit resolution
  function genrand_real(mt) {
    /* mt must be initialized */
    var a = genrand_int32(mt), b = genrand_int32(mt);
    return int_pair_to_real_exclusive(a, b);
  }

  return { genrand_real: genrand_real, init: init };
})();
Opal.loaded(["corelib/random/MersenneTwister.js"]);
/* Generated by Opal 0.11.99.dev */
Opal.modules["corelib/random/mersenne_twister"] = function(Opal) {
  function $rb_minus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs - rhs : lhs['$-'](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice, $klass = Opal.klass, $send = Opal.send;

  Opal.add_stubs(['$require', '$generator=', '$-']);
  
  self.$require("corelib/random/MersenneTwister");
  return (function($base, $super, $parent_nesting) {
    function $Random(){};
    var self = $Random = $klass($base, $super, 'Random', $Random);

    var def = self.prototype, $nesting = [self].concat($parent_nesting), $writer = nil;

    
    var MAX_INT = Number.MAX_SAFE_INTEGER || Math.pow(2, 53) - 1;
    Opal.const_set($nesting[0], 'MERSENNE_TWISTER_GENERATOR', {
    new_seed: function() { return Math.round(Math.random() * MAX_INT); },
    reseed: function(seed) { return MersenneTwister.init(seed); },
    rand: function(mt) { return MersenneTwister.genrand_real(mt); }
  });
    
    $writer = [$$($nesting, 'MERSENNE_TWISTER_GENERATOR')];
    $send(self, 'generator=', Opal.to_a($writer));
    return $writer[$rb_minus($writer["length"], 1)];;
  })($nesting[0], null, $nesting);
};

/* Generated by Opal 0.11.99.dev */
Opal.modules["corelib/unsupported"] = function(Opal) {
  var TMP_public_35, TMP_private_36, self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice, $klass = Opal.klass, $module = Opal.module;

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
    function $String(){};
    var self = $String = $klass($base, $super, 'String', $String);

    var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_String_$lt$lt_1, TMP_String_capitalize$B_2, TMP_String_chomp$B_3, TMP_String_chop$B_4, TMP_String_downcase$B_5, TMP_String_gsub$B_6, TMP_String_lstrip$B_7, TMP_String_next$B_8, TMP_String_reverse$B_9, TMP_String_slice$B_10, TMP_String_squeeze$B_11, TMP_String_strip$B_12, TMP_String_sub$B_13, TMP_String_succ$B_14, TMP_String_swapcase$B_15, TMP_String_tr$B_16, TMP_String_tr_s$B_17, TMP_String_upcase$B_18, TMP_String_prepend_19, TMP_String_$$$eq_20, TMP_String_clear_21, TMP_String_encode$B_22, TMP_String_unicode_normalize$B_23;

    
    var ERROR = "String#%s not supported. Mutable String methods are not supported in Opal.";
    
    Opal.def(self, '$<<', TMP_String_$lt$lt_1 = function($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("<<"));
    }, TMP_String_$lt$lt_1.$$arity = -1);
    
    Opal.def(self, '$capitalize!', TMP_String_capitalize$B_2 = function($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("capitalize!"));
    }, TMP_String_capitalize$B_2.$$arity = -1);
    
    Opal.def(self, '$chomp!', TMP_String_chomp$B_3 = function($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("chomp!"));
    }, TMP_String_chomp$B_3.$$arity = -1);
    
    Opal.def(self, '$chop!', TMP_String_chop$B_4 = function($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("chop!"));
    }, TMP_String_chop$B_4.$$arity = -1);
    
    Opal.def(self, '$downcase!', TMP_String_downcase$B_5 = function($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("downcase!"));
    }, TMP_String_downcase$B_5.$$arity = -1);
    
    Opal.def(self, '$gsub!', TMP_String_gsub$B_6 = function($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("gsub!"));
    }, TMP_String_gsub$B_6.$$arity = -1);
    
    Opal.def(self, '$lstrip!', TMP_String_lstrip$B_7 = function($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("lstrip!"));
    }, TMP_String_lstrip$B_7.$$arity = -1);
    
    Opal.def(self, '$next!', TMP_String_next$B_8 = function($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("next!"));
    }, TMP_String_next$B_8.$$arity = -1);
    
    Opal.def(self, '$reverse!', TMP_String_reverse$B_9 = function($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("reverse!"));
    }, TMP_String_reverse$B_9.$$arity = -1);
    
    Opal.def(self, '$slice!', TMP_String_slice$B_10 = function($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("slice!"));
    }, TMP_String_slice$B_10.$$arity = -1);
    
    Opal.def(self, '$squeeze!', TMP_String_squeeze$B_11 = function($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("squeeze!"));
    }, TMP_String_squeeze$B_11.$$arity = -1);
    
    Opal.def(self, '$strip!', TMP_String_strip$B_12 = function($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("strip!"));
    }, TMP_String_strip$B_12.$$arity = -1);
    
    Opal.def(self, '$sub!', TMP_String_sub$B_13 = function($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("sub!"));
    }, TMP_String_sub$B_13.$$arity = -1);
    
    Opal.def(self, '$succ!', TMP_String_succ$B_14 = function($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("succ!"));
    }, TMP_String_succ$B_14.$$arity = -1);
    
    Opal.def(self, '$swapcase!', TMP_String_swapcase$B_15 = function($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("swapcase!"));
    }, TMP_String_swapcase$B_15.$$arity = -1);
    
    Opal.def(self, '$tr!', TMP_String_tr$B_16 = function($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("tr!"));
    }, TMP_String_tr$B_16.$$arity = -1);
    
    Opal.def(self, '$tr_s!', TMP_String_tr_s$B_17 = function($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("tr_s!"));
    }, TMP_String_tr_s$B_17.$$arity = -1);
    
    Opal.def(self, '$upcase!', TMP_String_upcase$B_18 = function($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("upcase!"));
    }, TMP_String_upcase$B_18.$$arity = -1);
    
    Opal.def(self, '$prepend', TMP_String_prepend_19 = function $$prepend($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("prepend"));
    }, TMP_String_prepend_19.$$arity = -1);
    
    Opal.def(self, '$[]=', TMP_String_$$$eq_20 = function($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("[]="));
    }, TMP_String_$$$eq_20.$$arity = -1);
    
    Opal.def(self, '$clear', TMP_String_clear_21 = function $$clear($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("clear"));
    }, TMP_String_clear_21.$$arity = -1);
    
    Opal.def(self, '$encode!', TMP_String_encode$B_22 = function($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("encode!"));
    }, TMP_String_encode$B_22.$$arity = -1);
    return (Opal.def(self, '$unicode_normalize!', TMP_String_unicode_normalize$B_23 = function($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("unicode_normalize!"));
    }, TMP_String_unicode_normalize$B_23.$$arity = -1), nil) && 'unicode_normalize!';
  })($nesting[0], null, $nesting);
  (function($base, $parent_nesting) {
    function $Kernel() {};
    var self = $Kernel = $module($base, 'Kernel', $Kernel);

    var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_Kernel_freeze_24, TMP_Kernel_frozen$q_25;

    
    var ERROR = "Object freezing is not supported by Opal";
    
    Opal.def(self, '$freeze', TMP_Kernel_freeze_24 = function $$freeze() {
      var self = this;

      
      handle_unsupported_feature(ERROR);
      return self;
    }, TMP_Kernel_freeze_24.$$arity = 0);
    
    Opal.def(self, '$frozen?', TMP_Kernel_frozen$q_25 = function() {
      var self = this;

      
      handle_unsupported_feature(ERROR);
      return false;
    }, TMP_Kernel_frozen$q_25.$$arity = 0);
  })($nesting[0], $nesting);
  (function($base, $parent_nesting) {
    function $Kernel() {};
    var self = $Kernel = $module($base, 'Kernel', $Kernel);

    var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_Kernel_taint_26, TMP_Kernel_untaint_27, TMP_Kernel_tainted$q_28;

    
    var ERROR = "Object tainting is not supported by Opal";
    
    Opal.def(self, '$taint', TMP_Kernel_taint_26 = function $$taint() {
      var self = this;

      
      handle_unsupported_feature(ERROR);
      return self;
    }, TMP_Kernel_taint_26.$$arity = 0);
    
    Opal.def(self, '$untaint', TMP_Kernel_untaint_27 = function $$untaint() {
      var self = this;

      
      handle_unsupported_feature(ERROR);
      return self;
    }, TMP_Kernel_untaint_27.$$arity = 0);
    
    Opal.def(self, '$tainted?', TMP_Kernel_tainted$q_28 = function() {
      var self = this;

      
      handle_unsupported_feature(ERROR);
      return false;
    }, TMP_Kernel_tainted$q_28.$$arity = 0);
  })($nesting[0], $nesting);
  (function($base, $super, $parent_nesting) {
    function $Module(){};
    var self = $Module = $klass($base, $super, 'Module', $Module);

    var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_Module_public_29, TMP_Module_private_class_method_30, TMP_Module_private_method_defined$q_31, TMP_Module_private_constant_32;

    
    
    Opal.def(self, '$public', TMP_Module_public_29 = function($a) {
      var $post_args, methods, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      methods = $post_args;;
      
      if (methods.length === 0) {
        self.$$module_function = false;
      }

      return nil;
    ;
    }, TMP_Module_public_29.$$arity = -1);
    Opal.alias(self, "private", "public");
    Opal.alias(self, "protected", "public");
    Opal.alias(self, "nesting", "public");
    
    Opal.def(self, '$private_class_method', TMP_Module_private_class_method_30 = function $$private_class_method($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return self;
    }, TMP_Module_private_class_method_30.$$arity = -1);
    Opal.alias(self, "public_class_method", "private_class_method");
    
    Opal.def(self, '$private_method_defined?', TMP_Module_private_method_defined$q_31 = function(obj) {
      var self = this;

      return false
    }, TMP_Module_private_method_defined$q_31.$$arity = 1);
    
    Opal.def(self, '$private_constant', TMP_Module_private_constant_32 = function $$private_constant($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return nil;
    }, TMP_Module_private_constant_32.$$arity = -1);
    Opal.alias(self, "protected_method_defined?", "private_method_defined?");
    Opal.alias(self, "public_instance_methods", "instance_methods");
    Opal.alias(self, "public_instance_method", "instance_method");
    return Opal.alias(self, "public_method_defined?", "method_defined?");
  })($nesting[0], null, $nesting);
  (function($base, $parent_nesting) {
    function $Kernel() {};
    var self = $Kernel = $module($base, 'Kernel', $Kernel);

    var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_Kernel_private_methods_33;

    
    
    Opal.def(self, '$private_methods', TMP_Kernel_private_methods_33 = function $$private_methods($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return [];
    }, TMP_Kernel_private_methods_33.$$arity = -1);
    Opal.alias(self, "private_instance_methods", "private_methods");
  })($nesting[0], $nesting);
  (function($base, $parent_nesting) {
    function $Kernel() {};
    var self = $Kernel = $module($base, 'Kernel', $Kernel);

    var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_Kernel_eval_34;

    
    Opal.def(self, '$eval', TMP_Kernel_eval_34 = function($a) {
      var $post_args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      ;
      return self.$raise($$($nesting, 'NotImplementedError'), "" + "To use Kernel#eval, you must first require 'opal-parser'. " + ("" + "See https://github.com/opal/opal/blob/" + ($$($nesting, 'RUBY_ENGINE_VERSION')) + "/docs/opal_parser.md for details."));
    }, TMP_Kernel_eval_34.$$arity = -1)
  })($nesting[0], $nesting);
  Opal.defs(self, '$public', TMP_public_35 = function($a) {
    var $post_args, self = this;

    
    
    $post_args = Opal.slice.call(arguments, 0, arguments.length);
    ;
    return nil;
  }, TMP_public_35.$$arity = -1);
  return (Opal.defs(self, '$private', TMP_private_36 = function($a) {
    var $post_args, self = this;

    
    
    $post_args = Opal.slice.call(arguments, 0, arguments.length);
    ;
    return nil;
  }, TMP_private_36.$$arity = -1), nil) && 'private';
};

/* Generated by Opal 0.11.99.dev */
(function(Opal) {
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice;

  Opal.add_stubs(['$require']);
  
  self.$require("opal/base");
  self.$require("opal/mini");
  self.$require("corelib/string/encoding");
  self.$require("corelib/math");
  self.$require("corelib/complex");
  self.$require("corelib/rational");
  self.$require("corelib/time");
  self.$require("corelib/struct");
  self.$require("corelib/io");
  self.$require("corelib/main");
  self.$require("corelib/dir");
  self.$require("corelib/file");
  self.$require("corelib/process");
  self.$require("corelib/random");
  self.$require("corelib/random/mersenne_twister.js");
  return self.$require("corelib/unsupported");
})(Opal);
