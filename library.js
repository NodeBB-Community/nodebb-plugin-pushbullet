"use strict";

const url = require('url');
const querystring = require('querystring');
const striptags = require('striptags');
const escapeHtml = require('escape-html');
const unescapeHtml = require('unescape-html');

const winston = require.main.require('winston');
const nconf = require.main.require('nconf');
const async = require.main.require('async');
const request = require.main.require('request');

const db = require.main.require('./src/database');
const meta = require.main.require('./src/meta');
const user = require.main.require('./src/user');
const posts = require.main.require('./src/posts');
const topics = require.main.require('./src/topics');
const translator = require.main.require('./src/translator');
const SocketPlugins = require.main.require('./src/socket.io/plugins');

const constants = Object.freeze({
	authorize_url: 'https://www.pushbullet.com/authorize',
	push_url: 'https://api.pushbullet.com/v2/pushes'
});

const Pushbullet = module.exports;

Pushbullet.init = function(data, callback) {
	var pluginMiddleware = require('./middleware')(data.middleware),
		pluginControllers = require('./controllers');

	// Admin setup routes
	data.router.get('/admin/plugins/pushbullet', data.middleware.admin.buildHeader, pluginControllers.renderACP);
	data.router.get('/api/admin/plugins/pushbullet', pluginControllers.renderACP);

	// Pushbullet-facing routes
	data.router.get('/pushbullet/setup', pluginMiddleware.hasConfig, Pushbullet.redirectSetup);
	data.router.get('/api/pushbullet/setup', function(req, res) {
		res.status(200).json({});
	});
	data.router.get('/pushbullet/auth', pluginMiddleware.hasConfig, pluginMiddleware.hasCode, pluginMiddleware.isLoggedIn, Pushbullet.completeSetup, data.middleware.buildHeader, pluginControllers.renderAuthSuccess);
	data.router.get('/pushbullet/settings', data.middleware.buildHeader, pluginMiddleware.isLoggedIn, pluginMiddleware.setupRequired, pluginControllers.renderSettings);
	data.router.get('/api/pushbullet/settings', pluginMiddleware.isLoggedIn, pluginMiddleware.setupRequired, pluginControllers.renderSettings);

	// Config set-up
	db.getObject('settings:pushbullet', function(err, config) {
		if (!err && config) {
			Pushbullet.config = config;
		} else {
			winston.info('[plugins/pushbullet] Please complete setup at `/admin/pushbullet`');
		}
	});

	// WebSocket listeners
	SocketPlugins.pushbullet = {
		settings: {
			save: Pushbullet.settings.save,
			load: Pushbullet.settings.load
		},
		disassociate: Pushbullet.disassociate,
		test: Pushbullet.test
	};

	callback();
};

