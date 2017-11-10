@import 'exports.js'
@import 'dialogs.js'
@import 'helpers.js'

// Sketch commands
function onExportAll(context)								{
	exportToIndigo(context, { pages: context.document.pages(), artboards: [] });
}
function onExportCurrentPage(context)						{
	if (context.document.currentPage()) { 
		exportToIndigo(context, { pages: [context.document.currentPage()], artboards: [] });
	} else {
		alert('Select a page to export'); 
	}
}
function onExportSelectedArtboards(context)					{
	var s = getSelectedArtboards(context.document.currentPage());
	if (s.length > 0) { 
		exportToIndigo(context, { pages: [context.document.currentPage()], artboards: s });
	} else {
		alert('Select at least one artboard to export'); 
	}
}
function exportToIndigo(context, options) 					{
	var art		 = getFirstArtboard(context, options);
	var dlg      = new ExportDialog(context, art ? art.absoluteRect() : null);
	dlg.onExport = function(state) { dlg.close(); onExportHandler(context, options, state); }
	dlg.run();
}
// Dialogs Event Handlers
function onExportHandler(context, options, state)			{
	options.exportProject			= state.exportProject;
	options.exportArtboards			= state.exportArtboards;
	options.exportSymbols			= state.exportSymbols;
	options.exportAssets			= state.exportAssets;
	options.removeDuplicatedAssets	= state.removeDuplicatedAssets;
	options.artboardsAsImages		= state.artboardsAsImages;
	options.shadowedGroupsAsImages	= state.shadowedGroupsAsImages;
	options.symbolsAsImages			= state.symbolsAsImages;
	options.shapesAsImages			= state.shapesAsImages;
	options.textsAsImages			= state.textsAsImages;
	options.target					= state.target;
	options.device					= state.device;
	options.orientation				= state.orientation;
	options.statusbar				= state.statusbar;
	options.resolution				= state.resolution;
	var info						= { artboards: [], symbols: [], assets: [], start: Date.now(), step: 0, i: 0, symbolsById: {}, pagesByLayer: {}, fileNames: [], fileNameById: {}, fileNameByBase64: {} };
	var fld							= context.document.displayName().stringByDeletingPathExtension().stringByAppendingPathExtension('indigo');
	var trg							= pickTargetFolder(fld);
	if (trg) { 
		options.targetFolder		= trg;
		var dlg						= new ProgressDialog(context);
		dlg.onStep					= function(timer) { onStepHandler(context, options, info, dlg, timer); }
		dlg.run();
	}
}
function onStepHandler(context, options, info, dlg, timer)	{
	try {
		switch (info.step) {
			case 0: // Gather info to export
				if (info.i>=options.pages.length)	{ info.step++; info.i=0; return; }
				if (info.i==0)						{ dlg.resetProgress('Gathering data...', options.pages.length); createProject(context, options); }
				var l = options.pages[info.i++]; dlg.setProgress('Scaning page: '+fileName(l.name(), 'Page'), info.i);
				scanPage(context, options, info, l);
				break;
			case 1: // Export assets
				if (info.i>=info.assets.length)		{ info.step++; info.i=0; return; }
				if (info.i==0)						{ dlg.resetProgress('Exporting assets...', info.assets.length); }
				var l = info.assets[info.i++]; dlg.setProgress((100*info.i/info.assets.length).toFixed(0)+'% ('+info.i+' of '+info.assets.length+')', info.i);
				exportAsset(context, options, info, l);
				break;
			case 2: // Export Screenparts
				if (info.i>=info.symbols.length)	{ info.step++; info.i=0; return; }
				if (info.i==0)						{ dlg.resetProgress('Exporting Screensparts...', info.symbols.length); }
				var l = info.symbols[info.i++]; dlg.setProgress((100*info.i/info.symbols.length).toFixed(0)+'% ('+info.i+' of '+info.symbols.length+')', info.i);
				exportScreenpart(context, options, info, l);
				break;
			case 3: // Export screens
				if (info.i>=info.artboards.length)	{ info.step++; info.i=0; return; }
				if (info.i==0) 						{ dlg.resetProgress('Exporting Screens...', info.artboards.length); }
				var l = info.artboards[info.i++]; dlg.setProgress((100*info.i/info.artboards.length).toFixed(0)+'% ('+info.i+' of '+info.artboards.length+')', info.i);
				exportScreen(context, options, info, l);
				break;
			case 4: // End
				timer.invalidate(); 					
				dlg.setSummary(info.artboards.length+' screens exported.');
				dlg.onFinish = function() { NSWorkspace.sharedWorkspace().openFile(options.targetFolder); }
				break;
		}
	} catch (e) {			
		timer.invalidate();
		alert('Error '+e.message, e);
	}
}
