"use strict";

var db = module.parent.require('./database'),
	meta = module.parent.require('./meta'),
	user = module.parent.require('./user'),
	translator = module.parent.require('../public/src/translator'),

	winston = module.parent.require('winston'),
	nconf = module.parent.require('nconf'),
	async = module.parent.require('async'),
	request = module.parent.require('request'),
	S = module.parent.require('string'),
	querystring = require('querystring'),
	cache = require('lru-cache'),
	lang_cache = undefined,

	constants = Object.freeze({
		authorize_url: 'https://www.pushbullet.com/authorize',
		push_url: 'https://api.pushbullet.com/v2/pushes'
	}),

	Pushbullet = {};

Pushbullet.init = function(app, parent_middleware, controllers) {
	var middleware = require('./middleware');

	function render(req, res, next) {
		res.render('admin/plugins/pushbullet', {});
	}

	app.get('/admin/plugins/pushbullet', parent_middleware.admin.buildHeader, render);
	app.get('/api/admin/plugins/pushbullet', render);

	// Pushbullet-facing routes
	app.get('/pushbullet/setup', middleware.hasConfig, Pushbullet.redirectSetup);
	app.get('/pushbullet/auth', middleware.hasConfig, middleware.hasCode, middleware.isLoggedIn, Pushbullet.completeSetup);

	// Config set-up
	db.getObject('settings:pushbullet', function(err, config) {
		if (!err && config) {
			Pushbullet.config = config;
		} else {
			winston.info('[plugins/pushbullet] Please complete setup at `/admin/pushbullet`');
		}
	});

	// User language cache
	db.sortedSetCard('users:postcount', function(err, numUsers) {
		var	cacheOpts = {
				max: 50,
				maxAge: 1000 * 60 * 60 * 24
			};

		if (!err && numUsers > 0) cacheOpts.max = Math.floor(numUsers / 20);
		lang_cache = cache(cacheOpts);
	});
};

Pushbullet.redirectSetup = function(req, res) {
	var qs = querystring.stringify({
			client_id: Pushbullet.config.id,
			redirect_uri: encodeURIComponent(nconf.get('url') + '/pushbullet/auth'),
			response_type: 'code'
		});

	res.redirect(constants.authorize_url + '?' + qs);
};

Pushbullet.completeSetup = function(req, res) {
	async.waterfall([
		function(next) {
			Pushbullet.retrieveToken(req.query.code, next);
		},
		function(token, next) {
			Pushbullet.saveToken(req.user.uid, token, next);
		}
	], function(err) {
		res.send(err ? 500 : 200, err ? err.message : 'done!');
	});
};

Pushbullet.push = function(notifObj) {
	// Determine whether the user will receive notifications via Pushbullet
	db.getObjectField('pushbullet:tokens', notifObj.uid, function(err, token) {
		if (token) {
			async.waterfall([
				function(next) {
					Pushbullet.getUserLanguage(notifObj.uid, next);
				},
				function(lang, next) {
					translator.translate(notifObj.text, lang, function(translated) {
						next(undefined, S(translated).stripTags().s);
					});
				},
				function(body, next) {
					var	payload = {
						type: 'link',
						title: 'New Notification from ' + (meta.config.title || 'NodeBB'),
						url: nconf.get('url') + notifObj.path,
						body: body
					}
					request.post(constants.push_url, {
						form: payload,
						auth: {
							user: token
						}
					}, function(err, request, result) {
						if (err) {
							winston.error(err);
						} else if (result.length) {
							try {
								result = JSON.parse(result);
								if (result.error) {
									winston.error('[plugins/pushbullet] ' + result.error.message + '(' + result.error.type + ')');
								}
							} catch (e) {
								winston.error(e);
							}
						}
					});
				}
			]);
		}
	});
};

Pushbullet.addMenuItem = function(custom_header, callback) {
	custom_header.plugins.push({
		"route": '/plugins/pushbullet',
		"icon": 'fa-mobile',
		"name": 'Pushbullet'
	});

	callback(null, custom_header);
}

Pushbullet.retrieveToken = function(code, callback) {
	request.post('https://api.pushbullet.com/oauth2/token', {
		form: {
			grant_type: 'authorization_code',
			client_id: Pushbullet.config.id,
			client_secret: Pushbullet.config.secret,
			code: code
		}
	}, function(err, request, response) {
		if (!err && response.length) {
			try {
				response = JSON.parse(response);
				callback(undefined, response.access_token);
			} catch (err) {
				callback(err);
			}
			
		} else {
			callback(err || new Error(response.error.type));
		}
	});
};

Pushbullet.saveToken = function(uid, token, callback) {
	db.setObjectField('pushbullet:tokens', uid, token, callback);
};

Pushbullet.getUserLanguage = function(uid, callback) {
	if (lang_cache.has(uid)) {
		callback(null, lang_cache.get(uid));
	} else {
		user.getSettings(uid, function(err, settings) {
			callback(null, 'en_GB');
			// cache.set(uid, settings.defaultLang);
		});
	}
}

module.exports = Pushbullet;