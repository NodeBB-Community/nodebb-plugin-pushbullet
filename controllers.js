var Pushbullet = require('./library'),
	meta = module.parent.parent.require('./meta'),

	Controllers = {};

Controllers.renderACP = function(req, res) {
	Pushbullet.getAssociatedUsers(function(err, users) {
		res.render('admin/plugins/pushbullet', {
			users: users,
			numAssoc: users.length
		});
	});
};

Controllers.renderAuthSuccess = function(req, res) {
	res.render('pushbullet/assocSuccess');
};

Controllers.renderSettings = function(req, res) {
	res.render('pushbullet/settings', {
		"site_title": meta.config.title || meta.config.browserTitle || 'NodeBB',
		setupRequired: res.locals.setupRequired
	});
};

module.exports = Controllers;