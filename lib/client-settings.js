"use strict";
/* globals define, socket, app */

define('forum/onesignal/settings', ['vendor/jquery/serializeObject/jquery.ba-serializeobject.min'], function() {
	var Settings = {};

	Settings.init = function() {
		socket.emit('plugins.onesignal.settings.load', function(err, settings) {
			var	defaults = {
					'onesignal:enabled': 1
				};

			for(var key in defaults) {
				if (defaults.hasOwnProperty(key)) {
					if (settings[key] === null) {
						settings[key] = defaults[key];
					}
				}
			}

			// Load settings
			$('.onesignal-settings #enabled').prop('checked', parseInt(settings['onesignal:enabled'], 10) === 1);
			$('.onesignal-settings #target').val(settings['onesignal:target']);
		});

		$('#save').on('click', function() {
			var settings = $('.onesignal-settings').serializeObject();
			settings['onesignal:enabled'] = settings['onesignal:enabled'] === 'on' ? 1 : 0;

			socket.emit('plugins.onesignal.settings.save', settings, function(err) {
				if (!err) {
					app.alertSuccess('[[user:profile_update_success]]');
				} else {
					app.alertError(err.message || '[[error:invalid-data]]');
				}
			});
		});

		$('#test').on('click', function() {
			socket.emit('plugins.onesignal.test', function(err) {
				if (!err) { app.alertSuccess('Test notification sent'); }
				else { app.alertError(err.message); }
			});
		});

		$('#disassociate').on('click', Settings.disassociate);
	};

	Settings.disassociate = function() {
		socket.emit('plugins.onesignal.disassociate', {}, function(err) {
			if (!err) {
				window.location.reload();
			} else {
				app.alertError(err.message || '[[error:invalid-data]]');
			}
		});
	};

	return Settings;
});