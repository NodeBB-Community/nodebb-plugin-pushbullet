'use strict';

/*
	This file is located in the "modules" block of plugin.json
	It is only loaded when the user navigates to /admin/plugins/quickstart page
	It is not bundled into the min file that is served on the first load of the page.
*/
define('admin/plugins/pushbullet', ['settings'], function (settings) {
	var ACP = {};

	ACP.init = function () {
		$('#save').on('click', saveSettings);
	};

	function saveSettings() {
		settings.save('pushbullet', $('.pushbullet-settings'), function() {
			app.alert({
				type: 'success',
				alert_id: 'pushbullet-saved',
				title: 'Reload Required',
				message: 'Please reload your NodeBB to complete configuration of the Pushbullet plugin',
				clickfn: function() {
					socket.emit('admin.reload');
				}
			})
		});
	}

	return ACP;
});