Pushbullet.redirectSetup = function(req, res) {
	var qs = querystring.stringify({
			client_id: Pushbullet.config.id,
			redirect_uri: url.resolve(nconf.get('url'), '/pushbullet/auth'),
			response_type: 'code'
		});

	if (process.env.NODE_ENV === 'development') {
		winston.info('[plugins/pushbullet] New association, redirecting user to: ' + constants.authorize_url + '?' + qs);
	}

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

Pushbullet.test = function(socket, data, callback) {
	if (socket.uid) {
		Pushbullet.push({
			notification: {
				path: nconf.get('relative_path') + '/',
				bodyShort: 'Test Notification',
				bodyLong: 'If you have received this, then Pushbullet is now working!'
			},
			uids: [socket.uid]
		});
		callback();
	} else {
		callback(new Error('[[error:not-logged-in]]'));
	}
};

Pushbullet.push = async function(data) {
	var notifObj = data.notification;
	var uids = data.uids;

	if (!Array.isArray(uids) || !uids.length || !notifObj) {
		return;
	}
	try {
		var settingsKeys = uids.map(uid => 'user:' + uid + ':settings');
		const [tokens, settings, title] = await Promise.all([
			db.getObjectFields('pushbullet:tokens', uids),
			db.getObjectsFields(settingsKeys, ['pushbullet:enabled', 'pushbullet:target', 'topicPostSort', 'language']),
			notifObj.pid ? topics.getTopicFieldByPid('title', notifObj.pid) : null,
		]);

		resolveNotificationPath(notifObj);

		notifObj.bodyLong = escapeHtml(striptags(unescapeHtml(notifObj.bodyLong || '')));

		uids.forEach(function(uid, index) {
			if (!tokens[uid] || !settings[index]) {
				return;
			}
			if (settings[index]['pushbullet:enabled'] === null || parseInt(settings[index]['pushbullet:enabled'], 10) === 1) {
				pushToUid(uid, notifObj, title, tokens[uid], settings[index]);
			}
		});
	} catch (err) {
		winston.error(err.stack);
	}
};

function resolveNotificationPath(notifObj) {
	if (notifObj.hasOwnProperty('path')) {
		var urlObj = url.parse(notifObj.path, false, true);
		if (!urlObj.host && !urlObj.hostname) {
			// This is a relative path
			if (notifObj.path.startsWith('/')) {
				notifObj.path = notifObj.path.slice(1);
			}
			notifObj.path = url.resolve(nconf.get('url') + '/', notifObj.path);
		}
	}
}

function pushToUid(uid, notifObj, title, token, settings) {
	if (!token) {
		return;
	}

	async.waterfall([
		function(next) {
			var language = settings.language || meta.config.defaultLang || 'en-GB';
			translator.translate(notifObj.bodyShort, language, function(translated) {
				next(null, striptags(translated));
			});
		},
		function(text, next) {
			var	payload = {
				device_iden: settings['pushbullet:target'] && settings['pushbullet:target'].length ? settings['pushbullet:target'] : null,
				type: 'link',
				title: title || text,
				url: notifObj.path || nconf.get('url') + '/post/' + notifObj.pid,
				body: title ? text : notifObj.bodyLong
			};

			winston.verbose('[plugins/pushbullet] Sending push notification to uid ' + uid);
			request.post(constants.push_url, {
				form: payload,
				auth: {
					user: token
				}
			}, function(err, request, result) {
				if (err) {
					winston.error('[plugins/pushbullet (uid: ' + uid  + ')] ' + err.message);
				} else if (result.length) {
					try {
						result = JSON.parse(result);
						if (result.hasOwnProperty('error') && result.error.type === 'invalid_user') {
							winston.info('[plugins/pushbullet] uid ' + uid + ' has disassociated, removing token.');
							Pushbullet.disassociate({
								uid: uid
							});
						} else if (result.hasOwnProperty('error')) {
							winston.error('[plugins/pushbullet (uid: ' + uid  + ')] ' + result.error.message + ' (' + result.error.type + ')');
						}
					} catch (e) {
						winston.error('[plugins/pushbullet (uid: ' + uid  + ')] ' + e);
					}
				}
			});
		}
	]);
}

Pushbullet.addMenuItem = function(custom_header, callback) {
	custom_header.plugins.push({
		"route": '/plugins/pushbullet',
		"icon": 'fa-mobile',
		"name": 'Pushbullet'
	});

	callback(null, custom_header);
};

Pushbullet.addProfileItem = function(data, callback) {
	if (Pushbullet.config && Pushbullet.config.id && Pushbullet.config.secret) {
		data.links.push({
			id: 'pushbullet',
			route: '../../pushbullet/settings',
			icon: 'fa-mobile',
			name: 'Pushbullet',
			visibility: {
				self: true,
				other: false,
				moderator: false,
				globalMod: false,
				admin: false,
			}
		});
	}

	callback(null, data);
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

Pushbullet.getUserDevices = function(uid, callback) {
	async.parallel({
		token: async.apply(db.getObjectField, 'pushbullet:tokens', uid),
		target: async.apply(db.getObjectField, 'user:' + uid + ':settings', 'pushbullet:target')
	}, function(err, results) {
		if (results.token) {
			request.get('https://api.pushbullet.com/v2/devices', {
				auth: {
					user: results.token
				}
			}, function(err, request, response) {
				if (!err && request.statusCode === 200) {
					try {
						response = JSON.parse(response);

						var devices = response.devices.map(function(device) {
								return {
									iden: device.iden,
									name: device.nickname || device.model
								};
							});

						callback(null, devices);
					} catch(e) {
						callback(null, []);
					}
				} else {
					callback(null, []);
				}
			});
		} else {
			callback(null, []);
		}
	});
};

Pushbullet.isUserAssociated = function(uid, callback) {
	db.isObjectField('pushbullet:tokens', uid, callback);
};

Pushbullet.getAssociatedUsers = function(callback) {
	db.getObjectKeys('pushbullet:tokens', function(err, uids) {
		if (!err) {
			user.getUsersFields(uids, ['username', 'picture'], callback);
		} else {
			callback(err);
		}
	});
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
		db.getObjectFields('user:' + socket.uid + ':settings', ['pushbullet:enabled', 'pushbullet:target'], callback);
	} else {
		callback(new Error('not-logged-in'));
	}
};
