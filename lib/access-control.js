var filters = require('./filters.js');
var ns = require('./namespace.js');


var AccessControl = function(rdf, options) {
	var self = this;

	if(options == null)
		options = {};

	self.auths = typeof options.auths !== 'undefined' ? options.auths : [];
	self.roles = typeof options.roles !== 'undefined' ? options.roles : [];

	var unique = function() {
		var array = [];

		for(var i=0; i<arguments.length; i++) {
			array = array.concat(arguments[i]);
		};

		return array.filter(function(element, position) {
			return array.indexOf(element) == position;
		});
	};

	var graphObjects = function(graph) {
		var objects = [];

		graph.forEach(function(triple) {
			objects.push(triple.object);
		});

		return unique(objects);
	};

	var assignedRoleIris = function(role) {
		var iris = [];

		for(var i=0; i<role.hasRole.length; i++) {
			var iri = role.hasRole[i];

			iris.push(iri);
			iris = iris.concat(assignedRoleIris(self.roles[iri]));
		};

		return iris;
	};

	var accessSubgraph = function(access, graph, mode, subjects) {
		var granted = rdf.createGraph();
		var subjectFilter = subjects != null ? new filters.SimpleFilter(rdf, subjects, [], []) : null;

		access.forEach(function(subAccess) {
			var grantTriples = (subAccess.mode.indexOf(mode) >= 0);

			var currentGranted = rdf.createGraph();
			var intermediate = rdf.createGraph();

			subAccess.filter.forEach(function(currentFilter) {
				if(subjectFilter != null)
					currentFilter = new filters.AndFilter(rdf, [subjectFilter, currentFilter]);

				var filtered = graph.filter(currentFilter.filter)

				if(grantTriples)
					currentGranted.addAll(filtered);
				else
					intermediate.addAll(filtered);
			});

			var children = subAccess.children;

			if(children.length > 0) {
				var newSubjects = unique(
					graphObjects(currentGranted),
					graphObjects(intermediate));

				//TODO: check required flag
				if(newSubjects.length > 0)
					currentGranted.addAll(accessSubgraph(children, graph, mode, newSubjects));
			}

			granted.addAll(currentGranted);
		});

		return granted;
	};

	var subgraph = function(graphIri, graph, mode, agent, application) {
		var granted = rdf.createGraph();

		for(s in self.auths) {
			var auth = self.auths[s];

			//TODO: use cache map agent -> auths/roles
			//TODO: use function assignedAgentIris / allow multiple agents
			if(auth.agent.indexOf(agent) < 0)
				continue;

			granted.addAll(accessSubgraph(auth.access, graph, mode));

			var roleIris = assignedRoleIris(auth);

			for(var i=0; i<roleIris.length; i++) {
				var role = self.roles[roleIris[i]];

				granted.addAll(accessSubgraph(role.access, graph, mode));
			}
		}

		return granted;
	};


	this.hasReadAccess = function(iri, current, requested, agent, application, callback) {
		//TODO: cache subgraph + clearCache(graphIri) function
		var granted = subgraph(iri, current, ns.Read, agent, application);

		// expect everything was requested if no graph was given
		if(requested == null)
			return callback(granted);

		callback(granted.intersection(requested));
	};


	this.hasWriteAccess = function(iri, current, requested, agent, application, callback) {
		var full = current.merge(requested);
		var granted = subgraph(iri, full, ns.Write, agent, application);
		var intersected = granted.intersection(requested);

		if(intersected.toArray().length != requested.toArray().length)
			return callback(rdf.createGraph());

		callback(intersected);
	};


	this.hasDeleteAccess = function(iri, current, requested, agent, application, callback) {
		//TODO: check if this works!
		var granted = subgraph(iri, requested, ns.Write, agent, application);

		if(granted.toArray().length != requested.toArray().length)
			return callback(rdf.createGraph());

		callback(granted);
	};
};


module.exports = AccessControl;