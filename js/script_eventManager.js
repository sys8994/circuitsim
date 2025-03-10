
// External event functions ======================================================================================================
// ===============================================================================================================================

function setCtrlStatus(event, prjManager,option) {
    if (option === 'press') {
        prjManager.uiStatus.isCtrl = true;
    } else {
        prjManager.uiStatus.isCtrl = false;
    }    
    if (prjManager.mode === 'create') hoverElement(prjManager,isRendering=true);
}

function canvasDrag(event,prjManager,opt) {
    if (opt=='down') {

        let [X1,Y1] = sub_roundXY(prjManager,deg=0)
        if (!X1) return;
    
        prjManager.uiStatus.dragClicked = true; // Activate drag mode
        prjManager.uiStatus.clickedPoint1 = [X1,Y1]; // Set start point
        prjManager.uiStatus.clickedPoint2 = [X1,Y1]; // Set start point

    } else if (opt==='drag') {
        let [X1,Y1] = prjManager.uiStatus.clickedPoint1 
        let [X2,Y2] = sub_roundXY(prjManager,deg=0,bound=false) // unbounded mouse drag
        prjManager.uiStatus.clickedPoint2 = [X2,Y2]
        
        Xmin = Math.min(X1,X2);
        Xmax = Math.max(X1,X2);
        Ymin = Math.min(Y1,Y2);
        Ymax = Math.max(Y1,Y2);

        // drag object range change
        sub_modifyLine(prjManager, 'drag', { x: [[Xmin,Xmax,Xmax,Xmin,Xmin]], y: [[Ymin,Ymin,Ymax,Ymax,Ymin]] });
        
    } else if (opt==='hover') {
        let nowPos = sub_XY2pos(sub_roundXY(prjManager,deg=2,bound=false)) + '';// unbounded mouse drag
        let elements = prjManager.data.elements;
        let targetElement = null;
        for (let elementId in elements) {
            let posMap = elements[elementId].posMap;
            if (!(nowPos in posMap)) continue;
            targetElement = elements[elementId];
            if (targetElement.elementName != 'terminal') break;
        }

        // hovered element highlight
        sub_renderHoveredElement(prjManager,targetElement);

    } else {
        let [X1,Y1] = prjManager.uiStatus.clickedPoint1 
        let [X2,Y2] = prjManager.uiStatus.clickedPoint2
        prjManager.uiStatus.dragClicked = false; // Deactivate drag mode
        prjManager.uiStatus.clickedPoint1 = [];
        prjManager.uiStatus.clickedPoint2 = [];
    
        if (!X1 | !X2 | !Y1 | !Y2) return;    
        Xmin = Math.min(X1,X2);
        Xmax = Math.max(X1,X2);
        Ymin = Math.min(Y1,Y2);
        Ymax = Math.max(Y1,Y2);
    
        sub_modifyLine(prjManager, 'drag', { x: [[]], y: [[]] });
        
        // add dragged elements to selected elements list 
        let selectedIdList = [];
        let elements = prjManager.data.elements;
        for (let elementId in elements) {
            let posMap = elements[elementId].posMap;
            
            for (let pos in posMap) {
                let [X,Y] = sub_pos2XY(pos);

                if (X>=Math.floor(Xmin) && X<=Math.ceil(Xmax) && Y>=Math.floor(Ymin) && Y<=Math.ceil(Ymax)) {
                    selectedIdList.push(elementId);
                    break;
                }
            }
        }
        prjManager.uiStatus.selectedIdList = selectedIdList;

        // selected elements highlight
        sub_renderSelectedElements(prjManager,selectedIdList);
                
    }
}

