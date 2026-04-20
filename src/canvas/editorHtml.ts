/**
 * fabric.js Canvas Editor HTML
 *
 * Embedded in WebView. Communicates with React Native via postMessage bridge.
 *
 * RN → WebView messages:
 *   LOAD_TEMPLATE  { template, profile, cdnBase }
 *   EXPORT         { format: 'png'|'jpeg', quality: 0-1 }
 *   QUICK_RENDER   { template, profile, cdnBase }  (auto-fill + instant export)
 *   ADD_TEXT        { text, font, size, color }
 *   ADD_IMAGE      { src }
 *   DELETE_SELECTED
 *   UNDO
 *   REDO
 *   SET_BG_COLOR   { color }
 *   DESELECT_ALL
 *
 * WebView → RN messages:
 *   READY
 *   TEMPLATE_LOADED  { layerCount }
 *   EXPORT_RESULT    { data: base64, width, height }
 *   QUICK_RENDER_RESULT { data: base64 }
 *   SELECTION        { hasSelection, type, editable }
 *   ERROR            { message }
 *   STATE_CHANGED    { canUndo, canRedo }
 */
export function getEditorHtml(cdnBase: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100vw;height:100vh;overflow:hidden;background:#0F0C0A;touch-action:none}
#wrap{width:100vw;height:100vh;display:flex;justify-content:center;align-items:center;overflow:hidden;padding:12px}
.canvas-container{box-shadow:0 14px 40px rgba(0,0,0,0.55);border-radius:6px;overflow:hidden}
canvas{display:block;background:#FFFFFF}
</style>
</head>
<body>
<div id="wrap"><canvas id="c"></canvas></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js"></script>
<script>
(function(){
  var canvas, CDN='', undoStack=[], redoStack=[], maxUndo=40, ignoreChange=false;

  function post(type, payload){
    window.ReactNativeWebView.postMessage(JSON.stringify(Object.assign({type:type}, payload||{})));
  }

  function saveState(){
    if(ignoreChange) return;
    var json = canvas.toJSON(['lockMovementX','lockMovementY','lockRotation','lockScalingX','lockScalingY','selectable','evented','editable','layerType','layerId']);
    undoStack.push(JSON.stringify(json));
    if(undoStack.length > maxUndo) undoStack.shift();
    redoStack = [];
    post('STATE_CHANGED', {canUndo: undoStack.length > 1, canRedo: false});
  }

  function undo(){
    if(undoStack.length <= 1) return;
    redoStack.push(undoStack.pop());
    ignoreChange = true;
    canvas.loadFromJSON(JSON.parse(undoStack[undoStack.length-1]), function(){
      canvas.renderAll();
      ignoreChange = false;
      post('STATE_CHANGED', {canUndo: undoStack.length > 1, canRedo: redoStack.length > 0});
    });
  }

  function redo(){
    if(redoStack.length === 0) return;
    var state = redoStack.pop();
    undoStack.push(state);
    ignoreChange = true;
    canvas.loadFromJSON(JSON.parse(state), function(){
      canvas.renderAll();
      ignoreChange = false;
      post('STATE_CHANGED', {canUndo: undoStack.length > 1, canRedo: redoStack.length > 0});
    });
  }

  function initCanvas(w, h){
    var maxW = window.innerWidth;
    var maxH = window.innerHeight;
    var scale = Math.min(maxW/w, maxH/h, 1);
    var displayW = Math.floor(w * scale);
    var displayH = Math.floor(h * scale);

    canvas = new fabric.Canvas('c', {
      width: w,
      height: h,
      backgroundColor: '#FFFFFF',
      selection: true,
      preserveObjectStacking: true,
      enableRetinaScaling: false
    });

    // Scale both lower and upper canvas elements to fit screen
    var wrapperEl = canvas.wrapperEl;
    wrapperEl.style.width = displayW + 'px';
    wrapperEl.style.height = displayH + 'px';
    var canvases = wrapperEl.querySelectorAll('canvas');
    for(var ci=0; ci<canvases.length; ci++){
      canvases[ci].style.width = displayW + 'px';
      canvases[ci].style.height = displayH + 'px';
    }

    canvas.on('object:modified', saveState);
    canvas.on('selection:created', notifySelection);
    canvas.on('selection:updated', notifySelection);
    canvas.on('selection:cleared', function(){ post('SELECTION', {hasSelection:false}); });
    canvas.on('text:changed', saveState);
  }

  function notifySelection(){
    var obj = canvas.getActiveObject();
    if(!obj) return post('SELECTION', {hasSelection:false});
    post('SELECTION', {
      hasSelection: true,
      type: obj.layerType || obj.type,
      editable: obj.editable !== false
    });
  }

  function resolveUrl(src){
    if(!src) return '';
    if(src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) return src;
    return CDN ? ('https://' + CDN + '/' + src) : src;
  }

  function loadImageAsync(url){
    return new Promise(function(resolve, reject){
      if(!url){ reject(new Error('empty url')); return; }
      fabric.Image.fromURL(url, function(img){
        if(!img || !img.width) reject(new Error('load failed: '+url));
        else resolve(img);
      }, {crossOrigin:'anonymous'});
    });
  }

  async function loadTemplate(tmpl, profile, editMode){
    try {
      var cw = tmpl.canvas.width || 1080;
      var ch = tmpl.canvas.height || 1080;
      if(!canvas) initCanvas(cw, ch);
      else { canvas.setWidth(cw); canvas.setHeight(ch); rescaleWrapper(cw, ch); }
      canvas.clear();
      canvas.backgroundColor = '#FFFFFF';

      post('DEBUG', {stage:'load-start', id: tmpl.id, layerCount: (tmpl.layers||[]).length, hasProfile: !!profile, photoUrl: profile && profile.photoUrl || null, cdn: CDN});

      var layers = (tmpl.layers || []).slice().sort(function(a,b){ return (a.z||0)-(b.z||0); });

      for(var i=0; i<layers.length; i++){
        var L = layers[i];
        try { await addLayerToCanvas(L, profile, editMode); }
        catch(e){
          post('DEBUG', {stage:'layer-fail', index:i, type:L.type, key:L.key, src:L.src, error:e.message});
        }
      }

      canvas.renderAll();
      undoStack = [];
      redoStack = [];
      saveState();
      post('TEMPLATE_LOADED', {layerCount: layers.length});
    } catch(e){
      post('ERROR', {message: 'Load failed: ' + e.message});
    }
  }

  function rescaleWrapper(w, h){
    var maxW = window.innerWidth;
    var maxH = window.innerHeight;
    var scale = Math.min(maxW/w, maxH/h, 1);
    var displayW = Math.floor(w * scale);
    var displayH = Math.floor(h * scale);
    if(!canvas || !canvas.wrapperEl) return;
    canvas.wrapperEl.style.width = displayW + 'px';
    canvas.wrapperEl.style.height = displayH + 'px';
    var canvases = canvas.wrapperEl.querySelectorAll('canvas');
    for(var ci=0; ci<canvases.length; ci++){
      canvases[ci].style.width = displayW + 'px';
      canvases[ci].style.height = displayH + 'px';
    }
  }

  window.addEventListener('resize', function(){
    if(canvas) rescaleWrapper(canvas.width, canvas.height);
  });

  async function addLayerToCanvas(L, profile, editMode){
    switch(L.type){
      case 'image':
        var imgUrl = resolveUrl(L.src);
        var fimg = await loadImageAsync(imgUrl);
        fimg.set({
          left: L.x || 0, top: L.y || 0,
          scaleX: (L.width||fimg.width) / fimg.width,
          scaleY: (L.height||fimg.height) / fimg.height,
          selectable: editMode && !L.locked,
          evented: editMode && !L.locked,
          lockMovementX: !!L.locked, lockMovementY: !!L.locked,
          lockRotation: !!L.locked, lockScalingX: !!L.locked, lockScalingY: !!L.locked,
          layerType: 'image', layerId: L.id || ('img_'+i)
        });
        canvas.add(fimg);
        break;

      case 'text':
        var txt = new fabric.IText(L.content || '', {
          left: L.x || 0, top: L.y || 0,
          fontFamily: L.font || 'Arial',
          fontSize: L.size || 32,
          fill: L.color || '#000000',
          originX: 'center', originY: 'center',
          selectable: editMode,
          evented: editMode,
          editable: editMode && (L.editable !== false),
          layerType: 'text'
        });
        canvas.add(txt);
        break;

      case 'placeholder':
        if(!profile) break;
        if(L.key === 'user_photo' || L.key === 'logo'){
          var pUrl = L.key === 'user_photo' ? (profile.photoUrl||'') : (profile.logoUrl||'');
          if(!pUrl) break;
          pUrl = resolveUrl(pUrl);
          var pimg = await loadImageAsync(pUrl);
          var sz = L.radius ? L.radius*2 : (L.width || 200);
          if(L.shape === 'circle'){
            pimg.set({
              left: (L.x||0) - sz/2, top: (L.y||0) - sz/2,
              scaleX: sz/pimg.width, scaleY: sz/pimg.height,
              selectable: editMode, evented: editMode,
              clipPath: new fabric.Circle({radius: sz/2, originX:'center', originY:'center'}),
              layerType: 'placeholder_image'
            });
          } else {
            pimg.set({
              left: L.x||0, top: L.y||0,
              scaleX: sz/pimg.width, scaleY: (L.height||sz)/pimg.height,
              selectable: editMode, evented: editMode,
              layerType: 'placeholder_image'
            });
          }
          canvas.add(pimg);
        } else {
          var val = '';
          if(L.key === 'user_name') val = profile.name || '';
          else if(L.key === 'phone') val = profile.phone || '';
          if(!val) break;
          var ptxt = new fabric.IText(val, {
            left: L.x||0, top: L.y||0,
            fontFamily: L.font || 'Arial',
            fontSize: L.size || 24,
            fill: L.color || '#FFFFFF',
            originX: 'center', originY: 'center',
            selectable: editMode, evented: editMode,
            editable: editMode,
            layerType: 'placeholder_text'
          });
          canvas.add(ptxt);
        }
        break;

      case 'sticker':
        var sUrl = resolveUrl(L.src);
        var simg = await loadImageAsync(sUrl);
        simg.set({
          left: L.x||0, top: L.y||0,
          scaleX: (L.width||simg.width)/simg.width,
          scaleY: (L.height||simg.height)/simg.height,
          selectable: editMode, evented: editMode,
          layerType: 'sticker'
        });
        canvas.add(simg);
        break;
    }
  }

  function exportCanvas(format, quality){
    if(!canvas) return post('ERROR', {message:'No canvas'});
    var fmt = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    var q = quality || 1;
    var data = canvas.toDataURL({format: fmt === 'image/jpeg' ? 'jpeg' : 'png', quality: q, multiplier: 1});
    post('EXPORT_RESULT', {data: data, width: canvas.width, height: canvas.height});
  }

  async function quickRender(tmpl, profile){
    CDN = tmpl._cdn || CDN;
    await loadTemplate(tmpl, profile, false);
    exportCanvas('png', 1);
    post('QUICK_RENDER_RESULT', {data: canvas.toDataURL({format:'png', quality:1, multiplier:1})});
  }

  function addText(opts){
    var t = new fabric.IText(opts.text || 'Tap to edit', {
      left: canvas.width/2, top: canvas.height/2,
      fontFamily: opts.font || 'Arial',
      fontSize: opts.size || 40,
      fill: opts.color || '#FFFFFF',
      originX:'center', originY:'center',
      editable: true, selectable: true,
      layerType: 'text'
    });
    canvas.add(t);
    canvas.setActiveObject(t);
    canvas.renderAll();
    saveState();
  }

  function addImage(src){
    fabric.Image.fromURL(resolveUrl(src), function(img){
      if(!img || !img.width) return post('ERROR',{message:'Failed to load image'});
      var maxDim = Math.min(canvas.width, canvas.height) * 0.5;
      var scale = Math.min(maxDim/img.width, maxDim/img.height);
      img.set({
        left: canvas.width/2, top: canvas.height/2,
        originX:'center', originY:'center',
        scaleX: scale, scaleY: scale,
        selectable: true, evented: true,
        layerType: 'image'
      });
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
      saveState();
    }, {crossOrigin:'anonymous'});
  }

  function deleteSelected(){
    var active = canvas.getActiveObject();
    if(!active) return;
    if(active.type === 'activeSelection'){
      active.forEachObject(function(o){ canvas.remove(o); });
      canvas.discardActiveObject();
    } else {
      canvas.remove(active);
    }
    canvas.renderAll();
    saveState();
  }

  // Message handler
  document.addEventListener('message', handleMsg);
  window.addEventListener('message', handleMsg);

  function handleMsg(e){
    try{
      var msg = JSON.parse(e.data);
      switch(msg.type){
        case 'LOAD_TEMPLATE':
          CDN = msg.cdnBase || '';
          loadTemplate(msg.template, msg.profile||null, true);
          break;
        case 'QUICK_RENDER':
          CDN = msg.cdnBase || '';
          quickRender(msg.template, msg.profile||null);
          break;
        case 'EXPORT':
          exportCanvas(msg.format||'png', msg.quality||1);
          break;
        case 'ADD_TEXT':
          addText(msg);
          break;
        case 'ADD_IMAGE':
          addImage(msg.src);
          break;
        case 'DELETE_SELECTED':
          deleteSelected();
          break;
        case 'UNDO':
          undo();
          break;
        case 'REDO':
          redo();
          break;
        case 'SET_BG_COLOR':
          canvas.backgroundColor = msg.color || '#FFFFFF';
          canvas.renderAll();
          saveState();
          break;
        case 'DESELECT_ALL':
          canvas.discardActiveObject();
          canvas.renderAll();
          break;
      }
    }catch(err){
      post('ERROR', {message: 'Parse error: '+err.message});
    }
  }

  post('READY');
})();
</script>
</body>
</html>`;
}
