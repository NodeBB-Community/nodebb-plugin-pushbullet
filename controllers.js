var Pushbullet = require('./library'),
	meta = module.parent.parent.require('./meta'),

	Controllers = {};

Controllers.renderACP = function(req, res) {
	res.render('admin/plugins/pushbullet', {});
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