hotkeyObj = {
    '1':'node',
    '2':'source',
    '3':'ground',
    '4':'resistor',
    '5':'capacitor',
    '6':'nmos',
    '7':'pmos',
    '8':'ots',
    '9':'mtj',
    '0':'nonlin',
    't':'text',
}
function selectElement(event,prjManager) {
    sub_modifyLine(prjManager,'lineSelect',[]);
    sub_modifyLine(prjManager,'markerSelect',[]);

    let elementName
    if (event.type=='keydown') {
        if (!(event.key in hotkeyObj)) return;
        elementName = hotkeyObj[event.key]
    } else if (event.type ==='mousedown') {
        elementName = event.target.id.replace('btn-','');    
    } // else if pastemode : clipboard에서 임시 객체들 가져와서 tempData에 옮기자자

    // uiData update by clicked circuit element    
    if (elementName == 'node') {
        
        // create node object 
        const nodePointerShape = prjManager.circuitData.shapeset.shape_nodepnt;
        prjManager.data.counter = prjManager.data.counter + 1;
        let elementId = 'eid'+prjManager.data.counter;
        let currentElement = structuredClone(NodeTemplate);
        currentElement.elementName = elementName;
        currentElement.elementId = elementId;
        currentElement.elementStatus = 'normal';
        
        prjManager.tempData.nodeInfo.shape = nodePointerShape;
        prjManager.tempData.nodeInfo.startingXY = [];
        prjManager.tempData.nodeInfo.endingXY = [];
        prjManager.tempData.currentMode = 'nodestart';

        prjManager.tempData.elements = {};
        prjManager.tempData.elements[elementId] = currentElement;

    } else { // normal element
 
        // create element object 
        const elementDefault = prjManager.circuitData.element[elementName]
        prjManager.data.counter = prjManager.data.counter + 1;
        let elementId = 'eid'+prjManager.data.counter;
        let currentElement = structuredClone(ElementTemplate);
        currentElement.elementName = elementName;
        currentElement.elementId = elementId;
        currentElement.elementStatus = 'nopara';
        currentElement.offsetPosition = sub_XY2pos([0,0]);
        currentElement.polarity = elementDefault.polarity;
        currentElement.rotation = elementDefault.rotation;
        currentElement.relative.shape = elementDefault.shape;
        currentElement.relative.shapeN = elementDefault.shapeN;
        currentElement.relative.terminal = elementDefault.terminal;
        
        prjManager.tempData.elements = {};
        prjManager.tempData.elements[elementId] = currentElement;
        prjManager.tempData.currentMode = 'element';

        for (let i = 0; i < elementDefault.terminal.length; i++) {
            let terminalIndex = elementDefault.terminal[i]
            prjManager.data.counter = prjManager.data.counter + 1;
            let terminalElementId = 'eid'+prjManager.data.counter;
            let currentTerminal = structuredClone(TerminalTemplate);
            currentTerminal.elementId = terminalElementId;
            currentTerminal.masterId = elementId;            
            currentElement.slaveIds.push(terminalElementId);

            let [X,Y] = [0,0];
            if (terminalIndex === 0) X=X+2;
            else if (terminalIndex === 1) Y=Y+2;
            else if (terminalIndex === 2) X=X-2;
            else if (terminalIndex === 3) Y=Y-2;
            currentTerminal.offsetPosition = sub_XY2pos([X,Y]);
            prjManager.tempData.elements[terminalElementId] = currentTerminal;
        }
        
    }
    
    // html control : remove / set "btn-clicked" class 
    document.querySelectorAll('.div-element.btn-clicked').forEach((el) => { el.classList.remove('btn-clicked'); });    
    document.getElementById('btn-'+elementName).classList.add('btn-clicked');

    // set mode to "create mode"
    prjManager.setMode('create')

    console.log('select mode:', prjManager.tempData.elements)

    // hover rendering
    hoverElement(prjManager,isRendering=true)
}

