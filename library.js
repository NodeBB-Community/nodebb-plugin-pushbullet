"use strict";

var db = module.parent.require('./database'),
	meta = module.parent.require('./meta'),
	user = module.parent.require('./user'),
	posts = module.parent.require('./posts'),
	topics = module.parent.require('./topics'),
	translator = module.parent.require('../public/src/modules/translator'),
	SocketPlugins = module.parent.require('./socket.io/plugins'),
	globalMiddleware = module.parent.require('./middleware'),

	winston = module.parent.require('winston'),
	nconf = module.parent.require('nconf'),
	async = module.parent.require('async'),
	request = module.parent.require('request'),
	S = module.parent.require('string'),
	querystring = require('querystring'),
	path = require('path'),
	cache = require('lru-cache'),
	url = require('url'),

	constants = Object.freeze({
		authorize_url: 'https://www.onesignal.com/authorize',
		push_url: 'https://onesignal.com/api/v1/notifications'
	}),

	onesignal = {};

onesignal.init = function(data, callback) {
	var pluginMiddleware = require('./middleware')(data.middleware),
		pluginControllers = require('./controllers');

	// Admin setup routes
	data.router.get('/admin/plugins/onesignal', data.middleware.admin.buildHeader, pluginControllers.renderACP);
	data.router.get('/api/admin/plugins/onesignal', pluginControllers.renderACP);

	// User routes
	data.router.get('/onesignal/settings', pluginMiddleware.hasConfig, globalMiddleware.authenticate,pluginMiddleware.setupRequired, data.middleware.buildHeader, pluginControllers.renderSettings);
	data.router.get('/api/me/onesignal/devices', globalMiddleware.authenticate, pluginMiddleware.isLoggedIn, pluginControllers.getPlayerIds);
    data.router.post('/api/me/onesignal/devices', globalMiddleware.authenticate, pluginMiddleware.isLoggedIn, pluginMiddleware.addDevice, pluginControllers.getPlayerIds);
	
	// Config set-up
	db.getObject('settings:onesignal', function(err, config) {
		if (!err && config) {
			onesignal.config = config;
		} else {
			winston.info('[plugins/onesignal] Please complete setup at `/admin/onesignal`');
		}
	});

	// WebSocket listeners
	SocketPlugins.onesignal = {
		settings: {
			save: onesignal.settings.save,
			load: onesignal.settings.load
		},
		disassociate: onesignal.disassociate,
		test: onesignal.test
	};

	callback();
};

onesignal.redirectSetup = function(req, res) {
	var qs = querystring.stringify({
			client_id: onesignal.config.id,
			redirect_uri: url.resolve(nconf.get('url'), '/onesignal/auth'),
			response_type: 'code'
		});

	if (process.env.NODE_ENV === 'development') {
		winston.info('[plugins/onesignal] New association, redirecting user to: ' + constants.authorize_url + '?' + qs);
	}

	res.redirect(constants.authorize_url + '?' + qs);
};

onesignal.completeSetup = function(req, res, next) {
	async.waterfall([
		function(next) {
			onesignal.retrieveToken(req.query.code, next);
		},
		function(token, next) {
			onesignal.saveToken(req.user.uid, token, next);
		}
	], next);
};

onesignal.disassociate = function(socket, data, callback) {
	if (socket.uid) {
		db.deleteObjectField('users:onesignal:players', socket.uid, callback);
	} else {
		callback(new Error('[[error:not-logged-in]]'));
	}
};

onesignal.test = function(socket, data, callback) {
	if (socket.uid) {
		onesignal.push({
			notification: {
				path: nconf.get('relative_path') + '/',
				bodyShort: 'Test Notification',
				bodyLong: 'If you have received this, then OneSignal is now working!'
			},
			uids: [socket.uid]
		});
		callback();
	} else {
		callback(new Error('[[error:not-logged-in]]'));
	}
};

onesignal.push = function(data) {
	var notifObj = data.notification;
	var uids = data.uids;

	if (!Array.isArray(uids) || !uids.length || !notifObj) {
		return;
	}

	var settingsKeys = uids.map(function(uid) {
		return 'user:' + uid + ':settings';
	});

	async.parallel({
		players: async.apply(db.getObjectFields, 'users:onesignal:players', uids),
		settings: async.apply(db.getObjectsFields, settingsKeys, ['onesignal:enabled', 'topicPostSort', 'language']),
		app_id: async.apply(db.getObjectField,'settings:onesignal', 'id')
	}, function(err, results) {
		if (err) {
			return winston.error(err.stack);
		}

		if (results.hasOwnProperty('players')) {
			uids.forEach(function(uid, index) {
				if (!results.players[uid] || !results.settings[index]) {
					return;
				}
				if (results.settings[index]['onesignal:enabled'] === null || parseInt(results.settings[index]['onesignal:enabled'], 10) === 1) {
					pushToUid(uid, notifObj, results.players[uid], results.settings[index], results.app_id);
				}
			});
		}
	});
};

