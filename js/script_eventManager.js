
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
        sub_modifyLine(prjManager,'drag', { x: [[Xmin,Xmax,Xmax,Xmin,Xmin]], y: [[Ymin,Ymin,Ymax,Ymax,Ymin]] });
        
    } else if (opt==='hover') {
        let nowPos = sub_XY2pos(sub_roundXY(prjManager,deg=2,bound=false)) + '';// unbounded mouse drag
        let elements = prjManager.data.elements;
        let targetElement = null;
        for (let elementId in elements) {
            let posMap = elements[elementId].posMap;
            for (let pos in posMap) {                
                if (pos===nowPos) {
                    targetElement = elements[elementId];
                    break
                }
            }
        }
        
        if (!targetElement) {            
            sub_modifyLine(prjManager,'lineHover',[]);
            sub_modifyLine(prjManager,'markerHover',[]);
        } else {
            let lineHover = targetElement.shape;
            let markerHover = targetElement.marker;
            sub_modifyLine(prjManager,'lineHover',lineHover);
            sub_modifyLine(prjManager,'markerHover',markerHover);
        }

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
        // relevant element rendering (highlight)
        if (selectedIdList.length === 0) {
            sub_modifyLine(prjManager,'lineSelect',[]);
            sub_modifyLine(prjManager,'markerSelect',[]);
        } else {
            let lineSelect = [[],[]];
            let markerSelect = [[],[]];
            let elementsObj = prjManager.data.elements;
            for (const elementId of selectedIdList) {
                let element = elementsObj[elementId];
                lineSelect = sub_concatXYs(lineSelect,element.shape);
                markerSelect = sub_concatXYs(markerSelect,element.marker);
            };
            sub_modifyLine(prjManager,'lineSelect',lineSelect);
            sub_modifyLine(prjManager,'markerSelect',markerSelect);
        }                    
    }
}

