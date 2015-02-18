"use strict";
/* globals define, socket, app */

define('forum/pushbullet/settings', ['vendor/jquery/serializeObject/jquery.ba-serializeobject.min'], function() {
	var Settings = {};

	Settings.init = function() {
		socket.emit('plugins.pushbullet.settings.load', function(err, settings) {
			var	defaults = {
					'pushbullet:enabled': 1
				};

			for(var key in defaults) {
				if (defaults.hasOwnProperty(key)) {
					if (settings[key] === null) {
						settings[key] = defaults[key];
					}
				}
			}

			// Load settings
			$('.pushbullet-settings #enabled').prop('checked', parseInt(settings['pushbullet:enabled'], 10) === 1);
			$('.pushbullet-settings #target').val(settings['pushbullet:target']);
		});

		$('#save').on('click', function() {
			var settings = $('.pushbullet-settings').serializeObject();
			settings['pushbullet:enabled'] = settings['pushbullet:enabled'] === 'on' ? 1 : 0;

			socket.emit('plugins.pushbullet.settings.save', settings, function(err) {
				if (!err) {
					app.alertSuccess('[[user:profile_update_success]]');
				} else {
					app.alertError(err.message || '[[error:invalid-data]]');
				}
			});
		});

		$('#test').on('click', function() {
			socket.emit('plugins.pushbullet.test', function(err) {
				if (!err) { app.alertSuccess('Test notification sent'); }
				else { app.alertError(err.message); }
			});
		});

		$('#disassociate').on('click', Settings.disassociate);
	};

	Settings.disassociate = function() {
		socket.emit('plugins.pushbullet.disassociate', {}, function(err) {
			if (!err) {
				window.location.reload();
			} else {
				app.alertError(err.message || '[[error:invalid-data]]');
			}
		});
	};

	return Settings;
});