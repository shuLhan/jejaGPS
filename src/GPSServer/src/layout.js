var gmap_opts		= {
	zoom		:12
 ,	mapTypeId	:google.maps.MapTypeId.ROADMAP
};

var gmap_use		= false;
var gmap_init_loc;
var gmap_loc_monas	= new google.maps.LatLng(-6.172982, 106.826935);
var gmap_support_flag	= new Boolean();
var gmap;
var _g_id_gps		= "";

Ext.require([
	"Ext.Button"
,	"Ext.data.Store"
,	"Ext.form.ComboBox"
,	"Ext.grid.Panel"
]);

function JejaGPSFilter ()
{
}

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

	var fs_dt_filter	= Ext.create("Ext.form.FieldSet", {
		title		:"Filter GPS Date"
	,	margin		:'5 0 0 0'
	,	checkboxToggle	:true
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


	var grid_trail		= Ext.create("Ext.grid.Panel", {
		store		:store_trail
	,	autoScroll	:true
	,	height		:"100%"
	,	columns		:[{
			header		:"GPS Date"
		,	dataIndex	:"dt_gps"
		,	align		:"center"
		,	flex		:1
		,	filter		:{
				type	:'date'
			}
		}]
	,	listeners	:{
			itemdblclick:function(view, record, el, idx, event){
				grid_trail_itemdblclick (record);
			}
		}
	});

	var panel		= Ext.create("Ext.panel.Panel", {
		renderTo	:"trail"
	,	height		:"100%"
	,	width		:300
	,	frame		:true
	,	tbar		:[
			form_idgps
		,	button_ref
		]
	,	items		:[
			fs_dt_filter
		,	grid_trail
		]
	});

	function store_trail_load ()
	{
		if (_g_id_gps == "") {
			return;
		}

		var now		= new Date();
		var y		= now.getFullYear();
		var m		= now.getMonth() + 1;
		var d		= now.getDate();
		var date_after	= form_date_after.getRawValue();
		var time_after	= form_time_after.getRawValue();
		var date_before	= form_date_before.getRawValue();
		var time_before	= form_time_before.getRawValue();

		if (!date_after && !date_before) {
			date_after = y +"-";

			if (m < 10) {
				date_after += "0"+ m +"-";
			} else {
				date_after += m +"-";
			}

			if (d < 10) {
				date_after += "0"+ d;
			} else {
				date_after += d;
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

	function grid_trail_itemdblclick (r)
	{
		gps_id	= form_idgps.getValue();

		console.log(gps_id +':'+ r.get("latitude") +':'+ r.get("longitude"));

		if (!gmap_use) {
			return;
		}

		gmap_ll = new google.maps.LatLng(r.get("latitude")
						, r.get("longitude"));

		circle = new google.maps.Circle({
			center		:gmap_ll
		,	radius		:2
		,	strokeColor	:"#00cc00"
		,	strokeOpacity	:0.5
		,	strokeWeight	:2
		,	fillColor	:"#00cc00"
		,	fillOpacity	:0.35
		,	map		:gmap
		,	title		:gps_id +" at "+ r.get("dt_gps")
		});

		marker	= new google.maps.Marker({
			position	:gmap_ll
		,	map		:gmap
		,	title		:gps_id +" at "+ r.get("dt_gps")
		});

		gmap.setZoom(16);
		gmap.setCenter(gmap_ll);
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
		gmap_init();
	}
});
