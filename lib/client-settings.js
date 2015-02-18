"use strict";

define('forum/pushbullet/settings', function() {
	var Settings = {};

	Settings.init = function() {
		socket.emit('plugins.pushbullet.settings.load', function(err, settings) {
			var	defaults = {
					'pushbullet:enabled': 'true'
				};

			for(var key in defaults) {
				if (defaults.hasOwnProperty(key)) {
					if (settings[key] === null) {
						settings[key] = defaults[key];
					}
				}
			}

			// Load settings
			$('.pushbullet-settings #enabled').prop('checked', (settings['pushbullet:enabled'] === 'true' || settings['pushbullet:enabled'] === true));
			$('.pushbullet-settings #target').val(settings['pushbullet:target']);
		});

		$('#save').on('click', function() {
			var settings = {
				'pushbullet:enabled': $('.pushbullet-settings #enabled').prop('checked'),
				'pushbullet:target': $('.pushbullet-settings #target').val()
			};

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