function hoverElement(prjManager,isRendering=false) {

    // activate when XY grid changes 
    const hoverPoint = prjManager.uiStatus.hoverPoint
    let XY = sub_roundXY(prjManager,deg=2);
    let continuousXY = sub_roundXY(prjManager,deg=0);
    if (!isRendering && hoverPoint.length != 0 && hoverPoint[0] == XY[0] && hoverPoint[1] == XY[1]) return;
    prjManager.uiStatus.hoverPoint = XY

    let hoverShape = [];
    let currentMode = prjManager.tempData.currentMode;

    if (currentMode==='nodestart') { // node mode

        const nodePointerShape = prjManager.tempData.nodeInfo.shape;
        const tempElements = prjManager.tempData.elements;
        
        // node pointer shift by XY
        for (let key in tempElements) {
            element = tempElements[key];
            Node.shiftStart(element,XY);
        }
        hoverShape = sub_shiftShape(nodePointerShape, XY);

    } else if (currentMode==='nodeend') {
        
        const nodePointerShape = prjManager.tempData.nodeInfo.shape;
        const startingXY = prjManager.tempData.nodeInfo.startingXY;
        const tempElements = prjManager.tempData.elements;
        let endingXY;
        
        // node shift by XY
        for (let key in tempElements) {
            element = tempElements[key];
            Node.shiftEnd(element,startingXY,XY,continuousXY);
            endingXY = element.segments[0][1];
            hoverShape = sub_concatXYs(hoverShape, element.renderedLineXY);
        }
        
        let hoverShapeCircle = sub_shiftShape(nodePointerShape, endingXY); 
        hoverShape = sub_concatXYs(hoverShape,hoverShapeCircle);

    } else { // normal element
        
        const tempElements = prjManager.tempData.elements;    

        // element shift by XY        
        for (let key in tempElements) {
            element = tempElements[key];
            if (element.elementName === 'terminal') {
                Terminal.shift(element,XY);
                hoverShape = sub_concatXYs(hoverShape, element.renderedMarkerXY);
            } else if (element.elementName === 'node') {
                Node.shift(element,XY);
                hoverShape = sub_concatXYs(hoverShape, element.renderedLineXY);
            } else {
                Element.shift(element,XY);
                hoverShape = sub_concatXYs(hoverShape, element.renderedLineXY);
            }
        }        
    }   

    // validity check
    let {overlappedIdList,isValid} = sub_checkOverlap(prjManager)            
    prjManager.tempData.isValid = isValid; 
    prjManager.tempData.overlappedIdList = overlappedIdList; 
    
    // main element rendering
    lineColor = isValid ? 'rgb(190,190,190)' : 'rgb(255, 112, 112)';
    sub_modifyLine(prjManager, 'lineCreateNormal', { x: [hoverShape[0]], y: [hoverShape[1]], 'line.color': lineColor});

    // relevant element rendering (highlight)
    sub_renderRelevantElements(prjManager,overlappedIdList);
    
}

function createElement(event,prjManager) {

    // validity filtering
    if (!prjManager.tempData.isValid) return

    // node
    if (prjManager.tempData.currentMode === 'nodestart') {
        prjManager.tempData.currentMode = 'nodeend';
        prjManager.tempData.nodeInfo.startingXY = sub_roundXY(prjManager,deg=2);
        hoverElement(prjManager,isRendering=true);
        return

    } else if (prjManager.tempData.currentMode === 'nodeend') {
        prjManager.tempData.currentMode = 'nodestart';
    }

    // register new element & map
    prjManager.data.elements = {...prjManager.data.elements, ...structuredClone(prjManager.tempData.elements)};
    let elements = prjManager.data.elements;
    let tempElements = prjManager.tempData.elements;
    
    // node merge
    let targetIdList = prjManager.tempData.overlappedIdList;
    for (let key in tempElements) {
        let elementName = prjManager.tempData.elements[key].elementName;
        if (elementName != 'node') continue;
        targetIdList.push(key);
    }
    let targetElements = {};
    for (let key of targetIdList) targetElements[key] = prjManager.data.elements[key];   

    let isCtrl = prjManager.uiStatus.isCtrl;
    let nodeGroups = sub_checkNodeGroups(targetElements,isCtrl)

    // generate representative node (mergedNode) and delete others
    let deleteIdList = [];
    for (let nodeGroup of nodeGroups) {
        if (nodeGroup.length === 1) continue;
        let representativeId = nodeGroup[0];
        let otherIdList = nodeGroup.slice(1);
        let mergedNode = elements[representativeId];
        mergedNode = sub_mergeNodes(elements,representativeId,otherIdList);
        elements[representativeId] = mergedNode;
        deleteIdList = [...deleteIdList, ...otherIdList];        
    };
    deleteIdList.forEach(key => delete elements[key]);

    // terminal merge to node
    for (let nodeKey in elements) {
        let node = elements[nodeKey];
        if (node.elementName != 'node') continue;
        node.terminalIds = [];

        for (let terminalKey in elements) {
            let terminal = elements[terminalKey];
            if (terminal.elementName != 'terminal') continue;

            let terminalPos = Object.keys(terminal.posMap)[0];
            if (!(terminalPos in node.posMap)) continue;
            node.terminalIds.push(terminal.elementId);
        }        
    }

    // temp data id update
    const nElements = Object.keys(tempElements).length;
    const newtempElements = {};
    prjManager.data.counter = prjManager.data.counter + nElements;
    const updateId = (id, nElm) => 'eid'+String(Number(id.split('eid')[1])+nElm);
    for (let key in tempElements) {
        let element = tempElements[key];
        if ('slaveIds' in element) element.slaveIds = element.slaveIds.map(val => updateId(val,nElements));
        if ('terminalIds' in element) element.terminalIds = element.terminalIds.map(val => updateId(val,nElements));
        if ('masterId' in element) element.masterId = updateId(element.masterId,nElements);
        let newKey = updateId(key,nElements);
        element.elementId = newKey;
        newtempElements[newKey] = element;
    } 
    prjManager.tempData.elements = newtempElements;

    // created element rendering
    sub_renderCreatedElements(prjManager,elements)

    // hover rendering
    hoverElement(prjManager,isRendering=true) 

    console.log(prjManager)

    // delta calc for undo/redo
    //
    //
}

