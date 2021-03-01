var Pushbullet = require('./library'),
	meta = require.main.require('./src/meta'),
	nconf = require.main.require('nconf'),

	Controllers = {};

Controllers.renderACP = function(req, res) {
	Pushbullet.getAssociatedUsers(function(err, users) {
		res.render('admin/plugins/pushbullet', {
			users: users,
			numAssoc: users.length,
			base_url: nconf.get('url').replace(/\/+$/, '')
		});
	});
};

Controllers.renderAuthSuccess = function(req, res) {
	res.render('pushbullet/assocSuccess');
};

Controllers.renderSettings = function(req, res) {
	Pushbullet.getUserDevices(req.user.uid, function(err, devices) {
		res.render('pushbullet/settings', {
			"site_title": meta.config.title || meta.config.browserTitle || 'NodeBB',
			setupRequired: res.locals.setupRequired,
			devices: devices
		});
	});
};

module.exports = Controllers;