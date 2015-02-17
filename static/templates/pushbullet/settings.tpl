<div class="row pushbullet settings">
	<div class="col-xs-12">
		<!-- IF !setupRequired -->
		<div class="panel panel-success">
			<div class="panel-body">
				<img class="pull-right" src="//www.pushbullet.com/img/header-logo.png" />
				<h1>Pushbullet Notification Settings</h1>
				<p class="lead">
					Customise your Pushbullet integration with <strong>{site_title}</strong> here.
				</p>

				<div class="row">
					<div class="col-sm-9">
						<div class="panel panel-default">
							<div class="panel-heading">
								<h2 class="panel-title">General Settings</h2>
							</div>
							<div class="panel-body">
								<form role="form" class="form pushbullet-settings">
									<div class="checkbox">
										<label for="enabled">
											<input id="enabled" type="checkbox" /> Enable Pushbullet Notifications
										</label>
									</div>
									<div class="form-group">
										<label for="target">Send notifications only to this device</label>
										<select class="form-control" id="target">
											<option value="">All associated devices</option>
											<!-- BEGIN devices -->
											<option value="{devices.iden}">{devices.name}</option>
											<!-- END devices -->
										</select>
									</div>
									<button type="button" class="btn btn-primary" id="save">Save Settings</button>
									<button type="button" class="btn btn-link" id="test">Send Test Notification</button>
								</form>
							</div>
						</div>
					</div>
					<div class="col-sm-3">
						<div class="panel panel-danger">
							<div class="panel-heading">
								<h2 class="panel-title">Disassociate</h2>
							</div>
							<div class="panel-body">
								<button type="button" class="btn btn-block btn-danger" id="disassociate">Disassociate with Pushbullet</button>
								<p>
									By disassociating with Pushbullet, your account will no longer be tied to your Pushbullet account.
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
		<!-- ELSE -->
		<div class="panel panel-default">
			<div class="panel-body text-center">
				<img src="//www.pushbullet.com/img/header-logo.png" />
				<p class="lead">
					This account is not currently associated with a Pushbullet account.
				</p>

				<p>
					<a class="btn btn-lg btn-primary" href="{relative_path}/pushbullet/setup">Associate account with Pushbullet</a>
				</p>

				<div class="store-buttons">
					<a href="https://play.google.com/store/apps/details?id=com.pushbullet.android">
						<img class="store" src="//pushbullet.com/img/frontpage/get-it-android.png" height="82px" width="240px">
					</a>
					<a href="https://itunes.apple.com/us/app/pushbullet/id810352052">
						<img class="store" src="//pushbullet.com/img/frontpage/get-it-iphone.png" height="82px" width="240px">
					</a>
				</div>
			</div>
		</div>
		<!-- ENDIF !setupRequired -->
	</div>
</div>