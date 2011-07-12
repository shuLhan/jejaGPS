var gmap_opts;
var gmap_use		= true;
var gmap_init_loc;
var gmap_loc_monas;
var gmap_support_flag	= new Boolean();
var gmap;
var gmap_markers	= [];
var gmap_circles	= [];
var gmap_polylines	= [];
var _g_id_gps		= "";

Ext.require([
	"Ext.Button"
,	"Ext.data.Store"
,	"Ext.form.ComboBox"
,	"Ext.grid.Panel"
]);

Ext.onReady(function() {
	/* form idgps: select gps by id */
	var store_idgps = Ext.create('Ext.data.Store', {
		fields	:['name']
	,	autoLoad:false
	,	proxy	:{
			type	:"ajax"
		,	url	:"data_idgps.py"
		,	reader	:{
				type	:"json"
			,	root	:"data"
			}
		}
	});

	var button_ref	= Ext.create("Ext.Button", {
		icon	:"js/extjs/resources/themes/images/default/grid/refresh.gif"
	,	handler	:function() {
			store_idgps.load();
			store_trail_load();
		}
	});

	var form_idgps		= Ext.create("Ext.form.ComboBox", {
		fieldLabel	:"GPS Name"
	,	labelAlign	:"right"
	,	store		:store_idgps
	,	queryMode	:"local"
	,	valueField	:"name"
	,	displayField	:"name"
	,	forceSelection	:true
	,	listeners	:{
			"select":function(form, value) {
				_g_id_gps = value[0].data.name;
				store_trail_load();
			}
		}
	});

/*
 * GPS date form filter
 */
	var form_date_after	= Ext.create("Ext.form.field.Date", {
		fieldLabel	:"Date"
	,	labelWidth	:60
	,	labelAlign	:"right"
	,	format		:"Y-m-d"
	});
	var form_time_after	= Ext.create("Ext.form.field.Time", {
		fieldLabel	:"Time"
	,	labelWidth	:60
	,	labelAlign	:"right"
	,	format		:"H:i"
	});

	var form_date_before	= Ext.create("Ext.form.field.Date", {
		fieldLabel	:"Date"
	,	labelWidth	:60
	,	labelAlign	:"right"
	,	format		:"Y-m-d"
	});
	var form_time_before	= Ext.create("Ext.form.field.Time", {
		fieldLabel	:"Time"
	,	labelWidth	:60
	,	labelAlign	:"right"
	,	format		:"H:i"
	});

	var fs_dt_after		= Ext.create("Ext.form.FieldSet", {
		title		:"After"
	,	items		:[
			form_date_after
		,	form_time_after
		]
	});

	var fs_dt_before	= Ext.create("Ext.form.FieldSet", {
		title		:"Before"
	,	items		:[
			form_date_before
		,	form_time_before
		]
	});

	var fs_dt_filter	= Ext.create("Ext.form.Panel", {
		title		:"Filter GPS Date"
	,	region		:"north"
	,	margin		:'5 0 0 0'
	,	bodyPadding	:5
	,	collapsible	:true
	,	collapsed	:true
	,	items		:[
			fs_dt_after
		,	fs_dt_before
		]
	});

	/* grid trail: display all trail data */
	var store_trail	= Ext.create('Ext.data.Store', {
		fields	:[
			"dt_retrieved"
		,	"dt_gps"
		,	"latitude"
		,	"longitude"
		]
	,	autoLoad:false
	,	proxy	:{
			type	:"ajax"
		,	url	:"data_trail.py"
		,	reader	:{
				type	:"json"
			,	root	:"data"
			}
		}
	});

	var btn_clear_mark	= Ext.create("Ext.button.Button", {
		text		:"Clear Mark"
	,	baseCls		:"x-btn-pressed"
	,	handler		:function() {
			btn_clear_mark_onclick ();
		}
	});

	var btn_create_path	= Ext.create("Ext.button.Button", {
		text		:"Create Path"
	,	baseCls		:"x-btn-pressed"
	,	disabled	:true
	,	handler		:function() {
			btn_create_path_onclick ();
		}
	});

	var grid_selmodel	= Ext.create("Ext.selection.CheckboxModel", {
		listeners	: {
			selectionchange: function(sm, selections) {
				btn_create_path.setDisabled(selections.length == 0);
			}
		}
	});

	var grid_trail		= Ext.create("Ext.grid.Panel", {
		store		:store_trail
	,	region		:"center"
	,	selModel	:grid_selmodel
	,	autoScroll	:true
	,	columns			:[{
			header		:"GPS Date"
		,	dataIndex	:"dt_gps"
		,	align		:"center"
		,	flex		:1
		}]
	,	listeners	:{
			itemdblclick:function(view, record, el, idx, e, opt){
				grid_trail_itemdblclick (record, true);
			}
		}
	});

	var panel		= Ext.create("Ext.panel.Panel", {
		renderTo	:"trail"
	,	layout		:"border"
	,	height		:"100%"
	,	frame		:true
	,	tbar		:[
			form_idgps
		,	button_ref
		]
	,	items		:[
			fs_dt_filter
		,	grid_trail
		]
	,	bbar		:[
			btn_clear_mark
		,	"->"
		,	btn_create_path
		]
	});

	function get_current_date()
	{
		var now		= new Date();
		var y		= now.getFullYear();
		var m		= now.getMonth() + 1;
		var d		= now.getDate();
		var v		= "";

		v = y +"-";

		if (m < 10) {
			v += "0"+ m +"-";
		} else {
			v += m +"-";
		}

		if (d < 10) {
			v += "0"+ d;
		} else {
			v += d;
		}

		return v;
	}

	function store_trail_load ()
	{
		if (_g_id_gps == "") {
			return;
		}

		var date_after	= "";
		var time_after	= "";
		var date_before	= "";
		var time_before	= "";

		if (fs_dt_filter.collapsed) {
			date_after = get_current_date ();
		} else {
			date_before	= form_date_before.getRawValue();
			time_after	= form_time_after.getRawValue();
			time_before	= form_time_before.getRawValue();

			if (date_before == "") {
				date_after = get_current_date ();
			}
		}

		store_trail.load({
			params	:{
				id_gps		:_g_id_gps
			,	date_after	:date_after
			,	time_after	:time_after
			,	date_before	:date_before
			,	time_before	:time_before
			}
		});
	}

	function grid_trail_itemdblclick (r, zandc)
	{
		gps_id	= form_idgps.getValue();
		lat	= r.get("latitude")
		lng	= r.get("longitude")
		dt	= r.get("dt_gps")

		console.log(gps_id +':'+ lat +':'+ lng);

		if (!gmap_use || (lat == "0" && lng == "0")) {
			return;
		}

		gmap_ll = new google.maps.LatLng(lat, lng);

		title	= gps_id +"\n"
			+"Latitude\t\t: "+ lat +"\n"
			+"Longitude\t: "+ lng +"\n"
			+"Time\t\t: "+ dt

		circle = new google.maps.Circle({
			center		:gmap_ll
		,	radius		:2
		,	strokeColor	:"#00cc00"
		,	strokeOpacity	:0.5
		,	strokeWeight	:2
		,	fillColor	:"#00cc00"
		,	fillOpacity	:0.35
		,	map		:gmap
		,	title		:title
		});

		marker	= new google.maps.Marker({
			position	:gmap_ll
		,	map		:gmap
		,	title		:title
		});

		gmap_circles.push(circle);
		gmap_markers.push(marker);

		if (zandc) {
			gmap.setZoom(16);
			gmap.setCenter(gmap_ll);
		}

		return gmap_ll;
	}

	function sort_records_by_dt_gps (a, b)
	{
		var aa = a.data["dt_gps"];
		var bb = b.data["dt_gps"];

		if (aa < bb) {
			return -1;
		}
		if (aa > bb) {
			return 1;
		}
		return 0;
	}

	function btn_create_path_onclick ()
	{
		var recs = grid_selmodel.getSelection();
		if (!recs) {
			return;
		}
		if (recs.length == 1) {
			return grid_trail_itemdblclick (recs[0], true);
		}

		recs.sort(sort_records_by_dt_gps);

		var path = [];
		var ll;

		for (i = 0; i < recs.length; i++) {
			ll = grid_trail_itemdblclick (recs[i], false);

			path.push(ll);
		}

		var polyline = new google.maps.Polyline ({
			path		:path
		,	strokeColor	:"#FF0000"
		,	strokeOpacity	:1.0
		,	strokeWeight	:2
		});

		polyline.setMap(gmap);

		gmap.setZoom(16);
		gmap.setCenter(ll);

		gmap_polylines.push(polyline);
	}

	function btn_clear_mark_onclick ()
	{
		if (gmap_polylines) {
			for (i in gmap_polylines) {
				gmap_polylines[i].setMap(null);
			}
			gmap_polylines.length = 0;
		}

		if (gmap_markers) {
			for (i in gmap_markers) {
				gmap_markers[i].setMap(null);
			}
			gmap_markers.length = 0;
		}

		if (gmap_circles) {
			for (i in gmap_circles) {
				gmap_circles[i].setMap(null);
			}
			gmap_circles.length = 0;
		}
	}

	/* GMap init */
	function gmap_init()
	{
		gmap = new google.maps.Map(document.getElementById("map_canvas")
				, gmap_opts);

		gmap_support_flag = false;

		if (navigator.geolocation) {
			gmap_support_flag = true;
			navigator.geolocation.getCurrentPosition(
			function(position) {
				gmap_init_loc = new google.maps.LatLng (
						position.coords.latitude
						, position.coords.longitude
					);
				gmap.setCenter(gmap_init_loc);
			}, function() {
				gmap_init_loc_failed(gmap_support_flag);
			});
		// Try Google Gears Geolocation
		} else if (google.gears) {
			gmap_support_flag = true;
			var geo = google.gears.factory.create('beta.geolocation');
			geo.getCurrentPosition(
			function(position) {
				gmap_init_loc = new google.maps.LatLng(
						position.latitude
						, position.longitude
					);
				gmap.setCenter(gmap_init_loc);
			}, function() {
				gmap_init_loc_failed(gmap_support_flag);
			});
		// Browser doesn't support Geolocation
		} else {
			gmap_init_loc_failed(browserSupportFlag);
		}
	}

	function gmap_init_loc_failed(errorFlag)
	{
		if (errorFlag == false) {
			alert("Your browser doesn't support geolocation."
			+" We've placed you in Jakarta.");
			gmap_init_loc = gmap_loc_monas;
		}
		gmap.setCenter(gmap_init_loc);
	}

	store_idgps.load();

	if (gmap_use) {
		gmap_opts		= {
			zoom		:12
		 ,	mapTypeId	:google.maps.MapTypeId.ROADMAP
		};

		gmap_loc_monas = new google.maps.LatLng(-6.172982, 106.826935);

		gmap_init();
	}
});
