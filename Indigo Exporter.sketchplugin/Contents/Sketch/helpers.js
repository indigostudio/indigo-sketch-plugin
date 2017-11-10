// Miscelaneous
function alert(msg, title) 								{ NSApplication.sharedApplication().displayDialog_withTitle(msg, title || 'Alert'); }
function uuid() 										{ return NSString.stringWithUUID(); }
function puid(seed, seq)								{ return seed.stringByAppendingString('-').stringByAppendingString(seq); }
function toNumber(s)									{ return isNaN(parseInt(s))?null:parseInt(s); }
function rgba(r, g, b, a) 								{ return NSColor.colorWithRed_green_blue_alpha(r/255, g/255, b/255, a); }
function w(rect)										{ return rect ? rect.width().toFixed(0)							: ''; };
function h(rect)										{ return rect ? rect.height().toFixed(0)						: ''; };
function wm(rect, m)									{ return rect ? Math.max(m, rect.width()).toFixed(0)			: ''; };
function hm(rect, m)									{ return rect ? Math.max(m, rect.height()).toFixed(0)			: ''; };
function rx(rect, parentRect)							{ return rect ? Math.round(rect.x()-parentRect.x()).toFixed(0)	: ''; };
function ry(rect, parentRect)							{ return rect ? Math.round(rect.y()-parentRect.y()).toFixed(0)	: ''; };
function getBackground(skLayer)							{ return skLayer.hasBackgroundColor() != 0 ? color(skLayer.backgroundColor()) : '#00FFFFFF'; };
function color(nsColor)									{ return '#'+hex(nsColor.alpha())+hex(nsColor.red())+hex(nsColor.green())+hex(nsColor.blue()); };
function hex(value)										{ return pad0((0xFF&(255*value)).toString(16)); }
function pad0(val) 										{ return '00'.slice(0, 2 - val.length) + val; }
function fileName(f, t)									{
	var name = NSRegularExpression
		.regularExpressionWithPattern_options_error('[^-_a-zA-Z0-9]+', 0, null)
		.stringByReplacingMatchesInString_options_range_withTemplate(f, 0, NSMakeRange(0, f.length()), ' ')
		.stringByTrimmingCharactersInSet(NSCharacterSet.whitespaceAndNewlineCharacterSet());
	if (isReservedFileName(name))	{ name = NSString.stringWithString(t).stringByAppendingString(' ').stringByAppendingString(name); }
	if (name.length() > 100)		{ name = name.substringToIndex(100).stringByTrimmingCharactersInSet(NSCharacterSet.whitespaceAndNewlineCharacterSet()); }
	return name;
}
function checkFileName(info, l, n, e) 					{
	var i = 1, f = e ? n.stringByAppendingPathExtension(e) : n;
	while (info.fileNames.indexOf((''+f).toLowerCase()) >= 0) {
		var m = n.stringByAppendingString(' ('+(i++)+')');
		f = e ? m.stringByAppendingPathExtension(e) : m;
	}
	info.fileNames.push((''+f).toLowerCase());
	info.fileNameById[l.objectID()] = f; 
	return f;
}
function isReservedFileName(f)							{ return NSRegularExpression.regularExpressionWithPattern_options_error('^(con|prn|aux|clock$|nul|com0|com1|com2|com3|com4|com5|com6|com7|com8|com9|lpt0|lpt1|lpt2|lpt3|lpt4|lpt5|lpt6|lpt7|lpt8|lpt9|assets|autorecover|_archive|_codesnippets)$', 0, null).numberOfMatchesInString_options_range(f, 0, NSMakeRange(0, f.length())) > 0; }
function assetName(l)									{ return className(l).stringByAppendingString(' ').stringByAppendingString(l.objectID().lowercaseString()); }
function className(l)									{ return isArtboard(l) ? NSString.stringWithString('artboard') : isSymbolMaster(l) ? NSString.stringWithString('symbolmaster') : isSymbol(l) ? NSString.stringWithString('symbol') : isGroup(l) ? NSString.stringWithString('group') : isShape(l) ? NSString.stringWithString('shape') : isText(l) ? NSString.stringWithString('text') : isImage(l) ? NSString.stringWithString('image') : l.className(); }
function pickTargetFolder(defaultFolder)				{
	var dlg = NSSavePanel.savePanel();
	dlg.setAllowedFileTypes(NSArray.arrayWithObject('indigo'));
	dlg.setExtensionHidden(false);
	dlg.setNameFieldStringValue(defaultFolder);
	return dlg.runModal() != 0 ? dlg.URL().path() : null;	
}
function escapeHtml(string) 							{
	var matchHtmlRegExp = new RegExp('["\'&<>\u005d'); // Use unicode escape sequence for end brace to workaround cocoascript
	var str = '' + string;
	var match = matchHtmlRegExp.exec(str);
	if (!match) { return str; }
	var escape;
	var html = '';
	var index = 0;
	var lastIndex = 0;
	for (index = match.index; index < str.length; index++) {
		switch (str.charCodeAt(index)) {
			case 34: escape = '&quot;'; break; // "
			case 38: escape = '&amp;';  break; // &
			case 39: escape = '&#39;';  break; // '
			case 60: escape = '&lt;';   break; // <
			case 62: escape = '&gt;';   break; // >
			default: continue;
		}
		if (lastIndex !== index) { html += str.substring(lastIndex, index); }
		lastIndex = index + 1;
		html += escape;
	}
	return lastIndex !== index ? html + str.substring(lastIndex, index) : html;
}
// File System
function fileExists(fileURL)							{ return NSFileManager.defaultManager().fileExistsAtPath(fileURL); }
function deleteFile(fileURL)							{ NSFileManager.defaultManager().removeItemAtPath_error(fileURL, null); }
function createFolder(folderURL)						{ NSFileManager.defaultManager().createDirectoryAtURL_withIntermediateDirectories_attributes_error(NSURL.fileURLWithPath_isDirectory(folderURL, true), true, null, null); }
function createFile(fileURL, content)					{ createFolder(fileURL.stringByDeletingLastPathComponent()); NSString.stringWithString(content).dataUsingEncoding(NSUTF8StringEncoding).writeToFile(fileURL); }
// XML
function parseXml(strXml)								{
	try {
		return NSXMLDocument.alloc().initWithXMLString_options_error(strXml, NSXMLDocumentTidyXML, null);
	} catch(e) {
		alert(e.message, 'ERROR');
		return null;
	}
}
function loadXml(fileName)								{	
	try {
		return NSXMLDocument.alloc().initWithContentsOfURL_options_error(NSURL.fileURLWithPath(fileName), NSXMLDocumentTidyXML, null);
	} catch(e) {
		alert(e.message, 'ERROR');
		return null;
	}
}
function findXml(doc, tag, guid)						{
	var res = doc ? queryXml(doc,'.//'+tag+'[@Id="'+guid+'"]') : null;
	return res && res.count() > 0 ? res[0]: null;
}
function queryXml(doc, qry)								{
	return doc ? doc.nodesForXPath_error(qry, null) : [];
}
// Async
function Delegate(selectors)							{
	this.uniqueName  = 'DelegateClass' + uuid();
	this.classDesc   = MOClassDescription.allocateDescriptionForClassWithName_superclass_(this.uniqueName, NSObject);
	this.handlers    = {};
	this.getClass    = function()     { return NSClassFromString(this.uniqueName); };
	this.getInstance = function()     { return NSClassFromString(this.uniqueName).new(); };
	this.classDesc.registerClass();
	for (s in selectors) { 
		this.handlers[s] = selectors[s];
		var h = (function() { return this.handlers[s].apply(this.classDesc, arguments); }).bind(this);
		var args = [], regex = /:/g; while (match = regex.exec(s)) { args.push('arg'+args.length); }
		this.classDesc.addInstanceMethodWithSelector_function_(NSSelectorFromString(s), eval('(function('+args.join(',')+'){ return h.apply(this, arguments); })'));
	}
}
// UI
function createDialog(x, y, w, h, c)					{
	var dlg = NSWindow.alloc().init();
	var cnt = dlg.contentView();
	cnt.setWantsLayer(true);
	cnt.setBackgroundColor(c);
	dlg.setFrame_display(NSMakeRect(x, y, w, h), false);
	return dlg;
}
function runDialog(dlg, options)						{
	COScript.currentCOScript().setShouldKeepAround_(true);
	var app = NSApplication.sharedApplication();
	var win = app.mainWindow();
	if (options && options.defaultButton)	{ dlg.setDefaultButtonCell(options.defaultButton); }
	if (options && options.timer)			{ NSRunLoop.currentRunLoop().addTimer_forMode(options.timer, NSRunLoopCommonModes); }
	dlg.orderOut(null);
	win.beginSheet_completionHandler(dlg, null);
}
function endDialog(dlg, options)						{
	var app = NSApplication.sharedApplication();
	var win = app.mainWindow();
	if (options && options.cleanup)			{ options.cleanup.forEach(function(l) { l.setCOSJSTargetFunction(undefined); }); }
	dlg.orderOut(null);
	win.endSheet(dlg);
	COScript.currentCOScript().setShouldKeepAround_(false);	
}
function addRectangle(cnt, x, y, w, h, c, f)			{
	var rec = NSView.alloc().initWithFrame(NSMakeRect(x, y, w, h));
	rec.setWantsLayer(true);
	rec.setBackgroundColor(c);
	if (f)   { rec.setCOSJSTargetFunction(f); }
	if (cnt) { cnt.addSubview(rec); }
	return rec;
}
function addImage(cnt, x, y, w, h, r, s, f)				{
	var img = NSImageView.alloc().initWithFrame(NSMakeRect(x, y, w*s, h*s));
	img.setImage(NSImage.alloc().initByReferencingURL(r));
	if (f)   { img.setCOSJSTargetFunction(f); }
	if (cnt) { cnt.addSubview(img); }
	return img;
}
function addLabel(cnt, x, y, w, h, l, c, s, a, f, b)	{
	var lbl = NSTextField.alloc().initWithFrame(NSMakeRect(x, y, w, h));
	lbl.setEditable(false);
	lbl.setBordered(false);
	lbl.setDrawsBackground(false);
	lbl.setFont(f ? NSFontManager.sharedFontManager().fontWithFamily_traits_weight_size(f, NSBoldFontMask, b, s) : NSFont.systemFontOfSize(s));
	lbl.setTextColor(c);
	lbl.setAlignment(a);
	lbl.setStringValue(l)
	if (cnt) { cnt.addSubview(lbl); }
	return lbl;
}
function addTextbox(cnt, x, y, w, h, l, c, s, a, f, b)	{
	var txt = NSTextField.alloc().initWithFrame(NSMakeRect(x, y, w, h));
	txt.setEditable(true);
	txt.setBordered(false);
	txt.setDrawsBackground(true);
	txt.setFont(f ? NSFontManager.sharedFontManager().fontWithFamily_traits_weight_size(f, NSBoldFontMask, b, s) : NSFont.systemFontOfSize(s));
	txt.setTextColor(c);
	txt.setAlignment(a);
	txt.setStringValue(l);
	if (cnt) { cnt.addSubview(txt); }
	return txt;
}
function addCheckbox(cnt, x, y, w, h, t, s, f)			{
	var chk = NSButton.alloc().initWithFrame(NSMakeRect(x, y, w, h));
	chk.setButtonType(NSSwitchButton);
	chk.setBezelStyle(0);
	chk.setTitle(t);
	chk.setState(s);
	if (f)   { chk.setCOSJSTargetFunction(f); }
	if (cnt) { cnt.addSubview(chk); }
	return chk;
}
function addCombobox(cnt, x, y, w, h, l, f)				{
	var cmb = NSPopUpButton.alloc().initWithFrame(NSMakeRect(x, y, w, h));
	cmb.addItemsWithTitles(l);
	cmb.setFont(NSFont.systemFontOfSize(13));
	cmb.selectItemAtIndex(0);	
	if (f)   { cmb.setCOSJSTargetFunction(f); }
	if (cnt) { cnt.addSubview(cmb); }
	return cmb;
}
function addRadioGroup(cnt, x, y, w, h, l, r, c, f)		{
	var str = ''; l.forEach(function(m, i) { str = m.length >= str.length ? m + ' ' : str; });
	var tpl = NSButtonCell.alloc().init(); tpl.setTitle(str); tpl.setButtonType(NSRadioButton);
	var grp = NSMatrix.alloc().initWithFrame_mode_prototype_numberOfRows_numberOfColumns(NSMakeRect(x, y, w, h), NSRadioModeMatrix, tpl, r, c);
	l.forEach(function(m, i) { grp.cells().objectAtIndex(i).setTitle(m); });
	if (f)   { grp.setCOSJSTargetFunction(f); }
	if (cnt) { cnt.addSubview(grp); }
	return grp;
}
function addButton(cnt, x, y, w, h, l, f)				{
	var btn = NSButton.alloc().initWithFrame(NSMakeRect(x, y, w, h));
	btn.setAction('callAction:');
	btn.setTitle(l);
	btn.setBezelStyle(NSRoundedBezelStyle);
	if (f)   { btn.setCOSJSTargetFunction(f); }
	if (cnt) { cnt.addSubview(btn); }
	return btn;
}
function addProgress(cnt, x, y, w, h, l)				{
	var bar = NSProgressIndicator.alloc().initWithFrame(NSMakeRect(x, y, w, h));
	bar.setStyle(0);
	bar.setBezeled(true);
	bar.setMinValue(0);
	bar.setMaxValue(l);
	bar.setDoubleValue(0);
	bar.setIndeterminate(false);
	if (cnt) { cnt.addSubview(bar); }
	return bar;
}
// Sketch Layer Type checking
function isArtboard(skLayer)	 						{ return skLayer.isMemberOfClass(MSImmutableArtboardGroup) || skLayer.isMemberOfClass(MSArtboardGroup); };
function isSymbolMaster(skLayer) 						{ return skLayer.isMemberOfClass(MSSymbolMaster); };
function isSymbol(skLayer)		 						{ return skLayer.isMemberOfClass(MSSymbolInstance); };
function isGroup(skLayer)		 						{ return skLayer.isMemberOfClass(MSLayerGroup); };
function isShape(skLayer)		 						{ return skLayer.isMemberOfClass(MSShapeGroup); };
function isImage(skLayer)		 						{ return skLayer.isMemberOfClass(MSBitmapLayer); };
function isText(skLayer)		 						{ return skLayer.isMemberOfClass(MSTextLayer); };
function isSlice(skLayer)		 						{ return skLayer.isMemberOfClass(MSSliceLayer); };
function getSelectedArtboards(skPage)					{ var s = []; if (skPage) { skPage.selectedLayers().layers().forEach(function(a) { if (isArtboard(a)) { s.push(a); } }); } return s; }
function hasMask(skLayer)								{ var res = false; skLayer.layers().forEach(function(l) { if (l.hasClippingMask()) { res = true; } }); return res; }
function hasShadow(skLayer)								{ var res = false; (skLayer.style() || { shadows: [] }).shadows().forEach(function(s) { if (s.isEnabled()) { res = true; } }); return res; }
