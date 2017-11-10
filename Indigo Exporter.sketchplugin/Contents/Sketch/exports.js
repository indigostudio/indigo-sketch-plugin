@import 'helpers.js'

// Scanners
function getFirstArtboard(context, options)						{
	if (options.artboards.length > 0) {
		return options.artboards[0];
	} else {
		var info = { artboards: [], symbols: [], assets: [], start: Date.now(), step: 0, i: 0, symbolsById: {}, pagesByLayer: {}, fileNames: [], fileNameById: {}, fileNameByBase64: {} };
		options.pages.forEach(function(p) { collectNestedArtboards(context, options, info, p, p);});
		return info.artboards.length > 0 ? info.artboards[0] : null;
	} 
}
function scanPage(context, options, info, p)					{
	info.fileNameById[p.objectID()] = checkFileName(info, p, options.targetFolder.stringByAppendingPathComponent(fileName(p.name(), 'Page')));
	if (options.exportArtboards) { 
		if (options.artboards.length > 0) {
			options.artboards.forEach(function(a) {
				info.pagesByLayer[a.objectID()] = p;
				info.artboards.push(a);
			});
		} else {
			collectNestedArtboards(context, options, info, p, p);
		} 
	}
	if (options.exportSymbols) {
		collectNestedSymbols(context, options, info, p, p);
	}
	if (options.exportAssets) {
		collectNestedAssets(context, options, info, p, p);
	}
}	
function collectNestedArtboards(context, options, info, g, p)	{
	g.layers().forEach(function(l) {
		if (isArtboard(l)) {
			info.pagesByLayer[l.objectID()] = p;
			info.artboards.push(l);
		} else if (isGroup(l)) {
			collectNestedArtboards(context, options, info, l, p);
		}
	});
}
function collectNestedSymbols(context, options, info, g, p)		{
	g.layers().forEach(function(l) {
		if (isSymbolMaster(l)) {
			info.pagesByLayer[l.objectID()] = p;
			info.symbolsById[l.objectID()]  = l;
			info.symbols.push(l);
		} else if (isGroup(l)) {
			collectNestedSymbols(context, options, info, l, p);
		}
	});
}
function collectNestedAssets(context, options, info, g, p)		{
	g.layers().forEach(function(l) {
		if ((isArtboard(l)	&& options.artboardsAsImages)						|| 
			(isGroup(l)		&& options.shadowedGroupsAsImages && hasShadow(l))	||
			(isSymbol(l)	&& options.symbolsAsImages)							||
			(isShape(l)		&& options.shapesAsImages)							||
			(isText(l)		&& options.textsAsImages)							||
			isImage(l)) {
			info.assets.push(l);
		} else if (isArtboard(l) || isGroup(l) || isSymbolMaster(l)) {
			collectNestedAssets(context, options, info, l, p);
		}
	});
}
// Exporters
function createProject(context, options, info)					{
	createFolder(options.targetFolder);
	if (options.exportProject) {
		var f = options.targetFolder.stringByAppendingPathComponent(fileName(context.document.displayName().stringByDeletingPathExtension(), 'Project')).stringByAppendingPathExtension('proj');
		var p = context.document.documentData().objectID().replace('-', '').substring(0, 12);
		var c = '<?Infragistics.Models format="xaml" version="4" appVersion="9.0.0.250"?>\n';
		c += '<Project xmlns="http://prototypes.infragistics.com/" Id="'+p+'" IndigoVersion="9">\n';
		c += '  <Project.Defaults>\n';
		c += '      <ProjectDefaults Viewport="320,568">\n';
		c += '          <ProjectDefaults.Device>\n';
		c += '              <DeviceInfo Id="none" Orientation="None" />\n';
		c += '          </ProjectDefaults.Device>\n';
		c += '      </ProjectDefaults>\n';
		c += '  </Project.Defaults>\n';
		c += '</Project>';
		if (!fileExists(f)) { createFile(f, c); }
	}
	if (options.exportAssets) {
		createFolder(options.targetFolder.stringByAppendingPathComponent('assets'));
	}
}
function exportAsset(context, options, info, skLayer)			{
	var t = MSExportFormat.formatWithScale_name_fileFormat(options.resolution, options.resolution.toFixed(0)+'x', 'png');   
	var r = MSExportRequest.exportRequestsFromExportableLayer_exportFormats_useIDForName(skLayer, [t], false);
	var f = options.targetFolder.stringByAppendingPathComponent('assets').stringByAppendingPathComponent(assetName(skLayer)).stringByAppendingPathExtension('png');
	context.document.saveExportRequest_toFile(r.firstObject(), f); 
	var d = NSData.alloc().initWithContentsOfFile(f).base64EncodedStringWithOptions(0);
	if (options.removeDuplicatedAssets) {
		if (info.fileNameByBase64[d]) {
			deleteFile(f);
			f = info.fileNameByBase64[d];
		} else {
			info.fileNameByBase64[d] = f;
		}
	}
	info.fileNameById[skLayer.objectID()] = f;
}
function exportScreenpart(context, options, info, skSymbol)		{
    var b = skSymbol.absoluteRect();
	var g = skSymbol.objectID();
    var r = '<?Infragistics.Models format="xaml" version="3" appVersion="7.0.0.550"?>\n';
    r += '<ScreenPart xmlns="http://prototypes.infragistics.com/" Id="'+puid(g,'sketchsymbol')+'">\n';
    r += '    <ScreenPart.Content>\n';
    r += '        <BorderedContent Id="'+puid(g,'content')+'" Width="'+w(b)+'" Height="'+h(b)+'">\n';
    r += '            <BorderedContent.Layers>\n';
    r += '                <Layer Id="'+puid(g,'layer')+'" Panel.Layout="Stretch" />\n';
    r += '                <AnnotationsLayer Id="'+puid(g,'annotations')+'" Panel.Layout="Stretch" />\n';
    r += '            </BorderedContent.Layers>\n';
    r += '            <BorderedContent.Viewbox>\n';
    r += '                <Viewbox Id="'+puid(g,'viewbox')+'" />\n';
    r += '            </BorderedContent.Viewbox>\n';
    r += '            <BorderedContent.GuidesInfo>\n';
    r += '                <GuidesInfo Id="'+puid(g,'guides')+'" />\n';
    r += '            </BorderedContent.GuidesInfo>\n';
    r += '        </BorderedContent>\n';
    r += '    </ScreenPart.Content>\n';
    r += '    <ScreenPart.Device>\n';
    r += '        <DeviceInfo Id="none" Orientation="None" />\n';
    r += '    </ScreenPart.Device>\n';
    r += '    <ScreenPart.Scenes>\n';
    r += '        <Scene Title="Start" Id="'+puid(g,'scene')+'">\n';
    r += '            <Scene.KeyFrames>\n'
    r += '                <KeyFrame Id="'+puid(g,'sketchkeyframe')+'">\n'
    r += '                    <KeyFrame.Operations>\n';
    r += '                        <Set Property="Content.Background" Value="'+getBackground(skSymbol)+'" Target="'+puid(g,'content')+'" />\n';
    r += '                        <Add Property="Panel.Children" Target="'+puid(g,'layer')+'">\n';
    r += '                            <Add.Item>\n';
    r += '                                <ContainerBox Id="'+puid(g,'containerbox')+'" Name="'+escapeHtml(skSymbol.name())+'" Background="#00FFFFFF" Thickness="0" IsVisible="'+(skSymbol.isVisible()?'True':'False')+'" Panel.Bounds="0,0,'+w(b)+'{5,2147483647},'+h(b)+'{5,2147483647}">\n';
    r += '                                    <ContainerBox.Content>\n';
    r += '                                        <Container ClipToContainer="True" Id="'+puid(g,'container')+'">\n';
    r += '                                            <Container.Children>\n';
    skSymbol.layers().forEach(function(skLayer) { r += exportLayer(context, options, info, skLayer, b, '                                                '); });
    r += '                                            </Container.Children>\n'
    r += '                                        </Container>\n'
    r += '                                    </ContainerBox.Content>\n'
    r += '                                </ContainerBox>\n'
    r += '                            </Add.Item>\n';
    r += '                        </Add>\n';
    r += '                    </KeyFrame.Operations>\n';
    r += '                </KeyFrame>\n';
    r += '            </Scene.KeyFrames>\n';
    r += '        </Scene>\n';
    r += '    </ScreenPart.Scenes>\n';
    r += '</ScreenPart>\n';
	var p = info.pagesByLayer[g];
	var f = checkFileName(info, skSymbol, info.fileNameById[p.objectID()].stringByAppendingPathComponent(fileName(skSymbol.name(), 'Symbol')), 'screenpart');
	if (fileExists(f)) {
		createXmlFile(info, skSymbol, f, merge(loadXml(f), parseXml(r), puid(g,'container')));
	} else {
		createFile(f, r);
	}
}
function exportScreen(context, options, info, skArtboard)		{
    var b = skArtboard.absoluteRect();
	var g = skArtboard.objectID();
	var d = w(b) === ''+options.device.size.w || w(b) === ''+options.device.size.h;
    var r = '<?Infragistics.Models format="xaml" version="29" appVersion="7.0.0.550"?>\n';
    r += '<Page xmlns="http://prototypes.infragistics.com/" Id="'+puid(g,'sketchartboard')+'">\n';
    r += '    <Page.Content>\n';
    r += '        <Content Id="'+puid(g,'content')+'" Width="'+w(b)+'" Height="'+((d&&options.statusbar)?(b.height()-options.device.size.bar).toFixed(0):h(b))+'">\n';
    r += '            <Content.Layers>\n';
    r += '                <Layer Id="'+puid(g,'layer')+'" Panel.Layout="Stretch" />\n';
    r += '                <AnnotationsLayer Id="'+puid(g,'annotations')+'" Panel.Layout="Stretch" />\n';
    r += '            </Content.Layers>\n';
    r += '            <Content.Viewbox>\n';
	if (d) {
		r += '                <Viewbox Id="'+puid(g,'viewbox')+'" Size="'+options.device.size.w+','+options.device.size.h+'" />\n';
	} else {
		r += '                <Viewbox Id="'+puid(g,'viewbox')+'" />\n';
	}
    r += '            </Content.Viewbox>\n';
    r += '            <Content.GuidesInfo>\n';
    r += '                <GuidesInfo Id="'+puid(g,'guides')+'" />\n';
    r += '            </Content.GuidesInfo>\n';
    r += '        </Content>\n';
    r += '    </Page.Content>\n';
    r += '    <Page.Device>\n';
    r += '        <DeviceInfo Id="'+(d?options.device.type:'none')+'" Orientation="'+((d?options.orientation:null)||'None')+'" />\n';
    r += '    </Page.Device>\n';
    r += '    <Page.Scenes>\n';
    r += '        <Scene Title="Start" Id="'+puid(g,'scene')+'">\n';
    r += '            <Scene.KeyFrames>\n'
    r += '                <KeyFrame Id="'+puid(g,'sketchkeyframe')+'">\n'
    r += '                    <KeyFrame.Operations>\n';
    r += '                        <Set Property="Content.Background" Value="'+(skArtboard.hasBackgroundColor()!=0?getBackground(skArtboard):'#FFFFFFFF')+'" Target="'+puid(g,'content')+'" />\n';
    r += '                        <Add Property="Panel.Children" Target="'+puid(g,'layer')+'">\n';
    r += '                            <Add.Item>\n';
    if (options.artboardAsImage) {
		r += exportImage(context, options, info, skArtboard, b, '                                ');
    } else {
		r += '                                <ContainerBox Id="'+puid(g,'containerbox')+'" Name="'+escapeHtml(skArtboard.name())+'" Background="#00FFFFFF" Thickness="0" IsVisible="'+(skArtboard.isVisible()?'True':'False')+'" Panel.Bounds="0,'+((d&&options.statusbar)?(-options.device.size.bar).toFixed(0):'0')+','+w(b)+'{5,2147483647},'+h(b)+'{5,2147483647}">\n';
		r += '                                    <ContainerBox.Content>\n';
		r += '                                        <Container ClipToContainer="True" Id="'+puid(g,'container')+'">\n';
		r += '                                            <Container.Children>\n';
		skArtboard.layers().forEach(function(skLayer) { r += exportLayer(context, options, info, skLayer, b, '                                                '); });
		r += '                                            </Container.Children>\n'
		r += '                                        </Container>\n'
		r += '                                    </ContainerBox.Content>\n'
		r += '                                </ContainerBox>\n'
    }
    r += '                            </Add.Item>\n';
    r += '                        </Add>\n';
    r += '                    </KeyFrame.Operations>\n';
    r += '                </KeyFrame>\n';
    r += '                <KeyFrame Id="'+puid(g,'indigokeyframe')+'" Duration="250">\n'
    r += '                    <KeyFrame.Operations>\n';
    r += '                    </KeyFrame.Operations>\n';
    r += '                </KeyFrame>\n';
    r += '            </Scene.KeyFrames>\n';
    r += '        </Scene>\n';
    r += '    </Page.Scenes>\n';
    r += '</Page>\n';
	var p = info.pagesByLayer[g];
	var f = checkFileName(info, skArtboard, info.fileNameById[p.objectID()].stringByAppendingPathComponent(fileName(skArtboard.name(), 'Artboard')), 'screen');
	if (fileExists(f)) {		
		createXmlFile(info, skArtboard, f, merge(loadXml(f), parseXml(r), puid(g,'container')));
	} else {
		createFile(f, r);
	}
}
function exportLayer(context, options, info, skLayer, p, s)		{
    if (isGroup(skLayer)) {
        return exportGroup(context, options, info, skLayer, p, s);
    } else if (isSymbol(skLayer)) {
        return exportSymbol(context, options, info, skLayer, p, s);
    } else if (isShape(skLayer)) {
        return exportShape(context, options, info, skLayer, p, s);
    } else if (isText(skLayer)) {
        return exportText(context, options, info, skLayer, p, s);
    } else if (isImage(skLayer)) {
        return exportImage(context, options, info, skLayer, p, s);
    } else {
        log('Unexpected layer type: '+ skLayer.className());
        return '';
    }
}
function exportGroup(context, options, info, skGroup, p, s)		{
	if (options.shadowedGroupsAsImages && hasShadow(skGroup)) { return exportImage(context, options, info, skGroup, p, s); }
    var b = skGroup.absoluteRect();
    var r = '';
    r += s+'<Group Id="'+skGroup.objectID()+'" Name="'+escapeHtml(skGroup.name())+'" IsVisible="'+(skGroup.isVisible()?'True':'False')+'" Panel.Bounds="'+rx(b,p)+','+ry(b,p)+',0*,0*">\n';
    r += s+'	<Group.Children>\n';
    skGroup.layers().forEach(function(skLayer) { r += exportLayer(context, options, info, skLayer, b, s+'        '); });
    r += s+'	</Group.Children>\n';
    r += s+'</Group>\n';
    return r;
}
function exportSymbol(context, options, info, skSymbol, p, s)	{
    if (options.symbolsAsImages) { return exportImage(context, options, info, skSymbol, p, s); }
	log('No implemented yet (export as screenpart instance)');
    return '';
}
function exportShape(context, options, info, skShape, p, s)		{
    if (options.shapesAsImages) { return exportImage(context, options, info, skShape, p, s); }
    log('No implemented yet (export as shape)');
    return '';
}
function exportText(context, options, info, skText, p, s)		{
    if (options.textsAsImages) { return exportImage(context, options, info, skText, p, s);  }
    log('No implemented yet (export as text)');
    return '';
}
function exportImage(context, options, info, skImage, p, s)		{
	var a = MSImmutableLayerAncestry.ancestryWithMSLayer(skImage);
	var l = MSSliceTrimming.trimmedRectForLayerAncestry(a);
	var x = Math.round(l.origin.x-p.x()).toFixed(0);
	var y = Math.round(l.origin.y-p.y()).toFixed(0);
	var w = Math.round(l.size.width).toFixed(0);
	var h = Math.round(l.size.height).toFixed(0);
	return s+'<Image Id="'+skImage.objectID()+'" Name="'+escapeHtml(skImage.name())+'" Panel.Bounds="'+x+','+y+','+w+','+h+'" IsVisible="'+(skImage.isVisible()?'True':'False')+'" SourcePath="'+info.fileNameById[skImage.objectID()].substringFromIndex(options.targetFolder.length())+'" />\n';
}
// Merger
function createXmlFile(info, l, f, m)							{
	while (!m.done) {
		var n = f.stringByDeletingPathExtension();
		var e = f.pathExtension();
		var i = 1;
		var g = n.stringByAppendingString(' ('+i+')').stringByAppendingPathExtension(e);
		if (fileExists(g)) {
			m = merge(loadXml(g), m.result, m.guid);
			if (m.done) { f = g; }
		} else {
			m.done = true;
			f = g;
		}
	}
	info.fileNames.push((''+f).toLowerCase());
	info.fileNameById[l.objectID()] = f; 
	m.result.XMLDataWithOptions(NSXMLNodePrettyPrint).writeToFile_atomically(f, true);
}
function merge(indigoXml, sketchXml, guid)						{
	var indigoNode = queryXml(indigoXml, './/Container[@Id="'+guid+'"]/Container.Children');
	var sketchNode = queryXml(sketchXml, './/Container[@Id="'+guid+'"]/Container.Children');
	if (indigoNode && indigoNode.count() > 0 && sketchNode && sketchNode.count() > 0) {
		if (sketchNode[0].childCount() > 0) {
			sketchNode[0].children().forEach(function(n) {
				mergeInteractions(n, indigoXml);
			});
		}
		var targetNode = indigoNode[0].parent();
		indigoNode[0].detach();
		sketchNode[0].detach();
		targetNode.addChild(sketchNode[0]);
		return { done: true,  result: indigoXml, guid: guid };
	} else {
		return { done: false, result: sketchXml, guid: guid };
	}		
}
function mergeInteractions(sketchNode, indigoXml) 				{
	var node = findXml(indigoXml, sketchNode.localName(), sketchNode.attributeForName('Id').stringValue());
	if (node && node.childCount() > 0) {
		node.children().forEach(function(n) {
			if (!n.localName().isEqualToString('Group.Children')) {
				n.detach();
				sketchNode.addChild(n);
			}
		});
	}
	if (sketchNode.localName().isEqualToString('Group') && sketchNode.childAtIndex(0).localName().isEqualToString('Group.Children') && sketchNode.childAtIndex(0).childCount() > 0) {
		sketchNode.childAtIndex(0).children().forEach(function(n) {
			mergeInteractions(n, indigoXml);
		});
	}
}