hotkeyObj = {
    '1':'nodeline',
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

    prjManager.data.counter = prjManager.data.counter + 1;
    let elementName
    if (event.type=='keydown') {
        if (!elementName in hotkeyObj) return;
        elementName = hotkeyObj[event.key]
    } else if (event.type ==='mousedown') {
        elementName = event.target.id.replace('btn-','');    
    } // else if pastemode : clipboard에서 임시 객체들 가져와서 tempData에 옮기자자

    // uiData update by clicked circuit element    
    if (elementName == 'nodeline') {
        
        // create node object 
        const nodePointerShape = prjManager.circuitData.shapeset.shape_nodepnt;
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
        let elementId = 'eid'+prjManager.data.counter;
        let currentElement = structuredClone(ElementTemplate);
        currentElement.elementName = elementName;
        currentElement.elementId = elementId;
        currentElement.elementStatus = 'nopara';
        currentElement.polarity = elementDefault.polarity;
        currentElement.rotation = elementDefault.rotation;
        currentElement.relative.shape = elementDefault.shape;
        currentElement.relative.shapeN = elementDefault.shapeN;
        currentElement.relative.terminal = elementDefault.terminal;

        prjManager.tempData.elements = {};
        prjManager.tempData.elements[elementId] = currentElement;
        prjManager.tempData.currentMode = 'element';
        
    }
    
    // html control : remove / set "btn-clicked" class 
    document.querySelectorAll('.div-element.btn-clicked').forEach((el) => { el.classList.remove('btn-clicked'); });    
    document.getElementById('btn-'+elementName).classList.add('btn-clicked');

    // set mode to "create mode"
    prjManager.setMode('create')

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

    // const isNodeline = prjManager.createElement.name === 'nodeline'
    if (currentMode==='nodestart') { // nodeline mode

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
            Node.shift(element,startingXY,XY,continuousXY);
            endingXY = element.segments[0][1];
            hoverShape = sub_concatXYs(hoverShape, element.shape);
        }
        
        let hoverShapeCircle = sub_shiftShape(nodePointerShape, endingXY); 
        hoverShape = sub_concatXYs(hoverShape,hoverShapeCircle);

    } else { // normal element
        
        const tempElements = prjManager.tempData.elements;
        
        // element shift by XY        
        for (let key in tempElements) {
            element = tempElements[key];
            Element.shift(element,XY);
            hoverShape = sub_concatXYs(hoverShape, element.shape);
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
    if (overlappedIdList.length === 0) {
        sub_modifyLine(prjManager,'lineRelevant',[]);
        sub_modifyLine(prjManager,'markerRelevant',[]);
    } else {
        let lineRelevant = [[],[]];
        let markerRelevant = [[],[]];
        let elementsObj = prjManager.data.elements;
        for (const elementId of overlappedIdList) {
            let element = elementsObj[elementId];
            lineRelevant = sub_concatXYs(lineRelevant,element.shape);
            markerRelevant = sub_concatXYs(markerRelevant,element.marker);
        };
        sub_modifyLine(prjManager,'lineRelevant',lineRelevant);
        sub_modifyLine(prjManager,'markerRelevant',markerRelevant);
    }
}

function createElement(event,prjManager) {

    // validity filtering
    if (!prjManager.tempData.isValid) return

    // nodeline
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
    for (let key in prjManager.tempData.elements) {
        if (prjManager.tempData.elements[key].elementName != 'nodeline') continue;
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

    // temp data id update
    const newtempElements = {};
    for (let key in tempElements) {
        prjManager.data.counter = prjManager.data.counter + 1;
        let element = tempElements[key];
        let newKey = 'eid'+prjManager.data.counter;
        element.elementId = newKey;
        newtempElements[newKey] = element;
    } 
    prjManager.tempData.elements = newtempElements;

    // graph obj rendering ==> 나중에 이건 따로 함수로 뺴자-----------------------------------
    let lineNormal = [[],[]];
    let lineNoPara = [[],[]];
    let lineError = [[],[]];
    let markerNormal = [[],[]];
    let markerError = [[],[]];
    // let polaritylineNormal = [[],[]];
    // let polaritylineNoPara = [[],[]];
    // let polaritylineError = [[],[]];

    for (const elementId in elements) {
        let element = elements[elementId];
         // main element shape line, polarity line
        if (element.elementStatus == 'normal') {
            lineNormal = sub_concatXYs(lineNormal,element.shape);
        } else if (element.elementStatus == 'error') {
            lineError = sub_concatXYs(lineError,element.shape);
        } else if (element.elementStatus == 'nopara') {
            lineNoPara = sub_concatXYs(lineNoPara,element.shape);
        }
        if (element.elementName == 'nodeline') {
            markerNormal = sub_concatXYs(markerNormal,element.marker);
        }
    }

    sub_modifyLine(prjManager,'lineNormal',lineNormal)
    sub_modifyLine(prjManager,'lineNoPara',lineNoPara)
    sub_modifyLine(prjManager,'lineError',lineError)
    sub_modifyLine(prjManager,'markerNormal',markerNormal)
    sub_modifyLine(prjManager,'markerError',markerError)

    // ---------------------------------------------------------------------------------------------------------

    // hover rendering
    hoverElement(prjManager,isRendering=true) 

    // delta calc for undo/redo
    //
    //
}

function rotateElement(event,prjManager) {
    const tempElements = prjManager.tempData.elements;
    for (let key in tempElements) {
        let element = tempElements[key];      
        Element.rotate(element);
    }    
    hoverElement(prjManager,isRendering=true);
}

function flipElement(event,prjManager) {
    const tempElements = prjManager.tempData.elements;
    for (let key in tempElements) {
        let element = tempElements[key];      
        Element.flip(element);
    }    
    hoverElement(prjManager,isRendering=true);
}

// XXX
function selectOption(event,prjManager) {

}

// XXX
function deleteElement(event,prjManager) {

}

// XXX
function copyElement(event,prjManager) {

}

// XXX
function pasteElement(event,prjManager) {

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

