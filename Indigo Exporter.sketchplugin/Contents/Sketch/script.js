function onRun(context) {
	// Auxiliar
    function uuid()                    { return NSString.stringWithUUID(); }
    function w(rect)                   { return rect.width().toFixed(0); }
    function h(rect)                   { return rect.height().toFixed(0); }
    function rx(rect, parentRect)      { return Math.round(rect.x()-parentRect.x()).toFixed(0); }
    function ry(rect, parentRect)      { return Math.round(rect.y()-parentRect.y()).toFixed(0); }
	function getBackground(skArtboard) { return skArtboard.hasBackgroundColor() ? color(skArtboard.backgroundColor()) : '#00FFFFFF'; }
	function color(nsColor)            { return '#'+((1<<24)+(nsColor.red()<<16)+(nsColor.green()<<8)+nsColor.blue()).toString(16).slice(9); }
	// Layer Type Checking
    function isArtboard(skLayer)       { return skLayer.isMemberOfClass(MSImmutableArtboardGroup) || skLayer.isMemberOfClass(MSArtboardGroup); }
    function isSymbolMaster(skLayer)   { return skLayer.isMemberOfClass(MSSymbolMaster); }
    function isGroup(skLayer)          { return skLayer.isMemberOfClass(MSLayerGroup); }
    function isShape(skLayer)          { return skLayer.isMemberOfClass(MSShapeGroup); }
    function isImage(skLayer)          { return skLayer.isMemberOfClass(MSBitmapLayer); }
    function isText(skLayer)           { return skLayer.isMemberOfClass(MSTextLayer); }
    function isSymbol(skLayer)         { return skLayer.isMemberOfClass(MSSymbolInstance); }
	// Layer Exporters
    function exportSymbols(context, skPage) {
		pageFOLDER = projFOLDER.stringByAppendingPathComponent(skPage.name().stringByReplacingOccurrencesOfString_withString('/','-'));
		createFolder(pageFOLDER);
        skPage.layers().forEach(function(skLayer) {
            if (isSymbolMaster(skLayer)) {
				try {
					exportLayer(context, skLayer, '');
				} catch(e) {
					logINFO.log.push(e.message);					
					logINFO.errors.push(e);
				}
            }
        });
    }
    function exportPage(context, skPage) {
		pageFOLDER = projFOLDER.stringByAppendingPathComponent(skPage.name().stringByReplacingOccurrencesOfString_withString('/','-'));
        skPage.layers().forEach(function(skLayer) {
            if (isArtboard(skLayer)) {
				try {
					exportLayer(context, skLayer, '');
				} catch(e) {
					logINFO.log.push(e.message);					
					logINFO.errors.push(e);
				}
            }
        });
    }
    function exportLayer(context, skLayer, p, s) {
        if (isArtboard(skLayer)) {
            return exportArtboard(context, skLayer, p, s);
        } else if (isSymbolMaster(skLayer)) {
            return exportSymbolMaster(context, skLayer, p, s);
        } else if (isGroup(skLayer)) {
            return exportGroup(context, skLayer, p, s);
        } else if (isShape(skLayer)) {
            return exportShape(context, skLayer, p, s);
        } else if (isImage(skLayer)) {
            return exportImage(context, skLayer, p, s);
        } else if (isText(skLayer)) {
            return exportText(context, skLayer, p, s);
        } else if (isSymbol(skLayer)) {
            return exportSymbol(context, skLayer, p, s);
        } else {
            return '';
        }
    }
    function exportArtboard(context, skArtboard, p, s) {
		var b = skArtboard.absoluteRect();
		var l = uuid(); // Layer id
		var c = uuid(); // Content id
        var r = '<?Infragistics.Models format="xaml" version="29" appVersion="7.0.0.550"?>\n';
        r += '<Page xmlns="http://prototypes.infragistics.com/" Id="'+uuid()+'">\n';
        r += '    <Page.Content>\n';
        r += '        <Content Id="'+c+'" Width="'+w(b)+'" Height="'+h(b)+'">\n';
        r += '            <Content.Layers>\n';
        r += '                <Layer Id="'+l+'" Panel.Layout="Stretch" />\n';
        r += '                <AnnotationsLayer Id="'+uuid()+'" Panel.Layout="Stretch" />\n';
        r += '            </Content.Layers>\n';
        r += '            <Content.Viewbox>\n';
        r += '                <Viewbox Id="'+uuid()+'" />\n';
        r += '            </Content.Viewbox>\n';
        r += '            <Content.GuidesInfo>\n';
        r += '                <GuidesInfo Id="'+uuid()+'" />\n';
        r += '            </Content.GuidesInfo>\n';
        r += '        </Content>\n';
        r += '    </Page.Content>\n';
        r += '    <Page.Device>\n';
        r += '        <DeviceInfo Id="none" Orientation="None" />\n';
        r += '    </Page.Device>\n';
        r += '    <Page.Scenes>\n';
        r += '        <Scene Title="Start" Id="'+uuid()+'">\n';
        r += '            <Scene.KeyFrames>\n'
        r += '                <KeyFrame Id="'+uuid()+'">\n'
        r += '                    <KeyFrame.Operations>\n';
		r += '                        <Set Property="Content.Background" Value="'+getBackground(skArtboard)+'" Target="'+c+'" />\n';
		r += '                        <Add Property="Panel.Children" Target="'+l+'">\n';
		r += '                            <Add.Item>\n';
        r += '                                <ContainerBox Id="'+skArtboard.objectID()+'" Name="'+skArtboard.name()+'" Background="#00FFFFFF" Thickness="0" IsVisible="'+(skArtboard.isVisible()?'True':'False')+'" Panel.Bounds="0,0,'+w(b)+'{5,2147483647},'+h(b)+'{5,2147483647}">\n';
        r += '                                    <ContainerBox.Content>\n';
        r += '                                        <Container ClipToContainer="True" Id="'+uuid()+'">\n';
        r += '                                            <Container.Children>\n';
        skArtboard.layers().forEach(function(skLayer) {
            r += exportLayer(context, skLayer, b, '                                                ');
        });
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
        r += '    </Page.Scenes>\n';
        r += '</Page>\n';
        createFile(pageFOLDER.stringByAppendingPathComponent(skArtboard.name().stringByReplacingOccurrencesOfString_withString('/','-').stringByAppendingPathExtension('screen')), r);
        return r;
    }
	function exportSymbolMaster(context, skSymbol, p, s) {
		var b = skSymbol.absoluteRect();
		var l = uuid(); // Layer id
		var c = uuid(); // BorderedContent id
        var r = '<?Infragistics.Models format="xaml" version="3" appVersion="7.0.0.550"?>\n';
        r += '<ScreenPart xmlns="http://prototypes.infragistics.com/" Id="'+uuid()+'">\n';
        r += '    <ScreenPart.Content>\n';
        r += '        <BorderedContent Id="'+c+'" Width="'+w(b)+'" Height="'+h(b)+'">\n';
        r += '            <BorderedContent.Layers>\n';
        r += '                <Layer Id="'+l+'" Panel.Layout="Stretch" />\n';
        r += '                <AnnotationsLayer Id="'+uuid()+'" Panel.Layout="Stretch" />\n';
        r += '            </BorderedContent.Layers>\n';
        r += '            <BorderedContent.Viewbox>\n';
        r += '                <Viewbox Id="'+uuid()+'" />\n';
        r += '            </BorderedContent.Viewbox>\n';
        r += '            <BorderedContent.GuidesInfo>\n';
        r += '                <GuidesInfo Id="'+uuid()+'" />\n';
        r += '            </BorderedContent.GuidesInfo>\n';
        r += '        </BorderedContent>\n';
        r += '    </ScreenPart.Content>\n';
        r += '    <ScreenPart.Device>\n';
        r += '        <DeviceInfo Id="none" Orientation="None" />\n';
        r += '    </ScreenPart.Device>\n';
        r += '    <ScreenPart.Scenes>\n';
        r += '        <Scene Title="Start" Id="'+uuid()+'">\n';
        r += '            <Scene.KeyFrames>\n'
        r += '                <KeyFrame Id="'+uuid()+'">\n'
        r += '                    <KeyFrame.Operations>\n';
		r += '                        <Set Property="Content.Background" Value="'+getBackground(skSymbol)+'" Target="'+c+'" />\n';
		r += '                        <Add Property="Panel.Children" Target="'+l+'">\n';
		r += '                            <Add.Item>\n';
        r += '                                <ContainerBox Id="'+skSymbol.objectID()+'" Name="'+skSymbol.name()+'" Background="#00FFFFFF" Thickness="0" IsVisible="'+(skSymbol.isVisible()?'True':'False')+'" Panel.Bounds="0,0,'+w(b)+'{5,2147483647},'+h(b)+'{5,2147483647}">\n';
        r += '                                    <ContainerBox.Content>\n';
        r += '                                        <Container ClipToContainer="True" Id="'+uuid()+'">\n';
        r += '                                            <Container.Children>\n';
        skSymbol.layers().forEach(function(skLayer) {
            r += exportLayer(context, skLayer, b, '                                                ');
        });
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
		symbolPATH = pageFOLDER.stringByAppendingPathComponent(skSymbol.name().stringByReplacingOccurrencesOfString_withString('/','-').stringByAppendingPathExtension('screenpart'));
		symbolMAP[skSymbol.objectID()] = symbolPATH.substringFromIndex(projFOLDER.length());
        createFile(symbolPATH, r);
        return r;
	}
    function exportGroup(context, skGroup, p, s) {
		var b = skGroup.absoluteRect();
        var r = '';
        r += s+'<Group Id="'+skGroup.objectID()+'" Name="'+skGroup.name()+'" IsVisible="'+(skGroup.isVisible()?'True':'False')+'" Panel.Bounds="'+rx(b,p)+','+ry(b,p)+',0*,0*">\n';
        r += s+'	<Group.Children>\n';
        skGroup.layers().forEach(function(skLayer) {
            r += exportLayer(context, skLayer, b, s+'        ');
        });
        r += s+'	</Group.Children>\n';
        r += s+'</Group>\n';
        return r;
    }
    function exportSymbol(context, skSymbol, p, s) {
		/*
		var b = skSymbol.absoluteRect();
		var t = skSymbol.symbolMaster().objectID();
        var r = '';
        r += s+'<ScreenPartInstance Id="'+skSymbol.objectID()+'" Name="'+skSymbol.name()+'" TemplateReference="'+symbolMAP[skSymbol.symbolMaster().objectID()]+'" Panel.Bounds="'+rx(b,p)+','+ry(b,p)+','+w(b)+'{5,2147483647},'+h(b)+'{5,2147483647}">\n';
        r += s+'	<ScreenPartInstance.Customizations>\n';
        r += s+'	</ScreenPartInstance.Customizations>\n';
        r += s+'</ScreenPartInstance>\n';
		return r; */
		return s+generateImageFile(context, p, skSymbol);
	}
    function exportShape(context, skShape, p, s)   { return s+generateImageFile(context, p, skShape); }
    function exportImage(context, skImage, p, s)   { return s+generateImageFile(context, p, skImage); }
    function exportText(context, skText, p, s)     { return s+generateImageFile(context, p, skText); }
	// Content generation
    function generateImageFile(context, p, skLayer) {
        var c = skLayer.duplicate();
        var o = c.exportOptions(); o.removeAllExportFormats();
        var s = o.addExportFormat(); s.setScale(1.0);
        var t = o.exportFormats();
        var l = MSExportRequest.exportRequestsFromExportableLayer_exportFormats_useIDForName(c, t, false).firstObject();
        context.document.saveExportRequest_toFile(l, projFOLDER+'/assets/'+skLayer.objectID()+'.png'); c.removeFromParent();
        var a = MSImmutableLayerAncestry.ancestryWithMSLayer(skLayer);
        var r = MSSliceTrimming.trimmedRectForLayerAncestry(a);
		var x = Math.round(r.origin.x-p.x()).toFixed(0);
		var y = Math.round(r.origin.y-p.y()).toFixed(0);
		var w = Math.round(r.size.width).toFixed(0);
		var h = Math.round(r.size.height).toFixed(0);
        return '<Image Id="'+skLayer.objectID()+'" Name="'+skLayer.name()+'" Panel.Bounds="'+x+','+y+',0*,0*" IsVisible="'+(skLayer.isVisible()?'True':'False')+'" SourcePath="assets/'+skLayer.objectID()+'.png" />\n';
    }
    function generateProjectFILE(projId) {
        var r = '<?Infragistics.Models format="xaml" version="4" appVersion="9.0.0.250"?>\n';
        r += '<Project xmlns="http://prototypes.infragistics.com/" Id="'+projId+'" IndigoVersion="9">\n';
        r += '  <Project.Defaults>\n';
        r += '      <ProjectDefaults Viewport="320,568">\n';
        r += '          <ProjectDefaults.Device>\n';
        r += '              <DeviceInfo Id="none" Orientation="None" />\n';
        r += '          </ProjectDefaults.Device>\n';
        r += '      </ProjectDefaults>\n';
        r += '  </Project.Defaults>\n';
        r += '</Project>';
        return r;
    }
    function createFolder(folderURL) {
		logINFO.log.push('Creating folder '+ folderURL);
        var nsFM = NSFileManager.defaultManager();
        var nsURL = NSURL.fileURLWithPath_isDirectory(folderURL, true);
        nsFM.createDirectoryAtURL_withIntermediateDirectories_attributes_error(nsURL, true, null, null);
    }
    function createFile(fileURL, content) {
		logINFO.log.push('Creating file '+ fileURL);
        var nsStr = NSString.stringWithString(content);
        var nsData = nsStr.dataUsingEncoding(NSUTF8StringEncoding);
        nsData.writeToFile(fileURL);
    }
	// MAIN
	var projPATH   = context.document.fileURL().path().stringByDeletingLastPathComponent();
	var projNAME   = context.document.displayName().stringByDeletingPathExtension();
	var projFOLDER = projPATH.stringByAppendingPathComponent(projNAME.stringByAppendingPathExtension('indigo'));
	var projFILE   = projFOLDER.stringByAppendingPathComponent(projNAME.stringByAppendingPathExtension('proj'));
	var pageFOLDER = NSString.stringWithString('');
	var symbolMAP  = {};
	var logFILE    = projFOLDER.stringByAppendingPathComponent('export.log');
	var logINFO    = { start: Date.now(), end: Date.now(), time: 0, log: [], errors: [] };
	try {
		createFolder(projFOLDER);
		createFile(projFILE, generateProjectFILE('ORXKCYQJREDU'));
		context.document.pages().forEach(function(skPage) {
			exportSymbols(context, skPage);
		});
		context.document.pages().forEach(function(skPage) {
			exportPage(context, skPage);
		});
	} catch(e) {
		logINFO.log.push(e.message);
		logINFO.errors.push(e);
	} finally {
		logINFO.end = Date.now();
		logINFO.time = (logINFO.end - logINFO.start) / 1000;
		createFile(logFILE, JSON.stringify(logINFO, null, 4));
	}
};