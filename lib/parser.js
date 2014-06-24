var filters = require('./filters.js');
var ns = require('./namespace.js');


Parser = function(rdf) {
	var self = this;

	var matchObjects = function(g, s, p) {
		var o = [];
		g.match(s, p).forEach(function(t) { o.push(t.object); });
		return o;
	};

	var matchObjectValue = function(g, s, p) {
		var v = null;
		g.match(s, p, null, 1).forEach(function(t) { v = t.object.valueOf(); });
		return v;
	};

	var matchObjectValues = function(g, s, p) {
		var v = [];
		g.match(s, p).forEach(function(t) { v.push(t.object.valueOf()); });
		return v;
	};

	self.parse = function(graph) {
		var auths = self.parseAuths(graph);
		var roles = self.parseRoles(graph);

		return {
			auths: auths,
			roles: roles
		};
	};

	self.parseAuths = function(graph) {
		var auths = {};

		graph.match(null, rdf.ns.type, ns.Authorization).forEach(function(t) {
			auths[t.subject.valueOf()] = self.parseAuth(graph, t.subject);
		});

		return auths;
	};

	self.parseAuth = function(graph, iri) {
		var auth = self.parseRole(graph, iri);

		auth.agent = matchObjectValues(graph, iri, ns.agent);
		auth.application = matchObjectValues(graph, iri, ns.application);

		return auth;
	};

	self.parseRoles = function(graph) {
		var roles = {};

		graph.match(null, rdf.ns.type, ns.Role).forEach(function(t) {
			roles[t.subject.valueOf()] = self.parseRole(graph, t.subject);
		});

		return roles;
	};

	self.parseRole = function(graph, iri) {
		var role = {};

		role.access = self.parseAccess(graph, iri);
		role.graph = matchObjectValues(graph, iri, ns.graph);
		role.hasRole = matchObjectValues(graph, iri, ns.hasRole);
		role.subject = matchObjectValues(graph, iri, ns.subject);

		return role;
	};

	self.parseAccess = function(graph, iri) {
		var access = [];

		graph.match(iri, ns.access).forEach(function(t) {
			access.push(self.parseTripleAuth(graph, t.object));
		});

		return access;
	};

	self.parseTripleAuth = function(graph, iri) {
		var tripleAuth = {};

		tripleAuth.children = self.parseChildren(graph, iri);
		tripleAuth.filter = self.parseFilters(graph, iri);
		tripleAuth.mode = matchObjectValues(graph, iri, ns.mode);
		tripleAuth.required = matchObjectValue(graph, iri, ns.required);

		return tripleAuth;
	};

	self.parseChildren = function(graph, iri) {
		var children = [];

		graph.match(iri, ns.children).forEach(function(t) {
			children = children.concat(self.parseAccess(graph, t.object));
		});

		return children;
	};

	self.parseFilters = function(graph, iri) {
		var filters = [];

		graph.match(iri, ns.filter).forEach(function(t) {
			graph.match(t.object, rdf.ns.type, ns.SimpleFilter).forEach(function(t) {
				filters.push(self.parseSimpleFilter(graph, t.subject));
			});

			//TODO: ns.VariableFilter
			//TODO: handle variables in access control
		});

		return filters;
	};

	self.parseSimpleFilter = function(graph, iri) {
		var s = matchObjects(graph, iri, ns.subject);
		var p = matchObjects(graph, iri, ns.predicate);
		var o = matchObjects(graph, iri, ns.object);

		return new filters.SimpleFilter(rdf, s, p, o);
	};
};


module.exports = Parser;