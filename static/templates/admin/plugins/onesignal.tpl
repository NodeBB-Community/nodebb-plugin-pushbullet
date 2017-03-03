<div class="row onesignal">
	<div class="col-lg-9">
		<div class="panel panel-default">
			<div class="panel-heading"><i class="fa fa-mobile"></i> OneSignal Notifications</div>
			<div class="panel-body">
				<p class="lead">
					Allows NodeBB to interface with the OneSignal service in order to provide push notifications to OneSignal applications.
				</p>

				<ol>
					<li>Install and activate this plugin.</li>
					<li>
						<a href="https://onesignal.com/">Register an application via the OneSignal website</a>, and obtain a REST API key.<br />
					</li>
					<li>Enter the REST API key into the configuration block below, and save.</li>
					<li>Reload NodeBB.</li>
				</ol>

				<div class="row">
					<div class="col-sm-6 well">
						<form class="form onesignal-settings">
							<div class="form-group">
								<label for="secret">REST API Key</label>
								<input type="text" class="form-control" id="secret" name="secret" />
							</div>
							<div class="form-group">
								<label for="id">Application ID</label>
								<input type="text" class="form-control" id="id" name="id" />
							</div>
						</form>
					</div>
					<div class="col-sm-6">
						<div class="panel panel-default">
							<div class="panel-heading">
								Users Associated with OneSignal <span class="label label-info">{numAssoc}</span>
							</div>
							<div class="panel-body">
								<ul class="users">
									<!-- BEGIN users -->
									<li>
										<img src="{users.picture}" title="{users.username}" />
									</li>
									<!-- END users -->
								</ul>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
	<div class="col-lg-3">
		<div class="panel panel-default">
			<div class="panel-heading">OneSignal Control Panel</div>
			<div class="panel-body">
				<button class="btn btn-primary" id="save">Save Settings</button>
			</div>
		</div>
	</div>
</div>

<script type="text/javascript">
	require(['settings'], function(Settings) {
		Settings.load('onesignal', $('.onesignal-settings'));

		$('#save').on('click', function() {
			Settings.save('onesignal', $('.onesignal-settings'), function() {
				app.alert({
					type: 'success',
					alert_id: 'onesignal-saved',
					title: 'Reload Required',
					message: 'Please reload your NodeBB to complete configuration of the OneSignal plugin',
					clickfn: function() {
						socket.emit('admin.reload');
					}
				})
			});
		});
	});
</script>