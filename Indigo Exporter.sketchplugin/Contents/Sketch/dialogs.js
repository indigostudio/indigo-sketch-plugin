@import 'helpers.js'

// Dialogs
function ExportDialog(context, rect)	{
	var w = 570, h = 420, m = 70;
	this.api				= context.api();
	this.targetTypes		= [
		{ label: 'Phone',	index: 0, orientations: ['Portrait','Landscape'],	devices: [
			{ label: 'Custom',			index: 0, type: 'GenericPhone',			size: { w:null, h:null, bar:null, editable:true  } },
			{ label: 'iPhone 7 plus',	index: 1, type: 'iPhone6',				size: { w: 414, h: 716, bar:  20, editable:false } },
			{ label: 'iPhone 7', 		index: 2, type: 'iPhone6',				size: { w: 375, h: 647, bar:  20, editable:false } },
			{ label: 'iPhone SE',		index: 3, type: 'iPhone5',				size: { w: 320, h: 548, bar:  20, editable:false } },
		]},
		{ label: 'Tablet',	index: 1, orientations: ['Landscape', 'Portrait'],	devices: [
			{ label: 'Custom',			index: 0, type: 'GenericTablet',		size: { w:null, h:null, bar:null, editable:true  } },
			{ label: 'iPad',			index: 1, type: 'iPad',					size: { w:1024, h: 748, bar:  20, editable:false } },
		]},
		{ label: 'Desktop',	index: 2, orientations: ['None'],					devices: [
			{ label: '',				index: 0, type: 'none',					size: { w:null, h:null, bar:null, editable:false } },
		]},
	];	
	this.run				= function() { runDialog(this.controls.dialog, { defaultButton: this.controls.btnRun.cell() }) };
	this.close				= function() { endDialog(this.controls.dialog, { cleanup: [this.controls.btnEsc, this.controls.btnRun] }); };
	this.onExport			= function() { log('override this function'); };
	this.resetOptions		= function() {
		this.previousOptions = null;
	}
	this.restoreOptions		= function() {
		var json = NSUserDefaults.standardUserDefaults().objectForKey(context.document.documentData().objectID());
		this.previousOptions = json ? JSON.parse(json) : null;
	}
	this.saveOptions 		= function(options) {
		NSUserDefaults.standardUserDefaults().setObject_forKey(JSON.stringify(options), context.document.documentData().objectID());
	}
	this.controlsSetup		= function() {
		this.restoreOptions();
		this.controls.chkSym.setEnabled(false);
		this.controls.chkShp.setEnabled(false);
		this.controls.chkTxt.setEnabled(false);
		this.controls.grpTrg.setState_atRow_column(true, 0, this.previousOptions ? this.previousOptions.target.index : this.suggestTarget());
		this.controls.grpRes.setState_atRow_column(true, 0, this.previousOptions ? this.previousOptions.resolution-1 : 1);
		this.onGrpTrgChange();
	}
	this.suggestTarget		= function() {
		var i = 0;
		for (i = 0; i < this.targetTypes.length; i++) {
			var target   = this.targetTypes[i];
			var wMatches = rect					   ?target.devices.map(function(d,i) { return d.size.w==rect.width()?{device:d, index:i}:null; }).filter(function(x) { return x!=null; }):[];
			var hMatches = rect&&wMatches.length==0?target.devices.map(function(d,i) { return d.size.h==rect.width()?{device:d, index:i}:null; }).filter(function(x) { return x!=null; }):[];
			if (wMatches.length > 0 || hMatches.length > 0) { return i; }
		}
		return 0;
	}		
	this.onGrpTrgChange		= function() {
		if (arguments.length > 0) { this.resetOptions(); }
		var target			= this.targetTypes[this.controls.grpTrg.selectedColumn()];
		var devices			= target.devices.map(function(d) { return d.label; });
		var orientations	= target.orientations;
		var wMatches        = rect					  ?target.devices.map(function(d,i) { return d.size.w==rect.width()?{device:d, index:i}:null; }).filter(function(x) { return x!=null; }):[];
		var hMatches        = rect&&wMatches.length==0?target.devices.map(function(d,i) { return d.size.h==rect.width()?{device:d, index:i}:null; }).filter(function(x) { return x!=null; }):[];
		var devIndex		= this.previousOptions?this.previousOptions.device.index:wMatches.length>0?wMatches[0].index:hMatches.length>0?hMatches[0].index:0;
		var oriIndex		= this.previousOptions?orientations.indexOf(this.previousOptions.orientation):(rect&&(hMatches.length>0||(wMatches.length==0&&(rect&&devIndex==1?rect.width()<rect.height():rect.width()>rect.height()))))?1:0;
		this.controls.cmbDev.removeAllItems();
		this.controls.cmbDev.addItemsWithTitles(devices);
		this.controls.cmbDev.setEnabled(devices.length>1);
		this.controls.cmbOri.removeAllItems();
		this.controls.cmbOri.addItemsWithTitles(orientations);
		this.controls.cmbOri.setEnabled(orientations.length>1);
		this.controls.cmbDev.selectItemAtIndex(devIndex);	
		this.controls.cmbOri.selectItemAtIndex(oriIndex);
		this.onCmbDevChange();
	}
	this.onCmbDevChange		= function() { 
		if (arguments.length > 0) { this.resetOptions(); }
		var target			= this.targetTypes[this.controls.grpTrg.selectedColumn()];
		var device			= target.devices[this.controls.cmbDev.indexOfSelectedItem()];
		this.controls.txtVBW.setEnabled(device.size.editable); 
		this.controls.lblVBX.setTextColor(device.size.editable?rgba(0,0,0,1):rgba(186,186,186,1));
		this.controls.txtVBH.setEnabled(device.size.editable); 
		this.controls.chkBar.setEnabled(device.size.bar&&device.size.bar>0);
		this.controls.lblBar.setTextColor(device.size.bar&&device.size.bar>0?rgba(0,0,0,1):rgba(186,186,186,1));
		if (rect&&device.size.editable) {
			device.size.w = Math.min(rect.width(),rect.height());
			device.size.h = Math.max(rect.width(),rect.height());
		}
		var sizew			= this.previousOptions ? this.previousOptions.device.size.w : device.size.w;
		var sizeh			= this.previousOptions ? this.previousOptions.device.size.h : device.size.h;
		this.controls.txtVBW.setStringValue(sizew ? sizew.toFixed(0) : '');
		this.controls.txtVBH.setStringValue(sizeh ? sizeh.toFixed(0) : '');
		this.controls.chkBar.setState(this.previousOptions        ? this.previousOptions.statusbar       : device.size.bar&&device.size.bar>0);
		this.onChkBarChange();
	}
	this.onCmbOriChange		= function() {
		if (arguments.length > 0) { this.resetOptions(); }
	}
	this.onChkBarChange		= function() {
		if (arguments.length > 0) { this.resetOptions(); }
		var target			= this.targetTypes[this.controls.grpTrg.selectedColumn()];
		var device			= target.devices[this.controls.cmbDev.indexOfSelectedItem()];
		var size			= this.previousOptions ? this.previousOptions.device.size.bar : device.size.bar;
		this.controls.txtBar.setEnabled(this.controls.chkBar.state()==NSOnState);
		this.controls.txtBar.setStringValue(size ? size.toFixed(0) : '');
	}
	this.onGrpResChange		= function() {
		if (arguments.length > 0) { this.resetOptions(); }
	}
	this.onBtnEscClick		= function() { this.close(); };
	this.onBtnRunClick		= function() {
		var target			= this.targetTypes[this.controls.grpTrg.selectedColumn()];
		var device			= target.devices[this.controls.cmbDev.indexOfSelectedItem()];
		var orientation		= target.orientations[this.controls.cmbOri.indexOfSelectedItem()];
		device.size.w		= toNumber(this.controls.txtVBW.stringValue());
		device.size.h		= toNumber(this.controls.txtVBH.stringValue());
		device.size.bar		= toNumber(this.controls.txtBar.stringValue());
		var options 		= { 
			exportProject:			this.controls.chkPrj.state()==NSOnState,
			exportArtboards:		this.controls.chkGsc.state()==NSOnState,
			exportSymbols:			this.controls.chkGsp.state()==NSOnState,
			exportAssets:			this.controls.chkGas.state()==NSOnState,
			removeDuplicatedAssets:	this.controls.chkDup.state()==NSOnState,
			artboardsAsImages:		this.controls.chkArt.state()==NSOnState,
			shadowedGroupsAsImages:	this.controls.chkGrp.state()==NSOnState,
			symbolsAsImages:		this.controls.chkSym.state()==NSOnState,
			shapesAsImages:			this.controls.chkShp.state()==NSOnState,
			textsAsImages:			this.controls.chkTxt.state()==NSOnState,
			target: 				target,
			device: 				device,
			orientation: 			orientation,
			statusbar: 				this.controls.chkBar.state()==NSOnState,
			resolution:				this.controls.grpRes.selectedColumn()+1,
		}
		this.saveOptions(options);
		this.onExport(options); 
	};
	this.controls 			= {};
	this.controls.dialog	= createDialog(0, 0, w, h, rgba(235, 235, 235, 0.7));
	this.controls.content	= this.controls.dialog.contentView();
	// Hidden controls
	this.controls.chkPrj	= addCheckbox(null, 0, 0, 0, 0, 'Generate project file',                         true);
	this.controls.chkGas	= addCheckbox(null, 0, 0, 0, 0, 'Generate assets for layers exported as images', true);
	this.controls.chkDup	= addCheckbox(null, 0, 0, 0, 0, 'Remove duplicated assets',                      true);
	this.controls.chkGsp	= addCheckbox(null, 0, 0, 0, 0, 'Generate screenparts for symbol masters',       false);
	this.controls.chkGsc	= addCheckbox(null, 0, 0, 0, 0, 'Generate screens for artboards',                true);
	this.controls.chkArt	= addCheckbox(null, 0, 0, 0, 0, 'Export artboards as images',                    false);
	this.controls.chkGrp	= addCheckbox(null, 0, 0, 0, 0, 'Export groups with shadow as images',           false);
	this.controls.chkSym	= addCheckbox(null, 0, 0, 0, 0, 'Export symbol instances as images',             true);
	this.controls.chkShp	= addCheckbox(null, 0, 0, 0, 0, 'Export shapes as images',                       true);
	this.controls.chkTxt	= addCheckbox(null, 0, 0, 0, 0, 'Export texts as images',                        true);
	// Header
	this.controls.header	= addRectangle(this.controls.content,  0,h-100,    w,100, rgba(255,255,255,1));
	this.controls.imgHdr	= addImage(this.controls.header,      20,   20,  210, 80, this.api.resourceNamed('logo.png'), 0.5);
	this.controls.lblHdr	= addLabel(this.controls.header,     160,  -10,w-140, 60, 'Export as Indigo Studio project',	rgba(0,0,0,1),			22, NSTextAlignmentLeft);
	// Target viewport
	var v = this.targetTypes.map(function(t) { return t.label; }), l = this.targetTypes.length;
	this.controls.lblTrg	= addLabel(this.controls.content,      m,  275,w-2*m, 30, 'Target viewport',					rgba(0,0,0,1),			15, NSTextAlignmentLeft);
	this.controls.grpTrg	= addRadioGroup(this.controls.content, m,  245,w-2*m, 30, v, 1, l,														this.onGrpTrgChange.bind(this));
	// Viewport settings
	this.controls.recTrg	= addRectangle(this.controls.content,  m,  155,w-2*m, 90, rgba(255,255,255,0.5));
	this.controls.lblDev	= addLabel(this.controls.recTrg,      10,   65,  200, 20, 'Device',								rgba(128,128,128,1),	14, NSTextAlignmentLeft);
	this.controls.lblOri	= addLabel(this.controls.recTrg,     140,   65,  200, 20, 'Orientation',						rgba(128,128,128,1),	14, NSTextAlignmentLeft);
	this.controls.lblVBW	= addLabel(this.controls.recTrg,     280,   65,  200, 20, 'Viewport size',						rgba(128,128,128,1),	14, NSTextAlignmentLeft);
	this.controls.cmbDev	= addCombobox(this.controls.recTrg,   10,   35,  120, 30, [],															this.onCmbDevChange.bind(this));
	this.controls.cmbOri	= addCombobox(this.controls.recTrg,  140,   35,  120, 30, [],															this.onCmbOriChange.bind(this));
	this.controls.txtVBW	= addTextbox(this.controls.recTrg,   280,   40,   40, 20, '',									rgba(0,0,0,1),			12, NSTextAlignmentRight);
	this.controls.lblVBX	= addLabel(this.controls.recTrg,     322,   40,   40, 20, 'x',									rgba(0,0,0,1),			12, NSTextAlignmentLeft);
	this.controls.txtVBH	= addTextbox(this.controls.recTrg,   335,   40,   40, 20, '',									rgba(0,0,0,1),			12, NSTextAlignmentRight);
	this.controls.chkBar	= addCheckbox(this.controls.recTrg,   10,    5,w-2*m, 30, 'Designs include a device status bar', false,					this.onChkBarChange.bind(this));
	this.controls.txtBar	= addTextbox(this.controls.recTrg,   235,   10,   30, 20, '',									rgba(0,0,0,1),			12, NSTextAlignmentRight);
	this.controls.lblBar	= addLabel(this.controls.recTrg,     265,   10,   40, 20, 'px',									rgba(0,0,0,1),			12, NSTextAlignmentLeft);
	// Size for export
	this.controls.lblDev	= addLabel(this.controls.content,      m,  105,w-2*m, 30, 'Size for export',					rgba(0,0,0,1),			15, NSTextAlignmentLeft);
	this.controls.grpRes	= addRadioGroup(this.controls.content, m,   75,w-2*m, 30, ['1x','2x'], 1, 2,											this.onGrpResChange.bind(this));
	// Buttons
	this.controls.recBtn	= addRectangle(this.controls.content,  0,    0,    w, 70, rgba(250,250,250,1));
	this.controls.btnEsc	= addButton(this.controls.recBtn,  w-270,   10,  130, 50, 'Cancel',														this.onBtnEscClick.bind(this));
	this.controls.btnRun	= addButton(this.controls.recBtn,  w-140,   10,  130, 50, 'Export project',												this.onBtnRunClick.bind(this));
	// Controls setup
	this.controlsSetup();
}
function ProgressDialog(context)		{
	var w = 500, h = 250, m = 50;
	this.api      			= context.api();
	this.run      			= function()     { var prc = new Delegate({ 'step:': this.onStep.bind(this) }); this.timer = NSTimer.scheduledTimerWithTimeInterval_target_selector_userInfo_repeats(0.001, prc.getInstance(), 'step:', null, true); runDialog(this.controls.dialog, { timer: this.timer }); };
	this.close    			= function()     { if (this.timer) { this.timer.invalidate(); } endDialog(this.controls.dialog, { cleanup: [this.controls.btnOk] }); this.onFinish(); };
	this.onStep   			= function()     { log('override this function'); };
	this.onFinish			= function()     { log('override this function'); };
	this.resetProgress		= function(l, m) { this.controls.lblHdr.setStringValue(l); this.controls.barPro.setDoubleValue(0); this.controls.barPro.setMaxValue(m); }
	this.setProgress		= function(l, v) { this.controls.lblPro.setStringValue(l); this.controls.barPro.setDoubleValue(v); }
	this.setSummary			= function(l) 	 { this.controls.lblHdr.setStringValue('Export finished.'); this.controls.lblPro.setStringValue(l); this.controls.btnOk.setTitle('Ok'); }
	this.onBtnOkClick		= function()     { this.close(); };
	this.controls 			= {};
	this.controls.dialog	= createDialog(0, 0, w, h, rgba(255, 255, 255, 0.7));
	this.controls.content	= this.controls.dialog.contentView();
	this.controls.imgHdr	= addImage(this.controls.content, (w-105)/2,h-100,  210, 80, this.api.resourceNamed('logo.png'), 0.5);
	this.controls.lblHdr	= addLabel(this.controls.content,         m,   80,w-2*m, 45, 'Exporting as Indigo Studio project', rgba(0,0,0,1), 		16, NSTextAlignmentCenter);
	this.controls.barPro	= addProgress(this.controls.content,      m,   70,w-2*m, 30, 100);
	this.controls.lblPro	= addLabel(this.controls.content,         m,   45,w-2*m, 30, '', NSColor.colorWithGray(0.4), 							10, NSTextAlignmentCenter);
	this.controls.btnOk		= addButton(this.controls.content,(w-100)/2,   10,  100, 30, 'Cancel', 													this.onBtnOkClick.bind(this));
}