function rotateElement(event,prjManager) {
    const tempElements = prjManager.tempData.elements;
    for (let key in tempElements) {
        let element = tempElements[key];
        if (element.elementName === 'terminal') Terminal.rotate(element);
        else if (element.elementName === 'node') Node.rotate(element);
        else Element.rotate(element);
    }
    hoverElement(prjManager,isRendering=true);
}

function flipElement(event,prjManager) {
    const tempElements = prjManager.tempData.elements;
    for (let key in tempElements) {
        let element = tempElements[key];   
        if (element.elementName === 'terminal') Terminal.flip(element);
        else if (element.elementName === 'node') Node.flip(element);
        else Element.flip(element);   
    }    
    hoverElement(prjManager,isRendering=true);
}

// XXX
function selectOption(event,prjManager) {

}

function deleteElement(event,prjManager) {

    if (prjManager.uiStatus.selectedIdList.length === 0) return;

    // filter Id List    
    let validSelectedIdList = sub_filterValidIdList(prjManager);
    if (validSelectedIdList.length === 0) return;

    // delete selected elements
    let elements = prjManager.data.elements;
    validSelectedIdList.forEach(key => delete elements[key]);

    // terminal delete to node
    for (let nodeKey in elements) {
        let node = elements[nodeKey];
        if (node.elementName != 'node') continue;
        node.terminalIds = [];

        for (let terminalKey in elements) {
            let terminal = elements[terminalKey];
            if (terminal.elementName != 'terminal') continue;

            let terminalPos = Object.keys(terminal.posMap)[0];
            if (!(terminalPos in node.posMap)) continue;
            node.terminalIds.push(terminal.elementId);
        }        
    }

    // created element rendering
    sub_renderCreatedElements(prjManager,elements)    

    sub_modifyLine(prjManager,'lineCreateNormal',[]);
    sub_modifyLine(prjManager,'lineRelevant',[]);
    sub_modifyLine(prjManager,'markerRelevant',[]);
    sub_modifyLine(prjManager,'lineSelect',[]);
    sub_modifyLine(prjManager,'markerSelect',[]);
    sub_modifyLine(prjManager,'lineHover',[]);
    sub_modifyLine(prjManager,'markerHover',[]);

    


}

