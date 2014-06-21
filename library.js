"use strict";

var db = module.parent.require('./database'),
	meta = module.parent.require('./meta'),
	user = module.parent.require('./user'),
	translator = module.parent.require('../public/src/translator'),
	SocketPlugins = module.parent.require('./socket.io/plugins'),

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

Pushbullet.init = function(app, middleware, controllers) {
	var pluginMiddleware = require('./middleware'),
		pluginControllers = require('./controllers');

	// Admin setup routes
	app.get('/admin/plugins/pushbullet', middleware.admin.buildHeader, pluginControllers.renderACP);
	app.get('/api/admin/plugins/pushbullet', pluginControllers.renderACP);

	// Pushbullet-facing routes
	app.get('/pushbullet/setup', pluginMiddleware.hasConfig, Pushbullet.redirectSetup);
	app.get('/api/pushbullet/setup', function(req, res) {
		res.json(200, {});
	});
	app.get('/pushbullet/auth', pluginMiddleware.hasConfig, pluginMiddleware.hasCode, pluginMiddleware.isLoggedIn, Pushbullet.completeSetup, middleware.buildHeader, pluginControllers.renderAuthSuccess);
	// app.get('/user/:userslug/pushbullet', middleware.buildHeader, middleware.checkGlobalPrivacySettings, middleware.checkAccountPermissions, pluginControllers.renderSettings);
	// app.get('/api/user/:userslug/pushbullet', middleware.checkGlobalPrivacySettings, middleware.checkAccountPermissions, pluginControllers.renderSettings);
	app.get('/pushbullet/settings', middleware.buildHeader, pluginMiddleware.setupRequired, pluginControllers.renderSettings);
	app.get('/api/pushbullet/settings', pluginMiddleware.isLoggedIn, pluginMiddleware.setupRequired, pluginControllers.renderSettings);

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

	// WebSocket listeners
	SocketPlugins.pushbullet = {
		settings: {
			save: Pushbullet.settings.save,
			load: Pushbullet.settings.load
		},
		disassociate: Pushbullet.disassociate
	};
};

Pushbullet.redirectSetup = function(req, res) {
	var qs = querystring.stringify({
			client_id: Pushbullet.config.id,
			redirect_uri: encodeURIComponent(nconf.get('url') + '/pushbullet/auth'),
			response_type: 'code'
		});

	res.redirect(constants.authorize_url + '?' + qs);
};

Pushbullet.completeSetup = function(req, res, next) {
	async.waterfall([
		function(next) {
			Pushbullet.retrieveToken(req.query.code, next);
		},
		function(token, next) {
			Pushbullet.saveToken(req.user.uid, token, next);
		}
	], next);
};

Pushbullet.disassociate = function(socket, data, callback) {
	if (socket.uid) {
		db.deleteObjectField('pushbullet:tokens', socket.uid, callback);
	} else {
		callback(new Error('[[error:not-logged-in]]'));
	}
};

Pushbullet.push = function(notifObj) {
	// Determine whether the user will receive notifications via Pushbullet
	async.parallel({
		token: async.apply(db.getObjectField, 'pushbullet:tokens', notifObj.uid),
		enabled: async.apply(db.getObjectField, 'user:' + notifObj.uid + ':settings', 'pushbullet:enabled')
	}, function(err, results) {
		if (!err && results) {
			if (results.token && parseInt(results.enabled, 10) !== 0) {
				async.waterfall([
					function(next) {
						Pushbullet.getUserLanguage(notifObj.uid, next);
					},
					function(lang, next) {
						notifObj.bodyLong = S(notifObj.bodyLong).unescapeHTML().stripTags().s;
						translator.translate(notifObj.bodyShort, lang, function(translated) {
							next(undefined, S(translated).stripTags().s);
						});
					},
					function(title, next) {
						var	payload = {
								type: 'link',
								title: title,
								url: nconf.get('url') + notifObj.path,
								body: notifObj.bodyLong
							};

						request.post(constants.push_url, {
							form: payload,
							auth: {
								user: results.token
							}
						}, function(err, request, result) {
							if (err) {
								winston.error('[plugins/pushbullet] ' + err.message);
							} else if (result.length) {
								try {
									result = JSON.parse(result);
									if (result.hasOwnProperty('error') && result.error.type === 'invalid_user') {
										winston.info('[plugins/pushbullet] uid ' + notifObj.uid + ' has disassociated, removing token.');
										Pushbullet.disassociate({
											uid: notifObj.uid
										});
									} else if (result.hasOwnProperty('error')) {
										winston.error('[plugins/pushbullet] ' + result.error.message + ' (' + result.error.type + ')');
									}
								} catch (e) {
									winston.error('[plugins/pushbullet] ' + e);
								}
							}
						});
					}
				]);
			}
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
};

Pushbullet.addProfileItem = function(links, callback) {
	if (Pushbullet.config && Pushbullet.config.id && Pushbullet.config.secret) {
		links.push({
			id: 'pushbullet',
			route: '../../pushbullet/settings',
			icon: 'fa-mobile',
			name: 'Pushbullet',
			public: false
		});
	}

	callback(null, links);
};

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
			var language = settings.language || meta.config.defaultLang || 'en_GB';
			callback(null, language);
			lang_cache.set(uid, language);
		});
	}
};

Pushbullet.isUserAssociated = function(uid, callback) {
	db.isObjectField('pushbullet:tokens', uid, callback);
};

/* Settings */
Pushbullet.settings = {};

Pushbullet.settings.save = function(socket, data, callback) {
	if (socket.hasOwnProperty('uid') && socket.uid > 0) {
		db.setObject('user:' + socket.uid + ':settings', data, callback);
	} else {
		callback(new Error('not-logged-in'));
	}
};

Pushbullet.settings.load = function(socket, data, callback) {
	if (socket.hasOwnProperty('uid') && socket.uid > 0) {
		db.getObjectFields('user:' + socket.uid + ':settings', ['pushbullet:enabled'], callback);
	} else {
		callback(new Error('not-logged-in'));
	}
};

module.exports = Pushbullet;