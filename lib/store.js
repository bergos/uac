var ns = require('./namespace.js');


Store = function(rdf, store, accessControl) {
  var self = this;

  self.accessControl = accessControl;

  var cleanCb = function(callback) {
	return function(graph) {
	  if(graph.toArray().length == 0) {
        return callback(null);
      }

      callback(graph);
    };
  };

  var agent = function (options) {
	if (options == null) {
      return null;
    }

    if (!('agent' in options)) {
      return null;
    }

    return options.agent;
  };

  var application = function (options) {
    if (options == null) {
      return null;
    }

    if (!('application' in options)) {
      return null;
    }

    return options.application;
  };

  self.graph = function(iri, callback, options) {
    store.graph(iri, function(graph) {
      if(graph == null) {
        return callback(null);
      }

      self.accessControl.hasReadAccess(iri, graph, null, agent(options), application(options), cleanCb(callback));
    });
  };

  self.match = function(iri, subject, predicate, object, callback, limit, options) {
    store.match(iri, subject, predicate, object, function(graph) {
      if(graph == null) {
        return callback(null);
      }

      //TODO: this could reduce the number of triples -> store.graph -> ac.hasAccess -> grap.match
      self.accessControl.hasReadAccess(iri, graph, null, agent(options), application(options), cleanCb(callback));
    }, limit);
  };

  self.add = function(iri, graph, callback, options) {
    store.graph(iri, function(current) {
      self.accessControl.hasWriteAccess(iri, current, graph, agent(options), application(options), function(granted) {
        if(granted.toArray().length == 0) {
          return callback(null);
        }

        store.add(iri, granted, callback);
      });
    });
  };

  self.merge = function(iri, graph, callback, options) {
    store.graph(iri, function(current) {
      self.accessControl.hasWriteAccess(iri, current, graph, agent(options), application(options), function(granted) {
        if(granted.toArray().length == 0) {
          return callback(null);
        }

        store.merge(iri, granted, callback);
      });
    });
  };

  self.remove = function(iri, graph, callback, options) {
    store.graph(iri, function(current) {
      self.accessControl.hasDeleteAccess(iri, current, graph, agent(options), application(options), function(granted) {
        if(granted.toArray().length == 0) {
          return callback(null);
        }

        store.remove(iri, granted, callback);
      });
    });
  };

  self.removeMatches = function(iri, subject, predicate, object, callback, options) {
    store.match(iri, subject, predicate, object, function(graph) {
      if(graph.toArray().length == 0) {
        return callback(null);
      }

      self.remove(iri, graph, callback, agent(options), application(options));
    });
  };

  self.delete = function(iri, callback, options) {
    store.graph(iri, function(graph) {
      self.accessControl.hasDeleteAccess(iri, graph, graph, agent(options), application(options), function(granted) {
        // check if write access was granted to all triples in the graph
        if(graph.toArray().length != granted.toArray().length) {
          return callback(null);
        }

        store.delete(iri, callback);
      });
    });
  };
};


module.exports = Store;