function copyElement(event,prjManager) {

    if (prjManager.uiStatus.selectedIdList.length === 0) return;
    
    // filter Id List    
    let validSelectedIdList = sub_filterValidIdList(prjManager);
    if (validSelectedIdList.length === 0) return;

    // copy elements and update ids
    let copiedElements = {};
    let [Xmin,Xmax,Ymin,Ymax] = [Infinity,-Infinity,Infinity,-Infinity];
    let elementIdMap = {};
    for (let elementId of validSelectedIdList) {
        let element = prjManager.data.elements[elementId];
        prjManager.data.counter += 1;
        let newId = 'eid'+prjManager.data.counter;
        elementIdMap[elementId] = newId;

        copiedElements[newId] = structuredClone(element);
        copiedElements[newId].elementId = newId;

        // calc center position
        if (element.elementName === 'terminal') continue;
        let [X,Y] = sub_pos2XY(Object.keys(element.posMap));
        let currentXmax,currentXmin,currentYmax,currentYmin;
        if (Array.isArray(X)) {
            currentXmax = Math.max(...X);
            currentXmin = Math.min(...X);
            currentYmax = Math.max(...Y);
            currentYmin = Math.min(...Y);
        } else {
            currentXmax = X;
            currentXmin = X;
            currentYmax = Y;
            currentYmin = Y;
        }
        if (currentXmax > Xmax) Xmax = currentXmax;
        if (currentXmin < Xmin) Xmin = currentXmin;
        if (currentYmax > Ymax) Ymax = currentYmax;
        if (currentYmin < Ymin) Ymin = currentYmin;
    }

    let groupCenterXY = [Math.round((Xmax+Xmin-2)/4)*2,Math.round((Ymax+Ymin-2)/4)*2];
    prjManager.clipboard.copiedElements = copiedElements;
    prjManager.clipboard.centerPosition = sub_XY2pos(groupCenterXY);
   
    // update related ids and update center position
    const filterAndMap = (array, mapObj) => array.filter(a => a in mapObj).map(a => mapObj[a]);
    for (let elementId in copiedElements) {
        let element = copiedElements[elementId];
        if ('slaveIds' in element) element.slaveIds = filterAndMap(element.slaveIds,elementIdMap);
        if ('terminalIds' in element) element.terminalIds = filterAndMap(element.terminalIds,elementIdMap);
        if ('masterId' in element) element.masterId = elementIdMap[element.masterId];

        if (element.elementName === 'node') {
            element.offsetSegments = element.segments.map(val => [[val[0][0]-groupCenterXY[0],val[0][1]-groupCenterXY[0]], [val[1][0]-groupCenterXY[0],val[1][1]-groupCenterXY[0]]]);

        } else {
            let elementCenterXY = sub_pos2XY(element.centerPosition);
            let offsetXY0 = sub_pos2XY(element.offsetPosition);
            let offsetXY = [-groupCenterXY[0] + elementCenterXY[0] + offsetXY0[0], -groupCenterXY[1] + elementCenterXY[1] + offsetXY0[1]];
            element.offsetPosition = sub_XY2pos(offsetXY);
        }
    }
}

function pasteElement(event,prjManager) {
    sub_modifyLine(prjManager,'lineSelect',[]);
    sub_modifyLine(prjManager,'markerSelect',[]);

    let copiedElements = prjManager.clipboard.copiedElements;
    if (Object.keys(copiedElements).length === 0) return;

    prjManager.tempData.elements = {...structuredClone(copiedElements)};


    // html control : remove / set "btn-clicked" class 
    document.querySelectorAll('.div-element.btn-clicked').forEach((el) => { el.classList.remove('btn-clicked'); });    

    // set mode to "create mode"
    prjManager.setMode('create')

    // hover rendering
    hoverElement(prjManager,isRendering=true)

}

// XXX
function saveProject(event,prjManager) {

}

function resetMode(event,prjManager) {
    prjManager.mode = 'normal';
    prjManager.resetUiStatus();
    prjManager.resetTempData();
    sub_modifyLine(prjManager,'lineCreateNormal',[]);
    sub_modifyLine(prjManager,'lineRelevant',[]);
    sub_modifyLine(prjManager,'markerRelevant',[]);
    sub_modifyLine(prjManager,'lineSelect',[]);
    sub_modifyLine(prjManager,'markerSelect',[]);
    sub_modifyLine(prjManager,'lineHover',[]);
    sub_modifyLine(prjManager,'markerHover',[]);

    console.log(prjManager)
}

function canvasResize(_, prjManager) {

    const width_left = 80;
    const width_right = 200;
    const actualWidth = window.innerWidth / window.devicePixelRatio;
    const actualHeight = window.innerHeight;
    const count_right = 4 - document.querySelectorAll('.hidden').length;
    const height_top_offset = document.querySelector('.container-title').offsetHeight;

    prjManager.plotObject.canvas.style.width = `${actualWidth - width_left - width_right * count_right}px`;
    prjManager.plotObject.canvas.style.height = `${actualHeight - height_top_offset - 50}px`;

    prjManager.plotObject.Plotly.relayout('canvas', {
        width: prjManager.plotObject.canvas.offsetWidth - 2,
        height: prjManager.plotObject.canvas.offsetHeight - 2,
    });

    sub_rerangeCanvas(prjManager);
    return
}

