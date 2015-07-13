<div class="row pushbullet">
	<div class="col-lg-9">
		<div class="panel panel-default">
			<div class="panel-heading"><i class="fa fa-mobile"></i> Pushbullet Notifications</div>
			<div class="panel-body">
				<p class="lead">
					Allows NodeBB to interface with the Pushbullet service in order to provide push notifications to user mobile phones.
				</p>

				<ol>
					<li>Install and activate this plugin.</li>
					<li>
						<a href="https://www.pushbullet.com/#settings/clients">Register an application via the Pushbullet website</a>, and obtain a client key and secret.<br />
						<p class="help-block">
							In particular, the <code>redirect_uri</code> should be your forum's URL with <code>/pushbullet/auth</code> appended to it (e.g. <code>{url}/pushbullet/auth</code>)
						</p>
					</li>
					<li>Enter the client key and secret into the configuration block below, and save.</li>
					<li>Reload NodeBB.</li>
				</ol>

				<div class="row">
					<div class="col-sm-6 well">
						<form class="form pushbullet-settings">
							<div class="form-group">
								<label for="id">Client ID</label>
								<input type="text" class="form-control" id="id" name="id" />
							</div>
							<div class="form-group">
								<label for="secret">Client Secret</label>
								<input type="text" class="form-control" id="secret" name="secret" />
							</div>
						</form>
					</div>
					<div class="col-sm-6">
						<div class="panel panel-default">
							<div class="panel-heading">
								Users Associated with Pushbullet <span class="label label-info">{numAssoc}</span>
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
			<div class="panel-heading">Pushbullet Control Panel</div>
			<div class="panel-body">
				<button class="btn btn-primary" id="save">Save Settings</button>
			</div>
		</div>
	</div>
</div>

<script type="text/javascript">
	require(['settings'], function(Settings) {
		Settings.load('pushbullet', $('.pushbullet-settings'));

		$('#save').on('click', function() {
			Settings.save('pushbullet', $('.pushbullet-settings'), function() {
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
		});
	});
</script>