function pushToUid(uid, notifObj, players, settings, app_id) {
	if (!players) {
		return;
	}

	if (notifObj.hasOwnProperty('path')) {
		var urlObj = url.parse(notifObj.path, false, true);
		if (!urlObj.host && !urlObj.hostname) {
			// This is a relative path
			notifObj.path = url.resolve(nconf.get('url') + '/', notifObj.path);
		}
	}

	async.waterfall([
		function(next) {
			var language = settings.language || meta.config.defaultLang || 'en-GB',
				topicPostSort = settings.topicPostSort || meta.config.topicPostSort || 'oldest_to_newest';

			notifObj.bodyLong = notifObj.bodyLong || '';
			notifObj.bodyLong = S(notifObj.bodyLong).unescapeHTML().stripTags().unescapeHTML().s;
			async.parallel({
				title: async.apply(topics.getTopicFieldByPid, 'title', notifObj.pid),
				text: function(next) {
					translator.translate(notifObj.bodyShort, language, function(translated) {
						next(undefined, S(translated).stripTags().s);
			 		});
				},
				postIndex: function(next) {
					posts.getPostField(notifObj.pid, 'tid', function(err, tid) {
						if (err) {
							return next(err);
						}
						posts.getPidIndex(notifObj.pid, tid, topicPostSort, next);
					});
				},
				topicSlug: async.apply(topics.getTopicFieldByPid, 'slug', notifObj.pid)
			}, next);
		},
		function(data, next) {
			var	payload = {
					app_id: app_id,
					headings: {'en' : data.title ? data.title : ""} ,
					contents: {'en': data.text },
                	include_player_ids: JSON.parse(players),
					url: notifObj.path || nconf.get('url') + '/topic/' + data.topicSlug + '/' + data.postIndex,
				};

			winston.verbose('[plugins/onesignal] Sending push notification to uid ' + uid);
			request.post(constants.push_url, {
				json: payload
			}, function(err, request, result) {
				if (err) {
					winston.error('[plugins/onesignal] ' + err.message);
				} else if (result) {
					try {
						if (result.hasOwnProperty('errors')) {
                            result.errors.forEach(function(err){
                                winston.error('[plugins/onesignal] ' + err);
                            });
						}
					} catch (e) {
						winston.error('[plugins/onesignal] ' + e);
					}
				}
			});
		}
	]);
}

onesignal.addMenuItem = function(custom_header, callback) {
	custom_header.plugins.push({
		"route": '/plugins/onesignal',
		"icon": 'fa-mobile',
		"name": 'OneSignal'
	});

	callback(null, custom_header);
};

onesignal.addProfileItem = function(data, callback) {
	if (onesignal.config && onesignal.config.id && onesignal.config.secret) {
		data.links.push({
			id: 'onesignal',
			route: '../../onesignal/settings',
			icon: 'fa-mobile',
			name: 'OneSignal',
			public: false
		});
	}

	callback(null, data);
};

onesignal.savePlayerId = function(uid, playerId, callback) {

	async.waterfall([
		function(next){
        	db.isObjectField('users:onesignal:players', uid, next);
		},
		function(exists, next){
			if(exists){
                onesignal.getPlayerIds(uid,next);
			}else{
				next(null,JSON.stringify([]));
			}
		},
		function(playersData, next){
			var players = new Set(JSON.parse(playersData));
			players.add(playerId);
			db.setObjectField('users:onesignal:players', uid,JSON.stringify([...players]),next);
		}],
		callback);
};

onesignal.getPlayerIds = function(uid, callback) {
    db.getObjectField('users:onesignal:players', uid, callback);
};

onesignal.getUserDevices = function(uid, callback) {
	async.parallel({
		players: async.apply(db.getObjectField, 'users:onesignal:players', uid)
	}, function(err, results) {
		if (results.players) {
			callback(null, JSON.parse(results.players));
		} else {
			callback(null, []);
		}
	});
};

onesignal.isUserAssociated = function(uid, callback) {
	db.isObjectField('users:onesignal:players', uid, callback);
};

onesignal.getAssociatedUsers = function(callback) {
	db.getObjectKeys('users:onesignal:players', function(err, uids) {
		if (!err) {
			user.getMultipleUserFields(uids, ['username', 'picture'], callback);
		} else {
			callback(err);
		}
	});
};

/* Settings */
onesignal.settings = {};

onesignal.settings.save = function(socket, data, callback) {
	if (socket.hasOwnProperty('uid') && socket.uid > 0) {
		db.setObject('user:' + socket.uid + ':settings', data, callback);
	} else {
		callback(new Error('not-logged-in'));
	}
};

onesignal.settings.load = function(socket, data, callback) {
	if (socket.hasOwnProperty('uid') && socket.uid > 0) {
		db.getObjectFields('user:' + socket.uid + ':settings', ['onesignal:enabled', 'onesignal:target'], callback);
	} else {
		callback(new Error('not-logged-in'));
	}
};

module.exports = onesignal;