function canvasWheel(event, prjManager) {
    const canvas = prjManager.plotObject.canvas;
    if (!canvas.contains(event.target)) return;

    const plot = canvas._fullLayout;
    const width = plot.width;
    const height = plot.height;

    const currentXRange = plot.xaxis.range; // [xmin, xmax]
    const currentYRange = plot.yaxis.range; // [ymin, ymax]

    const xRangeSize = currentXRange[1] - currentXRange[0];
    const yRangeSize = currentYRange[1] - currentYRange[0];
   
    let rect = canvas.getBoundingClientRect();
    let startX = event.clientX - rect.left;
    let startY = event.clientY - rect.top;

    const mouseX = (startX / width) * xRangeSize + currentXRange[0];
    const mouseY = (1 - startY / height) * yRangeSize + currentYRange[0];

    const zoomFactor = event.deltaY < 0 ? 0.9 : 1.1;
    const newPixelsPerUnit = prjManager.canvasProperty.pixelsPerUnit / zoomFactor;
    if (newPixelsPerUnit < prjManager.canvasProperty.minPixelsPerUnit) {
        prjManager.canvasProperty.pixelsPerUnit = prjManager.canvasProperty.minPixelsPerUnit
    } else if (newPixelsPerUnit > prjManager.canvasProperty.maxPixelsPerUnit) {
        prjManager.canvasProperty.pixelsPerUnit = prjManager.canvasProperty.maxPixelsPerUnit
    } else {
        prjManager.canvasProperty.pixelsPerUnit = newPixelsPerUnit;
    }

    const newXRange = [
        Math.max(mouseX - (mouseX - currentXRange[0]) * zoomFactor, prjManager.canvasProperty.canvasRangeLimit[2]),
        Math.min(mouseX + (currentXRange[1] - mouseX) * zoomFactor, prjManager.canvasProperty.canvasRangeLimit[3])
    ];
    const newYRange = [
        Math.max(mouseY - (mouseY - currentYRange[0]) * zoomFactor, prjManager.canvasProperty.canvasRangeLimit[2]),
        Math.min(mouseY + (currentYRange[1] - mouseY) * zoomFactor, prjManager.canvasProperty.canvasRangeLimit[3])
    ];
    
    prjManager.plotObject.Plotly.relayout('canvas', {
        'xaxis.range': newXRange,
        'yaxis.range': newYRange
    });
}

function canvasMove(event,prjManager) {

    if (!prjManager.plotObject.canvas.layout) return;

    const currentXRange = prjManager.plotObject.canvas.layout.xaxis.range;
    const currentYRange = prjManager.plotObject.canvas.layout.yaxis.range;

    let newXRange = [...currentXRange];
    let newYRange = [...currentYRange];

    let keystep = prjManager.canvasProperty.arrowKeyStep /  prjManager.canvasProperty.pixelsPerUnit;

    switch (event.key) {
        case 'ArrowLeft':
            newXRange = [
                Math.max(currentXRange[0] - keystep, prjManager.canvasProperty.canvasRangeLimit[2]),
                Math.max(currentXRange[1] - keystep, prjManager.canvasProperty.canvasRangeLimit[2]),
            ];
            break;
        case 'ArrowRight':
            newXRange = [
                Math.min(currentXRange[0] + keystep, prjManager.canvasProperty.canvasRangeLimit[3]),
                Math.min(currentXRange[1] + keystep, prjManager.canvasProperty.canvasRangeLimit[3]),
            ];
            break;
        case 'ArrowUp':
            newYRange = [
                Math.min(currentYRange[0] + keystep, prjManager.canvasProperty.canvasRangeLimit[3]),
                Math.min(currentYRange[1] + keystep, prjManager.canvasProperty.canvasRangeLimit[3]),
            ];
            break;
        case 'ArrowDown':
            newYRange = [
                Math.max(currentYRange[0] - keystep, prjManager.canvasProperty.canvasRangeLimit[2]),
                Math.max(currentYRange[1] - keystep, prjManager.canvasProperty.canvasRangeLimit[2]),
            ];
            break;
        default:
            return;
    }
    
    prjManager.plotObject.Plotly.relayout('canvas', {
        'xaxis.range': newXRange,
        'yaxis.range': newYRange
    });
}







function elem_toggleHidden(clickedid) {

    const clicked_element = document.getElementById(clickedid);
    const target_element = document.getElementById(clickedid.replace('btn','opt'));
    const is_hidden = target_element.classList.contains('hidden')
    
    if (is_hidden) {
        target_element.classList.remove('hidden');
        clicked_element.classList.add('btn-clicked');
    } else {
        target_element.classList.add('hidden');
        clicked_element.classList.remove('btn-clicked');
    }
    canvasResize([], prjManager)
}

