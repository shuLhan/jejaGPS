var gmap_opts		= {
	zoom		:12
 ,	mapTypeId	:google.maps.MapTypeId.ROADMAP
};

var gmap_use		= true;
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

	/* grid trail: display all trail data */
	var store_trail	= Ext.create('Ext.data.Store', {
		fields	:[
			"dt_retrieved"
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
		renderTo	:"trail"
	,	store		:store_trail
	,	autoScroll	:true
	,	height		:"100%"
	,	width		:300
	,	columns		:[{
			header		:"Date Retrieved"
		,	dataIndex	:"dt_retrieved"
		,	align		:"center"
		,	flex		:1
		}]
	,	tbar		:[
			form_idgps
		,	button_ref
		]
	,	listeners	:{
			itemdblclick:function(view, record, el, idx, event){
				grid_trail_itemdblclick (record);
			}
		}
	});

	function store_trail_load ()
	{
		if (_g_id_gps == "") {
			return;
		}
		store_trail.load({
			params	:{
				id_gps:_g_id_gps
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
		,	title		:gps_id +" at "+ r.get("dt_retrieved")
		});

		marker	= new google.maps.Marker({
			position	:gmap_ll
		,	map		:gmap
		,	title		:gps_id +" at "+ r.get("dt_retrieved")
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
